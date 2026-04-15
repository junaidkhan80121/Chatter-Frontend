import { useEffect, useRef, useCallback } from 'react'
import { getSocket } from '@/services/socket'
import { useChatStore } from '@/store/chatStore'
import { useCallStore } from '@/store/callStore'
import { useAuthStore } from '@/store/authStore'
import type { Message } from '@/store/chatStore'

export function useSocket() {
  const { addMessage, setTyping, updateUserStatus, incrementUnread } = useChatStore()
  const { setIncomingCall, setStatus, setRemoteStream, setLocalStream } = useCallStore()
  const { user, messageNotificationsEnabled, messagePreviewEnabled, callSoundsEnabled } = useAuthStore()
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const ringtoneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const initialized = useRef(false)

  const playTone = useCallback((frequency: number, durationMs: number, gainValue = 0.03) => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioCtx()
    }
    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.value = gainValue
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    setTimeout(() => oscillator.stop(), durationMs)
  }, [])

  const stopCallRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current)
      ringtoneIntervalRef.current = null
    }
  }, [])

  const startCallRingtone = useCallback(() => {
    stopCallRingtone()
    playTone(690, 180, 0.04)
    setTimeout(() => playTone(540, 180, 0.04), 220)
    ringtoneIntervalRef.current = setInterval(() => {
      playTone(690, 180, 0.04)
      setTimeout(() => playTone(540, 180, 0.04), 220)
    }, 1600)
  }, [playTone, stopCallRingtone])

  useEffect(() => {
    if (!user || initialized.current) return
    initialized.current = true

    const socket = getSocket()

    socket.on('message_new', (msg: Message) => {
      addMessage(msg)
      const currentActiveConvId = useChatStore.getState().activeConvId
      if (msg.conversation_id !== currentActiveConvId) {
        incrementUnread(msg.conversation_id)
        if (messageNotificationsEnabled) {
          playTone(880, 120, 0.03)
          if ('Notification' in window) {
            if (Notification.permission === 'granted') {
              const body = messagePreviewEnabled
                ? (msg.content || 'New message')
                : 'You received a new message'
              new Notification(
                `New message from ${msg.sender?.display_name || msg.sender?.username || 'Someone'}`,
                { body }
              )
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().catch(() => {})
            }
          }
        }
      }
    })

    socket.on('message_sent', (msg: Message) => {
      addMessage(msg)
    })

    socket.on('user_typing', ({ user_id, conversation_id, typing }: { user_id: string; conversation_id: string; typing: boolean }) => {
      setTyping(conversation_id, user_id, typing)
    })

    socket.on('user_status_changed', ({ user_id, status }: { user_id: string; status: string }) => {
      updateUserStatus(user_id, status)
    })

    // WebRTC / Call events
    socket.on('call_incoming', (data: { caller_id: string; call_type: 'video' | 'audio'; conversation_id?: string }) => {
      setIncomingCall(data)
      setStatus('ringing')
      if (callSoundsEnabled) {
        startCallRingtone()
      }
    })

    socket.on('call_accepted', async ({ accepter_id }: { accepter_id: string }) => {
      stopCallRingtone()
      const callState = useCallStore.getState()
      const callType = callState.callType || 'video'
      let localStream = callState.localStream

      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true,
        })
        setLocalStream(localStream)
      }

      const pc = createPeerConnection(accepter_id)
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream!))
      setStatus('connected')
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      getSocket().emit('webrtc_offer', { target_user_id: accepter_id, offer })
    })

    socket.on('call_rejected', () => {
      stopCallRingtone()
      setStatus('ended')
      setTimeout(() => useCallStore.getState().resetCall(), 2000)
    })

    socket.on('call_ended', () => {
      stopCallRingtone()
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      setStatus('ended')
      setTimeout(() => useCallStore.getState().resetCall(), 2000)
    })

    socket.on('webrtc_offer', async ({ offer, from_user_id }: { offer: RTCSessionDescriptionInit; from_user_id: string }) => {
      const callState = useCallStore.getState()
      const callType = callState.callType || 'video'
      let localStream = callState.localStream

      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true,
        })
        setLocalStream(localStream)
      }

      const pc = peerConnectionRef.current || createPeerConnection(from_user_id)
      if (pc.getSenders().length === 0) {
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream!))
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      getSocket().emit('webrtc_answer', { target_user_id: from_user_id, answer })
      setStatus('connected')
    })

    socket.on('webrtc_answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current) return
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    })

    socket.on('webrtc_ice_candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!peerConnectionRef.current) return
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
    })

    return () => {
      socket.off('message_new')
      socket.off('message_sent')
      socket.off('user_typing')
      socket.off('user_status_changed')
      socket.off('call_incoming')
      socket.off('call_accepted')
      socket.off('call_rejected')
      socket.off('call_ended')
      socket.off('webrtc_offer')
      socket.off('webrtc_answer')
      socket.off('webrtc_ice_candidate')
      stopCallRingtone()
      initialized.current = false
    }
  }, [user?.id, callSoundsEnabled, incrementUnread, addMessage, messageNotificationsEnabled, messagePreviewEnabled, playTone, setIncomingCall, setLocalStream, setRemoteStream, setStatus, setTyping, startCallRingtone, stopCallRingtone, updateUserStatus])

  const createPeerConnection = useCallback((targetUserId: string) => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    }

    const pc = new RTCPeerConnection(config)
    peerConnectionRef.current = pc

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        getSocket().emit('webrtc_ice_candidate', {
          target_user_id: targetUserId,
          candidate: candidate.toJSON(),
        })
      }
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams
      setRemoteStream(stream)
    }

    return pc
  }, [setRemoteStream])

  return { createPeerConnection, peerConnectionRef }
}

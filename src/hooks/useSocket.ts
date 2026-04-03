import { useEffect, useRef, useCallback } from 'react'
import { getSocket } from '@/services/socket'
import { useChatStore } from '@/store/chatStore'
import { useCallStore } from '@/store/callStore'
import { useAuthStore } from '@/store/authStore'
import type { Message } from '@/store/chatStore'

export function useSocket() {
  const { addMessage, setTyping, updateUserStatus, incrementUnread, activeConvId } = useChatStore()
  const { setIncomingCall, setStatus, setRemoteStream } = useCallStore()
  const { user } = useAuthStore()
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!user || initialized.current) return
    initialized.current = true

    const socket = getSocket()

    socket.on('message_new', (msg: Message) => {
      addMessage(msg)
      if (msg.conversation_id !== activeConvId) {
        incrementUnread(msg.conversation_id)
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
    })

    socket.on('call_accepted', async ({ accepter_id }: { accepter_id: string }) => {
      setStatus('connected')
      // Start WebRTC offer
      if (peerConnectionRef.current) {
        const offer = await peerConnectionRef.current.createOffer()
        await peerConnectionRef.current.setLocalDescription(offer)
        getSocket().emit('webrtc_offer', { target_user_id: accepter_id, offer })
      }
    })

    socket.on('call_rejected', () => {
      setStatus('ended')
      setTimeout(() => useCallStore.getState().resetCall(), 2000)
    })

    socket.on('call_ended', () => {
      setStatus('ended')
      setTimeout(() => useCallStore.getState().resetCall(), 2000)
    })

    socket.on('webrtc_offer', async ({ offer, from_user_id }: { offer: RTCSessionDescriptionInit; from_user_id: string }) => {
      if (!peerConnectionRef.current) return
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      getSocket().emit('webrtc_answer', { target_user_id: from_user_id, answer })
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
      initialized.current = false
    }
  }, [user?.id])

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

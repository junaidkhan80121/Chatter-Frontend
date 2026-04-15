import React from 'react'
import { Phone, PhoneOff, Video } from 'lucide-react'
import { useCallStore } from '@/store/callStore'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import { acceptCall, rejectCall } from '@/services/socket'
import Avatar from '@/components/ui/Avatar'

export default function IncomingCallToast() {
  const { incomingCall, setStatus, setIncomingCall, setCallType, setPeerId, setPeerName, resetCall } = useCallStore()
  const { user } = useAuthStore()
  const { conversations } = useChatStore()

  if (!incomingCall) return null

  // Find caller info
  const callerConv = conversations.find((c) =>
    c.participants.some((p) => p.id === incomingCall.caller_id)
  )
  const caller = callerConv?.participants.find((p) => p.id === incomingCall.caller_id)
  const callerName = caller?.display_name || caller?.username || 'Unknown'

  const handleAccept = async () => {
    acceptCall(incomingCall.caller_id)

    // Get media stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.call_type === 'video',
        audio: true,
      })
      useCallStore.getState().setLocalStream(stream)
    } catch (err) {
      console.error('Media access error:', err)
    }

    setCallType(incomingCall.call_type)
    setPeerId(incomingCall.caller_id)
    setPeerName(callerName)
    setStatus('connected')
    setIncomingCall(null)
  }

  const handleReject = () => {
    rejectCall(incomingCall.caller_id)
    resetCall()
  }

  return (
    <div className="incoming-call-screen">
      <div className="incoming-call-card">
        <div className="incoming-call-header">Incoming {incomingCall.call_type} call</div>

        <div className="incoming-call-avatar-wrap">
          <div className="call-ring-anim">
            <Avatar src={caller?.avatar_url} name={callerName} size="xxl" />
          </div>
        </div>

        <div className="incoming-call-name">{callerName}</div>
        <div className="incoming-call-subtitle">
          {incomingCall.call_type === 'video' ? 'Wants to start a video call' : 'Wants to start an audio call'}
        </div>

        <div className="incoming-call-actions">
          <button
            className="incoming-call-action decline"
            onClick={handleReject}
          >
            <PhoneOff size={16} /> Decline
          </button>
          <button
            className="incoming-call-action answer"
            onClick={handleAccept}
          >
            {incomingCall.call_type === 'video' ? <Video size={16} /> : <Phone size={16} />}
            Answer
          </button>
        </div>
      </div>
    </div>
  )
}

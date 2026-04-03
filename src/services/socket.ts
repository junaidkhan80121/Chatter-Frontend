import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket || !socket.connected) {
    const token = localStorage.getItem('access_token')
    socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => console.log('[Socket] Connected:', socket?.id))
    socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason))
    socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message))
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinRoom(conversationId: string) {
  getSocket().emit('join_room', { conversation_id: conversationId })
}

export function leaveRoom(conversationId: string) {
  getSocket().emit('leave_room', { conversation_id: conversationId })
}

export function sendTypingStart(conversationId: string) {
  getSocket().emit('typing_start', { conversation_id: conversationId })
}

export function sendTypingStop(conversationId: string) {
  getSocket().emit('typing_stop', { conversation_id: conversationId })
}

export function markMessagesRead(conversationId: string, messageIds: string[]) {
  getSocket().emit('message_read', { conversation_id: conversationId, message_ids: messageIds })
}

// WebRTC signaling
export function initiateCall(targetUserId: string, callType: 'video' | 'audio', conversationId?: string) {
  getSocket().emit('call_initiate', { target_user_id: targetUserId, call_type: callType, conversation_id: conversationId })
}

export function acceptCall(callerId: string) {
  getSocket().emit('call_accept', { caller_id: callerId })
}

export function rejectCall(callerId: string) {
  getSocket().emit('call_reject', { caller_id: callerId })
}

export function endCall(peerId: string) {
  getSocket().emit('call_end', { peer_id: peerId })
}

export function sendWebRTCOffer(targetUserId: string, offer: RTCSessionDescriptionInit) {
  getSocket().emit('webrtc_offer', { target_user_id: targetUserId, offer })
}

export function sendWebRTCAnswer(targetUserId: string, answer: RTCSessionDescriptionInit) {
  getSocket().emit('webrtc_answer', { target_user_id: targetUserId, answer })
}

export function sendICECandidate(targetUserId: string, candidate: RTCIceCandidateInit) {
  getSocket().emit('webrtc_ice_candidate', { target_user_id: targetUserId, candidate })
}

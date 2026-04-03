import { create } from 'zustand'

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'

interface IncomingCall {
  caller_id: string
  call_type: 'video' | 'audio'
  conversation_id?: string
}

interface CallState {
  status: CallStatus
  callType: 'video' | 'audio' | null
  peerId: string | null
  peerName: string | null
  incomingCall: IncomingCall | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  isCameraOff: boolean
  isScreenSharing: boolean
  callDuration: number

  setStatus: (status: CallStatus) => void
  setCallType: (type: 'video' | 'audio') => void
  setPeerId: (id: string | null) => void
  setPeerName: (name: string | null) => void
  setIncomingCall: (call: IncomingCall | null) => void
  setLocalStream: (stream: MediaStream | null) => void
  setRemoteStream: (stream: MediaStream | null) => void
  toggleMute: () => void
  toggleCamera: () => void
  toggleScreenShare: () => void
  incrementDuration: () => void
  resetCall: () => void
}

export const useCallStore = create<CallState>((set, get) => ({
  status: 'idle',
  callType: null,
  peerId: null,
  peerName: null,
  incomingCall: null,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  callDuration: 0,

  setStatus: (status) => set({ status }),
  setCallType: (callType) => set({ callType }),
  setPeerId: (peerId) => set({ peerId }),
  setPeerName: (peerName) => set({ peerName }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),
  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),

  toggleMute: () => {
    const { localStream, isMuted } = get()
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = isMuted))
    }
    set({ isMuted: !isMuted })
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get()
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = isCameraOff))
    }
    set({ isCameraOff: !isCameraOff })
  },

  toggleScreenShare: () => set((s) => ({ isScreenSharing: !s.isScreenSharing })),

  incrementDuration: () => set((s) => ({ callDuration: s.callDuration + 1 })),

  resetCall: () => {
    const { localStream } = get()
    if (localStream) localStream.getTracks().forEach((t) => t.stop())
    set({
      status: 'idle',
      callType: null,
      peerId: null,
      peerName: null,
      incomingCall: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      callDuration: 0,
    })
  },
}))

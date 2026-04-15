import React, { useEffect, useRef, useState } from 'react'
import {
  Mic, MicOff, Video, VideoOff, Monitor, Hand, MoreHorizontal,
  PhoneOff, Users, MessageSquare, Lock, Clock
} from 'lucide-react'
import { useCallStore } from '@/store/callStore'
import { useAuthStore } from '@/store/authStore'
import { endCall } from '@/services/socket'
import Avatar from '@/components/ui/Avatar'

export default function VideoCallOverlay() {
  const {
    callType, peerId, peerName, status,
    localStream, remoteStream, isMuted, isCameraOff,
    toggleMute, toggleCamera, resetCall, callDuration, incrementDuration
  } = useCallStore()
  const { user } = useAuthStore()

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const [activeTab, setActiveTab] = useState<'participants' | 'chat'>('participants')

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(incrementDuration, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [status])

  const formatDuration = (secs: number): string => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleEndCall = () => {
    if (peerId) endCall(peerId)
    resetCall()
  }

  return (
    <div className="call-overlay">
      {/* Call header */}
      <div className="call-header">
        <div className="flex items-center gap-3">
          <span className="call-brand">Chatter</span>
          <div className="call-e2e-badge">
            <Lock size={10} />
            END-TO-END ENCRYPTED
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="call-timer">
            <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {status === 'connected' ? formatDuration(callDuration) : 'Connecting...'}
          </div>
          <button className="quick-end-btn" onClick={handleEndCall} title="End call">
            <PhoneOff size={14} />
            End
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Video grid */}
        <div style={{ flex: 1, position: 'relative' }}>
          {callType === 'video' ? (
            <div className={`video-grid ${remoteStream ? 'grid-2' : 'grid-1'}`}>
              {/* Remote video */}
              {remoteStream ? (
                <div className="video-tile">
                  <video ref={remoteVideoRef} autoPlay playsInline />
                  <div className="video-tile-label">{peerName || 'Remote'}</div>
                </div>
              ) : (
                <div className="video-tile">
                  <div style={{ textAlign: 'center' }}>
                    <Avatar
                      name={peerName || 'User'}
                      size="xxl"
                    />
                    <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
                      {status === 'calling' ? 'Calling...' : 'Connecting...'}
                    </div>
                  </div>
                </div>
              )}

              {/* Local video */}
              {localStream && (
                <div className="video-tile">
                  <video ref={localVideoRef} autoPlay playsInline muted />
                  <div className="video-tile-label">You (Live)</div>
                </div>
              )}
            </div>
          ) : (
            /* Audio call UI */
            <div className="video-tile" style={{ flex: 1, flexDirection: 'column', gap: 16 }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: 'var(--primary-subtle)',
                border: '3px solid var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: status === 'connected' ? 'pulse-dot 2s infinite' : 'ring 1.5s infinite'
              }}>
                <Avatar name={peerName || 'User'} size="xxl" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>{peerName}</div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {status === 'connected' ? formatDuration(callDuration) : 'Calling...'}
              </div>
            </div>
          )}
        </div>

        {/* Participants panel */}
        <div className="call-participants-panel">
          <div style={{ display: 'flex', gap: 0, background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', padding: 2, marginBottom: 16 }}>
            {(['participants', 'chat'] as const).map((tab) => (
              <button
                key={tab}
                className={`auth-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ textTransform: 'capitalize', fontSize: 13 }}
              >
                {tab === 'participants' ? <><Users size={13} /> Participants</> : <><MessageSquare size={13} /> Chat</>}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
            {activeTab === 'participants' ? '2 Active' : 'Chat'}
          </div>

          {activeTab === 'participants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* You */}
              <div className="flex items-center gap-3">
                <Avatar src={user?.avatar_url} name={user?.display_name || user?.username} size="sm" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {user?.display_name || user?.username}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--accent-teal)' }}>Organizer</div>
                </div>
              </div>

              {/* Peer */}
              {peerName && (
                <div className="flex items-center gap-3">
                  <Avatar name={peerName} size="sm" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{peerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {status === 'connected' ? 'Connected' : 'Connecting...'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="call-chat-panel-body">
              <div className="call-chat-empty">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>In-call chat</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Chat messages during calls will appear here.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls bar */}
      <div className="call-controls-bar">
        <button
          className={`call-ctrl-btn ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {callType === 'video' && (
          <button
            className={`call-ctrl-btn ${isCameraOff ? 'muted' : ''}`}
            onClick={toggleCamera}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}

        <button className="call-ctrl-btn" title="Share screen">
          <Monitor size={20} />
        </button>

        <button className="call-ctrl-btn" title="Raise hand">
          <Hand size={20} />
        </button>

        <button className="call-ctrl-btn" title="More options">
          <MoreHorizontal size={20} />
        </button>

        {/* End call */}
        <button
          className="call-ctrl-btn danger"
          onClick={handleEndCall}
          style={{ width: 120, borderRadius: 'var(--radius-full)', gap: 8, fontSize: 13, fontWeight: 600 }}
        >
          <PhoneOff size={18} />
          LEAVE SESSION
        </button>
      </div>
    </div>
  )
}

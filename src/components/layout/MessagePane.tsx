import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  Phone, Video, MoreVertical, Search, X, ChevronLeft,
  Paperclip, Smile, Send, Check, CheckCheck
} from 'lucide-react'
import { useChatStore, type Conversation, type Message } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { convApi, fileApi } from '@/services/api'
import {
  joinRoom, leaveRoom, getSocket,
  sendTypingStart, sendTypingStop,
  initiateCall
} from '@/services/socket'
import Avatar from '@/components/ui/Avatar'
import { format } from 'date-fns'
// @ts-ignore — emoji-mart types
import EmojiPicker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import IncomingCallToast from '@/components/calls/IncomingCallToast'
import VideoCallOverlay from '@/components/calls/VideoCallOverlay'
import { useCallStore } from '@/store/callStore'

interface Props {
  conversation: Conversation | null
  onBack?: () => void
}

export default function MessagePane({ conversation, onBack }: Props) {
  const { user } = useAuthStore()
  const { messages, setMessages, hasMore, nextCursor, typing } = useChatStore()
  const { status: callStatus, incomingCall } = useCallStore()

  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<Message[]>([])
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const isTypingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const convId = conversation?.id
  const convMessages = convId ? (messages[convId] || []) : []
  const typingUsers = convId ? (typing[convId] || []) : []

  const otherTypingNames = typingUsers
    .filter((id) => id !== user?.id)
    .map((id) => {
      const p = conversation?.participants.find((p) => p.id === id)
      return p?.display_name || p?.username || 'Someone'
    })

  useEffect(() => {
    if (!convId) return
    joinRoom(convId)
    loadMessages(convId)

    return () => {
      leaveRoom(convId)
    }
  }, [convId])

  useEffect(() => {
    scrollToBottom()
  }, [convMessages.length])

  const loadMessages = async (id: string) => {
    setLoading(true)
    try {
      const { data } = await convApi.getMessages(id, { limit: 50 })
      setMessages(id, data.items, data.has_more, data.next_cursor)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleTyping = (val: string) => {
    setInputText(val)
    if (!convId) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      sendTypingStart(convId)
    }

    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      sendTypingStop(convId)
    }, 1500)
  }

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || !convId || sending) return

    setSending(true)
    setInputText('')
    setReplyTo(null)
    isTypingRef.current = false
    sendTypingStop(convId)

    try {
      getSocket().emit('send_message', {
        conversation_id: convId,
        content: text,
        message_type: 'text',
        reply_to_id: replyTo?.id,
      })
    } catch {
      setInputText(text) // restore on error
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !convId) return

    try {
      const { data } = await fileApi.upload(file)
      getSocket().emit('send_message', {
        conversation_id: convId,
        message_type: data.message_type,
        file_url: data.file_url,
        file_name: data.file_name,
        file_size: data.file_size,
      })
    } catch {
      alert('File upload failed')
    }

    e.target.value = ''
  }

  const handleSearch = async () => {
    if (!convId || !searchQ.trim()) return
    try {
      const { data } = await convApi.searchMessages(convId, searchQ)
      setSearchResults(data)
    } catch {
      // silent
    }
  }

  const handleCall = (type: 'video' | 'audio') => {
    if (!conversation) return
    const other = conversation.participants.find((p) => p.id !== user?.id)
    if (other) {
      initiateCall(other.id, type, conversation.id)
      useCallStore.getState().setCallType(type)
      useCallStore.getState().setPeerId(other.id)
      useCallStore.getState().setPeerName(other.display_name || other.username)
      useCallStore.getState().setStatus('calling')
    }
  }

  const getConvName = (): string => {
    if (!conversation) return ''
    if (conversation.type === 'group') return conversation.name || 'Group Chat'
    const other = conversation.participants.find((p) => p.id !== user?.id)
    return other?.display_name || other?.username || 'Unknown'
  }

  const getConvStatus = (): string => {
    if (!conversation) return ''
    if (conversation.type === 'group') {
      return `${conversation.participants.length} members`
    }
    const other = conversation.participants.find((p) => p.id !== user?.id)
    const status = other?.status
    if (status === 'online') return 'Online'
    if (status === 'away') return 'Away'
    if (other?.last_seen) return `Last seen ${format(new Date(other.last_seen), 'p')}`
    return 'Offline'
  }

  if (!conversation) {
    return (
      <div className="message-pane">
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-title">Select a conversation</div>
          <div className="empty-state-sub">Choose a chat from the list to start messaging</div>
        </div>
      </div>
    )
  }

  const groupedMessages = (() => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ''
    for (const msg of convMessages) {
      const date = format(new Date(msg.created_at), 'MMMM d, yyyy')
      if (date !== currentDate) {
        currentDate = date
        groups.push({ date, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    }
    return groups
  })()

  return (
    <>
      <div className="message-pane">
        {/* Header */}
        <div className="message-pane-header">
          <div className="message-pane-user">
            {onBack && (
              <button className="icon-btn" onClick={onBack} style={{ marginRight: 4 }}>
                <ChevronLeft size={20} />
              </button>
            )}
            <Avatar
              src={conversation.avatar_url || (conversation.participants.find(p => p.id !== user?.id)?.avatar_url)}
              name={getConvName()}
              size="md"
              status={conversation.type === 'direct'
                ? (conversation.participants.find(p => p.id !== user?.id)?.status as any)
                : null}
            />
            <div>
              <div className="message-pane-name">{getConvName()}</div>
              <div className="message-pane-status" style={{
                color: getConvStatus() === 'Online' ? 'var(--accent-teal)' : 'var(--text-tertiary)'
              }}>
                {otherTypingNames.length > 0
                  ? `${otherTypingNames[0]} is typing...`
                  : getConvStatus()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="icon-btn" onClick={() => setShowSearch(s => !s)} title="Search">
              <Search size={18} />
            </button>
            <button className="icon-btn" onClick={() => handleCall('audio')} title="Audio call">
              <Phone size={18} />
            </button>
            <button className="icon-btn" onClick={() => handleCall('video')} title="Video call">
              <Video size={18} />
            </button>
            <button className="icon-btn" title="More options">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              className="input-field"
              placeholder="Search in conversation..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
          </div>
        )}

        {/* Messages */}
        <div className="messages-body" id="messages-body">
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: 13 }}>
              <span className="spinner" style={{ display: 'inline-block' }} />
            </div>
          )}

          {groupedMessages.map(({ date, messages: grpMsgs }) => (
            <React.Fragment key={date}>
              {/* Date divider */}
              <div style={{
                textAlign: 'center', margin: '8px 0',
                fontSize: 11, color: 'var(--text-tertiary)',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                {date}
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              {grpMsgs.map((msg) => {
                const isOwn = msg.sender_id === user?.id
                return (
                  <div key={msg.id} className={`message-bubble-wrap ${isOwn ? 'outgoing' : 'incoming'}`}>
                    {!isOwn && (
                      <Avatar
                        src={msg.sender?.avatar_url}
                        name={msg.sender?.display_name || msg.sender?.username}
                        size="sm"
                      />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '100%' }}>
                      {/* Reply reference */}
                      {msg.reply_to_id && (
                        <div className="reply-preview">Replying to a message</div>
                      )}

                      {/* Bubble content */}
                      {msg.message_type === 'image' ? (
                        <div className={`image-message ${isOwn ? 'outgoing' : ''}`}>
                          <img src={msg.file_url || ''} alt="Image" />
                        </div>
                      ) : msg.message_type === 'file' || msg.message_type === 'audio' ? (
                        <div className={`message-bubble ${isOwn ? 'outgoing' : 'incoming'}`}>
                          <div className="file-message">
                            <span style={{ fontSize: 24 }}>
                              {msg.message_type === 'audio' ? '🎵' : '📎'}
                            </span>
                            <div>
                              <div className="file-message-name">{msg.file_name || 'File'}</div>
                              {msg.file_size && (
                                <div className="file-message-size">
                                  {(msg.file_size / 1024).toFixed(1)} KB
                                </div>
                              )}
                            </div>
                            {msg.file_url && (
                              <a href={msg.file_url} download target="_blank" style={{ marginLeft: 'auto' }}>
                                ⬇️
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`message-bubble ${isOwn ? 'outgoing' : 'incoming'}`}
                          onDoubleClick={() => setReplyTo(msg)}
                        >
                          {msg.content}
                        </div>
                      )}

                      {/* Time + status */}
                      <div className="flex items-center gap-1" style={{
                        justifyContent: isOwn ? 'flex-end' : 'flex-start'
                      }}>
                        <span className="message-time">
                          {format(new Date(msg.created_at), 'p')}
                        </span>
                        {isOwn && (
                          <span style={{ color: msg.status === 'read' ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                            {msg.status === 'read'
                              ? <CheckCheck size={12} />
                              : <Check size={12} />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </React.Fragment>
          ))}

          {/* Typing indicator */}
          {otherTypingNames.length > 0 && (
            <div className="message-bubble-wrap incoming" style={{ marginTop: 4 }}>
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div style={{ padding: '0 16px', background: 'var(--bg-surface)' }}>
            <div className="reply-preview flex items-center justify-between">
              <div>
                <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 11, marginBottom: 2 }}>
                  Replying to {replyTo.sender?.display_name || replyTo.sender?.username}
                </div>
                {replyTo.content?.slice(0, 60)}
              </div>
              <button className="icon-btn" onClick={() => setReplyTo(null)}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="message-input-area">
          <div className="message-input-wrap" style={{ position: 'relative' }}>
            {/* Emoji picker */}
            {showEmoji && (
              <div className="emoji-picker-container">
                <EmojiPicker
                  data={data}
                  onEmojiSelect={(e: { native: string }) => {
                    setInputText((t) => t + e.native)
                    setShowEmoji(false)
                    inputRef.current?.focus()
                  }}
                  theme="dark"
                  previewPosition="none"
                />
              </div>
            )}

            {/* Emoji button */}
            <button
              className="icon-btn"
              onClick={() => setShowEmoji(s => !s)}
              style={{ flexShrink: 0 }}
            >
              <Smile size={18} />
            </button>

            {/* File button */}
            <button
              className="icon-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{ flexShrink: 0 }}
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              accept="image/*,application/pdf,text/*,audio/*,video/*"
            />

            {/* Text input */}
            <textarea
              ref={inputRef}
              className="message-input"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ resize: 'none' }}
            />

            {/* Send button */}
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Incoming call toast */}
      {incomingCall && <IncomingCallToast />}

      {/* Active call overlay */}
      {(callStatus === 'connected' || callStatus === 'calling') && <VideoCallOverlay />}
    </>
  )
}

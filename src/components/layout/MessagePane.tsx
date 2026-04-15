import React, { useEffect, useRef, useState } from 'react'
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
import EmojiPicker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import IncomingCallToast from '@/components/calls/IncomingCallToast'
import VideoCallOverlay from '@/components/calls/VideoCallOverlay'
import { useCallStore } from '@/store/callStore'
import { Box, IconButton, Typography, TextField, CircularProgress, Button } from '@mui/material'

interface Props {
  conversation: Conversation | null
  onBack?: () => void
}

export default function MessagePane({ conversation, onBack }: Props) {
  const { user } = useAuthStore()
  const { messages, setMessages, typing } = useChatStore()
  const { status: callStatus, incomingCall, setLocalStream } = useCallStore()

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convMessages.length])

  const loadMessages = async (id: string) => {
    setLoading(true)
    try {
      const { data: res } = await convApi.getMessages(id, { limit: 50 })
      setMessages(id, res.items, res.has_more, res.next_cursor)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
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
      setInputText(text)
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
      const { data: fileData } = await fileApi.upload(file)
      getSocket().emit('send_message', {
        conversation_id: convId,
        message_type: fileData.message_type,
        file_url: fileData.file_url,
        file_name: fileData.file_name,
        file_size: fileData.file_size,
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

  const handleCall = async (type: 'video' | 'audio') => {
    if (!conversation) return
    const other = conversation.participants.find((p) => p.id !== user?.id)
    if (other) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true,
        })
        setLocalStream(stream)
      } catch {
        alert('Microphone/camera permission is required to start a call.')
        return
      }
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
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 5, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 48 }}>💬</Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 700 }}>Select a conversation</Typography>
          <Typography variant="body2" color="text.disabled">Choose a chat from the list to start messaging</Typography>
        </Box>
      </Box>
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
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default', minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {onBack && (
              <IconButton onClick={onBack} size="small" sx={{ color: 'text.secondary', mr: 0.5 }}>
                <ChevronLeft size={20} />
              </IconButton>
            )}
            <Avatar
              src={conversation.avatar_url || (conversation.participants.find(p => p.id !== user?.id)?.avatar_url)}
              name={getConvName()}
              size="md"
              status={conversation.type === 'direct'
                ? (conversation.participants.find(p => p.id !== user?.id)?.status as any)
                : null}
            />
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{getConvName()}</Typography>
              <Typography variant="caption" sx={{ color: getConvStatus() === 'Online' ? 'success.main' : 'text.disabled' }}>
                {otherTypingNames.length > 0
                  ? `${otherTypingNames[0]} is typing...`
                  : getConvStatus()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton onClick={() => setShowSearch(s => !s)} size="small" sx={{ color: 'text.secondary' }}>
              <Search size={18} />
            </IconButton>
            <IconButton onClick={() => handleCall('audio')} size="small" sx={{ color: 'text.secondary' }}>
              <Phone size={18} />
            </IconButton>
            <IconButton onClick={() => handleCall('video')} size="small" sx={{ color: 'text.secondary' }}>
              <Video size={18} />
            </IconButton>
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <MoreVertical size={18} />
            </IconButton>
          </Box>
        </Box>

        {showSearch && (
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search in conversation..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 6 },
              }}
            />
            <Button variant="contained" size="small" onClick={handleSearch}>Search</Button>
          </Box>
        )}

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {loading && (
            <Box sx={{ textAlign: 'center', py: 2.5 }}>
              <CircularProgress size={20} sx={{ color: 'primary.main' }} />
            </Box>
          )}

          {groupedMessages.map(({ date, messages: grpMsgs }) => (
            <React.Fragment key={date}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1, fontSize: 11, color: 'text.disabled' }}>
                <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
                {date}
                <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
              </Box>

              {grpMsgs.map((msg) => {
                const isOwn = msg.sender_id === user?.id
                return (
                  <Box key={msg.id} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, maxWidth: '70%', alignSelf: isOwn ? 'flex-end' : 'flex-start' }}>
                    {!isOwn && (
                      <Avatar
                        src={msg.sender?.avatar_url}
                        name={msg.sender?.display_name || msg.sender?.username}
                        size="sm"
                      />
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, maxWidth: '100%' }}>
                      {msg.reply_to_id && (
                        <Box sx={{ p: 1, borderRadius: 1, borderLeft: '3px solid', borderColor: 'primary.main', bgcolor: 'rgba(108, 99, 255, 0.1)', fontSize: 12, color: 'text.secondary' }}>
                          Replying to a message
                        </Box>
                      )}

                      {msg.message_type === 'image' ? (
                        <Box sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', '&:hover': { transform: 'scale(1.02)' } }}>
                          <img src={msg.file_url || ''} alt="Image" style={{ maxWidth: 240, display: 'block' }} />
                        </Box>
                      ) : msg.message_type === 'file' || msg.message_type === 'audio' ? (
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isOwn ? 'primary.main' : 'background.paper', border: isOwn ? 'none' : '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <span style={{ fontSize: 24 }}>{msg.message_type === 'audio' ? '🎵' : '📎'}</span>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{msg.file_name || 'File'}</Typography>
                              {msg.file_size && (
                                <Typography variant="caption" color="text.disabled">{(msg.file_size / 1024).toFixed(1)} KB</Typography>
                              )}
                            </Box>
                            {msg.file_url && (
                              <a href={msg.file_url} download target="_blank" style={{ marginLeft: 'auto', textDecoration: 'none' }}>⬇️</a>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          onDoubleClick={() => setReplyTo(msg)}
                          sx={{
                            p: 1.25,
                            borderRadius: 3,
                            bgcolor: isOwn ? 'primary.main' : 'background.paper',
                            color: isOwn ? 'white' : 'text.primary',
                            borderBottomRightRadius: isOwn ? 4 : 18,
                            borderBottomLeftRadius: isOwn ? 18 : 4,
                            border: isOwn ? 'none' : '1px solid',
                            borderColor: 'divider',
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.content}
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                        <Typography variant="caption" color="text.disabled">{format(new Date(msg.created_at), 'p')}</Typography>
                        {isOwn && (
                          <Box sx={{ color: msg.status === 'read' ? 'primary.main' : 'text.disabled' }}>
                            {msg.status === 'read' ? <CheckCheck size={12} /> : <Check size={12} />}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )
              })}
            </React.Fragment>
          ))}

          {otherTypingNames.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled', animation: 'pulse 1.2s infinite' }} />
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled', animation: 'pulse 1.2s infinite', animationDelay: '0.2s' }} />
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled', animation: 'pulse 1.2s infinite', animationDelay: '0.4s' }} />
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {replyTo && (
          <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderRadius: 1, borderLeft: '3px solid', borderColor: 'primary.main', bgcolor: 'rgba(108, 99, 255, 0.1)' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Replying to {replyTo.sender?.display_name || replyTo.sender?.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{replyTo.content?.slice(0, 60)}</Typography>
              </Box>
              <IconButton size="small" onClick={() => setReplyTo(null)}>
                <X size={14} />
              </IconButton>
            </Box>
          </Box>
        )}

        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.25, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '9999px', p: 1, pl: 2 }}>
            {showEmoji && (
              <Box sx={{ position: 'absolute', bottom: '100%', left: 0, mb: 1, animation: 'scaleIn 0.2s ease', transformOrigin: 'bottom left', zIndex: 50 }}>
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
              </Box>
            )}

            <IconButton size="small" onClick={() => setShowEmoji(s => !s)} sx={{ flexShrink: 0, color: 'text.secondary' }}>
              <Smile size={18} />
            </IconButton>

            <IconButton size="small" onClick={() => fileInputRef.current?.click()} sx={{ flexShrink: 0, color: 'text.secondary' }}>
              <Paperclip size={18} />
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              accept="image/*,application/pdf,text/*,audio/*,video/*"
            />

            <textarea
              ref={inputRef}
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{
                flex: 1,
                background: 'none',
                color: '#F0F0FF',
                fontSize: 14,
                resize: 'none',
                maxHeight: 120,
                minHeight: 24,
                lineHeight: 1.6,
                padding: '2px 0',
                fontFamily: 'inherit',
                outline: 'none',
                border: 'none',
              }}
            />

            <IconButton
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: inputText.trim() && !sending ? 'primary.main' : 'rgba(255,255,255,0.06)',
                color: inputText.trim() && !sending ? 'white' : 'text.disabled',
                '&:hover': inputText.trim() && !sending ? { bgcolor: 'primary.light', transform: 'scale(1.05)' } : {},
                flexShrink: 0,
              }}
            >
              <Send size={16} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {incomingCall && <IncomingCallToast />}
      {(callStatus === 'connected' || callStatus === 'calling') && <VideoCallOverlay />}
    </>
  )
}
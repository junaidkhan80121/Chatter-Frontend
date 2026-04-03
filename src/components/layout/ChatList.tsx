import React, { useState, useEffect } from 'react'
import { Search, Plus } from 'lucide-react'
import { useChatStore, type Conversation } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { convApi } from '@/services/api'
import Avatar from '@/components/ui/Avatar'
import { formatDistanceToNow } from 'date-fns'
import NewChatModal from '@/components/modals/NewChatModal'
import { Box, Typography, IconButton, TextField, InputAdornment, Skeleton, Badge } from '@mui/material'

interface Props {
  onConvSelect: (conv: Conversation) => void
  showArchived?: boolean
}

export default function ChatList({ onConvSelect, showArchived = false }: Props) {
  const { conversations, setConversations, activeConvId } = useChatStore()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const { data } = await convApi.list()
      setConversations(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const getConvName = (conv: Conversation): string => {
    if (conv.type === 'group') return conv.name || 'Group Chat'
    const other = conv.participants.find((p) => p.id !== user?.id)
    return other?.display_name || other?.username || 'Unknown'
  }

  const getConvAvatar = (conv: Conversation) => {
    if (conv.type === 'group') return conv.avatar_url
    const other = conv.participants.find((p) => p.id !== user?.id)
    return other?.avatar_url
  }

  const getConvStatus = (conv: Conversation) => {
    if (conv.type === 'group') return null
    const other = conv.participants.find((p) => p.id !== user?.id)
    return other?.status as 'online' | 'offline' | 'away' | null
  }

  const getLastMsg = (conv: Conversation): string => {
    const msg = conv.last_message
    if (!msg) return 'No messages yet'
    if (msg.message_type === 'image') return '📷 Photo'
    if (msg.message_type === 'file') return `📎 ${msg.file_name || 'File'}`
    if (msg.message_type === 'audio') return '🎵 Voice message'
    const isMine = msg.sender_id === user?.id
    return isMine ? `You: ${msg.content || ''}` : msg.content || ''
  }

  const filtered = conversations.filter((c) => {
    const name = getConvName(c).toLowerCase()
    const isArchived = !!c.archived_at
    if (showArchived && !isArchived) return false
    if (!showArchived && isArchived) return false
    return name.includes(search.toLowerCase())
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned_at && !b.pinned_at) return -1
    if (!a.pinned_at && b.pinned_at) return 1
    const aTime = a.last_message?.created_at || a.created_at
    const bTime = b.last_message?.created_at || b.created_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {showArchived ? 'Archive' : 'Messages'}
          </Typography>
          <IconButton onClick={() => setShowNewChat(true)} size="small" sx={{ color: 'text.secondary' }}>
            <Plus size={18} />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} style={{ color: 'rgba(240, 240, 255, 0.35)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '9999px',
              bgcolor: 'rgba(255, 255, 255, 0.06)',
            },
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="80%" height={11} sx={{ mt: 0.75 }} />
              </Box>
            </Box>
          ))
        ) : sorted.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pt: 7.5, gap: 2, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 48 }}>{showArchived ? '📦' : '💬'}</Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              {showArchived ? 'No archived chats' : 'No chats yet'}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Start a conversation with a friend
            </Typography>
          </Box>
        ) : (
          sorted.map((conv) => (
            <Box
              key={conv.id}
              onClick={() => onConvSelect(conv)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.25,
                cursor: 'pointer',
                bgcolor: activeConvId === conv.id ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
                position: 'relative',
                '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.08)' },
                ...(activeConvId === conv.id && {
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    bgcolor: 'primary.main',
                    borderRadius: '0 3px 3px 0',
                  },
                }),
              }}
            >
              <Avatar
                src={getConvAvatar(conv)}
                name={getConvName(conv)}
                size="md"
                status={getConvStatus(conv)}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.pinned_at && '📌 '}
                    {getConvName(conv)}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {conv.last_message
                      ? formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })
                          .replace('about ', '')
                          .replace(' minutes', 'm')
                          .replace(' hours', 'h')
                          .replace(' days', 'd')
                      : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getLastMsg(conv)}
                  </Typography>
                  {conv.unread_count > 0 && (
                    <Badge badgeContent={conv.unread_count > 99 ? '99+' : conv.unread_count} color="primary" sx={{ ml: 1, flexShrink: 0 }} />
                  )}
                </Box>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {showNewChat && (
        <NewChatModal 
          onClose={() => setShowNewChat(false)} 
          onChatCreated={(conv) => {
            onConvSelect(conv)
            setShowNewChat(false)
          }}
        />
      )}
    </Box>
  )
}
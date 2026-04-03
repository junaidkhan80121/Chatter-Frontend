import React, { useState, useEffect } from 'react'
import { Search, Plus, Users } from 'lucide-react'
import { useChatStore, type Conversation } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { convApi } from '@/services/api'
import Avatar from '@/components/ui/Avatar'
import { formatDistanceToNow } from 'date-fns'
import NewChatModal from '@/components/modals/NewChatModal'

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

  // Sort: pinned first, then by last message
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned_at && !b.pinned_at) return -1
    if (!a.pinned_at && b.pinned_at) return 1
    const aTime = a.last_message?.created_at || a.created_at
    const bTime = b.last_message?.created_at || b.created_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  return (
    <div className="chat-list-sidebar">
      {/* Header */}
      <div className="chat-list-header">
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h1 className="chat-list-title">{showArchived ? 'Archive' : 'Messages'}</h1>
          <button className="icon-btn" onClick={() => setShowNewChat(true)}>
            <Plus size={18} />
          </button>
        </div>
        <div className="search-bar">
          <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="chat-list-body">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="chat-item">
              <div className="skeleton avatar-md" style={{ borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="skeleton" style={{ height: 14, width: '60%' }} />
                <div className="skeleton" style={{ height: 11, width: '80%' }} />
              </div>
            </div>
          ))
        ) : sorted.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <div className="empty-state-icon">{showArchived ? '📦' : '💬'}</div>
            <div className="empty-state-title">{showArchived ? 'No archived chats' : 'No chats yet'}</div>
            <div className="empty-state-sub">Start a conversation with a friend</div>
          </div>
        ) : (
          sorted.map((conv) => (
            <div
              key={conv.id}
              className={`chat-item ${activeConvId === conv.id ? 'active' : ''}`}
              onClick={() => onConvSelect(conv)}
            >
              <Avatar
                src={getConvAvatar(conv)}
                name={getConvName(conv)}
                size="md"
                status={getConvStatus(conv)}
              />
              <div className="chat-item-info">
                <div className="chat-item-top">
                  <span className="chat-item-name">
                    {conv.pinned_at && '📌 '}
                    {getConvName(conv)}
                  </span>
                  <span className="chat-item-time">
                    {conv.last_message
                      ? formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })
                          .replace('about ', '')
                          .replace(' minutes', 'm')
                          .replace(' hours', 'h')
                          .replace(' days', 'd')
                      : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="chat-item-preview">{getLastMsg(conv)}</span>
                  {conv.unread_count > 0 && (
                    <span className="badge" style={{ marginLeft: 8, flexShrink: 0 }}>
                      {conv.unread_count > 99 ? '99+' : conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showNewChat && (
        <NewChatModal 
          onClose={() => setShowNewChat(false)} 
          onChatCreated={(conv) => {
            onConvSelect(conv)
            setShowNewChat(false)
          }}
        />
      )}
    </div>
  )
}

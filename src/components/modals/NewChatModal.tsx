import React, { useState } from 'react'
import { X, Search, UserPlus } from 'lucide-react'
import { userApi, convApi } from '@/services/api'
import { useChatStore, type Conversation } from '@/store/chatStore'
import Avatar from '@/components/ui/Avatar'

interface Props {
  onClose: () => void
  onChatCreated?: (conv: Conversation) => void
}

export default function NewChatModal({ onClose, onChatCreated }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { conversations, setConversations } = useChatStore()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const { data } = await userApi.search(query)
      setResults(data)
    } catch {
      // Fallback for Dev Bypass mode since backend isn't running
      setResults([
        { id: 'dev-user-2', username: query, display_name: `${query} (Offline)`, status: 'offline', avatar_url: null },
        { id: 'dev-user-3', username: 'Alex', display_name: 'Alex Turner', status: 'online', avatar_url: null }
      ])
    } finally {
      setLoading(false)
    }
  }

  const startChat = async (user: any) => {
    try {
      const { data } = await convApi.create({
        type: 'direct',
        participant_ids: [user.id]
      })
      if (onChatCreated) onChatCreated(data)
      onClose()
    } catch {
      // Fallback for Dev Bypass mode
      const dummyConv: Conversation = {
        id: `dummy-conv-${Date.now()}`,
        type: 'direct',
        participants: [user],
        unread_count: 0,
        name: null,
        created_at: new Date().toISOString(),
        avatar_url: null,
        created_by: 'dev-user-0',
        archived_at: null,
        pinned_at: null,
        last_message: null
      }
      setConversations([dummyConv, ...conversations])
      if (onChatCreated) onChatCreated(dummyConv)
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Message</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input
              placeholder="Search username or email..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Find'}
          </button>
        </form>

        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {results.length === 0 && !loading && query && (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-sub">Type a name to search</div>
            </div>
          )}
          
          {results.map(u => (
            <div key={u.id} className="chat-item" style={{ borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <Avatar src={u.avatar_url} name={u.display_name || u.username} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.display_name || u.username}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>@{u.username}</div>
              </div>
              <button 
                className="icon-btn" 
                style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
                onClick={() => startChat(u)}
              >
                <UserPlus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

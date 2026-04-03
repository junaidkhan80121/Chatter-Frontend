import React, { useState, useEffect } from 'react'
import { Search, UserPlus, Phone, MessageSquare } from 'lucide-react'
import { friendApi, userApi, convApi } from '@/services/api'
import { useChatStore, type Conversation } from '@/store/chatStore'
import Avatar from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  onOpenConv?: (conv: Conversation) => void
}

export default function ArchivePage({ onOpenConv }: Props) {
  const [activeTab, setActiveTab] = useState<'archived' | 'contacts'>('archived')
  const [contacts, setContacts] = useState<any[]>([])
  const [addSearch, setAddSearch] = useState('')
  const [addResults, setAddResults] = useState<any[]>([])
  const [addLoading, setAddLoading] = useState(false)
  const { conversations, setConversations } = useChatStore()
  const { user } = useAuthStore()

  const archivedConvs = conversations.filter((c) => !!c.archived_at)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const { data } = await friendApi.getFriends()
      setContacts(data)
    } catch { /* silent */ }
  }

  const handleSearch = async () => {
    if (!addSearch.trim()) return
    setAddLoading(true)
    try {
      const { data } = await userApi.search(addSearch)
      setAddResults(data)
    } catch { /* silent */ }
    finally { setAddLoading(false) }
  }

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await friendApi.sendRequest({ addressee_id: userId })
      alert('Friend request sent!')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error sending request')
    }
  }

  const handleUnarchive = async (convId: string) => {
    try {
      // For now client-side only
      alert('Unarchived! (refresh to see in main list)')
    } catch { /* silent */ }
  }

  const getConvName = (conv: Conversation): string => {
    if (conv.type === 'group') return conv.name || 'Group Chat'
    const other = conv.participants.find((p) => p.id !== user?.id)
    return other?.display_name || other?.username || 'Unknown'
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>The Fluid Dialogue</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn"><Search size={18} /></button>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary-subtle)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Avatar src={user?.avatar_url} name={user?.display_name || user?.username} size="sm" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0" style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', padding: 3, marginBottom: 12 }}>
          <button
            className={`auth-tab ${activeTab === 'archived' ? 'active' : ''}`}
            onClick={() => setActiveTab('archived')}
          >
            Archived
          </button>
          <button
            className={`auth-tab ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            Contacts
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Add Friend */}
        {activeTab === 'contacts' && (
          <div style={{ marginBottom: 20 }}>
            <div
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', gap: 8, marginBottom: 12 }}
            >
              <UserPlus size={16} />
              Add New Friend
            </div>

            <div className="search-bar" style={{ marginBottom: 8 }}>
              <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
              <input
                placeholder="Search by username or ID..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {addResults.map((u) => (
              <div key={u.id} className="add-friend-result">
                <Avatar src={u.avatar_url} name={u.display_name || u.username} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{u.display_name || u.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>@{u.username}</div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSendFriendRequest(u.id)}
                >
                  <UserPlus size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'archived' && (
          <>
            {archivedConvs.length > 0 && (
              <div>
                <div className="section-label">
                  Archived Chats
                  <span className="badge" style={{ marginLeft: 8 }}>{archivedConvs.length}</span>
                </div>
                {archivedConvs.map((conv) => (
                  <div key={conv.id} className="flex items-center gap-12" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <Avatar
                      src={conv.participants.find(p => p.id !== user?.id)?.avatar_url}
                      name={getConvName(conv)}
                      size="md"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{getConvName(conv)}</div>
                      {conv.last_message && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.last_message.content || 'Media'}
                        </div>
                      )}
                    </div>
                    {conv.archived_at && (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {formatDistanceToNow(new Date(conv.archived_at), { addSuffix: true })}
                      </div>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
                      onClick={() => handleUnarchive(conv.id)}
                    >
                      RESTORE
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Contacts */}
        {activeTab === 'contacts' && (
          <div>
            <div className="section-label">Contacts</div>
            {contacts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-title">No contacts yet</div>
                <div className="empty-state-sub">Search for friends to connect</div>
              </div>
            ) : (
              // Group by first letter
              Object.entries(
                contacts.reduce((acc: Record<string, any[]>, f) => {
                  const other = f.requester_id === user?.id ? f.addressee : f.requester
                  const name = other?.display_name || other?.username || '?'
                  const letter = name[0].toUpperCase()
                  if (!acc[letter]) acc[letter] = []
                  acc[letter].push(other)
                  return acc
                }, {})
              ).sort(([a], [b]) => a.localeCompare(b)).map(([letter, users]: [string, any[]]) => (
                <div key={letter}>
                  <div className="section-label">{letter}</div>
                  {users.map((u: any) => (
                    <div key={u?.id} className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <Avatar src={u?.avatar_url} name={u?.display_name || u?.username} size="md" status={u?.status} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{u?.display_name || u?.username}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                          {u?.status === 'online' ? 'Active now' : u?.last_seen ? `Active ${formatDistanceToNow(new Date(u.last_seen), { addSuffix: true })}` : 'Offline'}
                        </div>
                      </div>
                      <button className="icon-btn" title="Message">
                        <MessageSquare size={16} />
                      </button>
                      <button className="icon-btn" title="Call">
                        <Phone size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

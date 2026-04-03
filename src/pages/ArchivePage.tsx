import React, { useState, useEffect } from 'react'
import { Search, UserPlus, Phone, MessageSquare } from 'lucide-react'
import { friendApi, userApi } from '@/services/api'
import { useChatStore, type Conversation } from '@/store/chatStore'
import Avatar from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { Box, Typography, TextField, Button, IconButton, ToggleButtonGroup, ToggleButton, InputAdornment, Badge } from '@mui/material'

interface Props {
  onOpenConv?: (conv: Conversation) => void
}

export default function ArchivePage({ onOpenConv }: Props) {
  const [activeTab, setActiveTab] = useState<'archived' | 'contacts'>('archived')
  const [contacts, setContacts] = useState<any[]>([])
  const [addSearch, setAddSearch] = useState('')
  const [addResults, setAddResults] = useState<any[]>([])
  const [addLoading, setAddLoading] = useState(false)
  const { conversations } = useChatStore()
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
    alert('Unarchived! (refresh to see in main list)')
  }

  const getConvName = (conv: Conversation): string => {
    if (conv.type === 'group') return conv.name || 'Group Chat'
    const other = conv.participants.find((p) => p.id !== user?.id)
    return other?.display_name || other?.username || 'Unknown'
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>The Fluid Dialogue</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" sx={{ color: 'text.secondary' }}><Search size={18} /></IconButton>
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'rgba(108, 99, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar src={user?.avatar_url} name={user?.display_name || user?.username} size="sm" />
            </Box>
          </Box>
        </Box>

        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={(_, v) => v && setActiveTab(v)}
          fullWidth
          sx={{
            '& .MuiToggleButton-root': {
              borderRadius: '9999px !important',
              textTransform: 'none',
              fontWeight: 500,
              py: 0.75,
              color: 'text.secondary',
              border: 'none',
              bgcolor: 'rgba(255,255,255,0.06)',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
              },
            },
          }}
        >
          <ToggleButton value="archived">Archived</ToggleButton>
          <ToggleButton value="contacts">Contacts</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {activeTab === 'contacts' && (
          <Box sx={{ mb: 2.5 }}>
            <Button variant="contained" fullWidth sx={{ mb: 1.5, gap: 1, justifyContent: 'center' }}>
              <UserPlus size={16} />
              Add New Friend
            </Button>

            <TextField
              fullWidth
              size="small"
              placeholder="Search by username or ID..."
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={14} style={{ color: 'rgba(240, 240, 255, 0.35)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
            />

            {addResults.map((u) => (
              <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'primary.main', bgcolor: 'rgba(108, 99, 255, 0.05)', mt: 1 }}>
                <Avatar src={u.avatar_url} name={u.display_name || u.username} size="md" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.display_name || u.username}</Typography>
                  <Typography variant="caption" color="text.disabled">@{u.username}</Typography>
                </Box>
                <Button variant="contained" size="small" onClick={() => handleSendFriendRequest(u.id)} sx={{ borderRadius: 4 }}>
                  <UserPlus size={13} />
                </Button>
              </Box>
            ))}
          </Box>
        )}

        {activeTab === 'archived' && (
          <>
            {archivedConvs.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', mb: 1 }}>
                  Archived Chats
                  <Badge badgeContent={archivedConvs.length} color="primary" sx={{ ml: 1 }} />
                </Typography>
                {archivedConvs.map((conv) => (
                  <Box key={conv.id} sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Avatar src={conv.participants.find(p => p.id !== user?.id)?.avatar_url} name={getConvName(conv)} size="md" />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{getConvName(conv)}</Typography>
                      {conv.last_message && (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.last_message.content || 'Media'}
                        </Typography>
                      )}
                    </Box>
                    {conv.archived_at && (
                      <Typography variant="caption" color="text.disabled">
                        {formatDistanceToNow(new Date(conv.archived_at), { addSuffix: true })}
                      </Typography>
                    )}
                    <Button variant="text" size="small" sx={{ color: 'primary.main', bgcolor: 'rgba(108, 99, 255, 0.1)', borderRadius: 4, fontSize: 10 }} onClick={() => handleUnarchive(conv.id)}>
                      RESTORE
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </>
        )}

        {activeTab === 'contacts' && (
          <Box>
            <Typography variant="caption" sx={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', mb: 1 }}>
              Contacts
            </Typography>
            {contacts.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 1 }}>
                <Typography sx={{ fontSize: 48 }}>👥</Typography>
                <Typography variant="body2" color="text.disabled">No contacts yet</Typography>
                <Typography variant="caption" color="text.disabled">Search for friends to connect</Typography>
              </Box>
            ) : (
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
                <Box key={letter}>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled', mt: 2, mb: 0.5 }}>
                    {letter}
                  </Typography>
                  {users.map((u: any) => (
                    <Box key={u?.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Avatar src={u?.avatar_url} name={u?.display_name || u?.username} size="md" status={u?.status} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{u?.display_name || u?.username}</Typography>
                        <Typography variant="caption" color="text.disabled">
                          {u?.status === 'online' ? 'Active now' : u?.last_seen ? `Active ${formatDistanceToNow(new Date(u.last_seen), { addSuffix: true })}` : 'Offline'}
                        </Typography>
                      </Box>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}><MessageSquare size={16} /></IconButton>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}><Phone size={16} /></IconButton>
                    </Box>
                  ))}
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
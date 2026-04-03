import React, { useState } from 'react'
import { X, Search, UserPlus } from 'lucide-react'
import { userApi, convApi } from '@/services/api'
import { useChatStore, type Conversation } from '@/store/chatStore'
import Avatar from '@/components/ui/Avatar'
import { Box, Typography, TextField, IconButton, Button, CircularProgress, Dialog, DialogTitle, DialogContent, InputAdornment } from '@mui/material'

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
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 4,
          p: 1,
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>New Message</Typography>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search username or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} style={{ color: 'rgba(240, 240, 255, 0.35)' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 6 } }}
          />
          <Button type="submit" variant="contained" disabled={loading || !query.trim()} sx={{ borderRadius: 6 }}>
            {loading ? <CircularProgress size={20} /> : 'Find'}
          </Button>
        </form>

        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {results.length === 0 && !loading && query && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5, gap: 1 }}>
              <Typography sx={{ fontSize: 48 }}>🔍</Typography>
              <Typography variant="body2" color="text.disabled">Type a name to search</Typography>
            </Box>
          )}
          
          {results.map(u => (
            <Box
              key={u.id}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                p: 1.5, borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.08)' },
              }}
            >
              <Avatar src={u.avatar_url} name={u.display_name || u.username} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.display_name || u.username}</Typography>
                <Typography variant="caption" color="text.disabled">@{u.username}</Typography>
              </Box>
              <IconButton
                onClick={() => startChat(u)}
                sx={{ bgcolor: 'rgba(108, 99, 255, 0.1)', color: 'primary.main', '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.2)' } }}
                size="small"
              >
                <UserPlus size={18} />
              </IconButton>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
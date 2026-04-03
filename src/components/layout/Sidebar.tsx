import React from 'react'
import { MessageSquare, Phone, Star, Archive, Settings, Bell } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import Avatar from '@/components/ui/Avatar'
import { Box, IconButton, Badge, Tooltip } from '@mui/material'

type NavView = 'chats' | 'calls' | 'starred' | 'archive' | 'settings' | 'notifications'

interface Props {
  activeView: NavView
  onViewChange: (view: NavView) => void
}

export default function Sidebar({ activeView, onViewChange }: Props) {
  const { user, toggleTheme, theme } = useAuthStore()
  const { conversations } = useChatStore()

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  const navItems = [
    { id: 'chats' as NavView, icon: MessageSquare, label: 'Chats' },
    { id: 'calls' as NavView, icon: Phone, label: 'Calls' },
    { id: 'starred' as NavView, icon: Star, label: 'Starred' },
    { id: 'archive' as NavView, icon: Archive, label: 'Archive' },
    { id: 'notifications' as NavView, icon: Bell, label: 'Notifications' },
  ]

  return (
    <Box
      sx={{
        width: 72,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        gap: 0.5,
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #6C63FF, #a78bfa)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          boxShadow: '0 4px 24px rgba(108, 99, 255, 0.25)',
          fontWeight: 800,
          fontSize: 18,
          color: 'white',
        }}
        title="Chatter"
      >
        ⚡
      </Box>

      {navItems.map((item) => (
        <Tooltip key={item.id} title={item.label} placement="right">
          <IconButton
            onClick={() => onViewChange(item.id)}
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              color: activeView === item.id ? 'primary.main' : 'text.disabled',
              bgcolor: activeView === item.id ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.08)' },
            }}
          >
            <item.icon size={20} />
            {item.id === 'chats' && totalUnread > 0 && (
              <Badge
                badgeContent={totalUnread > 99 ? '99+' : totalUnread}
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  '& .MuiBadge-badge': {
                    fontSize: '0.5625rem',
                    minWidth: 16,
                    height: 16,
                  },
                }}
              />
            )}
          </IconButton>
        </Tooltip>
      ))}

      <Box sx={{ flex: 1 }} />

      <Tooltip title={theme === 'dark' ? 'Light mode' : 'Dark mode'} placement="right">
        <IconButton
          onClick={toggleTheme}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            color: 'text.secondary',
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </IconButton>
      </Tooltip>

      <Tooltip title="Settings" placement="right">
        <IconButton
          onClick={() => onViewChange('settings')}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            color: activeView === 'settings' ? 'primary.main' : 'text.secondary',
            bgcolor: activeView === 'settings' ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
          }}
        >
          <Settings size={20} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Logout" placement="right">
        <IconButton
          onClick={() => {}}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            mt: 1,
            mb: 0.5,
          }}
        >
          <Avatar
            src={user?.avatar_url}
            name={user?.display_name || user?.username}
            size="sm"
            status={user?.status as any}
          />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
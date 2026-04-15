import React from 'react'
import { MessageSquare, Phone, Star, Archive, Settings, Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import Avatar from '@/components/ui/Avatar'
import { Box, IconButton, Badge, Tooltip, Typography } from '@mui/material'

type NavView = 'chats' | 'calls' | 'starred' | 'archive' | 'settings' | 'notifications'

interface Props {
  activeView: NavView
  onViewChange: (view: NavView) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ activeView, onViewChange, collapsed, onToggleCollapse }: Props) {
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
        width: collapsed ? 72 : 220,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: collapsed ? 'center' : 'stretch',
        py: 2,
        gap: 0.5,
        flexShrink: 0,
        px: collapsed ? 0 : 1,
        transition: 'width 0.2s ease',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', px: collapsed ? 0 : 1, mb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6C63FF, #a78bfa)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(108, 99, 255, 0.25)',
            fontWeight: 800,
            fontSize: 18,
            color: 'white',
          }}
          title="Chatter"
        >
          ⚡
        </Box>
        {!collapsed && (
          <Typography variant="body1" sx={{ fontWeight: 700, ml: 1.25, flex: 1 }}>
            Chatter
          </Typography>
        )}
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <IconButton onClick={onToggleCollapse} size="small" sx={{ color: 'text.secondary' }}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </IconButton>
        </Tooltip>
      </Box>

      {navItems.map((item) => (
        <Tooltip key={item.id} title={collapsed ? item.label : ''} placement="right">
          <Box
            onClick={() => onViewChange(item.id)}
            sx={{
              width: collapsed ? 48 : '100%',
              height: 48,
              borderRadius: 2,
              px: collapsed ? 0 : 1.25,
              color: activeView === item.id ? 'primary.main' : 'text.disabled',
              bgcolor: activeView === item.id ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.25,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(108, 99, 255, 0.08)' },
            }}
          >
            <item.icon size={20} />
            {!collapsed && (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.label}
              </Typography>
            )}
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
          </Box>
        </Tooltip>
      ))}

      <Box sx={{ flex: 1 }} />

      <Tooltip title={theme === 'dark' ? 'Light mode' : 'Dark mode'} placement="right">
        <Box
          onClick={toggleTheme}
          sx={{
            width: collapsed ? 48 : '100%',
            height: 48,
            borderRadius: 2,
            color: 'text.secondary',
            px: collapsed ? 0 : 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.25,
            cursor: 'pointer',
          }}
        >
          <Box sx={{ width: 20, textAlign: 'center' }}>{theme === 'dark' ? '☀️' : '🌙'}</Box>
          {!collapsed && <Typography variant="body2">Theme</Typography>}
        </Box>
      </Tooltip>

      <Tooltip title="Settings" placement="right">
        <Box
          onClick={() => onViewChange('settings')}
          sx={{
            width: collapsed ? 48 : '100%',
            height: 48,
            borderRadius: 2,
            px: collapsed ? 0 : 1.25,
            color: activeView === 'settings' ? 'primary.main' : 'text.secondary',
            bgcolor: activeView === 'settings' ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.25,
            cursor: 'pointer',
          }}
        >
          <Settings size={20} />
          {!collapsed && <Typography variant="body2">Settings</Typography>}
        </Box>
      </Tooltip>

      <Tooltip title="Profile" placement="right">
        <Box
          onClick={() => onViewChange('settings')}
          sx={{
            width: collapsed ? 48 : '100%',
            height: 48,
            borderRadius: 2,
            mt: 1,
            mb: 0.5,
            px: collapsed ? 0 : 1.25,
            color: activeView === 'settings' ? 'primary.main' : 'text.secondary',
            bgcolor: activeView === 'settings' ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.25,
            cursor: 'pointer',
          }}
        >
          <Avatar
            src={user?.avatar_url}
            name={user?.display_name || user?.username}
            size="sm"
            status={user?.status as any}
          />
          {!collapsed && (
            <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.display_name || user?.username}
            </Typography>
          )}
        </Box>
      </Tooltip>
    </Box>
  )
}
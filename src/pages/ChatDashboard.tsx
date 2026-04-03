import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import ChatList from '@/components/layout/ChatList'
import MessagePane from '@/components/layout/MessagePane'
import SettingsPage from '@/pages/SettingsPage'
import ArchivePage from '@/pages/ArchivePage'
import { useSocket } from '@/hooks/useSocket'
import { useChatStore, type Conversation } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { Box, Typography } from '@mui/material'

type NavView = 'chats' | 'calls' | 'starred' | 'archive' | 'settings' | 'notifications'

export default function ChatDashboard() {
  const [activeView, setActiveView] = useState<NavView>('chats')
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const { setActiveConv: storeSetActiveConv } = useChatStore()
  const { theme } = useAuthStore()

  useSocket()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleConvSelect = (conv: Conversation) => {
    setActiveConv(conv)
    storeSetActiveConv(conv.id)
    setMobileShowChat(true)
  }

  const handleBack = () => {
    setMobileShowChat(false)
    setActiveConv(null)
  }

  const renderMiddlePanel = () => {
    switch (activeView) {
      case 'chats':
        return <ChatList onConvSelect={handleConvSelect} />
      case 'calls':
        return <CallsView />
      case 'starred':
        return <StarredView />
      case 'archive':
        return <ArchivePage />
      case 'notifications':
        return <NotificationsView />
      case 'settings':
        return null
      default:
        return <ChatList onConvSelect={handleConvSelect} />
    }
  }

  const renderRightPanel = () => {
    if (activeView === 'settings') {
      return <SettingsPage />
    }
    if (activeView === 'chats' || activeView === 'archive') {
      return <MessagePane conversation={activeConv} onBack={handleBack} />
    }
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <EmptyState icon="✨" title="Coming Soon" subtitle="This feature is under construction" />
      </Box>
    )
  }

  const midPanel = renderMiddlePanel()

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {midPanel && (
        <Box
          sx={{
            display: mobileShowChat ? 'none' : 'flex',
            flexDirection: 'column',
            width: 320,
            flexShrink: 0,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          {midPanel}
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          minWidth: 0,
          bgcolor: 'background.default',
          ...(mobileShowChat ? {} : { display: { xs: 'none', md: 'flex' } }),
        }}
      >
        {renderRightPanel()}
      </Box>

      <MobileBottomNav activeView={activeView} onViewChange={(v) => { setActiveView(v); setMobileShowChat(false) }} />
    </Box>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 5, textAlign: 'center', color: 'text.disabled' }}>
      <Typography sx={{ fontSize: 48, animation: 'float 3s ease-in-out infinite' }}>{icon}</Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 700 }}>{title}</Typography>
      <Typography variant="body2">{subtitle}</Typography>
    </Box>
  )
}

function MobileBottomNav({ activeView, onViewChange }: { activeView: NavView; onViewChange: (v: NavView) => void }) {
  const items = [
    { id: 'chats' as NavView, icon: '💬', label: 'Chats' },
    { id: 'calls' as NavView, icon: '📞', label: 'Calls' },
    { id: 'archive' as NavView, icon: '📦', label: 'Archive' },
    { id: 'settings' as NavView, icon: '⚙️', label: 'Settings' },
  ]

  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 1,
        px: 'env(safe-area-inset-left)',
      }}
    >
      {items.map((item) => (
        <Box
          key={item.id}
          onClick={() => onViewChange(item.id)}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.375,
            py: 0.75,
            color: activeView === item.id ? 'primary.main' : 'text.disabled',
            cursor: 'pointer',
          }}
        >
          <Typography sx={{ fontSize: 20 }}>{item.icon}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>{item.label}</Typography>
        </Box>
      ))}
    </Box>
  )
}

function CallsView() {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Calls</Typography>
      </Box>
      <EmptyState icon="📞" title="No recent calls" subtitle="Start a call from a chat" />
    </Box>
  )
}

function StarredView() {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Starred</Typography>
      </Box>
      <EmptyState icon="⭐" title="No starred messages" subtitle="Star important messages to find them here" />
    </Box>
  )
}

function NotificationsView() {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Notifications</Typography>
      </Box>
      <EmptyState icon="🔔" title="All caught up!" subtitle="No new notifications" />
    </Box>
  )
}
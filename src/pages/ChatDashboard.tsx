import React, { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import ChatList from '@/components/layout/ChatList'
import MessagePane from '@/components/layout/MessagePane'
import SettingsPage from '@/pages/SettingsPage'
import ArchivePage from '@/pages/ArchivePage'
import { useSocket } from '@/hooks/useSocket'
import { useChatStore, type Conversation } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'

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
      <div className="message-pane">
        <div className="empty-state">
          <div className="empty-state-icon">✨</div>
          <div className="empty-state-title">Coming Soon</div>
          <div className="empty-state-sub">This feature is under construction</div>
        </div>
      </div>
    )
  }

  const midPanel = renderMiddlePanel()

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {midPanel && (
        <div
          style={{
            display: mobileShowChat ? 'none' : 'flex',
            flexDirection: 'column',
            width: 'var(--sidebar-list-width)',
            flexShrink: 0,
          }}
          className="chat-list-sidebar"
        >
          {midPanel}
        </div>
      )}

      <div
        className={`message-pane ${mobileShowChat ? 'visible' : ''}`}
        style={{ flex: 1, display: 'flex', minWidth: 0 }}
      >
        {renderRightPanel()}
      </div>

      <div className="mobile-bottom-nav">
        {([
          { id: 'chats' as NavView, icon: '💬', label: 'Chats' },
          { id: 'calls' as NavView, icon: '📞', label: 'Calls' },
          { id: 'archive' as NavView, icon: '📦', label: 'Archive' },
          { id: 'settings' as NavView, icon: '⚙️', label: 'Settings' },
        ] as const).map((item) => (
          <div
            key={item.id}
            className={`mobile-nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => { setActiveView(item.id); setMobileShowChat(false) }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CallsView() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Calls</h1>
      </div>
      <div className="empty-state" style={{ flex: 1 }}>
        <div className="empty-state-icon">📞</div>
        <div className="empty-state-title">No recent calls</div>
        <div className="empty-state-sub">Start a call from a chat</div>
      </div>
    </div>
  )
}

function StarredView() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Starred</h1>
      </div>
      <div className="empty-state" style={{ flex: 1 }}>
        <div className="empty-state-icon">⭐</div>
        <div className="empty-state-title">No starred messages</div>
        <div className="empty-state-sub">Star important messages to find them here</div>
      </div>
    </div>
  )
}

function NotificationsView() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Notifications</h1>
      </div>
      <div className="empty-state" style={{ flex: 1 }}>
        <div className="empty-state-icon">🔔</div>
        <div className="empty-state-title">All caught up!</div>
        <div className="empty-state-sub">No new notifications</div>
      </div>
    </div>
  )
}

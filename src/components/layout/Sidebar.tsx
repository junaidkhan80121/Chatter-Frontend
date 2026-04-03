import React, { useEffect, useRef } from 'react'
import { MessageSquare, Phone, Star, Archive, Settings, HelpCircle, Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import Avatar from '@/components/ui/Avatar'
import { disconnectSocket } from '@/services/socket'
import { useNavigate } from 'react-router-dom'

type NavView = 'chats' | 'calls' | 'starred' | 'archive' | 'settings' | 'notifications'

interface Props {
  activeView: NavView
  onViewChange: (view: NavView) => void
}

export default function Sidebar({ activeView, onViewChange }: Props) {
  const { user, logout, toggleTheme, theme } = useAuthStore()
  const { conversations } = useChatStore()
  const navigate = useNavigate()

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  const handleLogout = () => {
    disconnectSocket()
    logout()
    navigate('/auth')
  }

  const navItems = [
    { id: 'chats' as NavView, icon: MessageSquare, label: 'Chats' },
    { id: 'calls' as NavView, icon: Phone, label: 'Calls' },
    { id: 'starred' as NavView, icon: Star, label: 'Starred' },
    { id: 'archive' as NavView, icon: Archive, label: 'Archive' },
    { id: 'notifications' as NavView, icon: Bell, label: 'Notifications' },
  ]

  return (
    <nav className="nav-sidebar">
      {/* Logo */}
      <div className="nav-logo" title="PulseChat">⚡</div>

      {/* Nav items */}
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activeView === item.id ? 'active' : ''}`}
          onClick={() => onViewChange(item.id)}
          title={item.label}
        >
          <item.icon size={20} />
          {item.id === 'chats' && totalUnread > 0 && (
            <span className="badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
          )}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button
        className="nav-item"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Settings */}
      <button
        className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
        onClick={() => onViewChange('settings')}
        title="Settings"
      >
        <Settings size={20} />
      </button>

      {/* User avatar */}
      <button
        className="nav-item"
        onClick={handleLogout}
        title="Logout"
        style={{ marginTop: 8, marginBottom: 4 }}
      >
        <Avatar
          src={user?.avatar_url}
          name={user?.display_name || user?.username}
          size="sm"
          status={user?.status as any}
        />
      </button>
    </nav>
  )
}

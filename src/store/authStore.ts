import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  email: string
  display_name: string | null
  avatar_url: string | null
  unique_share_id: string | null
  status: string
  show_online_status: boolean
  allow_messages_from: string
  read_receipts_enabled: boolean
  two_factor_enabled: boolean
  last_seen: string | null
  created_at: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  theme: 'dark' | 'light'
  messageNotificationsEnabled: boolean
  callSoundsEnabled: boolean
  messagePreviewEnabled: boolean
  autoDownloadMedia: boolean
  lowDataMode: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
  toggleTheme: () => void
  updatePreferences: (updates: Partial<Pick<AuthState, 'messageNotificationsEnabled' | 'callSoundsEnabled' | 'messagePreviewEnabled' | 'autoDownloadMedia' | 'lowDataMode'>>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      theme: 'dark',
      messageNotificationsEnabled: true,
      callSoundsEnabled: true,
      messagePreviewEnabled: true,
      autoDownloadMedia: true,
      lowDataMode: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({ user, accessToken, refreshToken, isAuthenticated: true })
      },

      updateUser: (updates) => {
        const current = get().user
        if (current) set({ user: { ...current, ...updates } })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.setAttribute('data-theme', next)
      },

      updatePreferences: (updates) => set(updates),
    }),
    {
      name: 'pulse-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        messageNotificationsEnabled: state.messageNotificationsEnabled,
        callSoundsEnabled: state.callSoundsEnabled,
        messagePreviewEnabled: state.messagePreviewEnabled,
        autoDownloadMedia: state.autoDownloadMedia,
        lowDataMode: state.lowDataMode,
      }),
    }
  )
)

import React, { useState } from 'react'
import {
  Bell, Shield, Eye, MessageSquare, Trash2,
  ChevronRight, Sun, Moon, Database, UserCircle,
  Camera, LogOut
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '@/services/api'
import Avatar from '@/components/ui/Avatar'
import { Box, Typography, Switch, IconButton, Button } from '@mui/material'

export default function SettingsPage() {
  const { user, updateUser, toggleTheme, theme } = useAuthStore()
  const [saving, setSaving] = useState(false)

  const updateSetting = async (key: string, value: unknown) => {
    setSaving(true)
    try {
      const res = await userApi.updateMe({ [key]: value })
      updateUser(res.data)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Settings</Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <Box sx={{ p: 2.5, pb: 0 }}>
          <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 2.5, display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar src={user.avatar_url} name={user.display_name || user.username} size="xl" status={user.status as any} />
              <Box
                component="label"
                sx={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 24, height: 24, borderRadius: '50%',
                  bgcolor: 'primary.main', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid',
                  borderColor: 'background.default',
                  '&:hover': { bgcolor: 'primary.light' },
                }}
              >
                <Camera size={12} />
                <input type="file" hidden accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const res = await userApi.uploadAvatar(file)
                    updateUser(res.data)
                  }
                }} />
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>{user.display_name || user.username}</Typography>
              <Typography variant="body2" color="text.disabled">@{user.username}</Typography>
              <Box sx={{ mt: 0.75, display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: 'success.main', color: 'white', fontSize: 10, fontWeight: 700, px: 1, borderRadius: '9999px' }}>
                <Box sx={{ width: 6, height: 6, bgcolor: 'white', borderRadius: '50%' }} />
                ACTIVE STATUS ON
              </Box>
            </Box>
            <Button variant="outlined" size="small" sx={{ borderColor: 'primary.main', color: 'primary.main', borderRadius: '9999px', fontSize: 10, fontWeight: 600, px: 1.25 }}>
              Edit Profile
            </Button>
          </Box>

          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
            Your ID: <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{user.unique_share_id}</Box>
          </Typography>
        </Box>

        <Box sx={{ py: 1 }}>
          <Typography variant="caption" sx={{ px: 2.5, py: 1, display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled' }}>
            Privacy
          </Typography>

          <SettingsItem
            icon={<Eye size={18} />}
            title="Last Seen"
            subtitle={user.show_online_status ? 'Everyone' : 'Nobody'}
            action={
              <Switch
                checked={user.show_online_status}
                onChange={(e) => updateSetting('show_online_status', e.target.checked)}
                size="small"
              />
            }
          />

          <SettingsItem
            icon={<MessageSquare size={18} />}
            title="Read Receipts"
            subtitle={user.read_receipts_enabled ? "If turned off, you won't see them either" : 'Disabled'}
            action={
              <Switch
                checked={user.read_receipts_enabled}
                onChange={(e) => updateSetting('read_receipts_enabled', e.target.checked)}
                size="small"
              />
            }
          />

          <SettingsItem
            icon={<UserCircle size={18} />}
            title="Who can see my info"
            subtitle="My Contacts"
            action={<ChevronRight size={16} style={{ color: 'rgba(240, 240, 255, 0.35)' }} />}
          />

          <SettingsItem
            icon={<MessageSquare size={18} />}
            title="Who can message me"
            subtitle={user.allow_messages_from}
            action={<ChevronRight size={16} style={{ color: 'rgba(240, 240, 255, 0.35)' }} />}
          />
        </Box>

        <Box sx={{ py: 1 }}>
          <Typography variant="caption" sx={{ px: 2.5, py: 1, display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled' }}>
            Security
          </Typography>

          <SettingsItem
            icon={<Shield size={18} />}
            title="Two-step verification"
            subtitle="Additional layer of protection"
            action={
              <Box sx={{ fontSize: 11, fontWeight: 700, px: 1.25, py: 0.375, borderRadius: '9999px', bgcolor: user.two_factor_enabled ? 'rgba(67,217,163,0.15)' : 'rgba(108, 99, 255, 0.1)', color: user.two_factor_enabled ? 'success.main' : 'primary.main', border: '1px solid', borderColor: user.two_factor_enabled ? 'rgba(67,217,163,0.4)' : 'rgba(108, 99, 255, 0.3)' }}>
                {user.two_factor_enabled ? 'ENABLED' : 'ENABLE'}
              </Box>
            }
          />
        </Box>

        <Box sx={{ py: 1 }}>
          <Typography variant="caption" sx={{ px: 2.5, py: 1, display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.disabled' }}>
            App Settings
          </Typography>

          <SettingsItem
            icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            title="Theme & Appearance"
            subtitle={theme + ' mode'}
            action={<ChevronRight size={16} style={{ color: 'rgba(240, 240, 255, 0.35)' }} />}
            onClick={toggleTheme}
          />

          <SettingsItem
            icon={<Bell size={18} />}
            title="Notifications"
            action={<ChevronRight size={16} style={{ color: 'rgba(240, 240, 255, 0.35)' }} />}
          />

          <SettingsItem
            icon={<Database size={18} />}
            title="Storage and Data"
            action={<ChevronRight size={16} style={{ color: 'rgba(240, 240, 255, 0.35)' }} />}
          />
        </Box>

        <Box sx={{ py: 1, pb: 3 }}>
          <SettingsItem
            icon={<Trash2 size={18} />}
            title="Delete Account"
            iconColor="error.main"
            titleColor="error.main"
            action={<ChevronRight size={16} style={{ color: 'rgba(240, 240, 255, 0.35)' }} />}
            onClick={() => {
              if (confirm('Are you sure you want to delete your account?')) {
                // handle delete
              }
            }}
          />
        </Box>

        <Box sx={{ textAlign: 'center', py: 1, pb: 3, color: 'text.disabled' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>The Fluid Dialogue</Typography>
          <Typography variant="caption">Version 2.4.0-premium</Typography>
        </Box>
      </Box>
    </Box>
  )
}

function SettingsItem({
  icon,
  title,
  subtitle,
  action,
  onClick,
  iconColor = 'primary.main',
  titleColor = 'text.primary',
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  onClick?: () => void
  iconColor?: string
  titleColor?: string
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2.5, py: 1.75,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { bgcolor: 'rgba(108, 99, 255, 0.08)' } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 1,
          bgcolor: 'rgba(108, 99, 255, 0.1)',
          color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, color: titleColor }}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.disabled">{subtitle}</Typography>}
        </Box>
      </Box>
      {action}
    </Box>
  )
}
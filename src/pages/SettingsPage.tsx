import React, { useState, useEffect } from 'react'
import {
  Bell, Shield, Eye, EyeOff, MessageSquare, Trash2,
  ChevronRight, Check, Sun, Moon, Database, UserCircle,
  Camera, Edit2, LogOut
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { userApi } from '@/services/api'
import Avatar from '@/components/ui/Avatar'

export default function SettingsPage() {
  const { user, updateUser, logout, toggleTheme, theme } = useAuthStore()
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Settings</div>
      </div>

      <div className="settings-page">
        {/* Profile card */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex', alignItems: 'center', gap: 16,
            marginBottom: 8
          }}>
            <div style={{ position: 'relative' }}>
              <Avatar
                src={user.avatar_url}
                name={user.display_name || user.username}
                size="xl"
                status={user.status as any}
              />
              <label style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--primary)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg-elevated)'
              }}>
                <Camera size={12} color="white" />
                <input type="file" hidden accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const res = await userApi.uploadAvatar(file)
                    updateUser(res.data)
                  }
                }} />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user.display_name || user.username}</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>@{user.username}</div>
              <div style={{
                marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--accent-teal)', color: 'white',
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)'
              }}>
                <span style={{ width: 6, height: 6, background: 'white', borderRadius: '50%', display: 'inline-block' }} />
                ACTIVE STATUS ON
              </div>
            </div>
            <div style={{
              background: 'var(--primary-subtle)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              fontSize: 10, fontWeight: 600, padding: '4px 10px',
              borderRadius: 'var(--radius-full)', cursor: 'pointer'
            }}>
              Edit Profile
            </div>
          </div>

          <div style={{
            fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 8
          }}>
            Your ID: <strong style={{ color: 'var(--primary)' }}>{user.unique_share_id}</strong>
          </div>
        </div>

        {/* Privacy section */}
        <div className="settings-section">
          <div className="settings-section-title">Privacy</div>

          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-icon"><Eye size={18} /></div>
              <div>
                <div className="settings-item-title">Last Seen</div>
                <div className="settings-item-subtitle">
                  {user.show_online_status ? 'Everyone' : 'Nobody'}
                </div>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={user.show_online_status}
                onChange={(e) => updateSetting('show_online_status', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-icon"><Check size={18} /></div>
              <div>
                <div className="settings-item-title">Read Receipts</div>
                <div className="settings-item-subtitle">
                  {user.read_receipts_enabled ? "If turned off, you won't see them either" : 'Disabled'}
                </div>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={user.read_receipts_enabled}
                onChange={(e) => updateSetting('read_receipts_enabled', e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-icon"><UserCircle size={18} /></div>
              <div>
                <div className="settings-item-title">Who can see my info</div>
                <div className="settings-item-subtitle">My Contacts</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>

          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-icon"><MessageSquare size={18} /></div>
              <div>
                <div className="settings-item-title">Who can message me</div>
                <div className="settings-item-subtitle" style={{ textTransform: 'capitalize' }}>
                  {user.allow_messages_from}
                </div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>

        {/* Security section */}
        <div className="settings-section">
          <div className="settings-section-title">Security</div>

          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-icon" style={{ background: 'var(--primary-subtle)' }}>
                <Shield size={18} />
              </div>
              <div>
                <div className="settings-item-title">Two-step verification</div>
                <div className="settings-item-subtitle">Additional layer of protection</div>
              </div>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: user.two_factor_enabled ? 'rgba(67,217,163,0.15)' : 'var(--primary-subtle)',
              color: user.two_factor_enabled ? 'var(--accent-teal)' : 'var(--primary)',
              border: `1px solid ${user.two_factor_enabled ? 'rgba(67,217,163,0.4)' : 'var(--border-primary)'}`
            }}>
              {user.two_factor_enabled ? 'ENABLED' : 'ENABLE'}
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div className="settings-section">
          <div className="settings-section-title">App Settings</div>

          <div className="settings-item" onClick={toggleTheme}>
            <div className="settings-item-left">
              <div className="settings-icon">
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <div className="settings-item-title">Theme & Appearance</div>
                <div className="settings-item-subtitle" style={{ textTransform: 'capitalize' }}>
                  {theme} mode
                </div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>

          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-icon"><Bell size={18} /></div>
              <div>
                <div className="settings-item-title">Notifications</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>

          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-icon"><Database size={18} /></div>
              <div>
                <div className="settings-item-title">Storage and Data</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>

        {/* Danger zone */}
        <div className="settings-section" style={{ paddingBottom: 24 }}>
          <div className="settings-item" onClick={() => {
            if (confirm('Are you sure you want to delete your account?')) {
              // handle delete
            }
          }}>
            <div className="settings-item-left">
              <div className="settings-icon danger"><Trash2 size={18} /></div>
              <div>
                <div className="settings-item-title" style={{ color: 'var(--accent-pink)' }}>Delete Account</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '8px 20px 24px', color: 'var(--text-tertiary)' }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>The Fluid Dialogue</div>
          <div style={{ fontSize: 11 }}>Version 2.4.0-premium</div>
        </div>
      </div>
    </div>
  )
}

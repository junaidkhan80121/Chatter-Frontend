import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/api'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [devOtp, setDevOtp] = useState('')

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [otp, setOtp] = useState('')

  const { setAuth, isAuthenticated, theme, toggleTheme } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/')
  }, [isAuthenticated])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'otp') {
        if (!otpStep) {
          const res = await authApi.requestOtp(email)
          setOtpStep(true)
          setDevOtp(res.data.dev_otp || '')
        } else {
          const res = await authApi.verifyOtp(email, otp)
          setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
          navigate('/')
        }
      } else if (tab === 'login') {
        const res = await authApi.login({ email, password })
        setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
        navigate('/')
      } else {
        const res = await authApi.register({ email, password, username, display_name: displayName || username })
        setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
        navigate('/')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={{ position: 'relative' }}>
      {/* Theme Toggle */}
      <button 
        className="icon-btn" 
        onClick={toggleTheme}
        style={{ position: 'absolute', top: 20, right: 20 }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <div className="auth-logo-name">Chatter</div>
          <div className="auth-tagline">The Fluid Dialogue</div>
        </div>

        {/* Tabs */}
        {mode === 'password' && !otpStep && (
          <div className="auth-tabs">
            <div
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError('') }}
            >
              Sign In
            </div>
            <div
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); setError('') }}
            >
              Sign Up
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* OTP Mode */}
          {mode === 'otp' ? (
            <>
              {!otpStep ? (
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Enter OTP</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    style={{ letterSpacing: '0.3em', fontSize: '20px', textAlign: 'center' }}
                    required
                    autoFocus
                  />
                  {devOtp && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--primary-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--primary)' }}>
                      🔑 Dev OTP: <strong>{devOtp}</strong>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {tab === 'register' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      className="input-field"
                      type="text"
                      placeholder="john_doe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Display Name (optional)</label>
                    <input
                      className="input-field"
                      type="text"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (
              mode === 'otp'
                ? (otpStep ? 'Verify OTP' : 'Send OTP')
                : tab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle OTP */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setMode(m => m === 'password' ? 'otp' : 'password'); setOtpStep(false); setError('') }}
          >
            {mode === 'password' ? '🔑 Sign in with OTP instead' : '🔒 Use password instead'}
          </button>
        </div>

        {/* Quick Dev Bypass */}
        <div style={{ textAlign: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: '#00D1A1' }}
            onClick={() => {
              setAuth(
                { id: '1', username: 'dummy_user', email: 'dummy@example.com', display_name: 'Dummy Tester', status: 'online', avatar_url: null, unique_share_id: 'dummy-123', show_online_status: true, allow_messages_from: 'everyone', read_receipts_enabled: true, created_at: new Date().toISOString(), two_factor_enabled: false, last_seen: null },
                'dummy_access_token',
                'dummy_refresh_token'
              );
              navigate('/');
            }}
          >
            🚀 Quick Dev Login (Bypass Database)
          </button>
        </div>
      </div>
    </div>
  )
}

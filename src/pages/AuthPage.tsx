import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  InputAdornment,
  Alert,
  Divider,
} from '@mui/material'
import { themeColors } from '@/theme'

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [devOtp, setDevOtp] = useState('')

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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2.5,
        overflow: 'auto',
      }}
    >
      <IconButton
        onClick={toggleTheme}
        sx={{ position: 'absolute', top: 20, right: 20, color: 'text.secondary' }}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </IconButton>

      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          p: 5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${themeColors.primary}, #a78bfa)`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              mb: 1.5,
              boxShadow: themeColors.primaryGlow,
            }}
          >
            ⚡
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, background: `linear-gradient(135deg, ${themeColors.primary}, #a78bfa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Chatter
          </Typography>
          <Typography variant="body2" color="text.disabled">
            The Fluid Dialogue
          </Typography>
        </Box>

        {mode === 'password' && !otpStep && (
          <ToggleButtonGroup
            value={tab}
            exclusive
            onChange={(_, v) => v && (setTab(v), setError(''))}
            fullWidth
            sx={{
              mb: 3.5,
              '& .MuiToggleButton-root': {
                borderRadius: '9999px !important',
                textTransform: 'none',
                fontWeight: 500,
                px: 2,
                py: 1,
                color: 'text.secondary',
                border: 'none',
                bgcolor: 'rgba(255,255,255,0.06)',
                '&.Mui-selected': {
                  bgcolor: themeColors.primary,
                  color: 'white',
                  boxShadow: '0 4px 24px rgba(108, 99, 255, 0.25)',
                },
              },
            }}
          >
            <ToggleButton value="login">Sign In</ToggleButton>
            <ToggleButton value="register">Sign Up</ToggleButton>
          </ToggleButtonGroup>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'otp' ? (
            <>
              {!otpStep ? (
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
              ) : (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Enter OTP"
                    type="text"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    inputProps={{ maxLength: 6, style: { letterSpacing: '0.3em', textAlign: 'center', fontSize: 20 } }}
                    required
                    autoFocus
                  />
                  {devOtp && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: themeColors.primarySubtle, borderRadius: 1, fontSize: 12, color: themeColors.primary }}>
                      🔑 Dev OTP: <strong>{devOtp}</strong>
                    </Box>
                  )}
                </Box>
              )}
            </>
          ) : (
            <>
              {tab === 'register' && (
                <>
                  <TextField
                    fullWidth
                    label="Username"
                    placeholder="john_doe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Display Name (optional)"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </>
              )}
              <TextField
                fullWidth
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
            </>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 1, py: 1.25 }}
          >
            {loading ? 'Loading...' : (
              mode === 'otp'
                ? (otpStep ? 'Verify OTP' : 'Send OTP')
                : tab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 2.5 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => { setMode(m => m === 'password' ? 'otp' : 'password'); setOtpStep(false); setError('') }}
          >
            {mode === 'password' ? '🔑 Sign in with OTP instead' : '🔒 Use password instead'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button
            variant="text"
            size="small"
            sx={{ color: '#00D1A1' }}
            onClick={() => {
              setAuth(
                { id: 'dev-user-1', username: 'tester_1', email: 't1@example.com', display_name: 'Alex (User 1)', status: 'online', avatar_url: null, unique_share_id: 'dummy-123', show_online_status: true, allow_messages_from: 'everyone', read_receipts_enabled: true, created_at: new Date().toISOString(), two_factor_enabled: false, last_seen: null },
                'dummy_token_1',
                'refresh_1'
              );
              navigate('/');
            }}
          >
            🚀 Login User 1
          </Button>
          
          <Button
            variant="text"
            size="small"
            sx={{ color: '#FFB830' }}
            onClick={() => {
              setAuth(
                { id: 'dev-user-2', username: 'tester_2', email: 't2@example.com', display_name: 'Sam (User 2)', status: 'online', avatar_url: null, unique_share_id: 'dummy-456', show_online_status: true, allow_messages_from: 'everyone', read_receipts_enabled: true, created_at: new Date().toISOString(), two_factor_enabled: false, last_seen: null },
                'dummy_token_2',
                'refresh_2'
              );
              navigate('/');
            }}
          >
            🚀 Login User 2
          </Button>
        </Box>
      </Card>
    </Box>
  )
}
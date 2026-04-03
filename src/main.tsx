import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from './App'
import { createAppTheme } from './theme'
import { useAuthStore } from '@/store/authStore'
import './index.css'

function ThemedApp() {
  const { theme } = useAuthStore()
  const muiTheme = createAppTheme(theme)

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>
)
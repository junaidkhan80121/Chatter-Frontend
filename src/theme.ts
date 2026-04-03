import { createTheme, ThemeOptions } from '@mui/material/styles'

const darkPalette = {
  primary: {
    main: '#6C63FF',
    light: '#8B85FF',
    dark: '#5248E8',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#a78bfa',
    light: '#c4b5fd',
    dark: '#8b5cf6',
  },
  error: {
    main: '#FF6584',
  },
  success: {
    main: '#43D9A3',
  },
  warning: {
    main: '#FFB830',
  },
  background: {
    default: '#0D0D1A',
    paper: '#13131F',
  },
  text: {
    primary: '#F0F0FF',
    secondary: 'rgba(240, 240, 255, 0.6)',
    disabled: 'rgba(240, 240, 255, 0.35)',
  },
  divider: 'rgba(255, 255, 255, 0.08)',
}

const lightPalette = {
  primary: {
    main: '#6C63FF',
    light: '#8B85FF',
    dark: '#5248E8',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#a78bfa',
    light: '#c4b5fd',
    dark: '#8b5cf6',
  },
  error: {
    main: '#FF6584',
  },
  success: {
    main: '#43D9A3',
  },
  warning: {
    main: '#FFB830',
  },
  background: {
    default: '#F0F0FA',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#0D0D1A',
    secondary: 'rgba(13, 13, 26, 0.6)',
    disabled: 'rgba(13, 13, 26, 0.35)',
  },
  divider: 'rgba(0, 0, 0, 0.08)',
}

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'dark' ? darkPalette : lightPalette),
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '4px', height: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '2px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 9999,
          padding: '10px 20px',
        },
        contained: {
          boxShadow: '0 4px 24px rgba(108, 99, 255, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 32px rgba(108, 99, 255, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.15)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '50%',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        },
        elevation2: {
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(108, 99, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6C63FF',
              boxShadow: '0 0 0 3px rgba(108, 99, 255, 0.1)',
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(108, 99, 255, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1B1B2E',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 8,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 700,
          fontSize: '0.625rem',
        },
      },
    },
  },
})

export const createAppTheme = (mode: 'light' | 'dark') => createTheme(getDesignTokens(mode))

export const themeColors = {
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#5248E8',
  primaryGlow: 'rgba(108, 99, 255, 0.3)',
  primarySubtle: 'rgba(108, 99, 255, 0.1)',
  accentPink: '#FF6584',
  accentTeal: '#43D9A3',
  accentAmber: '#FFB830',
}
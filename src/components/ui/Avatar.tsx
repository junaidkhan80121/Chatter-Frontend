import React from 'react'
import { Box, Avatar as MuiAvatar, Badge } from '@mui/material'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  status?: 'online' | 'offline' | 'away' | null
  className?: string
}

const SIZES = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
  xxl: 80,
}

const FONT_SIZES = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 26,
}

const GRADIENT_COLORS = [
  'linear-gradient(135deg, #6C63FF, #a78bfa)',
  'linear-gradient(135deg, #FF6584, #f472b6)',
  'linear-gradient(135deg, #43D9A3, #34d399)',
  'linear-gradient(135deg, #FFB830, #f59e0b)',
  'linear-gradient(135deg, #3B82F6, #60a5fa)',
  'linear-gradient(135deg, #EC4899, #f472b6)',
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getGradient(name: string): string {
  const idx = name.charCodeAt(0) % GRADIENT_COLORS.length
  return GRADIENT_COLORS[idx]
}

function getStatusColor(status: string | null): 'success' | 'default' | 'warning' {
  if (status === 'online') return 'success'
  if (status === 'away') return 'warning'
  return 'default'
}

export default function Avatar({ src, name, size = 'md', status, className = '' }: AvatarProps) {
  const displayName = name || '?'
  const pixelSize = SIZES[size]
  const fontSize = FONT_SIZES[size]

  return (
    <Box sx={{ position: 'relative', flexShrink: 0 }}>
      {src ? (
        <MuiAvatar
          src={src}
          alt={displayName}
          sx={{
            width: pixelSize,
            height: pixelSize,
            objectFit: 'cover',
          }}
          imgProps={{
            onError: (e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            },
          }}
        />
      ) : (
        <MuiAvatar
          sx={{
            width: pixelSize,
            height: pixelSize,
            background: getGradient(displayName),
            fontSize,
            fontWeight: 600,
            color: 'white',
          }}
        >
          {getInitials(displayName)}
        </MuiAvatar>
      )}
      {status && (
        <Badge
          variant="dot"
          color={getStatusColor(status)}
          sx={{
            position: 'absolute',
            bottom: 1,
            right: 1,
            '& .MuiBadge-badge': {
              width: 10,
              height: 10,
              border: '2px solid',
              borderColor: 'background.paper',
            },
          }}
        />
      )}
    </Box>
  )
}
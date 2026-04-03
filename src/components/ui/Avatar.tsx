import React from 'react'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  status?: 'online' | 'offline' | 'away' | null
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const GRADIENT_COLORS = [
  'linear-gradient(135deg, #6C63FF, #a78bfa)',
  'linear-gradient(135deg, #FF6584, #f472b6)',
  'linear-gradient(135deg, #43D9A3, #34d399)',
  'linear-gradient(135deg, #FFB830, #f59e0b)',
  'linear-gradient(135deg, #3B82F6, #60a5fa)',
  'linear-gradient(135deg, #EC4899, #f472b6)',
]

function getGradient(name: string): string {
  const idx = name.charCodeAt(0) % GRADIENT_COLORS.length
  return GRADIENT_COLORS[idx]
}

export default function Avatar({ src, name, size = 'md', status, className = '' }: AvatarProps) {
  const displayName = name || '?'

  return (
    <div className={`avatar-wrapper ${className}`}>
      {src ? (
        <img
          src={src}
          alt={displayName}
          className={`avatar avatar-${size}`}
          style={{ display: 'block' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div
          className={`avatar avatar-${size}`}
          style={{ background: getGradient(displayName) }}
        >
          {getInitials(displayName)}
        </div>
      )}
      {status && (
        <span className={`status-dot status-${status}`} />
      )}
    </div>
  )
}

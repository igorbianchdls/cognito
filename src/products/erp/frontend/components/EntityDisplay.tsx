import React from 'react'

type EntityDisplayProps = {
  name?: string
  subtitle?: string
  imageUrl?: string
  onClick?: () => void
  clickable?: boolean
  size?: number // avatar size in px (default 24)
}

const getGradientFromName = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const gradients = [
    { from: '#4f46e5', to: '#06b6d4', text: '#ffffff' },
    { from: '#2563eb', to: '#14b8a6', text: '#ffffff' },
    { from: '#0ea5e9', to: '#6366f1', text: '#ffffff' },
    { from: '#16a34a', to: '#0ea5e9', text: '#ffffff' },
    { from: '#7c3aed', to: '#ec4899', text: '#ffffff' },
    { from: '#db2777', to: '#f97316', text: '#ffffff' },
    { from: '#ea580c', to: '#eab308', text: '#ffffff' },
    { from: '#0891b2', to: '#3b82f6', text: '#ffffff' },
  ]

  const index = Math.abs(hash) % gradients.length
  return gradients[index]
}

export default function EntityDisplay({ name, subtitle, imageUrl, onClick, clickable, size = 24 }: EntityDisplayProps) {
  const displayName = name || 'Sem nome'
  const gradient = getGradientFromName(displayName)
  const avatarSize = Number.isFinite(size) && size > 8 ? size : 24
  const radius = Math.round(avatarSize / 3)
  const initialFont = Math.max(10, Math.round(avatarSize * 0.5))

  const content = (
    <div className="flex items-center">
      <div
        className="flex items-center justify-center mr-3"
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          backgroundColor: gradient.from,
          cursor: clickable || onClick ? 'pointer' : undefined,
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div style={{ fontSize: initialFont, fontWeight: 600, color: gradient.text, lineHeight: 1 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{displayName}</div>
        {subtitle && (
          <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{subtitle}</div>
        )}
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-left w-full"
        style={{ background: 'none', border: 'none', padding: 0 }}
      >
        {content}
      </button>
    )
  }

  return content
}

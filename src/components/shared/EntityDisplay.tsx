import React from 'react'

type EntityDisplayProps = {
  name?: string
  subtitle?: string
  imageUrl?: string
  onClick?: () => void
  clickable?: boolean
  size?: number
}

function getColorFromName(name: string) {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash)
  }

  const colors = [
    { bg: '#DBEAFE', text: '#1E40AF' },
    { bg: '#DCFCE7', text: '#15803D' },
    { bg: '#FEF3C7', text: '#B45309' },
    { bg: '#FCE7F3', text: '#BE185D' },
    { bg: '#E0E7FF', text: '#4338CA' },
    { bg: '#FED7AA', text: '#C2410C' },
    { bg: '#E9D5FF', text: '#7C3AED' },
    { bg: '#D1FAE5', text: '#047857' },
  ] as const

  return colors[Math.abs(hash) % colors.length]
}

export default function EntityDisplay({
  name,
  subtitle,
  imageUrl,
  onClick,
  clickable,
  size = 24,
}: EntityDisplayProps) {
  const displayName = name || 'Sem nome'
  const colors = getColorFromName(displayName)
  const avatarSize = Number.isFinite(size) && size > 8 ? size : 24
  const radius = Math.round(avatarSize / 3)
  const initialFont = Math.max(10, Math.round(avatarSize * 0.5))

  const content = (
    <div className="flex items-center">
      <div
        className="mr-3 flex items-center justify-center"
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: colors.bg,
          cursor: clickable || onClick ? 'pointer' : undefined,
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div style={{ fontSize: initialFont, fontWeight: 600, color: colors.text, lineHeight: 1 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{displayName}</div>
        {subtitle ? (
          <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{subtitle}</div>
        ) : null}
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left"
        style={{ background: 'none', border: 'none', padding: 0 }}
      >
        {content}
      </button>
    )
  }

  return content
}

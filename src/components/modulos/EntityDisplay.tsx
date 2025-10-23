import React from 'react'

type EntityDisplayProps = {
  name?: string
  subtitle?: string
  imageUrl?: string
}

const getColorFromName = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
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
  ]

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export default function EntityDisplay({ name, subtitle, imageUrl }: EntityDisplayProps) {
  const displayName = name || 'Sem nome'
  const colors = getColorFromName(displayName)

  return (
    <div className="flex items-center">
      <div
        className="flex items-center justify-center mr-3"
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: colors.bg,
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{displayName}</div>
        {subtitle && (
          <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}

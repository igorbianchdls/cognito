'use client'

import * as React from 'react'

export function EditableComponentOverlay({
  children,
  onEdit,
  buttonLabel = 'Editar',
  forceVisible = false,
}: {
  children: React.ReactNode
  onEdit: () => void
  buttonLabel?: string
  forceVisible?: boolean
}) {
  const [isHovered, setIsHovered] = React.useState(false)
  const isVisible = forceVisible || isHovered

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {children}

      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 3,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-4px)',
          pointerEvents: isVisible ? 'auto' : 'none',
          transition: 'opacity 160ms ease, transform 160ms ease',
        }}
      >
        <button
          type="button"
          onClick={onEdit}
          style={{
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: 'rgba(255, 255, 255, 0.94)',
            color: '#0f172a',
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1,
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}

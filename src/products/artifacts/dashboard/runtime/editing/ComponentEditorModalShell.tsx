'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

export function ComponentEditorModalShell({
  isOpen,
  title,
  description,
  onClose,
  children,
  footer,
}: {
  isOpen: boolean
  title: string
  description?: string
  onClose: () => void
  children?: React.ReactNode
  footer?: React.ReactNode
}) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    if (!isOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isMounted || !isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(15, 23, 42, 0.36)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(820px, calc(100vw - 48px))',
          maxHeight: 'min(88vh, 920px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.95)',
          borderRadius: 28,
          background: '#ffffff',
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            padding: '24px 24px 18px',
            borderBottom: '1px solid #eef2f7',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#0f172a',
              }}
            >
              {title}
            </div>
            {description ? (
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#64748b',
                }}
              >
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #dbe2ea',
              background: '#f8fafc',
              color: '#334155',
              borderRadius: 999,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Fechar
          </button>
        </div>

        <div
          style={{
            minHeight: 0,
            overflowY: 'auto',
            padding: 24,
            background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
          }}
        >
          {children}
        </div>

        {footer ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '18px 24px 24px',
              borderTop: '1px solid #eef2f7',
              background: '#ffffff',
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

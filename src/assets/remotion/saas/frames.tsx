import type { CSSProperties, ReactNode } from 'react'

import type { SaaSTheme } from '@/assets/remotion/saas/types'

export function DeviceFrame({
  children,
  kind = 'desktop',
  style,
  theme,
}: {
  children: ReactNode
  kind?: 'desktop' | 'phone' | 'tablet'
  style?: CSSProperties
  theme: SaaSTheme
}) {
  const radius = kind === 'phone' ? 44 : kind === 'tablet' ? 34 : 30
  const padding = kind === 'phone' ? 14 : kind === 'tablet' ? 18 : 18

  return (
    <div
      style={{
        background: kind === 'desktop' ? '#111827' : '#101828',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: radius,
        boxShadow: '0 34px 90px rgba(20,24,22,0.24)',
        overflow: 'hidden',
        padding,
        position: 'relative',
        ...style,
      }}
    >
      {kind !== 'desktop' ? (
        <span
          style={{
            background: 'rgba(255,255,255,0.24)',
            borderRadius: 999,
            display: 'block',
            height: 6,
            left: '50%',
            position: 'absolute',
            top: 10,
            transform: 'translateX(-50%)',
            width: kind === 'phone' ? 76 : 112,
            zIndex: 2,
          }}
        />
      ) : null}
      <div
        style={{
          background: theme.panel,
          borderRadius: Math.max(12, radius - padding),
          height: '100%',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function BrowserFrame({
  children,
  style,
  theme,
  url = 'app.company.com',
}: {
  children: ReactNode
  style?: CSSProperties
  theme: SaaSTheme
  url?: string
}) {
  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 28,
        boxShadow: '0 34px 90px rgba(20,24,22,0.18)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{ alignItems: 'center', background: '#EEF3EF', borderBottom: `1px solid ${theme.border}`, display: 'grid', gap: 16, gridTemplateColumns: '74px 1fr 74px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['#EF625D', '#E5B84E', '#4DB36E'].map((color) => (
            <span key={color} style={{ background: color, borderRadius: 999, height: 12, width: 12 }} />
          ))}
        </div>
        <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 999, color: theme.muted, fontSize: 15, fontWeight: 760, letterSpacing: 0, padding: '9px 14px', textAlign: 'center' }}>{url}</div>
        <div />
      </div>
      {children}
    </div>
  )
}

export function PhoneFrame({ children, style, theme }: { children: ReactNode; style?: CSSProperties; theme: SaaSTheme }) {
  return (
    <DeviceFrame kind="phone" style={{ height: 720, width: 360, ...style }} theme={theme}>
      {children}
    </DeviceFrame>
  )
}

export function TabletFrame({ children, style, theme }: { children: ReactNode; style?: CSSProperties; theme: SaaSTheme }) {
  return (
    <DeviceFrame kind="tablet" style={{ height: 620, width: 860, ...style }} theme={theme}>
      {children}
    </DeviceFrame>
  )
}

export function FloatingScreenshot({
  children,
  active = false,
  label,
  metric,
  style,
  theme,
}: {
  active?: boolean
  children?: ReactNode
  label?: string
  metric?: string
  style?: CSSProperties
  theme: SaaSTheme
}) {
  return (
    <div
      style={{
        background: theme.panel,
        border: `1px solid ${theme.border}`,
        borderRadius: 26,
        boxShadow: active ? '0 38px 92px rgba(20,24,22,0.20)' : '0 18px 46px rgba(20,24,22,0.10)',
        display: 'grid',
        gap: 18,
        overflow: 'hidden',
        padding: 22,
        width: 560,
        ...style,
      }}
    >
      {label || metric ? (
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          {label ? <strong style={{ color: theme.text, fontSize: 24, fontWeight: 880, letterSpacing: 0 }}>{label}</strong> : <span />}
          {metric ? <span style={{ background: '#F0F5F2', border: `1px solid ${theme.border}`, borderRadius: 999, color: theme.accent, fontSize: 18, fontWeight: 900, padding: '9px 12px' }}>{metric}</span> : null}
        </div>
      ) : null}
      {children || <ScreenshotSkeleton theme={theme} />}
    </div>
  )
}

function ScreenshotSkeleton({ theme }: { theme: SaaSTheme }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[0, 1, 2].map((tile) => <span key={tile} style={{ background: tile === 0 ? theme.accent : '#F0F5F2', border: `1px solid ${theme.border}`, borderRadius: 16, height: 74 }} />)}
      </div>
      <div style={{ alignItems: 'end', display: 'flex', gap: 10, height: 150 }}>
        {[72, 112, 88, 148, 124, 178, 106].map((height, index) => (
          <span key={`${height}-${index}`} style={{ background: index === 4 ? theme.accent : '#DCE6DF', borderRadius: 8, flex: 1, height }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 9 }}>
        {[88, 64, 78].map((width, index) => <span key={width} style={{ background: index === 1 ? theme.accent : '#E5ECE7', borderRadius: 999, display: 'block', height: 10, width: `${width}%` }} />)}
      </div>
    </div>
  )
}

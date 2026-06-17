import type { CSSProperties, ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

import { clampProgress } from '@/assets/remotion/saas/animation'
import type { SaaSTheme } from '@/assets/remotion/saas/types'

export function MouseClick({
  delay = 0,
  left,
  theme,
  top,
}: {
  delay?: number
  left: number
  theme: SaaSTheme
  top: number
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 18)
  const ring = interpolate(p, [0, 1], [0, 34])
  const opacity = interpolate(p, [0, 0.25, 1], [0, 1, 0])
  return (
    <div style={{ left, position: 'absolute', top }}>
      <span style={{ background: theme.text, border: '2px solid #FFFFFF', borderRadius: 999, display: 'block', height: 18, position: 'absolute', transform: 'translate(-50%, -50%)', width: 18 }} />
      <span style={{ border: `3px solid ${theme.accent}`, borderRadius: 999, height: ring, opacity, position: 'absolute', transform: 'translate(-50%, -50%)', width: ring }} />
    </div>
  )
}

export function CursorPath({
  delay = 0,
  duration = 90,
  path,
  size = 28,
  theme,
}: {
  delay?: number
  duration?: number
  path: Array<{ x: number; y: number }>
  size?: number
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + duration)
  const segment = Math.min(path.length - 2, Math.max(0, Math.floor(p * Math.max(1, path.length - 1))))
  const segmentProgress = p * Math.max(1, path.length - 1) - segment
  const from = path[segment] || path[0] || { x: 0, y: 0 }
  const to = path[segment + 1] || from
  const x = interpolate(segmentProgress, [0, 1], [from.x, to.x])
  const y = interpolate(segmentProgress, [0, 1], [from.y, to.y])
  return (
    <div style={{ left: x, position: 'absolute', top: y, transform: 'translate(-10%, -10%)' }}>
      <svg height={size * 1.5} viewBox="0 0 28 42" width={size}>
        <path d="M3 3L24 23L14 25L9 39L3 3Z" fill={theme.text} stroke="#FFFFFF" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    </div>
  )
}

export function ZoomToRegion({
  children,
  delay = 0,
  region,
  scale = 1.18,
  style,
}: {
  children: ReactNode
  delay?: number
  region: { x: number; y: number }
  scale?: number
  style?: CSSProperties
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 42)
  const currentScale = interpolate(p, [0, 1], [1, scale])
  const x = interpolate(p, [0, 1], [0, -region.x * (scale - 1)])
  const y = interpolate(p, [0, 1], [0, -region.y * (scale - 1)])
  return (
    <div style={{ overflow: 'hidden', ...style }}>
      <div style={{ transform: `translate(${x}px, ${y}px) scale(${currentScale})`, transformOrigin: `${region.x}px ${region.y}px` }}>
        {children}
      </div>
    </div>
  )
}

export function SpotlightMask({
  children,
  delay = 0,
  radius = 180,
  target,
}: {
  children: ReactNode
  delay?: number
  radius?: number
  target: { x: number; y: number }
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 36)
  const currentRadius = radius * p
  return (
    <div style={{ height: '100%', position: 'relative', width: '100%' }}>
      {children}
      <div
        style={{
          background: `radial-gradient(circle at ${target.x}px ${target.y}px, transparent 0 ${currentRadius}px, rgba(15,23,42,0.54) ${currentRadius + 2}px)`,
          inset: 0,
          pointerEvents: 'none',
          position: 'absolute',
        }}
      />
    </div>
  )
}

export function CalloutConnector({
  delay = 0,
  label,
  start,
  theme,
  end,
}: {
  delay?: number
  end: { x: number; y: number }
  label: string
  start: { x: number; y: number }
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 32)
  const x2 = interpolate(p, [0, 1], [start.x, end.x])
  const y2 = interpolate(p, [0, 1], [start.y, end.y])
  return (
    <div style={{ inset: 0, pointerEvents: 'none', position: 'absolute' }}>
      <svg height="100%" width="100%">
        <line stroke={theme.accent} strokeLinecap="round" strokeWidth="3" x1={start.x} x2={x2} y1={start.y} y2={y2} />
      </svg>
      <div style={{ background: theme.text, borderRadius: 999, color: '#FFFFFF', fontSize: 16, fontWeight: 860, left: end.x, letterSpacing: 0, opacity: p, padding: '10px 13px', position: 'absolute', top: end.y, transform: 'translate(10px, -50%)' }}>{label}</div>
    </div>
  )
}

import { Children } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

import { clampProgress, countUp, fadeSlide } from '@/remotion/saas/animation'
import type { SaaSTheme } from '@/remotion/saas/types'

export function Reveal({
  children,
  delay = 0,
  distance = 24,
  direction = 'up',
  style,
}: {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'right'
  distance?: number
  style?: CSSProperties
}) {
  const frame = useCurrentFrame()
  return (
    <div style={{ ...fadeSlide(frame, delay, { distance, x: direction === 'right' }), ...style }}>
      {children}
    </div>
  )
}

export function StaggerGroup({
  children,
  gap = 8,
  start = 0,
  style,
}: {
  children: ReactNode
  gap?: number
  start?: number
  style?: CSSProperties
}) {
  const items = Children.toArray(children)
  return (
    <div style={style}>
      {items.map((child, index) => (
        <Reveal key={index} delay={start + index * gap}>
          {child}
        </Reveal>
      ))}
    </div>
  )
}

export function TypingText({
  cursor = true,
  delay = 0,
  speed = 1.2,
  style,
  text,
  theme,
}: {
  cursor?: boolean
  delay?: number
  speed?: number
  style?: CSSProperties
  text: string
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const visibleChars = Math.min(text.length, Math.floor(Math.max(0, frame - delay) * speed))
  const showCursor = cursor && Math.floor(frame / 14) % 2 === 0
  return (
    <span style={{ color: theme.text, fontWeight: 760, letterSpacing: 0, ...style }}>
      {text.slice(0, visibleChars)}
      {showCursor ? <span style={{ color: theme.accent }}>_</span> : null}
    </span>
  )
}

export function NumberTicker({
  delay = 0,
  duration = 60,
  format,
  from = 0,
  style,
  suffix = '',
  to,
}: {
  delay?: number
  duration?: number
  format?: (value: number) => string
  from?: number
  style?: CSSProperties
  suffix?: string
  to: number
}) {
  const frame = useCurrentFrame()
  const value = countUp(frame, delay, delay + duration, from, to)
  return <span style={style}>{format ? format(value) : value.toLocaleString('en-US')}{suffix}</span>
}

export function HotspotPulse({
  label,
  left,
  style,
  theme,
  top,
}: {
  label?: string
  left: number | string
  style?: CSSProperties
  theme: SaaSTheme
  top: number | string
}) {
  const frame = useCurrentFrame()
  const pulse = interpolate(Math.sin(frame / 10), [-1, 1], [0.25, 1])
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 10, left, position: 'absolute', top, ...style }}>
      <span style={{ background: theme.accent, border: `8px solid rgba(255,255,255,${0.34 + pulse * 0.16})`, borderRadius: 999, boxShadow: `0 0 0 ${10 + pulse * 14}px ${theme.accent}22`, display: 'block', height: 22, width: 22 }} />
      {label ? <strong style={{ background: theme.text, borderRadius: 999, color: '#FFFFFF', fontSize: 16, fontWeight: 850, letterSpacing: 0, padding: '9px 12px' }}>{label}</strong> : null}
    </div>
  )
}

export function CursorTrail({
  path,
  size = 22,
  style,
  theme,
}: {
  path: Array<{ x: number; y: number }>
  size?: number
  style?: CSSProperties
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const index = Math.min(path.length - 1, Math.max(0, Math.floor(frame / 10) % Math.max(1, path.length)))
  const point = path[index] || { x: 0, y: 0 }
  return (
    <div style={{ left: point.x, position: 'absolute', top: point.y, transform: 'translate(-10%, -10%)', ...style }}>
      <svg height={size * 1.5} viewBox="0 0 28 42" width={size}>
        <path d="M3 3L24 23L14 25L9 39L3 3Z" fill={theme.text} stroke="#FFFFFF" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    </div>
  )
}

export function ConnectionLine({
  delay = 0,
  from,
  style,
  theme,
  to,
}: {
  delay?: number
  from: { x: number; y: number }
  style?: CSSProperties
  theme: SaaSTheme
  to: { x: number; y: number }
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 34)
  const width = Math.abs(to.x - from.x) || 1
  const height = Math.abs(to.y - from.y) || 1
  const left = Math.min(from.x, to.x)
  const top = Math.min(from.y, to.y)
  const x1 = from.x - left
  const y1 = from.y - top
  const x2 = x1 + (to.x - from.x) * p
  const y2 = y1 + (to.y - from.y) * p

  return (
    <svg height={height + 8} style={{ left: left - 4, overflow: 'visible', position: 'absolute', top: top - 4, ...style }} width={width + 8}>
      <line stroke={theme.accent} strokeLinecap="round" strokeWidth="3" x1={x1 + 4} x2={x2 + 4} y1={y1 + 4} y2={y2 + 4} />
    </svg>
  )
}

export function ProgressRing({
  label,
  progress,
  size = 112,
  theme,
}: {
  label?: string
  progress: number
  size?: number
  theme: SaaSTheme
}) {
  const radius = size / 2 - 8
  const circumference = Math.PI * 2 * radius
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)))
  return (
    <div style={{ height: size, position: 'relative', width: size }}>
      <svg height={size} width={size}>
        <circle cx={size / 2} cy={size / 2} fill="transparent" r={radius} stroke="#DDE7E1" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} fill="transparent" r={radius} stroke={theme.accent} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="8" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      {label ? <strong style={{ color: theme.text, fontSize: 20, fontWeight: 900, left: 0, letterSpacing: 0, position: 'absolute', right: 0, textAlign: 'center', top: '50%', transform: 'translateY(-50%)' }}>{label}</strong> : null}
    </div>
  )
}

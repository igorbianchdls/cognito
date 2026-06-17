import type { ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

import { clampProgress } from '@/assets/remotion/saas/animation'
import type { SaaSTheme } from '@/assets/remotion/saas/types'

export function AnimatedBarGroup({
  delay = 0,
  height = 220,
  theme,
  values,
}: {
  delay?: number
  height?: number
  theme: SaaSTheme
  values: number[]
}) {
  const frame = useCurrentFrame()
  const max = Math.max(...values, 1)
  return (
    <div style={{ alignItems: 'end', display: 'flex', gap: 12, height }}>
      {values.map((value, index) => {
        const p = clampProgress(frame, delay + index * 5, delay + index * 5 + 28)
        const barHeight = (value / max) * height * p
        return <span key={`${value}-${index}`} style={{ background: index === values.length - 2 ? theme.accent : '#DDE7E1', borderRadius: 10, flex: 1, height: Math.max(8, barHeight) }} />
      })}
    </div>
  )
}

export function ProgressBar({
  delay = 0,
  label,
  progress,
  theme,
}: {
  delay?: number
  label?: string
  progress: number
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 42) * Math.max(0, Math.min(1, progress))
  return (
    <div style={{ display: 'grid', gap: 9 }}>
      {label ? <span style={{ color: theme.muted, fontSize: 16, fontWeight: 780 }}>{label}</span> : null}
      <div style={{ background: '#E6ECE8', borderRadius: 999, height: 14, overflow: 'hidden' }}>
        <span style={{ background: theme.accent, borderRadius: 999, display: 'block', height: '100%', width: `${p * 100}%` }} />
      </div>
    </div>
  )
}

export function CardStack({
  children,
  gap = 26,
}: {
  children: ReactNode[]
  gap?: number
}) {
  const frame = useCurrentFrame()
  return (
    <div style={{ height: 520, position: 'relative' }}>
      {children.map((child, index) => {
        const p = clampProgress(frame, 8 + index * 9, 34 + index * 9)
        return (
          <div key={index} style={{ left: '50%', opacity: p, position: 'absolute', top: index * gap, transform: `translateX(-50%) translateY(${(1 - p) * 38}px) rotate(${(index - 1) * 2.2}deg)`, width: '80%', zIndex: children.length - index }}>
            {child}
          </div>
        )
      })}
    </div>
  )
}

export function MarqueeRow({
  children,
  duration = 180,
  reverse = false,
}: {
  children: ReactNode[]
  duration?: number
  reverse?: boolean
}) {
  const frame = useCurrentFrame()
  const progress = (frame % duration) / duration
  const x = interpolate(progress, [0, 1], reverse ? [-420, 0] : [0, -420])
  const items = [...children, ...children]
  return (
    <div style={{ overflow: 'hidden', width: '100%' }}>
      <div style={{ display: 'flex', gap: 18, transform: `translateX(${x}px)`, width: 'max-content' }}>
        {items.map((child, index) => <div key={index}>{child}</div>)}
      </div>
    </div>
  )
}

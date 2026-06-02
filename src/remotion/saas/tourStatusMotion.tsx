import type { ReactNode } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

import { clampProgress } from '@/remotion/saas/animation'
import type { SaaSTheme } from '@/remotion/saas/types'

export function FocusRect({
  delay = 0,
  height,
  label,
  left,
  theme,
  top,
  width,
}: {
  delay?: number
  height: number
  label?: string
  left: number
  theme: SaaSTheme
  top: number
  width: number
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 28)
  return (
    <div style={{ left, opacity: p, position: 'absolute', top, transform: `scale(${0.96 + p * 0.04})`, transformOrigin: 'center' }}>
      <div style={{ border: `3px solid ${theme.accent}`, borderRadius: 18, boxShadow: `0 0 0 999px rgba(15,23,42,${0.08 * p})`, height, width }} />
      {label ? <span style={{ background: theme.accent, borderRadius: 999, color: '#FFFFFF', fontSize: 15, fontWeight: 900, left: 12, letterSpacing: 0, padding: '9px 12px', position: 'absolute', top: -18 }}>{label}</span> : null}
    </div>
  )
}

export function ClickRipple({
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
  const p = clampProgress(frame, delay, delay + 24)
  const size = interpolate(p, [0, 1], [8, 76])
  const opacity = interpolate(p, [0, 0.2, 1], [0, 1, 0])
  return <span style={{ border: `4px solid ${theme.accent}`, borderRadius: 999, height: size, left, opacity, position: 'absolute', top, transform: 'translate(-50%, -50%)', width: size }} />
}

export function TooltipCallout({
  delay = 0,
  label,
  left,
  theme,
  top,
}: {
  delay?: number
  label: string
  left: number
  theme: SaaSTheme
  top: number
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 24)
  return (
    <div style={{ left, opacity: p, position: 'absolute', top, transform: `translateY(${(1 - p) * 14}px)` }}>
      <div style={{ background: theme.text, borderRadius: 16, color: '#FFFFFF', fontSize: 17, fontWeight: 820, letterSpacing: 0, lineHeight: 1.22, maxWidth: 260, padding: '13px 15px' }}>{label}</div>
      <span style={{ borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `10px solid ${theme.text}`, display: 'block', height: 0, marginLeft: 22, width: 0 }} />
    </div>
  )
}

export function StepIndicator({
  activeIndex,
  steps,
  theme,
}: {
  activeIndex: number
  steps: string[]
  theme: SaaSTheme
}) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {steps.map((step, index) => {
        const active = index === activeIndex
        return (
          <div key={step} style={{ alignItems: 'center', background: active ? theme.text : '#FFFFFF', border: `1px solid ${active ? theme.text : theme.border}`, borderRadius: 999, color: active ? '#FFFFFF' : theme.muted, display: 'flex', fontSize: 14, fontWeight: 850, gap: 8, letterSpacing: 0, padding: '10px 12px' }}>
            <span style={{ background: active ? theme.accent : '#DDE7E1', borderRadius: 999, height: 9, width: 9 }} />
            {step}
          </div>
        )
      })}
    </div>
  )
}

export function CheckmarkDraw({
  delay = 0,
  size = 74,
  theme,
}: {
  delay?: number
  size?: number
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 30)
  return (
    <svg height={size} viewBox="0 0 80 80" width={size}>
      <circle cx="40" cy="40" fill="#ECFDF3" r="34" stroke={theme.positive} strokeWidth="4" />
      <path d="M24 41L35 52L58 28" fill="none" pathLength={1} stroke={theme.positive} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round" strokeLinejoin="round" strokeWidth="7" />
    </svg>
  )
}

export function StatusBadgeCycle({
  interval = 44,
  statuses,
  theme,
}: {
  interval?: number
  statuses: string[]
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const index = Math.floor(frame / interval) % Math.max(1, statuses.length)
  return (
    <span style={{ alignItems: 'center', background: '#ECFDF3', border: `1px solid ${theme.positive}33`, borderRadius: 999, color: theme.positive, display: 'inline-flex', fontSize: 18, fontWeight: 900, gap: 9, letterSpacing: 0, padding: '11px 14px' }}>
      <span style={{ background: theme.positive, borderRadius: 999, height: 10, width: 10 }} />
      {statuses[index]}
    </span>
  )
}

export function TaskCompletionList({
  delay = 0,
  tasks,
  theme,
}: {
  delay?: number
  tasks: string[]
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {tasks.map((task, index) => {
        const p = clampProgress(frame, delay + index * 18, delay + index * 18 + 22)
        return (
          <div key={task} style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 18, display: 'grid', gap: 14, gridTemplateColumns: '42px 1fr', opacity: 0.45 + p * 0.55, padding: '13px 15px' }}>
            <CheckmarkDraw delay={delay + index * 18} size={42} theme={theme} />
            <span style={{ color: theme.text, fontSize: 18, fontWeight: 780, letterSpacing: 0 }}>{task}</span>
          </div>
        )
      })}
    </div>
  )
}

export function LoadingToSuccess({
  delay = 0,
  label = 'Ready',
  theme,
}: {
  delay?: number
  label?: string
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 54)
  const spin = frame * 8
  return (
    <div style={{ alignItems: 'center', background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 999, display: 'inline-flex', gap: 12, padding: '13px 16px' }}>
      {p < 0.8 ? (
        <span style={{ border: `4px solid #DDE7E1`, borderTopColor: theme.accent, borderRadius: 999, display: 'block', height: 24, transform: `rotate(${spin}deg)`, width: 24 }} />
      ) : (
        <CheckmarkDraw size={32} theme={theme} />
      )}
      <span style={{ color: theme.text, fontSize: 18, fontWeight: 860, letterSpacing: 0 }}>{p < 0.8 ? 'Processing' : label}</span>
    </div>
  )
}

export function PanAndScan({
  children,
  delay = 0,
  from = { x: 0, y: 0 },
  to = { x: -80, y: -30 },
}: {
  children: ReactNode
  delay?: number
  from?: { x: number; y: number }
  to?: { x: number; y: number }
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 120)
  const x = interpolate(p, [0, 1], [from.x, to.x])
  const y = interpolate(p, [0, 1], [from.y, to.y])
  return <div style={{ transform: `translate(${x}px, ${y}px) scale(1.08)` }}>{children}</div>
}

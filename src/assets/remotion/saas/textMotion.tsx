import type { CSSProperties } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

import { clampProgress } from '@/assets/remotion/saas/animation'
import type { SaaSTheme } from '@/assets/remotion/saas/types'

export function WordReveal({
  delay = 0,
  gap = 10,
  style,
  text,
  theme,
}: {
  delay?: number
  gap?: number
  style?: CSSProperties
  text: string
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const words = text.split(/\s+/)
  return (
    <span style={{ color: theme.text, display: 'flex', flexWrap: 'wrap', gap: '0.28em', letterSpacing: 0, ...style }}>
      {words.map((word, index) => {
        const p = clampProgress(frame, delay + index * gap, delay + index * gap + 22)
        return (
          <span key={`${word}-${index}`} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
            {word}
          </span>
        )
      })}
    </span>
  )
}

export function LineReveal({
  delay = 0,
  gap = 12,
  lines,
  style,
  theme,
}: {
  delay?: number
  gap?: number
  lines: string[]
  style?: CSSProperties
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  return (
    <div style={{ color: theme.text, display: 'grid', gap: 8, letterSpacing: 0, ...style }}>
      {lines.map((line, index) => {
        const p = clampProgress(frame, delay + index * gap, delay + index * gap + 28)
        return (
          <span key={line} style={{ clipPath: `inset(0 ${100 - p * 100}% 0 0)`, opacity: p }}>
            {line}
          </span>
        )
      })}
    </div>
  )
}

export function RotatingWords({
  delay = 0,
  interval = 42,
  prefix,
  style,
  suffix,
  theme,
  words,
}: {
  delay?: number
  interval?: number
  prefix?: string
  style?: CSSProperties
  suffix?: string
  theme: SaaSTheme
  words: string[]
}) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - delay)
  const index = Math.floor(local / interval) % Math.max(1, words.length)
  const p = (local % interval) / interval
  const y = interpolate(p, [0, 0.18, 0.78, 1], [18, 0, 0, -18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const opacity = interpolate(p, [0, 0.18, 0.78, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <span style={{ alignItems: 'baseline', color: theme.text, display: 'inline-flex', gap: '0.28em', letterSpacing: 0, ...style }}>
      {prefix ? <span>{prefix}</span> : null}
      <span style={{ color: theme.accent, display: 'inline-block', minWidth: '4.4em', opacity, transform: `translateY(${y}px)` }}>{words[index]}</span>
      {suffix ? <span>{suffix}</span> : null}
    </span>
  )
}

export function TextHighlightSweep({
  delay = 0,
  style,
  text,
  theme,
}: {
  delay?: number
  style?: CSSProperties
  text: string
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 70)
  return (
    <span
      style={{
        backgroundImage: `linear-gradient(90deg, transparent 0%, transparent ${Math.max(0, p * 100 - 20)}%, ${theme.accent}33 ${p * 100}%, transparent ${Math.min(100, p * 100 + 20)}%, transparent 100%)`,
        color: theme.text,
        letterSpacing: 0,
        ...style,
      }}
    >
      {text}
    </span>
  )
}

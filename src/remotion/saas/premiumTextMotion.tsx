import type { CSSProperties } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'

import { clampProgress } from '@/remotion/saas/animation'
import type { SaaSTheme } from '@/remotion/saas/types'

export function CharacterReveal({
  delay = 0,
  gap = 2,
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
  return (
    <span style={{ color: theme.text, letterSpacing: 0, ...style }}>
      {text.split('').map((char, index) => {
        const p = clampProgress(frame, delay + index * gap, delay + index * gap + 14)
        return (
          <span key={`${char}-${index}`} style={{ opacity: p, transform: `translateY(${(1 - p) * 16}px)`, display: 'inline-block' }}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        )
      })}
    </span>
  )
}

export function TextScramble({
  delay = 0,
  duration = 72,
  style,
  text,
  theme,
}: {
  delay?: number
  duration?: number
  style?: CSSProperties
  text: string
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const p = clampProgress(frame, delay, delay + duration)
  const resolved = Math.floor(text.length * p)
  const output = text
    .split('')
    .map((char, index) => {
      if (char === ' ') return '\u00A0'
      if (index < resolved) return char
      return glyphs[(index * 7 + frame) % glyphs.length]
    })
    .join('')

  return <span style={{ color: theme.text, fontVariantNumeric: 'tabular-nums', letterSpacing: 0, ...style }}>{output}</span>
}

export function GradientTextSweep({
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
  const p = clampProgress(frame, delay, delay + 90)
  const position = interpolate(p, [0, 1], [-60, 160])
  return (
    <span
      style={{
        backgroundImage: `linear-gradient(90deg, ${theme.text} 0%, ${theme.text} ${Math.max(0, position - 24)}%, ${theme.accent} ${position}%, ${theme.text} ${Math.min(180, position + 24)}%)`,
        backgroundClip: 'text',
        color: 'transparent',
        letterSpacing: 0,
        WebkitBackgroundClip: 'text',
        ...style,
      }}
    >
      {text}
    </span>
  )
}

export function UnderlineDraw({
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
  const p = clampProgress(frame, delay, delay + 34)
  return (
    <span style={{ color: theme.text, display: 'inline-grid', gap: 8, letterSpacing: 0, ...style }}>
      <span>{text}</span>
      <span style={{ background: theme.accent, borderRadius: 999, display: 'block', height: 6, width: `${p * 100}%` }} />
    </span>
  )
}

export function TextSwap({
  delay = 0,
  interval = 66,
  style,
  texts,
  theme,
}: {
  delay?: number
  interval?: number
  style?: CSSProperties
  texts: string[]
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const local = Math.max(0, frame - delay)
  const index = Math.floor(local / interval) % Math.max(1, texts.length)
  const p = (local % interval) / interval
  const y = interpolate(p, [0, 0.18, 0.78, 1], [22, 0, 0, -22], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const opacity = interpolate(p, [0, 0.18, 0.78, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const blur = interpolate(p, [0, 0.18, 0.78, 1], [8, 0, 0, 8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <span style={{ color: theme.text, display: 'inline-block', filter: `blur(${blur}px)`, letterSpacing: 0, opacity, transform: `translateY(${y}px)`, ...style }}>
      {texts[index]}
    </span>
  )
}

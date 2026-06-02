import { interpolate, useCurrentFrame } from 'remotion'

import { clampProgress } from '@/remotion/saas/animation'
import type { SaaSTheme } from '@/remotion/saas/types'

function buildLinePath(values: number[], width: number, height: number) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(1, max - min)
  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export function AnimatedLineChart({
  delay = 0,
  height = 260,
  theme,
  values,
  width = 620,
}: {
  delay?: number
  height?: number
  theme: SaaSTheme
  values: number[]
  width?: number
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 74)
  const path = buildLinePath(values, width, height)
  return (
    <svg height={height + 16} viewBox={`0 0 ${width} ${height + 16}`} width={width}>
      <path d={path} fill="none" pathLength={1} stroke={theme.accent} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" transform="translate(0 8)" />
    </svg>
  )
}

export function SparklineMotion({
  delay = 0,
  theme,
  values,
}: {
  delay?: number
  theme: SaaSTheme
  values: number[]
}) {
  return <AnimatedLineChart delay={delay} height={82} theme={theme} values={values} width={220} />
}

export function GaugeMotion({
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
  const p = clampProgress(frame, delay, delay + 54) * Math.max(0, Math.min(1, progress))
  const rotation = interpolate(p, [0, 1], [-92, 92])
  return (
    <div style={{ height: 170, position: 'relative', width: 260 }}>
      <svg height="170" viewBox="0 0 260 170" width="260">
        <path d="M35 135A95 95 0 0 1 225 135" fill="none" stroke="#DDE7E1" strokeLinecap="round" strokeWidth="18" />
        <path d="M35 135A95 95 0 0 1 225 135" fill="none" pathLength={1} stroke={theme.accent} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round" strokeWidth="18" />
      </svg>
      <span style={{ background: theme.text, borderRadius: 999, height: 70, left: 130, position: 'absolute', top: 68, transform: `translateX(-50%) rotate(${rotation}deg)`, transformOrigin: '50% 95%', width: 5 }} />
      {label ? <strong style={{ color: theme.text, fontSize: 24, fontWeight: 920, left: 0, letterSpacing: 0, position: 'absolute', right: 0, textAlign: 'center', top: 116 }}>{label}</strong> : null}
    </div>
  )
}

export function DeltaBadgeMotion({
  delay = 0,
  label,
  theme,
}: {
  delay?: number
  label: string
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  const p = clampProgress(frame, delay, delay + 24)
  return (
    <span style={{ background: '#ECFDF3', border: `1px solid ${theme.positive}33`, borderRadius: 999, color: theme.positive, display: 'inline-block', fontSize: 22, fontWeight: 920, letterSpacing: 0, opacity: p, padding: '11px 15px', transform: `translateY(${(1 - p) * 18}px) scale(${0.92 + p * 0.08})` }}>
      {label}
    </span>
  )
}

export function DataRowSweep({
  delay = 0,
  rows,
  theme,
}: {
  delay?: number
  rows: string[]
  theme: SaaSTheme
}) {
  const frame = useCurrentFrame()
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${theme.border}`, borderRadius: 22, overflow: 'hidden' }}>
      {rows.map((row, index) => {
        const p = clampProgress(frame, delay + index * 10, delay + index * 10 + 22)
        return (
          <div key={row} style={{ background: `linear-gradient(90deg, ${theme.accent}18 0%, transparent ${p * 100}%)`, borderBottom: index === rows.length - 1 ? 'none' : `1px solid ${theme.border}`, color: theme.text, fontSize: 18, fontWeight: 760, letterSpacing: 0, padding: '16px 18px' }}>
            {row}
          </div>
        )
      })}
    </div>
  )
}

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { EX, FONT, HandNote, Mark, Paper, countUp, ff, palette, progress, type ExplainerColors } from './theme'

export type DonutChartProps = {
  title: string
  subtitle?: string
  items: { label: string; value: number; color?: string }[]
  /** Slice that matters: it pops out, its legend line gets the highlighter. */
  highlight?: number
  /** Text in the hole (defaults to the highlighted share). */
  center?: string
  suffix?: string
  note?: string
  colors?: Partial<ExplainerColors>
}

export const DONUT_CHART_DURATION = 180
const SLICE_COLORS = [EX.red, EX.blue, EX.teal, '#C9A227', '#8A7F6E', '#B85C9E']

/** Donut chart whose slices draw one after another, with a legend that counts up and a note on the key slice. */
export function DonutChart({ title, subtitle, items, highlight = 0, center, suffix = '%', note, colors }: DonutChartProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const wide = width > height
  const total = items.reduce((a, i) => a + i.value, 0) || 1
  const R = 250 * s, stroke = 120 * s, circ = 2 * Math.PI * R
  const cx = wide ? width * 0.3 : width / 2, cy = wide ? height * 0.55 : height * 0.45
  const perSlice = 22
  const done = 20 + items.length * perSlice
  const pop = progress(frame, done + 4, 14)
  // Where each slice starts, as a share of the circle.
  const starts = items.map((_, i) => items.slice(0, i).reduce((a, it) => a + it.value, 0) / total)
  const pct = (v: number) => Math.round((v / total) * 100)

  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', left: 140 * s, right: 140 * s, top: 80 * s, opacity: progress(frame, 0, 14) }}>
        <h1 style={{ margin: 0, ...ff(FONT.head), fontWeight: 800, fontSize: 96 * s, lineHeight: 1.02, color: c.ink }}>{title}</h1>
        {subtitle && <p style={{ margin: `${14 * s}px 0 0`, ...ff(FONT.serif), fontSize: 38 * s, color: c.text }}>{subtitle}</p>}
      </div>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={c.line} strokeWidth={stroke} opacity={progress(frame, 8, 14) * 0.6} />
        {items.map((item, i) => {
          const share = item.value / total
          const start = starts[i]
          const draw = progress(frame, 20 + i * perSlice, perSlice + 4)
          const mid = (start + share / 2) * 2 * Math.PI - Math.PI / 2
          const out = i === highlight ? pop * 22 * s : 0
          return <g key={item.label} transform={`translate(${Math.cos(mid) * out}, ${Math.sin(mid) * out})`}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={item.color ?? SLICE_COLORS[i % SLICE_COLORS.length]} strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, share * circ * draw - 4 * s)} ${circ}`} strokeDashoffset={-start * circ} transform={`rotate(-90 ${cx} ${cy})`} />
          </g>
        })}
      </svg>
      <div style={{ position: 'absolute', left: cx, top: cy, transform: 'translate(-50%, -50%)', textAlign: 'center', opacity: progress(frame, done - 10, 14) }}>
        <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 120 * s, lineHeight: 1, color: c.ink }}>{center ?? `${countUp(frame, pct(items[highlight]?.value ?? 0), done - 10, 20)}${suffix}`}</div>
      </div>
      <div style={{ position: 'absolute', left: wide ? width * 0.56 : 140 * s, right: 140 * s, top: wide ? '50%' : height * 0.74, transform: wide ? 'translateY(-38%)' : undefined, display: 'flex', flexDirection: 'column', gap: 26 * s }}>
        {items.map((item, i) => {
          const at = 20 + i * perSlice
          const on = i === highlight
          return <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 22 * s, opacity: progress(frame, at, 12), transform: `translateX(${(1 - progress(frame, at, 12)) * 24 * s}px)` }}>
            <span style={{ width: 34 * s, height: 34 * s, borderRadius: 6 * s, background: item.color ?? SLICE_COLORS[i % SLICE_COLORS.length], flex: 'none' }} />
            <span style={{ flex: 1, ...ff(FONT.head), fontWeight: 700, fontSize: 48 * s, color: on ? c.ink : c.text }}>
              {on ? <Mark amount={progress(frame, done + 6, 16)} seed={`donut-${i}`}>{item.label}</Mark> : item.label}
            </span>
            <span style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 56 * s, color: c.ink, fontVariantNumeric: 'tabular-nums' }}>{countUp(frame, pct(item.value), at, perSlice + 4)}{suffix}</span>
          </div>
        })}
        {note && <HandNote amount={progress(frame, done + 26, 24)} color={c.red} size={72 * s} style={{ marginTop: 24 * s, transform: 'rotate(-3deg)' }}>{note}</HandNote>}
      </div>
    </Paper>
  )
}

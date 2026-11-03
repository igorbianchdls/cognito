import { useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, ff, HandNote, Mark, Paper, SourceLine, countUp, palette, progress, type ExplainerColors } from './theme'

export type BarsCountProps = {
  title: string
  subtitle?: string
  items: { label: string; value: number }[]
  /** Index of the bar that stands out (accent color, highlighted label). */
  highlight?: number
  prefix?: string
  suffix?: string
  decimals?: number
  note?: string
  source?: string
  accent?: string
  colors?: Partial<ExplainerColors>
}

export const BARS_COUNT_DURATION = 180

/**
 * Horizontal bars that grow one after another while their numbers count up;
 * the bar that matters takes the accent color and its label gets the highlighter.
 */
export function BarsCount({ title, subtitle, items, highlight, prefix = '', suffix = '', decimals = 0, note, source, accent, colors }: BarsCountProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080 // 1 at 1080p, in landscape or portrait
  const color = accent ?? c.red
  const vertical = height > width
  const max = Math.max(...items.map((i) => i.value), 1)
  const rowH = Math.min(170 * s, (height * (vertical ? 0.5 : 0.62)) / Math.max(items.length, 1))
  const barsDone = 26 + items.length * 7 + 34
  const titleIn = progress(frame, 0, 14)

  return (
    <Paper color={c.paper}>
      {/* Portrait: title on top, bars below. Landscape: title and note in a left column, bars on the right. */}
      <div style={vertical ? { position: 'absolute', left: 90 * s, right: 90 * s, top: height * 0.12 } : { position: 'absolute', left: 140 * s, width: width * 0.34, top: '50%', transform: 'translateY(-50%)' }}>
        <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20 * s}px)` }}>
          <h1 style={{ margin: 0, ...ff(FONT.head), fontWeight: 800, fontSize: 104 * s, lineHeight: 1.02, color: c.ink }}>{title}</h1>
          {subtitle && <p style={{ margin: `${18 * s}px 0 0`, ...ff(FONT.serif), fontSize: 40 * s, lineHeight: 1.35, color: c.text }}>{subtitle}</p>}
        </div>
        {note && !vertical && <HandNote amount={progress(frame, barsDone + 14, 24)} color={color} size={80 * s} style={{ marginTop: 60 * s, transform: 'rotate(-3deg)' }}>{note}</HandNote>}
      </div>
      <div style={vertical ? { position: 'absolute', left: 90 * s, right: 90 * s, top: height * 0.34, display: 'flex', flexDirection: 'column', gap: rowH * 0.18 }
        : { position: 'absolute', left: width * 0.46, right: 140 * s, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: rowH * 0.22 }}>
        {items.map((item, i) => {
          const grow = progress(frame, 26 + i * 7, 34)
          const on = i === highlight
          const barColor = on ? color : c.ink
          return (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 10 * s, opacity: progress(frame, 20 + i * 7, 10) }}>
              <div style={{ ...ff(FONT.head), fontWeight: 700, fontSize: 42 * s, color: on ? c.ink : c.text }}>
                {on ? <Mark amount={progress(frame, barsDone, 16)} seed={`bar-${i}`}>{item.label}</Mark> : item.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 * s, height: rowH * 0.42 }}>
                <div style={{ height: '100%', width: `${(item.value / max) * 78 * grow}%`, background: barColor, opacity: on || highlight === undefined ? 1 : 0.82, borderRadius: 3 * s }} />
                <span style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 52 * s, color: barColor, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  {prefix}{countUp(frame, item.value, 26 + i * 7, 34, decimals)}{suffix}
                </span>
              </div>
            </div>
          )
        })}
        {note && vertical && <HandNote amount={progress(frame, barsDone + 14, 24)} color={color} size={76 * s} style={{ marginTop: 30 * s, transform: 'rotate(-2deg)' }}>{note}</HandNote>}
      </div>
      {source && <SourceLine color={c.muted} style={{ position: 'absolute', left: (vertical ? 90 : 140) * s, bottom: (vertical ? 120 : 44) * s, opacity: progress(frame, 30, 20) }}>Fonte: {source}</SourceLine>}
    </Paper>
  )
}

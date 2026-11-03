import { useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, HandNote, Mark, Paper, countUp, ff, palette, progress, type ExplainerColors } from './theme'

export type IconGridProps = {
  /** How many figures are painted, out of `total`. */
  value: number
  total?: number
  /** Line under the big number: "de cada 100 empresas ainda usam planilha". */
  label: string
  title?: string
  note?: string
  accent?: string
  colors?: Partial<ExplainerColors>
}

export const ICON_GRID_DURATION = 180

/** Simple person figure in a 20×28 box. */
function Person({ size, color }: { size: number; color: string }) {
  return <svg viewBox="0 0 20 28" width={size} height={size * 1.4} style={{ display: 'block' }}>
    <circle cx={10} cy={5.5} r={4.6} fill={color} />
    <path d="M 2,27 L 2,17 Q 2,11.5 10,11.5 Q 18,11.5 18,17 L 18,27 Z" fill={color} />
  </svg>
}

/**
 * "37 out of 100": a grid of figures appears, then the counted ones get painted one by one
 * while a big number counts up beside them.
 */
export function IconGrid({ value, total = 100, label, title, note, accent, colors }: IconGridProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const color = accent ?? c.red
  const cols = total === 100 ? 10 : Math.ceil(Math.sqrt(total))
  const rows = Math.ceil(total / cols)
  const cell = Math.min((height * 0.68) / (rows * 1.4 + (rows - 1) * 0.35), (width * 0.42) / (cols + (cols - 1) * 0.35))
  const paintStart = 34, paintLen = 60
  const painted = Math.round(value * progress(frame, paintStart, paintLen, (t) => t))
  const labelIn = progress(frame, paintStart + paintLen + 4, 14)

  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', left: 140 * s, width: width * 0.4, top: '50%', transform: 'translateY(-50%)' }}>
        {title && <div style={{ ...ff(FONT.head), fontWeight: 700, fontSize: 44 * s, letterSpacing: 3 * s, textTransform: 'uppercase', color: c.red, opacity: progress(frame, 0, 12) }}>{title}</div>}
        <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 300 * s, lineHeight: 0.95, color: c.ink, fontVariantNumeric: 'tabular-nums', opacity: progress(frame, 6, 12) }}>
          <Mark amount={progress(frame, paintStart + paintLen, 16)} seed="grid-number" thickness={8}>{countUp(frame, value, paintStart, paintLen)}</Mark>
        </div>
        <div style={{ ...ff(FONT.serif), fontSize: 50 * s, lineHeight: 1.3, color: c.text, marginTop: 18 * s, opacity: labelIn, transform: `translateY(${(1 - labelIn) * 16 * s}px)` }}>{label}</div>
        {note && <HandNote amount={progress(frame, paintStart + paintLen + 24, 24)} color={color} size={70 * s} style={{ marginTop: 34 * s, transform: 'rotate(-3deg)' }}>{note}</HandNote>}
      </div>
      <div style={{ position: 'absolute', right: 140 * s, top: '50%', transform: 'translateY(-50%)', display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: `${cell * 0.35}px ${cell * 0.35}px` }}>
        {Array.from({ length: total }, (_, i) => {
          const appear = progress(frame, 6 + (i % cols) * 1.2 + Math.floor(i / cols) * 1.6, 10)
          const on = i < painted
          return <div key={i} style={{ opacity: appear, transform: `translateY(${(1 - appear) * 10 * s}px) scale(${on ? 1.06 : 1})` }}>
            <Person size={cell} color={on ? color : c.line} />
          </div>
        })}
      </div>
    </Paper>
  )
}

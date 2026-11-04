import { useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, Mark, Paper, easeInOut, ff, palette, progress, type ExplainerColors } from './theme'

export type ClockSide = { label: string; minutes: number }
export type ClockCompareProps = {
  title?: string
  before: ClockSide
  after: ClockSide
  /** Line under the savings ("a menos por fechamento"). */
  savingsLabel?: string
  colors?: Partial<ExplainerColors>
}

export const CLOCK_COMPARE_DURATION = 210

/** "3 h", "5 min", "2 h 55 min". */
export const formatMinutes = (m: number) => {
  const t = Math.round(m), h = Math.floor(t / 60), r = t % 60
  return h ? `${h} h${r ? ` ${r} min` : ''}` : `${r} min`
}

function Clock({ minutes, size, color, c }: { minutes: number; size: number; color: string; c: ReturnType<typeof palette> }) {
  const r = size / 2
  return <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`}>
    <circle r={r - 6} fill={c.card} stroke={c.ink} strokeWidth={8} />
    {Array.from({ length: 60 }, (_, i) => {
      const a = (i / 60) * Math.PI * 2, big = i % 5 === 0
      return <line key={i} x1={Math.sin(a) * (r - 22)} y1={-Math.cos(a) * (r - 22)} x2={Math.sin(a) * (r - (big ? 46 : 32))} y2={-Math.cos(a) * (r - (big ? 46 : 32))} stroke={c.ink} strokeWidth={big ? 6 : 2} opacity={big ? 1 : 0.5} />
    })}
    {/* Elapsed time as a wedge on the dial (laps beyond the first hour keep the wedge full). */}
    <path d={wedge(Math.min(minutes, 60) / 60, r - 52)} fill={color} opacity={0.18} />
    <line x1={0} y1={0} x2={0} y2={-(r * 0.48)} stroke={c.ink} strokeWidth={14} strokeLinecap="round" transform={`rotate(${minutes * 0.5})`} />
    <line x1={0} y1={0} x2={0} y2={-(r * 0.7)} stroke={color} strokeWidth={9} strokeLinecap="round" transform={`rotate(${minutes * 6})`} />
    <circle r={14} fill={c.ink} />
  </svg>
}
function wedge(share: number, r: number) {
  if (share <= 0) return ''
  if (share >= 1) return `M 0,${-r} A ${r},${r} 0 1 1 0,${r} A ${r},${r} 0 1 1 0,${-r} Z`
  const a = share * Math.PI * 2
  return `M 0,0 L 0,${-r} A ${r},${r} 0 ${share > 0.5 ? 1 : 0} 1 ${Math.sin(a) * r},${-Math.cos(a) * r} Z`
}

/**
 * Before × after in time: two clocks, the first spins through hours, the second barely moves,
 * then the time saved counts up and gets the highlighter.
 */
export function ClockCompare({ title, before, after, savingsLabel = 'a menos', colors }: ClockCompareProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const size = 400 * s
  const spinB = progress(frame, 24, 90, easeInOut)
  const spinA = progress(frame, 70, 30, easeInOut)
  const saved = Math.max(0, before.minutes - after.minutes)
  const savedIn = progress(frame, 128, 16)
  const savedCount = Math.round(saved * progress(frame, 128, 30))

  const side = (cfg: ClockSide, spin: number, color: string, i: number) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 * s, opacity: progress(frame, 8 + i * 8, 12) }}>
      <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 64 * s, textTransform: 'uppercase', color: c.ink }}>{cfg.label}</div>
      <Clock minutes={cfg.minutes * spin} size={size} color={color} c={c} />
      <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 90 * s, color, fontVariantNumeric: 'tabular-nums' }}>{formatMinutes(cfg.minutes * spin)}</div>
    </div>
  )

  return (
    <Paper color={c.paper}>
      {title && <h1 style={{ position: 'absolute', left: 0, right: 0, top: 60 * s, margin: 0, textAlign: 'center', ...ff(FONT.head), fontWeight: 800, fontSize: 84 * s, color: c.ink, opacity: progress(frame, 0, 14) }}>{title}</h1>}
      <div style={{ position: 'absolute', left: 0, right: 0, top: title ? 190 * s : 120 * s, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 120 * s }}>
        {side(before, spinB, c.red, 0)}
        <div style={{ ...ff(FONT.hand), fontWeight: 700, fontSize: 90 * s, color: c.muted, alignSelf: 'center', marginTop: 40 * s }}>×</div>
        {side(after, spinA, c.teal, 1)}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 70 * s, textAlign: 'center', opacity: savedIn, transform: `translateY(${(1 - savedIn) * 20 * s}px)` }}>
        <span style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 84 * s, color: c.ink }}>
          <Mark amount={progress(frame, 160, 16)} seed="clock-saved">{formatMinutes(savedCount)} {savingsLabel}</Mark>
        </span>
      </div>
    </Paper>
  )
}

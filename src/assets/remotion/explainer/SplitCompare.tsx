import { random, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, Mark, Paper, ff, palette, progress, type ExplainerColors } from './theme'

type Side = { label: string; items: string[] }
export type SplitCompareProps = {
  title?: string
  left: Side
  right: Side
  /** Side that wins: its header gets the highlighter and the other side fades. */
  winner?: 'left' | 'right'
  colors?: Partial<ExplainerColors>
}

export const SPLIT_COMPARE_DURATION = 210

/** Hand-drawn ✗ or ✓ that draws itself. */
function Tick({ ok, amount, size, color, seed }: { ok: boolean; amount: number; size: number; color: string; seed: string }) {
  const r = (k: string) => random(`${seed}-${k}`) * 6
  const stroke = { fill: 'none', stroke: color, strokeWidth: 11, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, pathLength: 1, strokeDasharray: 1 }
  return <svg viewBox="0 0 100 100" width={size} height={size} style={{ flex: 'none', overflow: 'visible' }}>
    {ok
      ? <path d={`M ${12 + r('a')},${52 + r('b')} L ${40 + r('c')},${80} L ${90 - r('d')},${18 + r('e')}`} {...stroke} strokeDashoffset={1 - amount} />
      : <>
        <path d={`M ${16 + r('a')},${16 + r('b')} L ${84 - r('c')},${84 - r('d')}`} {...stroke} strokeDashoffset={1 - Math.min(1, amount * 2)} />
        <path d={`M ${84 - r('e')},${18 + r('f')} L ${18 + r('g')},${82 - r('h')}`} {...stroke} strokeDashoffset={1 - Math.max(0, amount * 2 - 1)} />
      </>}
  </svg>
}

/**
 * Two columns, "before × after": a hand-drawn divider grows down the middle, each item comes in
 * with a ✗ or a ✓, and in the end the winning side gets the highlighter while the other fades.
 */
export function SplitCompare({ title, left, right, winner = 'right', colors }: SplitCompareProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const top = title ? 230 * s : 120 * s
  const rows = Math.max(left.items.length, right.items.length)
  const itemAt = (side: number, i: number) => 40 + i * 16 + side * 8
  const verdict = 40 + rows * 16 + 30
  const fade = progress(frame, verdict + 10, 16)
  const divider = progress(frame, 14, 30)

  const column = (side: Side, which: 'left' | 'right', idx: number) => {
    const ok = which === winner
    const dim = ok ? 1 : 1 - fade * 0.5
    return <div style={{ flex: 1, padding: `0 ${80 * s}px`, opacity: dim, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 96 * s, lineHeight: 1, color: c.ink, textTransform: 'uppercase', opacity: progress(frame, 6 + idx * 6, 12) }}>
        {ok ? <Mark amount={progress(frame, verdict, 18)} seed={`split-${which}`}>{side.label}</Mark> : side.label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 34 * s, marginTop: 56 * s }}>
        {side.items.map((item, i) => {
          const p = progress(frame, itemAt(idx, i), 12)
          return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22 * s, opacity: p, transform: `translateX(${(1 - p) * (idx ? 30 : -30) * s}px)` }}>
            <Tick ok={ok} amount={progress(frame, itemAt(idx, i) + 6, 12)} size={60 * s} color={ok ? c.teal : c.red} seed={`${which}-${i}`} />
            <span style={{ ...ff(FONT.serif), fontSize: 48 * s, lineHeight: 1.25, color: c.text }}>{item}</span>
          </div>
        })}
      </div>
    </div>
  }

  return (
    <Paper color={c.paper}>
      {title && <h1 style={{ position: 'absolute', left: 0, right: 0, top: 80 * s, margin: 0, textAlign: 'center', ...ff(FONT.head), fontWeight: 800, fontSize: 84 * s, color: c.ink, opacity: progress(frame, 0, 14) }}>{title}</h1>}
      <div style={{ position: 'absolute', left: 60 * s, right: 60 * s, top, bottom: 100 * s, display: 'flex' }}>
        {column(left, 'left', 0)}
        <svg width={20 * s} height="100%" viewBox="0 0 20 100" preserveAspectRatio="none" style={{ flex: 'none', overflow: 'visible' }}>
          <path d={`M 10,0 C 4,25 16,50 9,75 S 12,95 10,100`} fill="none" stroke={c.ink} strokeWidth={4 * s} vectorEffect="non-scaling-stroke"
            style={{ clipPath: `inset(0 0 ${(1 - divider) * 100}% 0)` }} />
        </svg>
        {column(right, 'right', 1)}
      </div>
    </Paper>
  )
}

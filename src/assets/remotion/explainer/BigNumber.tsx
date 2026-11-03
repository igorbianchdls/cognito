import { useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, HandNote, Mark, Paper, countUp, ff, palette, progress, type ExplainerColors } from './theme'

export type BigNumberProps = {
  kicker?: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  /** What the number means, in one line under it. */
  label: string
  /** Optional handwritten aside next to the number. */
  note?: string
  colors?: Partial<ExplainerColors>
}

export const BIG_NUMBER_DURATION = 150

/** One huge number that counts up, gets the highlighter under it, then its meaning and a handwritten aside. */
export function BigNumber({ kicker, value, prefix = '', suffix = '', decimals = 0, label, note, colors }: BigNumberProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const pop = progress(frame, 6, 16)
  const labelIn = progress(frame, 56, 16)
  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: `0 ${120 * s}px` }}>
        {kicker && <div style={{ ...ff(FONT.head), fontWeight: 700, fontSize: 42 * s, letterSpacing: 5 * s, textTransform: 'uppercase', color: c.red, opacity: progress(frame, 0, 12) }}>{kicker}</div>}
        <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 380 * s, lineHeight: 0.95, letterSpacing: -6 * s, color: c.ink, fontVariantNumeric: 'tabular-nums', opacity: pop, transform: `scale(${0.9 + 0.1 * pop})`, marginTop: 10 * s }}>
          <Mark amount={progress(frame, 40, 18)} seed="big-number" thickness={8}>{prefix}{countUp(frame, value, 6, 34, decimals)}{suffix}</Mark>
        </div>
        <div style={{ ...ff(FONT.serif), fontSize: 54 * s, lineHeight: 1.3, color: c.text, maxWidth: 1300 * s, marginTop: 30 * s, opacity: labelIn, transform: `translateY(${(1 - labelIn) * 18 * s}px)` }}>{label}</div>
      </div>
      {note && <HandNote amount={progress(frame, 80, 22)} color={c.red} size={76 * s} style={{ position: 'absolute', right: 150 * s, top: height * 0.2, transform: 'rotate(6deg)', textAlign: 'right', width: width * 0.24 }}>{note}</HandNote>}
    </Paper>
  )
}

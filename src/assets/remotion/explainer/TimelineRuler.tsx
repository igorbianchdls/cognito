import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, Mark, Paper, easeInOut, ff, jitter, palette, progress, type ExplainerColors } from './theme'

export type TimelineRulerProps = {
  title?: string
  events: { year: string; title: string; text?: string }[]
  colors?: Partial<ExplainerColors>
}

const INTRO = 24
const STEP = 50
/** Length for a given number of events (the demo has 4). */
export const timelineDuration = (events: number) => INTRO + events * STEP + 30
export const TIMELINE_RULER_DURATION = timelineDuration(4)

/**
 * A ruler of years slides sideways and stops on each event: the year gets circled
 * and its card drops in above the line; earlier cards stay, faded.
 */
export function TimelineRuler({ title, events, colors }: TimelineRulerProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const gap = 560 * s
  const lineY = height * 0.7

  // Camera position, in "event units": eases from one event to the next.
  let at = 0
  events.forEach((_, i) => { if (i > 0) at += progress(frame, INTRO + i * STEP - 18, 22, easeInOut) })
  const offset = width / 2 - at * gap
  const arrive = (i: number) => INTRO + i * STEP + (i === 0 ? 0 : 4)
  const titleIn = progress(frame, 0, 14)
  const rulerIn = progress(frame, 6, 20)
  const ticks = Array.from({ length: (events.length + 2) * 5 }, (_, k) => k - 5)

  return (
    <Paper color={c.paper}>
      {title && <h1 style={{ position: 'absolute', left: 140 * s, top: 90 * s, margin: 0, ...ff(FONT.head), fontWeight: 800, fontSize: 92 * s, lineHeight: 1.02, color: c.ink, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20 * s}px)` }}>{title}</h1>}
      <div style={{ position: 'absolute', left: 0, right: 0, top: lineY, height: 6 * s, background: c.ink, transformOrigin: 'left', transform: `scaleX(${rulerIn})` }} />
      {ticks.map((k) => {
        const x = offset + (k / 5) * gap
        const major = k % 5 === 0
        return x > -40 && x < width + 40 && <div key={k} style={{ position: 'absolute', left: x - 2 * s, top: lineY - (major ? 26 : 12) * s, width: (major ? 5 : 3) * s, height: (major ? 58 : 30) * s, background: c.ink, opacity: rulerIn * (major ? 1 : 0.5) }} />
      })}
      {events.map((e, i) => {
        const x = offset + i * gap
        const drop = progress(frame, arrive(i), 14)
        // An event turns current only once the ruler has arrived on it.
        const current = Math.abs(at - i) < 0.04
        const past = i < at - 0.04
        const w = jitter(frame, `tl-${i}`, 1.4, 4)
        return <div key={i}>
          <div style={{ position: 'absolute', left: x, top: lineY + 52 * s, transform: 'translateX(-50%)', ...ff(FONT.head), fontWeight: 800, fontSize: 64 * s, color: current ? c.red : c.ink, opacity: rulerIn * (past ? 0.5 : 1) }}>
            {current ? <Mark kind="circulo" amount={progress(frame, arrive(i) + 6, 16)} color={c.red} seed={`tl-year-${i}`}>{e.year}</Mark> : e.year}
          </div>
          {drop > 0 && <div style={{ position: 'absolute', left: x, bottom: height - lineY + 70 * s, width: 470 * s, transform: `translateX(-50%) translate(${w.x}px, ${w.y + (1 - drop) * -50 * s}px) rotate(${(i % 2 ? 1.5 : -1.5) + w.rotate}deg)`,
            opacity: drop * (past ? 0.45 : 1), background: c.card, padding: `${26 * s}px ${30 * s}px`, boxShadow: `0 ${14 * s}px ${34 * s}px rgba(40,30,10,.2)` }}>
            <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 46 * s, lineHeight: 1.05, color: c.ink }}>{e.title}</div>
            {e.text && <div style={{ ...ff(FONT.serif), fontSize: 28 * s, lineHeight: 1.4, color: c.text, marginTop: 10 * s }}>{e.text}</div>}
            <span style={{ position: 'absolute', left: '50%', bottom: -60 * s, width: 3 * s, height: 60 * s, background: c.ink, opacity: 0.6 }} />
          </div>}
        </div>
      })}
      <div style={{ position: 'absolute', left: width / 2 - 14 * s, top: lineY - 11 * s, width: 28 * s, height: 28 * s, borderRadius: '50%', background: c.red, border: `${5 * s}px solid ${c.paper}`, opacity: rulerIn, transform: `scale(${interpolate(rulerIn, [0, 1], [0, 1])})` }} />
    </Paper>
  )
}

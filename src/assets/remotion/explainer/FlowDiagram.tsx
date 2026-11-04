import { random, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, HandArrow, Mark, Paper, ff, jitter, palette, progress, type ExplainerColors } from './theme'

export type FlowDiagramProps = {
  title?: string
  steps: { label: string; detail?: string }[]
  /** Step that matters at the end: it gets the highlighter (default: the last). */
  active?: number
  colors?: Partial<ExplainerColors>
}

const STEP = 34
/** Length for a given number of steps (the demo has 4). */
export const flowDiagramDuration = (steps: number) => 30 + steps * STEP + 70
export const FLOW_DIAGRAM_DURATION = flowDiagramDuration(4)

/** Hand-drawn box outline in a w×h box. */
function boxPath(w: number, h: number, seed: string) {
  const r = (k: string) => (random(`${seed}-${k}`) - 0.5) * 8
  return `M ${r('a')},${r('b')} L ${w + r('c')},${r('d')} L ${w + r('e')},${h + r('f')} L ${r('g')},${h + r('h')} Z`
}

/**
 * A process drawn by hand: boxes pop in one after another, linked by arrows that draw
 * themselves, a dot runs through the whole flow, and the key step gets the highlighter.
 */
export function FlowDiagram({ title, steps, active, colors }: FlowDiagramProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const n = steps.length
  const margin = 140 * s
  const gap = 110 * s
  const boxW = Math.min(380 * s, (width - margin * 2 - gap * (n - 1)) / n)
  const boxH = 230 * s
  const y = height * 0.55
  const x = (i: number) => margin + i * (boxW + gap) + ((width - margin * 2) - (n * boxW + (n - 1) * gap)) / 2
  const at = (i: number) => 30 + i * STEP
  const done = at(n)
  const key = active ?? n - 1
  // A dot travels along the flow once everything is drawn.
  const run = progress(frame, done, 46, (t) => t) * (n - 1)
  const dotX = x(Math.floor(run)) + boxW + (Math.min(1, run - Math.floor(run)) * gap)

  return (
    <Paper color={c.paper}>
      {title && <h1 style={{ position: 'absolute', left: margin, top: 100 * s, margin: 0, ...ff(FONT.head), fontWeight: 800, fontSize: 96 * s, color: c.ink, opacity: progress(frame, 0, 14) }}>{title}</h1>}
      {steps.map((st, i) => {
        const pop = progress(frame, at(i), 14)
        const w = jitter(frame, `flow-${i}`, 1.2, 4)
        const on = i === key
        const lit = frame > done && run >= i - 0.05
        return <div key={i} style={{ position: 'absolute', left: x(i), top: y - boxH / 2, width: boxW, height: boxH, opacity: pop,
          transform: `translate(${w.x}px, ${w.y + (1 - pop) * 30 * s}px) rotate(${(i % 2 ? 1 : -1) * 1.2 + w.rotate}deg)` }}>
          <div style={{ position: 'absolute', inset: 0, background: lit ? (on ? c.card : '#FFFDF6') : c.card, boxShadow: `0 ${10 * s}px ${24 * s}px rgba(40,30,10,.16)` }} />
          <svg width={boxW} height={boxH} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <path d={boxPath(boxW, boxH, `flow-${i}`)} fill="none" stroke={on && lit ? c.red : c.ink} strokeWidth={4 * s} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress(frame, at(i), 18)} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: `0 ${20 * s}px` }}>
            <div style={{ ...ff(FONT.head), fontWeight: 700, fontSize: 30 * s, color: c.muted }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 52 * s, lineHeight: 1.05, color: c.ink, marginTop: 6 * s }}>
              {on ? <Mark amount={progress(frame, done + 50, 16)} seed={`flow-mark-${i}`}>{st.label}</Mark> : st.label}
            </div>
            {st.detail && <div style={{ ...ff(FONT.serif), fontSize: 28 * s, lineHeight: 1.3, color: c.text, marginTop: 10 * s }}>{st.detail}</div>}
          </div>
        </div>
      })}
      {steps.slice(1).map((_, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0 }}>
          <HandArrow from={[x(i) + boxW + 14 * s, y]} to={[x(i + 1) - 14 * s, y]} amount={progress(frame, at(i + 1) - 10, 16)} color={c.ink} width={6 * s} bend={0.12} seed={`flow-arrow-${i}`} />
        </div>
      ))}
      {frame > done && run < n - 1 && <div style={{ position: 'absolute', left: dotX - 14 * s, top: y - 14 * s - 30 * s, width: 28 * s, height: 28 * s, borderRadius: '50%', background: c.red, boxShadow: `0 0 0 ${6 * s}px rgba(229,70,58,.2)` }} />}
    </Paper>
  )
}

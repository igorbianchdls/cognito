import { useCurrentFrame, useVideoConfig } from 'remotion'
import { Tick } from './SplitCompare'
import { FONT, Paper, ff, jitter, palette, progress, type ExplainerColors } from './theme'

export type ChecklistProps = {
  title: string
  items: string[]
  /** Rubber stamp at the end ("RESOLVIDO"). */
  stamp?: string
  colors?: Partial<ExplainerColors>
}

const ITEM = 26
/** Length for a given number of items (the demo has 4). */
export const checklistDuration = (items: number) => 30 + items * ITEM + 60
export const CHECKLIST_DURATION = checklistDuration(4)

/**
 * A notepad page: handwritten items appear and get ticked one after another,
 * then an optional rubber stamp lands on the page.
 */
export function Checklist({ title, items, stamp, colors }: ChecklistProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const padW = 980 * s, padH = 860 * s, line = 96 * s
  const enter = progress(frame, 0, 18)
  const done = 30 + items.length * ITEM
  const stampIn = progress(frame, done + 8, 10)
  const w = jitter(frame, 'pad', 0.8, 5)

  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: padW, height: padH, transform: `translate(-50%, -50%) translate(${w.x}px, ${w.y + (1 - enter) * 120 * s}px) rotate(${-1.5 + w.rotate}deg)`, opacity: enter,
        background: `repeating-linear-gradient(180deg, transparent 0, transparent ${line - 2 * s}px, #B9CDE6 ${line - 2 * s}px, #B9CDE6 ${line}px) 0 ${170 * s}px / 100% calc(100% - ${170 * s}px) no-repeat, #FBF8EE`,
        boxShadow: `0 ${24 * s}px ${60 * s}px rgba(40,30,10,.25)` }}>
        <span style={{ position: 'absolute', left: 120 * s, top: 0, bottom: 0, width: 3 * s, background: '#E59A98' }} />
        <div style={{ position: 'absolute', left: 160 * s, right: 60 * s, top: 60 * s, ...ff(FONT.head), fontWeight: 800, fontSize: 70 * s, color: c.ink }}>{title}</div>
        {items.map((item, i) => {
          const at = 30 + i * ITEM
          const write = progress(frame, at, 14)
          return <div key={i} style={{ position: 'absolute', left: 40 * s, right: 60 * s, top: 170 * s + i * line + line * 0.12, height: line * 0.8, display: 'flex', alignItems: 'center', gap: 46 * s }}>
            <Tick ok amount={progress(frame, at + 12, 10)} size={62 * s} color={c.teal} seed={`check-${i}`} />
            <span style={{ ...ff(FONT.hand), fontWeight: 700, fontSize: 62 * s, color: c.ink, clipPath: `inset(-20% ${(1 - write) * 100}% -20% -5%)` }}>{item}</span>
          </div>
        })}
      </div>
      {stamp && stampIn > 0 && <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-10%, 60%) rotate(-12deg) scale(${2.2 - 1.2 * stampIn})`, opacity: stampIn * 0.9,
        border: `${8 * s}px solid ${c.red}`, borderRadius: 14 * s, padding: `${10 * s}px ${34 * s}px`, ...ff(FONT.head), fontWeight: 800, fontSize: 92 * s, letterSpacing: 6 * s, color: c.red, textTransform: 'uppercase', mixBlendMode: 'multiply' }}>{stamp}</div>}
    </Paper>
  )
}

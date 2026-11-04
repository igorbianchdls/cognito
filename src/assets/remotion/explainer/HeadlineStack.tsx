import { random, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, Mark, Paper, ff, palette, progress, type ExplainerColors } from './theme'

export type Clipping = {
  /** Made-up publication name (not a real paper's brand). */
  source: string
  /** Headline; wrap words in [[double brackets]] to highlight them on the top clipping. */
  headline: string
  date?: string
}
export type HeadlineStackProps = {
  clippings: Clipping[]
  /** Banner at the end ("Todo mundo está falando disso"). */
  title?: string
  colors?: Partial<ExplainerColors>
}

const DROP = 20
/** Length for a given number of clippings (the demo has 5). */
export const headlineStackDuration = (n: number) => 20 + n * DROP + 70
export const HEADLINE_STACK_DURATION = headlineStackDuration(5)

/**
 * "Everybody is talking about it": newspaper clippings drop one on top of another at
 * slightly different angles, the last one's headline gets the highlighter, then a banner.
 */
export function HeadlineStack({ clippings, title, colors }: HeadlineStackProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const n = clippings.length
  const done = 20 + n * DROP
  const push = progress(frame, 10, done + 40, (t) => t)
  const bannerIn = progress(frame, done + 30, 14)

  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + push * 0.06})` }}>
        {clippings.map((clip, i) => {
          const r = (k: string) => random(`clip-${i}-${k}`) - 0.5
          const drop = progress(frame, 20 + i * DROP, 10)
          const top = i === n - 1
          const cw = 900 * s, x = width / 2 + r('x') * width * 0.4, y = height * 0.5 + r('y') * height * 0.32
          const parts = clip.headline.split(/(\[\[.*?\]\])/).filter(Boolean)
          return drop > 0 && <div key={i} style={{ position: 'absolute', left: x, top: y, width: cw, transform: `translate(-50%, -50%) rotate(${r('r') * 16}deg) scale(${1.25 - 0.25 * drop})`, opacity: Math.min(1, drop * 1.5),
            background: '#F2ECDD', padding: `${26 * s}px ${34 * s}px ${32 * s}px`, boxShadow: `0 ${14 * s}px ${34 * s}px rgba(40,30,10,${0.18 + 0.12 * drop})`,
            clipPath: `polygon(${Array.from({ length: 9 }, (_, k) => `${k * 12.5}% ${(r(`t${k}`) + 0.5) * 2.5}%`).join(', ')}, 100% 100%, 0 100%)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `${2 * s}px solid ${c.ink}`, paddingBottom: 8 * s, marginBottom: 14 * s, ...ff(FONT.serif), fontWeight: 700, fontSize: 30 * s, color: c.ink }}>
              <span>{clip.source}</span>{clip.date && <span style={{ ...ff(FONT.sans), fontWeight: 400, fontSize: 20 * s, color: c.muted }}>{clip.date}</span>}
            </div>
            <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 64 * s, lineHeight: 1.02, color: c.ink }}>
              {parts.map((p, pi) => p.startsWith('[[')
                ? (top ? <Mark key={pi} amount={progress(frame, done + 8, 16)} seed={`clip-mark-${pi}`}>{p.slice(2, -2)}</Mark> : <span key={pi}>{p.slice(2, -2)}</span>)
                : <span key={pi}>{p}</span>)}
            </div>
            <div style={{ display: 'grid', gap: 8 * s, marginTop: 18 * s }}>{[92, 100, 76].map((wd, k) => <span key={k} style={{ height: 10 * s, width: `${wd}%`, background: c.line }} />)}</div>
          </div>
        })}
      </div>
      {title && <div style={{ position: 'absolute', left: '50%', bottom: 80 * s, transform: `translateX(-50%) translateY(${(1 - bannerIn) * 30 * s}px) rotate(-1deg)`, opacity: bannerIn,
        background: c.ink, color: c.paper, padding: `${16 * s}px ${40 * s}px`, ...ff(FONT.head), fontWeight: 800, fontSize: 70 * s, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</div>}
    </Paper>
  )
}

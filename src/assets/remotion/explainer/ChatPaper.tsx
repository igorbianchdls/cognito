import { useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, Mark, Paper, ff, jitter, palette, progress, type ExplainerColors } from './theme'

export type ChatMessage = {
  from: 'pessoa' | 'assistente'
  /** Wrap keywords in [[double brackets]] to highlight them. */
  text: string
}
export type ChatPaperProps = {
  title?: string
  messages: ChatMessage[]
  /** Names shown over the bubbles (generic by default, no product logos). */
  personName?: string
  assistantName?: string
  colors?: Partial<ExplainerColors>
}

/** When each message starts, given how long the earlier ones take to write. */
function schedule(messages: ChatMessage[]) {
  let t = 20
  return messages.map((m) => {
    const words = m.text.replace(/\[\[|\]\]/g, '').split(/\s+/).length
    const typing = m.from === 'assistente' ? 22 : 0
    const start = t + typing
    t = start + words * 2 + 26
    return { start, typingFrom: start - typing, end: start + words * 2 }
  })
}
export const chatPaperDuration = (messages: ChatMessage[]) => { const s = schedule(messages); return s[s.length - 1].end + 50 }

/**
 * A chat told on paper: cut-out speech bubbles come in one by one, the assistant "types" first,
 * text appears word by word and keywords get the highlighter.
 */
export function ChatPaper({ title, messages, personName = 'Você', assistantName = 'Assistente', colors }: ChatPaperProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const times = schedule(messages)

  return (
    <Paper color={c.paper}>
      {title && <h1 style={{ position: 'absolute', left: 160 * s, top: 80 * s, margin: 0, ...ff(FONT.head), fontWeight: 800, fontSize: 84 * s, color: c.ink, opacity: progress(frame, 0, 14) }}>{title}</h1>}
      {/* Messages stack from the bottom, so older ones move up and out as the thread grows. */}
      <div style={{ position: 'absolute', left: width * 0.16 - 24 * s, right: width * 0.16 - 24 * s, padding: `0 ${24 * s}px`, top: title ? 230 * s : 120 * s, bottom: 80 * s, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 34 * s, overflow: 'hidden', maskImage: `linear-gradient(180deg, transparent ${40 * s}px, #000 ${110 * s}px)`, WebkitMaskImage: `linear-gradient(180deg, transparent ${40 * s}px, #000 ${110 * s}px)` }}>
        {messages.map((m, i) => {
          const t = times[i]
          if (frame < t.typingFrom) return null
          const mine = m.from === 'pessoa'
          const pop = progress(frame, t.typingFrom, 10)
          const typing = !mine && frame < t.start
          const w = jitter(frame, `chat-${i}`, 1, 5)
          const parts = m.text.split(/(\[\[.*?\]\])/).filter(Boolean)
          let k = 0
          const body = parts.map((p, pi) => {
            const marked = p.startsWith('[[')
            const words = (marked ? p.slice(2, -2) : p).trim().split(/\s+/).filter(Boolean)
            const els = words.map((word) => { const idx = k++; const on = progress(frame, t.start + idx * 2, 4); return <span key={idx} style={{ opacity: on }}>{word} </span> })
            return marked ? <Mark key={pi} amount={progress(frame, t.start + k * 2, 10)} seed={`chat-${i}-${pi}`}>{els}</Mark> : <span key={pi}>{els}</span>
          })
          return <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '72%', opacity: pop, transform: `translate(${w.x}px, ${w.y + (1 - pop) * 24 * s}px) rotate(${(mine ? 1 : -1) * 0.8 + w.rotate}deg)` }}>
            <div style={{ ...ff(FONT.head), fontWeight: 700, fontSize: 26 * s, letterSpacing: 2 * s, textTransform: 'uppercase', color: mine ? c.muted : c.red, textAlign: mine ? 'right' : 'left', marginBottom: 8 * s }}>{mine ? personName : assistantName}</div>
            <div style={{ position: 'relative', background: mine ? '#E9E1CF' : c.card, padding: `${26 * s}px ${34 * s}px`, borderRadius: 6 * s, boxShadow: `0 ${10 * s}px ${24 * s}px rgba(40,30,10,.16)`,
              ...ff(FONT.serif), fontSize: 44 * s, lineHeight: 1.35, color: c.ink }}>
              {typing ? <span style={{ display: 'inline-flex', gap: 10 * s, padding: `${8 * s}px 0` }}>{[0, 1, 2].map((d) => <i key={d} style={{ width: 14 * s, height: 14 * s, borderRadius: '50%', background: c.muted, opacity: 0.35 + 0.65 * Math.abs(Math.sin((frame - d * 4) / 5)) }} />)}</span> : body}
              <span style={{ position: 'absolute', bottom: -16 * s, [mine ? 'right' : 'left']: 30 * s, width: 0, height: 0, borderLeft: `${16 * s}px solid transparent`, borderRight: `${16 * s}px solid transparent`, borderTop: `${18 * s}px solid ${mine ? '#E9E1CF' : c.card}` }} />
            </div>
          </div>
        })}
      </div>
    </Paper>
  )
}

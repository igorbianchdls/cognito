import type { ReactNode } from 'react'
import { Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, Mark, Paper, ff, jitter, palette, progress, type ExplainerColors } from './theme'

export type QuoteCardProps = {
  /** The quote. Wrap the words to highlight in [[double brackets]]. */
  quote: string
  author: string
  role?: string
  /** Optional portrait (path in /public or URL), shown as a taped print. */
  photo?: string
  colors?: Partial<ExplainerColors>
}

export const QUOTE_CARD_DURATION = 180

/** Big quotation: oversized quote mark, serif text written word by word, a highlighted phrase and the attribution. */
export function QuoteCard({ quote, author, role, photo, colors }: QuoteCardProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const wide = width > height
  const parts = quote.split(/(\[\[.*?\]\])/).filter(Boolean)
  const words = parts.flatMap((p, pi) => (p.startsWith('[[') ? p.slice(2, -2) : p).trim().split(/\s+/).filter(Boolean).map((w) => ({ w, marked: p.startsWith('[['), pi })))
  const wordsDone = 16 + words.length * 2.2
  const markAt = (pi: number) => wordsDone + 6 + parts.slice(0, pi).filter((p) => p.startsWith('[[')).length * 14
  const attrib = progress(frame, wordsDone + 26, 16)
  const photoIn = progress(frame, 8, 14)
  const wob = jitter(frame, 'quote-photo', 1.6, 4)
  const textLeft = wide ? (photo ? 640 : 220) * s : 110 * s

  // Group consecutive marked words of the same phrase so the highlighter runs under them together.
  const nodes: ReactNode[] = []
  words.forEach((item, i) => {
    const p = progress(frame, 16 + i * 2.2, 10)
    const el = <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 16 * s}px)` }}>{item.w}</span>
    nodes.push(item.marked
      ? <span key={`m${i}`}><Mark amount={progress(frame, markAt(item.pi) + (i - words.findIndex((x) => x.pi === item.pi)) * 3, 8, (t) => t)} seed={`q-${i}`}><span style={{ paddingRight: words[i + 1]?.pi === item.pi ? '0.25em' : 0 }}>{el}</span></Mark>{words[i + 1]?.pi === item.pi ? '' : ' '}</span>
      : <span key={`w${i}`}>{el} </span>)
  })

  return (
    <Paper color={c.paper}>
      {photo && <div style={{ position: 'absolute', left: wide ? 150 * s : width / 2 - 200 * s, top: wide ? height / 2 - 260 * s : 140 * s, width: 400 * s, height: 500 * s, background: c.card, padding: 14 * s, boxSizing: 'border-box',
        boxShadow: `0 ${18 * s}px ${40 * s}px rgba(40,30,10,.28)`, opacity: photoIn, transform: `translate(${wob.x}px, ${wob.y + (1 - photoIn) * -60 * s}px) rotate(${-4 + wob.rotate}deg) scale(${1.15 - 0.15 * photoIn})` }}>
        <Img src={photo.startsWith('http') ? photo : staticFile(photo.replace(/^\//, ''))} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(0.35) contrast(1.05)' }} />
        <span style={{ position: 'absolute', left: '50%', top: -22 * s, width: 170 * s, height: 50 * s, transform: 'translateX(-50%) rotate(3deg)', background: 'rgba(236,226,196,.85)' }} />
      </div>}
      <div style={{ position: 'absolute', left: textLeft, right: (wide ? 160 : 110) * s, top: wide ? '50%' : height * 0.48, transform: wide ? 'translateY(-50%)' : undefined }}>
        <div style={{ ...ff(FONT.serif), fontWeight: 700, fontSize: 260 * s, lineHeight: 0.6, height: 110 * s, color: c.red, opacity: progress(frame, 4, 10), transform: `translateY(${(1 - progress(frame, 4, 12)) * 30 * s}px)` }}>“</div>
        <blockquote style={{ margin: 0, ...ff(FONT.serif), fontStyle: 'italic', fontSize: (wide ? 64 : 58) * s, lineHeight: 1.3, color: c.ink }}>{nodes}</blockquote>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 * s, marginTop: 44 * s, opacity: attrib, transform: `translateX(${(1 - attrib) * -24 * s}px)` }}>
          <span style={{ flex: 'none', width: 60 * s, height: 5 * s, background: c.red, marginTop: 22 * s }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4 * s }}>
            <span style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 42 * s, letterSpacing: 2 * s, textTransform: 'uppercase', color: c.ink, whiteSpace: 'nowrap' }}>{author}</span>
            {role && <span style={{ ...ff(FONT.serif), fontSize: 32 * s, lineHeight: 1.3, color: c.muted }}>{role}</span>}
          </span>
        </div>
      </div>
    </Paper>
  )
}

import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, ff, HandArrow, HandNote, Mark, Paper, easeInOut, jitter, palette, progress, type ExplainerColors } from './theme'

export type DocumentZoomProps = {
  /** Where the clipping comes from, printed at the top ("Diário do Comércio"). */
  source: string
  date?: string
  title: string
  paragraphs: string[]
  /** Paragraph to zoom into and the exact phrase in it to highlight. */
  highlight: { paragraph: number; text: string }
  /** Handwritten note that points at the highlight at the end. */
  note?: string
  colors?: Partial<ExplainerColors>
}

export const DOCUMENT_ZOOM_DURATION = 180
const HEADER = 0.3 // share of the page taken by the masthead and title

/**
 * A printed page slides in at an angle, the camera pushes into one paragraph,
 * the phrase gets highlighted while the rest of the page dims, and a note points at it.
 */
export function DocumentZoom({ source, date, title, paragraphs, highlight, note, colors }: DocumentZoomProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = width / 1080
  const pageW = Math.min(width * 0.84, height * 0.62)
  const pageH = pageW * 1.32
  const n = Math.max(1, paragraphs.length)
  const target = Math.min(n - 1, Math.max(0, highlight.paragraph))

  const enter = progress(frame, 0, 26)
  const zoom = progress(frame, 40, 38, easeInOut)
  const mark = progress(frame, 82, 20)
  const dim = progress(frame, 84, 16)
  const noteIn = progress(frame, 112, 26)
  const scale = interpolate(zoom, [0, 1], [1, Math.min(1.6, width / pageW)]) // push in until the page fills the width, never past it
  // Center of the target paragraph, from the top of the page (rows share the space below the header).
  const targetY = pageH * (HEADER + ((target + 0.5) * (1 - HEADER)) / n)
  const shiftY = (pageH / 2 - targetY) * zoom
  const wobble = jitter(frame, 'doc', 1.2, 4)

  const parts = (p: string) => {
    const at = p.indexOf(highlight.text)
    if (at < 0) return <>{p}</>
    return <>{p.slice(0, at)}<Mark amount={mark} seed="doc-mark" color={c.marker}>{highlight.text}</Mark>{p.slice(at + highlight.text.length)}</>
  }

  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: pageW, height: pageH, perspective: 1600 * s,
        transform: `translate(-50%, -50%) translateY(${(1 - enter) * height * 0.7 + shiftY * scale}px) scale(${scale})` }}>
        <div style={{ width: '100%', height: '100%', background: c.card, boxShadow: `0 ${30 * s}px ${70 * s}px rgba(40,30,10,${0.28 - zoom * 0.1})`, padding: `${46 * s}px ${50 * s}px`, boxSizing: 'border-box',
          display: 'grid', gridTemplateRows: `${HEADER * 100}% repeat(${n}, 1fr)`, transformOrigin: '50% 50%',
          transform: `rotateX(${(1 - enter) * 24 + 4 * (1 - zoom)}deg) rotate(${-3 * (1 - zoom) + wobble.rotate * (1 - zoom)}deg)` }}>
          <header style={{ borderBottom: `${3 * s}px solid ${c.ink}`, display: 'flex', flexDirection: 'column', gap: 12 * s, overflow: 'hidden', opacity: 1 - dim * 0.65 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', ...ff(FONT.head), fontWeight: 700, fontSize: 30 * s, letterSpacing: 3 * s, textTransform: 'uppercase', color: c.ink }}>
              <span>{source}</span>{date && <span style={{ color: c.muted, fontWeight: 600 }}>{date}</span>}
            </div>
            <div style={{ height: 1.5 * s, background: c.ink }} />
            <h2 style={{ margin: 0, ...ff(FONT.serif), fontWeight: 700, fontSize: 54 * s, lineHeight: 1.08, color: c.ink }}>{title}</h2>
          </header>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: `${14 * s}px 0 0`, ...ff(FONT.serif), fontSize: 27 * s, lineHeight: 1.5, color: c.text, overflow: 'hidden',
              opacity: i === target ? 1 : 1 - dim * 0.7 }}>{i === target ? parts(p) : p}</p>
          ))}
        </div>
      </div>
      {note && <>
        <HandArrow from={[width * 0.3, height * 0.8]} to={[width * 0.42, height * 0.57]} amount={noteIn} color={c.red} width={7 * s} seed="doc-arrow" />
        <HandNote amount={progress(frame, 120, 24)} color={c.red} size={74 * s} style={{ position: 'absolute', left: width * 0.1, top: height * 0.8, maxWidth: width * 0.8, transform: 'rotate(-3deg)' }}>{note}</HandNote>
      </>}
    </Paper>
  )
}


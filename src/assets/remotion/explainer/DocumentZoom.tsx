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

/**
 * A printed page slides in at an angle, the camera pushes into one paragraph,
 * the phrase gets highlighted while the rest of the page dims, and a note points at it.
 */
export function DocumentZoom({ source, date, title, paragraphs, highlight, note, colors }: DocumentZoomProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080 // 1 at 1080p, in landscape or portrait
  const wide = width > height
  // Landscape: a wider clipping, so lines are long and the text fits; portrait: a tall printed page.
  const pageW = wide ? width * 0.5 : Math.min(width * 0.84, height * 0.62)
  const pageH = wide ? Math.min(pageW * 0.95, height * 0.86) : pageW * 1.32
  const HEADER = wide ? 0.26 : 0.3
  const n = Math.max(1, paragraphs.length)
  const target = Math.min(n - 1, Math.max(0, highlight.paragraph))

  const enter = progress(frame, 0, 26)
  const zoom = progress(frame, 40, 38, easeInOut)
  const mark = progress(frame, 82, 20)
  const dim = progress(frame, 84, 16)
  const noteIn = progress(frame, 112, 26)
  // Landscape: the page sits left of center and the note gets the right side. Portrait: page centered, note below.
  const pageX = wide ? width * 0.37 : width / 2
  const scale = interpolate(zoom, [0, 1], [1, wide ? 1.22 : Math.min(1.6, width / pageW)]) // push in, never past the frame width
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
      <div style={{ position: 'absolute', left: pageX, top: '50%', width: pageW, height: pageH, perspective: 1600 * s,
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
        {wide ? <>
          <HandArrow from={[width * 0.73, height * 0.36]} to={[pageX + pageW * scale * 0.24, height * 0.545]} amount={noteIn} color={c.red} width={7 * s} bend={0.25} seed="doc-arrow" />
          <HandNote amount={progress(frame, 120, 24)} color={c.red} size={80 * s} style={{ position: 'absolute', left: width * 0.71, top: height * 0.14, width: width * 0.26, transform: 'rotate(-4deg)' }}>{note}</HandNote>
        </> : <>
          <HandArrow from={[width * 0.3, height * 0.8]} to={[width * 0.42, height * 0.57]} amount={noteIn} color={c.red} width={7 * s} seed="doc-arrow" />
          <HandNote amount={progress(frame, 120, 24)} color={c.red} size={74 * s} style={{ position: 'absolute', left: width * 0.1, top: height * 0.8, maxWidth: width * 0.8, transform: 'rotate(-3deg)' }}>{note}</HandNote>
        </>}
      </>}
    </Paper>
  )
}


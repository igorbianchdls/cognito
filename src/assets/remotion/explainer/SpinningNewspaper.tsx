import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { EX, FONT, Mark, easeInOut, ff, progress, type ExplainerColors } from './theme'

export type SpinningNewspaperProps = {
  /** Newspaper name at the top (a made-up title, not a real paper's brand). */
  masthead: string
  date?: string
  /** Headline; wrap the words to highlight in [[double brackets]]. */
  headline: string
  dek?: string
  /** Optional photo on the front page (path in /public or URL). */
  photo?: string
  colors?: Partial<ExplainerColors>
}

export const SPINNING_NEWSPAPER_DURATION = 180

const filler = 'Empresas de todos os tamanhos começam a trocar sistemas complexos por conversas. O movimento ganhou força neste ano e já muda a rotina de quem cuida do financeiro, das notas e da cobrança. '

/**
 * Old-movie headline: the front page spins in from the dark and lands on screen, then the camera
 * moves in on the headline and the key words get the highlighter.
 */
export function SpinningNewspaper({ masthead, date, headline, dek, photo, colors }: SpinningNewspaperProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = { ...EX, ...colors }
  const s = Math.min(width, height) / 1080
  const spin = progress(frame, 0, 42, easeInOut)
  const push = progress(frame, 70, 40, easeInOut)
  const markAt = 112
  const pageW = height * 0.92 * 0.78, pageH = height * 0.92
  const rotate = interpolate(spin, [0, 1], [-900, -4])
  const scale = interpolate(spin, [0, 1], [0.05, 1]) * interpolate(push, [0, 1], [1, 1.45])
  const shiftY = interpolate(push, [0, 1], [0, pageH * 0.2])
  const blur = (1 - spin) * 6 * s
  const parts = headline.split(/(\[\[.*?\]\])/).filter(Boolean)
  let markIndex = 0

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, #3A332A 0%, #14110D 75%)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: pageW, height: pageH, background: '#F1EBDD', padding: `${36 * s}px ${40 * s}px`, boxSizing: 'border-box',
        transform: `translate(-50%, -50%) translateY(${shiftY * scale}px) rotate(${rotate}deg) scale(${scale})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        boxShadow: `0 ${30 * s}px ${80 * s}px rgba(0,0,0,.6)`, overflow: 'hidden', color: c.ink }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', ...ff(FONT.sans), fontSize: 15 * s, letterSpacing: 2 * s, textTransform: 'uppercase', borderBottom: `${2 * s}px solid ${c.ink}`, paddingBottom: 8 * s }}>
          <span>{date}</span><span>Edição especial</span>
        </div>
        <div style={{ ...ff(FONT.serif), fontWeight: 700, fontSize: 60 * s, lineHeight: 1.05, textAlign: 'center', whiteSpace: 'nowrap', margin: `${14 * s}px 0 ${10 * s}px`, letterSpacing: -1 * s }}>{masthead}</div>
        <div style={{ height: 6 * s, borderTop: `${2 * s}px solid ${c.ink}`, borderBottom: `${1 * s}px solid ${c.ink}`, marginBottom: 20 * s }} />
        <h1 style={{ margin: 0, ...ff(FONT.head), fontWeight: 800, fontSize: 82 * s, lineHeight: 0.98, textTransform: 'uppercase', textAlign: 'center' }}>
          {parts.map((p, i) => p.startsWith('[[')
            ? <Mark key={i} amount={progress(frame, markAt + markIndex++ * 12, 14)} seed={`news-${i}`}>{p.slice(2, -2)}</Mark>
            : <span key={i}>{p}</span>)}
        </h1>
        {dek && <p style={{ margin: `${18 * s}px 0`, ...ff(FONT.serif), fontStyle: 'italic', fontSize: 28 * s, lineHeight: 1.3, textAlign: 'center', color: c.text }}>{dek}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: photo ? '1.2fr 1fr' : '1fr 1fr 1fr', gap: 22 * s, marginTop: 10 * s }}>
          {photo && <Img src={photo.startsWith('http') ? photo : staticFile(photo.replace(/^\//, ''))} style={{ width: '100%', height: pageH * 0.36, objectFit: 'cover', filter: 'grayscale(1) contrast(1.15)' }} />}
          {Array.from({ length: photo ? 1 : 3 }, (_, k) => (
            <p key={k} style={{ margin: 0, ...ff(FONT.serif), fontSize: 15 * s, lineHeight: 1.45, color: c.text, textAlign: 'justify', columnCount: photo ? 2 : 1, columnGap: 18 * s, height: pageH * 0.36, overflow: 'hidden' }}>
              {filler.repeat(6)}
            </p>
          ))}
        </div>
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  )
}

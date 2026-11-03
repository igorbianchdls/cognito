import { Img, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, ff, Mark, Paper, jitter, palette, progress, type ExplainerColors } from './theme'

export type CutoutCollageProps = {
  title?: string
  /** Word(s) of the title to highlight. */
  titleMark?: string
  /** Photos (paths in /public or full URLs) with an optional label. Up to 4. */
  items: { src: string; caption?: string }[]
  colors?: Partial<ExplainerColors>
}

export const CUTOUT_COLLAGE_DURATION = 180

type Slot = { x: number; y: number; w: number; r: number }
// Landscape: prints spread across the width under the title (w is a fraction of the frame height).
const wideLayouts: Record<number, Slot[]> = {
  1: [{ x: 0.5, y: 0.58, w: 0.95, r: -3 }],
  2: [{ x: 0.36, y: 0.58, w: 0.78, r: -5 }, { x: 0.64, y: 0.62, w: 0.78, r: 4 }],
  3: [{ x: 0.24, y: 0.6, w: 0.64, r: -6 }, { x: 0.5, y: 0.56, w: 0.64, r: 3 }, { x: 0.76, y: 0.62, w: 0.64, r: -4 }],
  4: [{ x: 0.18, y: 0.62, w: 0.46, r: -6 }, { x: 0.39, y: 0.57, w: 0.46, r: 4 }, { x: 0.61, y: 0.63, w: 0.46, r: -3 }, { x: 0.82, y: 0.58, w: 0.46, r: 6 }],
}
// Portrait: where each print lands (fractions of the frame) and its tilt, for 1 to 4 photos.
const layouts: Record<number, Slot[]> = {
  1: [{ x: 0.5, y: 0.56, w: 0.74, r: -3 }],
  2: [{ x: 0.36, y: 0.5, w: 0.56, r: -6 }, { x: 0.64, y: 0.7, w: 0.56, r: 5 }],
  3: [{ x: 0.33, y: 0.44, w: 0.5, r: -7 }, { x: 0.68, y: 0.56, w: 0.5, r: 6 }, { x: 0.42, y: 0.76, w: 0.5, r: -2 }],
  4: [{ x: 0.3, y: 0.42, w: 0.46, r: -7 }, { x: 0.7, y: 0.47, w: 0.46, r: 5 }, { x: 0.32, y: 0.73, w: 0.46, r: 4 }, { x: 0.68, y: 0.77, w: 0.46, r: -5 }],
}

/**
 * Paper collage: photo prints drop onto the page one by one, taped at the top,
 * with a little stop-motion wobble and a label stuck on each.
 */
export function CutoutCollage({ title, titleMark, items, colors }: CutoutCollageProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080 // 1 at 1080p, in landscape or portrait
  const list = items.slice(0, 4)
  const slots = (height > width ? layouts : wideLayouts)[Math.max(1, list.length)]
  const vertical = height > width
  const titleIn = progress(frame, 0, 14)
  const allIn = 20 + list.length * 12 + 14

  const titleNode = title && titleMark && title.includes(titleMark)
    ? <>{title.split(titleMark)[0]}<Mark amount={progress(frame, allIn + 10, 16)} seed="collage-title">{titleMark}</Mark>{title.split(titleMark).slice(1).join(titleMark)}</>
    : title

  return (
    <Paper color={c.paper}>
      {list.map((item, i) => {
        const slot = slots[i]
        const drop = progress(frame, 20 + i * 12, 12)
        const w = jitter(frame, `cut-${i}`, 2.2 * s, 4)
        const pw = slot.w * (vertical ? width : height)
        const ph = pw * (vertical ? 1.18 : 1.2)
        const label = progress(frame, allIn + i * 6, 10)
        return drop > 0 && (
          <div key={i} style={{ position: 'absolute', left: slot.x * width, top: slot.y * height, width: pw, height: ph,
            transform: `translate(-50%, -50%) translate(${w.x}px, ${w.y + (1 - drop) * -80 * s}px) rotate(${slot.r + w.rotate}deg) scale(${1.18 - 0.18 * drop})`, opacity: drop }}>
            <div style={{ position: 'absolute', inset: 0, background: c.card, padding: 16 * s, boxShadow: `0 ${18 * s}px ${40 * s}px rgba(40,30,10,.28)`, boxSizing: 'border-box' }}>
              <Img src={item.src.startsWith('http') ? item.src : staticFile(item.src.replace(/^\//, ''))} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.85) contrast(1.05)' }} />
            </div>
            <Tape seed={`tape-${i}`} s={s} />
            {item.caption && <div style={{ position: 'absolute', left: -12 * s, top: 44 * s, background: c.ink, color: c.paper, ...ff(FONT.head), fontWeight: 700, fontSize: 36 * s, letterSpacing: 1.5 * s, textTransform: 'uppercase',
              padding: `${6 * s}px ${16 * s}px`, opacity: label, transform: `rotate(${-slot.r * 0.6}deg) scale(${0.9 + 0.1 * label})`, whiteSpace: 'nowrap' }}>{item.caption}</div>}
          </div>
        )
      })}
      {title && <div style={{ position: 'absolute', left: 80 * s, right: 80 * s, top: vertical ? height * 0.08 : height * 0.06, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20 * s}px)` }}>
        <h1 style={{ margin: 0, ...ff(FONT.head), fontWeight: 800, fontSize: 100 * s, lineHeight: 1.02, color: c.ink }}>{titleNode}</h1>
      </div>}
    </Paper>
  )
}

/** A strip of paper tape with torn ends across the top of a print. */
function Tape({ seed, s }: { seed: string; s: number }) {
  const r = (k: string) => random(`${seed}-${k}`)
  const torn = (side: 'l' | 'r') => Array.from({ length: 5 }, (_, i) => `${side === 'l' ? r(`l${i}`) * 6 : 94 + r(`r${i}`) * 6}% ${(side === 'l' ? i : 4 - i) * 25}%`).join(', ')
  return <div style={{ position: 'absolute', left: '50%', top: -22 * s, width: 190 * s, height: 54 * s, transform: `translateX(-50%) rotate(${(r('a') - 0.5) * 10}deg)`,
    background: 'rgba(236, 226, 196, 0.82)', boxShadow: '0 2px 4px rgba(0,0,0,.08)', clipPath: `polygon(${torn('l')}, ${torn('r')})` }} />
}

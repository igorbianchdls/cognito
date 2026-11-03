import { useId } from 'react'
import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, ff, jitter, palette, progress, type ExplainerColors } from './theme'

export type EvidenceItem = {
  /** Photo (path in /public or URL); without it the item is a handwritten sticky note. */
  src?: string
  title: string
  caption?: string
  /** Where it is pinned on the board, as fractions (0–1) of the board. */
  x: number
  y: number
  rotate?: number
}
export type EvidenceBoardProps = {
  items: EvidenceItem[]
  /** Red strings between items (indexes), drawn in this order as the camera visits. */
  links: [number, number][]
  title?: string
  colors?: Partial<ExplainerColors>
}

const VISIT = 40
/** Length for a given number of items (the demo has 5). */
export const evidenceBoardDuration = (items: number) => 30 + items * VISIT + 60
export const EVIDENCE_BOARD_DURATION = evidenceBoardDuration(5)

/**
 * Investigation board: photos and notes pinned to cork, the camera visits each one in turn
 * while red strings stretch between them, then pulls back to show the whole picture.
 */
export function EvidenceBoard({ items, links, title, colors }: EvidenceBoardProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const corkId = `cork-${useId().replace(/:/g, '')}`
  const BW = width * 1.7, BH = height * 1.7
  const overview = { x: BW / 2, y: BH / 2, k: Math.min(width / BW, height / BH) * 0.96 }

  // Camera keyframes: overview, each item in turn, overview again.
  const keys = [{ t: 0, ...overview }, { t: 26, ...overview }]
  items.forEach((it, i) => keys.push({ t: 30 + i * VISIT + 20, x: it.x * BW, y: it.y * BH, k: 1.05 }, { t: 30 + (i + 1) * VISIT, x: it.x * BW, y: it.y * BH, k: 1.05 }))
  const end = 30 + items.length * VISIT
  keys.push({ t: end + 28, ...overview })
  let cam = keys[keys.length - 1]
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1]
    if (frame <= b.t) {
      const t = interpolate(frame, [a.t, b.t], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) })
      cam = { t: frame, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, k: Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * t) }
      break
    }
  }

  const pin = (it: EvidenceItem) => [it.x * BW, it.y * BH - (it.src ? 250 : 175) * s] as const
  const titleIn = progress(frame, end + 30, 16)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#5E4128' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: BW, height: BH, transformOrigin: '0 0',
        transform: `translate(${width / 2}px, ${height / 2}px) scale(${cam.k}) translate(${-cam.x}px, ${-cam.y}px)` }}>
        {/* Cork: warm brown with darker grain, inside a wooden frame. */}
        <div style={{ position: 'absolute', inset: 0, background: '#B88A57', boxShadow: `inset 0 0 0 ${40 * s}px #6E4A2C, inset 0 0 ${120 * s}px rgba(60,35,10,.55)` }} />
        <svg width={BW} height={BH} style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply' }}>
          <filter id={corkId}><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={3} seed={4} /><feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.28  0 0 0 0 0.12  0 0 0 0.55 0" /></filter>
          <rect width={BW} height={BH} filter={`url(#${corkId})`} />
        </svg>
        {items.map((it, i) => {
          const appear = progress(frame, 4 + i * 4, 12)
          const w = jitter(frame, `ev-${i}`, 1.5 * s, 5)
          const photo = !!it.src
          const iw = (photo ? 440 : 360) * s, ih = (photo ? 520 : 360) * s
          return <div key={i} style={{ position: 'absolute', left: it.x * BW, top: it.y * BH, width: iw, height: ih,
            transform: `translate(-50%, -50%) translate(${w.x}px, ${w.y}px) rotate(${(it.rotate ?? (i % 2 ? 4 : -3)) + w.rotate}deg) scale(${1.12 - 0.12 * appear})`, opacity: appear,
            background: photo ? '#FBF8F1' : '#F7DC6F', boxShadow: `0 ${14 * s}px ${30 * s}px rgba(30,15,0,.45)`, padding: photo ? `${18 * s}px ${18 * s}px ${84 * s}px` : 30 * s, boxSizing: 'border-box' }}>
            {photo
              ? <><Img src={it.src!.startsWith('http') ? it.src! : staticFile(it.src!.replace(/^\//, ''))} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'sepia(0.25) contrast(1.05)' }} />
                <div style={{ position: 'absolute', left: 18 * s, right: 18 * s, bottom: 16 * s, ...ff(FONT.hand), fontWeight: 700, fontSize: 46 * s, lineHeight: 1, color: c.ink, textAlign: 'center' }}>{it.title}</div></>
              : <div style={{ ...ff(FONT.hand), fontWeight: 700, fontSize: 58 * s, lineHeight: 1.05, color: c.ink }}>{it.title}{it.caption && <div style={{ fontSize: 40 * s, fontWeight: 500, marginTop: 14 * s, color: c.text }}>{it.caption}</div>}</div>}
          </div>
        })}
        <svg width={BW} height={BH} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
          {links.map(([a, b], k) => {
            if (!items[a] || !items[b]) return null
            const [x1, y1] = pin(items[a]), [x2, y2] = pin(items[b])
            const draw = progress(frame, 30 + (k + 1) * VISIT - 6, 26, Easing.inOut(Easing.quad))
            const sag = Math.hypot(x2 - x1, y2 - y1) * 0.12
            return <path key={k} d={`M ${x1},${y1} Q ${(x1 + x2) / 2},${Math.max(y1, y2) + sag} ${x2},${y2}`} fill="none" stroke="#C3202A" strokeWidth={6 * s} strokeLinecap="round"
              pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{ filter: `drop-shadow(0 ${4 * s}px ${3 * s}px rgba(0,0,0,.35))` }} />
          })}
          {items.map((it, i) => {
            const [x, y] = pin(it)
            return <g key={i} opacity={progress(frame, 8 + i * 4, 8)}>
              <circle cx={x + 3 * s} cy={y + 5 * s} r={17 * s} fill="rgba(0,0,0,.3)" />
              <circle cx={x} cy={y} r={17 * s} fill="#D7262F" />
              <circle cx={x - 5 * s} cy={y - 5 * s} r={5 * s} fill="rgba(255,255,255,.7)" />
            </g>
          })}
        </svg>
      </div>
      {title && <div style={{ position: 'absolute', left: '50%', bottom: 70 * s, transform: `translateX(-50%) translateY(${(1 - titleIn) * 30 * s}px) rotate(-1deg)`, opacity: titleIn,
        background: c.ink, color: c.paper, padding: `${14 * s}px ${36 * s}px`, ...ff(FONT.head), fontWeight: 800, fontSize: 66 * s, textTransform: 'uppercase', letterSpacing: 1 * s, whiteSpace: 'nowrap' }}>{title}</div>}
    </div>
  )
}

import { Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, HandArrow, HandNote, Paper, easeInOut, ff, palette, progress, type ExplainerColors } from './theme'

export type ScreenshotSpotlightProps = {
  /** The screenshot (path in /public or URL) and its pixel size, to keep its proportions. */
  src: string
  imageWidth: number
  imageHeight: number
  /** Area to circle, as % of the screenshot: x, y (top-left), w, h. */
  focus: { x: number; y: number; w: number; h: number }
  /** Label in the window's title bar, e.g. "chatgpt.com" or "Otto — Financeiro". */
  label?: string
  note?: string
  colors?: Partial<ExplainerColors>
}

export const SCREENSHOT_SPOTLIGHT_DURATION = 180

/** A wobbly hand-drawn rectangle around a w×h box centered at (cx, cy), overshooting where it closes. */
function roughRect(cx: number, cy: number, w: number, h: number, pad: number, seed: string) {
  const r = (k: string) => (random(`${seed}-${k}`) - 0.5) * pad * 0.5
  const x0 = cx - w / 2 - pad, x1 = cx + w / 2 + pad, y0 = cy - h / 2 - pad, y1 = cy + h / 2 + pad
  return `M ${x0 + r('a')},${y0 + r('b')} L ${x1 + r('c')},${y0 + r('d')} L ${x1 + r('e')},${y1 + r('f')} L ${x0 + r('g')},${y1 + r('h')} L ${x0 + r('i')},${y0 + r('j')} L ${x0 + w * 0.12 + r('k')},${y0 - pad * 0.3 + r('l')}`
}

/**
 * A screenshot in a browser window tilts in, the camera pushes into one area, a hand-drawn
 * box goes around it while the rest dims, and a note explains it.
 */
export function ScreenshotSpotlight({ src, imageWidth, imageHeight, focus, label, note, colors }: ScreenshotSpotlightProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const bar = 46 * s
  const winW = Math.min(width * 0.78, (height * 0.78 - bar) * (imageWidth / imageHeight))
  const imgH = winW * (imageHeight / imageWidth)
  const winH = imgH + bar

  const enter = progress(frame, 0, 26)
  const zoom = progress(frame, 44, 36, easeInOut)
  const box = progress(frame, 84, 22)
  const dim = progress(frame, 86, 16)
  const noteIn = progress(frame, 112, 24)

  // Push in so the focus area takes about half the frame, centered.
  const fx = (focus.x + focus.w / 2) / 100, fy = (focus.y + focus.h / 2) / 100
  const target = Math.min(2.6, Math.max(1, Math.min((width * 0.5) / (winW * focus.w / 100), (height * 0.42) / (imgH * focus.h / 100))))
  const scale = interpolate(zoom, [0, 1], [1, target])
  const dx = (winW / 2 - winW * fx) * zoom, dy = (winH / 2 - (bar + imgH * fy)) * zoom
  const url = src.startsWith('http') ? src : staticFile(src.replace(/^\//, ''))
  const shade = `rgba(20,16,8,${0.55 * dim})`

  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: winW, height: winH, perspective: 2000 * s,
        transform: `translate(-50%, -50%) translateY(${(1 - enter) * height * 0.6}px) translate(${dx * scale}px, ${dy * scale}px) scale(${scale})` }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 14 * s, overflow: 'hidden', background: '#fff', boxShadow: `0 ${30 * s}px ${80 * s}px rgba(40,30,10,.35)`,
          transform: `rotateX(${(1 - enter) * 20 + 6 * (1 - zoom)}deg) rotateY(${-8 * (1 - zoom)}deg)` }}>
          <div style={{ height: bar, display: 'flex', alignItems: 'center', gap: 10 * s, padding: `0 ${18 * s}px`, background: '#EDEAE3', borderBottom: '1px solid #D9D3C7' }}>
            {['#E5463A', '#F2B33D', '#2DB35E'].map((col) => <span key={col} style={{ width: 14 * s, height: 14 * s, borderRadius: '50%', background: col }} />)}
            {label && <span style={{ marginLeft: 16 * s, padding: `${4 * s}px ${18 * s}px`, borderRadius: 8 * s, background: '#fff', ...ff(FONT.sans), fontSize: 20 * s, color: '#555' }}>{label}</span>}
          </div>
          <div style={{ position: 'relative', height: imgH }}>
            <Img src={url} style={{ width: '100%', height: '100%', display: 'block' }} />
            {/* Dim everything around the focus area. */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: `${focus.y}%`, background: shade }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: `${focus.y + focus.h}%`, bottom: 0, background: shade }} />
            <div style={{ position: 'absolute', left: 0, width: `${focus.x}%`, top: `${focus.y}%`, height: `${focus.h}%`, background: shade }} />
            <div style={{ position: 'absolute', left: `${focus.x + focus.w}%`, right: 0, top: `${focus.y}%`, height: `${focus.h}%`, background: shade }} />
          </div>
        </div>
      </div>
      {/* The hand-drawn box is drawn on screen, around where the focus area ends up after the push-in (centered). */}
      {box > 0 && <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        <path d={roughRect(width / 2, height / 2, winW * focus.w / 100 * target, imgH * focus.h / 100 * target, 18 * s, 'shot')} fill="none" stroke={c.red} strokeWidth={8 * s}
          strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - box} />
      </svg>}
      {note && <>
        <HandArrow from={[width * 0.24, height * 0.8]} to={[width * 0.38, height * 0.66]} amount={noteIn} color={c.red} width={7 * s} bend={-0.2} seed="shot-arrow" />
        <HandNote amount={progress(frame, 120, 24)} color={c.red} size={78 * s} style={{ position: 'absolute', left: width * 0.05, top: height * 0.8, width: width * 0.5, transform: 'rotate(-3deg)', textShadow: `0 0 ${10 * s}px ${c.paper}, 0 0 ${18 * s}px ${c.paper}` }}>{note}</HandNote>
      </>}
    </Paper>
  )
}

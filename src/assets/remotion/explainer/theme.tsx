import type { CSSProperties, ReactNode } from 'react'
import { useId } from 'react'
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from 'remotion'

/*
 * Visual language of the Explainer components: newsprint paper, a yellow highlighter,
 * hand-drawn marks and a little stop-motion wobble. Everything here is deterministic
 * per frame, so the player and the final render match exactly.
 */

export const EX = {
  paper: '#F3EEE3',
  paperShade: '#E7E0D1',
  card: '#FBF8F1',
  ink: '#1C1B19',
  text: '#3B3832',
  muted: '#7B7466',
  line: '#D9D1C1',
  marker: '#FFD84D',
  red: '#E5463A',
  blue: '#2F5BD3',
  teal: '#1E8C7E',
}
export type ExplainerColors = typeof EX

// The fallback goes inside var(): an undefined variable with no fallback would void the whole font-family.
export const FONT = {
  head: 'var(--font-explainer-head, "Barlow Condensed"), "Arial Narrow", sans-serif',
  serif: 'var(--font-explainer-serif, "Source Serif 4"), "Source Serif Four", Georgia, serif', // Remotion's Google Fonts calls it "Source Serif Four"
  hand: 'var(--font-explainer-hand, Caveat), "Comic Sans MS", cursive',
  sans: 'var(--font-geist-sans, Geist), system-ui, sans-serif',
}

/**
 * Font for an element. The app's global CSS forces its UI font with `body * { font-family: var(--ui-font-family) !important }`,
 * so the variable is set on the element too.
 */
export const ff = (family: string): CSSProperties => ({ fontFamily: family, ['--ui-font-family' as string]: family })

/** Colors with optional overrides (every component takes a `colors` prop). */
export const palette = (colors?: Partial<ExplainerColors>): ExplainerColors => ({ ...EX, ...colors })

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
export const easeOut = Easing.out(Easing.cubic)
export const easeInOut = Easing.inOut(Easing.cubic)

/** 0 → 1 between `start` and `start + duration` frames. */
export function progress(frame: number, start: number, duration: number, easing = easeOut) {
  return interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing })
}

/** Stop-motion wobble: a small offset that changes every `hold` frames. */
export function jitter(frame: number, seed: string, amount = 2, hold = 3) {
  const step = Math.floor(frame / hold)
  const r = (k: string) => (random(`${seed}-${k}-${step}`) - 0.5) * 2
  return { x: r('x') * amount, y: r('y') * amount, rotate: r('r') * amount * 0.35 }
}

/** Counts from 0 to `value`, formatted in Portuguese. */
export function countUp(frame: number, value: number, start: number, duration: number, decimals = 0) {
  const v = value * progress(frame, start, duration)
  return v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

// ---------- paper ----------

/** Newsprint background: paper color, animated grain and a soft vignette. */
export function Paper({ children, color = EX.paper, grain = 0.09, style }: { children?: ReactNode; color?: string; grain?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const id = `grain-${useId().replace(/:/g, '')}`
  return (
    <AbsoluteFill style={{ background: color, overflow: 'hidden', ...style }}>
      {children}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply' }}>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(frame / 2) % 7} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values={`0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 ${grain} 0`} />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(60,45,20,0.16) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  )
}

// ---------- hand-drawn marks ----------

/** A rough highlighter band in a 100×30 box: wobbly edges, rounded ends. */
function markerPath(seed: string) {
  const r = (k: string | number) => random(`${seed}-${k}`)
  const top = Array.from({ length: 6 }, (_, i) => `${(i / 5) * 100},${3 + r(`t${i}`) * 5}`)
  const bottom = Array.from({ length: 6 }, (_, i) => `${100 - (i / 5) * 100},${25 + r(`b${i}`) * 4}`)
  return `M ${top[0]} L ${top.slice(1).join(' L ')} Q 104,15 ${bottom[0]} L ${bottom.slice(1).join(' L ')} Q -4,15 ${top[0]} Z`
}

export type MarkKind = 'marcador' | 'sublinhado' | 'circulo' | 'riscado'

/**
 * Wraps text and draws a hand-made mark over it as `amount` goes 0 → 1:
 * highlighter behind the words, underline, circle around them, or a strike-through.
 * No measuring: the mark is an SVG stretched over the text box.
 */
export function Mark({ children, amount, kind = 'marcador', color = EX.marker, seed = 'mark', thickness = 5 }: { children: ReactNode; amount: number; kind?: MarkKind; color?: string; seed?: string; thickness?: number }) {
  const clipId = `mark-${useId().replace(/:/g, '')}`
  const r = (k: string) => random(`${seed}-${k}`)
  // The SVG is stretched over the text (preserveAspectRatio="none"), so strokes keep their width with
  // non-scaling-stroke and are revealed with a CSS mask (dash tricks don't survive the stretch).
  const reveal = (radial: boolean): CSSProperties => {
    const m = radial
      ? `conic-gradient(from 20deg at 50% 50%, #000 ${amount * 360}deg, transparent ${amount * 360}deg)`
      : `linear-gradient(90deg, #000 ${amount * 100}%, transparent ${amount * 100}%)`
    return { maskImage: m, WebkitMaskImage: m }
  }
  const svg = (box: CSSProperties, viewBox: string, body: ReactNode, front = false, radial = false) => (
    <svg viewBox={viewBox} preserveAspectRatio="none" style={{ position: 'absolute', overflow: 'visible', pointerEvents: 'none', zIndex: front ? 1 : -1, ...(front ? reveal(radial) : {}), ...box }}>{body}</svg>
  )
  const drawn = { fill: 'none', stroke: color, strokeWidth: thickness, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, vectorEffect: 'non-scaling-stroke' as const }
  let mark: ReactNode = null
  if (kind === 'marcador') {
    mark = svg({ left: '-0.12em', right: '-0.12em', top: '0.12em', bottom: '0.02em', width: 'calc(100% + 0.24em)', height: 'calc(100% - 0.14em)' }, '0 0 100 30', <>
      <clipPath id={clipId}><rect x={-6} y={-5} width={112 * amount} height={40} /></clipPath>
      <path d={markerPath(seed)} fill={color} clipPath={`url(#${clipId})`} opacity={0.92} />
    </>)
  } else if (kind === 'sublinhado') {
    mark = svg({ left: '-0.05em', width: 'calc(100% + 0.1em)', bottom: '-0.12em', height: '0.32em' }, '0 0 100 20',
      <path d={`M 0,${10 + r('a') * 4} C 30,${4 + r('b') * 6} 65,${14 + r('c') * 4} 100,${6 + r('d') * 6}`} {...drawn} />, true)
  } else if (kind === 'circulo') {
    mark = svg({ left: '-0.3em', top: '-0.22em', width: 'calc(100% + 0.6em)', height: 'calc(100% + 0.44em)' }, '0 0 100 100',
      <path d={`M ${62 + r('a') * 8},${4 + r('b') * 4} C 102,6 ${104 + r('c') * 4},92 52,96 C 6,99 -4,62 4,34 C 12,8 46,0 ${78 + r('d') * 8},${12 + r('e') * 6}`} {...drawn} />, true, true)
  } else {
    mark = svg({ left: '-0.08em', width: 'calc(100% + 0.16em)', top: '42%', height: '0.25em' }, '0 0 100 20',
      <path d={`M 0,${12 + r('a') * 4} L 100,${6 + r('b') * 4}`} {...drawn} />, true)
  }
  return <span style={{ position: 'relative', display: 'inline-block', isolation: 'isolate', whiteSpace: 'nowrap' }}>{mark}{children}</span>
}

/** A hand-drawn arrow from (x1, y1) to (x2, y2) in the parent's pixels, drawn as `amount` goes 0 → 1. */
export function HandArrow({ from, to, amount, color = EX.red, width = 6, bend = 0.25, seed = 'arrow' }: { from: [number, number]; to: [number, number]; amount: number; color?: string; width?: number; bend?: number; seed?: string }) {
  const [x1, y1] = from, [x2, y2] = to
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend
  const angle = Math.atan2(y2 - my, x2 - mx)
  const head = 26 + random(seed) * 6
  const wing = (a: number) => `${x2 - head * Math.cos(angle + a)},${y2 - head * Math.sin(angle + a)}`
  const body = Math.min(1, amount / 0.8), tip = progress(amount, 0.8, 0.2, Easing.linear)
  const common = { fill: 'none', stroke: color, strokeWidth: width, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, pathLength: 1, strokeDasharray: 1 }
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
      <path d={`M ${x1},${y1} Q ${mx},${my} ${x2},${y2}`} {...common} strokeDashoffset={1 - body} />
      <path d={`M ${wing(0.5)} L ${x2},${y2} L ${wing(-0.5)}`} {...common} strokeDashoffset={1 - tip} />
    </svg>
  )
}

/** Handwritten note that writes itself from left to right. */
export function HandNote({ children, amount, color = EX.red, size = 54, style }: { children: ReactNode; amount: number; color?: string; size?: number; style?: CSSProperties }) {
  return <div style={{ ...ff(FONT.hand), fontWeight: 700, fontSize: size, lineHeight: 1.05, color, clipPath: amount >= 1 ? undefined : `inset(-30% ${(1 - amount) * 115 - 10}% -30% -10%)`, ...style }}>{children}</div>
}

/** Small source line at the bottom, like a news graphic. */
export function SourceLine({ children, color = EX.muted, style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return <div style={{ ...ff(FONT.sans), fontSize: 24, letterSpacing: 0.4, color, ...style }}>{children}</div>
}

import { geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { useId } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import world from './geo/world-110m.json'
import { FONT, Mark, Paper, easeInOut, ff, palette, progress, type ExplainerColors } from './theme'

type Feature = { type: 'Feature'; properties: { name: string }; geometry: GeoPermissibleObjects }
const countries = (world as unknown as { features: Feature[] }).features
const graticule = geoGraticule10()

export type GlobeSpinProps = {
  kicker?: string
  title?: string
  titleMark?: string
  /** Where the globe starts facing, and where it stops: [longitude, latitude]. */
  from?: [number, number]
  to: [number, number]
  /** Countries painted with the highlighter (names as in the map data, e.g. "Brazil"). */
  highlight?: string[]
  /** Arcs drawn over the globe once it stops (great circles), e.g. from São Paulo to other cities. */
  arcs?: { from: [number, number]; to: [number, number] }[]
  /** Push in at the end (1 = no zoom). */
  endZoom?: number
  colors?: Partial<ExplainerColors>
}

export const GLOBE_SPIN_DURATION = 210

/**
 * A paper globe spins until the region faces the camera, the country is painted, arcs fly
 * out from it, and the camera pushes in. Drawn with an orthographic projection (no WebGL).
 */
export function GlobeSpin({ kicker, title, titleMark, from = [20, 15], to, highlight = [], arcs = [], endZoom = 1.6, colors }: GlobeSpinProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const spin = progress(frame, 10, 80, easeInOut)
  const paint = progress(frame, 88, 16)
  const push = progress(frame, 160, 40, easeInOut)
  const lon = interpolate(spin, [0, 1], [from[0] + 360, to[0]]) // one full turn on the way
  const lat = interpolate(spin, [0, 1], [from[1], to[1]])
  const R = height * 0.4 * interpolate(push, [0, 1], [1, endZoom])
  const cx = width > height ? width * 0.62 : width / 2, cy = height * 0.53
  const projection = geoOrthographic().rotate([-lon, -lat]).scale(R).translate([cx, cy]).clipAngle(90)
  const path = geoPath(projection)
  const titleIn = progress(frame, 0, 14)
  const shadeId = `globe-shade-${useId().replace(/:/g, '')}`

  const titleNode = title && titleMark && title.includes(titleMark)
    ? <>{title.split(titleMark)[0]}<Mark amount={progress(frame, 96, 16)} seed="globe-title">{titleMark}</Mark>{title.split(titleMark).slice(1).join(titleMark)}</>
    : title

  return (
    <Paper color={c.paper}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id={shadeId} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.35} />
            <stop offset="70%" stopColor="#000000" stopOpacity={0} />
            <stop offset="100%" stopColor="#3A2A10" stopOpacity={0.28} />
          </radialGradient>
        </defs>
        <circle cx={cx + 14 * s} cy={cy + 20 * s} r={R} fill="rgba(40,30,10,.18)" />
        <circle cx={cx} cy={cy} r={R} fill="#DCE3E0" stroke={c.ink} strokeWidth={4 * s} />
        <path d={path(graticule) ?? ''} fill="none" stroke="#B9C4C0" strokeWidth={1.2 * s} />
        {countries.map((f, i) => {
          const d = path(f.geometry)
          const on = highlight.includes(f.properties.name)
          return d ? <path key={i} d={d} fill={on ? mixHex(c.card, c.marker, paint) : c.card} stroke={on && paint > 0.5 ? c.ink : '#B7AE9C'} strokeWidth={(on ? 2.6 : 1) * s} strokeLinejoin="round" /> : null
        })}
        {arcs.map((a, i) => {
          const d = path({ type: 'LineString', coordinates: [a.from, a.to] })
          const draw = progress(frame, 104 + i * 10, 26)
          const end = projection(a.to)
          return d ? <g key={i}>
            <path d={d} fill="none" stroke={c.red} strokeWidth={5 * s} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
            {draw > 0.98 && end && <circle cx={end[0]} cy={end[1]} r={9 * s} fill={c.red} stroke={c.card} strokeWidth={3 * s} />}
          </g> : null
        })}
        <circle cx={cx} cy={cy} r={R} fill={`url(#${shadeId})`} pointerEvents="none" />
      </svg>
      {(title || kicker) && <div style={{ position: 'absolute', left: 140 * s, top: '50%', width: width > height ? width * 0.3 : width - 280 * s, transform: `translateY(-50%) translateY(${(1 - titleIn) * 20 * s}px)`, opacity: titleIn * (1 - push * 0.9) }}>
        {kicker && <div style={{ ...ff(FONT.head), fontWeight: 700, fontSize: 36 * s, letterSpacing: 4 * s, textTransform: 'uppercase', color: c.red }}>{kicker}</div>}
        {title && <h1 style={{ margin: `${10 * s}px 0 0`, ...ff(FONT.head), fontWeight: 800, fontSize: 92 * s, lineHeight: 1.02, color: c.ink }}>{titleNode}</h1>}
      </div>}
    </Paper>
  )
}

function mixHex(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`
}

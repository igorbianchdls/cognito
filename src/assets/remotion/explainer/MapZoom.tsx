import { geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { useId } from 'react'
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import latam from './geo/latam-50m.json'
import world from './geo/world-110m.json'
import { FONT, ff, Mark, Paper, easeInOut, jitter, palette, progress, type ExplainerColors } from './theme'

type Feature = { type: 'Feature'; id?: string; properties: { name: string }; geometry: GeoPermissibleObjects }
type Collection = { type: 'FeatureCollection'; features: Feature[] }

// Latin America comes from the detailed file; the rest of the world from the light one.
const detailed = (latam as unknown as Collection).features
const detailedNames = new Set(detailed.map((f) => f.properties.name))
const countries: Feature[] = [...(world as unknown as Collection).features.filter((f) => !detailedNames.has(f.properties.name)), ...detailed]

export type MapView = { center: [number, number]; zoom: number }
export type MapZoomProps = {
  kicker?: string
  title?: string
  /** Word(s) of the title to highlight. */
  titleMark?: string
  /** Opening and closing camera: center as [longitude, latitude], zoom 1 = whole world. */
  from?: MapView
  to: MapView
  /** Countries painted with the highlighter (names as in the map data, e.g. "Brazil"). */
  highlight?: string[]
  /** Places that pop in after the zoom, in order. */
  points?: { name: string; coords: [number, number]; detail?: string }[]
  /** Dashed line linking the points in order. */
  route?: boolean
  colors?: Partial<ExplainerColors>
}

export const MAP_ZOOM_DURATION = 210

/**
 * Newsroom map: opens wide, flies to the region, paints the countries that matter,
 * then drops pins one by one with labels and an optional dashed route between them.
 */
export function MapZoom({ kicker, title, titleMark, from = { center: [-20, 10], zoom: 1 }, to, highlight = [], points = [], route = false, colors }: MapZoomProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080 // 1 at 1080p, in landscape or portrait
  const maskId = `route-${useId().replace(/:/g, '')}`

  // Camera: zoom eases in log space so the flight feels even.
  const fly = progress(frame, 16, 64, easeInOut)
  const zoom = Math.exp(interpolate(fly, [0, 1], [Math.log(from.zoom), Math.log(to.zoom)]))
  const center: [number, number] = [interpolate(fly, [0, 1], [from.center[0], to.center[0]]), interpolate(fly, [0, 1], [from.center[1], to.center[1]])]
  const baseScale = Math.max(width, height) / (2 * Math.PI) * 0.95
  const projection = geoMercator().center(center).scale(baseScale * zoom).translate(width > height ? [width * 0.6, height * 0.52] : [width / 2, height * 0.56]) // landscape: map right of the title card
  const path = geoPath(projection)

  const paint = progress(frame, 74, 18)
  const pinStart = 92
  const pins = points.map((p, i) => ({ ...p, xy: projection(p.coords) ?? [0, 0], at: progress(frame, pinStart + i * 14, 12) }))
  const routePath = route && pins.length > 1 ? path({ type: 'LineString', coordinates: points.map((p) => p.coords) }) : null
  const routeDraw = progress(frame, pinStart + 8, Math.max(20, points.length * 14))
  const titleIn = progress(frame, 0, 14)

  const titleNode = title && titleMark && title.includes(titleMark)
    ? <>{title.split(titleMark)[0]}<Mark amount={progress(frame, 70, 16)} seed="map-title">{titleMark}</Mark>{title.split(titleMark).slice(1).join(titleMark)}</>
    : title

  return (
    <Paper color="#E9E3D6">
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <mask id={maskId}>{routePath && <path d={routePath} fill="none" stroke="#fff" strokeWidth={14 * s} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - routeDraw} />}</mask>
        </defs>
        {countries.map((f, i) => {
          const on = highlight.includes(f.properties.name)
          const d = path(f.geometry)
          return d ? <path key={`${f.properties.name}-${i}`} d={d} fill={on ? mix(c.paper, c.marker, paint) : c.paper} stroke={on && paint > 0.5 ? c.ink : '#C9C0AE'} strokeWidth={(on ? 3 : 1.4) * s} strokeLinejoin="round" /> : null
        })}
        {routePath && <path d={routePath} fill="none" stroke={c.red} strokeWidth={6 * s} strokeDasharray={`${16 * s} ${12 * s}`} strokeLinecap="round" mask={`url(#${maskId})`} />}
      </svg>
      {pins.map((p, i) => {
        const w = jitter(frame, `pin-${i}`, 1.2, 4)
        const below = p.xy[1] < height * 0.3
        return p.at > 0 && <div key={p.name} style={{ position: 'absolute', left: p.xy[0], top: p.xy[1], transform: `translate(${w.x}px, ${w.y}px)` }}>
          <span style={{ position: 'absolute', left: -14 * s, top: -14 * s, width: 28 * s, height: 28 * s, borderRadius: '50%', background: c.red, border: `${5 * s}px solid ${c.card}`, boxShadow: '0 4px 10px rgba(0,0,0,.25)', transform: `scale(${p.at})` }} />
          <div style={{ position: 'absolute', left: 26 * s, top: below ? 14 * s : -70 * s, opacity: p.at, transform: `translateY(${(1 - p.at) * 10 * s}px) rotate(${w.rotate}deg)`, background: c.card, padding: `${8 * s}px ${16 * s}px`, boxShadow: '0 6px 16px rgba(40,30,10,.18)', whiteSpace: 'nowrap' }}>
            <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 40 * s, lineHeight: 1, color: c.ink, textTransform: 'uppercase' }}>{p.name}</div>
            {p.detail && <div style={{ ...ff(FONT.serif), fontSize: 26 * s, color: c.text, marginTop: 4 * s }}>{p.detail}</div>}
          </div>
        </div>
      })}
      {(title || kicker) && <div style={{ position: 'absolute', left: (width > height ? 90 : 70) * s, ...(width > height ? { width: 620 * s } : { right: 70 * s }), top: 90 * s, background: c.card, padding: `${30 * s}px ${36 * s}px`, boxShadow: '0 10px 30px rgba(40,30,10,.18)', opacity: titleIn, transform: `translateY(${(1 - titleIn) * -30 * s}px)` }}>
        {kicker && <div style={{ ...ff(FONT.head), fontWeight: 700, fontSize: 32 * s, letterSpacing: 3 * s, textTransform: 'uppercase', color: c.red }}>{kicker}</div>}
        {title && <div style={{ ...ff(FONT.head), fontWeight: 800, fontSize: 76 * s, lineHeight: 1.04, color: c.ink, marginTop: kicker ? 8 * s : 0 }}>{titleNode}</div>}
      </div>}
    </Paper>
  )
}

/** Blend two #rrggbb colors. */
function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`
}

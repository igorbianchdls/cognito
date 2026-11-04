import { useCurrentFrame, useVideoConfig } from 'remotion'
import data from './geo/brazil-states.json'
import { FONT, Mark, Paper, SourceLine, ff, palette, progress, type ExplainerColors } from './theme'

type StatesData = { source: string; viewBox: string; states: { name: string; id: string; path: string }[] }
const map = data as StatesData

export type BrazilStatesMapProps = {
  title: string
  /** Word(s) of the title to highlight. */
  titleMark?: string
  subtitle?: string
  /** Value per state, by abbreviation ("sp", "rj", …). Missing states stay blank. */
  values: Record<string, number>
  format?: (v: number) => string
  /** How many of the top states get a label (default 3). */
  labels?: number
  /** Label of the color scale. */
  legend?: string
  source?: string
  colors?: Partial<ExplainerColors>
}

export const BRAZIL_STATES_MAP_DURATION = 200

/** Blend two #rrggbb colors. */
function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`
}

/** Bounding-box center of a state's path (relative "m … z" commands only), to place its label. */
function center(path: string) {
  let x = 0, y = 0, startX = 0, startY = 0, first = true
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const token of path.match(/[mz]|-?\d*\.?\d+(?:e-?\d+)?,-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []) {
    if (token === 'z' || token === 'Z') { x = startX; y = startY; first = true; continue }
    if (token === 'm' || token === 'M') continue
    const [dx, dy] = token.split(',').map(Number)
    x += dx; y += dy
    if (first) { startX = x; startY = y; first = false }
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2] as const
}

/**
 * Choropleth of Brazil by state: states fill in from the lowest to the highest value,
 * the top ones get labels, with a color scale and the source.
 */
export function BrazilStatesMap({ title, titleMark, subtitle, values, format = (v) => v.toLocaleString('pt-BR'), labels = 3, legend, source, colors }: BrazilStatesMapProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const [, , vbW, vbH] = map.viewBox.split(' ').map(Number)
  const mapH = height * 0.86, mapW = mapH * (vbW / vbH)
  const k = mapH / vbH
  const mapLeft = width > height ? width - mapW - 100 * s : (width - mapW) / 2
  const mapTop = (height - mapH) / 2
  const nums = Object.values(values)
  const min = Math.min(...nums), max = Math.max(...nums)
  const ranked = [...map.states].filter((st) => values[st.id] !== undefined).sort((a, b) => values[a.id] - values[b.id])
  const fillAt = (id: string) => 24 + Math.max(0, ranked.findIndex((st) => st.id === id)) * 3
  const done = 24 + ranked.length * 3 + 14
  const top = [...ranked].reverse().slice(0, labels)
  const titleIn = progress(frame, 0, 14)

  const titleNode = titleMark && title.includes(titleMark)
    ? <>{title.split(titleMark)[0]}<Mark amount={progress(frame, done, 16)} seed="br-title">{titleMark}</Mark>{title.split(titleMark).slice(1).join(titleMark)}</>
    : title

  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', left: 140 * s, width: width > height ? width - mapW - 300 * s : width - 280 * s, top: 110 * s, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20 * s}px)` }}>
        <h1 style={{ margin: 0, ...ff(FONT.head), fontWeight: 800, fontSize: 92 * s, lineHeight: 1.02, color: c.ink }}>{titleNode}</h1>
        {subtitle && <p style={{ margin: `${18 * s}px 0 0`, ...ff(FONT.serif), fontSize: 38 * s, lineHeight: 1.35, color: c.text }}>{subtitle}</p>}
        <div style={{ marginTop: 60 * s, opacity: progress(frame, 20, 14) }}>
          {legend && <div style={{ ...ff(FONT.head), fontWeight: 700, fontSize: 30 * s, letterSpacing: 2 * s, textTransform: 'uppercase', color: c.muted, marginBottom: 12 * s }}>{legend}</div>}
          <div style={{ height: 26 * s, width: 460 * s, background: `linear-gradient(90deg, ${mix(c.paperShade, c.red, 0.12)}, ${c.red})` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 460 * s, marginTop: 8 * s, ...ff(FONT.head), fontWeight: 700, fontSize: 32 * s, color: c.text }}><span>{format(min)}</span><span>{format(max)}</span></div>
        </div>
      </div>
      <svg width={mapW} height={mapH} viewBox={map.viewBox} style={{ position: 'absolute', left: mapLeft, top: mapTop, overflow: 'visible' }}>
        {map.states.map((st) => {
          const v = values[st.id]
          const t = v === undefined ? 0 : (v - min) / Math.max(1e-9, max - min)
          const fill = v === undefined ? c.paperShade : mix(c.paperShade, mix(mix(c.paperShade, c.red, 0.12), c.red, t), progress(frame, fillAt(st.id), 10))
          return <path key={st.id} d={st.path} fill={fill} stroke={c.paper} strokeWidth={1.4} strokeLinejoin="round" opacity={progress(frame, 4, 14)} />
        })}
      </svg>
      {top.map((st, i) => {
        const [cx, cy] = center(st.path)
        const p = progress(frame, done + 6 + i * 8, 12)
        return <div key={st.id} style={{ position: 'absolute', left: mapLeft + cx * k, top: mapTop + cy * k, transform: `translate(-50%, -50%) scale(${0.8 + 0.2 * p})`, opacity: p,
          background: c.ink, color: c.paper, padding: `${6 * s}px ${16 * s}px`, ...ff(FONT.head), fontWeight: 800, fontSize: 34 * s, whiteSpace: 'nowrap', boxShadow: '0 6px 14px rgba(0,0,0,.25)' }}>
          {st.id.toUpperCase()} · {format(values[st.id])}
        </div>
      })}
      <SourceLine color={c.muted} style={{ position: 'absolute', left: 140 * s, bottom: 44 * s, opacity: progress(frame, 30, 20) }}>{source ? `Fonte: ${source} · ` : ''}Mapa: {map.source}</SourceLine>
    </Paper>
  )
}

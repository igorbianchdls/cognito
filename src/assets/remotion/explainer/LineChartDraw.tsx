import { useId } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, ff, HandArrow, HandNote, Mark, Paper, SourceLine, easeInOut, palette, progress, type ExplainerColors } from './theme'

export type LineChartDrawProps = {
  title: string
  /** Word(s) of the title to highlight; must appear in `title`. */
  titleMark?: string
  subtitle?: string
  data: { label: string; value: number }[]
  /** Formats axis and tip values, e.g. (v) => `R$ ${v} mi`. */
  format?: (value: number) => string
  /** Point that gets the circle and the note (default: the highest). */
  highlightIndex?: number
  note?: string
  source?: string
  lineColor?: string
  colors?: Partial<ExplainerColors>
}

export const LINE_CHART_DRAW_DURATION = 210
const fmt = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/**
 * News-style line chart: the line draws itself point by point with the current value
 * riding on its tip, then the key point gets a hand-drawn circle, an arrow and a note.
 */
export function LineChartDraw({ title, titleMark, subtitle, data, format = fmt, highlightIndex, note, source, lineColor, colors }: LineChartDrawProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080 // 1 at 1080p, in landscape or portrait
  const color = lineColor ?? c.red
  const vertical = height > width
  const clipId = `line-reveal-${useId().replace(/:/g, '')}`

  // Chart box in pixels.
  const box = vertical ? { x: 130 * s, y: height * 0.34, w: width - 210 * s, h: height * 0.4 } : { x: 220 * s, y: height * 0.36, w: width - 360 * s, h: height * 0.46 }
  const values = data.map((d) => d.value)
  const max = Math.max(...values), min = Math.min(0, ...values)
  const top = niceCeil(max)
  const x = (i: number) => box.x + (data.length === 1 ? box.w / 2 : (i / (data.length - 1)) * box.w)
  const y = (v: number) => box.y + box.h - ((v - min) / (top - min)) * box.h
  const points = data.map((d, i) => [x(i), y(d.value)] as const)

  // How far the line has been drawn, as a fraction of its length, and where its tip is.
  const draw = progress(frame, 24, 96, easeInOut)
  const seg = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]))
  const total = seg.reduce((a, b) => a + b, 0) || 1
  let left = draw * total, k = 0
  while (k < seg.length - 1 && left > seg[k]) { left -= seg[k]; k++ }
  const t = seg.length ? Math.min(1, left / seg[k]) : 1
  const tip = seg.length ? [points[k][0] + (points[k + 1][0] - points[k][0]) * t, points[k][1] + (points[k + 1][1] - points[k][1]) * t] : points[0]
  const tipValue = seg.length ? data[k].value + (data[k + 1].value - data[k].value) * t : data[0].value

  const hi = highlightIndex ?? values.indexOf(max)
  const annotate = progress(frame, 128, 22)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => min + (top - min) * f)
  const path = points.map((p, i) => `${i ? 'L' : 'M'} ${p[0]},${p[1]}`).join(' ')
  const area = `${path} L ${points[points.length - 1][0]},${box.y + box.h} L ${points[0][0]},${box.y + box.h} Z`
  const titleIn = progress(frame, 0, 14)
  const noteLeft = points[hi][0] > box.x + box.w / 2
  const noteW = 560 * s
  const noteX = noteLeft ? Math.max(box.x, points[hi][0] - noteW - 70 * s) : Math.min(box.x + box.w - noteW, points[hi][0] + 70 * s)
  const noteY = Math.min(box.y + box.h - 160 * s, points[hi][1] + 70 * s)

  const titleNode = titleMark && title.includes(titleMark)
    ? <>{title.split(titleMark)[0]}<Mark amount={progress(frame, 12, 16)} seed="chart-title">{titleMark}</Mark>{title.split(titleMark).slice(1).join(titleMark)}</>
    : title

  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', left: (vertical ? 90 : 140) * s, right: (vertical ? 90 : 140) * s, top: vertical ? height * 0.1 : height * 0.08, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 20 * s}px)` }}>
        <h1 style={{ margin: 0, ...ff(FONT.head), fontWeight: 800, fontSize: 104 * s, lineHeight: 1.02, color: c.ink }}>{titleNode}</h1>
        {subtitle && <p style={{ margin: `${18 * s}px 0 0`, ...ff(FONT.serif), fontSize: 40 * s, color: c.text }}>{subtitle}</p>}
      </div>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id={clipId}><rect x={0} y={0} width={tip[0]} height={height} /></clipPath>
        </defs>
        {ticks.map((v, i) => {
          const yy = y(v), p = progress(frame, 8 + i * 3, 14)
          return <g key={i} opacity={p}>
            <line x1={box.x} x2={box.x + box.w * p} y1={yy} y2={yy} stroke={i === 0 ? c.ink : c.line} strokeWidth={(i === 0 ? 3 : 2) * s} strokeDasharray={i === 0 ? undefined : `${8 * s} ${8 * s}`} />
            <text x={box.x - 18 * s} y={yy + 10 * s} textAnchor="end" style={ff(FONT.sans)} fontSize={26 * s} fill={c.muted}>{format(Math.round(v * 10) / 10)}</text>
          </g>
        })}
        {data.map((d, i) => (data.length <= 8 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) &&
          <text key={i} x={x(i)} y={box.y + box.h + 48 * s} textAnchor="middle" style={ff(FONT.head)} fontWeight={600} fontSize={32 * s} fill={c.text} opacity={progress(frame, 14 + i * 2, 12)}>{d.label}</text>)}
        <path d={area} fill={color} opacity={0.1} clipPath={`url(#${clipId})`} />
        <path d={path} fill="none" stroke={color} strokeWidth={9 * s} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        {points.map((p, i) => p[0] <= tip[0] + 0.5 && <circle key={i} cx={p[0]} cy={p[1]} r={8 * s} fill={c.paper} stroke={color} strokeWidth={5 * s} />)}
        {draw > 0 && draw < 1 && <circle cx={tip[0]} cy={tip[1]} r={14 * s} fill={color} />}
      </svg>
      {draw > 0 && <div style={{ position: 'absolute', left: tip[0], top: tip[1] - 92 * s, transform: 'translateX(-50%)', background: c.ink, color: c.paper, ...ff(FONT.head), fontWeight: 700, fontSize: 40 * s, padding: `${6 * s}px ${16 * s}px`, borderRadius: 6 * s, whiteSpace: 'nowrap', opacity: 1 - annotate }}>
        {format(Math.round(tipValue * 10) / 10)}
      </div>}
      {annotate > 0 && <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <ellipse cx={points[hi][0]} cy={points[hi][1]} rx={52 * s} ry={44 * s} fill="none" stroke={c.ink} strokeWidth={6 * s} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - annotate} transform={`rotate(-12 ${points[hi][0]} ${points[hi][1]})`} />
      </svg>}
      {note && <>
        {/* The note sits inside the chart, on the side of the point with more room, just below its height. */}
        <HandArrow from={[noteX + (noteLeft ? noteW - 10 * s : 10 * s), noteY - 6 * s]} to={[points[hi][0] + (noteLeft ? -46 * s : 46 * s), points[hi][1] + 14 * s]} amount={progress(frame, 140, 20)} color={c.ink} width={6 * s} bend={noteLeft ? 0.3 : -0.3} seed="chart-arrow" />
        <HandNote amount={progress(frame, 150, 24)} color={c.ink} size={66 * s} style={{ position: 'absolute', left: noteX, top: noteY, width: noteW, textAlign: noteLeft ? 'right' : 'left', transform: 'rotate(-4deg)' }}>{note}</HandNote>
      </>}
      {source && <SourceLine color={c.muted} style={{ position: 'absolute', bottom: (vertical ? 120 : 44) * s, left: (vertical ? 90 : 140) * s, opacity: progress(frame, 30, 20) }}>Fonte: {source}</SourceLine>}
    </Paper>
  )
}

/** Round up to a tidy axis maximum (1, 2, 2.5 or 5 × a power of ten). */
function niceCeil(v: number) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10) * p
}

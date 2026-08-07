import { ArrowUp, ChevronDown, Mic, Plus } from 'lucide-react'
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from 'remotion'

export const PROMPT_TO_CHART_EXACT_DURATION = 300

const PROMPT_SCENE_DURATION = 150
const PROMPT = 'Give me a pie chart showing the energy sources used in these markets'
const FONT = 'Arial, Helvetica, sans-serif'

function progress(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function PromptInputScene() {
  const frame = useCurrentFrame()
  const visibleCharacters = Math.floor(progress(frame, 14, 106, [0, PROMPT.length]))
  const exit = progress(frame, 130, PROMPT_SCENE_DURATION, [1, 0])
  const showCursor = frame < 112 && Math.floor(frame / 10) % 2 === 0

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        background: '#fbfdfc',
        display: 'flex',
        fontFamily: FONT,
        justifyContent: 'center',
        opacity: exit,
      }}
    >
      <div
        style={{
          alignItems: 'center',
          background: '#ffffff',
          border: '1.5px solid #d8ddda',
          borderRadius: 999,
          boxShadow: '0 2px 5px rgba(20, 24, 22, 0.05)',
          display: 'grid',
          gridTemplateColumns: '52px minmax(0, 1fr) auto 46px 54px',
          height: 66,
          padding: '0 10px 0 12px',
          width: 920,
        }}
      >
        <span style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
          <Plus color="#252525" size={26} strokeWidth={1.8} />
        </span>

        <div style={{ alignItems: 'center', display: 'flex', minWidth: 0, overflow: 'hidden' }}>
          <span style={{ color: '#202124', fontSize: 19, fontWeight: 400, letterSpacing: 0, whiteSpace: 'nowrap' }}>
            {PROMPT.slice(0, visibleCharacters)}
            {showCursor ? <span style={{ borderRight: '1.5px solid #202124', marginLeft: 1 }}>&nbsp;</span> : null}
          </span>
        </div>

        <div style={{ alignItems: 'center', color: '#969a97', display: 'flex', fontSize: 16, gap: 5, marginLeft: 18, whiteSpace: 'nowrap' }}>
          <span>Instant</span>
          <ChevronDown size={16} strokeWidth={1.7} />
        </div>

        <span style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
          <Mic color="#242424" size={23} strokeWidth={1.9} />
        </span>

        <span style={{ alignItems: 'center', background: '#050505', borderRadius: 999, display: 'flex', height: 44, justifyContent: 'center', width: 44 }}>
          <ArrowUp color="#ffffff" size={26} strokeWidth={2.4} />
        </span>
      </div>
    </AbsoluteFill>
  )
}

type ChartSeries = {
  color: string
  name: string
  values: number[]
}

const chartSeries: ChartSeries[] = [
  { color: '#489de3', name: 'United States', values: [18.4, 18.9, 20.3, 23.4, 31.1] },
  { color: '#59bf83', name: 'China', values: [11.4, 13.1, 14.7, 16.6, 19.5] },
  { color: '#f1844b', name: 'Germany', values: [3.4, 3.7, 3.9, 4.0, 4.8] },
  { color: '#f5c94b', name: 'Japan', values: [4.4, 4.8, 5.0, 4.3, 4.4] },
  { color: '#ef9892', name: 'India', values: [2.1, 2.4, 2.7, 3.2, 4.3] },
  { color: '#a587dc', name: 'United Kingdom', values: [2.9, 2.7, 2.8, 3.1, 3.8] },
  { color: '#e879ac', name: 'France', values: [2.4, 2.5, 2.6, 2.8, 3.2] },
  { color: '#4e9edb', name: 'Italy', values: [1.8, 1.9, 2.1, 2.1, 2.4] },
  { color: '#58ad6e', name: 'Canada', values: [1.6, 1.7, 1.7, 2.1, 2.3] },
  { color: '#ec7442', name: 'Brazil', values: [1.8, 1.8, 1.5, 1.9, 2.3] },
]

const chartWidth = 520
const chartHeight = 220
const plot = { bottom: 184, left: 34, right: 510, top: 20 }

function point(value: number, index: number) {
  const x = plot.left + (index / 4) * (plot.right - plot.left)
  const y = plot.bottom - (value / 32) * (plot.bottom - plot.top)
  return { x, y }
}

function pathFor(values: number[]) {
  return values.map((value, index) => {
    const current = point(value, index)
    return `${index === 0 ? 'M' : 'L'} ${current.x.toFixed(1)} ${current.y.toFixed(1)}`
  }).join(' ')
}

function ChartGraphic() {
  const frame = useCurrentFrame()
  const draw = progress(frame, 28, 106)

  return (
    <svg height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} width={chartWidth}>
      {[0, 8, 16, 24, 32].map((value) => {
        const y = plot.bottom - (value / 32) * (plot.bottom - plot.top)
        return (
          <g key={value}>
            <line stroke="#e8ecea" strokeDasharray="2 3" strokeWidth="1" x1={plot.left} x2={plot.right} y1={y} y2={y} />
            <text fill="#777c79" fontFamily={FONT} fontSize="10" textAnchor="end" x={plot.left - 10} y={y + 3}>{value}</text>
          </g>
        )
      })}

      {['2015', '2020', '2025'].map((year, index) => {
        const x = plot.left + (index / 2) * (plot.right - plot.left)
        return <text fill="#777c79" fontFamily={FONT} fontSize="10" key={year} textAnchor="middle" x={x} y="205">{year}</text>
      })}

      <defs>
        <clipPath id="chart-draw-clip">
          <rect height={chartHeight} width={(plot.right + 4) * draw} x="0" y="0" />
        </clipPath>
      </defs>

      <g clipPath="url(#chart-draw-clip)">
        {chartSeries.map((series) => (
          <path
            d={pathFor(series.values)}
            fill="none"
            key={series.name}
            stroke={series.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        ))}
      </g>
    </svg>
  )
}

function Legend() {
  const frame = useCurrentFrame()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 22px', justifyContent: 'center', marginTop: 2, width: 520 }}>
      {chartSeries.map((series, index) => {
        const enter = progress(frame, 62 + index * 3, 78 + index * 3)
        return (
          <div key={series.name} style={{ alignItems: 'center', display: 'flex', gap: 6, opacity: enter }}>
            <span style={{ background: series.color, borderRadius: 999, height: 8, width: 8 }} />
            <span style={{ color: '#343735', fontSize: 10.5, whiteSpace: 'nowrap' }}>{series.name}</span>
          </div>
        )
      })}
    </div>
  )
}

function ChartScene() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 0, 20)
  const chartEnter = progress(frame, 14, 34)

  return (
    <AbsoluteFill style={{ alignItems: 'center', background: '#ffffff', display: 'flex', fontFamily: FONT, justifyContent: 'center' }}>
      <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 8}px)`, width: 540 }}>
        <p style={{ color: '#252725', fontSize: 13, letterSpacing: 0, lineHeight: 1.48, margin: '0 0 22px' }}>
          Here&apos;s a line chart showing the <strong>approximate nominal GDP growth</strong> of the current top 10<br />
          economies from <strong>2015 to 2025</strong> (trillions of U.S. dollars). Values are rounded and based<br />
          on IMF historical and projected data. <span style={{ background: '#f2f4f3', borderRadius: 4, color: '#8b8f8d', fontSize: 8, padding: '3px 6px' }}>IMF +1</span>
        </p>

        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 9 }}>Top Economies: Nominal GDP Growth (2015–2025)</div>
        <div style={{ color: '#737774', fontSize: 11.5, marginBottom: 8 }}>Approximate nominal GDP in trillions of USD for the current top 10 economies.</div>

        <div style={{ opacity: chartEnter, transform: `translateY(${(1 - chartEnter) * 8}px)` }}>
          <ChartGraphic />
          <Legend />
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function PromptToChartExactVideo() {
  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      <Sequence durationInFrames={PROMPT_SCENE_DURATION}>
        <PromptInputScene />
      </Sequence>
      <Sequence from={PROMPT_SCENE_DURATION} durationInFrames={150}>
        <ChartScene />
      </Sequence>
    </AbsoluteFill>
  )
}

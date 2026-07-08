import { Icon } from '@iconify/react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const CODEX_CHARTS_DURATION = 620

const FONT = IOS_REMOTION_FONT_STACK

function clamp(frame: number, input: [number, number], output: [number, number]) {
  return interpolate(frame, input, output, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function typeText(text: string, progress: number) {
  return text.slice(0, Math.ceil(text.length * progress))
}

function PromptBar({ prompt, start, width = 420 }: { prompt: string; start: number; width?: number }) {
  const frame = useCurrentFrame()
  const enter = clamp(frame, [start, start + 22], [0, 1])
  const typed = clamp(frame, [start + 10, start + 72], [0, 1])

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid #dfe4ea',
        borderRadius: 999,
        boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
        display: 'grid',
        gridTemplateColumns: '24px 1fr auto auto',
        height: 42,
        opacity: enter,
        padding: '0 9px 0 15px',
        transform: `translateY(${(1 - enter) * 10}px)`,
        width,
      }}
    >
      <span style={{ alignItems: 'center', color: '#7b7f86', display: 'flex', fontSize: 18, fontWeight: 420, justifyContent: 'center' }}>+</span>
      <span style={{ color: '#1f2937', fontSize: 13, fontWeight: 520, letterSpacing: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {typeText(prompt, typed)}
      </span>
      <span style={{ color: '#a1a8b3', fontSize: 10, fontWeight: 720, marginLeft: 12 }}>Instant</span>
      <span style={{ alignItems: 'center', background: '#111111', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 12, fontWeight: 780, height: 22, justifyContent: 'center', marginLeft: 8, width: 22 }}>↑</span>
    </div>
  )
}

function ChartCaption({ start, subtitle, title }: { start: number; subtitle: string; title: string }) {
  const frame = useCurrentFrame()
  const opacity = clamp(frame, [start, start + 22], [0, 1])

  return (
    <div style={{ opacity, transform: `translateY(${(1 - opacity) * 8}px)` }}>
      <div style={{ color: '#111827', fontSize: 13, fontWeight: 750, letterSpacing: 0, lineHeight: 1.22, maxWidth: 420 }}>{title}</div>
      <div style={{ color: '#7b8491', fontSize: 9, fontWeight: 560, lineHeight: 1.25, marginTop: 4, maxWidth: 390 }}>{subtitle}</div>
    </div>
  )
}

function BarChart({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const inView = clamp(frame, [start, start + 30], [0, 1])
  const tooltip = clamp(frame, [start + 74, start + 92], [0, 1])
  const data = [
    ['United States', 100],
    ['China', 62],
    ['Germany', 21],
    ['Japan', 18],
    ['India', 16],
    ['United Kingdom', 15],
    ['France', 14],
    ['Italy', 12],
    ['Brazil', 10],
  ]

  return (
    <div style={{ display: 'grid', gap: 10, opacity: inView, transform: `translateY(${(1 - inView) * 12}px)`, width: 430 }}>
      <ChartCaption
        start={start}
        subtitle="Top countries by GDP nominal, USD trillion"
        title="By nominal GDP, the top 10 economies in the world are generally:"
      />
      <div style={{ height: 214, position: 'relative' }}>
        <svg height="214" viewBox="0 0 430 214" width="430">
          <line stroke="#eef1f5" x1="96" x2="398" y1="184" y2="184" />
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line stroke="#f2f4f7" x1={96 + tick * 3} x2={96 + tick * 3} y1="14" y2="184" />
              <text fill="#9aa3af" fontSize="8" fontWeight="650" textAnchor="middle" x={96 + tick * 3} y="202">{tick === 0 ? '0' : `$${tick / 10}T`}</text>
            </g>
          ))}
          {data.map(([label, value], index) => {
            const row = 22 + index * 17
            const width = Number(value) * 3 * clamp(frame, [start + 18 + index * 3, start + 46 + index * 3], [0, 1])
            return (
              <g key={label}>
                <text fill="#6b7280" fontSize="8.5" fontWeight="650" textAnchor="end" x="88" y={row + 8}>{label}</text>
                <rect fill={index === 0 ? '#54a8ff' : '#5aaafa'} height="10" rx="2.5" width={width} x="96" y={row} />
              </g>
            )
          })}
        </svg>
        <div style={{ background: '#ffffff', border: '1px solid #d9dee8', borderRadius: 7, boxShadow: '0 10px 24px rgba(15,23,42,0.14)', left: 244, opacity: tooltip, padding: '8px 10px', position: 'absolute', top: 78, transform: `scale(${0.94 + tooltip * 0.06})`, transformOrigin: 'left top' }}>
          <div style={{ color: '#111827', fontSize: 10, fontWeight: 760 }}>United States</div>
          <div style={{ color: '#5aaafa', fontSize: 9, fontWeight: 760, marginTop: 3 }}>GDP: $27.7T</div>
        </div>
      </div>
    </div>
  )
}

function LineChart({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const inView = clamp(frame, [start, start + 28], [0, 1])
  const tooltip = clamp(frame, [start + 88, start + 108], [0, 1])
  const progress = clamp(frame, [start + 24, start + 94], [0, 1])
  const series = [
    { color: '#6fb8ff', name: 'United States', points: [[24, 138], [92, 134], [160, 126], [228, 112], [296, 92], [364, 64]] },
    { color: '#64c582', name: 'China', points: [[24, 160], [92, 154], [160, 144], [228, 130], [296, 114], [364, 98]] },
    { color: '#e96666', name: 'Germany', points: [[24, 176], [92, 174], [160, 171], [228, 168], [296, 164], [364, 160]] },
    { color: '#ffb84d', name: 'Japan', points: [[24, 168], [92, 167], [160, 166], [228, 166], [296, 164], [364, 162]] },
  ]

  return (
    <div style={{ display: 'grid', gap: 9, opacity: inView, transform: `translateY(${(1 - inView) * 12}px)`, width: 460 }}>
      <ChartCaption
        start={start}
        subtitle="Projected nominal GDP from 2024 to 2029, using IMF-style estimates"
        title="Here is a line chart showing the approximate nominal GDP growth of the current top 10 economies from 2024 to 2029."
      />
      <div style={{ height: 238, position: 'relative' }}>
        <svg height="238" viewBox="0 0 460 238" width="460">
          {[58, 94, 130, 166].map((y) => <line key={y} stroke="#eef1f5" x1="24" x2="386" y1={y} y2={y} />)}
          <line stroke="#dfe4ea" x1="24" x2="386" y1="188" y2="188" />
          {series.map((item) => {
            const visible = item.points.map((point, index) => {
              if (progress >= 1) return point
              const previous = item.points[Math.max(0, index - 1)]
              const segment = Math.max(0, Math.min(1, progress * (item.points.length - 1) - index + 1))
              return [previous[0] + (point[0] - previous[0]) * segment, previous[1] + (point[1] - previous[1]) * segment]
            })
            return <path d={visible.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point[0]} ${point[1]}`).join(' ')} fill="none" key={item.name} stroke={item.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          })}
          {['2024', '2025', '2026', '2027', '2028', '2029'].map((label, index) => <text fill="#9aa3af" fontSize="8" fontWeight="650" key={label} textAnchor="middle" x={24 + index * 68} y="211">{label}</text>)}
          <g>
            {series.map((item, index) => (
              <g key={item.name} transform={`translate(${24 + index * 98} 224)`}>
                <circle cx="0" cy="-3" fill={item.color} r="3" />
                <text fill="#6b7280" fontSize="8.5" fontWeight="650" x="8" y="0">{item.name}</text>
              </g>
            ))}
          </g>
        </svg>
        <div style={{ background: '#ffffff', border: '1px solid #d9dee8', borderRadius: 7, boxShadow: '0 10px 24px rgba(15,23,42,0.14)', left: 260, opacity: tooltip, padding: '8px 10px', position: 'absolute', top: 74, transform: `scale(${0.94 + tooltip * 0.06})`, width: 124 }}>
          {series.map((item, index) => <div key={item.name} style={{ alignItems: 'center', color: '#111827', display: 'flex', fontSize: 8.5, fontWeight: 650, gap: 6, marginTop: index === 0 ? 0 : 4 }}><span style={{ background: item.color, borderRadius: 999, height: 6, width: 6 }} />{item.name}</div>)}
        </div>
      </div>
    </div>
  )
}

function PieChart({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const inView = clamp(frame, [start, start + 28], [0, 1])
  const spin = clamp(frame, [start + 20, start + 80], [0, 1])
  const segments = [
    { color: '#f6bd60', dash: '28 72', label: 'Coal' },
    { color: '#84dcc6', dash: '21 79', label: 'Oil' },
    { color: '#a78bfa', dash: '18 82', label: 'Natural Gas' },
    { color: '#f28482', dash: '14 86', label: 'Nuclear' },
    { color: '#60a5fa', dash: '10 90', label: 'Hydro' },
  ]

  return (
    <div style={{ display: 'grid', gap: 9, opacity: inView, transform: `translateY(${(1 - inView) * 12}px)`, width: 440 }}>
      <ChartCaption
        start={start}
        subtitle="Approximate aggregation across electricity generation sources"
        title="Assuming you mean the combined electricity generation mix across the top 10 GDP economies."
      />
      <div style={{ alignItems: 'center', display: 'grid', gridTemplateColumns: '190px 1fr', height: 210 }}>
        <svg height="190" viewBox="0 0 190 190" width="190">
          <circle cx="95" cy="95" fill="#ffffff" r="54" stroke="#f2f4f7" strokeWidth="34" />
          {segments.map((segment, index) => (
            <circle
              cx="95"
              cy="95"
              fill="none"
              key={segment.label}
              r="54"
              stroke={segment.color}
              strokeDasharray={segment.dash}
              strokeDashoffset={-index * 18 * spin}
              strokeLinecap="butt"
              strokeWidth="34"
              style={{ transform: `rotate(${-90 + index * 54}deg)`, transformOrigin: '95px 95px' }}
            />
          ))}
          <circle cx="95" cy="95" fill="#ffffff" r="33" />
        </svg>
        <div style={{ display: 'grid', gap: 10 }}>
          {segments.map((segment, index) => (
            <div key={segment.label} style={{ alignItems: 'center', display: 'flex', gap: 9, opacity: clamp(frame, [start + 42 + index * 5, start + 58 + index * 5], [0, 1]) }}>
              <span style={{ background: segment.color, borderRadius: 999, height: 9, width: 9 }} />
              <span style={{ color: '#4b5563', fontSize: 11, fontWeight: 650 }}>{segment.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OpenAiMark({ start }: { start: number }) {
  const frame = useCurrentFrame()
  const opacity = clamp(frame, [start, start + 28], [0, 1])
  const scale = clamp(frame, [start, start + 36], [0.86, 1])

  return (
    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', opacity, transform: `scale(${scale})` }}>
      <Icon color="#111111" height={74} icon="simple-icons:openai" width={74} />
    </div>
  )
}

export function CodexChartsAnimation() {
  const frame = useCurrentFrame()
  const titleOut = clamp(frame, [76, 112], [1, 0])
  const promptOneOut = clamp(frame, [164, 194], [1, 0])
  const barOut = clamp(frame, [232, 260], [1, 0])
  const promptTwoOut = clamp(frame, [334, 364], [1, 0])
  const lineOut = clamp(frame, [430, 462], [1, 0])
  const promptThreeOut = clamp(frame, [500, 528], [1, 0])

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111827', fontFamily: FONT, overflow: 'hidden' }}>
      <div style={{ left: 92, opacity: titleOut, position: 'absolute', textAlign: 'center', top: 78, transform: `translateY(${(1 - titleOut) * -12}px)`, width: 292 }}>
        <h1 style={{ color: '#050505', fontSize: 37, fontWeight: 780, letterSpacing: 0, lineHeight: 1.08, margin: 0 }}>Interactive charts in ChatGPT</h1>
      </div>

      <div style={{ left: 648, opacity: promptOneOut, position: 'absolute', top: 86 }}>
        <PromptBar prompt="What are the top 10 countries by GDP?" start={42} />
      </div>
      <div style={{ left: 724, opacity: barOut, position: 'absolute', top: 40 }}>
        <BarChart start={110} />
      </div>

      <div style={{ left: 48, opacity: promptTwoOut, position: 'absolute', top: 286 }}>
        <PromptBar prompt="Show a line chart of the growth over the last 10 years per country" start={214} width={430} />
      </div>
      <div style={{ left: 724, opacity: lineOut, position: 'absolute', top: 216 }}>
        <LineChart start={282} />
      </div>

      <div style={{ left: 48, opacity: promptThreeOut, position: 'absolute', top: 468 }}>
        <PromptBar prompt="Give me a pie chart showing the energy sources used" start={402} width={430} />
      </div>
      <div style={{ left: 724, position: 'absolute', top: 430 }}>
        <PieChart start={476} />
      </div>

      <div style={{ bottom: 98, opacity: clamp(frame, [548, 580], [0, 1]), position: 'absolute', right: 168 }}>
        <OpenAiMark start={548} />
      </div>
    </AbsoluteFill>
  )
}

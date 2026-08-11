import { interpolate } from 'remotion'

const FONT = 'Arial, Helvetica, sans-serif'
const INK = '#111111'
const MUTED = '#7d7d7d'
const BORDER = '#e5e7eb'
const BLUE = '#3d91d8'
const GREEN = '#16845b'
const ORANGE = '#df7548'
const PURPLE = '#9b7ed0'

export type ChatGptConversationChartKind = 'cashflow' | 'revenue' | 'overdue' | 'tax'

function p(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function linePath(values: number[]) {
  return values.map((value, index) => {
    const x = 58 + index * 122
    const y = 218 - (value / 140) * 175
    return `${index === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`
  }).join(' ')
}

function piePoint(angle: number, radius = 82) {
  const radians = ((angle - 90) * Math.PI) / 180
  return { x: 112 + radius * Math.cos(radians), y: 112 + radius * Math.sin(radians) }
}

function pieSlicePath(startAngle: number, endAngle: number) {
  const start = piePoint(startAngle)
  const end = piePoint(endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M 112 112 L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A 82 82 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <span style={{ alignItems: 'center', color: MUTED, display: 'inline-flex', fontSize: 12, gap: 6 }}><i style={{ background: color, borderRadius: 999, height: 8, width: 8 }} />{label}</span>
}

function CashFlowChart({ frame }: { frame: number }) {
  const draw = p(frame, 12, 72)
  const series = [
    { color: BLUE, name: 'Entradas', values: [66, 78, 86, 101, 116, 132] },
    { color: ORANGE, name: 'Saídas', values: [54, 60, 72, 76, 83, 91] },
  ]

  return (
    <div style={{ padding: '8px 20px 0' }}>
      <svg height="260" viewBox="0 0 720 260" width="100%">
        {[0, 40, 80, 120].map((value) => {
          const y = 218 - (value / 140) * 175
          return <g key={value}><line stroke="#e8ecea" strokeDasharray="3 4" x1="58" x2="668" y1={y} y2={y} /><text fill={MUTED} fontFamily={FONT} fontSize="10" textAnchor="end" x="48" y={y + 4}>{value ? `R$ ${value}k` : 'R$ 0'}</text></g>
        })}
        {['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'].map((month, index) => <text fill={MUTED} fontFamily={FONT} fontSize="10" key={month} textAnchor="middle" x={58 + index * 122} y="246">{month}</text>)}
        <defs><clipPath id="chatgpt-cashflow-reveal"><rect height="250" width={690 * draw} x="0" y="0" /></clipPath></defs>
        <g clipPath="url(#chatgpt-cashflow-reveal)">
          {series.map((item) => <path d={linePath(item.values)} fill="none" key={item.name} stroke={item.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />)}
        </g>
      </svg>
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: -4 }}>{series.map((item) => <LegendDot color={item.color} key={item.name} label={item.name} />)}</div>
    </div>
  )
}

function RevenuePieChart({ frame }: { frame: number }) {
  const rows = [
    { color: BLUE, label: 'Serviços', value: 42 },
    { color: GREEN, label: 'Assinaturas', value: 31 },
    { color: PURPLE, label: 'Projetos', value: 17 },
    { color: ORANGE, label: 'Treinamentos', value: 10 },
  ]
  let angle = 0
  const slices = rows.map((item) => {
    const startAngle = angle
    angle += item.value * 3.6
    return { ...item, endAngle: angle, startAngle }
  })

  return (
    <div style={{ alignItems: 'center', display: 'grid', gridTemplateColumns: '260px 1fr', padding: '20px 56px 24px' }}>
      <svg height="224" viewBox="0 0 224 224" width="224">
        <circle cx="112" cy="112" fill="#edf0ee" r="82" />
        {slices.map((item, index) => {
          const enter = p(frame, 12 + index * 10, 34 + index * 10)
          return <path d={pieSlicePath(item.startAngle, item.endAngle)} fill={item.color} key={item.label} opacity={enter} stroke="#ffffff" strokeLinejoin="round" strokeWidth="4" style={{ transform: `scale(${0.9 + enter * 0.1})`, transformBox: 'fill-box', transformOrigin: 'center' }} />
        })}
      </svg>
      <div style={{ display: 'grid', gap: 18 }}>
        {rows.map((item, index) => {
          const enter = p(frame, 24 + index * 8, 44 + index * 8)
          return <div key={item.label} style={{ alignItems: 'center', display: 'grid', gap: 10, gridTemplateColumns: '10px 1fr auto', opacity: enter }}><span style={{ background: item.color, borderRadius: 999, height: 10, width: 10 }} /><span style={{ color: MUTED, fontSize: 14 }}>{item.label}</span><strong style={{ color: INK, fontSize: 15 }}>{item.value}%</strong></div>
        })}
      </div>
    </div>
  )
}

function OverdueBarChart({ frame }: { frame: number }) {
  const rows = [
    { label: 'Aurora Tecnologia', value: 21.5 },
    { label: 'Lume Comércio', value: 15.8 },
    { label: 'Studio Norte', value: 12.4 },
    { label: 'Prisma Tech', value: 8.9 },
    { label: 'Nova Oficina', value: 6.2 },
    { label: 'Vitta Serviços', value: 4.1 },
  ]
  return (
    <div style={{ display: 'grid', gap: 13, padding: '20px 34px 25px' }}>
      {rows.map((item, index) => {
        const enter = p(frame, 10 + index * 8, 34 + index * 8)
        return (
          <div key={item.label} style={{ alignItems: 'center', display: 'grid', gap: 12, gridTemplateColumns: '130px 1fr 74px' }}>
            <span style={{ color: MUTED, fontSize: 12, textAlign: 'right' }}>{item.label}</span>
            <div style={{ background: '#f0f1f1', borderRadius: 5, height: 18, overflow: 'hidden' }}><div style={{ background: index < 2 ? ORANGE : '#e5a285', borderRadius: 5, height: '100%', width: `${(item.value / 22) * 100 * enter}%` }} /></div>
            <strong style={{ color: INK, fontSize: 12 }}>R$ {item.value.toLocaleString('pt-BR')} mil</strong>
          </div>
        )
      })}
    </div>
  )
}

function TaxComparisonChart({ frame }: { frame: number }) {
  const rows = [
    { current: 28.4, label: 'Tributos federais', optimized: 23.1 },
    { current: 14.8, label: 'Tributos estaduais', optimized: 12.9 },
    { current: 9.6, label: 'Tributos municipais', optimized: 8.2 },
    { current: 6.4, label: 'Encargos', optimized: 5.9 },
  ]
  return (
    <div style={{ padding: '15px 32px 24px' }}>
      <div style={{ alignItems: 'end', display: 'grid', gap: 30, gridTemplateColumns: 'repeat(4, 1fr)', height: 220, padding: '0 24px', position: 'relative' }}>
        {[0, 10, 20, 30].map((value) => <div key={value} style={{ borderTop: '1px dashed #e5e7eb', bottom: value * 6.3 + 20, left: 0, position: 'absolute', right: 0 }}><span style={{ color: MUTED, fontSize: 9, left: -4, position: 'absolute', top: -12 }}>{value}</span></div>)}
        {rows.map((item, index) => {
          const enter = p(frame, 12 + index * 8, 40 + index * 8)
          return (
            <div key={item.label} style={{ alignItems: 'end', display: 'grid', gap: 6, gridTemplateColumns: '1fr 1fr', height: 205, position: 'relative', zIndex: 1 }}>
              <div style={{ background: '#cfd3d6', borderRadius: '5px 5px 0 0', height: item.current * 6.1 * enter }} />
              <div style={{ background: GREEN, borderRadius: '5px 5px 0 0', height: item.optimized * 6.1 * enter }} />
              <span style={{ bottom: -31, color: MUTED, fontSize: 10, gridColumn: '1 / -1', lineHeight: 1.15, position: 'absolute', textAlign: 'center', width: '100%' }}>{item.label}</span>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 37 }}><LegendDot color="#cfd3d6" label="Cenário atual" /><LegendDot color={GREEN} label="Cenário otimizado" /></div>
    </div>
  )
}

const chartCopy: Record<ChatGptConversationChartKind, { subtitle: string; title: string }> = {
  cashflow: { subtitle: 'Entradas, saídas e saldo projetado para seis meses', title: 'Impacto no fluxo de caixa' },
  overdue: { subtitle: 'Valores vencidos ordenados por exposição financeira', title: 'Concentração dos valores em atraso' },
  revenue: { subtitle: 'Participação das vendas processadas no período', title: 'Faturamento por origem' },
  tax: { subtitle: 'Comparação anual dentro das regras fiscais aplicáveis', title: 'Cenário tributário atual e otimizado' },
}

export function ChatGptConversationChart({ frame, kind }: { frame: number; kind: ChatGptConversationChartKind }) {
  const enter = p(frame, 0, 18)
  const copy = chartCopy[kind]
  return (
    <section style={{ background: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 24, boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)', minHeight: 390, opacity: enter, overflow: 'hidden', transform: `translateY(${(1 - enter) * 14}px)` }}>
      <header style={{ borderBottom: `1px solid ${BORDER}`, padding: '18px 28px 14px' }}><strong style={{ color: INK, display: 'block', fontSize: 23, fontWeight: 650 }}>{copy.title}</strong><span style={{ color: MUTED, fontSize: 15 }}>{copy.subtitle}</span></header>
      {kind === 'cashflow' ? <CashFlowChart frame={frame} /> : null}
      {kind === 'revenue' ? <RevenuePieChart frame={frame} /> : null}
      {kind === 'overdue' ? <OverdueBarChart frame={frame} /> : null}
      {kind === 'tax' ? <TaxComparisonChart frame={frame} /> : null}
    </section>
  )
}

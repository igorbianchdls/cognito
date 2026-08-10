import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const OTTO_FINANCIAL_DASHBOARD_DURATION = 135

const FONT = IOS_REMOTION_FONT_STACK
const INK = '#171918'
const MUTED = '#727774'
const BORDER = '#e3e7e5'
const GREEN = '#16845b'
const BLUE = '#3d91d8'
const ORANGE = '#df7548'

function p(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function money(value: number) {
  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`
}

const kpis = [
  { accent: BLUE, delta: '+12,4%', icon: TrendingUp, label: 'Receita', positive: true, value: 48610 },
  { accent: ORANGE, delta: '-4,8%', icon: TrendingDown, label: 'Despesas', positive: true, value: 24730 },
  { accent: GREEN, delta: '+18,1%', icon: WalletCards, label: 'Saldo projetado', positive: true, value: 23880 },
  { accent: '#b45309', delta: '6 clientes', icon: CircleAlert, label: 'Em atraso', positive: false, value: 21520 },
]

const chartSeries = [
  { color: BLUE, name: 'Recebimentos', values: [66, 82, 93, 105, 116, 128] },
  { color: ORANGE, name: 'Pagamentos', values: [54, 62, 70, 75, 81, 88] },
]

function chartPath(values: number[]) {
  return values.map((value, index) => {
    const x = 54 + index * 132
    const y = 196 - (value / 140) * 166
    return `${index === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`
  }).join(' ')
}

function piePoint(angle: number, radius = 56) {
  const radians = ((angle - 90) * Math.PI) / 180
  return { x: 70 + radius * Math.cos(radians), y: 70 + radius * Math.sin(radians) }
}

function pieSlicePath(startAngle: number, endAngle: number) {
  const start = piePoint(startAngle)
  const end = piePoint(endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M 70 70 L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A 56 56 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`
}

function KpiCard({ index }: { index: number }) {
  const frame = useCurrentFrame()
  const item = kpis[index]
  const Icon = item.icon
  const enter = p(frame, 8 + index * 7, 28 + index * 7)
  const value = p(frame, 16 + index * 7, 62 + index * 7, [0, item.value])

  return (
    <div style={{ background: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 8, opacity: enter, padding: '16px 18px', transform: `translateY(${(1 - enter) * 12}px)` }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: MUTED, fontSize: 13, fontWeight: 600 }}>{item.label}</span>
        <span style={{ alignItems: 'center', background: `${item.accent}14`, borderRadius: 7, color: item.accent, display: 'flex', height: 30, justifyContent: 'center', width: 30 }}><Icon size={17} strokeWidth={2.1} /></span>
      </div>
      <strong style={{ color: INK, display: 'block', fontSize: 25, fontWeight: 720, marginTop: 8 }}>{money(value)}</strong>
      <div style={{ alignItems: 'center', color: item.positive ? GREEN : '#b45309', display: 'flex', fontSize: 11, fontWeight: 650, gap: 4, marginTop: 4 }}>
        {item.positive ? <ArrowUpRight size={13} /> : <Clock3 size={13} />}{item.delta}
      </div>
    </div>
  )
}

function CashFlowPanel() {
  const frame = useCurrentFrame()
  const enter = p(frame, 30, 50)
  const draw = p(frame, 42, 104)

  return (
    <section style={{ background: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 8, opacity: enter, overflow: 'hidden', transform: `translateY(${(1 - enter) * 10}px)` }}>
      <header style={{ alignItems: 'center', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', padding: '14px 18px' }}>
        <div><strong style={{ display: 'block', fontSize: 15 }}>Fluxo de caixa</strong><span style={{ color: MUTED, fontSize: 11 }}>Projeção para os próximos seis meses</span></div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 16 }}>
          {chartSeries.map((series) => <span key={series.name} style={{ alignItems: 'center', color: MUTED, display: 'flex', fontSize: 11, gap: 6 }}><i style={{ background: series.color, borderRadius: 999, height: 7, width: 7 }} />{series.name}</span>)}
        </div>
      </header>
      <div style={{ padding: '8px 14px 0' }}>
        <svg height="250" viewBox="0 0 760 250" width="100%">
          {[0, 40, 80, 120].map((value) => {
            const y = 196 - (value / 140) * 166
            return <g key={value}><line stroke="#e8ecea" strokeDasharray="3 4" x1="54" x2="714" y1={y} y2={y} /><text fill={MUTED} fontFamily={FONT} fontSize="10" textAnchor="end" x="45" y={y + 4}>{value === 0 ? 'R$ 0' : `R$ ${value}k`}</text></g>
          })}
          {['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'].map((month, index) => <text fill={MUTED} fontFamily={FONT} fontSize="10" key={month} textAnchor="middle" x={54 + index * 132} y="221">{month}</text>)}
          <defs><clipPath id="dashboard-line-reveal"><rect height="230" width={720 * draw} x="0" y="0" /></clipPath></defs>
          <g clipPath="url(#dashboard-line-reveal)">
            {chartSeries.map((series) => <path d={chartPath(series.values)} fill="none" key={series.name} stroke={series.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />)}
          </g>
        </svg>
      </div>
      <footer style={{ borderTop: `1px solid ${BORDER}`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', minHeight: 62 }}>
        {[['Maior entrada', 'R$ 128 mil'], ['Caixa mínimo', 'R$ 12 mil'], ['Saldo em janeiro', 'R$ 40 mil']].map(([label, value], index) => <div key={label} style={{ borderLeft: index ? `1px solid ${BORDER}` : 'none', padding: '12px 18px' }}><span style={{ color: MUTED, display: 'block', fontSize: 10 }}>{label}</span><strong style={{ fontSize: 14 }}>{value}</strong></div>)}
      </footer>
    </section>
  )
}

function RevenuePanel() {
  const frame = useCurrentFrame()
  const rows = [
    { color: BLUE, label: 'Serviços', value: 46 },
    { color: GREEN, label: 'Assinaturas', value: 34 },
    { color: '#a587dc', label: 'Projetos', value: 20 },
  ]
  const enter = p(frame, 38, 58)
  let angle = 0
  const slices = rows.map((item) => {
    const startAngle = angle
    angle += item.value * 3.6
    return { ...item, endAngle: angle, startAngle }
  })

  return (
    <section style={{ background: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 8, opacity: enter, padding: '16px 18px', transform: `translateY(${(1 - enter) * 10}px)` }}>
      <strong style={{ display: 'block', fontSize: 15 }}>Receita por origem</strong>
      <span style={{ color: MUTED, fontSize: 11 }}>Participação no período</span>
      <div style={{ alignItems: 'center', display: 'grid', gap: 18, gridTemplateColumns: '140px 1fr', marginTop: 12 }}>
        <svg aria-label="Distribuição da receita por origem" height="140" viewBox="0 0 140 140" width="140">
          <circle cx="70" cy="70" fill="#edf0ee" r="56" />
          {slices.map((item, index) => {
            const sliceIn = p(frame, 54 + index * 8, 78 + index * 8)
            return (
              <path
                d={pieSlicePath(item.startAngle, item.endAngle)}
                fill={item.color}
                key={item.label}
                opacity={sliceIn}
                stroke="#ffffff"
                strokeLinejoin="round"
                strokeWidth="3"
                style={{ transform: `scale(${0.88 + sliceIn * 0.12})`, transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            )
          })}
        </svg>
        <div style={{ display: 'grid', gap: 13 }}>
          {rows.map((item, index) => {
            const rowIn = p(frame, 62 + index * 8, 82 + index * 8)
            return (
              <div key={item.label} style={{ alignItems: 'center', display: 'grid', fontSize: 11, gap: 8, gridTemplateColumns: '9px 1fr auto', opacity: rowIn }}>
                <span style={{ background: item.color, borderRadius: 999, height: 9, width: 9 }} />
                <span style={{ color: MUTED }}>{item.label}</span>
                <strong style={{ color: INK }}>{item.value}%</strong>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function StatusPanel() {
  const frame = useCurrentFrame()
  const rows = [
    { icon: CheckCircle2, label: 'Financeiro atualizado', tone: GREEN, value: 'Agora' },
    { icon: ReceiptText, label: 'Notas fiscais emitidas', tone: BLUE, value: '8 notas' },
    { icon: CircleAlert, label: 'Cobranças monitoradas', tone: '#b45309', value: '6 clientes' },
  ]
  const enter = p(frame, 48, 68)

  return (
    <section style={{ background: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 8, opacity: enter, overflow: 'hidden', transform: `translateY(${(1 - enter) * 10}px)` }}>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '13px 18px' }}><strong style={{ fontSize: 15 }}>Status operacional</strong></div>
      {rows.map((item, index) => {
        const Icon = item.icon
        const rowIn = p(frame, 66 + index * 8, 84 + index * 8)
        return <div key={item.label} style={{ alignItems: 'center', borderTop: index ? `1px solid ${BORDER}` : 'none', display: 'grid', gridTemplateColumns: '28px 1fr auto', minHeight: 48, opacity: rowIn, padding: '0 16px' }}><Icon color={item.tone} size={17} /><span style={{ fontSize: 11.5, fontWeight: 570 }}>{item.label}</span><strong style={{ color: MUTED, fontSize: 10.5 }}>{item.value}</strong></div>
      })}
    </section>
  )
}

export function OttoFinancialDashboard() {
  const frame = useCurrentFrame()
  const shellIn = p(frame, 0, 20)

  return (
    <AbsoluteFill style={{ background: '#f5f7f6', color: INK, fontFamily: FONT, opacity: shellIn, overflow: 'hidden' }}>
      <header style={{ alignItems: 'center', background: '#ffffff', borderBottom: `1px solid ${BORDER}`, display: 'flex', height: 64, justifyContent: 'space-between', padding: '0 28px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
          <Img src={staticFile('logoOttoIcon.svg')} style={{ height: 30, width: 30 }} />
          <div><strong style={{ display: 'block', fontSize: 16 }}>Visão financeira</strong><span style={{ color: MUTED, fontSize: 11 }}>Atualizado agora pela Otto</span></div>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}><span style={{ color: MUTED, fontSize: 11 }}>Período</span><span style={{ background: '#f3f5f4', border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 11, fontWeight: 650, padding: '8px 11px' }}>Últimos 30 dias</span></div>
      </header>

      <main style={{ display: 'grid', gap: 16, padding: '20px 28px 24px' }}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)' }}>{kpis.map((_, index) => <KpiCard index={index} key={kpis[index].label} />)}</div>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 0.92fr)' }}>
          <CashFlowPanel />
          <div style={{ display: 'grid', gap: 14, gridTemplateRows: '1fr auto' }}><RevenuePanel /><StatusPanel /></div>
        </div>
      </main>
    </AbsoluteFill>
  )
}

import type { ReactNode } from 'react'
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'
import { Landmark, ReceiptText, Scale } from 'lucide-react'

import {
  OttoAiEmployeesSyncCard,
  type OttoAiEmployeesResultRow,
} from './ChatGptClaudeOttoAiEmployeesVideo'
import { OttoLogoRevealHorizontal } from './OttoLogoRevealHorizontal'
import { ExactPromptInputScene } from './PromptToChartExactVideo'
import { TypingText } from '@/assets/remotion/saas/motionComponents'
import type { SaaSTheme } from '@/assets/remotion/saas/types'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const OTTO_FINANCE_AI_50S_DURATION = 1500

const FONT = IOS_REMOTION_FONT_STACK
const INK = '#181818'
const MUTED = '#747474'

const typingTheme: SaaSTheme = {
  accent: INK,
  accent2: MUTED,
  background: '#ffffff',
  border: '#e5e7eb',
  fontFamily: FONT,
  muted: MUTED,
  panel: '#ffffff',
  positive: '#16845b',
  text: INK,
}

function p(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function Scene({ children, duration }: { children: ReactNode; duration: number }) {
  const frame = useCurrentFrame()
  const opacity = p(frame, 0, 12) * p(frame, duration - 12, duration, [1, 0])

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: INK, fontFamily: FONT, opacity, overflow: 'hidden' }}>
      {children}
    </AbsoluteFill>
  )
}

function row({
  description,
  erp,
  initials,
  name,
  status,
  tone,
  value,
}: OttoAiEmployeesResultRow): OttoAiEmployeesResultRow {
  return { description, erp, initials, name, status, tone, value }
}

const reconciliationRows = [
  row({ description: 'PIX recebido · 03 ago', erp: 'Venda #1842', initials: 'PX', name: 'Banco principal', status: 'Conciliado', tone: '#0f766e', value: 'R$ 4.800' }),
  row({ description: 'Cartão corporativo · 03 ago', erp: 'Software', initials: 'CC', name: 'Cartão empresarial', status: 'Conciliado', tone: '#2563eb', value: 'R$ 920' }),
  row({ description: 'TED recebida · 04 ago', erp: 'Cliente Aurora', initials: 'TD', name: 'Conta corrente', status: 'Conciliado', tone: '#7c3aed', value: 'R$ 7.250' }),
  row({ description: 'Débito automático · 04 ago', erp: 'Energia', initials: 'DA', name: 'Banco principal', status: 'Conciliado', tone: '#d97757', value: 'R$ 1.460' }),
]

const expenseRows = [
  row({ description: 'Assinatura mensal reconhecida', initials: 'NL', name: 'Notion Labs', status: 'Classificada', tone: '#111827', value: 'Software · R$ 410' }),
  row({ description: 'Campanha de mídia paga', initials: 'MA', name: 'Meta Ads', status: 'Classificada', tone: '#1877f2', value: 'Marketing · R$ 3.460' }),
  row({ description: 'Entrega para cliente', initials: 'FS', name: 'Frete Sul', status: 'Classificada', tone: '#ea580c', value: 'Logística · R$ 1.280' }),
  row({ description: '6 a pagar · 9 a receber', initials: 'CX', name: 'Contas e caixa', status: 'Atualizado', tone: '#16845b', value: 'Hoje' }),
]

const invoiceRows = [
  row({ description: 'Aurora Tecnologia Ltda.', initials: 'CL', name: 'Cliente identificado', status: 'Validado', tone: '#2563eb', value: 'CNPJ OK' }),
  row({ description: 'Consultoria mensal', initials: 'SV', name: 'Serviço reconhecido', status: 'Completo', tone: '#7c3aed', value: 'R$ 12.400' }),
  row({ description: 'ISS e retenções calculados', initials: 'TX', name: 'Impostos revisados', status: 'Revisado', tone: '#d97757', value: 'R$ 248' }),
  row({ description: 'PDF e XML enviados ao cliente', initials: 'NF', name: 'Nota fiscal #01942', status: 'Emitida', tone: '#16845b', value: 'Financeiro atualizado' }),
]

const collectionRows = [
  row({ description: 'Vencimento em 04 ago', initials: 'LC', name: 'Lume Comércio', status: 'Cobrança enviada', tone: '#0f766e', value: 'R$ 8.900' }),
  row({ description: 'Vencimento em 01 ago', initials: 'NO', name: 'Nova Oficina', status: 'Cobrança enviada', tone: '#2563eb', value: 'R$ 3.280' }),
  row({ description: 'Vencimento em 29 jul', initials: 'SN', name: 'Studio Norte', status: 'Cobrança enviada', tone: '#7c3aed', value: 'R$ 5.440' }),
  row({ description: 'Acompanhamento programado', initials: 'VS', name: 'Vitta Serviços', status: 'Monitorando', tone: '#d97757', value: 'R$ 2.170' }),
]

const fiscalRows = [
  row({ description: 'Calendário e vencimentos', initials: 'OF', name: 'Obrigações fiscais', status: 'Verificado', tone: '#2563eb', value: 'Em dia' }),
  row({ description: 'Enquadramento atual da empresa', initials: 'RT', name: 'Regime tributário', status: 'Analisado', tone: '#7c3aed', value: 'Validado' }),
  row({ description: 'Créditos previstos na legislação', initials: 'CR', name: 'Créditos permitidos', status: 'Verificado', tone: '#16845b', value: 'Disponíveis' }),
  row({ description: 'Alternativa dentro da legislação', initials: 'EC', name: 'Economia tributária', status: 'Identificada', tone: '#d97757', value: 'Oportunidade' }),
]

function SyncScene({
  duration,
  kind = 'list',
  rows,
  subtitle,
  title,
}: {
  duration: number
  kind?: 'list' | 'reconciliation'
  rows: OttoAiEmployeesResultRow[]
  subtitle: string
  title: string
}) {
  const frame = useCurrentFrame()
  return (
    <Scene duration={duration}>
      <div style={{ left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 940 }}>
        <OttoAiEmployeesSyncCard frame={frame} kind={kind} rows={rows} subtitle={subtitle} title={title} />
      </div>
    </Scene>
  )
}

function ChartResponseScene({
  children,
  duration,
  summary,
  subtitle,
  title,
}: {
  children: ReactNode
  duration: number
  summary: ReactNode
  subtitle: string
  title: string
}) {
  const frame = useCurrentFrame()
  const enter = p(frame, 0, 18)
  return (
    <Scene duration={duration}>
      <div style={{ left: '50%', opacity: enter, position: 'absolute', top: '50%', transform: `translate(-50%, -50%) translateY(${(1 - enter) * 10}px)`, width: 760 }}>
        <p style={{ color: '#292b29', fontSize: 16, lineHeight: 1.45, margin: '0 0 22px' }}>{summary}</p>
        <strong style={{ display: 'block', fontSize: 18, fontWeight: 720, marginBottom: 8 }}>{title}</strong>
        <span style={{ color: MUTED, display: 'block', fontSize: 14, marginBottom: 12 }}>{subtitle}</span>
        {children}
      </div>
    </Scene>
  )
}

const cashFlowSeries = [
  { color: '#489de3', name: 'Recebimentos', values: [66, 82, 93, 105, 116, 128] },
  { color: '#e97b48', name: 'Pagamentos', values: [54, 62, 70, 75, 81, 88] },
  { color: '#54b77b', name: 'Saldo', values: [12, 20, 23, 30, 35, 40] },
]

function cashFlowPath(values: number[]) {
  return values.map((value, index) => {
    const x = 58 + index * 132
    const y = 210 - (value / 140) * 182
    return `${index === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`
  }).join(' ')
}

function CashFlowChart({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const draw = p(frame, 24, 94)
  return (
    <ChartResponseScene
      duration={duration}
      summary={<>Com base nas contas já organizadas, a Otto projetou a evolução do caixa para os próximos seis meses.</>}
      subtitle="Recebimentos, pagamentos e saldo projetado · valores em milhares de reais"
      title="Projeção de fluxo de caixa"
    >
      <svg height="270" viewBox="0 0 760 270" width="760">
        {[0, 40, 80, 120].map((value) => {
          const y = 210 - (value / 140) * 182
          return (
            <g key={value}>
              <line stroke="#e7ebe9" strokeDasharray="3 4" x1="58" x2="718" y1={y} y2={y} />
              <text fill="#777b78" fontFamily={FONT} fontSize="11" textAnchor="end" x="48" y={y + 4}>{value === 0 ? 'R$ 0' : `R$ ${value}k`}</text>
            </g>
          )
        })}
        {['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'].map((month, index) => <text fill="#777b78" fontFamily={FONT} fontSize="11" key={month} textAnchor="middle" x={58 + index * 132} y="235">{month}</text>)}
        <defs><clipPath id="cash-flow-draw"><rect height="250" width={720 * draw} x="0" y="0" /></clipPath></defs>
        <g clipPath="url(#cash-flow-draw)">
          {cashFlowSeries.map((series) => <path d={cashFlowPath(series.values)} fill="none" key={series.name} stroke={series.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />)}
        </g>
        {cashFlowSeries.map((series, index) => (
          <g key={series.name} opacity={p(frame, 70 + index * 6, 88 + index * 6)} transform={`translate(${220 + index * 170} 258)`}>
            <circle cx="0" cy="-4" fill={series.color} r="5" />
            <text fill="#3d403e" fontFamily={FONT} fontSize="12" x="10" y="0">{series.name}</text>
          </g>
        ))}
      </svg>
    </ChartResponseScene>
  )
}

const overdueClients = [
  { color: '#489de3', name: 'Lume Comércio', value: 8.9 },
  { color: '#6abf8a', name: 'Studio Norte', value: 5.44 },
  { color: '#a587dc', name: 'Nova Oficina', value: 3.28 },
  { color: '#e97b48', name: 'Vitta Serviços', value: 2.17 },
]

function OverdueChart({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  return (
    <ChartResponseScene
      duration={duration}
      summary={<>A maior concentração está em dois clientes. Juntos, eles representam <strong>71% do valor em atraso</strong>.</>}
      subtitle="Valores vencidos por cliente · milhares de reais"
      title="Concentração dos recebimentos em atraso"
    >
      <svg height="280" viewBox="0 0 760 280" width="760">
        {[0, 2, 4, 6, 8, 10].map((value) => {
          const x = 170 + value * 52
          return (
            <g key={value}>
              <line stroke="#e7ebe9" strokeDasharray="3 4" x1={x} x2={x} y1="16" y2="230" />
              <text fill="#777b78" fontFamily={FONT} fontSize="11" textAnchor="middle" x={x} y="252">R$ {value}k</text>
            </g>
          )
        })}
        {overdueClients.map((client, index) => {
          const rowIn = p(frame, 22 + index * 12, 48 + index * 12)
          const width = client.value * 52 * rowIn
          const y = 28 + index * 52
          return (
            <g key={client.name} opacity={rowIn}>
              <text fill="#343735" fontFamily={FONT} fontSize="13" fontWeight="600" textAnchor="end" x="154" y={y + 18}>{client.name}</text>
              <rect fill={client.color} height="28" rx="4" width={width} x="170" y={y} />
              <text fill="#343735" fontFamily={FONT} fontSize="12" fontWeight="700" x={180 + width} y={y + 19}>R$ {client.value.toFixed(2).replace('.', ',')}k</text>
            </g>
          )
        })}
      </svg>
    </ChartResponseScene>
  )
}

function CompatibilityScene({ duration }: { duration: number }) {
  return (
    <Scene duration={duration}>
      <div style={{ alignItems: 'center', display: 'flex', inset: 0, justifyContent: 'center', padding: '0 80px', position: 'absolute' }}>
        <TypingText
          delay={16}
          speed={0.58}
          style={{ display: 'block', fontSize: 64, fontWeight: 720, letterSpacing: 0, lineHeight: 1.16, maxWidth: 1000, textAlign: 'center' }}
          text="O Otto funciona diretamente no seu ChatGPT ou Claude."
          theme={typingTheme}
        />
      </div>
    </Scene>
  )
}

function OutroScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const logoIn = p(frame, 4, 30)
  const textIn = p(frame, 34, 62)
  return (
    <Scene duration={duration}>
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', inset: 0, justifyContent: 'center', position: 'absolute' }}>
        <Img src={staticFile('logoOtto.svg')} style={{ height: 250, opacity: logoIn, width: 590 }} />
        <div style={{ background: '#e5e7eb', height: 2, margin: '8px 0 26px', opacity: textIn, width: 120 }} />
        <strong style={{ fontSize: 36, fontWeight: 600, opacity: textIn }}>Administre sua empresa conversando com a IA.</strong>
        <div style={{ alignItems: 'center', color: MUTED, display: 'flex', fontSize: 18, gap: 28, marginTop: 28, opacity: p(frame, 58, 82) }}>
          <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}><Landmark size={20} />Financeiro</span>
          <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}><ReceiptText size={20} />Fiscal</span>
          <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}><Scale size={20} />Contabilidade</span>
        </div>
      </div>
    </Scene>
  )
}

export function OttoFinanceAi50sVideo() {
  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      <Sequence durationInFrames={90}><OttoLogoRevealHorizontal /></Sequence>
      <Sequence from={90} durationInFrames={90}><ExactPromptInputScene duration={90} prompt="Otto, organize o financeiro da minha empresa." /></Sequence>
      <Sequence from={180} durationInFrames={130}><SyncScene duration={130} kind="reconciliation" rows={reconciliationRows} subtitle="Bancos, cartões e lançamentos do Otto" title="Conciliação bancária" /></Sequence>
      <Sequence from={310} durationInFrames={110}><SyncScene duration={110} rows={expenseRows} subtitle="Categorias, contas a pagar, contas a receber e caixa" title="Organização financeira" /></Sequence>
      <Sequence from={420} durationInFrames={90}><ExactPromptInputScene duration={90} prompt="Mostre a projeção do fluxo de caixa dos próximos 6 meses." /></Sequence>
      <Sequence from={510} durationInFrames={140}><CashFlowChart duration={140} /></Sequence>
      <Sequence from={650} durationInFrames={90}><ExactPromptInputScene duration={90} prompt="Emita a nota desta venda e envie ao cliente." /></Sequence>
      <Sequence from={740} durationInFrames={120}><SyncScene duration={120} rows={invoiceRows} subtitle="Cliente, serviço, impostos, emissão e atualização financeira" title="Emissão inteligente de nota fiscal" /></Sequence>
      <Sequence from={860} durationInFrames={110}><SyncScene duration={110} rows={collectionRows} subtitle="Clientes em atraso e acompanhamentos automáticos" title="Cobranças e recebimentos" /></Sequence>
      <Sequence from={970} durationInFrames={90}><ExactPromptInputScene duration={90} prompt="Quais clientes concentram os valores em atraso?" /></Sequence>
      <Sequence from={1060} durationInFrames={140}><OverdueChart duration={140} /></Sequence>
      <Sequence from={1200} durationInFrames={110}><SyncScene duration={110} rows={fiscalRows} subtitle="Obrigações, regime, créditos e oportunidades legais" title="Análise fiscal e tributária" /></Sequence>
      <Sequence from={1310} durationInFrames={100}><CompatibilityScene duration={100} /></Sequence>
      <Sequence from={1410} durationInFrames={90}><OutroScene duration={90} /></Sequence>
    </AbsoluteFill>
  )
}

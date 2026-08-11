import type { ReactNode } from 'react'
import { SiMercadopago, SiNubank } from '@icons-pack/react-simple-icons'
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { Check, Landmark, MousePointer2, ReceiptText, Scale } from 'lucide-react'

import {
  OttoAiEmployeesSyncCard,
  type OttoAiEmployeesResultRow,
} from './ChatGptClaudeOttoAiEmployeesVideo'
import { OttoLogoRevealHorizontal } from './OttoLogoRevealHorizontal'
import { ExactPromptInputScene } from './PromptToChartExactVideo'
import { OttoFinancialDashboard } from './OttoFinancialDashboard'
import { TypingText } from '@/assets/remotion/saas/motionComponents'
import type { SaaSTheme } from '@/assets/remotion/saas/types'
import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'
import AmazonIcon from '@/components/icons/AmazonIcon'
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import HotmartIcon from '@/components/icons/HotmartIcon'
import MetaIcon from '@/components/icons/MetaIcon'
import NuvemshopIcon from '@/components/icons/NuvemshopIcon'
import ShopifyIcon from '@/components/icons/ShopifyIcon'

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

function row(value: OttoAiEmployeesResultRow): OttoAiEmployeesResultRow {
  return value
}

function bankAssetIcon(src: string, cropSymbol = false) {
  return function BankAssetIcon({ className }: { className?: string }) {
    return (
      <span
        className={className}
        style={{ alignItems: 'center', display: 'flex', justifyContent: cropSymbol ? 'flex-start' : 'center', overflow: 'hidden' }}
      >
        <Img
          src={staticFile(src)}
          style={{ display: 'block', flex: 'none', height: '100%', maxWidth: 'none', objectFit: 'contain', width: cropSymbol ? 'auto' : '100%' }}
        />
      </span>
    )
  }
}

function NubankBrandIcon({ className }: { className?: string }) {
  return <SiNubank className={className} color="#820ad1" />
}

function MercadoPagoBrandIcon({ className }: { className?: string }) {
  return <SiMercadopago className={className} color="#009ee3" />
}

const ItauBrandIcon = bankAssetIcon('brand-logos/banks/itau.svg')
const SantanderBrandIcon = bankAssetIcon('brand-logos/banks/santander.svg', true)
const BancoDoBrasilBrandIcon = bankAssetIcon('brand-logos/banks/banco-do-brasil.svg', true)
const BradescoBrandIcon = bankAssetIcon('brand-logos/banks/bradesco.svg', true)

const reconciliationRows = [
  row({ description: 'PIX recebido · 03 ago', erp: 'Venda #1842', icon: ItauBrandIcon, initials: 'IT', name: 'Itaú Empresas', status: 'Conciliado', tone: '#ff7900', value: 'R$ 4.800' }),
  row({ description: 'Cartão corporativo · 03 ago', erp: 'Software', icon: NubankBrandIcon, initials: 'NU', name: 'Nubank PJ', status: 'Conciliado', tone: '#820ad1', value: 'R$ 920' }),
  row({ description: 'TED recebida · 04 ago', erp: 'Cliente Aurora', icon: SantanderBrandIcon, initials: 'ST', name: 'Santander Empresas', status: 'Conciliado', tone: '#e60000', value: 'R$ 7.250' }),
  row({ description: 'Débito automático · 04 ago', erp: 'Energia', icon: BancoDoBrasilBrandIcon, initials: 'BB', name: 'Banco do Brasil', status: 'Conciliado', tone: '#0038a8', value: 'R$ 1.460' }),
  row({ description: 'Boleto compensado · 05 ago', erp: 'Fornecedor Delta', icon: BradescoBrandIcon, initials: 'BR', name: 'Bradesco Empresas', status: 'Conciliado', tone: '#cc092f', value: 'R$ 2.640' }),
  row({ description: 'Tarifa da conta · 05 ago', erp: 'Despesas bancárias', icon: MercadoPagoBrandIcon, initials: 'MP', name: 'Mercado Pago', status: 'Conciliado', tone: '#00b1ea', value: 'R$ 89' }),
]

const expenseRows = [
  row({ description: 'Campanha de mídia paga', icon: MetaIcon, initials: 'MA', name: 'Meta Ads', status: 'Classificada', tone: '#1877f2', value: 'Marketing · R$ 3.460' }),
  row({ description: 'Campanhas de pesquisa', icon: GoogleAdsIcon, initials: 'GA', name: 'Google Ads', status: 'Classificada', tone: '#f4b400', value: 'Marketing · R$ 2.180' }),
  row({ description: 'Taxas sobre vendas digitais', icon: HotmartIcon, initials: 'HM', name: 'Hotmart', status: 'Classificada', tone: '#f04e23', value: 'Taxas · R$ 1.290' }),
  row({ description: 'Mensalidade da loja virtual', icon: ShopifyIcon, initials: 'SH', name: 'Shopify', status: 'Classificada', tone: '#95bf47', value: 'E-commerce · R$ 540' }),
  row({ description: 'Aplicativos e serviços da loja', icon: NuvemshopIcon, initials: 'NS', name: 'Nuvemshop', status: 'Classificada', tone: '#006bc8', value: 'Software · R$ 410' }),
  row({ description: 'Compra de materiais de escritório', icon: AmazonIcon, initials: 'AZ', name: 'Amazon', status: 'Classificada', tone: '#ff9900', value: 'Materiais · R$ 860' }),
]

const recentSalesRows = [
  row({ description: 'Aurora Tecnologia · Consultoria', initials: '42', name: 'Venda #01942', status: 'Confirmada', tone: '#2563eb', value: 'R$ 12.400' }),
  row({ description: 'Lume Comércio · Implantação', initials: '41', name: 'Venda #01941', status: 'Confirmada', tone: '#0f766e', value: 'R$ 8.900' }),
  row({ description: 'Studio Norte · Projeto mensal', initials: '40', name: 'Venda #01940', status: 'Confirmada', tone: '#7c3aed', value: 'R$ 5.440' }),
  row({ description: 'Prisma Tech · Licenciamento', initials: '39', name: 'Venda #01939', status: 'Confirmada', tone: '#0891b2', value: 'R$ 4.200' }),
  row({ description: 'Nova Oficina · Assessoria', initials: '38', name: 'Venda #01938', status: 'Confirmada', tone: '#d97757', value: 'R$ 3.280' }),
  row({ description: 'Vitta Serviços · Treinamento', initials: '37', name: 'Venda #01937', status: 'Confirmada', tone: '#16845b', value: 'R$ 2.170' }),
  row({ description: 'Mercado Norte · Suporte', initials: '36', name: 'Venda #01936', status: 'Confirmada', tone: '#475569', value: 'R$ 1.580' }),
  row({ description: 'Delta Logística · Integração', initials: '35', name: 'Venda #01935', status: 'Confirmada', tone: '#ea580c', value: 'R$ 2.640' }),
]

const invoiceEmissionRows = [
  row({ description: 'Venda #01942 · Aurora Tecnologia', initials: 'NF', name: 'NFS-e #02841', status: 'Emitida', statusIcon: ReceiptText, tone: '#2563eb', value: 'R$ 12.400' }),
  row({ description: 'Venda #01941 · Lume Comércio', initials: 'NF', name: 'NFS-e #02842', status: 'Emitida', statusIcon: ReceiptText, tone: '#0f766e', value: 'R$ 8.900' }),
  row({ description: 'Venda #01940 · Studio Norte', initials: 'NF', name: 'NFS-e #02843', status: 'Emitida', statusIcon: ReceiptText, tone: '#7c3aed', value: 'R$ 5.440' }),
  row({ description: 'Venda #01939 · Prisma Tech', initials: 'NF', name: 'NFS-e #02844', status: 'Emitida', statusIcon: ReceiptText, tone: '#0891b2', value: 'R$ 4.200' }),
  row({ description: 'Venda #01938 · Nova Oficina', initials: 'NF', name: 'NFS-e #02845', status: 'Emitida', statusIcon: ReceiptText, tone: '#d97757', value: 'R$ 3.280' }),
  row({ description: 'Venda #01937 · Vitta Serviços', initials: 'NF', name: 'NFS-e #02846', status: 'Emitida', statusIcon: ReceiptText, tone: '#16845b', value: 'R$ 2.170' }),
  row({ description: 'Venda #01936 · Mercado Norte', initials: 'NF', name: 'NFS-e #02847', status: 'Emitida', statusIcon: ReceiptText, tone: '#475569', value: 'R$ 1.580' }),
  row({ description: 'Venda #01935 · Delta Logística', initials: 'NF', name: 'NFS-e #02848', status: 'Emitida', statusIcon: ReceiptText, tone: '#ea580c', value: 'R$ 2.640' }),
]

const collectionRows = [
  row({ description: 'Vencimento em 04 ago', initials: 'LC', name: 'Lume Comércio', status: 'Cobrança enviada', tone: '#0f766e', value: 'R$ 8.900' }),
  row({ description: 'Vencimento em 01 ago', initials: 'NO', name: 'Nova Oficina', status: 'Cobrança enviada', tone: '#2563eb', value: 'R$ 3.280' }),
  row({ description: 'Vencimento em 29 jul', initials: 'SN', name: 'Studio Norte', status: 'Cobrança enviada', tone: '#7c3aed', value: 'R$ 5.440' }),
  row({ description: 'Acompanhamento programado', initials: 'VS', name: 'Vitta Serviços', status: 'Monitorando', tone: '#d97757', value: 'R$ 2.170' }),
  row({ description: 'Vencimento em 25 jul', initials: 'PT', name: 'Prisma Tech', status: 'Cobrança enviada', tone: '#0891b2', value: 'R$ 1.940' }),
  row({ description: 'Acompanhamento programado', initials: 'MN', name: 'Mercado Norte', status: 'Monitorando', tone: '#475569', value: 'R$ 1.580' }),
]

const fiscalRows = [
  row({ description: 'Calendário e vencimentos', initials: 'OF', name: 'Obrigações fiscais', status: 'Verificado', tone: '#2563eb', value: 'Em dia' }),
  row({ description: 'Enquadramento atual da empresa', initials: 'RT', name: 'Regime tributário', status: 'Analisado', tone: '#7c3aed', value: 'Validado' }),
  row({ description: 'Créditos previstos na legislação', initials: 'CR', name: 'Créditos permitidos', status: 'Verificado', tone: '#16845b', value: 'Disponíveis' }),
  row({ description: 'Datas e entregas dos próximos meses', initials: 'CT', name: 'Calendário tributário', status: 'Atualizado', tone: '#0891b2', value: '12 obrigações' }),
  row({ description: 'Cenários do regime atual e alternativo', initials: 'SC', name: 'Simulação comparativa', status: 'Concluída', tone: '#475569', value: '3 cenários' }),
  row({ description: 'Alternativa dentro da legislação', initials: 'EC', name: 'Economia tributária', status: 'Identificada', tone: '#d97757', value: 'Oportunidade' }),
]

function InvoiceDocumentPreview({ frame }: { frame: number }) {
  const { height, width } = useVideoConfig()
  const show = p(frame, 55, 64)
  const squareOffset = height >= width ? 170 : 0

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dedede',
        borderRadius: 14,
        boxShadow: '0 28px 70px rgba(15, 23, 42, 0.2)',
        left: '50%',
        opacity: show,
        padding: '26px 30px 24px',
        position: 'absolute',
        top: 64 + squareOffset,
        transform: `translateX(-50%) translateY(${(1 - show) * 18}px) scale(${0.96 + show * 0.04})`,
        width: 510,
        zIndex: 20,
      }}
    >
      <div style={{ alignItems: 'flex-start', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', paddingBottom: 18 }}>
        <div>
          <span style={{ color: '#737373', display: 'block', fontSize: 12, fontWeight: 650, marginBottom: 6, textTransform: 'uppercase' }}>Nota Fiscal de Serviço Eletrônica</span>
          <strong style={{ color: '#111111', display: 'block', fontSize: 25, fontWeight: 740 }}>NFS-e #02841</strong>
        </div>
        <div style={{ alignItems: 'center', background: '#ecfdf3', borderRadius: 999, color: '#166534', display: 'flex', fontSize: 13, fontWeight: 700, gap: 6, padding: '8px 11px' }}>
          <Check size={15} strokeWidth={2.6} /> Autorizada
        </div>
      </div>

      <div style={{ display: 'grid', gap: 17, gridTemplateColumns: '1fr 1fr', padding: '20px 0' }}>
        <div>
          <span style={{ color: '#888888', display: 'block', fontSize: 12, marginBottom: 5 }}>Prestador</span>
          <strong style={{ display: 'block', fontSize: 15, fontWeight: 650 }}>Otto Tecnologia Ltda.</strong>
          <span style={{ color: '#666666', display: 'block', fontSize: 12, marginTop: 4 }}>CNPJ 42.818.240/0001-09</span>
        </div>
        <div>
          <span style={{ color: '#888888', display: 'block', fontSize: 12, marginBottom: 5 }}>Tomador</span>
          <strong style={{ display: 'block', fontSize: 15, fontWeight: 650 }}>Aurora Tecnologia</strong>
          <span style={{ color: '#666666', display: 'block', fontSize: 12, marginTop: 4 }}>Venda #01942</span>
        </div>
      </div>

      <div style={{ background: '#f7f7f7', borderRadius: 9, padding: '15px 17px' }}>
        <span style={{ color: '#888888', display: 'block', fontSize: 12, marginBottom: 6 }}>Descrição do serviço</span>
        <strong style={{ display: 'block', fontSize: 15, fontWeight: 620 }}>Consultoria em tecnologia e automação financeira</strong>
      </div>

      <div style={{ display: 'grid', gap: 10, paddingTop: 18 }}>
        <div style={{ alignItems: 'center', color: '#666666', display: 'flex', fontSize: 13, justifyContent: 'space-between' }}><span>Valor do serviço</span><span>R$ 12.400,00</span></div>
        <div style={{ alignItems: 'center', color: '#666666', display: 'flex', fontSize: 13, justifyContent: 'space-between' }}><span>ISS retido</span><span>R$ 248,00</span></div>
        <div style={{ alignItems: 'center', borderTop: '1px solid #e5e5e5', display: 'flex', fontSize: 18, fontWeight: 750, justifyContent: 'space-between', marginTop: 3, paddingTop: 13 }}><span>Valor líquido</span><span>R$ 12.152,00</span></div>
      </div>

      <div style={{ alignItems: 'center', color: '#777777', display: 'flex', fontSize: 11, gap: 8, marginTop: 20 }}>
        <ReceiptText size={16} /> Emitida em 11 ago 2026, às 10:42
      </div>
    </div>
  )
}

function SyncScene({
  assistantText,
  duration,
  invoicePreview = false,
  kind = 'list',
  rows,
  speed = 1.8,
  subtitle,
  title,
}: {
  assistantText: string
  duration: number
  invoicePreview?: boolean
  kind?: 'list' | 'reconciliation'
  rows: OttoAiEmployeesResultRow[]
  speed?: number
  subtitle: string
  title: string
}) {
  const frame = useCurrentFrame()
  const { height, width } = useVideoConfig()
  const cardFrame = Math.max(0, frame - 12) * speed
  const cardScale = rows.length > 6 ? 0.84 : 0.92
  const cardWidth = 940 / cardScale
  const textIn = p(frame, 0, 14)
  const typedCharacters = Math.floor(p(frame, 2, 22, [0, assistantText.length]))
  const showTextCursor = frame < 26 && Math.floor(frame / 4) % 2 === 0
  const cursorMove = p(frame, 40, 52)
  const cursorOpacity = invoicePreview ? p(frame, 36, 42) * p(frame, 55, 61, [1, 0]) : 0
  const cardBlur = invoicePreview ? p(frame, 54, 62, [0, 5]) : 0
  const cardOpacity = invoicePreview ? p(frame, 54, 62, [1, 0.66]) : 1
  const squareOffset = height >= width ? 170 : 0
  return (
    <Scene duration={duration}>
      <div style={{ left: '50%', position: 'absolute', top: 30 + squareOffset, transform: 'translateX(-50%)', width: 940 }}>
        <div style={{ color: '#242424', fontSize: 18, fontWeight: 440, lineHeight: 1.4, opacity: textIn, transform: `translateY(${(1 - textIn) * 8}px)` }}>
          {assistantText.slice(0, typedCharacters)}
          {showTextCursor ? <span style={{ borderRight: '1.5px solid #242424', marginLeft: 2 }}>&nbsp;</span> : null}
        </div>
        <div style={{ filter: `blur(${cardBlur}px)`, left: '50%', marginTop: 12, opacity: cardOpacity, position: 'relative', transform: `translateX(-50%) scale(${cardScale})`, transformOrigin: 'top center', width: cardWidth }}>
          <OttoAiEmployeesSyncCard frame={cardFrame} kind={kind} rows={rows} subtitle={subtitle} title={title} />
        </div>
        {invoicePreview ? (
          <div
            style={{
              filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.18))',
              left: interpolate(cursorMove, [0, 1], [880, 795]),
              opacity: cursorOpacity,
              position: 'absolute',
              top: interpolate(cursorMove, [0, 1], [230, 128]),
              transform: `scale(${frame >= 52 && frame < 55 ? 0.82 : 1})`,
              zIndex: 12,
            }}
          >
            <MousePointer2 fill="#ffffff" size={29} strokeWidth={2.2} />
          </div>
        ) : null}
      </div>
      {invoicePreview ? <InvoiceDocumentPreview frame={frame} /> : null}
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
      <div style={{ left: '50%', opacity: enter, position: 'absolute', top: '50%', transform: `translate(-50%, -50%) translateY(${(1 - enter) * 10}px) scale(${1 + enter * 0.15})`, width: 760 }}>
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
          speed={duration <= 70 ? 1.4 : 0.58}
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
  const logoIn = p(frame, 4, 22)
  const textIn = p(frame, 22, 40)
  return (
    <Scene duration={duration}>
      <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', inset: 0, justifyContent: 'center', position: 'absolute' }}>
        <Img src={staticFile('logoOtto.svg')} style={{ height: 250, opacity: logoIn, width: 590 }} />
        <div style={{ background: '#e5e7eb', height: 2, margin: '8px 0 26px', opacity: textIn, width: 120 }} />
        <strong style={{ fontSize: 36, fontWeight: 600, opacity: textIn }}>Administre sua empresa conversando com a IA.</strong>
        <div style={{ alignItems: 'center', color: MUTED, display: 'flex', fontSize: 18, gap: 28, marginTop: 28, opacity: p(frame, 38, 56) }}>
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
      <Sequence from={90} durationInFrames={87}><ExactPromptInputScene duration={87} label="Por onde começamos?" prompt="Emita as notas fiscais das minhas vendas recentes." /></Sequence>
      <Sequence from={177} durationInFrames={90}><SyncScene assistantText="Vou buscar as oito vendas mais recentes e validar clientes, serviços e valores antes da emissão." duration={90} rows={recentSalesRows} speed={2.3} subtitle="Vendas confirmadas, clientes e valores prontos para faturar" title="Últimas 8 vendas" /></Sequence>
      <Sequence from={267} durationInFrames={120}><SyncScene assistantText="As vendas estão validadas. Agora vou emitir as oito notas, enviá-las e atualizar o financeiro." duration={120} invoicePreview rows={invoiceEmissionRows} speed={2.3} subtitle="Notas autorizadas, enviadas e vinculadas ao financeiro" title="Emissão de 8 notas fiscais" /></Sequence>
      <Sequence from={387} durationInFrames={62}><ExactPromptInputScene duration={62} label="Por onde começamos?" prompt="Concilie as movimentações bancárias e depois classifique as despesas." /></Sequence>
      <Sequence from={449} durationInFrames={85}><SyncScene assistantText="Vou cruzar cada movimentação bancária com os lançamentos do Otto e confirmar as correspondências." duration={85} kind="reconciliation" rows={reconciliationRows} speed={2.3} subtitle="Bancos, cartões e lançamentos do Otto" title="Conciliação bancária" /></Sequence>
      <Sequence from={534} durationInFrames={70}><SyncScene assistantText="Agora vou classificar cada despesa por categoria e atualizar os lançamentos correspondentes." duration={70} rows={expenseRows} speed={2.3} subtitle="Fornecedores, categorias, valores e status" title="Classificação de despesas" /></Sequence>
      <Sequence from={604} durationInFrames={62}><ExactPromptInputScene duration={62} label="Por onde começamos?" prompt="Mostre a projeção do fluxo de caixa dos próximos 6 meses." /></Sequence>
      <Sequence from={666} durationInFrames={105}><CashFlowChart duration={105} /></Sequence>
      <Sequence from={771} durationInFrames={90}><SyncScene assistantText="Vou identificar os recebimentos vencidos, enviar as cobranças e programar os próximos acompanhamentos." duration={90} rows={collectionRows} subtitle="Clientes em atraso e acompanhamentos automáticos" title="Cobranças e recebimentos" /></Sequence>
      <Sequence from={861} durationInFrames={87}><ExactPromptInputScene duration={87} label="Por onde começamos?" prompt="Quais clientes concentram os valores em atraso?" /></Sequence>
      <Sequence from={948} durationInFrames={105}><OverdueChart duration={105} /></Sequence>
      <Sequence from={1053} durationInFrames={90}><SyncScene assistantText="Vou revisar as obrigações fiscais, comparar os cenários tributários e verificar oportunidades permitidas pela legislação." duration={90} rows={fiscalRows} subtitle="Obrigações, regime, créditos e oportunidades legais" title="Análise fiscal e tributária" /></Sequence>
      <Sequence from={1143} durationInFrames={87}><ExactPromptInputScene duration={87} label="Por onde começamos?" prompt="Crie um dashboard com vendas, caixa, cobranças e situação fiscal." /></Sequence>
      <Sequence from={1230} durationInFrames={135}><OttoFinancialDashboard /></Sequence>
      <Sequence from={1365} durationInFrames={60}><CompatibilityScene duration={60} /></Sequence>
      <Sequence from={1425} durationInFrames={75}><OutroScene duration={75} /></Sequence>
    </AbsoluteFill>
  )
}

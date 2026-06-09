import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import type { CSSProperties, ReactNode } from 'react'
import { IOS_REMOTION_DISPLAY_FONT_STACK, IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/remotion/fonts/sfPro'
import {
  ChevronRight,
  Copy,
  Menu,
  Mic,
  MoreHorizontal,
  Play,
  Plus,
  RotateCcw,
  SquarePen,
  ThumbsDown,
  ThumbsUp,
  Upload,
  Volume2,
} from 'lucide-react'

import type {
  AnalysisStructuredContent,
  ChartResultStructuredContent,
  ConnectorsStructuredContent,
  DashboardListStructuredContent,
  DataCatalogStructuredContent,
  DataResultStructuredContent,
  TableStructuredContent,
} from '@/products/plugin/web/src/types/toolResult'
import { AnimatedMcpAnalysisView } from '@/remotion/components/AnimatedMcpAnalysisView'
import { AnimatedMcpCashFlowView } from '@/remotion/components/AnimatedMcpCashFlowView'
import { AnimatedMcpChartView } from '@/remotion/components/AnimatedMcpChartView'
import { AnimatedMcpConnectorsView } from '@/remotion/components/AnimatedMcpConnectorsView'
import { AnimatedMcpDashboardListView } from '@/remotion/components/AnimatedMcpDashboardListView'
import { AnimatedMcpDataCatalogView } from '@/remotion/components/AnimatedMcpDataCatalogView'
import { AnimatedMcpDreView } from '@/remotion/components/AnimatedMcpDreView'
import { AnimatedMcpLineChartView } from '@/remotion/components/AnimatedMcpLineChartView'
import { AnimatedMcpPieChartView } from '@/remotion/components/AnimatedMcpPieChartView'
import { AnimatedMcpTableView } from '@/remotion/components/AnimatedMcpTableView'

loadSfProFonts()

const chartData = {
  ok: true,
  tool: 'chart',
  view: 'chart',
  title: 'Receita por canal',
  subtitle: 'Resposta rica renderizada como tool MCP',
  chart: {
    type: 'bar',
    labelField: 'canal',
    valueField: 'receita',
    format: 'currency',
  },
  rows: [
    { canal: 'Shopify', receita: 168000 },
    { canal: 'Mercado Livre', receita: 142500 },
    { canal: 'Shopee', receita: 96700 },
    { canal: 'Amazon', receita: 75700 },
  ],
} satisfies ChartResultStructuredContent

const pieData = {
  ok: true,
  tool: 'chart',
  view: 'chart',
  title: 'Participação por canal',
  subtitle: 'Distribuição da receita conectada',
  chart: {
    type: 'pie',
    labelField: 'canal',
    valueField: 'receita',
    format: 'currency',
  },
  rows: chartData.rows,
} satisfies ChartResultStructuredContent

const lineData = {
  ok: true,
  tool: 'chart',
  view: 'chart',
  title: 'Evolução da receita',
  subtitle: 'Últimos 7 dias conectados',
  chart: {
    type: 'line',
    labelField: 'dia',
    valueField: 'receita',
    format: 'currency',
  },
  rows: [
    { dia: 'D1', receita: 42000 },
    { dia: 'D2', receita: 51500 },
    { dia: 'D3', receita: 48200 },
    { dia: 'D4', receita: 69000 },
    { dia: 'D5', receita: 74400 },
    { dia: 'D6', receita: 91600 },
    { dia: 'D7', receita: 103500 },
  ],
} satisfies ChartResultStructuredContent

const tableData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Contas a pagar',
  count: 5,
  columns: ['fornecedor', 'numero_documento', 'data_vencimento', 'status', 'valor_liquido'],
  rows: [
    { fornecedor: 'Conta Azul', numero_documento: 'BOL-1042', data_vencimento: '2026-05-28', status: 'Aberto', valor_liquido: 18400 },
    { fornecedor: 'Omie ERP', numero_documento: 'BOL-1043', data_vencimento: '2026-05-29', status: 'Pago', valor_liquido: 27500 },
    { fornecedor: 'Bling', numero_documento: 'BOL-1044', data_vencimento: '2026-05-31', status: 'Aberto', valor_liquido: 16320 },
    { fornecedor: 'Supabase', numero_documento: 'BOL-1045', data_vencimento: '2026-06-02', status: 'Vencido', valor_liquido: 9800 },
    { fornecedor: 'Google Cloud', numero_documento: 'BOL-1046', data_vencimento: '2026-06-05', status: 'Aberto', valor_liquido: 36740 },
  ],
} satisfies DataResultStructuredContent

const connectorsData = {
  ok: true,
  tool: 'connectors',
  view: 'connectors',
  title: 'Conectores sincronizados',
  subtitle: 'Fontes disponíveis para consulta',
  rows: [
    { connector_id: 'erp-conta-azul', domain: 'erp', plataforma: 'conta_azul', name: 'Conta Azul', health: 'connected', last_sync_at: '2026-05-28T17:10:00.000Z', accounts_count: 1 },
    { connector_id: 'erp-omie', domain: 'erp', plataforma: 'omie', name: 'Omie ERP', health: 'connected', last_sync_at: '2026-05-28T16:40:00.000Z', accounts_count: 2 },
    { connector_id: 'erp-bling', domain: 'erp', plataforma: 'bling', name: 'Bling', health: 'connected', last_sync_at: '2026-05-28T15:55:00.000Z', accounts_count: 1 },
    { connector_id: 'infra-gcp', domain: 'infra', plataforma: 'google_ads', name: 'Google Cloud', health: 'connected', last_sync_at: '2026-05-28T15:20:00.000Z', accounts_count: 1 },
  ],
} satisfies ConnectorsStructuredContent

const dreData = {
  ok: true,
  tool: 'financial_statement',
  view: 'table',
  kind: 'dre',
  variant: 'financial_statement',
  title: 'DRE',
  subtitle: 'DRE consolidada no período 2026-01-01 a 2026-06-30',
  columns: [
    { key: 'descricao', label: 'DRE' },
    { key: 'jan_2026', label: 'Jan/26', format: 'currency_plain' },
    { key: 'fev_2026', label: 'Fev/26', format: 'currency_plain' },
    { key: 'mar_2026', label: 'Mar/26', format: 'currency_plain' },
    { key: 'abr_2026', label: 'Abr/26', format: 'currency_plain' },
  ],
  rows: [
    { descricao: '(+) RECEITA BRUTA', jan_2026: 812300, fev_2026: 844200, mar_2026: 904100, abr_2026: 681200, _rowType: 'group', _groupId: 'receita_bruta' },
    { descricao: '(-) DESCONTOS', jan_2026: -22100, fev_2026: -19800, mar_2026: -24700, abr_2026: -18300, _rowType: 'child', _parentGroupId: 'receita_bruta' },
    { descricao: '(=) RECEITA LÍQUIDA', jan_2026: 790200, fev_2026: 824400, mar_2026: 879400, abr_2026: 662900, _rowType: 'subtotal' },
    { descricao: '(-) CUSTOS', jan_2026: -318000, fev_2026: -334800, mar_2026: -351200, abr_2026: -267600, _rowType: 'child' },
    { descricao: '(=) RESULTADO OPERACIONAL', jan_2026: 472200, fev_2026: 489600, mar_2026: 528200, abr_2026: 395300, _rowType: 'subtotal' },
    { descricao: '(-) DESPESAS ADMINISTRATIVAS', jan_2026: -124200, fev_2026: -128700, mar_2026: -132500, abr_2026: -119900, _rowType: 'child' },
    { descricao: '(-) DESPESAS COMERCIAIS', jan_2026: -68200, fev_2026: -71300, mar_2026: -74600, abr_2026: -62100, _rowType: 'child' },
    { descricao: '(=) EBITDA', jan_2026: 279800, fev_2026: 289600, mar_2026: 321100, abr_2026: 213300, _rowType: 'group' },
  ],
  count: 8,
} satisfies TableStructuredContent

const cashFlowData = {
  ok: true,
  tool: 'financial_statement',
  view: 'table',
  kind: 'cash_flow',
  variant: 'financial_statement',
  title: 'Fluxo de Caixa',
  subtitle: 'Fluxo de caixa previsto por vencimento',
  columns: [
    { key: 'periodo', label: 'Período' },
    { key: 'entradas_previstas', label: 'Entradas Previstas', format: 'currency_plain' },
    { key: 'saidas_previstas', label: 'Saídas Previstas', format: 'currency_plain' },
    { key: 'fluxo_liquido', label: 'Fluxo Líquido', format: 'currency_plain' },
    { key: 'saldo_acumulado', label: 'Saldo Acumulado', format: 'currency_plain' },
  ],
  rows: [
    { periodo: '2026-01', entradas_previstas: 420000, saidas_previstas: 318000, fluxo_liquido: 102000, saldo_acumulado: 102000 },
    { periodo: '2026-02', entradas_previstas: 456500, saidas_previstas: 334800, fluxo_liquido: 121700, saldo_acumulado: 223700 },
    { periodo: '2026-03', entradas_previstas: 482200, saidas_previstas: 351200, fluxo_liquido: 131000, saldo_acumulado: 354700 },
    { periodo: '2026-04', entradas_previstas: 396400, saidas_previstas: 267600, fluxo_liquido: 128800, saldo_acumulado: 483500 },
    { periodo: '2026-05', entradas_previstas: 512700, saidas_previstas: 386100, fluxo_liquido: 126600, saldo_acumulado: 610100 },
  ],
  count: 5,
} satisfies TableStructuredContent

const dataCatalogData = {
  ok: true,
  success: true,
  tool: 'data_catalog',
  view: 'data_catalog',
  action: 'pronto_para_dashboard',
  domain: 'erp',
  resource: 'contas-a-pagar',
  title: 'Catálogo de Dados',
  subtitle: 'ERP · Contas a Pagar · pronto para dashboard',
  sources: [
    { domain: 'erp', label: 'ERP', status: 'connected', total_records: 28410 },
    { domain: 'crm', label: 'CRM', status: 'connected', total_records: 9120 },
    { domain: 'marketing', label: 'Marketing', status: 'connected', total_records: 28912 },
    { domain: 'ecommerce', label: 'Ecommerce', status: 'empty', total_records: 0 },
  ],
  resources: [
    { resource: 'contas-a-pagar', label: 'Contas a Pagar', status: 'ok', total_records: 420, value_sum: 1842090.4 },
    { resource: 'contas-a-receber', label: 'Contas a Receber', status: 'ok', total_records: 388, value_sum: 2366000.1 },
    { resource: 'compras/pedidos', label: 'Pedidos de Compra', status: 'ok', total_records: 96, value_sum: 920120.2 },
  ],
  quality: { score: 91, resource: 'contas-a-pagar', missing_fields: 2, orphan_relationships: 3 },
  recommendations: ['Revisar contas sem compra vinculada.', 'Usar janela mínima de 5 meses para tendência.'],
} satisfies DataCatalogStructuredContent

const analysisData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'insights',
  title: 'Análise financeira',
  subtitle: 'Maio 2026 · Contas a pagar e receber',
  summary: 'A empresa tem boa previsibilidade de receita, mas concentra risco em fretes atrasados e campanhas com ROAS abaixo da meta.',
  metrics: [
    { label: 'Valor em aberto', value: 382400, format: 'currency' },
    { label: 'Atrasados', value: 9, format: 'number' },
    { label: 'Margem projetada', value: 0.287, format: 'percent' },
  ],
  sections: [
    { severity: 'high', kind: 'risco', title: 'Frete atrasado recorrente', evidence: 'Frete Sul aparece em 4 vencimentos atrasados nos últimos 30 dias.', recommendation: 'Renegociar SLA e criar alerta.' },
    { severity: 'medium', kind: 'oportunidade', title: 'Search Brand acima da média', evidence: 'ROAS de 8,59 contra média de 4,39.', recommendation: 'Aumentar orçamento com teto diário.' },
    { severity: 'low', kind: 'qualidade', title: 'Dados prontos para dashboard', evidence: 'Centros de custo e categorias estão preenchidos.', recommendation: 'Usar este recorte no relatório semanal.' },
  ],
  next_steps: ['Criar alerta para contas vencendo em até 5 dias.', 'Gerar relatório executivo com riscos por fornecedor.'],
} satisfies AnalysisStructuredContent

const dashboardListData = {
  ok: true,
  tool: 'dashboards',
  view: 'dashboard_list',
  title: 'Dashboards',
  dashboards: [
    { id: 'dash-financeiro', title: 'Financeiro Executivo', slug: 'financeiro-executivo', status: 'published', current_draft_version: 4, current_published_version: 3, updated_at: '2026-05-28T09:10:00.000Z' },
    { id: 'dash-marketing', title: 'Marketing H1', slug: 'marketing-h1', status: 'draft', current_draft_version: 2, current_published_version: null, updated_at: '2026-05-27T18:30:00.000Z' },
    { id: 'dash-operacoes', title: 'Operações e Estoque', slug: 'operacoes-estoque', status: 'published', current_draft_version: 7, current_published_version: 7, updated_at: '2026-05-26T15:20:00.000Z' },
  ],
} satisfies DashboardListStructuredContent

function fadeSlide(frame: number, start: number, fromX = 0, fromY = 24) {
  const opacity = interpolate(frame, [start, start + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const x = interpolate(frame, [start, start + 28], [fromX, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const y = interpolate(frame, [start, start + 28], [fromY, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    opacity,
    transform: `translate(${x}px, ${y}px)`,
  }
}

function StatusBar() {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        height: 78,
        justifyContent: 'space-between',
        padding: '24px 77px 0',
      }}
    >
      <div style={{ color: '#000000', fontSize: 40, fontWeight: 700, letterSpacing: 0 }}>18:07</div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 17 }}>
        <div style={{ alignItems: 'flex-end', display: 'flex', gap: 4, height: 23 }}>
          {[11, 15, 20, 26].map((height, index) => (
            <span
              key={height}
              style={{
                background: index === 3 ? '#c7c7c7' : '#000000',
                borderRadius: 3,
                display: 'block',
                height,
                width: 7,
              }}
            />
          ))}
        </div>
        <div style={{ height: 29, position: 'relative', width: 40 }}>
          <div
            style={{
              border: '5px solid #000000',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              borderRadius: '50%',
              height: 34,
              left: 0,
              position: 'absolute',
              top: 2,
              transform: 'rotate(-45deg)',
              width: 40,
            }}
          />
          <div
            style={{
              background: '#000000',
              borderRadius: 999,
              bottom: 0,
              height: 7,
              left: 16,
              position: 'absolute',
              width: 7,
            }}
          />
        </div>
        <div
          style={{
            alignItems: 'center',
            background: '#ededed',
            borderRadius: 8,
            color: '#000000',
            display: 'flex',
            fontSize: 25,
            fontWeight: 800,
            height: 33,
            justifyContent: 'center',
            lineHeight: 1,
            position: 'relative',
            width: 61,
          }}
        >
          <span
            style={{
              background: '#f5c400',
              borderBottomLeftRadius: 8,
              borderTopLeftRadius: 8,
              height: '100%',
              left: 0,
              position: 'absolute',
              top: 0,
              width: 24,
            }}
          />
          <span style={{ position: 'relative' }}>24</span>
        </div>
      </div>
    </div>
  )
}

function TopBar() {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'grid',
        gridTemplateColumns: '120px 1fr 138px',
        height: 118,
        padding: '0 41px',
      }}
    >
      <Menu color="#000000" size={50} strokeWidth={2.6} />
      <div style={{ alignItems: 'center', display: 'flex', gap: 6 }}>
        <span style={{ color: '#111111', fontSize: 45, fontWeight: 500, letterSpacing: 0 }}>ChatGPT</span>
        <ChevronRight color="#9b9b9b" size={33} strokeWidth={2.5} />
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 43, justifyContent: 'flex-end' }}>
        <SquarePen color="#000000" size={47} strokeWidth={2.7} />
        <MoreHorizontal color="#000000" size={49} strokeWidth={3} />
      </div>
    </div>
  )
}

function AssistantActions() {
  const iconStyle = { color: '#666666', size: 37, strokeWidth: 2.4 }

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 28, paddingTop: 52 }}>
      <Copy {...iconStyle} />
      <Volume2 {...iconStyle} />
      <ThumbsUp {...iconStyle} />
      <ThumbsDown {...iconStyle} />
      <Upload {...iconStyle} />
      <MoreHorizontal color="#666666" size={39} strokeWidth={2.9} />
    </div>
  )
}

function VoiceButton() {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#000000',
        borderRadius: 999,
        display: 'flex',
        height: 82,
        justifyContent: 'center',
        width: 82,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 7, height: 42 }}>
        {[14, 31, 44, 30, 15].map((height, index) => (
          <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 7 }} />
        ))}
      </div>
    </div>
  )
}

function BottomComposer() {
  return (
    <div
      style={{
        background: '#ffffff',
        bottom: 0,
        height: 178,
        left: 0,
        padding: '0 30px',
        position: 'absolute',
        right: 0,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 20 }}>
        <div
          style={{
            alignItems: 'center',
            background: '#f1f1f1',
            borderRadius: 999,
            display: 'flex',
            flex: '0 0 112px',
            height: 112,
            justifyContent: 'center',
          }}
        >
          <Plus color="#646464" size={52} strokeWidth={2.2} />
        </div>
        <div
          style={{
            alignItems: 'center',
            background: '#f1f1f1',
            borderRadius: 999,
            display: 'flex',
            flex: 1,
            height: 112,
            minWidth: 0,
            padding: '0 13px 0 42px',
          }}
        >
          <span style={{ color: '#8a8a8a', flex: 1, fontSize: 43, fontWeight: 400, letterSpacing: 0 }}>
            Pergunte ao ChatGPT
          </span>
          <Mic color="#8a8a8a" size={48} strokeWidth={2.6} />
          <div style={{ marginLeft: 28 }}>
            <VoiceButton />
          </div>
        </div>
      </div>
      <div
        style={{
          background: '#000000',
          borderRadius: 999,
          bottom: 12,
          height: 12,
          left: '50%',
          position: 'absolute',
          transform: 'translateX(-50%)',
          width: 380,
        }}
      />
    </div>
  )
}

function UserBubble({ children, style }: { children: string; style: CSSProperties }) {
  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 36 }}>
      <div
        style={{
          background: '#f1f1f1',
          borderRadius: 56,
          color: '#171717',
          fontFamily: IOS_REMOTION_FONT_STACK,
          fontSize: 38,
          fontWeight: 400,
          letterSpacing: '-0.76px',
          lineHeight: 1.2,
          maxWidth: 615,
          padding: '30px 42px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function AssistantText({ style }: { style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontFamily: IOS_REMOTION_FONT_STACK,
        fontSize: 38,
        fontWeight: 400,
        letterSpacing: '-0.76px',
        lineHeight: 1.34,
        padding: '0 42px',
      }}
    >
      <p style={{ margin: '0 0 62px' }}>Você quer ver as contas a pagar de onde?</p>
      <p style={{ margin: '0 0 34px' }}>Por exemplo:</p>
      <div style={{ display: 'grid', gap: 14 }}>
        <span style={{ display: 'block', paddingLeft: 73, textIndent: -52 }}>•&nbsp;&nbsp;do seu ERP (Conta Azul, Omiê, Bling etc.)</span>
        <span style={{ display: 'block', paddingLeft: 73, textIndent: -52 }}>•&nbsp;&nbsp;de uma planilha</span>
        <span style={{ display: 'block', paddingLeft: 73, textIndent: -52 }}>•&nbsp;&nbsp;de um banco de dados/Supabase</span>
        <span style={{ display: 'block', paddingLeft: 73, textIndent: -52 }}>
          •&nbsp;&nbsp;ou você quer saber conceitualmente o que entra em “contas a pagar” no financeiro?
        </span>
      </div>
      <AssistantActions />
    </div>
  )
}

function AssistantBubble({ children, style }: { children: string; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontSize: 40,
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: 1.38,
        padding: '0 42px',
      }}
    >
      {children}
    </div>
  )
}

function RichCard({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        background: '#ffffff',
        border: '1px solid #e5e5e5',
        borderRadius: 28,
        margin: '0 42px',
        overflow: 'hidden',
        padding: 0,
      }}
    >
      {children}
    </div>
  )
}

export type McpTemplate = 'chatgpt' | 'claude'

function ChatGptMobileTemplate() {
  const frame = useCurrentFrame()
  const firstUserStyle = fadeSlide(frame, 16, 40, 0)
  const firstAssistantStyle = fadeSlide(frame, 50, 0, 20)
  const secondUserStyle = fadeSlide(frame, 176, 40, 0)
  const connectorsTextStyle = fadeSlide(frame, 212, 0, 20)
  const connectorsStyle = fadeSlide(frame, 246, 0, 24)
  const tableTextStyle = fadeSlide(frame, 354, 0, 20)
  const tableStyle = fadeSlide(frame, 388, 0, 24)
  const dreTextStyle = fadeSlide(frame, 496, 0, 20)
  const dreStyle = fadeSlide(frame, 530, 0, 24)
  const cashFlowTextStyle = fadeSlide(frame, 666, 0, 20)
  const cashFlowStyle = fadeSlide(frame, 700, 0, 24)
  const chartTextStyle = fadeSlide(frame, 836, 0, 20)
  const chartStyle = fadeSlide(frame, 870, 0, 24)
  const pieStyle = fadeSlide(frame, 976, 0, 24)
  const lineStyle = fadeSlide(frame, 1082, 0, 24)
  const dataCatalogTextStyle = fadeSlide(frame, 1190, 0, 20)
  const dataCatalogStyle = fadeSlide(frame, 1224, 0, 24)
  const analysisTextStyle = fadeSlide(frame, 1336, 0, 20)
  const analysisStyle = fadeSlide(frame, 1370, 0, 24)
  const dashboardListTextStyle = fadeSlide(frame, 1482, 0, 20)
  const dashboardListStyle = fadeSlide(frame, 1516, 0, 24)
  const conversationY = interpolate(frame, [0, 170, 285, 420, 540, 700, 880, 1080, 1300, 1520, 1760, 2020, 2300, 2580, 2840, 3140, 3500, 3920], [0, 0, -430, -980, -1520, -2300, -3060, -3820, -4620, -5480, -6360, -7240, -8120, -9000, -9700, -10850, -12150, -13500], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        background: '#ffffff',
        color: '#111111',
        fontFamily: IOS_REMOTION_FONT_STACK,
      }}
    >
      <StatusBar />
      <TopBar />

      <div
        style={{
          bottom: 178,
          left: 0,
          overflow: 'hidden',
          position: 'absolute',
          right: 0,
          top: 196,
        }}
      >
        <div style={{ display: 'grid', gap: 57, padding: '28px 0 520px', transform: `translateY(${conversationY}px)` }}>
          <UserBubble style={firstUserStyle}>Me diga as contas a pagar</UserBubble>
          <AssistantText style={firstAssistantStyle} />

          <UserBubble style={secondUserStyle}>Do meu ERP</UserBubble>
          <AssistantBubble style={connectorsTextStyle}>
            Primeiro, estes conectores estão sincronizados.
          </AssistantBubble>
          <RichCard style={connectorsStyle}>
            <AnimatedMcpConnectorsView data={connectorsData} startFrame={246} />
          </RichCard>

          <AssistantBubble style={tableTextStyle}>
            Encontrei estas contas a pagar conectadas ao ERP.
          </AssistantBubble>
          <RichCard style={tableStyle}>
            <AnimatedMcpTableView data={tableData} startFrame={388} />
          </RichCard>

          <AssistantBubble style={dreTextStyle}>
            Também posso abrir o demonstrativo de resultado no mesmo padrão.
          </AssistantBubble>
          <RichCard style={dreStyle}>
            <AnimatedMcpDreView data={dreData} startFrame={530} />
          </RichCard>

          <AssistantBubble style={cashFlowTextStyle}>
            E cruzar com o fluxo de caixa previsto por vencimento.
          </AssistantBubble>
          <RichCard style={cashFlowStyle}>
            <AnimatedMcpCashFlowView data={cashFlowData} startFrame={700} />
          </RichCard>

          <AssistantBubble style={chartTextStyle}>
            Também posso transformar a mesma consulta em visualizações.
          </AssistantBubble>
          <RichCard style={chartStyle}>
            <AnimatedMcpChartView data={chartData} startFrame={870} />
          </RichCard>
          <RichCard style={pieStyle}>
            <AnimatedMcpPieChartView data={pieData} startFrame={976} />
          </RichCard>
          <RichCard style={lineStyle}>
            <AnimatedMcpLineChartView data={lineData} startFrame={1082} />
          </RichCard>

          <AssistantBubble style={dataCatalogTextStyle}>
            Antes de criar o dashboard, valido o catálogo de dados conectado.
          </AssistantBubble>
          <RichCard style={dataCatalogStyle}>
            <AnimatedMcpDataCatalogView data={dataCatalogData} startFrame={1224} />
          </RichCard>

          <AssistantBubble style={analysisTextStyle}>
            Depois faço a análise com métricas, riscos e próximos passos.
          </AssistantBubble>
          <RichCard style={analysisStyle}>
            <AnimatedMcpAnalysisView data={analysisData} startFrame={1370} />
          </RichCard>

          <AssistantBubble style={dashboardListTextStyle}>
            E deixo os dashboards prontos para abrir ou continuar editando.
          </AssistantBubble>
          <RichCard style={dashboardListStyle}>
            <AnimatedMcpDashboardListView data={dashboardListData} startFrame={1516} />
          </RichCard>
        </div>
      </div>

      <BottomComposer />
    </AbsoluteFill>
  )
}

const CLAUDE_BG = '#fbfaf7'
const CLAUDE_SURFACE = '#fffefa'
const CLAUDE_BUBBLE = '#f3f2ee'
const CLAUDE_CONTROL = '#f0efeb'
const CLAUDE_BORDER = '#e1ded8'
const CLAUDE_TEXT = '#171714'
const CLAUDE_MUTED = '#77746f'
const CLAUDE_ICON = '#3f3f3a'
const CLAUDE_ACTION = '#7b7a74'
const CLAUDE_ACCENT = '#e17b5c'
const CLAUDE_FONT = IOS_REMOTION_FONT_STACK

function ClaudeStatusBar() {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        height: 78,
        justifyContent: 'space-between',
        padding: '24px 77px 0',
      }}
    >
      <div style={{ color: '#000000', fontSize: 40, fontWeight: 700, letterSpacing: 0 }}>19:04</div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 17 }}>
        <div style={{ alignItems: 'flex-end', display: 'flex', gap: 4, height: 23 }}>
          {[11, 15, 20, 26].map((height, index) => (
            <span
              key={height}
              style={{
                background: index === 3 ? '#c7c7c7' : '#000000',
                borderRadius: 3,
                display: 'block',
                height,
                width: 7,
              }}
            />
          ))}
        </div>
        <div style={{ height: 29, position: 'relative', width: 40 }}>
          <div
            style={{
              border: '5px solid #000000',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              borderRadius: '50%',
              height: 34,
              left: 0,
              position: 'absolute',
              top: 2,
              transform: 'rotate(-45deg)',
              width: 40,
            }}
          />
          <div
            style={{
              background: '#000000',
              borderRadius: 999,
              bottom: 0,
              height: 7,
              left: 16,
              position: 'absolute',
              width: 7,
            }}
          />
        </div>
        <div
          style={{
            alignItems: 'center',
            border: '1px solid #cfcfcf',
            borderRadius: 8,
            color: '#000000',
            display: 'flex',
            fontSize: 25,
            fontWeight: 800,
            height: 33,
            justifyContent: 'center',
            lineHeight: 1,
            position: 'relative',
            width: 61,
          }}
        >
          5
        </div>
      </div>
    </div>
  )
}

function ClaudeTopBar() {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        height: 119,
        justifyContent: 'space-between',
        padding: '0 55px',
      }}
    >
      <Menu color={CLAUDE_ICON} size={44} strokeWidth={2.2} />
      <div style={{ alignItems: 'center', display: 'flex', gap: 66 }}>
        <div
          style={{
            alignItems: 'center',
            background: CLAUDE_ICON,
            borderRadius: 999,
            display: 'flex',
            height: 52,
            justifyContent: 'center',
            width: 52,
          }}
        >
          <Plus color="#ffffff" size={39} strokeWidth={3.1} />
        </div>
        <MoreHorizontal color={CLAUDE_ICON} size={49} strokeWidth={3} />
      </div>
    </div>
  )
}

function ClaudeUserBubble({ children, style }: { children: string; style: CSSProperties }) {
  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 34 }}>
      <div
        style={{
          background: CLAUDE_BUBBLE,
          border: `1px solid ${CLAUDE_BORDER}`,
          borderRadius: 58,
          color: CLAUDE_TEXT,
          fontFamily: CLAUDE_FONT,
          fontSize: 42,
          fontWeight: 400,
          letterSpacing: 0,
          lineHeight: 1.16,
          maxWidth: 640,
          padding: '31px 37px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ClaudeActions({ includeShare = false }: { includeShare?: boolean }) {
  const iconStyle = { color: CLAUDE_ACTION, size: 39, strokeWidth: 2.4 }

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 36, paddingTop: 46 }}>
      <Copy {...iconStyle} />
      {includeShare ? <Upload {...iconStyle} /> : null}
      <Play {...iconStyle} />
      <ThumbsUp {...iconStyle} />
      <ThumbsDown {...iconStyle} />
      <RotateCcw {...iconStyle} />
    </div>
  )
}

function ClaudeAssistantText({ children, style, includeShare = false }: { children: ReactNode; style: CSSProperties; includeShare?: boolean }) {
  return (
    <div
      style={{
        ...style,
        color: CLAUDE_TEXT,
        fontFamily: IOS_REMOTION_DISPLAY_FONT_STACK,
        fontSize: 47,
        fontWeight: 500,
        letterSpacing: -0.7,
        lineHeight: 1.52,
        padding: '0 42px',
      }}
    >
      <div>{children}</div>
      <ClaudeActions includeShare={includeShare} />
    </div>
  )
}

function ClaudeMark() {
  return (
    <div style={{ height: 78, position: 'relative', width: 78 }}>
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          style={{
            background: CLAUDE_ACCENT,
            borderRadius: 999,
            height: 9,
            left: 9,
            position: 'absolute',
            top: 34,
            transform: `rotate(${index * 30}deg) translateX(26px)`,
            transformOrigin: '30px 5px',
            width: 43,
          }}
        />
      ))}
    </div>
  )
}

function ClaudeNotice({ style }: { style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        alignItems: 'center',
        display: 'grid',
        gap: 25,
        gridTemplateColumns: '95px 1fr',
        padding: '0 42px',
      }}
    >
      <ClaudeMark />
      <div
        style={{
          color: CLAUDE_ICON,
          fontFamily: CLAUDE_FONT,
          fontSize: 35,
          fontWeight: 400,
          letterSpacing: 0,
          lineHeight: 1.35,
          textAlign: 'center',
        }}
      >
        Claude é uma IA e pode cometer erros.
        <br />
        Por favor, verifique as respostas.
      </div>
    </div>
  )
}

function ClaudeComposer() {
  return (
    <div
      style={{
        background: CLAUDE_BG,
        bottom: 0,
        height: 247,
        left: 0,
        padding: '0 40px',
        position: 'absolute',
        right: 0,
      }}
    >
      <div
        style={{
          background: CLAUDE_SURFACE,
          border: '1.5px solid #c8c6c1',
          borderRadius: 63,
          boxShadow: '0 16px 30px rgba(0, 0, 0, 0.12)',
          height: 205,
          padding: '30px 20px 18px 31px',
        }}
      >
        <div
          style={{
            color: CLAUDE_MUTED,
            fontFamily: CLAUDE_FONT,
            fontSize: 40,
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: 1,
            marginBottom: 31,
          }}
        >
          Responder a Claude
        </div>
        <div style={{ alignItems: 'center', display: 'flex', gap: 20 }}>
          <div
            style={{
              alignItems: 'center',
              background: CLAUDE_CONTROL,
              borderRadius: 999,
              display: 'flex',
              height: 82,
              justifyContent: 'center',
              width: 82,
            }}
          >
            <Plus color="#000000" size={42} strokeWidth={2.3} />
          </div>
          <div
            style={{
              alignItems: 'center',
              background: CLAUDE_CONTROL,
              borderRadius: 999,
              color: CLAUDE_TEXT,
              display: 'flex',
              fontFamily: CLAUDE_FONT,
              fontSize: 31,
              fontWeight: 400,
              height: 82,
              justifyContent: 'center',
              letterSpacing: 0,
              padding: '0 42px',
            }}
          >
            Sonnet 4.6
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              alignItems: 'center',
              background: CLAUDE_CONTROL,
              borderRadius: 999,
              display: 'flex',
              height: 82,
              justifyContent: 'center',
              width: 82,
            }}
          >
            <Mic color={CLAUDE_ICON} size={47} strokeWidth={2.6} />
          </div>
          <VoiceButton />
        </div>
      </div>
      <div
        style={{
          background: '#000000',
          borderRadius: 999,
          bottom: 12,
          height: 12,
          left: '50%',
          position: 'absolute',
          transform: 'translateX(-50%)',
          width: 380,
        }}
      />
    </div>
  )
}

function ClaudeRichCard({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        background: CLAUDE_SURFACE,
        border: `1px solid ${CLAUDE_BORDER}`,
        borderRadius: 34,
        margin: '0 42px',
        overflow: 'hidden',
        padding: 0,
      }}
    >
      {children}
    </div>
  )
}

function ClaudeMobileTemplate() {
  const frame = useCurrentFrame()
  const assistantFont = 'Georgia, "Times New Roman", serif'
  const actionIconStyle = { color: '#777772', size: 39, strokeWidth: 2.25 }
  const firstUserStyle = fadeSlide(frame, 10, 0, 18)
  const firstAssistantStyle = fadeSlide(frame, 48, 0, 22)
  const firstActionsStyle = fadeSlide(frame, 82, 0, 14)
  const secondUserStyle = fadeSlide(frame, 118, 0, 18)
  const secondAssistantStyle = fadeSlide(frame, 156, 0, 22)
  const secondActionsStyle = fadeSlide(frame, 190, 0, 14)

  return (
    <AbsoluteFill
      style={{
        background: '#fbfaf8',
        color: CLAUDE_TEXT,
        fontFamily: CLAUDE_FONT,
        overflow: 'hidden',
      }}
    >
      <div style={{ color: '#000000', fontSize: 42, fontWeight: 740, left: 77, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 43 }}>19:04</div>

      <div style={{ alignItems: 'center', display: 'flex', gap: 16, position: 'absolute', right: 52, top: 42 }}>
        <div style={{ alignItems: 'flex-end', display: 'flex', gap: 4, height: 27 }}>
          {[11, 16, 22, 28].map((height, index) => (
            <span key={height} style={{ background: index === 3 ? '#c7c7c7' : '#000000', borderRadius: 3, display: 'block', height, width: 8 }} />
          ))}
        </div>
        <div style={{ height: 32, position: 'relative', width: 43 }}>
          <div style={{ border: '5px solid #000000', borderBottomColor: 'transparent', borderLeftColor: 'transparent', borderRadius: '50%', height: 36, left: 0, position: 'absolute', top: 2, transform: 'rotate(-45deg)', width: 43 }} />
          <span style={{ background: '#000000', borderRadius: 999, bottom: 0, display: 'block', height: 7, left: 18, position: 'absolute', width: 7 }} />
        </div>
        <div style={{ alignItems: 'center', border: '1px solid #c9c9c9', borderRadius: 9, color: '#000000', display: 'flex', fontSize: 25, fontWeight: 800, height: 34, justifyContent: 'center', lineHeight: 1, overflow: 'hidden', position: 'relative', width: 62 }}>
          <span style={{ background: '#f4d141', bottom: 0, left: 0, position: 'absolute', top: 0, width: 24 }} />
          <span style={{ position: 'relative' }}>5</span>
        </div>
      </div>

      <Menu color="#3f3f3a" size={46} strokeWidth={2.2} style={{ left: 61, position: 'absolute', top: 166 }} />
      <div style={{ alignItems: 'center', background: '#3a3a37', borderRadius: 999, display: 'flex', height: 53, justifyContent: 'center', left: 837, position: 'absolute', top: 151, width: 53 }}>
        <Plus color="#ffffff" size={39} strokeWidth={3.2} />
      </div>
      <MoreHorizontal color="#3f3f3a" size={49} strokeWidth={3} style={{ left: 966, position: 'absolute', top: 153 }} />

      <div style={{ alignItems: 'center', background: '#f2f1ef', border: '1px solid #e0ded9', borderRadius: 64, color: '#171714', display: 'flex', fontSize: 44, fontWeight: 400, height: 105, justifyContent: 'center', lineHeight: 1, padding: '0 35px', position: 'absolute', right: 42, top: 222, ...firstUserStyle }}>
        Olá
      </div>

      <div style={{ color: '#171714', fontFamily: assistantFont, fontSize: 47, fontWeight: 500, left: 42, letterSpacing: -0.55, lineHeight: 1.12, position: 'absolute', top: 394, ...firstAssistantStyle }}>
        Olá, Igor! Como posso ajudar?
      </div>

      <div style={{ alignItems: 'center', display: 'flex', gap: 36, left: 50, position: 'absolute', top: 516, ...firstActionsStyle }}>
        <Copy {...actionIconStyle} />
        <Play {...actionIconStyle} />
        <ThumbsUp {...actionIconStyle} />
        <ThumbsDown {...actionIconStyle} />
        <RotateCcw {...actionIconStyle} />
      </div>

      <div style={{ alignItems: 'center', background: '#f2f1ef', border: '1px solid #dfddd9', borderRadius: 65, color: '#171714', display: 'flex', fontSize: 45, fontWeight: 400, height: 105, justifyContent: 'center', lineHeight: 1, padding: '0 34px', position: 'absolute', right: 41, top: 559, ...secondUserStyle }}>
        Tudo bem com você?
      </div>

      <div style={{ color: '#171714', fontFamily: assistantFont, fontSize: 46, fontWeight: 600, left: 42, letterSpacing: -0.55, lineHeight: 1.43, position: 'absolute', top: 729, width: 980, ...secondAssistantStyle }}>
        Tudo bem, obrigado! E com você? Alguma coisa no radar hoje — produto, tech, ou só curiosidade do dia?
      </div>

      <div style={{ alignItems: 'center', display: 'flex', gap: 36, left: 50, position: 'absolute', top: 943, ...secondActionsStyle }}>
        <Copy {...actionIconStyle} />
        <Upload {...actionIconStyle} />
        <Play {...actionIconStyle} />
        <ThumbsUp {...actionIconStyle} />
        <ThumbsDown {...actionIconStyle} />
        <RotateCcw {...actionIconStyle} />
      </div>

      <div style={{ height: 78, left: 42, position: 'absolute', top: 1038, width: 78 }}>
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} style={{ background: '#df744d', borderRadius: 999, height: 9, left: 8, position: 'absolute', top: 35, transform: `rotate(${index * 30}deg) translateX(26px)`, transformOrigin: '31px 4px', width: 43 }} />
        ))}
      </div>

      <div style={{ color: '#3f3f3a', fontSize: 35, fontWeight: 400, left: 420, letterSpacing: 0, lineHeight: 1.35, position: 'absolute', textAlign: 'center', top: 1039, width: 610 }}>
        Claude é uma IA e pode cometer erros.
        <br />
        Por favor, verifique as respostas.
      </div>

      <div style={{ background: '#fbfaf8', bottom: 0, height: 327, left: 0, position: 'absolute', right: 0 }}>
        <div style={{ background: '#fffefa', border: '1.5px solid #c8c6c1', borderRadius: 63, boxShadow: '0 18px 34px rgba(0, 0, 0, 0.13)', height: 252, left: 42, padding: '48px 20px 18px 31px', position: 'absolute', right: 42, top: 0 }}>
          <div style={{ color: '#77746f', fontSize: 40, fontWeight: 400, letterSpacing: 0, lineHeight: 1, marginBottom: 35 }}>
            Responder a Claude
          </div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 20 }}>
            <div style={{ alignItems: 'center', background: '#f0efeb', borderRadius: 999, display: 'flex', height: 82, justifyContent: 'center', width: 82 }}>
              <Plus color="#000000" size={42} strokeWidth={2.3} />
            </div>
            <div style={{ alignItems: 'center', background: '#f0efeb', borderRadius: 999, color: '#171714', display: 'flex', fontSize: 31, fontWeight: 400, height: 82, justifyContent: 'center', letterSpacing: 0, padding: '0 42px' }}>
              Sonnet 4.6
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ alignItems: 'center', background: '#f0efeb', borderRadius: 999, display: 'flex', height: 82, justifyContent: 'center', width: 82 }}>
              <Mic color="#3f3f3a" size={47} strokeWidth={2.6} />
            </div>
            <VoiceButton />
          </div>
        </div>
        <div style={{ background: '#000000', borderRadius: 999, bottom: 12, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
      </div>
    </AbsoluteFill>
  )
}

export function McpChartIntro({ template = 'chatgpt' }: { template?: McpTemplate }) {
  return template === 'claude' ? <ClaudeMobileTemplate /> : <ChatGptMobileTemplate />
}

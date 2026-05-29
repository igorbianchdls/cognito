import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { CheckCircle2, FileText, LayoutDashboard, PenLine, Presentation, ReceiptText, RefreshCcw, ShieldCheck } from 'lucide-react'

import type {
  AutomationStructuredContent,
  DataResultStructuredContent,
} from '@/products/mcp-apps/web/src/types/toolResult'
import { AnimatedMcpAutomationView } from '@/remotion/components/AnimatedMcpAutomationView'
import { AnimatedMcpDocumentView, type DocumentPreviewData } from '@/remotion/components/AnimatedMcpDocumentView'
import { AnimatedMcpSlideDeckView, type SlideDeckPreviewData } from '@/remotion/components/AnimatedMcpSlideDeckView'
import { AnimatedMcpTableView } from '@/remotion/components/AnimatedMcpTableView'

export const MCP_SINGLE_ANIMATION_DURATION = 1080
export const MCP_OPERATIONS_DEMO_DURATION = MCP_SINGLE_ANIMATION_DURATION

const FONT_STACK = 'Geist, "Segoe UI", -apple-system, BlinkMacSystemFont, "SF Pro Text", Arial, sans-serif'

const expenseClassificationData = {
  ok: true,
  tool: 'erp_acoes',
  view: 'table',
  title: 'Classificação de despesas',
  count: 5,
  columns: ['data', 'descricao', 'valor', 'categoria_sugerida', 'confianca', 'status'],
  rows: [
    { data: '2026-05-24', descricao: 'Google Ads BR', valor: 18400, categoria_sugerida: 'Marketing', confianca: '96%', status: 'Classificado' },
    { data: '2026-05-24', descricao: 'AWS Brasil', valor: 12790, categoria_sugerida: 'Infraestrutura', confianca: '94%', status: 'Classificado' },
    { data: '2026-05-25', descricao: 'Frete Sul', valor: 8420, categoria_sugerida: 'Logística', confianca: '91%', status: 'Revisar' },
    { data: '2026-05-26', descricao: 'Notion Labs', valor: 2140, categoria_sugerida: 'Software', confianca: '98%', status: 'Classificado' },
    { data: '2026-05-27', descricao: 'Hotel Evento SP', valor: 6900, categoria_sugerida: 'Viagens', confianca: '88%', status: 'Revisar' },
  ],
} satisfies DataResultStructuredContent

const bankReconciliationData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Conciliação bancária',
  count: 6,
  columns: ['data', 'banco', 'historico', 'valor', 'match', 'status'],
  rows: [
    { data: '2026-05-27', banco: 'Itaú', historico: 'PIX Cliente Norte', valor: 42100, match: 'NF-9031', status: 'Conciliado' },
    { data: '2026-05-27', banco: 'Itaú', historico: 'TED Fornecedor Prime', valor: -18400, match: 'BOL-1042', status: 'Conciliado' },
    { data: '2026-05-28', banco: 'Bradesco', historico: 'Cartão Stone', valor: 68900, match: 'Lote-552', status: 'Conciliado' },
    { data: '2026-05-28', banco: 'Bradesco', historico: 'Tarifa pacote', valor: -189, match: '-', status: 'Pendente' },
    { data: '2026-05-28', banco: 'Itaú', historico: 'Pagamento Frete Sul', valor: -8420, match: 'CTR-210', status: 'Divergência' },
    { data: '2026-05-28', banco: 'Itaú', historico: 'PIX Cliente Oeste', valor: 17300, match: 'NF-9044', status: 'Conciliado' },
  ],
} satisfies DataResultStructuredContent

const managementReportData = {
  title: 'Relatório gerencial',
  subtitle: 'Word gerado para diretoria · Maio 2026',
  metrics: [
    { label: 'Receita líquida', value: 'R$ 2,41 mi' },
    { label: 'EBITDA', value: 'R$ 681 mil' },
    { label: 'Despesas revisadas', value: '97%' },
    { label: 'Pendências', value: '8 itens' },
  ],
  sections: [
    { title: 'Contexto', body: 'Fechamento consolidado a partir do ERP, bancos e planilhas de apoio.' },
    { title: 'Principais variações', body: 'Marketing ficou 12% acima do plano e logística concentrou os maiores desvios.' },
    { title: 'Recomendações', body: 'Aprovar reclassificações, revisar contratos de frete e acompanhar caixa diário.' },
  ],
} satisfies DocumentPreviewData

const closingDeckData = {
  title: 'Apresentação de fechamento',
  subtitle: 'Slides prontos para reunião mensal',
  slides: [
    { eyebrow: 'Slide 01', title: 'Fechamento Maio 2026', value: 'Capa', bullets: ['Receita, margem e caixa', 'Resumo executivo para diretoria'] },
    { eyebrow: 'Slide 02', title: 'Indicadores principais', value: '4 KPIs', bullets: ['Receita líquida de R$ 2,41 mi', 'Margem projetada de 28,7%'] },
    { eyebrow: 'Slide 03', title: 'Riscos e próximos passos', value: '8 ações', bullets: ['Fretes atrasados em revisão', 'Plano de caixa por vencimento'] },
  ],
} satisfies SlideDeckPreviewData

const contractManagementData = {
  ok: true,
  tool: 'alerts',
  view: 'automation_list',
  kind: 'contracts',
  title: 'Gestão de contratos',
  subtitle: 'Renovações e obrigações monitoradas',
  summary: { total: 4, active: 3, paused: 1, next_run_at: '2026-05-29T12:00:00.000Z' },
  rows: [
    { id: 'ctr-210', title: 'Frete Sul · SLA logística', status: 'active', condition: 'Vence em 18 dias e tem divergência de cobrança', channels: ['Slack', 'Email'], last_run_at: '2026-05-28T08:00:00.000Z', next_run_at: '2026-05-29T12:00:00.000Z' },
    { id: 'ctr-318', title: 'ERP Omie · Renovação anual', status: 'active', condition: 'Reajuste previsto acima de 9%', channels: ['Email'], last_run_at: '2026-05-27T08:00:00.000Z', next_run_at: '2026-05-30T12:00:00.000Z' },
    { id: 'ctr-422', title: 'Cloud AWS · Crédito contratado', status: 'paused', condition: 'Aguardando validação de consumo', channels: ['Slack'], last_run_at: '2026-05-25T08:00:00.000Z', next_run_at: null },
  ],
} satisfies AutomationStructuredContent

const accountingEntryData = {
  ok: true,
  tool: 'actions',
  view: 'action_result',
  kind: 'journal_entry',
  action: 'create_entry',
  title: 'Lançamento criado',
  subtitle: 'Despesa classificada e enviada para o ERP',
  preview: {
    conta_debito: 'Despesa com Logística',
    conta_credito: 'Bancos',
    centro_custo: 'Operações',
    valor: 'R$ 8.420,00',
  },
  result: {
    status: 'Criado',
    id_lancamento: 'LAN-2026-0528-0184',
    data_competencia: '2026-05-28',
    origem: 'Conciliação bancária',
  },
  columns: ['campo', 'valor'],
  rows: [
    { campo: 'Fornecedor', valor: 'Frete Sul' },
    { campo: 'Documento', valor: 'CTR-210' },
    { campo: 'Categoria', valor: 'Logística' },
    { campo: 'Aprovação', valor: 'Pendente do financeiro' },
  ],
  count: 4,
} satisfies AutomationStructuredContent

type Metric = {
  label: string
  value: string
}

type ProductAnimationShellProps = {
  eyebrow: string
  title: string
  subtitle: string
  icon: ReactNode
  metrics: Metric[]
  children: ReactNode
  footer: string
}

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function appear(frame: number, start: number, distance = 28) {
  const p = progress(frame, start, start + 28)
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * distance}px)`,
  }
}

function CognitoBrand() {
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 15 }}>
      <span style={{ display: 'grid', gap: 5, gridTemplateColumns: 'repeat(2, 18px)' }}>
        <span style={{ background: '#225f42', borderRadius: 6, display: 'block', height: 18, width: 18 }} />
        <span style={{ background: '#8aa895', borderRadius: 6, display: 'block', height: 18, width: 18 }} />
        <span style={{ background: '#c9d8ce', borderRadius: 6, display: 'block', height: 18, width: 18 }} />
        <span style={{ background: '#225f42', borderRadius: 6, display: 'block', height: 18, width: 18 }} />
      </span>
      <div style={{ display: 'grid', gap: 2 }}>
        <strong style={{ color: '#0f1512', fontSize: 39, letterSpacing: 0, lineHeight: 1 }}>Cognito</strong>
        <span style={{ color: '#65716a', fontSize: 19, fontWeight: 700, letterSpacing: 0 }}>Operations OS</span>
      </div>
    </div>
  )
}

function MetricTile({ metric, active = false }: { metric: Metric; active?: boolean }) {
  return (
    <div
      style={{
        background: active ? '#225f42' : '#f7faf7',
        border: `1px solid ${active ? '#225f42' : '#dfe7e1'}`,
        borderRadius: 16,
        color: active ? '#ffffff' : '#17201b',
        display: 'grid',
        gap: 6,
        minHeight: 92,
        padding: '15px 17px',
      }}
    >
      <span style={{ color: active ? 'rgba(255,255,255,0.72)' : '#65716a', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
        {metric.label}
      </span>
      <strong style={{ fontSize: 30, letterSpacing: 0, lineHeight: 1 }}>{metric.value}</strong>
    </div>
  )
}

function FinalBadge({ text }: { text: string }) {
  const frame = useCurrentFrame()
  const p = progress(frame, 850, 910)

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid #dbe5dd',
        borderRadius: 999,
        bottom: 48,
        boxShadow: '0 16px 34px rgba(20, 24, 22, 0.10)',
        color: '#225f42',
        display: 'flex',
        fontSize: 25,
        fontWeight: 800,
        gap: 10,
        left: 52,
        opacity: p,
        padding: '16px 22px',
        position: 'absolute',
        transform: `translateY(${(1 - p) * 16}px)`,
      }}
    >
      <CheckCircle2 size={28} strokeWidth={2.5} />
      {text}
    </div>
  )
}

function ProductAnimationShell({ eyebrow, title, subtitle, icon, metrics, children, footer }: ProductAnimationShellProps) {
  const frame = useCurrentFrame()
  const headerStyle = appear(frame, 8)
  const heroStyle = appear(frame, 44)
  const resultStyle = appear(frame, 210, 34)

  return (
    <AbsoluteFill
      style={{
        background: '#f6f8f5',
        color: '#0f1512',
        fontFamily: FONT_STACK,
        overflow: 'hidden',
      }}
    >
      <header style={{ alignItems: 'center', display: 'flex', height: 128, justifyContent: 'space-between', padding: '36px 52px 0', ...headerStyle }}>
        <CognitoBrand />
        <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 18, color: '#314139', display: 'flex', fontSize: 22, fontWeight: 800, gap: 10, height: 58, justifyContent: 'center', padding: '0 18px' }}>
          <span style={{ background: '#22a06b', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
          Live
        </div>
      </header>

      <main style={{ display: 'grid', gap: 24, padding: '88px 52px 0' }}>
        <section style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 30, boxShadow: '0 22px 52px rgba(20, 24, 22, 0.10)', display: 'grid', gap: 22, padding: '30px 32px', ...heroStyle }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
            <span style={{ alignItems: 'center', background: '#225f42', borderRadius: 24, color: '#ffffff', display: 'flex', flex: '0 0 auto', height: 80, justifyContent: 'center', width: 80 }}>
              {icon}
            </span>
            <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
              <span style={{ color: '#65716a', fontSize: 22, fontWeight: 800, letterSpacing: 0, textTransform: 'uppercase' }}>
                {eyebrow}
              </span>
              <h1 style={{ color: '#0f1512', fontSize: 55, fontWeight: 780, letterSpacing: 0, lineHeight: 1.02, margin: 0 }}>
                {title}
              </h1>
            </div>
          </div>

          <p style={{ color: '#3d4a43', fontSize: 30, lineHeight: 1.3, margin: 0 }}>{subtitle}</p>

          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {metrics.map((metric, index) => (
              <MetricTile active={index === 0} key={metric.label} metric={metric} />
            ))}
          </div>
        </section>

        <section style={{ background: '#ffffff', border: '1px solid #dde6df', borderRadius: 24, boxShadow: '0 24px 55px rgba(20, 24, 22, 0.12)', overflow: 'hidden', ...resultStyle }}>
          {children}
        </section>
      </main>

      <div style={{ bottom: 62, color: '#65716a', fontSize: 24, fontWeight: 700, position: 'absolute', right: 52 }}>
        {footer}
      </div>
      <FinalBadge text="Entrega pronta" />
    </AbsoluteFill>
  )
}

function DashboardThumbnail({ title, metric, index }: { title: string; metric: string; index: number }) {
  const frame = useCurrentFrame()
  const p = progress(frame, 230 + index * 28, 290 + index * 28)
  const active = frame > 430 + index * 25

  return (
    <article
      style={{
        background: '#ffffff',
        border: `1px solid ${active ? '#225f42' : '#dfe7e1'}`,
        borderRadius: 18,
        boxShadow: active ? '0 22px 38px rgba(34, 95, 66, 0.18)' : '0 16px 34px rgba(20, 24, 22, 0.10)',
        display: 'grid',
        gap: 12,
        opacity: p,
        overflow: 'hidden',
        padding: 14,
        transform: `translateY(${(1 - p) * 28}px) scale(${active ? 1.02 : 1})`,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #f8faf8 0%, #edf4ef 100%)',
          border: '1px solid #dfe7e1',
          borderRadius: 14,
          display: 'grid',
          gap: 10,
          minHeight: 210,
          padding: 13,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 16, width: 92 }} />
          <span style={{ background: '#c9d8ce', borderRadius: 999, display: 'block', height: 16, width: 42 }} />
        </div>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <span style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 10, height: 46 }} />
          <span style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 10, height: 46 }} />
        </div>
        <div style={{ alignItems: 'end', display: 'flex', gap: 6, height: 78 }}>
          {[44, 62, 38, 72, 54, 84].map((height, barIndex) => (
            <span
              key={`${height}-${barIndex}`}
              style={{
                background: barIndex === index % 6 ? '#225f42' : '#9bb5a4',
                borderRadius: 5,
                display: 'block',
                flex: 1,
                height,
              }}
            />
          ))}
        </div>
        <div style={{ display: 'grid', gap: 7 }}>
          <span style={{ background: '#d7e2da', borderRadius: 999, display: 'block', height: 9, width: '86%' }} />
          <span style={{ background: '#e3ebe5', borderRadius: 999, display: 'block', height: 9, width: '64%' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        <strong style={{ color: '#0f1512', fontSize: 22, lineHeight: 1.1 }}>{title}</strong>
        <span style={{ color: '#65716a', fontSize: 18, fontWeight: 700 }}>{metric}</span>
      </div>
    </article>
  )
}

function DashboardImageGallery() {
  const dashboards = [
    { title: 'Financeiro Executivo', metric: 'Receita, margem e caixa' },
    { title: 'Caixa e Conciliação', metric: 'Extrato, ERP e pendências' },
    { title: 'Despesas por Centro', metric: 'Categorias e responsáveis' },
    { title: 'Fechamento Mensal', metric: 'DRE, fluxo e variações' },
  ]

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', padding: 24 }}>
      {dashboards.map((dashboard, index) => (
        <DashboardThumbnail key={dashboard.title} index={index} metric={dashboard.metric} title={dashboard.title} />
      ))}
    </div>
  )
}

export function ExpenseClassificationAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="Expense control"
      footer="Classificação de despesas"
      icon={<ReceiptText size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Despesas', value: '5 itens' },
        { label: 'Status', value: 'Analisado' },
        { label: 'Revisão', value: '2 itens' },
      ]}
      subtitle="Motor de classificação aplicado sobre novas despesas do ERP, com categoria sugerida, confiança e fila de revisão."
      title="Classificação de despesas"
    >
      <AnimatedMcpTableView data={expenseClassificationData} startFrame={260} />
    </ProductAnimationShell>
  )
}

export function BankReconciliationAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="Bank matching"
      footer="Conciliação bancária"
      icon={<RefreshCcw size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Matches', value: '4' },
        { label: 'Status', value: 'Conciliado' },
        { label: 'Diverg.', value: '1' },
      ]}
      subtitle="Extratos e títulos são cruzados por data, valor e histórico para separar matches, pendências e divergências."
      title="Conciliação bancária"
    >
      <AnimatedMcpTableView data={bankReconciliationData} startFrame={260} />
    </ProductAnimationShell>
  )
}

export function DashboardsAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="BI workspace"
      footer="Dashboards"
      icon={<LayoutDashboard size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Dashboards', value: '4' },
        { label: 'Status', value: 'Pronto' },
        { label: 'Publicados', value: '2' },
      ]}
      subtitle="Galeria de dashboards operacionais renderizados como imagens. Nesta versão, o mesmo mock visual simula múltiplos dashboards."
      title="Dashboards"
    >
      <DashboardImageGallery />
    </ProductAnimationShell>
  )
}

export function ManagementReportAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="Management report"
      footer="Relatório gerencial Word"
      icon={<FileText size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Formato', value: 'Word' },
        { label: 'Status', value: 'Gerado' },
        { label: 'Revisão', value: '97%' },
      ]}
      subtitle="Documento executivo estruturado com KPIs, variações do período, recomendações e próximos passos."
      title="Relatório gerencial"
    >
      <AnimatedMcpDocumentView data={managementReportData} startFrame={260} />
    </ProductAnimationShell>
  )
}

export function ClosingSlidesAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="Closing deck"
      footer="Apresentação de fechamento"
      icon={<Presentation size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Slides', value: '3' },
        { label: 'Status', value: 'Criado' },
        { label: 'Ações', value: '8' },
      ]}
      subtitle="Deck de fechamento com capa, indicadores principais e plano de ação para reunião de diretoria."
      title="Apresentação de fechamento"
    >
      <AnimatedMcpSlideDeckView data={closingDeckData} startFrame={260} />
    </ProductAnimationShell>
  )
}

export function ContractManagementAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="Contract ops"
      footer="Gestão de contrato"
      icon={<ShieldCheck size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Contratos', value: '4' },
        { label: 'Status', value: 'Ativo' },
        { label: 'Pausados', value: '1' },
      ]}
      subtitle="Painel de contratos com renovações, reajustes, obrigações e alertas de risco em uma esteira única."
      title="Gestão de contrato"
    >
      <AnimatedMcpAutomationView data={contractManagementData} startFrame={260} />
    </ProductAnimationShell>
  )
}

export function AccountingEntryAnimation() {
  return (
    <ProductAnimationShell
      eyebrow="ERP actions"
      footer="Fazer lançamento"
      icon={<PenLine size={42} strokeWidth={2.4} />}
      metrics={[
        { label: 'Lançamento', value: 'Criado' },
        { label: 'Status', value: 'Pendente' },
        { label: 'Origem', value: 'Banco' },
      ]}
      subtitle="Lançamento criado a partir da conciliação, com contas, centro de custo, origem e trilha de aprovação."
      title="Fazer lançamento"
    >
      <AnimatedMcpAutomationView data={accountingEntryData} startFrame={260} />
    </ProductAnimationShell>
  )
}

export function McpOperationsDemo() {
  return <ExpenseClassificationAnimation />
}

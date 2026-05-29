import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { CheckCircle2, FileText, LayoutDashboard, PenLine, Presentation, ReceiptText, RefreshCcw, ShieldCheck } from 'lucide-react'

import type { DataResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
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

type Metric = {
  label: string
  value: string
}

type ArtifactKind = 'dashboard' | 'report' | 'slide' | 'contract' | 'entry'

type ArtifactItem = {
  title: string
  eyebrow: string
  metric: string
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

function DashboardVisual({ index }: { index: number }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f8faf8 0%, #edf4ef 100%)',
        border: '1px solid #dfe7e1',
        borderRadius: 14,
        display: 'grid',
        gap: 10,
        minHeight: 184,
        padding: 13,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 16, width: 92 }} />
        <span style={{ background: '#c9d8ce', borderRadius: 999, display: 'block', height: 16, width: 42 }} />
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <span style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 10, height: 42 }} />
        <span style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 10, height: 42 }} />
      </div>
      <div style={{ alignItems: 'end', display: 'flex', gap: 6, height: 70 }}>
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
  )
}

function ReportVisual({ index }: { index: number }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dfe7e1',
        borderRadius: 14,
        display: 'grid',
        gap: 11,
        minHeight: 184,
        padding: 17,
      }}
    >
      <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 12, width: index === 0 ? 118 : 88 }} />
      <span style={{ background: '#0f1512', borderRadius: 999, display: 'block', height: 15, width: '72%' }} />
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[0, 1, 2].map((item) => (
          <span key={item} style={{ background: '#f0f5f1', border: '1px solid #dfe7e1', borderRadius: 8, height: 36 }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {[88, 72, 94, 64].map((width, lineIndex) => (
          <span key={`${width}-${lineIndex}`} style={{ background: '#d9e4dc', borderRadius: 999, display: 'block', height: 8, width: `${width}%` }} />
        ))}
      </div>
      <div style={{ alignItems: 'end', display: 'flex', gap: 7, height: 42 }}>
        {[18, 29, 24, 38, 31].map((height, barIndex) => (
          <span key={`${height}-${barIndex}`} style={{ background: barIndex === index ? '#225f42' : '#b9cbbf', borderRadius: 4, flex: 1, height }} />
        ))}
      </div>
    </div>
  )
}

function SlideVisual({ index }: { index: number }) {
  const dark = index % 2 === 0

  return (
    <div
      style={{
        background: dark ? '#225f42' : '#f7faf7',
        border: `1px solid ${dark ? '#225f42' : '#dfe7e1'}`,
        borderRadius: 14,
        color: dark ? '#ffffff' : '#0f1512',
        display: 'grid',
        gap: 13,
        minHeight: 184,
        padding: 17,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ background: dark ? 'rgba(255,255,255,0.75)' : '#225f42', borderRadius: 999, display: 'block', height: 12, width: 82 }} />
        <span style={{ background: dark ? 'rgba(255,255,255,0.28)' : '#c9d8ce', borderRadius: 999, display: 'block', height: 12, width: 38 }} />
      </div>
      <strong style={{ fontSize: 25, lineHeight: 1.06 }}>{index === 0 ? 'Fechamento' : index === 1 ? 'Indicadores' : index === 2 ? 'Riscos' : 'Plano'}</strong>
      <div style={{ display: 'grid', gap: 7 }}>
        {[82, 66, 74].map((width, lineIndex) => (
          <span
            key={`${width}-${lineIndex}`}
            style={{
              background: dark ? 'rgba(255,255,255,0.28)' : '#d8e3dc',
              borderRadius: 999,
              display: 'block',
              height: 8,
              width: `${width}%`,
            }}
          />
        ))}
      </div>
      <div style={{ alignItems: 'center', display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
        <span style={{ background: dark ? 'rgba(255,255,255,0.18)' : '#ffffff', border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : '#dfe7e1'}`, borderRadius: 10, height: 48 }} />
        <span style={{ background: dark ? 'rgba(255,255,255,0.18)' : '#ffffff', border: `1px solid ${dark ? 'rgba(255,255,255,0.18)' : '#dfe7e1'}`, borderRadius: 10, height: 48 }} />
      </div>
    </div>
  )
}

function ContractVisual({ index }: { index: number }) {
  return (
    <div
      style={{
        background: '#fffefa',
        border: '1px solid #dedbd4',
        borderRadius: 14,
        display: 'grid',
        gap: 11,
        minHeight: 184,
        padding: 17,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 13, width: 76 }} />
        <span style={{ border: '2px solid #c6d4ca', borderRadius: 999, display: 'block', height: 30, width: 30 }} />
      </div>
      <span style={{ background: '#141816', borderRadius: 999, display: 'block', height: 14, width: '70%' }} />
      <div style={{ display: 'grid', gap: 7 }}>
        {[86, 91, 62, 78].map((width, lineIndex) => (
          <span key={`${width}-${lineIndex}`} style={{ background: '#d9d6cf', borderRadius: 999, display: 'block', height: 8, width: `${width}%` }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <span style={{ background: index === 1 ? '#fff4d8' : '#eef4ef', border: '1px solid #dfe7e1', borderRadius: 8, height: 34 }} />
        <span style={{ background: '#eef4ef', border: '1px solid #dfe7e1', borderRadius: 8, height: 34 }} />
      </div>
    </div>
  )
}

function EntryVisual({ index }: { index: number }) {
  return (
    <div
      style={{
        background: '#f8faf8',
        border: '1px solid #dfe7e1',
        borderRadius: 14,
        display: 'grid',
        gap: 11,
        minHeight: 184,
        padding: 17,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 14, width: 92 }} />
        <span style={{ background: index === 3 ? '#225f42' : '#d8e3dc', borderRadius: 999, display: 'block', height: 28, width: 58 }} />
      </div>
      <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 10, display: 'grid', gap: 8, padding: 11 }}>
        {[0, 1, 2].map((item) => (
          <div key={item} style={{ alignItems: 'center', display: 'grid', gap: 9, gridTemplateColumns: '58px 1fr' }}>
            <span style={{ background: '#e3ebe5', borderRadius: 999, display: 'block', height: 8 }} />
            <span style={{ background: item === index % 3 ? '#225f42' : '#b8cbbf', borderRadius: 999, display: 'block', height: 9 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <span style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 8, height: 36 }} />
        <span style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 8, height: 36 }} />
      </div>
    </div>
  )
}

function ArtifactVisual({ kind, index }: { kind: ArtifactKind; index: number }) {
  if (kind === 'report') return <ReportVisual index={index} />
  if (kind === 'slide') return <SlideVisual index={index} />
  if (kind === 'contract') return <ContractVisual index={index} />
  if (kind === 'entry') return <EntryVisual index={index} />
  return <DashboardVisual index={index} />
}

function ArtifactCard({ item, index, kind }: { item: ArtifactItem; index: number; kind: ArtifactKind }) {
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
      <ArtifactVisual index={index} kind={kind} />
      <div style={{ display: 'grid', gap: 4 }}>
        <span style={{ color: '#65716a', fontSize: 15, fontWeight: 800, textTransform: 'uppercase' }}>{item.eyebrow}</span>
        <strong style={{ color: '#0f1512', fontSize: 22, lineHeight: 1.1 }}>{item.title}</strong>
        <span style={{ color: '#65716a', fontSize: 18, fontWeight: 700 }}>{item.metric}</span>
      </div>
    </article>
  )
}

function ArtifactGallery({ items, kind }: { items: ArtifactItem[]; kind: ArtifactKind }) {
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', padding: 24 }}>
      {items.map((item, index) => (
        <ArtifactCard item={item} key={item.title} kind={kind} index={index} />
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
      <ArtifactGallery
        kind="dashboard"
        items={[
          { eyebrow: 'Dashboard 01', title: 'Financeiro Executivo', metric: 'Receita, margem e caixa' },
          { eyebrow: 'Dashboard 02', title: 'Caixa e Conciliação', metric: 'Extrato, ERP e pendências' },
          { eyebrow: 'Dashboard 03', title: 'Despesas por Centro', metric: 'Categorias e responsáveis' },
          { eyebrow: 'Dashboard 04', title: 'Fechamento Mensal', metric: 'DRE, fluxo e variações' },
        ]}
      />
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
      subtitle="Pacote de relatórios gerenciais em páginas visuais: capa, KPIs, variações e recomendações para diretoria."
      title="Relatório gerencial"
    >
      <ArtifactGallery
        kind="report"
        items={[
          { eyebrow: 'Página 01', title: 'Resumo executivo', metric: 'Receita e EBITDA' },
          { eyebrow: 'Página 02', title: 'Variações do mês', metric: 'Custos e despesas' },
          { eyebrow: 'Página 03', title: 'Plano de ação', metric: '8 recomendações' },
          { eyebrow: 'Página 04', title: 'Anexo financeiro', metric: 'DRE e caixa' },
        ]}
      />
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
      subtitle="Deck de fechamento com vários slides prontos: capa, KPIs, riscos e plano de ação para diretoria."
      title="Apresentação de fechamento"
    >
      <ArtifactGallery
        kind="slide"
        items={[
          { eyebrow: 'Slide 01', title: 'Capa executiva', metric: 'Maio 2026' },
          { eyebrow: 'Slide 02', title: 'Indicadores', metric: '4 KPIs' },
          { eyebrow: 'Slide 03', title: 'Riscos', metric: '3 alertas' },
          { eyebrow: 'Slide 04', title: 'Próximos passos', metric: '8 ações' },
        ]}
      />
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
      subtitle="Coleção de contratos monitorados como documentos: vencimentos, reajustes, responsáveis e alertas de risco."
      title="Gestão de contrato"
    >
      <ArtifactGallery
        kind="contract"
        items={[
          { eyebrow: 'Contrato 01', title: 'Frete Sul', metric: 'Vence em 18 dias' },
          { eyebrow: 'Contrato 02', title: 'ERP Omie', metric: 'Reajuste anual' },
          { eyebrow: 'Contrato 03', title: 'Cloud AWS', metric: 'Crédito contratado' },
          { eyebrow: 'Contrato 04', title: 'Software BI', metric: 'Renovação pendente' },
        ]}
      />
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
      subtitle="Vários artefatos de lançamento gerados: preview contábil, validação fiscal, registro no ERP e comprovante."
      title="Fazer lançamento"
    >
      <ArtifactGallery
        kind="entry"
        items={[
          { eyebrow: 'Etapa 01', title: 'Preview contábil', metric: 'Débito e crédito' },
          { eyebrow: 'Etapa 02', title: 'Validação fiscal', metric: 'Centro de custo' },
          { eyebrow: 'Etapa 03', title: 'Registro no ERP', metric: 'LAN-0184' },
          { eyebrow: 'Etapa 04', title: 'Comprovante', metric: 'Pendente aprovação' },
        ]}
      />
    </ProductAnimationShell>
  )
}

export function McpOperationsDemo() {
  return <ExpenseClassificationAnimation />
}

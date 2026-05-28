import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { BarChart3, CheckCircle2, FileText, LayoutDashboard, Menu, PenLine, Presentation, ReceiptText, RefreshCcw, ShieldCheck } from 'lucide-react'

import type {
  AutomationStructuredContent,
  DashboardListStructuredContent,
  DataResultStructuredContent,
} from '@/products/mcp-apps/web/src/types/toolResult'
import { AnimatedMcpAutomationView } from '@/remotion/components/AnimatedMcpAutomationView'
import { AnimatedMcpDashboardListView } from '@/remotion/components/AnimatedMcpDashboardListView'
import { AnimatedMcpDocumentView, type DocumentPreviewData } from '@/remotion/components/AnimatedMcpDocumentView'
import { AnimatedMcpSlideDeckView, type SlideDeckPreviewData } from '@/remotion/components/AnimatedMcpSlideDeckView'
import { AnimatedMcpTableView } from '@/remotion/components/AnimatedMcpTableView'

export const MCP_OPERATIONS_DEMO_DURATION = 4200

const SCENE_DURATION = 600
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

const dashboardListData = {
  ok: true,
  tool: 'dashboards',
  view: 'dashboard_list',
  title: 'Dashboards operacionais',
  dashboards: [
    { id: 'dash-fechamento', title: 'Fechamento Financeiro', slug: 'fechamento-financeiro', status: 'published', current_draft_version: 6, current_published_version: 5, updated_at: '2026-05-28T18:45:00.000Z' },
    { id: 'dash-despesas', title: 'Despesas por Centro', slug: 'despesas-centro', status: 'draft', current_draft_version: 3, current_published_version: 2, updated_at: '2026-05-28T16:10:00.000Z' },
    { id: 'dash-caixa', title: 'Caixa e Conciliação', slug: 'caixa-conciliacao', status: 'published', current_draft_version: 8, current_published_version: 8, updated_at: '2026-05-27T20:20:00.000Z' },
  ],
} satisfies DashboardListStructuredContent

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

type DemoScene = {
  title: string
  request: string
  status: string
  icon: ReactNode
  startFrame: number
  result: (startFrame: number) => ReactNode
}

function sceneOpacity(frame: number, start: number) {
  return interpolate(frame, [start, start + 26, start + SCENE_DURATION - 46, start + SCENE_DURATION], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function sceneY(frame: number, start: number) {
  return interpolate(frame, [start, start + 36], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function CognitoStatusBar() {
  return (
    <div style={{ alignItems: 'center', display: 'flex', height: 78, justifyContent: 'space-between', padding: '24px 64px 0' }}>
      <div style={{ color: '#0f1512', fontSize: 39, fontWeight: 760, letterSpacing: 0 }}>19:12</div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
        <div style={{ alignItems: 'flex-end', display: 'flex', gap: 4, height: 23 }}>
          {[11, 15, 20, 26].map((height) => (
            <span key={height} style={{ background: '#0f1512', borderRadius: 3, display: 'block', height, width: 7 }} />
          ))}
        </div>
        <span style={{ background: '#0f1512', borderRadius: 999, display: 'block', height: 22, width: 34 }} />
        <div style={{ border: '2px solid #0f1512', borderRadius: 8, height: 30, position: 'relative', width: 58 }}>
          <span style={{ background: '#0f1512', borderRadius: 5, display: 'block', height: 20, left: 5, position: 'absolute', top: 3, width: 39 }} />
        </div>
      </div>
    </div>
  )
}

function CognitoHeader() {
  return (
    <header style={{ alignItems: 'center', display: 'flex', height: 126, justifyContent: 'space-between', padding: '0 48px' }}>
      <Menu color="#314139" size={46} strokeWidth={2.4} />
      <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
        <span style={{ background: '#225f42', borderRadius: 13, display: 'block', height: 42, width: 42 }} />
        <strong style={{ color: '#0f1512', fontSize: 43, letterSpacing: 0 }}>Cognito</strong>
      </div>
      <div style={{ alignItems: 'center', background: '#e8eee9', borderRadius: 999, color: '#225f42', display: 'flex', fontSize: 26, fontWeight: 800, height: 58, justifyContent: 'center', width: 58 }}>
        IA
      </div>
    </header>
  )
}

function TaskPill({ children }: { children: ReactNode }) {
  return (
    <span style={{ alignItems: 'center', background: '#eef4ef', border: '1px solid #dbe5dd', borderRadius: 999, color: '#3d4a43', display: 'inline-flex', fontSize: 24, fontWeight: 700, gap: 8, padding: '12px 18px' }}>
      <CheckCircle2 color="#225f42" size={25} strokeWidth={2.6} />
      {children}
    </span>
  )
}

function DemoSceneCard({ scene, index }: { scene: DemoScene; index: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - scene.startFrame)
  const opacity = sceneOpacity(frame, scene.startFrame)
  const y = sceneY(frame, scene.startFrame)
  const iconScale = interpolate(localFrame, [0, 28, 52], [0.86, 1.08, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        opacity,
        padding: '220px 52px 54px',
        transform: `translateY(${y}px)`,
      }}
    >
      <section style={{ display: 'grid', gap: 28 }}>
        <div style={{ alignItems: 'flex-start', display: 'grid', gap: 22 }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 18 }}>
            <span style={{ alignItems: 'center', background: '#225f42', borderRadius: 24, color: '#ffffff', display: 'flex', height: 78, justifyContent: 'center', transform: `scale(${iconScale})`, width: 78 }}>
              {scene.icon}
            </span>
            <div style={{ display: 'grid', gap: 3 }}>
              <span style={{ color: '#65716a', fontSize: 24, fontWeight: 700 }}>Cena {String(index + 1).padStart(2, '0')}</span>
              <h1 style={{ color: '#0f1512', fontSize: 58, fontWeight: 780, letterSpacing: 0, lineHeight: 1.02, margin: 0 }}>
                {scene.title}
              </h1>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 28, boxShadow: '0 18px 38px rgba(20, 24, 22, 0.09)', display: 'grid', gap: 16, padding: '25px 28px' }}>
            <p style={{ color: '#17201b', fontSize: 36, lineHeight: 1.26, margin: 0 }}>{scene.request}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <TaskPill>{scene.status}</TaskPill>
              <TaskPill>Dados sincronizados</TaskPill>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #dde6df', borderRadius: 24, boxShadow: '0 24px 55px rgba(20, 24, 22, 0.12)', overflow: 'hidden' }}>
          {scene.result(scene.startFrame + 86)}
        </div>
      </section>
    </AbsoluteFill>
  )
}

const scenes: DemoScene[] = [
  {
    title: 'Classificação de despesas',
    request: 'Classifique automaticamente as despesas novas por categoria, centro de custo e confiança.',
    status: '5 despesas analisadas',
    icon: <ReceiptText size={42} strokeWidth={2.4} />,
    startFrame: 0,
    result: (startFrame) => <AnimatedMcpTableView data={expenseClassificationData} startFrame={startFrame} />,
  },
  {
    title: 'Conciliação bancária',
    request: 'Concilie os extratos com os títulos do ERP e destaque divergências para revisão.',
    status: '4 matches encontrados',
    icon: <RefreshCcw size={42} strokeWidth={2.4} />,
    startFrame: SCENE_DURATION,
    result: (startFrame) => <AnimatedMcpTableView data={bankReconciliationData} startFrame={startFrame} />,
  },
  {
    title: 'Dashboards',
    request: 'Liste os dashboards disponíveis e abra a prévia do fechamento financeiro.',
    status: '3 dashboards prontos',
    icon: <LayoutDashboard size={42} strokeWidth={2.4} />,
    startFrame: SCENE_DURATION * 2,
    result: (startFrame) => <AnimatedMcpDashboardListView data={dashboardListData} startFrame={startFrame} />,
  },
  {
    title: 'Relatório gerencial',
    request: 'Gere um relatório em Word com resumo executivo, variações e recomendações.',
    status: 'Documento montado',
    icon: <FileText size={42} strokeWidth={2.4} />,
    startFrame: SCENE_DURATION * 3,
    result: (startFrame) => <AnimatedMcpDocumentView data={managementReportData} startFrame={startFrame} />,
  },
  {
    title: 'Apresentação de fechamento',
    request: 'Transforme o fechamento mensal em uma apresentação curta para diretoria.',
    status: '3 slides criados',
    icon: <Presentation size={42} strokeWidth={2.4} />,
    startFrame: SCENE_DURATION * 4,
    result: (startFrame) => <AnimatedMcpSlideDeckView data={closingDeckData} startFrame={startFrame} />,
  },
  {
    title: 'Gestão de contrato',
    request: 'Monitore contratos críticos e avise quando houver renovação, reajuste ou risco.',
    status: '4 contratos monitorados',
    icon: <ShieldCheck size={42} strokeWidth={2.4} />,
    startFrame: SCENE_DURATION * 5,
    result: (startFrame) => <AnimatedMcpAutomationView data={contractManagementData} startFrame={startFrame} />,
  },
  {
    title: 'Fazer lançamento',
    request: 'Crie o lançamento contábil da despesa conciliada e deixe pendente para aprovação.',
    status: 'Lançamento criado',
    icon: <PenLine size={42} strokeWidth={2.4} />,
    startFrame: SCENE_DURATION * 6,
    result: (startFrame) => <AnimatedMcpAutomationView data={accountingEntryData} startFrame={startFrame} />,
  },
]

function ProgressRail() {
  const frame = useCurrentFrame()

  return (
    <div style={{ bottom: 34, display: 'flex', gap: 8, left: 52, position: 'absolute', right: 52 }}>
      {scenes.map((scene) => {
        const active = frame >= scene.startFrame && frame < scene.startFrame + SCENE_DURATION
        return (
          <span
            key={scene.title}
            style={{
              background: active ? '#225f42' : '#d9e3dc',
              borderRadius: 999,
              display: 'block',
              flex: active ? 1.7 : 1,
              height: 8,
            }}
          />
        )
      })}
    </div>
  )
}

export function McpOperationsDemo() {
  return (
    <AbsoluteFill
      style={{
        background: '#f6f8f5',
        color: '#0f1512',
        fontFamily: FONT_STACK,
        overflow: 'hidden',
      }}
    >
      <CognitoStatusBar />
      <CognitoHeader />
      <div style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}>
        {scenes.map((scene, index) => (
          <DemoSceneCard key={scene.title} index={index} scene={scene} />
        ))}
      </div>
      <div style={{ bottom: 70, color: '#65716a', fontSize: 24, fontWeight: 700, left: 52, position: 'absolute' }}>
        MCP Apps · Operações financeiras
      </div>
      <BarChart3 color="#9eaba3" size={38} strokeWidth={2.4} style={{ bottom: 62, position: 'absolute', right: 52 }} />
      <ProgressRail />
    </AbsoluteFill>
  )
}

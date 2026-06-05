import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import {
  ChevronRight,
  Copy,
  Menu,
  Mic,
  MoreHorizontal,
  Play,
  Plus,
  ReceiptText,
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
} from '@/products/mcp-apps/web/src/types/toolResult'
import { AnimatedMcpAnalysisView } from '@/remotion/components/AnimatedMcpAnalysisView'
import { AnimatedMcpChartView } from '@/remotion/components/AnimatedMcpChartView'
import { AnimatedMcpConnectorsView } from '@/remotion/components/AnimatedMcpConnectorsView'
import { AnimatedMcpDashboardListView } from '@/remotion/components/AnimatedMcpDashboardListView'
import { AnimatedMcpDataCatalogView } from '@/remotion/components/AnimatedMcpDataCatalogView'
import { AnimatedMcpDreView } from '@/remotion/components/AnimatedMcpDreView'
import { AnimatedMcpTableView } from '@/remotion/components/AnimatedMcpTableView'
import { IOS_REMOTION_DISPLAY_FONT_STACK, IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/remotion/fonts/sfPro'

export const MCP_SINGLE_ANIMATION_DURATION = 1500
export const MCP_OPERATIONS_DEMO_DURATION = MCP_SINGLE_ANIMATION_DURATION

loadSfProFonts()

const FONT_STACK = IOS_REMOTION_FONT_STACK

type IntegrationOrbitMock = {
  accent: string
  label: string
  metric: string
  status: string
  title: string
}

type ClassificationDocumentItem = {
  vendor: string
  amount: string
  category: string
  confidence: string
  accent: string
  center: string
  date: string
}

type VerticalPipelineKind = 'reconciliation' | 'dashboard' | 'report' | 'slide' | 'contract' | 'entry'

type VerticalPipelineItem = {
  kind: VerticalPipelineKind
  eyebrow: string
  title: string
  metric: string
  status: string
  accent: string
  secondary: string
}

const classificationPipelineDocs: ClassificationDocumentItem[] = [
  {
    vendor: 'Google Ads BR',
    amount: 'R$ 18.400',
    category: 'Marketing',
    confidence: '96%',
    accent: '#225f42',
    center: 'Growth',
    date: '24 mai',
  },
  {
    vendor: 'Prime Fornecedores',
    amount: 'R$ 31.280',
    category: 'Fornecedores',
    confidence: '94%',
    accent: '#3f6d91',
    center: 'Operacoes',
    date: '25 mai',
  },
  {
    vendor: 'AWS Brasil',
    amount: 'R$ 12.790',
    category: 'Infraestrutura',
    confidence: '97%',
    accent: '#6f8f7b',
    center: 'Tecnologia',
    date: '26 mai',
  },
  {
    vendor: 'Frete Sul',
    amount: 'R$ 8.420',
    category: 'Logistica',
    confidence: '91%',
    accent: '#c28f2c',
    center: 'Fulfillment',
    date: '27 mai',
  },
  {
    vendor: 'Hotel Evento SP',
    amount: 'R$ 6.900',
    category: 'Viagens',
    confidence: '88%',
    accent: '#8b6f9d',
    center: 'Comercial',
    date: '28 mai',
  },
]

const reconciliationPipelineItems: VerticalPipelineItem[] = [
  { kind: 'reconciliation', eyebrow: 'Match 01', title: 'PIX Cliente Norte', metric: 'NF-9031', status: 'Match confirmado', accent: '#225f42', secondary: 'R$ 42.100' },
  { kind: 'reconciliation', eyebrow: 'Match 02', title: 'Cartao Stone', metric: 'Lote-552', status: 'Conciliado', accent: '#225f42', secondary: 'R$ 68.900' },
  { kind: 'reconciliation', eyebrow: 'Alerta 01', title: 'Pagamento Frete Sul', metric: 'CTR-210', status: 'Divergencia', accent: '#c28f2c', secondary: 'R$ 8.420' },
  { kind: 'reconciliation', eyebrow: 'Pendente 01', title: 'Tarifa bancaria', metric: 'Regra pendente', status: 'Aguardando regra', accent: '#3f6d91', secondary: 'R$ 189' },
]

const dashboardPipelineItems: VerticalPipelineItem[] = [
  { kind: 'dashboard', eyebrow: 'Dashboard 01', title: 'Financeiro Executivo', metric: 'Receita, margem e caixa', status: 'Publicado', accent: '#225f42', secondary: '+18.4%' },
  { kind: 'dashboard', eyebrow: 'Dashboard 02', title: 'Caixa e Conciliacao', metric: 'Extrato, ERP e pendencias', status: 'Atualizado', accent: '#3f6d91', secondary: '98%' },
  { kind: 'dashboard', eyebrow: 'Dashboard 03', title: 'Despesas por Centro', metric: 'Categorias e responsaveis', status: 'Gerado', accent: '#6f8f7b', secondary: '12 areas' },
  { kind: 'dashboard', eyebrow: 'Dashboard 04', title: 'Fechamento Mensal', metric: 'DRE, fluxo e variacoes', status: 'Pronto', accent: '#c28f2c', secondary: 'Maio' },
]

const reportPipelineItems: VerticalPipelineItem[] = [
  { kind: 'report', eyebrow: 'Pagina 01', title: 'Resumo executivo', metric: 'Receita e EBITDA', status: 'Escrito', accent: '#225f42', secondary: 'Word' },
  { kind: 'report', eyebrow: 'Pagina 02', title: 'Variacoes do mes', metric: 'Custos e despesas', status: 'Revisado', accent: '#3f6d91', secondary: '97%' },
  { kind: 'report', eyebrow: 'Pagina 03', title: 'Plano de acao', metric: '8 recomendacoes', status: 'Aprovado', accent: '#6f8f7b', secondary: '8 acoes' },
  { kind: 'report', eyebrow: 'Pagina 04', title: 'Anexo financeiro', metric: 'DRE e caixa', status: 'Gerado', accent: '#c28f2c', secondary: 'PDF' },
]

const slidePipelineItems: VerticalPipelineItem[] = [
  { kind: 'slide', eyebrow: 'Slide 01', title: 'Fechamento Maio', metric: 'Capa executiva', status: 'Montado', accent: '#225f42', secondary: '16:9' },
  { kind: 'slide', eyebrow: 'Slide 02', title: 'Indicadores', metric: '4 KPIs principais', status: 'Renderizado', accent: '#3f6d91', secondary: '4 KPIs' },
  { kind: 'slide', eyebrow: 'Slide 03', title: 'Riscos', metric: '3 alertas criticos', status: 'Destacado', accent: '#c28f2c', secondary: '3 riscos' },
  { kind: 'slide', eyebrow: 'Slide 04', title: 'Plano de acao', metric: 'Proximos passos', status: 'Pronto', accent: '#6f8f7b', secondary: '8 acoes' },
]

const contractPipelineItems: VerticalPipelineItem[] = [
  { kind: 'contract', eyebrow: 'Contrato 01', title: 'Frete Sul', metric: 'Vence em 18 dias', status: 'Monitorado', accent: '#8b6f3f', secondary: 'Risco medio' },
  { kind: 'contract', eyebrow: 'Contrato 02', title: 'ERP Omie', metric: 'Reajuste anual', status: 'Renovacao', accent: '#225f42', secondary: '+7.8%' },
  { kind: 'contract', eyebrow: 'Contrato 03', title: 'Cloud AWS', metric: 'Credito contratado', status: 'Ativo', accent: '#3f6d91', secondary: 'Cloud' },
  { kind: 'contract', eyebrow: 'Contrato 04', title: 'Software BI', metric: 'Renovacao pendente', status: 'Pendente', accent: '#c28f2c', secondary: '14 dias' },
]

const entryPipelineItems: VerticalPipelineItem[] = [
  { kind: 'entry', eyebrow: 'Etapa 01', title: 'Preview contabil', metric: 'Debito e credito', status: 'Preparado', accent: '#3f6d91', secondary: 'D/C' },
  { kind: 'entry', eyebrow: 'Etapa 02', title: 'Validacao fiscal', metric: 'Centro de custo', status: 'Validado', accent: '#225f42', secondary: 'OK' },
  { kind: 'entry', eyebrow: 'Etapa 03', title: 'Registro no ERP', metric: 'LAN-0184', status: 'Enviado', accent: '#6f8f7b', secondary: 'ERP' },
  { kind: 'entry', eyebrow: 'Etapa 04', title: 'Comprovante', metric: 'Pendente aprovacao', status: 'Gerado', accent: '#c28f2c', secondary: 'PDF' },
]

const newsCards = [
  { accent: '#225f42', eyebrow: 'FINANCAS', headline: 'IA reduz o tempo de fechamento mensal em 64%', source: 'Cognito Newsroom', time: '09:42' },
  { accent: '#3f6d91', eyebrow: 'MERCADO', headline: 'CFOs aceleram automacao de controles financeiros', source: 'Business Daily', time: '10:18' },
  { accent: '#c28f2c', eyebrow: 'OPERACOES', headline: 'Empresas revisam contratos com apoio de agentes de IA', source: 'Ops Review', time: '11:07' },
]

const tweetText = [
  'Fechamento financeiro nao precisa mais ser uma maratona manual.',
  'Quando classificacao, conciliacao, contratos e dashboards rodam em esteira,',
  'o time deixa de procurar dados e passa a decidir.',
]

const webChatMessages = [
  { role: 'user', text: 'Analise o fechamento de maio e mostre riscos financeiros.' },
  { role: 'assistant', text: 'Encontrei 3 pontos críticos: fretes recorrentes, campanhas acima do teto e contratos perto do reajuste.' },
  { role: 'user', text: 'Transforme isso em plano de ação executivo.' },
  { role: 'assistant', text: 'Plano gerado com responsáveis, prazo e impacto estimado para o board pack.' },
]

const galleryItems = [
  { accent: '#225f42', label: 'Dashboard', title: 'Executive finance', value: '+18.4%' },
  { accent: '#3f6d91', label: 'Workflow', title: 'Bank reconciliation', value: '98%' },
  { accent: '#6f8f7b', label: 'Catalog', title: 'Data workspace', value: '42 fontes' },
  { accent: '#c28f2c', label: 'Report', title: 'Monthly close', value: 'Maio' },
  { accent: '#8b6f9d', label: 'Contract', title: 'Renewal alerts', value: '14 dias' },
  { accent: '#2b7ea5', label: 'AI Review', title: 'Expense controls', value: '96%' },
]

const integrationOrbitMocks: IntegrationOrbitMock[] = [
  { accent: '#225f42', label: 'Hub', metric: '6 fontes', status: 'Connected', title: 'Integration hub' },
  { accent: '#3f6d91', label: 'Catalog', metric: '42 apps', status: 'Indexed', title: 'Connector catalog' },
  { accent: '#6f8f7b', label: 'Pipeline', metric: '4 etapas', status: 'Syncing', title: 'Sync pipeline' },
  { accent: '#c28f2c', label: 'Health', metric: '98% SLA', status: 'Watching', title: 'Health matrix' },
  { accent: '#8b6f9d', label: 'Mapping', metric: '128 campos', status: 'Mapped', title: 'Field mapping' },
  { accent: '#2b7ea5', label: 'Warehouse', metric: '2.1m linhas', status: 'Streaming', title: 'Data warehouse' },
]

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

const chatGptSequenceChartData = {
  ok: true,
  tool: 'chart',
  view: 'chart',
  title: 'Receita por canal',
  subtitle: 'Ultimos 30 dias',
  total: { label: 'Receita total', value: 483900, format: 'currency' },
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
    { canal: 'Amazon', receita: 76700 },
  ],
} satisfies ChartResultStructuredContent

const chatGptSequenceTableData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Contas a pagar',
  resource: 'contas-a-pagar',
  count: 4,
  columns: ['Fornecedor', 'Vencimento', 'Status', 'Valor liquido'],
  rows: [
    { Fornecedor: 'Google Ads BR', Vencimento: '05 jun', Status: 'aberto', 'Valor liquido': 18400 },
    { Fornecedor: 'AWS Brasil', Vencimento: '08 jun', Status: 'aberto', 'Valor liquido': 12790 },
    { Fornecedor: 'Frete Sul', Vencimento: '12 jun', Status: 'agendado', 'Valor liquido': 8420 },
    { Fornecedor: 'Prime Fornecedores', Vencimento: '15 jun', Status: 'aberto', 'Valor liquido': 31280 },
  ],
} satisfies DataResultStructuredContent

const chatGptSequenceConnectorsData = {
  ok: true,
  tool: 'connectors',
  view: 'connectors',
  title: 'Conectores',
  subtitle: 'Fontes usadas nesta resposta',
  summary: {
    total: 4,
    connected: 3,
    warning: 1,
    last_sync_at: '2026-06-04T17:42:00.000Z',
  },
  rows: [
    { name: 'ERP Omie', domain: 'erp', status: 'connected', last_sync_at: '2026-06-04T17:42:00.000Z', records: 18420 },
    { name: 'Shopify', domain: 'ecommerce', status: 'connected', last_sync_at: '2026-06-04T17:39:00.000Z', records: 12880 },
    { name: 'Meta Ads', domain: 'marketing', status: 'connected', last_sync_at: '2026-06-04T17:31:00.000Z', records: 6420 },
    { name: 'Banco', domain: 'financeiro', status: 'warning', last_sync_at: '2026-06-04T09:10:00.000Z', records: 980 },
  ],
  columns: ['name', 'domain', 'status', 'last_sync_at', 'records'],
} satisfies ConnectorsStructuredContent

const chatGptSequenceDataCatalogData = {
  ok: true,
  success: true,
  tool: 'data_catalog',
  view: 'data_catalog',
  action: 'cobertura',
  domain: 'erp',
  resource: 'contas-a-pagar',
  title: 'Catalogo de Dados',
  subtitle: 'ERP pronto para dashboard',
  sources: [
    { domain: 'erp', label: 'ERP', status: 'connected', total_records: 28410 },
    { domain: 'crm', label: 'CRM', status: 'connected', total_records: 9120 },
    { domain: 'marketing', label: 'Marketing', status: 'connected', total_records: 28912 },
  ],
  resources: [
    { resource: 'contas-a-pagar', label: 'Contas a Pagar', status: 'ok', total_records: 420, value_sum: 1842090.4 },
    { resource: 'contas-a-receber', label: 'Contas a Receber', status: 'ok', total_records: 388, value_sum: 2366000.1 },
  ],
  quality: { score: 91, resource: 'contas-a-pagar', missing_fields: 2 },
  recommendations: ['Usar janela minima de 5 meses para tendencia.'],
} satisfies DataCatalogStructuredContent

const chatGptSequenceDashboardListData = {
  ok: true,
  tool: 'dashboards',
  view: 'dashboard_list',
  title: 'Dashboards',
  dashboards: [
    { id: 'dash-financeiro', title: 'Financeiro Executivo', slug: 'financeiro-executivo', status: 'published', current_draft_version: 4, current_published_version: 3, updated_at: '2026-05-28T09:10:00.000Z' },
    { id: 'dash-marketing', title: 'Marketing H1', slug: 'marketing-h1', status: 'draft', current_draft_version: 2, current_published_version: null, updated_at: '2026-05-27T18:30:00.000Z' },
  ],
} satisfies DashboardListStructuredContent

const chatGptSequenceDreData = {
  ok: true,
  tool: 'financial_statement',
  view: 'table',
  kind: 'dre',
  variant: 'financial_statement',
  title: 'DRE',
  subtitle: 'Consolidado 2026',
  columns: [
    { key: 'descricao', label: 'DRE' },
    { key: 'jan_2026', label: 'Jan/26', format: 'currency_plain' },
    { key: 'fev_2026', label: 'Fev/26', format: 'currency_plain' },
    { key: 'mar_2026', label: 'Mar/26', format: 'currency_plain' },
  ],
  rows: [
    { descricao: '(+) Receita bruta', jan_2026: 812300, fev_2026: 844200, mar_2026: 904100, _rowType: 'group' },
    { descricao: '(-) Descontos', jan_2026: -22100, fev_2026: -19800, mar_2026: -24700, _rowType: 'child' },
    { descricao: '(=) Receita liquida', jan_2026: 790200, fev_2026: 824400, mar_2026: 879400, _rowType: 'subtotal' },
    { descricao: '(-) Custos', jan_2026: -318000, fev_2026: -334800, mar_2026: -351200, _rowType: 'child' },
    { descricao: '(=) EBITDA', jan_2026: 279800, fev_2026: 289600, mar_2026: 321100, _rowType: 'subtotal' },
  ],
  count: 5,
} satisfies TableStructuredContent

const chatGptSequenceAnalysisData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'executive_summary',
  title: 'Resumo executivo',
  subtitle: 'Principais pontos do financeiro',
  summary: 'Receita concentrada em dois canais, contas a pagar sob controle e um conector bancario pedindo atencao.',
  metrics: [
    { label: 'Receita', value: 'R$ 483,9 mil', tone: 'positive' },
    { label: 'A pagar', value: 'R$ 70,9 mil', tone: 'neutral' },
    { label: 'Conectores OK', value: '3/4', tone: 'warning' },
  ],
  next_steps: ['Reconciliar banco', 'Aprovar pagamentos de junho'],
} satisfies AnalysisStructuredContent

const chatGptReconciliationBankStatementData = {
  ok: true,
  tool: 'bank_statement',
  view: 'table',
  title: 'Extrato bancario',
  resource: 'extrato-bancario',
  count: 4,
  columns: ['Data', 'Historico', 'Documento', 'Valor', 'Saldo'],
  rows: [
    { Data: '03 jun', Historico: 'PIX Cliente Norte', Documento: 'E2E90318471', Valor: '+R$ 42.100', Saldo: 'R$ 184.920' },
    { Data: '03 jun', Historico: 'Cartao Stone', Documento: 'LOTE-552', Valor: '+R$ 68.900', Saldo: 'R$ 176.480' },
    { Data: '04 jun', Historico: 'Pagamento Frete Sul', Documento: 'TED-774012', Valor: '-R$ 8.420', Saldo: 'R$ 151.900' },
    { Data: '04 jun', Historico: 'Tarifa bancaria', Documento: 'TAR-0421', Valor: '-R$ 189', Saldo: 'R$ 149.870' },
  ],
} satisfies DataResultStructuredContent

const chatGptReconciliationErpData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Lancamentos do ERP',
  resource: 'financeiro/lancamentos',
  count: 4,
  columns: ['Titulo', 'Cliente/fornecedor', 'Vencimento', 'Valor', 'Status'],
  rows: [
    { Titulo: 'NF-9031', 'Cliente/fornecedor': 'Cliente Norte', Vencimento: '03 jun', Valor: 'R$ 42.100', Status: 'Aberto' },
    { Titulo: 'Lote-552', 'Cliente/fornecedor': 'Stone', Vencimento: '03 jun', Valor: 'R$ 68.900', Status: 'Aberto' },
    { Titulo: 'CTR-210', 'Cliente/fornecedor': 'Frete Sul', Vencimento: '04 jun', Valor: 'R$ 8.420', Status: 'Divergente' },
    { Titulo: 'Regra pendente', 'Cliente/fornecedor': 'Banco', Vencimento: '04 jun', Valor: 'R$ 189', Status: 'Sem regra' },
  ],
} satisfies DataResultStructuredContent

const chatGptReconciliationSummaryData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'reconciliation_summary',
  title: 'Resumo da conciliacao',
  subtitle: 'Antes de executar',
  summary: 'Comparei o extrato bancario com os lancamentos do ERP. Ha 14 movimentos com alta confianca, 3 divergencias para revisar e 1 tarifa sem lancamento correspondente.',
  metrics: [
    { label: 'Prontos', value: '14', tone: 'positive' },
    { label: 'Revisar', value: '3', tone: 'warning' },
    { label: 'Sem ERP', value: '1', tone: 'neutral' },
  ],
  next_steps: ['Conciliar 14 matches com alta confianca', 'Manter divergencias pendentes', 'Sugerir regra para tarifa bancaria'],
} satisfies AnalysisStructuredContent

const chatGptReconciliationResultData = {
  ok: true,
  tool: 'erp_acoes',
  view: 'table',
  title: 'Conciliacao executada',
  resource: 'financeiro/conciliacao',
  count: 4,
  columns: ['Movimento', 'ERP encontrado', 'Acao', 'Status'],
  rows: [
    { Movimento: 'PIX Cliente Norte', 'ERP encontrado': 'NF-9031 · 99%', Acao: 'Baixar titulo', Status: 'Conciliado' },
    { Movimento: 'Cartao Stone', 'ERP encontrado': 'Lote-552 · 98%', Acao: 'Marcar recebido', Status: 'Conciliado' },
    { Movimento: 'Pagamento Frete Sul', 'ERP encontrado': 'CTR-210 · 72%', Acao: 'Aguardar ajuste', Status: 'Pendente' },
    { Movimento: 'Tarifa bancaria', 'ERP encontrado': 'Sem lancamento', Acao: 'Sugerir despesa', Status: 'Pendente' },
  ],
} satisfies DataResultStructuredContent

const chatGptCollectionCustomerData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Cliente localizado',
  resource: 'financeiro/clientes',
  count: 3,
  columns: ['Cliente', 'CNPJ', 'Contato', 'Match'],
  rows: [
    { Cliente: 'Cliente Norte Ltda', CNPJ: '31.420.901/0001-18', Contato: 'financeiro@norte.com', Match: '99%' },
    { Cliente: 'Cliente Norte Filial', CNPJ: '31.420.901/0002-99', Contato: 'filial@norte.com', Match: '72%' },
    { Cliente: 'Norte Comercio', CNPJ: '09.884.120/0001-40', Contato: 'cobranca@norte.com', Match: '61%' },
  ],
} satisfies DataResultStructuredContent

const chatGptCollectionParametersData = {
  ok: true,
  tool: 'erp',
  view: 'table',
  title: 'Parametros da cobranca',
  resource: 'financeiro/cobrancas',
  count: 3,
  columns: ['Campo', 'Selecionado', 'Alternativas', 'Confianca'],
  rows: [
    { Campo: 'Forma', Selecionado: 'PIX + boleto', Alternativas: 'Link cartao', Confianca: '96%' },
    { Campo: 'Conta financeira', Selecionado: 'Banco Stone', Alternativas: 'Itau Empresas', Confianca: '94%' },
    { Campo: 'Categoria', Selecionado: 'Receita de servicos', Alternativas: 'Receita recorrente', Confianca: '91%' },
  ],
} satisfies DataResultStructuredContent

const chatGptCollectionDraftData = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'collection_preview',
  title: 'Cobranca preparada',
  subtitle: 'Aguardando confirmacao',
  summary: 'Vou criar uma conta a receber para Cliente Norte Ltda no valor de R$ 12.400, com vencimento em 10 jun, forma PIX + boleto e envio por WhatsApp.',
  metrics: [
    { label: 'Valor', value: 'R$ 12.400', tone: 'neutral' },
    { label: 'Vencimento', value: '10 jun', tone: 'neutral' },
    { label: 'Confianca', value: '96%', tone: 'positive' },
  ],
  next_steps: ['Criar conta a receber no ERP', 'Gerar PIX e boleto', 'Enviar cobranca ao cliente'],
} satisfies AnalysisStructuredContent

const chatGptCollectionResultData = {
  ok: true,
  tool: 'erp_acoes',
  view: 'table',
  title: 'Cobranca criada',
  resource: 'contas-a-receber',
  count: 1,
  columns: ['ID', 'Cliente', 'Valor', 'Vencimento', 'Status'],
  rows: [
    { ID: 'CR-2041', Cliente: 'Cliente Norte Ltda', Valor: 'R$ 12.400', Vencimento: '10 jun', Status: 'Enviada' },
  ],
} satisfies DataResultStructuredContent

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

function IntegrationOrbitMockCard({ active = false, mock, scale = 1 }: { active?: boolean; mock: IntegrationOrbitMock; scale?: number }) {
  return (
    <div
      style={{
        background: active ? '#102019' : '#ffffff',
        border: `1px solid ${active ? '#102019' : '#dfe7e1'}`,
        borderRadius: 24 * scale,
        boxShadow: active ? '0 34px 90px rgba(20,24,22,0.22)' : '0 18px 46px rgba(20,24,22,0.12)',
        color: active ? '#ffffff' : '#0f1512',
        display: 'grid',
        gap: 15 * scale,
        minHeight: 228 * scale,
        overflow: 'hidden',
        padding: 22 * scale,
        position: 'relative',
        width: 318 * scale,
      }}
    >
      <span style={{ background: mock.accent, borderRadius: 999, display: 'block', height: 7 * scale, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <div style={{ alignItems: 'start', display: 'flex', gap: 14 * scale, justifyContent: 'space-between' }}>
        <span style={{ alignItems: 'center', background: active ? 'rgba(255,255,255,0.12)' : '#f3f7f4', borderRadius: 16 * scale, color: active ? '#ffffff' : mock.accent, display: 'flex', fontSize: 18 * scale, fontWeight: 900, height: 48 * scale, justifyContent: 'center', width: 58 * scale }}>{mock.label.slice(0, 2)}</span>
        <span style={{ background: active ? 'rgba(255,255,255,0.12)' : '#eef5f0', borderRadius: 999, color: active ? '#ffffff' : mock.accent, fontSize: 15 * scale, fontWeight: 900, padding: `${8 * scale}px ${10 * scale}px` }}>{mock.status}</span>
      </div>
      <div style={{ display: 'grid', gap: 8 * scale }}>
        <span style={{ color: active ? 'rgba(255,255,255,0.64)' : '#65716a', fontSize: 15 * scale, fontWeight: 850, textTransform: 'uppercase' }}>{mock.label}</span>
        <strong style={{ color: active ? '#ffffff' : '#0f1512', fontSize: 28 * scale, letterSpacing: 0, lineHeight: 1 }}>{mock.title}</strong>
        <span style={{ color: active ? '#ffffff' : mock.accent, fontSize: 24 * scale, fontWeight: 900 }}>{mock.metric}</span>
      </div>
      <div style={{ display: 'grid', gap: 8 * scale, marginTop: 'auto' }}>
        {[82, 58, 72].map((width, index) => <span key={width} style={{ background: index === 1 ? mock.accent : active ? 'rgba(255,255,255,0.18)' : '#e5ece7', borderRadius: 999, display: 'block', height: 8 * scale, width: `${width}%` }} />)}
      </div>
    </div>
  )
}

export function IntegrationFlowAnimation() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const centerX = 540
  const centerY = 930
  const activeIndex = Math.floor(frame / 98) % integrationOrbitMocks.length
  const active = integrationOrbitMocks[activeIndex]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 48%, ${active.accent}24, rgba(244, 247, 244, 0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Integration orbit" />
      <svg height="100%" style={{ left: 0, opacity: sceneIn, position: 'absolute', top: 0, zIndex: 5 }} viewBox="0 0 1080 1920" width="100%">
        {[245, 360, 475].map((radius) => (
          <circle cx={centerX} cy={centerY} fill="none" key={radius} r={radius} stroke="rgba(34,95,66,0.13)" strokeDasharray={radius === 360 ? '18 18' : undefined} strokeWidth="3" />
        ))}
        {integrationOrbitMocks.map((_, index) => {
          const angle = frame / 62 + index * ((Math.PI * 2) / integrationOrbitMocks.length)
          const radius = index % 2 === 0 ? 420 : 310
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          const d = `M ${centerX} ${centerY} L ${x} ${y}`
          return <path d={d} fill="none" key={index} opacity="0.22" stroke={active.accent} strokeDasharray="14 16" strokeWidth="4" />
        })}
      </svg>
      <div style={{ opacity: sceneIn, position: 'absolute', zIndex: 20 }}>
        {integrationOrbitMocks.map((mock, index) => {
          const angle = frame / 62 + index * ((Math.PI * 2) / integrationOrbitMocks.length)
          const radius = index % 2 === 0 ? 420 : 310
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          const depth = (Math.sin(angle) + 1) / 2
          const activeCard = index === activeIndex
          const scale = 0.72 + depth * 0.16 + (activeCard ? 0.16 : 0)

          return (
            <div
              key={mock.label}
              style={{
                left: x,
                opacity: 0.58 + depth * 0.42,
                position: 'absolute',
                top: y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                zIndex: Math.round(depth * 20) + (activeCard ? 30 : 8),
              }}
            >
              <IntegrationOrbitMockCard active={activeCard} mock={mock} scale={0.92} />
            </div>
          )
        })}
      </div>
      <div style={{ alignItems: 'center', background: '#102019', border: '1px solid #102019', borderRadius: 42, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 14, height: 304, justifyItems: 'center', left: '50%', padding: 32, position: 'absolute', top: centerY, transform: `translate(-50%, -50%) scale(${0.94 + sceneIn * 0.06})`, width: 380, zIndex: 45 }}>
        <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
        <strong style={{ color: '#ffffff', fontSize: 50, letterSpacing: 0, lineHeight: 0.98, textAlign: 'center' }}>Integration hub</strong>
        <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 23, fontWeight: 760, textAlign: 'center' }}>Mocks orbitando o sistema central</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid #dfe7e1', borderRadius: 30, boxShadow: '0 30px 84px rgba(20,24,22,0.16)', left: 86, padding: 34, position: 'absolute', right: 86, top: 1350, zIndex: 50 }}>
        <span style={{ color: active.accent, fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Marketing integrations</span>
        <h2 style={{ color: '#0f1512', fontSize: 58, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 0' }}>Hub, catálogo, pipeline, health e mapping em uma órbita viva</h2>
      </div>
      <GalleryFooter>Animação de integração baseada no Orbit, com mocks conectados ao hub</GalleryFooter>
    </AbsoluteFill>
  )
}

export function IntegrationHubRingsAnimation() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const centerX = 540
  const centerY = 940
  const activeIndex = Math.floor(frame / 94) % integrationOrbitMocks.length
  const active = integrationOrbitMocks[activeIndex]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 48%, ${active.accent}24, rgba(244,247,244,0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Integration rings" />
      <svg height="100%" style={{ left: 0, opacity: sceneIn, position: 'absolute', top: 0, zIndex: 5 }} viewBox="0 0 1080 1920" width="100%">
        {[190, 320, 450].map((radius, index) => (
          <circle cx={centerX} cy={centerY} fill="none" key={radius} r={radius} stroke={index === activeIndex % 3 ? active.accent : 'rgba(34,95,66,0.14)'} strokeDasharray="18 18" strokeDashoffset={-(frame * (index + 1.4))} strokeWidth={index === activeIndex % 3 ? 5 : 3} />
        ))}
      </svg>
      {integrationOrbitMocks.map((mock, index) => {
        const ring = index % 3
        const radius = [190, 320, 450][ring]
        const angle = index * ((Math.PI * 2) / integrationOrbitMocks.length) - Math.PI / 2 + frame / (130 + ring * 24)
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const activeCard = index === activeIndex

        return (
          <div key={mock.label} style={{ left: x, opacity: sceneIn, position: 'absolute', top: y, transform: `translate(-50%, -50%) scale(${activeCard ? 0.98 : 0.72})`, zIndex: activeCard ? 45 : 20 + ring }}>
            <IntegrationOrbitMockCard active={activeCard} mock={mock} scale={0.86} />
          </div>
        )
      })}
      <div style={{ alignItems: 'center', background: '#102019', borderRadius: 999, boxShadow: '0 36px 100px rgba(20,24,22,0.24)', color: '#ffffff', display: 'grid', gap: 8, height: 250, justifyItems: 'center', left: centerX, padding: 30, position: 'absolute', top: centerY, transform: `translate(-50%, -50%) scale(${0.92 + sceneIn * 0.08})`, width: 250, zIndex: 50 }}>
        <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 16, width: 16 }} />
        <strong style={{ color: '#ffffff', fontSize: 42, letterSpacing: 0, lineHeight: 1, textAlign: 'center' }}>Hub rings</strong>
        <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 19, fontWeight: 760, textAlign: 'center' }}>Camadas de conectores por função</span>
      </div>
      <GalleryFooter>Integration hub em aneis concêntricos com conectores ativos</GalleryFooter>
    </AbsoluteFill>
  )
}

export function IntegrationHubMeshAnimation() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const centerX = 540
  const centerY = 940
  const activeIndex = Math.floor(frame / 90) % integrationOrbitMocks.length
  const points = [
    [210, 640],
    [380, 420],
    [740, 500],
    [890, 790],
    [760, 1190],
    [300, 1240],
  ]
  const active = integrationOrbitMocks[activeIndex]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 48%, ${active.accent}24, rgba(244,247,244,0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Integration mesh" />
      <svg height="100%" style={{ left: 0, opacity: sceneIn, position: 'absolute', top: 0, zIndex: 5 }} viewBox="0 0 1080 1920" width="100%">
        {points.map(([x, y], index) => (
          <path d={`M ${centerX} ${centerY} C ${(centerX + x) / 2} ${centerY - 90}, ${(centerX + x) / 2} ${y + 90}, ${x} ${y}`} fill="none" key={`${x}-${y}`} opacity={index === activeIndex ? 0.82 : 0.24} stroke={index === activeIndex ? active.accent : '#225f42'} strokeDasharray="14 18" strokeDashoffset={-(frame * 4 + index * 16)} strokeLinecap="round" strokeWidth={index === activeIndex ? 6 : 4} />
        ))}
        {points.map(([x, y], index) => {
          const next = points[(index + 1) % points.length]
          return <path d={`M ${x} ${y} L ${next[0]} ${next[1]}`} fill="none" key={`mesh-${index}`} opacity="0.14" stroke="#225f42" strokeWidth="3" />
        })}
      </svg>
      {integrationOrbitMocks.map((mock, index) => {
        const [x, y] = points[index]
        const activeCard = index === activeIndex
        const float = Math.sin((frame + index * 18) / 28) * 8

        return (
          <div key={mock.label} style={{ left: x, opacity: sceneIn, position: 'absolute', top: y + float, transform: `translate(-50%, -50%) scale(${activeCard ? 1 : 0.76})`, zIndex: activeCard ? 45 : 20 }}>
            <IntegrationOrbitMockCard active={activeCard} mock={mock} scale={0.86} />
          </div>
        )
      })}
      <div style={{ alignItems: 'center', background: '#102019', borderRadius: 42, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 12, height: 278, justifyItems: 'center', left: centerX, padding: 30, position: 'absolute', top: centerY, transform: `translate(-50%, -50%) scale(${0.94 + sceneIn * 0.06})`, width: 344, zIndex: 50 }}>
        <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
        <strong style={{ color: '#ffffff', fontSize: 46, letterSpacing: 0, lineHeight: 1, textAlign: 'center' }}>Mesh hub</strong>
        <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 21, fontWeight: 760, textAlign: 'center' }}>Conectores em rede viva</span>
      </div>
      <GalleryFooter>Integration hub em malha de conexões com fluxo ativo</GalleryFooter>
    </AbsoluteFill>
  )
}

export function IntegrationHubDockAnimation() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 86) % integrationOrbitMocks.length
  const active = integrationOrbitMocks[activeIndex]
  const packet = (frame * 5) % 520

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 48%, ${active.accent}24, rgba(244,247,244,0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Integration dock" />
      <section style={{ bottom: 210, display: 'grid', gap: 28, gridTemplateColumns: '280px 1fr 280px', left: 70, opacity: sceneIn, position: 'absolute', right: 70, top: 320, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 22 }}>
          {integrationOrbitMocks.slice(0, 3).map((mock, index) => <IntegrationOrbitMockCard active={index === activeIndex} key={mock.label} mock={mock} scale={0.78} />)}
        </div>
        <div style={{ alignItems: 'center', display: 'grid', justifyItems: 'center', position: 'relative' }}>
          <svg height="100%" style={{ inset: 0, position: 'absolute' }} viewBox="0 0 420 780" width="100%">
            {[120, 260, 400].map((y, index) => (
              <path d={`M 0 ${y} C 150 ${y}, 150 390, 210 390 C 270 390, 270 ${y}, 420 ${y}`} fill="none" key={y} opacity="0.28" stroke={index === activeIndex % 3 ? active.accent : '#225f42'} strokeDasharray="14 18" strokeDashoffset={-(frame * 4)} strokeWidth="5" />
            ))}
          </svg>
          <div style={{ background: '#102019', borderRadius: 46, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 14, height: 330, justifyItems: 'center', padding: 36, position: 'relative', width: 360, zIndex: 20 }}>
            <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
            <strong style={{ color: '#ffffff', fontSize: 50, letterSpacing: 0, lineHeight: 1, textAlign: 'center' }}>Dock hub</strong>
            <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 22, fontWeight: 760, textAlign: 'center' }}>Apps entrando pelas laterais</span>
          </div>
          <span style={{ background: active.accent, borderRadius: 999, boxShadow: `0 0 34px ${active.accent}88`, display: 'block', height: 22, left: `${Math.min(88, 12 + packet / 6)}%`, position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 22, zIndex: 30 }} />
        </div>
        <div style={{ display: 'grid', gap: 22 }}>
          {integrationOrbitMocks.slice(3, 6).map((mock, index) => <IntegrationOrbitMockCard active={index + 3 === activeIndex} key={mock.label} mock={mock} scale={0.78} />)}
        </div>
      </section>
      <GalleryFooter>Integration hub em formato dock, com conectores alimentando o centro</GalleryFooter>
    </AbsoluteFill>
  )
}

export function IntegrationTimelineAnimation() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 82) % integrationOrbitMocks.length
  const active = integrationOrbitMocks[activeIndex]
  const cursor = progress(frame % 82, 8, 64)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 42%, ${active.accent}22, rgba(244,247,244,0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Integration timeline" />
      <section style={{ left: 72, opacity: sceneIn, position: 'absolute', right: 72, top: 310, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 12, marginBottom: 42 }}>
          <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, textTransform: 'uppercase' }}>Sync timeline</span>
          <strong style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.96 }}>Cada conector vira uma etapa de sincronização</strong>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 40, boxShadow: '0 42px 100px rgba(20,24,22,0.18)', minHeight: 920, padding: 34, position: 'relative' }}>
          <div style={{ background: '#dfe7e1', borderRadius: 999, bottom: 120, left: 104, position: 'absolute', top: 112, width: 8 }} />
          <div style={{ background: active.accent, borderRadius: 999, height: `${Math.min(82, 12 + cursor * 72)}%`, left: 104, position: 'absolute', top: 112, width: 8 }} />
          <div style={{ display: 'grid', gap: 18 }}>
            {integrationOrbitMocks.map((mock, index) => {
              const rowIn = progress(frame, 24 + index * 12, 66 + index * 12)
              const activeRow = index === activeIndex
              return (
                <div key={mock.label} style={{ alignItems: 'center', display: 'grid', gap: 28, gridTemplateColumns: '96px 1fr', opacity: rowIn, transform: `translateX(${(1 - rowIn) * 30}px)` }}>
                  <span style={{ alignItems: 'center', background: activeRow ? mock.accent : '#f3f7f4', border: '7px solid #ffffff', borderRadius: 999, boxShadow: activeRow ? `0 18px 50px ${mock.accent}55` : '0 12px 34px rgba(20,24,22,0.10)', color: activeRow ? '#ffffff' : '#65716a', display: 'flex', fontSize: 24, fontWeight: 900, height: 76, justifyContent: 'center', width: 76 }}>{index + 1}</span>
                  <div style={{ background: activeRow ? '#102019' : '#f7faf7', border: `1px solid ${activeRow ? '#102019' : '#dfe7e1'}`, borderRadius: 26, color: activeRow ? '#ffffff' : '#0f1512', display: 'grid', gap: 10, padding: 22 }}>
                    <span style={{ color: activeRow ? 'rgba(255,255,255,0.62)' : '#65716a', fontSize: 17, fontWeight: 850, textTransform: 'uppercase' }}>{mock.status}</span>
                    <strong style={{ color: activeRow ? '#ffffff' : '#0f1512', fontSize: 32, letterSpacing: 0 }}>{mock.title}</strong>
                    <span style={{ color: activeRow ? '#ffffff' : mock.accent, fontSize: 25, fontWeight: 900 }}>{mock.metric}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <GalleryFooter>Integração em timeline, mostrando cada fonte como etapa de sincronização</GalleryFooter>
    </AbsoluteFill>
  )
}

export function IntegrationBridgeAnimation() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 88) % integrationOrbitMocks.length
  const active = integrationOrbitMocks[activeIndex]
  const packet = (frame * 5.4) % 760
  const left = integrationOrbitMocks.slice(0, 3)
  const right = integrationOrbitMocks.slice(3, 6)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 48%, ${active.accent}22, rgba(244,247,244,0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Integration bridge" />
      <section style={{ bottom: 220, display: 'grid', gap: 34, gridTemplateColumns: '280px 1fr 280px', left: 70, opacity: sceneIn, position: 'absolute', right: 70, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 24 }}>
          {left.map((mock, index) => <IntegrationOrbitMockCard active={index === activeIndex} key={mock.label} mock={mock} scale={0.76} />)}
        </div>
        <div style={{ alignItems: 'center', display: 'grid', justifyItems: 'center', position: 'relative' }}>
          <svg height="100%" style={{ inset: 0, position: 'absolute' }} viewBox="0 0 420 820" width="100%">
            {[180, 300, 420, 540, 660].map((y, index) => (
              <path d={`M 0 ${y} C 132 ${y - 28}, 140 410, 210 410 C 280 410, 288 ${y + 28}, 420 ${y}`} fill="none" key={y} opacity={index === activeIndex % 5 ? 0.80 : 0.22} stroke={index === activeIndex % 5 ? active.accent : '#225f42'} strokeDasharray="16 18" strokeDashoffset={-(frame * 4.2)} strokeLinecap="round" strokeWidth={index === activeIndex % 5 ? 6 : 4} />
            ))}
          </svg>
          <div style={{ background: '#102019', borderRadius: 48, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 12, height: 312, justifyItems: 'center', padding: 36, position: 'relative', width: 352, zIndex: 20 }}>
            <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
            <strong style={{ color: '#ffffff', fontSize: 48, letterSpacing: 0, lineHeight: 1, textAlign: 'center' }}>Data bridge</strong>
            <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 22, fontWeight: 760, textAlign: 'center' }}>Apps cruzando para o warehouse</span>
          </div>
          <span style={{ background: active.accent, borderRadius: 999, boxShadow: `0 0 36px ${active.accent}88`, display: 'block', height: 24, left: `${8 + (packet / 760) * 84}%`, position: 'absolute', top: `${34 + Math.sin(frame / 18) * 18}%`, width: 24, zIndex: 30 }} />
        </div>
        <div style={{ display: 'grid', gap: 24 }}>
          {right.map((mock, index) => <IntegrationOrbitMockCard active={index + 3 === activeIndex} key={mock.label} mock={mock} scale={0.76} />)}
        </div>
      </section>
      <GalleryFooter>Integração em ponte, conectando fontes de um lado ao destino do outro</GalleryFooter>
    </AbsoluteFill>
  )
}

export function IntegrationSyncStackAnimation() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 84) % integrationOrbitMocks.length
  const active = integrationOrbitMocks[activeIndex]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 44%, ${active.accent}22, rgba(244,247,244,0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Integration sync stack" />
      <section style={{ left: 70, opacity: sceneIn, position: 'absolute', right: 70, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 12, marginBottom: 42 }}>
          <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, textTransform: 'uppercase' }}>Sync stack</span>
          <strong style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.96 }}>Conectores empilhados virando uma fonte única</strong>
        </div>
        <div style={{ height: 900, position: 'relative' }}>
          {integrationOrbitMocks.map((mock, index) => {
            const activeCard = index === activeIndex
            const offset = index - activeIndex
            const normalized = ((offset + integrationOrbitMocks.length) % integrationOrbitMocks.length)
            const y = 70 + normalized * 88
            const x = 120 + Math.sin((frame + index * 20) / 22) * 18
            const scale = activeCard ? 1 : 0.86
            return (
              <div key={mock.label} style={{ left: x, opacity: activeCard ? 1 : 0.62, position: 'absolute', top: y, transform: `scale(${scale})`, transformOrigin: 'left top', zIndex: activeCard ? 40 : 20 - normalized }}>
                <IntegrationOrbitMockCard active={activeCard} mock={mock} scale={0.88} />
              </div>
            )
          })}
          <div style={{ background: '#102019', borderRadius: 48, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 14, height: 500, justifyItems: 'center', padding: 38, position: 'absolute', right: 40, top: 185, width: 388, zIndex: 45 }}>
            <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
            <strong style={{ color: '#ffffff', fontSize: 52, letterSpacing: 0, lineHeight: 0.96, textAlign: 'center' }}>Unified data</strong>
            <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 23, fontWeight: 760, textAlign: 'center' }}>O stack sincroniza e entrega uma camada operacional</span>
            <div style={{ display: 'grid', gap: 12, marginTop: 20, width: '100%' }}>
              {[86, 64, 92, 58].map((width, index) => <span key={width} style={{ background: index === activeIndex % 4 ? active.accent : 'rgba(255,255,255,0.16)', borderRadius: 999, height: index === activeIndex % 4 ? 13 : 10, width: `${width}%` }} />)}
            </div>
          </div>
        </div>
      </section>
      <GalleryFooter>Integração em stack, consolidando conectores em uma camada unificada</GalleryFooter>
    </AbsoluteFill>
  )
}

function PipelineDocument({ doc, index, muted = false }: { doc: ClassificationDocumentItem; index: number; muted?: boolean }) {
  return (
    <div
      style={{
        background: muted ? 'rgba(255, 255, 255, 0.62)' : '#ffffff',
        border: '1px solid rgba(211, 224, 216, 0.96)',
        borderRadius: muted ? '38px 28px 44px 30px' : 26,
        boxShadow: muted ? '0 16px 42px rgba(20, 24, 22, 0.07)' : '0 38px 92px rgba(20, 24, 22, 0.22)',
        clipPath: muted ? 'polygon(7% 0, 100% 4%, 93% 100%, 0 96%)' : undefined,
        display: 'grid',
        gap: muted ? 16 : 22,
        height: muted ? 520 : 780,
        overflow: 'hidden',
        padding: muted ? 24 : 34,
        position: 'relative',
        width: muted ? 390 : 610,
      }}
    >
      <span style={{ background: doc.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gap: 7 }}>
          <span style={{ color: '#77837b', fontSize: 19, fontWeight: 760, letterSpacing: 0, textTransform: 'uppercase' }}>Documento financeiro</span>
          <strong style={{ color: '#101713', fontSize: 33, letterSpacing: 0, lineHeight: 1 }}>{doc.vendor}</strong>
        </div>
        <span style={{ alignItems: 'center', background: '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 16, color: '#45524a', display: 'flex', fontSize: 20, fontWeight: 800, height: 56, justifyContent: 'center', width: 84 }}>
          {doc.date}
        </span>
      </div>

      <div style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 18, display: 'grid', gap: 12, padding: 18 }}>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#65716a', fontSize: 21, fontWeight: 760 }}>Valor</span>
          <strong style={{ color: '#0f1512', fontSize: 34, letterSpacing: 0 }}>{doc.amount}</strong>
        </div>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#65716a', fontSize: 21, fontWeight: 760 }}>Centro</span>
          <strong style={{ color: '#314139', fontSize: 24, letterSpacing: 0 }}>{doc.center}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {[88, 76, 94, 62, 82].map((width, lineIndex) => (
          <span
            key={`${width}-${lineIndex}`}
            style={{
              background: lineIndex === index % 5 ? doc.accent : '#dce6df',
              borderRadius: 999,
              display: 'block',
              height: lineIndex === index % 5 ? 13 : 10,
              opacity: lineIndex === index % 5 ? 0.95 : 0.78,
              width: `${width}%`,
            }}
          />
        ))}
      </div>

      <div style={{ alignItems: 'center', display: 'flex', gap: 10, marginTop: 'auto' }}>
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            style={{
              background: item === index % 3 ? doc.accent : '#eef4ef',
              border: '1px solid #dfe7e1',
              borderRadius: 999,
              display: 'block',
              height: 38,
              width: item === index % 3 ? 112 : 50,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function FloatingFinancialSheet({ index }: { index: number }) {
  const frame = useCurrentFrame()
  const doc = classificationPipelineDocs[index % classificationPipelineDocs.length]
  const driftY = Math.sin((frame + index * 37) / 64) * 18
  const driftX = Math.cos((frame + index * 29) / 72) * 14
  const top = [130, 220, 360, 540, 690, 830, 1010, 1180][index % 8]
  const left = [64, 790, 142, 730, 34, 850, 210, 690][index % 8]
  const rotation = [-14, 9, -7, 15, 6, -11, 12, -5][index % 8]
  const bend = [-32, 28, -24, 34, 22, -30, 32, -20][index % 8]
  const tilt = [13, -16, 18, -12, 15, -14, 17, -11][index % 8]

  return (
    <div
      style={{
        filter: 'blur(2.1px)',
        left,
        opacity: 0.2,
        position: 'absolute',
        top,
        transform: `translate(${driftX}px, ${driftY}px) perspective(620px) rotate(${rotation}deg) rotateY(${bend}deg) rotateX(${tilt}deg) skewY(${bend / 6}deg) scale(0.20)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <PipelineDocument doc={doc} index={index} muted />
    </div>
  )
}

function CategoryTag({ doc, opacity }: { doc: ClassificationDocumentItem; opacity: number }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: `1px solid ${doc.accent}`,
        borderRadius: 999,
        boxShadow: '0 20px 48px rgba(20, 24, 22, 0.14)',
        color: '#0f1512',
        display: 'flex',
        gap: 12,
        left: '50%',
        opacity,
        padding: '16px 21px 16px 17px',
        position: 'absolute',
        top: '50%',
        transform: `translate(190px, -94px) scale(${0.94 + opacity * 0.06})`,
        zIndex: 30,
      }}
    >
      <span style={{ background: doc.accent, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
      <span style={{ color: '#65716a', fontSize: 20, fontWeight: 780 }}>Categoria</span>
      <strong style={{ color: doc.accent, fontSize: 28, letterSpacing: 0 }}>{doc.category}</strong>
      <span style={{ background: '#f2f6f3', borderRadius: 999, color: '#516057', fontSize: 20, fontWeight: 800, padding: '7px 10px' }}>
        {doc.confidence}
      </span>
    </div>
  )
}

function ExpenseClassificationPipeline() {
  const frame = useCurrentFrame()
  const cycle = 138
  const activeIndex = Math.floor(frame / cycle) % classificationPipelineDocs.length
  const local = (frame % cycle) / cycle
  const scan = progress(frame % cycle, 34, 78)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at center, rgba(34, 95, 66, 0.18), rgba(246, 248, 245, 0) 54%)', bottom: -160, left: -120, position: 'absolute', right: -120, top: -160 }} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((sheet) => (
        <FloatingFinancialSheet index={sheet} key={sheet} />
      ))}

      <header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '38px 52px', position: 'relative', zIndex: 40 }}>
        <CognitoBrand />
        <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.84)', border: '1px solid #dce6df', borderRadius: 999, boxShadow: '0 16px 36px rgba(20, 24, 22, 0.08)', color: '#314139', display: 'flex', fontSize: 22, fontWeight: 820, gap: 10, padding: '14px 18px' }}>
          <span style={{ background: '#22a06b', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
          IA financeira processando
        </div>
      </header>

      <section style={{ display: 'grid', gap: 12, position: 'absolute', right: 58, top: 226, width: 246, zIndex: 25 }}>
        {[
          ['Docs/min', '184'],
          ['Automacao', '98%'],
          ['Revisao', '12 itens'],
        ].map(([label, value], index) => (
          <div
            key={label}
            style={{
              background: index === 0 ? '#225f42' : 'rgba(255,255,255,0.90)',
              border: `1px solid ${index === 0 ? '#225f42' : '#dfe7e1'}`,
              borderRadius: 20,
              boxShadow: '0 18px 42px rgba(20, 24, 22, 0.09)',
              color: index === 0 ? '#ffffff' : '#0f1512',
              display: 'grid',
              gap: 7,
              padding: '18px 20px',
            }}
          >
            <span style={{ color: index === 0 ? 'rgba(255,255,255,0.76)' : '#65716a', fontSize: 19, fontWeight: 780 }}>{label}</span>
            <strong style={{ fontSize: 31, letterSpacing: 0, lineHeight: 1 }}>{value}</strong>
          </div>
        ))}
      </section>

      <div style={{ height: 1320, left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 780, zIndex: 20 }}>
        <div style={{ background: 'linear-gradient(180deg, rgba(34,95,66,0), rgba(34,95,66,0.18), rgba(34,95,66,0))', bottom: 0, left: '50%', position: 'absolute', top: 0, transform: 'translateX(-50%)', width: 2 }} />
        <div style={{ background: '#225f42', borderRadius: 999, boxShadow: '0 0 34px rgba(34, 95, 66, 0.36)', height: 5, left: 66, opacity: 0.78, position: 'absolute', right: 66, top: 486, transform: `translateY(${scan * 86}px)` }} />

        {[-2, -1, 0, 1, 2].map((slot) => {
          const unit = local + slot * 0.39
          if (unit < -0.06 || unit > 1.08) return null

          const docIndex = (activeIndex + slot + classificationPipelineDocs.length) % classificationPipelineDocs.length
          const doc = classificationPipelineDocs[docIndex]
          const centerScore = 1 - Math.min(Math.abs(unit - 0.5) / 0.5, 1)
          const y = interpolate(unit, [0, 0.28, 0.5, 0.74, 1], [-840, -405, 0, 430, 850], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const scale = 0.7 + centerScore * 0.34
          const opacity = 0.28 + centerScore * 0.72
          const rotation = (docIndex % 2 === 0 ? -1 : 1) * (1.8 - centerScore * 1.2)
          const tagOpacity = interpolate(unit, [0.36, 0.45, 0.64, 0.73], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })

          return (
            <div
              key={`${slot}-${doc.vendor}`}
              style={{
                filter: centerScore > 0.72 ? 'blur(0)' : 'blur(0.7px)',
                left: '50%',
                opacity,
                position: 'absolute',
                top: '50%',
                transform: `translate(-50%, -50%) translateY(${y}px) rotate(${rotation}deg) scale(${scale})`,
                zIndex: Math.round(centerScore * 20) + 10,
              }}
            >
              <PipelineDocument doc={doc} index={docIndex} />
              <CategoryTag doc={doc} opacity={tagOpacity} />
            </div>
          )
        })}
      </div>

      <div style={{ alignItems: 'center', bottom: 58, color: '#65716a', display: 'flex', fontSize: 24, fontWeight: 780, gap: 12, left: 58, position: 'absolute', zIndex: 35 }}>
        <ReceiptText size={28} strokeWidth={2.4} />
        Entrada continua de comprovantes, notas e faturas
      </div>
    </AbsoluteFill>
  )
}

function PremiumSceneShell({ children, status, footer }: { children: ReactNode; status: string; footer: string }) {
  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 46%, rgba(34, 95, 66, 0.16), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '38px 52px', position: 'relative', zIndex: 60 }}>
        <CognitoBrand />
        <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.84)', border: '1px solid #dce6df', borderRadius: 999, boxShadow: '0 16px 36px rgba(20, 24, 22, 0.08)', color: '#314139', display: 'flex', fontSize: 22, fontWeight: 820, gap: 10, padding: '14px 18px' }}>
          <span style={{ background: '#22a06b', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
          {status}
        </div>
      </header>
      {children}
      <div style={{ alignItems: 'center', bottom: 58, color: '#65716a', display: 'flex', fontSize: 24, fontWeight: 780, gap: 12, left: 58, position: 'absolute', zIndex: 55 }}>
        {footer}
      </div>
    </AbsoluteFill>
  )
}

function AnimatedNewsAnimationCard() {
  const frame = useCurrentFrame()
  const active = newsCards[Math.floor(frame / 150) % newsCards.length]
  const local = frame % 150
  const headlineIn = progress(local, 20, 58)
  const imageIn = progress(local, 36, 78)
  const chartIn = progress(local, 58, 98)

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <ChatGptStatusBar />

      <div style={{ alignItems: 'center', borderBottom: '1px solid #e5ece7', display: 'flex', height: 116, justifyContent: 'space-between', left: 0, padding: '0 42px', position: 'absolute', right: 0, top: 102 }}>
        <Menu color="#0f1512" size={44} strokeWidth={2.5} />
        <strong style={{ color: '#0f1512', fontFamily: IOS_REMOTION_DISPLAY_FONT_STACK, fontSize: 39, fontWeight: 700, letterSpacing: 0 }}>The Finance Ledger</strong>
        <span style={{ alignItems: 'center', border: '2px solid #dfe7e1', borderRadius: 999, color: active.accent, display: 'flex', fontSize: 21, fontWeight: 900, height: 46, justifyContent: 'center', width: 46 }}>C</span>
      </div>

      <main style={{ bottom: 0, left: 0, overflow: 'hidden', padding: '38px 42px 0', position: 'absolute', right: 0, top: 218 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 14, marginBottom: 28 }}>
          <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 13, width: 13 }} />
          <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, letterSpacing: 1.6 }}>{active.eyebrow}</span>
          <span style={{ color: '#65716a', fontSize: 22, fontWeight: 760, marginLeft: 'auto' }}>{active.time}</span>
        </div>

        <h1 style={{ color: '#0f1512', fontFamily: IOS_REMOTION_DISPLAY_FONT_STACK, fontSize: 83, fontWeight: 800, letterSpacing: 0, lineHeight: 0.96, margin: '0 0 30px', opacity: headlineIn, transform: `translateY(${(1 - headlineIn) * 24}px)` }}>
            {active.headline}
        </h1>

        <div style={{ alignItems: 'center', color: '#65716a', display: 'flex', fontSize: 24, fontWeight: 760, gap: 14, marginBottom: 36 }}>
          <span>{active.source}</span>
          <span style={{ background: '#dfe7e1', borderRadius: 999, display: 'block', height: 7, width: 7 }} />
          <span>Atualizado agora</span>
        </div>

        <section style={{ background: '#102019', borderRadius: 0, color: '#ffffff', margin: '0 -42px 38px', minHeight: 650, opacity: imageIn, overflow: 'hidden', padding: '42px', position: 'relative', transform: `translateY(${(1 - imageIn) * 22}px)` }}>
          <div style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.10), transparent 44%, ${active.accent}44)`, inset: 0, position: 'absolute' }} />
          <strong style={{ bottom: 260, fontSize: 48, fontWeight: 800, left: 42, letterSpacing: 0, lineHeight: 1.02, position: 'absolute', right: 42 }}>Automacao financeira vira pauta de diretoria</strong>
          <div style={{ alignItems: 'end', bottom: 52, display: 'flex', gap: 16, height: 210, left: 42, opacity: chartIn, position: 'absolute', right: 42 }}>
            {[132, 188, 156, 248, 206, 290].map((height, index) => (
              <span key={height} style={{ background: index === 5 ? active.accent : 'rgba(255,255,255,0.30)', borderRadius: 10, flex: 1, height }} />
            ))}
          </div>
        </section>

        <article style={{ display: 'grid', gap: 24, paddingBottom: 80 }}>
          {[
            'A automação por agentes reduz gargalos do fechamento e aproxima dados financeiros de decisões em tempo real.',
            'O maior impacto aparece em conciliação, classificação de despesas e geração de dashboards executivos.',
            'CFOs passam a revisar exceções, aprovar recomendações e acompanhar riscos antes do fim do ciclo mensal.',
          ].map((paragraph, index) => (
            <p key={paragraph} style={{ color: '#18231d', fontSize: 35, fontWeight: 430, letterSpacing: 0, lineHeight: 1.34, margin: 0, opacity: progress(local, 74 + index * 12, 106 + index * 12), transform: `translateY(${(1 - progress(local, 74 + index * 12, 106 + index * 12)) * 18}px)` }}>
              {paragraph}
            </p>
          ))}
        </article>
      </main>
    </AbsoluteFill>
  )
}

function TweetAnimationCard() {
  const frame = useCurrentFrame()
  const cardIn = progress(frame, 8, 42)
  const textIn = progress(frame, 48, 118)
  const mediaIn = progress(frame, 112, 154)
  const likeCount = Math.round(interpolate(progress(frame, 160, 320), [0, 1], [821, 12640]))
  const repostCount = Math.round(interpolate(progress(frame, 178, 340), [0, 1], [114, 2188]))

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#0f1419', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <ChatGptStatusBar />

      <div style={{ alignItems: 'center', borderBottom: '1px solid #eff3f4', display: 'grid', gridTemplateColumns: '58px 1fr 58px', height: 116, left: 0, padding: '0 34px', position: 'absolute', right: 0, top: 102 }}>
        <ChevronRight color="#0f1419" size={40} strokeWidth={2.5} style={{ transform: 'rotate(180deg)' }} />
        <div style={{ display: 'grid', gap: 2 }}>
          <strong style={{ color: '#0f1419', fontSize: 32, fontWeight: 780, letterSpacing: 0 }}>Post</strong>
          <span style={{ color: '#536471', fontSize: 20, fontWeight: 650 }}>Cognito</span>
        </div>
        <MoreHorizontal color="#0f1419" size={42} strokeWidth={2.8} />
      </div>

      <main style={{ bottom: 0, left: 0, opacity: cardIn, overflow: 'hidden', padding: '34px 34px 0', position: 'absolute', right: 0, top: 218, transform: `translateY(${(1 - cardIn) * 24}px)` }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 18, marginBottom: 28 }}>
          <span style={{ alignItems: 'center', background: '#225f42', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 34, fontWeight: 900, height: 74, justifyContent: 'center', width: 74 }}>C</span>
          <div style={{ display: 'grid', gap: 4 }}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
              <strong style={{ color: '#0f1419', fontSize: 30, letterSpacing: 0 }}>Cognito</strong>
              <span style={{ alignItems: 'center', background: '#1d9bf0', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 15, fontWeight: 900, height: 22, justifyContent: 'center', width: 22 }}>✓</span>
            </div>
            <span style={{ color: '#536471', fontSize: 23, fontWeight: 650 }}>@cognito_ai · 12 min</span>
          </div>
          <span style={{ color: '#536471', fontSize: 36, fontWeight: 900, marginLeft: 'auto' }}>...</span>
        </div>

        <div style={{ display: 'grid', gap: 16, opacity: textIn, transform: `translateY(${(1 - textIn) * 18}px)` }}>
          {tweetText.map((line) => (
            <p key={line} style={{ color: '#0f1419', fontSize: 36, fontWeight: 360, letterSpacing: '-0.6px', lineHeight: 1.28, margin: 0 }}>
              {line}
            </p>
          ))}
        </div>

        <div style={{ background: '#102019', borderRadius: 28, color: '#ffffff', display: 'grid', gap: 22, marginTop: 36, opacity: mediaIn, overflow: 'hidden', padding: 32, transform: `translateY(${(1 - mediaIn) * 20}px)` }}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: 34, letterSpacing: 0 }}>Fechamento automatizado</strong>
            <span style={{ background: '#225f42', borderRadius: 999, fontSize: 23, fontWeight: 850, padding: '11px 15px' }}>+64%</span>
          </div>
          <div style={{ alignItems: 'end', display: 'flex', gap: 14, height: 330 }}>
            {[70, 106, 132, 168, 224, 286].map((height, index) => <span key={height} style={{ background: index > 3 ? '#8aa895' : 'rgba(255,255,255,0.26)', borderRadius: 12, flex: 1, height }} />)}
          </div>
        </div>

        <div style={{ color: '#536471', fontSize: 24, fontWeight: 620, marginTop: 30 }}>8:42 AM · 4 jun 2026</div>

        <div style={{ borderBottom: '1px solid #eff3f4', borderTop: '1px solid #eff3f4', display: 'flex', gap: 24, marginTop: 28, padding: '22px 0' }}>
          <span style={{ color: '#0f1419', fontSize: 26, fontWeight: 800 }}>{repostCount.toLocaleString('en-US')} <span style={{ color: '#536471', fontWeight: 600 }}>Reposts</span></span>
          <span style={{ color: '#0f1419', fontSize: 26, fontWeight: 800 }}>{likeCount.toLocaleString('en-US')} <span style={{ color: '#536471', fontWeight: 600 }}>Likes</span></span>
        </div>

        <div style={{ borderBottom: '1px solid #eff3f4', display: 'flex', justifyContent: 'space-around', padding: '26px 0' }}>
          {[
            ['Reply', '#536471'],
            ['Repost', '#00ba7c'],
            ['Like', '#f91880'],
            ['Share', '#536471'],
          ].map(([label, color], index) => (
            <span key={label} style={{ border: `3px solid ${color}`, borderRadius: index === 2 ? 999 : 8, display: 'block', height: 34, width: 34 }} />
          ))}
        </div>
      </main>
    </AbsoluteFill>
  )
}

function SaaSScreenshotCard({ active = false, item, scale = 1 }: { active?: boolean; item: (typeof galleryItems)[number]; scale?: number }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dfe7e1',
        borderRadius: 26 * scale,
        boxShadow: active ? '0 38px 92px rgba(20, 24, 22, 0.20)' : '0 18px 46px rgba(20, 24, 22, 0.10)',
        display: 'grid',
        gap: 20 * scale,
        height: 430 * scale,
        overflow: 'hidden',
        padding: 24 * scale,
        width: 570 * scale,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gap: 6 * scale }}>
          <span style={{ color: '#65716a', fontSize: 18 * scale, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
          <strong style={{ color: '#0f1512', fontSize: 32 * scale, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
        </div>
        <span style={{ background: '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 16 * scale, color: item.accent, fontSize: 24 * scale, fontWeight: 900, padding: `${11 * scale}px ${14 * scale}px` }}>{item.value}</span>
      </div>
      <div style={{ display: 'grid', gap: 13 * scale, gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[0, 1, 2].map((tile) => (
          <span key={tile} style={{ background: tile === 0 ? item.accent : '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 16 * scale, height: 76 * scale }} />
        ))}
      </div>
      <div style={{ alignItems: 'end', display: 'flex', gap: 10 * scale, height: 160 * scale }}>
        {[72, 112, 88, 148, 124, 178, 106].map((height, index) => (
          <span key={`${height}-${index}`} style={{ background: index === 4 ? item.accent : '#dce6df', borderRadius: 8 * scale, flex: 1, height: height * scale }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 10 * scale }}>
        {[88, 64, 78].map((width, index) => <span key={width} style={{ background: index === 1 ? item.accent : '#e5ece7', borderRadius: 999, display: 'block', height: 10 * scale, width: `${width}%` }} />)}
      </div>
    </div>
  )
}

function GallerySceneHeader({ status }: { status: string }) {
  return (
    <header style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '38px 52px', position: 'relative', zIndex: 40 }}>
      <CognitoBrand />
      <div style={{ alignItems: 'center', background: 'rgba(255,255,255,0.84)', border: '1px solid #dce6df', borderRadius: 999, boxShadow: '0 16px 36px rgba(20, 24, 22, 0.08)', color: '#314139', display: 'flex', fontSize: 22, fontWeight: 820, gap: 10, padding: '14px 18px' }}>
        <span style={{ background: '#22a06b', borderRadius: 999, display: 'block', height: 12, width: 12 }} />
        {status}
      </div>
    </header>
  )
}

function GalleryFooter({ children }: { children: ReactNode }) {
  return (
    <div style={{ alignItems: 'center', bottom: 58, color: '#65716a', display: 'flex', fontSize: 24, fontWeight: 780, gap: 12, left: 58, position: 'absolute', zIndex: 45 }}>
      {children}
    </div>
  )
}

function SaaSCarouselGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 118) % galleryItems.length
  const local = (frame % 118) / 118

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.16), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Carousel de produto" />
      <div style={{ height: 760, left: '50%', opacity: sceneIn, position: 'absolute', top: 520, transform: `translateX(-50%) translateY(${(1 - sceneIn) * 34}px)`, width: 1030 }}>
        {[-2, -1, 0, 1, 2].map((slot) => {
          const itemIndex = (activeIndex + slot + galleryItems.length) % galleryItems.length
          const item = galleryItems[itemIndex]
          const unit = slot - local
          const centerScore = 1 - Math.min(Math.abs(unit) / 2.2, 1)
          const x = unit * 345
          const scale = 0.72 + centerScore * 0.34
          const opacity = 0.28 + centerScore * 0.72
          const rotation = unit * -3.2

          return (
            <div
              key={`${slot}-${item.title}`}
              style={{
                left: '50%',
                opacity,
                position: 'absolute',
                top: 110,
                transform: `translateX(-50%) translateX(${x}px) rotate(${rotation}deg) scale(${scale})`,
                zIndex: Math.round(centerScore * 20) + 5,
              }}
            >
              <SaaSScreenshotCard active={Math.abs(unit) < 0.5} item={item} />
            </div>
          )
        })}
      </div>
      <div style={{ bottom: 168, display: 'flex', gap: 12, justifyContent: 'center', left: 0, position: 'absolute', right: 0, zIndex: 40 }}>
        {galleryItems.map((item, index) => (
          <span key={item.title} style={{ background: index === activeIndex ? item.accent : '#cad8cf', borderRadius: 999, display: 'block', height: 12, width: index === activeIndex ? 46 : 12 }} />
        ))}
      </div>
      <GalleryFooter>Galeria carousel com profundidade, foco central e troca continua</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSBentoGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(63, 109, 145, 0.14), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Bento gallery gerando" />
      <section
        style={{
          display: 'grid',
          gap: 18,
          gridTemplateColumns: '1.15fr 0.85fr',
          gridTemplateRows: '370px 270px 270px',
          left: 74,
          opacity: sceneIn,
          position: 'absolute',
          right: 74,
          top: 300,
          transform: `translateY(${(1 - sceneIn) * 32}px)`,
          zIndex: 20,
        }}
      >
        {galleryItems.slice(0, 5).map((item, index) => {
          const p = progress(frame, 28 + index * 16, 76 + index * 16)
          const large = index === 0
          const tall = index === 1
          return (
            <div
              key={item.title}
              style={{
                background: index === 0 ? '#102019' : '#ffffff',
                border: `1px solid ${index === 0 ? '#102019' : '#dfe7e1'}`,
                borderRadius: 30,
                boxShadow: '0 28px 72px rgba(20, 24, 22, 0.14)',
                color: index === 0 ? '#ffffff' : '#0f1512',
                display: 'grid',
                gap: 20,
                gridColumn: large ? '1 / 2' : undefined,
                gridRow: large ? '1 / 3' : tall ? '1 / 2' : undefined,
                opacity: p,
                overflow: 'hidden',
                padding: 30,
                position: 'relative',
                transform: `translateY(${(1 - p) * 34}px) scale(${0.96 + p * 0.04})`,
              }}
            >
              <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
              <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <span style={{ color: index === 0 ? 'rgba(255,255,255,0.68)' : '#65716a', fontSize: 19, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
                  <strong style={{ color: index === 0 ? '#ffffff' : '#0f1512', fontSize: large ? 48 : 32, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
                </div>
                <span style={{ background: index === 0 ? 'rgba(255,255,255,0.14)' : '#f3f7f4', borderRadius: 16, color: index === 0 ? '#ffffff' : item.accent, fontSize: 22, fontWeight: 900, padding: '11px 14px' }}>{item.value}</span>
              </div>
              <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: large ? 280 : 112, marginTop: 'auto' }}>
                {[82, 136, 104, 196, 152, 236].map((height, bar) => <span key={height} style={{ background: bar === index ? item.accent : index === 0 ? 'rgba(255,255,255,0.26)' : '#dce6df', borderRadius: 10, flex: 1, height: large ? height : height * 0.48 }} />)}
              </div>
            </div>
          )
        })}
      </section>
      <GalleryFooter>Bento grid SaaS com cards modulares entrando em sequencia</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSWallGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const offset = (frame * 2.6) % 360

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(194, 143, 44, 0.13), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Wall de screenshots" />
      <div
        style={{
          height: 1240,
          left: -170,
          opacity: sceneIn,
          position: 'absolute',
          top: 260,
          transform: `rotate(-8deg) translateY(${-offset}px)`,
          width: 1420,
          zIndex: 10,
        }}
      >
        {Array.from({ length: 18 }).map((_, index) => {
          const item = galleryItems[index % galleryItems.length]
          const row = Math.floor(index / 3)
          const column = index % 3
          const p = progress(frame, 10 + index * 5, 58 + index * 5)

          return (
            <div
              key={`${item.title}-${index}`}
              style={{
                left: column * 430 + (row % 2) * 90,
                opacity: p,
                position: 'absolute',
                top: row * 315,
                transform: `scale(${0.64 + p * 0.08})`,
              }}
            >
              <SaaSScreenshotCard item={item} scale={0.72} />
            </div>
          )
        })}
      </div>
      <div style={{ background: 'linear-gradient(180deg, #f4f7f4 0%, rgba(244,247,244,0) 24%, rgba(244,247,244,0) 72%, #f4f7f4 100%)', inset: 0, position: 'absolute', zIndex: 30 }} />
      <div style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid #dfe7e1', borderRadius: 30, boxShadow: '0 32px 90px rgba(20, 24, 22, 0.18)', left: 120, padding: 34, position: 'absolute', right: 120, top: 690, zIndex: 40 }}>
        <span style={{ color: '#65716a', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>Product gallery</span>
        <h2 style={{ color: '#0f1512', fontSize: 64, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 0' }}>Todos os artefatos em movimento continuo</h2>
      </div>
      <GalleryFooter>Wall animado de screenshots, comum em hero sections SaaS</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSStackGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 110) % galleryItems.length
  const local = (frame % 110) / 110

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 47%, rgba(139, 111, 157, 0.14), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Stack gallery" />
      <div style={{ height: 1040, left: '50%', opacity: sceneIn, position: 'absolute', top: 310, transform: `translateX(-50%) translateY(${(1 - sceneIn) * 32}px)`, width: 880, zIndex: 20 }}>
        {galleryItems.map((_, stackIndex) => {
          const itemIndex = (activeIndex + stackIndex) % galleryItems.length
          const item = galleryItems[itemIndex]
          const outgoing = stackIndex === 0 ? progress(local, 0.72, 1) : 0
          const depth = stackIndex
          const y = depth * 44 - outgoing * 520
          const x = depth * 20 - outgoing * 180
          const scale = 1 - depth * 0.045 + outgoing * 0.04
          const rotation = depth * -2.5 - outgoing * 12
          const opacity = depth > 4 ? 0 : 1 - depth * 0.12 - outgoing * 0.35

          return (
            <div
              key={`${item.title}-${stackIndex}`}
              style={{
                left: '50%',
                opacity,
                position: 'absolute',
                top: 115,
                transform: `translateX(-50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
                zIndex: 30 - depth,
              }}
            >
              <SaaSScreenshotCard active={stackIndex === 0} item={item} scale={1.18} />
            </div>
          )
        })}
      </div>
      <div style={{ bottom: 190, display: 'grid', gap: 12, left: 84, position: 'absolute', right: 84, zIndex: 40 }}>
        <span style={{ color: '#65716a', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>Layered product story</span>
        <strong style={{ color: '#0f1512', fontSize: 58, letterSpacing: 0, lineHeight: 1 }}>Cards empilhados revelando telas uma a uma</strong>
      </div>
      <GalleryFooter>Galeria stack com troca de camadas, comum em videos de produto</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSMarqueeGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const offsetA = (frame * 3.2) % 450
  const offsetB = (frame * 2.6) % 450

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 47%, rgba(43, 126, 165, 0.14), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Marquee gallery" />
      <div style={{ left: -260, opacity: sceneIn, position: 'absolute', right: -260, top: 310, transform: `rotate(-5deg) translateY(${(1 - sceneIn) * 32}px)`, zIndex: 10 }}>
        {[0, 1, 2].map((row) => {
          const reverse = row % 2 === 1
          const offset = reverse ? offsetB : offsetA

          return (
            <div
              key={row}
              style={{
                display: 'flex',
                gap: 28,
                marginBottom: 32,
                transform: `translateX(${reverse ? -160 + offset : -offset}px)`,
              }}
            >
              {Array.from({ length: 8 }).map((_, index) => {
                const item = galleryItems[(index + row * 2) % galleryItems.length]
                return (
                  <div key={`${row}-${index}-${item.title}`} style={{ flex: '0 0 auto' }}>
                    <SaaSScreenshotCard item={item} scale={0.72} />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div style={{ background: 'linear-gradient(180deg, #f4f7f4 0%, rgba(244,247,244,0) 20%, rgba(244,247,244,0) 72%, #f4f7f4 100%)', inset: 0, position: 'absolute', zIndex: 30 }} />
      <div style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid #dfe7e1', borderRadius: 32, boxShadow: '0 32px 90px rgba(20, 24, 22, 0.18)', left: 94, padding: 36, position: 'absolute', right: 94, top: 690, zIndex: 40 }}>
        <span style={{ color: '#65716a', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>Infinite interface reel</span>
        <h2 style={{ color: '#0f1512', fontSize: 66, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 0' }}>Uma biblioteca inteira passando em loop</h2>
      </div>
      <GalleryFooter>Galeria marquee com fileiras paralelas e movimento infinito</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSMasonryGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const scroll = (frame * 1.7) % 360
  const cardHeights = [360, 520, 430, 610, 390, 500, 470, 575, 410, 545, 385, 595]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(111, 143, 123, 0.16), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Masonry gallery" />
      <section
        style={{
          display: 'grid',
          gap: 22,
          gridTemplateColumns: 'repeat(3, 1fr)',
          left: 60,
          opacity: sceneIn,
          position: 'absolute',
          right: 60,
          top: 260,
          transform: `translateY(${(1 - sceneIn) * 34}px)`,
          zIndex: 20,
        }}
      >
        {[0, 1, 2].map((column) => (
          <div key={column} style={{ display: 'grid', gap: 22, transform: `translateY(${-scroll + column * 72}px)` }}>
            {Array.from({ length: 4 }).map((_, row) => {
              const index = column * 4 + row
              const item = galleryItems[index % galleryItems.length]
              const p = progress(frame, 14 + index * 8, 58 + index * 8)
              const height = cardHeights[index]

              return (
                <div
                  key={`${item.title}-${column}-${row}`}
                  style={{
                    background: index % 5 === 0 ? '#102019' : '#ffffff',
                    border: `1px solid ${index % 5 === 0 ? '#102019' : '#dfe7e1'}`,
                    borderRadius: 28,
                    boxShadow: '0 26px 68px rgba(20, 24, 22, 0.14)',
                    color: index % 5 === 0 ? '#ffffff' : '#0f1512',
                    display: 'grid',
                    gap: 18,
                    height,
                    opacity: p,
                    overflow: 'hidden',
                    padding: 24,
                    position: 'relative',
                    transform: `translateY(${(1 - p) * 28}px) scale(${0.96 + p * 0.04})`,
                  }}
                >
                  <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
                  <div style={{ display: 'grid', gap: 8 }}>
                    <span style={{ color: index % 5 === 0 ? 'rgba(255,255,255,0.68)' : '#65716a', fontSize: 17, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
                    <strong style={{ color: index % 5 === 0 ? '#ffffff' : '#0f1512', fontSize: 30, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
                  </div>
                  <strong style={{ color: index % 5 === 0 ? '#ffffff' : item.accent, fontSize: 44, letterSpacing: 0, lineHeight: 1 }}>{item.value}</strong>
                  <div style={{ alignItems: 'end', display: 'flex', gap: 9, height: Math.max(96, height - 250), marginTop: 'auto' }}>
                    {[62, 108, 84, 142, 118, 172].map((barHeight, bar) => (
                      <span
                        key={`${barHeight}-${bar}`}
                        style={{
                          background: bar === (index % 6) ? item.accent : index % 5 === 0 ? 'rgba(255,255,255,0.24)' : '#dce6df',
                          borderRadius: 8,
                          flex: 1,
                          height: Math.min(height - 270, barHeight + row * 18),
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </section>
      <div style={{ background: 'linear-gradient(180deg, #f4f7f4 0%, rgba(244,247,244,0) 19%, rgba(244,247,244,0) 72%, #f4f7f4 100%)', inset: 0, position: 'absolute', zIndex: 30 }} />
      <div style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid #dfe7e1', borderRadius: 30, boxShadow: '0 30px 84px rgba(20,24,22,0.16)', left: 86, padding: 34, position: 'absolute', right: 86, top: 670, zIndex: 40 }}>
        <span style={{ color: '#65716a', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>Variable height collection</span>
        <h2 style={{ color: '#0f1512', fontSize: 62, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 0' }}>Screenshots organizados por peso visual</h2>
      </div>
      <GalleryFooter>Galeria masonry com cards de alturas diferentes e scroll continuo</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSTimelineGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 118) % galleryItems.length
  const local = (frame % 118) / 118
  const active = galleryItems[activeIndex]
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 48%, ${active.accent}24, rgba(244, 247, 244, 0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Timeline gallery" />
      <section style={{ left: 78, opacity: sceneIn, position: 'absolute', right: 78, top: 305, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 12, marginBottom: 42 }}>
          <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, textTransform: 'uppercase' }}>Chronological collection</span>
          <h2 style={{ color: '#0f1512', fontSize: 68, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: 0 }}>Evolucao das telas por etapa</h2>
        </div>
        <div style={{ background: '#dce6df', borderRadius: 999, height: 9, left: 16, position: 'absolute', right: 16, top: 210 }} />
        <div style={{ background: active.accent, borderRadius: 999, height: 9, left: 16, position: 'absolute', top: 210, width: `${Math.min(92, (activeIndex + local) * 15.4)}%` }} />
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(6, 1fr)', marginTop: 72 }}>
          {galleryItems.map((item, index) => {
            const distance = Math.abs(index - activeIndex)
            const activeDot = index === activeIndex
            const p = progress(frame, 28 + index * 13, 74 + index * 13)

            return (
              <div
                key={item.title}
                style={{
                  display: 'grid',
                  gap: 18,
                  opacity: p,
                  transform: `translateY(${activeDot ? -18 : 0}px) scale(${activeDot ? 1.04 : 0.96})`,
                  zIndex: activeDot ? 30 : 10 - distance,
                }}
              >
                <span style={{ alignItems: 'center', background: activeDot ? item.accent : '#ffffff', border: `4px solid ${activeDot ? item.accent : '#dce6df'}`, borderRadius: 999, boxShadow: activeDot ? `0 18px 48px ${item.accent}42` : 'none', color: activeDot ? '#ffffff' : '#65716a', display: 'flex', fontSize: 21, fontWeight: 900, height: 68, justifyContent: 'center', margin: '0 auto', width: 68 }}>{months[index]}</span>
                <div style={{ background: activeDot ? '#102019' : '#ffffff', border: `1px solid ${activeDot ? '#102019' : '#dfe7e1'}`, borderRadius: 24, boxShadow: activeDot ? '0 32px 84px rgba(20,24,22,0.20)' : '0 18px 46px rgba(20,24,22,0.10)', color: activeDot ? '#ffffff' : '#0f1512', display: 'grid', gap: 14, minHeight: activeDot ? 430 : 360, padding: 22 }}>
                  <span style={{ color: activeDot ? 'rgba(255,255,255,0.66)' : '#65716a', fontSize: 16, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
                  <strong style={{ color: activeDot ? '#ffffff' : '#0f1512', fontSize: activeDot ? 29 : 24, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
                  <span style={{ color: activeDot ? '#ffffff' : item.accent, fontSize: activeDot ? 35 : 28, fontWeight: 900 }}>{item.value}</span>
                  <div style={{ alignItems: 'end', display: 'flex', gap: 7, height: activeDot ? 148 : 102, marginTop: 'auto' }}>
                    {[58, 92, 74, 118, 96].map((height, bar) => <span key={height} style={{ background: bar === index % 5 ? item.accent : activeDot ? 'rgba(255,255,255,0.22)' : '#dce6df', borderRadius: 7, flex: 1, height: activeDot ? height : height * 0.72 }} />)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
      <GalleryFooter>Galeria timeline organizando telas em uma narrativa cronologica</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSMosaicGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 126) % galleryItems.length
  const active = galleryItems[activeIndex]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 48%, ${active.accent}22, rgba(244, 247, 244, 0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Mosaic gallery" />
      <section
        style={{
          display: 'grid',
          gap: 22,
          gridTemplateColumns: '1.35fr 0.65fr',
          gridTemplateRows: '360px 250px 250px',
          left: 68,
          opacity: sceneIn,
          position: 'absolute',
          right: 68,
          top: 280,
          transform: `translateY(${(1 - sceneIn) * 34}px)`,
          zIndex: 20,
        }}
      >
        {galleryItems.map((item, index) => {
          const p = progress(frame, 18 + index * 12, 66 + index * 12)
          const featured = index === activeIndex
          const slot = (index - activeIndex + galleryItems.length) % galleryItems.length
          const gridColumn = featured ? '1 / 2' : slot === 1 || slot === 2 ? '2 / 3' : undefined
          const gridRow = featured ? '1 / 4' : slot === 1 ? '1 / 2' : slot === 2 ? '2 / 3' : undefined
          const visible = featured || slot <= 4

          if (!visible) {
            return null
          }

          return (
            <div
              key={`${item.title}-${index}`}
              style={{
                background: featured ? '#102019' : '#ffffff',
                border: `1px solid ${featured ? '#102019' : '#dfe7e1'}`,
                borderRadius: featured ? 34 : 26,
                boxShadow: featured ? '0 44px 110px rgba(20,24,22,0.22)' : '0 22px 58px rgba(20,24,22,0.12)',
                color: featured ? '#ffffff' : '#0f1512',
                display: 'grid',
                gap: featured ? 28 : 16,
                gridColumn,
                gridRow,
                minHeight: slot === 3 || slot === 4 ? 250 : undefined,
                opacity: p,
                overflow: 'hidden',
                padding: featured ? 34 : 24,
                position: 'relative',
                transform: `translateY(${(1 - p) * 28}px) scale(${0.96 + p * 0.04})`,
              }}
            >
              <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
              <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <span style={{ color: featured ? 'rgba(255,255,255,0.68)' : '#65716a', fontSize: featured ? 22 : 17, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
                  <strong style={{ color: featured ? '#ffffff' : '#0f1512', fontSize: featured ? 60 : 27, letterSpacing: 0, lineHeight: 0.98 }}>{item.title}</strong>
                </div>
                <span style={{ background: featured ? 'rgba(255,255,255,0.13)' : '#f3f7f4', borderRadius: featured ? 18 : 15, color: featured ? '#ffffff' : item.accent, fontSize: featured ? 26 : 20, fontWeight: 900, padding: featured ? '13px 17px' : '10px 12px' }}>{item.value}</span>
              </div>
              <div style={{ display: 'grid', gap: featured ? 18 : 11, gridTemplateColumns: 'repeat(3, 1fr)', marginTop: featured ? 18 : 'auto' }}>
                {[0, 1, 2, 3, 4, 5].map((tile) => (
                  <span
                    key={tile}
                    style={{
                      background: tile === index % 6 ? item.accent : featured ? 'rgba(255,255,255,0.16)' : '#e5ece7',
                      borderRadius: featured ? 18 : 13,
                      display: 'block',
                      height: featured ? (tile === 0 ? 180 : 116) : 48,
                    }}
                  />
                ))}
              </div>
              {featured ? (
                <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: 240, marginTop: 'auto' }}>
                  {[88, 138, 112, 196, 150, 228, 178].map((height, bar) => <span key={height} style={{ background: bar === 4 ? item.accent : 'rgba(255,255,255,0.20)', borderRadius: 10, flex: 1, height }} />)}
                </div>
              ) : null}
            </div>
          )
        })}
      </section>
      <GalleryFooter>Galeria mosaic com uma tela dominante e previews ao redor</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSPageFlipGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const cycle = 126
  const activeIndex = Math.floor(frame / cycle) % galleryItems.length
  const nextIndex = (activeIndex + 1) % galleryItems.length
  const local = frame % cycle
  const flip = progress(local, 42, 104)
  const active = galleryItems[activeIndex]
  const next = galleryItems[nextIndex]
  const rotateY = -178 * flip
  const shadow = 0.18 + Math.sin(flip * Math.PI) * 0.34

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 48%, ${active.accent}24, rgba(244, 247, 244, 0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Page flip gallery" />
      <section
        style={{
          height: 980,
          left: '50%',
          opacity: sceneIn,
          perspective: 1500,
          position: 'absolute',
          top: 310,
          transform: `translateX(-50%) translateY(${(1 - sceneIn) * 34}px)`,
          width: 880,
          zIndex: 20,
        }}
      >
        <div style={{ background: '#102019', borderRadius: 44, bottom: 28, filter: 'blur(28px)', left: 48, opacity: 0.15, position: 'absolute', right: 48, top: 820 }} />
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #dfe7e1',
            borderRadius: 38,
            boxShadow: '0 44px 110px rgba(20,24,22,0.20)',
            height: 760,
            left: '50%',
            overflow: 'hidden',
            position: 'absolute',
            top: 54,
            transform: 'translateX(-50%) rotateX(3deg)',
            transformStyle: 'preserve-3d',
            width: 680,
          }}
        >
          <div style={{ background: '#f7faf7', bottom: 0, left: '50%', position: 'absolute', top: 0, width: 2, zIndex: 30 }} />
          <div style={{ background: '#ffffff', bottom: 0, left: 0, padding: 34, position: 'absolute', top: 0, width: '50%' }}>
            <span style={{ color: '#65716a', fontSize: 18, fontWeight: 850, textTransform: 'uppercase' }}>{active.label}</span>
            <h2 style={{ color: '#0f1512', fontSize: 42, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 20px' }}>{active.title}</h2>
            <strong style={{ color: active.accent, fontSize: 54, letterSpacing: 0, lineHeight: 1 }}>{active.value}</strong>
            <div style={{ alignItems: 'end', display: 'flex', gap: 8, height: 250, marginTop: 48 }}>
              {[72, 128, 98, 172, 134].map((height, index) => <span key={height} style={{ background: index === 3 ? active.accent : '#dce6df', borderRadius: 8, flex: 1, height }} />)}
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 44 }}>
              {[84, 68, 92, 56].map((width, index) => <span key={width} style={{ background: index === 1 ? active.accent : '#e5ece7', borderRadius: 999, display: 'block', height: 10, width: `${width}%` }} />)}
            </div>
          </div>
          <div style={{ background: '#ffffff', bottom: 0, padding: 34, position: 'absolute', right: 0, top: 0, width: '50%' }}>
            <span style={{ color: '#65716a', fontSize: 18, fontWeight: 850, textTransform: 'uppercase' }}>{next.label}</span>
            <h2 style={{ color: '#0f1512', fontSize: 42, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 20px' }}>{next.title}</h2>
            <strong style={{ color: next.accent, fontSize: 54, letterSpacing: 0, lineHeight: 1 }}>{next.value}</strong>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr', marginTop: 52 }}>
              {[0, 1, 2, 3, 4, 5].map((tile) => <span key={tile} style={{ background: tile === 2 ? next.accent : '#e5ece7', borderRadius: 16, display: 'block', height: tile === 0 ? 132 : 88 }} />)}
            </div>
          </div>
          <div
            style={{
              background: '#ffffff',
              bottom: 0,
              boxShadow: `-24px 0 54px rgba(20,24,22,${shadow})`,
              left: '50%',
              overflow: 'hidden',
              padding: 34,
              position: 'absolute',
              top: 0,
              transform: `rotateY(${rotateY}deg)`,
              transformOrigin: '0% 50%',
              transformStyle: 'preserve-3d',
              width: '50%',
              zIndex: 40,
            }}
          >
            <div style={{ backfaceVisibility: 'hidden', display: 'grid', gap: 18 }}>
              <span style={{ color: '#65716a', fontSize: 18, fontWeight: 850, textTransform: 'uppercase' }}>{active.label}</span>
              <h2 style={{ color: '#0f1512', fontSize: 42, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: 0 }}>{active.title}</h2>
              <strong style={{ color: active.accent, fontSize: 54, letterSpacing: 0, lineHeight: 1 }}>{active.value}</strong>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr', marginTop: 34 }}>
                {[0, 1, 2, 3, 4, 5].map((tile) => <span key={tile} style={{ background: tile === 1 ? active.accent : '#e5ece7', borderRadius: 16, display: 'block', height: tile === 0 ? 132 : 88 }} />)}
              </div>
            </div>
            <div style={{ background: `linear-gradient(90deg, rgba(16,32,25,${shadow}), rgba(16,32,25,0))`, bottom: 0, left: 0, pointerEvents: 'none', position: 'absolute', top: 0, width: 70 }} />
          </div>
        </div>
        <div style={{ bottom: 58, display: 'flex', gap: 12, justifyContent: 'center', left: 0, position: 'absolute', right: 0 }}>
          {galleryItems.map((item, index) => (
            <span key={item.title} style={{ background: index === activeIndex ? item.accent : '#cad8cf', borderRadius: 999, display: 'block', height: 12, width: index === activeIndex ? 46 : 12 }} />
          ))}
        </div>
      </section>
      <GalleryFooter>Galeria page flip simulando paginas virando em perspectiva</GalleryFooter>
    </AbsoluteFill>
  )
}

function ReportTransitionPage({ accent, index, title }: { accent: string; index: number; title: string }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid rgba(226,232,240,0.95)', borderRadius: 18, boxShadow: '0 28px 70px rgba(15,23,42,0.28)', color: '#182235', display: 'grid', gap: 16, height: 560, overflow: 'hidden', padding: 24, position: 'relative', width: 300 }}>
      <span style={{ background: accent, borderRadius: 999, display: 'block', height: 7, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <div style={{ display: 'grid', gap: 5 }}>
        <span style={{ color: '#64748b', fontSize: 13, fontWeight: 900, textTransform: 'uppercase' }}>0{index + 1} · {title}</span>
        <strong style={{ color: '#0f172a', fontSize: 23, fontWeight: 900, letterSpacing: 0, lineHeight: 1 }}>Relatório financeiro</strong>
      </div>
      <div style={{ display: 'grid', gap: 9 }}>
        {[88, 62, 74].map((width, line) => <span key={width} style={{ background: line === 0 ? accent : '#dbe4ef', borderRadius: 999, display: 'block', height: line === 0 ? 9 : 7, width: `${width}%` }} />)}
      </div>
      <div style={{ alignItems: 'end', display: 'flex', gap: 8, height: 155, marginTop: 4 }}>
        {[72, 112, 86, 142, 118, 176, 136].map((height, bar) => <span key={height} style={{ background: bar === index + 2 ? accent : '#dbe4ef', borderRadius: 7, flex: 1, height }} />)}
      </div>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '112px 1fr' }}>
        <div style={{ alignItems: 'center', border: `18px solid ${accent}`, borderLeftColor: '#dbe4ef', borderRadius: 999, display: 'flex', height: 104, justifyContent: 'center', width: 104 }}>
          <span style={{ color: accent, fontSize: 18, fontWeight: 900 }}>{index === 0 ? '72%' : index === 1 ? '48%' : '63%'}</span>
        </div>
        <div style={{ display: 'grid', gap: 8, alignContent: 'center' }}>
          {[54, 78, 46].map((width, line) => <span key={width} style={{ background: line === 1 ? accent : '#dbe4ef', borderRadius: 999, display: 'block', height: 8, width: `${width}%` }} />)}
        </div>
      </div>
      <svg height="96" style={{ marginTop: 'auto', overflow: 'visible' }} viewBox="0 0 250 96" width="100%">
        <path d="M0 72 C34 48, 58 62, 88 42 C122 18, 154 44, 184 28 C214 12, 230 30, 250 18" fill="none" stroke={accent} strokeLinecap="round" strokeWidth="8" />
        <path d="M0 82 C36 68, 62 78, 96 58 C128 39, 158 62, 190 45 C222 27, 238 42, 250 34" fill="none" opacity="0.25" stroke={accent} strokeLinecap="round" strokeWidth="8" />
      </svg>
    </div>
  )
}

function SaaSPageTransitionGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const turn = progress(frame % 126, 34, 104)
  const foldWidth = 110 + Math.sin(turn * Math.PI) * 92
  const foldRotate = -10 - turn * 62
  const foldX = 265 + turn * 228
  const pages = [
    { accent: '#5b6ee1', title: 'Receitas' },
    { accent: '#8b5cf6', title: 'Margem' },
    { accent: '#0f766e', title: 'Despesas' },
  ]

  return (
    <AbsoluteFill style={{ background: '#07101f', color: '#ffffff', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 44%, rgba(91,110,225,0.34), rgba(7,16,31,0) 58%)', bottom: -160, left: -160, position: 'absolute', right: -160, top: -160 }} />
      <header style={{ display: 'grid', gap: 10, left: 58, position: 'absolute', right: 58, top: 64, zIndex: 40 }}>
        <span style={{ color: '#dbeafe', fontSize: 28, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>7. Transição entre páginas</span>
        <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 23, fontWeight: 680 }}>Transições modernas como virada de página ou zoom entre páginas.</span>
      </header>
      <section style={{ height: 760, left: 50, opacity: sceneIn, perspective: 1300, position: 'absolute', right: 50, top: 365, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        {pages.map((page, index) => (
          <div key={page.title} style={{ left: 18 + index * 338, position: 'absolute', top: index === 1 ? 0 : 26, transform: `rotateY(${index === 0 ? -4 : index === 2 ? 4 : 0}deg) scale(${index === 1 ? 1.06 : 1})`, transformStyle: 'preserve-3d', zIndex: index === 1 ? 24 : 18 }}>
            <ReportTransitionPage accent={page.accent} index={index} title={page.title} />
          </div>
        ))}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(248,250,252,0.96), rgba(203,213,225,0.72), rgba(248,250,252,0.94))',
            border: '1px solid rgba(226,232,240,0.8)',
            borderRadius: '16px 8px 8px 16px',
            boxShadow: '28px 0 54px rgba(15,23,42,0.32)',
            height: 560,
            left: foldX,
            opacity: sceneIn,
            overflow: 'hidden',
            position: 'absolute',
            top: 5,
            transform: `rotateY(${foldRotate}deg) skewY(${2 + Math.sin(turn * Math.PI) * 5}deg)`,
            transformOrigin: '0% 50%',
            width: foldWidth,
            zIndex: 42,
          }}
        >
          <div style={{ background: 'linear-gradient(90deg, rgba(15,23,42,0.18), transparent 40%, rgba(255,255,255,0.42))', inset: 0, position: 'absolute' }} />
          <div style={{ display: 'grid', gap: 12, padding: 22 }}>
            {[72, 56, 82, 48].map((width) => <span key={width} style={{ background: '#cbd5e1', borderRadius: 999, display: 'block', height: 8, width: `${width}%` }} />)}
          </div>
        </div>
      </section>
      <GalleryFooter>Galeria de transição entre páginas com folha virando entre relatórios</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSFilmstripGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 104) % galleryItems.length
  const active = galleryItems[activeIndex]
  const offset = (frame * 3.2) % 258

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 48%, ${active.accent}22, rgba(244, 247, 244, 0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Filmstrip gallery" />
      <section style={{ left: 64, opacity: sceneIn, position: 'absolute', right: 64, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ background: '#102019', borderRadius: 36, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', height: 760, overflow: 'hidden', padding: 34, position: 'relative' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <span style={{ color: '#8aa895', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>{active.label}</span>
            <strong style={{ color: '#ffffff', fontSize: 64, letterSpacing: 0, lineHeight: 0.98 }}>{active.title}</strong>
          </div>
          <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: 310, marginTop: 64 }}>
            {[96, 146, 118, 210, 164, 286, 230].map((height, index) => <span key={height} style={{ background: index === activeIndex % 7 ? active.accent : 'rgba(255,255,255,0.18)', borderRadius: 10, flex: 1, height }} />)}
          </div>
          <strong style={{ bottom: 42, color: '#ffffff', fontSize: 58, letterSpacing: 0, position: 'absolute', right: 42 }}>{active.value}</strong>
        </div>
        <div style={{ background: '#111a15', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 28, boxShadow: '0 26px 70px rgba(20,24,22,0.18)', height: 170, marginTop: 34, overflow: 'hidden', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 18, left: -offset, position: 'absolute', top: 18 }}>
            {Array.from({ length: 12 }).map((_, index) => {
              const item = galleryItems[index % galleryItems.length]
              const activeFrame = index % galleryItems.length === activeIndex
              return (
                <div key={`${item.title}-${index}`} style={{ background: '#ffffff', border: `4px solid ${activeFrame ? item.accent : '#ffffff'}`, borderRadius: 16, flex: '0 0 auto', height: 134, overflow: 'hidden', padding: 12, width: 218 }}>
                  <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 8, marginBottom: 14, width: activeFrame ? 96 : 54 }} />
                  <strong style={{ color: '#0f1512', display: 'block', fontSize: 20, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
                  <span style={{ color: item.accent, display: 'block', fontSize: 24, fontWeight: 900, marginTop: 14 }}>{item.value}</span>
                </div>
              )
            })}
          </div>
          {[0, 1].map((row) => (
            <div key={row} style={{ display: 'flex', gap: 18, left: 18, position: 'absolute', right: 18, top: row === 0 ? 8 : 146 }}>
              {Array.from({ length: 14 }).map((_, index) => <span key={index} style={{ background: '#f4f7f4', borderRadius: 3, display: 'block', height: 8, width: 18 }} />)}
            </div>
          ))}
        </div>
      </section>
      <GalleryFooter>Galeria filmstrip com frames passando como rolo de filme</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSLightboxGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 118) % galleryItems.length
  const active = galleryItems[activeIndex]
  const pulse = 1 + Math.sin(frame / 22) * 0.018

  return (
    <AbsoluteFill style={{ background: '#17201b', color: '#ffffff', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 45%, ${active.accent}34, rgba(23, 32, 27, 0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Lightbox gallery" />
      <section style={{ left: 70, opacity: sceneIn, position: 'absolute', right: 70, top: 310, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ background: '#ffffff', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 38, boxShadow: `0 44px 120px ${active.accent}32`, color: '#0f1512', display: 'grid', gap: 28, minHeight: 780, padding: 36, transform: `scale(${pulse})` }}>
          <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, textTransform: 'uppercase' }}>{active.label}</span>
              <strong style={{ color: '#0f1512', fontSize: 66, letterSpacing: 0, lineHeight: 0.98 }}>{active.title}</strong>
            </div>
            <span style={{ background: '#f3f7f4', borderRadius: 18, color: active.accent, fontSize: 28, fontWeight: 900, padding: '14px 18px' }}>{active.value}</span>
          </div>
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1.2fr 0.8fr' }}>
            <div style={{ alignItems: 'end', background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 28, display: 'flex', gap: 13, height: 360, padding: 24 }}>
              {[88, 138, 112, 196, 150, 228, 178].map((height, bar) => <span key={height} style={{ background: bar === 4 ? active.accent : '#dce6df', borderRadius: 10, flex: 1, height }} />)}
            </div>
            <div style={{ display: 'grid', gap: 18 }}>
              {[0, 1, 2].map((tile) => <span key={tile} style={{ background: tile === 1 ? active.accent : '#e5ece7', borderRadius: 22, display: 'block', height: 108 }} />)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 34 }}>
          {galleryItems.map((item, index) => (
            <div key={item.title} style={{ background: index === activeIndex ? item.accent : 'rgba(255,255,255,0.16)', border: `1px solid ${index === activeIndex ? item.accent : 'rgba(255,255,255,0.18)'}`, borderRadius: 18, height: 96, opacity: index === activeIndex ? 1 : 0.72, padding: 12, width: 128 }}>
              <span style={{ background: index === activeIndex ? '#ffffff' : item.accent, borderRadius: 999, display: 'block', height: 8, marginBottom: 12, width: 48 }} />
              <strong style={{ color: '#ffffff', display: 'block', fontSize: 15, letterSpacing: 0, lineHeight: 1 }}>{item.label}</strong>
            </div>
          ))}
        </div>
      </section>
      <GalleryFooter>Galeria lightbox com item ampliado e miniaturas abaixo</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSFolderTabsGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 112) % galleryItems.length
  const active = galleryItems[activeIndex]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 48%, ${active.accent}22, rgba(244,247,244,0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Folder tabs gallery" />
      <section style={{ left: 64, opacity: sceneIn, position: 'absolute', right: 64, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'flex', gap: 10, paddingLeft: 22 }}>
          {galleryItems.map((item, index) => {
            const activeTab = index === activeIndex
            return (
              <div key={item.title} style={{ background: activeTab ? '#ffffff' : '#e5ece7', border: '1px solid #dfe7e1', borderBottom: activeTab ? '1px solid #ffffff' : '1px solid #dfe7e1', borderRadius: '22px 22px 0 0', color: activeTab ? item.accent : '#65716a', fontSize: 20, fontWeight: 900, padding: '18px 22px', transform: `translateY(${activeTab ? 0 : 18}px)`, zIndex: activeTab ? 30 : 10 }}>
                {item.label}
              </div>
            )
          })}
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 34, boxShadow: '0 40px 100px rgba(20,24,22,0.18)', display: 'grid', gap: 30, minHeight: 760, padding: 40, position: 'relative', zIndex: 20 }}>
          <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
          <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, textTransform: 'uppercase' }}>Active folder</span>
              <strong style={{ color: '#0f1512', fontSize: 68, letterSpacing: 0, lineHeight: 0.98 }}>{active.title}</strong>
            </div>
            <span style={{ background: '#f3f7f4', borderRadius: 18, color: active.accent, fontSize: 28, fontWeight: 900, padding: '14px 18px' }}>{active.value}</span>
          </div>
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[0, 1, 2, 3, 4, 5].map((tile) => <span key={tile} style={{ background: tile === activeIndex % 6 ? active.accent : '#e5ece7', borderRadius: 22, display: 'block', height: tile === 0 ? 190 : 126 }} />)}
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {[86, 72, 92, 58].map((width, index) => <span key={width} style={{ background: index === 2 ? active.accent : '#e5ece7', borderRadius: 999, display: 'block', height: 12, width: `${width}%` }} />)}
          </div>
        </div>
      </section>
      <GalleryFooter>Galeria folder tabs com abas revelando cada item</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSStackedPagesGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 112) % galleryItems.length
  const local = (frame % 112) / 112

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(63, 109, 145, 0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Stacked pages gallery" />
      <section style={{ height: 1000, left: '50%', opacity: sceneIn, position: 'absolute', top: 318, transform: `translateX(-50%) translateY(${(1 - sceneIn) * 34}px)`, width: 800, zIndex: 20 }}>
        {galleryItems.map((_, stackIndex) => {
          const item = galleryItems[(activeIndex + stackIndex) % galleryItems.length]
          const slide = stackIndex === 0 ? progress(local, 0.68, 1) : 0
          const depth = stackIndex
          const x = depth * 24 + slide * 620
          const y = depth * 34 + slide * -90
          const rotate = depth * -2.2 + slide * 10
          const opacity = depth > 4 ? 0 : 1 - depth * 0.13 - slide * 0.35

          return (
            <div key={`${item.title}-${stackIndex}`} style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 34, boxShadow: '0 34px 90px rgba(20,24,22,0.18)', display: 'grid', gap: 24, height: 720, left: '50%', opacity, overflow: 'hidden', padding: 36, position: 'absolute', top: 56, transform: `translateX(-50%) translate(${x}px, ${y}px) rotate(${rotate}deg)`, width: 620, zIndex: 30 - depth }}>
              <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
              <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <span style={{ color: '#65716a', fontSize: 21, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
                  <strong style={{ color: '#0f1512', fontSize: 54, letterSpacing: 0, lineHeight: 0.98 }}>{item.title}</strong>
                </div>
                <span style={{ color: item.accent, fontSize: 30, fontWeight: 900 }}>{item.value}</span>
              </div>
              <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: 280, marginTop: 'auto' }}>
                {[88, 138, 112, 196, 150, 228].map((height, bar) => <span key={height} style={{ background: bar === depth ? item.accent : '#dce6df', borderRadius: 10, flex: 1, height }} />)}
              </div>
            </div>
          )
        })}
      </section>
      <GalleryFooter>Galeria stacked pages com paginas deslizando da pilha</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSInfiniteCanvasGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const panX = Math.sin(frame / 70) * 160
  const panY = Math.cos(frame / 82) * 120
  const activeIndex = Math.floor(frame / 96) % galleryItems.length

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ backgroundImage: 'linear-gradient(rgba(34,95,66,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,95,66,0.08) 1px, transparent 1px)', backgroundSize: '80px 80px', inset: 0, opacity: sceneIn, position: 'absolute', transform: `translate(${panX * -0.25}px, ${panY * -0.25}px)` }} />
      <GallerySceneHeader status="Infinite canvas gallery" />
      <section style={{ inset: 0, opacity: sceneIn, position: 'absolute', transform: `translate(${panX}px, ${panY}px)`, zIndex: 20 }}>
        {Array.from({ length: 11 }).map((_, index) => {
          const item = galleryItems[index % galleryItems.length]
          const active = index % galleryItems.length === activeIndex
          const col = index % 4
          const row = Math.floor(index / 4)
          const x = 90 + col * 310 + (row % 2) * 86
          const y = 280 + row * 305
          const scale = active ? 1.08 : 0.78

          return (
            <div key={`${item.title}-${index}`} style={{ left: x, position: 'absolute', top: y, transform: `scale(${scale}) rotate(${(index % 5 - 2) * 2.4}deg)`, zIndex: active ? 40 : 10 }}>
              <SaaSScreenshotCard active={active} item={item} scale={0.66} />
            </div>
          )
        })}
      </section>
      <div style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid #dfe7e1', borderRadius: 30, boxShadow: '0 30px 84px rgba(20,24,22,0.16)', left: 86, padding: 34, position: 'absolute', right: 86, top: 690, zIndex: 50 }}>
        <span style={{ color: '#65716a', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>Camera pan</span>
        <h2 style={{ color: '#0f1512', fontSize: 62, fontWeight: 850, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 0' }}>Um canvas infinito de telas navegaveis</h2>
      </div>
      <GalleryFooter>Galeria infinite canvas com camera navegando entre cards</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSSpotlightGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 132) % galleryItems.length
  const active = galleryItems[activeIndex]
  const local = frame % 132
  const calloutIn = progress(local, 30, 72)
  const pulse = 1 + Math.sin(frame / 16) * 0.035

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: `radial-gradient(circle at 50% 47%, ${active.accent}26, rgba(244, 247, 244, 0) 58%)`, bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Spotlight gallery" />
      <div
        style={{
          left: '50%',
          opacity: sceneIn,
          position: 'absolute',
          top: 350,
          transform: `translateX(-50%) translateY(${(1 - sceneIn) * 34}px)`,
          width: 820,
          zIndex: 20,
        }}
      >
        <div style={{ background: '#102019', border: '1px solid #102019', borderRadius: 36, boxShadow: '0 44px 110px rgba(20, 24, 22, 0.22)', color: '#ffffff', overflow: 'hidden', padding: 36, position: 'relative' }}>
          <span style={{ background: active.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
          <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 10 }}>
              <span style={{ color: 'rgba(255,255,255,0.66)', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>{active.label}</span>
              <strong style={{ color: '#ffffff', fontSize: 64, letterSpacing: 0, lineHeight: 0.98 }}>{active.title}</strong>
            </div>
            <span style={{ background: 'rgba(255,255,255,0.14)', borderRadius: 18, color: '#ffffff', fontSize: 26, fontWeight: 900, padding: '13px 17px' }}>{active.value}</span>
          </div>
          <div style={{ background: '#ffffff', borderRadius: 28, display: 'grid', gap: 18, marginTop: 36, padding: 24 }}>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[0, 1, 2].map((item) => <span key={item} style={{ background: item === 1 ? active.accent : '#f3f7f4', border: '1px solid #dfe7e1', borderRadius: 18, height: 108 }} />)}
            </div>
            <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: 260 }}>
              {[96, 146, 118, 210, 164, 286, 230].map((height, index) => <span key={height} style={{ background: index === activeIndex % 7 ? active.accent : '#dce6df', borderRadius: 10, flex: 1, height }} />)}
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {[86, 72, 92, 58].map((width, index) => <span key={width} style={{ background: index === 2 ? active.accent : '#e5ece7', borderRadius: 999, display: 'block', height: 12, width: `${width}%` }} />)}
            </div>
          </div>
        </div>
        {[
          { label: 'Insight', left: -32, top: 330, value: active.value },
          { label: 'Sync', left: 584, top: 520, value: 'Live' },
          { label: 'Quality', left: 516, top: 156, value: '99%' },
        ].map((callout, index) => (
          <div
            key={callout.label}
            style={{
              background: '#ffffff',
              border: `1px solid ${active.accent}`,
              borderRadius: 22,
              boxShadow: '0 24px 60px rgba(20, 24, 22, 0.16)',
              display: 'grid',
              gap: 8,
              left: callout.left,
              opacity: calloutIn,
              padding: '18px 22px',
              position: 'absolute',
              top: callout.top,
              transform: `scale(${0.9 + calloutIn * 0.1}) translateY(${Math.sin((frame + index * 18) / 24) * 7}px)`,
              width: 220,
              zIndex: 30,
            }}
          >
            <span style={{ color: '#65716a', fontSize: 18, fontWeight: 850 }}>{callout.label}</span>
            <strong style={{ color: active.accent, fontSize: 34, letterSpacing: 0 }}>{callout.value}</strong>
          </div>
        ))}
        <span style={{ border: `4px solid ${active.accent}`, borderRadius: 28, display: 'block', height: 164, left: 272, opacity: 0.84, position: 'absolute', top: 380, transform: `scale(${pulse})`, width: 248, zIndex: 28 }} />
      </div>
      <GalleryFooter>Galeria spotlight com zoom em uma tela e detalhes flutuantes</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSBeforeAfterAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const slider = interpolate(Math.sin(frame / 34), [-1, 1], [0.22, 0.78])
  const reveal = progress(frame, 42, 92)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.16), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Before / after" />
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #dfe7e1',
          borderRadius: 36,
          boxShadow: '0 44px 110px rgba(20, 24, 22, 0.20)',
          height: 940,
          left: 74,
          opacity: sceneIn,
          overflow: 'hidden',
          position: 'absolute',
          right: 74,
          top: 330,
          transform: `translateY(${(1 - sceneIn) * 34}px)`,
          zIndex: 20,
        }}
      >
        <div style={{ background: '#f7faf7', bottom: 0, left: 0, padding: 36, position: 'absolute', top: 0, width: '100%' }}>
          <span style={{ color: '#8a6f2f', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Antes</span>
          <h2 style={{ color: '#0f1512', fontSize: 58, letterSpacing: 0, lineHeight: 0.98, margin: '16px 0 28px' }}>Fechamento manual e fragmentado</h2>
          <div style={{ display: 'grid', gap: 18 }}>
            {['Planilhas duplicadas', 'Conciliação por amostra', 'Contratos sem alerta', 'Dashboards atrasados'].map((label, index) => (
              <div key={label} style={{ background: '#ffffff', border: '1px solid #eadfcb', borderRadius: 18, display: 'flex', gap: 14, padding: 18 }}>
                <span style={{ background: '#c28f2c', borderRadius: 999, display: 'block', flex: '0 0 auto', height: 18, marginTop: 4, width: 18 }} />
                <span style={{ color: '#4a3f2b', fontSize: 28, fontWeight: 800 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            background: '#102019',
            bottom: 0,
            clipPath: `inset(0 0 0 ${slider * 100}%)`,
            color: '#ffffff',
            left: 0,
            padding: 36,
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
        >
          <span style={{ color: '#8aa895', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Depois</span>
          <h2 style={{ color: '#ffffff', fontSize: 58, letterSpacing: 0, lineHeight: 0.98, margin: '16px 0 28px' }}>Operação financeira em esteira</h2>
          <div style={{ display: 'grid', gap: 18 }}>
            {[
              ['Classificacao IA', '96%'],
              ['Conciliação automática', '98%'],
              ['Alertas contratuais', 'Live'],
              ['Dashboards publicados', '+18.4%'],
            ].map(([label, value], index) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 18, display: 'flex', justifyContent: 'space-between', padding: 18, opacity: reveal }}>
                <span style={{ color: '#ffffff', fontSize: 28, fontWeight: 800 }}>{label}</span>
                <strong style={{ color: '#8aa895', fontSize: 30, letterSpacing: 0 }}>{value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#ffffff', bottom: 0, boxShadow: '0 0 34px rgba(20,24,22,0.18)', left: `${slider * 100}%`, position: 'absolute', top: 0, transform: 'translateX(-50%)', width: 5 }} />
        <span style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 999, boxShadow: '0 18px 48px rgba(20,24,22,0.16)', color: '#225f42', display: 'flex', fontSize: 24, fontWeight: 900, height: 82, justifyContent: 'center', left: `${slider * 100}%`, position: 'absolute', top: 430, transform: 'translateX(-50%)', width: 82 }}>AI</span>
      </section>
      <GalleryFooter>Comparacao before/after mostrando ganho visualmente</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSTimelineAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const steps = [
    ['Ingestao', 'Dados chegam de ERP, banco e contratos', '#3f6d91'],
    ['Classificacao', 'IA organiza despesas e centros', '#225f42'],
    ['Conciliacao', 'Transacoes sao pareadas', '#6f8f7b'],
    ['Publicacao', 'Dashboards e relatorios ficam prontos', '#c28f2c'],
  ]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(63, 109, 145, 0.15), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Timeline animada" />
      <div style={{ left: 88, opacity: sceneIn, position: 'absolute', right: 88, top: 300, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <h2 style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.98, margin: '0 0 54px' }}>Do dado bruto ao board pack</h2>
        <div style={{ background: '#dce6df', borderRadius: 999, height: 8, left: 48, position: 'absolute', right: 48, top: 240 }} />
        <div style={{ background: '#225f42', borderRadius: 999, height: 8, left: 48, position: 'absolute', top: 240, width: `${progress(frame, 44, 260) * 82}%` }} />
        <div style={{ display: 'grid', gap: 22 }}>
          {steps.map(([title, description, color], index) => {
            const p = progress(frame, 42 + index * 42, 92 + index * 42)
            return (
              <div
                key={title}
                style={{
                  alignItems: 'center',
                  display: 'grid',
                  gap: 26,
                  gridTemplateColumns: '94px 1fr',
                  opacity: p,
                  transform: `translateX(${(1 - p) * -34}px)`,
                }}
              >
                <span style={{ alignItems: 'center', background: color, border: '8px solid #f4f7f4', borderRadius: 999, boxShadow: `0 18px 48px ${color}40`, color: '#ffffff', display: 'flex', fontSize: 28, fontWeight: 900, height: 82, justifyContent: 'center', width: 82 }}>{index + 1}</span>
                <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 28, boxShadow: '0 24px 64px rgba(20,24,22,0.12)', display: 'grid', gap: 14, padding: 28 }}>
                  <strong style={{ color: '#0f1512', fontSize: 40, letterSpacing: 0 }}>{title}</strong>
                  <span style={{ color: '#65716a', fontSize: 27, fontWeight: 760 }}>{description}</span>
                  <span style={{ background: color, borderRadius: 999, display: 'block', height: 10, width: `${56 + index * 10}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <GalleryFooter>Timeline SaaS para explicar processo e automacao ponta a ponta</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSOrbitAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const centerX = 540
  const centerY = 930

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.18), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Orbit gallery" />
      <svg height="100%" style={{ left: 0, opacity: sceneIn, position: 'absolute', top: 0, zIndex: 5 }} viewBox="0 0 1080 1920" width="100%">
        {[210, 330, 450].map((radius) => (
          <circle cx={centerX} cy={centerY} fill="none" key={radius} r={radius} stroke="rgba(34,95,66,0.14)" strokeWidth="3" />
        ))}
      </svg>
      <div style={{ opacity: sceneIn, position: 'absolute', zIndex: 20 }}>
        {galleryItems.map((item, index) => {
          const angle = frame / 58 + index * ((Math.PI * 2) / galleryItems.length)
          const radius = index % 2 === 0 ? 360 : 285
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius
          const scale = 0.58 + ((Math.sin(angle) + 1) / 2) * 0.18

          return (
            <div
              key={item.title}
              style={{
                left: x,
                position: 'absolute',
                top: y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                zIndex: Math.round(scale * 100),
              }}
            >
              <SaaSScreenshotCard item={item} scale={0.64} />
            </div>
          )
        })}
      </div>
      <div style={{ alignItems: 'center', background: '#102019', border: '1px solid #102019', borderRadius: 42, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 14, height: 290, justifyItems: 'center', left: '50%', padding: 32, position: 'absolute', top: centerY, transform: `translate(-50%, -50%) scale(${0.94 + sceneIn * 0.06})`, width: 360, zIndex: 40 }}>
        <span style={{ background: '#225f42', borderRadius: 999, display: 'block', height: 18, width: 18 }} />
        <strong style={{ color: '#ffffff', fontSize: 48, letterSpacing: 0, lineHeight: 0.98, textAlign: 'center' }}>Cognito hub</strong>
        <span style={{ color: 'rgba(255,255,255,0.68)', fontSize: 23, fontWeight: 760, textAlign: 'center' }}>Todos os artefatos orbitando a operacao</span>
      </div>
      <GalleryFooter>Orbit gallery com telas circulando um hub central</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSCommandCenterAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const active = galleryItems[Math.floor(frame / 120) % galleryItems.length]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.16), rgba(244, 247, 244, 0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Command center" />
      <section style={{ left: 70, opacity: sceneIn, position: 'absolute', right: 70, top: 292, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ background: '#102019', border: '1px solid #102019', borderRadius: 36, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 26, minHeight: 880, padding: 34 }}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: '#8aa895', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Live operations</span>
              <strong style={{ color: '#ffffff', fontSize: 58, letterSpacing: 0, lineHeight: 0.98 }}>Finance command center</strong>
            </div>
            <span style={{ background: '#225f42', borderRadius: 999, color: '#ffffff', fontSize: 24, fontWeight: 900, padding: '14px 18px' }}>{active.value}</span>
          </div>
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {galleryItems.slice(0, 3).map((item, index) => (
              <div key={item.title} style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, display: 'grid', gap: 14, padding: 22 }}>
                <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 18, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
                <strong style={{ color: '#ffffff', fontSize: 30, letterSpacing: 0, lineHeight: 1 }}>{item.value}</strong>
                <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 10, width: `${58 + index * 14}%` }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1.2fr 0.8fr' }}>
            <div style={{ background: '#ffffff', borderRadius: 28, color: '#0f1512', display: 'grid', gap: 22, padding: 26 }}>
              <strong style={{ color: '#0f1512', fontSize: 36, letterSpacing: 0 }}>{active.title}</strong>
              <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: 250 }}>
                {[96, 146, 118, 210, 164, 286, 230].map((height, index) => <span key={height} style={{ background: index === 5 ? active.accent : '#dce6df', borderRadius: 10, flex: 1, height }} />)}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {galleryItems.slice(3, 6).map((item, index) => {
                const p = progress(frame, 48 + index * 22, 96 + index * 22)
                return (
                  <div key={item.title} style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, display: 'grid', gap: 10, opacity: p, padding: 22, transform: `translateX(${(1 - p) * 24}px)` }}>
                    <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 17, fontWeight: 850, textTransform: 'uppercase' }}>{item.label}</span>
                    <strong style={{ color: '#ffffff', fontSize: 28, letterSpacing: 0 }}>{item.title}</strong>
                    <span style={{ color: item.accent, fontSize: 24, fontWeight: 900 }}>{item.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
      <GalleryFooter>Command center agregando multiplas telas em uma visao executiva</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSDocumentFanGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 120) % galleryItems.length
  const spread = progress(frame % 120, 12, 58)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(194, 143, 44, 0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Document fan gallery" />
      <div style={{ height: 1020, left: '50%', opacity: sceneIn, position: 'absolute', top: 340, transform: `translateX(-50%) translateY(${(1 - sceneIn) * 34}px)`, width: 920, zIndex: 20 }}>
        {galleryItems.map((item, index) => {
          const offset = index - 2.5
          const active = index === activeIndex
          const x = offset * 82 * spread
          const y = Math.abs(offset) * 28 * spread + (active ? -32 : 0)
          const rotate = offset * 8.5 * spread
          const scale = active ? 1.1 : 0.96 - Math.abs(offset) * 0.025

          return (
            <div
              key={item.title}
              style={{
                left: '50%',
                opacity: 0.48 + spread * 0.52,
                position: 'absolute',
                top: 90,
                transform: `translateX(-50%) translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
                transformOrigin: '50% 105%',
                zIndex: active ? 40 : 20 - Math.abs(index - activeIndex),
              }}
            >
              <SaaSScreenshotCard active={active} item={item} scale={1.08} />
            </div>
          )
        })}
      </div>
      <GalleryFooter>Document fan gallery com telas abrindo em leque</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSDeviceGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 135) % galleryItems.length
  const active = galleryItems[activeIndex]
  const float = Math.sin(frame / 28) * 12

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(43, 126, 165, 0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Device gallery" />
      <section style={{ left: 62, opacity: sceneIn, position: 'absolute', right: 62, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 36, boxShadow: '0 44px 110px rgba(20,24,22,0.20)', minHeight: 920, padding: 34, position: 'relative' }}>
          <div style={{ display: 'grid', gap: 8, marginBottom: 34 }}>
            <span style={{ color: active.accent, fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>{active.label}</span>
            <strong style={{ color: '#0f1512', fontSize: 64, letterSpacing: 0, lineHeight: 0.98 }}>{active.title} em todos os formatos</strong>
          </div>
          <div style={{ background: '#102019', borderRadius: 30, boxShadow: '0 28px 80px rgba(20,24,22,0.22)', height: 520, left: 76, overflow: 'hidden', padding: 20, position: 'absolute', top: 286, transform: `translateY(${float}px)`, width: 720 }}>
            <SaaSScreenshotCard item={active} scale={1.16} />
          </div>
          <div style={{ background: '#111827', borderRadius: 36, boxShadow: '0 26px 70px rgba(20,24,22,0.24)', height: 520, overflow: 'hidden', padding: 18, position: 'absolute', right: 58, top: 478, transform: `translateY(${-float * 0.6}px)`, width: 276 }}>
            <SaaSScreenshotCard item={galleryItems[(activeIndex + 1) % galleryItems.length]} scale={0.48} />
          </div>
          <div style={{ background: '#162019', borderRadius: 24, boxShadow: '0 22px 58px rgba(20,24,22,0.20)', height: 250, overflow: 'hidden', padding: 14, position: 'absolute', right: 228, top: 682, transform: `translateY(${float * 0.8}px)`, width: 360 }}>
            <SaaSScreenshotCard item={galleryItems[(activeIndex + 2) % galleryItems.length]} scale={0.57} />
          </div>
        </div>
      </section>
      <GalleryFooter>Device gallery com desktop, mobile e tablet em camadas</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSGridZoomGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 72) % 9

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Grid zoom gallery" />
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(3, 1fr)', left: 64, opacity: sceneIn, position: 'absolute', right: 64, top: 310, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        {Array.from({ length: 9 }).map((_, index) => {
          const item = galleryItems[index % galleryItems.length]
          const active = index === activeIndex
          return (
            <div key={`${item.title}-${index}`} style={{ transform: `scale(${active ? 1.08 : 0.96})`, transition: 'none', zIndex: active ? 20 : 5 }}>
              <SaaSScreenshotCard active={active} item={item} scale={0.56} />
            </div>
          )
        })}
      </div>
      <div style={{ background: 'rgba(255,255,255,0.90)', border: '1px solid #dfe7e1', borderRadius: 28, boxShadow: '0 30px 80px rgba(20,24,22,0.16)', left: 94, padding: 30, position: 'absolute', right: 94, top: 1168, zIndex: 40 }}>
        <span style={{ color: '#65716a', fontSize: 22, fontWeight: 850, textTransform: 'uppercase' }}>Zoom alternado</span>
        <h2 style={{ color: '#0f1512', fontSize: 58, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 0' }}>Uma grade de telas com foco rotativo</h2>
      </div>
      <GalleryFooter>Grid zoom gallery para mostrar volume de telas e foco dinamico</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSSwipeCardsGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 105) % galleryItems.length
  const local = (frame % 105) / 105

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(139, 111, 157, 0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Swipe cards gallery" />
      <div style={{ height: 900, left: '50%', opacity: sceneIn, position: 'absolute', top: 410, transform: `translateX(-50%) translateY(${(1 - sceneIn) * 34}px)`, width: 880, zIndex: 20 }}>
        {[0, 1, 2, 3].map((slot) => {
          const item = galleryItems[(activeIndex + slot) % galleryItems.length]
          const leave = slot === 0 ? progress(local, 0.68, 1) : 0
          const x = slot * 34 - leave * 620
          const y = slot * 34 + leave * 80
          const rotate = slot * -3 - leave * 18
          const scale = 1.08 - slot * 0.055
          return (
            <div key={`${slot}-${item.title}`} style={{ left: '50%', opacity: 1 - slot * 0.14 - leave * 0.4, position: 'absolute', top: 20, transform: `translateX(-50%) translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`, zIndex: 30 - slot }}>
              <SaaSScreenshotCard active={slot === 0} item={item} scale={1.14} />
            </div>
          )
        })}
      </div>
      <GalleryFooter>Swipe cards gallery com gesto visual de stories e decks</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSCoverflowGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 112) % galleryItems.length
  const local = (frame % 112) / 112

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34, 95, 66, 0.16), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Coverflow gallery" />
      <div style={{ height: 820, left: '50%', opacity: sceneIn, perspective: 920, position: 'absolute', top: 480, transform: `translateX(-50%) translateY(${(1 - sceneIn) * 34}px)`, width: 1050, zIndex: 20 }}>
        {[-3, -2, -1, 0, 1, 2, 3].map((slot) => {
          const item = galleryItems[(activeIndex + slot + galleryItems.length) % galleryItems.length]
          const unit = slot - local
          const centerScore = 1 - Math.min(Math.abs(unit) / 3, 1)
          const x = unit * 165
          const rotateY = unit * -28
          const scale = 0.72 + centerScore * 0.38
          return (
            <div key={`${slot}-${item.title}`} style={{ left: '50%', opacity: 0.28 + centerScore * 0.72, position: 'absolute', top: 90, transform: `translateX(-50%) translateX(${x}px) rotateY(${rotateY}deg) scale(${scale})`, transformStyle: 'preserve-3d', zIndex: Math.round(centerScore * 30) }}>
              <SaaSScreenshotCard active={Math.abs(unit) < 0.55} item={item} scale={1.02} />
            </div>
          )
        })}
      </div>
      <GalleryFooter>Coverflow gallery em perspectiva para telas de produto</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSRoom3DGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const rotate = Math.sin(frame / 72) * 4

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34,95,66,0.16), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="3D room gallery" />
      <div style={{ bottom: 220, left: 0, opacity: sceneIn, perspective: 1050, position: 'absolute', right: 0, top: 300, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ height: 980, left: '50%', position: 'absolute', top: 70, transform: `translateX(-50%) rotateY(${rotate}deg)`, transformStyle: 'preserve-3d', width: 820 }}>
          <div style={{ background: '#102019', borderRadius: 34, bottom: 10, left: 20, opacity: 0.18, position: 'absolute', right: 20, top: 570, transform: 'rotateX(78deg) translateZ(-30px)' }} />
          {[
            { item: galleryItems[0], transform: 'translateX(-390px) rotateY(38deg) translateZ(-40px)', top: 120 },
            { item: galleryItems[1], transform: 'translateX(-50%) translateZ(180px)', top: 70 },
            { item: galleryItems[2], transform: 'translateX(390px) rotateY(-38deg) translateZ(-40px)', top: 120 },
            { item: galleryItems[3], transform: 'translateX(-50%) translateY(410px) translateZ(40px) scale(0.72)', top: 70 },
          ].map((panel, index) => (
            <div key={panel.item.title} style={{ left: index === 0 ? '50%' : index === 2 ? '50%' : '50%', position: 'absolute', top: panel.top, transform: panel.transform, transformStyle: 'preserve-3d', zIndex: index === 1 ? 30 : 20 }}>
              <SaaSScreenshotCard active={index === 1} item={panel.item} scale={index === 3 ? 0.9 : 0.94} />
            </div>
          ))}
        </div>
      </div>
      <GalleryFooter>3D room gallery com telas em paredes de produto</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSMagnifierGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const x = interpolate(Math.sin(frame / 38), [-1, 1], [190, 760])
  const y = interpolate(Math.cos(frame / 46), [-1, 1], [460, 980])
  const activeIndex = Math.floor(frame / 70) % galleryItems.length
  const active = galleryItems[activeIndex]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(43,126,165,0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Magnifier gallery" />
      <section style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 34, boxShadow: '0 44px 110px rgba(20,24,22,0.18)', left: 60, opacity: sceneIn, overflow: 'hidden', padding: 24, position: 'absolute', right: 60, top: 300, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {Array.from({ length: 9 }).map((_, index) => {
            const item = galleryItems[index % galleryItems.length]
            return <SaaSScreenshotCard item={item} key={`${item.title}-${index}`} scale={0.52} />
          })}
        </div>
        <div style={{ background: '#ffffff', border: '7px solid #102019', borderRadius: 999, boxShadow: '0 34px 90px rgba(20,24,22,0.25)', height: 250, left: x, overflow: 'hidden', position: 'absolute', top: y, transform: 'translate(-50%, -50%)', width: 250, zIndex: 35 }}>
          <div style={{ left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%) scale(1.42)' }}>
            <SaaSScreenshotCard active item={active} scale={0.46} />
          </div>
        </div>
        <span style={{ background: '#102019', borderRadius: 999, height: 110, left: x + 105, position: 'absolute', top: y + 105, transform: 'rotate(45deg)', transformOrigin: 'top center', width: 15, zIndex: 34 }} />
      </section>
      <GalleryFooter>Magnifier gallery com lupa percorrendo telas e detalhes</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSAccordionGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 110) % galleryItems.length

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(139,111,157,0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Accordion gallery" />
      <section style={{ display: 'grid', gap: 16, left: 78, opacity: sceneIn, position: 'absolute', right: 78, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        {galleryItems.map((item, index) => {
          const active = index === activeIndex
          const height = active ? 360 : 118
          return (
            <div key={item.title} style={{ background: active ? '#ffffff' : '#f7faf7', border: `1px solid ${active ? item.accent : '#dfe7e1'}`, borderRadius: 28, boxShadow: active ? '0 30px 82px rgba(20,24,22,0.16)' : '0 14px 36px rgba(20,24,22,0.07)', display: 'grid', gap: 18, height, overflow: 'hidden', padding: 24 }}>
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gap: 5 }}>
                  <span style={{ color: item.accent, fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>{item.label}</span>
                  <strong style={{ color: '#0f1512', fontSize: active ? 38 : 28, letterSpacing: 0 }}>{item.title}</strong>
                </div>
                <span style={{ background: `${item.accent}18`, borderRadius: 999, color: item.accent, fontSize: 22, fontWeight: 900, padding: '10px 14px' }}>{item.value}</span>
              </div>
              {active ? (
                <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: 170 }}>
                  {[82, 136, 104, 196, 152, 236].map((bar, barIndex) => <span key={bar} style={{ background: barIndex === index % 6 ? item.accent : '#dce6df', borderRadius: 10, flex: 1, height: bar }} />)}
                </div>
              ) : null}
            </div>
          )
        })}
      </section>
      <GalleryFooter>Accordion gallery com cards expandindo e recolhendo</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSStoryboardGalleryAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 86) % 6

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(194,143,44,0.14), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Storyboard gallery" />
      <section style={{ left: 64, opacity: sceneIn, position: 'absolute', right: 64, top: 292, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr' }}>
          {galleryItems.map((item, index) => {
            const active = index === activeIndex
            const p = progress(frame, 22 + index * 10, 62 + index * 10)
            return (
              <div key={item.title} style={{ background: '#ffffff', border: `1px solid ${active ? item.accent : '#dfe7e1'}`, borderRadius: 26, boxShadow: active ? '0 28px 78px rgba(20,24,22,0.16)' : '0 14px 36px rgba(20,24,22,0.07)', opacity: p, overflow: 'hidden', padding: 18, transform: `translateY(${(1 - p) * 22}px)` }}>
                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ color: '#65716a', fontSize: 18, fontWeight: 900 }}>Frame {String(index + 1).padStart(2, '0')}</span>
                  <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 12, width: active ? 54 : 12 }} />
                </div>
                <SaaSScreenshotCard active={active} item={item} scale={0.58} />
              </div>
            )
          })}
        </div>
      </section>
      <GalleryFooter>Storyboard gallery em frames sequenciais de produto</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSLogoCloudAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const logos = ['ERP', 'Bank', 'CRM', 'BI', 'Docs', 'Mail', 'Tax', 'Cloud', 'Slack', 'Sheets']

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34,95,66,0.16), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Logo cloud" />
      <div style={{ left: 70, opacity: sceneIn, position: 'absolute', right: 70, top: 310, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <h2 style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.98, margin: '0 0 60px' }}>Conectado ao stack inteiro</h2>
        <div style={{ display: 'grid', gap: 22, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {logos.map((logo, index) => {
            const p = progress(frame, 34 + index * 9, 76 + index * 9)
            return (
              <div key={logo} style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 28, boxShadow: '0 22px 58px rgba(20,24,22,0.10)', display: 'flex', gap: 18, opacity: p, padding: 24, transform: `translateY(${(1 - p) * 26}px)` }}>
                <span style={{ alignItems: 'center', background: galleryItems[index % galleryItems.length].accent, borderRadius: 20, color: '#ffffff', display: 'flex', fontSize: 26, fontWeight: 900, height: 64, justifyContent: 'center', width: 64 }}>{logo.slice(0, 1)}</span>
                <strong style={{ color: '#0f1512', fontSize: 30, letterSpacing: 0 }}>{logo}</strong>
              </div>
            )
          })}
        </div>
      </div>
      <GalleryFooter>Logo cloud para integrações, clientes e social proof</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSMetricCounterAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const close = Math.round(interpolate(progress(frame, 42, 210), [0, 1], [0, 64]))
  const auto = Math.round(interpolate(progress(frame, 70, 250), [0, 1], [0, 98]))
  const hours = Math.round(interpolate(progress(frame, 96, 280), [0, 1], [0, 184]))

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34,95,66,0.18), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Metric counter" />
      <section style={{ left: 74, opacity: sceneIn, position: 'absolute', right: 74, top: 360, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ background: '#102019', borderRadius: 42, boxShadow: '0 44px 110px rgba(20,24,22,0.22)', color: '#ffffff', padding: 46 }}>
          <span style={{ color: '#8aa895', fontSize: 24, fontWeight: 900, textTransform: 'uppercase' }}>Impacto operacional</span>
          <h2 style={{ color: '#ffffff', fontSize: 76, letterSpacing: 0, lineHeight: 0.94, margin: '18px 0 52px' }}>Menos fechamento manual, mais controle.</h2>
          <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[
              ['Tempo reduzido', `${close}%`, '#8aa895'],
              ['Automatizado', `${auto}%`, '#6f8f7b'],
              ['Horas salvas', `${hours}h`, '#c28f2c'],
            ].map(([label, value, color]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 28, display: 'grid', gap: 18, padding: 26 }}>
                <span style={{ color: 'rgba(255,255,255,0.66)', fontSize: 20, fontWeight: 850 }}>{label}</span>
                <strong style={{ color, fontSize: 58, letterSpacing: 0, lineHeight: 1 }}>{value}</strong>
                <span style={{ background: color, borderRadius: 999, display: 'block', height: 10, width: '78%' }} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <GalleryFooter>Metric counter com numeros grandes e progresso animado</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSKanbanFlowAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const columns = ['Entrada', 'IA analisando', 'Aprovado']
  const moving = progress(frame % 150, 20, 118)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(63,109,145,0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Kanban flow" />
      <section style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(3, 1fr)', left: 60, opacity: sceneIn, position: 'absolute', right: 60, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        {columns.map((column, columnIndex) => (
          <div key={column} style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 30, boxShadow: '0 28px 74px rgba(20,24,22,0.12)', minHeight: 860, padding: 22 }}>
            <strong style={{ color: '#0f1512', display: 'block', fontSize: 32, letterSpacing: 0, marginBottom: 24 }}>{column}</strong>
            {[0, 1, 2].map((card) => {
              const item = galleryItems[(card + columnIndex) % galleryItems.length]
              return (
                <div key={`${column}-${card}`} style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 20, display: 'grid', gap: 12, marginBottom: 16, padding: 18 }}>
                  <span style={{ color: item.accent, fontSize: 18, fontWeight: 850 }}>{item.label}</span>
                  <strong style={{ color: '#0f1512', fontSize: 24, letterSpacing: 0 }}>{item.title}</strong>
                  <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 8, width: `${54 + card * 15}%` }} />
                </div>
              )
            })}
          </div>
        ))}
        <div style={{ background: '#102019', borderRadius: 22, boxShadow: '0 28px 80px rgba(20,24,22,0.24)', color: '#ffffff', display: 'grid', gap: 10, left: 36 + moving * 610, padding: 22, position: 'absolute', top: 330 + Math.sin(frame / 16) * 14, width: 260, zIndex: 40 }}>
          <span style={{ color: '#8aa895', fontSize: 17, fontWeight: 850 }}>Movendo card</span>
          <strong style={{ fontSize: 26, letterSpacing: 0 }}>Despesa revisada</strong>
        </div>
      </section>
      <GalleryFooter>Kanban flow para automacoes atravessando etapas</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSNetworkMapAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const nodes = [
    [540, 900, 'Hub', '#225f42'],
    [250, 620, 'ERP', '#3f6d91'],
    [810, 640, 'Banco', '#6f8f7b'],
    [230, 1120, 'Docs', '#c28f2c'],
    [820, 1160, 'BI', '#8b6f9d'],
    [540, 1320, 'Board', '#2b7ea5'],
  ] as const

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34,95,66,0.17), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Map / network" />
      <svg height="100%" style={{ left: 0, opacity: sceneIn, position: 'absolute', top: 0, zIndex: 5 }} viewBox="0 0 1080 1920" width="100%">
        {nodes.slice(1).map((node, index) => (
          <line key={node[2]} stroke="#225f42" strokeDasharray="16 20" strokeDashoffset={-(frame * 3 + index * 12)} strokeLinecap="round" strokeWidth="6" x1="540" x2={node[0]} y1="900" y2={node[1]} />
        ))}
      </svg>
      {nodes.map(([x, y, label, color], index) => {
        const p = progress(frame, 34 + index * 14, 78 + index * 14)
        return (
          <div key={label} style={{ alignItems: 'center', background: '#ffffff', border: `1px solid ${color}`, borderRadius: 999, boxShadow: `0 24px 64px ${color}35`, color, display: 'flex', fontSize: label === 'Hub' ? 34 : 26, fontWeight: 900, height: label === 'Hub' ? 150 : 112, justifyContent: 'center', left: x, opacity: p, position: 'absolute', top: y, transform: `translate(-50%, -50%) scale(${0.88 + p * 0.12 + Math.sin((frame + index * 20) / 28) * 0.025})`, width: label === 'Hub' ? 150 : 112, zIndex: label === 'Hub' ? 40 : 25 }}>
            {label}
          </div>
        )
      })}
      <GalleryFooter>Map network para dados, entidades e integracoes conectadas</GalleryFooter>
    </AbsoluteFill>
  )
}

function SaaSProductTourAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 120) % 4
  const hotspots = [
    [250, 185, 'Dados'],
    [640, 185, 'Metricas'],
    [315, 420, 'Grafico'],
    [705, 580, 'Acoes'],
  ] as const
  const active = hotspots[activeIndex]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34,95,66,0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Product tour" />
      <section style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 36, boxShadow: '0 44px 110px rgba(20,24,22,0.20)', left: 78, opacity: sceneIn, overflow: 'hidden', padding: 34, position: 'absolute', right: 78, top: 320, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <SaaSScreenshotCard item={galleryItems[activeIndex]} scale={1.52} />
        {hotspots.map(([x, y, label], index) => {
          const isActive = index === activeIndex
          return (
            <span key={label} style={{ alignItems: 'center', background: isActive ? '#225f42' : '#ffffff', border: '3px solid #225f42', borderRadius: 999, boxShadow: isActive ? '0 0 0 18px rgba(34,95,66,0.14)' : '0 16px 38px rgba(20,24,22,0.12)', color: isActive ? '#ffffff' : '#225f42', display: 'flex', fontSize: 22, fontWeight: 900, height: 62, justifyContent: 'center', left: x, position: 'absolute', top: y, transform: 'translate(-50%, -50%)', width: 62 }}>
              {index + 1}
            </span>
          )
        })}
      </section>
      <div style={{ background: '#102019', borderRadius: 28, boxShadow: '0 28px 80px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 10, left: 118, padding: 26, position: 'absolute', right: 118, top: 1266, zIndex: 40 }}>
        <span style={{ color: '#8aa895', fontSize: 21, fontWeight: 900, textTransform: 'uppercase' }}>Hotspot {activeIndex + 1}</span>
        <strong style={{ color: '#ffffff', fontSize: 44, letterSpacing: 0 }}>{active[2]} em destaque</strong>
      </div>
      <GalleryFooter>Product tour com hotspots guiando a interface</GalleryFooter>
    </AbsoluteFill>
  )
}

function WebChatWindow({ brand, kind }: { brand: 'ChatGPT' | 'Claude'; kind: 'chatgpt' | 'claude' }) {
  const frame = useCurrentFrame()
  const isClaude = kind === 'claude'
  const bg = isClaude ? '#f7f4ed' : '#ffffff'
  const sidebarBg = isClaude ? '#f2eee6' : '#f7f7f8'
  const border = isClaude ? '#e6dfd2' : '#e5e5e7'
  const accent = isClaude ? '#d86f4a' : '#111111'
  const muted = isClaude ? '#7b7265' : '#6b7280'
  const windowIn = progress(frame, 0, 38)
  const activeMessage = Math.min(webChatMessages.length - 1, Math.floor(frame / 92))
  const scan = (frame * 2.2) % 360

  return (
    <AbsoluteFill style={{ background: isClaude ? '#ede8de' : '#f4f4f5', color: '#111827', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: isClaude ? 'radial-gradient(circle at 50% 42%, rgba(216,111,74,0.18), rgba(237,232,222,0) 58%)' : 'radial-gradient(circle at 50% 42%, rgba(17,17,17,0.10), rgba(244,244,245,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <section
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 28,
          boxShadow: '0 44px 120px rgba(20,24,22,0.20)',
          display: 'grid',
          gridTemplateColumns: '250px 1fr',
          height: 1280,
          left: 42,
          opacity: windowIn,
          overflow: 'hidden',
          position: 'absolute',
          right: 42,
          top: 210,
          transform: `translateY(${(1 - windowIn) * 34}px) scale(${0.96 + windowIn * 0.04})`,
          zIndex: 10,
        }}
      >
        <aside style={{ background: sidebarBg, borderRight: `1px solid ${border}`, display: 'grid', gridTemplateRows: '72px 1fr 96px', minWidth: 0 }}>
          <div style={{ alignItems: 'center', borderBottom: `1px solid ${border}`, display: 'flex', gap: 12, padding: '0 18px' }}>
            <span style={{ alignItems: 'center', background: accent, borderRadius: isClaude ? 12 : 999, color: '#ffffff', display: 'flex', fontSize: 24, fontWeight: 900, height: 42, justifyContent: 'center', width: 42 }}>{isClaude ? '*' : 'G'}</span>
            <strong style={{ color: '#111827', fontSize: 24, letterSpacing: 0 }}>{brand}</strong>
          </div>
          <div style={{ display: 'grid', gap: 12, padding: 16, alignContent: 'start' }}>
            <button style={{ background: isClaude ? '#ffffff' : '#111111', border: `1px solid ${isClaude ? border : '#111111'}`, borderRadius: 14, color: isClaude ? '#111827' : '#ffffff', fontSize: 17, fontWeight: 820, padding: '14px 16px', textAlign: 'left' }} type="button">
              + Novo chat
            </button>
            {['Fechamento mensal', 'DRE e fluxo de caixa', 'Contratos críticos', 'Dashboard executivo', 'Classificação de despesas'].map((item, index) => (
              <div key={item} style={{ background: index === 0 ? (isClaude ? '#e9dfd2' : '#ececee') : 'transparent', borderRadius: 12, color: index === 0 ? '#111827' : muted, fontSize: 16, fontWeight: 720, overflow: 'hidden', padding: '12px 13px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ alignItems: 'center', borderTop: `1px solid ${border}`, display: 'flex', gap: 12, padding: 16 }}>
            <span style={{ background: isClaude ? '#d86f4a' : '#10a37f', borderRadius: 999, display: 'block', height: 34, width: 34 }} />
            <div style={{ display: 'grid', gap: 2 }}>
              <strong style={{ color: '#111827', fontSize: 15 }}>Igor</strong>
              <span style={{ color: muted, fontSize: 13, fontWeight: 700 }}>Workspace Pro</span>
            </div>
          </div>
        </aside>

        <main style={{ display: 'grid', gridTemplateRows: '72px 1fr 154px', minWidth: 0 }}>
          <header style={{ alignItems: 'center', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', padding: '0 28px' }}>
            <div style={{ display: 'grid', gap: 2 }}>
              <strong style={{ color: '#111827', fontSize: 21, letterSpacing: 0 }}>{isClaude ? 'Claude Opus 4.7' : 'ChatGPT 5'}</strong>
              <span style={{ color: muted, fontSize: 14, fontWeight: 720 }}>{isClaude ? 'Projeto financeiro conectado' : 'Análise com ferramentas conectadas'}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Share', 'Export', '...'].map((item) => <span key={item} style={{ background: isClaude ? '#fbfaf7' : '#f7f7f8', border: `1px solid ${border}`, borderRadius: 999, color: '#333333', fontSize: 14, fontWeight: 760, padding: '9px 13px' }}>{item}</span>)}
            </div>
          </header>

          <div style={{ overflow: 'hidden', padding: '34px 52px 20px', position: 'relative' }}>
            <div style={{ display: 'grid', gap: 26 }}>
              {webChatMessages.map((message, index) => {
                const visible = progress(frame, 22 + index * 68, 56 + index * 68)
                const user = message.role === 'user'
                return (
                  <div key={`${message.role}-${index}`} style={{ display: 'flex', justifyContent: user ? 'flex-end' : 'flex-start', opacity: visible, transform: `translateY(${(1 - visible) * 18}px)` }}>
                    <div
                      style={{
                        background: user ? (isClaude ? '#ebe6dd' : '#f4f4f4') : 'transparent',
                        border: user ? `1px solid ${border}` : 0,
                        borderRadius: user ? 24 : 0,
                        color: '#111827',
                        display: 'grid',
                        gap: 14,
                        maxWidth: user ? 520 : 720,
                        padding: user ? '18px 22px' : '2px 0',
                      }}
                    >
                      {!user ? (
                        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
                          <span style={{ alignItems: 'center', background: accent, borderRadius: isClaude ? 10 : 999, color: '#ffffff', display: 'flex', fontSize: 18, fontWeight: 900, height: 34, justifyContent: 'center', width: 34 }}>{isClaude ? '*' : 'G'}</span>
                          <strong style={{ color: '#111827', fontSize: 18 }}>{brand}</strong>
                        </div>
                      ) : null}
                      <p style={{ color: '#111827', fontSize: 24, fontWeight: 560, letterSpacing: 0, lineHeight: 1.35, margin: 0 }}>{message.text}</p>
                      {!user && index === activeMessage ? (
                        <div style={{ background: isClaude ? '#fffaf3' : '#ffffff', border: `1px solid ${border}`, borderRadius: 18, boxShadow: '0 18px 44px rgba(20,24,22,0.08)', display: 'grid', gap: 14, marginTop: 4, overflow: 'hidden', padding: 18 }}>
                          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: muted, fontSize: 15, fontWeight: 850, textTransform: 'uppercase' }}>Financial workspace</span>
                            <strong style={{ color: isClaude ? '#d86f4a' : '#10a37f', fontSize: 22, letterSpacing: 0 }}>+64%</strong>
                          </div>
                          <div style={{ alignItems: 'end', display: 'flex', gap: 9, height: 108, position: 'relative' }}>
                            <span style={{ background: `linear-gradient(90deg, transparent, ${isClaude ? '#d86f4a' : '#10a37f'}, transparent)`, height: 3, left: -360 + scan, opacity: 0.72, position: 'absolute', top: 0, width: 360 }} />
                            {[48, 82, 64, 112, 90, 136].map((height, bar) => <span key={height} style={{ background: bar > 3 ? (isClaude ? '#d86f4a' : '#10a37f') : '#dce3df', borderRadius: 8, flex: 1, height }} />)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ alignItems: 'center', borderTop: `1px solid ${border}`, display: 'grid', padding: '22px 52px 30px' }}>
            <div style={{ background: isClaude ? '#fbfaf7' : '#ffffff', border: `1px solid ${border}`, borderRadius: 24, boxShadow: '0 18px 44px rgba(20,24,22,0.08)', display: 'grid', gap: 18, padding: 20 }}>
              <span style={{ color: muted, fontSize: 22, fontWeight: 620 }}>{isClaude ? 'Responder a Claude' : 'Mensagem para ChatGPT'}</span>
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['+', 'Tools', isClaude ? 'Opus 4.7' : 'GPT-5'].map((item) => <span key={item} style={{ background: isClaude ? '#f0ebe2' : '#f4f4f5', borderRadius: 999, color: '#111827', fontSize: 16, fontWeight: 780, padding: '10px 14px' }}>{item}</span>)}
                </div>
                <span style={{ alignItems: 'center', background: accent, borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 22, fontWeight: 900, height: 46, justifyContent: 'center', width: 46 }}>↑</span>
              </div>
            </div>
          </div>
        </main>
      </section>
    </AbsoluteFill>
  )
}

function ChatGptWebAnimationCard() {
  return <WebChatWindow brand="ChatGPT" kind="chatgpt" />
}

function ClaudeWebAnimationCard() {
  return <WebChatWindow brand="Claude" kind="claude" />
}

function ChatGptStatusBar() {
  return (
    <>
      <div style={{ color: '#060606', fontSize: 42, fontWeight: 740, left: 78, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 42 }}>18:07</div>
      <div style={{ alignItems: 'flex-end', display: 'flex', gap: 5, height: 30, left: 842, position: 'absolute', top: 54, width: 42 }}>
        {[12, 18, 25, 31].map((height, index) => (
          <span key={height} style={{ background: index > 1 ? '#c8c8c8' : '#050505', borderRadius: 3, display: 'block', height, width: 7 }} />
        ))}
      </div>
      <div style={{ height: 35, left: 903, position: 'absolute', top: 48, width: 50 }}>
        <div style={{ border: '6px solid #050505', borderBottom: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderRadius: '50% 50% 0 0', height: 27, left: 1, position: 'absolute', top: 3, transform: 'rotate(180deg)', width: 48 }} />
        <div style={{ border: '5px solid #050505', borderBottom: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderRadius: '50% 50% 0 0', height: 19, left: 11, position: 'absolute', top: 11, transform: 'rotate(180deg)', width: 29 }} />
        <div style={{ background: '#050505', borderRadius: 999, height: 7, left: 23, position: 'absolute', top: 27, width: 7 }} />
      </div>
      <div style={{ border: '2px solid #bcbcbc', borderRadius: 10, height: 35, left: 965, position: 'absolute', top: 45, width: 67 }}>
        <div style={{ background: '#e8c348', borderRadius: 7, bottom: 2, left: 2, position: 'absolute', top: 2, width: 45 }} />
        <div style={{ color: '#050505', fontSize: 26, fontWeight: 760, left: 18, lineHeight: '31px', position: 'absolute', textAlign: 'center', top: 0, width: 40 }}>24</div>
        <div style={{ background: '#bcbcbc', borderRadius: 3, height: 14, position: 'absolute', right: -6, top: 9, width: 4 }} />
      </div>
    </>
  )
}

function ChatGptActionRow() {
  const icons = [Copy, Volume2, ThumbsUp, ThumbsDown, Upload, MoreHorizontal]

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 32 }}>
      {icons.map((Icon, index) => (
        <Icon key={index} color="#666666" size={39} strokeWidth={2.5} />
      ))}
    </div>
  )
}

function chatGptSequenceStyle(frame: number, start: number, fromY = 20) {
  const opacity = progress(frame, start, start + 18)
  const y = interpolate(frame, [start, start + 24], [fromY, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    opacity,
    transform: `translateY(${y}px)`,
  }
}

function ChatGptFlowUserBubble({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 42 }}>
      <div
        style={{
          alignItems: 'center',
          background: '#f1f1f1',
          borderRadius: 60,
          boxSizing: 'border-box',
          color: '#111111',
          display: 'flex',
          fontFamily: FONT_STACK,
          fontSize: 38,
          fontWeight: 400,
          justifyContent: 'center',
          letterSpacing: '-0.76px',
          lineHeight: 1.12,
          maxWidth: 760,
          minHeight: 91,
          padding: '23px 42px',
          width: 'max-content',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ChatGptFlowAssistantText({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontFamily: FONT_STACK,
        fontSize: 38,
        fontWeight: 400,
        letterSpacing: '-0.76px',
        lineHeight: 1.34,
        padding: '0 42px',
      }}
    >
      {children}
    </div>
  )
}

function ChatGptToolResultCard({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        background: '#ffffff',
        border: '1px solid #e6e6e6',
        borderRadius: 28,
        boxShadow: '0 14px 38px rgba(15, 23, 42, 0.08)',
        margin: '0 42px',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

function ChatGptVoiceButton() {
  return (
    <div style={{ alignItems: 'center', background: '#050505', borderRadius: 999, display: 'flex', gap: 7, height: 78, justifyContent: 'center', width: 78 }}>
      {[20, 35, 48, 35, 20].map((height, index) => (
        <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 6 }} />
      ))}
    </div>
  )
}

function ChatGptMobileScreenshot() {
  const frame = useCurrentFrame()
  const conversationY = interpolate(
    frame,
    [0, 140, 260, 420, 580, 760, 940, 1120, 1320],
    [0, 0, -280, -770, -1280, -1820, -2380, -2940, -3520],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )

  return (
    <AbsoluteFill style={{ background: '#ffffff', color: '#111111', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <ChatGptStatusBar />

      <Menu color="#050505" size={48} strokeWidth={2.7} style={{ left: 48, position: 'absolute', top: 158 }} />
      <div style={{ alignItems: 'center', color: '#111111', display: 'flex', fontSize: 43, fontWeight: 600, gap: 5, left: 161, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 156 }}>
        ChatGPT
        <ChevronRight color="#8b8b8b" size={34} strokeWidth={2.4} />
      </div>
      <SquarePen color="#050505" size={47} strokeWidth={2.8} style={{ left: 861, position: 'absolute', top: 149 }} />
      <MoreHorizontal color="#050505" size={51} strokeWidth={3.2} style={{ left: 974, position: 'absolute', top: 157 }} />

      <div style={{ bottom: 264, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 244 }}>
        <div style={{ display: 'grid', gap: 34, padding: '20px 0 760px', transform: `translateY(${conversationY}px)` }}>
          <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 10, 18)}>
            Gere uma cobranca para o Cliente Norte
          </ChatGptFlowUserBubble>
          <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 48, 22)}>
            Vou localizar o cliente antes de montar a cobranca.
          </ChatGptFlowAssistantText>
          <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 78, 22)}>
            <AnimatedMcpTableView data={chatGptCollectionCustomerData} startFrame={78} />
          </ChatGptToolResultCard>

          <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 228, 22)}>
            Agora defini forma de pagamento, conta financeira e categoria de receita.
          </ChatGptFlowAssistantText>
          <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 258, 22)}>
            <AnimatedMcpTableView data={chatGptCollectionParametersData} startFrame={258} />
          </ChatGptToolResultCard>

          <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 418, 22)}>
            Montei a cobranca. Posso criar no ERP e enviar ao cliente?
          </ChatGptFlowAssistantText>
          <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 448, 22)}>
            <AnimatedMcpAnalysisView data={chatGptCollectionDraftData} startFrame={448} />
          </ChatGptToolResultCard>

          <ChatGptFlowUserBubble style={chatGptSequenceStyle(frame, 608, 18)}>
            Sim, crie e envie
          </ChatGptFlowUserBubble>
          <ChatGptFlowAssistantText style={chatGptSequenceStyle(frame, 650, 22)}>
            Cobranca criada no ERP e enviada por WhatsApp.
          </ChatGptFlowAssistantText>
          <ChatGptToolResultCard style={chatGptSequenceStyle(frame, 680, 22)}>
            <AnimatedMcpTableView data={chatGptCollectionResultData} startFrame={680} />
          </ChatGptToolResultCard>

          <div style={chatGptSequenceStyle(frame, 790, 14)}>
            <div style={{ padding: '10px 0 0 45px' }}>
              <ChatGptActionRow />
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#ffffff', bottom: 0, height: 264, left: 0, position: 'absolute', right: 0 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 21, left: 31, position: 'absolute', right: 31, top: 0 }}>
          <div style={{ alignItems: 'center', background: '#f0f0f0', borderRadius: 999, display: 'flex', height: 84, justifyContent: 'center', width: 84 }}>
            <Plus color="#555555" size={47} strokeWidth={2.4} />
          </div>
          <div style={{ alignItems: 'center', background: '#f0f0f0', borderRadius: 999, display: 'flex', flex: 1, height: 84, minWidth: 0, position: 'relative' }}>
            <span style={{ color: '#858585', fontSize: 40, fontWeight: 430, left: 41, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 23 }}>Pergunte ao ChatGPT</span>
            <Mic color="#777777" size={44} strokeWidth={2.8} style={{ position: 'absolute', right: 103, top: 18 }} />
            <div style={{ position: 'absolute', right: 8, top: 6 }}>
              <ChatGptVoiceButton />
            </div>
          </div>
        </div>
        <div style={{ background: '#050505', borderRadius: 999, bottom: 14, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
      </div>
    </AbsoluteFill>
  )
}

function ChatGptMobileAnimationCard() {
  return <ChatGptMobileScreenshot />
}

function ClaudeStatusBar() {
  return (
    <>
      <div style={{ color: '#060606', fontSize: 42, fontWeight: 740, left: 78, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 42 }}>19:04</div>
      <div style={{ alignItems: 'flex-end', display: 'flex', gap: 5, height: 30, left: 842, position: 'absolute', top: 54, width: 42 }}>
        {[12, 18, 25, 31].map((height, index) => (
          <span key={height} style={{ background: index > 1 ? '#c8c8c8' : '#050505', borderRadius: 3, display: 'block', height, width: 7 }} />
        ))}
      </div>
      <div style={{ height: 35, left: 903, position: 'absolute', top: 48, width: 50 }}>
        <div style={{ border: '6px solid #050505', borderBottom: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderRadius: '50% 50% 0 0', height: 27, left: 1, position: 'absolute', top: 3, transform: 'rotate(180deg)', width: 48 }} />
        <div style={{ border: '5px solid #050505', borderBottom: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderRadius: '50% 50% 0 0', height: 19, left: 11, position: 'absolute', top: 11, transform: 'rotate(180deg)', width: 29 }} />
        <div style={{ background: '#050505', borderRadius: 999, height: 7, left: 23, position: 'absolute', top: 27, width: 7 }} />
      </div>
      <div style={{ border: '2px solid #bcbcbc', borderRadius: 10, height: 35, left: 965, position: 'absolute', top: 45, width: 67 }}>
        <div style={{ background: '#e8c348', borderRadius: 7, bottom: 2, left: 2, position: 'absolute', top: 2, width: 45 }} />
        <div style={{ color: '#050505', fontSize: 26, fontWeight: 760, left: 25, lineHeight: '31px', position: 'absolute', textAlign: 'center', top: 0, width: 30 }}>5</div>
        <div style={{ background: '#bcbcbc', borderRadius: 3, height: 14, position: 'absolute', right: -6, top: 9, width: 4 }} />
      </div>
    </>
  )
}

function ClaudeActionRow({ second = false }: { second?: boolean }) {
  const icons = second
    ? [Copy, Upload, Play, ThumbsUp, ThumbsDown, RotateCcw]
    : [Copy, Play, ThumbsUp, ThumbsDown, RotateCcw]

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: 36 }}>
      {icons.map((Icon, index) => (
        <Icon key={`${second ? 'second' : 'first'}-${index}`} color="#777772" size={39} strokeWidth={2.35} />
      ))}
    </div>
  )
}

function ClaudeFlowUserBubble({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div style={{ ...style, display: 'flex', justifyContent: 'flex-end', paddingRight: 42 }}>
      <div
        style={{
          alignItems: 'center',
          background: '#f1f0ee',
          border: '1px solid #dfddd8',
          borderRadius: 68,
          boxSizing: 'border-box',
          color: '#111111',
          display: 'flex',
          fontFamily: FONT_STACK,
          fontSize: 38,
          fontWeight: 400,
          justifyContent: 'center',
          letterSpacing: '-0.76px',
          lineHeight: 1.12,
          maxWidth: 760,
          minHeight: 96,
          padding: '25px 40px',
          width: 'max-content',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ClaudeFlowAssistantText({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        color: '#111111',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 43,
        fontWeight: 500,
        letterSpacing: '-0.55px',
        lineHeight: 1.26,
        padding: '0 42px',
      }}
    >
      {children}
    </div>
  )
}

function ClaudeToolResultCard({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div
      className="claude-tool-result-card"
      style={{
        ...style,
        background: 'transparent',
        border: '1px solid #dfddd8',
        borderRadius: 28,
        boxShadow: '0 14px 38px rgba(20, 24, 22, 0.10)',
        margin: '0 42px',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

function ClaudeVoiceButton() {
  return (
    <div style={{ alignItems: 'center', background: '#050505', borderRadius: 999, display: 'flex', gap: 6, height: 78, justifyContent: 'center', width: 78 }}>
      {[19, 29, 39, 29, 19].map((height, index) => (
        <span key={`${height}-${index}`} style={{ background: '#ffffff', borderRadius: 999, height, width: 5 }} />
      ))}
    </div>
  )
}

function ClaudeMobileScreenshot() {
  const frame = useCurrentFrame()
  const conversationY = interpolate(
    frame,
    [0, 160, 300, 470, 640, 820, 1000, 1180, 1360],
    [0, 0, -410, -1040, -1700, -2380, -3180, -3980, -4860],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  )

  return (
    <AbsoluteFill style={{ background: '#fbfaf8', color: '#111111', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <style>
        {`
          .claude-tool-result-card,
          .claude-tool-result-card .app-shell,
          .claude-tool-result-card .chart-card,
          .claude-tool-result-card .table-card,
          .claude-tool-result-card .table-scroll,
          .claude-tool-result-card .table-pagination,
          .claude-tool-result-card .data-table th,
          .claude-tool-result-card .data-table tbody tr,
          .claude-tool-result-card .data-table td,
          .claude-tool-result-card .data-table--financial .financial-row--normal td,
          .claude-tool-result-card .data-table--financial .financial-row--child td,
          .claude-tool-result-card .data-table--financial .financial-row--subtotal td,
          .claude-tool-result-card .data-table tbody tr:hover,
          .claude-tool-result-card .data-table--financial tbody tr:hover,
          .claude-tool-result-card .dashboard-card,
          .claude-tool-result-card .catalog-panel,
          .claude-tool-result-card .connector-result,
          .claude-tool-result-card .connectors-directory,
          .claude-tool-result-card .connectors-directory__topline,
          .claude-tool-result-card .connectors-directory__header,
          .claude-tool-result-card .connectors-directory__footer,
          .claude-tool-result-card .connector-row__mark,
          .claude-tool-result-card .analysis-panel {
            background: transparent !important;
          }

          .claude-tool-result-card {
            --cognito-bg: transparent;
            --cognito-surface: transparent;
            --cognito-surface-muted: transparent;
          }
        `}
      </style>
      <ClaudeStatusBar />

      <Menu color="#333330" size={47} strokeWidth={2.4} style={{ left: 61, position: 'absolute', top: 161 }} />
      <div style={{ alignItems: 'center', background: '#333330', borderRadius: 999, display: 'flex', height: 54, justifyContent: 'center', left: 837, position: 'absolute', top: 151, width: 54 }}>
        <Plus color="#ffffff" size={42} strokeWidth={3.2} />
      </div>
      <MoreHorizontal color="#333330" size={50} strokeWidth={3.2} style={{ left: 969, position: 'absolute', top: 158 }} />

      <div style={{ bottom: 340, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 226 }}>
        <div style={{ display: 'grid', gap: 34, padding: '20px 0 820px', transform: `translateY(${conversationY}px)` }}>
          <ClaudeFlowUserBubble style={chatGptSequenceStyle(frame, 10, 18)}>
            Mostre receita por canal
          </ClaudeFlowUserBubble>
          <ClaudeFlowAssistantText style={chatGptSequenceStyle(frame, 48, 22)}>
            Claro. Aqui está o gráfico da receita por canal nos últimos 30 dias.
          </ClaudeFlowAssistantText>
          <ClaudeToolResultCard style={chatGptSequenceStyle(frame, 78, 22)}>
            <AnimatedMcpChartView data={chatGptSequenceChartData} startFrame={78} />
          </ClaudeToolResultCard>

          <ClaudeFlowUserBubble style={chatGptSequenceStyle(frame, 178, 18)}>
            Agora em tabela
          </ClaudeFlowUserBubble>
          <ClaudeFlowAssistantText style={chatGptSequenceStyle(frame, 216, 22)}>
            Montei a tabela com as contas a pagar abertas e agendadas.
          </ClaudeFlowAssistantText>
          <ClaudeToolResultCard style={chatGptSequenceStyle(frame, 246, 22)}>
            <AnimatedMcpTableView data={chatGptSequenceTableData} startFrame={246} />
          </ClaudeToolResultCard>

          <ClaudeFlowUserBubble style={chatGptSequenceStyle(frame, 358, 18)}>
            Quais fontes estão conectadas?
          </ClaudeFlowUserBubble>
          <ClaudeFlowAssistantText style={chatGptSequenceStyle(frame, 396, 22)}>
            Estas são as integrações usadas para consultar ERP, e-commerce e marketing.
          </ClaudeFlowAssistantText>
          <ClaudeToolResultCard style={chatGptSequenceStyle(frame, 426, 22)}>
            <AnimatedMcpConnectorsView data={chatGptSequenceConnectorsData} startFrame={426} />
          </ClaudeToolResultCard>

          <ClaudeFlowUserBubble style={chatGptSequenceStyle(frame, 548, 18)}>
            Mostre o catalogo de dados
          </ClaudeFlowUserBubble>
          <ClaudeFlowAssistantText style={chatGptSequenceStyle(frame, 586, 22)}>
            Encontrei os recursos disponiveis e a qualidade dos dados conectados.
          </ClaudeFlowAssistantText>
          <ClaudeToolResultCard style={chatGptSequenceStyle(frame, 616, 22)}>
            <AnimatedMcpDataCatalogView data={chatGptSequenceDataCatalogData} startFrame={616} />
          </ClaudeToolResultCard>

          <ClaudeFlowUserBubble style={chatGptSequenceStyle(frame, 736, 18)}>
            Liste meus dashboards
          </ClaudeFlowUserBubble>
          <ClaudeFlowAssistantText style={chatGptSequenceStyle(frame, 774, 22)}>
            Estes dashboards ja estao disponiveis para abrir no app.
          </ClaudeFlowAssistantText>
          <ClaudeToolResultCard style={chatGptSequenceStyle(frame, 804, 22)}>
            <AnimatedMcpDashboardListView data={chatGptSequenceDashboardListData} startFrame={804} />
          </ClaudeToolResultCard>

          <ClaudeFlowUserBubble style={chatGptSequenceStyle(frame, 926, 18)}>
            E a DRE?
          </ClaudeFlowUserBubble>
          <ClaudeFlowAssistantText style={chatGptSequenceStyle(frame, 964, 22)}>
            Aqui está a DRE consolidada em formato de demonstrativo financeiro.
          </ClaudeFlowAssistantText>
          <ClaudeToolResultCard style={chatGptSequenceStyle(frame, 994, 22)}>
            <AnimatedMcpDreView data={chatGptSequenceDreData} startFrame={994} />
          </ClaudeToolResultCard>

          <ClaudeFlowUserBubble style={chatGptSequenceStyle(frame, 1116, 18)}>
            Resume para mim
          </ClaudeFlowUserBubble>
          <ClaudeFlowAssistantText style={chatGptSequenceStyle(frame, 1154, 22)}>
            Fechei um resumo executivo com os principais sinais e próximos passos.
          </ClaudeFlowAssistantText>
          <ClaudeToolResultCard style={chatGptSequenceStyle(frame, 1184, 22)}>
            <AnimatedMcpAnalysisView data={chatGptSequenceAnalysisData} startFrame={1184} />
          </ClaudeToolResultCard>

          <div style={chatGptSequenceStyle(frame, 1244, 14)}>
            <div style={{ padding: '10px 0 0 52px' }}>
              <ClaudeActionRow second />
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fbfaf8', bottom: 0, height: 340, left: 0, position: 'absolute', right: 0 }}>
        <div style={{ background: '#fbfaf8', border: '1.5px solid #bebcb7', borderRadius: 68, boxShadow: '0 20px 48px rgba(20,24,22,0.16)', height: 254, left: 42, position: 'absolute', right: 42, top: 0 }}>
          <div style={{ color: '#77746f', fontSize: 42, fontWeight: 450, left: 36, letterSpacing: 0, lineHeight: 1, position: 'absolute', top: 53 }}>Responder a Claude</div>
          <div style={{ alignItems: 'center', display: 'flex', gap: 19, left: 22, position: 'absolute', right: 24, top: 145 }}>
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, display: 'flex', height: 78, justifyContent: 'center', width: 78 }}>
              <Plus color="#111111" size={43} strokeWidth={2.6} />
            </div>
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, color: '#111111', display: 'flex', fontSize: 35, fontWeight: 520, height: 78, justifyContent: 'center', letterSpacing: 0, padding: '0 42px', whiteSpace: 'nowrap' }}>Sonnet 4.6</div>
            <div style={{ flex: 1 }} />
            <div style={{ alignItems: 'center', background: '#efeeeb', borderRadius: 999, display: 'flex', height: 78, justifyContent: 'center', width: 78 }}>
              <Mic color="#333330" size={45} strokeWidth={2.8} />
            </div>
            <ClaudeVoiceButton />
          </div>
        </div>
        <div style={{ background: '#050505', borderRadius: 999, bottom: 14, height: 12, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 380 }} />
      </div>
    </AbsoluteFill>
  )
}

function ClaudeMobileAnimationCard() {
  return <ClaudeMobileScreenshot />
}

function EmailAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const typeIn = progress(frame, 70, 170)
  const sendIn = progress(frame, 188, 240)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(43,126,165,0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Email drafting" />
      <section style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 34, boxShadow: '0 44px 110px rgba(20,24,22,0.20)', display: 'grid', gridTemplateRows: '72px 1fr', left: 74, opacity: sceneIn, overflow: 'hidden', position: 'absolute', right: 74, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <header style={{ alignItems: 'center', borderBottom: '1px solid #e5ece7', display: 'flex', justifyContent: 'space-between', padding: '0 28px' }}>
          <strong style={{ color: '#0f1512', fontSize: 24, letterSpacing: 0 }}>cfo@acme.com</strong>
          <span style={{ background: '#e8f1ec', borderRadius: 999, color: '#225f42', fontSize: 17, fontWeight: 850, padding: '9px 13px' }}>AI compose</span>
        </header>
        <div style={{ display: 'grid', gap: 24, padding: 32 }}>
          {[
            ['To', 'finance-team@acme.com'],
            ['Subject', 'Plano de ação do fechamento de maio'],
          ].map(([label, value]) => (
            <div key={label} style={{ alignItems: 'center', borderBottom: '1px solid #e5ece7', display: 'grid', gridTemplateColumns: '110px 1fr', paddingBottom: 16 }}>
              <span style={{ color: '#65716a', fontSize: 22, fontWeight: 780 }}>{label}</span>
              <strong style={{ color: '#0f1512', fontSize: 25, letterSpacing: 0 }}>{value}</strong>
            </div>
          ))}
          <div style={{ display: 'grid', gap: 18, minHeight: 570 }}>
            {[
              'Pessoal, segue resumo executivo do fechamento de maio.',
              'A IA identificou três frentes prioritárias: fretes recorrentes, campanhas acima do teto e contratos com reajuste próximo.',
              'Recomendo aprovar o plano de ação abaixo e revisar os responsáveis até sexta.',
            ].map((line, index) => {
              const p = progress(typeIn, index * 0.26, index * 0.26 + 0.34)
              return (
                <p key={line} style={{ color: '#1f2a24', fontSize: 30, fontWeight: 560, letterSpacing: 0, lineHeight: 1.35, margin: 0, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
                  {line}
                </p>
              )
            })}
            <div style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 24, display: 'grid', gap: 14, marginTop: 10, opacity: progress(typeIn, 0.62, 1), padding: 22 }}>
              {['Renegociar SLA com Frete Sul', 'Reduzir budget de campanhas sem ROAS', 'Preparar contratos para revisão'].map((item, index) => (
                <div key={item} style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
                  <span style={{ background: galleryItems[index].accent, borderRadius: 999, display: 'block', height: 16, width: 16 }} />
                  <span style={{ color: '#0f1512', fontSize: 24, fontWeight: 780 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Anexar', 'Assinatura', 'Agendar'].map((item) => <span key={item} style={{ background: '#f3f7f4', borderRadius: 999, color: '#516057', fontSize: 18, fontWeight: 800, padding: '11px 15px' }}>{item}</span>)}
            </div>
            <span style={{ background: '#225f42', borderRadius: 999, boxShadow: '0 18px 46px rgba(34,95,66,0.28)', color: '#ffffff', fontSize: 22, fontWeight: 900, opacity: sendIn, padding: '15px 24px', transform: `translateX(${(1 - sendIn) * 20}px)` }}>Enviar</span>
          </div>
        </div>
      </section>
      <GalleryFooter>Email animado com redação automática e envio</GalleryFooter>
    </AbsoluteFill>
  )
}

function InboxAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 96) % 5
  const emails = [
    ['Banco', 'Divergência no extrato', 'Alta', '#c28f2c'],
    ['Fornecedor', 'Contrato vence em 14 dias', 'Média', '#8b6f9d'],
    ['Financeiro', 'DRE pronta para revisão', 'OK', '#225f42'],
    ['Marketing', 'Campanha acima do teto', 'Alta', '#c28f2c'],
    ['Diretoria', 'Board pack de maio', 'Novo', '#3f6d91'],
  ]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34,95,66,0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Inbox triage" />
      <section style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 34, boxShadow: '0 44px 110px rgba(20,24,22,0.20)', display: 'grid', gridTemplateColumns: '1fr 330px', left: 62, opacity: sceneIn, overflow: 'hidden', position: 'absolute', right: 62, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 12, padding: 28 }}>
          <strong style={{ color: '#0f1512', fontSize: 42, letterSpacing: 0, marginBottom: 12 }}>Inbox financeiro</strong>
          {emails.map(([from, subject, status, color], index) => {
            const p = progress(frame, 28 + index * 14, 68 + index * 14)
            const active = index === activeIndex
            return (
              <div key={subject} style={{ alignItems: 'center', background: active ? '#f7faf7' : '#ffffff', border: `1px solid ${active ? color : '#e5ece7'}`, borderRadius: 22, display: 'grid', gap: 16, gridTemplateColumns: '58px 1fr auto', opacity: p, padding: 18, transform: `translateX(${(1 - p) * -24}px)` }}>
                <span style={{ alignItems: 'center', background: color, borderRadius: 18, color: '#ffffff', display: 'flex', fontSize: 22, fontWeight: 900, height: 58, justifyContent: 'center', width: 58 }}>{from.slice(0, 1)}</span>
                <div style={{ display: 'grid', gap: 5 }}>
                  <strong style={{ color: '#0f1512', fontSize: 24, letterSpacing: 0 }}>{subject}</strong>
                  <span style={{ color: '#65716a', fontSize: 18, fontWeight: 760 }}>{from} · classificado automaticamente</span>
                </div>
                <span style={{ background: `${color}18`, borderRadius: 999, color, fontSize: 17, fontWeight: 900, padding: '9px 13px' }}>{status}</span>
              </div>
            )
          })}
        </div>
        <aside style={{ background: '#f7faf7', borderLeft: '1px solid #dfe7e1', display: 'grid', gap: 18, padding: 26, alignContent: 'start' }}>
          <strong style={{ color: '#0f1512', fontSize: 30, letterSpacing: 0 }}>Resumo IA</strong>
          {['2 alertas críticos', '1 aprovação pendente', '3 respostas sugeridas'].map((item, index) => (
            <div key={item} style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 20, display: 'grid', gap: 10, padding: 18 }}>
              <span style={{ color: galleryItems[index].accent, fontSize: 28, fontWeight: 900 }}>{index + 1}</span>
              <span style={{ color: '#0f1512', fontSize: 21, fontWeight: 820 }}>{item}</span>
            </div>
          ))}
        </aside>
      </section>
      <GalleryFooter>Inbox animado com triagem, prioridade e resumo por IA</GalleryFooter>
    </AbsoluteFill>
  )
}

function NotificationCenterAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const alerts = [
    ['Crítico', 'Contrato AWS reajusta amanhã', '#c28f2c'],
    ['Atenção', 'Frete Sul atrasou 4 vezes', '#8b6f9d'],
    ['OK', 'DRE publicada no dashboard', '#225f42'],
    ['Novo', 'Conciliação fechou 98%', '#3f6d91'],
  ]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(194,143,44,0.14), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Notification center" />
      <div style={{ left: 92, opacity: sceneIn, position: 'absolute', right: 92, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <h2 style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.98, margin: '0 0 38px' }}>Alertas operacionais em tempo real</h2>
        <div style={{ display: 'grid', gap: 18 }}>
          {alerts.map(([severity, text, color], index) => {
            const p = progress(frame, 36 + index * 34, 76 + index * 34)
            return (
              <div key={text} style={{ alignItems: 'center', background: '#ffffff', border: `1px solid ${color}`, borderRadius: 28, boxShadow: `0 24px 64px ${color}24`, display: 'grid', gap: 18, gridTemplateColumns: '84px 1fr auto', opacity: p, padding: 22, transform: `translateX(${(1 - p) * 42}px)` }}>
                <span style={{ alignItems: 'center', background: color, borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 28, fontWeight: 900, height: 72, justifyContent: 'center', width: 72 }}>{index + 1}</span>
                <div style={{ display: 'grid', gap: 7 }}>
                  <strong style={{ color: '#0f1512', fontSize: 30, letterSpacing: 0 }}>{text}</strong>
                  <span style={{ color: '#65716a', fontSize: 20, fontWeight: 760 }}>{severity} · roteado para o responsável</span>
                </div>
                <span style={{ background: `${color}18`, borderRadius: 999, color, fontSize: 18, fontWeight: 900, padding: '10px 14px' }}>Resolver</span>
              </div>
            )
          })}
        </div>
      </div>
      <GalleryFooter>Notification center com severidade, routing e ações rápidas</GalleryFooter>
    </AbsoluteFill>
  )
}

function DataPipelineAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const stages = [
    ['ERP', '#3f6d91'],
    ['Banco', '#225f42'],
    ['Normalize', '#6f8f7b'],
    ['Model', '#c28f2c'],
    ['Dashboard', '#8b6f9d'],
  ]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34,95,66,0.16), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Data pipeline" />
      <svg height="100%" style={{ left: 0, opacity: sceneIn, position: 'absolute', top: 0, zIndex: 8 }} viewBox="0 0 1080 1920" width="100%">
        <path d="M 150 860 C 310 720, 430 720, 540 860 S 770 1000, 930 860" fill="none" stroke="#225f42" strokeDasharray="22 22" strokeDashoffset={-(frame * 5)} strokeLinecap="round" strokeWidth="8" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', left: 72, opacity: sceneIn, position: 'absolute', right: 72, top: 705, zIndex: 20 }}>
        {stages.map(([label, color], index) => {
          const p = progress(frame, 40 + index * 24, 84 + index * 24)
          return (
            <div key={label} style={{ alignItems: 'center', display: 'grid', gap: 16, justifyItems: 'center', opacity: p, transform: `translateY(${(1 - p) * 28}px)` }}>
              <span style={{ alignItems: 'center', background: color, borderRadius: 34, boxShadow: `0 26px 70px ${color}38`, color: '#ffffff', display: 'flex', fontSize: 26, fontWeight: 900, height: 132, justifyContent: 'center', width: 132 }}>{label.slice(0, 2)}</span>
              <strong style={{ color: '#0f1512', fontSize: 25, letterSpacing: 0 }}>{label}</strong>
            </div>
          )
        })}
      </div>
      <div style={{ background: '#102019', borderRadius: 34, boxShadow: '0 40px 100px rgba(20,24,22,0.22)', color: '#ffffff', left: 120, padding: 34, position: 'absolute', right: 120, top: 1120, zIndex: 30 }}>
        <span style={{ color: '#8aa895', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Pipeline financeiro</span>
        <h2 style={{ color: '#ffffff', fontSize: 60, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 0' }}>Dados confiáveis fluindo até a decisão</h2>
      </div>
      <GalleryFooter>Data pipeline com fluxo técnico e transformação de dados</GalleryFooter>
    </AbsoluteFill>
  )
}

function ReportExportAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const exportP = progress(frame, 78, 190)
  const formats = ['PDF', 'PPT', 'XLS']

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(63,109,145,0.15), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Report export" />
      <section style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 34, boxShadow: '0 44px 110px rgba(20,24,22,0.20)', left: 90, opacity: sceneIn, padding: 36, position: 'absolute', right: 90, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <span style={{ color: '#65716a', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Relatório gerencial</span>
        <h2 style={{ color: '#0f1512', fontSize: 64, letterSpacing: 0, lineHeight: 0.98, margin: '14px 0 34px' }}>Exportando artefatos executivos</h2>
        <div style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 26, display: 'grid', gap: 18, padding: 26 }}>
          {[88, 72, 94, 64, 82].map((width, index) => <span key={width} style={{ background: index === 2 ? '#225f42' : '#dce6df', borderRadius: 999, display: 'block', height: 14, width: `${width}%` }} />)}
          <div style={{ alignItems: 'end', display: 'flex', gap: 12, height: 220, marginTop: 16 }}>
            {[96, 146, 118, 210, 164, 286].map((height, index) => <span key={height} style={{ background: index > 3 ? '#225f42' : '#dce6df', borderRadius: 10, flex: 1, height }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 34 }}>
          {formats.map((format, index) => {
            const p = progress(exportP, index * 0.18, index * 0.18 + 0.46)
            return (
              <div key={format} style={{ alignItems: 'center', background: galleryItems[index].accent, borderRadius: 24, boxShadow: `0 24px 64px ${galleryItems[index].accent}35`, color: '#ffffff', display: 'flex', fontSize: 34, fontWeight: 900, height: 128, justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * -42}px) scale(${0.86 + p * 0.14})`, width: 128 }}>
                {format}
              </div>
            )
          })}
        </div>
      </section>
      <GalleryFooter>Report export transformando dados em PDF, slides e planilha</GalleryFooter>
    </AbsoluteFill>
  )
}

function ApprovalFlowAnimationCard() {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const approved = progress(frame, 150, 230)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34,95,66,0.16), rgba(244,247,244,0) 58%)', bottom: -180, left: -160, position: 'absolute', right: -160, top: -180 }} />
      <GallerySceneHeader status="Approval flow" />
      <section style={{ left: 70, opacity: sceneIn, position: 'absolute', right: 70, top: 330, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 34, boxShadow: '0 44px 110px rgba(20,24,22,0.20)', display: 'grid', gap: 24, padding: 34 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: '#65716a', fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>Aprovação pendente</span>
              <strong style={{ color: '#0f1512', fontSize: 58, letterSpacing: 0, lineHeight: 0.98 }}>Pagamento Frete Sul</strong>
            </div>
            <strong style={{ color: '#c28f2c', fontSize: 42, letterSpacing: 0 }}>R$ 8.420</strong>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {['Solicitado por Operações', 'Validado contra contrato', 'Centro de custo confirmado', 'Aguardando aprovação CFO'].map((step, index) => {
              const p = progress(frame, 42 + index * 28, 82 + index * 28)
              const done = index < 3 || approved > 0.5
              return (
                <div key={step} style={{ alignItems: 'center', background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 22, display: 'grid', gap: 16, gridTemplateColumns: '54px 1fr', opacity: p, padding: 18 }}>
                  <span style={{ alignItems: 'center', background: done ? '#225f42' : '#c28f2c', borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 22, fontWeight: 900, height: 48, justifyContent: 'center', width: 48 }}>{done ? '✓' : '!'}</span>
                  <span style={{ color: '#0f1512', fontSize: 25, fontWeight: 800 }}>{step}</span>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <span style={{ background: '#fff7ed', borderRadius: 999, color: '#c28f2c', fontSize: 22, fontWeight: 900, padding: '15px 22px' }}>Revisar</span>
            <span style={{ background: '#225f42', borderRadius: 999, boxShadow: '0 20px 54px rgba(34,95,66,0.25)', color: '#ffffff', fontSize: 22, fontWeight: 900, opacity: progress(frame, 122, 170), padding: '15px 22px' }}>Aprovar</span>
          </div>
        </div>
        <div style={{ background: '#102019', borderRadius: 28, boxShadow: '0 28px 80px rgba(20,24,22,0.22)', color: '#ffffff', marginTop: 22, opacity: approved, padding: 26, transform: `translateY(${(1 - approved) * 24}px)` }}>
          <strong style={{ color: '#8aa895', fontSize: 34, letterSpacing: 0 }}>Aprovado e enviado ao ERP</strong>
        </div>
      </section>
      <GalleryFooter>Approval flow com validações, responsável e ação final</GalleryFooter>
    </AbsoluteFill>
  )
}

function AIAgentStepsAnimationCard() {
  const frame = useCurrentFrame()
  const steps = ['Ler bases', 'Classificar eventos', 'Conciliar saldos', 'Gerar insights', 'Publicar resumo']
  const logs = ['Conectando ERP e banco', '12.840 registros lidos', '3 anomalias priorizadas', 'Resumo executivo pronto']

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 42%, rgba(34,95,66,0.18), rgba(244,247,244,0) 62%)', inset: -180, position: 'absolute' }} />
      <GallerySceneHeader status="AI agent" />
      <section style={{ display: 'grid', gap: 26, gridTemplateColumns: '1.15fr 0.85fr', left: 70, position: 'absolute', right: 70, top: 324, zIndex: 20 }}>
        <div style={{ background: '#102019', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 34, boxShadow: '0 44px 110px rgba(20,24,22,0.26)', color: '#ffffff', display: 'grid', gap: 26, padding: 34 }}>
          <div style={{ display: 'grid', gap: 9 }}>
            <span style={{ color: '#8aa895', fontSize: 21, fontWeight: 900, textTransform: 'uppercase' }}>Agente financeiro</span>
            <strong style={{ color: '#ffffff', fontSize: 58, letterSpacing: 0, lineHeight: 0.98 }}>Executando fechamento</strong>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {steps.map((step, index) => {
              const p = progress(frame, 24 + index * 30, 82 + index * 30)
              const done = p > 0.88
              return (
                <div key={step} style={{ alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 22, display: 'grid', gap: 17, gridTemplateColumns: '56px 1fr 88px', opacity: 0.32 + p * 0.68, padding: 18, transform: `translateX(${(1 - p) * 20}px)` }}>
                  <span style={{ alignItems: 'center', background: done ? '#67e08f' : '#25382e', borderRadius: 999, color: done ? '#0f1512' : '#8aa895', display: 'flex', fontSize: 22, fontWeight: 950, height: 50, justifyContent: 'center', width: 50 }}>{done ? '✓' : index + 1}</span>
                  <span style={{ color: '#ffffff', fontSize: 26, fontWeight: 850 }}>{step}</span>
                  <span style={{ color: done ? '#67e08f' : '#8aa895', fontSize: 20, fontWeight: 900, textAlign: 'right' }}>{done ? 'OK' : `${Math.round(p * 100)}%`}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 30, boxShadow: '0 34px 84px rgba(20,24,22,0.16)', display: 'grid', gap: 18, padding: 28 }}>
            <span style={{ color: '#65716a', fontSize: 21, fontWeight: 900, textTransform: 'uppercase' }}>Logs do agente</span>
            {logs.map((log, index) => {
              const p = progress(frame, 48 + index * 42, 88 + index * 42)
              return (
                <div key={log} style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 18, opacity: p, padding: 16, transform: `translateY(${(1 - p) * 18}px)` }}>
                  <span style={{ color: '#0f1512', fontSize: 23, fontWeight: 820 }}>{log}</span>
                </div>
              )
            })}
          </div>
          <div style={{ background: '#225f42', borderRadius: 28, boxShadow: '0 28px 70px rgba(34,95,66,0.24)', color: '#ffffff', opacity: progress(frame, 186, 245), padding: 26 }}>
            <strong style={{ fontSize: 36, letterSpacing: 0 }}>Plano de ação criado</strong>
          </div>
        </div>
      </section>
      <GalleryFooter>AI agent com etapas, logs e saída operacional</GalleryFooter>
    </AbsoluteFill>
  )
}

function FileUploadProcessingAnimationCard() {
  const frame = useCurrentFrame()
  const stages = ['Upload', 'OCR', 'Classificação', 'Aprovado']

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(63,109,145,0.18), rgba(244,247,244,0) 60%)', inset: -180, position: 'absolute' }} />
      <GallerySceneHeader status="File upload" />
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} style={{ background: 'rgba(255,255,255,0.42)', border: '1px solid rgba(211,224,216,0.72)', borderRadius: 22, height: 190, left: [60, 820, 116, 760, 20, 874][item], opacity: 0.32, position: 'absolute', top: [280, 360, 610, 760, 1010, 1140][item], transform: `rotate(${[-14, 10, -8, 13, 7, -11][item]}deg) scale(0.8)`, width: 150 }} />
      ))}
      <section style={{ left: 92, position: 'absolute', right: 92, top: 332, zIndex: 20 }}>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 36, boxShadow: '0 44px 110px rgba(20,24,22,0.20)', display: 'grid', gap: 28, padding: 34 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: '#65716a', fontSize: 21, fontWeight: 900, textTransform: 'uppercase' }}>Entrada de arquivos</span>
              <strong style={{ color: '#0f1512', fontSize: 56, letterSpacing: 0, lineHeight: 0.98 }}>Processamento automático</strong>
            </div>
            <strong style={{ color: '#3f6d91', fontSize: 40, letterSpacing: 0 }}>42 docs</strong>
          </div>
          <div style={{ alignItems: 'center', display: 'grid', gap: 22, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[0, 1, 2].map((card) => {
              const p = progress((frame + card * 44) % 160, 0, 120)
              return (
                <div key={card} style={{ background: card === 1 ? '#eef5f8' : '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 26, boxShadow: card === 1 ? '0 24px 58px rgba(63,109,145,0.18)' : 'none', display: 'grid', gap: 18, height: 410, padding: 24, transform: `translateY(${interpolate(p, [0, 0.52, 1], [-64, 0, 52])}px) scale(${card === 1 ? 1.08 : 0.92})` }}>
                  <span style={{ background: card === 1 ? '#3f6d91' : '#d7e2dc', borderRadius: 999, display: 'block', height: 8, width: '48%' }} />
                  <div style={{ display: 'grid', gap: 11 }}>
                    {[82, 64, 91, 58, 74].map((width, line) => (
                      <span key={`${card}-${line}`} style={{ background: line === 2 && card === 1 ? '#3f6d91' : '#d7e2dc', borderRadius: 999, display: 'block', height: 13, width: `${width}%` }} />
                    ))}
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 18, marginTop: 'auto', padding: 18 }}>
                    <strong style={{ color: '#0f1512', fontSize: 25, letterSpacing: 0 }}>NF_{1280 + card}.pdf</strong>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'grid', gap: 13, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {stages.map((stage, index) => {
              const p = progress(frame, 28 + index * 42, 86 + index * 42)
              return (
                <div key={stage} style={{ background: p > 0.86 ? '#225f42' : '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 18, color: p > 0.86 ? '#ffffff' : '#65716a', fontSize: 22, fontWeight: 900, padding: '17px 18px', textAlign: 'center' }}>{stage}</div>
              )
            })}
          </div>
        </div>
      </section>
      <GalleryFooter>File upload com OCR, leitura e classificação automática</GalleryFooter>
    </AbsoluteFill>
  )
}

function TableDrilldownAnimationCard() {
  const frame = useCurrentFrame()
  const active = Math.floor(frame / 58) % 4
  const rows = [
    ['Fornecedor', 'R$ 31.280', 'Margem'],
    ['Marketing', 'R$ 18.400', 'CAC'],
    ['Logística', 'R$ 8.420', 'Frete'],
    ['Cloud', 'R$ 12.790', 'Infra'],
  ]

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 46% 48%, rgba(34,95,66,0.16), rgba(244,247,244,0) 62%)', inset: -180, position: 'absolute' }} />
      <GallerySceneHeader status="Table drilldown" />
      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.1fr 0.9fr', left: 70, position: 'absolute', right: 70, top: 342, zIndex: 20 }}>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 34, boxShadow: '0 44px 110px rgba(20,24,22,0.18)', overflow: 'hidden' }}>
          <div style={{ background: '#102019', color: '#ffffff', display: 'grid', fontSize: 20, fontWeight: 900, gridTemplateColumns: '1.2fr 0.8fr 0.8fr', padding: '22px 26px', textTransform: 'uppercase' }}>
            <span>Categoria</span>
            <span>Valor</span>
            <span>Driver</span>
          </div>
          {rows.map((row, index) => {
            const selected = index === active
            return (
              <div key={row[0]} style={{ alignItems: 'center', background: selected ? '#edf6f0' : '#ffffff', borderBottom: '1px solid #dfe7e1', display: 'grid', fontSize: 25, fontWeight: 800, gridTemplateColumns: '1.2fr 0.8fr 0.8fr', padding: '29px 26px', transform: selected ? 'scale(1.02)' : 'scale(1)', transformOrigin: 'center' }}>
                <span style={{ color: '#0f1512' }}>{row[0]}</span>
                <span style={{ color: selected ? '#225f42' : '#0f1512' }}>{row[1]}</span>
                <span style={{ color: '#65716a' }}>{row[2]}</span>
              </div>
            )
          })}
        </div>
        <div style={{ background: '#102019', borderRadius: 34, boxShadow: '0 38px 92px rgba(20,24,22,0.24)', color: '#ffffff', display: 'grid', gap: 24, padding: 32 }}>
          <span style={{ color: '#8aa895', fontSize: 21, fontWeight: 900, textTransform: 'uppercase' }}>Detalhe selecionado</span>
          <strong style={{ color: '#ffffff', fontSize: 52, letterSpacing: 0, lineHeight: 1 }}>{rows[active][0]}</strong>
          <div style={{ display: 'grid', gap: 14 }}>
            {['Variação mensal', 'Notas vinculadas', 'Recomendação IA'].map((label, index) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 20 }}>
                <span style={{ color: '#8aa895', display: 'block', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{label}</span>
                <strong style={{ color: index === 0 ? '#67e08f' : '#ffffff', fontSize: 28, letterSpacing: 0 }}>{index === 0 ? '+12.4%' : index === 1 ? `${active + 4} documentos` : 'Revisar centro de custo'}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <GalleryFooter>Table drilldown com linha ativa e painel de detalhe</GalleryFooter>
    </AbsoluteFill>
  )
}

function CompareScenariosAnimationCard() {
  const frame = useCurrentFrame()
  const scenarios = [
    { label: 'Conservador', value: 'R$ 1,8M', accent: '#3f6d91', bars: [38, 46, 52, 58] },
    { label: 'Base', value: 'R$ 2,4M', accent: '#225f42', bars: [44, 58, 68, 76] },
    { label: 'Stretch', value: 'R$ 3,1M', accent: '#c28f2c', bars: [52, 68, 82, 94] },
  ]
  const active = Math.floor(frame / 72) % scenarios.length

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 50%, rgba(194,143,44,0.14), rgba(244,247,244,0) 60%)', inset: -180, position: 'absolute' }} />
      <GallerySceneHeader status="Compare scenarios" />
      <section style={{ left: 70, position: 'absolute', right: 70, top: 326, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 22, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {scenarios.map((scenario, index) => {
            const selected = index === active
            return (
              <div key={scenario.label} style={{ background: selected ? '#102019' : '#ffffff', border: `1px solid ${selected ? scenario.accent : '#dfe7e1'}`, borderRadius: 34, boxShadow: selected ? '0 44px 110px rgba(20,24,22,0.25)' : '0 26px 70px rgba(20,24,22,0.11)', color: selected ? '#ffffff' : '#0f1512', display: 'grid', gap: 28, minHeight: 720, padding: 30, transform: selected ? 'translateY(-18px)' : 'translateY(22px)' }}>
                <span style={{ color: selected ? '#8aa895' : '#65716a', fontSize: 21, fontWeight: 900, textTransform: 'uppercase' }}>{scenario.label}</span>
                <strong style={{ color: selected ? '#ffffff' : '#0f1512', fontSize: 54, letterSpacing: 0, lineHeight: 1 }}>{scenario.value}</strong>
                <div style={{ alignItems: 'end', display: 'flex', gap: 14, height: 300, marginTop: 10 }}>
                  {scenario.bars.map((height, bar) => (
                    <span key={`${scenario.label}-${bar}`} style={{ background: bar === 3 ? scenario.accent : selected ? 'rgba(255,255,255,0.20)' : '#dce6df', borderRadius: 10, flex: 1, height: `${height * (0.78 + progress(frame, 12 + bar * 16, 86 + bar * 16) * 0.22)}%` }} />
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 14, marginTop: 'auto' }}>
                  {['Receita', 'Margem', 'Caixa'].map((metric, metricIndex) => (
                    <div key={metric} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: selected ? '#8aa895' : '#65716a', fontSize: 22, fontWeight: 780 }}>{metric}</span>
                      <strong style={{ color: metricIndex === 1 ? scenario.accent : selected ? '#ffffff' : '#0f1512', fontSize: 22 }}>{metricIndex === 0 ? '+18%' : metricIndex === 1 ? '+4.2pp' : '96 dias'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
      <GalleryFooter>Compare scenarios com três casos financeiros lado a lado</GalleryFooter>
    </AbsoluteFill>
  )
}

function ForecastAnimationCard() {
  const frame = useCurrentFrame()
  const draw = progress(frame, 18, 150)
  const points = ['70,390', '190,340', '310,360', '430,270', '550,235', '670,180', '790,130']

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 48%, rgba(34,95,66,0.16), rgba(244,247,244,0) 62%)', inset: -180, position: 'absolute' }} />
      <GallerySceneHeader status="Forecast" />
      <section style={{ left: 72, position: 'absolute', right: 72, top: 330, zIndex: 20 }}>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 36, boxShadow: '0 44px 110px rgba(20,24,22,0.20)', display: 'grid', gap: 30, padding: 34 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: '#65716a', fontSize: 21, fontWeight: 900, textTransform: 'uppercase' }}>Previsão financeira</span>
              <strong style={{ color: '#0f1512', fontSize: 58, letterSpacing: 0, lineHeight: 0.98 }}>Forecast de caixa</strong>
            </div>
            <div style={{ background: '#edf6f0', border: '1px solid #cfe0d4', borderRadius: 24, padding: '18px 22px', textAlign: 'right' }}>
              <span style={{ color: '#65716a', display: 'block', fontSize: 19, fontWeight: 820 }}>Confiança</span>
              <strong style={{ color: '#225f42', fontSize: 38, letterSpacing: 0 }}>92%</strong>
            </div>
          </div>
          <div style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 28, height: 520, overflow: 'hidden', position: 'relative' }}>
            <svg height="520" viewBox="0 0 860 520" width="100%" style={{ display: 'block' }}>
              {[120, 220, 320, 420].map((y) => <line key={y} stroke="#dfe7e1" strokeWidth="2" x1="46" x2="818" y1={y} y2={y} />)}
              <path d={`M ${points.join(' L ')}`} fill="none" pathLength="1" stroke="#225f42" strokeDasharray="1" strokeDashoffset={1 - draw} strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
              <path d="M 430 270 L 550 235 L 670 180 L 790 130" fill="none" pathLength="1" stroke="#c28f2c" strokeDasharray="0.04 0.04" strokeDashoffset={1 - draw} strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
              <path d="M 430 270 L 550 235 L 670 180 L 790 130 L 790 430 L 430 430 Z" fill="#225f42" opacity="0.10" />
              {points.map((point, index) => {
                const [cx, cy] = point.split(',').map(Number)
                return <circle key={point} cx={cx} cy={cy} fill={index > 3 ? '#c28f2c' : '#225f42'} opacity={progress(frame, 34 + index * 18, 80 + index * 18)} r="10" />
              })}
            </svg>
            <span style={{ background: '#102019', borderRadius: 999, color: '#ffffff', fontSize: 22, fontWeight: 900, left: 560, opacity: progress(frame, 154, 210), padding: '13px 18px', position: 'absolute', top: 98 }}>Projeção +18%</span>
          </div>
        </div>
      </section>
      <GalleryFooter>Forecast com histórico, projeção e intervalo visual</GalleryFooter>
    </AbsoluteFill>
  )
}

function MobileAppDemoAnimationCard() {
  const frame = useCurrentFrame()
  const pulse = progress(frame % 120, 0, 70)

  return (
    <AbsoluteFill style={{ background: '#f4f7f4', color: '#0f1512', fontFamily: FONT_STACK, overflow: 'hidden' }}>
      <div style={{ background: 'radial-gradient(circle at 50% 45%, rgba(34,95,66,0.20), rgba(244,247,244,0) 62%)', inset: -180, position: 'absolute' }} />
      <GallerySceneHeader status="Mobile app" />
      <div style={{ background: '#0b1118', border: '12px solid #111827', borderRadius: 64, boxShadow: '0 48px 120px rgba(20,24,22,0.30)', height: 1040, left: '50%', overflow: 'hidden', position: 'absolute', top: 310, transform: 'translateX(-50%)', width: 520, zIndex: 20 }}>
        <div style={{ background: '#f8faf8', inset: 0, position: 'absolute' }}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '34px 34px 20px' }}>
            <strong style={{ color: '#0f1512', fontSize: 27, letterSpacing: 0 }}>09:41</strong>
            <span style={{ background: '#0f1512', borderRadius: 999, display: 'block', height: 7, width: 72 }} />
          </div>
          <div style={{ display: 'grid', gap: 8, padding: '26px 34px' }}>
            <span style={{ color: '#65716a', fontSize: 20, fontWeight: 900, textTransform: 'uppercase' }}>Cognito Finance</span>
            <strong style={{ color: '#0f1512', fontSize: 46, letterSpacing: 0, lineHeight: 1 }}>Bom dia, Igor</strong>
          </div>
          <div style={{ background: '#102019', borderRadius: 32, boxShadow: '0 28px 70px rgba(20,24,22,0.22)', color: '#ffffff', display: 'grid', gap: 18, margin: '10px 28px', padding: 28 }}>
            <span style={{ color: '#8aa895', fontSize: 20, fontWeight: 850 }}>Saldo previsto</span>
            <strong style={{ color: '#ffffff', fontSize: 50, letterSpacing: 0 }}>R$ 842.900</strong>
            <span style={{ background: '#67e08f', borderRadius: 999, display: 'block', height: 9, width: `${48 + pulse * 34}%` }} />
          </div>
          <div style={{ display: 'grid', gap: 14, padding: '28px' }}>
            {['Aprovar Frete Sul', 'Conciliação completa', 'Forecast atualizado'].map((item, index) => (
              <div key={item} style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 24, boxShadow: '0 14px 34px rgba(20,24,22,0.07)', display: 'grid', gap: 14, gridTemplateColumns: '48px 1fr', padding: 18, transform: `translateX(${Math.sin((frame + index * 18) / 64) * 5}px)` }}>
                <span style={{ background: index === 0 ? '#c28f2c' : '#225f42', borderRadius: 999, height: 48, width: 48 }} />
                <div style={{ display: 'grid', gap: 6 }}>
                  <strong style={{ color: '#0f1512', fontSize: 24, letterSpacing: 0 }}>{item}</strong>
                  <span style={{ color: '#65716a', fontSize: 18, fontWeight: 750 }}>{index === 0 ? 'pendente agora' : 'há 2 min'}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: '#ffffff', borderTop: '1px solid #dfe7e1', bottom: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', left: 0, padding: '18px 24px 26px', position: 'absolute', right: 0 }}>
            {['Home', 'Caixa', 'Docs', 'Perfil'].map((item, index) => (
              <span key={item} style={{ color: index === 0 ? '#225f42' : '#65716a', fontSize: 16, fontWeight: 900, textAlign: 'center' }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
      <GalleryFooter>Mobile app financeiro com cards, alerta e navegação</GalleryFooter>
    </AbsoluteFill>
  )
}

function VerticalPipelineVisual({ item, index }: { item: VerticalPipelineItem; index: number }) {
  const darkSlide = item.kind === 'slide' && index % 2 === 0
  const lineColor = darkSlide ? 'rgba(255,255,255,0.28)' : '#dce6df'
  const panelColor = darkSlide ? 'rgba(255,255,255,0.16)' : '#f3f7f4'

  if (item.kind === 'dashboard') {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr' }}>
          {[0, 1, 2].map((tile) => (
            <span key={tile} style={{ background: panelColor, border: '1px solid #dfe7e1', borderRadius: 16, height: 82 }} />
          ))}
        </div>
        <div style={{ alignItems: 'end', display: 'flex', gap: 10, height: 210 }}>
          {[76, 126, 92, 168, 134, 198, 110].map((height, bar) => (
            <span key={`${height}-${bar}`} style={{ background: bar === index + 2 ? item.accent : '#9bb5a4', borderRadius: 8, flex: 1, height }} />
          ))}
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <span style={{ background: '#d8e3dc', borderRadius: 999, display: 'block', height: 11, width: '86%' }} />
          <span style={{ background: '#e3ebe5', borderRadius: 999, display: 'block', height: 11, width: '62%' }} />
        </div>
      </div>
    )
  }

  if (item.kind === 'reconciliation') {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 58px 1fr' }}>
          <div style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 18, display: 'grid', gap: 12, padding: 18 }}>
            <span style={{ color: '#65716a', fontSize: 20, fontWeight: 820, textTransform: 'uppercase' }}>Banco</span>
            <strong style={{ color: '#0f1512', fontSize: 31, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
            <span style={{ color: item.accent, fontSize: 27, fontWeight: 850 }}>{item.secondary}</span>
          </div>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>
            <span style={{ background: item.accent, borderRadius: 999, boxShadow: `0 0 34px ${item.accent}55`, display: 'block', height: 8, width: 58 }} />
          </div>
          <div style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 18, display: 'grid', gap: 12, padding: 18 }}>
            <span style={{ color: '#65716a', fontSize: 20, fontWeight: 820, textTransform: 'uppercase' }}>ERP</span>
            <strong style={{ color: '#0f1512', fontSize: 31, letterSpacing: 0, lineHeight: 1 }}>{item.metric}</strong>
            <span style={{ color: item.accent, fontSize: 27, fontWeight: 850 }}>{item.secondary}</span>
          </div>
        </div>
        <div style={{ background: item.status === 'Divergencia' ? '#fff8e6' : '#edf6f0', border: `1px solid ${item.status === 'Divergencia' ? '#e6c36f' : '#cfe0d4'}`, borderRadius: 18, height: 82 }} />
      </div>
    )
  }

  if (item.kind === 'slide') {
    return (
      <div style={{ display: 'grid', gap: 18 }}>
        <strong style={{ color: darkSlide ? '#ffffff' : '#0f1512', fontSize: 64, letterSpacing: 0, lineHeight: 1.02 }}>{item.title}</strong>
        <div style={{ display: 'grid', gap: 12 }}>
          {[78, 62, 86].map((width, line) => (
            <span key={`${width}-${line}`} style={{ background: lineColor, borderRadius: 999, display: 'block', height: 12, width: `${width}%` }} />
          ))}
        </div>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
          <span style={{ background: panelColor, border: `1px solid ${darkSlide ? 'rgba(255,255,255,0.18)' : '#dfe7e1'}`, borderRadius: 18, height: 118 }} />
          <span style={{ background: panelColor, border: `1px solid ${darkSlide ? 'rgba(255,255,255,0.18)' : '#dfe7e1'}`, borderRadius: 18, height: 118 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ background: panelColor, border: '1px solid #dfe7e1', borderRadius: 18, display: 'grid', gap: 13, padding: 20 }}>
        <span style={{ color: '#65716a', fontSize: 21, fontWeight: 780 }}>{item.metric}</span>
        <strong style={{ color: item.accent, fontSize: 32, letterSpacing: 0 }}>{item.secondary}</strong>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {[88, 76, 94, 63, 82, 70].map((width, line) => (
          <span key={`${width}-${line}`} style={{ background: line === index ? item.accent : lineColor, borderRadius: 999, display: 'block', height: line === index ? 14 : 10, width: `${width}%` }} />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 'auto' }}>
        <span style={{ background: panelColor, border: '1px solid #dfe7e1', borderRadius: 16, height: 84 }} />
        <span style={{ background: item.accent, border: '1px solid #dfe7e1', borderRadius: 16, height: 84 }} />
      </div>
    </div>
  )
}

function VerticalPipelineArtifact({ item, index, muted = false }: { item: VerticalPipelineItem; index: number; muted?: boolean }) {
  const isSlide = item.kind === 'slide'
  const isDashboard = item.kind === 'dashboard'
  const isReconciliation = item.kind === 'reconciliation'
  const isContract = item.kind === 'contract'
  const height = muted ? 520 : isSlide ? 560 : isDashboard ? 680 : isReconciliation ? 620 : 760
  const width = muted ? 390 : isSlide ? 760 : isDashboard ? 650 : isReconciliation ? 680 : 590
  const darkSlide = isSlide && index % 2 === 0

  return (
    <div
      style={{
        background: muted ? 'rgba(255,255,255,0.54)' : darkSlide ? item.accent : '#ffffff',
        border: `1px solid ${muted ? 'rgba(211, 224, 216, 0.70)' : darkSlide ? item.accent : '#dfe7e1'}`,
        borderRadius: muted ? '38px 28px 44px 30px' : isContract ? '34px 24px 38px 26px' : 28,
        boxShadow: muted ? '0 16px 42px rgba(20, 24, 22, 0.07)' : '0 38px 92px rgba(20, 24, 22, 0.22)',
        clipPath: muted || isContract ? 'polygon(5% 0, 100% 3%, 95% 100%, 0 97%)' : undefined,
        color: darkSlide ? '#ffffff' : '#0f1512',
        display: 'grid',
        gap: 22,
        height,
        overflow: 'hidden',
        padding: isSlide ? 38 : 34,
        position: 'relative',
        width,
      }}
    >
      <span style={{ background: darkSlide ? 'rgba(255,255,255,0.65)' : item.accent, borderRadius: 999, display: 'block', height: 8, left: 0, position: 'absolute', right: 0, top: 0 }} />
      <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between', gap: 18 }}>
        <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
          <span style={{ color: darkSlide ? 'rgba(255,255,255,0.72)' : '#65716a', fontSize: 21, fontWeight: 820, letterSpacing: 0, textTransform: 'uppercase' }}>{item.eyebrow}</span>
          <strong style={{ color: darkSlide ? '#ffffff' : '#0f1512', fontSize: isSlide ? 38 : 42, letterSpacing: 0, lineHeight: 1.02 }}>{item.title}</strong>
        </div>
        <span style={{ alignItems: 'center', background: darkSlide ? 'rgba(255,255,255,0.16)' : '#f3f7f4', border: `1px solid ${darkSlide ? 'rgba(255,255,255,0.20)' : '#dfe7e1'}`, borderRadius: 18, color: darkSlide ? '#ffffff' : item.accent, display: 'flex', flex: '0 0 auto', fontSize: 23, fontWeight: 850, height: 64, justifyContent: 'center', padding: '0 18px' }}>
          {item.secondary}
        </span>
      </div>
      <VerticalPipelineVisual index={index} item={item} />
    </div>
  )
}

function VerticalPipelineTag({ item, opacity }: { item: VerticalPipelineItem; opacity: number }) {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        border: `1px solid ${item.accent}`,
        borderRadius: 999,
        boxShadow: '0 20px 48px rgba(20, 24, 22, 0.14)',
        color: '#0f1512',
        display: 'flex',
        gap: 12,
        left: '50%',
        opacity,
        padding: '16px 22px 16px 17px',
        position: 'absolute',
        top: '50%',
        transform: `translate(210px, -94px) scale(${0.94 + opacity * 0.06})`,
        zIndex: 32,
      }}
    >
      <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
      <span style={{ color: '#65716a', fontSize: 20, fontWeight: 780 }}>Status</span>
      <strong style={{ color: item.accent, fontSize: 28, letterSpacing: 0 }}>{item.status}</strong>
    </div>
  )
}

function FloatingPipelineArtifact({ index, items }: { index: number; items: VerticalPipelineItem[] }) {
  const frame = useCurrentFrame()
  const item = items[index % items.length]
  const driftY = Math.sin((frame + index * 37) / 64) * 18
  const driftX = Math.cos((frame + index * 29) / 72) * 14
  const top = [130, 220, 360, 540, 690, 830, 1010, 1180][index % 8]
  const left = [64, 790, 142, 730, 34, 850, 210, 690][index % 8]
  const rotation = [-14, 9, -7, 15, 6, -11, 12, -5][index % 8]
  const bend = [-32, 28, -24, 34, 22, -30, 32, -20][index % 8]
  const tilt = [13, -16, 18, -12, 15, -14, 17, -11][index % 8]

  return (
    <div
      style={{
        filter: 'blur(2.1px)',
        left,
        opacity: 0.18,
        position: 'absolute',
        top,
        transform: `translate(${driftX}px, ${driftY}px) perspective(620px) rotate(${rotation}deg) rotateY(${bend}deg) rotateX(${tilt}deg) skewY(${bend / 6}deg) scale(0.20)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <VerticalPipelineArtifact index={index} item={item} muted />
    </div>
  )
}

function VerticalArtifactPipelineScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const cycle = 138
  const activeIndex = Math.floor(frame / cycle) % items.length
  const local = (frame % cycle) / cycle
  const scan = progress(frame % cycle, 34, 78)

  return (
    <PremiumSceneShell footer={footer} status={status}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
        <FloatingPipelineArtifact index={item} items={items} key={item} />
      ))}
      <div style={{ height: 1320, left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 860, zIndex: 20 }}>
        <div style={{ background: 'linear-gradient(180deg, rgba(34,95,66,0), rgba(34,95,66,0.18), rgba(34,95,66,0))', bottom: 0, left: '50%', position: 'absolute', top: 0, transform: 'translateX(-50%)', width: 2 }} />
        <div style={{ background: '#225f42', borderRadius: 999, boxShadow: '0 0 34px rgba(34, 95, 66, 0.36)', height: 5, left: 66, opacity: 0.78, position: 'absolute', right: 66, top: 486, transform: `translateY(${scan * 86}px)` }} />

        {[-2, -1, 0, 1, 2].map((slot) => {
          const unit = local + slot * 0.39
          if (unit < -0.06 || unit > 1.08) return null

          const itemIndex = (activeIndex + slot + items.length) % items.length
          const item = items[itemIndex]
          const centerScore = 1 - Math.min(Math.abs(unit - 0.5) / 0.5, 1)
          const y = interpolate(unit, [0, 0.28, 0.5, 0.74, 1], [-840, -405, 0, 430, 850], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const scale = 0.68 + centerScore * 0.34
          const opacity = 0.26 + centerScore * 0.74
          const rotation = (itemIndex % 2 === 0 ? -1 : 1) * (1.8 - centerScore * 1.2)
          const tagOpacity = interpolate(unit, [0.36, 0.45, 0.64, 0.73], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })

          return (
            <div
              key={`${slot}-${item.title}`}
              style={{
                filter: centerScore > 0.72 ? 'blur(0)' : 'blur(0.7px)',
                left: '50%',
                opacity,
                position: 'absolute',
                top: '50%',
                transform: `translate(-50%, -50%) translateY(${y}px) rotate(${rotation}deg) scale(${scale})`,
                zIndex: Math.round(centerScore * 20) + 10,
              }}
            >
              <VerticalPipelineArtifact index={itemIndex} item={item} />
              <VerticalPipelineTag item={item} opacity={tagOpacity} />
            </div>
          )
        })}
      </div>
    </PremiumSceneShell>
  )
}

function ClassifiedArtifactDistributionScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const cycle = 132
  const activeIndex = Math.floor(frame / cycle) % items.length
  const local = (frame % cycle) / cycle
  const destinations = [
    { label: 'Receitas', x: 310, y: 405, accent: '#225f42' },
    { label: 'Despesas', x: -315, y: 390, accent: '#c28f2c' },
    { label: 'Contratos', x: 305, y: -370, accent: '#8b6f9d' },
    { label: 'Riscos', x: -300, y: -350, accent: '#3f6d91' },
  ]

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <div style={{ height: 1320, left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 900, zIndex: 20 }}>
        <div style={{ background: 'linear-gradient(180deg, rgba(34,95,66,0), rgba(34,95,66,0.18), rgba(34,95,66,0))', bottom: 0, left: '50%', position: 'absolute', top: 0, transform: 'translateX(-50%)', width: 2 }} />
        <div style={{ alignItems: 'center', background: '#102019', borderRadius: 32, boxShadow: '0 34px 90px rgba(20,24,22,0.20)', color: '#ffffff', display: 'grid', gap: 10, height: 184, justifyItems: 'center', left: '50%', padding: 24, position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 260, zIndex: 34 }}>
          <span style={{ background: '#8aa895', borderRadius: 999, display: 'block', height: 14, width: 14 }} />
          <strong style={{ color: '#ffffff', fontSize: 34, letterSpacing: 0, lineHeight: 1, textAlign: 'center' }}>Classificador</strong>
          <span style={{ color: 'rgba(255,255,255,0.66)', fontSize: 19, fontWeight: 760, textAlign: 'center' }}>IA roteando artefatos</span>
        </div>
        {destinations.map((destination, index) => (
          <div key={destination.label} style={{ alignItems: 'center', background: '#ffffff', border: `1px solid ${destination.accent}`, borderRadius: 999, boxShadow: '0 20px 48px rgba(20,24,22,0.13)', color: destination.accent, display: 'flex', fontSize: 22, fontWeight: 900, gap: 10, left: '50%', padding: '14px 20px', position: 'absolute', top: '50%', transform: `translate(-50%, -50%) translate(${destination.x}px, ${destination.y}px)`, zIndex: 42 }}>
            <span style={{ background: destination.accent, borderRadius: 999, display: 'block', height: 16, width: 16 }} />
            {destination.label}
          </div>
        ))}
        <svg height="100%" style={{ inset: 0, position: 'absolute', zIndex: 5 }} viewBox="0 0 900 1320" width="100%">
          {destinations.map((destination) => (
            <path d={`M 450 660 C ${450 + destination.x * 0.28} ${660 + destination.y * 0.12}, ${450 + destination.x * 0.72} ${660 + destination.y * 0.82}, ${450 + destination.x} ${660 + destination.y}`} fill="none" key={destination.label} opacity="0.28" stroke={destination.accent} strokeDasharray="14 18" strokeDashoffset={-(frame * 3)} strokeLinecap="round" strokeWidth="4" />
          ))}
        </svg>

        {[-1, 0, 1, 2, 3].map((slot) => {
          const unit = local + slot * 0.23
          if (unit < 0 || unit > 1.08) return null

          const itemIndex = (activeIndex + slot + items.length) % items.length
          const item = items[itemIndex]
          const destination = destinations[itemIndex % destinations.length]
          const classify = progress(unit, 0.36, 0.58)
          const x = interpolate(unit, [0, 0.30, 0.55, 1], [0, 0, 0, destination.x], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const y = interpolate(unit, [0, 0.30, 0.55, 1], [-760, -250, 0, destination.y], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const centerScore = 1 - Math.min(Math.abs(unit - 0.5) / 0.5, 1)
          const scale = 0.48 + centerScore * 0.42 - classify * 0.12
          const opacity = interpolate(unit, [0, 0.1, 0.86, 1.08], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const rotation = interpolate(unit, [0, 0.55, 1], [itemIndex % 2 === 0 ? -4 : 4, 0, itemIndex % 2 === 0 ? 7 : -7], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
          const tagOpacity = interpolate(unit, [0.34, 0.45, 0.70, 0.82], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })

          return (
            <div
              key={`${slot}-${item.title}`}
              style={{
                left: '50%',
                opacity,
                position: 'absolute',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
                zIndex: Math.round(centerScore * 24) + 18,
              }}
            >
              <VerticalPipelineArtifact index={itemIndex} item={item} />
              <div style={{ alignItems: 'center', background: '#ffffff', border: `1px solid ${destination.accent}`, borderRadius: 999, boxShadow: '0 20px 48px rgba(20,24,22,0.14)', color: destination.accent, display: 'flex', gap: 10, left: '50%', opacity: tagOpacity, padding: '14px 18px', position: 'absolute', top: '50%', transform: 'translate(205px, -82px)', zIndex: 40 }}>
                <span style={{ background: destination.accent, borderRadius: 999, display: 'block', height: 16, width: 16 }} />
                <span style={{ color: '#65716a', fontSize: 18, fontWeight: 780 }}>Classificado</span>
                <strong style={{ color: destination.accent, fontSize: 24, letterSpacing: 0 }}>{destination.label}</strong>
              </div>
            </div>
          )
        })}
      </div>
    </PremiumSceneShell>
  )
}

function ClassifiedFanGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const cycle = 118
  const activeIndex = Math.floor(frame / cycle) % items.length
  const local = (frame % cycle) / cycle
  const lanes = [
    { label: 'Finance', x: -355, y: -420, rotation: -18, accent: '#225f42' },
    { label: 'Ops', x: 350, y: -330, rotation: 14, accent: '#3f6d91' },
    { label: 'Risk', x: -335, y: 310, rotation: -12, accent: '#c28f2c' },
    { label: 'Review', x: 345, y: 410, rotation: 18, accent: '#8b6f9d' },
  ]

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <div style={{ height: 1320, left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 900, zIndex: 20 }}>
        <div style={{ background: '#102019', borderRadius: 999, boxShadow: '0 34px 90px rgba(20,24,22,0.20)', height: 170, left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 170, zIndex: 30 }}>
          <span style={{ color: '#ffffff', fontSize: 24, fontWeight: 900, left: 0, lineHeight: '170px', position: 'absolute', textAlign: 'center', width: '100%' }}>Sort</span>
        </div>
        {lanes.map((lane) => (
          <div key={lane.label} style={{ background: '#ffffff', border: `1px solid ${lane.accent}`, borderRadius: 999, boxShadow: '0 20px 48px rgba(20,24,22,0.12)', color: lane.accent, fontSize: 22, fontWeight: 900, left: '50%', padding: '14px 20px', position: 'absolute', top: '50%', transform: `translate(-50%, -50%) translate(${lane.x}px, ${lane.y}px) rotate(${lane.rotation * 0.35}deg)`, zIndex: 42 }}>
            {lane.label}
          </div>
        ))}
        {[-1, 0, 1, 2, 3].map((slot) => {
          const unit = local + slot * 0.24
          if (unit < 0 || unit > 1.08) return null
          const itemIndex = (activeIndex + slot + items.length) % items.length
          const item = items[itemIndex]
          const lane = lanes[itemIndex % lanes.length]
          const classify = progress(unit, 0.34, 0.72)
          const x = interpolate(unit, [0, 0.24, 0.50, 1], [0, 0, 0, lane.x], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const y = interpolate(unit, [0, 0.24, 0.50, 1], [610, 220, 0, lane.y], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const rotation = interpolate(unit, [0, 0.52, 1], [0, 0, lane.rotation], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const scale = interpolate(unit, [0, 0.45, 1], [0.58, 0.86, 0.52], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const opacity = interpolate(unit, [0, 0.10, 0.86, 1.08], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

          return (
            <div key={`${slot}-${item.title}`} style={{ left: '50%', opacity, position: 'absolute', top: '50%', transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`, zIndex: Math.round((1 - classify) * 10) + 24 }}>
              <VerticalPipelineArtifact index={itemIndex} item={item} />
              <div style={{ background: lane.accent, borderRadius: 999, boxShadow: '0 18px 42px rgba(20,24,22,0.16)', color: '#ffffff', fontSize: 18, fontWeight: 900, opacity: classify, padding: '12px 16px', position: 'absolute', right: -38, top: -22 }}>
                {lane.label}
              </div>
            </div>
          )
        })}
      </div>
    </PremiumSceneShell>
  )
}

function ClassifiedBucketsGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const cycle = 122
  const activeIndex = Math.floor(frame / cycle) % items.length
  const local = (frame % cycle) / cycle
  const buckets = [
    { label: 'Paid', x: -300, accent: '#225f42' },
    { label: 'Organic', x: 0, accent: '#3f6d91' },
    { label: 'Review', x: 300, accent: '#c28f2c' },
  ]

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <div style={{ height: 1320, left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 900, zIndex: 20 }}>
        {buckets.map((bucket) => (
          <div key={bucket.label} style={{ background: 'rgba(255,255,255,0.78)', border: `1px solid ${bucket.accent}`, borderRadius: 36, bottom: 105, boxShadow: '0 24px 60px rgba(20,24,22,0.10)', left: '50%', position: 'absolute', top: 470, transform: `translateX(calc(-50% + ${bucket.x}px))`, width: 246, zIndex: 12 }}>
            <div style={{ alignItems: 'center', color: bucket.accent, display: 'flex', fontSize: 24, fontWeight: 900, gap: 10, justifyContent: 'center', paddingTop: 24 }}>
              <span style={{ background: bucket.accent, borderRadius: 999, height: 14, width: 14 }} />
              {bucket.label}
            </div>
          </div>
        ))}
        <div style={{ alignItems: 'center', background: '#102019', borderRadius: 32, boxShadow: '0 34px 90px rgba(20,24,22,0.20)', color: '#ffffff', display: 'grid', gap: 8, height: 150, justifyItems: 'center', left: '50%', padding: 20, position: 'absolute', top: 250, transform: 'translateX(-50%)', width: 300, zIndex: 34 }}>
          <strong style={{ color: '#ffffff', fontSize: 31, letterSpacing: 0 }}>Classifier</strong>
          <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 18, fontWeight: 760 }}>bucket routing</span>
        </div>
        {[-1, 0, 1, 2, 3].map((slot) => {
          const unit = local + slot * 0.22
          if (unit < 0 || unit > 1.08) return null
          const itemIndex = (activeIndex + slot + items.length) % items.length
          const item = items[itemIndex]
          const bucket = buckets[itemIndex % buckets.length]
          const x = interpolate(unit, [0, 0.28, 0.56, 1], [0, 0, 0, bucket.x], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const y = interpolate(unit, [0, 0.28, 0.56, 1], [-540, -160, 120, 575], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const scale = interpolate(unit, [0, 0.44, 1], [0.50, 0.82, 0.43], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const opacity = interpolate(unit, [0, 0.10, 0.88, 1.08], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const tagged = progress(unit, 0.44, 0.70)

          return (
            <div key={`${slot}-${item.title}`} style={{ left: '50%', opacity, position: 'absolute', top: '50%', transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`, zIndex: 32 }}>
              <VerticalPipelineArtifact index={itemIndex} item={item} />
              <div style={{ background: '#ffffff', border: `1px solid ${bucket.accent}`, borderRadius: 999, color: bucket.accent, fontSize: 20, fontWeight: 900, opacity: tagged, padding: '12px 16px', position: 'absolute', right: -44, top: -26 }}>
                {bucket.label}
              </div>
            </div>
          )
        })}
      </div>
    </PremiumSceneShell>
  )
}

function ClassifiedRadarGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const cycle = 136
  const activeIndex = Math.floor(frame / cycle) % items.length
  const local = (frame % cycle) / cycle
  const clusters = [
    { label: 'High', angle: -75, radius: 410, accent: '#c28f2c' },
    { label: 'Core', angle: -18, radius: 350, accent: '#225f42' },
    { label: 'Watch', angle: 42, radius: 390, accent: '#3f6d91' },
    { label: 'Archive', angle: 126, radius: 360, accent: '#8b6f9d' },
  ]
  const sweepAngle = frame * 2.6

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <div style={{ height: 1320, left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 900, zIndex: 20 }}>
        {[620, 430, 250].map((size) => (
          <span key={size} style={{ border: '1px solid rgba(34,95,66,0.20)', borderRadius: 999, height: size, left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: size }} />
        ))}
        <span style={{ background: 'linear-gradient(90deg, rgba(34,95,66,0.34), transparent)', height: 3, left: '50%', position: 'absolute', top: '50%', transform: `rotate(${sweepAngle}deg)`, transformOrigin: '0 50%', width: 330 }} />
        <div style={{ alignItems: 'center', background: '#102019', borderRadius: 999, boxShadow: '0 34px 90px rgba(20,24,22,0.20)', color: '#ffffff', display: 'grid', height: 190, justifyItems: 'center', left: '50%', position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 190, zIndex: 34 }}>
          <strong style={{ color: '#ffffff', fontSize: 31, letterSpacing: 0 }}>Radar</strong>
        </div>
        {clusters.map((cluster) => {
          const angle = cluster.angle * Math.PI / 180
          const x = Math.cos(angle) * cluster.radius
          const y = Math.sin(angle) * cluster.radius
          return (
            <div key={cluster.label} style={{ background: '#ffffff', border: `1px solid ${cluster.accent}`, borderRadius: 999, color: cluster.accent, fontSize: 21, fontWeight: 900, left: '50%', padding: '13px 18px', position: 'absolute', top: '50%', transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, zIndex: 42 }}>
              {cluster.label}
            </div>
          )
        })}
        {[-1, 0, 1, 2, 3].map((slot) => {
          const unit = local + slot * 0.23
          if (unit < 0 || unit > 1.08) return null
          const itemIndex = (activeIndex + slot + items.length) % items.length
          const item = items[itemIndex]
          const cluster = clusters[itemIndex % clusters.length]
          const angle = cluster.angle * Math.PI / 180
          const targetX = Math.cos(angle) * (cluster.radius - 84)
          const targetY = Math.sin(angle) * (cluster.radius - 84)
          const x = interpolate(unit, [0, 0.34, 0.62, 1], [Math.cos(angle + 1.6) * 460, 0, 0, targetX], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const y = interpolate(unit, [0, 0.34, 0.62, 1], [Math.sin(angle + 1.6) * 460, 0, 0, targetY], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const scale = interpolate(unit, [0, 0.50, 1], [0.40, 0.74, 0.48], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const opacity = interpolate(unit, [0, 0.12, 0.90, 1.08], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const tagOpacity = progress(unit, 0.56, 0.78)

          return (
            <div key={`${slot}-${item.title}`} style={{ left: '50%', opacity, position: 'absolute', top: '50%', transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`, zIndex: 30 }}>
              <VerticalPipelineArtifact index={itemIndex} item={item} />
              <div style={{ background: cluster.accent, borderRadius: 999, color: '#ffffff', fontSize: 18, fontWeight: 900, opacity: tagOpacity, padding: '11px 15px', position: 'absolute', right: -30, top: -24 }}>
                {cluster.label}
              </div>
            </div>
          )
        })}
      </div>
    </PremiumSceneShell>
  )
}

function ArtifactPageStackGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 132) % items.length
  const local = (frame % 132) / 132
  const active = items[activeIndex]

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <div style={{ left: 74, opacity: sceneIn, position: 'absolute', right: 74, top: 280, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 20, marginBottom: 38 }}>
          <span style={{ color: active.accent, fontSize: 24, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>{active.status}</span>
          <strong style={{ color: '#0f1512', fontSize: 76, letterSpacing: 0, lineHeight: 0.94 }}>Relatorio sendo montado pagina por pagina</strong>
        </div>
        <div style={{ height: 940, position: 'relative' }}>
          {items.map((item, index) => {
            const offset = index - activeIndex
            const wrapped = offset < -1 ? offset + items.length : offset > 2 ? offset - items.length : offset
            const activeScore = index === activeIndex ? 1 : 0
            const x = 250 + wrapped * 110 + local * -34
            const y = Math.abs(wrapped) * 34 + (index === activeIndex ? 0 : 60)
            const rotate = wrapped * 5.8
            const scale = 0.84 + activeScore * 0.18 - Math.abs(wrapped) * 0.025

            return (
              <div
                key={item.title}
                style={{
                  left: 0,
                  opacity: Math.abs(wrapped) > 2 ? 0 : 0.34 + activeScore * 0.66,
                  position: 'absolute',
                  top: 36,
                  transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
                  transformOrigin: '50% 105%',
                  zIndex: 30 - Math.abs(wrapped) * 4 + activeScore * 20,
                }}
              >
                <VerticalPipelineArtifact index={index} item={item} />
              </div>
            )
          })}
          <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 30, bottom: 28, boxShadow: '0 30px 78px rgba(20,24,22,0.13)', display: 'grid', gap: 12, left: 34, padding: 24, position: 'absolute', width: 360, zIndex: 60 }}>
            <span style={{ color: '#65716a', fontSize: 20, fontWeight: 820 }}>Pagina ativa</span>
            <strong style={{ color: active.accent, fontSize: 38, letterSpacing: 0, lineHeight: 1 }}>{active.title}</strong>
            <span style={{ color: '#0f1512', fontSize: 24, fontWeight: 820 }}>{active.metric}</span>
          </div>
        </div>
      </div>
    </PremiumSceneShell>
  )
}

function ArtifactDeckCarouselGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 118) % items.length
  const local = (frame % 118) / 118

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <div style={{ height: 1040, left: '50%', opacity: sceneIn, position: 'absolute', top: 360, transform: `translateX(-50%) translateY(${(1 - sceneIn) * 34}px)`, width: 1080, zIndex: 20 }}>
        {[-2, -1, 0, 1, 2].map((slot) => {
          const itemIndex = (activeIndex + slot + items.length) % items.length
          const item = items[itemIndex]
          const unit = slot - local
          const centerScore = 1 - Math.min(Math.abs(unit) / 2.4, 1)
          const x = unit * 270
          const y = Math.abs(unit) * 54
          const scale = 0.62 + centerScore * 0.46
          const rotateY = unit * -22
          const opacity = 0.22 + centerScore * 0.78

          return (
            <div
              key={`${slot}-${item.title}`}
              style={{
                left: '50%',
                opacity,
                position: 'absolute',
                top: 76,
                transform: `translateX(-50%) translate(${x}px, ${y}px) perspective(920px) rotateY(${rotateY}deg) scale(${scale})`,
                transformStyle: 'preserve-3d',
                zIndex: Math.round(centerScore * 30) + 10,
              }}
            >
              <VerticalPipelineArtifact index={itemIndex} item={item} />
            </div>
          )
        })}
        <div style={{ bottom: 8, display: 'flex', gap: 12, justifyContent: 'center', left: 0, position: 'absolute', right: 0, zIndex: 60 }}>
          {items.map((item, index) => (
            <span key={item.title} style={{ background: index === activeIndex ? item.accent : '#cad8cf', borderRadius: 999, display: 'block', height: 13, width: index === activeIndex ? 48 : 13 }} />
          ))}
        </div>
      </div>
    </PremiumSceneShell>
  )
}

function ArtifactRiskBoardGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 126) % items.length
  const active = items[activeIndex]

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <section style={{ display: 'grid', gap: 18, gridTemplateRows: 'auto 1fr', left: 70, opacity: sceneIn, position: 'absolute', right: 70, top: 286, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ alignItems: 'end', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>Contract gallery</span>
            <strong style={{ color: '#0f1512', fontSize: 70, letterSpacing: 0, lineHeight: 0.96 }}>Contratos como board de risco</strong>
          </div>
          <div style={{ background: '#102019', borderRadius: 28, color: '#ffffff', display: 'grid', gap: 8, padding: '20px 24px', width: 300 }}>
            <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 19, fontWeight: 820 }}>Em foco</span>
            <strong style={{ color: '#ffffff', fontSize: 34, letterSpacing: 0 }}>{active.secondary}</strong>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', minHeight: 820 }}>
          {items.map((item, index) => {
            const p = progress(frame, 32 + index * 18, 78 + index * 18)
            const activeCard = index === activeIndex
            return (
              <div
                key={item.title}
                style={{
                  background: activeCard ? '#102019' : '#ffffff',
                  border: `1px solid ${activeCard ? '#102019' : '#dfe7e1'}`,
                  borderRadius: 34,
                  boxShadow: activeCard ? '0 38px 90px rgba(20,24,22,0.22)' : '0 18px 42px rgba(20,24,22,0.08)',
                  color: activeCard ? '#ffffff' : '#0f1512',
                  display: 'grid',
                  gap: 18,
                  opacity: p,
                  padding: 28,
                  transform: `translateY(${(1 - p) * 28}px) scale(${activeCard ? 1.02 : 1})`,
                }}
              >
                <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'grid', gap: 7 }}>
                    <span style={{ color: activeCard ? 'rgba(255,255,255,0.60)' : '#65716a', fontSize: 20, fontWeight: 850, textTransform: 'uppercase' }}>{item.eyebrow}</span>
                    <strong style={{ color: activeCard ? '#ffffff' : '#0f1512', fontSize: 44, letterSpacing: 0, lineHeight: 0.98 }}>{item.title}</strong>
                  </div>
                  <span style={{ background: item.accent, borderRadius: 999, display: 'block', height: 18, width: 18 }} />
                </div>
                <span style={{ color: activeCard ? 'rgba(255,255,255,0.76)' : '#65716a', fontSize: 27, fontWeight: 780 }}>{item.metric}</span>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[78, 54, 88].map((width, line) => (
                    <span key={`${width}-${line}`} style={{ background: line === 1 ? item.accent : activeCard ? 'rgba(255,255,255,0.16)' : '#dfe7e1', borderRadius: 999, display: 'block', height: line === 1 ? 13 : 10, width: `${width}%` }} />
                  ))}
                </div>
                <span style={{ alignSelf: 'end', color: item.accent, fontSize: 27, fontWeight: 900 }}>{item.status}</span>
              </div>
            )
          })}
        </div>
      </section>
    </PremiumSceneShell>
  )
}

function ArtifactLedgerFlowGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 118) % items.length
  const line = progress(frame % 118, 10, 82)
  const active = items[activeIndex]

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <section style={{ left: 64, opacity: sceneIn, position: 'absolute', right: 64, top: 300, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 12, marginBottom: 46 }}>
          <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>{active.status}</span>
          <strong style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.96 }}>Lancamento contábil em fluxo</strong>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 38, boxShadow: '0 42px 100px rgba(20,24,22,0.18)', minHeight: 860, overflow: 'hidden', padding: 34, position: 'relative' }}>
          <div style={{ background: '#dfe7e1', borderRadius: 999, height: 8, left: 78, position: 'absolute', right: 78, top: 238 }} />
          <div style={{ background: active.accent, borderRadius: 999, height: 8, left: 78, position: 'absolute', top: 238, width: `${line * 82}%` }} />
          <div style={{ display: 'grid', gap: 22, gridTemplateColumns: `repeat(${items.length}, 1fr)`, marginTop: 88 }}>
            {items.map((item, index) => {
              const p = progress(frame, 34 + index * 22, 82 + index * 22)
              const activeStep = index === activeIndex
              return (
                <div key={item.title} style={{ display: 'grid', gap: 18, justifyItems: 'center', opacity: 0.45 + p * 0.55, transform: `translateY(${activeStep ? -18 : 0}px)` }}>
                  <span style={{ alignItems: 'center', background: activeStep ? item.accent : '#f3f7f4', border: `6px solid ${activeStep ? '#ffffff' : '#dfe7e1'}`, borderRadius: 999, boxShadow: activeStep ? `0 20px 54px ${item.accent}44` : 'none', color: activeStep ? '#ffffff' : '#65716a', display: 'flex', fontSize: 30, fontWeight: 920, height: 86, justifyContent: 'center', width: 86 }}>{index + 1}</span>
                  <div style={{ background: activeStep ? '#102019' : '#f7faf7', border: `1px solid ${activeStep ? '#102019' : '#dfe7e1'}`, borderRadius: 24, color: activeStep ? '#ffffff' : '#0f1512', display: 'grid', gap: 12, minHeight: 260, padding: 20 }}>
                    <span style={{ color: activeStep ? 'rgba(255,255,255,0.62)' : '#65716a', fontSize: 18, fontWeight: 850, textTransform: 'uppercase' }}>{item.eyebrow}</span>
                    <strong style={{ color: activeStep ? '#ffffff' : '#0f1512', fontSize: 31, letterSpacing: 0, lineHeight: 0.98 }}>{item.title}</strong>
                    <span style={{ color: activeStep ? 'rgba(255,255,255,0.74)' : '#65716a', fontSize: 22, fontWeight: 760 }}>{item.metric}</span>
                    <span style={{ color: item.accent, fontSize: 26, fontWeight: 900 }}>{item.secondary}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ background: '#102019', borderRadius: 30, bottom: 34, color: '#ffffff', display: 'grid', gap: 12, left: 34, padding: 26, position: 'absolute', right: 34 }}>
            <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 20, fontWeight: 820 }}>Resultado</span>
            <strong style={{ color: '#ffffff', fontSize: 42, letterSpacing: 0 }}>{active.title} - {active.status}</strong>
          </div>
        </div>
      </section>
    </PremiumSceneShell>
  )
}

function ArtifactReconciliationMatchGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 122) % items.length
  const active = items[activeIndex]
  const beam = progress(frame % 122, 18, 76)
  const bankTypes = ['PIX', 'Cartao', 'TED', 'Tarifa']
  const bankDates = ['03 Jun', '03 Jun', '04 Jun', '04 Jun']
  const bankDocs = ['E2E90318471', 'CARD-1842', 'TED-774012', 'TAR-0421']
  const bankBalances = ['R$ 184.920', 'R$ 176.480', 'R$ 151.900', 'R$ 149.870']

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <section style={{ left: 66, opacity: sceneIn, position: 'absolute', right: 66, top: 300, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 10, marginBottom: 42 }}>
          <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>{active.status}</span>
          <strong style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.96 }}>Conciliação banco e ERP em pares</strong>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 38, boxShadow: '0 42px 100px rgba(20,24,22,0.18)', display: 'grid', gap: 28, gridTemplateColumns: '1fr 92px 1fr', minHeight: 900, padding: 34, position: 'relative' }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ background: '#f8faf8', border: '1px solid #dfe7e1', borderRadius: 22, display: 'grid', gap: 14, padding: '18px 20px' }}>
              <div style={{ alignItems: 'start', display: 'grid', gridTemplateColumns: '1fr auto' }}>
                <div style={{ display: 'grid', gap: 5 }}>
                  <span style={{ color: '#65716a', fontSize: 15, fontWeight: 900, letterSpacing: 1.6, textTransform: 'uppercase' }}>Banco Stone</span>
                  <strong style={{ color: '#0f1512', fontSize: 29, fontWeight: 900, letterSpacing: 0 }}>Extrato bancário</strong>
                  <span style={{ color: '#65716a', fontSize: 17, fontWeight: 760 }}>Ag. 0001 · Conta 84932-7 · 03-04 Jun</span>
                </div>
                <span style={{ border: '1px solid #dfe7e1', borderRadius: 999, color: '#65716a', fontSize: 15, fontWeight: 900, padding: '7px 11px' }}>PDF</span>
              </div>
              <div style={{ display: 'grid', gap: 9, gridTemplateColumns: '1fr 1fr 1fr' }}>
                {[
                  ['Saldo ant.', 'R$ 152.740'],
                  ['Entradas', 'R$ 32.180'],
                  ['Saldo atual', 'R$ 184.920'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#ffffff', border: '1px solid #e1e8e3', borderRadius: 14, display: 'grid', gap: 3, padding: '10px 11px' }}>
                    <span style={{ color: '#718078', fontSize: 13, fontWeight: 850 }}>{label}</span>
                    <strong style={{ color: '#0f1512', fontSize: 17, fontWeight: 900, letterSpacing: 0 }}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ alignItems: 'center', borderBottom: '1px solid #dfe7e1', color: '#65716a', display: 'grid', fontSize: 14, fontWeight: 900, gridTemplateColumns: '72px 1fr 98px 114px 110px', letterSpacing: 0.3, padding: '0 14px 9px', textTransform: 'uppercase' }}>
              <span>Data</span>
              <span>Historico</span>
              <span>Doc.</span>
              <span style={{ textAlign: 'right' }}>Valor</span>
              <span style={{ textAlign: 'right' }}>Saldo</span>
            </div>
            {items.map((item, index) => {
              const activeRow = index === activeIndex
              const p = progress(frame, 28 + index * 16, 72 + index * 16)
              return (
                <div key={`${item.title}-bank`} style={{ alignItems: 'center', background: activeRow ? '#102019' : '#ffffff', border: `1px solid ${activeRow ? '#102019' : '#dfe7e1'}`, borderRadius: 16, color: activeRow ? '#ffffff' : '#0f1512', display: 'grid', gap: 12, gridTemplateColumns: '72px 1fr 98px 114px 110px', minHeight: 102, opacity: p, padding: '14px 14px', transform: `translateX(${(1 - p) * -24}px)` }}>
                  <span style={{ color: activeRow ? 'rgba(255,255,255,0.66)' : '#65716a', fontSize: 17, fontWeight: 850 }}>{bankDates[index % bankDates.length]}</span>
                  <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
                    <strong style={{ color: activeRow ? '#ffffff' : '#0f1512', fontSize: 21, letterSpacing: 0, lineHeight: 1.02 }}>LANC. {item.title}</strong>
                    <span style={{ color: activeRow ? 'rgba(255,255,255,0.62)' : '#65716a', fontSize: 14, fontWeight: 800 }}>{bankTypes[index % bankTypes.length]} · {item.eyebrow}</span>
                  </div>
                  <span style={{ color: activeRow ? 'rgba(255,255,255,0.68)' : '#65716a', fontSize: 14, fontWeight: 850 }}>{bankDocs[index % bankDocs.length]}</span>
                  <strong style={{ color: activeRow ? '#ffffff' : item.accent, fontSize: 20, fontWeight: 900, letterSpacing: 0, textAlign: 'right' }}>{item.secondary}</strong>
                  <strong style={{ color: activeRow ? 'rgba(255,255,255,0.76)' : '#0f1512', fontSize: 18, fontWeight: 900, letterSpacing: 0, textAlign: 'right' }}>{bankBalances[index % bankBalances.length]}</strong>
                </div>
              )
            })}
          </div>
          <div style={{ alignItems: 'start', display: 'grid', justifyItems: 'center', paddingTop: 226 }}>
            {items.map((item, index) => {
              const activeRow = index === activeIndex
              return (
                <div key={`${item.title}-beam`} style={{ alignItems: 'center', display: 'grid', height: 116, justifyItems: 'center' }}>
                  <span style={{ background: activeRow ? item.accent : '#dfe7e1', borderRadius: 999, boxShadow: activeRow ? `0 0 40px ${item.accent}66` : 'none', display: 'block', height: activeRow ? 10 : 6, opacity: activeRow ? 1 : 0.6, transform: `scaleX(${activeRow ? 0.36 + beam * 0.86 : 0.52})`, width: 92 }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ background: '#f7faf7', border: '1px solid #dfe7e1', borderRadius: 22, display: 'grid', gap: 14, padding: '18px 20px' }}>
              <div style={{ display: 'grid', gap: 5 }}>
                <span style={{ color: '#65716a', fontSize: 15, fontWeight: 900, letterSpacing: 1.6, textTransform: 'uppercase' }}>ERP financeiro</span>
                <strong style={{ color: '#0f1512', fontSize: 29, fontWeight: 900, letterSpacing: 0 }}>Titulos encontrados</strong>
                <span style={{ color: '#65716a', fontSize: 17, fontWeight: 760 }}>Contas a receber · NF-e · Boletos</span>
              </div>
              <div style={{ display: 'grid', gap: 9, gridTemplateColumns: '1fr 1fr 1fr' }}>
                {[
                  ['Pendentes', '04'],
                  ['Match', '98%'],
                  ['Diverg.', '01'],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#ffffff', border: '1px solid #e1e8e3', borderRadius: 14, display: 'grid', gap: 3, padding: '10px 11px' }}>
                    <span style={{ color: '#718078', fontSize: 13, fontWeight: 850 }}>{label}</span>
                    <strong style={{ color: '#0f1512', fontSize: 17, fontWeight: 900, letterSpacing: 0 }}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ alignItems: 'center', borderBottom: '1px solid #dfe7e1', color: '#65716a', display: 'grid', fontSize: 14, fontWeight: 900, gridTemplateColumns: '1fr 112px', letterSpacing: 0.3, padding: '0 14px 9px', textTransform: 'uppercase' }}>
              <span>Lancamento ERP</span>
              <span style={{ textAlign: 'right' }}>Valor</span>
            </div>
            {items.map((item, index) => {
              const activeRow = index === activeIndex
              const p = progress(frame, 38 + index * 16, 82 + index * 16)
              return (
                <div key={`${item.title}-erp`} style={{ alignItems: 'center', background: activeRow ? item.accent : '#f7faf7', border: `1px solid ${activeRow ? item.accent : '#dfe7e1'}`, borderRadius: 16, color: activeRow ? '#ffffff' : '#0f1512', display: 'grid', gap: 12, gridTemplateColumns: '1fr 112px', minHeight: 102, opacity: p, padding: '14px 16px', transform: `translateX(${(1 - p) * 24}px)` }}>
                  <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
                    <span style={{ color: activeRow ? 'rgba(255,255,255,0.70)' : '#65716a', fontSize: 14, fontWeight: 850 }}>{item.metric}</span>
                    <strong style={{ color: activeRow ? '#ffffff' : '#0f1512', fontSize: 22, letterSpacing: 0, lineHeight: 1.02 }}>{item.status}</strong>
                  </div>
                  <strong style={{ color: activeRow ? '#ffffff' : item.accent, fontSize: 20, fontWeight: 900, letterSpacing: 0, textAlign: 'right' }}>{item.secondary}</strong>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </PremiumSceneShell>
  )
}

function ArtifactReconciliationSplitGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 116) % items.length
  const active = items[activeIndex]
  const match = progress(frame % 116, 20, 72)

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <section style={{ left: 62, opacity: sceneIn, position: 'absolute', right: 62, top: 300, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 10, marginBottom: 40 }}>
          <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, textTransform: 'uppercase' }}>{active.status}</span>
          <strong style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.96 }}>Match em split screen</strong>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 38, boxShadow: '0 42px 100px rgba(20,24,22,0.18)', display: 'grid', gap: 26, gridTemplateColumns: '1fr 160px 1fr', minHeight: 900, padding: 34, position: 'relative' }}>
          <div style={{ display: 'grid', gap: 18 }}>
            <strong style={{ color: '#65716a', fontSize: 24, fontWeight: 900, textTransform: 'uppercase' }}>Banco</strong>
            {items.map((item, index) => {
              const activeRow = index === activeIndex
              return (
                <div key={`${item.title}-split-bank`} style={{ background: activeRow ? '#102019' : '#f7faf7', border: `1px solid ${activeRow ? '#102019' : '#dfe7e1'}`, borderRadius: 26, color: activeRow ? '#ffffff' : '#0f1512', display: 'grid', gap: 10, minHeight: 142, padding: 22, transform: `scale(${activeRow ? 1.02 : 1})` }}>
                  <span style={{ color: activeRow ? 'rgba(255,255,255,0.62)' : '#65716a', fontSize: 18, fontWeight: 850 }}>{item.eyebrow}</span>
                  <strong style={{ color: activeRow ? '#ffffff' : '#0f1512', fontSize: 32, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
                  <span style={{ color: item.accent, fontSize: 29, fontWeight: 900 }}>{item.secondary}</span>
                </div>
              )
            })}
          </div>
          <div style={{ alignItems: 'center', display: 'grid', justifyItems: 'center', paddingTop: 66 }}>
            {items.map((item, index) => {
              const activeRow = index === activeIndex
              return (
                <div key={`${item.title}-split-line`} style={{ alignItems: 'center', display: 'grid', height: 160, justifyItems: 'center', position: 'relative', width: 150 }}>
                  <span style={{ background: activeRow ? item.accent : '#dfe7e1', borderRadius: 999, boxShadow: activeRow ? `0 0 44px ${item.accent}66` : 'none', display: 'block', height: activeRow ? 12 : 6, transform: `scaleX(${activeRow ? 0.24 + match * 0.88 : 0.42})`, width: 142 }} />
                  {activeRow ? <span style={{ alignItems: 'center', background: item.accent, borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 26, fontWeight: 900, height: 58, justifyContent: 'center', position: 'absolute', width: 58 }}>✓</span> : null}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'grid', gap: 18 }}>
            <strong style={{ color: '#65716a', fontSize: 24, fontWeight: 900, textTransform: 'uppercase' }}>ERP</strong>
            {items.map((item, index) => {
              const activeRow = index === activeIndex
              return (
                <div key={`${item.title}-split-erp`} style={{ background: activeRow ? item.accent : '#f7faf7', border: `1px solid ${activeRow ? item.accent : '#dfe7e1'}`, borderRadius: 26, color: activeRow ? '#ffffff' : '#0f1512', display: 'grid', gap: 10, minHeight: 142, padding: 22, transform: `scale(${activeRow ? 1.02 : 1})` }}>
                  <span style={{ color: activeRow ? 'rgba(255,255,255,0.70)' : '#65716a', fontSize: 18, fontWeight: 850 }}>{item.metric}</span>
                  <strong style={{ color: activeRow ? '#ffffff' : '#0f1512', fontSize: 32, letterSpacing: 0, lineHeight: 1 }}>{item.status}</strong>
                  <span style={{ color: activeRow ? '#ffffff' : item.accent, fontSize: 29, fontWeight: 900 }}>{item.secondary}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </PremiumSceneShell>
  )
}

function ArtifactReconciliationMatrixGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 104) % items.length
  const active = items[activeIndex]
  const scan = progress(frame % 104, 12, 76)

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <section style={{ left: 62, opacity: sceneIn, position: 'absolute', right: 62, top: 300, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 10, marginBottom: 40 }}>
          <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, textTransform: 'uppercase' }}>Score {Math.round(82 + scan * 16)}%</span>
          <strong style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.96 }}>Matriz de match banco x ERP</strong>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 38, boxShadow: '0 42px 100px rgba(20,24,22,0.18)', display: 'grid', gap: 22, minHeight: 900, padding: 34, position: 'relative' }}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '170px repeat(4, 1fr)' }}>
            <span />
            {items.map((item) => <strong key={`${item.title}-head`} style={{ color: '#65716a', fontSize: 18, fontWeight: 900, lineHeight: 1.05, textAlign: 'center' }}>{item.metric}</strong>)}
            {items.map((bank, row) => (
              <div key={`${bank.title}-matrix-row`} style={{ display: 'contents' }}>
                <strong key={`${bank.title}-label`} style={{ alignItems: 'center', color: '#0f1512', display: 'flex', fontSize: 21, fontWeight: 900, lineHeight: 1.05 }}>{bank.title}</strong>
                {items.map((erp, col) => {
                  const matched = row === col
                  const activeCell = row === activeIndex && col === activeIndex
                  return (
                    <div key={`${bank.title}-${erp.metric}`} style={{ alignItems: 'center', background: activeCell ? active.accent : matched ? '#e8f2ec' : '#f7faf7', border: `1px solid ${activeCell ? active.accent : matched ? '#b9d1c2' : '#dfe7e1'}`, borderRadius: 22, color: activeCell ? '#ffffff' : matched ? '#225f42' : '#65716a', display: 'grid', gap: 6, height: 112, justifyItems: 'center', position: 'relative', transform: `scale(${activeCell ? 1.06 : 1})` }}>
                      <strong style={{ color: activeCell ? '#ffffff' : matched ? '#225f42' : '#65716a', fontSize: 25, letterSpacing: 0 }}>{matched ? '98%' : `${62 + ((row + col) % 3) * 8}%`}</strong>
                      <span style={{ color: activeCell ? 'rgba(255,255,255,0.76)' : '#65716a', fontSize: 15, fontWeight: 820 }}>{matched ? 'match' : 'review'}</span>
                      {activeCell ? <span style={{ background: 'rgba(255,255,255,0.40)', bottom: 0, left: `${scan * 100 - 28}%`, position: 'absolute', top: 0, transform: 'skewX(-14deg)', width: 28 }} /> : null}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PremiumSceneShell>
  )
}

function ArtifactReconciliationLedgerSweepGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 110) % items.length
  const active = items[activeIndex]
  const sweep = (frame * 4.4) % 780

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <section style={{ left: 62, opacity: sceneIn, position: 'absolute', right: 62, top: 300, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ display: 'grid', gap: 10, marginBottom: 40 }}>
          <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, textTransform: 'uppercase' }}>{active.status}</span>
          <strong style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.96 }}>Ledger sweep conciliando linhas</strong>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 38, boxShadow: '0 42px 100px rgba(20,24,22,0.18)', minHeight: 900, overflow: 'hidden', padding: 34, position: 'relative' }}>
          <span style={{ background: `linear-gradient(90deg, transparent, ${active.accent}33, transparent)`, bottom: 0, left: sweep - 220, position: 'absolute', top: 0, transform: 'skewX(-15deg)', width: 160, zIndex: 4 }} />
          <div style={{ display: 'grid', gap: 16, position: 'relative', zIndex: 10 }}>
            <div style={{ color: '#65716a', display: 'grid', fontSize: 20, fontWeight: 900, gridTemplateColumns: '1fr 1fr 150px 150px', padding: '0 20px', textTransform: 'uppercase' }}>
              <span>Banco</span>
              <span>ERP</span>
              <span>Valor</span>
              <span>Status</span>
            </div>
            {items.concat(items).map((item, index) => {
              const itemIndex = index % items.length
              const activeRow = itemIndex === activeIndex
              return (
                <div key={`${item.title}-${index}-sweep`} style={{ alignItems: 'center', background: activeRow ? '#102019' : '#f7faf7', border: `1px solid ${activeRow ? '#102019' : '#dfe7e1'}`, borderRadius: 24, color: activeRow ? '#ffffff' : '#0f1512', display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr 150px 150px', minHeight: 88, padding: '18px 20px', transform: `translateX(${activeRow ? 8 : 0}px)` }}>
                  <strong style={{ color: activeRow ? '#ffffff' : '#0f1512', fontSize: 25, letterSpacing: 0 }}>{item.title}</strong>
                  <span style={{ color: activeRow ? 'rgba(255,255,255,0.74)' : '#65716a', fontSize: 22, fontWeight: 780 }}>{item.metric}</span>
                  <strong style={{ color: activeRow ? '#ffffff' : item.accent, fontSize: 24, letterSpacing: 0 }}>{item.secondary}</strong>
                  <span style={{ background: activeRow ? item.accent : '#e8f2ec', borderRadius: 999, color: activeRow ? '#ffffff' : '#225f42', fontSize: 18, fontWeight: 900, padding: '11px 13px', textAlign: 'center' }}>{activeRow ? 'Matched' : 'Ready'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </PremiumSceneShell>
  )
}

function ArtifactDashboardMosaicGalleryScene({ footer, items, status }: { footer: string; items: VerticalPipelineItem[]; status: string }) {
  const frame = useCurrentFrame()
  const sceneIn = progress(frame, 0, 38)
  const activeIndex = Math.floor(frame / 132) % items.length
  const active = items[activeIndex]

  return (
    <PremiumSceneShell footer={footer} status={status}>
      <section style={{ left: 58, opacity: sceneIn, position: 'absolute', right: 58, top: 286, transform: `translateY(${(1 - sceneIn) * 34}px)`, zIndex: 20 }}>
        <div style={{ alignItems: 'end', display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, letterSpacing: 0, textTransform: 'uppercase' }}>{active.status}</span>
            <strong style={{ color: '#0f1512', fontSize: 72, letterSpacing: 0, lineHeight: 0.96 }}>Dashboards em mosaico vivo</strong>
          </div>
          <span style={{ background: '#102019', borderRadius: 999, color: '#ffffff', fontSize: 28, fontWeight: 900, padding: '18px 24px' }}>{active.secondary}</span>
        </div>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1.2fr 0.8fr', minHeight: 900 }}>
          <div style={{ background: '#ffffff', border: '1px solid #dfe7e1', borderRadius: 38, boxShadow: '0 42px 100px rgba(20,24,22,0.18)', display: 'grid', gap: 26, padding: 32 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              <span style={{ color: active.accent, fontSize: 23, fontWeight: 900, textTransform: 'uppercase' }}>{active.eyebrow}</span>
              <strong style={{ color: '#0f1512', fontSize: 56, letterSpacing: 0, lineHeight: 0.96 }}>{active.title}</strong>
              <span style={{ color: '#65716a', fontSize: 28, fontWeight: 780 }}>{active.metric}</span>
            </div>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {items.slice(0, 3).map((item, index) => (
                <div key={item.title} style={{ background: index === activeIndex % 3 ? '#102019' : '#f7faf7', border: `1px solid ${index === activeIndex % 3 ? '#102019' : '#dfe7e1'}`, borderRadius: 22, display: 'grid', gap: 8, padding: 18 }}>
                  <span style={{ color: index === activeIndex % 3 ? 'rgba(255,255,255,0.60)' : '#65716a', fontSize: 17, fontWeight: 850 }}>{item.eyebrow}</span>
                  <strong style={{ color: index === activeIndex % 3 ? '#ffffff' : item.accent, fontSize: 31, letterSpacing: 0 }}>{item.secondary}</strong>
                </div>
              ))}
            </div>
            <div style={{ alignItems: 'end', display: 'flex', gap: 13, height: 340 }}>
              {[96, 146, 118, 210, 164, 286, 230, 188].map((height, index) => (
                <span key={`${height}-${index}`} style={{ background: index === (activeIndex + 3) % 8 ? active.accent : '#dce6df', borderRadius: 12, flex: 1, height: height + Math.sin((frame + index * 12) / 30) * 14 }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 18 }}>
            {items.map((item, index) => {
              const p = progress(frame, 34 + index * 20, 82 + index * 20)
              const activeCard = index === activeIndex
              return (
                <div key={item.title} style={{ background: activeCard ? item.accent : '#ffffff', border: `1px solid ${activeCard ? item.accent : '#dfe7e1'}`, borderRadius: 30, boxShadow: activeCard ? `0 28px 72px ${item.accent}33` : '0 16px 36px rgba(20,24,22,0.08)', display: 'grid', gap: 13, opacity: p, padding: 24, transform: `translateX(${(1 - p) * 28}px)` }}>
                  <span style={{ color: activeCard ? 'rgba(255,255,255,0.68)' : '#65716a', fontSize: 18, fontWeight: 850, textTransform: 'uppercase' }}>{item.eyebrow}</span>
                  <strong style={{ color: activeCard ? '#ffffff' : '#0f1512', fontSize: 32, letterSpacing: 0, lineHeight: 1 }}>{item.title}</strong>
                  <span style={{ background: activeCard ? 'rgba(255,255,255,0.34)' : item.accent, borderRadius: 999, display: 'block', height: 10, width: `${58 + index * 9}%` }} />
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </PremiumSceneShell>
  )
}

export function ExpenseClassificationAnimation() {
  return <ExpenseClassificationPipeline />
}

export function BankReconciliationAnimation() {
  return (
    <ArtifactReconciliationMatchGalleryScene
      footer="Extrato e ERP pareados em galeria de matches"
      items={reconciliationPipelineItems}
      status="Conciliação automática"
    />
  )
}

export function DashboardsAnimation() {
  return (
    <ArtifactDashboardMosaicGalleryScene
      footer="Dashboards financeiros em mosaico vivo"
      items={dashboardPipelineItems}
      status="BI workspace renderizando"
    />
  )
}

export function ManagementReportAnimation() {
  return (
    <ArtifactPageStackGalleryScene
      footer="Relatorio Word gerado como stack de paginas executivas"
      items={reportPipelineItems}
      status="Relatorio gerencial escrevendo"
    />
  )
}

export function ClosingSlidesAnimation() {
  return (
    <ArtifactDeckCarouselGalleryScene
      footer="Deck executivo em carousel com foco central"
      items={slidePipelineItems}
      status="Slides gerando"
    />
  )
}

export function ContractManagementAnimation() {
  return (
    <ArtifactRiskBoardGalleryScene
      footer="Contratos organizados em board de risco e renovacao"
      items={contractPipelineItems}
      status="Gestao contratual ativa"
    />
  )
}

export function AccountingEntryAnimation() {
  return (
    <ArtifactLedgerFlowGalleryScene
      footer="Lancamento preparado, validado e enviado ao ERP"
      items={entryPipelineItems}
      status="ERP actions executando"
    />
  )
}

export function NewsAnimation() {
  return <AnimatedNewsAnimationCard />
}

export function TweetAnimation() {
  return <TweetAnimationCard />
}

export function SaaSCarouselGalleryAnimation() {
  return <SaaSCarouselGalleryAnimationCard />
}

export function SaaSArtifactPipelineGalleryAnimation() {
  return (
    <VerticalArtifactPipelineScene
      footer="Galeria vertical de artefatos operacionais"
      items={dashboardPipelineItems}
      status="Artifact pipeline"
    />
  )
}

export function SaaSClassifiedDistributionGalleryAnimation() {
  return (
    <ClassifiedArtifactDistributionScene
      footer="Galeria de classificação distribuindo artefatos por categoria"
      items={dashboardPipelineItems}
      status="Classification gallery"
    />
  )
}

export function SaaSClassifiedFanGalleryAnimation() {
  return (
    <ClassifiedFanGalleryScene
      footer="Galeria de classificacao em leque separando artefatos"
      items={dashboardPipelineItems}
      status="Classified fan gallery"
    />
  )
}

export function SaaSClassifiedBucketsGalleryAnimation() {
  return (
    <ClassifiedBucketsGalleryScene
      footer="Galeria de buckets classificando artefatos por destino"
      items={dashboardPipelineItems}
      status="Classified buckets gallery"
    />
  )
}

export function SaaSClassifiedRadarGalleryAnimation() {
  return (
    <ClassifiedRadarGalleryScene
      footer="Galeria radar agrupando artefatos por cluster"
      items={dashboardPipelineItems}
      status="Classified radar gallery"
    />
  )
}

export function SaaSArtifactPageStackGalleryAnimation() {
  return (
    <ArtifactPageStackGalleryScene
      footer="Galeria de paginas em stack para reports e documentos"
      items={reportPipelineItems}
      status="Page stack gallery"
    />
  )
}

export function SaaSArtifactDeckCarouselGalleryAnimation() {
  return (
    <ArtifactDeckCarouselGalleryScene
      footer="Galeria de slides em carousel com profundidade"
      items={slidePipelineItems}
      status="Deck carousel gallery"
    />
  )
}

export function SaaSArtifactRiskBoardGalleryAnimation() {
  return (
    <ArtifactRiskBoardGalleryScene
      footer="Galeria de contratos em board de risco"
      items={contractPipelineItems}
      status="Risk board gallery"
    />
  )
}

export function SaaSArtifactLedgerFlowGalleryAnimation() {
  return (
    <ArtifactLedgerFlowGalleryScene
      footer="Galeria de etapas contabeis em fluxo"
      items={entryPipelineItems}
      status="Ledger flow gallery"
    />
  )
}

export function SaaSArtifactReconciliationMatchGalleryAnimation() {
  return (
    <ArtifactReconciliationMatchGalleryScene
      footer="Galeria de conciliação com pares banco e ERP"
      items={reconciliationPipelineItems}
      status="Reconciliation match gallery"
    />
  )
}

export function SaaSArtifactReconciliationSplitGalleryAnimation() {
  return (
    <ArtifactReconciliationSplitGalleryScene
      footer="Galeria de conciliacao em split screen banco x ERP"
      items={reconciliationPipelineItems}
      status="Reconciliation split gallery"
    />
  )
}

export function SaaSArtifactReconciliationMatrixGalleryAnimation() {
  return (
    <ArtifactReconciliationMatrixGalleryScene
      footer="Galeria de conciliacao em matriz de score"
      items={reconciliationPipelineItems}
      status="Reconciliation matrix gallery"
    />
  )
}

export function SaaSArtifactReconciliationLedgerSweepGalleryAnimation() {
  return (
    <ArtifactReconciliationLedgerSweepGalleryScene
      footer="Galeria de conciliacao com sweep no ledger"
      items={reconciliationPipelineItems}
      status="Reconciliation ledger sweep"
    />
  )
}

export function SaaSArtifactDashboardMosaicGalleryAnimation() {
  return (
    <ArtifactDashboardMosaicGalleryScene
      footer="Galeria de dashboards em mosaico executivo"
      items={dashboardPipelineItems}
      status="Dashboard mosaic gallery"
    />
  )
}

export function SaaSBentoGalleryAnimation() {
  return <SaaSBentoGalleryAnimationCard />
}

export function SaaSWallGalleryAnimation() {
  return <SaaSWallGalleryAnimationCard />
}

export function SaaSStackGalleryAnimation() {
  return <SaaSStackGalleryAnimationCard />
}

export function SaaSMarqueeGalleryAnimation() {
  return <SaaSMarqueeGalleryAnimationCard />
}

export function SaaSMasonryGalleryAnimation() {
  return <SaaSMasonryGalleryAnimationCard />
}

export function SaaSTimelineGalleryAnimation() {
  return <SaaSTimelineGalleryAnimationCard />
}

export function SaaSMosaicGalleryAnimation() {
  return <SaaSMosaicGalleryAnimationCard />
}

export function SaaSPageFlipGalleryAnimation() {
  return <SaaSPageFlipGalleryAnimationCard />
}

export function SaaSPageTransitionGalleryAnimation() {
  return <SaaSPageTransitionGalleryAnimationCard />
}

export function SaaSFilmstripGalleryAnimation() {
  return <SaaSFilmstripGalleryAnimationCard />
}

export function SaaSLightboxGalleryAnimation() {
  return <SaaSLightboxGalleryAnimationCard />
}

export function SaaSFolderTabsGalleryAnimation() {
  return <SaaSFolderTabsGalleryAnimationCard />
}

export function SaaSStackedPagesGalleryAnimation() {
  return <SaaSStackedPagesGalleryAnimationCard />
}

export function SaaSInfiniteCanvasGalleryAnimation() {
  return <SaaSInfiniteCanvasGalleryAnimationCard />
}

export function SaaSSpotlightGalleryAnimation() {
  return <SaaSSpotlightGalleryAnimationCard />
}

export function SaaSBeforeAfterAnimation() {
  return <SaaSBeforeAfterAnimationCard />
}

export function SaaSTimelineAnimation() {
  return <SaaSTimelineAnimationCard />
}

export function SaaSOrbitAnimation() {
  return <SaaSOrbitAnimationCard />
}

export function SaaSCommandCenterAnimation() {
  return <SaaSCommandCenterAnimationCard />
}

export function SaaSDocumentFanGalleryAnimation() {
  return <SaaSDocumentFanGalleryAnimationCard />
}

export function SaaSDeviceGalleryAnimation() {
  return <SaaSDeviceGalleryAnimationCard />
}

export function SaaSGridZoomGalleryAnimation() {
  return <SaaSGridZoomGalleryAnimationCard />
}

export function SaaSSwipeCardsGalleryAnimation() {
  return <SaaSSwipeCardsGalleryAnimationCard />
}

export function SaaSCoverflowGalleryAnimation() {
  return <SaaSCoverflowGalleryAnimationCard />
}

export function SaaSRoom3DGalleryAnimation() {
  return <SaaSRoom3DGalleryAnimationCard />
}

export function SaaSMagnifierGalleryAnimation() {
  return <SaaSMagnifierGalleryAnimationCard />
}

export function SaaSAccordionGalleryAnimation() {
  return <SaaSAccordionGalleryAnimationCard />
}

export function SaaSStoryboardGalleryAnimation() {
  return <SaaSStoryboardGalleryAnimationCard />
}

export function SaaSLogoCloudAnimation() {
  return <SaaSLogoCloudAnimationCard />
}

export function SaaSMetricCounterAnimation() {
  return <SaaSMetricCounterAnimationCard />
}

export function SaaSKanbanFlowAnimation() {
  return <SaaSKanbanFlowAnimationCard />
}

export function SaaSNetworkMapAnimation() {
  return <SaaSNetworkMapAnimationCard />
}

export function SaaSProductTourAnimation() {
  return <SaaSProductTourAnimationCard />
}

export function ChatGptWebAnimation() {
  return <ChatGptWebAnimationCard />
}

export function ClaudeWebAnimation() {
  return <ClaudeWebAnimationCard />
}

export function ChatGptMobileAnimation() {
  return <ChatGptMobileAnimationCard />
}

export function ClaudeMobileAnimation() {
  return <ClaudeMobileAnimationCard />
}

export function EmailAnimation() {
  return <EmailAnimationCard />
}

export function InboxAnimation() {
  return <InboxAnimationCard />
}

export function NotificationCenterAnimation() {
  return <NotificationCenterAnimationCard />
}

export function DataPipelineAnimation() {
  return <DataPipelineAnimationCard />
}

export function ReportExportAnimation() {
  return <ReportExportAnimationCard />
}

export function ApprovalFlowAnimation() {
  return <ApprovalFlowAnimationCard />
}

export function AIAgentStepsAnimation() {
  return <AIAgentStepsAnimationCard />
}

export function FileUploadProcessingAnimation() {
  return <FileUploadProcessingAnimationCard />
}

export function TableDrilldownAnimation() {
  return <TableDrilldownAnimationCard />
}

export function CompareScenariosAnimation() {
  return <CompareScenariosAnimationCard />
}

export function ForecastAnimation() {
  return <ForecastAnimationCard />
}

export function MobileAppDemoAnimation() {
  return <MobileAppDemoAnimationCard />
}

export function McpOperationsDemo() {
  return <ExpenseClassificationAnimation />
}

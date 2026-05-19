"use client"

import type { ReactNode } from 'react'
import type {
  AnalysisStructuredContent,
  AutomationStructuredContent,
  ChartResultStructuredContent,
  ConnectorsStructuredContent,
  DashboardListStructuredContent,
  DashboardPreviewStructuredContent,
  DataCatalogStructuredContent,
  DataResultStructuredContent,
  TableStructuredContent,
} from '@/products/mcp-apps/web/src/types/toolResult'
import { AnalysisView } from '@/products/mcp-apps/web/src/views/AnalysisView'
import { AutomationView } from '@/products/mcp-apps/web/src/views/AutomationView'
import { ChartResultView } from '@/products/mcp-apps/web/src/views/ChartResultView'
import { ConnectorsView } from '@/products/mcp-apps/web/src/views/ConnectorsView'
import { DashboardListView } from '@/products/mcp-apps/web/src/views/DashboardListView'
import { DashboardPreviewView } from '@/products/mcp-apps/web/src/views/DashboardPreviewView'
import { DataCatalogView } from '@/products/mcp-apps/web/src/views/DataCatalogView'
import { DataResultView } from '@/products/mcp-apps/web/src/views/DataResultView'
import { TableResultView } from '@/products/mcp-apps/web/src/views/TableResultView'

type PreviewItem = {
  id: string
  title: string
  description: string
  category: string
  node: ReactNode
}

const erpResult: DataResultStructuredContent = {
  ok: true,
  tool: 'erp',
  title: 'Contas a Pagar',
  action: 'listar',
  resource: 'contas-a-pagar',
  count: 5,
  columns: ['id', 'fornecedor', 'categoria', 'centro_custo', 'data_vencimento', 'status', 'valor_liquido'],
  rows: [
    { id: 9001, fornecedor: 'Nexa Distribuidora', categoria: 'Materia-prima', centro_custo: 'Operacoes', data_vencimento: '2026-05-21', status: 'em_aberto', valor_liquido: 48250.9 },
    { id: 9002, fornecedor: 'Frete Sul Logistica', categoria: 'Frete', centro_custo: 'Logistica', data_vencimento: '2026-05-24', status: 'atrasado', valor_liquido: 18420.35 },
    { id: 9003, fornecedor: 'Cloudstack Brasil', categoria: 'Software', centro_custo: 'Tecnologia', data_vencimento: '2026-05-28', status: 'pago', valor_liquido: 7990 },
    { id: 9004, fornecedor: 'Agencia Pulse', categoria: 'Marketing', centro_custo: 'Growth', data_vencimento: '2026-06-03', status: 'em_aberto', valor_liquido: 31680 },
    { id: 9005, fornecedor: 'Studio Embalagens', categoria: 'Embalagens', centro_custo: 'Produto', data_vencimento: '2026-06-08', status: 'em_aberto', valor_liquido: 23980.5 },
  ],
}

const crmResult: DataResultStructuredContent = {
  ok: true,
  tool: 'crm',
  title: 'Oportunidades',
  action: 'listar',
  resource: 'crm/oportunidades',
  count: 4,
  columns: ['id', 'conta', 'fase', 'vendedor', 'status', 'probabilidade', 'valor_estimado'],
  rows: [
    { id: 301, conta: 'Grupo Solare', fase: 'Proposta', vendedor: 'Bianca Sales', status: 'aberta', probabilidade: 64, valor_estimado: 128000 },
    { id: 302, conta: 'Rede Farma Mais', fase: 'Negociacao', vendedor: 'Caio Martins', status: 'aberta', probabilidade: 72, valor_estimado: 94000 },
    { id: 303, conta: 'Dermo Prime', fase: 'Discovery', vendedor: 'Bianca Sales', status: 'risco', probabilidade: 35, valor_estimado: 41000 },
    { id: 304, conta: 'Clinicas Aura', fase: 'Fechada ganha', vendedor: 'Nina Costa', status: 'ganha', probabilidade: 100, valor_estimado: 186500 },
  ],
}

const marketingResult: DataResultStructuredContent = {
  ok: true,
  tool: 'marketing',
  title: 'ROAS por Campanha',
  action: 'roas_por_campanha',
  count: 4,
  columns: ['campanha', 'plataforma', 'gasto', 'receita_atribuida', 'roas', 'conversoes'],
  rows: [
    { campanha: 'GADS | BR | Search | Brand | 2026H1', plataforma: 'google_ads', gasto: 36850.45, receita_atribuida: 316400.3, roas: 8.59, conversoes: 928 },
    { campanha: 'META | BR | RMKT | VC+ATC 7D | 2026H1', plataforma: 'meta_ads', gasto: 52190.2, receita_atribuida: 248710.8, roas: 4.77, conversoes: 714 },
    { campanha: 'GADS | BR | PMax | All Products | 2026H1', plataforma: 'google_ads', gasto: 74120.1, receita_atribuida: 281600.7, roas: 3.8, conversoes: 802 },
    { campanha: 'META | BR | CONV | UGC Creative Testing | 2026H1', plataforma: 'meta_ads', gasto: 48990.9, receita_atribuida: 92800.1, roas: 1.89, conversoes: 223 },
  ],
}

const ecommerceResult: DataResultStructuredContent = {
  ok: true,
  tool: 'ecommerce',
  title: 'Vendas por Canal',
  action: 'vendas_por_canal',
  count: 4,
  columns: ['plataforma', 'pedidos', 'ticket_medio', 'receita'],
  rows: [
    { plataforma: 'shopify', pedidos: 1842, ticket_medio: 214.8, receita: 395661.6 },
    { plataforma: 'mercadolivre', pedidos: 918, ticket_medio: 176.1, receita: 161659.8 },
    { plataforma: 'shopee', pedidos: 1241, ticket_medio: 92.4, receita: 114668.4 },
    { plataforma: 'amazon', pedidos: 402, ticket_medio: 158.7, receita: 63800.4 },
  ],
}

const sqlResult: DataResultStructuredContent = {
  ok: true,
  tool: 'sql',
  title: 'Consulta SQL',
  count: 3,
  columns: ['mes', 'receita', 'despesa', 'margem'],
  rows: [
    { mes: '2026-03', receita: 812300, despesa: 566400, margem: 0.3027 },
    { mes: '2026-04', receita: 904100, despesa: 639800, margem: 0.2923 },
    { mes: '2026-05', receita: 681200, despesa: 492700, margem: 0.2767 },
  ],
}

const chartResult: ChartResultStructuredContent = {
  ok: true,
  tool: 'chart',
  view: 'chart',
  title: 'Portfolio distribution',
  subtitle: '5 categorias em 3 contas',
  total: { value: 100938, format: 'currency' },
  chart: { type: 'donut', labelField: 'classe', valueField: 'valor', format: 'currency' },
  rows: [
    { classe: 'Stocks', valor: 45320 },
    { classe: 'ETFs', valor: 24225 },
    { classe: 'Bonds', valor: 18500 },
    { classe: 'Crypto', valor: 7893 },
    { classe: 'Cash', valor: 4999 },
  ],
}

const horizontalChartResult: ChartResultStructuredContent = {
  ok: true,
  tool: 'chart',
  view: 'chart',
  title: 'Gasto por campanha',
  subtitle: 'Meta Ads e Google Ads · Maio 2026',
  chart: { type: 'horizontal_bar', labelField: 'campanha', valueField: 'gasto', format: 'currency' },
  rows: [
    { campanha: 'PMax All Products', gasto: 74120 },
    { campanha: 'Prospecting Broad', gasto: 68200 },
    { campanha: 'Search Generic', gasto: 54480 },
    { campanha: 'UGC Creative Testing', gasto: 48990 },
  ],
}

const analysisResult: AnalysisStructuredContent = {
  ok: true,
  tool: 'analysis',
  view: 'analysis',
  type: 'insights',
  title: 'Analise financeira',
  subtitle: 'Maio 2026 · Contas a pagar e receber',
  summary: 'A empresa tem boa previsibilidade de receita, mas concentra risco em fretes atrasados e campanhas com ROAS abaixo da meta.',
  metrics: [
    { label: 'Valor em aberto', value: 382400, format: 'currency' },
    { label: 'Atrasados', value: 9, format: 'number' },
    { label: 'Margem projetada', value: 0.287, format: 'percent' },
  ],
  sections: [
    { severity: 'high', kind: 'risco', title: 'Frete atrasado com fornecedor recorrente', evidence: 'Frete Sul aparece em 4 vencimentos atrasados nos ultimos 30 dias.', recommendation: 'Renegociar SLA e criar alerta de vencimento 5 dias antes.', impact_value: 18420.35 },
    { severity: 'medium', kind: 'oportunidade', title: 'Search Brand tem eficiencia acima da media', evidence: 'ROAS de 8,59 contra media de 4,39.', recommendation: 'Aumentar orcamento com teto diario e monitoramento de CPA.' },
    { severity: 'low', kind: 'qualidade', title: 'Dados completos para dashboard executivo', evidence: 'Contas financeiras, centros de custo e categorias estao preenchidos.', recommendation: 'Usar este recorte para relatorio semanal.' },
  ],
  next_steps: ['Criar alerta para contas vencendo em ate 5 dias.', 'Gerar relatorio executivo com riscos por fornecedor.', 'Revisar campanhas com ROAS abaixo de 2,0.'],
}

const tableResult: TableStructuredContent = {
  ok: true,
  tool: 'table',
  view: 'table',
  title: 'Tabela personalizada',
  subtitle: '5 registros · exemplo da tool table',
  columns: [
    { key: 'item', label: 'Item' },
    { key: 'owner', label: 'Responsavel' },
    { key: 'status', label: 'Status', format: 'status' },
    { key: 'valor', label: 'Valor', format: 'currency' },
  ],
  rows: [
    { item: 'Renegociar fornecedor', owner: 'Financeiro', status: 'aberto', valor: 18420 },
    { item: 'Atualizar dashboard', owner: 'BI', status: 'em_andamento', valor: 0 },
    { item: 'Pausar campanha UGC', owner: 'Growth', status: 'concluido', valor: 48990 },
    { item: 'Validar tracking PMax', owner: 'Marketing Ops', status: 'risco', valor: 74120 },
    { item: 'Criar relatorio semanal', owner: 'CEO Office', status: 'pendente', valor: 0 },
  ],
}

const connectorsResult: ConnectorsStructuredContent = {
  ok: true,
  tool: 'connectors',
  view: 'connectors',
  action: 'status',
  title: 'Conectores',
  subtitle: '6 conectores · 4 conectados · 1 atencao · 1 erro',
  summary: { total: 6, connected: 4, warning: 1, error: 1, last_sync_at: '2026-05-19T08:40:00.000Z' },
  rows: [
    { id: '1', connector_id: 'erp:1', domain: 'erp', plataforma: 'omie', name: 'Omie ERP', connection_status: 'connected', health: 'connected', last_sync_at: '2026-05-19T08:40:00.000Z', records_synced: 28410, scopes: ['financeiro', 'vendas', 'compras'] },
    { id: '2', connector_id: 'crm:2', domain: 'crm', plataforma: 'hubspot', name: 'HubSpot CRM', connection_status: 'connected', health: 'connected', last_sync_at: '2026-05-19T07:20:00.000Z', records_synced: 9120, scopes: ['contacts', 'deals'] },
    { id: '3', connector_id: 'marketing:3', domain: 'marketing', plataforma: 'google_ads', name: 'Google Ads', connection_status: 'connected', health: 'connected', last_sync_at: '2026-05-19T06:15:00.000Z', records_synced: 14456, scopes: ['campaigns', 'ads'] },
    { id: '4', connector_id: 'marketing:4', domain: 'marketing', plataforma: 'meta_ads', name: 'Meta Ads', connection_status: 'connected', health: 'connected', last_sync_at: '2026-05-19T06:10:00.000Z', records_synced: 14456, scopes: ['campaigns', 'insights'] },
    { id: '5', connector_id: 'ecommerce:5', domain: 'ecommerce', plataforma: 'shopify', name: 'Shopify Plus', connection_status: 'pending_reauth', health: 'warning', last_sync_at: '2026-05-18T22:00:00.000Z', records_synced: 6242, scopes: ['orders', 'products'] },
    { id: '6', connector_id: 'ecommerce:6', domain: 'ecommerce', plataforma: 'shopee', name: 'Shopee Oficial', connection_status: 'error', health: 'error', last_sync_at: '2026-05-16T12:00:00.000Z', records_synced: 1804, scopes: ['orders'], last_error: 'Token expirado no conector.' },
  ],
}

const connectorActionResult: ConnectorsStructuredContent = {
  ...connectorsResult,
  action: 'sync_now',
  title: 'Sincronizacao manual',
  subtitle: 'Google Ads',
  result: {
    action: 'sync_now',
    dry_run: true,
    connector_id: 'marketing:3',
    status: 'preview',
    message: 'No v1 esta tool retorna validacao estrutural e preview operacional.',
  },
  rows: [connectorsResult.rows?.[2]].filter(Boolean),
  count: 1,
}

const dataCatalogResult: DataCatalogStructuredContent = {
  ok: true,
  success: true,
  tool: 'data_catalog',
  view: 'data_catalog',
  action: 'pronto_para_dashboard',
  domain: 'erp',
  resource: 'contas-a-pagar',
  title: 'Catalogo de Dados',
  subtitle: 'ERP · Contas a Pagar · pronto para dashboard com ressalvas',
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
  fields: [
    { campo: 'fornecedor_id', tipo: 'integer', preenchimento: '100%', obrigatorio: true },
    { campo: 'valor_liquido', tipo: 'numeric', preenchimento: '100%', obrigatorio: true },
    { campo: 'departamento_id', tipo: 'integer', preenchimento: '94%', obrigatorio: false },
    { campo: 'filial_id', tipo: 'integer', preenchimento: '98%', obrigatorio: false },
  ],
  relationships: [
    { relacionamento: 'Fornecedor', origem: 'fornecedor_id', destino: 'entidades.fornecedores.id', pendentes: 0 },
    { relacionamento: 'Compra', origem: 'compra_id', destino: 'compras.compras.id', pendentes: 3 },
    { relacionamento: 'Centro de custo', origem: 'centro_custo_id', destino: 'empresa.centros_custo.id', pendentes: 0 },
  ],
  coverage: [
    { mes: '2026-01', registros: 82, valor: 341200 },
    { mes: '2026-02', registros: 76, valor: 328900 },
    { mes: '2026-03', registros: 91, valor: 421000 },
    { mes: '2026-04', registros: 88, valor: 386100 },
    { mes: '2026-05', registros: 83, valor: 364890 },
  ],
  quality: { score: 91, resource: 'contas-a-pagar', missing_fields: 2, orphan_relationships: 3 },
  rows: [
    { criterio: 'Campos obrigatorios', status: 'ok', score: 98 },
    { criterio: 'Relacionamentos', status: 'atencao', score: 87 },
    { criterio: 'Cobertura temporal', status: 'ok', score: 92 },
  ],
  issues: ['Compra: 3 referencias sem join valido.', 'Ecommerce sem cobertura temporal no periodo informado.'],
  recommendations: ['Revisar contas sem compra vinculada.', 'Usar janela minima de 5 meses para tendencia.'],
}

const alertsResult: AutomationStructuredContent = {
  ok: true,
  tool: 'alerts',
  view: 'automation_list',
  kind: 'alerts',
  action: 'list',
  title: 'Alertas',
  subtitle: '3 registros · 2 ativos · 1 pausado',
  summary: { total: 3, active: 2, paused: 1, next_run_at: '2026-05-20T09:00:00.000Z' },
  rows: [
    { id: 11, title: 'Contas vencendo em 5 dias', status: 'active', condition: { resource: 'contas-a-pagar', threshold: 'due_in_5_days' }, frequency: 'daily', time: '09:00', channels: ['chat', 'email'], last_run_at: '2026-05-19T09:00:00.000Z', next_run_at: '2026-05-20T09:00:00.000Z' },
    { id: 12, title: 'ROAS abaixo de 2', status: 'active', condition: { resource: 'marketing', metric: 'roas', lt: 2 }, frequency: 'daily', time: '08:30', channels: ['chat'], last_run_at: '2026-05-19T08:30:00.000Z', next_run_at: '2026-05-20T08:30:00.000Z' },
    { id: 13, title: 'CRM sem follow-up', status: 'paused', condition: { resource: 'crm/oportunidades', days_without_activity: 7 }, frequency: 'weekly', day_of_week: 'monday', channels: ['email'], last_run_at: '2026-05-18T10:00:00.000Z', next_run_at: null },
  ],
}

const schedulesResult: AutomationStructuredContent = {
  ok: true,
  tool: 'schedules',
  view: 'automation_list',
  kind: 'schedules',
  action: 'list',
  title: 'Agendamentos',
  subtitle: '3 registros · 3 ativos · 0 pausados',
  summary: { total: 3, active: 3, paused: 0, next_run_at: '2026-05-20T07:00:00.000Z' },
  rows: [
    { id: 21, title: 'Relatorio financeiro semanal', status: 'active', artifact_kind: 'report', prompt: 'Gerar relatorio com contas a pagar, contas a receber e riscos.', frequency: 'weekly', day_of_week: 'monday', time: '07:00', channels: ['email'], last_run_at: '2026-05-18T07:00:00.000Z', next_run_at: '2026-05-25T07:00:00.000Z' },
    { id: 22, title: 'Dashboard de marketing', status: 'active', artifact_kind: 'dashboard', prompt: 'Atualizar dashboard de Meta Ads e Google Ads.', frequency: 'daily', time: '06:00', channels: ['chat'], last_run_at: '2026-05-19T06:00:00.000Z', next_run_at: '2026-05-20T06:00:00.000Z' },
    { id: 23, title: 'Slides executivos', status: 'active', artifact_kind: 'slide', prompt: 'Criar slides com resumo da semana e recomendacoes.', frequency: 'weekly', day_of_week: 'friday', time: '15:00', channels: ['chat', 'email'], last_run_at: '2026-05-15T15:00:00.000Z', next_run_at: '2026-05-22T15:00:00.000Z' },
  ],
}

const actionResult: AutomationStructuredContent = {
  ok: true,
  tool: 'actions',
  view: 'action_result',
  kind: 'actions',
  action: 'baixar',
  title: 'Preview de acao',
  subtitle: 'Preview gerado. Nenhuma alteracao foi executada.',
  domain: 'erp',
  dry_run: true,
  preview: {
    risk_level: 'medium',
    confirmation_required: true,
    idempotency_key: 'erp-baixar-contas-pagar-9002',
    target: 'contas-a-pagar #9002',
  },
  result: {
    status: 'preview',
    message: 'Revise o preview e confirme explicitamente antes de executar.',
  },
  rows: [
    { action_run_id: 501, dominio: 'erp', acao: 'baixar', status: 'preview', recurso: 'contas-a-pagar', id: 9002 },
  ],
}

const dashboardListResult: DashboardListStructuredContent = {
  ok: true,
  tool: 'dashboards',
  view: 'dashboard_list',
  title: 'Dashboards',
  dashboards: [
    { id: 'dash-financeiro', title: 'Financeiro Executivo', slug: 'financeiro-executivo', status: 'published', current_draft_version: 4, current_published_version: 3, updated_at: '2026-05-19T09:10:00.000Z' },
    { id: 'dash-marketing', title: 'Marketing H1', slug: 'marketing-h1', status: 'draft', current_draft_version: 2, current_published_version: null, updated_at: '2026-05-18T18:30:00.000Z' },
    { id: 'dash-operacoes', title: 'Operacoes e Estoque', slug: 'operacoes-estoque', status: 'published', current_draft_version: 7, current_published_version: 7, updated_at: '2026-05-17T15:20:00.000Z' },
  ],
}

const dashboardPreviewResult: DashboardPreviewStructuredContent = {
  ok: true,
  tool: 'open_artifact',
  view: 'dashboard_preview',
  title: 'Preview do artifact',
  dashboard: {
    id: 'dash-financeiro',
    artifact_id: 'artifact-demo-financeiro',
    title: 'Financeiro Executivo',
    slug: 'financeiro-executivo',
    status: 'draft',
    version: 4,
    kind: 'draft',
    updated_at: '2026-05-19T09:10:00.000Z',
    source: `<Dashboard id="financeiro" title="Financeiro Executivo" theme="classic" chartPalette="teal">
  <Text variant="title">Contas a pagar e receber</Text>
  <Container style={{ display: 'flex', gap: 16 }}>
    <Kpi title="Valor em aberto" value="R$ 382.400" />
    <Chart type="bar" title="Fluxo por mes" />
  </Container>
</Dashboard>`,
    metadata: { owner: 'Financeiro', periodo: '2026H1' },
  },
}

const emptyTableResult: TableStructuredContent = {
  ok: true,
  tool: 'table',
  view: 'table',
  title: 'Tabela vazia',
  subtitle: '0 registros',
  columns: [{ key: 'id', label: 'ID' }, { key: 'status', label: 'Status' }],
  rows: [],
  count: 0,
}

const previews: PreviewItem[] = [
  { id: 'erp', category: 'Dados operacionais', title: 'ERP', description: 'Tabela de contas a pagar com subtitulo agregado.', node: <DataResultView data={erpResult} /> },
  { id: 'crm', category: 'Dados operacionais', title: 'CRM', description: 'Tabela semantica com oportunidade, fase e vendedor.', node: <DataResultView data={crmResult} /> },
  { id: 'marketing', category: 'Dados operacionais', title: 'Marketing', description: 'Tabela analitica com ROAS, gasto e conversoes.', node: <DataResultView data={marketingResult} /> },
  { id: 'ecommerce', category: 'Dados operacionais', title: 'Ecommerce', description: 'Resumo por canal conectado.', node: <DataResultView data={ecommerceResult} /> },
  { id: 'sql', category: 'Dados operacionais', title: 'SQL', description: 'Resultado ad-hoc de consulta analitica.', node: <DataResultView data={sqlResult} /> },
  { id: 'chart-donut', category: 'Visualizacoes', title: 'Chart · Donut', description: 'Card de grafico no estilo ChatGPT Finance.', node: <ChartResultView data={chartResult} /> },
  { id: 'chart-bars', category: 'Visualizacoes', title: 'Chart · Barras', description: 'Mesmo componente em modo barras horizontais.', node: <ChartResultView data={horizontalChartResult} /> },
  { id: 'analysis', category: 'Visualizacoes', title: 'Analysis', description: 'Metricas, achados, severidade e proximos passos.', node: <AnalysisView data={analysisResult} /> },
  { id: 'table', category: 'Visualizacoes', title: 'Table', description: 'Tool generica para tabela customizada.', node: <TableResultView data={tableResult} /> },
  { id: 'connectors', category: 'Operacao', title: 'Connectors', description: 'Cards de conectores, resumo e tabela tecnica.', node: <ConnectorsView data={connectorsResult} /> },
  { id: 'connector-action', category: 'Operacao', title: 'Connectors · Action', description: 'Estado com resultado de sync/test/reconnect.', node: <ConnectorsView data={connectorActionResult} /> },
  { id: 'catalog', category: 'Operacao', title: 'Data Catalog', description: 'Tabs de fontes, recursos, qualidade, campos e relacionamentos.', node: <DataCatalogView data={dataCatalogResult} /> },
  { id: 'alerts', category: 'Operacao', title: 'Alerts', description: 'Lista de alertas com status e recorrencia.', node: <AutomationView data={alertsResult} /> },
  { id: 'schedules', category: 'Operacao', title: 'Schedules', description: 'Lista de agendamentos de artifacts e relatorios.', node: <AutomationView data={schedulesResult} /> },
  { id: 'actions', category: 'Operacao', title: 'Actions', description: 'Preview de acao assistida antes da execucao real.', node: <AutomationView data={actionResult} /> },
  { id: 'dashboard-list', category: 'Artifacts', title: 'Dashboard List', description: 'Cards retornados pela busca de dashboards.', node: <DashboardListView data={dashboardListResult} /> },
  { id: 'dashboard-preview', category: 'Artifacts', title: 'Dashboard Preview', description: 'Metadados e source de um artifact.', node: <DashboardPreviewView data={dashboardPreviewResult} /> },
  { id: 'empty', category: 'Estados', title: 'Empty State', description: 'Estado vazio de uma tool renderizavel.', node: <TableResultView data={emptyTableResult} /> },
]

const categories = Array.from(new Set(previews.map((preview) => preview.category)))

export default function McpUiGalleryPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f6] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-7">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">bigquery-test</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">MCP UI Gallery</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Galeria interna com payloads mockados para revisar as UIs reais das tools renderizadas no ChatGPT App.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Topicos da galeria">
            {categories.map((category) => (
              <a
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                href={`#${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                key={category}
              >
                {category}
              </a>
            ))}
          </nav>
        </header>

        {categories.map((category) => (
          <section className="flex flex-col gap-4" id={category.toLowerCase().replace(/[^a-z0-9]+/g, '-')} key={category}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-normal text-slate-950">{category}</h2>
                <p className="text-sm text-slate-500">{previews.filter((preview) => preview.category === category).length} exemplos visuais</p>
              </div>
            </div>

            <div className="grid gap-5">
              {previews
                .filter((preview) => preview.category === category)
                .map((preview) => (
                  <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={preview.id}>
                    <header className="mb-4 flex flex-col gap-1 border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-semibold tracking-normal text-slate-950">{preview.title}</h3>
                      <p className="text-sm text-slate-500">{preview.description}</p>
                    </header>
                    <div className="mx-auto w-full max-w-[860px] rounded-[22px] border border-[#e5e7eb] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-4">
                      <div className="mx-auto w-full max-w-[820px]">{preview.node}</div>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

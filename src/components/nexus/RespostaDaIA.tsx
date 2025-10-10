import { UIMessage, type ToolUIPart } from 'ai';
import { Response } from '@/components/ai-elements/response';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { ToolInputStreaming } from '@/components/ai-elements/tool-input-streaming';
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import MetaIcon from '@/components/icons/MetaIcon';
import GoogleAnalyticsIcon from '@/components/icons/GoogleAnalyticsIcon';
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon';
import ShopifyIcon from '@/components/icons/ShopifyIcon';
import AmazonIcon from '@/components/icons/AmazonIcon';
import WeatherCard from '../tools/WeatherCard';
import DatasetsList from '../tools/DatasetsList';
import TablesList from '../tools/TablesList';
import TableSchema from '../tools/TableSchema';
import CampaignsList from '../tools/CampaignsList';
import TableData from '../tools/TableData';
import ChartVisualization from '../tools/ChartVisualization';
import ResultDisplay from '../tools/ResultDisplay';
import Dashboard from '../tools/Dashboard';
import SQLExecution from '../tools/SQLExecution';
import SQLDataResults from '../tools/SQLDataResults';
import InsightsResults from '../tools/InsightsResults';
import AlertsResults from '../tools/AlertsResults';
import RecommendationsResults from '../tools/RecommendationsResults';
import ReportResults from '../tools/ReportResults';
import TableCreation from '../tools/TableCreation';
import { KPICard } from '../widgets/KPICard';
import WebPreviewCard from '../tools/WebPreviewCard';
import PlanAnalysis from '../tools/PlanAnalysis';
import PlanAnalysisStreaming from '../tools/PlanAnalysisStreaming';
import TimelineContext from '../tools/TimelineContext';
import { GenerativeChart } from '../tools/GenerativeChart';
import { MultipleCharts } from '../tools/MultipleCharts';
import { MultipleSQL } from '../tools/MultipleSQL';
import CodeExecutionResult from '../tools/CodeExecutionResult';
import RenderDashboardCode from './tools/renderDashboardCode';
import CreateDashboardResult from './tools/CreateDashboardResult';
import UpdateDashboardResult from './tools/UpdateDashboardResult';
import EmailResult from '../tools/EmailResult';
import YouTubeContentList from '../tools/YouTubeContentList';
import ReelsContentList from '../tools/ReelsContentList';
import ContentCreationSuccess from '../tools/ContentCreationSuccess';
import SalesCallsList from '../tools/SalesCallsList';
import RHCandidatesList from '../tools/RHCandidatesList';
import ServiceOrdersList from '../tools/ServiceOrdersList';
import ContasAReceberList from '../tools/ContasAReceberList';
import ReceiptsList from '../tools/ReceiptsList';
import NotasFiscaisList from '../tools/NotasFiscaisList';
import InventoryList from '../tools/InventoryList';
import ContasAPagarList from '../tools/ContasAPagarList';
import FluxoCaixaResult from '../tools/FluxoCaixaResult';
import FinancialDataTable from '../tools/FinancialDataTable';
import OrganicMarketingDataTable from '../tools/OrganicMarketingDataTable';
import PaidTrafficDataTable from '../tools/PaidTrafficDataTable';
import InventoryDataTable from '../tools/InventoryDataTable';
import EcommerceSalesDataTable from '../tools/EcommerceSalesDataTable';
import LogisticsDataTable from '../tools/LogisticsDataTable';
import AnalyticsDataTable from '../tools/AnalyticsDataTable';
import ComprasDataTable from '../tools/ComprasDataTable';
import ProjetosDataTable from '../tools/ProjetosDataTable';
import FuncionariosDataTable from '../tools/FuncionariosDataTable';
import RevenueMetricsResult from '../tools/RevenueMetricsResult';
import CustomerMetricsResult from '../tools/CustomerMetricsResult';
import ProductPerformanceResult from '../tools/ProductPerformanceResult';
import CouponEffectivenessResult from '../tools/CouponEffectivenessResult';
import ChannelAnalysisResult from '../tools/ChannelAnalysisResult';
import CalculateMetricsResult from '../tools/inventory/CalculateMetricsResult';
import TrendsAnalysisResult from '../tools/inventory/TrendsAnalysisResult';
import RestockForecastResult from '../tools/inventory/RestockForecastResult';
import SlowMovingItemsResult from '../tools/inventory/SlowMovingItemsResult';
import ChannelComparisonResult from '../tools/inventory/ChannelComparisonResult';
import ABCAnalysisResult from '../tools/inventory/ABCAnalysisResult';
import AnomaliesResult from '../tools/inventory/AnomaliesResult';
import DeliveryPerformanceResult from '../tools/logistics/DeliveryPerformanceResult';
import CarrierBenchmarkResult from '../tools/logistics/CarrierBenchmarkResult';
import ShippingCostStructureResult from '../tools/logistics/ShippingCostStructureResult';
import ReverseLogisticsTrendsResult from '../tools/logistics/ReverseLogisticsTrendsResult';
import OptimizePackageDimensionsResult from '../tools/logistics/OptimizePackageDimensionsResult';
import DetectDeliveryAnomaliesResult from '../tools/logistics/DetectDeliveryAnomaliesResult';
import ForecastDeliveryCostsResult from '../tools/logistics/ForecastDeliveryCostsResult';
import ContentPerformanceResult from '../tools/organic-marketing/ContentPerformanceResult';
import PlatformBenchmarkResult from '../tools/organic-marketing/PlatformBenchmarkResult';
import AudienceGrowthResult from '../tools/organic-marketing/AudienceGrowthResult';
import TopContentResult from '../tools/organic-marketing/TopContentResult';
import ContentMixResult from '../tools/organic-marketing/ContentMixResult';
import ForecastEngagementResult from '../tools/organic-marketing/ForecastEngagementResult';
import ContentROIResult from '../tools/organic-marketing/ContentROIResult';

interface ReasoningPart {
  type: 'reasoning';
  state: 'streaming' | 'complete';
  content?: string;
  text?: string;
}

type WeatherToolInput = {
  location: string;
};

type WeatherToolOutput = {
  location: string;
  temperature: number;
};

type DatasetToolInput = {
  projectId?: string;
};

type DatasetToolOutput = {
  datasets: Array<{
    id: string;
    friendlyName?: string;
    description?: string;
    location?: string;
    creationTime?: string;
    lastModifiedTime?: string;
  }>;
  success: boolean;
  error?: string;
};

type TablesToolInput = {
  datasetId: string;
};

type TablesToolOutput = {
  tables: Array<{
    tableId: string;
    description?: string;
    numRows?: number;
    numBytes?: number;
    creationTime?: string;
  }>;
  datasetId: string;
  success: boolean;
  error?: string;
};

type DataToolInput = {
  datasetId: string;
  tableId: string;
  limit?: number;
};

type DataToolOutput = {
  data: Array<Record<string, unknown>>;
  schema: Array<{
    name: string;
    type: string;
    mode: string;
  }>;
  totalRows: number;
  executionTime: number;
  datasetId: string;
  tableId: string;
  query?: string;
  success: boolean;
  error?: string;
};

type TableSchemaToolInput = {
  tableName: string;
  datasetId?: string;
  projectId?: string;
};

type TableSchemaToolOutput = {
  columns: Array<{
    column_name: string;
    data_type: string;
  }>;
  success: boolean;
  tableName: string;
  datasetId: string;
  projectId: string;
  totalColumns: number;
  error?: string;
};

type GetCampaignsToolInput = {
  tableName: string;
  datasetId?: string;
  projectId?: string;
  limit?: number;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  orderBy?: string;
};

type GetCampaignsToolOutput = {
  campaigns: Array<{
    campaign_id: string;
    campaign_name: string;
    account_name: string;
    days_active: number;
    total_impressions: number;
    total_spend: number;
    total_clicks: number;
    ctr: number;
    cpc: number;
  }>;
  success: boolean;
  tableName: string;
  datasetId: string;
  projectId: string;
  totalCampaigns: number;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  error?: string;
};


type CriarGraficoToolInput = {
  tableData: Array<Record<string, unknown>>;
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'radar' | 'funnel' | 'treemap' | 'stream';
  xColumn: string;
  yColumn: string;
  title?: string;
  groupBy?: string;
};

type CriarGraficoToolOutput = {
  chartData: Array<{
    x?: string;
    y?: number;
    label?: string;
    value?: number;
    color?: string;
  }>;
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'radar' | 'funnel' | 'treemap' | 'stream';
  title: string;
  xColumn: string;
  yColumn: string;
  metadata: {
    totalDataPoints: number;
    generatedAt: string;
    executionTime: number;
    dataSource?: string;
  };
  success: boolean;
  error?: string;
};

type RetrieveResultToolInput = {
  resultId?: string;
  queryId?: string;
  resultType?: 'analysis' | 'chart' | 'dashboard' | 'query';
};

type SourceDocument = {
  id: string;
  title: string;
  url?: string;
  snippet: string;
  relevanceScore: number;
};

type RetrieveResultToolOutput = {
  resultId: string;
  resultType: string;
  result: {
    type?: string;
    data?: Record<string, unknown>;
    message?: string;
    query?: string;
    response?: string;
  };
  sources?: SourceDocument[];
  retrievedAt: string;
  success: boolean;
  error?: string;
};

type CriarDashboardToolInput = {
  datasetIds: string[];
  title: string;
  dashboardType: 'executive' | 'operational' | 'analytical';
  kpis?: string[];
};

type CriarDashboardToolOutput = {
  dashboardId: string;
  title: string;
  dashboardType: string;
  datasetIds: string[];
  widgets: Array<{
    type: string;
    title: string;
    value?: string;
    trend?: string;
    color?: string;
    target?: string;
    chartType?: string;
    size?: string;
    rows?: number;
    items?: string[];
  }>;
  kpis: string[];
  layout: {
    columns: number;
    theme: string;
    autoRefresh: boolean;
  };
  metadata: {
    createdAt: string;
    lastUpdated: string;
    version: string;
  };
  success: boolean;
  error?: string;
};

type ExecutarSQLToolInput = {
  sqlQuery: string;
  datasetId?: string;
  dryRun?: boolean;
};

type ExecutarSQLToolOutput = {
  sqlQuery: string;
  explicacao?: string;
  datasetId: string;
  queryType: string;
  dryRun: boolean;
  data: Array<Record<string, unknown>>;
  schema: Array<{
    name: string;
    type: string;
    mode: string;
  }>;
  rowsReturned: number;
  rowsAffected: number;
  totalRows: number;
  executionTime: number;
  bytesProcessed: number;
  success: boolean;
  validationErrors: string[];
  error?: string;
};

type SendEmailToolOutput = {
  success: boolean;
  emailId?: string;
  recipient: string;
  subject: string;
  bodyLength: number;
  priority?: string;
  attachmentCount?: number;
  timestamp: string;
  message: string;
  note?: string;
  error?: string;
};

type GetYouTubeContentToolInput = {
  limit?: number;
  status?: 'draft' | 'published' | 'archived';
};

type GetYouTubeContentToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    titulo: string;
    hook?: string;
    intro?: string;
    value_proposition?: string;
    script?: string;
    categoria?: string;
    status?: string;
    created_at?: string;
    views?: number;
    likes?: number;
    comments?: number;
    retention_rate?: number;
    subscribers_gained?: number;
  }>;
  message: string;
  error?: string;
};

type GetReelsContentToolInput = {
  limit?: number;
  status?: 'draft' | 'published' | 'archived';
};

type GetReelsContentToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    titulo: string;
    hook?: string;
    hook_expansion?: string;
    script?: string;
    status?: string;
    created_at?: string;
    views?: number;
    likes?: number;
    comments?: number;
    saves?: number;
    engagement_rate?: number;
    follows?: number;
  }>;
  message: string;
  error?: string;
};

type CreateYouTubeContentToolInput = {
  titulo: string;
  hook?: string;
  intro?: string;
  value_proposition?: string;
  script?: string;
  categoria?: string;
};

type CreateYouTubeContentToolOutput = {
  success: boolean;
  data?: {
    id: string;
    titulo: string;
    hook?: string;
    intro?: string;
    value_proposition?: string;
    script?: string;
    categoria?: string;
  };
  message: string;
  error?: string;
};

type CreateReelsContentToolInput = {
  titulo: string;
  hook?: string;
  hook_expansion?: string;
  script?: string;
};

type CreateReelsContentToolOutput = {
  success: boolean;
  data?: {
    id: string;
    titulo: string;
    hook?: string;
    hook_expansion?: string;
    script?: string;
  };
  message: string;
  error?: string;
};

type GetSalesCallsToolInput = {
  limit?: number;
  status?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  sales_rep?: string;
};

type GetSalesCallsToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    call_date?: string;
    duration_minutes?: number;
    client_name: string;
    client_company?: string;
    sales_rep: string;
    transcription?: string;
    summary?: string;
    key_points?: string;
    objections_identified?: string;
    objections_handled?: string;
    sentiment_score?: number;
    engagement_score?: number;
    close_probability?: number;
    next_steps?: string;
    follow_up_date?: string;
    status?: string;
    deal_value?: number;
    notes?: string;
    created_at?: string;
  }>;
  message: string;
  error?: string;
};

type GetRHCandidatesToolInput = {
  limit?: number;
  status?: 'em_analise' | 'aprovado' | 'reprovado';
  vaga?: string;
};

type GetRHCandidatesToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
    vaga: string;
    curriculo_resumo?: string;
    call_transcription?: string;
    call_summary?: string;
    pontos_fortes?: string;
    pontos_atencao?: string;
    fit_cultural_score?: number;
    fit_tecnico_score?: number;
    recomendacao?: string;
    status?: string;
    data_entrevista?: string;
    created_at?: string;
  }>;
  message: string;
  error?: string;
};

type GetServiceOrdersToolInput = {
  limit?: number;
  status?: 'aberta' | 'em_andamento' | 'aguardando_pecas' | 'concluida' | 'cancelada';
  tecnico_responsavel?: string;
};

type GetServiceOrdersToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    numero_os: string;
    cliente_nome: string;
    equipamento: string;
    defeito_relatado: string;
    diagnostico?: string;
    servico_executado?: string;
    tecnico_responsavel: string;
    status?: string;
    valor_total?: number;
    data_abertura?: string;
    data_conclusao?: string;
    created_at?: string;
  }>;
  message: string;
  error?: string;
};

type GetContasAReceberToolInput = {
  limit?: number;
  status?: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  cliente_nome?: string;
};

type GetContasAReceberToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    numero_fatura: string;
    cliente_nome: string;
    cliente_email?: string;
    valor_total: number;
    valor_pago?: number;
    valor_pendente?: number;
    data_emissao?: string;
    data_vencimento?: string;
    data_pagamento?: string;
    status?: string;
    itens_descricao?: string;
    metodo_pagamento?: string;
    nota_fiscal_url?: string;
    observacoes?: string;
    created_at?: string;
  }>;
  message: string;
  error?: string;
};

type GetReceiptsToolInput = {
  limit?: number;
  status?: 'pendente' | 'aprovado' | 'reprovado' | 'reembolsado';
  tipo?: 'reembolso' | 'compra' | 'servico' | 'doacao' | 'outros';
  solicitante_nome?: string;
};

type GetReceiptsToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    numero_recibo: string;
    tipo: string;
    solicitante_nome: string;
    solicitante_email?: string;
    fornecedor_nome: string;
    valor: number;
    data_emissao?: string;
    data_envio?: string;
    categoria: string;
    descricao?: string;
    anexo_url?: string;
    status?: string;
    aprovador_nome?: string;
    data_aprovacao?: string;
    motivo_reprovacao?: string;
    metodo_reembolso?: string;
    observacoes?: string;
    created_at?: string;
  }>;
  message: string;
  error?: string;
};

type GetNotasFiscaisToolInput = {
  limit?: number;
  status?: 'autorizada' | 'cancelada' | 'denegada' | 'inutilizada';
  tipo?: 'entrada' | 'saida';
  emitente_cnpj?: string;
  destinatario_cnpj?: string;
};

type GetNotasFiscaisToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    numero_nfe: string;
    chave_acesso: string;
    serie: string;
    tipo: string;
    emitente_nome: string;
    emitente_cnpj: string;
    destinatario_nome: string;
    destinatario_cnpj: string;
    valor_total: number;
    valor_produtos: number;
    valor_icms?: number;
    valor_ipi?: number;
    valor_pis?: number;
    valor_cofins?: number;
    data_emissao?: string;
    data_entrada_saida?: string;
    status?: string;
    natureza_operacao?: string;
    cfop?: string;
    xml_url?: string;
    pdf_url?: string;
    protocolo_autorizacao?: string;
    observacoes?: string;
    created_at?: string;
  }>;
  message: string;
  error?: string;
};

type GetInventoryToolInput = {
  limit?: number;
  status?: 'disponivel' | 'baixo_estoque' | 'esgotado' | 'descontinuado';
  categoria?: string;
  nome_produto?: string;
};

type GetInventoryToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    codigo_produto: string;
    nome_produto: string;
    categoria?: string;
    descricao?: string;
    quantidade_atual: number;
    quantidade_minima?: number;
    quantidade_maxima?: number;
    unidade_medida?: string;
    localizacao?: string;
    fornecedor?: string;
    custo_unitario?: number;
    preco_venda?: number;
    ultima_compra?: string;
    ultima_venda?: string;
    status?: string;
    observacoes?: string;
    created_at?: string;
    updated_at?: string;
  }>;
  message: string;
  error?: string;
};

type GetFinancialDataToolInput = {
  table: 'contas_a_pagar' | 'contas_a_receber';
  limit?: number;
};

type GetFinancialDataToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string | number;
    valor?: number;
    status?: string;
    data_vencimento?: string;
    data_emissao?: string;
    descricao?: string;
    [key: string]: unknown;
  }>;
  message: string;
  error?: string;
};

type GetOrganicMarketingDataToolInput = {
  table: 'contas_sociais' | 'publicacoes' | 'metricas_publicacoes' | 'resumos_conta';
  limit?: number;
  plataforma?: string;
  status?: string;
  tipo_post?: string;
  data_de?: string;
  data_ate?: string;
  engajamento_minimo?: number;
  curtidas_minimo?: number;
};

type GetOrganicMarketingDataToolOutput = {
  success: boolean;
  count: number;
  table: string;
  data: Array<{
    id: string | number;
    plataforma?: string;
    status?: string;
    tipo_post?: string;
    nome_conta?: string;
    conectado_em?: string;
    titulo?: string;
    hook?: string;
    publicado_em?: string;
    criado_em?: string;
    curtidas?: number;
    comentarios?: number;
    compartilhamentos?: number;
    visualizacoes?: number;
    salvamentos?: number;
    alcance?: number;
    taxa_engajamento?: number;
    registrado_em?: string;
    seguidores?: number;
    seguindo?: number;
    total_publicacoes?: number;
    alcance_total?: number;
    [key: string]: unknown;
  }>;
  message: string;
  error?: string;
};

type GetPaidTrafficDataToolInput = {
  table: 'contas_ads' | 'campanhas' | 'grupos_de_anuncios' | 'anuncios_criacao' | 'anuncios_colaboradores' | 'anuncios_publicados' | 'metricas_anuncios' | 'resumos_campanhas';
  limit?: number;
  plataforma?: string;
  status?: string;
  criativo_status?: string;
  objetivo?: string;
  data_de?: string;
  data_ate?: string;
  roas_minimo?: number;
  gasto_minimo?: number;
  gasto_maximo?: number;
  conversoes_minimo?: number;
  ctr_minimo?: number;
};

type GetPaidTrafficDataToolOutput = {
  success: boolean;
  count: number;
  table: string;
  data: Array<{
    id: string | number;
    plataforma?: string;
    nome_conta?: string;
    conectado_em?: string;
    conta_ads_id?: string;
    nome?: string;
    objetivo?: string;
    orcamento_total?: number;
    orcamento_diario?: number;
    status?: string;
    inicio?: string;
    fim?: string;
    campanha_id?: string;
    publico_alvo?: unknown;
    grupo_id?: string;
    titulo?: string;
    hook?: string;
    criativo_status?: string;
    criado_por?: string;
    criado_em?: string;
    atualizado_em?: string;
    anuncio_criacao_id?: string;
    anuncio_id_plataforma?: string;
    publicado_em?: string;
    anuncio_publicado_id?: string;
    data?: string;
    impressao?: number;
    cliques?: number;
    ctr?: number;
    cpc?: number;
    conversao?: number;
    gasto?: number;
    receita?: number;
    cpa?: number;
    roas?: number;
    cpm_real?: number;
    total_gasto?: number;
    total_cliques?: number;
    total_conversoes?: number;
    ctr_medio?: number;
    cpc_medio?: number;
    registrado_em?: string;
    [key: string]: unknown;
  }>;
  message: string;
  error?: string;
};

type GetInventoryDataToolInput = {
  table: 'centros_distribuicao' | 'estoque_canal' | 'integracoes_canais' | 'movimentacoes_estoque' | 'precos_canais';
  limit?: number;
  ativo?: boolean;
  product_id?: string;
  channel_id?: string;
  tipo?: string;
  quantidade_minima?: number;
  quantidade_maxima?: number;
  data_de?: string;
  data_ate?: string;
};

type GetInventoryDataToolOutput = {
  success: boolean;
  count: number;
  table: string;
  data: Array<{
    id: string;
    nome?: string;
    endereco?: string;
    ativo?: boolean;
    product_id?: string;
    channel_id?: string;
    sku_channel?: string;
    quantity_available?: number;
    quantity_reserved?: number;
    last_updated?: string;
    api_key?: string;
    config?: unknown;
    last_sync?: string;
    order_id?: string;
    type?: string;
    quantity?: number;
    reason?: string;
    price?: number;
    start_date?: string;
    end_date?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
  }>;
  message: string;
  error?: string;
};

type GetEcommerceSalesDataToolInput = {
  table: 'channels' | 'coupons' | 'customers' | 'loyalty_points' | 'loyalty_rewards' | 'order_items' | 'orders' | 'payments' | 'products' | 'returns';
  limit?: number;
  is_active?: boolean;
  status?: string;
  customer_id?: string;
  channel_id?: string;
  product_id?: string;
  order_id?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  data_de?: string;
  data_ate?: string;
};

type GetEcommerceSalesDataToolOutput = {
  success: boolean;
  count: number;
  table: string;
  data: Array<{
    id: string;
    name?: string;
    type?: string;
    is_active?: boolean;
    config?: unknown;
    code?: string;
    discount_value?: number;
    discount_type?: string;
    valid_from?: string;
    valid_until?: string;
    usage_limit?: number;
    times_used?: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    total_spent?: number;
    total_orders?: number;
    customer_id?: string;
    points?: number;
    earned_date?: string;
    expiry_date?: string;
    reward_name?: string;
    points_required?: number;
    description?: string;
    order_id?: string;
    product_id?: string;
    quantity?: number;
    unit_price?: number;
    subtotal?: number;
    channel_id?: string;
    status?: string;
    order_date?: string;
    total_value?: number;
    shipping_cost?: number;
    discount?: number;
    amount?: number;
    payment_method?: string;
    payment_date?: string;
    transaction_id?: string;
    sku?: string;
    price?: number;
    stock_quantity?: number;
    category?: string;
    return_date?: string;
    reason?: string;
    refund_amount?: number;
    return_status?: string;
    criado_em?: string;
    updated_at?: string;
    [key: string]: unknown;
  }>;
  message: string;
  error?: string;
};

type GetRevenueMetricsToolInput = {
  data_de: string;
  data_ate: string;
  comparar_com_periodo_anterior?: boolean;
  channel_id?: string;
};

type GetRevenueMetricsToolOutput = {
  success: boolean;
  message: string;
  error?: string;
  data: {
    periodo: { data_de: string; data_ate: string };
    receita_total: number;
    numero_pedidos: number;
    aov: number;
    desconto_total: number;
    frete_total: number;
    receita_liquida: number;
    comparacao?: {
      periodo_anterior: { data_de: string; data_ate: string };
      receita_anterior: number;
      pedidos_anterior: number;
      aov_anterior: number;
      crescimento_receita_percentual: number;
      crescimento_pedidos_percentual: number;
      crescimento_aov_percentual: number;
    };
  } | null;
};

type GetCustomerMetricsToolInput = {
  data_de: string;
  data_ate: string;
  top_clientes_limit?: number;
};

type GetCustomerMetricsToolOutput = {
  success: boolean;
  message: string;
  error?: string;
  data: {
    periodo: { data_de: string; data_ate: string };
    total_clientes: number;
    ltv_medio: number;
    taxa_recompra_percentual: number;
    clientes_com_recompra: number;
    segmentacao_periodo: {
      novos_clientes: number;
      clientes_recorrentes: number;
      total_clientes_periodo: number;
    };
    top_clientes: Array<{
      customer_id: string;
      total_pedidos: number;
      total_gasto: number;
      primeiro_pedido: string;
      ultimo_pedido: string;
    }>;
  } | null;
};

type GetProductPerformanceToolInput = {
  data_de: string;
  data_ate: string;
  top_products_limit?: number;
  categoria?: string;
};

type GetProductPerformanceToolOutput = {
  success: boolean;
  message: string;
  error?: string;
  data: {
    periodo: { data_de: string; data_ate: string };
    resumo: {
      total_produtos: number;
      produtos_com_vendas: number;
      unidades_vendidas_total: number;
      receita_total: number;
      margem_media_percentual: number;
    };
    top_produtos_por_receita: Array<{
      product_id: string;
      name: string;
      sku: string;
      category: string;
      price: number;
      cost: number;
      stock_quantity: number;
      unidades_vendidas: number;
      receita_total: number;
      margem_percentual: number;
      sell_through_rate: number;
      devolucoes: number;
    }>;
    produtos_baixo_sell_through: Array<{
      product_id: string;
      name: string;
      sku: string;
      category: string;
      price: number;
      cost: number;
      stock_quantity: number;
      unidades_vendidas: number;
      receita_total: number;
      margem_percentual: number;
      sell_through_rate: number;
      devolucoes: number;
    }>;
  } | null;
};

type GetCouponEffectivenessToolInput = {
  data_de: string;
  data_ate: string;
};

type GetCouponEffectivenessToolOutput = {
  success: boolean;
  message: string;
  error?: string;
  data: {
    periodo: { data_de: string; data_ate: string };
    resumo: {
      total_pedidos: number;
      pedidos_com_cupom: number;
      pedidos_sem_cupom: number;
      taxa_uso_cupons_percentual: number;
      receita_com_cupom: number;
      receita_sem_cupom: number;
      desconto_total_concedido: number;
      aov_com_cupom: number;
      aov_sem_cupom: number;
      impacto_aov_percentual: number;
      roi_medio_percentual: number;
    };
    top_cupons_por_uso: Array<{
      coupon_id: string;
      coupon_code?: string;
      coupon_type?: string;
      coupon_value?: number;
      vezes_usado: number;
      receita_gerada: number;
      desconto_concedido: number;
      aov: number;
    }>;
    top_cupons_por_receita: Array<{
      coupon_id: string;
      coupon_code?: string;
      coupon_type?: string;
      coupon_value?: number;
      vezes_usado: number;
      receita_gerada: number;
      desconto_concedido: number;
      aov: number;
    }>;
  } | null;
};

type GetChannelAnalysisToolInput = {
  data_de: string;
  data_ate: string;
};

type GetChannelAnalysisToolOutput = {
  success: boolean;
  message: string;
  error?: string;
  data: {
    periodo: { data_de: string; data_ate: string };
    resumo: {
      total_canais: number;
      receita_total: number;
      pedidos_totais: number;
      aov_geral: number;
    };
    canais_performance: Array<{
      channel_id: string;
      channel_name: string;
      channel_type: string;
      numero_pedidos: number;
      receita_total: number;
      aov: number;
      desconto_total: number;
      frete_total: number;
      percentual_receita?: number;
      percentual_pedidos?: number;
    }>;
    melhor_canal: {
      name: string;
      receita: number;
      pedidos: number;
      aov: number;
    } | null;
    pior_canal: {
      name: string;
      receita: number;
      pedidos: number;
      aov: number;
    } | null;
  } | null;
};

type GetLogisticsDataToolInput = {
  table: 'envios' | 'eventos_rastreio' | 'logistica_reversa' | 'pacotes' | 'transportadoras';
  limit?: number;
  status_atual?: string;
  transportadora_id?: string;
  codigo_rastreio?: string;
  order_id?: string;
  ativo?: boolean;
  data_de?: string;
  data_ate?: string;
};

type GetLogisticsDataToolOutput = {
  success: boolean;
  count: number;
  table: string;
  data: Array<{
    id: string;
    order_id?: string;
    transportadora_id?: string;
    codigo_rastreio?: string;
    status_atual?: string;
    data_postagem?: string;
    data_prevista_entrega?: string;
    data_entrega?: string;
    custo_frete?: number;
    peso_kg?: number;
    destinatario?: string;
    endereco_destino?: string;
    data_evento?: string;
    localizacao?: string;
    descricao?: string;
    motivo?: string;
    data_solicitacao?: string;
    codigo_rastreio_reverso?: string;
    altura_cm?: number;
    largura_cm?: number;
    comprimento_cm?: number;
    nome?: string;
    ativo?: boolean;
    prazo_entrega_dias?: number;
    custo_por_kg?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
  }>;
  message: string;
  error?: string;
};

type CalculateDeliveryPerformanceToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  transportadora_id?: string;
  total_envios?: number;
  envios_entregues?: number;
  on_time_delivery?: {
    rate: string;
    entregas_no_prazo: number;
    entregas_atrasadas: number;
    classificacao: string;
  };
  delivery_time?: {
    average_days: string;
    min_days: string;
    max_days: string;
    classificacao: string;
  };
  first_attempt_success?: {
    rate: string;
    classificacao: string;
  };
  lead_time?: {
    average_hours: string;
    classificacao: string;
  };
  sla_compliance?: {
    rate: string;
    status: string;
  };
  performance_geral?: {
    score: string;
    classificacao: string;
  };
};

type AnalyzeCarrierBenchmarkToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  metric?: string;
  total_transportadoras?: number;
  melhor_transportadora?: string;
  pior_transportadora?: string;
  transportadoras?: Array<{
    nome: string;
    total_envios: number;
    on_time_rate: string;
    custo_medio: string;
    cost_per_kg: string;
    performance_score: string;
    classificacao: string;
    recomendacao: string;
  }>;
};

type AnalyzeShippingCostStructureToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  custo_total?: string;
  custo_medio_por_envio?: string;
  cost_per_kg?: string;
  peso_total_kg?: string;
  shipping_cost_percentage?: {
    percentual: string;
    classificacao: string;
  };
  distribuicao_por_faixa_peso?: Array<{
    faixa: string;
    envios: number;
    custo_total: string;
    custo_medio: string;
    percentual_volume: string;
  }>;
  oportunidades_economia?: string[];
};

type AnalyzeReverseLogisticsTrendsToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  return_rate?: {
    taxa: string;
    total_devolucoes: number;
    total_envios: number;
    classificacao: string;
  };
  impacto_financeiro?: {
    custo_total: string;
    custo_medio_por_devolucao: string;
    percentual_receita_frete: string;
  };
  motivos_principais?: Array<{
    motivo: string;
    quantidade: number;
    percentual: string;
  }>;
  analise_pareto?: {
    top_3_motivos_percentual: string;
    insight: string;
  };
  recomendacoes?: string[];
};

type OptimizePackageDimensionsToolOutput = {
  success: boolean;
  message: string;
  transportadora_id?: string;
  total_pacotes?: number;
  package_efficiency?: {
    score_medio: string;
    classificacao: string;
    otimizados: number;
    desperdicando_espaco: number;
  };
  analise_detalhada?: Array<{
    peso_real: string;
    peso_volumetrico: string;
    volume_cm3: number;
    efficiency_score: string;
    status: string;
    sugestao: string;
    cobrado: string;
    diferenca_custo: string;
  }>;
  recomendacoes?: string[];
};

type DetectDeliveryAnomaliesToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  sensitivity?: string;
  estatisticas_base?: {
    media_dias_entrega: string;
    desvio_padrao: string;
    total_envios_analisados: number;
  };
  total_anomalias?: number;
  anomalias_criticas?: number;
  anomalias_altas?: number;
  anomalias?: Array<{
    codigo_rastreio: string;
    dias_entrega: number;
    z_score: number;
    severidade: string;
    tipo_anomalia: string;
    recomendacao: string;
  }>;
  red_flags?: string[];
};

type ForecastDeliveryCostsToolOutput = {
  success: boolean;
  message: string;
  forecast_days?: number;
  lookback_days?: number;
  historico?: {
    media_custo_semanal: string;
    media_volume_semanal: number;
    tendencia: string;
    slope: string;
  };
  previsao?: {
    custo_previsto_total: string;
    volume_previsto_envios: number;
    custo_medio_por_envio: string;
    periodo: string;
  };
  insights?: string[];
};

type AnalyzeContentPerformanceToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  metricas_gerais?: {
    total_posts: number;
    total_curtidas: number;
    total_comentarios: number;
    total_compartilhamentos: number;
    total_visualizacoes: number;
    total_alcance: number;
    engagement_total: number;
    engagement_rate: string;
    alcance_medio_por_post: string;
    classificacao: string;
  };
  performance_por_tipo?: Array<{
    tipo: string;
    total_posts: number;
    engagement_total: number;
    alcance_total: number;
    engagement_medio_por_post: string;
    engagement_rate: string;
  }>;
};

type ComparePlatformPerformanceToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_plataformas?: number;
  melhor_plataforma?: string;
  pior_plataforma?: string;
  plataformas?: Array<{
    plataforma: string;
    contas_ativas: number;
    total_seguidores: number;
    total_publicacoes: number;
    total_alcance: number;
    engagement_total: number;
    engagement_rate: string;
    alcance_medio_por_post: string;
    classificacao: string;
    recomendacao: string;
  }>;
};

type AnalyzeAudienceGrowthToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  crescimento?: {
    seguidores_inicial: number;
    seguidores_final: number;
    crescimento_total: number;
    taxa_crescimento: string;
    crescimento_medio_semanal: number;
    classificacao: string;
  };
  previsao?: {
    seguidores_previstos_4_semanas: number;
    crescimento_esperado: number;
  };
  historico_semanal?: Array<{
    periodo: string;
    seguidores: number;
    data: string;
  }>;
};

type IdentifyTopContentToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_analisados?: number;
  top_posts?: Array<{
    publicacao_id: string;
    titulo: string;
    tipo_post: string;
    plataforma: string;
    publicado_em: string;
    curtidas: number;
    comentarios: number;
    compartilhamentos: number;
    visualizacoes: number;
    alcance: number;
    engagement_total: number;
    engagement_rate: string;
    virality_score: string;
    classificacao: string;
  }>;
};

type AnalyzeContentMixToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_posts?: number;
  frequencia?: {
    posts_por_dia: string;
    posts_por_semana: string;
    dias_com_postagem: number;
    dias_sem_postagem: number;
    consistencia: string;
    classificacao: string;
  };
  distribuicao_por_tipo?: Array<{
    tipo: string;
    quantidade: number;
    percentual: string;
  }>;
  recomendacoes?: string[];
};

type ForecastEngagementToolOutput = {
  success: boolean;
  message: string;
  forecast_days?: number;
  lookback_days?: number;
  historico?: {
    media_engagement_semanal: number;
    media_alcance_semanal: number;
    tendencia: string;
    slope: string;
  };
  previsao?: {
    engagement_previsto_total: number;
    alcance_previsto_total: number;
    engagement_rate_previsto: string;
    periodo: string;
  };
  insights?: string[];
};

type CalculateContentROIToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_posts?: number;
  custos?: {
    custo_por_post: string;
    custo_total: string;
  };
  resultados?: {
    total_alcance: number;
    total_engagement: number;
    valor_alcance: string;
    valor_engagement: string;
    valor_total_gerado: string;
  };
  roi?: {
    percentual: string;
    valor_retorno: string;
    custo_por_alcance: string;
    custo_por_engagement: string;
    classificacao: string;
  };
};

type GetFuncionariosDataToolOutput = {
  success: boolean;
  count: number;
  table: string;
  data: Array<{
    id_funcionario?: number;
    id_departamento?: number;
    id_cargo?: number;
    id_historico?: number;
    id_ponto?: number;
    id_ausencia?: number;
    id_folha?: number;
    id_beneficio?: number;
    id_funcionario_beneficio?: number;
    id_treinamento?: number;
    id_funcionario_treinamento?: number;
    id_avaliacao?: number;
    id_desligamento?: number;
    nome_completo?: string;
    cpf?: string;
    email_corporativo?: string;
    telefone?: string;
    data_nascimento?: string;
    data_admissao?: string;
    genero?: string;
    status?: string;
    nome?: string;
    titulo?: string;
    descricao?: string;
    salario?: number;
    data_inicio?: string;
    data_fim?: string;
    data_hora_marcacao?: string;
    tipo_marcacao?: string;
    tipo?: string;
    motivo?: string;
    status_aprovacao?: string;
    mes_referencia?: number;
    ano_referencia?: number;
    data_pagamento?: string;
    salario_base?: number;
    total_vencimentos?: number;
    total_descontos?: number;
    valor_liquido?: number;
    valor_padrao?: number;
    data_adesao?: string;
    nome_curso?: string;
    carga_horaria?: number;
    data_conclusao?: string;
    nota_aproveitamento?: number;
    id_avaliador?: number;
    data_avaliacao?: string;
    nota?: number;
    comentarios?: string;
    data_desligamento?: string;
    tipo_desligamento?: string;
    [key: string]: unknown;
  }>;
  message: string;
  error?: string;
};

type GetComprasDataToolInput = {
  table: 'fornecedores' | 'pedidos_compra' | 'pedido_compra_itens';
  limit?: number;
  fornecedor_id?: string;
  solicitante_id?: string;
  status_pedido?: string;
  numero_pedido?: string;
  pedido_compra_id?: string;
  avaliacao_minima?: number;
  valor_minimo?: number;
  valor_maximo?: number;
  data_de?: string;
  data_ate?: string;
};

type GetComprasDataToolOutput = {
  success: boolean;
  count: number;
  table: string;
  data: Array<{
    id: string;
    entidade_id?: string;
    codigo_fornecedor?: string;
    prazo_entrega_medio_dias?: number;
    avaliacao_fornecedor?: number;
    fornecedor_id?: string;
    solicitante_id?: string;
    numero_pedido?: string;
    data_emissao?: string;
    data_previsao_entrega?: string;
    valor_total?: number;
    status_pedido?: string;
    condicao_pagamento?: string;
    observacoes?: string;
    pedido_compra_id?: string;
    descricao?: string;
    codigo_produto_fornecedor?: string;
    quantidade_solicitada?: number;
    valor_unitario?: number;
    valor_total_item?: number;
    criado_em?: string;
    updated_at?: string;
    [key: string]: unknown;
  }>;
  message: string;
  error?: string;
};

type GetProjetosDataToolInput = {
  table: 'projects' | 'status_types' | 'tasks';
  limit?: number;
  project_id?: string;
  owner_id?: string;
  team_id?: string;
  assignee_id?: string;
  status_id?: number;
  overdue?: boolean;
  data_de?: string;
  data_ate?: string;
};

type GetProjetosDataToolOutput = {
  success: boolean;
  count: number;
  table: string;
  data: Array<{
    id: string | number;
    name?: string;
    description?: string;
    owner_id?: string;
    team_id?: string;
    start_date?: string;
    end_date?: string;
    title?: string;
    status_id?: number;
    project_id?: string;
    assignee_id?: string;
    due_date?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
  }>;
  message: string;
  error?: string;
};

type GetAnalyticsDataToolInput = {
  table: 'agregado_diario_por_fonte' | 'agregado_diario_por_pagina' | 'consentimentos_visitante' | 'eventos' | 'itens_transacao' | 'metas' | 'propriedades_analytics' | 'propriedades_visitante' | 'sessoes' | 'transacoes_analytics' | 'visitantes';
  limit?: number;
  visitor_id?: string;
  session_id?: string;
  fonte?: string;
  pagina?: string;
  eh_bot?: boolean;
  event_name?: string;
  data_de?: string;
  data_ate?: string;
};

type GetAnalyticsDataToolOutput = {
  success: boolean;
  count: number;
  table: string;
  data: Array<{
    id: string;
    data?: string;
    fonte?: string;
    pageviews?: number;
    sessoes?: number;
    usuarios?: number;
    pagina?: string;
    visitor_id?: string;
    consent_status?: string;
    consent_timestamp?: string;
    analytics_allowed?: boolean;
    marketing_allowed?: boolean;
    session_id?: string;
    event_name?: string;
    event_timestamp?: string;
    page_url?: string;
    event_properties?: unknown;
    transaction_id?: string;
    product_name?: string;
    quantity?: number;
    price?: number;
    goal_name?: string;
    goal_condition?: string;
    conversion_value?: number;
    property_name?: string;
    property_value?: string;
    browser?: string;
    os?: string;
    device_type?: string;
    session_start?: string;
    session_end?: string;
    duration_seconds?: number;
    pages_viewed?: number;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    eh_bot?: boolean;
    transaction_timestamp?: string;
    revenue?: number;
    tax?: number;
    shipping?: number;
    first_seen?: string;
    last_seen?: string;
    total_sessions?: number;
    total_pageviews?: number;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
  }>;
  message: string;
  error?: string;
};

type GetContasAPagarToolInput = {
  limit?: number;
  status?: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  fornecedor_nome?: string;
  categoria?: string;
};

type GetContasAPagarToolOutput = {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    numero_conta: string;
    fornecedor_nome: string;
    fornecedor_cnpj?: string;
    valor_total: number;
    valor_pago?: number;
    valor_pendente?: number;
    data_emissao?: string;
    data_vencimento?: string;
    status?: string;
    categoria?: string;
    centro_custo?: string;
    descricao?: string;
    forma_pagamento?: string;
    banco_conta?: string;
    numero_documento?: string;
    observacoes?: string;
    historico_pagamentos?: Array<{
      data: string;
      valor: number;
      forma_pagamento: string;
      observacoes?: string;
    }>;
    motivo_cancelamento?: string;
    data_cancelamento?: string;
    created_at?: string;
    updated_at?: string;
  }>;
  message: string;
  error?: string;
};

type CalculateDateRangeToolInput = {
  periodo: 'ultimos_dias' | 'proximos_dias' | 'mes_atual' | 'mes_passado' | 'ano_atual' | 'ano_passado';
  quantidade_dias?: number;
};

type CalculateDateRangeToolOutput = {
  success: boolean;
  data_inicial: string;
  data_final: string;
  periodo_descricao: string;
  dias_calculados?: number;
  message: string;
  error?: string;
};

type CalcularFluxoCaixaToolInput = {
  dias: number;
  saldo_inicial?: number;
};

type CalcularFluxoCaixaToolOutput = {
  success: boolean;
  periodo_dias: number;
  saldo_inicial: number;
  entradas_previstas: number;
  saidas_previstas: number;
  saldo_projetado: number;
  status_fluxo: string;
  entradas_vencidas: number;
  saidas_vencidas: number;
  total_contas_receber: number;
  total_contas_pagar: number;
  error?: string;
  message?: string;
  detalhes_entradas?: Array<{
    numero_fatura: string;
    cliente: string;
    valor_pendente: number;
    vencimento: string;
  }>;
  detalhes_saidas?: Array<{
    numero_conta: string;
    fornecedor: string;
    valor_pendente: number;
    vencimento: string;
  }>;
};

type CalcularBurnRateToolInput = {
  dias_analise?: number;
};

type CalcularBurnRateToolOutput = {
  success: boolean;
  periodo_dias: number;
  total_gasto: number;
  burn_rate_diario: number;
  burn_rate_mensal: number;
  burn_rate_anual: number;
  gasto_por_categoria: Record<string, number>;
  total_contas_pagas: number;
  error?: string;
  message?: string;
};

// Inventory Tools Output Types
type CalculateInventoryMetricsToolOutput = {
  success: boolean;
  message: string;
  product_id?: string;
  periodo_dias?: number;
  data_inicial?: string;
  metricas?: {
    turnover?: {
      ratio: string;
      classificacao: string;
      saidas_periodo: number;
      estoque_medio: number;
    };
    coverage?: {
      dias: string;
      classificacao: string;
      estoque_atual: number;
      demanda_diaria: string;
    };
    stockout_rate?: {
      percentual: string;
      classificacao: string;
      itens_esgotados: number;
      total_itens: number;
    };
    valor_imobilizado?: {
      total: string;
      moeda: string;
      itens_computados: number;
      observacao: string;
    };
  };
  error?: string;
};

type AnalyzeStockMovementTrendsToolOutput = {
  success: boolean;
  message: string;
  product_id?: string;
  periodo_analise?: string;
  dias_analisados?: number;
  tendencia?: string;
  slope_tendencia?: string;
  media_saidas_por_periodo?: string;
  total_periodos?: number;
  movimentacoes_por_periodo?: Record<string, { entradas: number; saidas: number; ajustes: number }>;
  previsao_proximo_periodo?: string;
  insights?: string;
  error?: string;
};

type ForecastRestockNeedsToolOutput = {
  success: boolean;
  message: string;
  forecast_days?: number;
  confidence_level?: string;
  produtos_com_necessidade_reposicao?: number;
  criticos?: number;
  previsoes?: Array<{
    product_id: string;
    channel_id: string;
    estoque_atual: number;
    consumo_diario_medio: string;
    dias_ate_ruptura: string;
    necessita_reposicao: boolean;
    quantidade_sugerida: number;
    urgencia: 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'BAIXO';
    data_ruptura_estimada: string;
  }>;
  error?: string;
};

type IdentifySlowMovingItemsToolOutput = {
  success: boolean;
  message: string;
  criterio_dias?: number;
  valor_minimo_filtro?: number;
  total_slow_moving_items?: number;
  valor_total_imobilizado?: string;
  slow_moving_items?: Array<{
    product_id: string;
    channel_id: string;
    quantidade_estoque: number;
    valor_unitario: string;
    valor_total_imobilizado: string;
    dias_sem_movimentacao: string;
    recomendacao: string;
  }>;
  error?: string;
};

type CompareChannelPerformanceToolOutput = {
  success: boolean;
  message: string;
  metric?: string;
  product_id?: string;
  melhor_canal?: string;
  pior_canal?: string;
  canais?: Array<{
    channel_id: string;
    total_estoque: number;
    valor_estoque: string;
    produtos: number;
    saidas_30d: number;
    turnover_anual: string;
    preco_medio: string;
  }>;
  error?: string;
};

type GenerateABCAnalysisToolOutput = {
  success: boolean;
  message: string;
  criteria?: string;
  period_days?: number;
  total_produtos?: number;
  distribuicao?: {
    classe_a: {
      produtos: number;
      percentual_produtos: string;
      contribuicao_valor: string;
      recomendacao: string;
    };
    classe_b: {
      produtos: number;
      percentual_produtos: string;
      contribuicao_valor: string;
      recomendacao: string;
    };
    classe_c: {
      produtos: number;
      percentual_produtos: string;
      contribuicao_valor: string;
      recomendacao: string;
    };
  };
  produtos_classificados?: Array<{
    product_id: string;
    valor: number;
    quantidade: number;
    margem: number;
    percentual_acumulado: string;
    classe_abc: 'A' | 'B' | 'C';
  }>;
  error?: string;
};

type DetectAnomaliesToolOutput = {
  success: boolean;
  message: string;
  sensitivity?: string;
  total_anomalias?: number;
  anomalias_alta_severidade?: number;
  anomalias?: Array<{
    product_id: string;
    tipo_anomalia: string;
    quantidade_anomala?: number;
    media_esperada?: string;
    desvio_padrao?: string;
    z_score?: string;
    severidade: string;
    recomendacao: string;
    max_estoque?: number;
    min_estoque?: number;
    diferenca?: number;
  }>;
  error?: string;
};

type CalcularRunwayToolInput = {
  saldo_atual: number;
  considerar_receitas?: boolean;
};

type CalcularRunwayToolOutput = {
  success: boolean;
  saldo_atual: number;
  burn_rate_mensal: number;
  receitas_mensais: number;
  queima_liquida_mensal: number;
  runway_meses: number | string;
  runway_dias: number | string;
  data_esgotamento: string | null;
  status_saude: string;
  error?: string;
  message?: string;
};

type ExecutarSQLComDadosToolOutput = {
  sqlQuery: string;
  explicacao?: string;
  queryType: string;
  data: Array<Record<string, unknown>>;
  rowsReturned: number;
  executionTime: number;
  success: boolean;
  message?: string;
  error?: string;
};

type GerarInsightsToolInput = {
  insights: Array<{
    titulo: string;
    descricao: string;
    dados?: string;
    importancia: 'alta' | 'media' | 'baixa';
  }>;
  resumo?: string;
  contexto?: string;
};

type GerarInsightsToolOutput = {
  success: boolean;
  insights: Array<{
    titulo: string;
    descricao: string;
    dados?: string;
    importancia: 'alta' | 'media' | 'baixa';
  }>;
  resumo?: string;
  contexto?: string;
  totalInsights: number;
  error?: string;
};

type GerarAlertasToolInput = {
  alertas: Array<{
    titulo: string;
    descricao: string;
    dados?: string;
    nivel: 'critico' | 'alto' | 'medio' | 'baixo';
    acao?: string;
  }>;
  resumo?: string;
  contexto?: string;
};

type GerarAlertasToolOutput = {
  success: boolean;
  alertas: Array<{
    titulo: string;
    descricao: string;
    dados?: string;
    nivel: 'critico' | 'alto' | 'medio' | 'baixo';
    acao?: string;
  }>;
  resumo?: string;
  contexto?: string;
  totalAlertas: number;
  error?: string;
};

type GerarRecomendacoesToolInput = {
  recomendacoes: Array<{
    titulo: string;
    descricao: string;
    impacto: 'alto' | 'medio' | 'baixo';
    facilidade: 'facil' | 'medio' | 'dificil';
    categoria?: string;
    proximosPassos?: string[];
    estimativaResultado?: string;
  }>;
  resumo?: string;
  contexto?: string;
};

type GerarRecomendacoesToolOutput = {
  success: boolean;
  recomendacoes: Array<{
    titulo: string;
    descricao: string;
    impacto: 'alto' | 'medio' | 'baixo';
    facilidade: 'facil' | 'medio' | 'dificil';
    categoria?: string;
    proximosPassos?: string[];
    estimativaResultado?: string;
  }>;
  resumo?: string;
  contexto?: string;
  totalRecomendacoes: number;
  error?: string;
};

type GerarReportToolInput = {
  titulo: string;
  insights: Array<{
    titulo: string;
    descricao: string;
    dados?: string;
    importancia: 'alta' | 'media' | 'baixa';
  }>;
  alertas: Array<{
    titulo: string;
    descricao: string;
    dados?: string;
    nivel: 'critico' | 'alto' | 'medio' | 'baixo';
    acao?: string;
  }>;
  recomendacoes: Array<{
    titulo: string;
    descricao: string;
    impacto: 'alto' | 'medio' | 'baixo';
    facilidade: 'facil' | 'medio' | 'dificil';
    categoria?: string;
    proximosPassos?: string[];
    estimativaResultado?: string;
  }>;
  contexto?: string;
  dataAnalise?: string;
};

type GerarReportToolOutput = {
  success: boolean;
  titulo: string;
  markdown: string;
  totalInsights: number;
  totalAlertas: number;
  totalRecomendacoes: number;
  metadata?: {
    generatedAt: string;
    dataSource: string;
  };
  error?: string;
};

type CriarTabelaToolInput = {
  datasetId: string;
  tableName: string;
  schema: Array<{
    name: string;
    type: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP';
    mode?: 'REQUIRED' | 'NULLABLE' | 'REPEATED';
  }>;
  description?: string;
};

type CriarTabelaToolOutput = {
  datasetId: string;
  tableName: string;
  tableId: string;
  schema: Array<{
    name: string;
    type: string;
    mode: string;
  }>;
  description: string;
  location: string;
  creationTime: string;
  lastModifiedTime: string;
  numRows: number;
  numBytes: number;
  expirationTime: string | null;
  labels: Record<string, string>;
  metadata: {
    tableType: string;
    createdBy: string;
    version: string;
  };
  success: boolean;
  error?: string;
};

type CriarKPIToolInput = {
  name: string;
  datasetId: string;
  tableId: string;
  metric: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'ratio';
  calculation: string;
  target?: number;
  unit?: string;
};

type CriarKPIToolOutput = {
  kpiId: string;
  name: string;
  datasetId: string;
  tableId: string;
  metric: string;
  calculation: string;
  currentValue: number;
  previousValue: number;
  target: number;
  unit: string;
  change: number;
  trend: string;
  status: string;
  timeRange: string;
  visualization: {
    chartType: string;
    color: string;
    showTrend: boolean;
    showTarget: boolean;
  };
  metadata: {
    createdAt: string;
    lastUpdated: string;
    refreshRate: string;
    dataSource: string;
  };
  success: boolean;
  error?: string;
};

type WebPreviewToolInput = {
  url: string;
};

type WebPreviewToolOutput = {
  url: string;
  title: string;
  description: string;
  favicon?: string;
  screenshot?: string;
  isValidUrl: boolean;
  previewAvailable: boolean;
  generatedAt: string;
  success: boolean;
  error?: string;
};

type PlanAnalysisToolInput = {
  analises: Array<{
    titulo: string;
    descricao: string;
  }>;
};

type PlanAnalysisToolOutput = {
  success: boolean;
  totalAnalises: number;
  plano: Array<{
    numero: number;
    titulo: string;
    descricao: string;
    status: string;
    tipo: string;
  }>;
  message: string;
  metadata: {
    generatedAt: string;
    planType: string;
  };
  error?: string;
};

type TimelineContextToolInput = {
  tableName: string;
  schema: Array<{
    column_name: string;
    data_type: string;
  }>;
  datasetId?: string;
  projectId?: string;
};

type TimelineContextToolOutput = {
  success?: boolean;
  error?: string;
  tableName?: string;
  datasetId?: string;
  projectId?: string;
  primaryDateColumn?: string;
  executionTime?: number;
  detectedDateColumns?: Array<{
    column_name: string;
    data_type: string;
  }>;
  timelineOverview?: {
    oldestRecord: string;
    newestRecord: string;
    totalDays: number;
    totalRecords: number;
    uniqueDays: number;
    dataQuality: number;
    coverageDays: string;
  };
  suggestedPeriods?: {
    last7Days: {
      label: string;
      start: string;
      end: string;
      recordCount: number;
      sqlCondition: string;
      recommended: boolean;
    };
    last30Days: {
      label: string;
      start: string;
      end: string;
      recordCount: number;
      sqlCondition: string;
      recommended: boolean;
    };
    last90Days: {
      label: string;
      start: string;
      end: string;
      recordCount: number;
      sqlCondition: string;
      recommended: boolean;
    };
  };
  recommendations?: {
    bestPeriod: string;
    dataFreshness: string;
    analysisReadiness: string;
    suggestedAnalysis: string;
  };
  sqlExamples?: {
    recentData: string;
    dailyAggregation: string;
    fullTimelineOverview: string;
  };
};

type GerarGraficoToolInput = {
  tipo: 'bar' | 'line' | 'pie';
  x: string;
  y: string;
  tabela: string;
};

type GerarGraficoToolOutput = {
  success: boolean;
  chartData?: Array<{
    x: string;
    y: number;
    label: string;
    value: number;
  }>;
  chartType: 'bar' | 'line' | 'pie';
  title: string;
  description?: string;
  explicacao?: string;
  xColumn: string;
  yColumn: string;
  sqlQuery?: string;
  totalRecords?: number;
  metadata?: {
    generatedAt: string;
    dataSource: string;
  };
  error?: string;
  fallbackMode?: boolean;
};

type GerarMultiplosGraficosToolInput = {
  tabela: string;
  graficos: Array<{
    tipo: 'bar' | 'line' | 'pie';
    x: string;
    y: string;
    agregacao?: 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN';
    titulo: string;
    descricao?: string;
  }>;
};

type GerarMultiplosGraficosToolOutput = {
  success: boolean;
  dashboardTitle: string;
  charts: Array<{
    success: boolean;
    chartData?: Array<{
      x: string;
      y: number;
      label: string;
      value: number;
    }>;
    chartType: 'bar' | 'line' | 'pie';
    title: string;
    description?: string;
    explicacao?: string;
    xColumn?: string;
    yColumn?: string;
    aggregation?: string;
    sqlQuery?: string;
    totalRecords?: number;
    metadata?: {
      generatedAt: string;
      dataSource: string;
    };
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    table: string;
  };
  metadata: {
    generatedAt: string;
    dataSource: string;
  };
  error?: string;
};

type ExecutarMultiplasSQLToolInput = {
  queries: Array<{
    nome: string;
    sqlQuery: string;
    descricao?: string;
  }>;
  datasetId?: string;
};

type ExecutarMultiplasSQLToolOutput = {
  success: boolean;
  results: Array<{
    nome: string;
    success: boolean;
    data?: Array<Record<string, unknown>>;
    schema?: Array<{
      name: string;
      type: string;
      mode: string;
    }>;
    rowsReturned?: number;
    executionTime?: number;
    sqlQuery: string;
    descricao?: string;
    explicacao?: string;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalRows: number;
    totalExecutionTime: number;
  };
  metadata: {
    generatedAt: string;
    dataSource: string;
    datasetId: string;
  };
  error?: string;
};

type CodeExecutionToolInput = {
  code: string;
};

type CodeExecutionToolOutput = {
  stdout?: string;
  stderr?: string;
  files?: Array<{
    name: string;
    url?: string;
    type: string;
    size?: number;
  }>;
  images?: Array<{
    data: string;
    format: string;
    name?: string;
  }>;
  executedCode?: string;
  success: boolean;
  executionTime?: number;
};

type GetDashboardCodeToolOutput = {
  success: boolean;
  action?: string;
  message?: string;
};

type CreateDashboardToolOutput = {
  success: boolean;
  description: string;
  totalWidgets: number;
  dashboardConfig?: {
    config: {
      maxRows: number;
      rowHeight: number;
      cols: number;
    };
    widgets: Array<{
      id: string;
      type: string;
      position: { x: number; y: number; w: number; h: number };
      title: string;
      dataSource: {
        table: string;
        x?: string;
        y?: string;
        aggregation?: string;
      };
    }>;
  };
  generatedJson?: string;
  message: string;
  error?: string;
};

type UpdateDashboardToolOutput = {
  success: boolean;
  updateJson: string;
  description: string;
  message: string;
};

type NexusToolUIPart = ToolUIPart<{
  displayWeather: {
    input: WeatherToolInput;
    output: WeatherToolOutput;
  };
  getDatasets: {
    input: DatasetToolInput;
    output: DatasetToolOutput;
  };
  getTables: {
    input: TablesToolInput;
    output: TablesToolOutput;
  };
  getTableSchema: {
    input: TableSchemaToolInput;
    output: TableSchemaToolOutput;
  };
  getCampaigns: {
    input: GetCampaignsToolInput;
    output: GetCampaignsToolOutput;
  };
  getData: {
    input: DataToolInput;
    output: DataToolOutput;
  };
  criarGrafico: {
    input: CriarGraficoToolInput;
    output: CriarGraficoToolOutput;
  };
  retrieveResult: {
    input: RetrieveResultToolInput;
    output: RetrieveResultToolOutput;
  };
  criarDashboard: {
    input: CriarDashboardToolInput;
    output: CriarDashboardToolOutput;
  };
  executarSQL: {
    input: ExecutarSQLToolInput;
    output: ExecutarSQLToolOutput;
  };
  criarTabela: {
    input: CriarTabelaToolInput;
    output: CriarTabelaToolOutput;
  };
  criarKPI: {
    input: CriarKPIToolInput;
    output: CriarKPIToolOutput;
  };
  webPreview: {
    input: WebPreviewToolInput;
    output: WebPreviewToolOutput;
  };
  planAnalysis: {
    input: PlanAnalysisToolInput;
    output: PlanAnalysisToolOutput;
  };
  getTimelineContext: {
    input: TimelineContextToolInput;
    output: TimelineContextToolOutput;
  };
  gerarGrafico: {
    input: GerarGraficoToolInput;
    output: GerarGraficoToolOutput;
  };
  gerarMultiplosGraficos: {
    input: GerarMultiplosGraficosToolInput;
    output: GerarMultiplosGraficosToolOutput;
  };
  gerarInsights: {
    input: GerarInsightsToolInput;
    output: GerarInsightsToolOutput;
  };
  gerarAlertas: {
    input: GerarAlertasToolInput;
    output: GerarAlertasToolOutput;
  };
  gerarRecomendacoes: {
    input: GerarRecomendacoesToolInput;
    output: GerarRecomendacoesToolOutput;
  };
  gerarReport: {
    input: GerarReportToolInput;
    output: GerarReportToolOutput;
  };
  executarMultiplasSQL: {
    input: ExecutarMultiplasSQLToolInput;
    output: ExecutarMultiplasSQLToolOutput;
  };
  code_execution: {
    input: CodeExecutionToolInput;
    output: CodeExecutionToolOutput;
  };
  getDashboardCode: {
    input: Record<string, never>;
    output: GetDashboardCodeToolOutput;
  };
  createDashboardTool: {
    input: {
      dashboardDescription: string;
      gridConfig: {
        maxRows: number;
        rowHeight: number;
        cols: number;
      };
      widgets: Array<{
        id: string;
        type: 'bar' | 'line' | 'pie' | 'area' | 'kpi' | 'table';
        position: { x: number; y: number; w: number; h: number };
        title: string;
        dataSource: {
          table: string;
          x?: string;
          y?: string;
          aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
        };
      }>;
    };
    output: CreateDashboardToolOutput;
  };
  updateDashboardTool: {
    input: {
      updateDescription: string;
    };
    output: UpdateDashboardToolOutput;
  };
  getYouTubeContent: {
    input: GetYouTubeContentToolInput;
    output: GetYouTubeContentToolOutput;
  };
  getReelsContent: {
    input: GetReelsContentToolInput;
    output: GetReelsContentToolOutput;
  };
  createYouTubeContent: {
    input: CreateYouTubeContentToolInput;
    output: CreateYouTubeContentToolOutput;
  };
  createReelsContent: {
    input: CreateReelsContentToolInput;
    output: CreateReelsContentToolOutput;
  };
  getSalesCalls: {
    input: GetSalesCallsToolInput;
    output: GetSalesCallsToolOutput;
  };
  getRHCandidates: {
    input: GetRHCandidatesToolInput;
    output: GetRHCandidatesToolOutput;
  };
  getServiceOrders: {
    input: GetServiceOrdersToolInput;
    output: GetServiceOrdersToolOutput;
  };
  getContasAReceber: {
    input: GetContasAReceberToolInput;
    output: GetContasAReceberToolOutput;
  };
  getReceipts: {
    input: GetReceiptsToolInput;
    output: GetReceiptsToolOutput;
  };
  getNotasFiscais: {
    input: GetNotasFiscaisToolInput;
    output: GetNotasFiscaisToolOutput;
  };
  getInventory: {
    input: GetInventoryToolInput;
    output: GetInventoryToolOutput;
  };
  getContasAPagar: {
    input: GetContasAPagarToolInput;
    output: GetContasAPagarToolOutput;
  };
  getFinancialData: {
    input: GetFinancialDataToolInput;
    output: GetFinancialDataToolOutput;
  };
  calcularFluxoCaixa: {
    input: CalcularFluxoCaixaToolInput;
    output: CalcularFluxoCaixaToolOutput;
  };
  calcularBurnRate: {
    input: CalcularBurnRateToolInput;
    output: CalcularBurnRateToolOutput;
  };
  calcularRunway: {
    input: CalcularRunwayToolInput;
    output: CalcularRunwayToolOutput;
  };
  getRevenueMetrics: {
    input: GetRevenueMetricsToolInput;
    output: GetRevenueMetricsToolOutput;
  };
  getCustomerMetrics: {
    input: GetCustomerMetricsToolInput;
    output: GetCustomerMetricsToolOutput;
  };
  getProductPerformance: {
    input: GetProductPerformanceToolInput;
    output: GetProductPerformanceToolOutput;
  };
  getCouponEffectiveness: {
    input: GetCouponEffectivenessToolInput;
    output: GetCouponEffectivenessToolOutput;
  };
  getChannelAnalysis: {
    input: GetChannelAnalysisToolInput;
    output: GetChannelAnalysisToolOutput;
  };
}>;

// Função para mapear agente
const getAgentInfo = (agent: string) => {
  switch (agent) {
    case 'metaAnalyst':
      return { initial: 'M', title: 'Analista de Meta Ads', color: 'bg-purple-500', icon: <MetaIcon className="w-full h-full" /> };
    case 'amazonAdsAnalyst':
      return { initial: 'A', title: 'Analista de Amazon Ads', color: 'bg-orange-500', icon: <AmazonIcon className="w-full h-full" /> };
    case 'googleAnalyticsAnalyst':
      return { initial: 'G', title: 'Analista de Google Analytics', color: 'bg-blue-400', icon: <GoogleAnalyticsIcon className="w-full h-full" /> };
    case 'shopifyAnalyst':
      return { initial: 'S', title: 'Analista de Shopify', color: 'bg-green-400', icon: <ShopifyIcon className="w-full h-full" /> };
    case 'contaAzulAnalyst':
      return { initial: 'C', title: 'Especialista em ContaAzul', color: 'bg-indigo-500' };
    case 'shopeeAnalyst':
      return { initial: 'H', title: 'Analista de Shopee', color: 'bg-red-500' };
    case 'keywordAnalyst':
      return { initial: 'K', title: 'Analista de Palavras-chave', color: 'bg-yellow-500', icon: <GoogleAdsIcon className="w-full h-full" /> };
    case 'googleCampaignAnalyst':
      return { initial: 'Y', title: 'Analista de Campanhas Google Ads', color: 'bg-blue-700', icon: <GoogleAdsIcon className="w-full h-full" /> };
    case 'metaCampaignAnalyst':
      return { initial: 'B', title: 'Analista de Campanhas Meta Ads', color: 'bg-blue-800', icon: <MetaIcon className="w-full h-full" /> };
    case 'analistaDados':
      return { initial: 'A', title: 'Analista de Dados', color: 'bg-indigo-500' };
    case 'salesAgent':
      return { initial: 'V', title: 'SalesAgent', color: 'bg-indigo-600' };
    case 'contasAReceberAgent':
      return { initial: 'C', title: 'Contas a Pagar e Receber', color: 'bg-teal-600' };
    case 'receiptsAgent':
      return { initial: 'R', title: 'Receipts Agent', color: 'bg-orange-600' };
    case 'nfeAgent':
      return { initial: 'N', title: 'Invoice Agent', color: 'bg-emerald-600' };
    case 'inventoryAgent':
      return { initial: 'I', title: 'Inventory Agent', color: 'bg-blue-600' };
    default:
      return { initial: 'A', title: 'AI Assistant', color: 'bg-gray-500' };
  }
};

interface RespostaDaIAProps {
  message: UIMessage;
  selectedAgent: string;
}

export default function RespostaDaIA({ message, selectedAgent }: RespostaDaIAProps) {
  // Usar o agente da própria mensagem, se não tiver usa o selectedAgent atual
  const messageAgent = (message as UIMessage & { agent?: string }).agent || selectedAgent;
  
  const agentInfo = getAgentInfo(messageAgent);
  
  // Função para analisar dados com IA
  const handleAnalyzeWithAI = (data: Array<Record<string, unknown>>, query: string) => {
    console.log('📊 RespostaDaIA: Analyze button clicked with data:', data.length, 'rows');
    console.log('📊 RespostaDaIA: Query:', query);
    
    if (data && data.length > 0) {
      console.log('📊 RespostaDaIA: Sending data via postMessage...');
      
      // Send data to parent window via postMessage
      window.postMessage({
        type: 'ANALYZE_DATA',
        data: data,
        query: query,
        timestamp: new Date().toISOString()
      }, '*');
      
      console.log('📊 RespostaDaIA: PostMessage sent successfully');
    } else {
      console.warn('⚠️ RespostaDaIA: No data to analyze');
    }
  };

  const handleCopy = async () => {
    const textParts = message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join(' ');
    
    try {
      await navigator.clipboard.writeText(textParts);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div key={message.id} className="max-w-full overflow-hidden">
      {/* Header com Avatar + Título */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-md ${agentInfo.color} text-white font-semibold flex items-center justify-center`}>
          {agentInfo.icon || agentInfo.initial}
        </div>
        <h3 className="font-bold text-gray-900">{agentInfo.title}</h3>
      </div>
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          return <Response key={index}>{part.text}</Response>;
        }

        if (part.type === 'reasoning') {
          const reasoningText = (part as ReasoningPart).content || (part as ReasoningPart).text || '';
          return (
            <Reasoning key={index} isStreaming={part.state === 'streaming'}>
              <ReasoningTrigger />
              <ReasoningContent>{reasoningText}</ReasoningContent>
            </Reasoning>
          );
        }

        if (part.type === 'tool-displayWeather') {
          const weatherTool = part as NexusToolUIPart;
          const callId = weatherTool.toolCallId;
          const shouldBeOpen = weatherTool.state === 'output-available' || weatherTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-displayWeather" state={weatherTool.state} />
                <ToolContent>
                  {weatherTool.input && (
                    <ToolInput input={weatherTool.input} />
                  )}
                  {weatherTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={weatherTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {weatherTool.state === 'output-available' && (
                <WeatherCard data={weatherTool.output as WeatherToolOutput} />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getDatasets') {
          const datasetTool = part as NexusToolUIPart;
          const callId = datasetTool.toolCallId;
          const shouldBeOpen = datasetTool.state === 'output-available' || datasetTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getDatasets" state={datasetTool.state} />
                <ToolContent>
                  {datasetTool.input && (
                    <ToolInput input={datasetTool.input} />
                  )}
                  {datasetTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={datasetTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {datasetTool.state === 'output-available' && (
                <DatasetsList 
                  datasets={(datasetTool.output as DatasetToolOutput).datasets}
                  success={(datasetTool.output as DatasetToolOutput).success}
                  error={(datasetTool.output as DatasetToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getTables') {
          const tablesTool = part as NexusToolUIPart;
          const callId = tablesTool.toolCallId;
          const shouldBeOpen = tablesTool.state === 'output-available' || tablesTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getTables" state={tablesTool.state} />
                <ToolContent>
                  {tablesTool.input && (
                    <ToolInput input={tablesTool.input} />
                  )}
                  {tablesTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={tablesTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {tablesTool.state === 'output-available' && (
                <TablesList 
                  tables={(tablesTool.output as TablesToolOutput).tables}
                  datasetId={(tablesTool.output as TablesToolOutput).datasetId}
                  success={(tablesTool.output as TablesToolOutput).success}
                  error={(tablesTool.output as TablesToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getTableSchema') {
          const schemaTool = part as NexusToolUIPart;
          const callId = schemaTool.toolCallId;
          const shouldBeOpen = schemaTool.state === 'output-available' || schemaTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getTableSchema" state={schemaTool.state} />
                <ToolContent>
                  {schemaTool.input && (
                    <ToolInput input={schemaTool.input} />
                  )}
                  {schemaTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={schemaTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {schemaTool.state === 'output-available' && (
                <TableSchema 
                  columns={(schemaTool.output as TableSchemaToolOutput).columns}
                  tableName={(schemaTool.output as TableSchemaToolOutput).tableName}
                  datasetId={(schemaTool.output as TableSchemaToolOutput).datasetId}
                  projectId={(schemaTool.output as TableSchemaToolOutput).projectId}
                  totalColumns={(schemaTool.output as TableSchemaToolOutput).totalColumns}
                  success={(schemaTool.output as TableSchemaToolOutput).success}
                  error={(schemaTool.output as TableSchemaToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getCampaigns') {
          const campaignsTool = part as NexusToolUIPart;
          const callId = campaignsTool.toolCallId;
          const shouldBeOpen = campaignsTool.state === 'output-available' || campaignsTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getCampaigns" state={campaignsTool.state} />
                <ToolContent>
                  {campaignsTool.input && (
                    <ToolInput input={campaignsTool.input} />
                  )}
                  {campaignsTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={campaignsTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {campaignsTool.state === 'output-available' && (
                <CampaignsList 
                  campaigns={(campaignsTool.output as GetCampaignsToolOutput).campaigns}
                  tableName={(campaignsTool.output as GetCampaignsToolOutput).tableName}
                  datasetId={(campaignsTool.output as GetCampaignsToolOutput).datasetId}
                  projectId={(campaignsTool.output as GetCampaignsToolOutput).projectId}
                  totalCampaigns={(campaignsTool.output as GetCampaignsToolOutput).totalCampaigns}
                  dateRange={(campaignsTool.output as GetCampaignsToolOutput).dateRange}
                  success={(campaignsTool.output as GetCampaignsToolOutput).success}
                  error={(campaignsTool.output as GetCampaignsToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getData') {
          const dataTool = part as NexusToolUIPart;
          const callId = dataTool.toolCallId;
          const shouldBeOpen = dataTool.state === 'output-available' || dataTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getData" state={dataTool.state} />
                <ToolContent>
                  {dataTool.input && (
                    <ToolInput input={dataTool.input} />
                  )}
                  {dataTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={dataTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {dataTool.state === 'output-available' && (
                <TableData 
                  data={(dataTool.output as DataToolOutput).data}
                  schema={(dataTool.output as DataToolOutput).schema}
                  totalRows={(dataTool.output as DataToolOutput).totalRows}
                  executionTime={(dataTool.output as DataToolOutput).executionTime}
                  datasetId={(dataTool.output as DataToolOutput).datasetId}
                  tableId={(dataTool.output as DataToolOutput).tableId}
                  query={(dataTool.output as DataToolOutput).query}
                  success={(dataTool.output as DataToolOutput).success}
                  error={(dataTool.output as DataToolOutput).error}
                />
              )}
            </div>
          );
        }


        if (part.type === 'tool-criarGrafico') {
          const chartTool = part as NexusToolUIPart;
          const callId = chartTool.toolCallId;
          const shouldBeOpen = chartTool.state === 'output-available' || chartTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-criarGrafico" state={chartTool.state} />
                <ToolContent>
                  {chartTool.input && (
                    <ToolInput input={chartTool.input} />
                  )}
                  {chartTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={chartTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {chartTool.state === 'output-available' && (
                <ChartVisualization 
                  chartData={(chartTool.output as CriarGraficoToolOutput).chartData}
                  chartType={(chartTool.output as CriarGraficoToolOutput).chartType}
                  title={(chartTool.output as CriarGraficoToolOutput).title}
                  xColumn={(chartTool.output as CriarGraficoToolOutput).xColumn}
                  yColumn={(chartTool.output as CriarGraficoToolOutput).yColumn}
                  metadata={(chartTool.output as CriarGraficoToolOutput).metadata}
                  success={(chartTool.output as CriarGraficoToolOutput).success}
                  error={(chartTool.output as CriarGraficoToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-retrieveResult') {
          const resultTool = part as NexusToolUIPart;
          const callId = resultTool.toolCallId;
          const shouldBeOpen = resultTool.state === 'output-available' || resultTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-retrieveResult" state={resultTool.state} />
                <ToolContent>
                  {resultTool.input && (
                    <ToolInput input={resultTool.input} />
                  )}
                  {resultTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={resultTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {resultTool.state === 'output-available' && (
                <ResultDisplay 
                  resultId={(resultTool.output as RetrieveResultToolOutput).resultId}
                  resultType={(resultTool.output as RetrieveResultToolOutput).resultType}
                  result={(resultTool.output as RetrieveResultToolOutput).result}
                  sources={(resultTool.output as RetrieveResultToolOutput).sources}
                  retrievedAt={(resultTool.output as RetrieveResultToolOutput).retrievedAt}
                  success={(resultTool.output as RetrieveResultToolOutput).success}
                  error={(resultTool.output as RetrieveResultToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-criarDashboard') {
          const dashboardTool = part as NexusToolUIPart;
          const callId = dashboardTool.toolCallId;
          const shouldBeOpen = dashboardTool.state === 'output-available' || dashboardTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-criarDashboard" state={dashboardTool.state} />
                <ToolContent>
                  {dashboardTool.input && (
                    <ToolInput input={dashboardTool.input} />
                  )}
                  {dashboardTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={dashboardTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {dashboardTool.state === 'output-available' && (
                <Dashboard 
                  dashboardId={(dashboardTool.output as CriarDashboardToolOutput).dashboardId}
                  title={(dashboardTool.output as CriarDashboardToolOutput).title}
                  dashboardType={(dashboardTool.output as CriarDashboardToolOutput).dashboardType}
                  datasetIds={(dashboardTool.output as CriarDashboardToolOutput).datasetIds}
                  widgets={(dashboardTool.output as CriarDashboardToolOutput).widgets}
                  kpis={(dashboardTool.output as CriarDashboardToolOutput).kpis}
                  layout={(dashboardTool.output as CriarDashboardToolOutput).layout}
                  metadata={(dashboardTool.output as CriarDashboardToolOutput).metadata}
                  success={(dashboardTool.output as CriarDashboardToolOutput).success}
                  error={(dashboardTool.output as CriarDashboardToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-executarSQL') {
          const sqlTool = part as NexusToolUIPart;
          const callId = sqlTool.toolCallId;
          const shouldBeOpen = sqlTool.state === 'output-available' || sqlTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-executarSQL" state={sqlTool.state} />
                <ToolContent>
                  {sqlTool.input && (
                    <ToolInput input={sqlTool.input} />
                  )}
                  {sqlTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={sqlTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {sqlTool.state === 'output-available' && (
                <SQLExecution
                  sqlQuery={(sqlTool.output as ExecutarSQLToolOutput).sqlQuery}
                  explicacao={(sqlTool.output as ExecutarSQLToolOutput).explicacao}
                  datasetId={(sqlTool.output as ExecutarSQLToolOutput).datasetId}
                  queryType={(sqlTool.output as ExecutarSQLToolOutput).queryType}
                  dryRun={(sqlTool.output as ExecutarSQLToolOutput).dryRun}
                  data={(sqlTool.output as ExecutarSQLToolOutput).data}
                  schema={(sqlTool.output as ExecutarSQLToolOutput).schema}
                  rowsReturned={(sqlTool.output as ExecutarSQLToolOutput).rowsReturned}
                  rowsAffected={(sqlTool.output as ExecutarSQLToolOutput).rowsAffected}
                  totalRows={(sqlTool.output as ExecutarSQLToolOutput).totalRows}
                  executionTime={(sqlTool.output as ExecutarSQLToolOutput).executionTime}
                  bytesProcessed={(sqlTool.output as ExecutarSQLToolOutput).bytesProcessed}
                  success={(sqlTool.output as ExecutarSQLToolOutput).success}
                  validationErrors={(sqlTool.output as ExecutarSQLToolOutput).validationErrors}
                  error={(sqlTool.output as ExecutarSQLToolOutput).error}
                  onAnalyzeWithAI={handleAnalyzeWithAI}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-executarSQLComDados') {
          const sqlDataTool = part as NexusToolUIPart;
          const callId = sqlDataTool.toolCallId;
          const shouldBeOpen = sqlDataTool.state === 'output-available' || sqlDataTool.state === 'output-error' || sqlDataTool.state === 'input-streaming';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-executarSQLComDados" state={sqlDataTool.state} />
                <ToolContent>
                  {sqlDataTool.state === 'input-streaming' && (
                    <ToolInputStreaming
                      input={sqlDataTool.input}
                      isStreaming={true}
                      streamingData={sqlDataTool.input}
                    />
                  )}
                  {sqlDataTool.state === 'input-available' && (
                    <ToolInput input={sqlDataTool.input} />
                  )}
                  {sqlDataTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={sqlDataTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {sqlDataTool.state === 'output-available' && (
                <SQLDataResults
                  sqlQuery={(sqlDataTool.output as ExecutarSQLComDadosToolOutput).sqlQuery}
                  explicacao={(sqlDataTool.output as ExecutarSQLComDadosToolOutput).explicacao}
                  queryType={(sqlDataTool.output as ExecutarSQLComDadosToolOutput).queryType}
                  data={(sqlDataTool.output as ExecutarSQLComDadosToolOutput).data}
                  rowsReturned={(sqlDataTool.output as ExecutarSQLComDadosToolOutput).rowsReturned}
                  executionTime={(sqlDataTool.output as ExecutarSQLComDadosToolOutput).executionTime}
                  success={(sqlDataTool.output as ExecutarSQLComDadosToolOutput).success}
                  error={(sqlDataTool.output as ExecutarSQLComDadosToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-executarMultiplasSQL') {
          const multiSqlTool = part as NexusToolUIPart;
          const callId = multiSqlTool.toolCallId;
          const shouldBeOpen = multiSqlTool.state === 'output-available' || multiSqlTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-executarMultiplasSQL" state={multiSqlTool.state} />
                <ToolContent>
                  {multiSqlTool.input && (
                    <ToolInput input={multiSqlTool.input} />
                  )}
                  {multiSqlTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={multiSqlTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {multiSqlTool.state === 'output-available' && (
                <MultipleSQL
                  title="Múltiplas Análises SQL"
                  results={(multiSqlTool.output as ExecutarMultiplasSQLToolOutput).results}
                  summary={(multiSqlTool.output as ExecutarMultiplasSQLToolOutput).summary}
                  metadata={(multiSqlTool.output as ExecutarMultiplasSQLToolOutput).metadata}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-criarTabela') {
          const tableTool = part as NexusToolUIPart;
          const callId = tableTool.toolCallId;
          const shouldBeOpen = tableTool.state === 'output-available' || tableTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-criarTabela" state={tableTool.state} />
                <ToolContent>
                  {tableTool.input && (
                    <ToolInput input={tableTool.input} />
                  )}
                  {tableTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={tableTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {tableTool.state === 'output-available' && (
                <TableCreation 
                  datasetId={(tableTool.output as CriarTabelaToolOutput).datasetId}
                  tableName={(tableTool.output as CriarTabelaToolOutput).tableName}
                  tableId={(tableTool.output as CriarTabelaToolOutput).tableId}
                  schema={(tableTool.output as CriarTabelaToolOutput).schema}
                  description={(tableTool.output as CriarTabelaToolOutput).description}
                  location={(tableTool.output as CriarTabelaToolOutput).location}
                  creationTime={(tableTool.output as CriarTabelaToolOutput).creationTime}
                  lastModifiedTime={(tableTool.output as CriarTabelaToolOutput).lastModifiedTime}
                  numRows={(tableTool.output as CriarTabelaToolOutput).numRows}
                  numBytes={(tableTool.output as CriarTabelaToolOutput).numBytes}
                  expirationTime={(tableTool.output as CriarTabelaToolOutput).expirationTime}
                  labels={(tableTool.output as CriarTabelaToolOutput).labels}
                  metadata={(tableTool.output as CriarTabelaToolOutput).metadata}
                  success={(tableTool.output as CriarTabelaToolOutput).success}
                  error={(tableTool.output as CriarTabelaToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-criarKPI') {
          const kpiTool = part as NexusToolUIPart;
          const callId = kpiTool.toolCallId;
          const shouldBeOpen = kpiTool.state === 'output-available' || kpiTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-criarKPI" state={kpiTool.state} />
                <ToolContent>
                  {kpiTool.input && (
                    <ToolInput input={kpiTool.input} />
                  )}
                  {kpiTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={kpiTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {kpiTool.state === 'output-available' && (
                <KPICard 
                  kpiId={(kpiTool.output as CriarKPIToolOutput).kpiId}
                  name={(kpiTool.output as CriarKPIToolOutput).name}
                  datasetId={(kpiTool.output as CriarKPIToolOutput).datasetId}
                  tableId={(kpiTool.output as CriarKPIToolOutput).tableId}
                  metric={(kpiTool.output as CriarKPIToolOutput).metric}
                  calculation={(kpiTool.output as CriarKPIToolOutput).calculation}
                  currentValue={(kpiTool.output as CriarKPIToolOutput).currentValue}
                  previousValue={(kpiTool.output as CriarKPIToolOutput).previousValue}
                  target={(kpiTool.output as CriarKPIToolOutput).target}
                  unit={(kpiTool.output as CriarKPIToolOutput).unit}
                  change={(kpiTool.output as CriarKPIToolOutput).change}
                  trend={(kpiTool.output as CriarKPIToolOutput).trend}
                  status={(kpiTool.output as CriarKPIToolOutput).status}
                  timeRange={(kpiTool.output as CriarKPIToolOutput).timeRange}
                  visualization={(kpiTool.output as CriarKPIToolOutput).visualization}
                  metadata={(kpiTool.output as CriarKPIToolOutput).metadata}
                  success={(kpiTool.output as CriarKPIToolOutput).success}
                  error={(kpiTool.output as CriarKPIToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-webPreview') {
          const webPreviewTool = part as NexusToolUIPart;
          const callId = webPreviewTool.toolCallId;
          const shouldBeOpen = webPreviewTool.state === 'output-available' || webPreviewTool.state === 'output-error';
          
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-webPreview" state={webPreviewTool.state} />
                <ToolContent>
                  {webPreviewTool.input && (
                    <ToolInput input={webPreviewTool.input} />
                  )}
                  {webPreviewTool.state === 'output-error' && (
                    <ToolOutput 
                      output={null}
                      errorText={webPreviewTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {webPreviewTool.state === 'output-available' && (
                <WebPreviewCard 
                  url={(webPreviewTool.output as WebPreviewToolOutput).url}
                  title={(webPreviewTool.output as WebPreviewToolOutput).title}
                  description={(webPreviewTool.output as WebPreviewToolOutput).description}
                  favicon={(webPreviewTool.output as WebPreviewToolOutput).favicon}
                  screenshot={(webPreviewTool.output as WebPreviewToolOutput).screenshot}
                  isValidUrl={(webPreviewTool.output as WebPreviewToolOutput).isValidUrl}
                  previewAvailable={(webPreviewTool.output as WebPreviewToolOutput).previewAvailable}
                  generatedAt={(webPreviewTool.output as WebPreviewToolOutput).generatedAt}
                  success={(webPreviewTool.output as WebPreviewToolOutput).success}
                  error={(webPreviewTool.output as WebPreviewToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-planAnalysis') {
          const planTool = part as NexusToolUIPart;
          const callId = planTool.toolCallId;
          const shouldBeOpen = planTool.state === 'output-available' || planTool.state === 'output-error' || planTool.state === 'input-streaming';

          // Debug logging
          console.log('🎯 PlanAnalysis Tool State:', {
            state: planTool.state,
            input: planTool.input,
            hasAnalises: planTool.input && typeof planTool.input === 'object' && 'analises' in planTool.input,
            analises: planTool.input && typeof planTool.input === 'object' && 'analises' in planTool.input ? (planTool.input as PlanAnalysisToolInput).analises : null
          });

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-planAnalysis" state={planTool.state} />
                <ToolContent>
                  {planTool.state === 'input-streaming' && (
                    <ToolInputStreaming
                      input={planTool.input}
                      isStreaming={true}
                      streamingData={planTool.input}
                    />
                  )}
                  {planTool.state === 'input-available' && (
                    <ToolInput input={planTool.input} />
                  )}
                  {planTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={planTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {planTool.state === 'input-streaming' && (
                <PlanAnalysisStreaming
                  analises={planTool.input && typeof planTool.input === 'object' && 'analises' in planTool.input ? (planTool.input as PlanAnalysisToolInput).analises || [] : []}
                  isStreaming={true}
                />
              )}
              {planTool.state === 'output-available' && (
                <PlanAnalysis
                  plano={(planTool.output as PlanAnalysisToolOutput).plano}
                  totalAnalises={(planTool.output as PlanAnalysisToolOutput).totalAnalises}
                  message={(planTool.output as PlanAnalysisToolOutput).message}
                  success={(planTool.output as PlanAnalysisToolOutput).success}
                  error={(planTool.output as PlanAnalysisToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getTimelineContext') {
          const timelineTool = part as NexusToolUIPart;
          const callId = timelineTool.toolCallId;
          const shouldBeOpen = timelineTool.state === 'output-available' || timelineTool.state === 'output-error';
          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getTimelineContext" state={timelineTool.state} />
                <ToolContent>
                  {timelineTool.input && (
                    <ToolInput input={timelineTool.input} />
                  )}
                  {timelineTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={timelineTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {timelineTool.state === 'output-available' && (
                <TimelineContext
                  success={(timelineTool.output as TimelineContextToolOutput).success}
                  error={(timelineTool.output as TimelineContextToolOutput).error}
                  tableName={(timelineTool.output as TimelineContextToolOutput).tableName}
                  datasetId={(timelineTool.output as TimelineContextToolOutput).datasetId}
                  primaryDateColumn={(timelineTool.output as TimelineContextToolOutput).primaryDateColumn}
                  executionTime={(timelineTool.output as TimelineContextToolOutput).executionTime}
                  detectedDateColumns={(timelineTool.output as TimelineContextToolOutput).detectedDateColumns}
                  timelineOverview={(timelineTool.output as TimelineContextToolOutput).timelineOverview}
                  suggestedPeriods={(timelineTool.output as TimelineContextToolOutput).suggestedPeriods}
                  recommendations={(timelineTool.output as TimelineContextToolOutput).recommendations}
                  sqlExamples={(timelineTool.output as TimelineContextToolOutput).sqlExamples}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-gerarGrafico') {
          const graficoTool = part as NexusToolUIPart;
          const callId = graficoTool.toolCallId;
          const shouldBeOpen = graficoTool.state === 'output-available' || graficoTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-gerarGrafico" state={graficoTool.state} />
                <ToolContent>
                  {graficoTool.input && (
                    <ToolInput input={graficoTool.input} />
                  )}
                  {graficoTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={graficoTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {graficoTool.state === 'output-available' && (
                <GenerativeChart
                  data={(graficoTool.output as GerarGraficoToolOutput).chartData}
                  chartType={(graficoTool.output as GerarGraficoToolOutput).chartType}
                  title={(graficoTool.output as GerarGraficoToolOutput).title}
                  description={(graficoTool.output as GerarGraficoToolOutput).description}
                  explicacao={(graficoTool.output as GerarGraficoToolOutput).explicacao}
                  xColumn={(graficoTool.output as GerarGraficoToolOutput).xColumn}
                  yColumn={(graficoTool.output as GerarGraficoToolOutput).yColumn}
                  sqlQuery={(graficoTool.output as GerarGraficoToolOutput).sqlQuery}
                  totalRecords={(graficoTool.output as GerarGraficoToolOutput).totalRecords}
                  error={(graficoTool.output as GerarGraficoToolOutput).error}
                  fallbackMode={(graficoTool.output as GerarGraficoToolOutput).fallbackMode}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-gerarMultiplosGraficos') {
          const dashboardTool = part as NexusToolUIPart;
          const callId = dashboardTool.toolCallId;
          const shouldBeOpen = dashboardTool.state === 'output-available' || dashboardTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-gerarMultiplosGraficos" state={dashboardTool.state} />
                <ToolContent>
                  {dashboardTool.input && (
                    <ToolInput input={dashboardTool.input} />
                  )}
                  {dashboardTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={dashboardTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {dashboardTool.state === 'output-available' && (
                <MultipleCharts
                  dashboardTitle={(dashboardTool.output as GerarMultiplosGraficosToolOutput).dashboardTitle}
                  charts={(dashboardTool.output as GerarMultiplosGraficosToolOutput).charts}
                  summary={(dashboardTool.output as GerarMultiplosGraficosToolOutput).summary}
                  metadata={(dashboardTool.output as GerarMultiplosGraficosToolOutput).metadata}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-gerarInsights') {
          const insightsTool = part as NexusToolUIPart;
          const callId = insightsTool.toolCallId;
          const shouldBeOpen = insightsTool.state === 'output-available' || insightsTool.state === 'output-error' || insightsTool.state === 'input-streaming';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-gerarInsights" state={insightsTool.state} />
                <ToolContent>
                  {insightsTool.state === 'input-streaming' && (
                    <ToolInputStreaming
                      input={insightsTool.input}
                      isStreaming={true}
                      streamingData={insightsTool.input}
                    />
                  )}
                  {insightsTool.state === 'input-available' && (
                    <ToolInput input={insightsTool.input} />
                  )}
                  {insightsTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={insightsTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {insightsTool.state === 'output-available' && (
                <InsightsResults
                  insights={(insightsTool.output as GerarInsightsToolOutput).insights}
                  resumo={(insightsTool.output as GerarInsightsToolOutput).resumo}
                  contexto={(insightsTool.output as GerarInsightsToolOutput).contexto}
                  totalInsights={(insightsTool.output as GerarInsightsToolOutput).totalInsights}
                  success={(insightsTool.output as GerarInsightsToolOutput).success}
                  error={(insightsTool.output as GerarInsightsToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-gerarAlertas') {
          const alertasTool = part as NexusToolUIPart;
          const callId = alertasTool.toolCallId;
          const shouldBeOpen = alertasTool.state === 'output-available' || alertasTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-gerarAlertas" state={alertasTool.state} />
                <ToolContent>
                  {alertasTool.input && (
                    <ToolInput input={alertasTool.input} />
                  )}
                  {alertasTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={alertasTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {alertasTool.state === 'output-available' && (
                <AlertsResults
                  alertas={(alertasTool.output as GerarAlertasToolOutput).alertas}
                  resumo={(alertasTool.output as GerarAlertasToolOutput).resumo}
                  contexto={(alertasTool.output as GerarAlertasToolOutput).contexto}
                  totalAlertas={(alertasTool.output as GerarAlertasToolOutput).totalAlertas}
                  success={(alertasTool.output as GerarAlertasToolOutput).success}
                  error={(alertasTool.output as GerarAlertasToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-gerarRecomendacoes') {
          const recomendacoesTool = part as NexusToolUIPart;
          const callId = recomendacoesTool.toolCallId;
          const shouldBeOpen = recomendacoesTool.state === 'output-available' || recomendacoesTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-gerarRecomendacoes" state={recomendacoesTool.state} />
                <ToolContent>
                  {recomendacoesTool.input && (
                    <ToolInput input={recomendacoesTool.input} />
                  )}
                  {recomendacoesTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={recomendacoesTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {recomendacoesTool.state === 'output-available' && (
                <RecommendationsResults
                  recomendacoes={(recomendacoesTool.output as GerarRecomendacoesToolOutput).recomendacoes}
                  resumo={(recomendacoesTool.output as GerarRecomendacoesToolOutput).resumo}
                  contexto={(recomendacoesTool.output as GerarRecomendacoesToolOutput).contexto}
                  totalRecomendacoes={(recomendacoesTool.output as GerarRecomendacoesToolOutput).totalRecomendacoes}
                  success={(recomendacoesTool.output as GerarRecomendacoesToolOutput).success}
                  error={(recomendacoesTool.output as GerarRecomendacoesToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-gerarReport') {
          const reportTool = part as NexusToolUIPart;
          const callId = reportTool.toolCallId;
          const shouldBeOpen = reportTool.state === 'output-available' || reportTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-gerarReport" state={reportTool.state} />
                <ToolContent>
                  {reportTool.input && (
                    <ToolInput input={reportTool.input} />
                  )}
                  {reportTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={reportTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {reportTool.state === 'output-available' && (
                <ReportResults
                  titulo={(reportTool.output as GerarReportToolOutput).titulo}
                  markdown={(reportTool.output as GerarReportToolOutput).markdown}
                  totalInsights={(reportTool.output as GerarReportToolOutput).totalInsights}
                  totalAlertas={(reportTool.output as GerarReportToolOutput).totalAlertas}
                  totalRecomendacoes={(reportTool.output as GerarReportToolOutput).totalRecomendacoes}
                  success={(reportTool.output as GerarReportToolOutput).success}
                  error={(reportTool.output as GerarReportToolOutput).error}
                  metadata={(reportTool.output as GerarReportToolOutput).metadata}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-code_execution') {
          const codeExecutionTool = part as NexusToolUIPart;
          const callId = codeExecutionTool.toolCallId;
          const shouldBeOpen = codeExecutionTool.state === 'output-available' || codeExecutionTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-code_execution" state={codeExecutionTool.state} />
                <ToolContent>
                  {codeExecutionTool.input && (
                    <ToolInput input={codeExecutionTool.input} />
                  )}
                  {codeExecutionTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={codeExecutionTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {codeExecutionTool.state === 'output-available' && (
                <CodeExecutionResult
                  result={codeExecutionTool.output as CodeExecutionToolOutput}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getDashboardCode') {
          const dashboardTool = part as NexusToolUIPart;
          const callId = dashboardTool.toolCallId;
          const shouldBeOpen = dashboardTool.state === 'output-available' || dashboardTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getDashboardCode" state={dashboardTool.state} />
                <ToolContent>
                  {dashboardTool.input && (
                    <ToolInput input={dashboardTool.input} />
                  )}
                  {dashboardTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={dashboardTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {dashboardTool.state === 'output-available' && (
                <RenderDashboardCode
                  success={(dashboardTool.output as GetDashboardCodeToolOutput).success}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-createDashboardTool') {
          const createTool = part as NexusToolUIPart;
          const callId = createTool.toolCallId;
          const shouldBeOpen = createTool.state === 'output-available' || createTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-createDashboardTool" state={createTool.state} />
                <ToolContent>
                  {createTool.input && (
                    <ToolInput input={createTool.input} />
                  )}
                  {createTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={createTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {createTool.state === 'output-available' && (
                <CreateDashboardResult
                  success={(createTool.output as CreateDashboardToolOutput).success}
                  description={(createTool.output as CreateDashboardToolOutput).description}
                  totalWidgets={(createTool.output as CreateDashboardToolOutput).totalWidgets}
                  dashboardConfig={(createTool.output as CreateDashboardToolOutput).dashboardConfig}
                  generatedJson={(createTool.output as CreateDashboardToolOutput).generatedJson}
                  message={(createTool.output as CreateDashboardToolOutput).message}
                  error={(createTool.output as CreateDashboardToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-updateDashboardTool') {
          const updateTool = part as NexusToolUIPart;
          const callId = updateTool.toolCallId;
          const shouldBeOpen = updateTool.state === 'output-available' || updateTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-updateDashboardTool" state={updateTool.state} />
                <ToolContent>
                  {updateTool.input && (
                    <ToolInput input={updateTool.input} />
                  )}
                  {updateTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={updateTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {updateTool.state === 'output-available' && (
                <UpdateDashboardResult
                  success={(updateTool.output as UpdateDashboardToolOutput).success}
                  updateJson={(updateTool.output as UpdateDashboardToolOutput).updateJson}
                  description={(updateTool.output as UpdateDashboardToolOutput).description}
                  message={(updateTool.output as UpdateDashboardToolOutput).message}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-sendEmail') {
          const emailTool = part as NexusToolUIPart;
          const callId = emailTool.toolCallId;
          const shouldBeOpen = emailTool.state === 'output-available' || emailTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-sendEmail" state={emailTool.state} />
                <ToolContent>
                  {emailTool.input && (
                    <ToolInput input={emailTool.input} />
                  )}
                  {emailTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={emailTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {emailTool.state === 'output-available' && emailTool.output && (
                <EmailResult
                  success={(emailTool.output as SendEmailToolOutput).success}
                  emailId={(emailTool.output as SendEmailToolOutput).emailId}
                  recipient={(emailTool.output as SendEmailToolOutput).recipient}
                  subject={(emailTool.output as SendEmailToolOutput).subject}
                  bodyLength={(emailTool.output as SendEmailToolOutput).bodyLength}
                  priority={(emailTool.output as SendEmailToolOutput).priority}
                  attachmentCount={(emailTool.output as SendEmailToolOutput).attachmentCount}
                  timestamp={(emailTool.output as SendEmailToolOutput).timestamp}
                  message={(emailTool.output as SendEmailToolOutput).message}
                  note={(emailTool.output as SendEmailToolOutput).note}
                  error={(emailTool.output as SendEmailToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getYouTubeContent') {
          const youtubeTool = part as NexusToolUIPart;
          const callId = youtubeTool.toolCallId;
          const shouldBeOpen = youtubeTool.state === 'output-available' || youtubeTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getYouTubeContent" state={youtubeTool.state} />
                <ToolContent>
                  {youtubeTool.input && (
                    <ToolInput input={youtubeTool.input} />
                  )}
                  {youtubeTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={youtubeTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {youtubeTool.state === 'output-available' && (
                <YouTubeContentList
                  success={(youtubeTool.output as GetYouTubeContentToolOutput).success}
                  count={(youtubeTool.output as GetYouTubeContentToolOutput).count}
                  data={(youtubeTool.output as GetYouTubeContentToolOutput).data}
                  message={(youtubeTool.output as GetYouTubeContentToolOutput).message}
                  error={(youtubeTool.output as GetYouTubeContentToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getReelsContent') {
          const reelsTool = part as NexusToolUIPart;
          const callId = reelsTool.toolCallId;
          const shouldBeOpen = reelsTool.state === 'output-available' || reelsTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getReelsContent" state={reelsTool.state} />
                <ToolContent>
                  {reelsTool.input && (
                    <ToolInput input={reelsTool.input} />
                  )}
                  {reelsTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={reelsTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {reelsTool.state === 'output-available' && (
                <ReelsContentList
                  success={(reelsTool.output as GetReelsContentToolOutput).success}
                  count={(reelsTool.output as GetReelsContentToolOutput).count}
                  data={(reelsTool.output as GetReelsContentToolOutput).data}
                  message={(reelsTool.output as GetReelsContentToolOutput).message}
                  error={(reelsTool.output as GetReelsContentToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-createYouTubeContent') {
          const createYoutubeTool = part as NexusToolUIPart;
          const callId = createYoutubeTool.toolCallId;
          const shouldBeOpen = createYoutubeTool.state === 'output-available' || createYoutubeTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-createYouTubeContent" state={createYoutubeTool.state} />
                <ToolContent>
                  {createYoutubeTool.input && (
                    <ToolInput input={createYoutubeTool.input} />
                  )}
                  {createYoutubeTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={createYoutubeTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {createYoutubeTool.state === 'output-available' && (
                <ContentCreationSuccess
                  success={(createYoutubeTool.output as CreateYouTubeContentToolOutput).success}
                  data={(createYoutubeTool.output as CreateYouTubeContentToolOutput).data}
                  message={(createYoutubeTool.output as CreateYouTubeContentToolOutput).message}
                  error={(createYoutubeTool.output as CreateYouTubeContentToolOutput).error}
                  contentType="youtube"
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-createReelsContent') {
          const createReelsTool = part as NexusToolUIPart;
          const callId = createReelsTool.toolCallId;
          const shouldBeOpen = createReelsTool.state === 'output-available' || createReelsTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-createReelsContent" state={createReelsTool.state} />
                <ToolContent>
                  {createReelsTool.input && (
                    <ToolInput input={createReelsTool.input} />
                  )}
                  {createReelsTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={createReelsTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {createReelsTool.state === 'output-available' && (
                <ContentCreationSuccess
                  success={(createReelsTool.output as CreateReelsContentToolOutput).success}
                  data={(createReelsTool.output as CreateReelsContentToolOutput).data}
                  message={(createReelsTool.output as CreateReelsContentToolOutput).message}
                  error={(createReelsTool.output as CreateReelsContentToolOutput).error}
                  contentType="reels"
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getSalesCalls') {
          const salesCallsTool = part as NexusToolUIPart;
          const callId = salesCallsTool.toolCallId;
          const shouldBeOpen = salesCallsTool.state === 'output-available' || salesCallsTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getSalesCalls" state={salesCallsTool.state} />
                <ToolContent>
                  {salesCallsTool.input && (
                    <ToolInput input={salesCallsTool.input} />
                  )}
                  {salesCallsTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={salesCallsTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {salesCallsTool.state === 'output-available' && (
                <SalesCallsList
                  success={(salesCallsTool.output as GetSalesCallsToolOutput).success}
                  count={(salesCallsTool.output as GetSalesCallsToolOutput).count}
                  data={(salesCallsTool.output as GetSalesCallsToolOutput).data}
                  message={(salesCallsTool.output as GetSalesCallsToolOutput).message}
                  error={(salesCallsTool.output as GetSalesCallsToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getRHCandidates') {
          const rhCandidatesTool = part as NexusToolUIPart;
          const callId = rhCandidatesTool.toolCallId;
          const shouldBeOpen = rhCandidatesTool.state === 'output-available' || rhCandidatesTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getRHCandidates" state={rhCandidatesTool.state} />
                <ToolContent>
                  {rhCandidatesTool.input && (
                    <ToolInput input={rhCandidatesTool.input} />
                  )}
                  {rhCandidatesTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={rhCandidatesTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {rhCandidatesTool.state === 'output-available' && (
                <RHCandidatesList
                  success={(rhCandidatesTool.output as GetRHCandidatesToolOutput).success}
                  count={(rhCandidatesTool.output as GetRHCandidatesToolOutput).count}
                  data={(rhCandidatesTool.output as GetRHCandidatesToolOutput).data}
                  message={(rhCandidatesTool.output as GetRHCandidatesToolOutput).message}
                  error={(rhCandidatesTool.output as GetRHCandidatesToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getServiceOrders') {
          const serviceOrdersTool = part as NexusToolUIPart;
          const callId = serviceOrdersTool.toolCallId;
          const shouldBeOpen = serviceOrdersTool.state === 'output-available' || serviceOrdersTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getServiceOrders" state={serviceOrdersTool.state} />
                <ToolContent>
                  {serviceOrdersTool.input && (
                    <ToolInput input={serviceOrdersTool.input} />
                  )}
                  {serviceOrdersTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={serviceOrdersTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {serviceOrdersTool.state === 'output-available' && (
                <ServiceOrdersList
                  success={(serviceOrdersTool.output as GetServiceOrdersToolOutput).success}
                  count={(serviceOrdersTool.output as GetServiceOrdersToolOutput).count}
                  data={(serviceOrdersTool.output as GetServiceOrdersToolOutput).data}
                  message={(serviceOrdersTool.output as GetServiceOrdersToolOutput).message}
                  error={(serviceOrdersTool.output as GetServiceOrdersToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getContasAReceber') {
          const contasAReceberTool = part as NexusToolUIPart;
          const callId = contasAReceberTool.toolCallId;
          const shouldBeOpen = contasAReceberTool.state === 'output-available' || contasAReceberTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getContasAReceber" state={contasAReceberTool.state} />
                <ToolContent>
                  {contasAReceberTool.input && (
                    <ToolInput input={contasAReceberTool.input} />
                  )}
                  {contasAReceberTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={contasAReceberTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {contasAReceberTool.state === 'output-available' && (
                <ContasAReceberList
                  success={(contasAReceberTool.output as GetContasAReceberToolOutput).success}
                  count={(contasAReceberTool.output as GetContasAReceberToolOutput).count}
                  data={(contasAReceberTool.output as GetContasAReceberToolOutput).data}
                  message={(contasAReceberTool.output as GetContasAReceberToolOutput).message}
                  error={(contasAReceberTool.output as GetContasAReceberToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getReceipts') {
          const receiptsTool = part as NexusToolUIPart;
          const callId = receiptsTool.toolCallId;
          const shouldBeOpen = receiptsTool.state === 'output-available' || receiptsTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getReceipts" state={receiptsTool.state} />
                <ToolContent>
                  {receiptsTool.input && (
                    <ToolInput input={receiptsTool.input} />
                  )}
                  {receiptsTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={receiptsTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {receiptsTool.state === 'output-available' && (
                <ReceiptsList
                  success={(receiptsTool.output as GetReceiptsToolOutput).success}
                  count={(receiptsTool.output as GetReceiptsToolOutput).count}
                  data={(receiptsTool.output as GetReceiptsToolOutput).data}
                  message={(receiptsTool.output as GetReceiptsToolOutput).message}
                  error={(receiptsTool.output as GetReceiptsToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getNotasFiscais') {
          const nfeTool = part as NexusToolUIPart;
          const callId = nfeTool.toolCallId;
          const shouldBeOpen = nfeTool.state === 'output-available' || nfeTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getNotasFiscais" state={nfeTool.state} />
                <ToolContent>
                  {nfeTool.input && (
                    <ToolInput input={nfeTool.input} />
                  )}
                  {nfeTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={nfeTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {nfeTool.state === 'output-available' && (
                <NotasFiscaisList
                  success={(nfeTool.output as GetNotasFiscaisToolOutput).success}
                  count={(nfeTool.output as GetNotasFiscaisToolOutput).count}
                  data={(nfeTool.output as GetNotasFiscaisToolOutput).data}
                  message={(nfeTool.output as GetNotasFiscaisToolOutput).message}
                  error={(nfeTool.output as GetNotasFiscaisToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getInventory') {
          const inventoryTool = part as NexusToolUIPart;
          const callId = inventoryTool.toolCallId;
          const shouldBeOpen = inventoryTool.state === 'output-available' || inventoryTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getInventory" state={inventoryTool.state} />
                <ToolContent>
                  {inventoryTool.input && (
                    <ToolInput input={inventoryTool.input} />
                  )}
                  {inventoryTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={inventoryTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {inventoryTool.state === 'output-available' && (
                <InventoryList
                  success={(inventoryTool.output as GetInventoryToolOutput).success}
                  count={(inventoryTool.output as GetInventoryToolOutput).count}
                  data={(inventoryTool.output as GetInventoryToolOutput).data}
                  message={(inventoryTool.output as GetInventoryToolOutput).message}
                  error={(inventoryTool.output as GetInventoryToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getFinancialData') {
          const financialDataTool = part as NexusToolUIPart;
          const callId = financialDataTool.toolCallId;
          const shouldBeOpen = financialDataTool.state === 'output-available' || financialDataTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getFinancialData" state={financialDataTool.state} />
                <ToolContent>
                  {financialDataTool.input && (
                    <ToolInput input={financialDataTool.input} />
                  )}
                  {financialDataTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={financialDataTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {financialDataTool.state === 'output-available' && (
                <FinancialDataTable
                  success={(financialDataTool.output as GetFinancialDataToolOutput).success}
                  count={(financialDataTool.output as GetFinancialDataToolOutput).count}
                  data={(financialDataTool.output as GetFinancialDataToolOutput).data}
                  message={(financialDataTool.output as GetFinancialDataToolOutput).message}
                  error={(financialDataTool.output as GetFinancialDataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getContasAReceber') {
          const contasAReceberTool = part as NexusToolUIPart;
          const callId = contasAReceberTool.toolCallId;
          const shouldBeOpen = contasAReceberTool.state === 'output-available' || contasAReceberTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getContasAReceber" state={contasAReceberTool.state} />
                <ToolContent>
                  {contasAReceberTool.input && (
                    <ToolInput input={contasAReceberTool.input} />
                  )}
                  {contasAReceberTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={contasAReceberTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {contasAReceberTool.state === 'output-available' && (
                <FinancialDataTable
                  success={(contasAReceberTool.output as GetContasAReceberToolOutput).success}
                  count={(contasAReceberTool.output as GetContasAReceberToolOutput).count}
                  data={(contasAReceberTool.output as GetContasAReceberToolOutput).data}
                  message={(contasAReceberTool.output as GetContasAReceberToolOutput).message}
                  error={(contasAReceberTool.output as GetContasAReceberToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getContasAPagar') {
          const contasAPagarTool = part as NexusToolUIPart;
          const callId = contasAPagarTool.toolCallId;
          const shouldBeOpen = contasAPagarTool.state === 'output-available' || contasAPagarTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getContasAPagar" state={contasAPagarTool.state} />
                <ToolContent>
                  {contasAPagarTool.input && (
                    <ToolInput input={contasAPagarTool.input} />
                  )}
                  {contasAPagarTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={contasAPagarTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {contasAPagarTool.state === 'output-available' && (
                <FinancialDataTable
                  success={(contasAPagarTool.output as GetContasAPagarToolOutput).success}
                  count={(contasAPagarTool.output as GetContasAPagarToolOutput).count}
                  data={(contasAPagarTool.output as GetContasAPagarToolOutput).data}
                  message={(contasAPagarTool.output as GetContasAPagarToolOutput).message}
                  error={(contasAPagarTool.output as GetContasAPagarToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-calculateDateRange') {
          const calculateDateRangeTool = part as NexusToolUIPart;
          const callId = calculateDateRangeTool.toolCallId;
          const shouldBeOpen = calculateDateRangeTool.state === 'output-available' || calculateDateRangeTool.state === 'output-error';
          const output = calculateDateRangeTool.output as CalculateDateRangeToolOutput;

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-calculateDateRange" state={calculateDateRangeTool.state} />
                <ToolContent>
                  {calculateDateRangeTool.input && (
                    <ToolInput input={calculateDateRangeTool.input} />
                  )}
                  {calculateDateRangeTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={calculateDateRangeTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {calculateDateRangeTool.state === 'output-available' && output && (
                <div className="mb-4 rounded-md border border-gray-200 bg-white p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">📅 Período Calculado</h3>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 text-xs font-medium">
                        {output.periodo_descricao.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="mb-1 text-gray-600 text-xs font-medium">Data Inicial</p>
                        <p className="font-mono text-sm font-semibold">{output.data_inicial}</p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="mb-1 text-gray-600 text-xs font-medium">Data Final</p>
                        <p className="font-mono text-sm font-semibold">{output.data_final}</p>
                      </div>
                    </div>

                    {output.dias_calculados && (
                      <div className="rounded-md bg-blue-50 p-3 text-center">
                        <p className="text-blue-900 text-sm">
                          <span className="font-semibold">{output.dias_calculados}</span> dias
                        </p>
                      </div>
                    )}

                    {output.message && (
                      <p className="text-gray-600 text-sm">{output.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (part.type === 'tool-getOrganicMarketingData') {
          const organicMarketingTool = part as NexusToolUIPart;
          const callId = organicMarketingTool.toolCallId;
          const shouldBeOpen = organicMarketingTool.state === 'output-available' || organicMarketingTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getOrganicMarketingData" state={organicMarketingTool.state} />
                <ToolContent>
                  {organicMarketingTool.input && (
                    <ToolInput input={organicMarketingTool.input} />
                  )}
                  {organicMarketingTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={organicMarketingTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {organicMarketingTool.state === 'output-available' && (
                <OrganicMarketingDataTable
                  success={(organicMarketingTool.output as GetOrganicMarketingDataToolOutput).success}
                  count={(organicMarketingTool.output as GetOrganicMarketingDataToolOutput).count}
                  table={(organicMarketingTool.output as GetOrganicMarketingDataToolOutput).table}
                  data={(organicMarketingTool.output as GetOrganicMarketingDataToolOutput).data}
                  message={(organicMarketingTool.output as GetOrganicMarketingDataToolOutput).message}
                  error={(organicMarketingTool.output as GetOrganicMarketingDataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getPaidTrafficData') {
          const paidTrafficTool = part as NexusToolUIPart;
          const callId = paidTrafficTool.toolCallId;
          const shouldBeOpen = paidTrafficTool.state === 'output-available' || paidTrafficTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getPaidTrafficData" state={paidTrafficTool.state} />
                <ToolContent>
                  {paidTrafficTool.input && (
                    <ToolInput input={paidTrafficTool.input} />
                  )}
                  {paidTrafficTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={paidTrafficTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {paidTrafficTool.state === 'output-available' && (
                <PaidTrafficDataTable
                  success={(paidTrafficTool.output as GetPaidTrafficDataToolOutput).success}
                  count={(paidTrafficTool.output as GetPaidTrafficDataToolOutput).count}
                  table={(paidTrafficTool.output as GetPaidTrafficDataToolOutput).table}
                  data={(paidTrafficTool.output as GetPaidTrafficDataToolOutput).data}
                  message={(paidTrafficTool.output as GetPaidTrafficDataToolOutput).message}
                  error={(paidTrafficTool.output as GetPaidTrafficDataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getInventoryData') {
          const inventoryTool = part as NexusToolUIPart;
          const callId = inventoryTool.toolCallId;
          const shouldBeOpen = inventoryTool.state === 'output-available' || inventoryTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getInventoryData" state={inventoryTool.state} />
                <ToolContent>
                  {inventoryTool.input && (
                    <ToolInput input={inventoryTool.input} />
                  )}
                  {inventoryTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={inventoryTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {inventoryTool.state === 'output-available' && (
                <InventoryDataTable
                  success={(inventoryTool.output as GetInventoryDataToolOutput).success}
                  count={(inventoryTool.output as GetInventoryDataToolOutput).count}
                  table={(inventoryTool.output as GetInventoryDataToolOutput).table}
                  data={(inventoryTool.output as GetInventoryDataToolOutput).data}
                  message={(inventoryTool.output as GetInventoryDataToolOutput).message}
                  error={(inventoryTool.output as GetInventoryDataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getEcommerceSalesData') {
          const ecommerceTool = part as NexusToolUIPart;
          const callId = ecommerceTool.toolCallId;
          const shouldBeOpen = ecommerceTool.state === 'output-available' || ecommerceTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getEcommerceSalesData" state={ecommerceTool.state} />
                <ToolContent>
                  {ecommerceTool.input && (
                    <ToolInput input={ecommerceTool.input} />
                  )}
                  {ecommerceTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={ecommerceTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {ecommerceTool.state === 'output-available' && (
                <EcommerceSalesDataTable
                  success={(ecommerceTool.output as GetEcommerceSalesDataToolOutput).success}
                  count={(ecommerceTool.output as GetEcommerceSalesDataToolOutput).count}
                  table={(ecommerceTool.output as GetEcommerceSalesDataToolOutput).table}
                  data={(ecommerceTool.output as GetEcommerceSalesDataToolOutput).data}
                  message={(ecommerceTool.output as GetEcommerceSalesDataToolOutput).message}
                  error={(ecommerceTool.output as GetEcommerceSalesDataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getRevenueMetrics') {
          const revenueTool = part as NexusToolUIPart;
          const callId = revenueTool.toolCallId;
          const shouldBeOpen = revenueTool.state === 'output-available' || revenueTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getRevenueMetrics" state={revenueTool.state} />
                <ToolContent>
                  {revenueTool.input && (
                    <ToolInput input={revenueTool.input} />
                  )}
                  {revenueTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={revenueTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {revenueTool.state === 'output-available' && (
                <RevenueMetricsResult
                  success={(revenueTool.output as GetRevenueMetricsToolOutput).success}
                  data={(revenueTool.output as GetRevenueMetricsToolOutput).data}
                  message={(revenueTool.output as GetRevenueMetricsToolOutput).message}
                  error={(revenueTool.output as GetRevenueMetricsToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getCustomerMetrics') {
          const customerTool = part as NexusToolUIPart;
          const callId = customerTool.toolCallId;
          const shouldBeOpen = customerTool.state === 'output-available' || customerTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getCustomerMetrics" state={customerTool.state} />
                <ToolContent>
                  {customerTool.input && (
                    <ToolInput input={customerTool.input} />
                  )}
                  {customerTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={customerTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {customerTool.state === 'output-available' && (
                <CustomerMetricsResult
                  success={(customerTool.output as GetCustomerMetricsToolOutput).success}
                  data={(customerTool.output as GetCustomerMetricsToolOutput).data}
                  message={(customerTool.output as GetCustomerMetricsToolOutput).message}
                  error={(customerTool.output as GetCustomerMetricsToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getProductPerformance') {
          const productTool = part as NexusToolUIPart;
          const callId = productTool.toolCallId;
          const shouldBeOpen = productTool.state === 'output-available' || productTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getProductPerformance" state={productTool.state} />
                <ToolContent>
                  {productTool.input && (
                    <ToolInput input={productTool.input} />
                  )}
                  {productTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={productTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {productTool.state === 'output-available' && (
                <ProductPerformanceResult
                  success={(productTool.output as GetProductPerformanceToolOutput).success}
                  data={(productTool.output as GetProductPerformanceToolOutput).data}
                  message={(productTool.output as GetProductPerformanceToolOutput).message}
                  error={(productTool.output as GetProductPerformanceToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getCouponEffectiveness') {
          const couponTool = part as NexusToolUIPart;
          const callId = couponTool.toolCallId;
          const shouldBeOpen = couponTool.state === 'output-available' || couponTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getCouponEffectiveness" state={couponTool.state} />
                <ToolContent>
                  {couponTool.input && (
                    <ToolInput input={couponTool.input} />
                  )}
                  {couponTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={couponTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {couponTool.state === 'output-available' && (
                <CouponEffectivenessResult
                  success={(couponTool.output as GetCouponEffectivenessToolOutput).success}
                  data={(couponTool.output as GetCouponEffectivenessToolOutput).data}
                  message={(couponTool.output as GetCouponEffectivenessToolOutput).message}
                  error={(couponTool.output as GetCouponEffectivenessToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getChannelAnalysis') {
          const channelTool = part as NexusToolUIPart;
          const callId = channelTool.toolCallId;
          const shouldBeOpen = channelTool.state === 'output-available' || channelTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getChannelAnalysis" state={channelTool.state} />
                <ToolContent>
                  {channelTool.input && (
                    <ToolInput input={channelTool.input} />
                  )}
                  {channelTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={channelTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {channelTool.state === 'output-available' && (
                <ChannelAnalysisResult
                  success={(channelTool.output as GetChannelAnalysisToolOutput).success}
                  data={(channelTool.output as GetChannelAnalysisToolOutput).data}
                  message={(channelTool.output as GetChannelAnalysisToolOutput).message}
                  error={(channelTool.output as GetChannelAnalysisToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getLogisticsData') {
          const logisticsTool = part as NexusToolUIPart;
          const callId = logisticsTool.toolCallId;
          const shouldBeOpen = logisticsTool.state === 'output-available' || logisticsTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getLogisticsData" state={logisticsTool.state} />
                <ToolContent>
                  {logisticsTool.input && (
                    <ToolInput input={logisticsTool.input} />
                  )}
                  {logisticsTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={logisticsTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {logisticsTool.state === 'output-available' && (
                <LogisticsDataTable
                  success={(logisticsTool.output as GetLogisticsDataToolOutput).success}
                  count={(logisticsTool.output as GetLogisticsDataToolOutput).count}
                  table={(logisticsTool.output as GetLogisticsDataToolOutput).table}
                  data={(logisticsTool.output as GetLogisticsDataToolOutput).data}
                  message={(logisticsTool.output as GetLogisticsDataToolOutput).message}
                  error={(logisticsTool.output as GetLogisticsDataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-calculateDeliveryPerformance') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-calculateDeliveryPerformance" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DeliveryPerformanceResult
                  success={(tool.output as CalculateDeliveryPerformanceToolOutput).success}
                  message={(tool.output as CalculateDeliveryPerformanceToolOutput).message}
                  periodo_dias={(tool.output as CalculateDeliveryPerformanceToolOutput).periodo_dias}
                  transportadora_id={(tool.output as CalculateDeliveryPerformanceToolOutput).transportadora_id}
                  total_envios={(tool.output as CalculateDeliveryPerformanceToolOutput).total_envios}
                  envios_entregues={(tool.output as CalculateDeliveryPerformanceToolOutput).envios_entregues}
                  on_time_delivery={(tool.output as CalculateDeliveryPerformanceToolOutput).on_time_delivery}
                  delivery_time={(tool.output as CalculateDeliveryPerformanceToolOutput).delivery_time}
                  first_attempt_success={(tool.output as CalculateDeliveryPerformanceToolOutput).first_attempt_success}
                  lead_time={(tool.output as CalculateDeliveryPerformanceToolOutput).lead_time}
                  sla_compliance={(tool.output as CalculateDeliveryPerformanceToolOutput).sla_compliance}
                  performance_geral={(tool.output as CalculateDeliveryPerformanceToolOutput).performance_geral}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analyzeCarrierBenchmark') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analyzeCarrierBenchmark" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <CarrierBenchmarkResult
                  success={(tool.output as AnalyzeCarrierBenchmarkToolOutput).success}
                  message={(tool.output as AnalyzeCarrierBenchmarkToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeCarrierBenchmarkToolOutput).periodo_dias}
                  metric={(tool.output as AnalyzeCarrierBenchmarkToolOutput).metric}
                  total_transportadoras={(tool.output as AnalyzeCarrierBenchmarkToolOutput).total_transportadoras}
                  melhor_transportadora={(tool.output as AnalyzeCarrierBenchmarkToolOutput).melhor_transportadora}
                  pior_transportadora={(tool.output as AnalyzeCarrierBenchmarkToolOutput).pior_transportadora}
                  transportadoras={(tool.output as AnalyzeCarrierBenchmarkToolOutput).transportadoras}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analyzeShippingCostStructure') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analyzeShippingCostStructure" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <ShippingCostStructureResult
                  success={(tool.output as AnalyzeShippingCostStructureToolOutput).success}
                  message={(tool.output as AnalyzeShippingCostStructureToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeShippingCostStructureToolOutput).periodo_dias}
                  custo_total={(tool.output as AnalyzeShippingCostStructureToolOutput).custo_total}
                  custo_medio_por_envio={(tool.output as AnalyzeShippingCostStructureToolOutput).custo_medio_por_envio}
                  cost_per_kg={(tool.output as AnalyzeShippingCostStructureToolOutput).cost_per_kg}
                  peso_total_kg={(tool.output as AnalyzeShippingCostStructureToolOutput).peso_total_kg}
                  shipping_cost_percentage={(tool.output as AnalyzeShippingCostStructureToolOutput).shipping_cost_percentage}
                  distribuicao_por_faixa_peso={(tool.output as AnalyzeShippingCostStructureToolOutput).distribuicao_por_faixa_peso}
                  oportunidades_economia={(tool.output as AnalyzeShippingCostStructureToolOutput).oportunidades_economia}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analyzeReverseLogisticsTrends') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analyzeReverseLogisticsTrends" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <ReverseLogisticsTrendsResult
                  success={(tool.output as AnalyzeReverseLogisticsTrendsToolOutput).success}
                  message={(tool.output as AnalyzeReverseLogisticsTrendsToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeReverseLogisticsTrendsToolOutput).periodo_dias}
                  return_rate={(tool.output as AnalyzeReverseLogisticsTrendsToolOutput).return_rate}
                  impacto_financeiro={(tool.output as AnalyzeReverseLogisticsTrendsToolOutput).impacto_financeiro}
                  motivos_principais={(tool.output as AnalyzeReverseLogisticsTrendsToolOutput).motivos_principais}
                  analise_pareto={(tool.output as AnalyzeReverseLogisticsTrendsToolOutput).analise_pareto}
                  recomendacoes={(tool.output as AnalyzeReverseLogisticsTrendsToolOutput).recomendacoes}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-optimizePackageDimensions') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-optimizePackageDimensions" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <OptimizePackageDimensionsResult
                  success={(tool.output as OptimizePackageDimensionsToolOutput).success}
                  message={(tool.output as OptimizePackageDimensionsToolOutput).message}
                  transportadora_id={(tool.output as OptimizePackageDimensionsToolOutput).transportadora_id}
                  total_pacotes={(tool.output as OptimizePackageDimensionsToolOutput).total_pacotes}
                  package_efficiency={(tool.output as OptimizePackageDimensionsToolOutput).package_efficiency}
                  analise_detalhada={(tool.output as OptimizePackageDimensionsToolOutput).analise_detalhada}
                  recomendacoes={(tool.output as OptimizePackageDimensionsToolOutput).recomendacoes}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-detectDeliveryAnomalies') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-detectDeliveryAnomalies" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DetectDeliveryAnomaliesResult
                  success={(tool.output as DetectDeliveryAnomaliesToolOutput).success}
                  message={(tool.output as DetectDeliveryAnomaliesToolOutput).message}
                  periodo_dias={(tool.output as DetectDeliveryAnomaliesToolOutput).periodo_dias}
                  sensitivity={(tool.output as DetectDeliveryAnomaliesToolOutput).sensitivity}
                  estatisticas_base={(tool.output as DetectDeliveryAnomaliesToolOutput).estatisticas_base}
                  total_anomalias={(tool.output as DetectDeliveryAnomaliesToolOutput).total_anomalias}
                  anomalias_criticas={(tool.output as DetectDeliveryAnomaliesToolOutput).anomalias_criticas}
                  anomalias_altas={(tool.output as DetectDeliveryAnomaliesToolOutput).anomalias_altas}
                  anomalias={(tool.output as DetectDeliveryAnomaliesToolOutput).anomalias}
                  red_flags={(tool.output as DetectDeliveryAnomaliesToolOutput).red_flags}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-forecastDeliveryCosts') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-forecastDeliveryCosts" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <ForecastDeliveryCostsResult
                  success={(tool.output as ForecastDeliveryCostsToolOutput).success}
                  message={(tool.output as ForecastDeliveryCostsToolOutput).message}
                  forecast_days={(tool.output as ForecastDeliveryCostsToolOutput).forecast_days}
                  lookback_days={(tool.output as ForecastDeliveryCostsToolOutput).lookback_days}
                  historico={(tool.output as ForecastDeliveryCostsToolOutput).historico}
                  previsao={(tool.output as ForecastDeliveryCostsToolOutput).previsao}
                  insights={(tool.output as ForecastDeliveryCostsToolOutput).insights}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analyzeContentPerformance') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analyzeContentPerformance" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <ContentPerformanceResult
                  success={(tool.output as AnalyzeContentPerformanceToolOutput).success}
                  message={(tool.output as AnalyzeContentPerformanceToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeContentPerformanceToolOutput).periodo_dias}
                  plataforma={(tool.output as AnalyzeContentPerformanceToolOutput).plataforma}
                  metricas_gerais={(tool.output as AnalyzeContentPerformanceToolOutput).metricas_gerais}
                  performance_por_tipo={(tool.output as AnalyzeContentPerformanceToolOutput).performance_por_tipo}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-comparePlatformPerformance') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-comparePlatformPerformance" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <PlatformBenchmarkResult
                  success={(tool.output as ComparePlatformPerformanceToolOutput).success}
                  message={(tool.output as ComparePlatformPerformanceToolOutput).message}
                  periodo_dias={(tool.output as ComparePlatformPerformanceToolOutput).periodo_dias}
                  plataformas={(tool.output as ComparePlatformPerformanceToolOutput).plataformas}
                  recomendacoes={(tool.output as ComparePlatformPerformanceToolOutput).recomendacoes}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analyzeAudienceGrowth') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analyzeAudienceGrowth" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <AudienceGrowthResult
                  success={(tool.output as AnalyzeAudienceGrowthToolOutput).success}
                  message={(tool.output as AnalyzeAudienceGrowthToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeAudienceGrowthToolOutput).periodo_dias}
                  plataforma={(tool.output as AnalyzeAudienceGrowthToolOutput).plataforma}
                  crescimento={(tool.output as AnalyzeAudienceGrowthToolOutput).crescimento}
                  historico_semanal={(tool.output as AnalyzeAudienceGrowthToolOutput).historico_semanal}
                  previsao={(tool.output as AnalyzeAudienceGrowthToolOutput).previsao}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-identifyTopContent') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-identifyTopContent" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <TopContentResult
                  success={(tool.output as IdentifyTopContentToolOutput).success}
                  message={(tool.output as IdentifyTopContentToolOutput).message}
                  periodo_dias={(tool.output as IdentifyTopContentToolOutput).periodo_dias}
                  total_analisados={(tool.output as IdentifyTopContentToolOutput).total_analisados}
                  top_posts={(tool.output as IdentifyTopContentToolOutput).top_posts}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analyzeContentMix') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analyzeContentMix" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <ContentMixResult
                  success={(tool.output as AnalyzeContentMixToolOutput).success}
                  message={(tool.output as AnalyzeContentMixToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeContentMixToolOutput).periodo_dias}
                  total_posts={(tool.output as AnalyzeContentMixToolOutput).total_posts}
                  frequencia={(tool.output as AnalyzeContentMixToolOutput).frequencia}
                  distribuicao_por_tipo={(tool.output as AnalyzeContentMixToolOutput).distribuicao_por_tipo}
                  recomendacoes={(tool.output as AnalyzeContentMixToolOutput).recomendacoes}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-forecastEngagement') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-forecastEngagement" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <ForecastEngagementResult
                  success={(tool.output as ForecastEngagementToolOutput).success}
                  message={(tool.output as ForecastEngagementToolOutput).message}
                  forecast_days={(tool.output as ForecastEngagementToolOutput).forecast_days}
                  lookback_days={(tool.output as ForecastEngagementToolOutput).lookback_days}
                  historico={(tool.output as ForecastEngagementToolOutput).historico}
                  previsao={(tool.output as ForecastEngagementToolOutput).previsao}
                  insights={(tool.output as ForecastEngagementToolOutput).insights}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-calculateContentROI') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-calculateContentROI" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <ContentROIResult
                  success={(tool.output as CalculateContentROIToolOutput).success}
                  message={(tool.output as CalculateContentROIToolOutput).message}
                  periodo_dias={(tool.output as CalculateContentROIToolOutput).periodo_dias}
                  total_posts={(tool.output as CalculateContentROIToolOutput).total_posts}
                  custos={(tool.output as CalculateContentROIToolOutput).custos}
                  resultados={(tool.output as CalculateContentROIToolOutput).resultados}
                  roi={(tool.output as CalculateContentROIToolOutput).roi}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getComprasData') {
          const comprasTool = part as NexusToolUIPart;
          const callId = comprasTool.toolCallId;
          const shouldBeOpen = comprasTool.state === 'output-available' || comprasTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getComprasData" state={comprasTool.state} />
                <ToolContent>
                  {comprasTool.input && (
                    <ToolInput input={comprasTool.input} />
                  )}
                  {comprasTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={comprasTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {comprasTool.state === 'output-available' && (
                <ComprasDataTable
                  success={(comprasTool.output as GetComprasDataToolOutput).success}
                  count={(comprasTool.output as GetComprasDataToolOutput).count}
                  table={(comprasTool.output as GetComprasDataToolOutput).table}
                  data={(comprasTool.output as GetComprasDataToolOutput).data}
                  message={(comprasTool.output as GetComprasDataToolOutput).message}
                  error={(comprasTool.output as GetComprasDataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getProjetosData') {
          const projetosTool = part as NexusToolUIPart;
          const callId = projetosTool.toolCallId;
          const shouldBeOpen = projetosTool.state === 'output-available' || projetosTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getProjetosData" state={projetosTool.state} />
                <ToolContent>
                  {projetosTool.input && (
                    <ToolInput input={projetosTool.input} />
                  )}
                  {projetosTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={projetosTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {projetosTool.state === 'output-available' && (
                <ProjetosDataTable
                  success={(projetosTool.output as GetProjetosDataToolOutput).success}
                  count={(projetosTool.output as GetProjetosDataToolOutput).count}
                  table={(projetosTool.output as GetProjetosDataToolOutput).table}
                  data={(projetosTool.output as GetProjetosDataToolOutput).data}
                  message={(projetosTool.output as GetProjetosDataToolOutput).message}
                  error={(projetosTool.output as GetProjetosDataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getFuncionariosData') {
          const funcionariosTool = part as NexusToolUIPart;
          const callId = funcionariosTool.toolCallId;
          const shouldBeOpen = funcionariosTool.state === 'output-available' || funcionariosTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getFuncionariosData" state={funcionariosTool.state} />
                <ToolContent>
                  {funcionariosTool.input && (
                    <ToolInput input={funcionariosTool.input} />
                  )}
                  {funcionariosTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={funcionariosTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {funcionariosTool.state === 'output-available' && (
                <FuncionariosDataTable
                  success={(funcionariosTool.output as GetFuncionariosDataToolOutput).success}
                  count={(funcionariosTool.output as GetFuncionariosDataToolOutput).count}
                  table={(funcionariosTool.output as GetFuncionariosDataToolOutput).table}
                  data={(funcionariosTool.output as GetFuncionariosDataToolOutput).data}
                  message={(funcionariosTool.output as GetFuncionariosDataToolOutput).message}
                  error={(funcionariosTool.output as GetFuncionariosDataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getAnalyticsData') {
          const analyticsTool = part as NexusToolUIPart;
          const callId = analyticsTool.toolCallId;
          const shouldBeOpen = analyticsTool.state === 'output-available' || analyticsTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getAnalyticsData" state={analyticsTool.state} />
                <ToolContent>
                  {analyticsTool.input && (
                    <ToolInput input={analyticsTool.input} />
                  )}
                  {analyticsTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={analyticsTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {analyticsTool.state === 'output-available' && (
                <AnalyticsDataTable
                  success={(analyticsTool.output as GetAnalyticsDataToolOutput).success}
                  count={(analyticsTool.output as GetAnalyticsDataToolOutput).count}
                  table={(analyticsTool.output as GetAnalyticsDataToolOutput).table}
                  data={(analyticsTool.output as GetAnalyticsDataToolOutput).data}
                  message={(analyticsTool.output as GetAnalyticsDataToolOutput).message}
                  error={(analyticsTool.output as GetAnalyticsDataToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getContasAPagar') {
          const contasAPagarTool = part as NexusToolUIPart;
          const callId = contasAPagarTool.toolCallId;
          const shouldBeOpen = contasAPagarTool.state === 'output-available' || contasAPagarTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getContasAPagar" state={contasAPagarTool.state} />
                <ToolContent>
                  {contasAPagarTool.input && (
                    <ToolInput input={contasAPagarTool.input} />
                  )}
                  {contasAPagarTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={contasAPagarTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {contasAPagarTool.state === 'output-available' && (
                <ContasAPagarList
                  success={(contasAPagarTool.output as GetContasAPagarToolOutput).success}
                  count={(contasAPagarTool.output as GetContasAPagarToolOutput).count}
                  data={(contasAPagarTool.output as GetContasAPagarToolOutput).data}
                  message={(contasAPagarTool.output as GetContasAPagarToolOutput).message}
                  error={(contasAPagarTool.output as GetContasAPagarToolOutput).error}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-calcularFluxoCaixa') {
          const fluxoCaixaTool = part as NexusToolUIPart;
          const callId = fluxoCaixaTool.toolCallId;
          const shouldBeOpen = fluxoCaixaTool.state === 'output-available' || fluxoCaixaTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-calcularFluxoCaixa" state={fluxoCaixaTool.state} />
                <ToolContent>
                  {fluxoCaixaTool.input && (
                    <ToolInput input={fluxoCaixaTool.input} />
                  )}
                  {fluxoCaixaTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={fluxoCaixaTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {fluxoCaixaTool.state === 'output-available' && (
                <FluxoCaixaResult
                  success={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).success}
                  periodo_dias={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).periodo_dias}
                  saldo_inicial={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).saldo_inicial}
                  entradas_previstas={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).entradas_previstas}
                  saidas_previstas={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).saidas_previstas}
                  saldo_projetado={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).saldo_projetado}
                  status_fluxo={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).status_fluxo}
                  entradas_vencidas={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).entradas_vencidas}
                  saidas_vencidas={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).saidas_vencidas}
                  total_contas_receber={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).total_contas_receber}
                  total_contas_pagar={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).total_contas_pagar}
                  error={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).error}
                  message={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).message}
                  detalhes_entradas={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).detalhes_entradas}
                  detalhes_saidas={(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput).detalhes_saidas}
                />
              )}
            </div>
          );
        }

        // Inventory Analytics Tools
        if (part.type === 'tool-calculateInventoryMetrics') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-calculateInventoryMetrics" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <CalculateMetricsResult
                  success={(tool.output as CalculateInventoryMetricsToolOutput).success}
                  message={(tool.output as CalculateInventoryMetricsToolOutput).message}
                  product_id={(tool.output as CalculateInventoryMetricsToolOutput).product_id}
                  periodo_dias={(tool.output as CalculateInventoryMetricsToolOutput).periodo_dias}
                  data_inicial={(tool.output as CalculateInventoryMetricsToolOutput).data_inicial}
                  metricas={(tool.output as CalculateInventoryMetricsToolOutput).metricas}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analyzeStockMovementTrends') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analyzeStockMovementTrends" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <TrendsAnalysisResult
                  success={(tool.output as AnalyzeStockMovementTrendsToolOutput).success}
                  message={(tool.output as AnalyzeStockMovementTrendsToolOutput).message}
                  product_id={(tool.output as AnalyzeStockMovementTrendsToolOutput).product_id}
                  periodo_analise={(tool.output as AnalyzeStockMovementTrendsToolOutput).periodo_analise}
                  dias_analisados={(tool.output as AnalyzeStockMovementTrendsToolOutput).dias_analisados}
                  tendencia={(tool.output as AnalyzeStockMovementTrendsToolOutput).tendencia}
                  slope_tendencia={(tool.output as AnalyzeStockMovementTrendsToolOutput).slope_tendencia}
                  media_saidas_por_periodo={(tool.output as AnalyzeStockMovementTrendsToolOutput).media_saidas_por_periodo}
                  total_periodos={(tool.output as AnalyzeStockMovementTrendsToolOutput).total_periodos}
                  movimentacoes_por_periodo={(tool.output as AnalyzeStockMovementTrendsToolOutput).movimentacoes_por_periodo}
                  previsao_proximo_periodo={(tool.output as AnalyzeStockMovementTrendsToolOutput).previsao_proximo_periodo}
                  insights={(tool.output as AnalyzeStockMovementTrendsToolOutput).insights}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-forecastRestockNeeds') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-forecastRestockNeeds" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <RestockForecastResult
                  success={(tool.output as ForecastRestockNeedsToolOutput).success}
                  message={(tool.output as ForecastRestockNeedsToolOutput).message}
                  forecast_days={(tool.output as ForecastRestockNeedsToolOutput).forecast_days}
                  confidence_level={(tool.output as ForecastRestockNeedsToolOutput).confidence_level}
                  produtos_com_necessidade_reposicao={(tool.output as ForecastRestockNeedsToolOutput).produtos_com_necessidade_reposicao}
                  criticos={(tool.output as ForecastRestockNeedsToolOutput).criticos}
                  previsoes={(tool.output as ForecastRestockNeedsToolOutput).previsoes}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-identifySlowMovingItems') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-identifySlowMovingItems" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <SlowMovingItemsResult
                  success={(tool.output as IdentifySlowMovingItemsToolOutput).success}
                  message={(tool.output as IdentifySlowMovingItemsToolOutput).message}
                  criterio_dias={(tool.output as IdentifySlowMovingItemsToolOutput).criterio_dias}
                  valor_minimo_filtro={(tool.output as IdentifySlowMovingItemsToolOutput).valor_minimo_filtro}
                  total_slow_moving_items={(tool.output as IdentifySlowMovingItemsToolOutput).total_slow_moving_items}
                  valor_total_imobilizado={(tool.output as IdentifySlowMovingItemsToolOutput).valor_total_imobilizado}
                  slow_moving_items={(tool.output as IdentifySlowMovingItemsToolOutput).slow_moving_items}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-compareChannelPerformance') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-compareChannelPerformance" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <ChannelComparisonResult
                  success={(tool.output as CompareChannelPerformanceToolOutput).success}
                  message={(tool.output as CompareChannelPerformanceToolOutput).message}
                  metric={(tool.output as CompareChannelPerformanceToolOutput).metric}
                  product_id={(tool.output as CompareChannelPerformanceToolOutput).product_id}
                  melhor_canal={(tool.output as CompareChannelPerformanceToolOutput).melhor_canal}
                  pior_canal={(tool.output as CompareChannelPerformanceToolOutput).pior_canal}
                  canais={(tool.output as CompareChannelPerformanceToolOutput).canais}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-generateABCAnalysis') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-generateABCAnalysis" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <ABCAnalysisResult
                  success={(tool.output as GenerateABCAnalysisToolOutput).success}
                  message={(tool.output as GenerateABCAnalysisToolOutput).message}
                  criteria={(tool.output as GenerateABCAnalysisToolOutput).criteria}
                  period_days={(tool.output as GenerateABCAnalysisToolOutput).period_days}
                  total_produtos={(tool.output as GenerateABCAnalysisToolOutput).total_produtos}
                  distribuicao={(tool.output as GenerateABCAnalysisToolOutput).distribuicao}
                  produtos_classificados={(tool.output as GenerateABCAnalysisToolOutput).produtos_classificados}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-detectAnomalies') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-detectAnomalies" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <AnomaliesResult
                  success={(tool.output as DetectAnomaliesToolOutput).success}
                  message={(tool.output as DetectAnomaliesToolOutput).message}
                  sensitivity={(tool.output as DetectAnomaliesToolOutput).sensitivity}
                  total_anomalias={(tool.output as DetectAnomaliesToolOutput).total_anomalias}
                  anomalias_alta_severidade={(tool.output as DetectAnomaliesToolOutput).anomalias_alta_severidade}
                  anomalias={(tool.output as DetectAnomaliesToolOutput).anomalias}
                />
              )}
            </div>
          );
        }

        return null;
      })}

      <Actions className="mt-2">
        <Action tooltip="Copy message" onClick={handleCopy}>
          <CopyIcon className="size-4" />
        </Action>
        <Action tooltip="Like">
          <ThumbsUpIcon className="size-4" />
        </Action>
        <Action tooltip="Dislike">
          <ThumbsDownIcon className="size-4" />
        </Action>
      </Actions>
    </div>
  );
}
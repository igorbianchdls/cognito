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
import { type ContaReceberRow } from '../tools/ContasAReceberTable';
import ReceiptsList from '../tools/ReceiptsList';
import NotasFiscaisList from '../tools/NotasFiscaisList';
import InventoryList from '../tools/InventoryList';
import FluxoCaixaResult, { type FluxoCaixaRow } from '../tools/FluxoCaixaResult';
import GenericResultTable from '../tools/GenericResultTable';
import ContasAReceberResult from '../tools/ContasAReceberResult';
import ContasAPagarResult, { type ContaPagarRow } from '../tools/ContasAPagarResult';
import MovimentosResult, { type GetMovimentosOutput } from '../tools/MovimentosResult';
import MovimentosPorCentroCustoResult, { type GetMovimentosPorCentroCustoOutput } from '../tools/MovimentosPorCentroCustoResult';
import TransacoesExtratoResult, { type GetTransacoesExtratoOutput } from '../tools/TransacoesExtratoResult';
import SaldoBancarioResult, { type ObterSaldoBancarioOutput } from '../tools/SaldoBancarioResult';
import DespesasCentroCustoResult, { type ObterDespesasPorCentroCustoOutput } from '../tools/DespesasCentroCustoResult';
import InadimplenciaResult, { type AnalisarInadimplenciaOutput } from '../tools/InadimplenciaResult';
import { BarChart3, DollarSign, LineChart, TrendingUp, AlertTriangle } from 'lucide-react';
import AnaliseDeCampanhas from '../tools/paid-traffic/analiseDeCampanhas';
import OrganicMarketingDataTable from '../tools/OrganicMarketingDataTable';
import PaidTrafficDataTable from '../tools/PaidTrafficDataTable';
import InventoryDataTable from '../tools/InventoryDataTable';
import TopProdutosReceitaLiquidaTable, { type TopProdutosRow } from '../tools/TopProdutosReceitaLiquidaTable';
import DesempenhoVendasMensalResult, { type DesempenhoVendasMensalRow } from '../tools/ecommerce/DesempenhoVendasMensalResult';
import AnaliseDesempenhoCanalResult, { type AnaliseDesempenhoCanalRow } from '../tools/ecommerce/AnaliseDesempenhoCanalResult';
import AnalisePerformanceCategoriaResult, { type AnalisePerformanceCategoriaRow } from '../tools/ecommerce/AnalisePerformanceCategoriaResult';
import DesempenhoCanalVendaResult, { type DesempenhoCanalVendaRow } from '../tools/ecommerce/DesempenhoCanalVendaResult';
import LTVClienteResult, { type LTVClienteRow } from '../tools/ecommerce/LTVClienteResult';
import TopClientesPorReceitaResult, { type TopClienteRow } from '../tools/ecommerce/TopClientesPorReceitaResult';
import ValorVidaClienteResult, { type ValorVidaClienteRow } from '../tools/ecommerce/ValorVidaClienteResult';
import ClientesNovosRecorrentesResult, { type ClientesNovosRecorrentesRow } from '../tools/ecommerce/ClientesNovosRecorrentesResult';
import PerformanceLancamentoResult, { type PerformanceLancamentoRow } from '../tools/ecommerce/PerformanceLancamentoResult';
import CestaComprasResult, { type CestaComprasRow } from '../tools/ecommerce/CestaComprasResult';
import VendasPorEstadoResult, { type VendasPorEstadoRow } from '../tools/ecommerce/VendasPorEstadoResult';
import LogisticsDataTable from '../tools/LogisticsDataTable';
import AnalyticsDataTable from '../tools/AnalyticsDataTable';
import ComprasDataTable from '../tools/ComprasDataTable';
import ProjetosDataTable from '../tools/ProjetosDataTable';
import FuncionariosDataTable from '../tools/FuncionariosDataTable';
import RevenueMetricsResult, { type RevenueMetricsRow } from '../tools/RevenueMetricsResult';
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
import DesempenhoEntregasGeralResult from '../tools/logistics/DesempenhoEntregasGeralResult';
import EficienciaPorStatusResult from '../tools/logistics/EficienciaPorStatusResult';
import EficienciaOperacionalPorCDResult from '../tools/logistics/EficienciaOperacionalPorCDResult';
import PerfilPacotesPorTransportadoraResult from '../tools/logistics/PerfilPacotesPorTransportadoraResult';
import AtrasosCriticosDeteccaoAnomaliasResult from '../tools/logistics/AtrasosCriticosDeteccaoAnomaliasResult';
import LogisticaReversaDevolucoesResult from '../tools/logistics/LogisticaReversaDevolucoesResult';
import RankingEficienciaPorCentroResult from '../tools/logistics/RankingEficienciaPorCentroResult';
import AccountPerformanceResult from '../tools/organic-marketing/AccountPerformanceResult';
import PlatformPerformanceResult from '../tools/organic-marketing/PlatformPerformanceResult';
import PostFormatPerformanceResult from '../tools/organic-marketing/PostFormatPerformanceResult';
import PublicationRankingResult from '../tools/organic-marketing/PublicationRankingResult';
import EngagementByDayHourResult from '../tools/organic-marketing/EngagementByDayHourResult';
import OrganicAnomaliesResult from '../tools/organic-marketing/OrganicAnomaliesResult';
import SuddenReachDropResult from '../tools/organic-marketing/SuddenReachDropResult';
import DesempenhoGeralDoSiteResult from '../tools/web-analytics/DesempenhoGeralDoSiteResult';
import DesempenhoPorCanalResult from '../tools/web-analytics/DesempenhoPorCanalResult';
import EtapasDoFunilGeralResult from '../tools/web-analytics/EtapasDoFunilGeralResult';
import ContribuicaoPorPaginaResult from '../tools/web-analytics/ContribuicaoPorPaginaResult';
import DesempenhoMobileVsDesktopResult from '../tools/web-analytics/DesempenhoMobileVsDesktopResult';
import DeteccaoOutlierPorCanalResult from '../tools/web-analytics/DeteccaoOutlierPorCanalResult';
import VisitantesRecorrentesResult from '../tools/web-analytics/VisitantesRecorrentesResult';
import DesempenhoPorDiaHoraResult from '../tools/web-analytics/DesempenhoPorDiaHoraResult';
import LtvMedioResult from '../tools/web-analytics/LtvMedioResult';
import CampaignROASResult from '../tools/paid-traffic/CampaignROASResult';
import AdsPlatformsResult from '../tools/paid-traffic/AdsPlatformsResult';
import CreativeAdsPerformanceResult from '../tools/paid-traffic/CreativeAdsPerformanceResult';
import DesempenhoPorGrupoDeAnuncioResult from '../tools/paid-traffic/DesempenhoPorGrupoDeAnuncioResult';
import DesempenhoPorDiaDaSemanaResult from '../tools/paid-traffic/DesempenhoPorDiaDaSemanaResult';
import DeteccaoAnomaliasROASResult from '../tools/paid-traffic/DeteccaoAnomaliasROASResult';
import DeteccaoAnomaliasTaxaConversaoResult from '../tools/paid-traffic/DeteccaoAnomaliasTaxaConversaoResult';
import TopAdsResult from '../tools/paid-traffic/TopAdsResult';
import SpendingTrendsResult from '../tools/paid-traffic/SpendingTrendsResult';
import CostMetricsResult from '../tools/paid-traffic/CostMetricsResult';
import AdPerformanceForecastResult from '../tools/paid-traffic/AdPerformanceForecastResult';

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
  total_valor: number;
  rows: ContaReceberRow[] | Array<Record<string, unknown>>;
  message: string;
  sql_query?: string;
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
  table?: string;
  data: Array<Record<string, unknown>>;
  rows?: Array<Record<string, unknown>>;
  message: string;
  error?: string;
  sql_query?: string;
  sql_params?: string;
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
  rows: Array<{
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
  sql_query?: string;
  sql_params?: string;
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
  rows: Array<{
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
  sql_query?: string;
  sql_params?: string;
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

type EcommerceMetricsRow = OrganicMetricsRow;

type EcommerceGenericToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: EcommerceMetricsRow[];
  sql_query?: string;
  error?: string;
};

type GetTopProdutosReceitaLiquidaToolOutput = EcommerceGenericToolOutput & {
  rows?: TopProdutosRow[];
  data?: TopProdutosRow[];
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
  periodo_dias?: number;
  data?: RevenueMetricsRow[];
  rows?: RevenueMetricsRow[];
  sql_query?: string;
  error?: string;
};

type GetCustomerMetricsToolInput = {
  data_de: string;
  data_ate: string;
  top_clientes_limit?: number;
};

type GetCustomerMetricsToolOutput = EcommerceGenericToolOutput;

type GetProductPerformanceToolInput = {
  data_de: string;
  data_ate: string;
  top_products_limit?: number;
  categoria?: string;
};

type GetProductPerformanceToolOutput = EcommerceGenericToolOutput;

type GetReceitaPorCanalToolOutput = EcommerceGenericToolOutput & {
  rows?: DesempenhoVendasMensalRow[];
  data?: DesempenhoVendasMensalRow[];
};

type AnaliseDesempenhoCanalVendaToolOutput = EcommerceGenericToolOutput & {
  rows?: DesempenhoCanalVendaRow[];
  data?: DesempenhoCanalVendaRow[];
};

type AnalisePerformanceCategoriaToolOutput = EcommerceGenericToolOutput & {
  rows?: AnalisePerformanceCategoriaRow[];
  data?: AnalisePerformanceCategoriaRow[];
};

type AnaliseLTVClienteToolOutput = EcommerceGenericToolOutput & {
  rows?: LTVClienteRow[];
  data?: LTVClienteRow[];
};

type GetTopClientesPorReceitaToolOutput = EcommerceGenericToolOutput & {
  rows?: TopClienteRow[];
  data?: TopClienteRow[];
};

type AnaliseValorVidaClienteToolOutput = EcommerceGenericToolOutput & {
  rows?: ValorVidaClienteRow[];
  data?: ValorVidaClienteRow[];
};

type AnaliseClientesNovosRecorrentesToolOutput = EcommerceGenericToolOutput & {
  rows?: ClientesNovosRecorrentesRow[];
  data?: ClientesNovosRecorrentesRow[];
};

type AnalisePerformanceLancamentoToolOutput = EcommerceGenericToolOutput & {
  rows?: PerformanceLancamentoRow[];
  data?: PerformanceLancamentoRow[];
};

type AnaliseCestaComprasToolOutput = EcommerceGenericToolOutput & {
  rows?: CestaComprasRow[];
  data?: CestaComprasRow[];
};

type AnaliseVendasPorEstadoToolOutput = EcommerceGenericToolOutput & {
  rows?: VendasPorEstadoRow[];
  data?: VendasPorEstadoRow[];
};

type GetCouponEffectivenessToolInput = {
  data_de: string;
  data_ate: string;
};

type GetCouponEffectivenessToolOutput = EcommerceGenericToolOutput;

type GetChannelAnalysisToolInput = {
  data_de: string;
  data_ate: string;
};

type GetChannelAnalysisToolOutput = EcommerceGenericToolOutput;

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
  totals?: {
    total_envios: number;
    entregues: number;
    on_time: number;
  };
  rows?: Array<{
    metric: string;
    value: string;
    benchmark: string;
    classification: string;
    detail?: string;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type AnalyzeCarrierBenchmarkToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  rows?: Array<{
    transportadora: string;
    total_envios: number;
    entregues: number;
    on_time_rate: number;
    first_attempt_rate: number;
    avg_delivery_days: number;
    custo_total: number;
    custo_medio_envio: number;
    custo_por_kg: number;
    performance_score: number;
    classificacao: string;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type AnalyzeShippingCostStructureToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  rows?: Array<{
    faixa_peso: string;
    total_envios: number;
    custo_total: string;
    custo_medio_envio: string;
    peso_total: string;
    custo_medio_por_kg: string;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type AnalyzeReverseLogisticsTrendsToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  rows?: Array<{
    categoria: string;
    chave: string;
    total: number;
    concluidas?: number | null;
    pendentes?: number | null;
    taxa_conclusao?: string | null;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type OptimizePackageDimensionsToolOutput = {
  success: boolean;
  message: string;
  rows?: Array<{
    transportadora: string;
    total_pacotes: number;
    peso_medio: string;
    peso_volumetrico_medio: string;
    eficiencia_media: string;
    eficiencia_p10: string;
    eficiencia_p90: string;
    classificacao: string;
  }>;
  low_efficiency_examples?: Array<Record<string, unknown>>;
  sql_query?: string;
  sql_params?: string;
};

type DetectDeliveryAnomaliesToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  sensitivity?: number;
  rows?: Array<{
    data: string;
    entregues: number;
    atrasados: number;
    atraso_percentual: string;
    z_score: number;
    severidade: string;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type ForecastDeliveryCostsToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  forecast_dias?: number;
  rows?: Array<{
    categoria: string;
    periodo: string;
    custo_previsto: number;
    detalhe?: string;
  }>;
  summary?: {
    custo_medio_diario: number;
    ultimo_custo: number;
    slope: number;
  };
  sql_query?: string;
  sql_params?: string;
};

type OrganicMetricsRow = {
  plataforma: string | null;
  contas_vinculadas: number | string | null;
  campanhas_vinculadas: number | string | null;
  gasto_total: number | string | null;
  receita_total: number | string | null;
  conversoes_total: number | string | null;
  roas: number | string | null;
  taxa_conversao_percent: number | string | null;
  ctr_percent: number | string | null;
};

type OrganicGenericToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicMetricsRow[];
  sql_query?: string;
  error?: string;
};

// Generic output for tools that return dynamic rows with SQL metadata
type RowsToolOutput = {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
  sql_params?: string;
};

type AnalyzeContentPerformanceToolOutput = OrganicGenericToolOutput;
type ComparePlatformPerformanceToolOutput = OrganicGenericToolOutput;
type AnalyzeAudienceGrowthToolOutput = OrganicGenericToolOutput;
type IdentifyTopContentToolOutput = OrganicGenericToolOutput;
type AnalyzeContentMixToolOutput = OrganicGenericToolOutput;
type ForecastEngagementToolOutput = OrganicGenericToolOutput;
type CalculateContentROIToolOutput = OrganicGenericToolOutput;

type AnalyzeTrafficOverviewToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  metricas?: {
    total_sessoes: number;
    total_usuarios: number;
    total_pageviews: number;
    bounce_rate: string;
    avg_duration_seconds: number;
    avg_duration_minutos: string;
    pages_per_session: string;
    return_visitor_rate: string;
    classificacao: string;
  };
  rows?: Array<{
    data: string;
    sessoes: number;
    usuarios: number;
    pageviews: number;
    avg_duration_seconds: number;
    bounce_rate_percent: number;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type CompareTrafficSourcesToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_fontes?: number;
  melhor_fonte?: string;
  pior_fonte?: string;
  fontes?: Array<{
    fonte: string;
    sessoes: number;
    percentual_trafego: string;
    pages_per_session: string;
    avg_duration_seconds: number;
    conversoes: number;
    conversion_rate: string;
    quality_score: string;
    classificacao: string;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type AnalyzeConversionFunnelToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_steps?: number;
  conversion_rate?: string;
  steps?: Array<{
    step: number;
    event_name: string;
    sessoes: number;
    drop_off_percent: string;
    conversion_rate_percent: string;
  }>;
  gargalos?: string[];
  rows?: Array<{
    step: number;
    event_name: string;
    sessoes: number;
    drop_off_percent: string;
    conversion_rate_percent: string;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type IdentifyTopLandingPagesToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_paginas?: number;
  rows?: Array<{
    categoria: string;
    pagina: string;
    pageviews: number;
    rank: number;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type AnalyzeDevicePerformanceToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  rows?: Array<{
    tipo: string;
    segmento: string;
    sessoes: number;
    percentual: number;
    avg_duration_seconds: number;
    avg_pageviews: number;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type DetectTrafficAnomaliesToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  sensitivity?: number;
  estatisticas?: {
    media_sessoes_dia: number;
    desvio_padrao: number;
  };
  total_anomalias?: number;
  bot_rate?: string;
  anomalias?: Array<{
    data: string;
    sessoes: number;
    media: number;
    z_score: string;
    tipo: string;
    severidade: string;
  }>;
  rows?: Array<{
    data: string;
    sessoes: number;
    media: number;
    z_score: string;
    tipo: string;
    severidade: string;
  }>;
  red_flags?: string[];
  sql_query?: string;
  sql_params?: string;
};

type AnalyzeUserBehaviorToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  comportamento?: {
    total_visitantes: number;
    novos_visitantes: number;
    visitantes_recorrentes: number;
    percentual_novos: string;
    percentual_recorrentes: string;
    frequencia_media_visitas: string;
    engagement_rate: string;
    classificacao: string;
  };
  rows?: Array<{
    metrica: string;
    valor: number | string;
    percentual: string;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type AnalyzeCampaignROASToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  total_campanhas?: number;
  melhor_campanha?: string;
  campanhas?: Array<{
    campanha_id: string;
    campanha_identificador?: string | null;
    campanha_nome?: string;
    campanha_status?: string;
    objetivo?: string;
    gasto: string;
    receita: string;
    conversoes: number;
    roas: string;
    custo_por_conversao: string;
    ctr: string;
    cpc?: string;
    cpm?: string;
    taxa_conversao?: string;
    ticket_medio?: string;
    lucro?: string;
    classificacao: string;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type CompareAdsPlatformsToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_plataformas?: number;
  melhor_plataforma?: string;
  pior_plataforma?: string;
  sql_query?: string;
  plataformas?: Array<{
    plataforma: string | null;
    total_impressoes: number | string | null;
    total_cliques: number | string | null;
    total_conversoes: number | string | null;
    total_gasto: number | string | null;
    total_receita: number | string | null;
    ctr: number | string | null;
    cpc: number | string | null;
    cpa: number | string | null;
    roas: number | string | null;
    lucro: number | string | null;
  }>;
};

type AnalyzeCreativePerformanceToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_criativos?: number;
  status?: {
    aprovados: number;
    rascunhos: number;
    em_revisao: number;
    rejeitados: number;
    taxa_aprovacao: string;
  };
};

type IdentifyTopAdsToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  total_analisados?: number;
  top_anuncios?: Array<{
    anuncio_id: string;
    titulo: string;
    plataforma: string;
    gasto: string;
    receita: string;
    conversoes: number;
    roas: string;
    ctr: string;
    custo_por_conversao: string;
    classificacao: string;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type AnalyzeSpendingTrendsToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  estatisticas?: {
    gasto_medio_dia: string;
    gasto_maximo: string;
    gasto_minimo: string;
    tendencia: string;
  };
  gastos_diarios?: Array<{
    data: string;
    gasto: string;
    receita: string;
  }>;
  sql_query?: string;
  sql_params?: string;
};

type CalculateCostMetricsToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  metricas?: {
    total_gasto: string;
    total_impressoes: number;
    total_cliques: number;
    total_conversoes: number;
    cpm: string;
    cpc: string;
    cpa: string;
    ctr: string;
    classificacao_eficiencia: string;
  };
  sql_query?: string;
  sql_params?: string;
};

type ForecastAdPerformanceToolOutput = {
  success: boolean;
  message: string;
  lookback_days?: number;
  forecast_days?: number;
  plataforma?: string;
  historico?: {
    gasto_medio_dia: string;
    conversoes_medio_dia: string;
    roas_medio: string;
  };
  previsao?: {
    gasto_previsto: string;
    conversoes_previstas: number;
    receita_prevista: string;
    roas_esperado: string;
  };
  sql_query?: string;
  sql_params?: string;
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
  rows: Array<{
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
  sql_query?: string;
  sql_params?: string;
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
  total_valor: number;
  rows: ContaPagarRow[] | Array<Record<string, unknown>>;
  data?: ContaPagarRow[] | Array<Record<string, unknown>>;
  message: string;
  sql_query?: string;
  error?: string;
  };

  type AnalyzeAdPerformanceToolOutput = {
    success: boolean;
    message: string;
    count?: number;
    rows?: Array<Record<string, unknown>>;
    sql_query?: string;
    sql_params?: string;
  };

  type AnaliseDeCampanhasToolOutput = {
    success: boolean;
    message: string;
    count?: number;
    rows?: Array<Record<string, unknown>>;
    sql_query?: string;
    sql_params?: string;
  };

// Tipo genérico para saídas tabulares usadas no GenericResultTable
type GenericRowsToolOutput = {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
  sql_queries?: Array<{ name?: string; sql: string; params?: unknown[] }>;
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
  rows: FluxoCaixaRow[];
  summary: {
    entradas_previstas: number;
    saidas_previstas: number;
    saldo_projetado: number;
    entradas_vencidas: number;
    saidas_vencidas: number;
  };
  message?: string;
  sql_query?: string;
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
type InventoryMetricsRow = OrganicMetricsRow;

type InventoryGenericToolOutput = {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: InventoryMetricsRow[];
  sql_query?: string;
  error?: string;
};

type CalculateInventoryMetricsToolOutput = InventoryGenericToolOutput;

type AnalyzeStockMovementTrendsToolOutput = InventoryGenericToolOutput;

type ForecastRestockNeedsToolOutput = InventoryGenericToolOutput;

type IdentifySlowMovingItemsToolOutput = InventoryGenericToolOutput;

type CompareChannelPerformanceToolOutput = InventoryGenericToolOutput;

type GenerateABCAnalysisToolOutput = InventoryGenericToolOutput;

type DetectAnomaliesToolOutput = InventoryGenericToolOutput;

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
    case 'ecommerceSalesAgent':
      return { initial: 'E', title: 'E-commerce Sales Agent', color: 'bg-emerald-600' };
    case 'ecommerceSalesAgentV2':
      return { initial: 'E', title: 'Agente de Vendas E-commerce', color: 'bg-emerald-700' };
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
                <ContasAReceberResult
                  result={contasAReceberTool.output as GetContasAReceberToolOutput}
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
                <GenericResultTable
                  title="Dados Financeiros"
                  icon={DollarSign}
                  iconColor="text-green-600"
                  success={(financialDataTool.output as GetFinancialDataToolOutput).success}
                  message={(financialDataTool.output as GetFinancialDataToolOutput).message}
                  rows={(financialDataTool.output as GetFinancialDataToolOutput).data as Array<Record<string, unknown>>}
                  count={(financialDataTool.output as GetFinancialDataToolOutput).count}
                  sql_query={(financialDataTool.output as GetFinancialDataToolOutput).sql_query}
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
                    <ToolInput input={calculateDateRangeTool.input as CalculateDateRangeToolInput} />
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
                  rows={(organicMarketingTool.output as GetOrganicMarketingDataToolOutput).rows}
                  message={(organicMarketingTool.output as GetOrganicMarketingDataToolOutput).message}
                  error={(organicMarketingTool.output as GetOrganicMarketingDataToolOutput).error}
                  sql_query={(organicMarketingTool.output as GetOrganicMarketingDataToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getDesempenhoVendasMensal') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getDesempenhoVendasMensal" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <DesempenhoVendasMensalResult
                  success={(tool.output as GetReceitaPorCanalToolOutput).success}
                  message={(tool.output as GetReceitaPorCanalToolOutput).message}
                  rows={(tool.output as GetReceitaPorCanalToolOutput).rows}
                  data={(tool.output as GetReceitaPorCanalToolOutput).data}
                  sql_query={(tool.output as GetReceitaPorCanalToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analiseDesempenhoCanalVenda') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-analiseDesempenhoCanalVenda" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <DesempenhoCanalVendaResult
                  success={(tool.output as AnaliseDesempenhoCanalVendaToolOutput).success}
                  message={(tool.output as AnaliseDesempenhoCanalVendaToolOutput).message}
                  rows={(tool.output as AnaliseDesempenhoCanalVendaToolOutput).rows}
                  data={(tool.output as AnaliseDesempenhoCanalVendaToolOutput).data}
                  sql_query={(tool.output as AnaliseDesempenhoCanalVendaToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analisePerformanceCategoria') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-analisePerformanceCategoria" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <AnalisePerformanceCategoriaResult
                  success={(tool.output as AnalisePerformanceCategoriaToolOutput).success}
                  message={(tool.output as AnalisePerformanceCategoriaToolOutput).message}
                  rows={(tool.output as AnalisePerformanceCategoriaToolOutput).rows}
                  data={(tool.output as AnalisePerformanceCategoriaToolOutput).data}
                  sql_query={(tool.output as AnalisePerformanceCategoriaToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analiseLTVcliente') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-analiseLTVcliente" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <LTVClienteResult
                  success={(tool.output as AnaliseLTVClienteToolOutput).success}
                  message={(tool.output as AnaliseLTVClienteToolOutput).message}
                  rows={(tool.output as AnaliseLTVClienteToolOutput).rows}
                  data={(tool.output as AnaliseLTVClienteToolOutput).data}
                  sql_query={(tool.output as AnaliseLTVClienteToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getTopClientesPorReceita') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getTopClientesPorReceita" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <TopClientesPorReceitaResult
                  success={(tool.output as GetTopClientesPorReceitaToolOutput).success}
                  message={(tool.output as GetTopClientesPorReceitaToolOutput).message}
                  rows={(tool.output as GetTopClientesPorReceitaToolOutput).rows}
                  data={(tool.output as GetTopClientesPorReceitaToolOutput).data}
                  sql_query={(tool.output as GetTopClientesPorReceitaToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analiseValorVidaCliente') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-analiseValorVidaCliente" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <ValorVidaClienteResult
                  success={(tool.output as AnaliseValorVidaClienteToolOutput).success}
                  message={(tool.output as AnaliseValorVidaClienteToolOutput).message}
                  rows={(tool.output as AnaliseValorVidaClienteToolOutput).rows}
                  data={(tool.output as AnaliseValorVidaClienteToolOutput).data}
                  sql_query={(tool.output as AnaliseValorVidaClienteToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analiseClientesNovosRecorrentes') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-analiseClientesNovosRecorrentes" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <ClientesNovosRecorrentesResult
                  success={(tool.output as AnaliseClientesNovosRecorrentesToolOutput).success}
                  message={(tool.output as AnaliseClientesNovosRecorrentesToolOutput).message}
                  rows={(tool.output as AnaliseClientesNovosRecorrentesToolOutput).rows}
                  data={(tool.output as AnaliseClientesNovosRecorrentesToolOutput).data}
                  sql_query={(tool.output as AnaliseClientesNovosRecorrentesToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analisePerformanceLancamento') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-analisePerformanceLancamento" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <PerformanceLancamentoResult
                  success={(tool.output as AnalisePerformanceLancamentoToolOutput).success}
                  message={(tool.output as AnalisePerformanceLancamentoToolOutput).message}
                  rows={(tool.output as AnalisePerformanceLancamentoToolOutput).rows}
                  data={(tool.output as AnalisePerformanceLancamentoToolOutput).data}
                  sql_query={(tool.output as AnalisePerformanceLancamentoToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analiseCestaCompras') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-analiseCestaCompras" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <CestaComprasResult
                  success={(tool.output as AnaliseCestaComprasToolOutput).success}
                  message={(tool.output as AnaliseCestaComprasToolOutput).message}
                  rows={(tool.output as AnaliseCestaComprasToolOutput).rows}
                  data={(tool.output as AnaliseCestaComprasToolOutput).data}
                  sql_query={(tool.output as AnaliseCestaComprasToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analiseVendasPorEstado') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-analiseVendasPorEstado" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <VendasPorEstadoResult
                  success={(tool.output as AnaliseVendasPorEstadoToolOutput).success}
                  message={(tool.output as AnaliseVendasPorEstadoToolOutput).message}
                  rows={(tool.output as AnaliseVendasPorEstadoToolOutput).rows}
                  data={(tool.output as AnaliseVendasPorEstadoToolOutput).data}
                  sql_query={(tool.output as AnaliseVendasPorEstadoToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-cashflowOverview') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-cashflowOverview" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <GenericResultTable
                  title="Fluxo de Caixa"
                  icon={TrendingUp}
                  iconColor="text-green-600"
                  success={(tool.output as GenericRowsToolOutput).success}
                  message={(tool.output as GenericRowsToolOutput).message}
                  rows={(tool.output as GenericRowsToolOutput).rows as Array<Record<string, unknown>>}
                  sql_query={(tool.output as GenericRowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-accountsAgingReceivables' || part.type === 'tool-accountsAgingPayables') {
          const tool = part as NexusToolUIPart;
          const title = part.type === 'tool-accountsAgingReceivables' ? 'Aging Contas a Receber' : 'Aging Contas a Pagar';
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type={part.type} state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <GenericResultTable
                  title={title}
                  icon={BarChart3}
                  iconColor="text-blue-600"
                  success={(tool.output as GenericRowsToolOutput).success}
                  message={(tool.output as GenericRowsToolOutput).message}
                  rows={(tool.output as GenericRowsToolOutput).rows as Array<Record<string, unknown>>}
                  sql_query={(tool.output as GenericRowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-receivablesForecast' || part.type === 'tool-payablesSchedule') {
          const tool = part as NexusToolUIPart;
          const title = part.type === 'tool-receivablesForecast' ? 'Previsão de Recebimentos' : 'Cronograma de Pagamentos';
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type={part.type} state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <GenericResultTable
                  title={title}
                  icon={LineChart}
                  iconColor="text-indigo-600"
                  success={(tool.output as GenericRowsToolOutput).success}
                  message={(tool.output as GenericRowsToolOutput).message}
                  rows={(tool.output as GenericRowsToolOutput).rows as Array<Record<string, unknown>>}
                  sql_query={(tool.output as GenericRowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-expenseBreakdownByCategory' || part.type === 'tool-profitabilityByCategory') {
          const tool = part as NexusToolUIPart;
          const title = part.type === 'tool-expenseBreakdownByCategory' ? 'Despesas por Categoria' : 'Resultado por Categoria';
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type={part.type} state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <GenericResultTable
                  title={title}
                  icon={BarChart3}
                  iconColor="text-amber-600"
                  success={(tool.output as GenericRowsToolOutput).success}
                  message={(tool.output as GenericRowsToolOutput).message}
                  rows={(tool.output as GenericRowsToolOutput).rows as Array<Record<string, unknown>>}
                  sql_query={(tool.output as GenericRowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-bankReconciliationStatus' || part.type === 'tool-detectFinancialAnomalies') {
          const tool = part as NexusToolUIPart;
          const title = part.type === 'tool-bankReconciliationStatus' ? 'Conciliação Bancária' : 'Anomalias Financeiras';
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type={part.type} state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <GenericResultTable
                  title={title}
                  icon={AlertTriangle}
                  iconColor="text-rose-600"
                  success={(tool.output as GenericRowsToolOutput).success}
                  message={(tool.output as GenericRowsToolOutput).message}
                  rows={(tool.output as GenericRowsToolOutput).rows as Array<Record<string, unknown>>}
                  sql_query={(tool.output as GenericRowsToolOutput).sql_query}
                  sql_queries={(tool.output as GenericRowsToolOutput).sql_queries}
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
                  rows={(paidTrafficTool.output as GetPaidTrafficDataToolOutput).rows}
                  message={(paidTrafficTool.output as GetPaidTrafficDataToolOutput).message}
                  error={(paidTrafficTool.output as GetPaidTrafficDataToolOutput).error}
                  sql_query={(paidTrafficTool.output as GetPaidTrafficDataToolOutput).sql_query}
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

        if (part.type === 'tool-avaliacaoCustoInventario') {
          const tool = part as NexusToolUIPart;
          const callId = tool.toolCallId;
          const shouldBeOpen = tool.state === 'output-available' || tool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-avaliacaoCustoInventario" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && (
                    <ToolOutput output={null} errorText={tool.errorText} />
                  )}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && (
                <GenericResultTable
                  title="Avaliação de Custo do Inventário"
                  icon={BarChart3}
                  iconColor="text-slate-700"
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getTopProdutosReceitaLiquida') {
          const ecommerceTool = part as NexusToolUIPart;
          const callId = ecommerceTool.toolCallId;
          const shouldBeOpen = ecommerceTool.state === 'output-available' || ecommerceTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getTopProdutosReceitaLiquida" state={ecommerceTool.state} />
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
                <TopProdutosReceitaLiquidaTable
                  success={(ecommerceTool.output as GetTopProdutosReceitaLiquidaToolOutput).success}
                  rows={((ecommerceTool.output as GetTopProdutosReceitaLiquidaToolOutput).rows ?? (ecommerceTool.output as GetTopProdutosReceitaLiquidaToolOutput).data ?? []) as TopProdutosRow[]}
                  message={(ecommerceTool.output as GetTopProdutosReceitaLiquidaToolOutput).message}
                  sql_query={(ecommerceTool.output as GetTopProdutosReceitaLiquidaToolOutput).sql_query}
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
                  message={(revenueTool.output as GetRevenueMetricsToolOutput).message}
                  periodo_dias={(revenueTool.output as GetRevenueMetricsToolOutput).periodo_dias}
                  data={(revenueTool.output as GetRevenueMetricsToolOutput).data}
                  rows={(revenueTool.output as GetRevenueMetricsToolOutput).rows}
                  sql_query={(revenueTool.output as GetRevenueMetricsToolOutput).sql_query}
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
                  message={(customerTool.output as GetCustomerMetricsToolOutput).message}
                  periodo_dias={(customerTool.output as GetCustomerMetricsToolOutput).periodo_dias}
                  data={(customerTool.output as GetCustomerMetricsToolOutput).data}
                  sql_query={(customerTool.output as GetCustomerMetricsToolOutput).sql_query}
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
                  message={(productTool.output as GetProductPerformanceToolOutput).message}
                  periodo_dias={(productTool.output as GetProductPerformanceToolOutput).periodo_dias}
                  data={(productTool.output as GetProductPerformanceToolOutput).data}
                  sql_query={(productTool.output as GetProductPerformanceToolOutput).sql_query}
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
                  message={(couponTool.output as GetCouponEffectivenessToolOutput).message}
                  periodo_dias={(couponTool.output as GetCouponEffectivenessToolOutput).periodo_dias}
                  data={(couponTool.output as GetCouponEffectivenessToolOutput).data}
                  sql_query={(couponTool.output as GetCouponEffectivenessToolOutput).sql_query}
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
                  message={(channelTool.output as GetChannelAnalysisToolOutput).message}
                  periodo_dias={(channelTool.output as GetChannelAnalysisToolOutput).periodo_dias}
                  data={(channelTool.output as GetChannelAnalysisToolOutput).data}
                  sql_query={(channelTool.output as GetChannelAnalysisToolOutput).sql_query}
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
                  totals={(tool.output as CalculateDeliveryPerformanceToolOutput).totals}
                  rows={(tool.output as CalculateDeliveryPerformanceToolOutput).rows}
                  sql_query={(tool.output as CalculateDeliveryPerformanceToolOutput).sql_query}
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
                  rows={(tool.output as AnalyzeCarrierBenchmarkToolOutput).rows}
                  sql_query={(tool.output as AnalyzeCarrierBenchmarkToolOutput).sql_query}
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
                  rows={(tool.output as AnalyzeShippingCostStructureToolOutput).rows}
                  sql_query={(tool.output as AnalyzeShippingCostStructureToolOutput).sql_query}
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
                  rows={(tool.output as AnalyzeReverseLogisticsTrendsToolOutput).rows}
                  sql_query={(tool.output as AnalyzeReverseLogisticsTrendsToolOutput).sql_query}
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
                  rows={(tool.output as OptimizePackageDimensionsToolOutput).rows}
                  low_efficiency_examples={(tool.output as OptimizePackageDimensionsToolOutput).low_efficiency_examples}
                  sql_query={(tool.output as OptimizePackageDimensionsToolOutput).sql_query}
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
                  rows={(tool.output as DetectDeliveryAnomaliesToolOutput).rows}
                  sql_query={(tool.output as DetectDeliveryAnomaliesToolOutput).sql_query}
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
                  periodo_dias={(tool.output as ForecastDeliveryCostsToolOutput).periodo_dias}
                  forecast_dias={(tool.output as ForecastDeliveryCostsToolOutput).forecast_dias}
                  rows={(tool.output as ForecastDeliveryCostsToolOutput).rows}
                  summary={(tool.output as ForecastDeliveryCostsToolOutput).summary}
                  sql_query={(tool.output as ForecastDeliveryCostsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        // (Removidos: cases antigos das tools de orgânico)

        if (part.type === 'tool-desempenhoGeralDoSite' || part.type === 'tool-analyzeTrafficOverview') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoGeralDoSite" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DesempenhoGeralDoSiteResult
                  success={(tool.output as AnalyzeTrafficOverviewToolOutput).success}
                  message={(tool.output as AnalyzeTrafficOverviewToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeTrafficOverviewToolOutput).periodo_dias}
                  metricas={(tool.output as AnalyzeTrafficOverviewToolOutput).metricas}
                  rows={(tool.output as AnalyzeTrafficOverviewToolOutput).rows}
                  sql_query={(tool.output as AnalyzeTrafficOverviewToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-desempenhoEntregasGeral') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoEntregasGeral" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DesempenhoEntregasGeralResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-eficienciaPorStatus') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-eficienciaPorStatus" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <EficienciaPorStatusResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-eficienciaOperacionalPorCD') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-eficienciaOperacionalPorCD" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <EficienciaOperacionalPorCDResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-perfilPacotesPorTransportadora') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-perfilPacotesPorTransportadora" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <PerfilPacotesPorTransportadoraResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-atrasosCriticosDeteccaoAnomalias') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-atrasosCriticosDeteccaoAnomalias" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <AtrasosCriticosDeteccaoAnomaliasResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-logisticaReversaDevolucoes') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-logisticaReversaDevolucoes" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <LogisticaReversaDevolucoesResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-rankingEficienciaPorCentro') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-rankingEficienciaPorCentro" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <RankingEficienciaPorCentroResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        // Novas tools de Marketing Orgânico (nomes em PT-BR)
        if (part.type === 'tool-desempenhoPorConta') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoPorConta" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <AccountPerformanceResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-desempenhoPorPlataforma') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoPorPlataforma" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <PlatformPerformanceResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-desempenhoPorFormatoPost') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoPorFormatoPost" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <PostFormatPerformanceResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-rankingPorPublicacao') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-rankingPorPublicacao" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <PublicationRankingResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-engajamentoPorDiaHora') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-engajamentoPorDiaHora" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <EngagementByDayHourResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-detectarAnomaliasPerformance') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-detectarAnomaliasPerformance" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <OrganicAnomaliesResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-detectarQuedaSubitaAlcance') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-detectarQuedaSubitaAlcance" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <SuddenReachDropResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-desempenhoPorCanal' || part.type === 'tool-compareTrafficSources') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoPorCanal" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DesempenhoPorCanalResult
                  success={(tool.output as CompareTrafficSourcesToolOutput).success}
                  message={(tool.output as CompareTrafficSourcesToolOutput).message}
                  periodo_dias={(tool.output as CompareTrafficSourcesToolOutput).periodo_dias}
                  total_fontes={(tool.output as CompareTrafficSourcesToolOutput).total_fontes}
                  melhor_fonte={(tool.output as CompareTrafficSourcesToolOutput).melhor_fonte}
                  pior_fonte={(tool.output as CompareTrafficSourcesToolOutput).pior_fonte}
                  fontes={(tool.output as CompareTrafficSourcesToolOutput).fontes}
                  sql_query={(tool.output as CompareTrafficSourcesToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-etapasDoFunilGeral' || part.type === 'tool-analyzeConversionFunnel') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-etapasDoFunilGeral" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <EtapasDoFunilGeralResult
                  success={(tool.output as AnalyzeConversionFunnelToolOutput).success}
                  message={(tool.output as AnalyzeConversionFunnelToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeConversionFunnelToolOutput).periodo_dias}
                  total_steps={(tool.output as AnalyzeConversionFunnelToolOutput).total_steps}
                  conversion_rate={(tool.output as AnalyzeConversionFunnelToolOutput).conversion_rate}
                  steps={(tool.output as AnalyzeConversionFunnelToolOutput).steps}
                  gargalos={(tool.output as AnalyzeConversionFunnelToolOutput).gargalos}
                  rows={(tool.output as AnalyzeConversionFunnelToolOutput).rows}
                  sql_query={(tool.output as AnalyzeConversionFunnelToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-contribuicaoPorPagina' || part.type === 'tool-identifyTopLandingPages') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-contribuicaoPorPagina" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <ContribuicaoPorPaginaResult
                  success={(tool.output as IdentifyTopLandingPagesToolOutput).success}
                  message={(tool.output as IdentifyTopLandingPagesToolOutput).message}
                  periodo_dias={(tool.output as IdentifyTopLandingPagesToolOutput).periodo_dias}
                  total_paginas={(tool.output as IdentifyTopLandingPagesToolOutput).total_paginas}
                  rows={(tool.output as IdentifyTopLandingPagesToolOutput).rows}
                  sql_query={(tool.output as IdentifyTopLandingPagesToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-desempenhoMobileVsDesktop' || part.type === 'tool-analyzeDevicePerformance') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoMobileVsDesktop" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DesempenhoMobileVsDesktopResult
                  success={(tool.output as AnalyzeDevicePerformanceToolOutput).success}
                  message={(tool.output as AnalyzeDevicePerformanceToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeDevicePerformanceToolOutput).periodo_dias}
                  rows={(tool.output as AnalyzeDevicePerformanceToolOutput).rows}
                  sql_query={(tool.output as AnalyzeDevicePerformanceToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-deteccaoOutlierPorCanal' || part.type === 'tool-detectTrafficAnomalies') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-deteccaoOutlierPorCanal" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DeteccaoOutlierPorCanalResult
                  success={(tool.output as DetectTrafficAnomaliesToolOutput).success}
                  message={(tool.output as DetectTrafficAnomaliesToolOutput).message}
                  periodo_dias={(tool.output as DetectTrafficAnomaliesToolOutput).periodo_dias}
                  sensitivity={(tool.output as DetectTrafficAnomaliesToolOutput).sensitivity}
                  estatisticas={(tool.output as DetectTrafficAnomaliesToolOutput).estatisticas}
                  total_anomalias={(tool.output as DetectTrafficAnomaliesToolOutput).total_anomalias}
                  bot_rate={(tool.output as DetectTrafficAnomaliesToolOutput).bot_rate}
                  anomalias={(tool.output as DetectTrafficAnomaliesToolOutput).anomalias}
                  red_flags={(tool.output as DetectTrafficAnomaliesToolOutput).red_flags}
                  rows={(tool.output as DetectTrafficAnomaliesToolOutput).rows}
                  sql_query={(tool.output as DetectTrafficAnomaliesToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-visitantesRecorrentes' || part.type === 'tool-analyzeUserBehavior') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-visitantesRecorrentes" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <VisitantesRecorrentesResult
                  success={(tool.output as AnalyzeUserBehaviorToolOutput).success}
                  message={(tool.output as AnalyzeUserBehaviorToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeUserBehaviorToolOutput).periodo_dias}
                  comportamento={(tool.output as AnalyzeUserBehaviorToolOutput).comportamento}
                  rows={(tool.output as AnalyzeUserBehaviorToolOutput).rows}
                  sql_query={(tool.output as AnalyzeUserBehaviorToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-desempenhoPorDiaHora') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoPorDiaHora" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DesempenhoPorDiaHoraResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-ltvMedio') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-ltvMedio" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <LtvMedioResult
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analyzeCampaignROAS') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analyzeCampaignROAS" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <CampaignROASResult
                  success={(tool.output as AnalyzeCampaignROASToolOutput).success}
                  message={(tool.output as AnalyzeCampaignROASToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeCampaignROASToolOutput).periodo_dias}
                  plataforma={(tool.output as AnalyzeCampaignROASToolOutput).plataforma}
                  total_campanhas={(tool.output as AnalyzeCampaignROASToolOutput).total_campanhas}
                  melhor_campanha={(tool.output as AnalyzeCampaignROASToolOutput).melhor_campanha}
                  campanhas={(tool.output as AnalyzeCampaignROASToolOutput).campanhas}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-compareAdsPlatforms') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-compareAdsPlatforms" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <AdsPlatformsResult
                  success={(tool.output as CompareAdsPlatformsToolOutput).success}
                  message={(tool.output as CompareAdsPlatformsToolOutput).message}
                  periodo_dias={(tool.output as CompareAdsPlatformsToolOutput).periodo_dias}
                  total_plataformas={(tool.output as CompareAdsPlatformsToolOutput).total_plataformas}
                  melhor_plataforma={(tool.output as CompareAdsPlatformsToolOutput).melhor_plataforma}
                  pior_plataforma={(tool.output as CompareAdsPlatformsToolOutput).pior_plataforma}
                  plataformas={(tool.output as CompareAdsPlatformsToolOutput).plataformas}
                  sql_query={(tool.output as CompareAdsPlatformsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-desempenhoPorGrupoDeAnuncio') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoPorGrupoDeAnuncio" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DesempenhoPorGrupoDeAnuncioResult
                  success={(tool.output as { success: boolean }).success}
                  message={(tool.output as { message: string }).message}
                  rows={(tool.output as { rows?: Array<Record<string, unknown>> }).rows}
                  count={(tool.output as { count?: number }).count}
                  sql_query={(tool.output as { sql_query?: string }).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-desempenhoPorDiaDaSemana') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoPorDiaDaSemana" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DesempenhoPorDiaDaSemanaResult
                  success={(tool.output as { success: boolean }).success}
                  message={(tool.output as { message: string }).message}
                  rows={(tool.output as { rows?: Array<Record<string, unknown>> }).rows}
                  count={(tool.output as { count?: number }).count}
                  sql_query={(tool.output as { sql_query?: string }).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-deteccaoAnomaliasROAS') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-deteccaoAnomaliasROAS" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DeteccaoAnomaliasROASResult
                  success={(tool.output as { success: boolean }).success}
                  message={(tool.output as { message: string }).message}
                  rows={(tool.output as { rows?: Array<Record<string, unknown>> }).rows}
                  count={(tool.output as { count?: number }).count}
                  sql_query={(tool.output as { sql_query?: string }).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-deteccaoAnomaliasTaxaConversao') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-deteccaoAnomaliasTaxaConversao" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <DeteccaoAnomaliasTaxaConversaoResult
                  success={(tool.output as { success: boolean }).success}
                  message={(tool.output as { message: string }).message}
                  rows={(tool.output as { rows?: Array<Record<string, unknown>> }).rows}
                  count={(tool.output as { count?: number }).count}
                  sql_query={(tool.output as { sql_query?: string }).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analiseDeCampanhas') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analiseDeCampanhas" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <AnaliseDeCampanhas
                  success={(tool.output as AnaliseDeCampanhasToolOutput).success}
                  message={(tool.output as AnaliseDeCampanhasToolOutput).message}
                  rows={(tool.output as AnaliseDeCampanhasToolOutput).rows}
                  count={(tool.output as AnaliseDeCampanhasToolOutput).count}
                  sql_query={(tool.output as AnaliseDeCampanhasToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        

        if (part.type === 'tool-analyzeCreativePerformance') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analyzeCreativePerformance" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <CreativeAdsPerformanceResult
                  success={(tool.output as unknown as { success: boolean }).success}
                  message={(tool.output as unknown as { message: string }).message}
                  rows={(tool.output as unknown as { rows?: Array<Record<string, unknown>> }).rows}
                  count={(tool.output as unknown as { count?: number }).count}
                  sql_query={(tool.output as unknown as { sql_query?: string }).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-identifyTopAds') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-identifyTopAds" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <TopAdsResult
                  success={(tool.output as IdentifyTopAdsToolOutput).success}
                  message={(tool.output as IdentifyTopAdsToolOutput).message}
                  periodo_dias={(tool.output as IdentifyTopAdsToolOutput).periodo_dias}
                  plataforma={(tool.output as IdentifyTopAdsToolOutput).plataforma}
                  total_analisados={(tool.output as IdentifyTopAdsToolOutput).total_analisados}
                  top_anuncios={(tool.output as IdentifyTopAdsToolOutput).top_anuncios}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analyzeSpendingTrends') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analyzeSpendingTrends" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <SpendingTrendsResult
                  success={(tool.output as AnalyzeSpendingTrendsToolOutput).success}
                  message={(tool.output as AnalyzeSpendingTrendsToolOutput).message}
                  periodo_dias={(tool.output as AnalyzeSpendingTrendsToolOutput).periodo_dias}
                  plataforma={(tool.output as AnalyzeSpendingTrendsToolOutput).plataforma}
                  estatisticas={(tool.output as AnalyzeSpendingTrendsToolOutput).estatisticas}
                  gastos_diarios={(tool.output as AnalyzeSpendingTrendsToolOutput).gastos_diarios}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-calculateCostMetrics') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-calculateCostMetrics" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <CostMetricsResult
                  success={(tool.output as CalculateCostMetricsToolOutput).success}
                  message={(tool.output as CalculateCostMetricsToolOutput).message}
                  periodo_dias={(tool.output as CalculateCostMetricsToolOutput).periodo_dias}
                  plataforma={(tool.output as CalculateCostMetricsToolOutput).plataforma}
                  metricas={(tool.output as CalculateCostMetricsToolOutput).metricas}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-forecastAdPerformance') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-forecastAdPerformance" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <AdPerformanceForecastResult
                  success={(tool.output as ForecastAdPerformanceToolOutput).success}
                  message={(tool.output as ForecastAdPerformanceToolOutput).message}
                  lookback_days={(tool.output as ForecastAdPerformanceToolOutput).lookback_days}
                  forecast_days={(tool.output as ForecastAdPerformanceToolOutput).forecast_days}
                  plataforma={(tool.output as ForecastAdPerformanceToolOutput).plataforma}
                  historico={(tool.output as ForecastAdPerformanceToolOutput).historico}
                  previsao={(tool.output as ForecastAdPerformanceToolOutput).previsao}
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
                  rows={(analyticsTool.output as GetAnalyticsDataToolOutput).rows}
                  message={(analyticsTool.output as GetAnalyticsDataToolOutput).message}
                  error={(analyticsTool.output as GetAnalyticsDataToolOutput).error}
                  sql_query={(analyticsTool.output as GetAnalyticsDataToolOutput).sql_query}
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
                <ContasAPagarResult
                  result={contasAPagarTool.output as GetContasAPagarToolOutput}
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
                  {...(fluxoCaixaTool.output as CalcularFluxoCaixaToolOutput)}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getMovimentos') {
          const movimentosTool = part as NexusToolUIPart;
          const callId = movimentosTool.toolCallId;
          const shouldBeOpen = movimentosTool.state === 'output-available' || movimentosTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getMovimentos" state={movimentosTool.state} />
                <ToolContent>
                  {movimentosTool.input && (
                    <ToolInput input={movimentosTool.input} />
                  )}
                  {movimentosTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={movimentosTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {movimentosTool.state === 'output-available' && (
                <MovimentosResult
                  result={movimentosTool.output as GetMovimentosOutput}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analisarMovimentosPorCentroCusto') {
          const movimentosCCTool = part as NexusToolUIPart;
          const callId = movimentosCCTool.toolCallId;
          const shouldBeOpen = movimentosCCTool.state === 'output-available' || movimentosCCTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-analisarMovimentosPorCentroCusto" state={movimentosCCTool.state} />
                <ToolContent>
                  {movimentosCCTool.input && (
                    <ToolInput input={movimentosCCTool.input} />
                  )}
                  {movimentosCCTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={movimentosCCTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {movimentosCCTool.state === 'output-available' && (
                <MovimentosPorCentroCustoResult
                  result={movimentosCCTool.output as GetMovimentosPorCentroCustoOutput}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-getTransacoesExtrato') {
          const transacoesTool = part as NexusToolUIPart;
          const callId = transacoesTool.toolCallId;
          const shouldBeOpen = transacoesTool.state === 'output-available' || transacoesTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-getTransacoesExtrato" state={transacoesTool.state} />
                <ToolContent>
                  {transacoesTool.input && (
                    <ToolInput input={transacoesTool.input} />
                  )}
                  {transacoesTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={transacoesTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {transacoesTool.state === 'output-available' && (
                <TransacoesExtratoResult
                  result={transacoesTool.output as GetTransacoesExtratoOutput}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-obterSaldoBancario') {
          const saldoTool = part as NexusToolUIPart;
          const callId = saldoTool.toolCallId;
          const shouldBeOpen = saldoTool.state === 'output-available' || saldoTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-obterSaldoBancario" state={saldoTool.state} />
                <ToolContent>
                  {saldoTool.input && (
                    <ToolInput input={saldoTool.input} />
                  )}
                  {saldoTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={saldoTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {saldoTool.state === 'output-available' && (
                <SaldoBancarioResult
                  result={saldoTool.output as ObterSaldoBancarioOutput}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-obterDespesasPorCentroCusto') {
          const despesasTool = part as NexusToolUIPart;
          const callId = despesasTool.toolCallId;
          const shouldBeOpen = despesasTool.state === 'output-available' || despesasTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-obterDespesasPorCentroCusto" state={despesasTool.state} />
                <ToolContent>
                  {despesasTool.input && (
                    <ToolInput input={despesasTool.input} />
                  )}
                  {despesasTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={despesasTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {despesasTool.state === 'output-available' && (
                <DespesasCentroCustoResult
                  result={despesasTool.output as ObterDespesasPorCentroCustoOutput}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analisarInadimplencia') {
          const inadimplenciaTool = part as NexusToolUIPart;
          const callId = inadimplenciaTool.toolCallId;
          const shouldBeOpen = inadimplenciaTool.state === 'output-available' || inadimplenciaTool.state === 'output-error';

          return (
            <div key={callId}>
              <Tool defaultOpen={shouldBeOpen}>
                <ToolHeader type="tool-analisarInadimplencia" state={inadimplenciaTool.state} />
                <ToolContent>
                  {inadimplenciaTool.input && (
                    <ToolInput input={inadimplenciaTool.input} />
                  )}
                  {inadimplenciaTool.state === 'output-error' && (
                    <ToolOutput
                      output={null}
                      errorText={inadimplenciaTool.errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
              {inadimplenciaTool.state === 'output-available' && (
                <InadimplenciaResult
                  result={inadimplenciaTool.output as AnalisarInadimplenciaOutput}
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
                  periodo_dias={(tool.output as CalculateInventoryMetricsToolOutput).periodo_dias}
                  data={(tool.output as CalculateInventoryMetricsToolOutput).data}
                  sql_query={(tool.output as CalculateInventoryMetricsToolOutput).sql_query}
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
                  periodo_dias={(tool.output as AnalyzeStockMovementTrendsToolOutput).periodo_dias}
                  data={(tool.output as AnalyzeStockMovementTrendsToolOutput).data}
                  sql_query={(tool.output as AnalyzeStockMovementTrendsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-abcDetalhadaProduto') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-abcDetalhadaProduto" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <GenericResultTable
                  title="ABC Detalhada por Produto"
                  icon={BarChart3}
                  iconColor="text-purple-600"
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
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
                  periodo_dias={(tool.output as ForecastRestockNeedsToolOutput).periodo_dias}
                  data={(tool.output as ForecastRestockNeedsToolOutput).data}
                  sql_query={(tool.output as ForecastRestockNeedsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analiseDOS') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analiseDOS" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <GenericResultTable
                  title="Dias de Estoque (DOS)"
                  icon={TrendingUp}
                  iconColor="text-orange-600"
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
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
                  periodo_dias={(tool.output as IdentifySlowMovingItemsToolOutput).periodo_dias}
                  data={(tool.output as IdentifySlowMovingItemsToolOutput).data}
                  sql_query={(tool.output as IdentifySlowMovingItemsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-abcResumoGerencial') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-abcResumoGerencial" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <GenericResultTable
                  title="Resumo Gerencial da Curva ABC"
                  icon={BarChart3}
                  iconColor="text-indigo-600"
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-desempenhoPorDepositoExpedicoes') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-desempenhoPorDepositoExpedicoes" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <GenericResultTable
                  title="Desempenho por Depósito (Expedições)"
                  icon={BarChart3}
                  iconColor="text-amber-600"
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
                />
              )}
            </div>
          );
        }

        if (part.type === 'tool-analiseGiroEstoque') {
          const tool = part as NexusToolUIPart;
          return (
            <div key={tool.toolCallId}>
              <Tool defaultOpen={tool.state === 'output-available' || tool.state === 'output-error'}>
                <ToolHeader type="tool-analiseGiroEstoque" state={tool.state} />
                <ToolContent>
                  {tool.input && <ToolInput input={tool.input} />}
                  {tool.state === 'output-error' && <ToolOutput output={null} errorText={tool.errorText} />}
                </ToolContent>
              </Tool>
              {tool.state === 'output-available' && tool.output && (
                <GenericResultTable
                  title="Giro de Estoque"
                  icon={TrendingUp}
                  iconColor="text-emerald-600"
                  success={(tool.output as RowsToolOutput).success}
                  message={(tool.output as RowsToolOutput).message}
                  rows={(tool.output as RowsToolOutput).rows}
                  count={(tool.output as RowsToolOutput).count}
                  sql_query={(tool.output as RowsToolOutput).sql_query}
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
                  periodo_dias={(tool.output as DetectAnomaliesToolOutput).periodo_dias}
                  data={(tool.output as DetectAnomaliesToolOutput).data}
                  sql_query={(tool.output as DetectAnomaliesToolOutput).sql_query}
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

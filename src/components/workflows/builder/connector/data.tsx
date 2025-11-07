"use client"

import {
  Code,
  Database,
  Clock4,
  Network,
  Webhook,
  Terminal,
  Save,
  Layers,
  Mail,
  Wallet,
  Calculator,
  ShoppingCart,
  Users,
  Wrench,
  Briefcase,
  Store,
  BarChart3,
  Megaphone,
  LineChart,
  Landmark,
  FileText,
  BookOpen,
  Link as LinkIcon,
  MapPin,
  Lightbulb,
  Bell,
  Search,
  Calendar
} from "lucide-react"
import type { ConnectorCatalog } from "./types"

const actionBlocks = [
  { id: 'requests', label: 'Requests', hint: 'HTTP requests', kind: 'core' as const, stepType: 'action' as const, icon: <Network className="w-4 h-4" /> },
  { id: 'code', label: 'Code', hint: 'Custom JavaScript', kind: 'core' as const, stepType: 'action' as const, icon: <Code className="w-4 h-4" /> },
  { id: 'data-map', label: 'Data Map', hint: 'Transformar dados', kind: 'helper' as const, stepType: 'action' as const, icon: <Database className="w-4 h-4" /> },
  { id: 'event-transform', label: 'Event transform', hint: 'Mutar payload', kind: 'helper' as const, stepType: 'action' as const, icon: <Layers className="w-4 h-4" /> },
  { id: 'trigger', label: 'Trigger', hint: 'Início do fluxo', kind: 'core' as const, stepType: 'trigger' as const, icon: <Webhook className="w-4 h-4" /> },
  { id: 'save-to-story', label: 'Save to story', hint: 'Persistir execução', kind: 'helper' as const, stepType: 'action' as const, icon: <Save className="w-4 h-4" /> },
  { id: 'webhook', label: 'Webhook', hint: 'Receber URLs', kind: 'core' as const, stepType: 'trigger' as const, icon: <LinkIcon className="w-4 h-4" /> },
  { id: 'terminal', label: 'Terminal', hint: 'Executar comando', kind: 'helper' as const, stepType: 'action' as const, icon: <Terminal className="w-4 h-4" /> },
]

export const catalog: ConnectorCatalog = {
  actionBlocks,
  providers: [
    {
      id: 'financeiro',
      name: 'Financeiro',
      connectors: [
        { id: 'fin.getContasAReceber', label: 'Contas a Receber', hint: 'Listar e analisar recebíveis', kind: 'action' as const, icon: <Wallet className="w-4 h-4" /> },
        { id: 'fin.getContasAPagar', label: 'Contas a Pagar', hint: 'Listar e analisar pagáveis', kind: 'action' as const, icon: <Wallet className="w-4 h-4" /> },
        { id: 'fin.getPagamentosRecebidos', label: 'Pagamentos Recebidos', hint: 'Histórico de recebimentos', kind: 'action' as const, icon: <Wallet className="w-4 h-4" /> },
        { id: 'fin.getPagamentosEfetuados', label: 'Pagamentos Efetuados', hint: 'Saídas realizadas', kind: 'action' as const, icon: <Wallet className="w-4 h-4" /> },
        { id: 'fin.calcularFluxoCaixa', label: 'Fluxo de Caixa', hint: 'Projeção e fluxo consolidado', kind: 'action' as const, icon: <LineChart className="w-4 h-4" /> },
        // Removido: analisarReceitasPorCentroCusto (consolidado no ranking por CC)
        { id: 'fin.getTransacoesExtrato', label: 'Transações (Extrato)', hint: 'Movimentação bancária', kind: 'action' as const, icon: <Database className="w-4 h-4" /> },
        { id: 'fin.obterSaldoBancario', label: 'Saldo Bancário', hint: 'Saldos por conta', kind: 'action' as const, icon: <Wallet className="w-4 h-4" /> },
        { id: 'fin.obterDespesasPorCentroCusto', label: 'Despesas por Centro de Custo', hint: 'Despesas por CC', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'fin.analisarInadimplencia', label: 'Inadimplência', hint: 'Clientes inadimplentes', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
        { id: 'fin.analisarDespesasPorCategoria', label: 'Despesas por Categoria', hint: 'Categorias de despesa', kind: 'action' as const, icon: <Calculator className="w-4 h-4" /> },
      ],
    },
    {
      id: 'contabilidade',
      name: 'Contabilidade',
      connectors: [
        { id: 'cont.listarLancamentosContabeis', label: 'Lançamentos Contábeis', hint: 'Lançamentos com filtros', kind: 'action' as const, icon: <BookOpen className="w-4 h-4" /> },
        { id: 'cont.gerarDRE', label: 'DRE', hint: 'Demonstração do Resultado', kind: 'action' as const, icon: <Calculator className="w-4 h-4" /> },
        { id: 'cont.gerarBalancoPatrimonial', label: 'Balanço Patrimonial', hint: 'Saldos por grupos', kind: 'action' as const, icon: <Landmark className="w-4 h-4" /> },
      ],
    },
    {
      id: 'compras',
      name: 'Compras',
      connectors: [
        { id: 'comp.getComprasData', label: 'Resumo de Compras', hint: 'Panorama e KPIs', kind: 'action' as const, icon: <ShoppingCart className="w-4 h-4" /> },
        { id: 'comp.listarFornecedoresCompra', label: 'Fornecedores', hint: 'Lista e filtros', kind: 'action' as const, icon: <Users className="w-4 h-4" /> },
        { id: 'comp.listarPedidosCompra', label: 'Pedidos', hint: 'Pedidos de compra', kind: 'action' as const, icon: <ShoppingCart className="w-4 h-4" /> },
        { id: 'comp.listarRecebimentosCompra', label: 'Recebimentos', hint: 'Entradas e notas', kind: 'action' as const, icon: <Database className="w-4 h-4" /> },
        { id: 'comp.listarSolicitacoesCompra', label: 'Solicitações', hint: 'Requisições internas', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
        { id: 'comp.listarCotacoesCompra', label: 'Cotações', hint: 'Pedidos de cotação', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
        { id: 'comp.kpisCompras', label: 'KPIs de Compras', hint: 'Indicadores-chave', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
    {
      id: 'crm',
      name: 'CRM',
      connectors: [
        { id: 'crm.getCrmOportunidades', label: 'Oportunidades', hint: 'Pipeline e forecast', kind: 'action' as const, icon: <Briefcase className="w-4 h-4" /> },
        { id: 'crm.getCrmAtividades', label: 'Atividades', hint: 'Follow-ups e tarefas', kind: 'action' as const, icon: <Calendar className="w-4 h-4" /> },
      ],
    },
    {
      id: 'servicos',
      name: 'Serviços',
      connectors: [
        { id: 'srv.listarOrdensDeServico', label: 'Ordens de Serviço', hint: 'OS e status', kind: 'action' as const, icon: <Wrench className="w-4 h-4" /> },
        { id: 'srv.listarTecnicos', label: 'Técnicos', hint: 'Equipe e especialidade', kind: 'action' as const, icon: <Users className="w-4 h-4" /> },
        { id: 'srv.listarAgendamentos', label: 'Agendamentos', hint: 'Agenda de técnicos', kind: 'action' as const, icon: <Calendar className="w-4 h-4" /> },
        { id: 'srv.listarCatalogoDeServicos', label: 'Catálogo de Serviços', hint: 'Itens e preços', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
        { id: 'srv.historicoDeServicosDoCliente', label: 'Histórico do Cliente', hint: 'OS por cliente', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
        { id: 'srv.indicadoresDeServicos', label: 'Indicadores', hint: 'Backlog, TMA, receita', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
    {
      id: 'vendas-b2b',
      name: 'Vendas B2B',
      connectors: [
        { id: 'vb2b.listarPedidosVendas', label: 'Pedidos', hint: 'Pedidos e status', kind: 'action' as const, icon: <Briefcase className="w-4 h-4" /> },
        { id: 'vb2b.listarClientesVendas', label: 'Clientes', hint: 'Clientes e status', kind: 'action' as const, icon: <Users className="w-4 h-4" /> },
        { id: 'vb2b.listarTerritoriosVendas', label: 'Territórios', hint: 'Regiões e KPIs', kind: 'action' as const, icon: <MapPin className="w-4 h-4" /> },
        { id: 'vb2b.listarEquipesVendas', label: 'Equipes', hint: 'Times e vendedores', kind: 'action' as const, icon: <Users className="w-4 h-4" /> },
        { id: 'vb2b.listarCanaisVendas', label: 'Canais', hint: 'Canais e receita', kind: 'action' as const, icon: <Store className="w-4 h-4" /> },
        { id: 'vb2b.kpisVendas', label: 'KPIs de Vendas', hint: 'Pedidos, receita, ticket', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
    {
      id: 'ecommerce',
      name: 'Ecommerce Vendas',
      connectors: [
        { id: 'ec.getTopProdutosReceitaLiquida', label: 'Top Produtos (Receita)', hint: 'Ranking por receita líquida', kind: 'action' as const, icon: <Store className="w-4 h-4" /> },
        { id: 'ec.getDesempenhoVendasMensal', label: 'Vendas Mensais', hint: 'Receita por mês', kind: 'action' as const, icon: <LineChart className="w-4 h-4" /> },
        { id: 'ec.analiseDesempenhoCanalVenda', label: 'Desempenho por Canal', hint: 'Comparar canais', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'ec.analisePerformanceCategoria', label: 'Performance por Categoria', hint: 'Receita por categoria', kind: 'action' as const, icon: <Store className="w-4 h-4" /> },
        { id: 'ec.analiseLTVcliente', label: 'LTV do Cliente', hint: 'Valor de vida do cliente', kind: 'action' as const, icon: <Users className="w-4 h-4" /> },
        { id: 'ec.getTopClientesPorReceita', label: 'Top Clientes', hint: 'Clientes por receita', kind: 'action' as const, icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      id: 'web-analytics',
      name: 'Web Analytics',
      connectors: [
        { id: 'wa.getAnalyticsData', label: 'Dados de Analytics', hint: 'Carga geral para análise', kind: 'action' as const, icon: <Database className="w-4 h-4" /> },
        { id: 'wa.desempenhoGeralDoSite', label: 'Desempenho Geral', hint: 'Sessões, usuários, conversões', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'wa.desempenhoPorCanal', label: 'Por Canal', hint: 'Canais de aquisição', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'wa.etapasDoFunilGeral', label: 'Funil Geral', hint: 'Etapas do funil', kind: 'action' as const, icon: <LineChart className="w-4 h-4" /> },
        { id: 'wa.desempenhoPorDiaHora', label: 'Por Dia/Hora', hint: 'Heatmap temporal', kind: 'action' as const, icon: <Clock4 className="w-4 h-4" /> },
        { id: 'wa.desempenhoMobileVsDesktop', label: 'Mobile vs Desktop', hint: 'Comparativo por device', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'wa.contribuicaoPorPagina', label: 'Contribuição por Página', hint: 'Impacto em conversões', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
        { id: 'wa.ltvMedio', label: 'LTV médio', hint: 'Lifetime Value médio', kind: 'action' as const, icon: <Calculator className="w-4 h-4" /> },
        { id: 'wa.visitantesRecorrentes', label: 'Visitantes Recorrentes', hint: 'Fidelidade', kind: 'action' as const, icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      id: 'marketing-pago',
      name: 'Tráfego Pago',
      connectors: [
        { id: 'pt.getPaidTrafficData', label: 'Dados de Ads', hint: 'Carga e filtros', kind: 'action' as const, icon: <Megaphone className="w-4 h-4" /> },
        { id: 'pt.compareAdsPlatforms', label: 'Comparar Plataformas', hint: 'Google vs Meta...', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'pt.analyzeCreativePerformance', label: 'Performance de Criativos', hint: 'Anúncios e variações', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
        { id: 'pt.analiseDeCampanhas', label: 'Análise de Campanhas', hint: 'KPIs por campanha', kind: 'action' as const, icon: <Megaphone className="w-4 h-4" /> },
        { id: 'pt.desempenhoPorGrupoDeAnuncio', label: 'Por Grupo de Anúncio', hint: 'Ad sets', kind: 'action' as const, icon: <Megaphone className="w-4 h-4" /> },
        { id: 'pt.desempenhoPorDiaDaSemana', label: 'Por Dia da Semana', hint: 'Ritmo semanal', kind: 'action' as const, icon: <Clock4 className="w-4 h-4" /> },
      ],
    },
    {
      id: 'marketing-organico',
      name: 'Marketing Orgânico',
      connectors: [
        { id: 'om.getOrganicMarketingData', label: 'Dados Orgânicos', hint: 'Carga geral', kind: 'action' as const, icon: <Megaphone className="w-4 h-4" /> },
        { id: 'om.desempenhoPorConta', label: 'Desempenho por Conta', hint: 'Por perfil', kind: 'action' as const, icon: <Users className="w-4 h-4" /> },
        { id: 'om.desempenhoPorPlataforma', label: 'Por Plataforma', hint: 'Redes sociais', kind: 'action' as const, icon: <Megaphone className="w-4 h-4" /> },
        { id: 'om.desempenhoPorFormatoPost', label: 'Por Formato', hint: 'Vídeos, carrossel...', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
        { id: 'om.rankingPorPublicacao', label: 'Ranking por Publicação', hint: 'Top conteúdos', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'om.engajamentoPorDiaHora', label: 'Engajamento Dia/Hora', hint: 'Melhores horários', kind: 'action' as const, icon: <Clock4 className="w-4 h-4" /> },
      ],
    },
    {
      id: 'inventario',
      name: 'Inventário & Estoque',
      connectors: [
        { id: 'inv.avaliacaoCustoInventario', label: 'Custo de Inventário', hint: 'Valor imobilizado', kind: 'action' as const, icon: <Database className="w-4 h-4" /> },
        { id: 'inv.calculateInventoryMetrics', label: 'KPIs de Inventário', hint: 'Turnover, cobertura, ruptura', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'inv.abcDetalhadaProduto', label: 'ABC Detalhada', hint: 'Classe A/B/C por receita', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'inv.analiseDOS', label: 'Dias de Estoque (DOS)', hint: 'Cobertura por SKU', kind: 'action' as const, icon: <Clock4 className="w-4 h-4" /> },
        { id: 'inv.abcResumoGerencial', label: 'ABC Resumo', hint: 'Resumo gerencial ABC', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'inv.desempenhoPorDepositoExpedicoes', label: 'Desempenho por Depósito', hint: 'Expedições e ticket', kind: 'action' as const, icon: <Store className="w-4 h-4" /> },
        { id: 'inv.analiseGiroEstoque', label: 'Giro de Estoque', hint: 'Vendas ÷ estoque', kind: 'action' as const, icon: <LineChart className="w-4 h-4" /> },
      ],
    },
    {
      id: 'fiscal',
      name: 'Fiscal',
      connectors: [
        { id: 'fisc.getNotasFiscais', label: 'Notas Fiscais', hint: 'Consulta de NF-e', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      id: 'projetos',
      name: 'Projetos',
      connectors: [
        { id: 'proj.getProjetosData', label: 'Projetos', hint: 'Panorama e KPIs', kind: 'action' as const, icon: <Briefcase className="w-4 h-4" /> },
      ],
    },
    {
      id: 'funcionarios',
      name: 'Funcionários / RH',
      connectors: [
        { id: 'rh.funcionarios', label: 'Funcionários', hint: 'Consultas de RH', kind: 'action' as const, icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      id: 'apps-dados',
      name: 'Apps & Dados',
      connectors: [
        { id: 'ad.getTables', label: 'BigQuery: Tabelas', hint: 'Descoberta de dados', kind: 'action' as const, icon: <Database className="w-4 h-4" /> },
        { id: 'ad.getTableSchema', label: 'BigQuery: Schema', hint: 'Estrutura de tabela', kind: 'action' as const, icon: <Database className="w-4 h-4" /> },
        { id: 'ad.executarSQL', label: 'Executar SQL', hint: 'Consulta no BigQuery', kind: 'action' as const, icon: <Code className="w-4 h-4" /> },
        { id: 'ad.gerarGrafico', label: 'Gerar Gráfico', hint: 'Visualização', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'ad.gerarMultiplosGraficos', label: 'Múltiplos Gráficos', hint: 'Várias visualizações', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'ad.gerarInsights', label: 'Gerar Insights', hint: 'Insights automáticos', kind: 'action' as const, icon: <Lightbulb className="w-4 h-4" /> },
        { id: 'ad.gerarAlertas', label: 'Gerar Alertas', hint: 'Alertas de dados', kind: 'action' as const, icon: <Bell className="w-4 h-4" /> },
        { id: 'ad.retrieveResult', label: 'Busca Semântica', hint: 'RAG / resultados', kind: 'action' as const, icon: <Search className="w-4 h-4" /> },
        { id: 'ad.createDashboardTool', label: 'Criar Dashboard', hint: 'Geração de painel', kind: 'action' as const, icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
    {
      id: 'automacoes',
      name: 'Automações',
      connectors: [
        { id: 'auto.findFornecedor', label: 'Encontrar Fornecedor', hint: 'Busca por CNPJ/nome', kind: 'action' as const, icon: <Search className="w-4 h-4" /> },
        { id: 'auto.createFornecedor', label: 'Criar Fornecedor', hint: 'Cadastro via OCR', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
        { id: 'auto.createContaAPagar', label: 'Criar Conta a Pagar', hint: 'A partir de fatura', kind: 'action' as const, icon: <Wallet className="w-4 h-4" /> },
        { id: 'auto.automationSummary', label: 'Resumo da Automação', hint: 'Status do fluxo', kind: 'action' as const, icon: <FileText className="w-4 h-4" /> },
      ],
    },
  ],
}

export const flatAllConnectors = () => [
  ...catalog.actionBlocks.map((c) => ({ ...c, provider: 'Action Blocks' })),
  ...catalog.providers.flatMap((p) => p.connectors.map((c) => ({ ...c, provider: p.name }))),
]

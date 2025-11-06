import { Database, Globe, Mail, Bot, Cloud, FileText, Image, Sparkles, Plug, Server, MessageSquare, FlaskConical, TrendingUp, Package, Truck, Users, Receipt, FileSpreadsheet, ShoppingCart, BarChart3, ClipboardList, KanbanSquare, BadgeDollarSign, Calendar } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ToolMeta = {
  id: string
  name: string
  description: string
  category: string
  icon: LucideIcon
}

// Categorias = Agentes de /claudeAgents
export const TOOL_CATEGORIES = [
  'Web Analytics',
  'Tráfego Pago',
  'Marketing Orgânico',
  'Vendas',
  'E-commerce Sales',
  'E-commerce Sales V2',
  'Vendas B2B',
  'Contas a Receber',
  'Receipts',
  'Contabilidade',
  'NF-e',
  'Logística',
  'Estoque',
  'Compras',
  'Projetos',
  'Serviços',
  'CRM',
  'Funcionários',
  'Automação',
  'Geral',
] as const

export const TOOLS_MOCK: ToolMeta[] = [
  // Web Analytics
  { id: 'getAnalyticsData', name: 'getAnalyticsData', description: 'Consulta dados analíticos (DW) para análises e dashboards.', category: 'Web Analytics', icon: BarChart3 },
  { id: 'createDashboardTool', name: 'createDashboardTool', description: 'Cria dashboards a partir de consultas e resultados.', category: 'Web Analytics', icon: BarChart3 },

  // Tráfego Pago
  { id: 'analyzeCampaigns', name: 'analyzeCampaigns', description: 'Sumariza desempenho de campanhas pagas.', category: 'Tráfego Pago', icon: TrendingUp },
  { id: 'budgetAllocator', name: 'budgetAllocator', description: 'Sugere alocação de orçamento por canal.', category: 'Tráfego Pago', icon: BadgeDollarSign },

  // Marketing Orgânico
  { id: 'listPosts', name: 'listPosts', description: 'Lista publicações e engajamento por período.', category: 'Marketing Orgânico', icon: MessageSquare },
  { id: 'listAccounts', name: 'listAccounts', description: 'Lista contas sociais e KPIs.', category: 'Marketing Orgânico', icon: Users },

  // Vendas / E-commerce
  { id: 'salesOverview', name: 'salesOverview', description: 'Resumo de vendas (faturamento, tickets, itens).', category: 'Vendas', icon: ShoppingCart },
  { id: 'productPerformance', name: 'productPerformance', description: 'Ranking de produtos por receita e margem.', category: 'Vendas', icon: Package },
  { id: 'ecomSalesOverview', name: 'ecomSalesOverview', description: 'Resumo de vendas e-commerce.', category: 'E-commerce Sales', icon: ShoppingCart },
  { id: 'ecomSalesV2', name: 'ecomSalesV2', description: 'Variações do resumo de vendas e-commerce.', category: 'E-commerce Sales V2', icon: ShoppingCart },
  { id: 'b2bOrders', name: 'b2bOrders', description: 'Pedidos de vendas B2B.', category: 'Vendas B2B', icon: ClipboardList },

  // Financeiro
  { id: 'listarContasAReceber', name: 'listarContasAReceber', description: 'Listagem de títulos a receber.', category: 'Contas a Receber', icon: FileSpreadsheet },
  { id: 'listarReceipts', name: 'listarReceipts', description: 'Listagem de comprovantes/recibos.', category: 'Receipts', icon: Receipt },
  { id: 'listarLancamentosContabeis', name: 'listarLancamentosContabeis', description: 'Consulta lançamentos contábeis.', category: 'Contabilidade', icon: FileSpreadsheet },
  { id: 'gerarDRE', name: 'gerarDRE', description: 'Gera Demonstrativo de Resultados do Exercício.', category: 'Contabilidade', icon: FileText },
  { id: 'gerarBalancoPatrimonial', name: 'gerarBalancoPatrimonial', description: 'Gera Balanço Patrimonial.', category: 'Contabilidade', icon: FileText },
  { id: 'listarNFe', name: 'listarNFe', description: 'Listagem de notas fiscais eletrônicas.', category: 'NF-e', icon: FileText },

  // Operações
  { id: 'shipmentsList', name: 'shipmentsList', description: 'Listagem de remessas/entregas.', category: 'Logística', icon: Truck },
  { id: 'trackShipment', name: 'trackShipment', description: 'Rastreamento de remessas.', category: 'Logística', icon: Truck },
  { id: 'listInventory', name: 'listInventory', description: 'Consulta estoque atual por produto/almoxarifado.', category: 'Estoque', icon: Package },
  { id: 'updateStock', name: 'updateStock', description: 'Ajuste de estoque (entrada/saída).', category: 'Estoque', icon: Package },
  { id: 'fornecedores', name: 'fornecedores', description: 'Lista de fornecedores.', category: 'Compras', icon: Package },
  { id: 'pedidosCompra', name: 'pedidosCompra', description: 'Pedidos de compra.', category: 'Compras', icon: Package },
  { id: 'projetos', name: 'projetos', description: 'Listagem de projetos.', category: 'Projetos', icon: KanbanSquare },
  { id: 'listarOrdensDeServico', name: 'listarOrdensDeServico', description: 'Ordens de serviço com filtros.', category: 'Serviços', icon: ClipboardList },
  { id: 'listarTecnicos', name: 'listarTecnicos', description: 'Técnicos e agregados.', category: 'Serviços', icon: Users },
  { id: 'listarAgendamentos', name: 'listarAgendamentos', description: 'Agenda e atribuição.', category: 'Serviços', icon: Calendar },
  { id: 'listarCatalogoDeServicos', name: 'listarCatalogoDeServicos', description: 'Itens do catálogo.', category: 'Serviços', icon: ClipboardList },

  // CRM & RH
  { id: 'oportunidades', name: 'oportunidades', description: 'Oportunidades de vendas (funil).', category: 'CRM', icon: Users },
  { id: 'atividadesCRM', name: 'atividadesCRM', description: 'Atividades/interações CRM.', category: 'CRM', icon: MessageSquare },
  { id: 'listarFuncionarios', name: 'listarFuncionarios', description: 'Listagem de funcionários.', category: 'Funcionários', icon: Users },
  { id: 'listarDepartamentos', name: 'listarDepartamentos', description: 'Departamentos e equipes.', category: 'Funcionários', icon: Users },

  // Automação / Geral
  { id: 'executarAutomacao', name: 'executarAutomacao', description: 'Ações de automação e rotinas.', category: 'Automação', icon: Sparkles },
  { id: 'assistant', name: 'assistant', description: 'Assistente geral (sem tools).', category: 'Geral', icon: Bot },

  // Agent Builder (teste)
  { id: 'echoTool', name: 'echoTool', description: 'Teste: ecoa a mensagem informada.', category: 'Geral', icon: MessageSquare },
  { id: 'sumTool', name: 'sumTool', description: 'Teste: soma números fornecidos.', category: 'Geral', icon: BarChart3 },
  { id: 'pickFieldsTool', name: 'pickFieldsTool', description: 'Teste: extrai campos de um objeto.', category: 'Geral', icon: ClipboardList },
]

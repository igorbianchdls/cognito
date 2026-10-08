import {
  IconAddressBook,
  IconCashBanknote,
  IconClipboardList,
  IconHomeStats,
  IconPackages,
  IconReportAnalytics,
  IconShoppingBag,
} from '@tabler/icons-react'

import type { ErpModuleId, ErpNavigationItem, ErpSectionId } from '@/products/erp/shared/types'
import { isRetiredErpReport } from './reportCatalog'
import { DASHBOARDS, DASHBOARD_IDS } from './dashboardContracts'

export const ERP_DEFAULT_SECTION: ErpSectionId = 'overview'
export const ERP_DEFAULT_MODULE: ErpModuleId = 'overview'

const navigation: ErpNavigationItem[] = [
  {
    id: 'overview', label: 'Visão geral', href: '/erp', icon: IconHomeStats,
    description: 'Resumo operacional do ERP.', modules: [],
  },
  {
    id: 'dashboards', label: 'Dashboards', href: '/erp/dashboards/visao-geral', icon: IconReportAnalytics,
    description: 'Indicadores e análises da empresa.', modules: DASHBOARD_IDS.map(id=>({id,label:DASHBOARDS[id].title,href:'/erp/dashboards/'+id,description:DASHBOARDS[id].description})),
  },
  {
    id: 'cadastros', label: 'Cadastros', href: '/erp/cadastros/clientes', icon: IconAddressBook,
    description: 'Clientes, fornecedores, produtos e tabelas auxiliares.',
    modules: [
      { id: 'clientes', label: 'Clientes', href: '/erp/cadastros/clientes', description: 'Base comercial e fiscal de clientes.' },
      { id: 'fornecedores', label: 'Fornecedores', href: '/erp/cadastros/fornecedores', description: 'Parceiros de compra, serviços e operação.' },
      { id: 'vendedores', label: 'Vendedores', href: '/erp/cadastros/vendedores', description: 'Responsáveis comerciais das vendas.' },
      { id: 'produtos', label: 'Produtos', href: '/erp/cadastros/produtos', description: 'SKUs, preços e categorias.' },
      { id: 'servicos', label: 'Serviços', href: '/erp/cadastros/servicos', description: 'Serviços vendidos, preços e classificação.' },
      { id: 'categorias', label: 'Categorias financeiras', href: '/erp/cadastros/categorias', description: 'Receitas e despesas e o grupo da DRE de cada uma.' },
      { id: 'categorias-cadastro', label: 'Categorias de cadastro', href: '/erp/cadastros/categorias-cadastro', description: 'Agrupamentos de produtos, serviços, clientes e fornecedores.' },
      { id: 'importacoes', label: 'Importar e exportar', href: '/erp/cadastros/importacoes', description: 'Movimentação de cadastros por CSV.' },
    ],
  },
  {
    id: 'vendas', label: 'Vendas', href: '/erp/vendas/pedidos', icon: IconShoppingBag,
    description: 'Pedidos, contratos, atendimento e emissão fiscal.',
    modules: [
      { id: 'orcamentos', label: 'Orçamentos', href: '/erp/vendas/orcamentos', description: 'Propostas comerciais e conversão em venda.' },
      { id: 'pedidos', label: 'Pedidos', href: '/erp/vendas/pedidos', description: 'Pedidos de venda e acompanhamento.' },
      { id: 'ordens-servico', label: 'Ordens de serviço', href: '/erp/vendas/ordens-servico', description: 'Execução de serviços, equipamentos e histórico.' },
      { id: 'contratos', label: 'Contratos', href: '/erp/vendas/contratos', description: 'Vendas recorrentes e geracoes.' },
      {id:'notas-fiscais',label:'Notas de serviço',href:'/erp/vendas/notas-fiscais',description:'NFS-e simuladas, revisão, histórico e PDF demonstrativo.'},
      { id: 'devolucoes', label: 'Devoluções', href: '/erp/vendas/devolucoes', description: 'Devoluções de venda, abatimentos, créditos e reembolsos.' },
      { id: 'tabelas-preco', label: 'Tabelas de preço', href: '/erp/vendas/tabelas-preco', description: 'Preços por cliente, faixa de quantidade, mínimo e desconto máximo.' },
      { id: 'metas-vendas', label: 'Metas', href: '/erp/vendas/metas-vendas', description: 'Metas de venda por mês e vendedor, com atingimento.' },
      { id: 'gestao-comissoes', label: 'Comissões', href: '/erp/vendas/gestao-comissoes', description: 'Regras, comissões liberadas e pagamento aos vendedores.' },
    ],
  },
  {
    id: 'compras', label: 'Compras', href: '/erp/compras/pedidos-compra', icon: IconClipboardList,
    description: 'Ciclo de compras e recebimentos.',
    modules: [
      { id: 'pedidos-compra', label: 'Compras', href: '/erp/compras/pedidos-compra', description: 'Cotacoes, pedidos e compras efetivas.' },
      { id: 'parcelas-a-pagar', label: 'Parcelas a pagar', href: '/erp/compras/parcelas-a-pagar', description: 'Parcelas originadas de compras.' },
      { id: 'notas-compra', label: 'Notas de compra', href: '/erp/compras/notas-compra', description: 'NF-e recebidas e vinculacoes.' },
    ],
  },
  {
    id: 'estoque', label: 'Estoque', href: '/erp/estoque/posicao-estoque', icon: IconPackages,
    description: 'Saldos, reservas, movimentos e inventários.',
    modules: [
      { id: 'posicao-estoque', label: 'Situação', href: '/erp/estoque/posicao-estoque', description: 'Saldo e disponibilidade por local.' },
      { id: 'movimentacoes', label: 'Movimentações', href: '/erp/estoque/movimentacoes', description: 'Extrato imutavel de estoque.' },
      { id: 'inventarios', label: 'Inventários', href: '/erp/estoque/inventarios', description: 'Contagens e ajustes.' },
      { id: 'locais-estoque', label: 'Locais', href: '/erp/estoque/locais-estoque', description: 'Depositos, lojas e pontos de estoque.' },
      { id: 'transferencias', label: 'Transferências', href: '/erp/estoque/transferencias', description: 'Movimentos entre locais.' },
      { id: 'kits', label: 'Kits', href: '/erp/estoque/kits', description: 'Composicao de produtos.' },
      { id: 'conversoes-unidades', label: 'Conversões', href: '/erp/estoque/conversoes-unidades', description: 'Conversão entre unidades de compra e estoque.' },
    ],
  },
  {
    id: 'financeiro', label: 'Financeiro', href: '/erp/financeiro/contas-a-receber', icon: IconCashBanknote,
    description: 'Recebimentos, pagamentos, bancos e caixa.',
    modules: [
      { id: 'contas-a-receber', label: 'Contas a receber', href: '/erp/financeiro/contas-a-receber', description: 'Títulos e cobranças.' },
      { id: 'contas-a-pagar', label: 'Contas a pagar', href: '/erp/financeiro/contas-a-pagar', description: 'Compromissos e vencimentos.' },
      { id: 'contas-financeiras', label: 'Contas financeiras', href: '/erp/financeiro/contas-financeiras', description: 'Caixas, bancos, carteiras e cartoes.' },
      { id: 'conciliacao-bancaria', label: 'Conciliação', href: '/erp/financeiro/conciliacao-bancaria', description: 'Extrato e lançamentos financeiros.' },
      { id: 'transferencias-financeiras', label: 'Transferências', href: '/erp/financeiro/transferencias-financeiras', description: 'Movimentos entre contas.' },
      { id: 'orcamento', label: 'Orçamento', href: '/erp/financeiro/orcamento', description: 'Orçamento anual por categoria e mês.' },
      { id: 'formas-pagamento', label: 'Formas de pagamento', href: '/erp/financeiro/formas-pagamento', description: 'Pix, boleto, cartão e a conta da maquininha (taxa e repasse).' },
      { id: 'fechamentos', label: 'Fechamentos', href: '/erp/financeiro/fechamentos', description: 'Bloqueio e reabertura de períodos operacionais.' },
    ],
  },
  {
    id: 'relatorios', label: 'Relatórios', href: '/erp/relatorios/dre', icon: IconReportAnalytics,
    description: 'Indicadores gerenciais do ERP.',
    modules: [
      { id: 'dre', label: 'DRE', href: '/erp/relatorios/dre', description: 'Resultado pelos grupos da DRE, por competência ou caixa.' },
      { id: 'fluxo-de-caixa', label: 'Fluxo de caixa', href: '/erp/relatorios/fluxo-de-caixa', description: 'Entradas e saídas realizadas e previstas, com saldo acumulado.' },
      { id: 'contas-em-atraso', label: 'Contas em atraso', href: '/erp/relatorios/contas-em-atraso', description: 'Quem deve à empresa e a quem a empresa deve, por faixa de atraso.' },
      { id: 'margem', label: 'Margem', href: '/erp/relatorios/margem', description: 'Quanto sobra por venda, produto/serviço e cliente depois do custo.' },
      { id: 'orcado-realizado', label: 'Orçado × realizado', href: '/erp/relatorios/orcado-realizado', description: 'Orçamento anual comparado ao realizado, na estrutura da DRE.' },
      { id: 'vendas', label: 'Vendas', href: '/erp/relatorios/vendas', description: 'Vendas por cliente, vendedor ou produto/serviço.' },
      { id: 'compras', label: 'Compras', href: '/erp/relatorios/compras', description: 'Compras por fornecedor ou categoria.' },
    ],
  },
]

export const ERP_NAVIGATION: ErpNavigationItem[] = navigation.map(section => ({
  ...section,
  modules: section.modules.filter(module => !isRetiredErpReport(module.id) && module.id !== 'automacoes'),
}))
ERP_NAVIGATION.find(section => section.id === 'cadastros')!.modules.push({
  id: 'automacoes', label: 'Rotinas e recorrências', href: '/erp/cadastros/automacoes', description: 'Execuções, resultados e próximas ocorrências.',
})

export function getErpSection(sectionId?: string) {
  return ERP_NAVIGATION.find((section) => section.id === sectionId) ?? ERP_NAVIGATION[0]
}

export function getErpModule(sectionId?: string, moduleId?: string) {
  const section = getErpSection(sectionId)
  if (section.id === 'overview') return undefined
  return section.modules.find((module) => module.id === moduleId) ?? section.modules[0]
}

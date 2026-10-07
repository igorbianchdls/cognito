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
      { id: 'categorias', label: 'Categorias', href: '/erp/cadastros/categorias', description: 'Classificação para produtos e relatórios.' },
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
      { id: 'fechamentos', label: 'Fechamentos', href: '/erp/financeiro/fechamentos', description: 'Bloqueio e reabertura de períodos operacionais.' },
    ],
  },
  {
    id: 'relatorios', label: 'Relatórios', href: '/erp/relatorios/posicao-financeira', icon: IconReportAnalytics,
    description: 'Indicadores gerenciais do ERP.',
    modules: [
      { id: 'fluxo-de-caixa', label: 'Fluxo de caixa', href: '/erp/relatorios/fluxo-de-caixa', description: 'Entradas e saídas realizadas e previstas, com saldo acumulado.' },
      { id: 'aging-receber', label: 'Recebimentos em atraso', href: '/erp/relatorios/aging-receber', description: 'Saldo a receber por cliente e faixa de atraso.' },
      { id: 'aging-pagar', label: 'Pagamentos em atraso', href: '/erp/relatorios/aging-pagar', description: 'Saldo a pagar por fornecedor e faixa de atraso.' },
      { id: 'dre-competencia', label: 'Resultado por competência', href: '/erp/relatorios/dre-competencia', description: 'Receitas e despesas pela competência dos títulos.' },
      { id: 'dre-caixa', label: 'Resultado dos pagamentos', href: '/erp/relatorios/dre-caixa', description: 'Recebimentos, pagamentos e estornos por data e categoria.' },
      { id: 'posicao-financeira', label: 'Posição financeira', href: '/erp/relatorios/posicao-financeira', description: 'Títulos a pagar e receber por situação.' },
      { id: 'vendas-clientes', label: 'Vendas por cliente', href: '/erp/relatorios/vendas-clientes', description: 'Receita e volume por cliente.' },
      { id: 'vendas-vendedores', label: 'Vendas por vendedor', href: '/erp/relatorios/vendas-vendedores', description: 'Receita e volume por responsável.' },
      { id: 'vendas-produtos', label: 'Vendas por produto', href: '/erp/relatorios/vendas-produtos', description: 'Quantidade e receita por item vendido.' },
      { id: 'compras-fornecedores', label: 'Compras por fornecedor', href: '/erp/relatorios/compras-fornecedores', description: 'Compras e volume por fornecedor.' },
      { id: 'compras-categorias', label: 'Compras por categoria', href: '/erp/relatorios/compras-categorias', description: 'Despesas agrupadas por categoria.' },
      { id: 'giro-estoque', label: 'Saídas e estoque atual', href: '/erp/relatorios/giro-estoque', description: 'Movimentos negativos em 90 dias e saldo atual.' },
      { id: 'valor-estoque', label: 'Valor do estoque', href: '/erp/relatorios/valor-estoque', description: 'Posição valorizada por produto e local.' },
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

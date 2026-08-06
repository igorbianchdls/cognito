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

export const ERP_DEFAULT_SECTION: ErpSectionId = 'overview'
export const ERP_DEFAULT_MODULE: ErpModuleId = 'overview'

export const ERP_NAVIGATION: ErpNavigationItem[] = [
  {
    id: 'overview', label: 'Visao geral', href: '/erp', icon: IconHomeStats,
    description: 'Resumo operacional do ERP.', modules: [],
  },
  {
    id: 'cadastros', label: 'Cadastros', href: '/erp/cadastros/clientes', icon: IconAddressBook,
    description: 'Clientes, fornecedores, produtos e tabelas auxiliares.',
    modules: [
      { id: 'clientes', label: 'Clientes', href: '/erp/cadastros/clientes', description: 'Base comercial e fiscal de clientes.' },
      { id: 'fornecedores', label: 'Fornecedores', href: '/erp/cadastros/fornecedores', description: 'Parceiros de compra, servicos e operacao.' },
      { id: 'produtos', label: 'Produtos', href: '/erp/cadastros/produtos', description: 'SKUs, precos e categorias.' },
      { id: 'servicos', label: 'Servicos', href: '/erp/cadastros/servicos', description: 'Servicos vendidos, precos e classificacao.' },
      { id: 'categorias', label: 'Categorias', href: '/erp/cadastros/categorias', description: 'Classificacao para produtos e relatorios.' },
      { id: 'importacoes', label: 'Importar e exportar', href: '/erp/cadastros/importacoes', description: 'Movimentacao de cadastros por CSV.' },
    ],
  },
  {
    id: 'vendas', label: 'Vendas', href: '/erp/vendas/pedidos', icon: IconShoppingBag,
    description: 'Pedidos, contratos e faturamento.',
    modules: [
      { id: 'pedidos', label: 'Pedidos', href: '/erp/vendas/pedidos', description: 'Pedidos de venda e acompanhamento.' },
      { id: 'contratos', label: 'Contratos', href: '/erp/vendas/contratos', description: 'Vendas recorrentes e geracoes.' },
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
    description: 'Saldos, reservas, movimentos e inventarios.',
    modules: [
      { id: 'posicao-estoque', label: 'Situacao', href: '/erp/estoque/posicao-estoque', description: 'Saldo e disponibilidade por local.' },
      { id: 'movimentacoes', label: 'Movimentacoes', href: '/erp/estoque/movimentacoes', description: 'Extrato imutavel de estoque.' },
      { id: 'inventarios', label: 'Inventarios', href: '/erp/estoque/inventarios', description: 'Contagens e ajustes.' },
      { id: 'locais-estoque', label: 'Locais', href: '/erp/estoque/locais-estoque', description: 'Depositos, lojas e pontos de estoque.' },
      { id: 'transferencias', label: 'Transferencias', href: '/erp/estoque/transferencias', description: 'Movimentos entre locais.' },
      { id: 'kits', label: 'Kits', href: '/erp/estoque/kits', description: 'Composicao de produtos.' },
      { id: 'conversoes-unidades', label: 'Conversoes', href: '/erp/estoque/conversoes-unidades', description: 'Conversao entre unidades de compra e estoque.' },
    ],
  },
  {
    id: 'financeiro', label: 'Financeiro', href: '/erp/financeiro/contas-a-receber', icon: IconCashBanknote,
    description: 'Recebimentos, pagamentos, bancos e caixa.',
    modules: [
      { id: 'contas-a-receber', label: 'Contas a receber', href: '/erp/financeiro/contas-a-receber', description: 'Titulos e cobrancas.' },
      { id: 'contas-a-pagar', label: 'Contas a pagar', href: '/erp/financeiro/contas-a-pagar', description: 'Compromissos e vencimentos.' },
      { id: 'contas-financeiras', label: 'Contas financeiras', href: '/erp/financeiro/contas-financeiras', description: 'Caixas, bancos, carteiras e cartoes.' },
      { id: 'fluxo-de-caixa', label: 'Fluxo de caixa', href: '/erp/financeiro/fluxo-de-caixa', description: 'Entradas, saidas e saldo diario.' },
      { id: 'conciliacao-bancaria', label: 'Conciliacao', href: '/erp/financeiro/conciliacao-bancaria', description: 'Extrato e lancamentos financeiros.' },
      { id: 'transferencias-financeiras', label: 'Transferencias', href: '/erp/financeiro/transferencias-financeiras', description: 'Movimentos entre contas.' },
    ],
  },
  {
    id: 'relatorios', label: 'Relatorios', href: '/erp/relatorios/dre', icon: IconReportAnalytics,
    description: 'Indicadores gerenciais do ERP.',
    modules: [
      { id: 'dre', label: 'DRE', href: '/erp/relatorios/dre', description: 'Resultado por competencia e categoria.' },
      { id: 'aging-receber', label: 'Aging a receber', href: '/erp/relatorios/aging-receber', description: 'Faixas de atraso de clientes.' },
      { id: 'aging-pagar', label: 'Aging a pagar', href: '/erp/relatorios/aging-pagar', description: 'Faixas de atraso de fornecedores.' },
      { id: 'giro-estoque', label: 'Giro de estoque', href: '/erp/relatorios/giro-estoque', description: 'Saidas e giro em 90 dias.' },
    ],
  },
]

export function getErpSection(sectionId?: string) {
  return ERP_NAVIGATION.find((section) => section.id === sectionId) ?? ERP_NAVIGATION[0]
}

export function getErpModule(sectionId?: string, moduleId?: string) {
  const section = getErpSection(sectionId)
  if (section.id === 'overview') return undefined
  return section.modules.find((module) => module.id === moduleId) ?? section.modules[0]
}

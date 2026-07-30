import {
  IconAddressBook,
  IconBuildingWarehouse,
  IconCashBanknote,
  IconClipboardList,
  IconHomeStats,
  IconShoppingBag,
} from '@tabler/icons-react'

import type { ErpModuleId, ErpNavigationItem, ErpSectionId } from '@/products/erp/shared/types'

export const ERP_DEFAULT_SECTION: ErpSectionId = 'overview'
export const ERP_DEFAULT_MODULE: ErpModuleId = 'overview'

export const ERP_NAVIGATION: ErpNavigationItem[] = [
  {
    id: 'overview',
    label: 'Visao geral',
    href: '/erp',
    icon: IconHomeStats,
    description: 'Resumo operacional do ERP.',
    modules: [],
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    href: '/erp/cadastros/clientes',
    icon: IconAddressBook,
    description: 'Clientes, fornecedores, produtos e tabelas auxiliares.',
    modules: [
      { id: 'clientes', label: 'Clientes', href: '/erp/cadastros/clientes', description: 'Base comercial e fiscal de clientes.' },
      { id: 'fornecedores', label: 'Fornecedores', href: '/erp/cadastros/fornecedores', description: 'Parceiros de compra, servicos e operacao.' },
      { id: 'produtos', label: 'Produtos', href: '/erp/cadastros/produtos', description: 'SKUs, precos, categorias e saldos.' },
      { id: 'servicos', label: 'Servicos', href: '/erp/cadastros/servicos', description: 'Servicos vendidos, precos e classificacao.' },
      { id: 'categorias', label: 'Categorias', href: '/erp/cadastros/categorias', description: 'Classificacao para produtos e relatórios.' },
    ],
  },
  {
    id: 'vendas',
    label: 'Vendas',
    href: '/erp/vendas/pedidos',
    icon: IconShoppingBag,
    description: 'Pedidos, orcamentos e faturamento.',
    modules: [
      { id: 'pedidos', label: 'Pedidos', href: '/erp/vendas/pedidos', description: 'Pedidos de venda e acompanhamento.' },
      { id: 'orcamentos', label: 'Orcamentos', href: '/erp/vendas/orcamentos', description: 'Propostas antes da aprovacao.' },
      { id: 'notas-fiscais', label: 'Notas fiscais', href: '/erp/vendas/notas-fiscais', description: 'Emissao e status fiscal.' },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    href: '/erp/compras/pedidos-compra',
    icon: IconClipboardList,
    description: 'Ciclo de compras e recebimentos.',
    modules: [
      { id: 'pedidos-compra', label: 'Pedidos de compra', href: '/erp/compras/pedidos-compra', description: 'Compras em andamento.' },
      { id: 'cotacoes', label: 'Cotacoes', href: '/erp/compras/cotacoes', description: 'Comparacao de fornecedores.' },
      { id: 'recebimentos', label: 'Recebimentos', href: '/erp/compras/recebimentos', description: 'Entradas aguardando conferencia.' },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque',
    href: '/erp/estoque/movimentacoes',
    icon: IconBuildingWarehouse,
    description: 'Saldos, movimentos e inventarios.',
    modules: [
      { id: 'movimentacoes', label: 'Movimentacoes', href: '/erp/estoque/movimentacoes', description: 'Entradas, saidas e ajustes.' },
      { id: 'inventario', label: 'Inventario', href: '/erp/estoque/inventario', description: 'Contagens e divergencias.' },
      { id: 'transferencias', label: 'Transferencias', href: '/erp/estoque/transferencias', description: 'Movimentos entre locais.' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    href: '/erp/financeiro/contas-a-receber',
    icon: IconCashBanknote,
    description: 'Recebimentos, pagamentos e caixa.',
    modules: [
      { id: 'contas-a-receber', label: 'Contas a receber', href: '/erp/financeiro/contas-a-receber', description: 'Titulos e cobrancas.' },
      { id: 'contas-a-pagar', label: 'Contas a pagar', href: '/erp/financeiro/contas-a-pagar', description: 'Compromissos e vencimentos.' },
      { id: 'contas-financeiras', label: 'Contas financeiras', href: '/erp/financeiro/contas-financeiras', description: 'Caixas, bancos, carteiras e cartoes.' },
      { id: 'fluxo-de-caixa', label: 'Fluxo de caixa', href: '/erp/financeiro/fluxo-de-caixa', description: 'Entradas, saidas e previsao.' },
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

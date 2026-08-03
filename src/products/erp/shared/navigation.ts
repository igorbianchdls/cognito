import {
  IconAddressBook,
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
      { id: 'produtos', label: 'Produtos', href: '/erp/cadastros/produtos', description: 'SKUs, precos e categorias.' },
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
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    href: '/erp/compras/pedidos-compra',
    icon: IconClipboardList,
    description: 'Ciclo de compras e recebimentos.',
    modules: [
      { id: 'pedidos-compra', label: 'Compras', href: '/erp/compras/pedidos-compra', description: 'Cotacoes, pedidos e compras efetivas.' },
      { id: 'parcelas-a-pagar', label: 'Parcelas a pagar', href: '/erp/compras/parcelas-a-pagar', description: 'Parcelas originadas de compras.' },
      { id: 'notas-compra', label: 'Notas de compra', href: '/erp/compras/notas-compra', description: 'NF-e recebidas e vinculacoes.' },
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

import type { ComponentType, CSSProperties } from 'react'

export type ErpSectionId = 'overview' | 'cadastros' | 'vendas' | 'compras' | 'estoque' | 'financeiro' | 'relatorios'

export type ErpModuleId =
  | 'overview'
  | 'clientes'
  | 'fornecedores'
  | 'produtos'
  | 'servicos'
  | 'categorias'
  | 'pedidos'
  | 'orcamentos'
  | 'notas-fiscais'
  | 'contratos'
  | 'ordens-servico'
  | 'pedidos-compra'
  | 'cotacoes'
  | 'recebimentos'
  | 'parcelas-a-pagar'
  | 'notas-compra'
  | 'movimentacoes'
  | 'inventario'
  | 'inventarios'
  | 'posicao-estoque'
  | 'locais-estoque'
  | 'transferencias'
  | 'kits'
  | 'conversoes-unidades'
  | 'contas-a-receber'
  | 'contas-a-pagar'
  | 'contas-financeiras'
  | 'fluxo-de-caixa'
  | 'conciliacao-bancaria'
  | 'transferencias-financeiras'
  | 'fechamentos'
  | 'importacoes'
  | 'dre'
  | 'aging-receber'
  | 'aging-pagar'
  | 'giro-estoque'
  | 'dre-caixa'
  | 'fluxo-diario'
  | 'fluxo-mensal'
  | 'posicao-financeira'
  | 'vendas-clientes'
  | 'vendas-vendedores'
  | 'vendas-produtos'
  | 'compras-fornecedores'
  | 'compras-categorias'
  | 'valor-estoque'
  | 'automacoes'

export type ErpEntityFieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea'

export type ErpEntityRecord = {
  id: string
  [key: string]: string | number | boolean | null | undefined
}

export type ErpNavigationItem = {
  id: ErpSectionId
  label: string
  href: string
  icon: ComponentType<{ className?: string; style?: CSSProperties; stroke?: number }>
  description: string
  modules: ErpModuleNavigationItem[]
}

export type ErpModuleNavigationItem = {
  id: ErpModuleId
  label: string
  href: string
  description: string
}

export type ErpMetric = {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

export type ErpTableColumn<TRecord extends ErpEntityRecord = ErpEntityRecord> = {
  key: keyof TRecord & string
  label: string
  kind?: 'text' | 'currency' | 'number' | 'date' | 'status'
  width?: string
}

export type ErpFilterOption = {
  value: string
  label: string
}

export type ErpEntityFilter = {
  key: string
  label: string
  allLabel: string
  options: ErpFilterOption[]
}

export type ErpEntityField = {
  key: string
  label: string
  type: ErpEntityFieldType
  placeholder?: string
  options?: ErpFilterOption[]
  required?: boolean
}

export type ErpEntityAction = {
  id: 'confirmar' | 'faturar' | 'cancelar' | 'baixar'
  label: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
  confirmMessage?: string
}

export type ErpEntityConfig<TRecord extends ErpEntityRecord = ErpEntityRecord> = {
  id: ErpModuleId
  sectionId: ErpSectionId
  label: string
  singularLabel: string
  description: string
  route: string
  searchPlaceholder: string
  primaryActionLabel: string
  columns: ErpTableColumn<TRecord>[]
  fields: ErpEntityField[]
  filters: ErpEntityFilter[]
  metrics: ErpMetric[]
  emptyState: {
    title: string
    description: string
  }
  actions?: ErpEntityAction[]
  statusMap?: Record<string, { label: string; tone: 'default' | 'success' | 'warning' | 'danger' }>
}

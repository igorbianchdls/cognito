/** Relatórios substituídos: links antigos continuam reconhecidos e respondem 410. */
export const ERP_RETIRED_REPORTS = [
  'dre',
  'fluxo-diario',
  'fluxo-mensal',
] as const
export function isRetiredErpReport(value?: string) {
  return ERP_RETIRED_REPORTS.some((id) => id === value)
}
/** Rotas de operação antigas para relatórios que hoje são servidos em /relatorios. */
export const ERP_RETIRED_OPERATION_REPORTS = [
  'dre',
  'dre-competencia',
  'fluxo-de-caixa',
  'fluxo-diario',
  'fluxo-mensal',
  'aging-receber',
  'aging-pagar',
] as const
export function isRetiredErpOperationReport(value?: string) {
  return ERP_RETIRED_OPERATION_REPORTS.some((id) => id === value)
}

export const ERP_AVAILABLE_REPORTS = [
  'dre-caixa',
  'dre-competencia',
  'fluxo-de-caixa',
  'aging-receber',
  'aging-pagar',
  'posicao-financeira',
  'vendas-clientes',
  'vendas-vendedores',
  'vendas-produtos',
  'compras-fornecedores',
  'compras-categorias',
  'giro-estoque',
  'valor-estoque',
] as const

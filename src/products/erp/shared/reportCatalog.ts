/** Retired routes remain recognizable for bookmarks and API clients. */
export const ERP_RETIRED_REPORTS = [
  'dre',
  'dre-competencia',
  'fluxo-de-caixa',
  'fluxo-diario',
  'fluxo-mensal',
  'aging-receber',
  'aging-pagar',
] as const
export function isRetiredErpReport(value?: string) {
  return ERP_RETIRED_REPORTS.some((id) => id === value)
}

export const ERP_AVAILABLE_REPORTS = [
  'dre-caixa',
  'posicao-financeira',
  'vendas-clientes',
  'vendas-vendedores',
  'vendas-produtos',
  'compras-fornecedores',
  'compras-categorias',
  'giro-estoque',
  'valor-estoque',
] as const

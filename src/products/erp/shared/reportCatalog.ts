/** Relatórios substituídos: links antigos continuam reconhecidos e respondem 410. */
export const ERP_RETIRED_REPORTS = [
  'fluxo-diario',
  'fluxo-mensal',
] as const
export function isRetiredErpReport(value?: string) {
  return ERP_RETIRED_REPORTS.some((id) => id === value)
}

/** Relatórios que saíram do menu (Fase 2A) e o novo destino de cada endereço antigo. */
export const ERP_MOVED_REPORTS: Record<string, string> = {
  'dre-competencia': '/erp/relatorios/dre?visao=competencia',
  'dre-caixa': '/erp/relatorios/dre?visao=caixa',
  'aging-receber': '/erp/relatorios/contas-em-atraso?lado=receber',
  'aging-pagar': '/erp/relatorios/contas-em-atraso?lado=pagar',
  'vendas-clientes': '/erp/relatorios/vendas?agrupar=cliente',
  'vendas-vendedores': '/erp/relatorios/vendas?agrupar=vendedor',
  'vendas-produtos': '/erp/relatorios/vendas?agrupar=item',
  'compras-fornecedores': '/erp/relatorios/compras?agrupar=fornecedor',
  'compras-categorias': '/erp/relatorios/compras?agrupar=categoria',
  comissoes: '/erp/vendas/gestao-comissoes',
  'posicao-financeira': '/erp/financeiro/contas-a-receber',
  'giro-estoque': '/erp/estoque/posicao-estoque',
  'valor-estoque': '/erp/estoque/posicao-estoque',
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
  'comissoes',
  'vendas-produtos',
  'compras-fornecedores',
  'compras-categorias',
  'giro-estoque',
  'valor-estoque',
] as const

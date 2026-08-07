import type { ErpCapability } from '@/products/erp/shared/professionalContracts'

export const ERP_STOCK_RESOURCES = new Set([
  'posicao-estoque', 'movimentacoes', 'locais-estoque', 'inventarios',
  'transferencias', 'kits', 'conversoes-unidades',
])

export const ERP_FINANCE_RESOURCES = new Set([
  'fluxo-de-caixa', 'conciliacao-bancaria', 'conciliar-transacao',
  'transferencias-financeiras',
])

export const ERP_REPORT_RESOURCES = new Set(['dre', 'aging-receber', 'aging-pagar', 'giro-estoque'])

export function getErpOperationCapability(resource: string, write: boolean): ErpCapability {
  if (ERP_STOCK_RESOURCES.has(resource)) {
    if (!write) return 'erp.estoque.visualizar'
    return ['locais-estoque', 'inventarios', 'kits', 'conversoes-unidades'].includes(resource)
      ? 'erp.estoque.ajustar'
      : 'erp.estoque.movimentar'
  }
  if (ERP_FINANCE_RESOURCES.has(resource)) {
    return write ? 'erp.financeiro.gerenciar' : 'erp.financeiro.visualizar'
  }
  if (ERP_REPORT_RESOURCES.has(resource)) return 'erp.relatorios.visualizar'
  if (resource === 'contratos') return write ? 'erp.vendas.gerenciar' : 'erp.vendas.visualizar'
  return write ? 'erp.configuracoes.gerenciar' : 'erp.relatorios.visualizar'
}

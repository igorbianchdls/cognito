import { getErpOverview, getErpSaleDetails, getErpPurchaseDetails, listErpEntityPage } from '@/products/erp/server/erpRepository'
import { listProfessionalReport } from '@/products/erp/server/erpProfessionalRepository'
import { listStockOperation } from '@/products/erp/server/erpStockRepository'
import type { ErpConnectedModuleId } from '@/products/erp/shared/moduleAccess'

export type PageQuery = { query?: string; page?: number; pageSize?: number; filters?: Record<string, string> }
const fields: Record<string, string[]> = {
  clientes: ['id','nome','status','tipo'], fornecedores: ['id','nome','status','tipo'],
  produtos: ['id','nome','sku','categoria','preco','status'], servicos: ['id','nome','codigo','preco','status'],
  pedidos: ['id','numero','cliente','data','total','status','tipo_documento','atendimento_status','fiscal_status'],
  'pedidos-compra': ['id','numero','fornecedor','data','total','status'],
  'contas-a-pagar': ['id','conta_id','descricao','fornecedor','parcela','vencimento','valor','valor_pago','saldo','status','tipo_lancamento'],
  'contas-a-receber': ['id','conta_id','descricao','cliente','parcela','vencimento','valor','valor_pago','saldo','status'],
}
export function pickFields(record: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.filter(key => record[key] !== undefined).map(key => [key, record[key]]))
}
export const erpQueries = {
  overview: getErpOverview,
  async page(tenantId: number, entityId: ErpConnectedModuleId, input: PageQuery) {
    const result = await listErpEntityPage({ tenantId, entityId, ...input })
    return { records: result.records.map(record => pickFields(record, fields[entityId] || ['id','nome'])),
      total: result.total, page: result.page, pageSize: result.pageSize }
  },
  async sale(tenantId: number, id: number) {
    const result = await getErpSaleDetails(tenantId, id)
    return {
      sale: pickFields(result.sale, ['id','numero','cliente_nome','data_venda','status','subtotal','total','versao']),
      items: result.items.slice(0, 100).map(item => pickFields(item, ['id','tipo','item_id','descricao','quantidade','valor_unitario','desconto','total','quantidade_atendida'])),
      totalItems: result.items.length, itemsTruncated: result.items.length > 100,
    }
  },
  stock(tenantId: number, input: PageQuery) { return listStockOperation(tenantId, 'posicao-estoque', input) },
  async purchase(tenantId: number, id: number) {
    const result = await getErpPurchaseDetails(tenantId, id)
    return { purchase: pickFields(result.purchase, ['id','numero','fornecedor_nome','data_compra','status','subtotal','total']),
      items: result.items.slice(0,100).map(item => pickFields(item, ['id','tipo','item_id','descricao','quantidade','quantidade_recebida','valor_unitario','total'])),
      totalItems: result.items.length, itemsTruncated: result.items.length > 100 }
  },
  async report(tenantId: number, report: string, from: string, to: string, input: PageQuery) {
    const size = input.pageSize || 20
    const records = await listProfessionalReport({tenantId, report, from, to, page:input.page, pageSize:size})
    return { report, from, to, records:records.slice(0,size), page:input.page || 1, pageSize:size, hasMore:records.length > size }
  },
}
export type ErpQueries = typeof erpQueries

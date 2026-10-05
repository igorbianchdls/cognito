import { getErpOverview, getErpSaleDetails, getErpPurchaseDetails, getErpEntityRecord,listErpEntityPage } from '@/products/erp/server/erpRepository'
import { listProfessionalReport,preflightSaleFiscal } from '@/products/erp/server/erpProfessionalRepository'
import { runQuery } from '@/lib/postgres'
import { listStockOperation } from '@/products/erp/server/erpStockRepository'
import type { ErpConnectedModuleId } from '@/products/erp/shared/moduleAccess'
import { financialSummary, installmentDetails, registrationDetails, commercialPage, analysis,financialTitle } from './erpReadQueries'

import type { ErpReadPageQuery as PageQuery } from '../shared/readQueries'
const fields: Record<string, string[]> = {
  clientes: ['id','nome','status','tipo'], fornecedores: ['id','nome','status','tipo'],
  vendedores:['id','nome','status','tipo'],categorias:['id','nome','tipo','status'], 'contas-financeiras':['id','nome','tipo','status','padrao'],
  produtos: ['id','nome','sku','categoria','preco','status'], servicos: ['id','nome','codigo','preco','status'],
  pedidos: ['id','numero','cliente','data','total','status','tipo_documento','atendimento_status','fiscal_status'],
  'pedidos-compra': ['id','numero','fornecedor','data','total','status'],
  'contas-a-pagar': ['id','conta_id','descricao','fornecedor','parcela','vencimento','valor','valor_pago','saldo','status','tipo_lancamento'],
  'contas-a-receber': ['id','conta_id','descricao','cliente','parcela','vencimento','valor','valor_pago','saldo','status'],
}
export function pickFields(record: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.filter(key => record[key] !== undefined).map(key => [key, record[key]]))
}
export const erpReadService = {
  installment: installmentDetails,
  financialTitle,
  registration: registrationDetails,
  analysis,
  async customer(tenantId:number,id:number) {
    const record=await getErpEntityRecord({tenantId,entityId:'clientes',id})
    return {record:pickFields(record,['id','nome','tipo','status','versao'])}
  },
  fiscal:preflightSaleFiscal,
  async financialAccounts(tenantId:number) {
    const rows=await runQuery('SELECT id::text,nome,tipo FROM erp.contas_financeiras WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY nome,id LIMIT 101',[tenantId])
    return {records:rows.slice(0,100),hasMore:rows.length>100}
  },
  async payments(tenantId:number,input:{page:number;pageSize:number;type?:string}) {
    const rows=await runQuery(`SELECT id::text,tipo,conta_receber_parcela_id::text,conta_pagar_parcela_id::text,conta_financeira_id::text,
      data_pagamento,valor,valor_liquido,estornado_em,estorno_de_pagamento_id::text FROM erp.pagamentos
      WHERE empresa_id=$1 AND excluido_em IS NULL AND ($2::text IS NULL OR tipo=$2) ORDER BY erp.pagamentos.id DESC LIMIT $3 OFFSET $4`,
      [tenantId,input.type||null,input.pageSize+1,(input.page-1)*input.pageSize])
    return {records:rows.slice(0,input.pageSize),page:input.page,pageSize:input.pageSize,hasMore:rows.length>input.pageSize}
  },
  overview: getErpOverview,
  async page(tenantId: number, entityId: ErpConnectedModuleId, input: PageQuery) {
    if(entityId==='pedidos'||entityId==='pedidos-compra')return commercialPage(tenantId,entityId==='pedidos'?'vendas':'compras',input)
    const result = await listErpEntityPage({ tenantId, entityId, ...input })
    return { records: result.records.map(record => pickFields(record, fields[entityId] || ['id','nome'])),
      total: result.total, page: result.page, pageSize: result.pageSize,
      ...(entityId==='contas-a-pagar'||entityId==='contas-a-receber' ? {summary:await financialSummary(tenantId,entityId==='contas-a-pagar'?'pagar':'receber',input)} : {}) }
  },
  async sale(tenantId: number, id: number) {
    const result = await getErpSaleDetails(tenantId, id)
    return {
      sale: {...pickFields(result.sale, ['id','numero','cliente_id','cliente_nome','data_venda','status','subtotal','total','versao','observacoes']),data_vencimento:result.installments[0]?.data_vencimento},
      items: result.items.slice(0, 100).map(item => pickFields(item, ['id','tipo','item_id','descricao','quantidade','valor_unitario','desconto','total','quantidade_atendida'])),
      totalItems: result.items.length, itemsTruncated: result.items.length > 100,
      installments: result.installments.slice(0,48).map(item=>pickFields(item,['data_vencimento','valor'])), installmentsTruncated:result.installments.length>48,
    }
  },
  stock(tenantId: number, input: PageQuery) { return listStockOperation(tenantId, 'posicao-estoque', input) },
  async purchase(tenantId: number, id: number) {
    const result = await getErpPurchaseDetails(tenantId, id)
    return { purchase: {...pickFields(result.purchase, ['id','numero','fornecedor_id','fornecedor_nome','data_compra','status','subtotal','total','observacoes']),data_vencimento:result.installments[0]?.data_vencimento},
      items: result.items.slice(0,100).map(item => ({...pickFields(item, ['id','tipo','item_id','descricao','quantidade','quantidade_recebida','valor_unitario','total']),desconto:item.valor_desconto})),
      installments: result.installments.slice(0,48).map(item=>pickFields(item,['data_vencimento','valor'])), installmentsTruncated:result.installments.length>48,
      totalItems: result.items.length, itemsTruncated: result.items.length > 100 }
  },
  async report(tenantId: number, report: string, from: string, to: string, input: PageQuery) {
    const size = input.pageSize || 20
    const records = await listProfessionalReport({tenantId, report, from, to, page:input.page, pageSize:size})
    return { report, from, to, records:records.slice(0,size), page:input.page || 1, pageSize:size, hasMore:records.length > size }
  },
}
export type ErpReadService = typeof erpReadService

import { getErpOverview, getErpSaleDetails, getErpPurchaseDetails, getErpEntityRecord,listErpEntityPage } from '@/products/erp/server/erpRepository'
import { dreReportRecords } from './erpDreReport'
import { getSalesContract } from './erpSalesContracts'
import { attachmentDownload, listAttachments, type AttachmentDocument } from './erpAttachments'
import { budgetVsActual, salesGoalsReport } from './erpBudget'
import { commissionReport } from '@/products/erp/server/erpCommercialRepository'
import { listProfessionalReport,preflightSaleFiscal,serviceOrderPage,getServiceOrder } from '@/products/erp/server/erpProfessionalRepository'
import {currentCommercialDocument} from './documents/commercialDocumentRepository'
import type {CommercialDocumentKind} from './documents/commercialPdf'
import { runQuery } from '@/lib/postgres'
import { ErpDomainError } from '../shared/erpErrors'
import {listServiceInvoices,getServiceInvoice,validateServiceInvoice,getServiceInvoicePdf} from './fiscal/serviceInvoiceRepository'
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
  contract:getSalesContract,
  serviceOrders:serviceOrderPage,
  async serviceOrder(company:number,id:number){const result=await getServiceOrder(company,id);return {record:result.order,items:result.items,history:result.events,totalItems:result.items.length,itemsTruncated:false}},
  async commercialDocument(company:number,kind:CommercialDocumentKind,id:number,revision?:number){
    const current=await currentCommercialDocument(company,kind,id),column=kind==='orcamento'?'orcamento_id':'ordem_servico_id';
    const revisions=await runQuery(`SELECT revisao,origem_versao,layout_versao,criado_em FROM erp.documentos_comerciais_pdfs WHERE empresa_id=$1 AND ${column}=$2 ORDER BY revisao DESC LIMIT 101`,[company,id]);
    if(revision&&!(await runQuery(`SELECT id FROM erp.documentos_comerciais_pdfs WHERE empresa_id=$1 AND ${column}=$2 AND revisao=$3`,[company,id,revision])).length)throw new ErpDomainError('NOT_FOUND','Revisão não encontrada.',404);
    return {record:{id:String(id),tipo:kind,numero:String(current.row.numero),versao:Number(current.row.versao),revisao:revision||null,arquivado:Boolean(revision),aviso:revision?'Revisão arquivada no Storage privado.':'PDF dos dados atuais, gerado para download. Ainda não é uma revisão arquivada.'},revisions:revisions.slice(0,100),hasMore:revisions.length>100};
  },
  serviceInvoices:listServiceInvoices,
  serviceInvoice:getServiceInvoice,
  serviceInvoiceValidation:validateServiceInvoice,
  async serviceInvoicePdf(tenantId:number,id:number){const file=await getServiceInvoicePdf(tenantId,id);return {nome:file.name,versao:file.version,pdf_path:`/api/erp/notas-servico/${id}/pdf`,modo_operacao:'simulacao',aviso:'SIMULAÇÃO - SEM VALIDADE FISCAL'}},
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
      sale: {...pickFields(result.sale, ['id','numero','cliente_id','cliente_nome','data_venda','status','situacao','validade_em','previsao_entrega','tipo_documento','atendimento_status','fiscal_status','venda_origem_id','vendedor_id','tabela_preco_id','transportadora_id','modalidade_frete','volumes','peso_bruto','peso_liquido','subtotal','tipo_desconto','desconto','frete','total','versao','observacoes','observacoes_pagamento']),data_vencimento:result.installments[0]?.data_vencimento},
      items: result.items.slice(0, 100).map(item => pickFields(item, ['id','tipo','item_id','descricao','quantidade','valor_unitario','desconto','total','quantidade_atendida'])),
      totalItems: result.items.length, itemsTruncated: result.items.length > 100,
      installments: result.installments.slice(0,48).map(item=>pickFields(item,['numero_parcela','descricao','data_vencimento','valor','conta_financeira_id','metodo_pagamento_id'])), installmentsTruncated:result.installments.length>48,
    }
  },
  stock(tenantId: number, input: PageQuery) { return listStockOperation(tenantId, 'posicao-estoque', input) },
  async purchase(tenantId: number, id: number) {
    const result = await getErpPurchaseDetails(tenantId, id)
    return { purchase: {...pickFields(result.purchase, ['id','numero','fornecedor_id','fornecedor_nome','data_compra','status','subtotal','tipo_desconto','desconto','frete','seguro','outras_despesas','impostos_retidos','gera_financeiro','total','observacoes']),devolvida:Boolean((result.purchase.metadata as Record<string,unknown> | undefined)?.devolucao_fornecedor),data_vencimento:result.installments[0]?.data_vencimento},
      items: result.items.slice(0,100).map(item => ({...pickFields(item, ['id','tipo','item_id','descricao','quantidade','quantidade_recebida','valor_unitario','total']),desconto:item.valor_desconto})),
      installments: result.installments.slice(0,48).map(item=>pickFields(item,['data_vencimento','valor'])), installmentsTruncated:result.installments.length>48,
      totalItems: result.items.length, itemsTruncated: result.items.length > 100 }
  },
  // Anexos de um documento com link de download de 60 segundos (até 10 por consulta).
  async attachments(tenantId: number, documento: AttachmentDocument, registroId: number) {
    const rows = await listAttachments(tenantId, documento, registroId)
    const records = []
    for (const row of rows.slice(0, 10)) {
      let link: string | null = null
      try { link = (await attachmentDownload(tenantId, Number(row.id))).url } catch { link = null }
      records.push({ ...row, link_download: link, link_expira_em_segundos: link ? 60 : null })
    }
    return { records, total: rows.length, hasMore: rows.length > 10 }
  },
  async report(tenantId: number, report: string, from: string, to: string, input: PageQuery) {
    const size = input.pageSize || 20
    if (report === 'orcado-realizado') {
      const [budget] = await runQuery<{ id: string }>("SELECT id::text FROM erp.orcamentos_financeiros WHERE empresa_id = $1 AND ano = $2 AND excluido_em IS NULL ORDER BY (status = 'aprovado') DESC, atualizado_em DESC LIMIT 1", [tenantId, Number(from.slice(0, 4))])
      if (!budget) return { report, from, to, records: [], summary: { aviso: 'Nenhum orçamento cadastrado para este ano.' }, page: 1, pageSize: 0, hasMore: false }
      const result = await budgetVsActual(tenantId, Number(budget.id), Number(to.slice(5, 7)))
      return { report, from, to, records: result.linhas, summary: { orcamento: result.orcamento.nome, ate_mes: result.ate_mes, ...result.resultado }, page: 1, pageSize: result.linhas.length, hasMore: false }
    }
    if (report === 'metas') {
      const records = await salesGoalsReport(tenantId, from, to)
      return { report, from, to, records, page: 1, pageSize: records.length, hasMore: false }
    }
    if (report === 'dre') {
      // DRE: uma linha por grupo e subtotal, com % sobre a receita líquida e as principais categorias.
      const { report: dre, records } = await dreReportRecords(tenantId, { inicio: from, fim: to })
      return { report, from, to, records, summary: { receita_liquida: dre.subtotais.receita_liquida, lucro_liquido: dre.subtotais.lucro_liquido, nao_classificado: dre.nao_classificado, fora_da_dre: dre.fora_dre }, page: 1, pageSize: records.length, hasMore: false }
    }
    if (report === 'comissoes') {
      // Comissões: resumo por vendedor (valor, liberado, pago, a pagar) e lançamentos por item de venda.
      const result = await commissionReport(tenantId, { inicio: from, fim: to, pagina: input.page || 1, por_pagina: Math.max(10, size) })
      return { report, from, to, records: result.records, summary: { vendedores: result.summary }, page: result.page, pageSize: result.pageSize, hasMore: result.page * result.pageSize < result.total }
    }
    const records = await listProfessionalReport({tenantId, report, from, to, page:input.page, pageSize:size})
    return { report, from, to, records:records.slice(0,size), page:input.page || 1, pageSize:size, hasMore:records.length > size }
  },
}
export type ErpReadService = typeof erpReadService

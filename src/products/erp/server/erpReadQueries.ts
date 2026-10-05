import { runQuery, type SQLClient } from '@/lib/postgres'
import { financialCompositionSql, getErpEntityRecord } from '@/products/erp/server/erpRepository'
import { ErpDomainError } from '../shared/erpErrors'
import type { ErpReadPageQuery as PageQuery } from '../shared/readQueries'

// Identificadores SQL vêm exclusivamente destas uniões, nunca de argumentos livres.
export function financialRows(side: 'pagar'|'receber') {
  const party = side === 'pagar' ? 'fornecedor' : 'cliente'
  return `SELECT parcelas.id, contas.id AS conta_id, contas.descricao, contas.numero_documento,
    entidades.nome AS ${party}, parcelas.numero_parcela AS parcela, parcelas.data_vencimento AS vencimento,
    composicao.valor, composicao.dinheiro AS valor_pago, composicao.credito, composicao.transferido AS renegociado, composicao.saldo,
    CASE WHEN contas.status='cancelado' OR parcelas.status='cancelado' THEN 'cancelado'
      WHEN composicao.transferido>0 THEN 'renegociado' WHEN composicao.saldo=0 THEN 'pago'
      WHEN parcelas.data_vencimento<CURRENT_DATE THEN 'vencido'
      WHEN composicao.dinheiro+composicao.credito>0 THEN 'parcial' ELSE parcelas.status END AS status,
    concat_ws(' ',contas.descricao,contas.numero_documento,entidades.nome,contas.status${side==='pagar'?',contas.origem':''}) AS searchable
    FROM erp.contas_${side} contas JOIN erp.contas_${side}_parcelas parcelas
      ON parcelas.empresa_id=contas.empresa_id AND parcelas.conta_${side}_id=contas.id AND parcelas.excluido_em IS NULL
    JOIN erp.entidades entidades ON entidades.empresa_id=contas.empresa_id AND entidades.id=contas.${party}_id
    ${financialCompositionSql(side)} WHERE contas.empresa_id=$1 AND contas.excluido_em IS NULL`
}
function filtered(params:unknown[], input:PageQuery, dateColumn:string) {
  let sql=' WHERE true'
  if(input.query?.trim()) sql+=` AND searchable ILIKE $${params.push('%'+input.query.trim()+'%')}`
  if(input.filters?.status) sql+=` AND status=$${params.push(input.filters.status)}`
  const start=input.filters?.vencimento_inicio || input.filters?.inicio
  const end=input.filters?.vencimento_fim || input.filters?.fim
  if(start) sql+=` AND ${dateColumn}>=$${params.push(start)}::date`
  if(end) sql+=` AND ${dateColumn}<=$${params.push(end)}::date`
  return sql
}
export async function financialSummary(tenantId:number, side:'pagar'|'receber', input:PageQuery) {
  const params:unknown[]=[tenantId], where=filtered(params,input,'vencimento')
  const [row]=await runQuery(`WITH rows AS (${financialRows(side)}), filtered AS (SELECT * FROM rows ${where})
    SELECT CURRENT_DATE::text AS referencia, count(*)::int AS quantidade,
      COALESCE(sum(saldo) FILTER (WHERE status NOT IN ('cancelado','renegociado','pago')),0) AS em_aberto,
      COALESCE(sum(saldo) FILTER (WHERE status='vencido'),0) AS vencidas,
      COALESCE(sum(saldo) FILTER (WHERE vencimento>CURRENT_DATE AND vencimento<=CURRENT_DATE+7 AND status NOT IN ('cancelado','renegociado','pago')),0) AS vence_em_7_dias,
      COALESCE(sum(valor),0) AS valor_total FROM filtered`,params)
  return row
}
export async function installmentDetails(tenantId:number, side:'pagar'|'receber', id:number) {
  const [raw]=await runQuery(`WITH rows AS (${financialRows(side)}) SELECT * FROM rows WHERE id=$2`,[tenantId,id])
  if(!raw)throw new ErpDomainError('NOT_FOUND','Parcela não disponível nesta empresa.',404)
  const record={...raw}; delete record.searchable
  const history=await runQuery(`SELECT pagamentos.id::text, pagamentos.data_pagamento, pagamentos.valor,
    pagamentos.valor_liquido, pagamentos.estornado_em, pagamentos.estorno_de_pagamento_id::text, financeiras.nome AS conta_financeira
    FROM erp.pagamentos pagamentos LEFT JOIN erp.contas_financeiras financeiras
      ON financeiras.empresa_id=pagamentos.empresa_id AND financeiras.id=pagamentos.conta_financeira_id
    WHERE pagamentos.empresa_id=$1 AND pagamentos.conta_${side}_parcela_id=$2 AND pagamentos.excluido_em IS NULL
    ORDER BY pagamentos.id DESC LIMIT 101`,[tenantId,id])
  return {record,history:history.slice(0,100),historyTruncated:history.length>100}
}
export async function registrationDetails(tenantId:number, type:'clientes'|'fornecedores'|'vendedores'|'produtos'|'servicos'|'categorias'|'contas-financeiras', id:number) {
  const record=await getErpEntityRecord({tenantId,entityId:type,id})
  const allowed=['id','nome','tipo','status','versao','documento','email','telefone','cidade','sku','codigo','categoria','categoria_id','preco','custo','descricao','controla_estoque','estoque_minimo','banco','agencia','conta','digito','saldo_inicial','data_saldo_inicial','padrao']
  return {record:Object.fromEntries(allowed.filter(k=>record[k]!==undefined).map(k=>[k,record[k]]))}
}
export async function financialTitle(tenantId:number,side:'pagar'|'receber',id:number,client?:Pick<SQLClient,'query'>){
  const query = client ? async (sql:string,params:unknown[]) => (await client.query(sql,params)).rows : runQuery
  const [record]=await query(`SELECT id::text,descricao,numero_documento,valor_total,status,origem,data_competencia,data_emissao,categoria_id::text,centro_custo_id::text,${side==='pagar'?'fornecedor_id':'cliente_id'}::text,observacoes,(SELECT CASE WHEN count(DISTINCT p.conta_financeira_id)=1 AND count(*)=count(p.conta_financeira_id) THEN min(p.conta_financeira_id)::text ELSE NULL END FROM erp.contas_${side}_parcelas p WHERE p.empresa_id=$1 AND p.conta_${side}_id=$2 AND p.excluido_em IS NULL) AS conta_financeira_id FROM erp.contas_${side} WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL`,[tenantId,id])
  if(!record)throw new ErpDomainError('NOT_FOUND','Título não disponível nesta empresa.',404)
  const parts=await query(`WITH rows AS (${financialRows(side)}) SELECT id::text,parcela,vencimento,valor,valor_pago,credito,renegociado,saldo,status FROM rows WHERE conta_id=$2 ORDER BY parcela LIMIT 101`,[tenantId,id])
  const history=await query(`SELECT pagamentos.id::text,pagamentos.data_pagamento,pagamentos.valor,pagamentos.estornado_em,pagamentos.estorno_de_pagamento_id::text
    FROM erp.pagamentos pagamentos JOIN erp.contas_${side}_parcelas parcelas ON parcelas.empresa_id=pagamentos.empresa_id AND parcelas.id=pagamentos.conta_${side}_parcela_id
    WHERE pagamentos.empresa_id=$1 AND parcelas.conta_${side}_id=$2 AND pagamentos.excluido_em IS NULL ORDER BY pagamentos.id DESC LIMIT 101`,[tenantId,id])
  return {record,installments:parts.slice(0,100),installmentsTruncated:parts.length>100,history:history.slice(0,100),historyTruncated:history.length>100}
}
function commercialRows(type:'vendas'|'compras', document?:string) {
  const sale=type==='vendas',date=sale?'data_venda':'data_compra',party=sale?'cliente':'fornecedor'
  return `SELECT documentos.id, documentos.numero, documentos.${date} AS data, documentos.total, documentos.status,
    entidades.nome AS ${party}${sale?', documentos.tipo_documento, documentos.atendimento_status, documentos.fiscal_status':', documentos.tipo_movimento'},
    concat_ws(' ',documentos.numero,entidades.nome,documentos.status${sale?'':',documentos.tipo_movimento'}) AS searchable
    FROM erp.${type} documentos JOIN erp.entidades entidades ON entidades.empresa_id=documentos.empresa_id AND entidades.id=documentos.${party}_id
    WHERE documentos.empresa_id=$1 AND documentos.excluido_em IS NULL${sale?(document==='orcamento'?" AND documentos.tipo_documento='orcamento'":" AND documentos.tipo_documento IN ('venda','pedido')"):''}`
}
export async function commercialPage(tenantId:number,type:'vendas'|'compras',input:PageQuery) {
  const params:unknown[]=[tenantId],where=filtered(params,input,'data'),cte=`WITH rows AS (${commercialRows(type,input.filters?.tipo_documento)}), filtered AS (SELECT * FROM rows ${where})`
  const [summary]=await runQuery(`${cte} SELECT count(*)::int AS quantidade,COALESCE(sum(total),0) AS valor_total,
    COALESCE(sum(total) FILTER (WHERE status NOT IN ('rascunho','cancelada')),0) AS valor_confirmado FROM filtered`,params)
  const rows=await runQuery(`${cte} SELECT * FROM filtered ORDER BY data DESC,id DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,
    [...params,input.pageSize||20,((input.page||1)-1)*(input.pageSize||20)])
  return {records:rows.map(row=>{const r={...row};delete r.searchable;delete r.tipo_movimento;return {...r,id:String(r.id),data:r.data instanceof Date?r.data.toISOString().slice(0,10):r.data}}),total:Number(summary.quantidade),page:input.page||1,pageSize:input.pageSize||20,summary}
}
export async function analysis(tenantId:number,type:'vendas'|'compras'|'pagar'|'receber',from:string,to:string) {
  const financial=type==='pagar'||type==='receber',date=financial?'vencimento':'data',amount=financial?'saldo':'total'
  const rows=financial?financialRows(type):commercialRows(type)
  const valid=financial?"status NOT IN ('cancelado','renegociado','pago')":type==='vendas'?"status IN ('confirmada','faturada') AND tipo_documento='venda'":"status IN ('confirmada','parcialmente_recebida','recebida') AND tipo_movimento='compra'"
  const params=[tenantId,from,to]
  // Financial balance expressions are evaluated once, and both totals and months
  // share one scan. Inlining and two separate queries repeated the RLS work.
  const cte=`WITH rows AS ${financial?'MATERIALIZED ':''}(${rows}), filtered AS (SELECT * FROM rows WHERE ${date}>=$2::date AND ${date}<=$3::date AND ${valid})`
  const aggregates=await runQuery(`${cte} SELECT to_char(${date},'YYYY-MM') AS periodo,count(*)::int AS quantidade,
    COALESCE(sum(${amount}),0) AS valor,COALESCE(avg(${amount}),0) AS valor_medio
    FROM filtered GROUP BY GROUPING SETS ((to_char(${date},'YYYY-MM')),()) ORDER BY periodo NULLS FIRST`,params)
  const total=aggregates.find(row=>row.periodo===null)!
  const summary={quantidade:total.quantidade,valor_total:total.valor,valor_medio:total.valor_medio}
  const groups=aggregates.filter(row=>row.periodo!==null).map(row=>({periodo:row.periodo,quantidade:row.quantidade,valor:row.valor}))
  return {tipo:type,inicio:from,fim:to,criterio:financial?'Saldo pendente por vencimento; exclui pagos, cancelados e renegociados.':'Documentos confirmados por data; exclui rascunhos, cancelados e orçamentos.',summary,records:groups}
}

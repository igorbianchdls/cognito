import { runQuery,type SQLClient } from '@/lib/postgres'
import type { Proposal } from './contracts'
import { PluginError } from '../shared/contracts'
import { validateFinancialReferences } from '@/products/erp/server/erpCrudRepository'

export async function proposalReferences(tenantId:number,proposal:Proposal,client?:SQLClient) {
  const query=async (sql:string,params:unknown[]) => client ? (await client.query(`${sql} FOR SHARE`,params)).rows as {id:string;nome:string}[] : runQuery<{id:string;nome:string}>(sql,params)
  const data=proposal.dados as Record<string,unknown>
  if(proposal.tipo.includes('conta_pagar')||proposal.tipo.includes('conta_receber')){
    if(!proposal.tipo.startsWith('excluir_')&&!proposal.tipo.startsWith('efetivar_'))await validateFinancialReferences(client||{query:async(sql,params)=>({rows:await runQuery(sql,params)})},tenantId,proposal.tipo.includes('pagar')?'pagar':'receber',data,Boolean(client))
  }
  if((proposal.tipo.includes('conta_pagar')||proposal.tipo.includes('conta_receber'))&&!proposal.tipo.startsWith('excluir_')&&!proposal.tipo.startsWith('efetivar_')){const side=proposal.tipo.includes('pagar')?'fornecedor':'cliente';const rows=await query(`SELECT id::text,nome FROM erp.entidades WHERE empresa_id=$1 AND id=$2 AND ativo AND excluido_em IS NULL`,[tenantId,data[side+'_id']]);return {cliente:side==='cliente'?rows[0]:null,fornecedor:side==='fornecedor'?rows[0]:null,itens:[]}}
  // Devolução: o cliente é o da venda; os itens são da própria venda (venda_item_id).
  if(proposal.tipo==='devolucao_venda'){
    const sale=await query(`SELECT c.id::text,c.nome FROM erp.vendas v JOIN erp.entidades c ON c.empresa_id=v.empresa_id AND c.id=v.cliente_id WHERE v.empresa_id=$1 AND v.id=$2 AND v.excluido_em IS NULL`,[tenantId,data.registro_id])
    if(!sale[0])throw new PluginError('INVALID_REFERENCE','Venda não encontrada nesta empresa.')
    return {cliente:sale[0],fornecedor:null,itens:[]}
  }
  if(!Array.isArray(data.itens))return {cliente:null,fornecedor:null,itens:[]}
  const purchase=proposal.tipo==='compra'||proposal.tipo==='editar_compra',role=purchase?'eh_fornecedor':'eh_cliente'
  const customer=await query(`SELECT id::text,nome FROM erp.entidades WHERE empresa_id=$1 AND id=$2 AND ${role} AND ativo AND excluido_em IS NULL`,[tenantId,purchase?data.fornecedor_id:data.cliente_id])
  if (!customer[0]) throw new PluginError('INVALID_REFERENCE','Escolha um cliente ou fornecedor ativo desta empresa.')
  const commercialItems=data.itens as {tipo:string;item_id:number}[]
  const products=commercialItems.filter(item=>item.tipo==='produto').map(item=>item.item_id)
  const services=commercialItems.filter(item=>item.tipo==='servico').map(item=>item.item_id)
  const [productRows,serviceRows]=await Promise.all([
    products.length ? query('SELECT id::text,nome FROM erp.produtos WHERE empresa_id=$1 AND id=ANY($2::bigint[]) AND ativo AND excluido_em IS NULL',[tenantId,products]) : [],
    services.length ? query('SELECT id::text,nome FROM erp.servicos WHERE empresa_id=$1 AND id=ANY($2::bigint[]) AND ativo AND excluido_em IS NULL',[tenantId,services]) : [],
  ])
  const items=commercialItems.map(item=>{
    const row=(item.tipo==='produto' ? productRows : serviceRows).find(row=>row.id===String(item.item_id))
    if(!row)throw new PluginError('INVALID_REFERENCE','Escolha itens ativos desta empresa.')
    return {tipo:item.tipo,...row}
  })
  return {cliente:purchase?null:customer[0],fornecedor:purchase?customer[0]:null,itens:items}
}

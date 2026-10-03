import { runQuery,type SQLClient } from '@/lib/postgres'
import type { Proposal } from './contracts'
import { PluginError } from '../shared/contracts'

export async function proposalReferences(tenantId:number,proposal:Proposal,client?:SQLClient) {
  const query=async (sql:string,params:unknown[]) => client ? (await client.query(`${sql} FOR SHARE`,params)).rows as {id:string;nome:string}[] : runQuery<{id:string;nome:string}>(sql,params)
  if (proposal.tipo !== 'orcamento' && proposal.tipo !== 'venda') return {cliente:null,itens:[]}
  const customer=await query(`SELECT id::text,nome FROM erp.entidades WHERE tenant_id=$1 AND id=$2 AND eh_cliente AND ativo AND excluido_em IS NULL`,[tenantId,proposal.dados.cliente_id])
  if (!customer[0]) throw new PluginError('INVALID_REFERENCE','Escolha um cliente ativo desta empresa.')
  const products=proposal.dados.itens.filter(item=>item.tipo==='produto').map(item=>item.item_id)
  const services=proposal.dados.itens.filter(item=>item.tipo==='servico').map(item=>item.item_id)
  const [productRows,serviceRows]=await Promise.all([
    products.length ? query('SELECT id::text,nome FROM erp.produtos WHERE tenant_id=$1 AND id=ANY($2::bigint[]) AND ativo AND excluido_em IS NULL',[tenantId,products]) : [],
    services.length ? query('SELECT id::text,nome FROM erp.servicos WHERE tenant_id=$1 AND id=ANY($2::bigint[]) AND ativo AND excluido_em IS NULL',[tenantId,services]) : [],
  ])
  const items=proposal.dados.itens.map(item=>{
    const row=(item.tipo==='produto' ? productRows : serviceRows).find(row=>row.id===String(item.item_id))
    if(!row)throw new PluginError('INVALID_REFERENCE','Escolha itens ativos desta empresa.')
    return {tipo:item.tipo,...row}
  })
  return {cliente:customer[0],itens:items}
}

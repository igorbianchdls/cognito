import { createHash } from 'node:crypto'
import { runQuery, type SQLClient } from '@/lib/postgres'
import { updateErpEntityRecord,getErpEntityRecord,confirmErpSale,confirmErpPurchase,cancelErpSale,cancelErpPurchase,
  settleReceivableInstallment,settlePayableInstallment,reverseErpPayment } from '@/products/erp/server/erpRepository'
import { attendStockForSale } from '@/products/erp/server/erpStockRepository'
import { PluginError } from '../shared/contracts'
import type { Proposal } from './contracts'

const tables = {editar_cliente:'entidades',editar_produto:'produtos',confirmar_venda:'vendas',cancelar_venda:'vendas',
  atender_venda:'vendas',confirmar_compra:'compras',cancelar_compra:'compras',receber_parcela:'contas_receber_parcelas',
  pagar_parcela:'contas_pagar_parcelas',estornar_pagamento:'pagamentos'} as const
export type OperationSnapshot = {hash:string;registro_id:number;nome:string;status:string|null;valor:string|null;
  parcelas:{numero:unknown;vencimento:unknown;valor:unknown}[];conta_financeira:{id:string;nome:string}|null}
export async function operationSnapshot(tenantId:number,proposal:Proposal,client?:SQLClient):Promise<OperationSnapshot|null> {
  if (!('registro_id' in proposal.dados)) return null
  const table=tables[proposal.tipo as keyof typeof tables]
  if(!table)throw new PluginError('INVALID_INPUT','Operacao desconhecida.')
  const query=async(sql:string,params:unknown[])=>client ? (await client.query(sql,params)).rows : runQuery<Record<string,unknown>>(sql,params)
  const rows=await query(`SELECT * FROM erp.${table} WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL${client?' FOR UPDATE':''}`,[tenantId,proposal.dados.registro_id])
  const row=rows[0]
  if(!row || (proposal.tipo==='editar_cliente' && !row.eh_cliente))throw new PluginError('INVALID_REFERENCE','Registro nao disponivel nesta empresa.')
  const related:unknown[]=[]
  let parcelas:OperationSnapshot['parcelas']=[],contaFinanceira:OperationSnapshot['conta_financeira']=null
  if(table==='vendas'||table==='compras') {
    const foreign=table==='vendas'?'venda_id':'compra_id'
    related.push(await query(`SELECT * FROM erp.${table}_itens WHERE tenant_id=$1 AND ${foreign}=$2 ORDER BY id${client?' FOR SHARE':''}`,[tenantId,proposal.dados.registro_id]))
    const forecastTable=table==='vendas'?'vendas_recebimentos_previstos':'compras_parcelas_previstas'
    const forecasts=await query(`SELECT * FROM erp.${forecastTable} WHERE tenant_id=$1 AND ${foreign}=$2 AND excluido_em IS NULL ORDER BY numero_parcela,id${client?' FOR SHARE':''}`,[tenantId,proposal.dados.registro_id])
    related.push(forecasts)
    parcelas=forecasts.map(p=>({numero:p.numero_parcela,vencimento:p.data_vencimento,valor:p.valor}))
  }
  if(proposal.tipo==='receber_parcela'||proposal.tipo==='pagar_parcela') {
    const accounts=await query(`SELECT * FROM erp.contas_financeiras WHERE tenant_id=$1 AND id=$2 AND ativo AND excluido_em IS NULL${client?' FOR SHARE':''}`,[tenantId,proposal.dados.conta_financeira_id])
    if(!accounts[0])throw new PluginError('INVALID_REFERENCE','Escolha uma conta financeira ativa desta empresa.')
    related.push(accounts[0])
    contaFinanceira={id:String(accounts[0].id),nome:String(accounts[0].nome)}
  }
  // O modelo nunca fornece a versao: o servidor captura o estado a ser aprovado.
  const hash=createHash('sha256').update(JSON.stringify([row,...related])).digest('hex')
  return {hash,registro_id:proposal.dados.registro_id,nome:String(row.nome||row.numero||row.descricao||`Registro ${row.id}`),parcelas,conta_financeira:contaFinanceira,
    status:row.status ? String(row.status):null,valor:row.total!==undefined?String(row.total):row.valor!==undefined?String(row.valor):row.preco_venda!==undefined?String(row.preco_venda):null}
}
export async function executeOperation(tenantId:number,actorId:number,proposal:Proposal,key:string):Promise<string> {
  if(!('registro_id' in proposal.dados))throw new PluginError('INVALID_INPUT','Operacao invalida.')
  const id=proposal.dados.registro_id,input={tenantId,actorId,id,idempotencyKey:key}
  switch(proposal.tipo) {
    case 'editar_cliente': case 'editar_produto': {
      const entityId=proposal.tipo==='editar_cliente'?'clientes':'produtos'
      const current=await getErpEntityRecord({tenantId,entityId,id})
      if(!current)throw new PluginError('NOT_FOUND','Registro indisponivel.',404)
      const {registro_id,...changes}=proposal.dados
      await updateErpEntityRecord({...input,entityId,expectedVersion:Number(current.versao),values:{...current,...changes}})
      break
    }
    case 'confirmar_venda': await confirmErpSale({tenantId,actorId,saleId:id});break
    case 'cancelar_venda': await cancelErpSale({...input,reason:proposal.dados.motivo});break
    case 'confirmar_compra': await confirmErpPurchase(input);break
    case 'cancelar_compra': await cancelErpPurchase(input);break
    case 'atender_venda': await attendStockForSale({tenantId,actorId,saleId:id});break
    case 'receber_parcela': await settleReceivableInstallment({...input,values:proposal.dados});break
    case 'pagar_parcela': await settlePayableInstallment({...input,values:proposal.dados});break
    case 'estornar_pagamento': await reverseErpPayment({...input,reason:proposal.dados.motivo});break
    default:throw new PluginError('INVALID_INPUT','Operacao invalida.')
  }
  return String(id)
}

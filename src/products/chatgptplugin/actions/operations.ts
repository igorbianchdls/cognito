import { createHash } from 'node:crypto'
import { runQuery, type SQLClient } from '@/lib/postgres'
import { updateErpEntityRecord,getErpEntityRecord,confirmErpSale,confirmErpPurchase,cancelErpSale,cancelErpPurchase,
  settleReceivableInstallment,settlePayableInstallment,reverseErpPayment,updateErpSaleDraft,updateErpPurchaseDraft } from '@/products/erp/server/erpRepository'
import { getErpTransactionClient } from '@/lib/postgres'
import { archiveRegistration,archiveCommercialDraft,changeManualFinancialTitle } from '@/products/erp/server/erpCrudRepository'
import { attendStockForSale } from '@/products/erp/server/erpStockRepository'
import { PluginError } from '../shared/contracts'
import { purchaseValues,type Proposal } from './contracts'
import {editServiceInvoice,actOnServiceInvoice} from '@/products/erp/server/fiscal/serviceInvoiceRepository'
import {serviceInvoiceInputSchema} from '@/products/erp/shared/serviceInvoiceContracts'

const tables = {editar_fornecedor:'entidades',editar_vendedor:'entidades',editar_servico:'servicos',editar_categoria:'categorias',editar_conta_financeira:'contas_financeiras',
  editar_nota_servico:'notas_fiscais',simular_nota_servico:'notas_fiscais',consultar_resultado_nota_servico:'notas_fiscais',cancelar_nota_servico:'notas_fiscais',excluir_nota_servico:'notas_fiscais',
  excluir_cliente:'entidades',excluir_fornecedor:'entidades',excluir_vendedor:'entidades',excluir_produto:'produtos',excluir_servico:'servicos',excluir_categoria:'categorias',excluir_conta_financeira:'contas_financeiras',
  editar_venda:'vendas',editar_orcamento:'vendas',excluir_venda:'vendas',excluir_orcamento:'vendas',editar_compra:'compras',excluir_compra:'compras',
  editar_conta_pagar:'contas_pagar',editar_conta_receber:'contas_receber',excluir_conta_pagar:'contas_pagar',excluir_conta_receber:'contas_receber',
  editar_cliente:'entidades',editar_produto:'produtos',confirmar_venda:'vendas',cancelar_venda:'vendas',
  atender_venda:'vendas',confirmar_compra:'compras',cancelar_compra:'compras',receber_parcela:'contas_receber_parcelas',
  pagar_parcela:'contas_pagar_parcelas',estornar_pagamento:'pagamentos'} as const
export type OperationSnapshot = {hash:string;registro_id:number;nome:string;status:string|null;valor:string|null;
  parcelas:{numero:unknown;vencimento:unknown;valor:unknown}[];conta_financeira:{id:string;nome:string}|null;campos?:Record<string,unknown>}
export async function operationSnapshot(tenantId:number,proposal:Proposal,client?:SQLClient):Promise<OperationSnapshot|null> {
  if (!('registro_id' in proposal.dados)) return null
  const table=tables[proposal.tipo as keyof typeof tables]
  if(!table)throw new PluginError('INVALID_INPUT','Operação desconhecida.')
  const query=async(sql:string,params:unknown[])=>client ? (await client.query(sql,params)).rows : runQuery<Record<string,unknown>>(sql,params)
  const rows=await query(`SELECT * FROM erp.${table} WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL${client?' FOR UPDATE':''}`,[tenantId,proposal.dados.registro_id])
  const row=rows[0]
  if(!row || (proposal.tipo==='editar_cliente' && !row.eh_cliente))throw new PluginError('INVALID_REFERENCE','Registro não disponível nesta empresa.')
  const related:unknown[]=[]
  if(table==='entidades'&&('email' in proposal.dados||'telefone' in proposal.dados)){
    // O contato principal entra no estado conferido: mudá-lo depois da prévia exige nova prévia.
    const contact=(await query(`SELECT email,telefone FROM erp.entidades_contatos WHERE empresa_id=$1 AND entidade_id=$2 AND ativo ORDER BY ('comercial'=ANY(principais)) DESC,id LIMIT 1`,[tenantId,proposal.dados.registro_id]))[0]
    related.push(contact||null);Object.assign(row,{email:contact?.email??null,telefone:contact?.telefone??null})
  }
  if(table==='notas_fiscais'){
    if(row.modo_operacao!=='simulacao'||row.tipo!=='nfse'||row.direcao!=='saida')throw new PluginError('INVALID_REFERENCE','Escolha uma nota de serviço simulada desta empresa.')
    related.push(await query('SELECT * FROM erp.notas_fiscais_itens WHERE empresa_id=$1 AND nota_fiscal_id=$2 AND excluido_em IS NULL ORDER BY id',[tenantId,proposal.dados.registro_id]))
    related.push(await query('SELECT * FROM erp.notas_fiscais_totais WHERE empresa_id=$1 AND nota_fiscal_id=$2',[tenantId,proposal.dados.registro_id]))
  }
  const role=proposal.tipo.endsWith('_fornecedor')?'eh_fornecedor':proposal.tipo.endsWith('_vendedor')?'eh_vendedor':proposal.tipo.endsWith('_cliente')?'eh_cliente':null
  if(table==='entidades'&&role&&!row[role])throw new PluginError('INVALID_REFERENCE','Cadastro não possui o papel solicitado.')
  if(table==='vendas'&&proposal.tipo.endsWith('_orcamento')&&row.tipo_documento!=='orcamento')throw new PluginError('INVALID_REFERENCE','O registro não é um orçamento.')
  if(table==='vendas'&&(proposal.tipo==='editar_venda'||proposal.tipo==='excluir_venda')&&row.tipo_documento==='orcamento')throw new PluginError('INVALID_REFERENCE','Use a operação de orçamento para este registro.')
  let parcelas:OperationSnapshot['parcelas']=[],contaFinanceira:OperationSnapshot['conta_financeira']=null
  if(table==='vendas'||table==='compras') {
    const foreign=table==='vendas'?'venda_id':'compra_id'
    related.push(await query(`SELECT * FROM erp.${table}_itens WHERE empresa_id=$1 AND ${foreign}=$2 ORDER BY id${client?' FOR SHARE':''}`,[tenantId,proposal.dados.registro_id]))
    const forecastTable=table==='vendas'?'vendas_recebimentos_previstos':'compras_parcelas_previstas'
    const forecasts=await query(`SELECT * FROM erp.${forecastTable} WHERE empresa_id=$1 AND ${foreign}=$2 AND excluido_em IS NULL ORDER BY numero_parcela,id${client?' FOR SHARE':''}`,[tenantId,proposal.dados.registro_id])
    related.push(forecasts)
    parcelas=forecasts.map(p=>({numero:p.numero_parcela,vencimento:p.data_vencimento,valor:p.valor}))
  }
  if(table==='contas_pagar'||table==='contas_receber'){
    const side=table==='contas_pagar'?'pagar':'receber'
    const parts=await query(`SELECT * FROM erp.${table}_parcelas WHERE empresa_id=$1 AND conta_${side}_id=$2 ORDER BY id${client?' FOR UPDATE':''}`,[tenantId,proposal.dados.registro_id])
    related.push(parts);parcelas=parts.filter(p=>!p.excluido_em).map(p=>({numero:p.numero_parcela,vencimento:p.data_vencimento,valor:p.valor}))
    if(side==='receber')related.push(await query('SELECT * FROM erp.cobrancas WHERE empresa_id=$1 AND conta_receber_parcela_id=ANY($2::bigint[]) ORDER BY id',[tenantId,parts.map(p=>p.id)]))
    for(const movement of ['pagamentos','adiantamentos_aplicacoes','renegociacoes_parcelas'])related.push(await query(`SELECT * FROM erp.${movement} WHERE empresa_id=$1 AND conta_${side}_parcela_id=ANY($2::bigint[]) ORDER BY id`,[tenantId,parts.map(p=>p.id)]))
  }
  if(proposal.tipo==='receber_parcela'||proposal.tipo==='pagar_parcela') {
    const accounts=await query(`SELECT * FROM erp.contas_financeiras WHERE empresa_id=$1 AND id=$2 AND ativo AND excluido_em IS NULL${client?' FOR SHARE':''}`,[tenantId,proposal.dados.conta_financeira_id])
    if(!accounts[0])throw new PluginError('INVALID_REFERENCE','Escolha uma conta financeira ativa desta empresa.')
    related.push(accounts[0])
    contaFinanceira={id:String(accounts[0].id),nome:String(accounts[0].nome)}
  }
  // O modelo nunca fornece a versao: o servidor captura o estado a ser aprovado.
  const hash=createHash('sha256').update(JSON.stringify([row,...related])).digest('hex')
  const mapping:Record<string,string>={preco:'preco_venda',custo:'custo_medio'}
  const campos=Object.fromEntries(Object.keys(proposal.dados).filter(k=>k!=='registro_id').map(k=>[k,k==='parcelas'?parcelas.map(p=>({data_vencimento:p.vencimento,valor:p.valor})):k==='itens'&&Array.isArray(related[0])?related[0].filter(i=>!i.excluido_em).map(i=>({tipo:i.servico_id?'servico':'produto',item_id:Number(i.servico_id||i.produto_id),quantidade:Number(i.quantidade),valor_unitario:Number(i.valor_unitario),desconto:Number(i.desconto||0)})):row[k]??row[mapping[k]]??null]))
  if(table==='notas_fiscais'){
    const totals=(related[1] as Record<string,unknown>[])[0]||{}
    Object.assign(campos,{cliente_id:Number(row.entidade_id),observacoes:(row.metadata as Record<string,unknown>)?.observacoes||'',aliquota_iss:Number((related[0] as Record<string,unknown>[])[0]?.aliquota_iss||0),iss_retido:Boolean(totals.iss_retido)})
    if('itens' in campos)campos.itens=(related[0] as Record<string,unknown>[]).map(i=>({tipo:'servico',item_id:Number(i.servico_id),descricao:i.descricao,quantidade:Number(i.quantidade),valor_unitario:Number(i.valor_unitario),desconto:Number(i.desconto||0)}))
  }
  return {hash,registro_id:Number(proposal.dados.registro_id),nome:String(row.nome||row.numero||row.descricao||`Registro ${row.id}`),parcelas,conta_financeira:contaFinanceira,campos,
    status:row.status ? String(row.status):null,valor:row.total!==undefined?String(row.total):row.valor_total!==undefined?String(row.valor_total):row.valor!==undefined?String(row.valor):row.preco_venda!==undefined?String(row.preco_venda):null}
}
type Contact={id?:string;nome:string;cargo?:string;email?:string;telefone?:string;whatsapp?:boolean;finalidades:string[];principais:string[]}
/** Aplica e-mail/telefone ao contato comercial principal (ou cria um), preservando os demais contatos. */
function withContactChanges(current:Record<string,unknown>,changes:Record<string,unknown>):Record<string,unknown> {
  const {email,telefone,...rest}=changes
  if(email===undefined&&telefone===undefined)return {...current,...rest}
  // O registro traz os contatos como texto JSON em contatos_json.
  const raw=current.contatos_json??current.contatos
  const stored=(typeof raw==='string'?JSON.parse(raw):raw||[]) as Contact[]
  const contacts=stored.map(c=>({id:c.id,nome:c.nome,cargo:c.cargo||'',email:c.email||'',telefone:c.telefone||'',whatsapp:Boolean(c.whatsapp),finalidades:c.finalidades,principais:c.principais||[]}))
  const target=contacts.find(c=>c.principais.includes('comercial'))||contacts[0]
  if(target)Object.assign(target,email!==undefined?{email}:{},telefone!==undefined?{telefone}:{})
  else contacts.push({id:undefined,nome:String(rest.nome||current.nome),cargo:'',email:String(email||''),telefone:String(telefone||''),whatsapp:false,finalidades:['comercial'],principais:['comercial']})
  return {...current,...rest,...(email!==undefined?{email}:{}),...(telefone!==undefined?{telefone}:{}),contatos:contacts}
}
export async function executeOperation(tenantId:number,actorId:number,proposal:Proposal,key:string):Promise<string> {
  if(!('registro_id' in proposal.dados))throw new PluginError('INVALID_INPUT','Operação inválida.')
  const id=Number(proposal.dados.registro_id),input={tenantId,actorId,id,idempotencyKey:key}
  const client=getErpTransactionClient()
  const data=proposal.dados as Record<string,unknown>
  if(proposal.tipo.endsWith('_nota_servico')){
    const current=(await runQuery('SELECT versao FROM erp.notas_fiscais WHERE empresa_id=$1 AND id=$2',[tenantId,id]))[0]
    if(!current)throw new PluginError('NOT_FOUND','Nota não encontrada.',404)
    if(proposal.tipo==='editar_nota_servico'){
      const {registro_id:_id,...changes}=data
      await editServiceInvoice(tenantId,actorId,id,serviceInvoiceInputSchema.parse(changes),key,Number(current.versao))
    }else{
      const actions:Record<string,'emitir'|'consultar'|'cancelar'|'excluir'>={simular_nota_servico:'emitir',consultar_resultado_nota_servico:'consultar',cancelar_nota_servico:'cancelar',excluir_nota_servico:'excluir'}
      const action=actions[proposal.tipo]
      await actOnServiceInvoice(tenantId,actorId,id,{acao:action,chave_operacao:key,versao:Number(current.versao),cenario:data.cenario as 'sucesso',motivo:data.motivo as string|undefined})
    }
    return String(id)
  }
  if(proposal.tipo.startsWith('excluir_')){
    if(!client)throw new Error('Exclusão exige transação de aprovação.')
    const entity=proposal.tipo.slice(8),registration={cliente:'clientes',fornecedor:'fornecedores',vendedor:'vendedores',produto:'produtos',servico:'servicos',categoria:'categorias',conta_financeira:'contas-financeiras'} as const
    if(entity in registration)return archiveRegistration(client,tenantId,actorId,registration[entity as keyof typeof registration],id,String(data.motivo))
    if(entity==='conta_pagar'||entity==='conta_receber')return changeManualFinancialTitle(client,tenantId,actorId,entity==='conta_pagar'?'pagar':'receber',id,data,true)
    return archiveCommercialDraft(client,tenantId,actorId,entity==='compra'?'compras':'vendas',id,String(data.motivo))
  }
  if(proposal.tipo==='editar_conta_pagar'||proposal.tipo==='editar_conta_receber'){
    if(!client)throw new Error('Edição exige transação de aprovação.')
    return changeManualFinancialTitle(client,tenantId,actorId,proposal.tipo==='editar_conta_pagar'?'pagar':'receber',id,data)
  }
  if(['editar_venda','editar_orcamento','editar_compra'].includes(proposal.tipo)){
    const sale=proposal.tipo!=='editar_compra',table=sale?'vendas':'compras'
    const schedule=await runQuery(`SELECT id FROM erp.${sale?'vendas_recebimentos_previstos':'compras_parcelas_previstas'} WHERE empresa_id=$1 AND ${sale?'venda_id':'compra_id'}=$2 AND excluido_em IS NULL LIMIT 2`,[tenantId,id])
    if(schedule.length>1)throw new PluginError('INVALID_STATE','Documento com várias parcelas exige edição no ERP para preservar a condição de pagamento.');
    const [current]=await runQuery(`SELECT * FROM erp.${table} WHERE empresa_id=$1 AND id=$2`,[tenantId,id])
    if(['desconto','frete','seguro','outras_despesas','impostos_retidos'].some(field=>Number(current[field]||0)!==0))throw new PluginError('INVALID_STATE','Documento com descontos ou despesas no cabeçalho exige edição no ERP.');
    const {registro_id:_id,...changes}=data
    const preserved=Object.fromEntries(Object.entries(current).map(([key,value])=>[key,value instanceof Date?value.toISOString().slice(0,10):value]))
    delete preserved.chave_idempotencia
    const values={...preserved,...changes}
    if(sale)await updateErpSaleDraft({...input,expectedVersion:Number(current.versao),values:{...values,tipo_documento:proposal.tipo==='editar_orcamento'?'orcamento':'venda'}})
    else await updateErpPurchaseDraft({...input,expectedVersion:Number(current.versao),values:{...purchaseValues(values),tipo_movimento:'cotacao',gera_financeiro:current.gera_financeiro}})
    return String(id)
  }
  const registrationEdit={editar_fornecedor:'fornecedores',editar_vendedor:'vendedores',editar_servico:'servicos',editar_categoria:'categorias',editar_conta_financeira:'contas-financeiras'} as const
  if(proposal.tipo in registrationEdit){
    const entityId=registrationEdit[proposal.tipo as keyof typeof registrationEdit],current=await getErpEntityRecord({tenantId,entityId,id}),{registro_id:_id,...changes}=data
    await updateErpEntityRecord({...input,entityId,expectedVersion:Number(current.versao),values:withContactChanges(current,changes)});return String(id)
  }
  switch(proposal.tipo) {
    case 'editar_cliente': case 'editar_produto': {
      const entityId=proposal.tipo==='editar_cliente'?'clientes':'produtos'
      const current=await getErpEntityRecord({tenantId,entityId,id})
      if(!current)throw new PluginError('NOT_FOUND','Registro indisponível.',404)
      const {registro_id,...changes}=proposal.dados
      await updateErpEntityRecord({...input,entityId,expectedVersion:Number(current.versao),values:withContactChanges(current,changes)})
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
    default:throw new PluginError('INVALID_INPUT','Operação inválida.')
  }
  return String(id)
}

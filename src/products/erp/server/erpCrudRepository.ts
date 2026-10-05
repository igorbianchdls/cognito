import type { SQLClient } from '@/lib/postgres'
import { assertErpPeriodOpen } from './erpPeriodRepository'
import { ErpDomainError } from '../shared/erpErrors'
import { sumMoney } from '../shared/erpMoney'

export type FinancialSide='pagar'|'receber'
const fail=(message:string):never=>{throw new ErpDomainError('VALIDATION_ERROR',message,409)}
export async function validateFinancialReferences(client:Pick<SQLClient,'query'>,tenantId:number,side:FinancialSide,values:Record<string,unknown>,lock=true) {
  const party=side==='pagar'?'fornecedor':'cliente'
  const r=await client.query(`SELECT id FROM erp.entidades WHERE tenant_id=$1 AND id=$2 AND eh_${party} AND ativo AND excluido_em IS NULL${lock?' FOR SHARE':''}`,[tenantId,values[party+'_id']])
  if(!r.rows[0])fail('Escolha um '+party+' ativo desta empresa.')
  const cat=await client.query(`SELECT id FROM erp.categorias WHERE tenant_id=$1 AND id=$2 AND ativo AND excluido_em IS NULL AND tipo IN ($3,'geral')${lock?' FOR SHARE':''}`,[tenantId,values.categoria_id,side==='pagar'?'despesa':'receita'])
  if(!cat.rows[0])fail('Escolha uma categoria financeira compatível desta empresa.')
  for(const [field,table] of [['centro_custo_id','centros_custo'],['conta_financeira_id','contas_financeiras']] as const)if(values[field]){
    const ref=await client.query(`SELECT id FROM erp.${table} WHERE tenant_id=$1 AND id=$2 AND ativo AND excluido_em IS NULL${lock?' FOR SHARE':''}`,[tenantId,values[field]])
    if(!ref.rows[0])fail('Referência financeira não disponível nesta empresa.')
  }
  const parts=values.parcelas as {valor:number;data_vencimento:string}[]
  if(!parts?.length||parts.length>48||sumMoney(parts.map(p=>p.valor))!==values.valor_total)fail('Parcelas devem distribuir o valor total.')
}
async function financialPeriod(client:SQLClient,tenantId:number,values:Record<string,unknown>){
  const iso=(value:unknown)=>value instanceof Date?value.toISOString().slice(0,10):String(value).slice(0,10)
  for(const date of new Set([iso(values.data_competencia||values.data_emissao),iso(values.data_emissao),...(values.parcelas as {data_vencimento:string}[]).map(p=>iso(p.data_vencimento))]))
    await assertErpPeriodOpen(client,{tenantId,module:'financeiro',date})
}
async function addInstallments(client:SQLClient,tenantId:number,actorId:number,side:FinancialSide,title:number,values:Record<string,unknown>,offset=0){
  for(const [index,p] of (values.parcelas as {valor:number;data_vencimento:string}[]).entries())await client.query(`INSERT INTO erp.contas_${side}_parcelas
    (tenant_id,conta_${side}_id,numero_parcela,data_vencimento,data_pagamento_previsto,valor,valor_bruto,valor_liquido,status,conta_financeira_id,criado_por,atualizado_por)
    VALUES($1,$2,$3,$4,$4,$5,$5,$5,'aberto',$6,$7,$7)`,[tenantId,title,offset+index+1,p.data_vencimento,p.valor,values.conta_financeira_id||null,actorId])
}
async function titleEvent(client:SQLClient,tenantId:number,actorId:number,side:FinancialSide,id:number,event:string,values:Record<string,unknown>){
  await client.query(`INSERT INTO erp.contas_${side}_eventos(tenant_id,conta_${side}_id,evento,dados,criado_por) VALUES($1,$2,$3,$4::jsonb,$5)`,[tenantId,id,event,JSON.stringify(values),actorId])
}
export async function createManualFinancialTitle(client:SQLClient,tenantId:number,actorId:number,side:FinancialSide,values:Record<string,unknown>,key:string){
  await validateFinancialReferences(client,tenantId,side,values);await financialPeriod(client,tenantId,values)
  const party=side==='pagar'?'fornecedor':'cliente'
  const result=await client.query(`INSERT INTO erp.contas_${side}(tenant_id,${party}_id,descricao,numero_documento,valor_total,data_competencia,data_emissao,categoria_id,centro_custo_id,observacoes,origem,status,chave_idempotencia,criado_por,atualizado_por${side==='pagar'?',tipo_lancamento,efetivado_em':''})
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'manual','aberto',$11,$12,$12${side==='pagar'?",'efetivo',now()":''}) RETURNING id`,
    [tenantId,values[party+'_id'],values.descricao,values.numero_documento||null,values.valor_total,values.data_competencia,values.data_emissao,values.categoria_id,values.centro_custo_id||null,values.observacoes||null,key,actorId])
  const id=Number(result.rows[0].id);await addInstallments(client,tenantId,actorId,side,id,values);await titleEvent(client,tenantId,actorId,side,id,'criada_plugin',values);return String(id)
}
export async function changeManualFinancialTitle(client:SQLClient,tenantId:number,actorId:number,side:FinancialSide,id:number,values:Record<string,unknown>,remove=false){
  const title=(await client.query(`SELECT * FROM erp.contas_${side} WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE`,[tenantId,id])).rows[0]
  if(!title)fail('Título não disponível nesta empresa.')
  if(title.origem!=='manual'||title[side==='pagar'?'compra_id':'venda_id']||title.contrato_id||title.recorrencia_financeira_id)fail('Altere ou cancele o documento de origem deste título.')
  if(['pago','cancelado','renegociado'].includes(String(title.status)))fail('Este título não permite alteração ou exclusão.')
  const parts=(await client.query(`SELECT * FROM erp.contas_${side}_parcelas WHERE tenant_id=$1 AND conta_${side}_id=$2 ORDER BY id FOR UPDATE`,[tenantId,id])).rows
  for(const table of ['pagamentos','adiantamentos_aplicacoes','renegociacoes_parcelas']){
    const movement=await client.query(`SELECT id FROM erp.${table} WHERE tenant_id=$1 AND conta_${side}_parcela_id=ANY($2::bigint[]) LIMIT 1`,[tenantId,parts.map(p=>p.id)])
    if(movement.rows[0])fail('Título com histórico de pagamento, crédito ou renegociação não pode ser reescrito ou excluído.')
  }
  if(side==='receber'&&(await client.query('SELECT id FROM erp.cobrancas WHERE tenant_id=$1 AND conta_receber_parcela_id=ANY($2::bigint[]) LIMIT 1',[tenantId,parts.map(p=>p.id)])).rows[0])fail('Título com histórico de cobrança deve ser alterado ou cancelado no financeiro do ERP.');
  if(parts.some(p=>Number(p.valor_pago)>0||p.conciliado||Number(p.juros)>0||Number(p.multa)>0||Number(p.desconto)>0||Number(p.taxa)>0))fail('Parcela com movimentos ou composição financeira não pode ser reescrita.')
  const current={...title,parcelas:parts.filter(p=>!p.excluido_em)}
  if (!remove) {
    values = { ...values }
    for (const field of ['numero_documento','centro_custo_id','observacoes'] as const) {
      if (!Object.prototype.hasOwnProperty.call(values, field)) values[field] = title[field]
    }
    if (!Object.prototype.hasOwnProperty.call(values, 'conta_financeira_id')) {
      const activeParts=parts.filter(p=>!p.excluido_em)
      if (new Set(activeParts.map(p=>String(p.conta_financeira_id || ''))).size > 1) fail('O título usa contas financeiras diferentes. Escolha explicitamente a conta para as novas parcelas.')
      values.conta_financeira_id = activeParts[0]?.conta_financeira_id || null
    }
  }
  await financialPeriod(client,tenantId,current)
  if(!remove){await validateFinancialReferences(client,tenantId,side,values);await financialPeriod(client,tenantId,values)}
  const rateio=await client.query(`SELECT id FROM erp.rateios_financeiros WHERE tenant_id=$1 AND conta_${side}_id=$2 LIMIT 1`,[tenantId,id])
  if(rateio.rows[0])fail('Título com rateio exige edição no financeiro do ERP.')
  await client.query(`UPDATE erp.contas_${side}_parcelas SET status='cancelado',excluido_em=now(),atualizado_por=$3 WHERE tenant_id=$1 AND conta_${side}_id=$2 AND excluido_em IS NULL`,[tenantId,id,actorId])
  if(remove)await client.query(`UPDATE erp.contas_${side} SET status='cancelado',excluido_em=now(),cancelado_em=now(),motivo_cancelamento=$4,atualizado_por=$3,metadata=metadata||jsonb_build_object('exclusao_motivo',$4::text) WHERE tenant_id=$1 AND id=$2`,[tenantId,id,actorId,values.motivo])
  else{
    const party=side==='pagar'?'fornecedor':'cliente'
    await client.query(`UPDATE erp.contas_${side} SET ${party}_id=$3,descricao=$4,numero_documento=$5,valor_total=$6,data_competencia=$7,data_emissao=$8,categoria_id=$9,centro_custo_id=$10,observacoes=$11,status='aberto',atualizado_por=$12 WHERE tenant_id=$1 AND id=$2`,[tenantId,id,values[party+'_id'],values.descricao,values.numero_documento||null,values.valor_total,values.data_competencia,values.data_emissao,values.categoria_id,values.centro_custo_id||null,values.observacoes||null,actorId])
    await addInstallments(client,tenantId,actorId,side,id,values,Math.max(0,...parts.map(p=>Number(p.numero_parcela))))
  }
  await titleEvent(client,tenantId,actorId,side,id,remove?'excluida_plugin':'atualizada_plugin',{antes:title,parcelas_anteriores:parts,depois:values})
  return String(id)
}

const registrationTables={clientes:'entidades',fornecedores:'entidades',vendedores:'entidades',produtos:'produtos',servicos:'servicos',categorias:'categorias','contas-financeiras':'contas_financeiras'} as const
export async function archiveRegistration(client:SQLClient,tenantId:number,actorId:number,entity:keyof typeof registrationTables,id:number,reason:string){
  // Sem leitura das áreas, RLS poderia esconder vínculos históricos.
  for(const capability of ['erp.vendas.visualizar','erp.compras.visualizar','erp.financeiro.visualizar','erp.estoque.visualizar']){
    const allowed=await client.query('SELECT shared.has_erp_capability($1,$2) AS allowed',[tenantId,capability]);
    if(!allowed.rows[0]?.allowed)fail('A exclusão de cadastro exige permissão de consulta nas áreas comerciais, financeira e de estoque para verificar vínculos.');
  }
  const table=registrationTables[entity],role=entity==='clientes'?'eh_cliente':entity==='fornecedores'?'eh_fornecedor':entity==='vendedores'?'eh_vendedor':null
  // Os locks da linha também serializam novas referências protegidas por FK.
  const before=(await client.query(`SELECT * FROM erp.${table} WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL${role?' AND '+role:''} FOR UPDATE`,[tenantId,id])).rows[0]
  if(!before)fail('Cadastro não disponível nesta empresa.')
  if(table==='entidades'){
    // Um cadastro pode cumprir vários papéis. Excluí-lo não deve remover outro papel.
    if([before.eh_cliente,before.eh_fornecedor,before.eh_vendedor].filter(Boolean).length>1)fail('Cadastro com múltiplos papéis: desative o papel no ERP antes de excluir.')
  }
  if(table==='contas_financeiras'&&Number(before.saldo_inicial)!==0)fail('Conta com saldo inicial deve ser desativada no ERP.');
  const fk=await client.query(`SELECT c.conrelid::regclass::text AS tabela,a.attname AS coluna
    FROM pg_constraint c CROSS JOIN LATERAL unnest(c.conkey,c.confkey) AS keys(local_key,foreign_key)
    JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=keys.local_key
    JOIN pg_attribute target ON target.attrelid=c.confrelid AND target.attnum=keys.foreign_key
    WHERE c.contype='f' AND c.confrelid=to_regclass($2) AND target.attname='id'
      AND c.connamespace='erp'::regnamespace AND $1::bigint>0`,[tenantId,'erp.'+table])
  for(const ref of fk.rows){
    // Nomes vêm do catálogo do banco e são validados antes de compor SQL.
    const name=String(ref.tabela).replaceAll('"',''),column=String(ref.coluna)
    if(!/^erp\.[a-z_]+$/.test(name)||!(/^[a-z_]+$/).test(column))fail('Referência de cadastro não suportada.')
    if(['erp.cadastros_eventos','erp.entidades_contatos','erp.entidades_enderecos'].includes(name))continue
    const used=await client.query(`SELECT 1 FROM ${name} WHERE tenant_id=$1 AND ${column}=$2 LIMIT 1`,[tenantId,id])
    if(used.rows[0])fail('Cadastro possui vínculos ou histórico. Use desativação no ERP para preservá-los.')
  }
  if(table==='entidades')for(const child of ['entidades_contatos','entidades_enderecos'])await client.query(`UPDATE erp.${child} SET ativo=false,principais='{}' WHERE tenant_id=$1 AND entidade_id=$2 AND ativo`,[tenantId,id]);
  await client.query(`UPDATE erp.${table} SET ativo=false,excluido_em=now(),versao=versao+1,atualizado_por=$3 WHERE tenant_id=$1 AND id=$2`,[tenantId,id,actorId])
  const eventType=table==='entidades'?'entidade':table==='contas_financeiras'?'conta_financeira':entity==='produtos'?'produto':entity==='servicos'?'servico':'categoria'
  await client.query(`INSERT INTO erp.cadastros_eventos(tenant_id,entidade_tipo,entidade_id,evento,versao,dados,criado_por) VALUES($1,$2,$3,'excluido',$4,$5::jsonb,$6)`,[tenantId,eventType,id,Number(before.versao)+1,JSON.stringify({motivo:reason,antes:before}),actorId])
  return String(id)
}
export async function archiveCommercialDraft(client:SQLClient,tenantId:number,actorId:number,type:'vendas'|'compras',id:number,reason:string){
  const row=(await client.query(`SELECT * FROM erp.${type} WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE`,[tenantId,id])).rows[0]
  if(!row||row.status!=='rascunho')fail('Somente documentos em rascunho podem ser excluídos. Use cancelamento para documentos confirmados.')
  const financial=type==='vendas'?'receber':'pagar',foreign=type==='vendas'?'venda_id':'compra_id'
  const linked=await client.query(`SELECT id FROM erp.contas_${financial} WHERE tenant_id=$1 AND ${foreign}=$2 LIMIT 1`,[tenantId,id])
  if(linked.rows[0])fail('Documento com financeiro exige cancelamento no ERP.')
  const stock=await client.query('SELECT id FROM erp.movimentacoes_estoque WHERE tenant_id=$1 AND origem_tipo=$2 AND origem_id=$3 LIMIT 1',[tenantId,type==='vendas'?'venda':'compra',id]);
  if(stock.rows[0])fail('Documento com histórico de estoque não pode ser excluído.');
  for(const [table,field] of [['notas_fiscais',foreign],...(type==='vendas'?[['reservas_estoque','venda_id']]:[])] ){
    const columns=await client.query(`SELECT 1 FROM information_schema.columns WHERE table_schema='erp' AND table_name=$2 AND column_name=$3 AND $1::bigint>0`,[tenantId,table,field])
    if(columns.rows.length&&(await client.query(`SELECT id FROM erp.${table} WHERE tenant_id=$1 AND ${field}=$2 LIMIT 1`,[tenantId,id])).rows.length)fail('Documento com efeitos fiscais ou de estoque não pode ser excluído.')
  }
  await assertErpPeriodOpen(client,{tenantId,module:type==='vendas'?'vendas':'compras',date:row[type==='vendas'?'data_venda':'data_compra'] instanceof Date?(row[type==='vendas'?'data_venda':'data_compra'] as Date).toISOString().slice(0,10):String(row[type==='vendas'?'data_venda':'data_compra'])})
  await client.query(`UPDATE erp.${type} SET excluido_em=now(),versao=versao+1,atualizado_por=$3 WHERE tenant_id=$1 AND id=$2`,[tenantId,id,actorId])
  if(type==='vendas')await client.query(`INSERT INTO erp.vendas_eventos(tenant_id,venda_id,evento,status_anterior,status_novo,versao,dados,criado_por) VALUES($1,$2,'excluida','rascunho','rascunho',$3,$4::jsonb,$5)`,[tenantId,id,Number(row.versao)+1,JSON.stringify({motivo:reason}),actorId])
  else await client.query(`INSERT INTO erp.compras_eventos(tenant_id,compra_id,evento,dados,criado_por) VALUES($1,$2,'excluida',$3::jsonb,$4)`,[tenantId,id,JSON.stringify({motivo:reason}),actorId])
  return String(id)
}

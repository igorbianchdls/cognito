import { randomUUID } from 'node:crypto'
import { withTransaction,runWithErpTransactionClient, type SQLClient } from '@/lib/postgres'
import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { createErpEntityWithClient } from '@/products/erp/server/erpRepository'
import type { ErpAccessContext } from '@/products/erp/server/erpAccess'
import { proposalSchema,proposalCapabilities,proposalEntity,proposalValues,proposalPreview } from '../actions/contracts'
import { operationSnapshot,executeOperation } from '../actions/operations'
import { PluginError } from '../shared/contracts'
import { pluginQuery } from '../shared/database'
import { draftView,type DraftRow } from '../actions/draftRepository'
import { proposalReferences } from '../actions/references'
import { createManualFinancialTitle } from '@/products/erp/server/erpCrudRepository'
import {createServiceInvoice} from '@/products/erp/server/fiscal/serviceInvoiceRepository'

export async function loadApproval(id:string,session:ErpAccessContext,resource:string) {
  const rows = await pluginQuery<DraftRow>("SELECT * FROM plugin.drafts WHERE id=$1 AND user_id=$2 AND empresa_id=$3 AND integration='chatgpt'",[id,session.sharedUserId,session.tenantId])
  if (!rows[0]) throw new PluginError('NOT_FOUND','Rascunho nao disponivel nesta conta e empresa.',404)
  const proposal = proposalSchema.parse(rows[0].proposal)
  if (!proposalCapabilities(proposal).every(cap=>session.capabilities.includes(cap))) throw new PluginError('ACCESS_DENIED','Seu perfil nao permite salvar este rascunho.',403)
  const references=await runWithErpDatabaseContext({tenantId:session.tenantId,userId:session.sharedUserId,readOnly:true,statementTimeoutMs:10000},
    () => proposalReferences(session.tenantId,proposal)).catch(() => null)
  return {...draftView(rows[0],{resource}),empresa_nome:session.tenantName,referencias:references}
}

async function assertCurrentAccess(client:SQLClient,session:ErpAccessContext,capability:string) {
  // Compartilhar os locks com alteracoes de vinculo impede aprovacoes usando permissoes revogadas.
  const members = await client.query(`SELECT m.role,m.perfil_acesso_id FROM shared.usuarios_empresas m
    JOIN shared.empresas t ON t.id=m.empresa_id JOIN shared.usuarios u ON u.id=m.usuario_id
    WHERE m.empresa_id=$1 AND m.usuario_id=$2 AND m.status='active' AND t.status='active' AND u.clerk_user_id=$3
    FOR SHARE OF m,t,u`,[session.tenantId,session.sharedUserId,session.clerkUserId])
  const member = members.rows[0]
  if (!member) throw new PluginError('ACCESS_DENIED','Vinculo com a empresa revogado.',403)
  if (member.role === 'owner' || member.role === 'admin') return
  const permissions = await client.query('SELECT capability FROM shared.permissoes_perfil WHERE perfil_acesso_id=$1 AND capability=$2 FOR SHARE',[member.perfil_acesso_id,capability])
  if (!permissions.rows[0]) throw new PluginError('ACCESS_DENIED','Permissao revogada.',403)
}

export async function decideApproval(id:string,session:ErpAccessContext,decision:'save'|'cancel') {
  return runWithErpDatabaseContext({tenantId:session.tenantId,userId:session.sharedUserId,statementTimeoutMs:10000},() => withTransaction(async client => {
    await client.query("SELECT set_config('statement_timeout','10000',true),set_config('lock_timeout','5000',true)")
    const result = await client.query("SELECT * FROM plugin.drafts WHERE id=$1 AND empresa_id=$2 AND user_id=$3 AND integration='chatgpt' FOR UPDATE",[id,session.tenantId,session.sharedUserId])
    const row = result.rows[0] as DraftRow | undefined
    if (!row) throw new PluginError('NOT_FOUND','Rascunho nao disponivel nesta conta e empresa.',404)
    const proposal = proposalSchema.parse(row.proposal)
    proposalPreview(proposal)
    for(const capability of proposalCapabilities(proposal))await assertCurrentAccess(client,session,capability)
    if (row.status === 'saved' && decision === 'save') return {status:'saved',registro_id:row.record_id}
    if (row.status === 'cancelled' && decision === 'cancel') return {status:'cancelled',registro_id:null}
    if (row.status !== 'pending') throw new PluginError('INVALID_STATE','Este rascunho ja foi encerrado.',409)
    if (new Date(row.expires_at).getTime() <= Date.now()) throw new PluginError('DRAFT_EXPIRED','O rascunho expirou. Prepare uma nova proposta.',409)
    let recordId:string|null = null
    if (decision === 'save') {
      await proposalReferences(session.tenantId,proposal,client)
      if ('registro_id' in proposal.dados) {
        const snapshot=await operationSnapshot(session.tenantId,proposal,client)
        if(!snapshot||!row.target_snapshot||snapshot.hash!==row.target_snapshot.hash)throw new PluginError('STALE_PROPOSAL','O registro mudou. Prepare uma nova proposta para revisar os dados atuais.',409)
        recordId=await runWithErpTransactionClient(client,()=>executeOperation(session.tenantId,session.sharedUserId,proposal,`chatgptplugin:${row.id}`))
      } else if(proposal.tipo==='nota_servico'){
        recordId=(await runWithErpTransactionClient(client,()=>createServiceInvoice(session.tenantId,session.sharedUserId,proposal.dados,`chatgptplugin:${row.id}`))).record.id
      } else if(proposal.tipo==='conta_pagar'||proposal.tipo==='conta_receber'){
        recordId=await createManualFinancialTitle(client,session.tenantId,session.sharedUserId,proposal.tipo==='conta_pagar'?'pagar':'receber',proposal.dados,`chatgptplugin:${row.id}`)
      } else {
        const record = await createErpEntityWithClient(client,{tenantId:session.tenantId,actorId:session.sharedUserId,
          entityId:proposalEntity(proposal),values:proposalValues(proposal),idempotencyKey:`chatgptplugin:${row.id}`})
        recordId = String(record.id)
      }
    }
    const status = decision === 'save' ? 'saved' : 'cancelled'
    await client.query("UPDATE plugin.drafts SET status=$2,record_id=$3,decided_at=now() WHERE id=$1 AND integration='chatgpt'",[id,status,recordId])
    // Auditoria e operacao pertencem a mesma transacao: falha em qualquer etapa desfaz tudo.
    await client.query(`INSERT INTO plugin.executions(id,user_id,empresa_id,oauth_client_id,tool_name,status,duration_ms,finished_at,integration)
      VALUES ($1,$2,$3,$4,$5,'succeeded',0,now(),'chatgpt')`,[randomUUID(),session.sharedUserId,session.tenantId,row.oauth_client_id,decision === 'save' ? 'aprovar_rascunho' : 'cancelar_rascunho'])
    return {status,registro_id:recordId}
  }))
}

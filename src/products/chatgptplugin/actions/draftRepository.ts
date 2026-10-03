import { randomUUID } from 'node:crypto'
import { pluginQuery } from '../shared/database'
import { PluginError, type PluginPrincipal } from '../shared/contracts'
import { proposalSchema, proposalPreview, type Proposal } from './contracts'
import type { PluginConfig } from '../shared/config'
import { proposalReferences } from './references'

export type DraftRow = { id:string;tenant_id:number;user_id:number;oauth_client_id:string;proposal:Proposal;
  status:'pending'|'saved'|'cancelled'|'expired';record_id:string|null;created_at:string;expires_at:string;decided_at:string|null }
export function draftView(row: DraftRow, config: Pick<PluginConfig,'resource'>) {
  const status = row.status === 'pending' && new Date(row.expires_at).getTime() <= Date.now() ? 'expired' : row.status
  return {rascunho_id:row.id,empresa_id:Number(row.tenant_id),status,registro_id:row.record_id,
    criado_em:row.created_at,expira_em:row.expires_at,proposta:proposalPreview(proposalSchema.parse(row.proposal)),
    revisao_url:new URL(`/chatgptplugin/approvals/${row.id}`,config.resource).href}
}
export async function prepareDraft(principal: PluginPrincipal, tenantId:number, key:string, proposal:Proposal, config:PluginConfig) {
  proposalPreview(proposal)
  await proposalReferences(tenantId,proposal)
  if (Buffer.byteLength(JSON.stringify(proposal)) > 24000) throw new PluginError('INVALID_INPUT','O rascunho excede o tamanho permitido.')
  const rows = await pluginQuery<DraftRow & {matches:boolean}>(
    `INSERT INTO shared.chatgptplugin_drafts(id,tenant_id,user_id,oauth_client_id,operation_key,proposal)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)
     ON CONFLICT (tenant_id,user_id,oauth_client_id,operation_key) DO UPDATE SET operation_key=EXCLUDED.operation_key
     RETURNING *,proposal=$6::jsonb AS matches`, [randomUUID(),tenantId,principal.userId,principal.clientId,key,JSON.stringify(proposal)])
  if (!rows[0].matches) throw new PluginError('IDEMPOTENCY_CONFLICT','Esta chave ja foi usada para outro rascunho.',409)
  return draftView(rows[0],config)
}
export async function getDraft(principal:PluginPrincipal,tenantId:number,id:string,config:PluginConfig) {
  const rows=await pluginQuery<DraftRow>('SELECT * FROM shared.chatgptplugin_drafts WHERE tenant_id=$1 AND user_id=$2 AND oauth_client_id=$3 AND id=$4',[tenantId,principal.userId,principal.clientId,id])
  if (!rows[0]) throw new PluginError('NOT_FOUND','Rascunho nao disponivel.',404)
  return draftView(rows[0],config)
}
export async function listDrafts(principal:PluginPrincipal,tenantId:number,page:number,size:number,config:PluginConfig) {
  const rows=await pluginQuery<DraftRow>('SELECT * FROM shared.chatgptplugin_drafts WHERE tenant_id=$1 AND user_id=$2 AND oauth_client_id=$3 ORDER BY created_at DESC,id DESC LIMIT $4 OFFSET $5',[tenantId,principal.userId,principal.clientId,size+1,(page-1)*size])
  return {records:rows.slice(0,size).map(row => draftView(row,config)),page,pageSize:size,hasMore:rows.length>size}
}
export const actionDependencies = {prepare:prepareDraft,get:getDraft,list:listDrafts}
export type ActionDependencies = typeof actionDependencies

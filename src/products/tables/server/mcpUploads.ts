import { z } from 'zod'
import type { AuthTenantContext } from '@/products/auth/shared/authContracts'
import { withTablesControlTransaction,withTablesClient } from './database'
import { applyMcp,operationSnapshot,type Input } from './mcp'
import { attachmentAction } from './storage'
import { lockRecord,readRecord,requireTable } from './repository'
import { TablesError } from '../shared/contracts'

const metadata=z.object({acao:z.literal('iniciar'),nome:z.string().min(1).max(200),mime_type:z.string().min(1).max(150),tamanho:z.number().int().positive().max(50*1024*1024)}).strict()
const command=z.union([metadata,z.object({acao:z.literal('confirmar')}).strict()])
export async function mcpUpload(session:AuthTenantContext,id:string,body?:unknown,transaction=withTablesControlTransaction):Promise<Input> {
 return transaction(async db=>{
  const member=(await db.query("SELECT m.role FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=m.empresa_id WHERE m.empresa_id=$1 AND m.usuario_id=$2 AND u.clerk_user_id=$3 AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active' FOR SHARE OF m,u,e",[session.tenantId,session.sharedUserId,session.clerkUserId])).rows[0]
  if(!member||!['owner','admin','member'].includes(member.role))throw new TablesError('FORBIDDEN','Seu acesso não permite enviar arquivos.',403)
  const row=(await db.query("SELECT * FROM plugin.drafts WHERE id=$1 AND domain='tables' AND operation_type='preparar_upload' AND status='saved' AND empresa_id=$2 AND user_id=$3 FOR UPDATE",[id,session.tenantId,session.sharedUserId])).rows[0]
  if(!row)throw new TablesError('NOT_FOUND','Envio não disponível nesta conta e empresa.',404)
  const actor={tenantId:session.tenantId,sharedUserId:session.sharedUserId,role:member.role}
  const product=async <T,>(fn:Parameters<typeof withTablesClient<T>>[3])=>withTablesClient(db,actor,row.id,fn)
  const record=await product(async client=>{const r=await readRecord(client,actor,row.proposal.dados.registro_id);await requireTable(client,actor,r.tabela_id);return r})
  if(row.result?.anexo_id) {
   const file=await product(async client=>(await client.query('SELECT nome,tamanho::text,mime_type,estado,criado_em FROM tables.anexos WHERE empresa_id=$1 AND id=$2 AND registro_id=$3',[actor.tenantId,row.result.anexo_id,record.id])).rows[0])
   if(!file||file.estado==='excluido')throw new TablesError('NOT_FOUND','Este envio não está mais disponível.',404)
   if(file.estado==='confirmado')return {status:'confirmado',nome:file.nome}
   if(Date.now()-new Date(file.criado_em).getTime()>110*60000)throw new TablesError('EXPIRED_UPLOAD','O prazo deste envio terminou. Prepare outro pelo chat.',409)
  } else if(Date.now()>new Date(row.expires_at).getTime())throw new TablesError('EXPIRED_UPLOAD','O prazo deste envio terminou. Prepare outro pelo chat.',409)
  if(body===undefined)return {status:'aguardando_envio',nome:row.proposal.dados.nome||null,tamanho:row.proposal.dados.tamanho||null}
  const input=command.parse(body)
  if(input.acao==='confirmar') {
   if(!row.result?.anexo_id)throw new TablesError('PENDING_FILE','Selecione e envie um arquivo primeiro.')
   await product(client=>attachmentAction(client,actor,row.result.anexo_id,'confirmar'))
   const result={...row.result,status:'confirmado'};await db.query('UPDATE plugin.drafts SET result=$2::jsonb WHERE id=$1',[id,JSON.stringify(result)])
   return {status:'confirmado',nome:row.proposal.dados.nome||null}
  }
  if(row.result?.anexo_id)return {status:'aguardando_envio',upload_url:row.result.upload_url,anexo_id:row.result.anexo_id}
  for(const key of ['nome','mime_type','tamanho'] as const)if(row.proposal.dados[key]!==undefined&&row.proposal.dados[key]!==input[key])throw new TablesError('INVALID_FILE','O arquivo escolhido não corresponde ao informado no chat.')
  const result=await product(async client=>{
   await lockRecord(client,actor,record.id)
   const snapshot=await operationSnapshot(client,actor,'preparar_upload',row.proposal.dados)
   if(snapshot.hash!==row.target_snapshot.hash)throw new TablesError('STALE_PROPOSAL','O registro mudou. Prepare novo envio pelo chat.',409)
   return applyMcp(client,actor,'preparar_upload',{...row.proposal.dados,nome:input.nome,mime_type:input.mime_type,tamanho:input.tamanho})
  })
  await db.query('UPDATE plugin.drafts SET result=$2::jsonb WHERE id=$1',[id,JSON.stringify(result)])
  return result
 })
}

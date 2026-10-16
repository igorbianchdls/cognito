import { randomUUID } from 'node:crypto'
import type { Database, TablesSession } from '@/products/tables/server/database'
import { withTablesClient, withTablesControlTransaction } from '@/products/tables/server/database'
import { applyMcp, operationSnapshot, type Input } from '@/products/tables/server/mcp'
import { TablesError } from '@/products/tables/shared/contracts'
import type { PluginPrincipal } from '../../../shared/contracts'
import { PluginError } from '../../../shared/contracts'
import type { PluginConfig } from '../../../shared/config'

export type TablesDependencies={transaction:typeof withTablesControlTransaction}
export const tablesDependencies:TablesDependencies={transaction:withTablesControlTransaction}

export async function currentSession(db:Database,principal:PluginPrincipal,companyId:number,write=false):Promise<TablesSession> {
 const member=(await db.query("SELECT m.role FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=m.empresa_id WHERE m.empresa_id=$1 AND m.usuario_id=$2 AND u.clerk_user_id=$3 AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active' FOR SHARE OF m,u,e",[companyId,principal.userId,principal.clerkUserId])).rows[0]
 if(!member||!['owner','admin','member','viewer'].includes(member.role))throw new PluginError('ACCESS_DENIED','Vínculo com a empresa indisponível.',403)
 if(write&&member.role==='viewer')throw new PluginError('ACCESS_DENIED','Seu acesso permite apenas consultas.',403)
 return {tenantId:companyId,sharedUserId:principal.userId,role:member.role}
}
const scoped="domain='tables' AND integration=$1 AND empresa_id=$2 AND user_id=$3 AND oauth_client_id=$4"
function scope(principal:PluginPrincipal,company:number,config:PluginConfig){return [config.integration,company,principal.userId,principal.clientId]}
function view(row:Input,config:PluginConfig) {
 const expired=row.status==='pending'&&new Date(row.expires_at).getTime()<=Date.now()
 const result=row.result?{...row.result}:null
 if(result&&row.operation_type==='preparar_upload') {
   delete result.upload_url
   result.upload_form_url=new URL(`/tables/upload/${row.id}`,config.resource).href
 }
 return {operacao_id:row.id,rascunho_id:row.id,status:expired?'expired':row.status,tool:'tables_'+row.operation_type,criado_em:row.created_at,expira_em:row.expires_at,previa:row.target_snapshot?.preview||null,resultado:result,
  ...(row.status==='pending'&&!expired?{confirmar:{tool:'tables_'+row.operation_type,argumentos:{empresa_id:Number(row.empresa_id),rascunho_id:row.id}}}:{})}
}
export async function getOperation(db:Database,principal:PluginPrincipal,company:number,input:Input,config:PluginConfig) {
 if(Boolean(input.operacao_id)===Boolean(input.chave_operacao))throw new PluginError('INVALID_INPUT','Informe operacao_id ou chave_operacao.')
 const row=(await db.query(`SELECT * FROM plugin.drafts WHERE ${scoped} AND ${input.operacao_id?'id':'operation_key'}=$5`,[...scope(principal,company,config),input.operacao_id||input.chave_operacao])).rows[0]
 if(!row)throw new PluginError('NOT_FOUND','Operação não disponível nesta conexão.',404)
 const result=view(row,config)
 if(result.resultado?.anexo_id&&row.operation_type==='preparar_upload') {
  const a=(await db.query('SELECT estado FROM tables.anexos WHERE empresa_id=$1 AND id=$2',[company,result.resultado.anexo_id])).rows[0]
  result.resultado.status=a?.estado==='confirmado'?'confirmado':a?.estado==='pendente'?'aguardando_envio':'indisponivel'
 }
 return result
}
async function lockTargets(db:Database,session:TablesSession,snapshot:Input) {
 for(const [kind,key] of [['bases','bases'],['tabelas','tabelas'],['registros','registros']] as const) {
  const ids=[...new Set<string>([...(snapshot[key]||[]).map((item:Input)=>item.id),...(snapshot.itens||[]).filter((item:Input)=>item.tipo===kind).map((item:Input)=>item.id)])].sort()
  if(ids.length)await db.query(`SELECT id FROM tables.${kind} WHERE empresa_id=$1 AND id=ANY($2::uuid[]) ORDER BY id FOR UPDATE`,[session.tenantId,ids])
 }
}
export async function runAction(db:Database,principal:PluginPrincipal,session:TablesSession,name:string,input:Input,config:PluginConfig) {
 const params=scope(principal,session.tenantId,config)
 if(input.rascunho_id) {
  if(input.dados!==undefined||input.chave_operacao!==undefined)throw new PluginError('INVALID_INPUT','Para confirmar, envie somente empresa_id e rascunho_id.')
  const row=(await db.query(`SELECT * FROM plugin.drafts WHERE ${scoped} AND id=$5 FOR UPDATE`,[...params,input.rascunho_id])).rows[0]
  if(!row)throw new PluginError('NOT_FOUND','Prévia não disponível nesta conexão.',404)
  if(row.operation_type!==name)throw new PluginError('INVALID_INPUT','Use a mesma tool que preparou a prévia.')
  if(row.status==='saved')return view(row,config)
  if(row.status!=='pending')throw new PluginError('INVALID_STATE','Esta operação já foi encerrada.',409)
  if(new Date(row.expires_at).getTime()<=Date.now())throw new PluginError('DRAFT_EXPIRED','A prévia expirou. Prepare outra.',409)
  const result=await withTablesClient(db,session,row.id,async client=>{
   await lockTargets(client,session,row.target_snapshot.snapshot)
   const snapshot=await operationSnapshot(client,session,name,row.proposal.dados)
   if(snapshot.hash!==row.target_snapshot.hash)throw new PluginError('STALE_PROPOSAL','Os dados mudaram. Prepare nova prévia.',409)
   return applyMcp(client,session,name,row.proposal.dados)
  })
  await db.query("UPDATE plugin.drafts SET status='saved',result=$2::jsonb,decided_at=now() WHERE id=$1",[row.id,JSON.stringify(result)])
  await db.query("INSERT INTO plugin.executions(id,user_id,empresa_id,oauth_client_id,tool_name,status,duration_ms,finished_at,integration) VALUES($1,$2,$3,$4,$5,'succeeded',0,now(),$6)",[randomUUID(),principal.userId,session.tenantId,principal.clientId,'tables_'+name,config.integration])
  return view({...row,status:'saved',result},config)
 }
 if(!input.chave_operacao||!input.dados)throw new PluginError('INVALID_INPUT','Informe chave_operacao e dados para preparar a prévia.')
 if(Buffer.byteLength(JSON.stringify(input.dados))>24000)throw new PluginError('INVALID_INPUT','Os dados excedem o tamanho técnico da operação. Reduza o lote ou o texto.')
 // Serialize preparations by identity and key, including the domain. This also
 // prevents two concurrent requests from returning different previews.
 await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[JSON.stringify([...params,'tables',input.chave_operacao])])
 const old=(await db.query(`SELECT *,proposal=$6::jsonb AS matches FROM plugin.drafts WHERE ${scoped} AND operation_key=$5`,[...params,input.chave_operacao,JSON.stringify({tipo:name,dados:input.dados})])).rows[0]
 if(old){if(!old.matches)throw new PluginError('IDEMPOTENCY_CONFLICT','Esta chave já foi usada com outros dados.',409);return view(old,config)}
 const snapshot=await withTablesClient(db,session,randomUUID(),client=>operationSnapshot(client,session,name,input.dados))
 // Validate using the real product services and constraints, rolling back every
 // simulated write (including its audit/version changes) before saving a draft.
 await db.query('SAVEPOINT tables_preview')
 try {await withTablesClient(db,session,randomUUID(),client=>applyMcp(client,session,name,input.dados,true))}
 catch(error){await db.query('ROLLBACK TO SAVEPOINT tables_preview');throw error}
 await db.query('ROLLBACK TO SAVEPOINT tables_preview');await db.query('RELEASE SAVEPOINT tables_preview')
 const preview={titulo:'tables_'+name,referencias:snapshot.referencias,alteracoes:input.dados,...(name==='excluir_visualizacao'?{aviso:'Exclusão definitiva da visualização. Os registros são preservados.'}:{})}
 const row=(await db.query("INSERT INTO plugin.drafts(id,empresa_id,user_id,oauth_client_id,operation_key,proposal,target_snapshot,integration,domain,operation_type) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,'tables',$9) RETURNING *",[randomUUID(),session.tenantId,principal.userId,principal.clientId,input.chave_operacao,JSON.stringify({tipo:name,dados:input.dados}),JSON.stringify({...snapshot,preview}),config.integration,name])).rows[0]
 return view(row,config)
}
export async function cancelOperation(db:Database,principal:PluginPrincipal,company:number,id:string,config:PluginConfig) {
 const row=(await db.query(`SELECT * FROM plugin.drafts WHERE ${scoped} AND id=$5 FOR UPDATE`,[...scope(principal,company,config),id])).rows[0]
 if(!row)throw new PluginError('NOT_FOUND','Operação não disponível.',404)
 if(row.status==='cancelled')return view(row,config)
 if(row.status!=='pending')throw new TablesError('INVALID_STATE','Somente prévias pendentes podem ser canceladas.',409)
 await db.query("UPDATE plugin.drafts SET status='cancelled',decided_at=now() WHERE id=$1",[id])
 return view({...row,status:'cancelled'},config)
}

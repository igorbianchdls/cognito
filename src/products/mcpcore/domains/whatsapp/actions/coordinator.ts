import { randomUUID } from 'node:crypto'
import type { PluginPrincipal } from '../../../shared/contracts'
import type { PluginConfig } from '../../../shared/config'
import { transaction,currentSession,restricted } from '../server/database'
import { requireConnection,authorizeArguments,tokens,resultData,type Connection } from '../server/repository'
import { unseal } from '../server/credentials'
import { openRemote } from '../server/mcpClient'
import { WhatsAppError,type Json,type WhatsAppSession } from '../server/contracts'
import { contractSchema,digest,sensitiveField,publicContract,type RemoteContract } from '../schemas/upstreamContracts'
import { remoteTools,type RemoteTool } from '../tools/catalog'
export type Dependencies={transaction:typeof transaction;restricted:typeof restricted;requireConnection:typeof requireConnection;openRemote:typeof openRemote}
export const dependencies:Dependencies={transaction,restricted,requireConnection,openRemote}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Draft=Record<string,any>
const owner="domain='whatsapp' AND integration=$1 AND empresa_id=$2 AND user_id=$3 AND oauth_client_id=$4"
const scope=(p:PluginPrincipal,company:number,c:PluginConfig)=>[c.integration,company,p.userId,p.clientId]
export function rejectSecrets(value:unknown,parent=''){if(Array.isArray(value)){value.forEach(v=>rejectSecrets(v,parent));return}if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){if(sensitiveField(k,parent))throw new WhatsAppError('SENSITIVE_INPUT','Preencha códigos e segredos somente na tela protegida.',422);rejectSecrets(v,k)}}
export function cleanResult(value:unknown,parent='',secrets:string[]=[]):unknown{if(Array.isArray(value))return value.map(v=>cleanResult(v,parent,secrets));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!sensitiveField(k,parent)&&!/^(refresh_token|authorization|credenciais_cifradas)$/i.test(k)).map(([k,v])=>[k,cleanResult(v,k,secrets)]));if(typeof value==='string')return secrets.filter(Boolean).reduce((text,secret)=>text.replaceAll(secret,'[protegido]'),value);return value}
function view(row:Draft,execution?:Draft,base=''){
 const expired=row.status==='pending'&&new Date(row.expires_at).getTime()<Date.now()&&!execution
 return {operacao_id:row.id,status:execution?.estado|| (expired?'expired':row.status),tool:row.operation_type,previa:row.target_snapshot?.preview,resultado:execution?.resultado||row.result||null,
  ...(execution?.estado==='indeterminada'?{aviso:'A chamada pode ter sido aceita pela Meta. Verifique o resultado antes de criar outra operação.'}:{}),
  ...(row.status==='pending'&&!execution&&!expired?{confirmar:{tool:row.operation_type,argumentos:{empresa_id:Number(row.empresa_id),conexao_id:row.proposal.conexao_id,rascunho_id:row.id}},...(row.proposal.sensitive?{etapa_protegida_url:base+'/whatsapp/etapa/'+row.id}:{})}:{})}
}
export async function operation(p:PluginPrincipal,company:number,input:Json,c:PluginConfig,cancel=false,deps=dependencies){
 if(Boolean(input.operacao_id)===Boolean(input.chave_operacao))throw new WhatsAppError('INVALID_INPUT','Informe somente operacao_id ou chave_operacao.',422)
 return deps.transaction(async db=>{await currentSession(db,p.userId,company,cancel);const row=(await db.query(`SELECT * FROM plugin.drafts WHERE ${owner} AND ${input.operacao_id?'id':'operation_key'}=$5 FOR UPDATE`,[...scope(p,company,c),input.operacao_id||input.chave_operacao])).rows[0];if(!row)throw new WhatsAppError('NOT_FOUND','Operação não disponível nesta conexão.',404)
  let execution=(await db.query('SELECT * FROM whatsapp.execucoes_remotas WHERE rascunho_id=$1',[row.id])).rows[0]
  if(execution?.estado==='em_execucao'&&new Date(execution.iniciado_em).getTime()<Date.now()-60000){execution=(await db.query("UPDATE whatsapp.execucoes_remotas SET estado='indeterminada',finalizado_em=now(),erro='WORKER_INTERRUPTED' WHERE id=$1 AND estado='em_execucao' RETURNING *",[execution.id])).rows[0]}
  if(cancel){if(execution||row.status!=='pending')throw new WhatsAppError('INVALID_STATE','A operação já começou ou foi encerrada.',409);await db.query("UPDATE plugin.drafts SET status='cancelled',decided_at=now() WHERE id=$1",[row.id]);row.status='cancelled'}
  return view(row,execution,new URL(c.resource).origin)
 })
}
async function freshGateway(s:WhatsAppSession,c:Connection,tool:RemoteTool,deps:Dependencies){const gateway=await deps.openRemote(tokens(c,s));try{const fresh=(await gateway.contracts()).find(t=>t.name===tool.remote);if(!fresh||digest(fresh.inputSchema)!==digest(tool.contract.inputSchema))throw new WhatsAppError('META_CONTRACT_CHANGED','O contrato da Meta mudou. Reconecte para atualizar as ferramentas.',409);return gateway}catch(e){await gateway.close();throw e}}
export async function invokeRemote(p:PluginPrincipal,company:number,name:string,input:Json,config:PluginConfig,deps=dependencies){
 const s=await deps.transaction(db=>currentSession(db,p.userId,company)),c=await deps.requireConnection(s,String(input.conexao_id)),tool=remoteTools(c.contratos).find(t=>t.name===name)
 if(!tool)throw new WhatsAppError('META_TOOL_UNAVAILABLE','Esta ferramenta não está disponível no contrato autenticado da sua conexão.',409)
 tool.schema.parse(input)
 if(tool.write&&s.role==='viewer')throw new WhatsAppError('READ_ONLY','Seu acesso permite somente consultas.',403)
 if(tool.write&&!p.scopes.includes('erp:write'))throw new WhatsAppError('INSUFFICIENT_SCOPE','Reconecte o Cognito com permissão de escrita.',403)
 if(!tool.write){
  const args=contractSchema(tool.contract.inputSchema).parse(input.dados) as Json;rejectSecrets(args)
  if(tool.key==='listar_empresas')return {empresas:c.recursos}
  await deps.restricted(s,db=>authorizeArguments(db,s,c,args));const gateway=await freshGateway(s,c,tool,deps)
  try{const r=await gateway.call(tool.remote,args);if(r.isError)throw new WhatsAppError('META_READ_FAILED','A Meta não concluiu a consulta.',503);await updateCache(s,c,tool,args,r,deps);return {retorno_meta:cleanResult(resultData(r)||r)}}finally{await gateway.close()}
 }
 if(input.rascunho_id)return confirm(p,s,c,tool,input,config,deps)
 if(!input.chave_operacao||!input.dados)throw new WhatsAppError('INVALID_INPUT','Informe chave_operacao e dados para preparar a prévia.',422)
 rejectSecrets(input.dados);const args=publicContract(tool.contract.inputSchema).schema.parse(input.dados) as Json
 if(Buffer.byteLength(JSON.stringify(args))>24000)throw new WhatsAppError('INVALID_INPUT','Reduza os dados desta operação.',413)
 await deps.restricted(s,db=>authorizeArguments(db,s,c,args))
 return deps.transaction(async db=>{
  await currentSession(db,p.userId,company,true);await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[JSON.stringify([...scope(p,company,config),'whatsapp',input.chave_operacao])]);const existing=(await db.query(`SELECT * FROM plugin.drafts WHERE ${owner} AND operation_key=$5`,[...scope(p,company,config),input.chave_operacao])).rows[0]
  const proposal={conexao_id:c.id,versao:c.versao,dados:args,sensitive:tool.sensitive,contract_hash:digest(tool.contract.inputSchema)}
  if(existing){if(existing.operation_type!==name||digest(existing.proposal)!==digest(proposal))throw new WhatsAppError('IDEMPOTENCY_CONFLICT','A chave já foi usada para outro pedido.',409);return view(existing,(await db.query('SELECT * FROM whatsapp.execucoes_remotas WHERE rascunho_id=$1',[existing.id])).rows[0],new URL(config.resource).origin)}
  const preview={titulo:tool.title,empresa_id:company,recursos:c.recursos,argumentos:args,...(tool.sensitive?{aviso:'Preencha a etapa protegida antes de confirmar.'}:{})}
  const row=(await db.query("INSERT INTO plugin.drafts(id,empresa_id,user_id,oauth_client_id,operation_key,proposal,target_snapshot,integration,domain,operation_type) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,'whatsapp',$9) RETURNING *",[randomUUID(),company,p.userId,p.clientId,input.chave_operacao,JSON.stringify(proposal),JSON.stringify({preview}),config.integration,name])).rows[0]
  return view(row,undefined,new URL(config.resource).origin)
 })
}
async function confirm(p:PluginPrincipal,s:WhatsAppSession,c:Connection,tool:RemoteTool,input:Json,config:PluginConfig,deps:Dependencies){
 if(input.chave_operacao!==undefined||input.dados!==undefined)throw new WhatsAppError('INVALID_INPUT','Confirme somente com empresa_id, conexao_id e rascunho_id.',422)
 // Check persisted execution before any remote initialization, including repeated confirmations.
 const existing=await deps.transaction(async db=>{await currentSession(db,p.userId,s.tenantId,true);const row=(await db.query(`SELECT * FROM plugin.drafts WHERE ${owner} AND id=$5`,[...scope(p,s.tenantId,config),input.rascunho_id])).rows[0];if(!row)throw new WhatsAppError('NOT_FOUND','Prévia não disponível.',404);if(row.operation_type!==tool.name||row.proposal.conexao_id!==c.id)throw new WhatsAppError('INVALID_INPUT','A prévia pertence a outra ferramenta ou conexão.',409);const ex=(await db.query('SELECT * FROM whatsapp.execucoes_remotas WHERE rascunho_id=$1',[row.id])).rows[0];return {row,ex}})
 if(existing.ex||existing.row.status==='saved')return view(existing.row,existing.ex)
 const gateway=await freshGateway(s,c,tool,deps);let claimed:{row:Draft;execution:Draft;args:Json;secrets:string[]}|undefined
 try{
  const reservation=await deps.transaction(async db=>{
   await currentSession(db,p.userId,s.tenantId,true);const row=(await db.query(`SELECT * FROM plugin.drafts WHERE ${owner} AND id=$5 FOR UPDATE`,[...scope(p,s.tenantId,config),input.rascunho_id])).rows[0]
   if(!row)throw new WhatsAppError('NOT_FOUND','Prévia indisponível.',404)
   const ex=(await db.query('SELECT * FROM whatsapp.execucoes_remotas WHERE rascunho_id=$1',[row.id])).rows[0];if(ex)return {row,ex}
   if(row.status!=='pending'||new Date(row.expires_at).getTime()<=Date.now())throw new WhatsAppError('DRAFT_EXPIRED','A prévia expirou ou foi encerrada.',409)
   const current=(await db.query("SELECT versao,estado FROM whatsapp.conexoes WHERE id=$1 AND empresa_id=$2 AND usuario_id=$3 FOR UPDATE",[c.id,s.tenantId,s.sharedUserId])).rows[0]
   if(!current||current.estado!=='ativa'||current.versao!==row.proposal.versao||digest(tool.contract.inputSchema)!==row.proposal.contract_hash)throw new WhatsAppError('STALE_PROPOSAL','A autorização mudou. Prepare uma nova prévia.',409)
   let extra:Json={}
   if(tool.sensitive){const secret=(await db.query("DELETE FROM whatsapp.sessoes_autorizacao WHERE empresa_id=$1 AND usuario_id=$2 AND conexao_id=$3 AND finalidade='etapa_sensivel' AND estado_hash=$4 AND consumido_em IS NULL AND expira_em>now() RETURNING dados_cifrados",[s.tenantId,s.sharedUserId,c.id,digest(row.id)])).rows[0];if(!secret)throw new WhatsAppError('SENSITIVE_STEP_REQUIRED','Preencha a etapa protegida antes de confirmar.',409);extra=unseal<Json>(secret.dados_cifrados,`whatsapp:${s.tenantId}:${s.sharedUserId}:${row.id}:step`)}
   const args=contractSchema(tool.contract.inputSchema).parse({...row.proposal.dados,...extra}) as Json
   await authorizeArguments(db,s,c,args)
   const execution=(await db.query("INSERT INTO whatsapp.execucoes_remotas(id,empresa_id,usuario_id,conexao_id,rascunho_id,oauth_client_id,integration,tool_name,argumentos_hash,estado,iniciado_em) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'em_execucao',now()) RETURNING *",[randomUUID(),s.tenantId,s.sharedUserId,c.id,row.id,p.clientId,config.integration,tool.name,digest({publicos:row.proposal.dados,campos_protegidos:Object.keys(extra).sort()})])).rows[0]
   return {row,execution,args,secrets:Object.values(extra).filter(v=>v!==undefined&&v!==null).map(String)}
  })
  if('ex'in reservation)return view(reservation.row,reservation.ex)
  claimed=reservation
  let result:Json
  try{const remote=await gateway.call(tool.remote,claimed.args);if(remote.isError)throw new WhatsAppError('META_REMOTE_UNCERTAIN','A Meta retornou um erro; verifique o efeito antes de repetir.',503);result={retorno_meta:cleanResult(resultData(remote)||remote,'',claimed.secrets),aviso:'Resposta recebida da Meta. Verifique o conteúdo para saber se há etapas pendentes; isso não comprova entrega da mensagem.'}}
  catch{await deps.transaction(db=>db.query("UPDATE whatsapp.execucoes_remotas SET estado='indeterminada',erro='REMOTE_RESULT_UNKNOWN',finalizado_em=now() WHERE id=$1 AND estado='em_execucao'",[claimed!.execution.id]));return view(claimed.row,{...claimed.execution,estado:'indeterminada'})}
  try{return await deps.transaction(async db=>{await db.query("UPDATE whatsapp.execucoes_remotas SET estado='concluida',resultado=$2::jsonb,finalizado_em=now() WHERE id=$1 AND estado IN ('em_execucao','indeterminada')",[claimed!.execution.id,JSON.stringify(result)]);await db.query("UPDATE plugin.drafts SET status='saved',result=$2::jsonb,decided_at=now() WHERE id=$1 AND domain='whatsapp'",[claimed!.row.id,JSON.stringify(result)]);return view({...claimed!.row,status:'saved',result},{...claimed!.execution,estado:'concluida',resultado:result})})}catch{throw new WhatsAppError('META_RESULT_PERSISTENCE_FAILED','A Meta respondeu, mas o resultado não foi salvo. Consulte a operação antes de repetir.',503)}
 }finally{await gateway.close().catch(()=>{})}
}
async function updateCache(s:WhatsAppSession,c:Connection,tool:RemoteTool,args:Json,result:Json,deps:Dependencies){
 if(!['listar_contas','listar_numeros'].includes(tool.key))return
 const data=resultData(result),container=data&&typeof data==='object'&&!Array.isArray(data)?data as Json:null
 const list=Array.isArray(data)?data:container?.data||container?.accounts||container?.phone_numbers
 if(!Array.isArray(list))return
 const rows=list.filter((v):v is Json=>!!v&&typeof v==='object'&&!Array.isArray(v)&&typeof v.id==='string'&&/^\d{1,100}$/.test(v.id))
 if(rows.length!==list.length)return
 // Cache only unambiguous lists under one explicit parent; never import nested unrelated IDs.
 if(rows.length>100||new Set(rows.map(r=>r.id)).size!==rows.length)return
 await deps.restricted(s,async db=>{
  const latest=(await db.query("SELECT versao FROM whatsapp.conexoes WHERE id=$1 AND estado='ativa'",[c.id])).rows[0];if(latest?.versao!==c.versao)return
  const business=Object.entries(args).find(([k])=>['business_id','businessId','business_account_id','businessAccountId'].includes(k))?.[1]
  const account=Object.entries(args).find(([k])=>['waba_id','wabaId','whatsapp_business_account_id','whatsappBusinessAccountId','account_id','accountId'].includes(k))?.[1]
  if(tool.key==='listar_contas'&&typeof business==='string'){for(const r of rows)await db.query("INSERT INTO whatsapp.contas(empresa_id,usuario_id,conexao_id,meta_business_id,meta_account_id,nome) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(empresa_id,usuario_id,conexao_id,meta_account_id) DO UPDATE SET nome=EXCLUDED.nome,consultado_em=now()",[s.tenantId,s.sharedUserId,c.id,business,r.id,typeof r.name==='string'?r.name.slice(0,150):''])}
  if(tool.key==='listar_numeros'&&typeof account==='string'){const parent=(await db.query('SELECT id FROM whatsapp.contas WHERE conexao_id=$1 AND meta_account_id=$2',[c.id,account])).rows[0];if(parent)for(const r of rows)await db.query("INSERT INTO whatsapp.numeros(empresa_id,usuario_id,conexao_id,conta_id,meta_phone_id,numero,nome,estado) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(empresa_id,usuario_id,conexao_id,meta_phone_id) DO UPDATE SET numero=EXCLUDED.numero,nome=EXCLUDED.nome,estado=EXCLUDED.estado,consultado_em=now()",[s.tenantId,s.sharedUserId,c.id,parent.id,r.id,String(r.display_phone_number||'').slice(0,80),String(r.verified_name||'').slice(0,150),String(r.status||'').slice(0,80)])}
 })
}
export async function contractsForUser(p:PluginPrincipal,deps=dependencies):Promise<RemoteContract[]>{
 const all:RemoteContract[][]=[]
 for(const company of p.companies){const session=await deps.transaction(db=>currentSession(db,p.userId,company.id));const rows=await deps.restricted(session,db=>db.query("SELECT contratos FROM whatsapp.conexoes WHERE empresa_id=$1 AND usuario_id=$2 AND estado='ativa' AND (expira_em IS NULL OR expira_em>now()+interval '30 seconds')",[company.id,p.userId]));for(const row of rows.rows)all.push(row.contratos)}
 // Expose a name only when all active connections agree on its input contract.
 const contracts=new Map<string,RemoteContract>(),conflicts=new Set<string>()
 for(const list of all)for(const t of list){if(contracts.has(t.name)&&digest(contracts.get(t.name)!.inputSchema)!==digest(t.inputSchema))conflicts.add(t.name);else contracts.set(t.name,t)}
 return [...contracts.values()].filter(t=>!conflicts.has(t.name))
}

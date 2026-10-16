import { createHash,randomBytes,randomUUID } from 'node:crypto'
import { z } from 'zod'
import { requireConfiguration } from './config'
import { REMOTE,ISSUER,SCOPES,WhatsAppError,type Json,type WhatsAppSession } from './contracts'
import { restricted } from './database'
import { seal,unseal } from './credentials'
import { aad,connection,disconnect,businessChoices } from './repository'
import { openRemote,type Tokens } from './mcpClient'
import { contractSchema,digest } from '../schemas/upstreamContracts'
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex')
type OAuthState={verifier:string;client_id:string;redirect_uri:string;version:number;token_endpoint:string}
export type OAuthDependencies={restricted:typeof restricted;openRemote:typeof openRemote;fetch:typeof fetch}
export const oauthDependencies:OAuthDependencies={restricted,openRemote,fetch:(...args)=>fetch(...args)}
export async function oauthMetadata(fetcher:typeof fetch=fetch){
 const url='https://www.facebook.com/.well-known/oauth-authorization-server/whatsapp_business_tools'
 const r=await fetcher(url,{signal:AbortSignal.timeout(12000),redirect:'error',headers:{Accept:'application/json'}});if(!r.ok)throw new WhatsAppError('META_DISCOVERY_FAILED','Não foi possível consultar a autorização da Meta.',503)
 const m=await r.json() as Json
 if(m.issuer!==ISSUER||typeof m.authorization_endpoint!=='string'||!/^https:\/\/www\.facebook\.com\/v\d+\.\d+\/dialog\/oauth$/.test(m.authorization_endpoint)||typeof m.token_endpoint!=='string'||!/^https:\/\/graph\.facebook\.com\/v\d+\.\d+\/oauth\/access_token$/.test(m.token_endpoint)||!Array.isArray(m.code_challenge_methods_supported)||!m.code_challenge_methods_supported.includes('S256'))throw new WhatsAppError('META_DISCOVERY_CHANGED','O contrato de autorização da Meta mudou. A conexão precisa ser revisada.',503)
 return {authorization:m.authorization_endpoint,token:m.token_endpoint}
}
export async function startOAuth(s:WhatsAppSession,sessionId:string,deps=oauthDependencies){
 const config=requireConfiguration(),metadata=await oauthMetadata(deps.fetch),state=randomBytes(32).toString('base64url'),verifier=randomBytes(48).toString('base64url'),redirect=config.base+'/api/whatsapp/conexao/callback'
 await deps.restricted(s,async db=>{
  await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`whatsapp-oauth:${s.tenantId}:${s.sharedUserId}`]);const old=await connection(db,s),id=old?.id||randomUUID(),version=(old?.versao||0)+1
  if(old)await db.query("UPDATE whatsapp.conexoes SET estado='pendente',credenciais_cifradas=NULL,contratos='[]',versao=$2,atualizado_em=now() WHERE id=$1",[id,version]);else await db.query('INSERT INTO whatsapp.conexoes(id,empresa_id,usuario_id,versao) VALUES($1,$2,$3,$4)',[id,s.tenantId,s.sharedUserId,version])
  await db.query('DELETE FROM whatsapp.sessoes_autorizacao WHERE conexao_id=$1',[id])
  const data:OAuthState={verifier,client_id:config.clientId,redirect_uri:redirect,version,token_endpoint:metadata.token}
  await db.query("INSERT INTO whatsapp.sessoes_autorizacao(empresa_id,usuario_id,conexao_id,finalidade,estado_hash,sessao_hash,dados_cifrados,expira_em) VALUES($1,$2,$3,'oauth',$4,$5,$6,now()+interval '10 minutes')",[s.tenantId,s.sharedUserId,id,hash(state),hash(sessionId),seal(data,aad(s,id)+':oauth')])
 })
 const url=new URL(metadata.authorization);for(const [key,value] of Object.entries({response_type:'code',client_id:config.clientId,redirect_uri:redirect,scope:SCOPES.join(' '),state,code_challenge:hashBase64(verifier),code_challenge_method:'S256',resource:REMOTE}))url.searchParams.set(key,value)
 return url.href
}
function hashBase64(s:string){return createHash('sha256').update(s).digest('base64url')}
export async function finishOAuth(s:WhatsAppSession,sessionId:string,state:string,code:string,deps=oauthDependencies){
 const config=requireConfiguration();z.string().min(20).max(200).parse(state);z.string().min(1).max(8192).parse(code)
 const saved=await deps.restricted(s,async db=>{const row=(await db.query("DELETE FROM whatsapp.sessoes_autorizacao WHERE empresa_id=$1 AND usuario_id=$2 AND finalidade='oauth' AND estado_hash=$3 AND sessao_hash=$4 AND consumido_em IS NULL AND expira_em>now() RETURNING *",[s.tenantId,s.sharedUserId,hash(state),hash(sessionId)])).rows[0];if(!row)throw new WhatsAppError('OAUTH_STATE_INVALID','A autorização expirou ou pertence a outra sessão.',409);return {id:row.conexao_id as string,data:unseal<OAuthState>(row.dados_cifrados,aad(s,row.conexao_id)+':oauth')}})
 if(saved.data.client_id!==config.clientId||saved.data.redirect_uri!==config.base+'/api/whatsapp/conexao/callback')throw new WhatsAppError('OAUTH_STATE_INVALID','A configuração da conexão mudou.',409)
 try{
  const currentMetadata=await oauthMetadata(deps.fetch);if(currentMetadata.token!==saved.data.token_endpoint)throw new WhatsAppError('META_DISCOVERY_CHANGED','A configuração da Meta mudou.',503)
  const r=await deps.fetch(currentMetadata.token,{method:'POST',redirect:'error',headers:{'content-type':'application/x-www-form-urlencoded',accept:'application/json'},body:new URLSearchParams({grant_type:'authorization_code',code,code_verifier:saved.data.verifier,client_id:config.clientId,redirect_uri:saved.data.redirect_uri,resource:REMOTE}),signal:AbortSignal.timeout(12000)})
  if(!r.ok)throw new WhatsAppError('META_AUTH_FAILED','A Meta não aceitou a autorização. Inicie uma nova conexão.',409)
  const result=await r.json() as Json
  const token= z.object({access_token:z.string().min(1).max(16000),refresh_token:z.string().max(16000).optional(),expires_in:z.number().positive().optional(),scope:z.string().optional(),token_type:z.string().optional()}).passthrough().parse(result)
  if(token.token_type&&token.token_type.toLowerCase()!=='bearer')throw new WhatsAppError('META_AUTH_FAILED','Tipo de autorização não suportado.',409)
  const credentials:Tokens={access_token:token.access_token,refresh_token:token.refresh_token,scope:token.scope,token_type:token.token_type,expires_at:token.expires_in?Date.now()+token.expires_in*1000:undefined}
  const gateway=await deps.openRemote(credentials);let contracts
  try{contracts=await gateway.contracts();const list=contracts.find(c=>c.name==='whatsapp_biz_businesses');if(!list)throw new WhatsAppError('META_CONTRACT_UNAVAILABLE','A conta não disponibiliza a descoberta de empresas.',409);contractSchema(list.inputSchema).parse({})}finally{await gateway.close()}
  await deps.restricted(s,async db=>{const row=(await db.query("UPDATE whatsapp.conexoes SET estado='selecionar_recursos',credenciais_cifradas=$4,escopos=$5,contratos=$6::jsonb,expira_em=$7,atualizado_em=now() WHERE empresa_id=$1 AND usuario_id=$2 AND id=$3 AND versao=$8 AND estado='pendente' RETURNING id",[s.tenantId,s.sharedUserId,saved.id,seal(credentials,aad(s,saved.id)),token.scope?.split(' ').filter(Boolean)||[],JSON.stringify(contracts),credentials.expires_at?new Date(credentials.expires_at):null,saved.data.version])).rows[0];if(!row)throw new WhatsAppError('OAUTH_STATE_INVALID','A conexão mudou. Tente novamente.',409)})
 }catch(error){await deps.restricted(s,db=>db.query("UPDATE whatsapp.conexoes SET estado='reconectar',credenciais_cifradas=NULL,contratos='[]',atualizado_em=now() WHERE id=$1 AND versao=$2 AND estado='pendente'",[saved.id,saved.data.version])).catch(()=>{});throw error}
}
export async function chooseResources(s:WhatsAppSession,ids:string[]){
 const c=await restricted(s,db=>connection(db,s));if(!c||!['ativa','selecionar_recursos'].includes(c.estado)||!c.credenciais_cifradas)throw new WhatsAppError('META_RECONNECT_REQUIRED','Reconecte sua conta Meta.',409)
 const gateway=await openRemote(unseal<Tokens>(c.credenciais_cifradas,aad(s,c.id)))
 try{const contract=(await gateway.contracts()).find(t=>t.name==='whatsapp_biz_businesses');if(!contract)throw new WhatsAppError('META_CONTRACT_UNAVAILABLE','Descoberta de empresas indisponível.',409);contractSchema(contract.inputSchema).parse({});const result=await gateway.call(contract.name,{});if(result.isError)throw new WhatsAppError('META_READ_FAILED','Não foi possível consultar as empresas Meta.',503);const choices=businessChoices(result)
  if(!ids.length)return {choices,connectionId:c.id}
  const selected=choices.filter(b=>ids.includes(b.business_id));if(selected.length!==new Set(ids).size)throw new WhatsAppError('RESOURCE_NOT_AUTHORIZED','Selecione somente empresas retornadas pela Meta.',403)
  await restricted(s,async db=>{const changed=(await db.query("UPDATE whatsapp.conexoes SET recursos=$4::jsonb,estado='ativa',versao=versao+1,atualizado_em=now() WHERE empresa_id=$1 AND usuario_id=$2 AND id=$3 AND versao=$5 AND estado IN ('ativa','selecionar_recursos') RETURNING id",[s.tenantId,s.sharedUserId,c.id,JSON.stringify(selected),c.versao])).rows[0];if(!changed)throw new WhatsAppError('VERSION_CONFLICT','A conexão mudou. Atualize a página.',409);await db.query('DELETE FROM whatsapp.numeros WHERE conexao_id=$1',[c.id]);await db.query('DELETE FROM whatsapp.contas WHERE conexao_id=$1',[c.id])});return {choices:selected,connectionId:c.id,hash:digest(selected)}
 }finally{await gateway.close()}
}
export {disconnect}

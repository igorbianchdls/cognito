import { restricted,type Database } from './database'
import { unseal } from './credentials'
import { WhatsAppError,type WhatsAppSession,type Json } from './contracts'
import type { Tokens } from './mcpClient'
import type { RemoteContract } from '../schemas/upstreamContracts'
export type Connection={id:string;empresa_id:number;usuario_id:number;estado:string;versao:number;credenciais_cifradas:string|null;escopos:string[];contratos:RemoteContract[];recursos:Resource[];expira_em:string|null}
export type Resource={business_id:string;name?:string}
export const aad=(s:WhatsAppSession,id:string)=>`whatsapp:${s.tenantId}:${s.sharedUserId}:${id}`
export async function connection(db:Database,s:WhatsAppSession,id?:string):Promise<Connection|undefined>{const row=(await db.query("SELECT * FROM whatsapp.conexoes WHERE empresa_id=$1 AND usuario_id=$2 AND "+(id?'id=$3':"estado<>'desconectada'")+" ORDER BY criado_em DESC LIMIT 1",[s.tenantId,s.sharedUserId,...(id?[id]:[])])).rows[0];return row as Connection|undefined}
export async function requireConnection(s:WhatsAppSession,id:string){return restricted(s,async db=>{const c=await connection(db,s,id);if(!c||c.estado!=='ativa'||!c.credenciais_cifradas)throw new WhatsAppError('META_RECONNECT_REQUIRED','Conecte sua conta Meta nas configurações do WhatsApp.',409);if(c.expira_em&&new Date(c.expira_em).getTime()<=Date.now()+30000){await db.query("UPDATE whatsapp.conexoes SET estado='reconectar',versao=versao+1,atualizado_em=now() WHERE id=$1",[id]);return null}return c}).then(c=>{if(!c)throw new WhatsAppError('META_RECONNECT_REQUIRED','A autorização expirou. Reconecte sua conta Meta.',409);return c})}
export function tokens(c:Connection,s:WhatsAppSession){if(!c.credenciais_cifradas)throw new WhatsAppError('META_RECONNECT_REQUIRED','Reconecte sua conta Meta.',409);return unseal<Tokens>(c.credenciais_cifradas,aad(s,c.id))}
export function safeConnection(c:Connection|undefined){return c?{id:c.id,status:c.estado,versao:c.versao,expira_em:c.expira_em,escopos:c.escopos,recursos:c.recursos,ferramentas_documentadas:c.contratos.map(t=>t.name)}:{status:'desconectada'}}
export async function disconnect(s:WhatsAppSession){return restricted(s,async db=>{const c=await connection(db,s);if(!c)return;await db.query("UPDATE whatsapp.conexoes SET estado='desconectada',credenciais_cifradas=NULL,contratos='[]',recursos='[]',escopos='{}',expira_em=NULL,versao=versao+1,atualizado_em=now() WHERE id=$1",[c.id]);await db.query('DELETE FROM whatsapp.sessoes_autorizacao WHERE conexao_id=$1',[c.id]);await db.query('DELETE FROM whatsapp.numeros WHERE conexao_id=$1',[c.id]);await db.query('DELETE FROM whatsapp.contas WHERE conexao_id=$1',[c.id])})}
/** Normalize only JSON output. HTML, links and natural-language text are not identifiers. */
export function resultData(result:Json):unknown{if(result.structuredContent)return result.structuredContent;const blocks=Array.isArray(result.content)?result.content:[];for(const b of blocks){const item=b as Json;if(item.type==='text'&&typeof item.text==='string'){try{return JSON.parse(item.text)}catch{}}}return null}
export function businessChoices(result:Json):Resource[]{const choices=new Map<string,Resource>();function walk(v:unknown,d=0){if(d>8)return;if(Array.isArray(v)){for(const x of v)walk(x,d+1)}else if(v&&typeof v==='object'){const row=v as Json;const id=typeof row.business_id==='string'?row.business_id:typeof row.id==='string'?row.id:null;if(id&&/^\d{1,100}$/.test(id)&&typeof row.name==='string')choices.set(id,{business_id:id,name:row.name.slice(0,150)});for(const x of Object.values(row))if(typeof x==='object')walk(x,d+1)}}walk(resultData(result));return [...choices.values()].slice(0,100)}
const businessKeys=new Set(['business_id','businessId','business_account_id','businessAccountId'])
const accountKeys=new Set(['waba_id','wabaId','whatsapp_business_account_id','whatsappBusinessAccountId','account_id','accountId'])
const phoneKeys=new Set(['phone_number_id','phoneNumberId','phone_id','phoneId'])
export async function authorizeArguments(db:Database,s:WhatsAppSession,c:Connection,args:Json){
 const businesses=new Set(c.recursos.map(r=>r.business_id)),accounts=new Set((await db.query('SELECT meta_account_id FROM whatsapp.contas WHERE empresa_id=$1 AND usuario_id=$2 AND conexao_id=$3',[s.tenantId,s.sharedUserId,c.id])).rows.map(r=>r.meta_account_id)),phones=new Set((await db.query('SELECT meta_phone_id FROM whatsapp.numeros WHERE empresa_id=$1 AND usuario_id=$2 AND conexao_id=$3',[s.tenantId,s.sharedUserId,c.id])).rows.map(r=>r.meta_phone_id));let bound=false
 function walk(v:unknown,d=0){if(d>12)throw new WhatsAppError('INVALID_INPUT','Dados muito aninhados.');if(Array.isArray(v)){for(const x of v)walk(x,d+1);return}if(!v||typeof v!=='object')return;for(const [k,value] of Object.entries(v)){
  const permitted=businessKeys.has(k)?businesses:accountKeys.has(k)?accounts:phoneKeys.has(k)?phones:null
  if(permitted){if(typeof value!=='string'||!permitted.has(value))throw new WhatsAppError('RESOURCE_NOT_AUTHORIZED','O recurso não está autorizado nesta conexão e empresa.',403);bound=true}
  else if(/^(app_id|application_id|appId|applicationId)$/.test(k))throw new WhatsAppError('RESOURCE_BINDING_UNSUPPORTED','A autorização de aplicativo ainda precisa ser validada para este contrato.',409)
  else if(/(business|waba|account|phone).*id/i.test(k))throw new WhatsAppError('RESOURCE_BINDING_UNSUPPORTED','O identificador deste contrato precisa de um vínculo explícito.',409)
  if(typeof value==='object')walk(value,d+1)
 }}walk(args);if(!bound)throw new WhatsAppError('RESOURCE_REQUIRED','Informe um identificador de empresa, conta ou número previamente autorizado.',422)
}

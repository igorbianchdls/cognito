import { z } from 'zod'
import { transaction,currentSession } from './database'
import { connection } from './repository'
import { seal } from './credentials'
import { hash } from './oauth'
import { WhatsAppError,type WhatsAppSession,type Json } from './contracts'
import { digest,publicContract,contractSchema } from '../schemas/upstreamContracts'
import { remoteTools } from '../tools/catalog'
async function context(s:WhatsAppSession,id:string){z.string().uuid().parse(id);return transaction(async db=>{await currentSession(db,s.sharedUserId,s.tenantId,true);const row=(await db.query("SELECT * FROM plugin.drafts d WHERE d.id=$1 AND d.domain='whatsapp' AND d.empresa_id=$2 AND d.user_id=$3 AND d.status='pending' AND d.expires_at>now() AND NOT EXISTS(SELECT 1 FROM whatsapp.execucoes_remotas x WHERE x.rascunho_id=d.id)",[id,s.tenantId,s.sharedUserId])).rows[0];if(!row||!row.proposal.sensitive)throw new WhatsAppError('NOT_FOUND','Etapa protegida indisponível.',404);const c=await connection(db,s,row.proposal.conexao_id);if(!c||c.estado!=='ativa'||c.versao!==row.proposal.versao)throw new WhatsAppError('STALE_PROPOSAL','A conexão mudou. Prepare outra prévia.',409);const tool=remoteTools(c.contratos).find(t=>t.name===row.operation_type);if(!tool||digest(tool.contract.inputSchema)!==row.proposal.contract_hash)throw new WhatsAppError('META_CONTRACT_CHANGED','Reconecte para atualizar as ferramentas.',409);return {row,c,tool}})}
export async function sensitiveFields(s:WhatsAppSession,id:string){const {tool,row}=await context(s,id),keys=publicContract(tool.contract.inputSchema).secretKeys,props=tool.contract.inputSchema.properties as Record<string,Json>;return {titulo:tool.title,operacao_id:id,previa:row.target_snapshot.preview,campos:keys.map(name=>({nome:name,titulo:/pin/i.test(name)?'PIN':/token/i.test(name)?'Token de verificação':'Código de verificação',tipo:props[name].type==='integer'||props[name].type==='number'?'number':'string'}))}}
export async function saveSensitive(s:WhatsAppSession,id:string,sessionId:string,values:Json){
 const {tool,c,row}=await context(s,id),keys=publicContract(tool.contract.inputSchema).secretKeys
 if(Object.keys(values).some(k=>!keys.includes(k)))throw new WhatsAppError('INVALID_INPUT','Informe somente os campos da etapa protegida.',422)
 contractSchema(tool.contract.inputSchema).parse({...row.proposal.dados,...values})
 return transaction(async db=>{
  await currentSession(db,s.sharedUserId,s.tenantId,true)
  // Serialize against confirmation and re-check lifecycle after form validation.
  const latest=(await db.query("SELECT d.id FROM plugin.drafts d WHERE d.id=$1 AND d.domain='whatsapp' AND d.user_id=$2 AND d.empresa_id=$3 AND d.status='pending' AND d.expires_at>now() FOR UPDATE",[id,s.sharedUserId,s.tenantId])).rows[0]
  if(!latest||(await db.query('SELECT id FROM whatsapp.execucoes_remotas WHERE rascunho_id=$1',[id])).rows.length)throw new WhatsAppError('INVALID_STATE','A execução já começou ou a prévia foi encerrada.',409)
  await db.query("INSERT INTO whatsapp.sessoes_autorizacao(empresa_id,usuario_id,conexao_id,finalidade,estado_hash,sessao_hash,dados_cifrados,expira_em) VALUES($1,$2,$3,'etapa_sensivel',$4,$5,$6,now()+interval '10 minutes') ON CONFLICT(estado_hash) DO UPDATE SET dados_cifrados=EXCLUDED.dados_cifrados,sessao_hash=EXCLUDED.sessao_hash,expira_em=EXCLUDED.expira_em,consumido_em=NULL",[s.tenantId,s.sharedUserId,c.id,digest(id),hash(sessionId),seal(values,`whatsapp:${s.tenantId}:${s.sharedUserId}:${id}:step`)])
  return {ok:true,mensagem:'Dados protegidos salvos. Volte ao chat para revisar e confirmar a operação.'}
 })
}

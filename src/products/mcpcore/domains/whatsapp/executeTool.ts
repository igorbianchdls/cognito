import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { selectCompany,PluginError,type PluginPrincipal } from '../../shared/contracts'
import type { PluginConfig } from '../../shared/config'
import { reserveExecution,finishExecution } from '../../audit/executionRepository'
import { localTools } from './tools/catalog'
import { dependencies,invokeRemote,operation,type Dependencies } from './actions/coordinator'
import { currentSession } from './server/database'
import { connection,safeConnection } from './server/repository'
import { whatsappConfiguration,requireConfiguration } from './server/config'
export async function executeWhatsApp(p:PluginPrincipal,name:string,raw:unknown,c:PluginConfig,deps:Dependencies=dependencies,audit={reserve:reserveExecution,finish:finishExecution}):Promise<CallToolResult>{
 let executionId:string|undefined
 const started=Date.now()
 try{
  if(!p.scopes.includes(c.scope))throw new PluginError('INSUFFICIENT_SCOPE','Reconecte o Cognito com permissão de leitura.',403)
  const input=z.object({empresa_id:z.number().int().positive()}).passthrough().parse(raw),company=selectCompany(p,input.empresa_id),local=localTools.find(t=>t.name===name)
  const s=await deps.transaction(db=>currentSession(db,p.userId,company.id))
  executionId=await audit.reserve(p,name,company.id,c.integration)
  let data:unknown
  if(local){local.schema.parse(input);if(local.write&&!p.scopes.includes('erp:write'))throw new PluginError('INSUFFICIENT_SCOPE','Reconecte com permissão de escrita.',403)
   if(name==='whatsapp_obter_conexao'){const config=whatsappConfiguration();data={...safeConnection(await deps.restricted(s,db=>connection(db,s))),disponivel:config.ready,motivo:config.reason,configuracao_url:new URL('/whatsapp?empresa_id='+company.id,c.resource).href}}
   else data=await operation(p,company.id,input,c,name==='whatsapp_cancelar_operacao',deps)
  }else{requireConfiguration();data=await invokeRemote(p,company.id,name,input,c,deps)}
  const payload={ok:true,execution_id:executionId,empresa_id:company.id,data}
  if(Buffer.byteLength(JSON.stringify(payload))>128*1024)throw new PluginError('RESULT_TOO_LARGE','Reduza o tamanho da consulta.',413)
  await audit.finish(executionId,'succeeded',null,Date.now()-started,c.integration)
  return {content:[{type:'text',text:JSON.stringify(payload)}],structuredContent:payload}
 }catch(error){const failure=error instanceof PluginError?error:error instanceof z.ZodError?new PluginError('INVALID_INPUT','Confira os campos informados.',422):new PluginError('WHATSAPP_UNAVAILABLE','Não foi possível concluir. Consulte a operação antes de repetir uma alteração.',503)
  if(executionId)await audit.finish(executionId,'failed',failure.code,Date.now()-started,c.integration).catch(()=>{})
  const payload={ok:false,code:failure.code,message:failure.message,execution_id:executionId||null}
  return {isError:true,content:[{type:'text',text:JSON.stringify(payload)}],...(failure.code==='INSUFFICIENT_SCOPE'?{_meta:{'mcp/www_authenticate':[`Bearer resource_metadata="${c.metadataUrl}", scope="erp:read erp:write", error="insufficient_scope"`]}}:{})}
 }
}

import { executeWhatsApp } from '../domains/whatsapp/executeTool'
import { executeApps } from '../domains/apps/executeTool'
import type { AppsDependencies } from '../domains/apps/actions/coordinator'
import type { Dependencies as WhatsAppDependencies } from '../domains/whatsapp/actions/coordinator'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { executeTool as executeErpTool, executionDependencies as erpDependencies, type ExecutionDependencies as ErpDependencies } from '../domains/erp/executeTool'
import { domainForTool, tablesDefinition } from './domainRegistry'
import { tablesDependencies, currentSession, getOperation, runAction, cancelOperation, type TablesDependencies } from '../domains/tables/actions/coordinator'
import { withTablesClient } from '@/products/tables/server/database'
import { readTables } from '@/products/tables/server/mcpInput'
import { TablesError } from '@/products/tables/shared/contracts'
import { PluginError, selectCompany, type PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'

export type ExecutionDependencies=ErpDependencies & {tables?:TablesDependencies;whatsapp?:WhatsAppDependencies;apps?:AppsDependencies}
export const executionDependencies:ExecutionDependencies={...erpDependencies,tables:tablesDependencies}
export {accessTools} from '../domains/erp/executeTool'

export async function executeTool(principal:PluginPrincipal,name:string,raw:unknown,config:PluginConfig,deps:ExecutionDependencies=executionDependencies):Promise<CallToolResult> {
 if(domainForTool(name)==='whatsapp')return executeWhatsApp(principal,name,raw,config,deps.whatsapp,{reserve:deps.reserve,finish:deps.finish})
 if(domainForTool(name)==='apps')return executeApps(principal,name,raw,config,deps)
 if(domainForTool(name)==='erp')return executeErpTool(principal,name,raw,config,deps)
 let executionId:string|undefined, timer:ReturnType<typeof setTimeout>|undefined
 const start=Date.now(),tool=tablesDefinition(name)
 try {
  if(!tool)throw new PluginError('UNKNOWN_TOOL','Ferramenta desconhecida.')
  if(!principal.scopes.includes(config.scope))throw new PluginError('INSUFFICIENT_SCOPE','Reconecte com permissão de leitura.',403)
  const input=tool.schema.parse(raw), company=selectCompany(principal,input.empresa_id)
  if((tool.write||tool.control)&&!principal.scopes.includes('erp:write'))throw new PluginError('INSUFFICIENT_SCOPE','Reconecte com permissão de escrita.',403)
  executionId=await deps.reserve(principal,name,company.id,config.integration)
  const task=(deps.tables||tablesDependencies).transaction(async db=>{
   const session=await currentSession(db,principal,company.id,tool.write||tool.control)
   if(tool.key==='obter_operacao')return getOperation(db,principal,company.id,input,config)
   if(tool.control)return cancelOperation(db,principal,company.id,input.operacao_id,config)
   if(tool.write)return runAction(db,principal,session,tool.key,input,config)
   const clean=Object.fromEntries(Object.entries(input).filter(([key])=>key!=='empresa_id'))
   return withTablesClient(db,session,randomUUID(),client=>readTables(client,session,tool.key,clean))
  })
  const data=await Promise.race([task,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new PluginError('TIMEOUT','A chamada demorou. Consulte tables_obter_operacao com a mesma chave antes de repetir.',504)),config.toolTimeoutMs)})])
  const payload={ok:true,execution_id:executionId,empresa_id:company.id,data:{...data,produto_url:new URL('/tables',config.resource).href}},text=JSON.stringify(payload)
  if(Buffer.byteLength(text)>128*1024)throw new PluginError('RESULT_TOO_LARGE','Selecione menos campos ou reduza tamanho da página. Para texto longo, use trecho.')
  await deps.finish(executionId,'succeeded',null,Date.now()-start,config.integration)
  return {content:[{type:'text',text}],structuredContent:payload}
 } catch(error) {
  let failure:PluginError
  if(error instanceof PluginError)failure=error
  else if(error instanceof TablesError)failure=new PluginError(error.code,error.message,error.status)
  else if(error instanceof z.ZodError)failure=new PluginError('INVALID_INPUT','Confira os campos informados.',422,undefined,error.issues.slice(0,8).map(i=>({campo:i.path.join('.'),motivo:i.message})))
  else {const code=(error as {code?:string})?.code;failure=['23514','23503','23505','22P02','P0002','22007','22008'].includes(code||'')?new PluginError('INVALID_VALUE','Um valor não é compatível com o campo ou não está disponível nesta empresa.',422):['40001','40P01','55P03'].includes(code||'')?new PluginError('VERSION_CONFLICT','Outra alteração está em andamento. Consulte os dados e prepare nova prévia.',409):new PluginError('TABLES_UNAVAILABLE','Não foi possível concluir a operação do Tables.',503)}
  executionId??=await deps.reserve(principal,name.slice(0,100),null,config.integration).catch(()=>undefined)
  if(executionId)await deps.finish(executionId,'failed',failure.code,Date.now()-start,config.integration).catch(()=>undefined)
  const payload={ok:false,code:failure.code,message:failure.message,...(failure.fields?{campos:failure.fields}:{}),execution_id:executionId||null}
  return {isError:true,content:[{type:'text',text:JSON.stringify(payload)}],...(failure.code==='INSUFFICIENT_SCOPE'?{_meta:{'mcp/www_authenticate':[`Bearer resource_metadata="${config.metadataUrl}", scope="erp:read erp:write", error="insufficient_scope"`]}}:{})}
 } finally {clearTimeout(timer)}
}

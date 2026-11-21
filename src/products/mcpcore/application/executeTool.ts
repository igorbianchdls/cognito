import { executeWhatsApp } from '../domains/whatsapp/executeTool'
import { executeMarketing, type MarketingDependencies } from '../domains/editor/executeTool'
import type { Dependencies as WhatsAppDependencies } from '../domains/whatsapp/actions/coordinator'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { executeTool as executeErpTool, executionDependencies as erpDependencies, type ExecutionDependencies as ErpDependencies } from '../domains/erp/executeTool'
import { domainForTool } from './domainRegistry'
import type { PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'

export type ExecutionDependencies=ErpDependencies & {whatsapp?:WhatsAppDependencies;marketing?:MarketingDependencies}
export const executionDependencies:ExecutionDependencies={...erpDependencies}
export {accessTools} from '../domains/erp/executeTool'

export async function executeTool(principal:PluginPrincipal,name:string,raw:unknown,config:PluginConfig,deps:ExecutionDependencies=executionDependencies):Promise<CallToolResult> {
 if(domainForTool(name)==='marketing')return executeMarketing(principal,name,raw,config,deps.marketing,{reserve:deps.reserve,finish:deps.finish})
 if(domainForTool(name)==='whatsapp')return executeWhatsApp(principal,name,raw,config,deps.whatsapp,{reserve:deps.reserve,finish:deps.finish})
 return executeErpTool(principal,name,raw,config,deps)
}

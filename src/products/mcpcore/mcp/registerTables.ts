import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createHash } from 'node:crypto'
import type { PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'
import { executeTool, type ExecutionDependencies } from '../application/executeTool'
import { tablesTools,tablesEnvelope } from '../domains/tables/tools/catalog'
import { renderTablesCard } from '../domains/tables/tools/card'

export const TABLES_INSTRUCTIONS=' Ferramentas tables_ operam nas bases do Tables, separadas dos cadastros do ERP. Campos, opções, pessoas, vínculos e visualizações aceitam nome ou ID; bases, tabelas e registros usam os IDs retornados pelas consultas. Moeda é texto decimal. Para contagens e totais use tables_resumir. Criar e comentar executam direto; edições, lotes, exclusões e lixeira geram prévia e exigem confirmação explícita. status saved confirma a execução. Em timeout consulte tables_obter_operacao com a mesma chave antes de repetir. Upload aguardando_envio ainda não é arquivo confirmado.'
export function registerTables(server:McpServer,principal:PluginPrincipal,config:PluginConfig,deps:ExecutionDependencies,host:'chatgpt'|'claude') {
 const uri=`ui://${config.integration}plugin/tables/v1.html`
 server.registerResource('tables-cards',uri,{mimeType:'text/html;profile=mcp-app'},async()=>({contents:[{uri,mimeType:'text/html;profile=mcp-app',text:renderTablesCard(host),_meta:{ui:{prefersBorder:true,...(host==='claude'?{domain:`${createHash('sha256').update(config.resource).digest('hex').slice(0,32)}.claudemcpcontent.com`}:{}),csp:{connectDomains:[],resourceDomains:[]}}}}]}))
 for(const tool of tablesTools)server.registerTool(tool.name,{title:tool.title,description:tool.description,inputSchema:tool.schema,outputSchema:tablesEnvelope,
  annotations:{readOnlyHint:!tool.write&&!tool.control,destructiveHint:tool.destructive,idempotentHint:true,openWorldHint:false},
  _meta:{ui:{resourceUri:uri},...(host==='chatgpt'?{securitySchemes:[{type:'oauth2',scopes:tool.write||tool.control?[config.scope,'erp:write']:[config.scope]}]}:{})}},
  async input=>{const result=await executeTool(principal,tool.name,input,config,deps);return {...result,_meta:{...result._meta,'cognito/tool':tool.name}}})
}

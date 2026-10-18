import { McpServer,ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { z as z4 } from 'zod-openai'
import { McpError,ErrorCode } from '@modelcontextprotocol/sdk/types.js'
import type { PluginPrincipal } from '../../shared/contracts'
import type { PluginConfig } from './config'
import { executeTool, executionDependencies, type ExecutionDependencies } from '../../application/executeTool'
import { accessSchema } from '../../tools/catalog'
import { envelope, outputs } from '../../tools/outputs'
import { preferencesDependencies,preferencesSchema } from '../../application/preferences'
import { renderCardsHtml } from '../../ui/resource'
import { toolDescription } from '../../tools/descriptions'
import { serverInstructions } from '../shared/instructions'
import { registerCommonTools } from '../shared/registerTools'
import { PANEL_URI,renderPanelHtml } from './panel'
import { SERVER_INFO } from './modernProtocol'
import { CHATGPTPLUGIN_VERSION } from './version'

export const CARDS_URI='ui://chatgptplugin/cards/v2.html'
export const SERVER_INSTRUCTIONS=serverInstructions('chatgpt')

export async function createPluginServer(principal: PluginPrincipal, config: PluginConfig,
  dependencies: ExecutionDependencies = executionDependencies) {
  const {OpenAIExtensions}=await import('@openai/mcp-extensions/server')
  const server = new McpServer(SERVER_INFO, { instructions:SERVER_INSTRUCTIONS })
  // As tools das extensões oficiais (configurações e menções) são registradas pelo SDK;
  // este proxy acrescenta anotações e o contrato OAuth aos seus descritores.
  const extensionServer=new Proxy(server,{get(target,property,receiver){
    if(property==='registerTool')return (...args:Parameters<typeof server.registerTool<z.AnyZodObject,z.AnyZodObject>>)=>{
      const [name,definition,callback]=args
      // O SDK omite explicações nos parâmetros gerados. Use o contrato de
      // preferências também na entrada publicada, com os mesmos limites do serviço.
      const inputSchema=name==='atualizar_configuracoes'
        ?z.object({set:preferencesSchema.partial().describe('Preferências alteradas; envie empresa_preferida como ID textual autorizado (vazio remove) e/ou por_pagina de 10 a 50. Atualização imediata.')}).strict()
        :name==='search_mentions'?z.object({query:z.string().describe('Nome do cliente; com várias empresas use ID_DA_EMPRESA: busca. A busca de menções retorna até 10 referências.')})
        :definition.inputSchema
      return target.registerTool(name,{...definition,
        description:toolDescription(name),
        inputSchema,
        annotations:{readOnlyHint:name!=='atualizar_configuracoes',destructiveHint:false,idempotentHint:true,openWorldHint:false,...definition.annotations},
        _meta:{...definition._meta,securitySchemes:[{type:'oauth2',scopes:[config.scope]}]}},callback)
    }
    return Reflect.get(target,property,receiver)
  }})
  const extensions=new OpenAIExtensions(extensionServer)
  const prefs=dependencies.preferences||preferencesDependencies
  async function audited<T>(name:string,fn:()=>Promise<T>):Promise<T> {
    const started=Date.now(),id=await dependencies.reserve(principal,name,null,config.integration)
    try {const data=await fn();await dependencies.finish(id,'succeeded',null,Date.now()-started,config.integration);return data}
    catch {await dependencies.finish(id,'failed','EXTENSION_UNAVAILABLE',Date.now()-started,config.integration).catch(()=>undefined);throw new McpError(ErrorCode.InvalidParams,'Não foi possível concluir. Confira seus dados e permissões.')}
  }
  extensions.settings.register({readTool:'ler_configuracoes',updateTool:'atualizar_configuracoes',
    fields:{empresa_preferida:{schema:z4.string().regex(/^$|^[1-9]\d*$/).max(16),title:'Empresa preferida (ID)',description:'Deixe vazio para escolher no painel. Use um ID de meu_acesso.'},
      por_pagina:{schema:z4.number().int().min(10).max(50),title:'Registros por pagina',description:'Preferência de 10 a 50 registros por página; não substitui por_pagina explícito nas consultas.'}},
    layout:[{kind:'group',title:'Preferencias',items:[{kind:'property',property:'empresa_preferida'},{kind:'property',property:'por_pagina'},
      {kind:'tool',tool:'abrir_painel',title:'Abrir painel'}]}],
    read:()=>audited('ler_configuracoes',()=>prefs.read(principal,config.integration)),update:set=>audited('atualizar_configuracoes',()=>prefs.update(principal,set,config.integration))})
  extensions.mentions.setHandler(async({query})=>{
    if(query.length>200)return {items:[]}
    const match=/^(\d+):\s*(.*)$/.exec(query)
    // Com varias empresas, o prefixo explicito evita selecionar dados de outra empresa.
    if(!match&&principal.companies.length!==1)return {items:[]}
    const empresa_id=match?Number(match[1]):principal.companies[0]?.id
    const result=await executeTool(principal,'buscar_cadastros',{empresa_id,tipo:'clientes',busca:match?match[2]:query,por_pagina:10},config,dependencies)
    if(result.isError)return {items:[]}
    const records=(result.structuredContent?.data as {records:{id:string;nome:string}[]}).records
    return {items:records.map(r=>({type:'resource' as const,resourceUri:`erp://empresa/${empresa_id}/clientes/${r.id}`,title:r.nome,subtitle:`Empresa ${empresa_id} · Cliente ${r.id}`}))}
  })
  server.registerResource('erp-cliente',new ResourceTemplate('erp://empresa/{empresa}/clientes/{id}',{list:undefined}),{mimeType:'application/json'},async(uri,variables)=>{
    const empresa=String(variables.empresa),id=String(variables.id)
    if(!/^[1-9]\d*$/.test(empresa)||!/^[1-9]\d*$/.test(id))throw new McpError(ErrorCode.InvalidParams,'Referência inválida.')
    const result=await executeTool(principal,'obter_cadastro',{empresa_id:Number(empresa),tipo:'clientes',registro_id:Number(id)},config,dependencies)
    const row=(result.structuredContent?.data as {record?:{id:string}}|undefined)?.record
    if(result.isError||!row)throw new McpError(ErrorCode.InvalidParams,'Referência indisponível nesta empresa.')
    return {contents:[{uri:uri.href,mimeType:'application/json',text:JSON.stringify(row)}]}
  })
  server.registerResource('erp-panel',PANEL_URI,{mimeType:'text/html;profile=mcp-app'},async()=>({contents:[{uri:PANEL_URI,mimeType:'text/html;profile=mcp-app',text:renderPanelHtml(config.resource),
    _meta:{ui:{prefersBorder:true,csp:{connectDomains:[],resourceDomains:[]}},'openai/ui':{availableDisplayModes:['fullscreen']}}}]}))
  server.registerResource('erp-cards',CARDS_URI,{mimeType:'text/html;profile=mcp-app'},async()=>({contents:[{uri:CARDS_URI,mimeType:'text/html;profile=mcp-app',text:renderCardsHtml({name:'chatgptplugin-cards',version:CHATGPTPLUGIN_VERSION,host:'chatgpt'}),
    _meta:{ui:{prefersBorder:true,csp:{connectDomains:[],resourceDomains:[]}},'openai/ui':{availableDisplayModes:['inline','fullscreen']},
      'openai/widgetDescription':'Card do ERP com o resultado da consulta ou a prévia da operação. A prévia tem os botões Confirmar e Ajustar; nada muda no ERP antes da confirmação.'}}]}))
  // The same catalog as every host; ChatGPT adds OAuth scopes to each descriptor, the profile tool and the panel.
  const readScopes={securitySchemes:[{type:'oauth2',scopes:[config.scope]}]}
  await registerCommonTools(server,principal,config,dependencies,'chatgpt',{card:{ui:{resourceUri:CARDS_URI}},readMeta:readScopes,
    writeMeta:{securitySchemes:[{type:'oauth2',scopes:[config.scope,'erp:write']}]},accessMeta:{'openai/profile':true},destructive:action=>action.destructive,
    afterAccess:()=>{server.registerTool('abrir_painel',{title:'Abrir painel do ERP',description:toolDescription('abrir_painel'),
      inputSchema:accessSchema,outputSchema:envelope(outputs.access),annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},
      _meta:{...readScopes,ui:{resourceUri:PANEL_URI},'openai/ui':{entrypoints:[{type:'global'},{type:'thread'},{type:'settings',searchTerms:['empresa','preferencias']}]}}},
      async(input:unknown)=>({...await executeTool(principal,'abrir_painel',input,config,dependencies),_meta:{erpOrigin:new URL(config.resource).origin}}))}})
  return server
}

import { localTools as whatsappLocalTools } from '../src/products/mcpcore/domains/whatsapp/tools/catalog'
import {tablesTools} from '../src/products/mcpcore/domains/tables/tools/catalog'
import {appsTools} from '../src/products/mcpcore/domains/apps/tools/catalog'
import assert from 'node:assert/strict'
import {z} from 'zod'
import {handlePluginRequest} from '../src/products/mcpcore/hosts/chatgpt/handleRequest'
import {MODERN_VERSION} from '../src/products/mcpcore/hosts/chatgpt/modernProtocol'
import type {PluginConfig} from '../src/products/mcpcore/shared/config'
import type {PluginPrincipal} from '../src/products/mcpcore/shared/contracts'
import {tools,requiredDate} from '../src/products/mcpcore/tools/catalog'
import {actionTools} from '../src/products/mcpcore/actions/catalog'
import {executionDependencies} from '../src/products/mcpcore/application/executeTool'
import {proposalSchema} from '../src/products/mcpcore/actions/contracts'
import {documentInputSchema} from '../src/products/mcpcore/tools/inputDocumentation'
import {serviceInvoiceInputSchema} from '../src/products/erp/shared/serviceInvoiceContracts'

// No environment, database or external services: inspect the actual MCP catalog
// and check that documentation preserves validators before testing live queries.
const settings:PluginConfig={integration:'chatgpt',resource:'https://erp.example.invalid/api/mcp',
 issuer:'https://clerk.example.invalid',metadataUrl:'https://erp.example.invalid/.well-known/oauth-protected-resource/api/mcp',
 scope:'erp:read',clientIds:['documentation-fixture'],origins:[],toolTimeoutMs:10000,requestsPerMinute:60}
const principal:PluginPrincipal={userId:1,clerkUserId:'documentation-fixture',clientId:'documentation-fixture',scopes:['erp:read','erp:write'],companies:[]}
type JsonSchema={description?:string;properties?:Record<string,JsonSchema>;items?:JsonSchema;anyOf?:JsonSchema[];oneOf?:JsonSchema[];allOf?:JsonSchema[]}
type PublishedTool={name:string;description:string;inputSchema:JsonSchema;outputSchema?:JsonSchema;annotations?:{readOnlyHint?:boolean};_meta?:Record<string,unknown>}

async function catalog(modern:boolean):Promise<PublishedTool[]> {
 const headers:Record<string,string>={'content-type':'application/json',accept:'application/json, text/event-stream',authorization:'Bearer documentation-fixture'}
 if(modern){headers['mcp-protocol-version']=MODERN_VERSION;headers['mcp-method']='tools/list'}
 const params=modern?{_meta:{'io.modelcontextprotocol/protocolVersion':MODERN_VERSION,'io.modelcontextprotocol/clientCapabilities':{}}}:{}
 const response=await handlePluginRequest(new Request(settings.resource,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list',params})}),
  {config:()=>settings,resolve:async()=>principal,limit:async()=>{},execution:executionDependencies})
 assert.equal(response.status,200)
 const rpc=await response.json();assert(!rpc.error,JSON.stringify(rpc.error))
 return rpc.result.tools
}
function checkParameters(node:JsonSchema,path:string):number {
 let count=0
 for(const [field,child] of Object.entries(node.properties||{})) {
  assert(child.description?.trim(),`${path}.${field}: missing input explanation`)
  count+=1+checkParameters(child,path+'.'+field)
 }
 for(const branch of [...node.anyOf||[],...node.oneOf||[],...node.allOf||[]])count+=checkParameters(branch,path)
 if(node.items)count+=checkParameters(node.items,path+'[]')
 return count
}
function sameValidation(schema:z.ZodTypeAny,name:string,cases:unknown[]) {
 const documented=documentInputSchema(schema,name)
 for(const input of cases) {
  const before=schema.safeParse(input),after=documented.safeParse(input)
  assert.equal(after.success,before.success,`${name}: changed acceptance for ${JSON.stringify(input)}`)
  if(before.success&&after.success)assert.deepEqual(after.data,before.data,`${name}: changed parsed/defaulted values`)
  else if(!before.success&&!after.success)assert.deepEqual(after.error.issues,before.error.issues,`${name}: changed validators/refinements`)
 }
}
async function main() {
 const legacy=await catalog(false),modern=await catalog(true)
 const expected=[...whatsappLocalTools.map(t=>t.name),...tablesTools.map(t=>t.name),...appsTools.map(t=>t.name),...tools.map(t=>t.name),...actionTools.map(t=>t.name),'meu_acesso','abrir_painel','ler_configuracoes','atualizar_configuracoes','search_mentions'].sort()
 assert.equal(expected.length,70+tablesTools.length+appsTools.length+whatsappLocalTools.length);assert.equal(new Set(expected).size,70+tablesTools.length+appsTools.length+whatsappLocalTools.length)
 let documentedParameters=0
 for(const entries of [legacy,modern]) {
  assert.deepEqual(entries.map(t=>t.name).sort(),expected)
  for(const tool of entries) {
   assert(tool.description?.trim(),tool.name+': missing description')
   documentedParameters+=checkParameters(tool.inputSchema,tool.name)
   const action=actionTools.find(a=>a.name===tool.name)||tools.find(candidate=>candidate.name===tool.name&&candidate.write)
   if(action) {
    assert.equal(tool.annotations?.readOnlyHint,false)
    assert.match(tool.description,/confirmação explícita/)
    assert.deepEqual(tool._meta?.securitySchemes,[{type:'oauth2',scopes:['erp:read','erp:write']}])
   }
  }
 }
 for(const tool of legacy) {
  const counterpart=modern.find(t=>t.name===tool.name)!
  assert.equal(counterpart.description,tool.description)
  assert.deepEqual(counterpart.inputSchema,tool.inputSchema)
  assert.deepEqual(counterpart.outputSchema,tool.outputSchema)
 }
 const preferences=legacy.find(t=>t.name==='atualizar_configuracoes')!
 assert.match(preferences.description,/imediat/i)
 assert.equal(preferences.annotations?.readOnlyHint,false)
 assert.deepEqual(preferences._meta?.securitySchemes,[{type:'oauth2',scopes:['erp:read']}])
 assert.match(legacy.find(t=>t.name==='confirmar_compra')!.description,/Não recebe mercadoria/)
 assert.match(legacy.find(t=>t.name==='emitir_nota_servico')!.description,/saved só confirma execução/)
 console.log(`PASS MCP legacy/modern: ${expected.length} descriptions, ${documentedParameters/2} documented input occurrences; annotations/scopes preserved`)

 const paging=z.object({pagina:z.number().int().positive().default(1),por_pagina:z.number().int().min(10).max(50).default(20)}).strict()
 sameValidation(paging,'buscar_cadastros',[{}, {pagina:2,por_pagina:30}, {pagina:0}, {por_pagina:51}, {pagina:'2'}, {extra:true}])
 sameValidation(requiredDate,'consultar_relatorio',['2026-10-11','2024-02-29','2026-02-29','2026-13-01','11/10/2026',null])
 const customer=proposalSchema.optionsMap.get('editar_cliente')!.shape.dados
 sameValidation(customer,'editar_cadastro',[
  {registro_id:1,nome:' Novo nome '},{registro_id:1,limite_credito:null},{registro_id:1},
  {registro_id:1,bloqueio_comercial:true},{registro_id:1,bloqueio_comercial:true,bloqueio_motivo:'Pedido do usuário'},
  {registro_id:1,nome:'Novo',campo_inexistente:1},{registro_id:1,limite_credito:-1},
 ])
 const invoice={cliente_id:1,data_competencia:'2026-10-11',codigo_municipio_prestacao:'2304400',itens:[{item_id:2,descricao:'Consultoria',quantidade:1,valor_unitario:100}]}
 sameValidation(serviceInvoiceInputSchema,'criar_nota_servico',[
  invoice,{...invoice,retencoes_federais:{irrf:1.5}}, {...invoice,itens:[]},
  {...invoice,itens:[{...invoice.itens[0],quantidade:-1}]}, {...invoice,retencoes_federais:{irrf:31}},
  {...invoice,itens:[{...invoice.itens[0],extra:true}]}, {...invoice,aliquota_iss:'5'},
 ])
 // A union used by actions must retain selection and optional/nullable transforms.
 sameValidation(z.object({dados:z.union([z.object({nome:z.string().trim(),limite_credito:z.number().nullable().optional()}).strict(),z.object({registro_id:z.number().positive()}).strict()])}).strict(),
  'editar_cadastro',[{dados:{nome:' Cliente ',limite_credito:null}},{dados:{registro_id:3}},{dados:{registro_id:-1}},{dados:{nome:'C',extra:1}}])
 console.log('PASS documentation preserves defaults, trimming, strictness, nullable fields, arrays, unions and business refinements')
}
void main().catch(error=>{console.error(error);process.exitCode=1})

import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import dotenv from 'dotenv'
import {createClerkClient} from '@clerk/nextjs/server'
import {connection} from '../erp/evolution-db.mjs'
import {executeTool} from '../../src/products/mcpcore/application/executeTool'
import {loadPluginPrincipal} from '../../src/products/mcpcore/auth/resolvePrincipal'
import {closePluginDatabase} from '../../src/products/mcpcore/shared/database'
import type {PluginConfig} from '../../src/products/mcpcore/shared/config'

const env=dotenv.parse(readFileSync('.env.local'));Object.assign(process.env,env)
const staged=JSON.parse(readFileSync('.cache/tables-mcp/deployment/deployment.json','utf8')),production=process.argv.includes('--production'),origin=production?'https://cognito-seven.vercel.app':'https://'+staged.url,db=connection(),checks:string[]=[]
let baseId:string|undefined,call:((name:string,data:object,integration?:'chatgpt'|'claude')=>Promise<Record<string,any>>)|undefined
async function main(){try{
 await db.connect();const owner=(await db.query("SELECT u.clerk_user_id,e.clerk_organization_id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'")).rows[0];assert(owner)
 const clerk=createClerkClient({secretKey:env.CLERK_SECRET_KEY}),sessions=await clerk.sessions.getSessionList({userId:owner.clerk_user_id,status:'active',limit:100}),session=sessions.data.find(s=>s.lastActiveOrganizationId===owner.clerk_organization_id)||sessions.data.find(s=>!s.lastActiveOrganizationId);assert(session,'Active session required')
 async function http(path:string,method='GET',body?:object){const token=await clerk.sessions.getToken(session!.id,undefined,60);const r=await fetch(origin+path,{method,headers:{Authorization:'Bearer '+token.jwt,Origin:origin,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,path+' HTTP '+r.status);return r}
 for(const path of ['/api/mcp','/api/claude/mcp']){const response=await fetch(origin+path,{method:'POST',headers:{'content-type':'application/json'},body:'{}',redirect:'manual'});assert.equal(response.status,production?401:403);checks.push(path+(production?'_requires_oauth':'_canonical_host_enforced'))}
 assert(Array.isArray((await(await http('/api/tables/sessao')).json()).bases));checks.push('real_clerk_company_and_deployed_tables_api')
 if(!production){
  const principal=await loadPluginPrincipal(owner.clerk_user_id,'tables-mcp-release-fixture',['erp:read','erp:write'])
  call=async(name,data,integration='chatgpt')=>{const config:PluginConfig={integration,resource:origin+(integration==='claude'?'/api/claude/mcp':'/api/mcp'),issuer:env.CHATGPTPLUGIN_OAUTH_ISSUER,metadataUrl:origin+'/.well-known/oauth-protected-resource/api/mcp',scope:'erp:read',clientIds:['tables-mcp-release-fixture'],origins:[origin],toolTimeoutMs:45000,requestsPerMinute:60};const result=await executeTool(principal,'tables_'+name,{empresa_id:2,...data},config);assert(!result.isError,JSON.stringify(result.content));return JSON.parse((result.content[0] as {text:string}).text).data as Record<string,any>}
  async function change(name:string,data:object,integration:'chatgpt'|'claude'='chatgpt'){const p=await call!(name,{chave_operacao:randomUUID(),dados:data},integration);const r=await call!(name,{rascunho_id:p.rascunho_id},integration);assert.equal(r.status,'saved');assert.deepEqual((await call!(name,{rascunho_id:p.rascunho_id},integration)).resultado,r.resultado);return r}
  const cleanupId=process.argv.find(a=>a.startsWith('--cleanup='))?.slice(10)
  if(cleanupId){assert(/^[a-f0-9-]{36}$/.test(cleanupId));const item=(await db.query("SELECT nome FROM tables.bases WHERE empresa_id=2 AND criado_por=3 AND id=$1 AND excluido_em IS NULL",[cleanupId])).rows[0];assert(item&&item.nome.startsWith('Validação temporária MCP Tables '));await change('mover_para_lixeira',{tipo:'bases',item_id:cleanupId});console.log(JSON.stringify({status:'test_fixture_moved_to_trash',id:cleanupId}));return}
  const created=await change('criar_base',{nome:'Validação temporária MCP Tables '+randomUUID().slice(0,8),modelo:'projetos'});baseId=created.resultado.base.id;const table=created.resultado.tabela.id
  const fields=await call('obter_tabela',{tabela_id:table,tamanho:10}),name=fields.itens.find((f:{tipo:string})=>f.tipo==='texto'),money=fields.itens.find((f:{tipo:string})=>f.tipo==='moeda')
  const batch=await change('criar_registros_em_lote',{tabela_id:table,registros:[{valores:{[name.id]:'Teste A',[money.id]:'0.10'}},{valores:{[name.id]:'Teste B',[money.id]:'0.20'}}]},'claude');assert.equal(batch.resultado.quantidade,2)
  const rows=await call('consultar_registros',{tabela_id:table});assert.equal(rows.somas[money.id],'0.30');checks.push('real_supabase_mcp_transactions_for_both_integrations')
  const field=await change('criar_campo',{tabela_id:table,campo:{nome:'Anexos',tipo:'anexo'}}),record=batch.resultado.registros[0].id
  const prepared=await change('preparar_upload',{registro_id:record,campo_id:field.resultado.campo.id});assert(prepared.resultado.upload_form_url)
  const page=await http('/tables/upload/'+prepared.operacao_id);assert.match(await page.text(),/Enviar arquivo/)
  const bytes=Buffer.from('MCP Tables: validação real de anexo privado.\n')
  const upload=await(await http('/api/tables/mcp-envios/'+prepared.operacao_id,'POST',{acao:'iniciar',nome:'validacao-mcp.txt',mime_type:'text/plain',tamanho:bytes.length})).json();assert(upload.upload_url)
  const sent=await fetch(upload.upload_url,{method:'PUT',headers:{'Content-Type':'text/plain'},body:bytes});assert(sent.ok,'Signed upload HTTP '+sent.status)
  const confirmed=await(await http('/api/tables/mcp-envios/'+prepared.operacao_id,'POST',{acao:'confirmar'})).json();assert.equal(confirmed.status,'confirmado')
  assert.equal((await call('obter_operacao',{operacao_id:prepared.operacao_id})).resultado.status,'confirmado')
  await change('confirmar_upload',{anexo_id:upload.anexo_id})
  const link=await(await http('/api/tables/anexos/'+upload.anexo_id+'/download')).json(),download=await fetch(link.url);assert(download.ok);assert.match(download.headers.get('content-disposition')||'',/attachment/);assert.deepEqual(Buffer.from(await download.arrayBuffer()),bytes)
  await change('remover_anexo',{anexo_id:upload.anexo_id});checks.push('real_storage_upload_form_confirmation_download_and_remove')
  await change('mover_para_lixeira',{tipo:'bases',item_id:baseId});checks.push('temporary_base_moved_to_trash')
 }
 const report={status:'passed',deploymentId:staged.id,origin,checks,oauthTokenValidationExercised:production?'anonymous_rejection':'canonical_host_guard_and_isolated_regression',businessIdentity:'existing authorized owner and active company',backendMcpDirectInvocation:!production,realClerkSession:true,realSupabase:true,realStorage:!production,temporaryBaseId:baseId,generatedAt:new Date().toISOString()}
 writeFileSync('.cache/tables-mcp/deployment/'+(production?'production':'staged')+'-http.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}catch(error){if(baseId&&call){try{const p=await call('mover_para_lixeira',{chave_operacao:randomUUID(),dados:{tipo:'bases',item_id:baseId}});await call('mover_para_lixeira',{rascunho_id:p.rascunho_id})}catch{}}
 console.error(JSON.stringify({status:'failed',checks,message:error instanceof assert.AssertionError?error.message:'Live validation failed; credentials omitted.',temporaryBaseId:baseId}));process.exitCode=1
}finally{await db.end();await closePluginDatabase()}}
main()

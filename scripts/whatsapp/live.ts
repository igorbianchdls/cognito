import assert from 'node:assert/strict'
import { readFileSync,writeFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { createClerkClient } from '@clerk/nextjs/server'
import { connection } from '../erp/evolution-db.mjs'
import { executeTool } from '../../src/products/mcpcore/application/executeTool'
import { loadPluginPrincipal } from '../../src/products/mcpcore/auth/resolvePrincipal'
import { closePluginDatabase } from '../../src/products/mcpcore/shared/database'
import type { PluginConfig } from '../../src/products/mcpcore/shared/config'
const env=dotenv.parse(readFileSync('.env.local'));Object.assign(process.env,env)
const staged=JSON.parse(readFileSync('.cache/whatsapp/deployment/deployment.json','utf8')),production=process.argv.includes('--production'),origin=production?'https://cognito-seven.vercel.app':'https://'+staged.url,db=connection(),checks:string[]=[]
async function main(){try{
 await db.connect();const owner=(await db.query("SELECT u.clerk_user_id,e.clerk_organization_id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'")).rows[0];assert(owner)
 const clerk=createClerkClient({secretKey:env.CLERK_SECRET_KEY}),sessions=await clerk.sessions.getSessionList({userId:owner.clerk_user_id,status:'active',limit:100}),session=sessions.data.find(s=>s.lastActiveOrganizationId===owner.clerk_organization_id)||sessions.data.find(s=>!s.lastActiveOrganizationId);assert(session,'Active session required')
 async function http(path:string){const token=await clerk.sessions.getToken(session!.id,undefined,60),r=await fetch(origin+path,{headers:{Authorization:'Bearer '+token.jwt,Origin:origin},signal:AbortSignal.timeout(45000)});assert.equal(r.status,200,path+' HTTP '+r.status);return r}
 for(const path of ['/api/mcp','/api/claude/mcp']){const r=await fetch(origin+path,{method:'POST',headers:{'content-type':'application/json'},body:'{}',redirect:'manual'});assert.equal(r.status,production?401:403);checks.push(path+(production?'_requires_oauth':'_canonical_host_enforced'))}
 const status=await(await http('/api/whatsapp/conexao')).json();assert.equal(status.empresa_id,2);assert.equal(status.disponivel,false);assert.equal(status.conexao.status,'desconectada');assert(!JSON.stringify(status).includes('credenciais_cifradas'));checks.push('real_clerk_company_and_whatsapp_status_api')
 assert.match(await(await http('/whatsapp')).text(),/WhatsApp Business/);checks.push('deployed_connection_page')
 const principal=await loadPluginPrincipal(owner.clerk_user_id,'whatsapp-release-read-fixture',['erp:read','erp:write'])
 for(const integration of ['chatgpt','claude'] as const){const config:PluginConfig={integration,resource:'https://cognito-seven.vercel.app'+(integration==='claude'?'/api/claude/mcp':'/api/mcp'),issuer:env.CHATGPTPLUGIN_OAUTH_ISSUER,metadataUrl:'https://cognito-seven.vercel.app/.well-known/oauth-protected-resource/api/mcp',scope:'erp:read',clientIds:['whatsapp-release-read-fixture'],origins:[],toolTimeoutMs:15000,requestsPerMinute:60};const r=await executeTool(principal,'whatsapp_obter_conexao',{empresa_id:2},config);assert(!r.isError);const payload=JSON.parse((r.content[0] as {text:string}).text);assert.equal(payload.data.disponivel,false);assert.equal(payload.data.status,'desconectada')}
 checks.push('real_supabase_local_status_tool_for_both_integrations')
 const report={status:'passed',deploymentId:staged.id,origin,checks,realClerkSession:true,realSupabase:true,realMetaSession:false,remoteToolsEnabled:false,messagesSent:0,generatedAt:new Date().toISOString()};writeFileSync('.cache/whatsapp/deployment/'+(production?'production':'staged')+'-http.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}catch(e){console.error(JSON.stringify({status:'failed',checks,message:e instanceof assert.AssertionError?e.message:'Live read validation failed; credentials omitted.'}));process.exitCode=1}finally{await db.end();await closePluginDatabase()}}
main()

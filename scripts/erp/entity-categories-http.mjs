import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import dotenv from 'dotenv'
import {connection} from './evolution-db.mjs'
const cfg=dotenv.parse(readFileSync('.env.local')),staged=JSON.parse(readFileSync('.cache/shared/deployment.json')),production=process.argv.includes('--production'),origin=production?'https://cognito-seven.vercel.app':'https://'+staged.url,db=connection(),results=[]
try{
 await db.connect();const owner=(await db.query("SELECT u.clerk_user_id,e.clerk_organization_id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.status='active' AND m.role='owner' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'")).rows[0];assert(owner)
 const clerk=createRequire(import.meta.url)('@clerk/backend').createClerkClient({secretKey:cfg.CLERK_SECRET_KEY}),sessions=await clerk.sessions.getSessionList({userId:owner.clerk_user_id,status:'active',limit:100}),session=sessions.data.find(s=>s.lastActiveOrganizationId===owner.clerk_organization_id)||sessions.data.find(s=>!s.lastActiveOrganizationId);assert(session)
 async function get(path){const token=await clerk.sessions.getToken(session.id,undefined,60),response=await fetch(origin+path,{headers:{Authorization:'Bearer '+token.jwt},signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,path);assert.equal(response.headers.get('cache-control'),'no-store');results.push({path,http:response.status});return response.json()}
 for(const [module,type,total,count] of [['clientes','cliente',30,9],['fornecedores','fornecedor',15,8]]){
  const page=await get('/api/erp/'+module+'?pageSize=100');assert.equal(page.total,total);assert(page.records.every(r=>r.categoria));assert.equal(new Set(page.records.map(r=>r.categoria)).size,count)
  const options=await get('/api/erp/catalogos/categorias?tipo='+type);assert.equal(options.options.length,count);assert(options.options.every(r=>r.tipo===type))
  const summary=await get('/api/erp/'+module+'/resumo');assert.equal(summary.metrics.find(m=>m.label==='Categorias').value,String(count))
 }
 const categories=await get('/api/erp/categorias?pageSize=100'),rows=categories.records.filter(r=>['cliente','fornecedor'].includes(r.tipo));assert.equal(rows.length,17);assert.equal(rows.reduce((n,r)=>n+r.itens,0),45)
 for(const type of ['receita','despesa']){const options=await get('/api/erp/catalogos/categorias?tipo='+type);assert(!options.options.some(r=>['cliente','fornecedor'].includes(r.tipo)))}
 const report={status:'passed',production,origin,deploymentId:staged.id,realClerkSession:true,results};writeFileSync('.cache/entity-categories/'+(production?'production':'staged')+'-http.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}finally{await db.end()}

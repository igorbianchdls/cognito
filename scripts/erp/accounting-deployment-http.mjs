import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import dotenv from 'dotenv'
import {createClerkClient} from '@clerk/backend'
import {connection} from './evolution-db.mjs'
const folder='.cache/accounting/deployment/',cfg=dotenv.parse(readFileSync('.env.local')),staged=JSON.parse(readFileSync(folder+'deployment.json')),production=process.argv.includes('--production'),origin=production?'https://cognito-seven.vercel.app':'https://'+staged.url,db=connection(),checks=[]
try{
 await db.connect();const owner=(await db.query("SELECT u.clerk_user_id,e.clerk_organization_id,m.acesso_portal_contador FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'")).rows[0];assert(owner)
 const clerk=createClerkClient({secretKey:cfg.CLERK_SECRET_KEY}),sessions=await clerk.sessions.getSessionList({userId:owner.clerk_user_id,status:'active',limit:100}),session=sessions.data.find(s=>s.lastActiveOrganizationId===owner.clerk_organization_id)||sessions.data.find(s=>!s.lastActiveOrganizationId);assert(session,'No active authorized ERP session')
 async function get(path,expected=200){const token=await clerk.sessions.getToken(session.id,undefined,60);const r=await fetch(origin+path,{headers:{Authorization:'Bearer '+token.jwt},signal:AbortSignal.timeout(45000)});assert.equal(r.status,expected,path+' HTTP '+r.status);assert.match(r.headers.get('cache-control') || '',/no-store/);checks.push({path,http:r.status});return r.json()}
 const accounts=await get('/api/erp/contas-contabeis?pageSize=50');assert.equal(accounts.total,46);assert.equal(accounts.records[0].codigo,'1');assert(accounts.records.some(a=>a.nivel>0))
 const group=await get('/api/erp/contas-contabeis?pageSize=50&filter.tipo=sintetica');assert(group.records.every(a=>a.tipo==='sintetica'))
 const search=await get('/api/erp/contas-contabeis?query=Aluguel');assert.equal(search.total,1)
 const detail=await get('/api/erp/contas-contabeis/'+search.records[0].id);assert.equal(detail.record.tipo,'analitica');assert(detail.record.conta_pai_label)
 const summary=await get('/api/erp/contas-contabeis/resumo');assert(summary.metrics.length===3)
 const options=await get('/api/erp/catalogos/contas-contabeis?tipo=analitica&q=Aluguel');assert.equal(options.options.length,1)
 await get('/api/erp/catalogos/contas-contabeis?empresa_id=1',422)
 const categories=await get('/api/erp/categorias?pageSize=50');assert(categories.records.every(c=>c.conta_contabil&&c.grupo_dre!=='Não classificado'))
 const banks=await get('/api/erp/contas-financeiras?pageSize=50');assert(banks.records.every(b=>b.conta_contabil))
 const reference=JSON.parse(readFileSync('.cache/accounting/regression.json')).baseline
 for(const [view,report]of [['competencia','dre-competencia'],['caixa','dre-caixa']]){
  const d=await get('/api/erp/relatorios/dre?inicio=2026-09-01&fim=2026-09-30&visao='+view);assert.equal(d.visao,view);assert.equal(d.nao_classificado,0);assert.equal(d.subtotais.lucro_liquido,reference[view].lucro_liquido)
  const flat=await get('/api/erp/relatorios/'+report+'?from=2026-09-01&to=2026-09-30');assert(Math.abs(flat.records.reduce((s,r)=>s+Number(r.valor),0)-d.subtotais.lucro_liquido)<0.021)
  if(owner.acesso_portal_contador){const p=await get('/api/contador/empresas/2/relatorios?from=2026-09-01&to=2026-09-30&report='+report+'&pageSize=100');const row=p.table.records.find(r=>String(r.linha).includes('Lucro líquido'));assert.equal(row.valor,d.subtotais.lucro_liquido)}
 }
 const access=await get('/api/erp/acesso');assert(access.capabilities.includes('erp.cadastros.visualizar'));assert(access.capabilities.includes('erp.cadastros.gerenciar'))
 const anon=await fetch(origin+'/api/erp/contas-contabeis',{redirect:'manual',signal:AbortSignal.timeout(20000)});assert.equal(anon.status,404);checks.push({anonymousDenied:anon.status})
 const report={status:'passed',generatedAt:new Date().toISOString(),deploymentId:staged.id,origin,readOnly:true,portalHttpVerified:owner.acesso_portal_contador,checks};writeFileSync(folder+(production?'production-http.json':'staged-http.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}finally{await db.end()}

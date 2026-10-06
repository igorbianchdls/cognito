import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {randomUUID,createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import dotenv from 'dotenv'
import {connection} from './evolution-db.mjs'

const cache='.cache/service-invoice/',cfg=dotenv.parse(readFileSync('.env.local')),staged=JSON.parse(readFileSync('.cache/shared/deployment.json'))
const production=process.argv.includes('--production'),crud=process.argv.includes('--crud'),target=production?'cognito-seven.vercel.app':staged.id
const resp=await fetch('https://api.vercel.com/v13/deployments/'+target+'?teamId=team_fI5lF5U1UZOCEfHWdB4QNpua',{headers:{Authorization:'Bearer '+cfg.VERCEL_TOKEN},signal:AbortSignal.timeout(20000)})
assert(resp.ok);const deployment=await resp.json();assert.equal(deployment.id,staged.id);assert.equal(deployment.readyState,'READY')
const origin=production?'https://cognito-seven.vercel.app':'https://'+deployment.url,db=connection(),results=[]
await db.connect()
try{
 const owner=(await db.query("SELECT u.clerk_user_id,e.clerk_organization_id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'")).rows[0];assert(owner)
 const require=createRequire(import.meta.url),clerk=require('@clerk/backend').createClerkClient({secretKey:cfg.CLERK_SECRET_KEY})
 const sessions=await clerk.sessions.getSessionList({userId:owner.clerk_user_id,status:'active',limit:100})
 const session=sessions.data.find(s=>s.lastActiveOrganizationId===owner.clerk_organization_id)||sessions.data.find(s=>!s.lastActiveOrganizationId);assert(session)
 async function request(path,method='GET',body,expected=200){
  const token=await clerk.sessions.getToken(session.id,undefined,60)
  const response=await fetch(origin+path,{method,headers:{Authorization:'Bearer '+token.jwt,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(45000)})
  const value=response.headers.get('content-type')?.includes('application/pdf')?Buffer.from(await response.arrayBuffer()):await response.json()
  assert.equal(response.status,expected,path+' '+JSON.stringify(Buffer.isBuffer(value)?'PDF':value));assert.equal(response.headers.get('cache-control'),'no-store')
  results.push({path,method,http:response.status});return value
 }
 const list=await request('/api/erp/notas-servico');assert(list.records.length>=4);assert.equal(list.modo_operacao,'simulacao')
 for(const row of list.records){assert.equal(row.modo_operacao,'simulacao');assert(row.numero.startsWith('DEMO-'));assert(row.aviso.includes('SEM VALIDADE FISCAL'))}
 const filtered=await request('/api/erp/notas-servico?status=rascunho&inicio=2026-01-01&fim=2026-12-31');assert(filtered.records.every(n=>n.status==='rascunho'))
 for(const note of list.records.slice(0,4)){
  const detail=await request(`/api/erp/notas-servico/${note.id}`);assert(detail.items.length>0);assert.equal(detail.record.id,note.id)
  const pdf=await request(`/api/erp/notas-servico/${note.id}/pdf`);assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert(pdf.toString('latin1').includes('SEM VALIDADE FISCAL'));mkdirSync(cache,{recursive:true});writeFileSync(cache+note.numero+'.pdf',pdf)
 }
 const ready=await request(`/api/erp/notas-servico/${list.records[0].id}/validar`);assert.equal(typeof ready.ready,'boolean');assert.equal(ready.modo_operacao,'simulacao')
 await request('/api/erp/clientes?pageSize=100');await request('/api/erp/servicos?pageSize=100');await request('/api/erp/acesso')
 await request('/api/erp/notas-servico/999999999', 'GET', undefined,404)
 if(crud){
  const customer=(await db.query('SELECT id FROM erp.entidades WHERE empresa_id=2 AND eh_cliente AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1')).rows[0]
  const service=(await db.query('SELECT id FROM erp.servicos WHERE empresa_id=2 AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1')).rows[0]
  const tables=['vendas','compras','contas_pagar','contas_receber','pagamentos','movimentacoes_estoque']
  async function fingerprint(){const value={};for(const table of tables){const rows=(await db.query('SELECT to_jsonb(t)::text value FROM erp.'+table+' t')).rows.map(r=>r.value).sort();value[table]=createHash('sha256').update(JSON.stringify(rows)).digest('hex')}return value}
  const before=await fingerprint(),data={cliente_id:Number(customer.id),data_competencia:'2026-10-06',codigo_municipio_prestacao:'2304400',itens:[{tipo:'servico',item_id:Number(service.id),descricao:'Verificação de CRUD HTTP simulado',quantidade:1,valor_unitario:100,desconto:0}],aliquota_iss:5,iss_retido:false},key=randomUUID()
  let created
  try{
   created=await request('/api/erp/notas-servico','POST',{chave_operacao:key,dados:data},201)
   const replay=await request('/api/erp/notas-servico','POST',{chave_operacao:key,dados:data});assert.equal(replay.record.id,created.record.id);assert.equal(replay.reused,true)
   const id=created.record.id,editKey=randomUUID(),changed={...data,observacoes:'Teste concluído; rascunho descartável'}
   const edit=await request('/api/erp/notas-servico/'+id,'PATCH',{chave_operacao:editKey,versao:1,dados:changed});assert.equal(edit.record.versao,2)
   await request('/api/erp/notas-servico/'+id,'PATCH',{chave_operacao:randomUUID(),versao:1,dados:data},409)
   await request('/api/erp/notas-servico/'+id+'/validar');await request('/api/erp/notas-servico/'+id+'/pdf?versao=1')
   const deleted=await request('/api/erp/notas-servico/'+id+'/excluir','POST',{chave_operacao:randomUUID(),versao:2,motivo:'Rascunho usado na verificação automatizada HTTP'});assert.equal(deleted.record.versao,3)
   await request('/api/erp/notas-servico/'+id,'GET',undefined,404)
   assert.deepEqual(await fingerprint(),before);results.push({crud:'create/replay/read/edit/stale/pdf/archive',id,financialAndStockPreserved:true})
  }catch(error){if(created){const note=await request('/api/erp/notas-servico/'+created.record.id).catch(()=>null);if(note?.record.status==='rascunho')await request('/api/erp/notas-servico/'+created.record.id+'/excluir','POST',{chave_operacao:randomUUID(),versao:note.record.versao,motivo:'Limpeza de teste HTTP interrompido'}).catch(()=>{})}throw error}
 }
 // Clerk proxy intentionally cloaks protected API routes with 404 before the
 // handler; the isolated handler's unauthenticated contract is JSON 401.
 const anonymous=await fetch(origin+'/api/erp/notas-servico',{signal:AbortSignal.timeout(20000)});assert.equal(anonymous.status,404);assert(!(await anonymous.text()).includes('DEMO-'));results.push({anonymousHttp:404,blockedByClerkProxy:true})
 const report={status:'passed',deploymentId:deployment.id,origin,realClerkSession:true,noExternalFiscalApi:true,crud,results}
 writeFileSync(cache+(production?'production':'staged')+'-reads.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}finally{await db.end()}

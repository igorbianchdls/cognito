import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {config} from 'dotenv'
import {sourceLoader} from './accounting-test-runtime.mjs'
import {connection} from './evolution-db.mjs'
config({path:'.env.local',quiet:true});mkdirSync('.cache/accounting',{recursive:true})
const migrations=['20261012110000_erp_contas_contabeis.sql','20261012111000_erp_classificacao_contabil_demo.sql'].map(file=>({file,sql:readFileSync('supabase/migrations/'+file,'utf8')}))
const digests=Object.fromEntries(migrations.map(m=>[m.file,createHash('sha256').update(m.sql).digest('hex')]))
const load=sourceLoader(),pg=load('@/lib/postgres'),context=load('@/lib/erpDatabaseContext'),repo=load('@/products/erp/server/erpRepository'),accounting=load('@/products/erp/server/erpAccountingRepository'),dre=load('@/products/erp/server/erpDreReport')
const db=connection(),checks=[];let serial=0
async function denied(fn,code){const point='negative_'+(++serial);await db.query('SAVEPOINT '+point);try{await assert.rejects(fn,e=>!code||e.code===code)}finally{await db.query('ROLLBACK TO '+point);await db.query('RELEASE '+point)}}
const near=(a,b)=>assert(Math.abs(Number(a)-Number(b))<0.011,`${a} != ${b}`)
async function fingerprint(){await db.query('RESET ROLE');return(await db.query("SELECT 'vendas' t,count(*) n,md5(string_agg(to_jsonb(r)::text,'|' ORDER BY id)) hash FROM erp.vendas r UNION ALL SELECT 'pagamentos',count(*),md5(string_agg(to_jsonb(r)::text,'|' ORDER BY id)) FROM erp.pagamentos r UNION ALL SELECT 'movimentacoes_estoque',count(*),md5(string_agg(to_jsonb(r)::text,'|' ORDER BY id)) FROM erp.movimentacoes_estoque r")).rows}
try{
 await db.connect();const before=await fingerprint();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'")
 for(const m of migrations)await db.query(m.sql.replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,''))
 assert.equal((await db.query('SELECT count(*)::int n FROM erp.contas_contabeis WHERE empresa_id=2')).rows[0].n,46)
 assert.equal((await db.query('SELECT count(*)::int n FROM erp.categorias WHERE empresa_id=2 AND conta_contabil_id IS NOT NULL AND (dre_grupo_id IS NOT NULL OR fora_dre)')).rows[0].n,12)
 assert.equal((await db.query('SELECT count(*)::int n FROM erp.contas_financeiras WHERE empresa_id=2 AND ativo AND conta_contabil_id IS NOT NULL')).rows[0].n,3);checks.push('Seed: 46 accounts, 12 categories classified and linked, 3 bank/cash bindings')
 await db.query("SELECT set_config('app.erp_empresa_id','2',true),set_config('app.erp_tenant_id','2',true),set_config('app.erp_user_id','3',true),set_config('app.erp_time_zone','America/Fortaleza',true)")
 const client={release(){},async query(sql,params){pg.assertErpTenantScopedQuery(sql,params);await db.query(/\berp\.[a-z_][a-z0-9_]*/i.test(sql)?'SET LOCAL ROLE erp_runtime':'RESET ROLE');return db.query(sql,params)}}
 let baseline
 await context.runWithErpDatabaseContext({tenantId:2,userId:3,timeZone:'America/Fortaleza'},()=>pg.runWithErpTransactionClient(client,async()=>{
  const a=await dre.dreReport(2,{inicio:'2026-09-01',fim:'2026-09-30',visao:'competencia'}),b=await dre.dreReport(2,{inicio:'2026-09-01',fim:'2026-09-30',visao:'caixa'})
  assert.equal(a.nao_classificado,0);assert.equal(b.nao_classificado,0);assert(a.subtotais.receita_liquida>0);assert(b.subtotais.receita_liquida>0)
  assert(a.fora_dre<0);assert(b.fora_dre<0);baseline={competencia:a.subtotais,caixa:b.subtotais,foraDre:{competencia:a.fora_dre,caixa:b.fora_dre}}
  const read=load('@/products/erp/server/erpReadService').erpReadService
  const mcp=await read.report(2,'dre','2026-09-01','2026-09-30',{});near(mcp.summary.lucro_liquido,a.subtotais.lucro_liquido)
  const portal=load('@/products/portaldocontador/server/queries');assert(Object.keys(portal).length>0)
  const professional=load('@/products/erp/server/erpProfessionalRepository')
  for(const [name,expected] of [['dre-competencia',a.subtotais.lucro_liquido],['dre-caixa',b.subtotais.lucro_liquido]]) {
   const flat=await professional.listProfessionalReport({tenantId:2,report:name,from:'2026-09-01',to:'2026-09-30'})
   near(flat.reduce((sum,row)=>sum+Number(row.valor),0),expected)
   assert(flat.every(row=>'competencia' in row && 'categoria' in row && 'tipo' in row))
  }
  checks.push('Legacy API and tool aliases retain flat columns and match both structured DRE totals')
  checks.push('Real structured DRE: both views classified; MCP read service matches competence result')
  const actor={tenantId:2,actorId:3,entityId:'contas-contabeis'}
  const base={codigo:'9',nome:'Regression root',tipo:'sintetica',classificacao:'ativo',natureza:'devedora',conta_pai_id:null,status:''}
  const root=await repo.createErpEntityWithClient(client,{...actor,values:base})
  const parent=await repo.createErpEntityWithClient(client,{...actor,values:{...base,codigo:'9.1',nome:'Regression subgroup',conta_pai_id:Number(root.id)}})
  const leaf=await repo.createErpEntityWithClient(client,{...actor,values:{...base,codigo:'9.1.01',nome:'Regression leaf',tipo:'analitica',conta_pai_id:Number(parent.id)}})
  let detail=await repo.getErpEntityRecord({...actor,id:leaf.id});assert.equal(detail.conta_pai_id,parent.id)
  detail=await repo.updateErpEntityRecord({...actor,id:leaf.id,expectedVersion:1,values:{nome:'Updated leaf'}});assert.equal(Number(detail.versao),2)
  await denied(()=>repo.updateErpEntityRecord({...actor,id:leaf.id,expectedVersion:1,values:base}));checks.push('CRUD: create, read, edit, optimistic conflict and audit')
  await denied(()=>repo.createErpEntityWithClient(client,{...actor,values:base}),'23505')
  await denied(()=>repo.updateErpEntityRecord({...actor,id:root.id,expectedVersion:1,values:{...base,conta_pai_id:Number(parent.id)}}),'23514')
  await denied(()=>repo.createErpEntityWithClient(client,{...actor,values:{...base,codigo:'9.2',conta_pai_id:Number(leaf.id)}}),'23514')
  await denied(()=>repo.createErpEntityWithClient(client,{...actor,values:{...base,codigo:'9.2',classificacao:'despesa',conta_pai_id:Number(parent.id)}}),'23514')
  await denied(()=>repo.deactivateErpEntityRecord({...actor,id:parent.id,expectedVersion:1}),'23514')
  checks.push('Invalid duplicate code, cyclic graph, analytic parent, classification mismatch and active-child deactivation blocked')
  const categoryActor={tenantId:2,actorId:3,entityId:'categorias'},catValues={nome:'Temporary regression category',tipo:'despesa',dre_grupo_codigo:5,conta_contabil_id:leaf.id,status:'ativo'}
  const cat=await repo.createErpEntityWithClient(client,{...categoryActor,values:catValues})
  await denied(()=>repo.deactivateErpEntityRecord({...actor,id:leaf.id,expectedVersion:2}),'23514')
  await denied(()=>repo.createErpEntityWithClient(client,{...categoryActor,values:{...catValues,nome:'Wrong binding',conta_contabil_id:parent.id}}),'23514')
  const {conta_contabil_id:_omitted,...withoutLink}=catValues
  const preserved=await repo.updateErpEntityRecord({...categoryActor,id:cat.id,expectedVersion:1,values:withoutLink});assert.equal(preserved.conta_contabil_id,leaf.id)
  await repo.updateErpEntityRecord({...categoryActor,id:cat.id,expectedVersion:2,values:{...catValues,conta_contabil_id:'nenhuma'}})
  await repo.deactivateErpEntityRecord({...actor,id:leaf.id,expectedVersion:2})
  await denied(()=>repo.createErpEntityWithClient(client,{...categoryActor,values:{...catValues,nome:'Inactive binding'}}),'23514')
  checks.push('Bindings: analytical/active required; linked deactivation blocked; omitted PATCH preserves binding; explicit unlink works')
  const bankActor={tenantId:2,actorId:3,entityId:'contas-financeiras'},bankValues={nome:'Temporary regression bank',tipo:'banco',conta_contabil_id:'nenhuma',status:'ativo',saldo_inicial:0,padrao:'nao'}
  const bank=await repo.createErpEntityWithClient(client,{...bankActor,values:bankValues});assert.equal((await repo.getErpEntityRecord({...bankActor,id:bank.id})).conta_contabil_id,'nenhuma')
  checks.push('Bank creation still stores account fields and optional accounting binding correctly')
  const catalog=await accounting.accountingOptions(2,'',1,'sintetica',Number(root.id),'ativo');assert(!catalog.options.some(o=>o.value===root.id||o.value===parent.id))
  await client.query(`INSERT INTO erp.contas_contabeis(empresa_id,codigo,nome,conta_pai_id,tipo,classificacao,natureza,criado_por,atualizado_por)
   SELECT $1,'9.1.'||n,CASE WHEN n=161 THEN 'UniqueLastAccounting' ELSE 'Pagination account' END,$2,'analitica','ativo','devedora',3,3 FROM generate_series(100,161)n`,[2,parent.id])
  const list=await repo.listErpEntityPage({tenantId:2,entityId:'contas-contabeis',pageSize:50,filters:{}});assert.equal(list.total,111);assert.equal(list.records.length,50);assert.equal(list.records[0].codigo,'1')
  const last=await repo.listErpEntityPage({tenantId:2,entityId:'contas-contabeis',pageSize:50,page:3,filters:{}});assert.equal(last.records.length,11)
  assert.equal((await repo.listErpEntityPage({tenantId:2,entityId:'contas-contabeis',query:'UniqueLastAccounting',filters:{}})).total,1)
  const firstOpts=await accounting.accountingOptions(2,'',1,'analitica'),nextOpts=await accounting.accountingOptions(2,'',2,'analitica');assert(firstOpts.hasMore);assert(nextOpts.options.length>0)
  checks.push('Hierarchy order, server search, 111 rows across three pages, options beyond first 50 and descendant exclusion')
  await db.query('RESET ROLE')
  const foreign=(await db.query("INSERT INTO erp.contas_contabeis(empresa_id,codigo,nome,tipo,classificacao,natureza) VALUES(1,'999','Other company','sintetica','ativo','devedora') RETURNING id")).rows[0].id
  await denied(()=>repo.createErpEntityWithClient(client,{...actor,values:{...base,codigo:'9.3',conta_pai_id:foreign}}),'23514')
  const own=(await client.query('SELECT id FROM erp.contas_contabeis WHERE empresa_id=$1',[2])).rows;assert(!own.some(c=>String(c.id)===String(foreign)))
  await db.query("SELECT set_config('app.erp_empresa_id','1',true),set_config('app.erp_tenant_id','1',true)");await db.query('SET LOCAL ROLE erp_runtime');assert.equal((await db.query('SELECT id FROM erp.contas_contabeis WHERE empresa_id=2')).rows.length,0)
  await db.query("RESET ROLE;SELECT set_config('app.erp_empresa_id','2',true),set_config('app.erp_tenant_id','2',true),set_config('app.erp_user_id','999999',true)");await db.query('SET LOCAL ROLE erp_runtime');assert.equal((await db.query('SELECT id FROM erp.contas_contabeis WHERE empresa_id=2')).rows.length,0)
  checks.push('Company isolation and nonmember reads blocked by RLS; cross-company parent denied')
 }))
 await db.query('RESET ROLE');await db.query('ROLLBACK');assert.deepEqual(await fingerprint(),before)
 const report={status:'passed',generatedAt:new Date().toISOString(),digests,checks,baseline,rolledBack:true,originalBusinessRecordsUnchanged:true};writeFileSync('.cache/accounting/regression.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
}catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{await db.end();await pg.closePool()}

import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {connection} from './evolution-db.mjs';
mkdirSync('.cache/erp-audit',{recursive:true});
const db=connection(),path='supabase/migrations/20261009160000_portal_contador_access.sql',sql=readFileSync(path,'utf8'),normalize=s=>s.replace(/\s+/g,' ').trim(),apply=process.argv.includes('--apply');
const report={generatedAt:new Date().toISOString(),checks:[],applied:false};
try {await db.connect();await db.query('BEGIN');
 for(const table of ['usuarios_empresas','convites_empresa']){
  const col=(await db.query("SELECT data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='shared' AND table_name=$1 AND column_name='acesso_portal_contador'",[table])).rows[0];assert.deepEqual(col,{data_type:'boolean',is_nullable:'NO',column_default:'false'});report.checks.push(table+'.acesso_portal_contador');
 }
 const caps=(await db.query("SELECT capability FROM shared.permissoes_perfil WHERE perfil_acesso_id='contador' ORDER BY capability")).rows.map(r=>r.capability);
 assert.deepEqual(caps,['erp.cadastros.visualizar','erp.compras.visualizar','erp.financeiro.visualizar','erp.relatorios.visualizar','erp.vendas.visualizar']);report.checks.push('exact accountant capabilities');
 const idx=(await db.query("SELECT indexdef FROM pg_indexes WHERE schemaname='shared' AND indexname='usuarios_empresas_portal_contador'")).rows[0]?.indexdef;
 assert.match(idx,/usuario_id, empresa_id/);assert.match(idx,/acesso_portal_contador/);assert.match(idx,/active/);report.checks.push('portal access index');
 for(const m of sql.matchAll(/CREATE (?:OR REPLACE )?FUNCTION (shared|erp)\.([a-z_]+)\([^]*?AS \$\$([^]*?)\$\$;/g)){
  const fn=(await db.query('SELECT p.prosrc,p.prosecdef,p.proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=$1 AND p.proname=$2',[m[1],m[2]])).rows;assert.equal(fn.length,1);assert.equal(normalize(fn[0].prosrc),normalize(m[3]),m[2]+' body differs');assert.equal(fn[0].prosecdef,true);assert(fn[0].proconfig.includes('search_path=pg_catalog'));report.checks.push(m[1]+'.'+m[2]);
 }
 assert.equal(report.checks.filter(c=>c.startsWith('shared.')||c.startsWith('erp.')).length,4);
 const tr=(await db.query("SELECT pg_get_triggerdef(oid) def FROM pg_trigger WHERE tgrelid='shared.convites_empresa'::regclass AND tgname='auditar_convite_contador' AND tgenabled='O'")).rows[0]?.def;assert.match(tr,/AFTER INSERT OR UPDATE/);assert.match(tr,/shared.auditar_convite_contador/);report.checks.push('invitation audit trigger');
 for(const role of ['anon','authenticated','erp_runtime']){
  assert.equal((await db.query("SELECT has_function_privilege($1,'shared.auditar_convite_contador()','EXECUTE') ok",[role])).rows[0].ok,false);
  assert.equal((await db.query("SELECT has_function_privilege($1,'erp.portal_documentos(bigint)','EXECUTE') ok",[role])).rows[0].ok,role==='erp_runtime');
 }
 report.checks.push('function grants');
 const current=(await db.query("SELECT version FROM supabase_migrations.schema_migrations WHERE version='20261009160000'")).rows;
 if(apply&&!current.length){await db.query("INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('20261009160000','portal_contador_access',$1)",[[sql.replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,'')]]);report.applied=true}
 await db.query(apply?'COMMIT':'ROLLBACK');report.status='passed';writeFileSync('.cache/erp-audit/portal-history-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{await db.end()}

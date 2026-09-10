
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {connection,root,project} from './evolution-db.mjs';
import {catalog} from './evolution-catalog.mjs';
const version='20260909040000',name='harden_erp_service_integrity';
const apply=process.argv.includes('--apply');
assert(process.argv.slice(2).every(x=>['--check','--apply','--project='+project].includes(x)));
if(apply)assert(process.argv.includes('--project='+project));
const folder=new URL('docs/avaliacao-erp/melhorias-estruturais/',root);
mkdirSync(folder,{recursive:true});
const read=f=>JSON.parse(readFileSync(new URL(f,folder),'utf8'));
const record=(f,d)=>writeFileSync(new URL(f,folder),JSON.stringify(d,null,2)+'\n');
const sql=readFileSync(new URL('supabase/migrations/'+version+'_'+name+'.sql',root),'utf8');
const body=sql.replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,'');
const digest=createHash('sha256').update(sql).digest('hex');
assert.equal(read('provas.json').status,'passed');
assert.equal(read('provas.json').digest,digest,'Testes devem corresponder ao SQL exato');
assert.equal(read('regressoes-anteriores.json').status,'passed');
assert.equal(read('regressoes-anteriores.json').digest,digest,'Regressoes devem corresponder ao SQL exato');
const localBefore=read('catalogo-antes-isolado.json'),expected=read('catalogo-esperado.json');
// PostgreSQL 18 cataloga NOT NULL como constraint propria; versoes anteriores
// registram a mesma garantia apenas em columns.is_nullable, que e comparada.
const roles=value=>Array.isArray(value)?[...value].sort():value.replace(/[{}\"]/g,'').split(',').sort();
const portable=c=>({...c,constraints:c.constraints.filter(x=>x.type!=='n'),policies:c.policies.map(p=>({...p,roles:roles(p.roles)}))});
localBefore.constraints=localBefore.constraints.filter(x=>x.type!=='n');
expected.constraints=expected.constraints.filter(x=>x.type!=='n');
localBefore.policies=portable(localBefore).policies;
expected.policies=portable(expected).policies;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const plan={};
for(const key of Object.keys(expected).filter(k=>k!=='date')){
 plan[key]={removed:localBefore[key].filter(r=>!expected[key].some(x=>same(x,r))),added:expected[key].filter(r=>!localBefore[key].some(x=>same(x,r)))};
}
function validatePlan(before,after){
 before=portable(before);after=portable(after);
 for(const [key,delta] of Object.entries(plan)){
  for(const row of delta.removed)assert(before[key].some(x=>same(x,row)),'Estrutura previa diverge: '+key+' '+JSON.stringify(row).slice(0,160));
  const wanted=before[key].filter(r=>!delta.removed.some(x=>same(x,r))).concat(delta.added);
  assert.deepEqual(after[key].map(JSON.stringify).sort(),wanted.map(JSON.stringify).sort(),'Diferenca nao planejada: '+key);
 }
 assert.equal(after.rls.filter(x=>x.schema==='erp'&&x.relkind==='r').length,82);
 assert(after.rls.filter(x=>x.schema==='erp'&&x.relkind==='r').every(x=>x.relrowsecurity));
 assert.equal(after.views.filter(x=>x.schemaname==='erp').length,2);
 assert(after.constraints.every(x=>x.validated));
}
const db=connection();let committed=false;
async function verifyFunctionAccess(){
 const names=[...sql.matchAll(/CREATE FUNCTION erp\.(\w+)\(/g)].map(x=>x[1]);
 const rows=(await db.query(`SELECT p.proname,exists(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') public_execute FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='erp' AND p.proname=ANY($1::text[]) ORDER BY p.proname`,[names])).rows;
 assert.equal(rows.length,new Set(names).size);
 assert(rows.every(x=>!x.public_execute),'Funcoes internas nao devem ter EXECUTE para PUBLIC');
 record('permissoes-funcoes.json',{date:new Date().toISOString(),status:'verified',functions:rows});
}
try{
 await db.connect();
 await db.query('BEGIN READ ONLY');
 const ledger=(await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0];
 const before=await catalog(db);
 await db.query('ROLLBACK');
 if(ledger){
  assert.equal(ledger.name,name);assert.deepEqual(ledger.statements,[body]);
  validatePlan(read('before.json'),before);
  await verifyFunctionAccess();
  record('reverification.json',{date:new Date().toISOString(),status:'verified',version,digest});
  console.log(JSON.stringify({status:'already_applied_and_verified',version}));
 }else{
  for(const [key,delta] of Object.entries(plan))for(const row of delta.removed)assert(before[key].some(x=>same(x,row)),'Drift em '+key+' '+JSON.stringify(row).slice(0,180));
  record('before.json',before);
  record('plano-catalogo.json',plan);
  console.log(JSON.stringify({status:'preflight_passed',mode:apply?'apply':'check',version,digest,tests:read('provas.json').checks+read('regressoes-anteriores.json').passed}));
  if(apply){
   await db.query('BEGIN');
   assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(172942,2026090940) ok')).rows[0].ok,true);
   await db.query(body);
   const after=await catalog(db);validatePlan(before,after);
   await verifyFunctionAccess();
   await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[body]]);
   await db.query('COMMIT');committed=true;
   const final=await catalog(db);validatePlan(before,final);
   record('after.json',final);
   const result={status:'applied_and_verified',date:new Date().toISOString(),project,version,digest,tables:82,views:2,businessRecordsQueried:false,businessRecordsChanged:false,isolatedChecks:read('provas.json').checks+read('regressoes-anteriores.json').passed};
   record('result.json',result);console.log(JSON.stringify(result));
  }
 }
}catch(e){
 try{await db.query('ROLLBACK');}catch{}
 record('error.json',{committed,code:e.code,message:String(e.message).slice(0,1500)});
 console.error(JSON.stringify({committed,code:e.code,message:String(e.message).slice(0,1500)}));process.exitCode=1;
}finally{await db.end();}

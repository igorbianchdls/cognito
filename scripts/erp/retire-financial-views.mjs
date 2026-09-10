import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {connection,root,project} from './evolution-db.mjs';
import {catalog} from './evolution-catalog.mjs';
const version='20260909033000',name='drop_erp_financial_views';
const apply=process.argv.includes('--apply');
assert(process.argv.slice(2).every(x=>['--check','--apply','--project='+project].includes(x)));
if(apply)assert(process.argv.includes('--project='+project));
const sql=readFileSync(new URL('supabase/migrations/'+version+'_'+name+'.sql',root),'utf8');
const body=sql.replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,'');
const digest=createHash('sha256').update(body).digest('hex');
const targets=['vw_aging_receber','vw_aging_pagar','vw_dre_gerencial','vw_fluxo_caixa_diario'];
const folder=new URL('docs/avaliacao-erp/remocao-views-financeiras/',root);mkdirSync(folder,{recursive:true});
const record=(f,data)=>writeFileSync(new URL(f,folder),JSON.stringify(data,null,2)+'\n');
const keep=row=>!((row.schema||row.schemaname||row.table_schema)==='erp'&&targets.includes(row.table_name||row.tablename||row.relname||row.viewname));
function verify(before,after){
 for(const key of Object.keys(before).filter(k=>k!=='date'))assert.deepEqual(after[key],before[key].filter(keep),'Alteracao inesperada: '+key);
 assert.equal(after.rls.filter(x=>x.schema==='erp'&&x.relkind==='r').length,82);
 assert.equal(after.views.filter(x=>x.schemaname==='erp').length,2);
 assert(after.views.filter(x=>x.schemaname==='erp').every(x=>['vw_posicao_estoque','vw_giro_estoque'].includes(x.viewname)));
}
const db=connection();let committed=false;
try{
 await db.connect();
 const existing=(await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0];
 if(existing){
  assert.equal(existing.name,name);assert.deepEqual(existing.statements,[body]);
  const after=await catalog(db),before=JSON.parse(readFileSync(new URL('before.json',folder)));
  verify(before,after);record('reverification.json',{date:new Date().toISOString(),version,digest,status:'verified'});
  console.log(JSON.stringify({status:'already_applied_and_verified',version,tables:82,views:2}));
 }else{
  await db.query('BEGIN READ ONLY');
  const before=await catalog(db);await db.query('ROLLBACK');
  assert.equal(before.rls.filter(x=>x.schema==='erp'&&x.relkind==='r').length,82);
  assert.equal(before.views.filter(x=>x.schemaname==='erp'&&targets.includes(x.viewname)).length,4);
  record('before.json',before);
  console.log(JSON.stringify({mode:apply?'apply':'check',version,targets,metadataOnly:true}));
  if(apply){
   await db.query('BEGIN');
   assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(172942,2026090933) ok')).rows[0].ok,true);
   await db.query(body);
   const after=await catalog(db);verify(before,after);
   await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[body]]);
   await db.query('COMMIT');committed=true;
   const final=await catalog(db);verify(before,final);record('after.json',final);
   const result={status:'applied_and_verified',date:new Date().toISOString(),project,version,digest,removedViews:targets,tables:82,remainingViews:['vw_posicao_estoque','vw_giro_estoque'],businessDataRead:false,businessDataModified:false};
   record('result.json',result);console.log(JSON.stringify(result));
  }
 }
}catch(e){
 try{await db.query('ROLLBACK');}catch{}
 record('error.json',{status:committed?'committed_verification_pending':'not_applied_or_rolled_back',code:e.code,message:String(e.message).slice(0,1000)});
 console.error(JSON.stringify({committed,code:e.code,message:String(e.message).slice(0,1000)}));process.exitCode=1;
}finally{await db.end();}


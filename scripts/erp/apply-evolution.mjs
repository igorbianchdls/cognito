import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {connection,root,project} from './evolution-db.mjs';
import {catalog} from './evolution-catalog.mjs';
const version='20260909030000',name='expand_erp_service_tables';
const apply=process.argv.includes('--apply');
assert(process.argv.slice(2).every(x=>['--check','--apply','--project='+project].includes(x)));
if(apply) assert(process.argv.includes('--project='+project));
const files=['03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql'];
const body=files.map(f=>readFileSync(new URL('scripts/erp/sql/'+f,root),'utf8').replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,'')).join('\n');
const digest=createHash('sha256').update(body).digest('hex');
const folder=new URL('docs/avaliacao-erp/aplicacao-'+version+'/',root);mkdirSync(folder,{recursive:true});
const record=(f,v)=>writeFileSync(new URL(f,folder),JSON.stringify(v,null,2)+'\n');
const db=connection(),peer=connection();
const additions=['entidades_contatos','entidades_enderecos','contratos_vendas_arquivos','vendas_arquivos','ordens_servico_arquivos','contas_receber_arquivos','contas_receber_eventos','contratos_vendas_versoes','contratos_vendas_eventos','contratos_vendas_geracoes_tentativas','adiantamentos','adiantamentos_aplicacoes','renegociacoes','renegociacoes_parcelas'];
const touched=[...additions,'entidades','arquivos','vendas','ordens_servico','contratos_vendas','contratos_vendas_itens','contratos_vendas_geracoes','contas_receber','contas_pagar','contas_receber_parcelas','contas_pagar_parcelas','pagamentos','transferencias_financeiras','transacoes_bancarias','conciliacoes_bancarias','conciliacoes_bancarias_itens'];
const outside=rows=>rows.filter(x=>!((x.schema||x.schemaname||x.table_schema)==='erp'&&touched.includes(x.table_name||x.tablename||x.relname)));
function verify(after,before){
 assert.equal(after.rls.filter(x=>x.schema==='erp'&&x.relkind==='r').length,82);
 assert.deepEqual(after.views,before.views,'Views alteradas');
 for(const t of additions){
  assert(after.rls.some(x=>x.schema==='erp'&&x.relname===t&&x.relrowsecurity),'RLS ausente: '+t);
  assert(after.policies.some(x=>x.tablename===t),'Politica ausente: '+t);
  assert(!after.grants.some(x=>x.table_schema==='erp'&&x.table_name===t&&['PUBLIC','anon','authenticated'].includes(x.grantee)),'Grant indevido: '+t);
 }
 for(const key of ['columns','constraints','indexes','policies','triggers','grants','rls']) assert.deepEqual(outside(after[key]),outside(before[key]),'Fora do escopo: '+key);
 for(const f of before.functions.filter(x=>!['validar_periodo_comercial_financeiro'].includes(x.name))) assert(after.functions.some(x=>x.schema===f.schema&&x.name===f.name&&x.definition===f.definition),'Funcao existente alterada: '+f.name);
}
async function counts(){
 const result={};
 for(const t of ['contas_receber','contas_pagar','contas_receber_parcelas','contas_pagar_parcelas','pagamentos','contratos_vendas','contratos_vendas_itens','contratos_vendas_geracoes','conciliacoes_bancarias_itens'])
  result[t]=(await db.query('SELECT count(*)::int n FROM erp.'+t)).rows[0].n;
 for(const side of ['receber','pagar'])
  result[side+'_valores']=(await db.query('SELECT coalesce(sum(valor),0)::text valor,coalesce(sum(valor_pago),0)::text pago FROM erp.contas_'+side+'_parcelas')).rows[0];
 return result;
}
async function lockCheck(helper){
 const id='-903481278612';
 const hash=(await db.query('SELECT hashint8($1::bigint) k',[id])).rows[0].k;
 assert.equal((await db.query('SELECT count(*)::int n FROM shared.tenants WHERE hashint8(id)=$1',[hash])).rows[0].n,0);
 try{
  await db.query('BEGIN READ ONLY');await peer.query('BEGIN READ ONLY');
  if(helper){
   await db.query('SELECT erp.travar_evolucao($1)',[id]);
   await assert.rejects(peer.query('SELECT erp.travar_evolucao($1)',[id]),e=>e.code==='40001');
  }else{
   assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(172943,$1) ok',[hash])).rows[0].ok,true);
   assert.equal((await peer.query('SELECT pg_try_advisory_xact_lock(172943,$1) ok',[hash])).rows[0].ok,false);
  }
 }finally{await db.query('ROLLBACK');await peer.query('ROLLBACK');}
 await peer.query('BEGIN READ ONLY');
 try{
  if(helper) await peer.query('SELECT erp.travar_evolucao($1)',[id]);
  else assert.equal((await peer.query('SELECT pg_try_advisory_xact_lock(172943,$1) ok',[hash])).rows[0].ok,true);
 }finally{await peer.query('ROLLBACK');}
 return {conflictRejected:true,releasedOnRollback:true};
}
let committed=false;
try{
 await db.connect();await peer.connect();
 const ledger=(await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0];
 if(ledger){
  assert.equal(ledger.name,name);assert.deepEqual(ledger.statements,[body]);
  const before=JSON.parse(readFileSync(new URL('before.json',folder)));
  const after=await catalog(db);verify(after,before);const locks=await lockCheck(true);
  record('reverification.json',{date:new Date().toISOString(),digest,locks});
  console.log(JSON.stringify({status:'already_applied_and_verified',version,digest}));
 }else{
  const before=await catalog(db);
  const baseline=JSON.parse(readFileSync(new URL('docs/avaliacao-erp/aplicacao-20260908180000/after.json',root)));
  for(const key of Object.keys(baseline).filter(k=>k!=='date')) assert.deepEqual(before[key],baseline[key],'Catalogo mudou: '+key);
  const originalCounts=await counts();
  const locks=await lockCheck(false);
  if(!existsSync(new URL('before.json',folder))) record('before.json',before);
  else {const saved=JSON.parse(readFileSync(new URL('before.json',folder)));for(const k of Object.keys(saved).filter(k=>k!=='date'))assert.deepEqual(saved[k],before[k]);}
  record('preflight.json',{date:new Date().toISOString(),version,digest,originalCounts,locks});
  console.log(JSON.stringify({mode:apply?'apply':'check',version,digest,originalCounts,locks}));
  if(apply){
   const test=JSON.parse(readFileSync(new URL('docs/avaliacao-erp/testes-novas-tabelas.json',root)));
   assert.equal(test.status,'passed');assert(test.passed>=70);
   assert.equal(test.digest,digest,'Testes devem corresponder ao SQL exato');
   await db.query('BEGIN');
   assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(172942,20260909) ok')).rows[0].ok,true);
   await db.query(body);
   await db.query('SET CONSTRAINTS ALL IMMEDIATE');
   const after=await catalog(db);verify(after,before);
   assert.deepEqual(await counts(),originalCounts,'Dados financeiros existentes alterados');
   await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[body]]);
   await db.query('COMMIT');committed=true;
   const verified=await catalog(db);verify(verified,before);record('after.json',verified);
   const liveLocks=await lockCheck(true);
   const result={status:'applied_and_verified',date:new Date().toISOString(),project,version,digest,newTables:14,totalTables:82,views:6,existingDataPreserved:true,liveLocks,tests:test.passed};
   record('result.json',result);writeFileSync(new URL('executed.sql',folder),'BEGIN;\n'+body+'\nCOMMIT;\n');
   console.log(JSON.stringify(result));
  }
 }
}catch(e){
 try{await db.query('ROLLBACK');}catch{}
 record('last-error.json',{status:committed?'committed_verification_pending':'not_applied_or_rolled_back',code:e.code,message:String(e.message).slice(0,1400)});
 console.error(JSON.stringify({status:committed?'committed_verification_pending':'not_applied_or_rolled_back',code:e.code,message:String(e.message).slice(0,1400)}));process.exitCode=1;
}finally{await Promise.allSettled([db.end(),peer.end()]);}


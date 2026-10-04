import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,openSync,writeSync,fsyncSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {connection,root,project} from './evolution-db.mjs';
import {catalog} from './evolution-catalog.mjs';

const version='20261003170000',name='harden_erp_read_access';
const apply=process.argv.includes('--apply');
assert(process.argv.slice(2).every(x=>['--check','--apply','--project='+project].includes(x)));
if(apply)assert(process.argv.includes('--project='+project));
const folder=new URL('.cache/erp-audit/read-access/',root);
mkdirSync(folder,{recursive:true});
const read=f=>JSON.parse(readFileSync(new URL(f,folder),'utf8'));
const record=(f,data)=>writeFileSync(new URL(f,folder),JSON.stringify(data,null,2)+'\n');
const sql=readFileSync(new URL('supabase/migrations/'+version+'_'+name+'.sql',root),'utf8');
const body=sql.replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,'');
const digest=createHash('sha256').update(sql).digest('hex');
for(const file of ['access-matrix.json','provas.json','regressoes-anteriores.json']){
  const proof=read(file);assert.equal(proof.status,'passed',file);assert.equal(proof.digest,digest,'Validar o SQL exato antes de aplicar: '+file);
}
const expected=read('after-access-local.json');
const changedFunctions=new Set(['shared.is_tenant_member','shared.has_erp_capability','shared.can_read_erp_module','erp.fiscal_issuer_for_operations']);
const identity=f=>f.schema+'.'+f.name;
const normalizedPolicies=rows=>rows.map(p=>({...p,roles:Array.isArray(p.roles)?p.roles:p.roles.replace(/[{}\"]/g,'').split(',')}));
function verify(before,after){
  for(const group of ['columns','constraints','indexes','triggers','grants','rls','views'])assert.deepEqual(after[group],before[group],'Alteracao nao planejada: '+group);
  assert.deepEqual(normalizedPolicies(after.policies.filter(p=>p.cmd!=='SELECT'||p.schemaname!=='erp')),normalizedPolicies(before.policies.filter(p=>p.cmd!=='SELECT'||p.schemaname!=='erp')),'Politicas de escrita alteradas');
  const policies=after.policies.filter(p=>p.cmd==='SELECT'&&p.schemaname==='erp');
  assert.equal(policies.length,82);
  assert.deepEqual(normalizedPolicies(policies),normalizedPolicies(expected.policies.filter(p=>p.cmd==='SELECT'&&p.schemaname==='erp')),'Politicas SELECT divergem do teste local');
  assert.deepEqual(after.functions.filter(f=>!changedFunctions.has(identity(f))),before.functions.filter(f=>!changedFunctions.has(identity(f))),'Outra funcao foi alterada');
  for(const id of changedFunctions){
    const actual=after.functions.find(f=>identity(f)===id),wanted=expected.functions.find(f=>identity(f)===id);
    assert(actual&&wanted,id);assert.deepEqual(actual,wanted,'Funcao diverge do teste local: '+id);
  }
  assert(after.rls.filter(t=>t.schema==='erp'&&t.relkind==='r').length===82);
  assert(after.rls.filter(t=>t.schema==='erp'&&t.relkind==='r').every(t=>t.relrowsecurity));
}
async function verifyPrivateFunctions(client){
  const rows=(await client.query(`SELECT n.nspname AS schema,p.proname,
    p.prosecdef,p.proconfig,has_function_privilege('anon',p.oid,'EXECUTE') anon_execute,
    has_function_privilege('authenticated',p.oid,'EXECUTE') authenticated_execute,
    has_function_privilege('erp_runtime',p.oid,'EXECUTE') runtime_execute,
    EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') public_execute
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE (n.nspname='shared' AND p.proname='can_read_erp_module') OR (n.nspname='erp' AND p.proname='fiscal_issuer_for_operations')`)).rows;
  assert.equal(rows.length,2);
  assert(rows.every(f=>f.prosecdef&&f.runtime_execute&&!f.anon_execute&&!f.authenticated_execute&&!f.public_execute&&f.proconfig.includes('search_path=pg_catalog')));
  return rows;
}
const client=connection();let committed=false,phase='connect';
try{
  await client.connect();
  phase='preflight';await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const ledger=(await client.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0];
  const before=await catalog(client);await client.query('ROLLBACK');
  if(ledger){
    assert.equal(ledger.name,name);assert.deepEqual(ledger.statements,[body]);
    const previous=read('application.json');assert.equal(previous.digest,digest);
    verify(read(previous.backup),before);await verifyPrivateFunctions(client);
    console.log(JSON.stringify({status:'already_applied_and_verified',version,digest}));
  }else if(!apply){
    assert.equal(before.policies.filter(p=>p.schemaname==='erp'&&p.cmd==='SELECT'&&p.qual==='shared.is_tenant_member(tenant_id)').length,82);
    console.log(JSON.stringify({status:'preflight_passed',version,digest,policies:82}));
  }else{
    phase='backup';
    const backup='before-remote-'+new Date().toISOString().replaceAll(':','-')+'.json';
    const bytes=JSON.stringify(before,null,2)+'\n';
    const descriptor=openSync(new URL(backup,folder),'wx');
    try{writeSync(descriptor,bytes);fsyncSync(descriptor);}finally{closeSync(descriptor);}
    assert.equal(readFileSync(new URL(backup,folder),'utf8'),bytes);
    phase='migration';await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout='10s'");
    assert.equal((await client.query('SELECT pg_try_advisory_xact_lock(172942,2026100317) ok')).rows[0].ok,true);
    assert.equal((await client.query('SELECT count(*)::int n FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0].n,0);
    const current=await catalog(client);
    for(const group of Object.keys(before).filter(k=>k!=='date'))assert.deepEqual(current[group],before[group],'Catalogo mudou durante preflight: '+group);
    await client.query(body);
    phase='verify_before_commit';const after=await catalog(client);verify(before,after);
    const permissions=await verifyPrivateFunctions(client);
    await client.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[body]]);
    await client.query('COMMIT');committed=true;
    record('application.json',{status:'committed',date:new Date().toISOString(),project,version,digest,backup,backupDigest:createHash('sha256').update(bytes).digest('hex'),selectPolicies:82,commercialDataChanges:0,permissions});
    phase='verify_after_commit';await client.query('BEGIN READ ONLY');
    verify(before,await catalog(client));await verifyPrivateFunctions(client);
    assert.equal((await client.query('SELECT count(*)::int n FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0].n,1);
    await client.query('ROLLBACK');
    record('verification.json',{status:'verified',date:new Date().toISOString(),version,digest,policies:82});
    console.log(JSON.stringify({status:'applied_and_verified',version,policies:82,commercialDataChanges:0,digest}));
  }
}catch(error){
  await client.query('ROLLBACK').catch(()=>{});
  // Nunca registrar mensagens completas do driver, URLs ou credenciais.
  console.error(JSON.stringify({status:'failed',phase,committed,code:error.code||error.name}));process.exitCode=1;
}finally{await client.end().catch(()=>{});}

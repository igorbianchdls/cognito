import assert from 'node:assert/strict'
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs'
import {resolve,dirname} from 'node:path'
import {createRequire} from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import {createHash} from 'node:crypto'
import {db,restoreCatalog} from '../erp/evolution-fixture.mjs'
import {applySharedMigration,migrationFile} from './schema-contract.mjs'

const root=resolve('.'),require=createRequire(import.meta.url),modules=new Map(),checks=[]
let tail=Promise.resolve(),externalFailure=false,externalCalls=0,insideTransaction=false
class LocalPool{
 async connect(){const previous=tail;let unlock;tail=new Promise(r=>{unlock=r});await previous
  return {async query(sql,params){if(sql==='BEGIN')insideTransaction=true;if(['COMMIT','ROLLBACK'].includes(sql))insideTransaction=false;try{return await db.query(sql,params)}catch(error){console.error('Local DB diagnostic:',error.code,error.message);throw error}},release(){unlock()}}
 }
 async end(){await tail}
}
function load(name,parent=resolve(root,'entry.ts')){
 if(name==='pg')return {Pool:LocalPool}
 if(name==='@clerk/nextjs/server')return {clerkClient:async()=>{throw new Error('REAL_IDENTITY_FORBIDDEN')},auth:async()=>({userId:null})}
 if(!name.startsWith('.')&&!name.startsWith('@/')&&!name.startsWith(root))return require(name)
 let file=name.startsWith('@/')?resolve(root,'src',name.slice(2)):resolve(dirname(parent),name)
 if(!existsSync(file))file=['.ts','.tsx','/index.ts'].map(s=>file+s).find(existsSync)
 assert(file,name)
 if(modules.has(file))return modules.get(file).exports
 const record={exports:{}};modules.set(file,record)
 const source=readFileSync(file,'utf8')
 const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(dep=>load(dep,file),record,record.exports)
 return record.exports
}
const originalFetch=globalThis.fetch,oldUrl=process.env.SUPABASE_DB_URL,oldKey=process.env.CLERK_SECRET_KEY
process.env.SUPABASE_DB_URL='postgresql://local:local@127.0.0.1:5432/fictitious_only'
process.env.CLERK_SECRET_KEY='local_fictitious_test_key'
globalThis.fetch=async(url,options)=>{
 assert.equal(new URL(url).hostname,'api.clerk.com');assert.equal(insideTransaction,false,'External mutations cannot occur within a DB transaction')
 externalCalls++;if(externalFailure)throw new Error('Simulated network failure')
 const payload=JSON.parse(options.body)
 if(String(url).endsWith('/metadata'))assert(['owner','admin','member','viewer'].includes(payload.public_metadata.appRole))
 return Response.json({id:'local_membership'})
}
async function check(name,test){await test();checks.push(name);console.log('Passed: '+name)}
async function rejectedSQL(sql,code='23514'){
 await db.exec('BEGIN');try{await assert.rejects(db.exec(sql),e=>e.code===code)}finally{await db.exec('ROLLBACK')}
}
try{
 await restoreCatalog()
 for(const file of ['01-integridade-historicos.sql','02-periodos-fechados.sql','03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql'])await db.exec(readFileSync('scripts/erp/sql/'+file,'utf8'))
 for(const file of ['20260909033000_drop_erp_financial_views.sql','20260909040000_harden_erp_service_integrity.sql','20261003170000_harden_erp_read_access.sql','20261005020000_harden_erp_stock_operations.sql','20261005021000_anchor_contract_cycles.sql','20261003130000_create_chatgptplugin.sql','20261003140000_chatgptplugin_drafts.sql','20261003150000_chatgptplugin_operations_settings.sql','20261003160000_create_plugin_schema.sql'])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'))
 await db.exec(`INSERT INTO shared.erp_permission_profiles(id,nome) VALUES('consulta','Consulta'),('financeiro','Financeiro'),('administrador','Administrador');
 INSERT INTO shared.erp_profile_permissions(profile_id,capability) VALUES('consulta','erp.cadastros.visualizar'),('financeiro','erp.financeiro.visualizar'),('financeiro','erp.financeiro.gerenciar');
 INSERT INTO shared.users(id,email,full_name,clerk_user_id) VALUES(1,'Owner@Example.Invalid','Owner','user_owner'),(2,'admin@example.invalid','Admin','user_admin'),(3,'member@example.invalid','Member','user_member'),(4,'legacy@example.invalid','Legacy',NULL);
 INSERT INTO shared.tenants(id,name,slug,clerk_organization_id) VALUES(1,'Empresa A','a','org_a'),(2,'Empresa B','b','org_b'),(3,'CLI ERP Test','cli',NULL);
 INSERT INTO shared.tenant_memberships(tenant_id,user_id,role,status,erp_profile_id,clerk_organization_id) VALUES(1,1,'owner','active','consulta','org_a'),(1,2,'admin','active','consulta','org_a'),(1,3,'member','active','financeiro','org_a'),(2,1,'owner','active','consulta','org_b'),(3,4,'admin','active','administrador',NULL);`)
 await db.exec("SELECT setval('shared.users_id_seq',(SELECT max(id) FROM shared.users),true);SELECT setval('shared.tenants_id_seq',(SELECT max(id) FROM shared.tenants),true)")
 await applySharedMigration(db)
 const postgres=load('@/lib/postgres'),bootstrap=load('@/products/auth/server/clerkTenantBootstrap'),sync=load('@/products/auth/server/clerkOrganizationSync')
 const settings=load('@/products/auth/server/settingsRepository'),processor=load('@/products/auth/server/clerkWebhookProcessor'),outbox=load('@/products/auth/server/clerkOutbox')
 const policy=load('@/products/auth/server/accessPolicy')
 await check('Eight shared tables and preserved identifiers and references',async()=>{
  assert.equal((await db.query("SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='shared' AND table_type='BASE TABLE'")).rows[0].n,8)
  assert.equal((await db.query("SELECT count(*)::int n FROM information_schema.columns WHERE table_schema IN ('erp','shared','plugin') AND column_name='tenant_id'")).rows[0].n,0)
  assert.equal((await db.query('SELECT count(*)::int n FROM shared.usuarios')).rows[0].n,4)
  assert.equal((await db.query("SELECT role FROM shared.usuarios_empresas WHERE empresa_id=3 AND usuario_id=4")).rows[0].role,'admin')
  assert.equal((await db.query('SELECT email FROM shared.usuarios WHERE id=1')).rows[0].email,'owner@example.invalid')
  const adminCapabilities=(await db.query("SELECT capability FROM shared.permissoes_perfil WHERE perfil_acesso_id='administrador' ORDER BY capability")).rows.map(row=>row.capability)
  assert.deepEqual(adminCapabilities,[...load('@/products/erp/shared/professionalContracts').ERP_CAPABILITIES].sort())
 })
 await check('Normalized unique email and verified unambiguous identity linking',async()=>{
  await rejectedSQL("INSERT INTO shared.usuarios(email) VALUES('owner@example.invalid')",'23505')
  await rejectedSQL("INSERT INTO shared.usuarios(email) VALUES('SPACE@Example.Invalid')")
  const profile={clerkUserId:'user_legacy',clerkOrganizationId:null,email:'legacy@example.invalid',emailVerified:false,fullName:'Legacy',avatarUrl:null}
  await assert.rejects(bootstrap.syncClerkProfile(profile))
  const linked=await bootstrap.syncClerkProfile({...profile,emailVerified:true});assert.equal(linked.sharedUserId,4)
  const results=await Promise.all([bootstrap.syncClerkProfile({...profile,emailVerified:true}),bootstrap.syncClerkProfile({...profile,emailVerified:true})]);assert(results.every(x=>x.sharedUserId===4))
 })
 await check('Last owner cannot be demoted, suspended, deleted or globally disabled',async()=>{
  for(const sql of ["UPDATE shared.usuarios_empresas SET role='member',perfil_acesso_id='consulta' WHERE empresa_id=1 AND usuario_id=1","UPDATE shared.usuarios_empresas SET status='suspended' WHERE empresa_id=1 AND usuario_id=1","UPDATE shared.usuarios_empresas SET suspenso_localmente=true WHERE empresa_id=1 AND usuario_id=1","DELETE FROM shared.usuarios_empresas WHERE empresa_id=1 AND usuario_id=1","UPDATE shared.usuarios SET status='disabled' WHERE id=1"])await rejectedSQL(sql)
 })
 await check('Administrator cannot alter an owner; member cannot administer',async()=>{
  await assert.rejects(settings.updateWorkspaceMember({actorUserId:2,tenantId:1,values:{userId:1,status:'suspended'}}))
  await assert.rejects(settings.updateWorkspaceMember({actorUserId:3,tenantId:1,values:{userId:2,role:'member'}}))
 })
 await check('Profiles are editable and viewer writes are denied by both policies',async()=>{
  const member=await settings.updateWorkspaceMember({actorUserId:1,tenantId:1,values:{userId:3,role:'viewer',profileId:'financeiro',reason:'Somente consulta'}})
  assert.equal(member.profileId,'financeiro');assert.deepEqual(policy.effectiveCapabilities('viewer',['erp.financeiro.visualizar','erp.financeiro.gerenciar']),['erp.financeiro.visualizar'])
  await db.query("SELECT set_config('app.erp_user_id','3',false),set_config('app.erp_empresa_id','1',false)")
  const caps=(await db.query("SELECT shared.has_erp_capability(1,'erp.financeiro.gerenciar') write,shared.has_erp_capability(1,'erp.financeiro.visualizar') read,shared.is_tenant_member(2) other")).rows[0]
  assert.deepEqual(caps,{write:false,read:true,other:false});await db.query("SELECT set_config('app.erp_user_id','',false),set_config('app.erp_empresa_id','',false)")
 })
 const membership={id:'om_member',organization:{id:'org_a',name:'Empresa A'},public_user_data:{user_id:'user_member',identifier:'member@example.invalid'},role:'org:member',public_metadata:{appRole:'member'}}
 await check('Local suspension and managed role survive Clerk updates',async()=>{
  await settings.updateWorkspaceMember({actorUserId:1,tenantId:1,values:{userId:3,status:'suspended'}})
  await postgres.withTransaction(client=>sync.syncClerkOrganizationMembership(client,membership))
  const row=(await db.query('SELECT status,role,suspenso_localmente FROM shared.usuarios_empresas WHERE empresa_id=1 AND usuario_id=3')).rows[0]
  assert.deepEqual(row,{status:'suspended',role:'viewer',suspenso_localmente:true})
 })
 await check('Signed receipt deduplicates and rejects older events transactionally',async()=>{
  const newer={type:'organizationMembership.updated',timestamp:2000,data:membership}
  await processor.processVerifiedClerkEvent('evt_new',newer)
  assert.deepEqual(await processor.processVerifiedClerkEvent('evt_new',newer),{duplicate:true})
  assert.deepEqual(await processor.processVerifiedClerkEvent('evt_old',{...newer,timestamp:1000}),{ignored:true})
  assert.equal((await db.query("SELECT tentativas FROM shared.eventos_webhook WHERE evento_id='evt_new'")).rows[0].tentativas,1)
 })
 await check('Invitations persist organization, profile, status and expiry',async()=>{
  await processor.processVerifiedClerkEvent('evt_invite',{type:'organizationInvitation.created',timestamp:3000,data:{id:'invite_1',organization_id:'org_a',email_address:'NEW@Example.Invalid',role:'org:member',expires_at:60000,inviter_id:'user_owner'}})
  const row=(await db.query('SELECT empresa_id,email,status,perfil_acesso_id,convidado_por,expira_em IS NOT NULL expires FROM shared.convites_empresa')).rows[0]
  assert.equal(Number(row.empresa_id),1);assert.equal(row.email,'new@example.invalid');assert.equal(row.expires,true);assert.equal(Number(row.convidado_por),1)
 })
 await check('Failed webhook rolls back effects and persists failure for provider retry',async()=>{
  await assert.rejects(processor.processVerifiedClerkEvent('evt_bad',{type:'user.updated',timestamp:4000,data:{id:'user_bad'}}))
  assert.equal((await db.query("SELECT status FROM shared.eventos_webhook WHERE evento_id='evt_bad'")).rows[0].status,'failed')
 })
 await check('Deletion before creation leaves a tombstone and equal-time deletion wins',async()=>{
  await processor.processVerifiedClerkEvent('evt_missing_deleted',{type:'user.deleted',timestamp:4100,data:{id:'user_missing'}})
  assert.deepEqual(await processor.processVerifiedClerkEvent('evt_missing_created',{type:'user.created',timestamp:4000,data:{id:'user_missing'}}),{ignored:true})
  await processor.processVerifiedClerkEvent('evt_equal_update',{type:'organization.updated',timestamp:4200,data:{id:'org_b',name:'Empresa B'}})
  await processor.processVerifiedClerkEvent('evt_equal_delete',{type:'organization.deleted',timestamp:4200,data:{id:'org_b'}})
  assert.equal((await db.query('SELECT status FROM shared.empresas WHERE id=2')).rows[0].status,'disabled')
 })
 await check('Unknown events without object identity are safely ignored and deduplicated',async()=>{
  assert.deepEqual(await processor.processVerifiedClerkEvent('evt_unsupported',{type:'newfeature.updated',data:{}}),{ignored:true})
  assert.deepEqual(await processor.processVerifiedClerkEvent('evt_unsupported',{type:'newfeature.updated',data:{}}),{duplicate:true})
 })
 await check('Clerk membership identity and organization constraints prevent ambiguous links',async()=>{
  await rejectedSQL("UPDATE shared.usuarios_empresas SET clerk_membership_id='om_member' WHERE empresa_id=1 AND usuario_id=2",'23505')
  await rejectedSQL("UPDATE shared.usuarios_empresas SET clerk_organization_id='org_b' WHERE empresa_id=1 AND usuario_id=3",'23503')
  await rejectedSQL("INSERT INTO shared.permissoes_perfil(perfil_acesso_id,capability) VALUES('consulta','erp.unknown.visualizar')")
  await assert.rejects(postgres.withTransaction(client=>sync.syncClerkOrganization(client,{id:'org_wrong',name:'Wrong',private_metadata:{tenantId:1}})))
 })
 await check('Clerk default admin webhook establishes the verified onboarding owner',async()=>{
  await postgres.withTransaction(async client=>{
    await sync.syncClerkOrganization(client,{id:'org_onboarding',name:'Onboarding',private_metadata:{ownerClerkUserId:'user_member'}})
    await sync.syncClerkOrganizationMembership(client,{...membership,id:'om_onboarding',organization:{id:'org_onboarding'},role:'org:admin',public_metadata:{}})
  })
  const row=(await db.query("SELECT m.role,m.perfil_acesso_id,e.proprietario_definido FROM shared.usuarios_empresas m JOIN shared.empresas e ON e.id=m.empresa_id WHERE e.clerk_organization_id='org_onboarding'")).rows[0]
  assert.deepEqual(row,{role:'owner',perfil_acesso_id:'administrador',proprietario_definido:true})
 })
 await check('External role failures keep committed access and recover from durable outbox',async()=>{
  externalFailure=true
  const member=await settings.updateWorkspaceMember({actorUserId:1,tenantId:1,values:{userId:3,role:'member',status:'active'}})
  assert.equal(member.role,'member');assert.equal(member.syncPending,true)
  const failed=(await db.query("SELECT id FROM shared.eventos_webhook WHERE provedor='clerk_outbox' AND status='failed' ORDER BY id DESC LIMIT 1")).rows[0]
  externalFailure=false;assert.equal(await outbox.processClerkOperation(Number(failed.id)),true)
  assert(externalCalls>=3)
 })
 await check('Access audit is append only, identifies actor and excludes private identity fields',async()=>{
  const row=(await db.query("SELECT * FROM shared.historico_acessos WHERE origem='settings_members' AND usuario_id=3 ORDER BY id DESC LIMIT 1")).rows[0]
  assert.equal(Number(row.autor_usuario_id),1);assert(!JSON.stringify(row.antes).includes('@'))
  await rejectedSQL('DELETE FROM shared.historico_acessos');await rejectedSQL('TRUNCATE shared.historico_acessos')
 })
 await check('All shared tables remain inaccessible to client and ERP runtime roles',async()=>{
  const tables=(await db.query("SELECT tablename FROM pg_tables WHERE schemaname='shared'")).rows
  for(const role of ['anon','authenticated','erp_runtime'])for(const {tablename} of tables){await db.exec('BEGIN;SET LOCAL ROLE '+role);try{await assert.rejects(db.query('SELECT * FROM shared.'+tablename),e=>e.code==='42501')}finally{await db.exec('ROLLBACK')}}
 })
 await check('Provider deletion of sole owner suspends company and revokes all access',async()=>{
  await processor.processVerifiedClerkEvent('evt_delete',{type:'user.deleted',timestamp:5000,data:{id:'user_owner'}})
  assert.equal((await db.query('SELECT status FROM shared.empresas WHERE id=1')).rows[0].status,'suspended')
  assert.equal((await db.query('SELECT status FROM shared.usuarios WHERE id=1')).rows[0].status,'disabled')
  await rejectedSQL("UPDATE shared.empresas SET status='active' WHERE id=1")
  await rejectedSQL("UPDATE shared.empresas SET proprietario_definido=false WHERE id=1")
 })
 const report={status:'passed',localOnly:true,realIdentitiesChanged:false,checks,migrationDigest:createHash('sha256').update(readFileSync('supabase/migrations/'+migrationFile)).digest('hex')}
 mkdirSync('.cache/shared',{recursive:true});writeFileSync('.cache/shared/smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:checks.length}))
}catch(error){console.error(JSON.stringify({status:'failed',code:error.code,message:error.message,completed:checks}));process.exitCode=1}
finally{globalThis.fetch=originalFetch;if(oldUrl===undefined)delete process.env.SUPABASE_DB_URL;else process.env.SUPABASE_DB_URL=oldUrl;if(oldKey===undefined)delete process.env.CLERK_SECRET_KEY;else process.env.CLERK_SECRET_KEY=oldKey;await db.close()}

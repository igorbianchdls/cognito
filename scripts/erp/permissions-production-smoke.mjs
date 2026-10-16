import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {connection} from './evolution-db.mjs';
import {sourceLoader} from './accounting-test-runtime.mjs';

// Changes are visible only inside this transaction and ALWAYS rolled back.
// Never changes Clerk sessions or persists membership/profile changes.
const db=connection(),checks=[],load=sourceLoader();
const {effectiveCapabilities}=load('@/products/auth/server/accessPolicy');
const caps=['erp.vendas.visualizar','erp.vendas.gerenciar','erp.compras.visualizar','erp.compras.gerenciar','erp.financeiro.visualizar','erp.financeiro.gerenciar','erp.financeiro.baixar','erp.financeiro.estornar','erp.estoque.visualizar','erp.estoque.movimentar','erp.estoque.ajustar','erp.relatorios.visualizar','erp.cadastros.visualizar','erp.cadastros.gerenciar','erp.configuracoes.gerenciar'];
const tag='QA-OTTO-PERMISSOES-'+Date.now();
let before,tables,rolledBack=false,testUser;
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function runtime(fn){await db.query('SET LOCAL ROLE erp_runtime');try{return await fn()}finally{await db.query('RESET ROLE')}}
async function denied(sql,args=[]){await db.query('SAVEPOINT qa_denied');let code;try{await db.query(sql,args)}catch(e){code=e.code}finally{await db.query('ROLLBACK TO SAVEPOINT qa_denied');await db.query('RELEASE SAVEPOINT qa_denied')}assert.equal(code,'42501')}
async function membership(role,profile){await db.query('UPDATE shared.usuarios_empresas SET role=$1,perfil_acesso_id=$2 WHERE empresa_id=2 AND usuario_id=$3',[role,profile,testUser])}
async function capabilityMatrix(expected){for(const r of (await db.query('SELECT c,shared.has_erp_capability(2,c) allowed FROM unnest($1::text[]) c',[caps])).rows)assert.equal(r.allowed,expected.includes(r.c),r.c)}
try{
 await db.connect();
 before=(await db.query('SELECT to_jsonb(m) data FROM shared.usuarios_empresas m WHERE empresa_id=2 AND usuario_id=3')).rows[0].data;
 assert.equal(before.role,'owner');assert.equal(before.status,'active');
 await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'");
 await db.query("SELECT set_config('app.erp_tenant_id','2',true),set_config('app.erp_user_id','3',true)");
 tables=(await db.query("SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='erp' AND c.relkind='r' AND EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attname='empresa_id' AND NOT a.attisdropped) ORDER BY c.relname")).rows.map(r=>r.relname);
 assert(tables.length>=105);
 await check('Administrador: 15 capacidades disponíveis',()=>capabilityMatrix(caps));
 await check('Isolamento: nenhuma linha de outra empresa em todas as tabelas ERP',()=>runtime(async()=>{for(const t of tables){assert(/^[a-z_]+$/.test(t));assert.equal((await db.query(`SELECT EXISTS(SELECT 1 FROM erp.${t} WHERE empresa_id<>2) leaked`)).rows[0].leaked,false,t)}}));
 await db.query('INSERT INTO shared.perfis_acesso(id,nome) VALUES($1,$2)',[tag,tag]);
 testUser=Number((await db.query('INSERT INTO shared.usuarios(email,full_name) VALUES($1,$2) RETURNING id',[tag.toLowerCase()+'@example.invalid',tag])).rows[0].id);
 await db.query("INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role,status,perfil_acesso_id) VALUES(2,$1,'member','active',$2)",[testUser,tag]);
 await db.query("SELECT set_config('app.erp_user_id',$1,true)",[String(testUser)]);
 await membership('member',tag);
 await check('Perfil sem permissões: 15 capacidades negadas e nenhuma leitura ERP',async()=>{await capabilityMatrix([]);await runtime(async()=>{for(const t of tables)assert.equal((await db.query(`SELECT EXISTS(SELECT 1 FROM erp.${t}) visible`)).rows[0].visible,false,t)})});
 await check('Matriz de 15 permissões isoladas sem elevação de acesso',async()=>{for(const c of caps){await db.query('DELETE FROM shared.permissoes_perfil WHERE perfil_acesso_id=$1',[tag]);await db.query('INSERT INTO shared.permissoes_perfil(perfil_acesso_id,capability) VALUES($1,$2)',[tag,c]);await capabilityMatrix([c]);assert.deepEqual(effectiveCapabilities('member',[c]),[c])}});
 await check('Perfil administrador não pode ser atribuído a viewer',async()=>{await db.query('SAVEPOINT qa_profile');await assert.rejects(()=>membership('viewer','administrador'),e=>e.code==='23514');await db.query('ROLLBACK TO SAVEPOINT qa_profile');await db.query('RELEASE SAVEPOINT qa_profile')});
 await db.query('DELETE FROM shared.permissoes_perfil WHERE perfil_acesso_id=$1',[tag]);
 await db.query('INSERT INTO shared.permissoes_perfil(perfil_acesso_id,capability) SELECT $1,c FROM unnest($2::text[]) c',[tag,caps]);
 await membership('viewer',tag);
 const reads=caps.filter(c=>c.endsWith('.visualizar'));
 await check('Consulta: mesmo com todas as permissões no perfil, viewer recebe somente leitura',async()=>{await capabilityMatrix(reads);assert.deepEqual(new Set(effectiveCapabilities('viewer',caps)),new Set(reads));await runtime(async()=>{for(const t of ['entidades','vendas','compras','contas_pagar','contas_receber','saldos_estoque'])await db.query(`SELECT empresa_id FROM erp.${t} LIMIT 1`)})});
 await check('Consulta: inclusão de produto bloqueada pelo banco',()=>runtime(()=>denied('INSERT INTO erp.produtos(empresa_id,nome,sku) VALUES(2,$1,$2)',[tag,tag])));
 await check('Consulta: alteração e exclusão de produto não alcançam registros',()=>runtime(async()=>{const p=(await db.query('SELECT id FROM erp.produtos LIMIT 1')).rows[0];assert(p);assert.equal((await db.query('UPDATE erp.produtos SET nome=nome WHERE id=$1 RETURNING id',[p.id])).rowCount,0);assert.equal((await db.query('DELETE FROM erp.produtos WHERE id=$1 RETURNING id',[p.id])).rowCount,0)}));
 await membership('member',tag);await db.query('DELETE FROM shared.permissoes_perfil WHERE perfil_acesso_id=$1',[tag]);await db.query("INSERT INTO shared.permissoes_perfil(perfil_acesso_id,capability) VALUES($1,'erp.cadastros.gerenciar')",[tag]);
 await check('Operador de cadastros: cria produto autorizado, sem acesso financeiro/vendas/compras',async()=>{await capabilityMatrix(['erp.cadastros.gerenciar']);await runtime(async()=>{const p=(await db.query('INSERT INTO erp.produtos(empresa_id,nome,sku) VALUES(2,$1,$2) RETURNING id',[tag,tag])).rows[0];assert(p.id);for(const t of ['vendas','compras','contas_pagar','contas_receber','saldos_estoque'])assert.equal((await db.query(`SELECT EXISTS(SELECT 1 FROM erp.${t}) visible`)).rows[0].visible,false,t);await denied('INSERT INTO erp.produtos(empresa_id,nome,sku) VALUES(1,$1,$2)',[tag,tag+'-foreign'])})});
 await db.query('UPDATE shared.usuarios_empresas SET suspenso_localmente=true WHERE empresa_id=2 AND usuario_id=$1',[testUser]);
 await check('Suspensão local bloqueia capacidades e registros',async()=>{await capabilityMatrix([]);await runtime(async()=>assert.equal((await db.query('SELECT count(*) n FROM erp.produtos')).rows[0].n,'0'))});
 await db.query("SELECT set_config('app.erp_user_id','999999999',true)");
 await check('Usuário sem vínculo: nenhuma leitura em todas as tabelas ERP',()=>runtime(async()=>{for(const t of tables)assert.equal((await db.query(`SELECT EXISTS(SELECT 1 FROM erp.${t}) visible`)).rows[0].visible,false,t)}));
}catch(e){console.error(JSON.stringify({failed:true,code:e.code,message:e.message}));process.exitCode=1}
finally{
 await db.query('ROLLBACK').catch(()=>{});
 if(before){const after=(await db.query('SELECT to_jsonb(m) data FROM shared.usuarios_empresas m WHERE empresa_id=2 AND usuario_id=3')).rows[0].data;assert.deepEqual(after,before);assert.equal((await db.query('SELECT count(*) n FROM shared.perfis_acesso WHERE id=$1',[tag])).rows[0].n,'0');assert.equal((await db.query('SELECT count(*) n FROM shared.usuarios WHERE email=$1',[tag.toLowerCase()+'@example.invalid'])).rows[0].n,'0');assert.equal((await db.query('SELECT count(*) n FROM erp.produtos WHERE sku=$1',[tag])).rows[0].n,'0');rolledBack=true}
 await db.end();mkdirSync('.cache/erp-access',{recursive:true});writeFileSync('.cache/erp-access/permissions-production.json',JSON.stringify({at:new Date().toISOString(),passed:!process.exitCode,checks,tables:tables?.length,rolledBack,visualOtherUserTested:false},null,2));console.log(JSON.stringify({passed:!process.exitCode,checks:checks.length,tables:tables?.length,rolledBack}));
}


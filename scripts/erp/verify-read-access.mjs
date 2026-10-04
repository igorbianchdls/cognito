import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {connection,root} from './evolution-db.mjs';

// Somente leitura: usa vinculos existentes, sem criar registros de teste.
const client=connection();
const checks=[];
try{
  await client.connect();await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const tables=(await client.query("SELECT tablename FROM pg_tables WHERE schemaname='erp' ORDER BY tablename")).rows.map(t=>t.tablename);
  assert.equal(tables.length,82);
  const membership=(await client.query(`SELECT m.tenant_id,m.user_id FROM shared.tenant_memberships m
    JOIN shared.tenants t ON t.id=m.tenant_id WHERE m.status='active' AND t.status='active' AND m.role IN ('owner','admin') ORDER BY m.tenant_id,m.user_id LIMIT 1`)).rows[0];
  assert(membership,'Nenhum owner/admin ativo para verificar compatibilidade');
  await client.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(membership.tenant_id),String(membership.user_id)]);
  assert.equal((await client.query('SELECT shared.is_tenant_member($1) allowed',[membership.tenant_id])).rows[0].allowed,true);
  await client.query('SET LOCAL ROLE erp_runtime');
  for(const table of tables){
    assert(/^[a-z_]+$/.test(table));
    await client.query(`SELECT EXISTS(SELECT 1 FROM erp.${table} WHERE tenant_id=$1 LIMIT 1) AS visible`,[membership.tenant_id]);
  }
  checks.push('82 consultas reais sob erp_runtime com empresa ativa');
  await client.query('SELECT tenant_id,id,cnpj FROM erp.fiscal_issuer_for_operations($1) WHERE tenant_id=$1 LIMIT 1',[membership.tenant_id]);
  checks.push('Projecao fiscal limitada executa no runtime real');
  await client.query('RESET ROLE');
  await client.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id','-1',true)",[String(membership.tenant_id)]);
  assert.equal((await client.query('SELECT shared.is_tenant_member($1) allowed',[membership.tenant_id])).rows[0].allowed,false);
  await client.query('SET LOCAL ROLE erp_runtime');
  for(const table of tables){
    const result=(await client.query(`SELECT EXISTS(SELECT 1 FROM erp.${table} WHERE tenant_id=$1 LIMIT 1) AS visible`,[membership.tenant_id])).rows[0];
    assert.equal(result.visible,false,table);
  }
  assert.equal((await client.query('SELECT * FROM erp.fiscal_issuer_for_operations($1) WHERE tenant_id=$1',[membership.tenant_id])).rows.length,0);
  checks.push('Identidade sem vinculo recebe zero registros nas 82 tabelas e na projecao fiscal');
  await client.query('ROLLBACK');
  const result={status:'verified',date:new Date().toISOString(),readOnly:true,businessRecordsChanged:false,checks};
  mkdirSync(new URL('.cache/erp-audit/read-access/',root),{recursive:true});
  writeFileSync(new URL('.cache/erp-audit/read-access/runtime-remote.json',root),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}catch(error){await client.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({status:'failed',code:error.code||error.name,completedChecks:checks.length}));process.exitCode=1;}
finally{await client.end().catch(()=>{});}

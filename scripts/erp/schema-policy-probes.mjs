import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Politicas/funcoes do catalogo atual, dados ficticios, sem acesso remoto.
const catalog=JSON.parse(readFileSync('.cache/erp-audit/catalog-20261003.json','utf8'));
const db=new PGlite();
try{
  await db.exec(`CREATE SCHEMA shared; CREATE SCHEMA erp; CREATE ROLE erp_runtime NOLOGIN NOBYPASSRLS;
    CREATE TABLE shared.users(id bigint PRIMARY KEY,auth_user_id uuid);
    CREATE TABLE shared.tenants(id bigint PRIMARY KEY,status text);
    CREATE TABLE shared.tenant_memberships(tenant_id bigint,user_id bigint,status text,role text,erp_profile_id text);
    CREATE TABLE shared.erp_profile_permissions(profile_id text,capability text);
    CREATE TABLE erp.contas_receber(id bigint PRIMARY KEY,tenant_id bigint NOT NULL);
    INSERT INTO shared.users VALUES(1,NULL);
    INSERT INTO shared.tenants VALUES(1,'active'),(2,'suspended');
    INSERT INTO shared.tenant_memberships VALUES(1,1,'active','viewer','consulta'),(2,1,'active','viewer','consulta');
    INSERT INTO erp.contas_receber VALUES(101,1),(201,2);
    GRANT USAGE ON SCHEMA erp TO erp_runtime;
    GRANT SELECT ON erp.contas_receber TO erp_runtime;
    ALTER TABLE erp.contas_receber ENABLE ROW LEVEL SECURITY;`);
  for(const table of ['tenants','tenant_memberships']) {
    const constraint=catalog.constraints.find(c=>c.schema==='shared'&&c.table_name===table&&c.type==='c'&&c.definition.includes('status'));
    await db.exec(`ALTER TABLE shared.${table} ADD ${constraint.definition}`);
  }
  for(const name of ['current_auth_user_id','current_user_id','is_tenant_member','has_erp_capability'])
    await db.exec(catalog.functions.find(f=>f.schema==='shared'&&f.name===name).definition);
  const policy=catalog.policies.find(p=>p.schemaname==='erp'&&p.tablename==='contas_receber'&&p.cmd==='SELECT');
  assert.equal(policy.qual,'shared.is_tenant_member(tenant_id)');
  await db.exec(`CREATE POLICY observed_read_policy ON erp.contas_receber FOR SELECT USING (${policy.qual});
    GRANT EXECUTE ON FUNCTION shared.current_user_id(),shared.is_tenant_member(bigint),shared.has_erp_capability(bigint,text) TO erp_runtime;`);
  const probes=[];
  for(const [tenant,companyState] of [[1,'active'],[2,'suspended']]){
    await db.exec('BEGIN');
    await db.query("SELECT set_config('app.erp_user_id','1',true),set_config('app.erp_tenant_id',$1,true)",[String(tenant)]);
    const capability=(await db.query("SELECT shared.has_erp_capability($1,'erp.financeiro.visualizar') AS allowed",[tenant])).rows[0].allowed;
    await db.exec('SET LOCAL ROLE erp_runtime');
    const rows=(await db.query('SELECT tenant_id FROM erp.contas_receber')).rows;
    assert.equal(capability,false);assert.equal(rows.length,1);assert.equal(Number(rows[0].tenant_id),tenant);
    probes.push({companyState,financialCapability:false,financialRowsVisible:rows.length});
    await db.exec('ROLLBACK');
  }
  // Controle: retirar o vinculo ativo bloqueia a leitura.
  await db.exec("UPDATE shared.tenant_memberships SET status='suspended'; BEGIN; SET LOCAL ROLE erp_runtime");
  await db.query("SELECT set_config('app.erp_user_id','1',true),set_config('app.erp_tenant_id','1',true)");
  assert.equal((await db.query('SELECT tenant_id FROM erp.contas_receber')).rows.length,0);
  await db.exec('ROLLBACK');
  const result={passed:true,localOnly:true,observedPolicyBehavior:probes,inactiveMembershipBlocksRead:true};
  writeFileSync('.cache/erp-audit/policy-probes-20261003.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}finally{await db.close();}

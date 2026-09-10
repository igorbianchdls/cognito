import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';

const root = new URL('../../', import.meta.url);
const project = 'mtadnxqoqxzbdksktwdr';
const version = '20260908180000';
const args = process.argv.slice(2);
const apply = args.includes('--apply');
assert(args.every(x => ['--apply','--check',`--project=${project}`].includes(x)), 'Argumentos invalidos.');
if (apply) assert(args.includes(`--project=${project}`), 'Identifique explicitamente o projeto.');
const env = dotenv.parse(readFileSync(new URL('.env.local',root)));
const url = new URL(env.SUPABASE_DB_URL);
assert.equal(url.username,`postgres.${project}`, 'Projeto inesperado na conexao.');
assert.equal(url.hostname,'aws-1-sa-east-1.pooler.supabase.com', 'Host inesperado.');
assert.equal(url.port,'5432', 'Usar Session Pooler.');
for (const k of ['sslmode','sslrootcert','sslcert','sslkey']) url.searchParams.delete(k);
const config = {
  connectionString:url.toString(),
  ssl:{ca:readFileSync(new URL('certificates/supabase-prod-ca-2021.crt',root),'utf8'),rejectUnauthorized:true},
  connectionTimeoutMillis:15000,statement_timeout:60000,
  application_name:'creatto_integrity_20260908',
};
const client = new pg.Client(config);
const peer = new pg.Client(config);
const folder = new URL(`docs/avaliacao-erp/aplicacao-${version}/`,root);
mkdirSync(folder,{recursive:true});
const targetTables = ['cadastros_eventos','vendas_eventos','ordens_servico_eventos','fechamentos_periodos',
  'vendas','compras','vendas_itens','compras_itens','vendas_recebimentos_previstos','compras_parcelas_previstas',
  'contas_receber','contas_pagar','contas_receber_parcelas','contas_pagar_parcelas','pagamentos',
  'transferencias_financeiras','transacoes_bancarias','rateios_financeiros'];
const files = ['01-integridade-historicos.sql','02-periodos-fechados.sql'];
const body = files.map(file => {
  const sql=readFileSync(new URL('scripts/erp/sql/'+file,root),'utf8');
  assert.equal((sql.match(/^BEGIN;\s*$/gm)||[]).length,1);
  assert(/COMMIT;\s*$/.test(sql));
  return sql.replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,'');
}).join('\n');
const digest=createHash('sha256').update(body).digest('hex');
const record=(name,data)=>writeFileSync(new URL(name,folder),JSON.stringify(data,null,2)+'\n');
const queries = {
  columns:`SELECT table_schema,table_name,column_name,data_type,udt_name,is_nullable,column_default,numeric_precision,numeric_scale,is_identity,is_generated FROM information_schema.columns WHERE table_schema IN ('erp','shared') ORDER BY table_schema,table_name,ordinal_position`,
  constraints:`SELECT n.nspname AS schema,t.relname AS table_name,c.conname AS name,c.contype AS type,c.convalidated AS validated,pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname IN ('erp','shared') ORDER BY 1,2,3`,
  indexes:`SELECT * FROM pg_indexes WHERE schemaname IN ('erp','shared') ORDER BY schemaname,tablename,indexname`,
  policies:`SELECT * FROM pg_policies WHERE schemaname IN ('erp','shared') ORDER BY schemaname,tablename,policyname`,
  triggers:`SELECT n.nspname AS schema,c.relname AS table_name,t.tgname AS name,t.tgenabled,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('erp','shared') AND NOT t.tgisinternal ORDER BY 1,2,3`,
  functions:`SELECT n.nspname AS schema,p.proname AS name,p.prosecdef,p.proconfig,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('erp','shared') AND p.prokind='f' ORDER BY 1,2`,
  grants:`SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema IN ('erp','shared') AND grantee IN ('anon','authenticated','erp_runtime','PUBLIC') ORDER BY 1,2,3,4`,
  rls:`SELECT n.nspname AS schema,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relkind,c.reloptions FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('erp','shared') AND c.relkind IN ('r','p','v') ORDER BY 1,2`,
  views:`SELECT * FROM pg_views WHERE schemaname IN ('erp','shared') ORDER BY schemaname,viewname`,
};
async function catalog() {
  const result={date:new Date().toISOString()};
  for (const [key,sql] of Object.entries(queries)) result[key]=(await client.query(sql)).rows;
  return result;
}
function scoped(rows) { return rows.filter(x=>(x.schema||x.schemaname||x.table_schema)==='erp' && targetTables.includes(x.table_name||x.tablename||x.relname)); }
function verify(c,before) {
  assert.equal(c.rls.filter(x=>x.schema==='erp'&&x.relkind==='r').length,68);
  assert.deepEqual(c.views,before.views,'Views alteradas.');
  assert.equal(scoped(c.rls).filter(x=>!x.relrowsecurity).length,0);
  assert(c.constraints.find(x=>x.name==='transacoes_bancarias_importacao_fk').definition.endsWith('ON DELETE RESTRICT'));
  assert(c.indexes.some(x=>x.indexname==='fechamentos_periodos_ativo_idx'));
  assert(!c.indexes.some(x=>x.indexname==='fechamentos_periodos_ativo_unico_idx'));
  for (const table of ['cadastros_eventos','vendas_eventos']) assert(c.policies.some(x=>x.tablename===table&&x.policyname===table+'_runtime_insert'&&x.cmd==='INSERT'));
  assert(c.triggers.some(x=>x.table_name==='ordens_servico_eventos'&&x.name==='bloquear_mutacao_evento'));
  assert.equal(c.triggers.filter(x=>x.name==='validar_periodo_comercial_financeiro').length,14);
  assert(c.triggers.some(x=>x.name==='preservar_fechamento_comercial_financeiro'));
  assert(c.columns.some(x=>x.table_schema==='erp'&&x.table_name==='fechamentos_periodos'&&x.column_name==='motivo_reabertura'));
  for (const key of ['columns','constraints','indexes','policies','triggers','grants','rls']) {
    const outside = rows => rows.filter(x=>!((x.schema||x.schemaname||x.table_schema)==='erp'&&targetTables.includes(x.table_name||x.tablename||x.relname)));
    assert.deepEqual(outside(c[key]),outside(before[key]),`Objeto fora do escopo alterado: ${key}`);
  }
}

// Exerce o protocolo de concorrencia em duas sessoes, sem dados comerciais.
async function lockChecks(useHelper) {
  const id='-903481278611';
  const hash=(await client.query('SELECT hashint8($1::bigint) AS key',[id])).rows[0].key;
  assert.equal((await client.query('SELECT count(*)::int n FROM shared.tenants WHERE hashint8(id)=$1',[hash])).rows[0].n,0,'Chave de teste colide com empresa real.');
  const acquire=async (conn,exclusive)=> {
    if (useHelper) return conn.query('SELECT erp.travar_periodo_empresa($1,$2)',[id,exclusive]);
    const fn=exclusive?'pg_try_advisory_xact_lock':'pg_try_advisory_xact_lock_shared';
    return conn.query(`SELECT ${fn}(172942,$1) ok`,[hash]);
  };
  const start=async conn=>conn.query('BEGIN ISOLATION LEVEL READ COMMITTED READ ONLY');
  const end=async conn=>conn.query('ROLLBACK');
  try {
    await start(client); await start(peer);
    const first=await acquire(client,false),second=await acquire(peer,false);
    if (!useHelper) assert(first.rows[0].ok&&second.rows[0].ok);
    if (useHelper) await assert.rejects(acquire(peer,true),e=>e.code==='40001');
    else assert.equal((await acquire(peer,true)).rows[0].ok,false);
    await end(peer);await end(client);
    await start(client);await start(peer);
    const closed=await acquire(client,true);if(!useHelper)assert(closed.rows[0].ok);
    if (useHelper) await assert.rejects(acquire(peer,false),e=>e.code==='40001');
    else assert.equal((await acquire(peer,false)).rows[0].ok,false);
    await end(peer);await end(client);
    await start(peer);
    const released=await acquire(peer,true);if(!useHelper)assert(released.rows[0].ok);
    await end(peer);
    return {sharedCompatible:true,closeBlockedByOperation:true,operationBlockedByClose:true,releasedAtRollback:true};
  } finally {await end(peer).catch(()=>{});await end(client).catch(()=>{});}
}

let committed=false;
try {
  await client.connect(); await peer.connect();
  await client.query('BEGIN READ ONLY');
  const before=await catalog();
  const identity=(await client.query('SELECT current_database() AS database,current_user AS role,version() AS engine')).rows[0];
  const ledgerColumns=(await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='supabase_migrations' AND table_name='schema_migrations'")).rows.map(x=>x.column_name);
  assert(['version','statements','name'].every(x=>ledgerColumns.includes(x)),'Historico de migracoes inesperado.');
  const existing=(await client.query('SELECT version,name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0];
  const risk=(await client.query(`SELECT
    (SELECT count(*)::int FROM erp.fechamentos_periodos WHERE reaberto_em IS NULL AND modulo<>'estoque') AS active_closures,
    (SELECT count(*)::int FROM erp.fechamentos_periodos WHERE reaberto_em IS NOT NULL) AS historic_reopenings,
    (SELECT count(*)::int FROM erp.contas_receber_parcelas i WHERE i.excluido_em IS NULL AND i.valor_pago<>
      (SELECT COALESCE(sum(p.valor),0) FROM erp.pagamentos p WHERE p.tenant_id=i.tenant_id AND p.conta_receber_parcela_id=i.id AND p.excluido_em IS NULL AND p.estornado_em IS NULL AND p.estorno_de_pagamento_id IS NULL)) AS receivable_summary_differences,
    (SELECT count(*)::int FROM erp.contas_pagar_parcelas i WHERE i.excluido_em IS NULL AND i.valor_pago<>
      (SELECT COALESCE(sum(p.valor),0) FROM erp.pagamentos p WHERE p.tenant_id=i.tenant_id AND p.conta_pagar_parcela_id=i.id AND p.excluido_em IS NULL AND p.estornado_em IS NULL AND p.estorno_de_pagamento_id IS NULL)) AS payable_summary_differences`)).rows[0];
  await client.query('ROLLBACK');
  if (existing) {
    assert.equal(existing.statements?.[0],body,'Versao ja usada para outro SQL.');
    const previous=JSON.parse(readFileSync(new URL('before.json',folder),'utf8'));
    verify(before,previous);
    console.log(JSON.stringify({status:'already_applied',project,version,digest}));
  } else {
    const baseline=JSON.parse(readFileSync(new URL('docs/avaliacao-erp/catalogo-revisao-tabelas.json',root),'utf8'));
    const drift=[];
    for (const key of Object.keys(queries)) {
      const a=['functions','views'].includes(key)?before[key]:scoped(before[key]);
      const b=['functions','views'].includes(key)?baseline[key]:scoped(baseline[key]);
      if(JSON.stringify(a)!==JSON.stringify(b))drift.push(key);
    }
    const locks=await lockChecks(false);
    record('preflight.json',{date:new Date().toISOString(),project,version,digest,identity,drift,risk,locks});
    if (!existsSync(new URL('before.json',folder))) record('before.json',before);
    else if (apply) {
      const saved=JSON.parse(readFileSync(new URL('before.json',folder),'utf8'));
      for(const key of Object.keys(queries))assert.deepEqual(before[key],saved[key],'Catalogo mudou desde a copia de seguranca: '+key);
    }
    console.log(JSON.stringify({mode:apply?'apply':'check',project,version,digest,drift,risk,locks}));
    if (apply) {
      assert.equal(drift.length,0,'Catalogo alterado; revisar antes de aplicar.');
      assert.equal(risk.receivable_summary_differences+risk.payable_summary_differences,0,'Resumos existentes exigem compatibilidade antes de aplicar.');
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
      try {
        assert((await client.query('SELECT pg_try_advisory_xact_lock(172942,20260908) AS ok')).rows[0].ok,'Outra aplicacao em andamento.');
        await client.query(body);
        verify(await catalog(),before);
        await client.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,'improve_erp_integrity_and_periods',[body]]);
        await client.query('COMMIT');committed=true;
      } catch(e) { await client.query('ROLLBACK').catch(()=>{});throw e; }
      const after=await catalog();verify(after,before);record('after.json',after);
      const validatedLocks=await lockChecks(true);
      const result={status:'applied_and_verified',date:new Date().toISOString(),project,version,digest,changedTables:18,newTables:0,erpTables:68,erpViews:6,liveConcurrency:validatedLocks};
      record('result.json',result);
      writeFileSync(new URL('executed.sql',folder),'-- Aplicado atomicamente; sem credenciais.\nBEGIN;\n'+body+'\nCOMMIT;\n');
      console.log(JSON.stringify(result));
    }
  }
} catch(error) {
  const result={status:committed?'committed_verification_pending':'not_applied_or_rolled_back',code:error.code||error.name,message:String(error.message).slice(0,900)};
  record('last-error.json',result);console.error(JSON.stringify(result));process.exitCode=1;
} finally {
  await client.end().catch(()=>{});await peer.end().catch(()=>{});
}

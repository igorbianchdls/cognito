import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { connection, project } from '../erp/evolution-db.mjs'

const args = process.argv.slice(2), apply = args.includes('--apply')
assert(args.every(a => ['--check', '--apply'].includes(a)), 'Use --check or --apply')
const filename = '20261016120000_create_tables.sql', version = filename.slice(0, 14), name = filename.slice(15, -4)
const sql = readFileSync('supabase/migrations/' + filename, 'utf8'), digest = createHash('sha256').update(sql).digest('hex')
const body = sql.replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, '')
const db = connection()
let committed = false
try {
  await db.connect()
  await db.query(apply ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  const existing = (await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1', [version])).rows[0]
  const before = (await db.query("SELECT schemaname,count(*)::int tabelas FROM pg_tables WHERE schemaname IN ('erp','shared','plugin') GROUP BY schemaname ORDER BY schemaname")).rows
  if (existing) {
    assert.equal(existing.name, name); assert.deepEqual(existing.statements, [body], 'Applied migration differs from local source')
    assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='tables'")).rows[0].n, 14)
    const member = (await db.query("SELECT m.empresa_id,m.usuario_id FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=m.empresa_id WHERE m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active' ORDER BY m.empresa_id,m.usuario_id LIMIT 1")).rows[0]
    let runtimeRead = false
    if (member) {
      await db.query("SELECT set_config('app.tables_empresa_id',$1,true),set_config('app.tables_usuario_id',$2,true),set_config('role','tables_runtime',true)", [String(member.empresa_id), String(member.usuario_id)])
      assert.equal((await db.query('SELECT tables.membro_ativo() ok')).rows[0].ok, true)
      await db.query('SELECT count(*) FROM tables.bases')
      await db.query('SELECT * FROM tables.membros() LIMIT 1')
      runtimeRead = true
    }
    await db.query('ROLLBACK'); console.log(JSON.stringify({ status: 'already_applied', project, version, tables: 14, runtimeReadVerified: runtimeRead }));
  } else {
    assert.equal((await db.query("SELECT to_regnamespace('tables') IS NULL ausente")).rows[0].ausente, true, 'A Tables schema already exists without this migration')
    const expected = ['empresas:id','empresas:status','usuarios:id','usuarios:full_name','usuarios:email','usuarios:status','usuarios_empresas:empresa_id','usuarios_empresas:usuario_id','usuarios_empresas:role','usuarios_empresas:status','usuarios_empresas:suspenso_localmente']
    const columns = (await db.query("SELECT table_name||':'||column_name chave FROM information_schema.columns WHERE table_schema='shared'")).rows.map(r => r.chave)
    assert(expected.every(c => columns.includes(c)), 'Shared identity schema differs from expected contract')
    const role = (await db.query("SELECT rolsuper,rolbypassrls,rolcanlogin FROM pg_roles WHERE rolname='tables_runtime'")).rows[0]
    assert(!role || !role.rolsuper && !role.rolbypassrls && !role.rolcanlogin, 'Existing runtime role is not restricted')
    if (!apply) {
      await db.query('ROLLBACK'); console.log(JSON.stringify({ status: 'preflight_passed', project, version, migrationDigest: digest, existingSchemas: before }))
    } else {
      const proof = JSON.parse(readFileSync('.cache/tables/smoke.json', 'utf8'))
      assert.equal(proof.status, 'passed'); assert.equal(proof.migrationDigest, digest, 'Run isolated smoke tests for this exact migration')
      await db.query("SET LOCAL lock_timeout='10s'")
      assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(73016,20261016) ok')).rows[0].ok, true)
      await db.query(body)
      assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='tables'")).rows[0].n, 14)
      assert.equal((await db.query("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='tables' AND c.relkind='r' AND c.relrowsecurity")).rows[0].n, 14)
      const after = (await db.query("SELECT schemaname,count(*)::int tabelas FROM pg_tables WHERE schemaname IN ('erp','shared','plugin') GROUP BY schemaname ORDER BY schemaname")).rows
      assert.deepEqual(after, before, 'Existing schema table counts changed')
      assert.equal((await db.query("SELECT public FROM storage.buckets WHERE id='tables-anexos'")).rows[0]?.public, false)
      await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)', [version, name, [body]])
      await db.query('COMMIT'); committed = true
      mkdirSync('.cache/tables', { recursive: true })
      const report = { status: 'applied', project, version, migrationDigest: digest, tables: 14, rlsTables: 14, privateBucket: 'tables-anexos', existingSchemaTableCountsPreserved: true, existingSchemas: after }
      writeFileSync('.cache/tables/database.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
    }
  }
} catch (error) {
  if (!committed) await db.query('ROLLBACK').catch(() => {})
  console.error(JSON.stringify({ status: committed ? 'committed_needs_attention' : 'rolled_back', code: error.code ?? error.name, message: error instanceof assert.AssertionError ? error.message : 'Database operation could not be completed; credentials omitted.' })); process.exitCode = 1
} finally { await db.end() }

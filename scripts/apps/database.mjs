import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { connection, project } from '../erp/evolution-db.mjs'

const file = '20261017100000_apps_product.sql', sql = readFileSync('supabase/migrations/' + file, 'utf8'), body = sql.replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, ''), version = file.slice(0, 14), name = file.slice(15, -4), digest = createHash('sha256').update(sql).digest('hex')
const mode = process.argv[2] ?? '--check', db = connection()
assert(['--check', '--apply'].includes(mode))
try {
  await db.connect(); await db.query('BEGIN'); await db.query("SET LOCAL lock_timeout='10s'")
  assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(73017,10000) ok')).rows[0].ok, true)
  const applied = (await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1', [version])).rows[0]
  if (applied) { assert.equal(applied.name, name); assert.deepEqual(applied.statements, [body]); await db.query('ROLLBACK'); console.log(JSON.stringify({ status: 'already_applied', project, version, digest })) }
  else {
    assert.equal((await db.query("SELECT to_regnamespace('apps') IS NULL ausente")).rows[0].ausente, true)
    const before = (await db.query("SELECT schemaname,count(*)::int n FROM pg_tables WHERE schemaname IN ('shared','erp','tables','whatsapp','plugin') GROUP BY schemaname ORDER BY schemaname")).rows
    await db.query(body)
    assert.equal((await db.query("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='apps' AND c.relkind='r' AND c.relrowsecurity AND c.relforcerowsecurity")).rows[0].n, 9)
    assert.equal((await db.query("SELECT public FROM storage.buckets WHERE id='apps-files'")).rows[0].public, false)
    assert.deepEqual((await db.query("SELECT schemaname,count(*)::int n FROM pg_tables WHERE schemaname IN ('shared','erp','tables','whatsapp','plugin') GROUP BY schemaname ORDER BY schemaname")).rows, before)
    if (mode === '--apply') {
      const proof = JSON.parse(readFileSync('.cache/apps/smoke.json', 'utf8')); assert.equal(proof.status, 'passed'); assert.equal(proof.migrationDigest, digest)
      await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)', [version, name, [body]]); await db.query('COMMIT')
    } else await db.query('ROLLBACK')
    const report = { status: mode === '--apply' ? 'applied' : 'preflight_passed', project, version, digest, tables: 9, privateBucket: 'apps-files', generatedAt: new Date().toISOString() }
    mkdirSync('.cache/apps', { recursive: true }); writeFileSync('.cache/apps/database' + (mode === '--check' ? '-check' : '') + '.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
  }
} catch (e) { await db.query('ROLLBACK').catch(() => undefined); console.error(JSON.stringify({ status: 'failed', code: e.code ?? e.name, message: e instanceof assert.AssertionError ? e.message : 'Database validation failed; credentials omitted.' })); process.exitCode = 1 }
finally { await db.end() }

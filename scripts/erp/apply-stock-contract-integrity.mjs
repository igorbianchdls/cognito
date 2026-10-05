import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { connection, root, project } from './evolution-db.mjs'
import { catalog } from './evolution-catalog.mjs'

const apply = process.argv.includes('--apply')
assert(process.argv.slice(2).every(arg => ['--check', '--apply', '--project=' + project].includes(arg)))
if (apply) assert(process.argv.includes('--project=' + project), 'Specify the verified project')
const folder = new URL('.cache/erp-audit/stock-application/', root)
mkdirSync(folder, { recursive: true })
const hash = value => createHash('sha256').update(value).digest('hex')
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'))
const proof = read('.cache/erp-audit/stock-regression.json')
assert.equal(proof.status, 'passed'); assert(proof.scenarios.length >= 22)
const restore = read('.cache/database-backups/restore-proof.json')
assert.equal(restore.status, 'passed'); assert.equal(restore.project, project)
assert.equal(hash(readFileSync(new URL('.cache/database-backups/' + restore.backup, root))), restore.digest)
const migrations = ['20261005020000_harden_erp_stock_operations.sql', '20261005021000_anchor_contract_cycles.sql'].map(file => {
  const sql = readFileSync(new URL('supabase/migrations/' + file, root), 'utf8')
  assert.equal(hash(sql), proof.digests[file], 'Test the exact migration before applying: ' + file)
  return { file, version: file.slice(0, 14), name: file.slice(15, -4), digest: hash(sql), body: sql.replace(/^BEGIN;\s*$/m, '').replace(/COMMIT;\s*$/, '') }
})
const ident = name => '"' + name.replaceAll('"', '""') + '"'
async function fingerprints(client, structure) {
  const result = {}
  for (const table of structure.rls.filter(row => row.relkind === 'r')) {
    const columns = structure.columns.filter(row => row.table_schema === table.schema && row.table_name === table.relname).map(row => row.column_name)
    const rows = (await client.query(`SELECT ${columns.map(column => `${ident(column)}::text AS ${ident(column)}`).join(',')} FROM ${ident(table.schema)}.${ident(table.relname)}`)).rows
    result[`${table.schema}.${table.relname}`] = hash(JSON.stringify(rows.map(row => JSON.stringify(row)).sort()))
  }
  return result
}
async function verifyStock(client) {
  const invalid = (await client.query(`SELECT count(*)::int AS total FROM erp.saldos_estoque s
    JOIN erp.produtos p ON p.tenant_id=s.tenant_id AND p.id=s.produto_id
    WHERE s.quantidade_fisica <> coalesce((SELECT sum(m.quantidade) FROM erp.movimentacoes_estoque m WHERE m.tenant_id=s.tenant_id AND m.produto_id=s.produto_id AND m.local_estoque_id=s.local_estoque_id),0)
    OR s.quantidade_reservada <> coalesce((SELECT sum(r.quantidade-r.quantidade_atendida) FROM erp.reservas_estoque r WHERE r.tenant_id=s.tenant_id AND r.produto_id=s.produto_id AND r.local_estoque_id=s.local_estoque_id AND r.status='ativa'),0)
    OR (NOT p.permite_estoque_negativo AND s.quantidade_fisica<s.quantidade_reservada)
    OR s.custo_medio::text IN ('NaN','Infinity','-Infinity')`)).rows[0].total
  assert.equal(invalid, 0, 'Resolve stock inconsistencies before applying constraints')
}
const client = connection()
let committed = false
try {
  await client.connect()
  await client.query(apply ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  await client.query("SET LOCAL lock_timeout='10s'")
  const before = await catalog(client)
  await verifyStock(client)
  const ledger = (await client.query('SELECT version,name,statements FROM supabase_migrations.schema_migrations WHERE version=ANY($1::text[])', [migrations.map(item => item.version)])).rows
  for (const entry of ledger) { const migration = migrations.find(item => item.version === entry.version); assert.equal(entry.name, migration.name); assert.deepEqual(entry.statements, [migration.body]) }
  if (!apply) {
    await client.query('ROLLBACK')
    console.log(JSON.stringify({ status: 'preflight_passed', applied: ledger.length, migrations: migrations.map(({ version, digest }) => ({ version, digest })), isolatedRestorePassed: true }))
  } else {
    assert.equal((await client.query('SELECT pg_try_advisory_xact_lock(172942,2026100502) AS ok')).rows[0].ok, true)
    const tables = before.rls.filter(row => row.relkind === 'r').map(row => `${ident(row.schema)}.${ident(row.relname)}`)
    await client.query(`LOCK TABLE ${tables.join(',')} IN SHARE MODE`)
    const baseline = await fingerprints(client, before)
    const backup = 'before-' + new Date().toISOString().replaceAll(':', '-') + '.json'
    writeFileSync(new URL(backup, folder), JSON.stringify(before, null, 2), { flag: 'wx' })
    for (const migration of migrations.filter(item => !ledger.some(entry => entry.version === item.version))) {
      await client.query(migration.body)
      await client.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)', [migration.version, migration.name, [migration.body]])
    }
    assert.deepEqual(await fingerprints(client, before), baseline, 'Business records changed during migration')
    await verifyStock(client)
    const after = await catalog(client)
    const journal = after.rls.find(row => row.schema === 'erp' && row.relname === 'operacoes_estoque')
    assert(journal?.relrowsecurity)
    assert(after.constraints.every(row => row.validated))
    for (const functionName of ['validar_saldo_estoque_final', 'validar_kit_simples', 'validar_ativacao_kit_simples']) {
      const permissions = (await client.query(`SELECT p.prosecdef,p.proconfig,EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') public_execute FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='erp' AND p.proname=$1`, [functionName])).rows[0]
      assert(permissions?.prosecdef && !permissions.public_execute && permissions.proconfig.includes('search_path=pg_catalog'))
    }
    for (const viewName of ['vw_posicao_estoque', 'vw_giro_estoque']) assert(after.rls.find(row => row.relname === viewName)?.reloptions.includes('security_invoker=true'))
    await client.query('COMMIT'); committed = true
    const report = { status: 'applied_and_verified', createdAt: new Date().toISOString(), project, migrations: migrations.map(({ version, digest }) => ({ version, digest })), backup, preservedTables: Object.keys(baseline).length, businessDataChanges: 0, isolatedRestorePassed: true }
    writeFileSync(new URL('application.json', folder), JSON.stringify(report, null, 2))
    console.log(JSON.stringify(report))
  }
} catch (error) {
  if (!committed) await client.query('ROLLBACK').catch(() => undefined)
  console.error(JSON.stringify({ status: committed ? 'committed_report_failure' : 'rolled_back', code: error.code, message: String(error.message).slice(0, 300) }))
  process.exitCode = 1
} finally { await client.end() }

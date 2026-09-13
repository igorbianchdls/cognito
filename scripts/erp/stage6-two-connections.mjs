import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { Client } from 'pg'

const connectionString = String(process.env.ERP_STAGE6_DATABASE_URL || '').trim()
assert(connectionString, 'Defina ERP_STAGE6_DATABASE_URL para um PostgreSQL exclusivo de teste.')
const url = new URL(connectionString)
const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
const remoteAllowed = process.env.ERP_STAGE6_ALLOW_REMOTE_TEST_DATABASE === 'true'
assert(local || remoteAllowed, 'A suíte recusa banco remoto sem ERP_STAGE6_ALLOW_REMOTE_TEST_DATABASE=true.')
assert(/(?:test|stage6|homolog|staging)/i.test(url.pathname), 'O nome do banco precisa indicar test, stage6, homolog ou staging.')

const left = new Client({ connectionString })
const right = new Client({ connectionString })
const schema = `stage6_${process.pid}_${Date.now()}`
const key = randomUUID()
const checks = []

try {
  await Promise.all([left.connect(), right.connect()])
  const [leftPid, rightPid] = await Promise.all([
    left.query('SELECT pg_backend_pid() pid'),
    right.query('SELECT pg_backend_pid() pid'),
  ])
  assert.notEqual(leftPid.rows[0].pid, rightPid.rows[0].pid)
  checks.push('duas sessões PostgreSQL independentes')

  await left.query(`CREATE SCHEMA ${schema}; CREATE TABLE ${schema}.operations(
    tenant_id bigint NOT NULL, operation_key uuid NOT NULL, amount numeric(14,2) NOT NULL,
    PRIMARY KEY(tenant_id, operation_key)); ALTER TABLE ${schema}.operations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY tenant_scope ON ${schema}.operations USING (tenant_id=current_setting('app.stage6_tenant',true)::bigint)
    WITH CHECK (tenant_id=current_setting('app.stage6_tenant',true)::bigint);`)

  await left.query('BEGIN')
  await left.query(`INSERT INTO ${schema}.operations VALUES(1,$1,10)`, [key])
  const competing = right.query(`INSERT INTO ${schema}.operations VALUES(1,$1,10)`, [key]).then(() => null, error => error)
  await left.query('COMMIT')
  const conflict = await competing
  assert.equal(conflict?.code, '23505')
  assert.equal((await left.query(`SELECT count(*)::int total FROM ${schema}.operations WHERE operation_key=$1`, [key])).rows[0].total, 1)
  checks.push('chave repetida produz um único efeito')

  await left.query(`ALTER TABLE ${schema}.operations FORCE ROW LEVEL SECURITY`)
  await left.query(`CREATE ROLE ${schema}_reader NOLOGIN`)
  await left.query(`GRANT USAGE ON SCHEMA ${schema} TO ${schema}_reader; GRANT SELECT,INSERT ON ${schema}.operations TO ${schema}_reader`)
  await Promise.all([left.query('BEGIN'), right.query('BEGIN')])
  await Promise.all([
    left.query(`SET LOCAL ROLE ${schema}_reader; SELECT set_config('app.stage6_tenant','1',true)`),
    right.query(`SET LOCAL ROLE ${schema}_reader; SELECT set_config('app.stage6_tenant','2',true)`),
  ])
  assert.equal((await left.query(`SELECT count(*)::int total FROM ${schema}.operations`)).rows[0].total, 1)
  assert.equal((await right.query(`SELECT count(*)::int total FROM ${schema}.operations`)).rows[0].total, 0)
  checks.push('contextos simultâneos não misturam empresas')

  console.log(JSON.stringify({ status: 'passed', checks: checks.length, names: checks, independentConnections: true }))
} finally {
  await left.query('ROLLBACK').catch(() => undefined)
  await right.query('ROLLBACK').catch(() => undefined)
  await left.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(() => undefined)
  await left.query(`DROP ROLE IF EXISTS ${schema}_reader`).catch(() => undefined)
  await Promise.allSettled([left.end(), right.end()])
}

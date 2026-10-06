import assert from 'node:assert/strict'
import { config } from 'dotenv'
import { buildPostgresPoolConfig } from '../../src/lib/postgres'
import { normalizeErpError } from '../../src/products/erp/shared/erpErrors'

config({ path: '.env.local', quiet: true })
assert(process.env.SUPABASE_DB_URL)
const pool = buildPostgresPoolConfig(process.env.SUPABASE_DB_URL)
assert.equal(new URL(pool.connectionString).port, '6543')
assert.equal(pool.max, 2)
assert.equal(pool.connectionTimeoutMillis, 15000)
assert.equal(pool.idleTimeoutMillis, 5000)
assert.equal(pool.ssl?.rejectUnauthorized, true)
assert(pool.ssl?.ca.includes('BEGIN CERTIFICATE'))
for (const error of [
  { code: 'XX000', message: '(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15' },
  { code: '53300', message: 'too many connections' },
]) {
  const normalized = normalizeErpError(error)
  assert.equal(normalized.status, 503)
  assert.equal(normalized.code, 'DATABASE_BUSY')
  assert.equal(normalized.recovery, 'refresh')
  assert(!normalized.message.includes('pool_size'))
}
assert.equal(normalizeErpError({ code: 'XX000', message: 'unrelated internal error' }).status, 500)
assert.equal(normalizeErpError({ code: '42501' }).status, 403)
console.log(JSON.stringify({ status: 'passed', transactionPort: 6543, maxConnectionsPerInstance: pool.max, tlsVerified: true, busyErrors: 503 }))

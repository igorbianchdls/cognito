import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { Pool } from 'pg'

import { getErpDatabaseContext } from '@/lib/erpDatabaseContext'
export type SQLClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
  release: () => void
}

let pool: InstanceType<typeof Pool> | null = null;

export type PostgresPoolConfig = {
  connectionString: string
  max: number
  ssl?: { ca: string; rejectUnauthorized: boolean }
}

export function assertErpTenantScopedQuery(sql: string, params?: unknown[]) {
  if (!/\berp\.[a-z_][a-z0-9_]*/i.test(sql)) return
  const tenantId = Number(params?.[0] || 0)
  if (!Number.isInteger(tenantId) || tenantId <= 0 || !/\btenant_id\b/i.test(sql) || !/\$1\b/.test(sql)) {
    throw new Error('Consulta ERP sem escopo de tenant explicito.')
  }
  const context = getErpDatabaseContext()
  if (!context && process.env.ERP_ALLOW_PRIVILEGED_DB_CONTEXT !== 'true') {
    throw new Error('Consulta ERP sem contexto autenticado de tenant.')
  }
  if (context && context.tenantId !== tenantId) {
    throw new Error('Consulta ERP tentou acessar um tenant diferente do contexto autenticado.')
  }
}

function isLocalDatabase(hostname: string) {
  return ['localhost', '127.0.0.1', '::1'].includes(hostname)
}

export function buildPostgresPoolConfig(connectionString: string): PostgresPoolConfig {
  const url = new URL(connectionString)
  if (isLocalDatabase(url.hostname)) return { connectionString, max: 5 }

  const certificatePath = process.env.SUPABASE_DB_CA_FILE
    ? resolve(process.env.SUPABASE_DB_CA_FILE)
    : resolve(process.cwd(), 'certificates', 'supabase-prod-ca-2021.crt')
  const certificate = process.env.SUPABASE_DB_CA?.replaceAll('\\n', '\n')
    || (existsSync(certificatePath) ? readFileSync(certificatePath, 'utf8') : '')
  if (!certificate) {
    throw new Error('Certificado CA do Supabase nao configurado. Defina SUPABASE_DB_CA ou SUPABASE_DB_CA_FILE.')
  }

  for (const key of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) url.searchParams.delete(key)
  return {
    connectionString: url.toString(),
    max: 5,
    ssl: { ca: certificate, rejectUnauthorized: true },
  }
}

function getPool() {
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error('SUPABASE_DB_URL não está configurada');
  }

  if (!pool) {
    pool = new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL))
  }

  return pool;
}

export async function runQuery<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  assertErpTenantScopedQuery(sql, params)
  const client = await getPool().connect();
  try {
    const context = getErpDatabaseContext()
    if (/\berp\.[a-z_][a-z0-9_]*/i.test(sql) && context) {
      await client.query('BEGIN')
      try {
        await applyErpRuntimeContext(client, context)
        const result = await client.query(sql, params)
        await client.query('COMMIT')
        return result.rows as T[]
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined)
        throw error
      }
    }
    const result = await client.query(sql, params)
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function withTransaction<T>(fn: (client: SQLClient) => Promise<T>): Promise<T> {
  const rawClient = await getPool().connect();
  const client: SQLClient = {
    async query(sql, params) {
      assertErpTenantScopedQuery(sql, params)
      const context = getErpDatabaseContext()
      if (/\berp\.[a-z_][a-z0-9_]*/i.test(sql) && context) {
        await applyErpRuntimeContext(rawClient, context)
        try {
          return await rawClient.query(sql, params) as { rows: Record<string, unknown>[] }
        } finally {
          await rawClient.query('RESET ROLE').catch(() => undefined)
        }
      }
      return rawClient.query(sql, params) as Promise<{ rows: Record<string, unknown>[] }>
    },
    release: () => rawClient.release(),
  }
  try {
    await client.query('BEGIN');
    try {
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      throw err;
    }
  } finally {
    client.release();
  }
}

async function applyErpRuntimeContext(
  client: Pick<SQLClient, 'query'>,
  context: { tenantId: number; userId: number },
) {
  await client.query('SET LOCAL ROLE erp_runtime')
  await client.query(
    `SELECT set_config('app.erp_tenant_id', $1, true), set_config('app.erp_user_id', $2, true)`,
    [String(context.tenantId), String(context.userId)],
  )
}

function assertSafeIdentifier(identifier: string, label: string) {
  if (!/^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/i.test(identifier)) {
    throw new Error(`${label} inválido: ${identifier}`)
  }
}

export async function alignTableIdSequenceWithClient(
  client: Pick<SQLClient, 'query'>,
  table: string,
  column = 'id'
): Promise<void> {
  assertSafeIdentifier(table, 'table')
  assertSafeIdentifier(column, 'column')

  const seqRes = await client.query(
    `SELECT pg_get_serial_sequence($1, $2) AS seq`,
    [table, column]
  )
  const seq = String(seqRes.rows?.[0]?.seq || '')
  if (!seq) return

  const maxRes = await client.query(
    `SELECT COALESCE(MAX(${column}), 0)::bigint AS max_id FROM ${table}`
  )
  const maxId = Number(maxRes.rows?.[0]?.max_id || 0)
  await client.query(`SELECT setval($1, $2, true)`, [seq, Math.max(1, maxId)])
}

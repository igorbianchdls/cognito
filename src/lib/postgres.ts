import { Pool } from 'pg';
export type SQLClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
  release: () => void
}

let pool: InstanceType<typeof Pool> | null = null;

function getPool() {
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error('SUPABASE_DB_URL não está configurada');
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      max: 5,
    });
  }

  return pool;
}

export async function runQuery<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(sql, params);
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
  const client = (await getPool().connect()) as unknown as SQLClient;
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

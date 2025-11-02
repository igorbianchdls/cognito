import { Pool } from 'pg';
type PoolClient = import('pg').PoolClient;

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

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
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

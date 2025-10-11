import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

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

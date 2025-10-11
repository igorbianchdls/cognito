import { createRequire } from 'module';
import type { Pool } from 'pg';
import type { PoolConfig } from 'pg';

const require = createRequire(import.meta.url);

type PoolConstructor = new (config?: string | PoolConfig | undefined) => Pool;
const { Pool: PoolCtor } = require('pg') as { Pool: PoolConstructor };

let pgPool: Pool | null = null;

function getPool() {
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error('SUPABASE_DB_URL is not set. Configure the Postgres connection string before running queries.');
  }

  if (!pgPool) {
    pgPool = new PoolCtor({
      connectionString: process.env.SUPABASE_DB_URL,
      max: 5 // small pool; pgBouncer handles larger pooling
    });
  }

  return pgPool;
}

export async function runQuery<T = unknown>(sql: string, params?: unknown[]) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

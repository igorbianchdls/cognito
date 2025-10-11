import { createRequire } from 'module';
import type { QueryResultRow } from 'pg';

const require = createRequire(import.meta.url);
const { Pool } = require('pg') as typeof import('pg');

type PgPoolInstance = InstanceType<typeof Pool>;

let pgPool: PgPoolInstance | null = null;

function getPool() {
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error('SUPABASE_DB_URL is not set. Configure the Postgres connection string before running queries.');
  }

  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      max: 5 // small pool; pgBouncer handles larger pooling
    });
  }

  return pgPool;
}

export async function runQuery<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

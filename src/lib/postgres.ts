import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { Pool } = require('pg') as typeof import('pg');

/**
 * Type representing a row returned from a PostgreSQL query
 * Each row is an object with string keys and any type of value
 */
export type QueryRow = Record<string, any>;

type PgPoolInstance = InstanceType<typeof Pool>;

let pgPool: PgPoolInstance | null = null;

/**
 * Gets or creates a PostgreSQL connection pool to Supabase.
 * Uses a singleton pattern to reuse the same pool across requests.
 *
 * @returns {PgPoolInstance} PostgreSQL connection pool
 * @throws {Error} If SUPABASE_DB_URL is not configured
 */
function getPool(): PgPoolInstance {
  // Validate environment variable
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error(
      'SUPABASE_DB_URL is not set. ' +
      'Configure the Postgres connection string in your environment variables. ' +
      'Get it from: Supabase Dashboard > Project Settings > Database > Connection String (URI)'
    );
  }

  // Return existing pool or create a new one
  if (!pgPool) {
    try {
      pgPool = new Pool({
        connectionString: process.env.SUPABASE_DB_URL,
        max: 5, // Small pool size; Supabase pgBouncer handles larger pooling
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 10000, // Timeout connection attempts after 10 seconds
      });

      // Log pool errors
      pgPool.on('error', (err) => {
        console.error('Unexpected error on idle PostgreSQL client:', err);
      });

      console.log('PostgreSQL pool created successfully');
    } catch (error) {
      console.error('Failed to create PostgreSQL pool:', error);
      throw error;
    }
  }

  return pgPool;
}

/**
 * Executes a SQL query against the Supabase PostgreSQL database.
 *
 * @template T - Type of the rows returned by the query (defaults to QueryRow)
 * @param {string} sql - The SQL query to execute (can use $1, $2, etc. for parameters)
 * @param {unknown[]} params - Optional array of parameters to safely inject into the query
 * @param {number} queryTimeout - Optional timeout in milliseconds (default: 30000ms / 30s)
 * @returns {Promise<T[]>} Array of rows returned by the query
 *
 * @example
 * ```typescript
 * // Simple query
 * const users = await runQuery<{ id: number; name: string }>(
 *   'SELECT id, name FROM users WHERE active = $1',
 *   [true]
 * );
 *
 * // With custom timeout
 * const data = await runQuery('SELECT * FROM large_table', [], 60000);
 * ```
 */
export async function runQuery<T extends QueryRow = QueryRow>(
  sql: string,
  params?: unknown[],
  queryTimeout: number = 30000
): Promise<T[]> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Set statement timeout for this query
    await client.query(`SET statement_timeout = ${queryTimeout}`);

    // Execute the query
    const result = await client.query<T>(sql, params);

    return result.rows;
  } catch (error) {
    // Log detailed error information
    console.error('PostgreSQL query error:', {
      error: error instanceof Error ? error.message : String(error),
      sql: sql.substring(0, 200), // Log first 200 chars of query
      params,
    });

    throw error;
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}

/**
 * Closes the PostgreSQL connection pool.
 * Should be called when the application is shutting down.
 *
 * @example
 * ```typescript
 * // In Next.js, you might use this in a cleanup handler
 * process.on('SIGTERM', async () => {
 *   await closePool();
 *   process.exit(0);
 * });
 * ```
 */
export async function closePool(): Promise<void> {
  if (pgPool) {
    try {
      await pgPool.end();
      console.log('PostgreSQL pool closed successfully');
      pgPool = null;
    } catch (error) {
      console.error('Error closing PostgreSQL pool:', error);
      throw error;
    }
  }
}

/**
 * Checks if the PostgreSQL connection is healthy.
 * Useful for health check endpoints.
 *
 * @returns {Promise<boolean>} True if connection is healthy, false otherwise
 *
 * @example
 * ```typescript
 * // In a health check API route
 * export async function GET() {
 *   const isHealthy = await checkConnection();
 *   return Response.json({ database: isHealthy ? 'ok' : 'error' });
 * }
 * ```
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await runQuery('SELECT 1 as health');
    return result.length > 0 && result[0].health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

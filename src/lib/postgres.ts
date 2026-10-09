import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Pool } from "pg";
import { AsyncLocalStorage } from "node:async_hooks";

import { getErpDatabaseContext } from "@/lib/erpDatabaseContext";
import { normalizeTimeZone } from "@/products/erp/shared/businessDate";
export type SQLClient = {
  query: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[] }>;
  release: () => void;
};

let pool: InstanceType<typeof Pool> | null = null;
const transactionStorage = new AsyncLocalStorage<{
  client: SQLClient;
  tenantId: number;
  userId: number;
  readOnly?: boolean;
  portalContador?: boolean;
}>();

/** Reutiliza uma transacao aberta; operacoes compostas nao podem confirmar parcialmente. */
export function runWithErpTransactionClient<T>(
  client: SQLClient,
  fn: () => Promise<T>,
): Promise<T> {
  const context = getErpDatabaseContext();
  if (!context || context.readOnly)
    throw new Error(
      "Transacao composta exige contexto ERP autenticado de escrita.",
    );
  return transactionStorage.run(
    {
      client,
      tenantId: context.tenantId,
      userId: context.userId,
      readOnly: false,
      portalContador: context.portalContador,
    },
    fn,
  );
}
/** Todas as páginas da exportação usam o mesmo retrato do banco. */
export async function runWithErpReadSnapshot<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const context = getErpDatabaseContext();
  if (!context?.readOnly)
    throw new Error("Snapshot exige contexto autenticado de leitura.");
  if (getErpTransactionClient()) return fn();
  return withTransaction(async (client) => {
    await client.query(
      "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
    );
    return transactionStorage.run(
      {
        client,
        tenantId: context.tenantId,
        userId: context.userId,
        readOnly: true,
        portalContador: context.portalContador,
      },
      fn,
    );
  });
}
export function getErpTransactionClient(): SQLClient | undefined {
  const transaction = transactionStorage.getStore();
  if (!transaction) return undefined;
  const context = getErpDatabaseContext();
  if (
    context?.tenantId !== transaction.tenantId ||
    context?.userId !== transaction.userId ||
    Boolean(context.readOnly) !== Boolean(transaction.readOnly) ||
    Boolean(context.portalContador) !== Boolean(transaction.portalContador)
  )
    throw new Error("Contexto diferente da transacao composta.");
  return transaction.client;
}

export type PostgresPoolConfig = {
  connectionString: string;
  max: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  ssl?: { ca: string; rejectUnauthorized: boolean };
};

export function assertErpTenantScopedQuery(sql: string, params?: unknown[]) {
  if (!/\berp\.[a-z_][a-z0-9_]*/i.test(sql)) return;
  const tenantId = Number(params?.[0] || 0);
  if (
    !Number.isInteger(tenantId) ||
    tenantId <= 0 ||
    !/\bempresa_id\b/i.test(sql) ||
    !/\$1\b/.test(sql)
  ) {
    throw new Error("Consulta ERP sem escopo de empresa explicito.");
  }
  const context = getErpDatabaseContext();
  if (!context && process.env.ERP_ALLOW_PRIVILEGED_DB_CONTEXT !== "true") {
    throw new Error("Consulta ERP sem contexto autenticado de tenant.");
  }
  if (context && context.tenantId !== tenantId) {
    throw new Error(
      "Consulta ERP tentou acessar um tenant diferente do contexto autenticado.",
    );
  }
}

function isLocalDatabase(hostname: string) {
  return ["localhost", "127.0.0.1", "::1"].includes(hostname);
}

export function buildPostgresPoolConfig(
  connectionString: string,
): PostgresPoolConfig {
  const url = new URL(connectionString);
  if (isLocalDatabase(url.hostname)) return { connectionString, max: 5 };

  const certificatePath = process.env.SUPABASE_DB_CA_FILE
    ? resolve(process.env.SUPABASE_DB_CA_FILE)
    : resolve(process.cwd(), "certificates", "supabase-prod-ca-2021.crt");
  const certificate =
    process.env.SUPABASE_DB_CA?.replaceAll("\\n", "\n") ||
    (existsSync(certificatePath) ? readFileSync(certificatePath, "utf8") : "");
  if (!certificate) {
    throw new Error(
      "Certificado CA do Supabase nao configurado. Defina SUPABASE_DB_CA ou SUPABASE_DB_CA_FILE.",
    );
  }

  for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"])
    url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    // A Vercel instance shares this pool across concurrent requests. Keep it
    // small and release idle connections instead of holding session slots.
    max: 2,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 5000,
    ssl: { ca: certificate, rejectUnauthorized: true },
  };
}

function getPool() {
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error("SUPABASE_DB_URL não está configurada");
  }

  if (!pool) {
    pool = new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL));
  }

  return pool;
}

export async function runQuery<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  assertErpTenantScopedQuery(sql, params);
  const transactionClient = getErpTransactionClient();
  if (transactionClient)
    return (await transactionClient.query(sql, params)).rows as T[];
  const client = await getPool().connect();
  try {
    const context = getErpDatabaseContext();
    if (/\berp\.[a-z_][a-z0-9_]*/i.test(sql) && context) {
      await client.query("BEGIN");
      try {
        await applyErpRuntimeContext(client, context);
        const result = await client.query(sql, params);
        await client.query("COMMIT");
        return result.rows as T[];
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      }
    }
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

export async function withTransaction<T>(
  fn: (client: SQLClient) => Promise<T>,
): Promise<T> {
  const transactionClient = getErpTransactionClient();
  if (transactionClient) return fn(transactionClient);
  const transactionContext = getErpDatabaseContext();
  const rawClient = await getPool().connect();
  // O contexto da empresa vale para a transação inteira: aplica uma vez e só alterna o papel
  // quando uma consulta fora do schema erp (shared/plugin) precisa do papel do servidor.
  let configured = false,
    restricted = false;
  async function restrict(context: NonNullable<typeof transactionContext>) {
    if (restricted) return;
    if (configured)
      await rawClient.query("SELECT set_config('role', 'erp_runtime', true)");
    else {
      await applyErpRuntimeContext(rawClient, context);
      configured = true;
    }
    restricted = true;
  }
  const client: SQLClient = {
    async query(sql, params) {
      assertErpTenantScopedQuery(sql, params);
      const context = getErpDatabaseContext();
      if (
        context?.tenantId !== transactionContext?.tenantId ||
        context?.userId !== transactionContext?.userId
      ) {
        throw new Error("O contexto autenticado mudou durante a transacao.");
      }
      if (/\berp\.[a-z_][a-z0-9_]*/i.test(sql) && context) {
        await restrict(context);
        return (await rawClient.query(sql, params)) as {
          rows: Record<string, unknown>[];
        };
      }
      if (restricted && !/^\s*(BEGIN|COMMIT|ROLLBACK)\b/i.test(sql)) {
        await rawClient.query("RESET ROLE");
        restricted = false;
      }
      return rawClient.query(sql, params) as Promise<{
        rows: Record<string, unknown>[];
      }>;
    },
    release: () => rawClient.release(),
  };
  try {
    await client.query("BEGIN");
    try {
      const result = await fn(client);
      // Constraints diferidas tambem devem executar sob o contexto restrito.
      if (transactionContext) await restrict(transactionContext);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      try {
        await rawClient.query("ROLLBACK");
      } catch {}
      throw err;
    }
  } finally {
    client.release();
  }
}

async function applyErpRuntimeContext(
  client: Pick<SQLClient, "query">,
  context: {
    tenantId: number;
    userId: number;
    statementTimeoutMs?: number;
    readOnly?: boolean;
    timeZone?: string;
    portalContador?: boolean;
  },
) {
  // Uma ida ao banco: somente leitura, tempo limite, empresa, usuário, fuso e papel restrito,
  // todos com escopo da transação. app.erp_time_zone converte timestamps em datas da empresa.
  const timeout = context.statementTimeoutMs !== undefined;
  const settings = [
    ...(context.readOnly
      ? ["set_config('transaction_read_only', 'on', true)"]
      : []),
    ...(timeout ? ["set_config('statement_timeout', $4, true)"] : []),
    "set_config('app.erp_empresa_id', $1, true)",
    "set_config('app.erp_tenant_id', $1, true)",
    "set_config('app.erp_user_id', $2, true)",
    "set_config('app.erp_time_zone', $3, true)",
    `set_config('app.portal_contador', '${context.portalContador ? "true" : "false"}', true)`,
    "set_config('role', 'erp_runtime', true)",
  ];
  await client.query(`SELECT ${settings.join(", ")}`, [
    String(context.tenantId),
    String(context.userId),
    normalizeTimeZone(context.timeZone),
    ...(timeout ? [String(context.statementTimeoutMs)] : []),
  ]);
}

function assertSafeIdentifier(identifier: string, label: string) {
  if (!/^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/i.test(identifier)) {
    throw new Error(`${label} inválido: ${identifier}`);
  }
}

export async function alignTableIdSequenceWithClient(
  client: Pick<SQLClient, "query">,
  table: string,
  column = "id",
): Promise<void> {
  assertSafeIdentifier(table, "table");
  assertSafeIdentifier(column, "column");

  const seqRes = await client.query(
    `SELECT pg_get_serial_sequence($1, $2) AS seq`,
    [table, column],
  );
  const seq = String(seqRes.rows?.[0]?.seq || "");
  if (!seq) return;

  const maxRes = await client.query(
    `SELECT COALESCE(MAX(${column}), 0)::bigint AS max_id FROM ${table}`,
  );
  const maxId = Number(maxRes.rows?.[0]?.max_id || 0);
  await client.query(`SELECT setval($1, $2, true)`, [seq, Math.max(1, maxId)]);
}

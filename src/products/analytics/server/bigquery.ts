// BigQuery for the Analytics events, straight over its REST API (no SDK): a service account signs a short JWT,
// trades it for an access token, and the token is reused until it is about to expire.
// Configuration (Vercel): GCP_SERVICE_ACCOUNT_JSON (the key file's JSON), and optionally ANALYTICS_BQ_PROJECT,
// ANALYTICS_BQ_DATASET (default "analytics") and ANALYTICS_BQ_LOCATION (default "southamerica-east1").
import { createSign } from 'node:crypto'

type ServiceAccount = { client_email: string; private_key: string; project_id: string }
export type BigQueryConfig = { account: ServiceAccount; project: string; dataset: string; location: string }
export type Fetch = typeof fetch

export class AnalyticsUnavailable extends Error {}

export function bigQueryConfig(env: Record<string, string | undefined> = process.env): BigQueryConfig | null {
  const raw = env.GCP_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  let account: ServiceAccount
  try { account = JSON.parse(raw) } catch { return null }
  if (!account?.client_email || !account?.private_key) return null
  const dataset = env.ANALYTICS_BQ_DATASET || 'analytics'
  if (!/^[A-Za-z0-9_]{1,1024}$/.test(dataset)) return null
  return { account, project: env.ANALYTICS_BQ_PROJECT || account.project_id, dataset, location: env.ANALYTICS_BQ_LOCATION || 'southamerica-east1' }
}

// ---------- access token ----------

const b64 = (v: string | Buffer) => Buffer.from(v).toString('base64url')
let cached: { email: string; token: string; until: number } | null = null

async function accessToken(c: BigQueryConfig, send: Fetch) {
  if (cached && cached.email === c.account.client_email && cached.until > Date.now()) return cached.token
  const now = Math.floor(Date.now() / 1000)
  const head = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64(JSON.stringify({ iss: c.account.client_email, scope: 'https://www.googleapis.com/auth/bigquery', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }))
  const signature = createSign('RSA-SHA256').update(`${head}.${claims}`).sign(c.account.private_key)
  const response = await send('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claims}.${b64(signature)}` }),
    signal: AbortSignal.timeout(10000),
  })
  const body = await response.json().catch(() => ({})) as { access_token?: string; expires_in?: number }
  if (!response.ok || !body.access_token) throw new AnalyticsUnavailable('Não foi possível entrar no BigQuery com a conta de serviço.')
  cached = { email: c.account.client_email, token: body.access_token, until: Date.now() + Math.max(60, (body.expires_in ?? 3600) - 120) * 1000 }
  return body.access_token
}

async function call<T>(c: BigQueryConfig, send: Fetch, method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> {
  const response = await send(`https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(c.project)}${path}`, {
    method, headers: { authorization: `Bearer ${await accessToken(c, send)}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000),
  })
  return { status: response.status, data: await response.json().catch(() => ({})) as T }
}

// ---------- the events table ----------

export const EVENT_FIELDS = [
  ['event_id', 'STRING', 'REQUIRED'], ['property_id', 'STRING', 'REQUIRED'], ['workspace_id', 'STRING', 'REQUIRED'], ['event', 'STRING', 'REQUIRED'],
  ['timestamp', 'TIMESTAMP', 'REQUIRED'], ['received_at', 'TIMESTAMP', 'REQUIRED'],
  ['distinct_id', 'STRING'], ['user_id', 'STRING'], ['session_id', 'STRING'],
  ['url', 'STRING'], ['host', 'STRING'], ['path', 'STRING'], ['title', 'STRING'], ['referrer', 'STRING'], ['referrer_host', 'STRING'],
  ['utm_source', 'STRING'], ['utm_medium', 'STRING'], ['utm_campaign', 'STRING'], ['utm_content', 'STRING'], ['utm_term', 'STRING'],
  ['device', 'STRING'], ['browser', 'STRING'], ['os', 'STRING'], ['country', 'STRING'], ['region', 'STRING'],
  ['screen_width', 'INT64'], ['language', 'STRING'], ['properties', 'JSON'],
] as const
export type EventRow = { event_id: string; property_id: string; workspace_id: string; event: string; timestamp: string; received_at: string } & Partial<Record<string, string | number | null>>

let ready: Promise<void> | null = null
/** Creates the dataset and the events table (one partition per day, clustered by property and event) the first time. */
export function ensureEventsTable(c: BigQueryConfig, send: Fetch = fetch) {
  ready ??= (async () => {
    const dataset = await call(c, send, 'GET', `/datasets/${c.dataset}`)
    if (dataset.status === 404) {
      const made = await call(c, send, 'POST', '/datasets', { datasetReference: { projectId: c.project, datasetId: c.dataset }, location: c.location, description: 'Otto Analytics' })
      if (made.status >= 300 && made.status !== 409) throw new AnalyticsUnavailable('Não foi possível criar o dataset do Analytics no BigQuery.')
    } else if (dataset.status >= 300) throw new AnalyticsUnavailable('O BigQuery recusou o acesso ao dataset do Analytics.')
    const table = await call(c, send, 'GET', `/datasets/${c.dataset}/tables/events`)
    if (table.status === 404) {
      const made = await call(c, send, 'POST', `/datasets/${c.dataset}/tables`, {
        tableReference: { projectId: c.project, datasetId: c.dataset, tableId: 'events' },
        schema: { fields: EVENT_FIELDS.map(([name, type, mode]) => ({ name, type, mode: mode ?? 'NULLABLE' })) },
        timePartitioning: { type: 'DAY', field: 'timestamp' }, requirePartitionFilter: true,
        clustering: { fields: ['property_id', 'event'] },
      })
      if (made.status >= 300 && made.status !== 409) throw new AnalyticsUnavailable('Não foi possível criar a tabela de eventos no BigQuery.')
    } else if (table.status >= 300) throw new AnalyticsUnavailable('O BigQuery recusou o acesso à tabela de eventos.')
  })().catch(error => { ready = null; throw error })
  return ready
}

/** Streams the rows; each event_id is also the insert id, so a retried batch doesn't double count. */
export async function insertEvents(c: BigQueryConfig, rows: EventRow[], send: Fetch = fetch) {
  if (!rows.length) return
  await ensureEventsTable(c, send)
  const result = await call<{ insertErrors?: unknown[] }>(c, send, 'POST', `/datasets/${c.dataset}/tables/events/insertAll`, {
    rows: rows.map(row => ({ insertId: row.event_id, json: row })), skipInvalidRows: true, ignoreUnknownValues: true,
  })
  if (result.status >= 300) throw new AnalyticsUnavailable('O BigQuery recusou os eventos.')
  if (result.data.insertErrors?.length) console.error(JSON.stringify({ scope: 'analytics', code: 'BQ_INSERT_ROWS', rejected: result.data.insertErrors.length }))
}

// ---------- queries ----------

type Param = { name: string; type: 'STRING' | 'INT64' | 'TIMESTAMP'; value: string | number }
type QueryResult = { schema?: { fields: { name: string; type: string }[] }; rows?: { f: { v: unknown }[] }[]; jobComplete?: boolean; error?: { message?: string } }

/** Runs a parameterized query with a cap on the bytes it may read. Rows come back as plain objects. */
export async function queryEvents<R extends Record<string, unknown>>(c: BigQueryConfig, sql: string, params: Param[], send: Fetch = fetch): Promise<R[]> {
  await ensureEventsTable(c, send)
  const result = await call<QueryResult>(c, send, 'POST', '/queries', {
    query: sql.replaceAll('`events`', `\`${c.project}.${c.dataset}.events\``), useLegacySql: false, location: c.location, timeoutMs: 15000,
    maximumBytesBilled: String(2 * 1024 ** 3), parameterMode: 'NAMED', useQueryCache: true,
    queryParameters: params.map(p => ({ name: p.name, parameterType: { type: p.type }, parameterValue: { value: String(p.value) } })),
  })
  if (result.status >= 300 || !result.data.jobComplete) throw new AnalyticsUnavailable(result.data.error?.message ? 'A consulta ao BigQuery falhou.' : 'A consulta ao BigQuery demorou demais.')
  const fields = result.data.schema?.fields ?? []
  return (result.data.rows ?? []).map(row => Object.fromEntries(fields.map((f, i) => {
    const v = row.f[i]?.v
    return [f.name, v === null || v === undefined ? null : f.type === 'INTEGER' || f.type === 'INT64' || f.type === 'FLOAT' || f.type === 'FLOAT64' ? Number(v) : f.type === 'TIMESTAMP' ? new Date(Number(v) * 1000).toISOString() : v]
  }))) as R[]
}

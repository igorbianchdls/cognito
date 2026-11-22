// Analytics without network or database: what the event endpoint accepts, the rows it writes, and the BigQuery client
// (token, table creation, inserts and queries) against a fake Google API.
import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import { batchSchema, isBot, originAllowed, parseAgent, toRows, type Property } from '../src/products/analytics/server/capture'
import { bigQueryConfig, ensureEventsTable, insertEvents, queryEvents, type Fetch } from '../src/products/analytics/server/bigquery'
import { runReport } from '../src/products/analytics/server/reports'

const property: Property = { id: '11111111-1111-1111-1111-111111111111', workspace_id: 'org_A', domains: ['minhaloja.com.br'] }

async function main() {
  // ---------- which sites may send ----------
  assert.equal(originAllowed(property, 'https://minhaloja.com.br'), true)
  assert.equal(originAllowed(property, 'https://www.minhaloja.com.br'), true)
  assert.equal(originAllowed(property, 'https://minhaloja.com.br.golpe.com'), false)
  assert.equal(originAllowed(property, 'https://outraloja.com.br'), false)
  assert.equal(originAllowed(property, null), false)
  assert.equal(originAllowed({ ...property, domains: [] }, null), true)
  console.log('PASS só os domínios da propriedade (e subdomínios) enviam eventos')

  // ---------- what a batch may contain ----------
  const key = 'otto_' + 'a'.repeat(32)
  assert.equal(batchSchema.safeParse({ k: key, events: [{ e: '$pageview', d: 'v1' }] }).success, true)
  assert.equal(batchSchema.safeParse({ k: 'otto_x', events: [{ e: '$pageview', d: 'v1' }] }).success, false)
  assert.equal(batchSchema.safeParse({ k: key, events: [] }).success, false)
  assert.equal(batchSchema.safeParse({ k: key, events: Array(51).fill({ e: 'x', d: 'v' }) }).success, false)
  assert.equal(batchSchema.safeParse({ k: key, events: [{ e: '<script>', d: 'v1' }] }).success, false)
  assert.equal(batchSchema.safeParse({ k: key, events: [{ e: 'x', d: 'v1', ip: '1.2.3.4' }] }).success, false)
  assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1)'), true)
  assert.equal(isBot(''), true)
  console.log('PASS lotes inválidos, grandes demais ou de robôs são recusados')

  // ---------- the rows ----------
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  assert.deepEqual(parseAgent(iphone), { device: 'mobile', browser: 'Safari', os: 'iOS' })
  assert.deepEqual(parseAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0'), { device: 'desktop', browser: 'Edge', os: 'Windows' })
  const now = new Date('2026-11-22T12:00:00Z')
  const batch = batchSchema.parse({ k: key, events: [
    { e: '$pageview', t: '2026-11-22T11:59:00Z', d: 'v1', s: 's1', url: 'https://minhaloja.com.br/precos?utm_source=instagram&utm_campaign=natal', ref: 'https://www.google.com/', title: 'Preços', sw: 390, lang: 'pt-BR' },
    { e: 'assinou', t: '2020-01-01T00:00:00Z', d: 'v1', u: 'user_9', p: { plano: 'pro', valor: 99 } },
  ] })
  const [view, signed] = toRows(property, batch, { ua: iphone, country: 'BR', region: 'SP', now })
  assert.equal(view.timestamp, '2026-11-22T11:59:00.000Z')
  assert.deepEqual([view.host, view.path, view.referrer_host, view.utm_source, view.utm_campaign, view.device, view.country], ['minhaloja.com.br', '/precos', 'www.google.com', 'instagram', 'natal', 'mobile', 'BR'])
  assert.equal(signed.timestamp, now.toISOString(), 'data antiga demais vira a hora de chegada')
  assert.equal(signed.user_id, 'user_9'); assert.equal(signed.properties, '{"plano":"pro","valor":99}')
  assert.equal(view.workspace_id, 'org_A'); assert.notEqual(view.event_id, signed.event_id)
  assert(!JSON.stringify([view, signed]).match(/\d+\.\d+\.\d+\.\d+/), 'nenhum IP nas linhas')
  console.log('PASS cada evento vira uma linha com página, origem, campanha, aparelho e país, sem IP')

  // ---------- BigQuery over a fake Google API ----------
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
  const config = bigQueryConfig({ GCP_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'otto@proj.iam.gserviceaccount.com', private_key: privateKey, project_id: 'proj' }) })!
  assert.equal(config.dataset, 'analytics'); assert.equal(config.location, 'southamerica-east1')
  assert.equal(bigQueryConfig({}), null); assert.equal(bigQueryConfig({ GCP_SERVICE_ACCOUNT_JSON: '{' }), null)
  const calls: { method: string; url: string; body?: Record<string, unknown> }[] = []
  let tableExists = false
  const google: Fetch = (async (input: string | URL, init?: RequestInit) => {
    const url = String(input), method = init?.method ?? 'GET'
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    calls.push({ method, url, body })
    const reply = (status: number, data: object) => new Response(JSON.stringify(data), { status })
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      const assertion = new URLSearchParams(String(init?.body)).get('assertion')!
      const claims = JSON.parse(Buffer.from(assertion.split('.')[1], 'base64url').toString())
      assert.equal(claims.iss, 'otto@proj.iam.gserviceaccount.com'); assert.equal(claims.scope, 'https://www.googleapis.com/auth/bigquery')
      return reply(200, { access_token: 'tok', expires_in: 3600 })
    }
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer tok')
    if (url.endsWith('/datasets/analytics') && method === 'GET') return reply(404, {})
    if (url.endsWith('/datasets') && method === 'POST') return reply(200, {})
    if (url.endsWith('/tables/events') && method === 'GET') return tableExists ? reply(200, {}) : reply(404, {})
    if (url.endsWith('/tables') && method === 'POST') { tableExists = true; return reply(200, {}) }
    if (url.endsWith('/insertAll')) return reply(200, {})
    if (url.endsWith('/queries')) return reply(200, { jobComplete: true, schema: { fields: [{ name: 'dia', type: 'STRING' }, { name: 'visitantes', type: 'INTEGER' }] }, rows: [{ f: [{ v: '2026-11-21' }, { v: '42' }] }] })
    return reply(500, {})
  }) as Fetch
  await ensureEventsTable(config, google)
  const table = calls.find(c => c.url.endsWith('/tables') && c.method === 'POST')!.body as { timePartitioning: { field: string; expirationMs: string }; clustering: { fields: string[] }; requirePartitionFilter: boolean; schema: { fields: { name: string }[] } }
  assert.equal(table.timePartitioning.field, 'timestamp'); assert.deepEqual(table.clustering.fields, ['property_id', 'event']); assert.equal(table.requirePartitionFilter, true)
  assert.equal(table.timePartitioning.expirationMs, String(760 * 86400000), 'eventos com mais de ~25 meses expiram sozinhos')
  assert.equal(bigQueryConfig({ GCP_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'a@b', private_key: 'k', project_id: 'p' }), ANALYTICS_RETENTION_DAYS: '5' })!.retentionDays, 30, 'retenção mínima de 30 dias')
  assert(table.schema.fields.some(f => f.name === 'properties') && !table.schema.fields.some(f => /ip/.test(f.name)))
  assert.equal(calls.find(c => c.url.endsWith('/datasets') && c.method === 'POST')!.body!.location, 'southamerica-east1')
  await insertEvents(config, [view, signed], google)
  const insert = calls.find(c => c.url.endsWith('/insertAll'))!.body as { rows: { insertId: string; json: { event_id: string } }[] }
  assert.equal(insert.rows.length, 2); assert.equal(insert.rows[0].insertId, insert.rows[0].json.event_id)
  const rows = await runReport(config, 'resumo', property.id, new Date('2026-11-01'), new Date('2026-11-22'), '', google)
  assert.deepEqual(rows, [{ dia: '2026-11-21', visitantes: 42 }])
  const query = calls.find(c => c.url.endsWith('/queries'))!.body as { query: string; maximumBytesBilled: string; queryParameters: { name: string; parameterValue: { value: string } }[] }
  assert(query.query.includes('`proj.analytics.events`') && query.query.includes('property_id = @p') && query.query.includes('timestamp >= @de'))
  assert.equal(query.queryParameters.find(p => p.name === 'p')!.parameterValue.value, property.id)
  assert(Number(query.maximumBytesBilled) <= 2 * 1024 ** 3)
  assert.equal(calls.filter(c => c.url.includes('oauth2')).length, 1, 'o token é reaproveitado')
  await assert.rejects(queryEvents(config, 'SELECT 1', [], (async () => new Response('{}', { status: 400 })) as unknown as Fetch))
  console.log('PASS BigQuery: cria dataset e tabela por dia, grava sem duplicar, consulta só a propriedade com teto de leitura')
  console.log(JSON.stringify({ status: 'passed', checks: 4 }))
}
main().catch(error => { console.error(error); process.exit(1) })

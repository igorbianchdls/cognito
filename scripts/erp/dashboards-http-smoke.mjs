import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { AsyncLocalStorage } from 'node:async_hooks'
import vm from 'node:vm'
import ts from 'typescript'
import dotenv from 'dotenv'
import { connection } from './evolution-db.mjs'
dotenv.config({ path: '.env.local', quiet: true })
// Real SQL/HTTP wrappers; only the external Clerk session boundary is replaced.
// This fixture is loopback-only and never changes production authentication.
const root = resolve('.'),
  require = createRequire(import.meta.url),
  modules = new Map(),
  actors = new AsyncLocalStorage(),
  checks = []
let server, postgres, base
const serveUi=process.argv.includes('--serve-ui')
const db = connection()
function load(name, parent = resolve(root, 'entry.ts')) {
  if (!name.startsWith('.') && !name.startsWith('@/') && !name.startsWith(root))
    return require(name)
  let file = name.startsWith('@/')
    ? resolve(root, 'src', name.slice(2))
    : resolve(dirname(parent), name)
  if (!existsSync(file)) file = ['.ts', '.tsx', '/index.ts'].map((s) => file + s).find(existsSync)
  if (file?.replaceAll('\\', '/').endsWith('/server/erpAccess.ts'))
    return { resolveErpSession: async () => actors.getStore() || null }
  assert(file && existsSync(file), name)
  if (modules.has(file)) return modules.get(file).exports
  const record = { exports: {} }
  modules.set(file, record)
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(
    (dependency) => load(dependency, file),
    record,
    record.exports,
  )
  return record.exports
}
async function call(path, actor, expected) {
  const response = await fetch(base + path, { headers: actor ? { 'x-local-actor': actor } : {} }),
    data = await response.json()
  assert.equal(response.status, expected, JSON.stringify({ path, data }))
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.match(response.headers.get('x-correlation-id'), /^[a-f0-9-]{36}$/)
  checks.push({ path, actor: actor || 'anonymous', status: response.status })
  return data
}
try {
  await db.connect()
  const identity = (
    await db.query(
      "SELECT e.name,u.email,u.clerk_user_id FROM shared.empresas e JOIN shared.usuarios_empresas m ON m.empresa_id=e.id JOIN shared.usuarios u ON u.id=m.usuario_id WHERE e.id=2 AND u.id=3 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND e.status='active' AND u.status='active'",
    )
  ).rows[0]
  assert(identity)
  const owner = {
    tenantId: 2,
    sharedUserId: 3,
    clerkUserId: identity.clerk_user_id,
    email: identity.email,
    tenantName: identity.name,
    role: 'owner',
    authMode: 'clerk',
    erpProfile: 'administrador',
    capabilities: load('@/products/erp/shared/professionalContracts').ERP_CAPABILITIES,
  }
  const reader = { ...owner, capabilities: ['erp.vendas.visualizar'] }
  postgres = load('@/lib/postgres')
  const routes = {
    summary: load('@/products/erp/api/handlers/dashboards/index').GET,
    records: load('@/products/erp/api/handlers/dashboards/records').GET,
  }
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, base),
        match = url.pathname.match(/^\/api\/erp\/dashboards\/([^/]+)(\/registros)?$/)
      if(serveUi&&!url.pathname.startsWith('/api/')){
        const asset=url.pathname==='/bundle.js'?'bundle.js':url.pathname==='/styles.css'?'styles.css':'index.html'
        res.writeHead(200,{'content-type':asset.endsWith('.js')?'application/javascript':asset.endsWith('.css')?'text/css':'text/html','cache-control':'no-store'})
        res.end(readFileSync(resolve(root,'.cache/dashboards/ui',asset)));return
      }
      if (!match) {
        res.writeHead(404)
        res.end()
        return
      }
      const handler = match[2] ? routes.records : routes.summary,
        actor =
          req.headers['x-local-actor'] === 'owner'
            ? owner
            : req.headers['x-local-actor'] === 'reader'
              ? reader
              : null
      const response = await actors.run(actor, () =>
        handler(new Request(url), { params: Promise.resolve({ dashboardId: match[1] }) }),
      )
      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(Buffer.from(await response.arrayBuffer()))
    } catch (error) {
      console.error(error.message)
      res.writeHead(500)
      res.end('{}')
    }
  })
  await new Promise((done) => server.listen(0, '127.0.0.1', done))
  base = 'http://127.0.0.1:' + server.address().port
  if(serveUi){
    console.log(JSON.stringify({uiFixture:base}))
    await new Promise(done=>{process.once('SIGTERM',done);process.once('SIGINT',done)})
  }else{
  const panels = [
    'visao-geral',
    'financeiro',
    'vendas',
    'compras',
    'estoque',
    'resultados',
    'servicos',
  ]
  for (const id of panels) await call('/api/erp/dashboards/' + id, null, 401)
  await call('/api/erp/dashboards/financeiro/registros?source=pagar', null, 401)
  for (const id of panels)
    await call('/api/erp/dashboards/' + id + '?from=2026-09-01&to=2026-09-30', 'owner', 200)
  await call('/api/erp/dashboards/financeiro', 'reader', 403)
  await call('/api/erp/dashboards/visao-geral/registros?source=pagar', 'reader', 403)
  const overview = await call('/api/erp/dashboards/visao-geral', 'reader', 200)
  assert.deepEqual(overview.availableDashboards, ['visao-geral', 'vendas', 'servicos'])
  await call('/api/erp/dashboards/inexistente', 'owner', 404)
  for (const suffix of [
    '?compare=1',
    '?includeForecast=yes',
    '?empresa_id=1',
    '?from=2026-02-30',
    '?from=2026-10-05&to=2026-10-04',
    '?from=2024-01-01&to=2026-10-05',
    '?to=2026-10-05&to=2026-10-06',
  ])
    await call('/api/erp/dashboards/vendas' + suffix, 'owner', 422)
  for (const suffix of [
    '?source=vendas&pageSize=101',
    '?source=vendas&id=0',
    '?source=vendas&dimension=cliente',
    '?source=vendas&empresa_id=1',
    '?source=vendas&status=reservas',
    '?source=vendas&includeForecast=1',
    '?source=vendas&from=2026-09-01',
  ])
    await call('/api/erp/dashboards/vendas/registros' + suffix, 'owner', 422)
  await call('/api/erp/dashboards/vendas/registros?source=pagar', 'owner', 404)
  const first = await call(
      '/api/erp/dashboards/vendas/registros?source=vendas&from=2026-09-01&to=2026-09-30&pageSize=2',
      'owner',
      200,
    ),
    second = await call(
      '/api/erp/dashboards/vendas/registros?source=vendas&from=2026-09-01&to=2026-09-30&pageSize=2&page=2',
      'owner',
      200,
    )
  assert.equal(first.total, 39)
  assert.equal(first.totalValue, 87123.74)
  assert.equal(first.records.length, 2)
  assert.equal(second.records.length, 2)
  assert(!second.records.some((r) => first.records.some((p) => p.id === r.id)))
  mkdirSync('.cache/dashboards', { recursive: true })
  writeFileSync(
    '.cache/dashboards/http-smoke.json',
    JSON.stringify(
      {
        status: 'passed',
        authentication:
          'Local fixture at Clerk session boundary; real HTTP handlers and Supabase queries.',
        checks,
      },
      null,
      2,
    ),
  )
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }))
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  if (server) await new Promise((done) => server.close(done))
  await db.end().catch(() => {})
  if (postgres) await postgres.closePool()
}

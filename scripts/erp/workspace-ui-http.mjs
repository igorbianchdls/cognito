import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import dotenv from 'dotenv'
import { connection } from './evolution-db.mjs'

const cfg = dotenv.parse(readFileSync('.env.local')), staged = JSON.parse(readFileSync('.cache/shared/deployment.json'))
const production = process.argv.includes('--production'), origin = production ? 'https://cognito-seven.vercel.app' : 'https://' + staged.url
const db = connection(), results = []
try {
  await db.connect()
  const owner = (await db.query("SELECT u.clerk_user_id,e.clerk_organization_id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.status='active' AND m.role='owner' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'")).rows[0]
  assert(owner)
  const clerk = createRequire(import.meta.url)('@clerk/backend').createClerkClient({ secretKey: cfg.CLERK_SECRET_KEY })
  const sessions = await clerk.sessions.getSessionList({ userId: owner.clerk_user_id, status: 'active', limit: 100 })
  const session = sessions.data.find(s => s.lastActiveOrganizationId === owner.clerk_organization_id) || sessions.data.find(s => !s.lastActiveOrganizationId)
  assert(session, 'No active owner session')
  async function get(path) {
    const token = await clerk.sessions.getToken(session.id, undefined, 60)
    const response = await fetch(origin + path, { headers: { Authorization: 'Bearer ' + token.jwt }, signal: AbortSignal.timeout(30000), redirect: 'manual' })
    assert.equal(response.status, 200, path); results.push({ path, http: response.status }); return response
  }
  for (const path of ['/api/erp/acesso', '/api/erp/contas-a-pagar?pageSize=1', '/api/erp/contas-a-receber?pageSize=1', '/api/erp/clientes?pageSize=1', '/api/erp/fornecedores?pageSize=1']) {
    const response = await get(path); assert.equal(response.headers.get('cache-control'), 'no-store'); await response.json()
  }
  let styles = ''
  for (const path of ['/erp/financeiro/contas-a-pagar', '/erp/financeiro/contas-a-receber', '/erp/cadastros/clientes', '/erp/cadastros/fornecedores', '/erp/vendas/pedidos', '/erp/compras/pedidos-compra', '/erp/estoque/posicao-estoque', '/erp/vendas/notas-fiscais', '/erp/dashboards/visao-geral']) {
    const response = await get(path), html = await response.text()
    assert(response.headers.get('content-type')?.includes('text/html'))
    if (!styles) {
      const files = [...new Set([...html.matchAll(/href="([^"<>]+\.css(?:\?[^"<>]*)?)"/g)].map(m => m[1].replaceAll('&amp;', '&')))].filter(path => path.startsWith('/_next/'))
      assert(files.length, 'No page stylesheet')
      for (const file of files) styles += await (await get(file)).text()
    }
  }
  for (const marker of ['.erp-workspace-header', '.erp-workspace-metric-value', '.erp-workspace-column-trigger', '.erp-record-avatar']) assert(styles.includes(marker), 'Missing deployed style ' + marker)
  const report = { status: 'passed', production, origin, deploymentId: staged.id, realClerkSession: true, businessDataWrites: 0, deployedStylesVerified: true, browserVisualCheck: 'unavailable', results }
  writeFileSync('.cache/workspace-ui/' + (production ? 'production' : 'staged') + '-http.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
} finally { await db.end() }

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { createClerkClient } from '@clerk/backend'
import { connection } from '../erp/evolution-db.mjs'
const env = dotenv.parse(readFileSync('.env.local')), staged = JSON.parse(readFileSync('.cache/apps/deployment/deployment.json')), production = process.argv.includes('--production'), origin = production ? 'https://cognito-seven.vercel.app' : 'https://' + staged.url, db = connection(), checks = []
let fixtureId, request
try {
 await db.connect()
 const owner = (await db.query("SELECT u.clerk_user_id,e.clerk_organization_id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'")).rows[0]; assert(owner)
 const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY }); const sessions = await clerk.sessions.getSessionList({ userId: owner.clerk_user_id, status: 'active', limit: 100 }), session = sessions.data.find(s => s.lastActiveOrganizationId === owner.clerk_organization_id) || sessions.data.find(s => !s.lastActiveOrganizationId); assert(session)
 const token = await clerk.sessions.getToken(session.id, undefined, 60)
 request = async (path, method = 'GET', body, status = 200) => {
  const r = await fetch(origin + '/api/apps' + path, { method, headers: { Authorization: 'Bearer ' + token.jwt, Origin: origin, 'content-type': 'application/json' }, ...(method === 'GET' ? {} : { body: JSON.stringify(body ?? {}) }), signal: AbortSignal.timeout(45000) })
  const data = await r.json().catch(() => null)
  assert.equal(r.status, status, method + ' ' + path + ' HTTP ' + r.status + ' ' + (data?.error?.code ?? '')); assert.match(r.headers.get('cache-control') ?? '', /no-store/); return data
 }
 const anon = await fetch(origin + '/api/apps', { redirect: 'manual' }); assert.equal(anon.status, 401); checks.push('Anonymous API responds JSON 401')
 const catalog = await request(''); assert(Array.isArray(catalog.apps)); assert.equal(catalog.podeEditar, true); checks.push('Real Clerk session and company-scoped catalog')
 const page = await fetch(origin + '/apps', { headers: { Authorization: 'Bearer ' + token.jwt }, signal: AbortSignal.timeout(45000) }); assert.equal(page.status, 200); assert.match(await page.text(), /Apps/); checks.push('Authenticated Apps page renders')
 if (!production) {
  const created = await request('', 'POST', { nome: 'Validação temporária Apps ' + randomUUID().slice(0, 8), descricao: 'Teste automatizado da entrega', exemplo: true }, 201); fixtureId = created.app.id
  let b = await request('/' + fixtureId), content = await request(`/${fixtureId}/conteudo`)
  assert(content.pacote.arquivos.some(f => f.caminho === 'index.html')); checks.push('Real private Storage saves and verifies app package')
  const input = { expectedVersion: b.app.versao_concorrencia, ...content.pacote }
  await request(`/${fixtureId}/rascunho`, 'PUT', { ...input, expectedVersion: 999 }, 409)
  await request(`/${fixtureId}/rascunho`, 'PUT', input)
  b = await request('/' + fixtureId); const op = { expectedVersion: b.app.versao_concorrencia, versaoId: b.versoes[0].id, chaveOperacao: randomUUID() }
  await request(`/${fixtureId}/publicar`, 'POST', op); await request(`/${fixtureId}/publicar`, 'POST', op)
  const runtime = await request(`/${fixtureId}/runtime?modo=publicado`); assert(runtime.token); checks.push('Draft revision conflict, immutable publish and idempotent retry')
  const record = (await request(`/${fixtureId}/dados`, 'POST', { token: runtime.token, colecao: 'itens', operacao: 'salvar', registro: { dados: { titulo: 'Teste de integração' } } })).registro
  assert(record.id); assert.equal((await request(`/${fixtureId}/dados`, 'POST', { token: runtime.token, colecao: 'itens', operacao: 'listar' })).total, 1)
  await request(`/${fixtureId}/dados`, 'POST', { token: runtime.token, colecao: 'itens', operacao: 'excluir', id: record.id, expectedVersion: record.versao_concorrencia }); checks.push('Real app data create/list/delete')
  b = await request('/' + fixtureId); await request(`/${fixtureId}/despublicar`, 'POST', { expectedVersion: b.app.versao_concorrencia })
  await request(`/${fixtureId}/dados`, 'POST', { token: runtime.token, colecao: 'itens', operacao: 'listar' }, 409); checks.push('Unpublish revokes existing runtime session')
  b = await request('/' + fixtureId); await request(`/${fixtureId}/excluir`, 'POST', { expectedVersion: b.app.versao_concorrencia }); fixtureId = undefined; checks.push('Temporary test app moved to trash')
 }
 for (const path of ['/api/tables/bases', '/api/whatsapp/conexao']) { const r = await fetch(origin + path, { headers: { Authorization: 'Bearer ' + token.jwt }, signal: AbortSignal.timeout(45000) }); assert.equal(r.status, 200) } checks.push('Tables and WhatsApp authenticated read regression')
 const report = { status: 'passed', deploymentId: staged.id, origin, realClerk: true, realSupabase: true, realStorage: !production, fixtureInTrash: !production, checks, generatedAt: new Date().toISOString() }; writeFileSync('.cache/apps/deployment/' + (production ? 'production' : 'staged') + '-http.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
} catch (e) {
 if (fixtureId && request) { try { const b = await request('/' + fixtureId); await request(`/${fixtureId}/excluir`, 'POST', { expectedVersion: b.app.versao_concorrencia }) } catch {} }
 console.error(JSON.stringify({ status: 'failed', checks, message: e instanceof assert.AssertionError ? e.message : 'Deployment HTTP validation failed; credentials omitted.' })); process.exitCode = 1
} finally { await db.end() }

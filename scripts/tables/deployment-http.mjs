import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import dotenv from 'dotenv'
import { createClerkClient } from '@clerk/backend'
import { connection } from '../erp/evolution-db.mjs'

const env = dotenv.parse(readFileSync('.env.local')), staged = JSON.parse(readFileSync('.cache/tables/deployment/deployment.json'))
const production = process.argv.includes('--production'), origin = production ? 'https://cognito-seven.vercel.app' : 'https://' + staged.url, db = connection(), checks = []
let fixtureBase, request
try {
  await db.connect()
  // Same verified owner/session used by this project's existing deployment checks.
  const owner = (await db.query("SELECT u.clerk_user_id,e.clerk_organization_id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'")).rows[0]; assert(owner)
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY }), sessions = await clerk.sessions.getSessionList({ userId: owner.clerk_user_id, status: 'active', limit: 100 })
  const session = sessions.data.find(s => s.lastActiveOrganizationId === owner.clerk_organization_id) || sessions.data.find(s => !s.lastActiveOrganizationId); assert(session, 'Active authorized session required')
  request = async (path, method = 'GET', body, expected = 200) => {
    const token = await clerk.sessions.getToken(session.id, undefined, 60)
    const r = await fetch(origin + '/api/tables' + path, { method, headers: { Authorization: 'Bearer ' + token.jwt, Origin: origin, 'Content-Type': 'application/json' }, ...(method !== 'GET' ? { body: JSON.stringify(body || {}) } : {}), signal: AbortSignal.timeout(45000) })
    assert.equal(r.status, expected, method + ' ' + path + ' HTTP ' + r.status); assert.match(r.headers.get('cache-control') || '', /no-store/)
    return r.json()
  }
  const anon = await fetch(origin + '/api/tables/sessao', { redirect: 'manual' }); assert.equal(anon.status, 401); checks.push('anonymous_api_requires_login')
  const auth = await request('/sessao'); assert.equal(auth.podeEditar, true); assert(Array.isArray(auth.bases)); checks.push('real_clerk_and_active_company')
  const pageToken = await clerk.sessions.getToken(session.id, undefined, 60)
  const page = await fetch(origin + '/tables', { headers: { Authorization: 'Bearer ' + pageToken.jwt }, signal: AbortSignal.timeout(45000) }); assert.equal(page.status, 200); assert.match(await page.text(), /Tables/); checks.push('authenticated_page_renders')
  if (!production) {
    let created
    const previousProof = '.cache/tables/deployment/staged-http.json'
    if (existsSync(previousProof)) {
      const previous = JSON.parse(readFileSync(previousProof))
      if (previous.status === 'passed' && previous.temporaryBaseId) {
        const fixture = (await db.query("SELECT b.id,t.id tabela_id FROM tables.bases b JOIN tables.tabelas t ON t.empresa_id=b.empresa_id AND t.base_id=b.id WHERE b.empresa_id=2 AND b.id=$1 AND b.criado_por=3 AND b.nome LIKE 'Validação temporária Tables %' AND b.excluido_em IS NOT NULL AND t.excluido_em IS NULL ORDER BY t.criado_em LIMIT 1", [previous.temporaryBaseId])).rows[0]
        if (fixture) { await request('/lixeira/bases/' + fixture.id, 'POST'); created = { base: { id: fixture.id }, tabela: { id: fixture.tabela_id } } }
      }
    }
    created ??= await request('/bases', 'POST', { nome: 'Validação temporária Tables ' + randomUUID().slice(0, 8), modelo: 'projetos' }, 201); fixtureBase = created.base.id
    const table = created.tabela, bundle = await request('/tabelas/' + table.id), name = bundle.campos.find(f => f.tipo === 'texto'), status = bundle.campos.find(f => f.tipo === 'selecao')
    let record = (await request('/tabelas/' + table.id + '/registros', 'POST', { valores: { [name.id]: 'Teste de integração', [status.id]: [status.opcoes[0].id] }, expectedStructureVersion: bundle.tabela.versao_estrutura }, 201)).registro
    const staleVersion = record.versao
    record = (await request('/registros/' + record.id, 'PATCH', { valores: { [name.id]: 'Teste atualizado' }, expectedVersion: record.versao, expectedStructureVersion: bundle.tabela.versao_estrutura })).registro
    await request('/registros/' + record.id, 'PATCH', { valores: {}, expectedVersion: staleVersion, expectedStructureVersion: bundle.tabela.versao_estrutura }, 409)
    checks.push('real_database_crud_and_version_conflict')
    await request('/tabelas/' + table.id + '/campos/' + status.id, 'DELETE', { expectedVersion: bundle.tabela.versao_estrutura })
    assert((await request('/lixeira')).itens.some(i => i.id === status.id && i.tipo === 'campos'))
    await request('/lixeira/campos/' + status.id, 'POST')
    assert.deepEqual((await request('/registros/' + record.id)).registro.valores[status.id], [status.opcoes[0].id]); checks.push('real_field_restore_preserves_values')
    const current = await request('/tabelas/' + table.id)
    const { campo } = await request('/tabelas/' + table.id + '/campos', 'POST', { nome: 'Anexos de teste', tipo: 'anexo', expectedStructureVersion: current.tabela.versao_estrutura }, 201)
    record = (await request('/registros/' + record.id)).registro
    const bytes = Buffer.from('Tables: validação de anexo privado.\n')
    const upload = await request('/registros/' + record.id + '/anexos', 'POST', { nome: 'validacao-tables.txt', tamanho: bytes.length, mime_type: 'text/plain', campo_id: campo.id, expectedVersion: record.versao }, 201)
    const sent = await fetch(upload.upload_url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: bytes }); assert(sent.ok, 'Upload HTTP ' + sent.status)
    await request('/anexos/' + upload.anexo_id + '/confirmar', 'POST')
    const { url } = await request('/anexos/' + upload.anexo_id + '/download'), download = await fetch(url); assert(download.ok); assert.match(download.headers.get('content-disposition') || '', /attachment/); assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes)
    const unsigned = new URL(url); unsigned.search = ''; assert(!(await fetch(unsigned)).ok)
    await request('/anexos/' + upload.anexo_id, 'DELETE'); checks.push('real_private_upload_confirm_download_remove')
    const base = (await request('/bases/' + fixtureBase)).base
    await request('/bases/' + fixtureBase, 'DELETE', { expectedVersion: base.versao })
    assert(!(await request('/bases')).bases.some(b => b.id === fixtureBase)); checks.push('temporary_fixture_removed_from_workspace')
  }
  const report = { status: 'passed', deploymentId: staged.id, origin, checks, temporaryBaseId: fixtureBase, temporaryBaseInTrash: Boolean(fixtureBase), generatedAt: new Date().toISOString() }
  writeFileSync('.cache/tables/deployment/' + (production ? 'production' : 'staged') + '-http.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
} catch (error) {
  if (fixtureBase && request) {
    try { const base = (await request('/bases/' + fixtureBase)).base; await request('/bases/' + fixtureBase, 'DELETE', { expectedVersion: base.versao }) } catch {}
  }
  console.error(JSON.stringify({ status: 'failed', checks, message: error instanceof assert.AssertionError ? error.message : 'HTTP validation failed; credentials omitted.', temporaryBaseId: fixtureBase })); process.exitCode = 1
} finally { await db.end() }

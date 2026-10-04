import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { connection } from './erp/evolution-db.mjs'
import { closePool } from '../src/lib/postgres'
import { ERP_CAPABILITIES, type ErpAccessProfile } from '../src/products/erp/shared/professionalContracts'
import { handlePluginRequest, type HttpDependencies } from '../src/products/chatgptplugin/mcp/handleRequest'
import { executionDependencies } from '../src/products/chatgptplugin/application/executeTool'
import { closePluginDatabase } from '../src/products/chatgptplugin/shared/database'
import { consumeRequestLimit } from '../src/products/chatgptplugin/audit/executionRepository'
import { PluginError, type PluginPrincipal } from '../src/products/chatgptplugin/shared/contracts'
import { MODERN_VERSION } from '../src/products/chatgptplugin/mcp/modernProtocol'
import type { PluginConfig } from '../src/products/chatgptplugin/shared/config'

// HTTP local -> handler MCP real -> repositorios reais -> Supabase.
// A autenticacao de teste existe apenas nesta instancia em memoria, em loopback.
// Nao altera o endpoint da aplicacao nem configura/desativa OAuth em producao.
// RPC restrito a descoberta e consultas. Auditoria e limites sao os reais.
loadEnv({ path: '.env.local', quiet: true })
const client: {
  connect: () => Promise<void>
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, any>[] }>
  end: () => Promise<void>
} = connection()
const testToken = randomBytes(32).toString('hex')
const restrictedToken = randomBytes(32).toString('hex')
const report = {
  mode: 'loopback_http_real_supabase', oauthVerified: false,
  commercialWrites: false, operationalAuditWrites: true,
  missingProductionConfiguration: ['CHATGPTPLUGIN_BASE_URL','CHATGPTPLUGIN_OAUTH_ISSUER','CHATGPTPLUGIN_OAUTH_CLIENT_IDS','CLERK_SECRET_KEY','NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'].filter(key => !process.env[key]),
  date: new Date().toISOString(), status: 'running', checks: [] as { name: string; status: string; elapsedMs: number; code?: string }[],
  companyId: null as number | null, payableInstallments: null as number | null,
}
let settings: PluginConfig
let dependencies: HttpDependencies
let sequence = 0
let phase = 'connect'
const ids: string[] = []
const server = createServer(async (request, response) => {
  try {
    if (request.url !== '/api/mcp' || request.method !== 'POST') { response.writeHead(404).end(); return }
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of request) {
      size += chunk.length
      if (size > 65536) { response.writeHead(413).end(); return }
      chunks.push(Buffer.from(chunk))
    }
    const headers = new Headers()
    for (const [name, value] of Object.entries(request.headers)) if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(',') : value)
    const result = await handlePluginRequest(new Request(settings.resource, { method: 'POST', headers, body: Buffer.concat(chunks) }), dependencies)
    response.writeHead(result.status, Object.fromEntries(result.headers))
    response.end(Buffer.from(await result.arrayBuffer()))
  } catch { response.writeHead(500).end('Local test server failure') }
})
async function rpc(method: string, params: Record<string, unknown> = {}, options: { modern?: boolean; authorization?: string } = {}) {
  const modern = options.modern === true
  const id = ++sequence
  const response = await fetch(settings.resource, {
    method: 'POST', signal: AbortSignal.timeout(20000),
    headers: {
      'content-type': 'application/json', accept: 'application/json, text/event-stream',
      ...(options.authorization === '' ? {} : { authorization: 'Bearer ' + (options.authorization || testToken) }),
      ...(modern ? { 'mcp-protocol-version': MODERN_VERSION, 'mcp-method': method,
        ...(params.name ? { 'mcp-name': String(params.name) } : {}) } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params: modern
      ? { ...params, _meta: { 'io.modelcontextprotocol/protocolVersion': MODERN_VERSION, 'io.modelcontextprotocol/clientCapabilities': {} } }
      : params }),
  })
  const body = await response.json()
  if (body.result?.structuredContent?.execution_id) ids.push(body.result.structuredContent.execution_id)
  else if (body.result?.isError && body.result.content?.[0]?.text) {
    const failure = JSON.parse(body.result.content[0].text)
    if (failure.execution_id) ids.push(failure.execution_id)
  }
  return { status: response.status, body }
}
async function call(name: string, args: Record<string, unknown>, modern = false) {
  const result = await rpc('tools/call', { name, arguments: args }, { modern })
  assert.equal(result.status, 200, 'HTTP_' + result.status)
  assert(!result.body.error, 'RPC_ERROR')
  if (result.body.result?.isError) throw new PluginError(JSON.parse(result.body.result.content[0].text).code, 'Ferramenta recusou consulta')
  assert.equal(result.body.result?.structuredContent?.ok, true, 'INVALID_TOOL_RESPONSE')
  assert.equal(JSON.parse(result.body.result.content[0].text).execution_id, result.body.result.structuredContent.execution_id)
  return result.body.result.structuredContent
}
async function check(name: string, fn: () => Promise<void>) {
  const started = Date.now()
  try { await fn(); report.checks.push({ name, status: 'passed', elapsedMs: Date.now() - started }); console.log('PASS ' + name) }
  catch (error) {
    const code = String((error as { code?: string }).code || (error as Error).name)
    report.checks.push({ name, status: 'failed', elapsedMs: Date.now() - started, code })
    console.log('FAIL ' + name + ' [' + code + ']')
  }
}
type RecordRow = Record<string, string | number>
async function main() {
  await client.connect()
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  const identity = (await client.query(`SELECT m.user_id,m.tenant_id,
    (SELECT count(*) FROM erp.contas_pagar_parcelas p JOIN erp.contas_pagar c ON c.tenant_id=p.tenant_id AND c.id=p.conta_pagar_id
     WHERE p.tenant_id=m.tenant_id AND p.excluido_em IS NULL AND c.excluido_em IS NULL) AS parcels
    FROM shared.tenant_memberships m JOIN shared.tenants t ON t.id=m.tenant_id
    WHERE m.status='active' AND t.status='active' AND m.role IN ('owner','admin')
    ORDER BY parcels DESC,m.tenant_id,m.user_id LIMIT 1`)).rows[0]
  assert(identity, 'ACTIVE_TEST_MEMBERSHIP_REQUIRED')
  const memberships = (await client.query(`SELECT t.id,t.name,m.role,m.erp_profile_id,
    coalesce(array_agg(p.capability) FILTER (WHERE p.capability IS NOT NULL),ARRAY[]::text[]) capabilities
    FROM shared.tenant_memberships m JOIN shared.tenants t ON t.id=m.tenant_id
    LEFT JOIN shared.erp_profile_permissions p ON p.profile_id=m.erp_profile_id
    WHERE m.user_id=$1 AND m.status='active' AND t.status='active'
    GROUP BY t.id,t.name,m.role,m.erp_profile_id ORDER BY t.id`, [identity.user_id])).rows
  const principal: PluginPrincipal = {
    userId: Number(identity.user_id), clerkUserId: 'user_local_read_test', clientId: 'mcp-local-read-test', scopes: ['erp:read'],
    companies: memberships.map(row => ({ id: Number(row.id), name: row.name, profile: row.erp_profile_id as ErpAccessProfile,
      capabilities: ['owner','admin'].includes(row.role) ? [...ERP_CAPABILITIES] : row.capabilities.filter((capability: string) => ERP_CAPABILITIES.includes(capability as typeof ERP_CAPABILITIES[number])) })),
  }
  const companyId = Number(identity.tenant_id)
  report.companyId = companyId
  const restricted: PluginPrincipal = { ...principal, companies: principal.companies.map(company => ({ ...company, capabilities: company.capabilities.filter(capability => !capability.startsWith('erp.financeiro.')) })) }
  await client.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)", [String(companyId), String(principal.userId)])
  await client.query('SET LOCAL ROLE erp_runtime')
  const today = (await client.query('SELECT CURRENT_DATE::text AS date')).rows[0].date
  const raw = (await client.query(`SELECT p.id::text,p.conta_pagar_id::text conta_id,c.descricao,e.nome fornecedor,
    p.numero_parcela,p.data_vencimento::text vencimento,p.valor,c.status conta_status,p.status parcela_status,c.tipo_lancamento
    FROM erp.contas_pagar_parcelas p JOIN erp.contas_pagar c ON c.tenant_id=p.tenant_id AND c.id=p.conta_pagar_id
    JOIN erp.entidades e ON e.tenant_id=c.tenant_id AND e.id=c.fornecedor_id
    WHERE p.tenant_id=$1 AND p.excluido_em IS NULL AND c.excluido_em IS NULL`, [companyId])).rows
  // Calculo independente em JS, a partir dos registros e movimentos do banco.
  const payments = (await client.query(`SELECT conta_pagar_parcela_id::text AS id,sum(valor) AS value FROM erp.pagamentos
    WHERE tenant_id=$1 AND estorno_de_pagamento_id IS NULL AND estornado_em IS NULL AND excluido_em IS NULL GROUP BY conta_pagar_parcela_id`, [companyId])).rows
  const credits = (await client.query(`SELECT conta_pagar_parcela_id::text AS id,valor,reversao_de_id FROM erp.adiantamentos_aplicacoes WHERE tenant_id=$1`, [companyId])).rows
  const agreements = (await client.query(`SELECT p.conta_pagar_parcela_id::text AS id,p.valor FROM erp.renegociacoes_parcelas p
    JOIN erp.renegociacoes r ON r.tenant_id=p.tenant_id AND r.id=p.renegociacao_id WHERE p.tenant_id=$1 AND p.papel='origem' AND r.status='efetivada'`, [companyId])).rows
  const expected: RecordRow[] = raw.map(row => {
    const paid = Number(payments.find(payment => payment.id === row.id)?.value || 0)
    const credit = credits.filter(credit => credit.id === row.id).reduce((sum, credit) => sum + Number(credit.valor) * (credit.reversao_de_id === null ? 1 : -1), 0)
    const transferred = agreements.filter(agreement => agreement.id === row.id).reduce((sum, agreement) => sum + Number(agreement.valor), 0)
    const value = Number(row.valor), balance = Math.round((value - paid - credit - transferred) * 100) / 100
    const status = row.conta_status === 'cancelado' || row.parcela_status === 'cancelado' ? 'cancelado'
      : transferred > 0 ? 'renegociado' : balance === 0 ? 'pago' : row.vencimento < today ? 'vencido'
      : paid + credit > 0 ? 'parcial' : row.parcela_status
    return { id: row.id, conta_id: row.conta_id, descricao: row.descricao || '', fornecedor: row.fornecedor || '', parcela: Number(row.numero_parcela),
      vencimento: row.vencimento, valor: value, valor_pago: paid, saldo: balance, status, tipo_lancamento: row.tipo_lancamento || '' }
  }).sort((a, b) => String(a.vencimento).localeCompare(String(b.vencimento)) || (String(a.id) < String(b.id) ? 1 : String(a.id) > String(b.id) ? -1 : 0))
  report.payableInstallments = expected.length
  await client.query('ROLLBACK')
  phase = 'local_http'
  await new Promise<void>(resolveListening => server.listen(0, '127.0.0.1', resolveListening))
  const address = server.address()
  assert(address && typeof address === 'object')
  const origin = 'http://127.0.0.1:' + address.port
  settings = { resource: origin + '/api/mcp', metadataUrl: origin + '/.well-known/oauth-protected-resource/api/mcp', issuer: 'https://oauth-test.invalid',
    scope: 'erp:read', clientIds: [principal.clientId], origins: [origin], requestsPerMinute: 60, toolTimeoutMs: 15000 }
  dependencies = { config: () => settings, execution: executionDependencies, limit: consumeRequestLimit,
    resolve: async request => {
      if (request.headers.get('authorization') === 'Bearer ' + testToken) return principal
      if (request.headers.get('authorization') === 'Bearer ' + restrictedToken) return restricted
      throw new PluginError('UNAUTHENTICATED', 'Identidade de teste obrigatoria.', 401)
    } }
  const query = async (args: Record<string, unknown> = {}, modern = false) => (await call('consultar_financeiro', { empresa_id: companyId, tipo: 'pagar', ...args }, modern)).data
  const matches = (result: { records: RecordRow[]; total: number; page: number; pageSize: number }, rows: RecordRow[], page = 1, size = 20) => {
    assert.equal(result.page, page); assert.equal(result.pageSize, size); assert.equal(result.total, rows.length)
    assert.deepEqual(result.records, rows.slice((page - 1) * size, page * size))
  }
  await check('Inicializacao MCP por HTTP', async () => {
    const result = await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'local-live-read-test', version: '1' } })
    assert.equal(result.status, 200); assert.equal(result.body.result.serverInfo.name, 'cognito-chatgptplugin')
  })
  await check('Catalogo anuncia 24 tools', async () => {
    const result = await rpc('tools/list'); assert.equal(result.status, 200); assert.equal(result.body.result.tools.length, 24)
    assert(result.body.result.tools.some((tool: { name: string }) => tool.name === 'consultar_financeiro'))
  })
  await check('meu_acesso corresponde aos vinculos do Supabase', async () => {
    const result = await call('meu_acesso', {}); assert.equal(result.data.usuario_id, principal.userId); assert.deepEqual(result.data.empresas, principal.companies)
  })
  await check('Contas a pagar: campos, valores, fornecedor e vencimentos', async () => matches(await query(), expected))
  for (const status of ['aberto','pendente','pago','parcial','vencido','cancelado','renegociado']) {
    await check('Filtro de status: ' + status, async () => matches(await query({ status }), expected.filter(row => row.status === status)))
  }
  await check('Filtro de vencimento com limites inclusivos', async () => {
    assert(expected.length > 0, 'REAL_PAYABLE_DATA_REQUIRED')
    const due = String(expected[0].vencimento)
    matches(await query({ vencimento_inicio: due, vencimento_fim: due }), expected.filter(row => row.vencimento === due))
  })
  await check('Busca por descricao retorna registros correspondentes', async () => {
    assert(expected.length > 0, 'REAL_PAYABLE_DATA_REQUIRED')
    const description = String(expected[0].descricao)
    const result = await query({ busca: description })
    assert(result.records.some((row: RecordRow) => row.id === expected[0].id))
    assert(result.records.every((row: RecordRow) => expected.some(record => record.id === row.id)))
  })
  await check('Paginacao primeira pagina', async () => matches(await query({ pagina: 1, por_pagina: 10 }), expected, 1, 10))
  await check('Paginacao apos ultima pagina preserva total', async () => {
    const page = Math.floor(expected.length / 10) + 2
    matches(await query({ pagina: page, por_pagina: 10 }), expected, page, 10)
  })
  await check('Protocolo moderno consulta dados reais', async () => {
    const discovery = await rpc('server/discover', {}, { modern: true }); assert.equal(discovery.status, 200); assert.equal(discovery.body.result.resultType, 'complete')
    matches(await query({}, true), expected)
  })
  await check('Sem identificacao recusa HTTP com 401', async () => {
    const result = await rpc('tools/call', { name: 'meu_acesso', arguments: {} }, { authorization: '' }); assert.equal(result.status, 401)
  })
  await check('Permissao financeira removida recusa consulta', async () => {
    const result = await rpc('tools/call', { name: 'consultar_financeiro', arguments: { empresa_id: companyId, tipo: 'pagar' } }, { authorization: restrictedToken })
    assert.equal(result.body.result.isError, true); assert.equal(JSON.parse(result.body.result.content[0].text).code, 'ACCESS_DENIED')
  })
  await check('Empresa fora dos vinculos recusa consulta', async () => {
    const forbidden = Math.max(...principal.companies.map(company => company.id)) + 100000
    const result = await rpc('tools/call', { name: 'consultar_financeiro', arguments: { empresa_id: forbidden, tipo: 'pagar' } })
    assert.equal(result.body.result.isError, true); assert.equal(JSON.parse(result.body.result.content[0].text).code, 'ACCESS_DENIED')
  })
  await check('Periodo invertido recusa parametros', async () => {
    const result = await rpc('tools/call', { name: 'consultar_financeiro', arguments: { empresa_id: companyId, tipo: 'pagar', vencimento_inicio: '2026-12-31', vencimento_fim: '2026-01-01' } })
    assert.equal(result.body.result.isError, true); assert.equal(JSON.parse(result.body.result.content[0].text).code, 'INVALID_INPUT')
  })
  await check('Auditoria real registra sucesso e recusas das chamadas', async () => {
    await client.query('BEGIN READ ONLY')
    try {
      const rows = (await client.query('SELECT id::text,status,error_code,integration FROM plugin.executions WHERE id=ANY($1::uuid[])', [ids])).rows
      assert.equal(rows.length, ids.length); assert(rows.every(row => row.integration === 'chatgpt'))
      assert(rows.some(row => row.status === 'succeeded')); assert(rows.some(row => row.error_code === 'ACCESS_DENIED')); assert(rows.every(row => row.status !== 'running'))
    } finally { await client.query('ROLLBACK') }
  })
  report.status = report.checks.some(check => check.status === 'failed') ? 'failed' : 'passed'
  if (report.status === 'failed') process.exitCode = 1
}
void main().catch(error => {
  report.status = 'blocked'
  console.error(JSON.stringify({ status: 'blocked', phase, code: (error as { code?: string }).code || (error as Error).name }))
  process.exitCode = 1
}).finally(async () => {
  server.closeAllConnections()
  if (server.listening) await new Promise<void>(done => server.close(() => done()))
  await client.query('ROLLBACK').catch(() => undefined)
  await Promise.allSettled([client.end(), closePool(), closePluginDatabase()])
  const output = resolve('.cache/erp-audit/mcp-live-read.json')
  mkdirSync(resolve('.cache/erp-audit'), { recursive: true })
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ status: report.status, passed: report.checks.filter(check => check.status === 'passed').length,
    failed: report.checks.filter(check => check.status === 'failed').length, payableInstallments: report.payableInstallments,
    oauthVerified: false, realSupabase: true, report: output }))
})

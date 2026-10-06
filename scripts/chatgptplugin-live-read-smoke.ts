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
import { loadPluginPrincipal } from '../src/products/chatgptplugin/auth/resolvePrincipal'
import { consumeRequestLimit } from '../src/products/chatgptplugin/audit/executionRepository'
import { PluginError, type PluginPrincipal } from '../src/products/chatgptplugin/shared/contracts'
import { MODERN_VERSION } from '../src/products/chatgptplugin/mcp/modernProtocol'
import type { PluginConfig } from '../src/products/chatgptplugin/shared/config'
import { runReadToolCases } from './chatgptplugin-read-tool-cases'

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
  readCoverage: null as unknown,
}
let settings: PluginConfig
let dependencies: HttpDependencies
let sequence = 0
let phase = 'connect'
const allReadMode = process.argv.includes('--all-read')
const requestedCompany=Number(process.argv.find(arg=>arg.startsWith('--empresa='))?.slice(10))||null
assert(requestedCompany===null||(Number.isSafeInteger(requestedCompany)&&requestedCompany>0),'Invalid explicit company')
const demoMode = process.argv.includes('--demo') || allReadMode
const ids: string[] = []
const calledTools = new Set<string>()
let requestMinute = 0
let requestsThisMinute = 0
const server = createServer(async (request, response) => {
  try {
    if (request.url !== '/api/mcp' || !['POST','GET','OPTIONS'].includes(request.method || '')) { response.writeHead(404).end(); return }
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of request) {
      size += chunk.length
      if (size > 65536) { response.writeHead(413).end(); return }
      chunks.push(Buffer.from(chunk))
    }
    const headers = new Headers()
    for (const [name, value] of Object.entries(request.headers)) if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(',') : value)
    const result = await handlePluginRequest(new Request(settings.resource, { method: request.method, headers,
      ...(request.method === 'POST' ? { body: Buffer.concat(chunks) } : {}) }), dependencies)
    response.writeHead(result.status, Object.fromEntries(result.headers))
    response.end(Buffer.from(await result.arrayBuffer()))
  } catch { response.writeHead(500).end('Local test server failure') }
})
async function rpc(method: string, params: Record<string, unknown> = {}, options: { modern?: boolean; authorization?: string } = {}) {
  if (method === 'tools/call') {
    assert(!['preparar_rascunho','preparar_formulario_nativo','atualizar_configuracoes'].includes(String(params.name)), 'WRITE_TOOL_FORBIDDEN')
    calledTools.add(String(params.name))
  }
  let minute = Math.floor(Date.now() / 60000)
  if (requestMinute !== minute) { requestMinute = minute; requestsThisMinute = 0 }
  if (requestsThisMinute >= 45) {
    console.log('Aguardando próxima janela do limite real de consultas.')
    await new Promise(done => setTimeout(done, 60000 - Date.now() % 60000 + 100))
    minute = Math.floor(Date.now() / 60000); requestMinute = minute; requestsThisMinute = 0
  }
  requestsThisMinute++
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
    console.log('FAIL ' + name + ' [' + code + '] ' + String((error as Error).message).slice(0, 300))
  }
}
type RecordRow = Record<string, string | number>
async function main() {
  await client.connect()
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  const identity = (await client.query(`SELECT m.usuario_id,m.empresa_id,u.clerk_user_id,
    (SELECT count(*) FROM erp.contas_pagar_parcelas p JOIN erp.contas_pagar c ON c.empresa_id=p.empresa_id AND c.id=p.conta_pagar_id
     WHERE p.empresa_id=m.empresa_id AND p.excluido_em IS NULL AND c.excluido_em IS NULL) AS parcels
    FROM shared.usuarios_empresas m JOIN shared.empresas t ON t.id=m.empresa_id JOIN shared.usuarios u ON u.id=m.usuario_id
    WHERE m.status='active' AND t.status='active' AND u.status='active' AND NOT m.suspenso_localmente AND m.role IN ('owner','admin')
      AND ($1::bigint IS NULL OR m.empresa_id=$1)
    ORDER BY parcels DESC,m.empresa_id,m.usuario_id LIMIT 1`,[requestedCompany])).rows[0]
  assert(identity, 'ACTIVE_TEST_MEMBERSHIP_REQUIRED')
  const memberships = (await client.query(`SELECT t.id,t.name,m.role,m.perfil_acesso_id,
    coalesce(array_agg(p.capability) FILTER (WHERE p.capability IS NOT NULL),ARRAY[]::text[]) capabilities
    FROM shared.usuarios_empresas m JOIN shared.empresas t ON t.id=m.empresa_id
    LEFT JOIN shared.permissoes_perfil p ON p.perfil_acesso_id=m.perfil_acesso_id
    WHERE m.usuario_id=$1 AND m.status='active' AND t.status='active'
    GROUP BY t.id,t.name,m.role,m.perfil_acesso_id ORDER BY t.id`, [identity.usuario_id])).rows
  let principal: PluginPrincipal = {
    userId: Number(identity.usuario_id), clerkUserId: String(identity.clerk_user_id||'user_local_read_test'), clientId: 'mcp-local-read-test', scopes: ['erp:read'],
    companies: memberships.map(row => ({ id: Number(row.id), name: row.name, profile: row.perfil_acesso_id as ErpAccessProfile,
      capabilities: ['owner','admin'].includes(row.role) ? [...ERP_CAPABILITIES] : row.capabilities.filter((capability: string) => ERP_CAPABILITIES.includes(capability as typeof ERP_CAPABILITIES[number])) })),
  }
  const companyId = Number(identity.empresa_id)
  report.companyId = companyId
  if (identity.clerk_user_id) await check('Usuario Clerk resolve a empresa real e suas permissoes', async () => {
    const resolved = await loadPluginPrincipal(String(identity.clerk_user_id), principal.clientId, principal.scopes)
    assert.deepEqual(resolved, principal)
    principal = resolved
  })
  const otherCompany = (await client.query('SELECT empresa_id,count(*)::int records FROM erp.vendas WHERE empresa_id<>$1 GROUP BY empresa_id ORDER BY empresa_id LIMIT 1', [companyId])).rows[0]
  const restricted: PluginPrincipal = { ...principal, companies: principal.companies.map(company => ({ ...company, capabilities: company.capabilities.filter(capability => !capability.startsWith('erp.financeiro.')) })) }
  await client.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)", [String(companyId), String(principal.userId)])
  await client.query('SET LOCAL ROLE erp_runtime')
  if (otherCompany) await check('Isolamento no banco oculta vendas de outra empresa existente', async () => {
    assert(Number(otherCompany.records) > 0)
    assert.equal((await client.query('SELECT id FROM erp.vendas WHERE empresa_id=$1', [otherCompany.empresa_id])).rows.length, 0)
  })
  const today = (await client.query('SELECT CURRENT_DATE::text AS date')).rows[0].date
  const raw = (await client.query(`SELECT p.id::text,p.conta_pagar_id::text conta_id,c.descricao,e.nome fornecedor,
    p.numero_parcela,p.data_vencimento::text vencimento,p.valor,c.status conta_status,p.status parcela_status,c.tipo_lancamento
    FROM erp.contas_pagar_parcelas p JOIN erp.contas_pagar c ON c.empresa_id=p.empresa_id AND c.id=p.conta_pagar_id
    JOIN erp.entidades e ON e.empresa_id=c.empresa_id AND e.id=c.fornecedor_id
    WHERE p.empresa_id=$1 AND p.excluido_em IS NULL AND c.excluido_em IS NULL`, [companyId])).rows
  // Calculo independente em JS, a partir dos registros e movimentos do banco.
  const payments = (await client.query(`SELECT conta_pagar_parcela_id::text AS id,sum(valor) AS value FROM erp.pagamentos
    WHERE empresa_id=$1 AND estorno_de_pagamento_id IS NULL AND estornado_em IS NULL AND excluido_em IS NULL GROUP BY conta_pagar_parcela_id`, [companyId])).rows
  const credits = (await client.query(`SELECT conta_pagar_parcela_id::text AS id,valor,reversao_de_id FROM erp.adiantamentos_aplicacoes WHERE empresa_id=$1`, [companyId])).rows
  const agreements = (await client.query(`SELECT p.conta_pagar_parcela_id::text AS id,p.valor FROM erp.renegociacoes_parcelas p
    JOIN erp.renegociacoes r ON r.empresa_id=p.empresa_id AND r.id=p.renegociacao_id WHERE p.empresa_id=$1 AND p.papel='origem' AND r.status='efetivada'`, [companyId])).rows
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
  // Independent reference queries for the optional realistic demonstration.
  let demoExpected: any = null
  if (demoMode) {
    const counts = (await client.query(`SELECT
      (SELECT count(*)::int FROM erp.vendas WHERE empresa_id=$1 AND tipo_documento IN ('venda','pedido') AND excluido_em IS NULL) sales,
      (SELECT count(*)::int FROM erp.compras WHERE empresa_id=$1 AND excluido_em IS NULL) purchases,
      (SELECT count(*)::int FROM erp.contas_receber_parcelas WHERE empresa_id=$1 AND excluido_em IS NULL) receivables,
      (SELECT count(*)::int FROM erp.saldos_estoque WHERE empresa_id=$1) stock,
      (SELECT count(*)::int FROM erp.entidades WHERE empresa_id=$1 AND eh_cliente AND ativo AND excluido_em IS NULL) customers`, [companyId])).rows[0]
    const sale = (await client.query(`SELECT v.id::text,v.numero,v.total,
      (SELECT count(*)::int FROM erp.vendas_itens i WHERE i.empresa_id=v.empresa_id AND i.venda_id=v.id) items
      FROM erp.vendas v WHERE v.empresa_id=$1 AND v.status='confirmada' ORDER BY v.id LIMIT 1`, [companyId])).rows[0]
    const purchase = (await client.query(`SELECT v.id::text,v.numero,v.total,
      (SELECT count(*)::int FROM erp.compras_itens i WHERE i.empresa_id=v.empresa_id AND i.compra_id=v.id) items
      FROM erp.compras v WHERE v.empresa_id=$1 AND v.status='recebida' ORDER BY v.id LIMIT 1`, [companyId])).rows[0]
    const receivables = (await client.query(`SELECT p.id::text,p.valor,e.nome cliente,t.descricao,
      coalesce((SELECT sum(m.valor) FROM erp.pagamentos m WHERE m.empresa_id=p.empresa_id AND m.conta_receber_parcela_id=p.id AND m.estornado_em IS NULL AND m.estorno_de_pagamento_id IS NULL AND m.excluido_em IS NULL),0) paid
      FROM erp.contas_receber_parcelas p JOIN erp.contas_receber t ON t.empresa_id=p.empresa_id AND t.id=p.conta_receber_id
      JOIN erp.entidades e ON e.empresa_id=t.empresa_id AND e.id=t.cliente_id WHERE p.empresa_id=$1`, [companyId])).rows
    demoExpected = { counts, sale, purchase, receivables }
    assert.equal(counts.sales, 150, 'FULL_DEMO_DATA_REQUIRED')
    assert.equal(counts.purchases, 60)
  }
  await client.query('ROLLBACK')
  const currentWindow = (await client.query("SELECT requests FROM plugin.rate_windows WHERE user_id=$1 AND integration='chatgpt' AND window_start=date_trunc('minute',now())", [principal.userId])).rows[0]
  requestMinute = Math.floor(Date.now() / 60000)
  requestsThisMinute = Number(currentWindow?.requests || 0)
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
  await check('Catalogo anuncia 33 tools', async () => {
    const result = await rpc('tools/list'); assert.equal(result.status, 200); assert.equal(result.body.result.tools.length,33)
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
  if (demoMode) {
    await check('Demo: contas a receber e saldos independentes', async () => {
      const result = (await call('consultar_financeiro', { empresa_id: companyId, tipo: 'receber' })).data
      assert.equal(result.total, demoExpected.counts.receivables)
      assert(result.records.length > 0)
      for (const row of result.records) {
        const reference = demoExpected.receivables.find((r: any) => r.id === row.id)
        assert(reference)
        assert.equal(row.cliente, reference.cliente)
        assert.equal(row.descricao, reference.descricao)
        assert.equal(Number(row.valor), Number(reference.valor))
        assert.equal(Number(row.valor_pago), Number(reference.paid))
        assert.equal(Math.round(Number(row.saldo) * 100), Math.round((Number(reference.valor) - Number(reference.paid)) * 100))
      }
    })
    await check('Demo: pagar com vencimento entre 7 e 13 de outubro', async () => {
      const selected = expected.filter(r => String(r.vencimento) >= '2026-10-07' && String(r.vencimento) <= '2026-10-13')
      assert(selected.length > 0)
      matches(await query({ vencimento_inicio: '2026-10-07', vencimento_fim: '2026-10-13' }), selected)
    })
    await check('Demo: 150 vendas disponíveis para consulta', async () => {
      const result = (await call('listar_vendas', { empresa_id: companyId })).data
      assert.equal(result.total, demoExpected.counts.sales)
      assert(result.records.length > 0)
    })
    await check('Demo: detalhes e itens de uma venda', async () => {
      const result = (await call('obter_venda', { empresa_id: companyId, venda_id: Number(demoExpected.sale.id) })).data
      assert.equal(result.sale.numero, demoExpected.sale.numero)
      assert.equal(Number(result.sale.total), Number(demoExpected.sale.total))
      assert.equal(result.totalItems, demoExpected.sale.items)
    })
    await check('Demo: 60 compras disponíveis para consulta', async () => {
      const result = (await call('listar_compras', { empresa_id: companyId })).data
      assert.equal(result.total, demoExpected.counts.purchases)
      assert(result.records.length > 0)
    })
    await check('Demo: detalhes e itens de uma compra', async () => {
      const result = (await call('obter_compra', { empresa_id: companyId, compra_id: Number(demoExpected.purchase.id) })).data
      assert.equal(result.purchase.numero, demoExpected.purchase.numero)
      assert.equal(Number(result.purchase.total), Number(demoExpected.purchase.total))
      assert.equal(result.totalItems, demoExpected.purchase.items)
    })
    await check('Demo: estoque por produto e local sem saldo negativo', async () => {
      const result = (await call('consultar_estoque', { empresa_id: companyId, por_pagina: 50 })).data
      assert.equal(result.total, demoExpected.counts.stock)
      assert(result.records.every((row: any) => Number(row.quantidade_fisica) >= 0))
    })
    await check('Demo: resumo do ERP reconhece os 30 clientes', async () => {
      const result = (await call('resumo_erp', { empresa_id: companyId })).data
      assert.equal(result.clientesAtivos, demoExpected.counts.customers)
      assert(result.saldoReceber > 0 && result.saldoPagar > 0)
    })
  }
  if (allReadMode) {
    phase = 'all_read_tools'
    const facts = await runReadToolCases({ client, companyId, userId: principal.userId, clientId: principal.clientId,
      resource: settings.resource, token: testToken, rpc, call, check })
    await check('Cobertura: todas as 30 tools de leitura foram chamadas', async () => {
      const result = await rpc('tools/list')
      const names = result.body.result.tools.filter((tool: any) => tool.annotations?.readOnlyHint).map((tool: any) => tool.name).sort()
      assert.deepEqual([...calledTools].sort(), names)
      report.readCoverage = { ...facts, readTools: names.length, toolNames: names, writeToolsCalled: 0 }
    })
  }
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
  if (otherCompany && !principal.companies.some(company => company.id === Number(otherCompany.empresa_id))) await check('Tool recusa acesso a outra empresa existente', async () => {
    const result = await rpc('tools/call', { name: 'listar_vendas', arguments: { empresa_id: Number(otherCompany.empresa_id) } })
    assert.equal(result.body.result.isError, true)
    assert.equal(JSON.parse(result.body.result.content[0].text).code, 'ACCESS_DENIED')
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
  const output = resolve('.cache/erp-audit/' + (allReadMode ? 'mcp-all-read.json' : 'mcp-live-read.json'))
  mkdirSync(resolve('.cache/erp-audit'), { recursive: true })
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ status: report.status, passed: report.checks.filter(check => check.status === 'passed').length,
    failed: report.checks.filter(check => check.status === 'failed').length, payableInstallments: report.payableInstallments,
    oauthVerified: false, realSupabase: true, report: output }))
})

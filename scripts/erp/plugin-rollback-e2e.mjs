import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { randomUUID } from 'node:crypto'
import vm from 'node:vm'
import ts from 'typescript'

// Teste ponta a ponta do plugin (ChatGPT e Claude) pelas ferramentas do chat, como o usuário usa: prévia → confirmação.
//   node scripts/erp/plugin-rollback-e2e.mjs --local                → banco local (PGlite) com dados fictícios
//   node scripts/erp/plugin-rollback-e2e.mjs --prod --email=<email> → banco real, TUDO numa transação desfeita no fim
// No modo --prod: aplica as migrações pendentes dentro da transação, executa as ferramentas como o usuário do e-mail
// e termina sempre com ROLLBACK. Nada é gravado. As tabelas ficam travadas enquanto o teste roda.
const args = process.argv.slice(2), prod = args.includes('--prod'), email = (args.find(a => a.startsWith('--email=')) || '').slice(8)
if (prod && !email) throw new Error('Informe --email=')
const PENDING = ['20261007120000_empresa_fuso_horario.sql', '20261007130000_erp_anexos_bucket.sql', '20261008100000_erp_rls_contexto.sql',
  '20261008110000_erp_validacao_escopo.sql', '20261008120000_erp_estabilidade_fase0.sql', '20261008130000_erp_comercial_fase1.sql',
  '20261008140000_erp_devolucoes.sql', '20261008150000_erp_permissoes_vendedor.sql', '20261009100000_erp_dre_categorias.sql',
  '20261009110000_erp_anexos.sql', '20261009120000_erp_conciliacao_cartao.sql', '20261009130000_erp_orcamento_metas.sql']

const root = resolve('.'), require = createRequire(import.meta.url), cache = new Map(), stubs = {}
function load(name, parent = resolve(root, 'entry.ts')) {
  if (Object.hasOwn(stubs, name)) return stubs[name]
  if (!name.startsWith('.') && !name.startsWith('@/') && !name.startsWith(root)) return require(name)
  let file = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(parent), name)
  if (!existsSync(file)) file = ['.ts', '.tsx', '/index.ts'].map(s => file + s).find(existsSync)
  assert(file, `Módulo ausente: ${name}`); if (cache.has(file)) return cache.get(file).exports
  const record = { exports: {} }; cache.set(file, record)
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  vm.runInThisContext('(function(require,module,exports){' + source + '\n})', { filename: file })(dep => load(dep, file), record, record.exports)
  return record.exports
}

// ---- conexão: PGlite local ou o Postgres real numa transação única ----
let db, closeDb
if (prod) {
  const { connection } = await import('./evolution-db.mjs')
  const client = connection(); await client.connect()
  db = { query: (sql, params) => client.query(sql, params), exec: sql => client.query(sql) }
  closeDb = () => client.end()
} else {
  const fixture = await import('./evolution-fixture.mjs')
  db = { query: (sql, params) => fixture.db.query(sql, params), exec: sql => fixture.db.exec(sql) }
  closeDb = () => fixture.db.close()
}

const postgres = load('@/lib/postgres'), context = load('@/lib/erpDatabaseContext')
let queue = Promise.resolve(), savepoint = 0
async function erpContext(saved) {
  await db.exec('SET LOCAL ROLE erp_runtime')
  await db.query("SELECT set_config('app.erp_empresa_id',$1,true),set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true),set_config('app.erp_time_zone',$3,true)",
    [String(saved.tenantId), String(saved.userId), saved.timeZone || 'America/Sao_Paulo'])
}
// As transações do ERP viram savepoints dentro da transação externa; restrições adiadas são conferidas antes de liberar.
stubs['@/lib/postgres'] = { ...postgres,
  runQuery(sql, params) {
    const ambient = postgres.getErpTransactionClient(); if (ambient) return ambient.query(sql, params).then(r => r.rows)
    const saved = context.getErpDatabaseContext()
    const task = queue.then(async () => {
      postgres.assertErpTenantScopedQuery(sql, params)
      const name = 'rq' + (++savepoint); await db.exec('SAVEPOINT ' + name)
      try { if (saved) await erpContext(saved); return (await db.query(sql, params)).rows } catch (error) { dbErrors.push(error.code + ' ' + error.message); throw error }
      finally { await db.exec(`ROLLBACK TO SAVEPOINT ${name}; RELEASE SAVEPOINT ${name}`); await db.exec('RESET ROLE') }
    }); queue = task.catch(() => undefined); return task
  },
  withTransaction(fn) {
    const ambient = postgres.getErpTransactionClient(); if (ambient) return fn(ambient)
    const saved = context.getErpDatabaseContext()
    const task = queue.then(async () => {
      const name = 'wt' + (++savepoint); await db.exec('SAVEPOINT ' + name)
      const client = { release() {}, async query(sql, params) {
        postgres.assertErpTenantScopedQuery(sql, params)
        const erp = /\berp\.[a-z_][a-z0-9_]*/i.test(sql)
        if (erp && saved) await erpContext(saved)
        try { return await db.query(sql, params) } catch (error) { dbErrors.push(error.code + ' ' + error.message); throw error } finally { if (erp && saved) await db.exec('RESET ROLE') }
      } }
      try {
        const result = await fn(client)
        if (saved) await erpContext(saved)
        await db.exec('SET CONSTRAINTS ALL IMMEDIATE'); await db.exec('SET CONSTRAINTS ALL DEFERRED')
        await db.exec('RESET ROLE'); await db.exec('RELEASE SAVEPOINT ' + name)
        return result
      } catch (error) { await db.exec('RESET ROLE').catch(() => {}); await db.exec(`ROLLBACK TO SAVEPOINT ${name}; RELEASE SAVEPOINT ${name}`); throw error }
    }); queue = task.catch(() => undefined); return task
  } }
stubs['../shared/database'] = { pluginQuery: async (sql, params) => (await db.query(sql, params)).rows }
stubs['@clerk/nextjs/server'] = { clerkClient: () => { throw new Error('Autenticação externa não é usada no teste') } }

const steps = [], dbErrors = []
const started = Date.now()
try {
  if (prod) { await db.exec('BEGIN'); await db.exec("SET LOCAL lock_timeout = '15s'"); await db.exec("SET LOCAL statement_timeout = '180s'") }
  else {
    // Banco local com o mesmo histórico de migrações dos testes do plugin.
    const fixture = await import('./evolution-fixture.mjs'); await fixture.restoreCatalog()
    for (const f of ['01-integridade-historicos.sql', '02-periodos-fechados.sql', '03-cadastros-documentos-contratos.sql', '04-adiantamentos-renegociacoes.sql']) await db.exec(readFileSync('scripts/erp/sql/' + f, 'utf8'))
    for (const f of ['20260909033000_drop_erp_financial_views.sql', '20260909040000_harden_erp_service_integrity.sql', '20261003170000_harden_erp_read_access.sql', '20261005020000_harden_erp_stock_operations.sql', '20261005021000_anchor_contract_cycles.sql',
      '20261003130000_create_chatgptplugin.sql', '20261003140000_chatgptplugin_drafts.sql', '20261003150000_chatgptplugin_operations_settings.sql', '20261003160000_create_plugin_schema.sql']) await db.exec(readFileSync('supabase/migrations/' + f, 'utf8'))
    const { applySharedMigration } = await import('../shared/schema-contract.mjs'); await applySharedMigration(db)
    for (const f of ['20261006010000_prepare_erp_fiscal_integration.sql', '20261006020000_service_invoice_simulation.sql']) await db.exec(readFileSync('supabase/migrations/' + f, 'utf8'))
    await db.exec(`INSERT INTO shared.empresas(id,name,slug) VALUES(1,'Empresa local','local');
      INSERT INTO shared.usuarios(id,email,full_name,clerk_user_id) VALUES(1,'dono@example.invalid','Dono','user_local');
      INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role,status) VALUES(1,1,'owner','active');
      INSERT INTO erp.contas_financeiras(id,empresa_id,nome,tipo,saldo_inicial,data_saldo_inicial) VALUES(901,1,'Banco local','banco',0,'2026-01-01');`)
    await db.exec('BEGIN')
  }
  // Migrações pendentes, sem o BEGIN/COMMIT próprio (rodam dentro da transação do teste).
  const migrationsStart = Date.now()
  for (const file of PENDING) {
    if (!prod && file === '20261007130000_erp_anexos_bucket.sql') continue
    const sql = readFileSync('supabase/migrations/' + file, 'utf8').replace(/^\s*BEGIN;\s*$/m, '').replace(/^\s*COMMIT;\s*$/m, '')
    await db.exec(sql)
  }
  steps.push({ etapa: 'migracoes', ok: true, detalhe: `${PENDING.length} aplicadas em ${Math.round((Date.now() - migrationsStart) / 1000)} s` })

  const { loadPluginPrincipal } = load('@/products/mcpcore/auth/resolvePrincipal')
  const { executeTool } = load('@/products/mcpcore/application/executeTool')
  const { toolCallForProposal } = load('@/products/mcpcore/actions/catalog')
  const clerkId = prod ? (await db.query('SELECT clerk_user_id FROM shared.usuarios WHERE lower(email) = lower($1)', [email])).rows[0]?.clerk_user_id : 'user_local'
  assert(clerkId, 'Usuário não encontrado pelo e-mail')
  const principal = await loadPluginPrincipal(clerkId, 'e2e-rollback', ['erp:read', 'erp:write'])
  const company = principal.companies.find(c => c.profile === 'administrador') || principal.companies[0]
  assert(company, 'Usuário sem empresa ativa')
  const E = company.id
  const chatgpt = { integration: 'chatgpt', toolTimeoutMs: 30000, resource: 'https://erp.example.invalid/api/mcp', metadataUrl: 'https://erp.example.invalid/.well-known/oauth-protected-resource/api/mcp' }
  const claude = { ...chatgpt, integration: 'claude', resource: 'https://erp.example.invalid/api/claude/mcp', metadataUrl: 'https://erp.example.invalid/.well-known/oauth-protected-resource/api/claude/mcp' }

  async function tool(name, input, settings = chatgpt) {
    const result = await executeTool(principal, name, input, settings)
    if (result.isError) throw new Error(result.content?.[0]?.text?.slice(0, 400) || 'erro')
    return result.structuredContent.data
  }
  async function step(label, fn) {
    const begin = Date.now()
    try { const detalhe = await fn(); steps.push({ etapa: label, ok: true, ms: Date.now() - begin, ...(detalhe !== undefined ? { detalhe } : {}) }); return detalhe }
    catch (error) { steps.push({ etapa: label, ok: false, ms: Date.now() - begin, erro: String(error.message || error).slice(0, 300) + (dbErrors.length ? ' | banco: ' + dbErrors.at(-1).slice(0, 300) : '') }); return undefined }
    finally { dbErrors.length = 0 }
  }
  // Escrita pelo chat: prévia com chave_operacao → confirmação com rascunho_id na mesma ferramenta.
  async function write(proposal, settings = chatgpt) {
    const call = toolCallForProposal(proposal)
    const preview = await tool(call.name, { empresa_id: E, chave_operacao: randomUUID(), ...call.arguments }, settings)
    assert.equal(preview.etapa, 'previa', JSON.stringify(preview).slice(0, 300))
    const saved = await tool(call.name, { empresa_id: E, rascunho_id: preview.rascunho_id }, settings)
    assert.equal(saved.status, 'saved', JSON.stringify(saved).slice(0, 300))
    return Number(saved.registro_id)
  }
  const today = (await db.query("SELECT to_char((now() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS d")).rows[0].d
  const month = today.slice(0, 7), plus = days => new Date(Date.parse(today + 'T12:00:00Z') + days * 864e5).toISOString().slice(0, 10)
  const tag = 'TESTE-E2E ' + randomUUID().slice(0, 6)

  // ---- consultas ----
  await step('meu_acesso', async () => (await tool('meu_acesso', {})).empresas.length + ' empresa(s)')
  await step('resumo_erp', () => tool('resumo_erp', { empresa_id: E }).then(() => 'ok'))
  for (const tipo of ['clientes', 'fornecedores', 'vendedores', 'produtos', 'servicos', 'categorias', 'categorias-cadastro', 'contas-financeiras'])
    await step('buscar_cadastros ' + tipo, async () => (await tool('buscar_cadastros', { empresa_id: E, tipo })).records.length + ' registro(s)')
  await step('listar_vendas', async () => (await tool('listar_vendas', { empresa_id: E })).records.length + ' venda(s)')
  await step('listar_compras', async () => (await tool('listar_compras', { empresa_id: E })).records.length + ' compra(s)')
  for (const tipo of ['receber', 'pagar']) await step('consultar_financeiro ' + tipo, async () => (await tool('consultar_financeiro', { empresa_id: E, tipo })).records.length + ' parcela(s)')
  await step('listar_pagamentos', async () => (await tool('listar_pagamentos', { empresa_id: E })).records.length + ' pagamento(s)')
  await step('consultar_estoque', async () => (await tool('consultar_estoque', { empresa_id: E })).records.length + ' posição(ões)')
  await step('analisar_periodo vendas', () => tool('analisar_periodo', { empresa_id: E, tipo: 'vendas', inicio: `${today.slice(0, 4)}-01-01`, fim: today }).then(() => 'ok'))
  for (const tipo of ['dre', 'fluxo-de-caixa', 'aging-receber', 'aging-pagar', 'margem-itens', 'margem-clientes', 'orcado-realizado', 'metas', 'vendas-clientes', 'vendas-vendedores', 'comissoes', 'compras-fornecedores', 'dre-caixa'])
    await step('consultar_relatorio ' + tipo, async () => (await tool('consultar_relatorio', { empresa_id: E, tipo, inicio: `${today.slice(0, 4)}-01-01`, fim: today })).records.length + ' linha(s)')
  await step('consultar_relatorio dre (Claude)', async () => (await tool('consultar_relatorio', { empresa_id: E, tipo: 'dre', inicio: `${month}-01`, fim: today }, claude)).records.length + ' linha(s)')

  // ---- cadastros ----
  const ids = {}
  ids.receita = await step('criar categoria de receita (DRE grupo 1)', () => write({ tipo: 'categoria', dados: { nome: tag + ' receita', tipo: 'receita', dre_grupo_codigo: 1 } }))
  ids.despesa = await step('criar categoria de despesa (DRE grupo 5)', () => write({ tipo: 'categoria', dados: { nome: tag + ' despesa', tipo: 'despesa', dre_grupo_codigo: 5 } }))
  ids.cliente = await step('criar cliente', () => write({ tipo: 'cliente', dados: { nome: tag + ' cliente', email: 'cliente.e2e@example.invalid' } }))
  await step('editar cliente', () => write({ tipo: 'editar_cliente', dados: { registro_id: ids.cliente, nome: tag + ' cliente editado', limite_credito: 100000 } }))
  ids.fornecedor = await step('criar fornecedor', () => write({ tipo: 'fornecedor', dados: { nome: tag + ' fornecedor' } }))
  ids.servico = await step('criar serviço', () => write({ tipo: 'servico', dados: { nome: tag + ' serviço', preco: 150 } }))
  ids.produto = await step('criar produto', () => write({ tipo: 'produto', dados: { nome: tag + ' produto', preco: 40 } }))
  await step('editar serviço', () => write({ tipo: 'editar_servico', dados: { registro_id: ids.servico, nome: tag + ' serviço revisado', preco: 160 } }))
  const accounts = await tool('buscar_cadastros', { empresa_id: E, tipo: 'contas-financeiras' }).catch(() => ({ records: [] }))
  ids.conta = Number(accounts.records.find(r => String(r.status || 'ativo') !== 'inativo')?.id || 0) || await step('criar conta financeira', () => write({ tipo: 'conta_financeira', dados: { nome: tag + ' banco', tipo: 'banco', data_saldo_inicial: `${today.slice(0, 4)}-01-01` } }))

  // ---- vendas ----
  const saleItems = [{ tipo: 'servico', item_id: ids.servico, quantidade: 2, valor_unitario: 160 }]
  ids.venda = await step('criar venda (rascunho)', () => write({ tipo: 'venda', dados: { cliente_id: ids.cliente, data_venda: today, data_vencimento: plus(15), itens: saleItems } }))
  await step('obter_venda', async () => (await tool('obter_venda', { empresa_id: E, venda_id: ids.venda })).items.length + ' item(ns)')
  await step('editar venda', () => write({ tipo: 'editar_venda', dados: { registro_id: ids.venda, cliente_id: ids.cliente, data_venda: today, data_vencimento: plus(20), itens: [{ ...saleItems[0], quantidade: 3 }] } }))
  await step('confirmar venda (gera contas a receber)', () => write({ tipo: 'confirmar_venda', dados: { registro_id: ids.venda } }))
  ids.orcamento = await step('criar orçamento (preço da tabela/cadastro)', () => write({ tipo: 'orcamento', dados: { cliente_id: ids.cliente, data_venda: today, data_vencimento: plus(30), itens: [{ tipo: 'servico', item_id: ids.servico, quantidade: 1 }] } }))
  await step('converter orçamento em venda', () => write({ tipo: 'converter_orcamento', dados: { registro_id: ids.orcamento } }))
  ids.vendaCancelar = await step('criar e confirmar venda para cancelar', async () => { const id = await write({ tipo: 'venda', dados: { cliente_id: ids.cliente, data_venda: today, data_vencimento: plus(10), itens: saleItems } }); await write({ tipo: 'confirmar_venda', dados: { registro_id: id } }); return id })
  await step('cancelar venda', () => write({ tipo: 'cancelar_venda', dados: { registro_id: ids.vendaCancelar, motivo: 'Teste ponta a ponta' } }))
  ids.vendaExcluir = await step('criar venda para excluir', () => write({ tipo: 'venda', dados: { cliente_id: ids.cliente, data_venda: today, data_vencimento: plus(10), itens: saleItems } }))
  await step('excluir venda (rascunho)', () => write({ tipo: 'excluir_venda', dados: { registro_id: ids.vendaExcluir, motivo: 'Teste ponta a ponta' } }))
  await step('criar venda pelo Claude', () => write({ tipo: 'venda', dados: { cliente_id: ids.cliente, data_venda: today, data_vencimento: plus(10), itens: saleItems } }, claude))

  // ---- compras ----
  const purchaseItems = [{ tipo: 'servico', item_id: ids.servico, quantidade: 1, valor_unitario: 90 }]
  ids.compra = await step('criar compra', () => write({ tipo: 'compra', dados: { fornecedor_id: ids.fornecedor, data_compra: today, data_vencimento: plus(20), itens: purchaseItems } }))
  await step('editar compra', () => write({ tipo: 'editar_compra', dados: { registro_id: ids.compra, fornecedor_id: ids.fornecedor, data_compra: today, data_vencimento: plus(25), itens: [{ ...purchaseItems[0], valor_unitario: 95 }] } }))
  await step('confirmar compra', () => write({ tipo: 'confirmar_compra', dados: { registro_id: ids.compra } }))
  await step('cancelar compra', () => write({ tipo: 'cancelar_compra', dados: { registro_id: ids.compra } }))
  ids.compraExcluir = await step('criar compra para excluir', () => write({ tipo: 'compra', dados: { fornecedor_id: ids.fornecedor, data_compra: today, data_vencimento: plus(20), itens: purchaseItems } }))
  await step('excluir compra (rascunho)', () => write({ tipo: 'excluir_compra', dados: { registro_id: ids.compraExcluir, motivo: 'Teste ponta a ponta' } }))

  // ---- financeiro ----
  const title = (side, extra = {}) => ({ [side === 'pagar' ? 'fornecedor_id' : 'cliente_id']: side === 'pagar' ? ids.fornecedor : ids.cliente, descricao: tag + ' título ' + side,
    valor_total: 200, data_competencia: today, data_emissao: today, categoria_id: side === 'pagar' ? ids.despesa : ids.receita, conta_financeira_id: ids.conta,
    parcelas: [{ data_vencimento: plus(5), valor: 120 }, { data_vencimento: plus(35), valor: 80 }], ...extra })
  ids.previsao = await step('criar receita prevista', () => write({ tipo: 'conta_receber', dados: title('receber', { tipo_lancamento: 'previsao' }) }))
  await step('efetivar receita prevista', () => write({ tipo: 'efetivar_conta_receber', dados: { registro_id: ids.previsao } }))
  const parcel = await step('obter_titulo_financeiro', async () => { const t = await tool('obter_titulo_financeiro', { empresa_id: E, tipo: 'receber', conta_id: ids.previsao }); return Number(t.installments[0].id) })
  await step('registrar recebimento (baixa)', () => write({ tipo: 'receber_parcela', dados: { registro_id: parcel, valor: 120, data_pagamento: today, conta_financeira_id: ids.conta } }))
  const payment = await step('listar_pagamentos (localizar baixa)', async () => Number((await tool('listar_pagamentos', { empresa_id: E, tipo: 'receber' })).records.find(r => Number(r.valor) === 120 && !r.estorno_de_pagamento_id)?.id))
  await step('estornar recebimento', () => write({ tipo: 'estornar_pagamento', dados: { registro_id: payment, motivo: 'Teste ponta a ponta' } }))
  await step('listar_anexos do título', async () => (await tool('listar_anexos', { empresa_id: E, documento: 'conta_receber', registro_id: ids.previsao })).records.length + ' anexo(s)')
  ids.pagar = await step('criar conta a pagar', () => write({ tipo: 'conta_pagar', dados: title('pagar') }))
  await step('editar conta a pagar', () => write({ tipo: 'editar_conta_pagar', dados: { registro_id: ids.pagar, ...title('pagar', { descricao: tag + ' título pagar editado' }) } }))
  await step('excluir conta a pagar', () => write({ tipo: 'excluir_conta_pagar', dados: { registro_id: ids.pagar, motivo: 'Teste ponta a ponta' } }))

  // ---- limpeza de cadastros pelo chat ----
  await step('excluir produto', () => write({ tipo: 'excluir_produto', dados: { registro_id: ids.produto, motivo: 'Teste ponta a ponta' } }))
  await step('DRE do mês reflete a venda confirmada', async () => {
    const dre = await tool('consultar_relatorio', { empresa_id: E, tipo: 'dre', inicio: `${month}-01`, fim: plus(1) })
    const receita = dre.records.find(r => r.linha === 'Receita bruta')
    assert(receita && receita.categorias.some(c => c.nome.includes(tag)), JSON.stringify(dre.records.slice(0, 3)))
    return `receita bruta ${receita.valor}`
  })
  if (prod) {
    // Conferência das categorias depois da migração 9 (para aprovação): destino de cada uma.
    const categories = (await db.query(`SELECT c.id, c.nome, c.tipo, c.metadata->>'tipo_original' AS tipo_original, c.excluido_em IS NOT NULL AS removida,
      (SELECT count(*) FROM erp.categorias_cadastro k WHERE k.empresa_id=c.empresa_id AND (k.metadata->>'categoria_financeira_original')::bigint=c.id) AS copias_cadastro
      FROM erp.categorias c WHERE c.empresa_id=$1 AND c.nome NOT LIKE 'TESTE-E2E%' ORDER BY c.tipo, c.nome`, [E])).rows
    mkdirSync('.cache/e2e', { recursive: true }); writeFileSync('.cache/e2e/categorias-conferencia.json', JSON.stringify(categories, null, 2))
    steps.push({ etapa: 'conferência das categorias', ok: true, detalhe: `${categories.length} categorias (arquivo local .cache/e2e/categorias-conferencia.json)` })
  }
} catch (error) {
  steps.push({ etapa: 'falha geral', ok: false, erro: String(error.stack || error.message || error).slice(0, 800) })
} finally {
  await db.exec('ROLLBACK').catch(() => {})
  await closeDb()
}
const failed = steps.filter(s => !s.ok)
for (const s of steps) console.log(`${s.ok ? 'OK  ' : 'FALHA'} ${s.etapa}${s.detalhe !== undefined ? ' — ' + s.detalhe : ''}${s.erro ? ' — ' + s.erro : ''}`)
console.log(JSON.stringify({ modo: prod ? 'producao-rollback' : 'local', passos: steps.length, falhas: failed.length, segundos: Math.round((Date.now() - started) / 1000), gravado: false }))
mkdirSync('.cache/e2e', { recursive: true }); writeFileSync(`.cache/e2e/resultado-${prod ? 'prod' : 'local'}.json`, JSON.stringify(steps, null, 2))
process.exitCode = failed.length ? 1 : 0

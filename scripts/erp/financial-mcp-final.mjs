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
const PENDING = []

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
  const company = principal.companies.find(c => c.id === 2)
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

  assert.equal(E,2)
  const tag='QA-OTTO MCP FINAL '+randomUUID().slice(0,8)
  for(const side of ['pagar','receber']){
   const values={ [side==='pagar'?'fornecedor_id':'cliente_id']:side==='pagar'?295:294,descricao:tag+' '+side,valor_total:100,data_competencia:today,data_emissao:today,categoria_id:side==='pagar'?128:127,conta_financeira_id:21,tipo_lancamento:'previsao',parcelas:[{data_vencimento:today,valor:100}]}
   const id=await step(side+': prévia e execução criam previsão',()=>write({tipo:side==='pagar'?'conta_pagar':'conta_receber',dados:values}));assert(id>0)
   await step(side+': efetivar pela tool',()=>write({tipo:side==='pagar'?'efetivar_conta_pagar':'efetivar_conta_receber',dados:{registro_id:id}}))
   const detail=await tool('obter_titulo_financeiro',{empresa_id:E,tipo:side,conta_id:id});assert.equal(detail.record.tipo_lancamento,'efetivo');const part=Number(detail.installments[0].id)
   await step(side+': baixa pela tool',()=>write({tipo:side==='pagar'?'pagar_parcela':'receber_parcela',dados:{registro_id:part,valor:20,data_pagamento:today,conta_financeira_id:21}}))
   const payment=(await db.query('SELECT id FROM erp.pagamentos WHERE empresa_id=$1 AND conta_'+side+'_parcela_id=$2 AND estorno_de_pagamento_id IS NULL',[E,part])).rows[0];assert(payment)
   await step(side+': estorno pela tool',()=>write({tipo:'estornar_pagamento',dados:{registro_id:Number(payment.id),motivo:tag}}))
   await step(side+': leitura após estorno',async()=>{const detail=await tool('obter_titulo_financeiro',{empresa_id:E,tipo:side,conta_id:id});assert.equal(Number(detail.installments[0].valor_pago),0);return 'saldo restaurado'})
  }
  for(const tipo of ['dre-caixa','dre-competencia','fluxo-de-caixa','aging-pagar','aging-receber'])await step('tool relatório '+tipo,async()=>{await tool('consultar_relatorio',{empresa_id:E,tipo,inicio:'2026-10-01',fim:'2026-10-14'});return 'retorno válido'})
  await step('perfil de consulta não cria título',async()=>{const limited={...principal,companies:principal.companies.map(c=>({...c,capabilities:['erp.financeiro.visualizar']}))};const result=await executeTool(limited,'criar_titulo',{empresa_id:E,tipo:'pagar',chave_operacao:randomUUID(),dados:{fornecedor_id:295,descricao:tag,valor_total:100,data_competencia:today,data_emissao:today,categoria_id:128,parcelas:[{valor:100,data_vencimento:today}]}},chatgpt);assert.equal(result.isError,true);assert.equal(JSON.parse(result.content[0].text).code,'ACCESS_DENIED');return 'negado'})
  await step('escopo somente leitura não permite escrita',async()=>{const result=await executeTool({...principal,scopes:['erp:read']},'criar_titulo',{empresa_id:E,tipo:'pagar',chave_operacao:randomUUID(),dados:{fornecedor_id:295,descricao:tag,valor_total:100,data_competencia:today,data_emissao:today,categoria_id:128,parcelas:[{valor:100,data_vencimento:today}]}},chatgpt);assert.equal(result.isError,true);assert.equal(JSON.parse(result.content[0].text).code,'INSUFFICIENT_SCOPE');return 'negado'})
} catch (error) {
  steps.push({ etapa: 'falha geral', ok: false, erro: String(error.stack || error.message || error).slice(0, 800) })
} finally {
  await db.exec('ROLLBACK').catch(() => {})
  await closeDb()
}
const failed = steps.filter(s => !s.ok)
for (const s of steps) console.log(`${s.ok ? 'OK  ' : 'FALHA'} ${s.etapa}${s.detalhe !== undefined ? ' — ' + s.detalhe : ''}${s.erro ? ' — ' + s.erro : ''}`)
console.log(JSON.stringify({ modo: prod ? 'producao-rollback' : 'local', passos: steps.length, falhas: failed.length, segundos: Math.round((Date.now() - started) / 1000), gravado: false }))
mkdirSync('.cache/e2e', { recursive: true }); writeFileSync(`.cache/e2e/resultado-financeiro-final.json`, JSON.stringify(steps, null, 2))
process.exitCode = failed.length ? 1 : 0

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { chromium } from 'playwright-core'
import { Pool } from 'pg'
import { runWithErpDatabaseContext } from '../src/lib/erpDatabaseContext'
import { closePool, type SQLClient } from '../src/lib/postgres'
import { executeWorkflow, digest, type WorkflowDependencies } from '../src/products/mcpcore/domains/erp/workflows/coordinator'
import { workflowInputs, type WorkflowRow, type Fields } from '../src/products/mcpcore/domains/erp/workflows/contracts'
import { workflowTools } from '../src/products/mcpcore/domains/erp/workflows/catalog'
import { classifyExpenseWithClient } from '../src/products/erp/server/erpCrudRepository'
import { captureWorkflowItem, listWorkflowCandidates, refreshWorkflowRow } from '../src/products/mcpcore/domains/erp/workflows/repository'
import { executeTool, executionDependencies } from '../src/products/mcpcore/domains/erp/executeTool'
import { ERP_CAPABILITIES } from '../src/products/erp/shared/professionalContracts'
import { PluginError, type PluginPrincipal } from '../src/products/mcpcore/shared/contracts'
import type { PluginConfig } from '../src/products/mcpcore/shared/config'
import { renderCardsHtml } from '../src/products/mcpcore/ui/resource'

const checks: string[] = []
const principal: PluginPrincipal = { userId: 1, clerkUserId: 'fixture', clientId: 'fixture', scopes: ['erp:read', 'erp:write'], companies: [{ id: 2, name: 'Empresa dois', profile: 'administrador', capabilities: [...ERP_CAPABILITIES], timeZone: 'America/Fortaleza' }] }
const config: PluginConfig = { integration: 'chatgpt', resource: 'https://erp.example.invalid/api/mcp', metadataUrl: 'https://erp.example.invalid/.well-known/oauth-protected-resource/api/mcp', issuer: 'https://fixture.clerk.accounts.dev', scope: 'erp:read', clientIds: ['fixture'], origins: [], toolTimeoutMs: 10000, requestsPerMinute: 60 }

async function backend() {
  const db = new PGlite(), bad = new Set<number>(), unknown = new Set<number>()
  let revoked = false, applied = 0, accessChecks = 0
  const client: SQLClient = { release() {}, query: async (sql, params) => ({ rows: (await db.query<Fields>(sql, params)).rows }) }
  const deps: WorkflowDependencies = {
    refresh: async (_company,row)=>row,
    transaction: async fn => { await db.exec('BEGIN'); try { const result = await fn(client); await db.exec('COMMIT'); return result } catch (error) { await db.exec('ROLLBACK'); throw error } },
    query: async <Row>(sql: string, params: unknown[]) => (await db.query<Fields>(sql, params)).rows as Row[],
    assertAccess: async () => { accessChecks++; if (revoked) throw new PluginError('ACCESS_DENIED', 'Permissão revogada.', 403) },
    capture: async (_client, company, _kind, input) => {
      const id = Number(input.registro_id || input.venda_id || input.transacao_bancaria_id), row = (await db.query<Fields>('SELECT * FROM erp.fixture WHERE empresa_id=$1 AND id=$2', [company, id])).rows[0]
      if (!row) throw new PluginError('NOT_FOUND', 'Registro indisponível.', 404)
      return { snapshot: { row, input }, preview: { registro_id: id, venda_id: id, nome: 'Registro ' + id, numero: 'A-' + id, valor: Number(row.valor), categoria: 'Software', grupo_dre: 'Administrativas', correspondencia: 'Pagamento #' + id, valor_bancario: Number(row.valor), valor_correspondencia: Number(row.valor) } }
    },
    apply: async (_client, company, _actor, _kind, input) => {
      const id = Number(input.registro_id || input.venda_id || input.transacao_bancaria_id)
      await db.query('UPDATE erp.fixture SET version=version+1 WHERE empresa_id=$1 AND id=$2', [company, id])
      if (bad.has(id)) throw new PluginError('PERIOD_CLOSED', 'Período fechado.', 409)
      if (unknown.has(id)) throw new Error('Simulação de perda da conexão.')
      applied++; return { status: 'saved', result: { registro_id: String(id), nota_id: id, status: 'emitida' } }
    },
    list: async (_company, kind) => ({ workflow: kind, tela: 'selecao', records: [] }),
  }
  const invoke = (name: string, input: Fields, identity = principal, settings = config) => runWithErpDatabaseContext({ tenantId: 2, userId: 1 }, () => executeWorkflow(identity, 2, name, input, settings, deps))
  const prepare = (ids: number[], key = randomUUID()) => invoke('emitir_notas_lote', { chave_operacao: key, dados: { venda_ids: ids } })
  try {
    await db.exec('CREATE SCHEMA shared; CREATE SCHEMA plugin; CREATE SCHEMA erp; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE erp_runtime; CREATE ROLE service_role BYPASSRLS; CREATE TABLE shared.empresas(id bigint PRIMARY KEY); CREATE TABLE shared.usuarios(id bigint PRIMARY KEY); INSERT INTO shared.empresas VALUES(2),(3); INSERT INTO shared.usuarios VALUES(1),(9); CREATE TABLE erp.fixture(id int,empresa_id int,version int DEFAULT 0,valor numeric,PRIMARY KEY(empresa_id,id)); INSERT INTO erp.fixture(id,empresa_id,valor) SELECT value,2,value*10 FROM generate_series(1,50) value;')
    await db.exec(readFileSync('supabase/migrations/20261020150000_erp_chat_workflows.sql', 'utf8'))
    assert.equal((await db.query<{ enabled: boolean }>("SELECT relrowsecurity enabled FROM pg_class WHERE oid='plugin.erp_workflows'::regclass")).rows[0].enabled, true)
    assert.equal((await db.query<{ allowed: boolean }>("SELECT has_table_privilege('erp_runtime','plugin.erp_workflows','SELECT') allowed")).rows[0].allowed, false)
    assert.equal(digest({ left: 1, right: [2, 3] }), digest({ right: [2, 3], left: 1 }))
    for (const data of [{ venda_ids: [] }, { venda_ids: [1, 1] }, { venda_ids: Array.from({ length: 51 }, (_, index) => index + 1) }]) assert.equal(workflowInputs.notas.safeParse(data).success, false)
    assert.equal(workflowInputs.classificacao.safeParse({ itens: [{ registro_id: 1, categoria_id: 2 }, { registro_id: 1, categoria_id: 3 }] }).success, false)
    const key = randomUUID(), preview = await prepare([1, 2, 3, 4, 5, 6, 7], key)
    assert.equal(applied, 0); assert.deepEqual((await prepare([1, 2, 3, 4, 5, 6, 7], key)).operacao_id, preview.operacao_id)
    await assert.rejects(prepare([8], key), (error: unknown) => error instanceof PluginError && error.code === 'IDEMPOTENCY_CONFLICT')
    await assert.rejects(invoke('classificar_despesas', { rascunho_id: preview.operacao_id }), /mesma tool/)
    const partial = await invoke('emitir_notas_lote', { rascunho_id: preview.operacao_id }); assert.equal((partial.counts as Fields).saved, 5); assert.equal((partial.counts as Fields).pending, 2)
    const done = await invoke('emitir_notas_lote', { rascunho_id: preview.operacao_id }); assert.equal(done.status, 'saved'); assert.equal(applied, 7)
    await invoke('emitir_notas_lote', { rascunho_id: preview.operacao_id }); assert.equal(applied, 7)
    assert.equal((await invoke('consultar_operacao_fluxo', { chave_operacao: key })).status, 'saved')
    checks.push('migration_rls_private_ledger_validation_no_writes_in_preview_persistent_idempotency_five_item_chunks_and_replay')
    for (const [identity, settings] of [[{ ...principal, clientId: 'other' }, config], [{ ...principal, userId: 9 }, config], [principal, { ...config, integration: 'claude' as const }]] as const) await assert.rejects(invoke('consultar_operacao_fluxo', { operacao_id: preview.operacao_id }, identity, settings), /não disponível/)
    revoked = true; await assert.rejects(invoke('emitir_notas_lote', { rascunho_id: preview.operacao_id }), /revogada/); revoked = false; assert(accessChecks > 10)
    const stale = await prepare([8]); await db.query('UPDATE erp.fixture SET version=1 WHERE empresa_id=2 AND id=8'); const staleResult = await invoke('emitir_notas_lote', { rascunho_id: stale.operacao_id }); assert.equal(staleResult.status, 'failed'); assert.equal((staleResult.items as Fields[])[0].codigo, 'STALE_PROPOSAL')
    const expiring = await prepare([9]); await db.query("UPDATE plugin.erp_workflows SET expires_at=now()-interval '1 minute' WHERE id=$1", [expiring.operacao_id]); await assert.rejects(invoke('emitir_notas_lote', { rascunho_id: expiring.operacao_id }), /expirou/)
    checks.push('actor_company_integration_isolation_access_revocation_stale_preview_and_expiry')
    bad.add(10); const mixed = await prepare([10, 11]); const mixedResult = await invoke('emitir_notas_lote', { rascunho_id: mixed.operacao_id }); assert.equal(mixedResult.status, 'partial'); assert.equal(mixedResult.valor_concluido, 110); assert.equal(mixedResult.valor_pendente, 100)
    assert.equal((await db.query<{ version: number }>('SELECT version FROM erp.fixture WHERE empresa_id=2 AND id=10')).rows[0].version, 0)
    unknown.add(12); const uncertain = await prepare([12, 13]); const uncertainResult = await invoke('emitir_notas_lote', { rascunho_id: uncertain.operacao_id }); assert.equal(uncertainResult.status, 'uncertain'); assert.equal((uncertainResult.counts as Fields).unknown, 1)
    await invoke('emitir_notas_lote', { rascunho_id: uncertain.operacao_id }); assert.equal((await db.query<{ version: number }>('SELECT version FROM erp.fixture WHERE empresa_id=2 AND id=12')).rows[0].version, 0)
    const stateBefore = applied; await invoke('consultar_operacao_fluxo', { operacao_id: uncertain.operacao_id }); assert.equal(applied, stateBefore)
    checks.push('atomic_per_item_rollback_partial_totals_and_unknown_outcome_is_never_reexecuted')
    const contexts: Fields[] = [], writes: string[] = []
    const classificationClient: SQLClient = { release() {}, query: async (sql, params) => {
      if (sql.startsWith('SELECT * FROM erp.contas_pagar ')) return { rows: [{ id: 20, origem: 'manual', status: 'pago', categoria_id: 2, data_competencia: '2026-10-01', data_emissao: '2026-10-01' }] }
      if (sql.includes('FROM erp.categorias ')) return { rows: [{ id: 3 }] }
      if (sql.includes('FROM erp.contas_pagar_parcelas ')) return { rows: [{ id: 21, data_vencimento: '2026-10-10' }] }
      if (sql.includes('FROM erp.pagamentos ')) return { rows: [{ data_pagamento: '2026-10-11' }] }
      if (sql.includes('FROM erp.fechamentos_periodos')) contexts.push({ date: params?.[2] })
      if (/^(UPDATE|INSERT)/.test(sql)) writes.push(sql)
      return { rows: [] }
    } }
    await classifyExpenseWithClient(classificationClient, 2, 1, 20, 3)
    assert.deepEqual(contexts.map(entry => entry.date).sort(), ['2026-10-01', '2026-10-10', '2026-10-11'])
    assert.equal(writes.filter(sql => sql.startsWith('UPDATE')).length, 1); assert(writes[0].startsWith('UPDATE erp.contas_pagar SET categoria_id=')); assert.equal(writes.some(sql => /UPDATE erp\.(categorias|pagamentos|contas_pagar_parcelas)/.test(sql)), false)
    checks.push('category_only_update_preserves_global_dre_installments_payments_and_checks_their_closed_periods')
    const rootDeps = { ...executionDependencies, reserve: async () => randomUUID(), finish: async () => {}, workflows: { execute: async () => ({ workflow: 'notas', tela: 'selecao' }) } }
    const reader = await executeTool({ ...principal, scopes: ['erp:read'] }, 'emitir_notas_lote', { chave_operacao: randomUUID(), dados: { venda_ids: [1] } }, config, rootDeps); assert.equal(reader.isError, true); assert.match(JSON.stringify(reader.content), /INSUFFICIENT_SCOPE/)
    const publicRead = await executeTool(principal, 'consultar_operacao_fluxo', {}, config, rootDeps); assert.equal(publicRead.isError, undefined)
    assert.equal(workflowTools.length, 6); checks.push('tools_read_write_scope_contracts')
    await db.exec(`
      CREATE TABLE erp.entidades(id bigint,empresa_id bigint,nome text,ativo boolean,documento text,excluido_em timestamptz,eh_cliente boolean DEFAULT true);
      CREATE TABLE erp.entidades_enderecos(id bigint,empresa_id bigint,entidade_id bigint,ativo boolean,logradouro text);
      CREATE TABLE erp.entidades_contatos(id bigint,empresa_id bigint,entidade_id bigint,ativo boolean,email text);
      CREATE TABLE erp.dre_grupos(id bigint,empresa_id bigint,nome text);
      CREATE TABLE erp.categorias(id bigint,empresa_id bigint,nome text,tipo text,ativo boolean,excluido_em timestamptz,categoria_pai_id bigint,dre_grupo_id bigint,fora_dre boolean DEFAULT false);
      CREATE TABLE erp.contas_pagar(id bigint,empresa_id bigint,origem text,status text,descricao text,fornecedor_id bigint,categoria_id bigint,valor_total numeric,data_competencia date,data_emissao date,excluido_em timestamptz);
      CREATE TABLE erp.contas_pagar_parcelas(id bigint,empresa_id bigint,conta_pagar_id bigint,data_vencimento date);
      ALTER TABLE erp.contas_pagar ADD COLUMN atualizado_por bigint;
      CREATE TABLE erp.contas_pagar_eventos(empresa_id bigint,conta_pagar_id bigint,evento text,dados jsonb,criado_por bigint);
      CREATE TABLE erp.fechamentos_periodos(id bigint,empresa_id bigint,modulo text,periodo_inicio date,periodo_fim date,reaberto_em timestamptz);
      CREATE TABLE erp.rateios_financeiros(id bigint,empresa_id bigint,conta_pagar_id bigint);
      CREATE TABLE erp.pagamentos(id bigint,empresa_id bigint,conta_pagar_parcela_id bigint,conta_financeira_id bigint,tipo text,data_pagamento date,valor_liquido numeric,conciliado boolean DEFAULT false,estornado_em timestamptz,estorno_de_pagamento_id bigint,excluido_em timestamptz);
      CREATE TABLE erp.transacoes_bancarias(id bigint,empresa_id bigint,conta_financeira_id bigint,descricao text,data_transacao date,tipo text,valor numeric,status text,excluido_em timestamptz);
      CREATE TABLE erp.transferencias_financeiras(id bigint,empresa_id bigint,conta_destino_id bigint,pagamento_origem_id bigint,valor numeric,data_transferencia date,status text,excluido_em timestamptz);
      CREATE TABLE erp.conciliacoes_bancarias_itens(id bigint,empresa_id bigint,transacao_bancaria_id bigint,pagamento_id bigint,transferencia_financeira_id bigint,valor_conciliado numeric,desfeito_em timestamptz);
      CREATE TABLE erp.contas_financeiras(id bigint,empresa_id bigint,nome text,excluido_em timestamptz);
      CREATE TABLE erp.vendas(id bigint,empresa_id bigint,numero text,cliente_id bigint,status text,tipo_documento text,data_venda date,total numeric,excluido_em timestamptz);
      CREATE TABLE erp.vendas_itens(id bigint,empresa_id bigint,venda_id bigint,servico_id bigint,produto_id bigint,descricao text,quantidade numeric,valor_unitario numeric,desconto numeric,excluido_em timestamptz);
      CREATE TABLE erp.servicos(id bigint,empresa_id bigint,nome text);
      CREATE TABLE erp.configuracoes_fiscais(id bigint,empresa_id bigint,endereco_codigo_municipio text,aliquota_iss_padrao numeric,padrao boolean,ativo boolean,excluido_em timestamptz);
      CREATE TABLE erp.notas_fiscais(id bigint,empresa_id bigint,venda_id bigint,tipo text,direcao text,modo_operacao text,status text,versao int,valor_total numeric,excluido_em timestamptz);
      CREATE TABLE erp.notas_fiscais_itens(id bigint,empresa_id bigint,nota_fiscal_id bigint,numero_item int,excluido_em timestamptz);
      CREATE TABLE erp.notas_fiscais_totais(id bigint,empresa_id bigint,nota_fiscal_id bigint);
      INSERT INTO erp.entidades VALUES(1,2,'Cliente/Fornecedor',true,'123',NULL,true);
      INSERT INTO erp.entidades_enderecos VALUES(1,2,1,true,'Rua A');
      INSERT INTO erp.dre_grupos VALUES(1,2,'Administrativas');
      INSERT INTO erp.categorias(id,empresa_id,nome,tipo,ativo,dre_grupo_id) VALUES(1,2,'Software','despesa',true,1),(2,2,'Marketing','despesa',true,1),(99,3,'Outra empresa','despesa',true,1);
      INSERT INTO erp.contas_pagar(id,empresa_id,origem,status,descricao,fornecedor_id,categoria_id,valor_total,data_competencia,data_emissao) VALUES(101,2,'manual','pago','Consultoria',1,1,350,'2026-10-01','2026-10-01');
      INSERT INTO erp.contas_pagar_parcelas VALUES(11,2,101,'2026-10-10');
      INSERT INTO erp.pagamentos(id,empresa_id,conta_pagar_parcela_id,conta_financeira_id,tipo,data_pagamento,valor_liquido) VALUES(20,2,11,10,'pagar','2026-10-10',350);
      INSERT INTO erp.contas_financeiras VALUES(10,2,'Banco',NULL);
      INSERT INTO erp.transacoes_bancarias VALUES(30,2,10,'Pagamento Pix','2026-10-10','debito',350,'pendente',NULL);
      INSERT INTO erp.vendas VALUES(40,2,'A-40',1,'confirmada','venda','2026-10-01',350,NULL);
      INSERT INTO erp.vendas_itens VALUES(1,2,40,10,NULL,'Consultoria',1,350,0,NULL);
      INSERT INTO erp.servicos VALUES(10,2,'Consultoria');
      INSERT INTO erp.configuracoes_fiscais VALUES(1,2,'2304400',5,true,true,NULL);`)
    const classification = await captureWorkflowItem(client,2,'classificacao',{registro_id:101,categoria_id:2},false)
    assert.equal(classification.preview.categoria,'Marketing'); assert.equal(classification.preview.grupo_dre,'Administrativas')
    await assert.rejects(captureWorkflowItem(client,2,'classificacao',{registro_id:101,categoria_id:99},false),/categoria de despesa ativa/)
    const bank = await captureWorkflowItem(client,2,'conciliacao',{transacao_bancaria_id:30,pagamento_id:20},false); assert.equal(bank.preview.valor,350); assert.equal(bank.preview.direcao,'Saída')
    await db.exec('UPDATE erp.pagamentos SET conta_financeira_id=99 WHERE empresa_id=2 AND id=20'); await assert.rejects(captureWorkflowItem(client,2,'conciliacao',{transacao_bancaria_id:30,pagamento_id:20},false),/outra conta/); await db.exec('UPDATE erp.pagamentos SET conta_financeira_id=10 WHERE empresa_id=2 AND id=20')
    const invoice = await captureWorkflowItem(client,2,'notas',{venda_id:40},false); assert.equal(invoice.generatedInput?.codigo_municipio_prestacao,'2304400'); assert.equal(invoice.generatedInput?.itens[0].valor_unitario,350)
    await db.exec("UPDATE erp.entidades_enderecos SET logradouro='Rua B' WHERE empresa_id=2 AND id=1");assert.notEqual(digest(invoice.snapshot),digest((await captureWorkflowItem(client,2,'notas',{venda_id:40},false)).snapshot))
    await db.exec("INSERT INTO erp.notas_fiscais VALUES(1,2,40,'nfse','saida','simulacao','emitida',1,350,NULL)"); await assert.rejects(captureWorkflowItem(client,2,'notas',{venda_id:40},false),/já possui nota/); await db.exec('DELETE FROM erp.notas_fiscais')
    const descriptor=Object.getOwnPropertyDescriptor(Pool.prototype,'connect'),databaseUrl=process.env.SUPABASE_DB_URL
    process.env.SUPABASE_DB_URL='postgresql://fixture:fixture@127.0.0.1:1/workflow_fixture'
    Object.defineProperty(Pool.prototype,'connect',{configurable:true,writable:true,value:async()=>({release(){},query:async(sql:string,params?:unknown[])=>sql.includes('set_config(')||sql==='RESET ROLE'?{rows:[]}:{rows:(await db.query<Fields>(sql,params)).rows}})})
    try {
      const list=(kind:'classificacao'|'notas',input:Fields={})=>runWithErpDatabaseContext({tenantId:2,userId:1,readOnly:true},()=>listWorkflowCandidates(2,kind,input))
      const expenseRows=await list('classificacao',{sugestoes:[{registro_id:101,categoria_id:2}]}); assert.equal(expenseRows.total,1); assert.equal((expenseRows.records as Fields[])[0].categoria_sugerida_id,2)
      const notesRows=await list('notas'); assert.equal(notesRows.total,1); assert.equal((notesRows.records as Fields[])[0].venda_id,'40')
      await db.exec("ALTER TABLE erp.notas_fiscais ADD COLUMN erro_codigo text; ALTER TABLE erp.notas_fiscais ADD COLUMN erro_mensagem text; INSERT INTO erp.notas_fiscais(id,empresa_id,venda_id,tipo,direcao,modo_operacao,status,versao,valor_total) VALUES(5,2,40,'nfse','saida','simulacao','emitida',2,350)")
      const pendingRow=(await deps.query<WorkflowRow>('SELECT * FROM plugin.erp_workflows WHERE id=$1',[preview.operacao_id]))[0]
      const refreshed=await runWithErpDatabaseContext({tenantId:2,userId:1,readOnly:true},()=>refreshWorkflowRow(2,{...pendingRow,items:[{...pendingRow.items[0],status:'awaiting',result:{nota_id:5}}]}));assert.equal(refreshed.items[0].status,'saved');assert.equal((await db.query<Fields>('SELECT status FROM erp.notas_fiscais WHERE empresa_id=2 AND id=5')).rows[0].status,'emitida')
      await db.exec('BEGIN');await classifyExpenseWithClient(client,2,1,101,2);await db.exec('COMMIT');assert.equal(Number((await db.query<Fields>('SELECT categoria_id FROM erp.contas_pagar WHERE empresa_id=2 AND id=101')).rows[0].categoria_id),2);assert.equal(Number((await db.query<Fields>('SELECT valor_liquido FROM erp.pagamentos WHERE empresa_id=2 AND id=20')).rows[0].valor_liquido),350);assert.equal((await db.query<Fields>('SELECT evento FROM erp.contas_pagar_eventos WHERE empresa_id=2')).rows[0].evento,'classificada_chat')
      await db.exec("INSERT INTO erp.fechamentos_periodos VALUES(1,2,'financeiro','2026-10-10','2026-10-10',NULL);BEGIN");await assert.rejects(classifyExpenseWithClient(client,2,1,101,1),/período esta fechado/);await db.exec('ROLLBACK');assert.equal(Number((await db.query<Fields>('SELECT categoria_id FROM erp.contas_pagar WHERE empresa_id=2 AND id=101')).rows[0].categoria_id),2)
      await db.exec("INSERT INTO erp.contas_pagar(id,empresa_id,origem,status,descricao,fornecedor_id,categoria_id,valor_total,data_competencia,data_emissao) SELECT id,2,'manual','aberto','Despesa '||id,1,1,100,'2026-10-01','2026-10-01' FROM generate_series(102,142) id")
      const remotePage=await list('classificacao',{pagina:2}); assert.equal(remotePage.total,42); assert.equal((remotePage.records as Fields[]).length,5); assert.equal((remotePage.paginacao as Fields).modo,'servidor')
      await db.exec('INSERT INTO erp.rateios_financeiros VALUES(1,2,101)'); await assert.rejects(captureWorkflowItem(client,2,'classificacao',{registro_id:101,categoria_id:2},false),/rateio/)
    } finally {await closePool();if(descriptor)Object.defineProperty(Pool.prototype,'connect',descriptor);else Reflect.deleteProperty(Pool.prototype,'connect');if(databaseUrl===undefined)delete process.env.SUPABASE_DB_URL;else process.env.SUPABASE_DB_URL=databaseUrl}
    checks.push('actual_postgres_candidate_queries_snapshots_dre_valid_categories_invoice_totals_duplicate_notes_and_server_pagination')
  } finally { await db.close() }
}

type Call = { name: string; arguments: Fields }
const names = ['Lume Arquitetura', 'Farol Seguros', 'Aurora Clínica', 'Prisma Contabilidade'], amounts = [350, 480, 720, 250], id = randomUUID()
const records = (total = 4, page = 1) => Array.from({ length: total < 40 ? total : 5 }, (_, index) => { const number = (total < 40 ? index : (page - 1) * 5 + index); return { registro_id: number + 201, venda_id: number + 201, nome: names[number] || 'Despesa ' + number, numero: 'A-' + (number + 201), valor: amounts[number] || 100, data: '2026-10-18', categoria_id: '1' } })
const selection = (kind = 'notas', total = 4, page = 1) => ({ workflow: kind, tela: 'selecao', records: records(total, page), total, page, paginacao: { modo: total < 40 ? 'local' : 'servidor', por_pagina: 5 }, categorias: [{ id: '1', nome: 'Software e assinaturas', grupo_dre: 'Administrativas' }, { id: '2', nome: 'Marketing', grupo_dre: 'Comerciais' }] })
const review = (kind: string, items = records()) => ({ workflow: kind, tela: 'revisao', operacao_id: id, rascunho_id: id, status: 'pending', total: items.length, items: items.map(item => ({ ...item, categoria: item.categoria_id === '2' ? 'Marketing' : 'Software e assinaturas', grupo_dre: 'Administrativas', status: 'pending' })), valor_pendente: items.reduce((sum, row) => sum + row.valor, 0), confirmar: { tool: kind === 'notas' ? 'emitir_notas_lote' : kind === 'classificacao' ? 'classificar_despesas' : 'conciliar_movimentacao', argumentos: { empresa_id: 2, rascunho_id: id } } })
const result = (kind = 'notas') => ({ ...review(kind), tela: 'resultado', confirmar: undefined, status: 'partial', counts: { saved: 3, failed: 1, pending: 0, awaiting: 0, unknown: 0 }, valor_concluido: 1080, valor_pendente: 720, items: records().map((item, index) => ({ ...item, status: index === 2 ? 'failed' : 'saved', resultado: { nota_id: index + 301 }, ...(index === 2 ? { mensagem: 'Código de serviço municipal não cadastrado.' } : {}) })) })
let initial: Fields = selection(), tool = 'consultar_operacao_fluxo', variant: 'chatgpt' | 'claude' = 'chatgpt', theme = 'light', failing = false, wrongId = false, callItems = records()
const calls: Call[] = []
const encode = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c')
const envelope = (data: Fields) => ({ structuredContent: { ok: true, empresa_id: 2, data } })
function host() { return `<!doctype html><html><head><style>body{margin:0;background:${theme === 'dark' ? '#1a1c1f' : '#fff'}}iframe{width:100%;border:0}</style></head><body><iframe id="card" style="height:1200px"></iframe><script>
const frame=document.getElementById('card');frame.srcdoc=${encode(renderCardsHtml({ name: 'workflows-test', version: '1', host: variant }))};addEventListener('message',async event=>{if(event.source!==frame.contentWindow)return;const message=event.data;if(message.method==='ui/notifications/size-changed'){frame.style.height=message.params.height+2+'px';return}if(message.method==='ui/notifications/initialized'){frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:{empresa_id:2}}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{...${encode(envelope(initial))},_meta:{'cognito/tool':${encode(tool)}}}},'*');return}if(message.id===undefined)return;let result={};if(message.method==='ui/initialize')result={hostContext:{theme:${encode(theme)},displayMode:'inline'},hostCapabilities:{}};if(message.method==='tools/call')result=await(await fetch('/call',{method:'POST',body:JSON.stringify(message.params)})).json();if(message.method==='ui/request-display-mode')result={mode:message.params.mode};frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,result},'*')});</script></body></html>` }
async function browserTests() {
  const server = createServer(async (request, response) => {
    if (request.url !== '/call') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(host()); return }
    const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.from(chunk))
    const call: Call = JSON.parse(Buffer.concat(chunks).toString()); calls.push(call); response.setHeader('Content-Type', 'application/json')
    if (failing) { response.end(JSON.stringify({ isError: true, content: [{ type: 'text', text: JSON.stringify({ message: 'Conexão interrompida.' }) }] })); return }
    if (call.name === 'consultar_classificacao_despesas') { response.end(JSON.stringify(envelope(selection('classificacao', 40, Number(call.arguments.pagina || 1))))); return }
    if (call.name === 'consultar_operacao_fluxo') { response.end(JSON.stringify(envelope(result()))); return }
    if (call.name === 'obter_nota_servico') { response.end(JSON.stringify(envelope({ record: { id: '303', status: 'falha', cliente: 'Aurora Clínica' }, items: [], totals: {}, events: [] }))); return }
    const kind = call.name === 'classificar_despesas' ? 'classificacao' : call.name === 'conciliar_movimentacao' ? 'conciliacao' : 'notas'
    if (call.arguments.dados) {
      const data = call.arguments.dados as { itens?: { registro_id: number; categoria_id: number }[]; venda_ids?: number[] }
      callItems = Array.from({length:8},(_,index)=>records(40,index+1)).flat().filter(row => data.venda_ids?.includes(row.venda_id) || data.itens?.some(item => item.registro_id === row.registro_id)).map(row => ({ ...row, categoria_id: String(data.itens?.find(item => item.registro_id === row.registro_id)?.categoria_id || row.categoria_id) }))
      response.end(JSON.stringify(envelope(review(kind, callItems)))); return
    }
    if(kind==='conciliacao'){response.end(JSON.stringify(envelope({...result(kind),status:'saved',total:1,counts:{saved:1,pending:0,failed:0,awaiting:0,unknown:0},valor_concluido:1250,valor_pendente:0,items:[{nome:'Pagamento Pix',correspondencia:'Pagamento #482',status:'saved',valor:1250,resultado:{registro_id:'1',saldo_bancario_restante:0}}]})));return}
    response.end(JSON.stringify(envelope({ ...result(kind), ...(wrongId ? { operacao_id: randomUUID() } : {}) })))
  })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const executable = process.env.CHATGPTPLUGIN_TEST_BROWSER || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync); assert(executable)
  const browser = await chromium.launch({ executablePath: executable, headless: true, args: ['--disable-extensions', '--disable-background-networking'] }), page = await browser.newPage({ viewport: { width: 390, height: 1000 } }), frame = page.frameLocator('#card'), errors: string[] = [], url = 'http://127.0.0.1:' + (server.address() as { port: number }).port
  page.on('pageerror', error => errors.push(error.message))
  const open = async (data: Fields = selection(), name = 'consultar_operacao_fluxo') => { initial = data; tool = name; calls.length = 0; await page.goto(url); await frame.locator('.workflow-card').waitFor() }
  const fit = async () => assert.equal(await frame.locator('html').evaluate(root => root.scrollWidth <= root.clientWidth), true)
  const shot = async (name: string) => { if (process.env.CHATGPTPLUGIN_SKIP_SCREENSHOTS !== '1') { mkdirSync('.cache/chatgptplugin-workflows', { recursive: true }); await page.screenshot({ path: resolve('.cache/chatgptplugin-workflows', name + '.png'), fullPage: true }) } }
  try {
    await open(); assert.equal(await frame.locator('.workflow-rows>li').count(), 4); assert.equal(calls.length, 0); for (const check of await frame.getByRole('checkbox').all()) await check.check()
    await frame.getByRole('button', { name: 'Revisar 4 notas', exact: true }).click(); await frame.getByRole('button', { name: 'Confirmar emissão', exact: true }).waitFor(); assert.equal(calls.length, 1); assert.deepEqual((calls[0].arguments.dados as Fields).venda_ids, [201, 202, 203, 204]); await fit(); await shot('notas-revisao')
    await frame.getByRole('button', { name: 'Confirmar emissão', exact: true }).click(); await frame.getByRole('heading', { name: 'Emissão parcialmente concluída', exact: true }).waitFor(); await frame.getByText('3 de 4 notas emitidas na simulação', { exact: true }).waitFor(); await frame.getByText('Código de serviço municipal não cadastrado.', { exact: true }).waitFor(); assert.equal(calls.length, 2); assert.equal((calls[1].arguments as Fields).dados, undefined); await fit(); await shot('notas-parcial')
    await Promise.all([page.waitForResponse(response=>response.url().endsWith('/call')&&response.request().postDataJSON().name==='obter_nota_servico'),frame.getByRole('button', { name: 'Revisar nota →', exact: true }).click()]); assert.equal(calls.at(-1)!.name, 'obter_nota_servico'); assert.equal(calls.at(-1)!.arguments.nota_id, 303)
    checks.push('notes_custom_selection_review_explicit_confirmation_partial_totals_exact_failure_and_only_failed_note_review')
    await open(selection('classificacao', 40), 'consultar_classificacao_despesas'); await frame.getByRole('checkbox').first().check(); await frame.getByRole('combobox', { name: 'Categoria de Lume Arquitetura', exact: true }).selectOption('2'); await frame.getByRole('button', { name: 'Próxima página: despesas', exact: true }).click(); await frame.getByText('6–10 de 40 despesas', { exact: true }).waitFor(); await frame.getByRole('checkbox').first().check(); await frame.getByRole('button', { name: 'Página anterior: despesas', exact: true }).click(); await frame.getByText('1–5 de 40 despesas', { exact: true }).waitFor(); assert.equal(await frame.getByRole('checkbox').first().isChecked(), true); assert.equal(await frame.getByRole('combobox').first().inputValue(), '2'); await frame.getByRole('button', { name: 'Revisar classificação', exact: true }).click(); await frame.getByRole('heading', { name: 'Confirmar classificação', exact: true }).waitFor(); const last = calls.at(-1)!; assert.equal(last.name, 'classificar_despesas'); assert.deepEqual((last.arguments.dados as Fields).itens, [{ registro_id: 201, categoria_id: 2 }, { registro_id: 206, categoria_id: 1 }]); await fit(); await shot('classificacao-revisao')
    checks.push('classification_five_per_page_server_pagination_preserves_selection_and_individual_categories')
    await open(selection('classificacao'), 'consultar_classificacao_despesas'); await frame.getByRole('button', { name: 'Individual', exact: true }).click(); await frame.getByRole('checkbox').nth(0).click(); await frame.getByText('Valor da despesa',{exact:true}).waitFor(); assert.equal(await frame.getByRole('checkbox').count(),0); await frame.getByRole('button',{name:'Trocar despesa',exact:true}).click(); await frame.getByRole('checkbox').nth(1).click(); await frame.getByText('Farol Seguros',{exact:true}).waitFor(); assert.equal(await frame.getByText('Lume Arquitetura',{exact:true}).count(),0); assert.equal(calls.length, 0); await fit(); await shot('classificacao-individual')
    const reconciliation = { ...review('conciliacao', records(1)), items: [{ registro_id: 1, nome: 'Pagamento Pix', direcao: 'Saída', conta: 'Banco exemplo', data: '2026-10-17', valor_bancario: 1250, valor: 1250, correspondencia: 'Pagamento #482', descricao_correspondencia:'Hospedagem e infraestrutura',participante:'Fornecedor de exemplo',valor_correspondencia: 1250, data_correspondencia: '2026-10-17' }] }
    await open(reconciliation, 'conciliar_movimentacao'); await frame.getByRole('button', { name: 'Não corresponde', exact: true }).click(); await frame.getByText('Correspondência rejeitada somente nesta revisão. Nenhuma movimentação foi alterada.', { exact: true }).waitFor(); assert.equal(calls.length, 0)
    await open(reconciliation, 'conciliar_movimentacao'); await fit(); await shot('conciliacao-revisao');await frame.getByRole('button',{name:'✓ Conciliar',exact:true}).click();await frame.getByRole('heading',{name:'Conciliação concluída!',exact:true}).waitFor();assert.equal(calls.length,1);assert.equal(calls[0].name,'conciliar_movimentacao');assert.equal(calls[0].arguments.dados,undefined);await shot('conciliacao-resultado')
    checks.push('individual_mode_and_reject_reconciliation_are_local_and_never_write')
    for (const mode of ['failure', 'wrong-id']) {
      await open(review('notas'), 'emitir_notas_lote'); failing = mode === 'failure'; wrongId = mode === 'wrong-id'; await frame.getByRole('button', { name: 'Confirmar emissão', exact: true }).click(); await frame.getByRole('button', { name: 'Consultar situação', exact: true }).waitFor(); assert.equal(await frame.getByRole('button', { name: 'Confirmar emissão', exact: true }).count(), 0); assert.equal(calls.length, 1); failing = wrongId = false; await frame.getByRole('button', { name: 'Consultar situação', exact: true }).click(); await frame.getByRole('heading', { name: 'Emissão parcialmente concluída', exact: true }).waitFor(); assert.equal(calls.at(-1)!.name, 'consultar_operacao_fluxo')
    }
    checks.push('network_or_mismatched_operation_result_blocks_resubmission_and_offers_readonly_recovery')
    theme = 'dark'; await open(result()); await fit(); await shot('notas-parcial-dark'); await page.setViewportSize({ width: 320, height: 1000 }); await fit(); await page.setViewportSize({ width: 1000, height: 1000 }); await fit(); variant = 'claude'; await open(selection('classificacao'), 'consultar_classificacao_despesas'); assert.equal(await frame.getByRole('combobox').count(), 0); await frame.getByRole('button', { name: 'Abrir em tela cheia', exact: true }).click(); await frame.getByRole('combobox').first().waitFor(); assert.equal(calls.length, 0); assert.deepEqual(errors, []); checks.push('mobile_320_desktop_light_dark_claude_fullscreen_and_no_browser_errors')
  } finally { await browser.close(); await new Promise<void>(done => server.close(() => done())) }
}
async function main() { await backend(); await browserTests(); console.log(JSON.stringify({ ok: true, checks: checks.length, details: checks, realERPChanges: false }, null, 2)) }
main().catch(error => { console.error(error); process.exitCode = 1 })

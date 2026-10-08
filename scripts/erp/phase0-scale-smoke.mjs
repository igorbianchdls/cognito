// Fase 0 — escala: mede, no mesmo banco local com volume sintético, a lista financeira (sob RLS, papel do
// servidor) e o registro de um pagamento (com as validações diferidas) antes e depois das migrações da Fase 0.
// Somente PGlite em memória e dados fictícios. Uso: node scripts/erp/phase0-scale-smoke.mjs [parcelas]
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { db, restoreCatalog } from './evolution-fixture.mjs'
import { applySharedMigration } from '../shared/schema-contract.mjs'
import { applyPhase0Migrations } from './phase0-migrations.mjs'

const N = Math.max(200, Number(process.argv[2]) || 200)
const listSql = `SELECT p.id, e.nome, c.descricao, comp.saldo, count(*) OVER () AS total
  FROM erp.contas_receber_parcelas p
  JOIN erp.contas_receber c ON c.empresa_id = p.empresa_id AND c.id = p.conta_receber_id
  JOIN erp.entidades e ON e.empresa_id = c.empresa_id AND e.id = c.cliente_id
  CROSS JOIN LATERAL (SELECT p.valor - coalesce((SELECT sum(g.valor) FROM erp.pagamentos g WHERE g.empresa_id = p.empresa_id
      AND g.conta_receber_parcela_id = p.id AND g.estorno_de_pagamento_id IS NULL AND g.estornado_em IS NULL), 0) AS saldo OFFSET 0) comp
  WHERE p.empresa_id = $1 AND p.excluido_em IS NULL ORDER BY p.data_vencimento, p.id LIMIT 20`

async function asRuntime(fn) {
  await db.exec('BEGIN')
  try {
    await db.query("SELECT set_config('app.erp_tenant_id','1',true), set_config('app.erp_user_id','1',true), set_config('app.erp_time_zone','America/Sao_Paulo',true)")
    await db.exec('SET LOCAL ROLE erp_runtime')
    return await fn()
  } finally { await db.exec('ROLLBACK') }
}
async function measure(label) {
  const list = await asRuntime(async () => {
    const started = performance.now()
    const rows = (await db.query(listSql, [1])).rows
    assert.equal(rows.length, 20); assert.equal(Number(rows[0].total), N)
    return Math.round(performance.now() - started)
  })
  const payment = await asRuntime(async () => {
    const started = performance.now()
    await db.query(`INSERT INTO erp.pagamentos(empresa_id,tipo,conta_receber_parcela_id,conta_financeira_id,data_pagamento,valor,valor_liquido,chave_idempotencia)
      VALUES(1,'receber',1,1,'2026-10-05',10,10,'escala-${label}')`)
    await db.exec('SET CONSTRAINTS ALL IMMEDIATE')
    const status = (await db.query('SELECT status,valor_pago FROM erp.contas_receber_parcelas WHERE empresa_id=1 AND id=1')).rows[0]
    assert.equal(status.status, 'parcial'); assert.equal(Number(status.valor_pago), 10)
    return Math.round(performance.now() - started)
  })
  return { list, payment }
}

try {
  await restoreCatalog()
  for (const file of ['01-integridade-historicos.sql', '02-periodos-fechados.sql', '03-cadastros-documentos-contratos.sql', '04-adiantamentos-renegociacoes.sql'])
    await db.exec(readFileSync('scripts/erp/sql/' + file, 'utf8'))
  for (const file of ['20260909033000_drop_erp_financial_views.sql', '20260909040000_harden_erp_service_integrity.sql', '20261003170000_harden_erp_read_access.sql',
    '20261005020000_harden_erp_stock_operations.sql', '20261005021000_anchor_contract_cycles.sql'])
    await db.exec(readFileSync('supabase/migrations/' + file, 'utf8'))
  await applySharedMigration(db)
  await db.exec(`
    INSERT INTO shared.empresas(id,name,slug) VALUES(1,'Empresa A','a'),(2,'Empresa B','b');
    INSERT INTO shared.usuarios(id,email,full_name,clerk_user_id) VALUES(1,'owner@example.invalid','Owner','user_1');
    INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role,status) VALUES(1,1,'owner','active'),(2,1,'owner','active');
    INSERT INTO erp.entidades(id,empresa_id,nome,eh_cliente) SELECT g, 1, 'Cliente ' || g, true FROM generate_series(1,200) g;
    INSERT INTO erp.contas_financeiras(id,empresa_id,nome,tipo) VALUES(1,1,'Caixa','caixa');
    -- Volume sintético sem disparar triggers (carga inicial); a medição usa os triggers normalmente.
    SET session_replication_role = replica;
    INSERT INTO erp.contas_receber(id,empresa_id,cliente_id,descricao,valor_total,data_emissao,data_competencia)
      SELECT g, 1, 1 + (g % 200), 'Título ' || g, 100, '2026-01-01'::date + (g % 270), '2026-01-01'::date + (g % 270) FROM generate_series(1,${N}) g;
    INSERT INTO erp.contas_receber_parcelas(id,empresa_id,conta_receber_id,numero_parcela,data_vencimento,valor)
      SELECT g, 1, g, 1, '2026-01-15'::date + (g % 300), 100 FROM generate_series(1,${N}) g;
    SET session_replication_role = origin;
  `)
  const before = await measure('antes')
  await applyPhase0Migrations(db)
  const after = await measure('depois')
  const result = { parcelas: N, antes: before, depois: after,
    ganho: { lista: +(before.list / Math.max(after.list, 1)).toFixed(1), pagamento: +(before.payment / Math.max(after.payment, 1)).toFixed(1) } }
  // Critério: a Fase 0 reduz os dois tempos de forma clara no mesmo volume.
  assert(after.list * 2 <= before.list, 'Lista não ficou ao menos 2x mais rápida: ' + JSON.stringify(result))
  assert(after.payment * 3 <= before.payment, 'Pagamento não ficou ao menos 3x mais rápido: ' + JSON.stringify(result))
  console.log(JSON.stringify({ status: 'passed', ...result, localOnly: true }))
} catch (error) {
  console.error(JSON.stringify({ status: 'failed', message: error.message }))
  process.exitCode = 1
} finally { await db.close() }

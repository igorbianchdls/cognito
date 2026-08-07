import { readFileSync } from 'node:fs'

import pg from 'pg'

for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
}

function assert(condition, message) { if (!condition) throw new Error(message) }
assert(process.env.SUPABASE_DB_URL, 'SUPABASE_DB_URL nao configurada.')
const connection = new URL(process.env.SUPABASE_DB_URL)
connection.searchParams.delete('sslmode')
const client = new pg.Client({ connectionString: connection.toString(), ssl: { rejectUnauthorized: false } })
await client.connect()

try {
  await client.query('BEGIN')
  const structure = await client.query(`SELECT
    to_regclass('erp.ordens_servico') IS NOT NULL AS ordens_servico,
    to_regclass('erp.ordens_servico_itens') IS NOT NULL AS ordens_servico_itens,
    to_regclass('erp.ordens_servico_eventos') IS NOT NULL AS ordens_servico_eventos,
    to_regclass('erp.regras_conciliacao_bancaria') IS NOT NULL AS regras_conciliacao,
    to_regclass('erp.execucoes_automacao') IS NOT NULL AS execucoes_automacao,
    to_regclass('shared.erp_permission_profiles') IS NOT NULL AS perfis,
    (SELECT count(*) = 6 FROM shared.erp_permission_profiles) AS seis_perfis,
    EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'erp' AND indexname = 'regras_conciliacao_conta_unica_idx') AS regra_unica,
    EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'erp' AND indexname = 'conciliacoes_bancarias_itens_transacao_ativa_idx') AS conciliacao_reversivel,
    EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'erp' AND indexname = 'fechamentos_periodos_ativo_unico_idx') AS fechamento_unico,
    EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'erp' AND indexname = 'vendas_origem_documento_unica_idx') AS conversao_orcamento_unica,
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'erp' AND tablename = 'fechamentos_periodos' AND cmd = 'INSERT' AND with_check LIKE '%has_erp_capability%') AS fechamento_protegido,
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'erp' AND tablename = 'vendas' AND cmd = 'INSERT' AND with_check LIKE '%has_erp_capability%') AS vendas_protegidas,
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'erp' AND tablename = 'compras' AND cmd = 'UPDATE' AND qual LIKE '%has_erp_capability%') AS compras_protegidas,
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'erp' AND tablename = 'pagamentos' AND cmd = 'INSERT' AND with_check LIKE '%has_erp_capability%') AS financeiro_protegido,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'erp' AND table_name = 'vendas_itens' AND column_name = 'quantidade_faturada') AS faturamento_parcial,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'erp' AND table_name = 'compras_itens' AND column_name = 'quantidade_recebida') AS recebimento_parcial,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'shared' AND table_name = 'ai_action_approvals' AND column_name = 'processing_at') AS aprovacao_processing_at,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'shared' AND table_name = 'ai_action_approvals' AND column_name = 'processing_attempts') AS aprovacao_tentativas,
    EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'shared' AND indexname = 'ai_action_approvals_processing_idx') AS aprovacao_processing_index,
    NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'erp' AND cmd <> 'SELECT'
        AND tablename = ANY (ARRAY[
          'arquivos','cobrancas','cobrancas_eventos','cobrancas_notificacoes','compras_arquivos',
          'compras_eventos','compras_recorrencias','compras_recorrencias_geracoes','configuracoes_fiscais',
          'contas_pagar_arquivos','contas_pagar_eventos','contratos_vendas','contratos_vendas_geracoes',
          'contratos_vendas_itens','conversoes_unidades_produto','importacoes_bancarias','importacoes_dados',
          'importacoes_dados_linhas','kits_produtos','kits_produtos_itens','metodos_pagamento',
          'naturezas_operacao_compra','notas_fiscais_eventos','notas_fiscais_itens','rateios_financeiros',
          'recorrencias_financeiras','transferencias_estoque_itens','transferencias_financeiras'
        ])
        AND concat_ws(' ', qual, with_check) LIKE '%has_tenant_role%'
    ) AS politicas_residuais_protegidas`)
  for (const [name, value] of Object.entries(structure.rows[0])) assert(value, `Estrutura profissional ausente: ${name}`)

  const tenant = await client.query('SELECT id FROM shared.tenants ORDER BY id LIMIT 1')
  assert(tenant.rows[0], 'Nenhum tenant disponivel.')
  const tenantId = tenant.rows[0].id
  const customer = await client.query(`INSERT INTO erp.entidades
    (tenant_id, tipo_pessoa, nome, eh_cliente, eh_fornecedor, ativo)
    VALUES ($1, 'fisica', $2, true, false, true) RETURNING id`, [tenantId, `SMOKE-CLIENTE-${Date.now()}`])
  const service = await client.query(`INSERT INTO erp.servicos
    (tenant_id, nome, preco, custo, ativo) VALUES ($1, $2, 150, 40, true) RETURNING id`, [tenantId, `SMOKE-SERVICO-${Date.now()}`])
  const order = await client.query(`INSERT INTO erp.ordens_servico
    (tenant_id, cliente_id, numero, status, total, chave_idempotencia)
    VALUES ($1, $2, $3, 'rascunho', 150, $4) RETURNING id, versao`,
    [tenantId, customer.rows[0].id, `OS-SMOKE-${Date.now()}`, `smoke-${Date.now()}`])
  await client.query(`INSERT INTO erp.ordens_servico_itens
    (tenant_id, ordem_servico_id, servico_id, descricao, quantidade, valor_unitario, total)
    VALUES ($1, $2, $3, 'Servico smoke', 1, 150, 150)`, [tenantId, order.rows[0].id, service.rows[0].id])
  assert(Number(order.rows[0].versao) === 1, 'Versao inicial da ordem invalida.')

  const duplicateOrder = await client.query(`INSERT INTO erp.ordens_servico
    (tenant_id, cliente_id, numero, status, total, chave_idempotencia)
    VALUES ($1, $2, $3, 'rascunho', 150, $4) ON CONFLICT DO NOTHING RETURNING id`,
    [tenantId, customer.rows[0].id, `OS-SMOKE-DUP-${Date.now()}`, order.rows[0].id ? `smoke-${String(order.rows[0].id)}` : 'smoke'])
  assert(duplicateOrder.rowCount === 1, 'Preparacao da idempotencia da ordem falhou.')
  const duplicateAgain = await client.query(`INSERT INTO erp.ordens_servico
    (tenant_id, cliente_id, numero, status, total, chave_idempotencia)
    SELECT tenant_id, cliente_id, numero || '-OUTRA', status, total, chave_idempotencia
    FROM erp.ordens_servico WHERE tenant_id = $1 AND id = $2 ON CONFLICT DO NOTHING RETURNING id`,
    [tenantId, duplicateOrder.rows[0].id])
  assert(duplicateAgain.rowCount === 0, 'Indice de idempotencia permitiu ordem duplicada.')

  const ruleSql = `INSERT INTO erp.regras_conciliacao_bancaria
    (tenant_id, conta_financeira_id, nome, tolerancia_dias, tolerancia_valor)
    VALUES ($1, NULL, $2, 3, 0)
    ON CONFLICT (tenant_id, (COALESCE(conta_financeira_id, 0))) WHERE excluido_em IS NULL AND ativo = true
    DO UPDATE SET nome = EXCLUDED.nome RETURNING id`
  const rule = await client.query(ruleSql, [tenantId, 'Regra smoke'])
  const reusedRule = await client.query(ruleSql, [tenantId, 'Regra smoke atualizada'])
  assert(String(rule.rows[0].id) === String(reusedRule.rows[0].id), 'Regra global de conciliacao nao foi reutilizada.')

  await client.query(`INSERT INTO erp.fechamentos_periodos
    (tenant_id, modulo, periodo_inicio, periodo_fim, motivo)
    VALUES ($1, 'financeiro', '2000-01-01', '2000-01-31', 'Smoke')`, [tenantId])
  const closed = await client.query(`SELECT EXISTS (
    SELECT 1 FROM erp.fechamentos_periodos WHERE tenant_id = $1 AND modulo IN ('financeiro', 'todos')
      AND reaberto_em IS NULL AND '2000-01-15'::date BETWEEN periodo_inicio AND periodo_fim
  ) AS blocked`, [tenantId])
  assert(closed.rows[0].blocked, 'Fechamento nao bloqueia a competencia esperada.')

  console.log('ERP professional smoke: OK')
} finally {
  await client.query('ROLLBACK').catch(() => undefined)
  await client.end()
}

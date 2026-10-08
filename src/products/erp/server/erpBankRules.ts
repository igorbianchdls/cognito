import { runQuery, runWithErpTransactionClient, withTransaction } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { createManualFinancialTitle } from './erpCrudRepository'
import { createManagementOperation } from './erpManagementRepository'
import { settlePayableInstallment, settleReceivableInstallment } from './erpRepository'

// Fase 2C: regras de lançamento do extrato e conferência de saldo extrato × ERP.
type Actor = { tenantId: number; actorId: number }
type Rule = { id: string; conta_financeira_id: string | null; nome: string; descricao_contem: string; tipo_transacao: 'credito' | 'debito'; categoria_id: string; entidade_id: string }

export async function listLaunchRules(tenantId: number) {
  return runQuery(
    `SELECT r.id::text, r.nome, r.conta_financeira_id::text, contas.nome AS conta, r.descricao_contem, r.tipo_transacao,
       r.categoria_id::text, c.nome AS categoria, r.entidade_id::text, e.nome AS entidade, r.ativo, r.versao
     FROM erp.regras_lancamento_bancario r
     LEFT JOIN erp.contas_financeiras contas ON contas.empresa_id = r.empresa_id AND contas.id = r.conta_financeira_id
     JOIN erp.categorias c ON c.empresa_id = r.empresa_id AND c.id = r.categoria_id
     JOIN erp.entidades e ON e.empresa_id = r.empresa_id AND e.id = r.entidade_id
     WHERE r.empresa_id = $1 AND r.excluido_em IS NULL ORDER BY r.nome`, [tenantId])
}

export async function saveLaunchRule(input: Actor & { id?: number; values: Record<string, unknown> }) {
  const v = input.values
  const type = v.tipo_transacao === 'credito' ? 'credito' : 'debito'
  const text = String(v.descricao_contem || '').trim()
  if (text.length < 3) throw new ErpDomainError('VALIDATION_ERROR', 'Informe ao menos 3 letras do texto que aparece na descrição do extrato.', 422)
  return withTransaction(async client => {
    // Débito vira despesa paga a um fornecedor; crédito vira receita recebida de um cliente.
    const category = await client.query('SELECT tipo FROM erp.categorias WHERE empresa_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL', [input.tenantId, v.categoria_id])
    if (category.rows[0]?.tipo !== (type === 'debito' ? 'despesa' : 'receita')) throw new ErpDomainError('VALIDATION_ERROR', type === 'debito' ? 'Escolha uma categoria de despesa.' : 'Escolha uma categoria de receita.', 422)
    const entity = await client.query(`SELECT id FROM erp.entidades WHERE empresa_id = $1 AND id = $2 AND ${type === 'debito' ? 'eh_fornecedor' : 'eh_cliente'} AND excluido_em IS NULL`, [input.tenantId, v.entidade_id])
    if (!entity.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', type === 'debito' ? 'Escolha o fornecedor (ex.: o banco).' : 'Escolha o cliente (ex.: o banco).', 422)
    const params = [input.tenantId, v.conta_financeira_id || null, String(v.nome || text), text, type, v.categoria_id, v.entidade_id, v.ativo !== false, input.actorId]
    const result = input.id
      ? await client.query(`UPDATE erp.regras_lancamento_bancario SET conta_financeira_id = $2, nome = $3, descricao_contem = $4, tipo_transacao = $5,
          categoria_id = $6, entidade_id = $7, ativo = $8, atualizado_por = $9, versao = versao + 1
          WHERE empresa_id = $1 AND id = $10 AND excluido_em IS NULL RETURNING id::text`, [...params, input.id])
      : await client.query(`INSERT INTO erp.regras_lancamento_bancario (empresa_id, conta_financeira_id, nome, descricao_contem, tipo_transacao, categoria_id, entidade_id, ativo, criado_por, atualizado_por)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING id::text`, params)
    if (!result.rows[0]) throw new ErpDomainError('NOT_FOUND', 'Regra não encontrada.', 404)
    return result.rows[0]
  })
}

export async function deleteLaunchRule(input: Actor & { id: number }) {
  const rows = await runQuery('UPDATE erp.regras_lancamento_bancario SET excluido_em = now(), ativo = false, atualizado_por = $3 WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL RETURNING id::text',
    [input.tenantId, input.id, input.actorId])
  if (!rows[0]) throw new ErpDomainError('NOT_FOUND', 'Regra não encontrada.', 404)
  return { id: rows[0].id, excluida: true }
}

// Aplica as regras às transações pendentes (de uma importação ou da conta): cada transação que casa vira um título
// pago na conta do extrato e já conciliado. Uma falha numa transação não impede as demais.
export async function applyLaunchRules(input: Actor & { importId?: number; accountId?: number }) {
  const rules = await runQuery<Rule>(
    `SELECT id::text, conta_financeira_id::text, nome, descricao_contem, tipo_transacao, categoria_id::text, entidade_id::text
     FROM erp.regras_lancamento_bancario WHERE empresa_id = $1 AND ativo AND excluido_em IS NULL ORDER BY length(descricao_contem) DESC, id`, [input.tenantId])
  if (!rules.length) return { lancadas: 0, falhas: [] as Array<{ transacao_id: string; motivo: string }> }
  const transactions = await runQuery<{ id: string; conta_financeira_id: string; data: string; tipo: 'credito' | 'debito'; valor: string; descricao: string }>(
    `SELECT t.id::text, t.conta_financeira_id::text, t.data_transacao::text AS data, t.tipo, t.valor::text, t.descricao
     FROM erp.transacoes_bancarias t
     WHERE t.empresa_id = $1 AND t.status = 'pendente' AND t.excluido_em IS NULL
       AND ($2::bigint IS NULL OR t.importacao_bancaria_id = $2) AND ($3::bigint IS NULL OR t.conta_financeira_id = $3)
       AND NOT EXISTS (SELECT 1 FROM erp.conciliacoes_bancarias_itens i WHERE i.empresa_id = t.empresa_id AND i.transacao_bancaria_id = t.id AND i.desfeito_em IS NULL)
     ORDER BY t.data_transacao, t.id LIMIT 2000`, [input.tenantId, input.importId ?? null, input.accountId ?? null])
  let launched = 0
  const failures: Array<{ transacao_id: string; motivo: string }> = []
  for (const transaction of transactions) {
    const description = transaction.descricao.toLowerCase()
    const rule = rules.find(item => item.tipo_transacao === transaction.tipo && (!item.conta_financeira_id || item.conta_financeira_id === transaction.conta_financeira_id)
      && description.includes(item.descricao_contem.toLowerCase()))
    if (!rule) continue
    try {
      await withTransaction(client => runWithErpTransactionClient(client, async () => {
        const side = transaction.tipo === 'debito' ? 'pagar' : 'receber', value = Number(transaction.valor)
        const key = `extrato:${transaction.id}`
        const titleId = Number(await createManualFinancialTitle(client, input.tenantId, input.actorId, side, {
          [side === 'pagar' ? 'fornecedor_id' : 'cliente_id']: Number(rule.entidade_id), descricao: transaction.descricao.slice(0, 200),
          valor_total: value, data_competencia: transaction.data, data_emissao: transaction.data, categoria_id: Number(rule.categoria_id),
          conta_financeira_id: Number(transaction.conta_financeira_id), observacoes: `Lançado pela regra "${rule.nome}" a partir do extrato.`,
          parcelas: [{ data_vencimento: transaction.data, valor: value }],
        }, key, 'api'))
        const parcel = await client.query(`SELECT id FROM erp.contas_${side}_parcelas WHERE empresa_id = $1 AND conta_${side}_id = $2 ORDER BY numero_parcela LIMIT 1`, [input.tenantId, titleId])
        const settle = side === 'pagar' ? settlePayableInstallment : settleReceivableInstallment
        const settled = await settle({ tenantId: input.tenantId, actorId: input.actorId, id: String(parcel.rows[0].id), idempotencyKey: `${key}:baixa`,
          values: { valor: value, data_pagamento: transaction.data, conta_financeira_id: Number(transaction.conta_financeira_id) } }) as unknown as { payment: { id: string } }
        await createManagementOperation({ tenantId: input.tenantId, actorId: input.actorId, resource: 'conciliar-transacao', idempotencyKey: `${key}:conciliacao`,
          values: { transacao_bancaria_id: Number(transaction.id), pagamento_id: Number(settled.payment.id), origem_conciliacao: 'sugerida' } })
      }))
      launched += 1
    } catch (error) {
      failures.push({ transacao_id: transaction.id, motivo: error instanceof Error ? error.message : 'Falha ao lançar.' })
    }
  }
  return { lancadas: launched, falhas: failures }
}

// Extrato × ERP numa conta: último saldo informado pelo banco, saldo do ERP na mesma data, diferença,
// pendências e até que data tudo está conciliado.
export async function bankBalanceCheck(tenantId: number, accountId: number) {
  const [row] = await runQuery<Record<string, unknown>>(
    `WITH conta AS (SELECT id, nome, saldo_inicial, data_saldo_inicial FROM erp.contas_financeiras WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL),
     extrato AS (
       SELECT saldo, data FROM (
         SELECT i.saldo_extrato AS saldo, i.saldo_extrato_data AS data, i.criado_em FROM erp.importacoes_bancarias i
         WHERE i.empresa_id = $1 AND i.conta_financeira_id = $2 AND i.saldo_extrato IS NOT NULL
         UNION ALL
         SELECT t.saldo_apos, t.data_transacao, t.criado_em FROM erp.transacoes_bancarias t
         WHERE t.empresa_id = $1 AND t.conta_financeira_id = $2 AND t.saldo_apos IS NOT NULL AND t.excluido_em IS NULL
       ) s ORDER BY data DESC, criado_em DESC LIMIT 1),
     movimentos AS (
       SELECT p.data_pagamento AS data, p.valor_liquido * CASE WHEN p.estorno_de_pagamento_id IS NULL THEN 1 ELSE -1 END * CASE WHEN p.tipo = 'receber' THEN 1 ELSE -1 END AS valor
       FROM erp.pagamentos p WHERE p.empresa_id = $1 AND p.conta_financeira_id = $2 AND p.excluido_em IS NULL
       UNION ALL
       SELECT t.data_transferencia, CASE WHEN t.conta_destino_id = $2 THEN t.valor ELSE -t.valor END FROM erp.transferencias_financeiras t
       WHERE t.empresa_id = $1 AND t.status = 'concluida' AND t.excluido_em IS NULL AND (t.conta_origem_id = $2 OR t.conta_destino_id = $2)
       UNION ALL
       SELECT a.data_movimento, a.valor * CASE WHEN a.tipo = 'reversao' THEN CASE WHEN (o.lado = 'receber') = (o.tipo = 'constituicao') THEN -1 ELSE 1 END
         WHEN (a.lado = 'receber') = (a.tipo = 'constituicao') THEN 1 ELSE -1 END
       FROM erp.adiantamentos a LEFT JOIN erp.adiantamentos o ON o.empresa_id = a.empresa_id AND o.id = a.reversao_de_id
       WHERE a.empresa_id = $1 AND a.conta_financeira_id = $2),
     pendentes AS (
       SELECT t.data_transacao FROM erp.transacoes_bancarias t
       WHERE t.empresa_id = $1 AND t.conta_financeira_id = $2 AND t.status = 'pendente' AND t.excluido_em IS NULL)
     SELECT conta.nome, extrato.saldo AS saldo_extrato, extrato.data::text AS data_extrato,
       CASE WHEN extrato.data IS NULL THEN NULL ELSE conta.saldo_inicial + coalesce((SELECT sum(valor) FROM movimentos m
         WHERE m.data >= conta.data_saldo_inicial AND m.data <= extrato.data), 0) END AS saldo_erp,
       (SELECT count(*)::int FROM pendentes) AS pendentes,
       (SELECT min(data_transacao) - 1 FROM pendentes)::text AS conciliado_ate,
       (SELECT max(data_transacao)::text FROM erp.transacoes_bancarias t WHERE t.empresa_id = $1 AND t.conta_financeira_id = $2 AND t.excluido_em IS NULL) AS ultima_transacao
     FROM conta LEFT JOIN extrato ON true`, [tenantId, accountId])
  if (!row) throw new ErpDomainError('NOT_FOUND', 'Conta financeira não encontrada.', 404)
  const statement = row.saldo_extrato == null ? null : Number(row.saldo_extrato), erp = row.saldo_erp == null ? null : Number(row.saldo_erp)
  return {
    conta: row.nome, data_extrato: row.data_extrato, saldo_extrato: statement, saldo_erp: erp,
    diferenca: statement == null || erp == null ? null : Math.round((statement - erp) * 100) / 100,
    pendentes: Number(row.pendentes || 0),
    // Sem pendências, está conciliado até a última transação importada.
    conciliado_ate: Number(row.pendentes || 0) ? row.conciliado_ate : row.ultima_transacao,
  }
}

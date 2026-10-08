import { runQuery, withTransaction } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { dreReport } from './erpDreReport'

// Fase 2E: orçamento financeiro anual e metas de venda.
type Actor = { tenantId: number; actorId: number }
type Line = { categoria_id: number; centro_custo_id?: number | null; mes: number; valor: number }

export async function listBudgets(tenantId: number) {
  return runQuery(
    `SELECT o.id::text, o.ano, o.nome, o.status, o.versao,
       (SELECT coalesce(sum(CASE WHEN c.tipo = 'receita' THEN l.valor ELSE -l.valor END), 0) FROM erp.orcamentos_financeiros_linhas l
         JOIN erp.categorias c ON c.empresa_id = l.empresa_id AND c.id = l.categoria_id WHERE l.empresa_id = o.empresa_id AND l.orcamento_id = o.id) AS resultado_orcado
     FROM erp.orcamentos_financeiros o WHERE o.empresa_id = $1 AND o.excluido_em IS NULL ORDER BY o.ano DESC, o.nome`, [tenantId])
}

export async function getBudget(tenantId: number, id: number) {
  const [budget] = await runQuery<Record<string, unknown>>('SELECT id::text, ano, nome, status, versao FROM erp.orcamentos_financeiros WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL', [tenantId, id])
  if (!budget) throw new ErpDomainError('NOT_FOUND', 'Orçamento não encontrado.', 404)
  const lines = await runQuery(
    `SELECT l.categoria_id::text, c.nome AS categoria, c.tipo, l.centro_custo_id::text, l.mes, l.valor
     FROM erp.orcamentos_financeiros_linhas l JOIN erp.categorias c ON c.empresa_id = l.empresa_id AND c.id = l.categoria_id
     WHERE l.empresa_id = $1 AND l.orcamento_id = $2 ORDER BY c.tipo DESC, c.nome, l.mes`, [tenantId, id])
  return { record: budget, linhas: lines }
}

// Cria (ou substitui as linhas de) um orçamento. Atalhos: copiar o realizado de um ano (por competência), com
// reajuste percentual, ou distribuir um valor anual igualmente pelos 12 meses (linhas com mes = 0).
export async function saveBudget(input: Actor & { id?: number; expectedVersion?: number; values: {
  ano: number; nome: string; status?: 'rascunho' | 'aprovado'; linhas?: Line[]; copiar_realizado_de?: number; reajuste_percentual?: number
} }) {
  const v = input.values
  if (!Number.isInteger(v.ano) || v.ano < 2000 || v.ano > 2100) throw new ErpDomainError('VALIDATION_ERROR', 'Ano inválido.', 422)
  let lines: Line[] = []
  for (const line of v.linhas || []) {
    if (!(line.valor >= 0)) throw new ErpDomainError('VALIDATION_ERROR', 'Valores do orçamento são positivos (o tipo da categoria define se soma ou subtrai).', 422)
    // mes 0 = valor anual distribuído igualmente (centavos que sobram vão para dezembro).
    if (line.mes === 0) {
      const cents = Math.round(line.valor * 100), base = Math.floor(cents / 12)
      for (let month = 1; month <= 12; month++) lines.push({ ...line, mes: month, valor: (month === 12 ? cents - base * 11 : base) / 100 })
    } else if (line.mes >= 1 && line.mes <= 12) lines.push(line)
    else throw new ErpDomainError('VALIDATION_ERROR', 'Mês inválido no orçamento.', 422)
  }
  if (v.copiar_realizado_de) {
    const factor = 1 + (Number(v.reajuste_percentual) || 0) / 100
    const actual = await runQuery<{ categoria_id: string; mes: number; valor: string }>(
      `WITH t AS (
         SELECT coalesce(r.categoria_id, c.categoria_id) AS categoria_id, extract(month FROM c.data_competencia)::int AS mes, coalesce(r.valor, c.valor_total) AS valor
         FROM erp.contas_receber c LEFT JOIN erp.rateios_financeiros r ON r.empresa_id = c.empresa_id AND r.conta_receber_id = c.id AND r.excluido_em IS NULL
         WHERE c.empresa_id = $1 AND c.excluido_em IS NULL AND c.status <> 'cancelado' AND c.renegociacao_origem_id IS NULL AND c.tipo_lancamento = 'efetivo'
           AND extract(year FROM c.data_competencia) = $2
         UNION ALL
         SELECT coalesce(r.categoria_id, c.categoria_id), extract(month FROM c.data_competencia)::int, coalesce(r.valor, c.valor_total)
         FROM erp.contas_pagar c LEFT JOIN erp.rateios_financeiros r ON r.empresa_id = c.empresa_id AND r.conta_pagar_id = c.id AND r.excluido_em IS NULL
         WHERE c.empresa_id = $1 AND c.excluido_em IS NULL AND c.status <> 'cancelado' AND c.renegociacao_origem_id IS NULL AND c.tipo_lancamento = 'efetivo'
           AND extract(year FROM c.data_competencia) = $2)
       SELECT t.categoria_id::text, t.mes, sum(t.valor)::text AS valor FROM t
       JOIN erp.categorias cat ON cat.empresa_id = $1 AND cat.id = t.categoria_id AND NOT cat.fora_dre
       WHERE t.categoria_id IS NOT NULL GROUP BY 1, 2`, [input.tenantId, v.copiar_realizado_de])
    lines = [...lines, ...actual.map(row => ({ categoria_id: Number(row.categoria_id), mes: row.mes, valor: Math.round(Number(row.valor) * factor * 100) / 100 }))]
  }
  return withTransaction(async client => {
    const budget = input.id
      ? await client.query(`UPDATE erp.orcamentos_financeiros SET ano = $3, nome = $4, status = coalesce($5, status), versao = versao + 1, atualizado_por = $6
          WHERE empresa_id = $1 AND id = $2 AND versao = $7 AND excluido_em IS NULL RETURNING id, versao`, [input.tenantId, input.id, v.ano, v.nome, v.status ?? null, input.actorId, input.expectedVersion])
      : await client.query(`INSERT INTO erp.orcamentos_financeiros (empresa_id, ano, nome, status, criado_por, atualizado_por) VALUES ($1, $2, $3, coalesce($4, 'rascunho'), $5, $5) RETURNING id, versao`,
          [input.tenantId, v.ano, v.nome, v.status ?? null, input.actorId])
    if (!budget.rows[0]) throw new ErpDomainError('VERSION_CONFLICT', 'O orçamento foi alterado por outra pessoa. Atualize a tela.', 409)
    const id = Number(budget.rows[0].id)
    if (v.linhas || v.copiar_realizado_de) {
      await client.query('DELETE FROM erp.orcamentos_financeiros_linhas WHERE empresa_id = $1 AND orcamento_id = $2', [input.tenantId, id])
      // Linhas repetidas (mesma categoria, centro e mês) são somadas.
      const merged = new Map<string, Line>()
      for (const line of lines) {
        const key = `${line.categoria_id}|${line.centro_custo_id || 0}|${line.mes}`
        const current = merged.get(key)
        merged.set(key, current ? { ...current, valor: Math.round((current.valor + line.valor) * 100) / 100 } : line)
      }
      for (const line of merged.values()) if (line.valor > 0) await client.query(
        `INSERT INTO erp.orcamentos_financeiros_linhas (empresa_id, orcamento_id, categoria_id, centro_custo_id, mes, valor) VALUES ($1, $2, $3, $4, $5, $6)`,
        [input.tenantId, id, line.categoria_id, line.centro_custo_id || null, line.mes, line.valor])
    }
    return { id: String(id), versao: Number(budget.rows[0].versao), linhas: (await client.query('SELECT count(*)::int AS n FROM erp.orcamentos_financeiros_linhas WHERE empresa_id = $1 AND orcamento_id = $2', [input.tenantId, id])).rows[0].n }
  })
}

// Orçado × realizado na estrutura da DRE (competência), por mês até o mês informado e no acumulado.
export async function budgetVsActual(tenantId: number, id: number, untilMonth?: number) {
  const { record, linhas } = await getBudget(tenantId, id)
  const year = Number(record.ano), last = Math.min(12, Math.max(1, untilMonth || 12))
  const dre = await dreReport(tenantId, { inicio: `${year}-01-01`, fim: `${year}-${String(last).padStart(2, '0')}-${new Date(Date.UTC(year, last, 0)).getUTCDate()}`, visao: 'competencia' })
  const groups = await runQuery<{ codigo: number; nome: string; ordem: number }>('SELECT codigo, nome, ordem FROM erp.dre_grupos WHERE empresa_id = $1 ORDER BY ordem, codigo', [tenantId])
  const categoryGroup = await runQuery<{ id: string; codigo: number | null; pai: string | null }>(
    `SELECT c.id::text, g.codigo, c.categoria_pai_id::text AS pai FROM erp.categorias c LEFT JOIN erp.dre_grupos g ON g.empresa_id = c.empresa_id AND g.id = c.dre_grupo_id
     WHERE c.empresa_id = $1 AND NOT c.fora_dre`, [tenantId])
  const groupOf = new Map(categoryGroup.map(row => [row.id, row.codigo ?? 0]))
  const budgeted = new Map<number, number>()
  for (const line of linhas as Array<{ categoria_id: string; tipo: string; mes: number; valor: string }>) {
    if (Number(line.mes) > last) continue
    const code = groupOf.get(String(line.categoria_id)) ?? 0
    budgeted.set(code, Math.round(((budgeted.get(code) || 0) + (line.tipo === 'receita' ? 1 : -1) * Number(line.valor)) * 100) / 100)
  }
  const rows = [...groups, { codigo: 0, nome: 'Não classificado', ordem: 99 }].map(group => {
    const actual = dre.grupos.find(item => item.codigo === group.codigo)?.total || 0
    const planned = budgeted.get(group.codigo) || 0
    return { codigo: group.codigo, grupo: group.nome, orcado: planned, realizado: actual, desvio: Math.round((actual - planned) * 100) / 100,
      desvio_percentual: planned ? Math.round((actual - planned) / Math.abs(planned) * 1000) / 10 : null }
  }).filter(row => row.codigo !== 0 || row.orcado || row.realizado)
  const total = (key: 'orcado' | 'realizado') => Math.round(rows.reduce((sum, row) => sum + row[key], 0) * 100) / 100
  return { orcamento: record, ate_mes: last, linhas: rows, resultado: { orcado: total('orcado'), realizado: total('realizado'), desvio: Math.round((total('realizado') - total('orcado')) * 100) / 100 } }
}

export async function saveSalesGoal(input: Actor & { values: { vendedor_id?: number | null; mes: string; valor: number } }) {
  const month = String(input.values.mes || '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(month)) throw new ErpDomainError('VALIDATION_ERROR', 'Informe o mês da meta (AAAA-MM).', 422)
  if (!(input.values.valor > 0)) throw new ErpDomainError('VALIDATION_ERROR', 'A meta deve ser maior que zero.', 422)
  return withTransaction(async client => {
    if (input.values.vendedor_id) {
      const seller = await client.query('SELECT id FROM erp.entidades WHERE empresa_id = $1 AND id = $2 AND eh_vendedor AND excluido_em IS NULL', [input.tenantId, input.values.vendedor_id])
      if (!seller.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Vendedor não encontrado.', 422)
    }
    const result = await client.query(
      `INSERT INTO erp.metas_vendas (empresa_id, vendedor_id, mes, valor, criado_por, atualizado_por) VALUES ($1, $2, $3::date, $4, $5, $5)
       ON CONFLICT (empresa_id, (coalesce(vendedor_id, 0)), mes) DO UPDATE SET valor = EXCLUDED.valor, atualizado_por = EXCLUDED.atualizado_por, atualizado_em = now()
       RETURNING id::text`, [input.tenantId, input.values.vendedor_id || null, `${month}-01`, input.values.valor, input.actorId])
    return result.rows[0]
  })
}

// Atingimento das metas: vendas confirmadas (total, sem orçamentos) por vendedor e mês contra a meta.
export async function salesGoalsReport(tenantId: number, from: string, to: string) {
  return runQuery(
    `WITH metas AS (
       SELECT m.id, m.vendedor_id, m.mes, m.valor FROM erp.metas_vendas m WHERE m.empresa_id = $1 AND m.mes BETWEEN date_trunc('month', $2::date) AND $3::date
     )
     SELECT to_char(m.mes, 'YYYY-MM') AS mes, coalesce(v.nome, 'Empresa (todos)') AS vendedor, m.valor AS meta,
       coalesce((SELECT sum(s.total) FROM erp.vendas s WHERE s.empresa_id = $1 AND s.excluido_em IS NULL AND s.tipo_documento <> 'orcamento'
         AND s.status NOT IN ('rascunho', 'cancelada', 'cancelado') AND date_trunc('month', s.data_venda) = m.mes
         AND (m.vendedor_id IS NULL OR s.vendedor_id = m.vendedor_id)), 0)::numeric(18,2) AS realizado,
       round(coalesce((SELECT sum(s.total) FROM erp.vendas s WHERE s.empresa_id = $1 AND s.excluido_em IS NULL AND s.tipo_documento <> 'orcamento'
         AND s.status NOT IN ('rascunho', 'cancelada', 'cancelado') AND date_trunc('month', s.data_venda) = m.mes
         AND (m.vendedor_id IS NULL OR s.vendedor_id = m.vendedor_id)), 0) / m.valor * 100, 1) AS atingimento_percentual
     FROM metas m LEFT JOIN erp.entidades v ON v.empresa_id = $1 AND v.id = m.vendedor_id
     ORDER BY m.mes, vendedor`, [tenantId, from, to])
}

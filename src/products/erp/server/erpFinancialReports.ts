import { financialCompositionSql } from './erpRepository'

// Relatórios financeiros recriados como consultas (as views antigas foram removidas em 09/09/2026).
// Parâmetros comuns: $1 empresa, $2 início, $3 fim. "Hoje" vem do fuso da empresa (app.erp_time_zone).
const today = `(now() AT TIME ZONE coalesce(nullif(current_setting('app.erp_time_zone', true), ''), 'America/Sao_Paulo'))::date`

/**
 * Fluxo de caixa mensal: realizado (pagamentos e adiantamentos, líquidos, estornos na data da
 * reversão) e previsto (saldo das parcelas em aberto pelo vencimento; atrasadas entram no mês atual).
 * Contas a pagar em previsão entram no previsto, porque representam saídas esperadas.
 * Transferências entre contas não alteram o caixa total e ficam de fora.
 */
export const cashFlowSql = () => `WITH params AS (SELECT $2::date AS inicio, $3::date AS fim, ${today} AS hoje),
contas AS (
  SELECT id, coalesce(saldo_inicial, 0) AS saldo_inicial, data_saldo_inicial
  FROM erp.contas_financeiras WHERE empresa_id = $1 AND excluido_em IS NULL
),
movimentos AS (
  SELECT p.data_pagamento AS data, p.conta_financeira_id,
    CASE WHEN p.tipo = 'receber' THEN 1 ELSE -1 END * CASE WHEN p.estorno_de_pagamento_id IS NULL THEN 1 ELSE -1 END * p.valor_liquido AS valor
  FROM erp.pagamentos p WHERE p.empresa_id = $1 AND p.excluido_em IS NULL
  UNION ALL
  -- Adiantamento de cliente entra e de fornecedor sai; devolucao inverte; reversao anula o movimento original.
  SELECT a.data_movimento, a.conta_financeira_id,
    CASE WHEN a.lado = 'receber' THEN 1 ELSE -1 END
      * CASE coalesce(original.tipo, a.tipo) WHEN 'devolucao' THEN -1 ELSE 1 END
      * CASE WHEN a.tipo = 'reversao' THEN -1 ELSE 1 END * a.valor
  FROM erp.adiantamentos a
  LEFT JOIN erp.adiantamentos original ON original.empresa_id = a.empresa_id AND original.id = a.reversao_de_id
  WHERE a.empresa_id = $1
),
-- Movimentos anteriores ao saldo inicial de uma conta ja estão contidos nesse saldo.
validos AS (
  SELECT m.data, m.valor FROM movimentos m LEFT JOIN contas c ON c.id = m.conta_financeira_id
  WHERE c.data_saldo_inicial IS NULL OR m.data >= c.data_saldo_inicial
),
previstos AS (
  SELECT greatest(p.data_vencimento, params.hoje) AS data, composicao.saldo AS valor
  FROM erp.contas_receber_parcelas p
  JOIN erp.contas_receber c ON c.empresa_id = p.empresa_id AND c.id = p.conta_receber_id
  ${financialCompositionSql('receber', 'p')}
  CROSS JOIN params
  WHERE p.empresa_id = $1 AND p.excluido_em IS NULL AND c.excluido_em IS NULL AND p.status <> 'cancelado' AND composicao.saldo > 0
  UNION ALL
  SELECT greatest(p.data_vencimento, params.hoje), -composicao.saldo
  FROM erp.contas_pagar_parcelas p
  JOIN erp.contas_pagar c ON c.empresa_id = p.empresa_id AND c.id = p.conta_pagar_id
  ${financialCompositionSql('pagar', 'p')}
  CROSS JOIN params
  WHERE p.empresa_id = $1 AND p.excluido_em IS NULL AND c.excluido_em IS NULL AND p.status <> 'cancelado' AND composicao.saldo > 0
),
meses AS (
  SELECT generate_series(date_trunc('month', inicio), date_trunc('month', fim), interval '1 month')::date AS mes FROM params
),
realizado AS (
  SELECT date_trunc('month', v.data)::date AS mes, sum(v.valor) FILTER (WHERE v.valor > 0) AS entradas, -sum(v.valor) FILTER (WHERE v.valor < 0) AS saidas
  FROM validos v CROSS JOIN params WHERE v.data BETWEEN params.inicio AND params.fim GROUP BY 1
),
previsto AS (
  SELECT date_trunc('month', pv.data)::date AS mes, sum(pv.valor) FILTER (WHERE pv.valor > 0) AS entradas, -sum(pv.valor) FILTER (WHERE pv.valor < 0) AS saidas
  FROM previstos pv CROSS JOIN params WHERE pv.data BETWEEN params.inicio AND params.fim GROUP BY 1
),
aberturas AS (
  SELECT date_trunc('month', c.data_saldo_inicial)::date AS mes, sum(c.saldo_inicial) AS valor
  FROM contas c CROSS JOIN params WHERE c.data_saldo_inicial BETWEEN params.inicio AND params.fim GROUP BY 1
),
inicial AS (
  SELECT (SELECT coalesce(sum(c.saldo_inicial), 0) FROM contas c WHERE c.data_saldo_inicial IS NULL OR c.data_saldo_inicial < params.inicio)
    + (SELECT coalesce(sum(v.valor), 0) FROM validos v WHERE v.data < params.inicio) AS valor
  FROM params
),
linhas AS (
  SELECT meses.mes,
    coalesce(realizado.entradas, 0) AS entradas_realizadas, coalesce(realizado.saidas, 0) AS saidas_realizadas,
    coalesce(previsto.entradas, 0) AS entradas_previstas, coalesce(previsto.saidas, 0) AS saidas_previstas,
    coalesce(aberturas.valor, 0) AS saldo_inicial_contas
  FROM meses
  LEFT JOIN realizado ON realizado.mes = meses.mes
  LEFT JOIN previsto ON previsto.mes = meses.mes
  LEFT JOIN aberturas ON aberturas.mes = meses.mes
)
SELECT linhas.mes AS competencia,
  entradas_realizadas::numeric(18,2), saidas_realizadas::numeric(18,2),
  entradas_previstas::numeric(18,2), saidas_previstas::numeric(18,2), saldo_inicial_contas::numeric(18,2),
  (entradas_realizadas - saidas_realizadas + entradas_previstas - saidas_previstas + saldo_inicial_contas)::numeric(18,2) AS saldo_mes,
  (inicial.valor + sum(entradas_realizadas - saidas_realizadas + entradas_previstas - saidas_previstas + saldo_inicial_contas)
    OVER (ORDER BY linhas.mes))::numeric(18,2) AS saldo_acumulado
FROM linhas CROSS JOIN inicial
ORDER BY linhas.mes`

/** Saldos em aberto por cliente ou fornecedor e faixa de atraso na data final do período. */
export function agingSql(side: 'receber' | 'pagar') {
  const entity = side === 'receber' ? 'cliente' : 'fornecedor'
  return `SELECT coalesce(e.nome, min(x.nome_snapshot), 'Sem ${entity}') AS ${entity},
    count(*)::int AS parcelas,
    coalesce(sum(x.saldo) FILTER (WHERE x.atraso <= 0), 0)::numeric(18,2) AS a_vencer,
    coalesce(sum(x.saldo) FILTER (WHERE x.atraso BETWEEN 1 AND 30), 0)::numeric(18,2) AS vencido_1_30,
    coalesce(sum(x.saldo) FILTER (WHERE x.atraso BETWEEN 31 AND 60), 0)::numeric(18,2) AS vencido_31_60,
    coalesce(sum(x.saldo) FILTER (WHERE x.atraso BETWEEN 61 AND 90), 0)::numeric(18,2) AS vencido_61_90,
    coalesce(sum(x.saldo) FILTER (WHERE x.atraso > 90), 0)::numeric(18,2) AS vencido_mais_90,
    coalesce(sum(x.saldo) FILTER (WHERE x.atraso > 0), 0)::numeric(18,2) AS vencido,
    sum(x.saldo)::numeric(18,2) AS total
  FROM (
    SELECT c.${entity}_id AS entidade_id, c.${entity}_nome_snapshot AS nome_snapshot, composicao.saldo, ($3::date - p.data_vencimento) AS atraso
    FROM erp.contas_${side}_parcelas p
    JOIN erp.contas_${side} c ON c.empresa_id = p.empresa_id AND c.id = p.conta_${side}_id
    ${financialCompositionSql(side, 'p')}
    WHERE p.empresa_id = $1 AND p.excluido_em IS NULL AND c.excluido_em IS NULL AND p.status <> 'cancelado'
      AND composicao.saldo > 0 AND $2::date <= $3::date${side === 'pagar' ? " AND c.tipo_lancamento IS DISTINCT FROM 'previsao'" : ''}
  ) x
  LEFT JOIN erp.entidades e ON e.empresa_id = $1 AND e.id = x.entidade_id
  GROUP BY x.entidade_id, e.nome
  ORDER BY vencido DESC, total DESC, 1`
}

/**
 * Resultado por competência: títulos pela data de competência e categoria (rateios distribuem o valor),
 * sem títulos cancelados, previsões ou títulos gerados por renegociação; encargos e descontos de
 * renegociações entram na data do acordo, na categoria de ajuste.
 */
export const accrualResultSql = () => `WITH titulos AS (
  SELECT 'receita'::text AS tipo, 'receber'::text AS lado, c.id, c.data_competencia, c.valor_total, c.categoria_id
  FROM erp.contas_receber c
  WHERE c.empresa_id = $1 AND c.excluido_em IS NULL AND c.status <> 'cancelado' AND c.renegociacao_origem_id IS NULL
    AND c.data_competencia BETWEEN $2::date AND $3::date
  UNION ALL
  SELECT 'despesa', 'pagar', c.id, c.data_competencia, c.valor_total, c.categoria_id
  FROM erp.contas_pagar c
  WHERE c.empresa_id = $1 AND c.excluido_em IS NULL AND c.status <> 'cancelado' AND c.renegociacao_origem_id IS NULL
    AND c.tipo_lancamento IS DISTINCT FROM 'previsao' AND c.data_competencia BETWEEN $2::date AND $3::date
),
alocado AS (
  SELECT t.tipo, t.data_competencia AS data, coalesce(r.categoria_id, t.categoria_id) AS categoria_id, coalesce(r.valor, t.valor_total) AS valor
  FROM titulos t
  LEFT JOIN erp.rateios_financeiros r ON r.empresa_id = $1 AND r.excluido_em IS NULL
    AND ((t.lado = 'receber' AND r.conta_receber_id = t.id) OR (t.lado = 'pagar' AND r.conta_pagar_id = t.id))
  UNION ALL
  SELECT CASE WHEN a.lado = 'receber' THEN 'receita' ELSE 'despesa' END, a.data_acordo, a.categoria_ajuste_id, a.encargos - a.desconto
  FROM erp.renegociacoes a
  WHERE a.empresa_id = $1 AND a.status = 'efetivada' AND a.data_acordo BETWEEN $2::date AND $3::date AND (a.encargos <> 0 OR a.desconto <> 0)
)
SELECT date_trunc('month', alocado.data)::date AS competencia, coalesce(categorias.nome, 'Sem categoria') AS categoria, alocado.tipo,
  sum(CASE WHEN alocado.tipo = 'receita' THEN alocado.valor ELSE -alocado.valor END)::numeric(18,2) AS valor
FROM alocado LEFT JOIN erp.categorias ON categorias.empresa_id = $1 AND categorias.id = alocado.categoria_id
GROUP BY 1, categorias.id, categorias.nome, alocado.tipo
ORDER BY 1, alocado.tipo DESC, 2`

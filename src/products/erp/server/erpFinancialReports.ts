import { ERP_TODAY_SQL } from './erpBusinessDate'
import { financialCompositionSql } from './erpRepository'

// Relatórios financeiros recriados como consultas (as views antigas foram removidas em 09/09/2026).
// Parâmetros comuns: $1 empresa, $2 início, $3 fim. "Hoje" vem do fuso da empresa (app.erp_time_zone).
const today = ERP_TODAY_SQL

/**
 * Fluxo de caixa mensal: realizado (pagamentos e adiantamentos, líquidos, estornos na data da
 * reversão) e previsto (saldo das parcelas em aberto pelo vencimento; atrasadas entram no mês atual).
 * Contas a pagar em previsão entram no previsto, porque representam saídas esperadas.
 * Transferências entre contas não alteram o caixa total e ficam de fora, exceto as da conta da maquininha
 * (cartão): o saldo da maquininha ainda não é dinheiro disponível; o caixa recebe o repasse ao banco (realizado
 * quando conciliado, previsto na data do repasse pendente).
 */
export const cashFlowSql = () => `WITH params AS (SELECT $2::date AS inicio, $3::date AS fim, ${today} AS hoje),
contas AS (
  SELECT id, coalesce(saldo_inicial, 0) AS saldo_inicial, data_saldo_inicial
  FROM erp.contas_financeiras WHERE empresa_id = $1 AND excluido_em IS NULL AND tipo <> 'maquininha'
),
maquininhas AS (SELECT id FROM erp.contas_financeiras WHERE empresa_id = $1 AND tipo = 'maquininha'),
movimentos AS (
  SELECT p.data_pagamento AS data, p.conta_financeira_id,
    CASE WHEN p.tipo = 'receber' THEN 1 ELSE -1 END * CASE WHEN p.estorno_de_pagamento_id IS NULL THEN 1 ELSE -1 END * p.valor_liquido AS valor
  FROM erp.pagamentos p WHERE p.empresa_id = $1 AND p.excluido_em IS NULL AND coalesce(p.conta_financeira_id, 0) NOT IN (SELECT id FROM maquininhas)
  UNION ALL
  -- Repasse da maquininha concluído entra no caixa (e o caminho inverso sai).
  SELECT t.data_transferencia, CASE WHEN t.conta_origem_id IN (SELECT id FROM maquininhas) THEN t.conta_destino_id ELSE t.conta_origem_id END,
    CASE WHEN t.conta_origem_id IN (SELECT id FROM maquininhas) THEN t.valor ELSE -t.valor END
  FROM erp.transferencias_financeiras t
  WHERE t.empresa_id = $1 AND t.status = 'concluida' AND t.excluido_em IS NULL
    AND (t.conta_origem_id IN (SELECT id FROM maquininhas)) <> (t.conta_destino_id IN (SELECT id FROM maquininhas))
  UNION ALL
  -- Adiantamento de cliente entra e de fornecedor sai; devolucao inverte; reversao anula o movimento original.
  SELECT a.data_movimento, a.conta_financeira_id,
    CASE WHEN a.lado = 'receber' THEN 1 ELSE -1 END
      * CASE coalesce(original.tipo, a.tipo) WHEN 'devolucao' THEN -1 ELSE 1 END
      * CASE WHEN a.tipo = 'reversao' THEN -1 ELSE 1 END * a.valor
  FROM erp.adiantamentos a
  LEFT JOIN erp.adiantamentos original ON original.empresa_id = a.empresa_id AND original.id = a.reversao_de_id
  WHERE a.empresa_id = $1 AND coalesce(a.conta_financeira_id, 0) NOT IN (SELECT id FROM maquininhas)
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
  UNION ALL
  -- Repasses previstos do cartão (maquininha → banco).
  SELECT greatest(t.data_transferencia, params.hoje), t.valor
  FROM erp.transferencias_financeiras t CROSS JOIN params
  WHERE t.empresa_id = $1 AND t.status = 'pendente' AND t.excluido_em IS NULL
    AND t.conta_origem_id IN (SELECT id FROM maquininhas) AND t.conta_destino_id NOT IN (SELECT id FROM maquininhas)
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
      AND composicao.saldo > 0 AND $2::date <= $3::date AND c.tipo_lancamento IS DISTINCT FROM 'previsao'
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
export const accrualAllocationSql = () => `WITH titulos AS (
  SELECT 'receita'::text AS tipo, 'receber'::text AS lado, c.id, c.data_competencia, c.valor_total, c.categoria_id
  FROM erp.contas_receber c
  WHERE c.empresa_id = $1 AND c.excluido_em IS NULL AND c.status <> 'cancelado' AND c.renegociacao_origem_id IS NULL
    AND c.tipo_lancamento IS DISTINCT FROM 'previsao' AND c.data_competencia BETWEEN $2::date AND $3::date
  UNION ALL
  SELECT 'despesa', 'pagar', c.id, c.data_competencia, c.valor_total, c.categoria_id
  FROM erp.contas_pagar c
  WHERE c.empresa_id = $1 AND c.excluido_em IS NULL AND c.status <> 'cancelado' AND c.renegociacao_origem_id IS NULL
    AND c.tipo_lancamento IS DISTINCT FROM 'previsao' AND c.data_competencia BETWEEN $2::date AND $3::date
),
alocado AS (
  SELECT t.tipo, t.data_competencia AS data, coalesce(r.categoria_id, t.categoria_id) AS categoria_id, coalesce(r.valor, t.valor_total) AS valor, NULL::text AS rotulo
  FROM titulos t
  LEFT JOIN erp.rateios_financeiros r ON r.empresa_id = $1 AND r.excluido_em IS NULL
    AND ((t.lado = 'receber' AND r.conta_receber_id = t.id) OR (t.lado = 'pagar' AND r.conta_pagar_id = t.id))
  UNION ALL
  SELECT CASE WHEN a.lado = 'receber' THEN 'receita' ELSE 'despesa' END, a.data_acordo, a.categoria_ajuste_id, a.encargos - a.desconto, NULL::text
  FROM erp.renegociacoes a
  WHERE a.empresa_id = $1 AND a.status = 'efetivada' AND a.data_acordo BETWEEN $2::date AND $3::date AND (a.encargos <> 0 OR a.desconto <> 0)
  UNION ALL
  -- Devoluções de venda reduzem a receita na data da devolução.
  SELECT 'receita', d.data_devolucao, NULL::bigint, -d.valor_total, 'Devoluções de vendas'
  FROM erp.devolucoes d WHERE d.empresa_id = $1 AND d.data_devolucao BETWEEN $2::date AND $3::date
)`
export const accrualResultSql = () => `${accrualAllocationSql()}
SELECT date_trunc('month', alocado.data)::date AS competencia, coalesce(alocado.rotulo, categorias.nome, 'Sem categoria') AS categoria, alocado.tipo,
  sum(CASE WHEN alocado.tipo = 'receita' THEN alocado.valor ELSE -alocado.valor END)::numeric(18,2) AS valor
FROM alocado LEFT JOIN erp.categorias ON categorias.empresa_id = $1 AND categorias.id = alocado.categoria_id
GROUP BY 1, alocado.rotulo, categorias.id, categorias.nome, alocado.tipo
ORDER BY 1, alocado.tipo DESC, 2`

// CMV (Fase 2D): custo das saídas de estoque por venda (custo médio no momento da saída), na data da saída;
// devolução de cliente devolve o custo. Valor com sinal de despesa (negativo). Parâmetros: $1 empresa, $2 início, $3 fim.
export const cmvSql = () => `SELECT coalesce(m.data_operacional, (m.ocorrido_em AT TIME ZONE coalesce(nullif(current_setting('app.erp_time_zone', true), ''), 'America/Sao_Paulo'))::date) AS data,
    (m.quantidade * m.custo_unitario)::numeric(18,2) AS valor, coalesce(d.venda_id, CASE WHEN m.origem_tipo = 'venda' THEN m.origem_id END) AS venda_id, m.produto_id
  FROM erp.movimentacoes_estoque m
  LEFT JOIN erp.documentos_estoque d ON d.empresa_id = m.empresa_id AND d.id = m.documento_estoque_id
  WHERE m.empresa_id = $1 AND (m.origem_tipo IN ('venda', 'cancelamento_venda') OR d.venda_id IS NOT NULL)
    AND coalesce(m.data_operacional, (m.ocorrido_em AT TIME ZONE coalesce(nullif(current_setting('app.erp_time_zone', true), ''), 'America/Sao_Paulo'))::date) BETWEEN $2::date AND $3::date`

// Margem (Fase 2D) por venda, item (produto/serviço) ou cliente: receita líquida do item (desconto da venda
// rateado, sem frete), menos devoluções, menos o custo. Custo real das saídas de estoque quando o produto já foi
// entregue; senão o custo do cadastro no momento da venda (estimado). Vendas confirmadas no período.
export function marginSql(groupBy: 'venda' | 'item' | 'cliente') {
  const key = groupBy === 'venda' ? "v.numero AS venda, c.nome AS cliente" : groupBy === 'item' ? "i.descricao AS item, CASE WHEN i.produto_id IS NOT NULL THEN 'produto' ELSE 'servico' END AS tipo" : 'c.nome AS cliente'
  const group = groupBy === 'venda' ? 'v.id, v.numero, c.nome' : groupBy === 'item' ? 'i.descricao, 2' : 'c.id, c.nome'
  return `WITH itens AS (
    SELECT i.*, v.numero, v.cliente_id,
      round(i.total * CASE WHEN v.subtotal > 0 THEN greatest(v.total - coalesce(v.frete, 0), 0) / v.subtotal ELSE 0 END, 2) AS receita,
      coalesce((SELECT sum(di.valor) FROM erp.devolucoes_itens di WHERE di.empresa_id = i.empresa_id AND di.venda_item_id = i.id), 0) AS devolvido,
      (SELECT -sum(m.quantidade * m.custo_unitario) FROM erp.movimentacoes_estoque m
        LEFT JOIN erp.documentos_estoque d ON d.empresa_id = m.empresa_id AND d.id = m.documento_estoque_id
        WHERE m.empresa_id = i.empresa_id AND m.produto_id = i.produto_id AND (d.venda_id = i.venda_id OR (m.origem_tipo = 'venda' AND m.origem_id = i.venda_id))) AS custo_real
    FROM erp.vendas_itens i JOIN erp.vendas v ON v.empresa_id = i.empresa_id AND v.id = i.venda_id
    WHERE i.empresa_id = $1 AND i.excluido_em IS NULL AND v.excluido_em IS NULL AND v.tipo_documento <> 'orcamento'
      AND v.status NOT IN ('rascunho', 'cancelada', 'cancelado') AND v.data_venda BETWEEN $2::date AND $3::date
  )
  SELECT ${key}, count(*)::int AS itens,
    sum(i.receita - i.devolvido)::numeric(18,2) AS receita_liquida,
    sum(coalesce(i.custo_real, i.custo_unitario * i.quantidade))::numeric(18,2) AS custo,
    sum(i.receita - i.devolvido - coalesce(i.custo_real, i.custo_unitario * i.quantidade))::numeric(18,2) AS margem,
    CASE WHEN sum(i.receita - i.devolvido) > 0 THEN round(sum(i.receita - i.devolvido - coalesce(i.custo_real, i.custo_unitario * i.quantidade)) / sum(i.receita - i.devolvido) * 100, 1) END AS margem_percentual,
    bool_or(i.custo_real IS NULL AND i.produto_id IS NOT NULL) AS custo_estimado,
    bool_or(coalesce(i.custo_real, i.custo_unitario * i.quantidade) = 0) AS sem_custo
  FROM itens i JOIN erp.vendas v ON v.empresa_id = i.empresa_id AND v.id = i.venda_id JOIN erp.entidades c ON c.empresa_id = v.empresa_id AND c.id = v.cliente_id
  GROUP BY ${group} ORDER BY margem DESC NULLS LAST`
}

// Liberado: base faturamento = valor todo; base recebimento = valor × parte recebida da venda (dinheiro + créditos).
export const commissionReleasedSql = () => `WITH recebido AS (
    -- Abatimento por devolução liquida a parcela sem ser recebimento: fica fora do recebido.
    SELECT contas.venda_id, sum(composicao.dinheiro + composicao.credito - abatido.valor) AS recebido
    FROM erp.contas_receber contas
    JOIN erp.contas_receber_parcelas parcelas ON parcelas.empresa_id = contas.empresa_id AND parcelas.conta_receber_id = contas.id AND parcelas.excluido_em IS NULL
    ${financialCompositionSql('receber')}
    CROSS JOIN LATERAL (SELECT coalesce(sum(d.valor), 0) AS valor FROM erp.pagamentos d WHERE d.empresa_id = parcelas.empresa_id
      AND d.conta_receber_parcela_id = parcelas.id AND d.origem = 'devolucao' AND d.estornado_em IS NULL AND d.estorno_de_pagamento_id IS NULL) abatido
    WHERE contas.empresa_id = $1 AND contas.venda_id IS NOT NULL AND contas.excluido_em IS NULL AND contas.status <> 'cancelado'
    GROUP BY contas.venda_id
  ), lancamentos AS (
    SELECT l.*, v.numero AS venda, v.total AS venda_total, cli.nome AS cliente, vend.nome AS vendedor,
      CASE WHEN l.base = 'faturamento' THEN l.valor
        ELSE round(l.valor * least(1, coalesce(r.recebido, 0) / nullif(v.total - coalesce((SELECT sum(dv.valor_total) FROM erp.devolucoes dv
          WHERE dv.empresa_id = v.empresa_id AND dv.venda_id = v.id), 0), 0)), 2) END AS liberado
    FROM erp.comissoes_lancamentos l
    JOIN erp.vendas v ON v.empresa_id = l.empresa_id AND v.id = l.venda_id
    JOIN erp.entidades cli ON cli.empresa_id = v.empresa_id AND cli.id = v.cliente_id
    JOIN erp.entidades vend ON vend.empresa_id = l.empresa_id AND vend.id = l.vendedor_id
    LEFT JOIN recebido r ON r.venda_id = l.venda_id
    WHERE l.empresa_id = $1 AND l.status = 'ativa'
  )`


// Resumo de comissões por vendedor para a página de relatórios (parâmetros: empresa, início, fim).
export const commissionSummarySql = () => `${commissionReleasedSql()}
  SELECT vendedor, count(*)::int AS itens, sum(valor)::numeric(18,2) AS comissao, sum(liberado)::numeric(18,2) AS liberado,
    sum(valor_pago)::numeric(18,2) AS pago, sum(greatest(liberado - valor_pago, 0))::numeric(18,2) AS a_pagar
  FROM lancamentos WHERE competencia BETWEEN $2::date AND $3::date GROUP BY vendedor_id, vendedor ORDER BY vendedor`

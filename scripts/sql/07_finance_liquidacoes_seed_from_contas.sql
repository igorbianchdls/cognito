-- Seed realista de liquidacoes com base em contas a pagar/receber (tenant 1).
-- Idempotente: limpa e recria apenas financeiro.liquidacoes do tenant informado.

WITH cfg AS (
  SELECT 1::bigint AS tenant_id
)
DELETE FROM financeiro.liquidacoes l
USING cfg
WHERE l.tenant_id = cfg.tenant_id;

WITH cfg AS (
  SELECT 1::bigint AS tenant_id
),
contas_pool AS (
  SELECT
    COALESCE(array_agg(cf.id ORDER BY cf.id), ARRAY[]::bigint[]) AS ids,
    COUNT(*)::int AS size
  FROM financeiro.contas_financeiras cf
  JOIN cfg ON cfg.tenant_id = cf.tenant_id
),
conta_map AS (
  SELECT
    MAX(cf.id) FILTER (WHERE lower(cf.nome_conta) LIKE '%recebimentos pix%') AS conta_recebimentos_id,
    MAX(cf.id) FILTER (WHERE lower(cf.nome_conta) LIKE '%pagamentos fornecedores%') AS conta_pagamentos_id,
    MIN(cf.id) AS conta_any_id
  FROM financeiro.contas_financeiras cf
  JOIN cfg ON cfg.tenant_id = cf.tenant_id
),
metodo_map AS (
  SELECT
    MAX(mp.id) FILTER (WHERE lower(mp.nome) = 'pix') AS metodo_pix_id,
    MAX(mp.id) FILTER (WHERE lower(mp.nome) = 'boleto') AS metodo_boleto_id,
    MAX(mp.id) FILTER (WHERE lower(mp.nome) = 'ted') AS metodo_ted_id,
    MAX(mp.id) FILTER (
      WHERE lower(mp.nome) = 'transferência interna'
         OR lower(mp.nome) = 'transferencia interna'
    ) AS metodo_transferencia_id,
    MAX(mp.id) FILTER (WHERE lower(mp.nome) LIKE 'cart%') AS metodo_cartao_id,
    MIN(mp.id) AS metodo_any_id
  FROM financeiro.metodos_pagamento mp
  JOIN cfg ON cfg.tenant_id = mp.tenant_id
),
receber_base AS (
  SELECT
    cr.id AS conta_id,
    cr.tenant_id,
    lower(COALESCE(cr.status, 'pendente')) AS status_norm,
    cr.valor_liquido::numeric(18,2) AS valor_total,
    cr.data_lancamento,
    cr.data_vencimento
  FROM financeiro.contas_receber cr
  JOIN cfg ON cfg.tenant_id = cr.tenant_id
  WHERE cr.valor_liquido > 0
    AND lower(COALESCE(cr.status, '')) <> 'cancelado'
),
receber_plan AS (
  SELECT
    rb.*,
    CASE
      WHEN rb.status_norm IN ('recebido', 'pago') AND rb.conta_id % 4 = 0 THEN 2
      WHEN rb.status_norm IN ('recebido', 'pago') THEN 1
      WHEN rb.status_norm IN ('pendente', 'vencido', 'atrasado') AND rb.conta_id % 5 = 2 THEN 2
      WHEN rb.status_norm IN ('pendente', 'vencido', 'atrasado') AND rb.conta_id % 5 IN (0, 1) THEN 1
      ELSE 0
    END AS parcelas,
    CASE
      WHEN rb.status_norm IN ('recebido', 'pago') THEN 1.00::numeric
      WHEN rb.status_norm IN ('pendente', 'vencido', 'atrasado') AND rb.conta_id % 5 = 0 THEN 0.35::numeric
      WHEN rb.status_norm IN ('pendente', 'vencido', 'atrasado') AND rb.conta_id % 5 = 1 THEN 0.55::numeric
      WHEN rb.status_norm IN ('pendente', 'vencido', 'atrasado') AND rb.conta_id % 5 = 2 THEN 0.70::numeric
      ELSE 0.00::numeric
    END AS perc_total
  FROM receber_base rb
),
receber_expanded AS (
  SELECT
    rp.*,
    gs.parcela_ordem
  FROM receber_plan rp
  JOIN generate_series(1, 2) AS gs(parcela_ordem)
    ON gs.parcela_ordem <= rp.parcelas
  WHERE rp.parcelas > 0
),
receber_amounts AS (
  SELECT
    re.*,
    CASE
      WHEN re.parcelas = 1
        THEN round(re.valor_total * re.perc_total, 2)
      WHEN re.parcelas = 2 AND re.parcela_ordem = 1
        THEN round(re.valor_total * re.perc_total * (0.55 + ((re.conta_id % 3)::numeric * 0.10)), 2)
      WHEN re.parcelas = 2 AND re.parcela_ordem = 2
        THEN round(re.valor_total * re.perc_total, 2)
             - round(re.valor_total * re.perc_total * (0.55 + ((re.conta_id % 3)::numeric * 0.10)), 2)
      ELSE 0::numeric
    END::numeric(18,2) AS valor_movimento
  FROM receber_expanded re
),
receber_ready AS (
  SELECT
    ra.tenant_id,
    'receber'::varchar AS tipo,
    NULL::bigint AS conta_pagar_id,
    ra.conta_id::bigint AS conta_receber_id,
    CASE
      WHEN ra.status_norm IN ('recebido', 'pago')
        THEN GREATEST(ra.data_lancamento, (ra.data_vencimento + ((ra.parcela_ordem - 1) * 2 - 1)))
      ELSE LEAST(CURRENT_DATE, ra.data_lancamento + ((ra.conta_id % 17)::int) + ((ra.parcela_ordem - 1) * 4))
    END AS data_liquidacao,
    ra.data_lancamento,
    ra.data_vencimento,
    ra.valor_total,
    ra.parcela_ordem,
    ra.valor_movimento
  FROM receber_amounts ra
  WHERE ra.valor_movimento > 0
),
receber_final AS (
  SELECT
    rr.tenant_id,
    rr.tipo,
    rr.conta_pagar_id,
    rr.conta_receber_id,
    rr.data_liquidacao,
    GREATEST(rr.data_lancamento, rr.data_liquidacao) AS data_lancamento_eff,
    CASE
      WHEN cp.size > 0 THEN cp.ids[1 + (((rr.conta_receber_id + rr.parcela_ordem)::int % cp.size + cp.size) % cp.size)]
      ELSE NULL::bigint
    END AS conta_pool_id,
    CASE
      WHEN rr.conta_receber_id % 10 < 6 THEN COALESCE(cm.conta_recebimentos_id, cm.conta_any_id)
      WHEN rr.conta_receber_id % 10 < 8 THEN COALESCE(cm.conta_any_id, cm.conta_recebimentos_id)
      ELSE COALESCE(cm.conta_pagamentos_id, cm.conta_any_id)
    END AS conta_pref_id,
    CASE
      WHEN rr.conta_receber_id % 10 < 6 THEN COALESCE(mm.metodo_pix_id, mm.metodo_any_id)
      WHEN rr.conta_receber_id % 10 < 8 THEN COALESCE(mm.metodo_boleto_id, mm.metodo_any_id)
      ELSE COALESCE(mm.metodo_ted_id, mm.metodo_any_id)
    END AS metodo_pagamento_id,
    rr.valor_movimento,
    CASE
      WHEN rr.data_liquidacao <= rr.data_vencimento
        THEN round(rr.valor_movimento * ((rr.conta_receber_id % 3)::numeric * 0.004), 2)
      ELSE 0::numeric
    END::numeric(18,2) AS desconto_financeiro,
    CASE
      WHEN rr.data_liquidacao > rr.data_vencimento
        THEN round(rr.valor_movimento * LEAST(0.03::numeric, GREATEST((rr.data_liquidacao - rr.data_vencimento), 0)::numeric * 0.0015), 2)
      ELSE 0::numeric
    END::numeric(18,2) AS juros,
    CASE
      WHEN rr.data_liquidacao > rr.data_vencimento
        THEN round(rr.valor_movimento * 0.0025, 2)
      ELSE 0::numeric
    END::numeric(18,2) AS multa,
    rr.valor_total,
    rr.parcela_ordem
  FROM receber_ready rr
  CROSS JOIN contas_pool cp
  CROSS JOIN conta_map cm
  CROSS JOIN metodo_map mm
),
receber_ranked AS (
  SELECT
    rf.*,
    round(
      GREATEST(
        rf.valor_total
        - SUM(rf.valor_movimento) OVER (
          PARTITION BY rf.conta_receber_id
          ORDER BY rf.data_liquidacao, rf.parcela_ordem, rf.conta_receber_id
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ),
        0
      ),
      2
    )::numeric(18,2) AS saldo_apos_liquidacao
  FROM receber_final rf
)
INSERT INTO financeiro.liquidacoes (
  tenant_id,
  tipo,
  conta_pagar_id,
  conta_receber_id,
  data_liquidacao,
  data_lancamento,
  conta_financeira_id,
  metodo_pagamento_id,
  moeda,
  valor_movimento,
  desconto_financeiro,
  juros,
  multa,
  saldo_apos_liquidacao,
  status,
  observacao,
  criado_em,
  atualizado_em
)
SELECT
  rr.tenant_id,
  rr.tipo,
  rr.conta_pagar_id,
  rr.conta_receber_id,
  rr.data_liquidacao,
  rr.data_lancamento_eff,
  COALESCE(rr.conta_pref_id, rr.conta_pool_id),
  rr.metodo_pagamento_id,
  'BRL'::bpchar AS moeda,
  rr.valor_movimento,
  rr.desconto_financeiro,
  rr.juros,
  rr.multa,
  rr.saldo_apos_liquidacao,
  'confirmado'::varchar AS status,
  CASE
    WHEN rr.saldo_apos_liquidacao = 0 THEN 'Liquidação total automática de conta a receber'
    ELSE 'Liquidação parcial automática de conta a receber'
  END AS observacao,
  (rr.data_liquidacao::timestamp + ((rr.conta_receber_id % 7)::text || ' hours')::interval) AS criado_em,
  (rr.data_liquidacao::timestamp + ((rr.conta_receber_id % 7)::text || ' hours')::interval + interval '15 minutes') AS atualizado_em
FROM receber_ranked rr;

WITH cfg AS (
  SELECT 1::bigint AS tenant_id
),
contas_pool AS (
  SELECT
    COALESCE(array_agg(cf.id ORDER BY cf.id), ARRAY[]::bigint[]) AS ids,
    COUNT(*)::int AS size
  FROM financeiro.contas_financeiras cf
  JOIN cfg ON cfg.tenant_id = cf.tenant_id
),
conta_map AS (
  SELECT
    MAX(cf.id) FILTER (WHERE lower(cf.nome_conta) LIKE '%recebimentos pix%') AS conta_recebimentos_id,
    MAX(cf.id) FILTER (WHERE lower(cf.nome_conta) LIKE '%pagamentos fornecedores%') AS conta_pagamentos_id,
    MIN(cf.id) AS conta_any_id
  FROM financeiro.contas_financeiras cf
  JOIN cfg ON cfg.tenant_id = cf.tenant_id
),
metodo_map AS (
  SELECT
    MAX(mp.id) FILTER (WHERE lower(mp.nome) = 'pix') AS metodo_pix_id,
    MAX(mp.id) FILTER (WHERE lower(mp.nome) = 'boleto') AS metodo_boleto_id,
    MAX(mp.id) FILTER (WHERE lower(mp.nome) = 'ted') AS metodo_ted_id,
    MAX(mp.id) FILTER (
      WHERE lower(mp.nome) = 'transferência interna'
         OR lower(mp.nome) = 'transferencia interna'
    ) AS metodo_transferencia_id,
    MAX(mp.id) FILTER (WHERE lower(mp.nome) LIKE 'cart%') AS metodo_cartao_id,
    MIN(mp.id) AS metodo_any_id
  FROM financeiro.metodos_pagamento mp
  JOIN cfg ON cfg.tenant_id = mp.tenant_id
),
pagar_base AS (
  SELECT
    cp.id AS conta_id,
    cp.tenant_id,
    lower(COALESCE(cp.status, 'pendente')) AS status_norm,
    cp.valor_liquido::numeric(18,2) AS valor_total,
    cp.data_lancamento,
    cp.data_vencimento
  FROM financeiro.contas_pagar cp
  JOIN cfg ON cfg.tenant_id = cp.tenant_id
  WHERE cp.valor_liquido > 0
    AND lower(COALESCE(cp.status, '')) <> 'cancelado'
),
pagar_plan AS (
  SELECT
    pb.*,
    CASE
      WHEN pb.status_norm IN ('pago', 'recebido') AND pb.conta_id % 3 = 0 THEN 2
      WHEN pb.status_norm IN ('pago', 'recebido') THEN 1
      WHEN pb.status_norm IN ('pendente', 'vencido', 'atrasado') AND pb.conta_id % 4 = 1 THEN 2
      WHEN pb.status_norm IN ('pendente', 'vencido', 'atrasado') AND pb.conta_id % 4 = 0 THEN 1
      ELSE 0
    END AS parcelas,
    CASE
      WHEN pb.status_norm IN ('pago', 'recebido') THEN 1.00::numeric
      WHEN pb.status_norm IN ('pendente', 'vencido', 'atrasado') AND pb.conta_id % 4 = 0 THEN 0.40::numeric
      WHEN pb.status_norm IN ('pendente', 'vencido', 'atrasado') AND pb.conta_id % 4 = 1 THEN 0.65::numeric
      ELSE 0.00::numeric
    END AS perc_total
  FROM pagar_base pb
),
pagar_expanded AS (
  SELECT
    pp.*,
    gs.parcela_ordem
  FROM pagar_plan pp
  JOIN generate_series(1, 2) AS gs(parcela_ordem)
    ON gs.parcela_ordem <= pp.parcelas
  WHERE pp.parcelas > 0
),
pagar_amounts AS (
  SELECT
    pe.*,
    CASE
      WHEN pe.parcelas = 1
        THEN round(pe.valor_total * pe.perc_total, 2)
      WHEN pe.parcelas = 2 AND pe.parcela_ordem = 1
        THEN round(pe.valor_total * pe.perc_total * (0.52 + ((pe.conta_id % 4)::numeric * 0.08)), 2)
      WHEN pe.parcelas = 2 AND pe.parcela_ordem = 2
        THEN round(pe.valor_total * pe.perc_total, 2)
             - round(pe.valor_total * pe.perc_total * (0.52 + ((pe.conta_id % 4)::numeric * 0.08)), 2)
      ELSE 0::numeric
    END::numeric(18,2) AS valor_movimento
  FROM pagar_expanded pe
),
pagar_ready AS (
  SELECT
    pa.tenant_id,
    'pagar'::varchar AS tipo,
    pa.conta_id::bigint AS conta_pagar_id,
    NULL::bigint AS conta_receber_id,
    CASE
      WHEN pa.status_norm IN ('pago', 'recebido') AND pa.conta_id % 5 = 0
        THEN GREATEST(pa.data_lancamento, (pa.data_vencimento + ((pa.parcela_ordem - 1) * 3 + 1)))
      WHEN pa.status_norm IN ('pago', 'recebido')
        THEN GREATEST(pa.data_lancamento, (pa.data_vencimento + ((pa.parcela_ordem - 1) * 2 - 2)))
      WHEN pa.status_norm IN ('pendente', 'vencido', 'atrasado') AND pa.conta_id % 6 IN (0, 1)
        THEN LEAST(CURRENT_DATE, pa.data_vencimento + ((pa.parcela_ordem - 1) * 2 + 1))
      ELSE LEAST(CURRENT_DATE, pa.data_lancamento + ((pa.conta_id % 13)::int) + ((pa.parcela_ordem - 1) * 3))
    END AS data_liquidacao,
    pa.data_lancamento,
    pa.data_vencimento,
    pa.valor_total,
    pa.parcela_ordem,
    pa.valor_movimento
  FROM pagar_amounts pa
  WHERE pa.valor_movimento > 0
),
pagar_final AS (
  SELECT
    pr.tenant_id,
    pr.tipo,
    pr.conta_pagar_id,
    pr.conta_receber_id,
    pr.data_liquidacao,
    GREATEST(pr.data_lancamento, pr.data_liquidacao) AS data_lancamento_eff,
    CASE
      WHEN cp.size > 0 THEN cp.ids[1 + (((pr.conta_pagar_id + pr.parcela_ordem)::int % cp.size + cp.size) % cp.size)]
      ELSE NULL::bigint
    END AS conta_pool_id,
    CASE
      WHEN pr.conta_pagar_id % 10 < 7 THEN COALESCE(cm.conta_pagamentos_id, cm.conta_any_id)
      WHEN pr.conta_pagar_id % 10 < 9 THEN COALESCE(cm.conta_any_id, cm.conta_pagamentos_id)
      ELSE COALESCE(cm.conta_recebimentos_id, cm.conta_any_id)
    END AS conta_pref_id,
    CASE
      WHEN pr.conta_pagar_id % 10 < 5 THEN COALESCE(mm.metodo_ted_id, mm.metodo_any_id)
      WHEN pr.conta_pagar_id % 10 < 8 THEN COALESCE(mm.metodo_boleto_id, mm.metodo_any_id)
      WHEN pr.conta_pagar_id % 10 = 8 THEN COALESCE(mm.metodo_transferencia_id, mm.metodo_any_id)
      ELSE COALESCE(mm.metodo_cartao_id, mm.metodo_any_id)
    END AS metodo_pagamento_id,
    pr.valor_movimento,
    CASE
      WHEN pr.data_liquidacao <= pr.data_vencimento
        THEN round(pr.valor_movimento * ((pr.conta_pagar_id % 2)::numeric * 0.0035), 2)
      ELSE 0::numeric
    END::numeric(18,2) AS desconto_financeiro,
    CASE
      WHEN pr.data_liquidacao > pr.data_vencimento
        THEN round(pr.valor_movimento * LEAST(0.028::numeric, GREATEST((pr.data_liquidacao - pr.data_vencimento), 0)::numeric * 0.0013), 2)
      ELSE 0::numeric
    END::numeric(18,2) AS juros,
    CASE
      WHEN pr.data_liquidacao > pr.data_vencimento
        THEN round(pr.valor_movimento * 0.0020, 2)
      ELSE 0::numeric
    END::numeric(18,2) AS multa,
    pr.valor_total,
    pr.parcela_ordem
  FROM pagar_ready pr
  CROSS JOIN contas_pool cp
  CROSS JOIN conta_map cm
  CROSS JOIN metodo_map mm
),
pagar_ranked AS (
  SELECT
    pf.*,
    round(
      GREATEST(
        pf.valor_total
        - SUM(pf.valor_movimento) OVER (
          PARTITION BY pf.conta_pagar_id
          ORDER BY pf.data_liquidacao, pf.parcela_ordem, pf.conta_pagar_id
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ),
        0
      ),
      2
    )::numeric(18,2) AS saldo_apos_liquidacao
  FROM pagar_final pf
)
INSERT INTO financeiro.liquidacoes (
  tenant_id,
  tipo,
  conta_pagar_id,
  conta_receber_id,
  data_liquidacao,
  data_lancamento,
  conta_financeira_id,
  metodo_pagamento_id,
  moeda,
  valor_movimento,
  desconto_financeiro,
  juros,
  multa,
  saldo_apos_liquidacao,
  status,
  observacao,
  criado_em,
  atualizado_em
)
SELECT
  pr.tenant_id,
  pr.tipo,
  pr.conta_pagar_id,
  pr.conta_receber_id,
  pr.data_liquidacao,
  pr.data_lancamento_eff,
  COALESCE(pr.conta_pref_id, pr.conta_pool_id),
  pr.metodo_pagamento_id,
  'BRL'::bpchar AS moeda,
  pr.valor_movimento,
  pr.desconto_financeiro,
  pr.juros,
  pr.multa,
  pr.saldo_apos_liquidacao,
  'confirmado'::varchar AS status,
  CASE
    WHEN pr.saldo_apos_liquidacao = 0 THEN 'Liquidação total automática de conta a pagar'
    ELSE 'Liquidação parcial automática de conta a pagar'
  END AS observacao,
  (pr.data_liquidacao::timestamp + ((pr.conta_pagar_id % 6)::text || ' hours')::interval) AS criado_em,
  (pr.data_liquidacao::timestamp + ((pr.conta_pagar_id % 6)::text || ' hours')::interval + interval '20 minutes') AS atualizado_em
FROM pagar_ranked pr;

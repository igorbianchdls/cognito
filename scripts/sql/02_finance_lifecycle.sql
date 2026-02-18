-- Finance lifecycle: statuses + pagamentos + linhas

DELETE FROM financeiro.pagamentos_recebidos_linhas;
DELETE FROM financeiro.pagamentos_recebidos;
DELETE FROM financeiro.pagamentos_efetuados_linhas;
DELETE FROM financeiro.pagamentos_efetuados;

UPDATE financeiro.contas_receber
SET status = 'pendente',
    conta_financeira_id = NULL,
    atualizado_em = now()
WHERE tenant_id = 1;

UPDATE financeiro.contas_receber
SET status = 'cancelado',
    atualizado_em = now()
WHERE tenant_id = 1
  AND (abs(('x' || substr(md5(id::text), 1, 8))::bit(32)::int) % 100) < 6;

UPDATE financeiro.contas_receber
SET status = 'recebido',
    atualizado_em = now()
WHERE tenant_id = 1
  AND status <> 'cancelado'
  AND (abs(('x' || substr(md5(id::text), 1, 8))::bit(32)::int) % 100) BETWEEN 6 AND 43;

UPDATE financeiro.contas_receber
SET status = 'vencido',
    atualizado_em = now()
WHERE tenant_id = 1
  AND status = 'pendente'
  AND data_vencimento < DATE '2026-02-17'
  AND (abs(('x' || substr(md5(id::text), 1, 8))::bit(32)::int) % 100) BETWEEN 44 AND 61;

UPDATE financeiro.contas_pagar
SET status = 'pendente',
    conta_financeira_id = NULL,
    atualizado_em = now()
WHERE tenant_id = 1;

UPDATE financeiro.contas_pagar
SET status = 'cancelado',
    atualizado_em = now()
WHERE tenant_id = 1
  AND (abs(('x' || substr(md5(id::text), 1, 8))::bit(32)::int) % 100) < 8;

UPDATE financeiro.contas_pagar
SET status = 'pago',
    atualizado_em = now()
WHERE tenant_id = 1
  AND status <> 'cancelado'
  AND (abs(('x' || substr(md5(id::text), 1, 8))::bit(32)::int) % 100) BETWEEN 8 AND 41;

UPDATE financeiro.contas_pagar
SET status = 'vencido',
    atualizado_em = now()
WHERE tenant_id = 1
  AND status = 'pendente'
  AND data_vencimento < DATE '2026-02-17'
  AND (abs(('x' || substr(md5(id::text), 1, 8))::bit(32)::int) % 100) BETWEEN 42 AND 61;

WITH
cf AS (
  SELECT array_agg(id ORDER BY id) AS ids
  FROM financeiro.contas_financeiras
  WHERE tenant_id = 1 AND coalesce(ativo, true) = true
),
mp AS (
  SELECT array_agg(id ORDER BY id) AS ids
  FROM financeiro.metodos_pagamento
  WHERE tenant_id = 1 AND coalesce(ativo, true) = true
),
base AS (
  SELECT COALESCE(MAX(id), 0) AS max_id FROM financeiro.pagamentos_recebidos
),
targets AS (
  SELECT
    cr.id AS conta_id,
    row_number() OVER (ORDER BY cr.id) AS rn,
    cr.tenant_id,
    cr.numero_documento,
    cr.valor_liquido,
    GREATEST(
      cr.data_documento,
      LEAST(DATE '2026-02-17', cr.data_vencimento + INTERVAL '2 day')::date
    ) AS data_recebimento,
    (cf.ids)[((row_number() OVER (ORDER BY cr.id) - 1) % array_length(cf.ids, 1)) + 1] AS conta_financeira_id,
    (mp.ids)[((row_number() OVER (ORDER BY cr.id) - 1) % array_length(mp.ids, 1)) + 1] AS metodo_pagamento_id
  FROM financeiro.contas_receber cr
  CROSS JOIN cf
  CROSS JOIN mp
  WHERE cr.tenant_id = 1
    AND cr.status = 'recebido'
),
ins AS (
  INSERT INTO financeiro.pagamentos_recebidos
    (id, tenant_id, numero_pagamento, data_recebimento, data_lancamento, conta_financeira_id, metodo_pagamento_id, valor_total_recebido, status, observacao, criado_em, atualizado_em)
  SELECT
    base.max_id + t.rn AS id,
    t.tenant_id,
    'PR-' || to_char(t.data_recebimento, 'YYYYMM') || '-' || lpad(t.conta_id::text, 5, '0') AS numero_pagamento,
    t.data_recebimento,
    t.data_recebimento,
    t.conta_financeira_id,
    t.metodo_pagamento_id,
    t.valor_liquido,
    'recebido',
    'Baixa automática de ' || t.numero_documento,
    now(),
    now()
  FROM targets t
  CROSS JOIN base
  RETURNING id, observacao
)
SELECT count(*) FROM ins;

WITH
base AS (
  SELECT COALESCE(MAX(id), 0) AS max_id FROM financeiro.pagamentos_recebidos_linhas
),
rows_src AS (
  SELECT
    pr.id AS pagamento_id,
    regexp_replace(pr.observacao, '^Baixa automática de\s*', '') AS numero_documento,
    row_number() OVER (ORDER BY pr.id) AS rn
  FROM financeiro.pagamentos_recebidos pr
),
joined AS (
  SELECT
    rs.rn,
    rs.pagamento_id,
    cr.id AS conta_receber_id,
    cr.valor_liquido AS valor
  FROM rows_src rs
  JOIN financeiro.contas_receber cr
    ON cr.numero_documento = rs.numero_documento
   AND cr.tenant_id = 1
)
INSERT INTO financeiro.pagamentos_recebidos_linhas
  (id, pagamento_id, conta_receber_id, valor_original_documento, valor_recebido, saldo_apos_recebimento, desconto_financeiro, juros, multa, criado_em)
SELECT
  base.max_id + j.rn,
  j.pagamento_id,
  j.conta_receber_id,
  j.valor,
  j.valor,
  0,
  0,
  0,
  0,
  now()
FROM joined j
CROSS JOIN base;

WITH map_cf AS (
  SELECT
    pr.id,
    pr.conta_financeira_id,
    regexp_replace(pr.observacao, '^Baixa automática de\s*', '') AS numero_documento
  FROM financeiro.pagamentos_recebidos pr
)
UPDATE financeiro.contas_receber cr
SET conta_financeira_id = map_cf.conta_financeira_id,
    atualizado_em = now()
FROM map_cf
WHERE cr.tenant_id = 1
  AND cr.numero_documento = map_cf.numero_documento
  AND cr.status = 'recebido';

WITH
cf AS (
  SELECT array_agg(id ORDER BY id) AS ids
  FROM financeiro.contas_financeiras
  WHERE tenant_id = 1 AND coalesce(ativo, true) = true
),
mp AS (
  SELECT array_agg(id ORDER BY id) AS ids
  FROM financeiro.metodos_pagamento
  WHERE tenant_id = 1 AND coalesce(ativo, true) = true
),
base AS (
  SELECT COALESCE(MAX(id), 0) AS max_id FROM financeiro.pagamentos_efetuados
),
targets AS (
  SELECT
    cp.id AS conta_id,
    row_number() OVER (ORDER BY cp.id) AS rn,
    cp.tenant_id,
    cp.numero_documento,
    cp.valor_liquido,
    GREATEST(
      cp.data_documento,
      LEAST(DATE '2026-02-17', cp.data_vencimento + INTERVAL '1 day')::date
    ) AS data_pagamento,
    (cf.ids)[((row_number() OVER (ORDER BY cp.id) - 1) % array_length(cf.ids, 1)) + 1] AS conta_financeira_id,
    (mp.ids)[((row_number() OVER (ORDER BY cp.id) - 1) % array_length(mp.ids, 1)) + 1] AS metodo_pagamento_id
  FROM financeiro.contas_pagar cp
  CROSS JOIN cf
  CROSS JOIN mp
  WHERE cp.tenant_id = 1
    AND cp.status = 'pago'
),
ins AS (
  INSERT INTO financeiro.pagamentos_efetuados
    (id, tenant_id, numero_pagamento, data_pagamento, data_lancamento, conta_financeira_id, metodo_pagamento_id, valor_total_pagamento, status, observacao, criado_em, atualizado_em)
  SELECT
    base.max_id + t.rn AS id,
    t.tenant_id,
    'PE-' || to_char(t.data_pagamento, 'YYYYMM') || '-' || lpad(t.conta_id::text, 5, '0') AS numero_pagamento,
    t.data_pagamento,
    t.data_pagamento,
    t.conta_financeira_id,
    t.metodo_pagamento_id,
    t.valor_liquido,
    'pago',
    'Pagamento automático de ' || t.numero_documento,
    now(),
    now()
  FROM targets t
  CROSS JOIN base
  RETURNING id, observacao
)
SELECT count(*) FROM ins;

WITH
base AS (
  SELECT COALESCE(MAX(id), 0) AS max_id FROM financeiro.pagamentos_efetuados_linhas
),
rows_src AS (
  SELECT
    pe.id AS pagamento_id,
    regexp_replace(pe.observacao, '^Pagamento automático de\s*', '') AS numero_documento,
    row_number() OVER (ORDER BY pe.id) AS rn
  FROM financeiro.pagamentos_efetuados pe
),
joined AS (
  SELECT
    rs.rn,
    rs.pagamento_id,
    cp.id AS conta_pagar_id,
    cp.valor_liquido AS valor
  FROM rows_src rs
  JOIN financeiro.contas_pagar cp
    ON cp.numero_documento = rs.numero_documento
   AND cp.tenant_id = 1
)
INSERT INTO financeiro.pagamentos_efetuados_linhas
  (id, pagamento_id, conta_pagar_id, valor_original_documento, valor_pago, saldo_apos_pagamento, desconto_financeiro, juros, multa, criado_em)
SELECT
  base.max_id + j.rn,
  j.pagamento_id,
  j.conta_pagar_id,
  j.valor,
  j.valor,
  0,
  0,
  0,
  0,
  now()
FROM joined j
CROSS JOIN base;

WITH map_cf AS (
  SELECT
    pe.id,
    pe.conta_financeira_id,
    regexp_replace(pe.observacao, '^Pagamento automático de\s*', '') AS numero_documento
  FROM financeiro.pagamentos_efetuados pe
)
UPDATE financeiro.contas_pagar cp
SET conta_financeira_id = map_cf.conta_financeira_id,
    atualizado_em = now()
FROM map_cf
WHERE cp.tenant_id = 1
  AND cp.numero_documento = map_cf.numero_documento
  AND cp.status = 'pago';

-- Link orphan CRM activities to opportunities/leads/accounts/contacts

WITH opp AS (
  SELECT
    o.id,
    o.lead_id,
    o.conta_id,
    row_number() OVER (ORDER BY o.id) AS rn,
    count(*) OVER () AS cnt
  FROM crm.oportunidades o
  WHERE o.tenant_id = 1
),
orph AS (
  SELECT
    a.id,
    row_number() OVER (ORDER BY a.id) AS rn
  FROM crm.atividades a
  WHERE a.tenant_id = 1
    AND a.lead_id IS NULL
    AND a.oportunidade_id IS NULL
    AND a.conta_id IS NULL
    AND a.contato_id IS NULL
),
map_base AS (
  SELECT
    orph.id AS atividade_id,
    opp.id AS oportunidade_id,
    opp.lead_id AS lead_id,
    opp.conta_id AS conta_id
  FROM orph
  JOIN opp
    ON opp.rn = ((orph.rn - 1) % opp.cnt) + 1
),
map_full AS (
  SELECT
    mb.atividade_id,
    mb.oportunidade_id,
    mb.lead_id,
    COALESCE(mb.conta_id, l.conta_id) AS conta_id,
    COALESCE(
      l.contato_id,
      (
        SELECT c.id
        FROM crm.contatos c
        WHERE c.tenant_id = 1
          AND c.conta_id = COALESCE(mb.conta_id, l.conta_id)
        ORDER BY c.id
        LIMIT 1
      )
    ) AS contato_id
  FROM map_base mb
  LEFT JOIN crm.leads l
    ON l.id = mb.lead_id
)
UPDATE crm.atividades a
SET oportunidade_id = mf.oportunidade_id,
    lead_id = COALESCE(mf.lead_id, a.lead_id),
    conta_id = COALESCE(mf.conta_id, a.conta_id),
    contato_id = COALESCE(mf.contato_id, a.contato_id),
    atualizado_em = now()
FROM map_full mf
WHERE a.id = mf.atividade_id;

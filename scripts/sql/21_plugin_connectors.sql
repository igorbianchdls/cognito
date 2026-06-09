CREATE SCHEMA IF NOT EXISTS plugin;

CREATE TABLE IF NOT EXISTS plugin.connectors (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  domain text NOT NULL,
  provider text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'connected',
  external_account_id text NOT NULL DEFAULT 'default',
  scopes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  credentials_ref text NULL,
  last_sync_at timestamptz NULL,
  last_error text NULL,
  records_synced integer NOT NULL DEFAULT 0,
  source_table text NULL,
  source_id text NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connectors_unique_account UNIQUE (tenant_id, domain, provider, external_account_id)
);

CREATE TABLE IF NOT EXISTS plugin.connector_sync_runs (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  connector_id bigint NOT NULL REFERENCES plugin.connectors(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'success',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NULL,
  records_in integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  records_failed integer NOT NULL DEFAULT 0,
  error_message text NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS connectors_tenant_domain_idx ON plugin.connectors (tenant_id, domain);
CREATE INDEX IF NOT EXISTS connectors_tenant_status_idx ON plugin.connectors (tenant_id, status);
CREATE INDEX IF NOT EXISTS connectors_last_sync_idx ON plugin.connectors (tenant_id, last_sync_at);
CREATE INDEX IF NOT EXISTS connector_sync_runs_connector_idx ON plugin.connector_sync_runs (connector_id, started_at DESC);

WITH ecommerce_source AS (
  SELECT
    cc.tenant_id,
    'ecommerce'::text AS domain,
    cc.plataforma::text AS provider,
    COALESCE(NULLIF(cc.nome_conta::text, ''), cc.plataforma::text) AS name,
    CASE
      WHEN cred.ultimo_erro IS NOT NULL AND cred.ultimo_erro::text <> '' THEN 'error'
      WHEN LOWER(COALESCE(cc.status::text, '')) IN ('ativo', 'active', 'connected') THEN 'connected'
      ELSE 'warning'
    END AS status,
    COALESCE(NULLIF(cc.external_id::text, ''), cc.id::text) AS external_account_id,
    COALESCE(cred.escopos_jsonb, '[]'::jsonb) AS scopes_json,
    cred.segredo_ref::text AS credentials_ref,
    cc.synced_at::timestamptz AS last_sync_at,
    cred.ultimo_erro::text AS last_error,
    COUNT(p.id)::int AS records_synced,
    'ecommerce.canais_contas'::text AS source_table,
    cc.id::text AS source_id,
    jsonb_build_object(
      'ambiente', cc.ambiente,
      'seller_id', cc.seller_id,
      'source_updated_at', cc.source_updated_at
    ) AS metadata_json
  FROM ecommerce.canais_contas cc
  LEFT JOIN LATERAL (
    SELECT c.*
    FROM ecommerce.canais_credenciais c
    WHERE c.tenant_id = cc.tenant_id AND c.canal_conta_id = cc.id
    ORDER BY c.rotacionado_em DESC NULLS LAST
    LIMIT 1
  ) cred ON true
  LEFT JOIN ecommerce.pedidos p ON p.tenant_id = cc.tenant_id AND p.canal_conta_id = cc.id
  GROUP BY cc.id, cred.escopos_jsonb, cred.segredo_ref, cred.ultimo_erro
)
INSERT INTO plugin.connectors
  (tenant_id, domain, provider, name, status, external_account_id, scopes_json, credentials_ref, last_sync_at, last_error, records_synced, source_table, source_id, metadata_json, updated_at)
SELECT
  tenant_id, domain, provider, name, status, external_account_id, scopes_json, credentials_ref, last_sync_at, last_error, records_synced, source_table, source_id, metadata_json, now()
FROM ecommerce_source
ON CONFLICT (tenant_id, domain, provider, external_account_id)
DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  scopes_json = EXCLUDED.scopes_json,
  credentials_ref = EXCLUDED.credentials_ref,
  last_sync_at = EXCLUDED.last_sync_at,
  last_error = EXCLUDED.last_error,
  records_synced = EXCLUDED.records_synced,
  source_table = EXCLUDED.source_table,
  source_id = EXCLUDED.source_id,
  metadata_json = EXCLUDED.metadata_json,
  updated_at = now();

WITH marketing_source AS (
  SELECT
    cm.tenant_id,
    'marketing'::text AS domain,
    cm.plataforma::text AS provider,
    COALESCE(NULLIF(cm.nome_conta::text, ''), cm.plataforma::text) AS name,
    CASE
      WHEN cm.ativo IS TRUE AND LOWER(COALESCE(cm.status::text, '')) IN ('ativo', 'active', 'connected') THEN 'connected'
      WHEN cm.ativo IS TRUE THEN 'warning'
      ELSE 'error'
    END AS status,
    COALESCE(NULLIF(cm.conta_externa_id::text, ''), cm.id::text) AS external_account_id,
    '[]'::jsonb AS scopes_json,
    NULL::text AS credentials_ref,
    cm.ultimo_sync_em::timestamptz AS last_sync_at,
    NULL::text AS last_error,
    COUNT(dd.id)::int AS records_synced,
    'trafegopago.contas_midia'::text AS source_table,
    cm.id::text AS source_id,
    jsonb_build_object(
      'moeda', cm.moeda,
      'fuso_horario', cm.fuso_horario,
      'ativo', cm.ativo,
      'source_updated_at', cm.atualizado_em
    ) AS metadata_json
  FROM trafegopago.contas_midia cm
  LEFT JOIN trafegopago.desempenho_diario dd ON dd.tenant_id = cm.tenant_id AND dd.conta_id = cm.id
  GROUP BY cm.id
)
INSERT INTO plugin.connectors
  (tenant_id, domain, provider, name, status, external_account_id, scopes_json, credentials_ref, last_sync_at, last_error, records_synced, source_table, source_id, metadata_json, updated_at)
SELECT
  tenant_id, domain, provider, name, status, external_account_id, scopes_json, credentials_ref, last_sync_at, last_error, records_synced, source_table, source_id, metadata_json, now()
FROM marketing_source
ON CONFLICT (tenant_id, domain, provider, external_account_id)
DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  scopes_json = EXCLUDED.scopes_json,
  credentials_ref = EXCLUDED.credentials_ref,
  last_sync_at = EXCLUDED.last_sync_at,
  last_error = EXCLUDED.last_error,
  records_synced = EXCLUDED.records_synced,
  source_table = EXCLUDED.source_table,
  source_id = EXCLUDED.source_id,
  metadata_json = EXCLUDED.metadata_json,
  updated_at = now();

WITH tenants AS (
  SELECT tenant_id FROM financeiro.contas_pagar
  UNION SELECT tenant_id FROM financeiro.contas_receber
  UNION SELECT tenant_id FROM vendas.pedidos
  UNION SELECT tenant_id FROM compras.compras
),
erp_source AS (
  SELECT
    t.tenant_id,
    (
      (SELECT COUNT(*) FROM financeiro.contas_pagar cp WHERE cp.tenant_id = t.tenant_id) +
      (SELECT COUNT(*) FROM financeiro.contas_receber cr WHERE cr.tenant_id = t.tenant_id) +
      (SELECT COUNT(*) FROM vendas.pedidos vp WHERE vp.tenant_id = t.tenant_id) +
      (SELECT COUNT(*) FROM compras.compras co WHERE co.tenant_id = t.tenant_id)
    )::int AS records_synced,
    GREATEST(
      COALESCE((SELECT MAX(atualizado_em) FROM financeiro.contas_pagar cp WHERE cp.tenant_id = t.tenant_id), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM financeiro.contas_receber cr WHERE cr.tenant_id = t.tenant_id), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM vendas.pedidos vp WHERE vp.tenant_id = t.tenant_id), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM compras.compras co WHERE co.tenant_id = t.tenant_id), 'epoch'::timestamp)
    )::timestamptz AS last_sync_at
  FROM tenants t
)
INSERT INTO plugin.connectors
  (tenant_id, domain, provider, name, status, external_account_id, scopes_json, last_sync_at, records_synced, source_table, source_id, metadata_json, updated_at)
SELECT
  tenant_id,
  'erp',
  'erp',
  'ERP Operacional',
  CASE WHEN records_synced > 0 THEN 'connected' ELSE 'warning' END,
  'operacional',
  '[]'::jsonb,
  NULLIF(last_sync_at, 'epoch'::timestamptz),
  records_synced,
  'operacional',
  'operacional',
  jsonb_build_object('source', 'operational_data'),
  now()
FROM erp_source
ON CONFLICT (tenant_id, domain, provider, external_account_id)
DO UPDATE SET
  status = EXCLUDED.status,
  last_sync_at = EXCLUDED.last_sync_at,
  records_synced = EXCLUDED.records_synced,
  metadata_json = EXCLUDED.metadata_json,
  updated_at = now();

WITH tenants AS (
  SELECT tenant_id FROM crm.contas
  UNION SELECT tenant_id FROM crm.contatos
  UNION SELECT tenant_id FROM crm.leads
  UNION SELECT tenant_id FROM crm.oportunidades
  UNION SELECT tenant_id FROM crm.atividades
  UNION SELECT tenant_id FROM crm.interacoes
),
crm_source AS (
  SELECT
    t.tenant_id,
    (
      (SELECT COUNT(*) FROM crm.contas c WHERE c.tenant_id = t.tenant_id) +
      (SELECT COUNT(*) FROM crm.contatos ct WHERE ct.tenant_id = t.tenant_id) +
      (SELECT COUNT(*) FROM crm.leads l WHERE l.tenant_id = t.tenant_id) +
      (SELECT COUNT(*) FROM crm.oportunidades o WHERE o.tenant_id = t.tenant_id) +
      (SELECT COUNT(*) FROM crm.atividades a WHERE a.tenant_id = t.tenant_id) +
      (SELECT COUNT(*) FROM crm.interacoes i WHERE i.tenant_id = t.tenant_id)
    )::int AS records_synced,
    GREATEST(
      COALESCE((SELECT MAX(atualizado_em) FROM crm.contas c WHERE c.tenant_id = t.tenant_id), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM crm.contatos ct WHERE ct.tenant_id = t.tenant_id), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM crm.leads l WHERE l.tenant_id = t.tenant_id), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM crm.oportunidades o WHERE o.tenant_id = t.tenant_id), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM crm.atividades a WHERE a.tenant_id = t.tenant_id), 'epoch'::timestamp),
      COALESCE((SELECT MAX(atualizado_em) FROM crm.interacoes i WHERE i.tenant_id = t.tenant_id), 'epoch'::timestamp)
    )::timestamptz AS last_sync_at
  FROM tenants t
)
INSERT INTO plugin.connectors
  (tenant_id, domain, provider, name, status, external_account_id, scopes_json, last_sync_at, records_synced, source_table, source_id, metadata_json, updated_at)
SELECT
  tenant_id,
  'crm',
  'crm',
  'CRM Operacional',
  CASE WHEN records_synced > 0 THEN 'connected' ELSE 'warning' END,
  'operacional',
  '[]'::jsonb,
  NULLIF(last_sync_at, 'epoch'::timestamptz),
  records_synced,
  'operacional',
  'operacional',
  jsonb_build_object('source', 'operational_data', 'includes_interacoes', true),
  now()
FROM crm_source
ON CONFLICT (tenant_id, domain, provider, external_account_id)
DO UPDATE SET
  status = EXCLUDED.status,
  last_sync_at = EXCLUDED.last_sync_at,
  records_synced = EXCLUDED.records_synced,
  metadata_json = EXCLUDED.metadata_json,
  updated_at = now();

INSERT INTO plugin.connector_sync_runs
  (tenant_id, connector_id, status, started_at, finished_at, records_in, records_updated, records_failed, error_message, metadata_json)
SELECT
  c.tenant_id,
  c.id,
  CASE WHEN c.status = 'error' THEN 'error' ELSE 'success' END,
  c.last_sync_at,
  c.last_sync_at,
  c.records_synced,
  c.records_synced,
  0,
  c.last_error,
  jsonb_build_object('backfill', true, 'source_table', c.source_table)
FROM plugin.connectors c
WHERE c.last_sync_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM plugin.connector_sync_runs r
    WHERE r.connector_id = c.id
      AND r.started_at = c.last_sync_at
  );

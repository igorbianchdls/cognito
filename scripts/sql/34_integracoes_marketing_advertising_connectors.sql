BEGIN;

ALTER TABLE mcp_app.integration_connections
  DROP CONSTRAINT IF EXISTS integration_connections_domain_check;

ALTER TABLE mcp_app.integration_connections
  ADD CONSTRAINT integration_connections_domain_check
  CHECK (domain IN ('erp', 'crm', 'ecommerce', 'marketing', 'advertising', 'database', 'bi', 'automation'));

ALTER TABLE mcp_app.integration_provider_capabilities
  DROP CONSTRAINT IF EXISTS integration_provider_capabilities_domain_check;

ALTER TABLE mcp_app.integration_provider_capabilities
  ADD CONSTRAINT integration_provider_capabilities_domain_check
  CHECK (domain IN ('erp', 'crm', 'ecommerce', 'marketing', 'advertising', 'database', 'bi', 'automation'));

WITH
marketing_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'accounts', 'name', 'Contas e propriedades', 'defaultEnabled', true),
    jsonb_build_object('slug', 'traffic_daily', 'name', 'Trafego diario', 'defaultEnabled', true),
    jsonb_build_object('slug', 'pages_daily', 'name', 'Paginas por dia', 'defaultEnabled', true),
    jsonb_build_object('slug', 'queries_daily', 'name', 'Consultas por dia', 'defaultEnabled', false),
    jsonb_build_object('slug', 'events_daily', 'name', 'Eventos por dia', 'defaultEnabled', false)
  ) AS resources_json
),
advertising_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'accounts', 'name', 'Contas de anuncio', 'defaultEnabled', true),
    jsonb_build_object('slug', 'campaigns', 'name', 'Campanhas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'ad_groups', 'name', 'Grupos de anuncios', 'defaultEnabled', true),
    jsonb_build_object('slug', 'ads', 'name', 'Anuncios', 'defaultEnabled', true),
    jsonb_build_object('slug', 'insights_campaign_daily', 'name', 'Metricas de campanha por dia', 'defaultEnabled', true),
    jsonb_build_object('slug', 'insights_ad_daily', 'name', 'Metricas de anuncio por dia', 'defaultEnabled', false)
  ) AS resources_json
),
providers AS (
  SELECT 'marketing'::text AS domain, 'google_search_console'::text AS provider, 'Google Search Console'::text AS name, 'Marketing organico de busca com paginas, consultas e desempenho diario.'::text AS description, 'oauth2'::text AS auth_type, true AS supports_oauth_callback, true AS supports_incremental_sync, jsonb_build_array('manual', 'scheduled') AS sync_modes_json, marketing_resources.resources_json, jsonb_build_array('marketing', 'organico', 'seo', 'google') AS tags_json, 'available'::text AS status, jsonb_build_object('toolkitSlug', 'GOOGLE_SEARCH_CONSOLE') AS metadata_json
  FROM marketing_resources
  UNION ALL
  SELECT 'marketing', 'google_analytics_4', 'Google Analytics 4', 'Marketing organico e analytics com trafego, paginas e eventos.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), marketing_resources.resources_json, jsonb_build_array('marketing', 'organico', 'analytics', 'google'), 'available', jsonb_build_object('toolkitSlug', 'GOOGLE_ANALYTICS_4')
  FROM marketing_resources
  UNION ALL
  SELECT 'advertising', 'meta_ads', 'Meta Ads', 'Publicidade paga em Facebook e Instagram com campanhas, anuncios e metricas diarias.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), advertising_resources.resources_json, jsonb_build_array('advertising', 'publicidade', 'paid-media', 'meta'), 'available', jsonb_build_object('toolkitSlug', 'META_ADS')
  FROM advertising_resources
  UNION ALL
  SELECT 'advertising', 'google_ads', 'Google Ads', 'Publicidade paga no Google Ads com campanhas, grupos, anuncios e metricas diarias.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), advertising_resources.resources_json, jsonb_build_array('advertising', 'publicidade', 'paid-media', 'google'), 'available', jsonb_build_object('toolkitSlug', 'GOOGLE_ADS')
  FROM advertising_resources
)
INSERT INTO mcp_app.integration_provider_capabilities
  (domain, provider, name, description, auth_type, supports_oauth_callback, supports_incremental_sync, sync_modes_json, resources_json, tags_json, status, metadata_json, updated_at)
SELECT
  domain, provider, name, description, auth_type, supports_oauth_callback, supports_incremental_sync, sync_modes_json, resources_json, tags_json, status, metadata_json, now()
FROM providers
ON CONFLICT (domain, provider)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  auth_type = EXCLUDED.auth_type,
  supports_oauth_callback = EXCLUDED.supports_oauth_callback,
  supports_incremental_sync = EXCLUDED.supports_incremental_sync,
  sync_modes_json = EXCLUDED.sync_modes_json,
  resources_json = EXCLUDED.resources_json,
  tags_json = EXCLUDED.tags_json,
  status = EXCLUDED.status,
  metadata_json = EXCLUDED.metadata_json,
  updated_at = now();

COMMIT;

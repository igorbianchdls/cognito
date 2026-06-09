BEGIN;

ALTER TABLE plugin.integration_connections
  DROP CONSTRAINT IF EXISTS integration_connections_domain_check;

ALTER TABLE plugin.integration_connections
  ADD CONSTRAINT integration_connections_domain_check
  CHECK (domain IN ('erp', 'crm', 'ecommerce', 'analytics', 'marketing', 'advertising', 'database', 'bi', 'automation'));

ALTER TABLE plugin.integration_provider_capabilities
  DROP CONSTRAINT IF EXISTS integration_provider_capabilities_domain_check;

ALTER TABLE plugin.integration_provider_capabilities
  ADD CONSTRAINT integration_provider_capabilities_domain_check
  CHECK (domain IN ('erp', 'crm', 'ecommerce', 'analytics', 'marketing', 'advertising', 'database', 'bi', 'automation'));

UPDATE plugin.integration_connections
SET domain = 'analytics', updated_at = now()
WHERE domain = 'marketing'
  AND provider IN ('google_analytics_4', 'google_search_console');

DELETE FROM plugin.integration_provider_capabilities
WHERE domain = 'marketing'
  AND provider IN ('google_analytics_4', 'google_search_console');

WITH
analytics_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'accounts', 'name', 'Contas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'traffic_daily', 'name', 'Trafego diario', 'defaultEnabled', true),
    jsonb_build_object('slug', 'pages_daily', 'name', 'Paginas por dia', 'defaultEnabled', true),
    jsonb_build_object('slug', 'queries_daily', 'name', 'Consultas por dia', 'defaultEnabled', false),
    jsonb_build_object('slug', 'events_daily', 'name', 'Eventos por dia', 'defaultEnabled', false)
  ) AS resources_json
),
google_business_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'accounts', 'name', 'Contas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'locations', 'name', 'Locais', 'defaultEnabled', true),
    jsonb_build_object('slug', 'traffic_daily', 'name', 'Performance diaria', 'defaultEnabled', true),
    jsonb_build_object('slug', 'reviews', 'name', 'Avaliacoes', 'defaultEnabled', false),
    jsonb_build_object('slug', 'local_posts', 'name', 'Posts locais', 'defaultEnabled', false)
  ) AS resources_json
),
providers AS (
  SELECT 'analytics'::text AS domain, 'google_analytics_4'::text AS provider, 'Google Analytics'::text AS name, 'Trafego, paginas, eventos e conversoes de propriedades GA4.'::text AS description, 'oauth2'::text AS auth_type, true AS supports_oauth_callback, true AS supports_incremental_sync, jsonb_build_array('manual', 'scheduled') AS sync_modes_json, analytics_resources.resources_json, jsonb_build_array('analytics', 'web-analytics', 'google') AS tags_json, 'available'::text AS status, jsonb_build_object('toolkitSlug', 'GOOGLE_ANALYTICS_4') AS metadata_json
  FROM analytics_resources
  UNION ALL
  SELECT 'analytics', 'google_my_business', 'Google My Business', 'Perfis locais do Google com locais, avaliacoes, posts e metricas de performance.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), google_business_resources.resources_json, jsonb_build_array('analytics', 'local', 'business-profile', 'google'), 'available', jsonb_build_object('toolkitSlug', 'GOOGLE_MY_BUSINESS')
  FROM google_business_resources
  UNION ALL
  SELECT 'analytics', 'google_search_console', 'Google Search Console', 'Performance organica de busca, consultas, paginas, paises e dispositivos.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), analytics_resources.resources_json, jsonb_build_array('analytics', 'seo', 'google'), 'available', jsonb_build_object('toolkitSlug', 'GOOGLE_SEARCH_CONSOLE')
  FROM analytics_resources
)
INSERT INTO plugin.integration_provider_capabilities
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

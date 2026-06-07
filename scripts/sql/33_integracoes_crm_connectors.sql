WITH crm_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'contas', 'name', 'Contas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'contatos', 'name', 'Contatos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'leads', 'name', 'Leads', 'defaultEnabled', true),
    jsonb_build_object('slug', 'oportunidades', 'name', 'Oportunidades', 'defaultEnabled', true),
    jsonb_build_object('slug', 'atividades', 'name', 'Atividades', 'defaultEnabled', false),
    jsonb_build_object('slug', 'usuarios', 'name', 'Usuarios', 'defaultEnabled', false),
    jsonb_build_object('slug', 'pipelines', 'name', 'Pipelines', 'defaultEnabled', false),
    jsonb_build_object('slug', 'fases_pipeline', 'name', 'Fases do pipeline', 'defaultEnabled', false)
  ) AS resources_json
),
providers AS (
  SELECT
    'crm'::text AS domain,
    'bitrix24'::text AS provider,
    'Bitrix24'::text AS name,
    'CRM e plataforma operacional para leads, contatos, empresas, negocios e atividades.'::text AS description,
    'oauth2'::text AS auth_type,
    true AS supports_oauth_callback,
    true AS supports_incremental_sync,
    jsonb_build_array('manual', 'scheduled') AS sync_modes_json,
    crm_resources.resources_json,
    jsonb_build_array('crm', 'vendas', 'relacionamento', 'pipeline', 'sales', 'operacional') AS tags_json,
    'available'::text AS status,
    jsonb_build_object('toolkitSlug', 'BITRIX24') AS metadata_json
  FROM crm_resources
  UNION ALL
  SELECT 'crm', 'hubspot', 'HubSpot', 'CRM para contatos, empresas, negocios, atividades e automacao comercial.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), crm_resources.resources_json, jsonb_build_array('crm', 'vendas', 'relacionamento', 'marketing', 'sales'), 'available', jsonb_build_object('toolkitSlug', 'HUBSPOT')
  FROM crm_resources
  UNION ALL
  SELECT 'crm', 'pipedrive', 'Pipedrive', 'CRM de vendas com pipeline, negocios, atividades e previsibilidade comercial.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), crm_resources.resources_json, jsonb_build_array('crm', 'vendas', 'relacionamento', 'pipeline', 'sales'), 'available', jsonb_build_object('toolkitSlug', 'PIPEDRIVE')
  FROM crm_resources
  UNION ALL
  SELECT 'crm', 'rd_station_crm', 'RD Station CRM', 'CRM brasileiro para leads, contatos, oportunidades, funis e atividades.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), crm_resources.resources_json, jsonb_build_array('crm', 'vendas', 'relacionamento', 'brasil', 'sales'), 'available', jsonb_build_object('toolkitSlug', 'RD_STATION_CRM')
  FROM crm_resources
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

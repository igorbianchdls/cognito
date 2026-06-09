BEGIN;

UPDATE integrations.destinations
SET
  config = COALESCE(config, '{}'::jsonb)
    || jsonb_build_object(
      'projectId', COALESCE(config->>'projectId', config->>'project_id', 'creatto-463117'),
      'datasetMode', 'per_tenant',
      'dataset', format('integrations_tenant_%s_raw', tenant_id),
      'rawDataset', format('integrations_tenant_%s_raw', tenant_id),
      'normalizedDataset', format('integrations_tenant_%s_normalized', tenant_id)
    ),
  metadata = COALESCE(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'datasetMode', 'per_tenant',
      'datasetModeMigratedAt', now()
    ),
  updated_at = now()
WHERE type = 'bigquery'
  AND (
    config->>'datasetMode' IS DISTINCT FROM 'per_tenant'
    OR config->>'rawDataset' IS DISTINCT FROM format('integrations_tenant_%s_raw', tenant_id)
    OR config->>'normalizedDataset' IS DISTINCT FROM format('integrations_tenant_%s_normalized', tenant_id)
  );

COMMIT;

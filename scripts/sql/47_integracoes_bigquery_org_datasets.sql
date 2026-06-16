BEGIN;

UPDATE integrations.destinations
SET
  config = COALESCE(config, '{}'::jsonb)
    || jsonb_build_object(
      'projectId', COALESCE(config->>'projectId', config->>'project_id', 'creatto-463117'),
      'datasetMode', 'per_tenant',
      'dataset', format('org_%s_raw', tenant_id),
      'rawDataset', format('org_%s_raw', tenant_id),
      'normalizedDataset', format('org_%s_normalized', tenant_id)
    ),
  metadata = COALESCE(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'isDefault', COALESCE((metadata->>'isDefault')::boolean, true),
      'datasetMode', 'per_tenant',
      'datasetModeMigratedAt', now(),
      'bigQueryProvisioning', jsonb_build_object(
        'status', 'pending',
        'reason', 'migration_47',
        'updatedAt', now()
      )
    ),
  updated_at = now()
WHERE type = 'bigquery'
  AND (metadata->>'isDefault') = 'true'
  AND (
    config->>'datasetMode' IS DISTINCT FROM 'per_tenant'
    OR config->>'rawDataset' IS DISTINCT FROM format('org_%s_raw', tenant_id)
    OR config->>'normalizedDataset' IS DISTINCT FROM format('org_%s_normalized', tenant_id)
  );

COMMIT;

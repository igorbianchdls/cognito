CREATE UNIQUE INDEX IF NOT EXISTS integration_sync_runs_initial_pipeline_uidx
  ON integrations.sync_runs (tenant_id, connection_id, pipeline_id)
  WHERE trigger = 'initial'
    AND pipeline_id IS NOT NULL
    AND status IN ('queued', 'running', 'success', 'warning');

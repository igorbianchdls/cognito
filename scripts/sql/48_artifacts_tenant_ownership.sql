ALTER TABLE artifacts.artifacts
  ADD COLUMN IF NOT EXISTS tenant_id bigint;

CREATE INDEX IF NOT EXISTS idx_artifacts_artifacts_tenant_type_updated
  ON artifacts.artifacts(tenant_id, artifact_type, updated_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'artifacts_artifacts_tenant_fkey'
      AND conrelid = 'artifacts.artifacts'::regclass
  ) THEN
    ALTER TABLE artifacts.artifacts
      ADD CONSTRAINT artifacts_artifacts_tenant_fkey
      FOREIGN KEY (tenant_id)
      REFERENCES shared.tenants(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

COMMENT ON COLUMN artifacts.artifacts.tenant_id IS
  'Tenant proprietário do artifact. NULL identifica artifact legado sem acesso a dados.';

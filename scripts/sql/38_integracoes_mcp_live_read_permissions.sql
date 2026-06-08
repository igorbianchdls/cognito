BEGIN;

ALTER TABLE integrations.mcp_permissions
  ADD COLUMN IF NOT EXISTS live_read_resources jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mcp_permissions_live_read_array_check'
      AND conrelid = 'integrations.mcp_permissions'::regclass
  ) THEN
    ALTER TABLE integrations.mcp_permissions
      ADD CONSTRAINT mcp_permissions_live_read_array_check
      CHECK (jsonb_typeof(live_read_resources) = 'array');
  END IF;
END $$;

COMMIT;

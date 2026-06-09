BEGIN;

ALTER TABLE integrations.plugin_permissions
  ADD COLUMN IF NOT EXISTS live_read_resources jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'plugin_permissions_live_read_array_check'
      AND conrelid = 'integrations.plugin_permissions'::regclass
  ) THEN
    ALTER TABLE integrations.plugin_permissions
      ADD CONSTRAINT plugin_permissions_live_read_array_check
      CHECK (jsonb_typeof(live_read_resources) = 'array');
  END IF;
END $$;

COMMIT;

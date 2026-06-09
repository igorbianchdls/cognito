BEGIN;

ALTER TABLE integrations.plugin_action_audit
  DROP CONSTRAINT IF EXISTS plugin_action_audit_connection_fkey;

ALTER TABLE integrations.plugin_action_audit
  ADD CONSTRAINT plugin_action_audit_connection_fkey
  FOREIGN KEY (connection_id)
  REFERENCES integrations.connections (id)
  ON DELETE SET NULL;

COMMIT;

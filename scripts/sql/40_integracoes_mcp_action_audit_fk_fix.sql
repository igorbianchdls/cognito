BEGIN;

ALTER TABLE integrations.mcp_action_audit
  DROP CONSTRAINT IF EXISTS mcp_action_audit_connection_fkey;

ALTER TABLE integrations.mcp_action_audit
  ADD CONSTRAINT mcp_action_audit_connection_fkey
  FOREIGN KEY (connection_id)
  REFERENCES integrations.connections (id)
  ON DELETE SET NULL;

COMMIT;

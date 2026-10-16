BEGIN;
-- Apply after the domain-aware application has been promoted and verified.
ALTER TABLE plugin.drafts DROP CONSTRAINT drafts_integration_operation_key;
COMMIT;

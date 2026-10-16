BEGIN;
ALTER TABLE plugin.drafts ADD COLUMN domain text NOT NULL DEFAULT 'erp' CHECK(domain IN ('erp','tables'));
ALTER TABLE plugin.drafts ADD COLUMN operation_type text;
ALTER TABLE plugin.drafts ADD COLUMN result jsonb;
-- Keep the legacy unique constraint during the application rollout. Remove it
-- only after production uses ON CONFLICT with the domain-aware key.
ALTER TABLE plugin.drafts ADD CONSTRAINT drafts_domain_operation_key UNIQUE(integration,domain,empresa_id,user_id,oauth_client_id,operation_key);
DO $$ DECLARE item record; BEGIN
 FOR item IN SELECT conname FROM pg_constraint WHERE conrelid='plugin.drafts'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%record_id%' LOOP
   EXECUTE format('ALTER TABLE plugin.drafts DROP CONSTRAINT %I',item.conname);
 END LOOP;
END $$;
ALTER TABLE plugin.drafts ADD CONSTRAINT drafts_domain_result CHECK (
 (domain='erp' AND ((status='saved')=(record_id IS NOT NULL))) OR
 (domain='tables' AND ((status='saved')=(result IS NOT NULL)))
);
CREATE INDEX drafts_domain_owner ON plugin.drafts(integration,domain,empresa_id,user_id,oauth_client_id,created_at DESC);
COMMENT ON COLUMN plugin.drafts.domain IS 'Business product; integration independently identifies ChatGPT or Claude.';
COMMIT;

BEGIN;

-- Base comum para integracoes. Identidade e dados operacionais ficam em shared/erp.
CREATE SCHEMA plugin;
REVOKE ALL ON SCHEMA plugin FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA plugin TO service_role;

ALTER TABLE shared.chatgptplugin_executions SET SCHEMA plugin;
ALTER TABLE plugin.chatgptplugin_executions RENAME TO executions;
ALTER TABLE shared.chatgptplugin_rate_windows SET SCHEMA plugin;
ALTER TABLE plugin.chatgptplugin_rate_windows RENAME TO rate_windows;
ALTER TABLE shared.chatgptplugin_drafts SET SCHEMA plugin;
ALTER TABLE plugin.chatgptplugin_drafts RENAME TO drafts;
ALTER TABLE shared.chatgptplugin_settings SET SCHEMA plugin;
ALTER TABLE plugin.chatgptplugin_settings RENAME TO settings;

ALTER TABLE plugin.executions ADD COLUMN integration text NOT NULL DEFAULT 'chatgpt'
  CHECK (integration IN ('chatgpt', 'claude'));
ALTER TABLE plugin.rate_windows ADD COLUMN integration text NOT NULL DEFAULT 'chatgpt'
  CHECK (integration IN ('chatgpt', 'claude'));
ALTER TABLE plugin.drafts ADD COLUMN integration text NOT NULL DEFAULT 'chatgpt'
  CHECK (integration IN ('chatgpt', 'claude'));
ALTER TABLE plugin.settings ADD COLUMN integration text NOT NULL DEFAULT 'chatgpt'
  CHECK (integration IN ('chatgpt', 'claude'));

ALTER TABLE plugin.executions RENAME CONSTRAINT chatgptplugin_executions_pkey TO executions_pkey;
ALTER TABLE plugin.drafts RENAME CONSTRAINT chatgptplugin_drafts_pkey TO drafts_pkey;
ALTER TABLE plugin.rate_windows DROP CONSTRAINT chatgptplugin_rate_windows_pkey;
ALTER TABLE plugin.rate_windows ADD PRIMARY KEY (integration, user_id, window_start);
ALTER TABLE plugin.settings DROP CONSTRAINT chatgptplugin_settings_pkey;
ALTER TABLE plugin.settings ADD PRIMARY KEY (integration, user_id, oauth_client_id);

DO $$
DECLARE unique_name text;
BEGIN
  SELECT conname INTO STRICT unique_name FROM pg_constraint
    WHERE conrelid = 'plugin.drafts'::regclass AND contype = 'u';
  EXECUTE format('ALTER TABLE plugin.drafts DROP CONSTRAINT %I', unique_name);
END
$$;
ALTER TABLE plugin.drafts ADD CONSTRAINT drafts_integration_operation_key
  UNIQUE (integration, tenant_id, user_id, oauth_client_id, operation_key);

DROP INDEX plugin.chatgptplugin_executions_tenant_started_idx;
CREATE INDEX executions_integration_tenant_started_idx ON plugin.executions(integration, tenant_id, started_at DESC);
DROP INDEX plugin.chatgptplugin_drafts_owner_idx;
CREATE INDEX drafts_integration_owner_idx ON plugin.drafts(integration, tenant_id, user_id, created_at DESC);

-- Schema privado: somente backend administrativo; integracao/empresa/usuario
-- tambem sao filtrados explicitamente nas consultas dos produtos.
REVOKE ALL ON ALL TABLES IN SCHEMA plugin FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA plugin TO service_role;
COMMENT ON SCHEMA plugin IS 'Persistencia privada das integracoes ChatGPT e Claude com o ERP.';
COMMIT;

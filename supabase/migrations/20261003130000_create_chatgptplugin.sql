BEGIN;
CREATE TABLE shared.chatgptplugin_executions (
  id uuid PRIMARY KEY,
  user_id bigint REFERENCES shared.users(id) ON DELETE SET NULL,
  tenant_id bigint REFERENCES shared.tenants(id) ON DELETE SET NULL,
  oauth_client_id text NOT NULL,
  tool_name text NOT NULL CHECK (length(tool_name) <= 100),
  status text NOT NULL CHECK (status IN ('running','succeeded','failed')),
  error_code text,
  duration_ms integer CHECK (duration_ms >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX chatgptplugin_executions_tenant_started_idx ON shared.chatgptplugin_executions(tenant_id,started_at DESC);
CREATE TABLE shared.chatgptplugin_rate_windows (
  user_id bigint NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  requests integer NOT NULL CHECK (requests > 0),
  PRIMARY KEY (user_id,window_start)
);
ALTER TABLE shared.chatgptplugin_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared.chatgptplugin_rate_windows ENABLE ROW LEVEL SECURITY;
-- Acesso apenas pelo backend do ERP. Nao expor estas tabelas ao navegador.
REVOKE ALL ON shared.chatgptplugin_executions,shared.chatgptplugin_rate_windows FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON shared.chatgptplugin_executions,shared.chatgptplugin_rate_windows TO service_role;
COMMIT;

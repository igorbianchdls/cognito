BEGIN;
SET LOCAL lock_timeout = '10s';
CREATE TABLE plugin.erp_workflows (
  id uuid PRIMARY KEY,
  empresa_id bigint NOT NULL REFERENCES shared.empresas(id),
  user_id bigint NOT NULL REFERENCES shared.usuarios(id),
  oauth_client_id text NOT NULL,
  integration text NOT NULL CHECK (integration IN ('chatgpt','claude')),
  operation_key uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('conciliacao','classificacao','notas')),
  input_hash text NOT NULL,
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) BETWEEN 1 AND 50 AND octet_length(items::text) < 524288),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 minutes',
  approved_at timestamptz,
  UNIQUE (integration,empresa_id,user_id,oauth_client_id,operation_key),
  CHECK ((status <> 'pending') = (approved_at IS NOT NULL))
);
CREATE INDEX erp_workflows_owner ON plugin.erp_workflows(integration,empresa_id,user_id,oauth_client_id,created_at DESC);
ALTER TABLE plugin.erp_workflows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON plugin.erp_workflows FROM PUBLIC,anon,authenticated,erp_runtime;
GRANT SELECT,INSERT,UPDATE ON plugin.erp_workflows TO service_role;
COMMIT;

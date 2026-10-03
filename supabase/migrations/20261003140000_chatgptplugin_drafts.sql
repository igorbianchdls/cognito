BEGIN;
CREATE TABLE shared.chatgptplugin_drafts (
  id uuid PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES shared.users(id) ON DELETE CASCADE,
  oauth_client_id text NOT NULL,
  operation_key uuid NOT NULL,
  proposal jsonb NOT NULL CHECK (jsonb_typeof(proposal) = 'object' AND octet_length(proposal::text) <= 32768),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','saved','cancelled','expired')),
  record_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  decided_at timestamptz,
  UNIQUE (tenant_id,user_id,oauth_client_id,operation_key),
  CHECK ((status = 'saved') = (record_id IS NOT NULL))
);
CREATE INDEX chatgptplugin_drafts_owner_idx ON shared.chatgptplugin_drafts(tenant_id,user_id,created_at DESC);
ALTER TABLE shared.chatgptplugin_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON shared.chatgptplugin_drafts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON shared.chatgptplugin_drafts TO service_role;
COMMIT;

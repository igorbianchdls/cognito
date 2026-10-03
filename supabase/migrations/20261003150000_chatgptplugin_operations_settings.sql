ALTER TABLE shared.chatgptplugin_drafts ADD COLUMN IF NOT EXISTS target_snapshot jsonb;
CREATE TABLE IF NOT EXISTS shared.chatgptplugin_settings (
  user_id bigint NOT NULL REFERENCES shared.users(id),
  oauth_client_id text NOT NULL,
  values jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(values)='object'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,oauth_client_id)
);
ALTER TABLE shared.chatgptplugin_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON shared.chatgptplugin_settings FROM PUBLIC,anon,authenticated;

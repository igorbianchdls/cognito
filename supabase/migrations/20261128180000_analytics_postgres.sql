-- Analytics no Postgres (o BigQuery entra depois, atrás da mesma camada de consulta): os eventos, a ligação de
-- visitantes a usuários (identify), e o que se monta nas telas: insights salvos, painéis, coortes e gravações de sessão.
-- Os eventos e as gravações só entram pelo servidor do Otto (a conexão do servidor ignora as regras de acesso); quem é da
-- empresa lê; salvar insights, painéis e coortes segue os papéis do ERP como o resto do schema analytics.
BEGIN;

-- ---------- configurações novas de cada site ----------
ALTER TABLE analytics.properties
  ADD COLUMN autocapture boolean NOT NULL DEFAULT true,                                  -- cliques, formulários e rolagem sem código
  ADD COLUMN replay_sample int NOT NULL DEFAULT 0 CHECK (replay_sample BETWEEN 0 AND 100), -- % das sessões gravadas (0 = desligado)
  ADD COLUMN replay_mask_text boolean NOT NULL DEFAULT true;                              -- textos escondidos nas gravações

-- ---------- eventos ----------
CREATE TABLE analytics.events (
  event_id uuid PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  event text NOT NULL,
  "timestamp" timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  distinct_id text NOT NULL,
  user_id text,
  session_id text,
  url text, host text, path text, title text, referrer text, referrer_host text,
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  device text, browser text, os text, country text, region text,
  screen_width int, language text,
  properties jsonb
);
CREATE INDEX events_tempo ON analytics.events (property_id, "timestamp");
CREATE INDEX events_evento ON analytics.events (property_id, event, "timestamp");
CREATE INDEX events_visitante ON analytics.events (property_id, distinct_id, "timestamp");
CREATE INDEX events_sessao ON analytics.events (property_id, session_id, "timestamp");

-- Quem é cada visitante depois do identify: as visitas antes e depois do login contam como a mesma pessoa.
CREATE TABLE analytics.identities (
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  distinct_id text NOT NULL,
  user_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (property_id, distinct_id)
);
CREATE INDEX identities_usuario ON analytics.identities (property_id, user_id);

-- Os eventos com a pessoa já resolvida (usuário, se identificado; senão o visitante). Roda com as regras de quem consulta.
CREATE VIEW analytics.events_people WITH (security_invoker = true) AS
  SELECT e.*, COALESCE(i.user_id, e.user_id, e.distinct_id) AS person
  FROM analytics.events e LEFT JOIN analytics.identities i ON i.property_id = e.property_id AND i.distinct_id = e.distinct_id;

-- ---------- o que se monta nas telas ----------
CREATE TABLE analytics.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  query jsonb NOT NULL CHECK (jsonb_typeof(query) = 'object'),   -- a consulta (tendência, funil, retenção ou caminhos)
  view text NOT NULL DEFAULT 'linha' CHECK (view IN ('linha', 'barras', 'numero', 'tabela', 'area')),
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON analytics.insights (property_id);

CREATE TABLE analytics.dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  items jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(items) = 'array'),   -- [{ "insight_id": "…", "largura": 1 | 2 }]
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON analytics.dashboards (property_id);

CREATE TABLE analytics.cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  rules jsonb NOT NULL DEFAULT '{"combinar":"todas","regras":[]}' CHECK (jsonb_typeof(rules) = 'object'),
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON analytics.cohorts (property_id);

-- ---------- gravações de sessão ----------
CREATE TABLE analytics.recordings (
  session_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  distinct_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NOT NULL DEFAULT now(),
  first_url text,
  chunks int NOT NULL DEFAULT 0,
  bytes int NOT NULL DEFAULT 0,
  PRIMARY KEY (property_id, session_id)
);
CREATE INDEX recordings_recentes ON analytics.recordings (property_id, started_at DESC);
CREATE TABLE analytics.recording_chunks (
  property_id uuid NOT NULL,
  session_id text NOT NULL,
  seq int NOT NULL,
  data bytea NOT NULL,                 -- eventos do rrweb em JSON, comprimidos (gzip)
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (property_id, session_id, seq),
  FOREIGN KEY (property_id, session_id) REFERENCES analytics.recordings (property_id, session_id) ON DELETE CASCADE
);

-- ---------- acesso ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['events', 'identities', 'insights', 'dashboards', 'cohorts', 'recordings'] LOOP
    EXECUTE format('ALTER TABLE analytics.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: read" ON analytics.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['insights', 'dashboards', 'cohorts'] LOOP
    EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON analytics.%I FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at()', t);
    EXECUTE format('CREATE POLICY "%1$s: insert" ON analytics.%1$I FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
      AND EXISTS (SELECT 1 FROM analytics.properties p WHERE p.id = property_id AND p.workspace_id = %1$I.workspace_id))', t);
    EXECUTE format('CREATE POLICY "%1$s: update" ON analytics.%1$I FOR UPDATE TO authenticated USING (editor.can_write(workspace_id))
      WITH CHECK (editor.can_write(workspace_id) AND EXISTS (SELECT 1 FROM analytics.properties p WHERE p.id = property_id AND p.workspace_id = %1$I.workspace_id))', t);
    EXECUTE format('CREATE POLICY "%1$s: delete" ON analytics.%1$I FOR DELETE TO authenticated USING (editor.can_write(workspace_id))', t);
  END LOOP;
END $$;
-- Os pedaços das gravações seguem a gravação (quem lê a gravação lê os pedaços).
ALTER TABLE analytics.recording_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recording_chunks: read" ON analytics.recording_chunks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM analytics.recordings r WHERE r.property_id = recording_chunks.property_id AND r.session_id = recording_chunks.session_id AND editor.can_read(r.workspace_id)));
-- Apagar gravações: quem altera.
CREATE POLICY "recordings: delete" ON analytics.recordings FOR DELETE TO authenticated USING (editor.can_write(workspace_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO service_role;
GRANT SELECT ON analytics.events_people TO authenticated, service_role;

-- ---------- limpeza (todo dia) ----------
-- Eventos guardados por 760 dias (como no BigQuery) e gravações por 30 dias.
CREATE FUNCTION analytics.limpar(p_dias_eventos int DEFAULT 760, p_dias_gravacoes int DEFAULT 30) RETURNS jsonb LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE e int; g int;
BEGIN
  DELETE FROM analytics.events WHERE "timestamp" < now() - make_interval(days => p_dias_eventos);
  GET DIAGNOSTICS e = ROW_COUNT;
  DELETE FROM analytics.recordings WHERE started_at < now() - make_interval(days => p_dias_gravacoes);
  GET DIAGNOSTICS g = ROW_COUNT;
  RETURN jsonb_build_object('eventos', e, 'gravacoes', g);
END $$;
REVOKE ALL ON FUNCTION analytics.limpar(int, int) FROM public, anon, authenticated;

COMMIT;

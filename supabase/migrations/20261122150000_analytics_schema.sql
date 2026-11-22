-- Produto Analytics: configurações no Supabase; os eventos ficam no BigQuery (dataset analytics).
--   * properties: sites e apps medidos, de uma empresa (workspace_id = organização do Clerk, como no Drive e no Social).
--     public_key é a chave que vai no script do site; ela só identifica a propriedade, não dá acesso a nada.
--   * funnels, flags e experiments pertencem a uma propriedade da mesma empresa.
--   * Acesso pelos papéis do ERP (editor.can_read / editor.can_write): membro ativo lê; owner, admin e member alteram;
--     quem só visualiza não altera; outra empresa não vê nada. Os eventos só entram pelo servidor do Otto.
-- Depois de aplicar, o schema "analytics" precisa estar na lista de schemas expostos da API (Settings → API).
BEGIN;

CREATE SCHEMA analytics;
GRANT USAGE ON SCHEMA analytics TO authenticated, service_role;

CREATE TABLE analytics.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  kind text NOT NULL DEFAULT 'site' CHECK (kind IN ('site', 'app')),
  domains text[] NOT NULL DEFAULT '{}',           -- de onde o script pode enviar eventos (ex.: ottogestao.com.br)
  public_key text NOT NULL UNIQUE DEFAULT ('otto_' || replace(gen_random_uuid()::text, '-', '')),
  require_consent boolean NOT NULL DEFAULT false,  -- só grava cookie de visitante depois do consentimento
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON analytics.properties (workspace_id);

CREATE TABLE analytics.funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  steps jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(steps) = 'array'), -- [{ "event": "$pageview", "path": "/precos" }, …]
  window_days int NOT NULL DEFAULT 7 CHECK (window_days BETWEEN 1 AND 90),
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON analytics.funnels (property_id);

CREATE TABLE analytics.flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  key text NOT NULL CHECK (key ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  name text NOT NULL DEFAULT '' CHECK (char_length(name) <= 120),
  description text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  rollout int NOT NULL DEFAULT 100 CHECK (rollout BETWEEN 0 AND 100),   -- % de visitantes que recebem a flag
  rules jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(rules) = 'array'), -- condições: país, aparelho, página, usuário logado…
  variants jsonb CHECK (variants IS NULL OR jsonb_typeof(variants) = 'array'), -- [{ "key": "a", "weight": 50 }, …] nos testes A/B
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, key)
);

CREATE TYPE analytics.experiment_status AS ENUM ('rascunho', 'rodando', 'encerrado');
CREATE TABLE analytics.experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  flag_id uuid NOT NULL UNIQUE REFERENCES analytics.flags (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  hypothesis text NOT NULL DEFAULT '',
  goal_event text NOT NULL CHECK (char_length(goal_event) BETWEEN 1 AND 120),
  status analytics.experiment_status NOT NULL DEFAULT 'rascunho',
  started_at timestamptz,
  ended_at timestamptz,
  winner text,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['properties', 'funnels', 'flags', 'experiments'] LOOP
    EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON analytics.%I FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at()', t);
    EXECUTE format('ALTER TABLE analytics.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: read" ON analytics.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t, t);
  END LOOP;
END $$;

-- Propriedades: quem pode alterar cria, edita e apaga.
CREATE POLICY "properties: insert" ON analytics.properties FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "properties: update" ON analytics.properties FOR UPDATE TO authenticated
  USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "properties: delete" ON analytics.properties FOR DELETE TO authenticated USING (editor.can_write(workspace_id));

-- Funis, flags e experimentos: além de poder alterar, a propriedade precisa ser da mesma empresa.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['funnels', 'flags', 'experiments'] LOOP
    EXECUTE format('CREATE POLICY "%1$s: insert" ON analytics.%1$I FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
      AND EXISTS (SELECT 1 FROM analytics.properties p WHERE p.id = property_id AND p.workspace_id = %1$I.workspace_id))', t);
    EXECUTE format('CREATE POLICY "%1$s: update" ON analytics.%1$I FOR UPDATE TO authenticated USING (editor.can_write(workspace_id))
      WITH CHECK (editor.can_write(workspace_id) AND EXISTS (SELECT 1 FROM analytics.properties p WHERE p.id = property_id AND p.workspace_id = %1$I.workspace_id))', t);
    EXECUTE format('CREATE POLICY "%1$s: delete" ON analytics.%1$I FOR DELETE TO authenticated USING (editor.can_write(workspace_id))', t);
  END LOOP;
END $$;

-- O experimento usa uma flag da mesma propriedade.
CREATE FUNCTION analytics.check_experiment_flag() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM analytics.flags f WHERE f.id = NEW.flag_id AND f.property_id = NEW.property_id) THEN
    RAISE EXCEPTION 'A flag do experimento precisa ser da mesma propriedade.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER same_property BEFORE INSERT OR UPDATE ON analytics.experiments FOR EACH ROW EXECUTE FUNCTION analytics.check_experiment_flag();

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO service_role;

COMMIT;

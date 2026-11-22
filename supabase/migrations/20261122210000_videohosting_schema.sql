-- Produto Videohosting: vídeos de venda com player próprio (estilo VTurb), para a empresa e para os clientes dela.
--   * videos: cada vídeo publicado, ligado ao arquivo de origem no Drive; provider diz quem entrega (drive agora,
--     bunny depois); public_code é o código que vai no script da página e não dá acesso a mais nada.
--   * presets: aparência e comportamento padrão do player da empresa; cada vídeo pode sobrescrever (videos.settings).
--   * ctas: botões e ofertas que aparecem num momento do vídeo.
--   * domains: onde os vídeos podem tocar (da empresa; videos.domains sobrescreve por vídeo).
--   * Acesso pelos papéis do ERP (editor.can_read / editor.can_write), como Drive e Analytics. A página do cliente
--     nunca lê o banco: o servidor do Otto confere o código e o domínio e devolve só o necessário para tocar.
-- Depois de aplicar, o schema "videohosting" precisa estar na lista de schemas expostos da API (Settings → API).
BEGIN;

CREATE SCHEMA videohosting;
GRANT USAGE ON SCHEMA videohosting TO authenticated, service_role;

CREATE TYPE videohosting.provider AS ENUM ('drive', 'bunny');
CREATE TYPE videohosting.video_status AS ENUM ('enviando', 'processando', 'pronto', 'erro');

CREATE TABLE videohosting.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  source_file_id uuid REFERENCES drive.files (id) ON DELETE SET NULL,
  provider videohosting.provider NOT NULL DEFAULT 'drive',
  provider_library_id text,
  provider_video_id text,
  status videohosting.video_status NOT NULL DEFAULT 'pronto',
  duration numeric,                        -- segundos
  width int NOT NULL DEFAULT 0,
  height int NOT NULL DEFAULT 0,
  poster_path text,                        -- miniatura no bucket drive
  public_code text NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 16),
  settings jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(settings) = 'object'),
  domains text[],                          -- null: usa os domínios da empresa
  trashed_at timestamptz,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON videohosting.videos (workspace_id, created_at DESC);

CREATE TABLE videohosting.presets (
  workspace_id text PRIMARY KEY,
  settings jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(settings) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE videohosting.ctas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  video_id uuid NOT NULL REFERENCES videohosting.videos (id) ON DELETE CASCADE,
  start_s numeric NOT NULL DEFAULT 0 CHECK (start_s >= 0),
  end_s numeric CHECK (end_s IS NULL OR end_s > start_s),   -- null: fica até o fim
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 120),
  url text NOT NULL CHECK (url ~ '^https?://' AND char_length(url) <= 2000),
  position text NOT NULL DEFAULT 'abaixo' CHECK (position IN ('abaixo', 'sobre')),
  background text NOT NULL DEFAULT '#16a34a' CHECK (background ~ '^#[0-9a-fA-F]{6}$'),
  color text NOT NULL DEFAULT '#ffffff' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  new_tab boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON videohosting.ctas (video_id);

CREATE TABLE videohosting.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  domain text NOT NULL CHECK (domain ~ '^([a-z0-9-]+\.)+[a-z]{2,}$|^localhost(:[0-9]+)?$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, domain)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['videos', 'presets', 'ctas', 'domains'] LOOP
    EXECUTE format('ALTER TABLE videohosting.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: read" ON videohosting.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t, t);
    EXECUTE format('CREATE POLICY "%s: delete" ON videohosting.%I FOR DELETE TO authenticated USING (editor.can_write(workspace_id))', t, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['videos', 'presets', 'ctas'] LOOP
    EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON videohosting.%I FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at()', t);
  END LOOP;
END $$;

-- Vídeos: o arquivo de origem precisa ser um vídeo do Drive da mesma empresa.
CREATE POLICY "videos: insert" ON videohosting.videos FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
  AND (source_file_id IS NULL OR EXISTS (SELECT 1 FROM drive.files f WHERE f.id = source_file_id AND f.workspace_id = videos.workspace_id AND f.kind = 'video')));
CREATE POLICY "videos: update" ON videohosting.videos FOR UPDATE TO authenticated USING (editor.can_write(workspace_id))
  WITH CHECK (editor.can_write(workspace_id)
    AND (source_file_id IS NULL OR EXISTS (SELECT 1 FROM drive.files f WHERE f.id = source_file_id AND f.workspace_id = videos.workspace_id AND f.kind = 'video')));
CREATE POLICY "presets: insert" ON videohosting.presets FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "presets: update" ON videohosting.presets FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "ctas: insert" ON videohosting.ctas FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
  AND EXISTS (SELECT 1 FROM videohosting.videos v WHERE v.id = video_id AND v.workspace_id = ctas.workspace_id));
CREATE POLICY "ctas: update" ON videohosting.ctas FOR UPDATE TO authenticated USING (editor.can_write(workspace_id))
  WITH CHECK (editor.can_write(workspace_id) AND EXISTS (SELECT 1 FROM videohosting.videos v WHERE v.id = video_id AND v.workspace_id = ctas.workspace_id));
CREATE POLICY "domains: insert" ON videohosting.domains FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));

-- O código público, o fornecedor e a situação não são escolhidos pelo navegador: só as colunas abaixo.
GRANT SELECT, DELETE ON ALL TABLES IN SCHEMA videohosting TO authenticated;
GRANT INSERT, UPDATE ON videohosting.presets, videohosting.ctas, videohosting.domains TO authenticated;
GRANT INSERT (id, workspace_id, title, source_file_id, duration, width, height, poster_path, settings, domains) ON videohosting.videos TO authenticated;
GRANT UPDATE (title, source_file_id, duration, width, height, poster_path, settings, domains, trashed_at) ON videohosting.videos TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA videohosting TO service_role;

COMMIT;

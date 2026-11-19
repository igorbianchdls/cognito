-- Produto Editor: editor de vídeo e Spaces (arquivos e pastas), vindos do Otto Social.
--   * Tudo pertence a uma empresa: workspace_id é o id da organização no Clerk ("org_…"), a mesma de shared.tenants.
--   * O navegador fala direto com o Supabase usando o token de sessão do Clerk (third-party auth).
--     auth.jwt() traz a pessoa em "sub" e a organização ativa em "o" ({ id, rol }), ou org_id em tokens antigos.
--   * Cada empresa só vê e altera o que é dela, inclusive os arquivos do bucket editor-media.
--   * Nada do ERP é tocado. Para desfazer: DROP SCHEMA editor CASCADE, mais o bucket e as políticas do fim.
-- Depois de aplicar, o schema "editor" precisa estar na lista de schemas expostos da API (Settings → API).
BEGIN;

CREATE SCHEMA editor;
GRANT USAGE ON SCHEMA editor TO authenticated, service_role;

-- ---------- quem está pedindo ----------
CREATE FUNCTION editor.uid() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(auth.jwt() ->> 'sub', '')
$$;
CREATE FUNCTION editor.org() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(auth.jwt() -> 'o' ->> 'id', ''), nullif(auth.jwt() ->> 'org_id', ''))
$$;
-- A empresa ativa no token: trocar de empresa é trocar a organização ativa no Clerk.
CREATE FUNCTION editor.is_member(ws text) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT ws IS NOT NULL AND ws = editor.org()
$$;
REVOKE ALL ON FUNCTION editor.uid(), editor.org(), editor.is_member(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION editor.uid(), editor.org(), editor.is_member(text) TO authenticated, service_role;

CREATE FUNCTION editor.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TYPE editor.file_kind AS ENUM ('video', 'image', 'audio', 'text');

-- ---------- Spaces, pastas e arquivos ----------
CREATE TABLE editor.spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON editor.spaces (workspace_id);

CREATE TABLE editor.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  space_id uuid NOT NULL REFERENCES editor.spaces (id) ON DELETE CASCADE,
  parent_id uuid REFERENCES editor.folders (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  trashed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_id IS DISTINCT FROM id)
);
CREATE INDEX ON editor.folders (space_id, parent_id);
CREATE INDEX ON editor.folders (workspace_id) WHERE trashed_at IS NOT NULL;
CREATE INDEX ON editor.folders USING gin (tags);

CREATE TABLE editor.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  space_id uuid NOT NULL REFERENCES editor.spaces (id) ON DELETE CASCADE,
  folder_id uuid REFERENCES editor.folders (id) ON DELETE CASCADE, -- null: raiz do space
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 255),
  kind editor.file_kind NOT NULL,
  mime text NOT NULL DEFAULT '',
  size bigint NOT NULL DEFAULT 0,
  duration numeric,                  -- segundos, para vídeo e áudio
  width int NOT NULL DEFAULT 0,
  height int NOT NULL DEFAULT 0,
  storage_path text NOT NULL,        -- caminho no bucket editor-media: <workspace_id>/<file_id>/<nome>
  proxy_path text,                   -- cópia leve para prévias e para o editor
  thumb_path text,                   -- miniatura, feita pelo navegador no envio
  tags text[] NOT NULL DEFAULT '{}',
  trashed_at timestamptz,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON editor.files (space_id, folder_id);
CREATE INDEX ON editor.files (workspace_id, updated_at DESC);
CREATE INDEX ON editor.files USING gin (tags);

-- Favoritos e recentes são de cada pessoa.
CREATE TABLE editor.favorites (
  user_id text NOT NULL DEFAULT editor.uid(),
  workspace_id text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('folder', 'file')),
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_type, item_id)
);
CREATE TABLE editor.recents (
  user_id text NOT NULL DEFAULT editor.uid(),
  workspace_id text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('folder', 'file')),
  item_id uuid NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_type, item_id)
);

-- ---------- projetos do editor ----------
CREATE TABLE editor.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  name text NOT NULL DEFAULT 'Sem título',
  format text NOT NULL DEFAULT '9:16' CHECK (format IN ('9:16', '1:1', '16:9')),
  data jsonb NOT NULL DEFAULT '{}',
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON editor.projects (workspace_id, updated_at DESC);

CREATE TABLE editor.project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES editor.projects (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  label text NOT NULL,
  data jsonb NOT NULL,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON editor.project_versions (project_id, created_at DESC);

CREATE TRIGGER touch BEFORE UPDATE ON editor.spaces FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();
CREATE TRIGGER touch BEFORE UPDATE ON editor.folders FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();
CREATE TRIGGER touch BEFORE UPDATE ON editor.files FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();
CREATE TRIGGER touch BEFORE UPDATE ON editor.projects FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();

-- ---------- acesso ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA editor TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA editor TO service_role;

-- Dados da empresa: qualquer membro da empresa ativa lê e altera.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['spaces', 'folders', 'files', 'projects', 'project_versions'] LOOP
    EXECUTE format('ALTER TABLE editor.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: members" ON editor.%I FOR ALL TO authenticated USING (editor.is_member(workspace_id)) WITH CHECK (editor.is_member(workspace_id))', t, t);
  END LOOP;
END $$;

-- Dados da pessoa, dentro da empresa ativa.
ALTER TABLE editor.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites: own" ON editor.favorites FOR ALL TO authenticated
  USING (user_id = editor.uid() AND editor.is_member(workspace_id))
  WITH CHECK (user_id = editor.uid() AND editor.is_member(workspace_id));
ALTER TABLE editor.recents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recents: own" ON editor.recents FOR ALL TO authenticated
  USING (user_id = editor.uid() AND editor.is_member(workspace_id))
  WITH CHECK (user_id = editor.uid() AND editor.is_member(workspace_id));

-- ---------- arquivos: bucket privado editor-media, uma pasta por empresa ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('editor-media', 'editor-media', false, 5368709120); -- 5 GB por arquivo

CREATE POLICY "editor-media: members read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'editor-media' AND editor.is_member((storage.foldername(name))[1]));
CREATE POLICY "editor-media: members upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'editor-media' AND editor.is_member((storage.foldername(name))[1]));
CREATE POLICY "editor-media: members update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'editor-media' AND editor.is_member((storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'editor-media' AND editor.is_member((storage.foldername(name))[1]));
CREATE POLICY "editor-media: members delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'editor-media' AND editor.is_member((storage.foldername(name))[1]));

COMMIT;

-- Banco local para os testes de integração das Notas: o mínimo do Supabase e do Otto que as migrações das Notas
-- usam. As funções editor.* são cópias das migrações reais (20261119120000_editor_schema e
-- 20261121130000_editor_social_roles); o resto (auth, shared, storage) é só a forma necessária.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
GRANT anon, authenticated, service_role TO CURRENT_USER;

CREATE SCHEMA auth;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;

CREATE SCHEMA shared;
CREATE TABLE shared.empresas (id serial PRIMARY KEY, clerk_organization_id text UNIQUE, status text NOT NULL DEFAULT 'active');
CREATE TABLE shared.usuarios (id serial PRIMARY KEY, clerk_user_id text UNIQUE);
CREATE TABLE shared.usuarios_empresas (
  usuario_id int REFERENCES shared.usuarios, empresa_id int REFERENCES shared.empresas, role text NOT NULL,
  status text NOT NULL DEFAULT 'active', suspenso_localmente boolean DEFAULT false
);

CREATE SCHEMA storage;
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);

CREATE SCHEMA editor;
GRANT USAGE ON SCHEMA editor TO authenticated, service_role;
CREATE FUNCTION editor.uid() RETURNS text LANGUAGE sql STABLE SET search_path = '' AS $$ SELECT nullif(auth.jwt() ->> 'sub', '') $$;
CREATE FUNCTION editor.org() RETURNS text LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT coalesce(nullif(auth.jwt() -> 'o' ->> 'id', ''), nullif(auth.jwt() ->> 'org_id', ''))
$$;
CREATE FUNCTION editor.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE FUNCTION editor.member_role(ws text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT ue.role
  FROM shared.usuarios_empresas ue
  JOIN shared.empresas e ON e.id = ue.empresa_id
  JOIN shared.usuarios u ON u.id = ue.usuario_id
  WHERE ws IS NOT NULL AND ws = editor.org()
    AND e.clerk_organization_id = ws AND e.status = 'active'
    AND u.clerk_user_id = editor.uid()
    AND ue.status = 'active' AND NOT coalesce(ue.suspenso_localmente, false)
  LIMIT 1
$$;
CREATE FUNCTION editor.can_read(ws text) RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$ SELECT editor.member_role(ws) IS NOT NULL $$;
CREATE FUNCTION editor.can_write(ws text) RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT editor.member_role(ws) IN ('owner', 'admin', 'member')
$$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA editor TO authenticated, service_role;

-- Pessoas de teste: empresa org_a com ana (owner), bia (member) e vic (viewer); org_b com edu (owner).
INSERT INTO shared.empresas (clerk_organization_id) VALUES ('org_a'), ('org_b');
INSERT INTO shared.usuarios (clerk_user_id) VALUES ('ana'), ('bia'), ('vic'), ('edu');
INSERT INTO shared.usuarios_empresas (usuario_id, empresa_id, role) VALUES (1, 1, 'owner'), (2, 1, 'member'), (3, 1, 'viewer'), (4, 2, 'owner');

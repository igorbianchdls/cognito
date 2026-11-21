-- Editor e Marketing seguem os papéis do ERP (shared.usuarios_empresas), não só a organização ativa no token:
--   * ler: membro ativo da empresa ativa (owner, admin, member ou viewer), com a empresa ativa;
--   * alterar: owner, admin ou member (viewer só lê);
--   * membro suspenso ou removido, ou empresa desativada (exclusão no Clerk), perde o acesso. Os dados ficam guardados,
--     como os do ERP.
BEGIN;

-- Papel da pessoa do token na empresa ws, se ela está ativa lá e ws é a organização ativa do token.
CREATE FUNCTION editor.member_role(ws text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
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
CREATE FUNCTION editor.can_read(ws text) RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT editor.member_role(ws) IS NOT NULL
$$;
CREATE FUNCTION editor.can_write(ws text) RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT editor.member_role(ws) IN ('owner', 'admin', 'member')
$$;
REVOKE ALL ON FUNCTION editor.member_role(text), editor.can_read(text), editor.can_write(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION editor.member_role(text), editor.can_read(text), editor.can_write(text) TO authenticated, service_role;

-- Tabelas da empresa: leitura para quem lê, escrita para quem altera.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT * FROM (VALUES
    ('editor', 'spaces'), ('editor', 'folders'), ('editor', 'files'), ('editor', 'projects'), ('editor', 'project_versions'),
    ('social', 'social_accounts'), ('social', 'posts'), ('social', 'plugin_tool_modes'), ('social', 'plugin_activity')) AS v(s, n)
  LOOP
    EXECUTE format('DROP POLICY "%s: members" ON %I.%I', t.n, t.s, t.n);
    EXECUTE format('CREATE POLICY "%s: read" ON %I.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t.n, t.s, t.n);
    EXECUTE format('CREATE POLICY "%s: insert" ON %I.%I FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id))', t.n, t.s, t.n);
    EXECUTE format('CREATE POLICY "%s: update" ON %I.%I FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id))', t.n, t.s, t.n);
    EXECUTE format('CREATE POLICY "%s: delete" ON %I.%I FOR DELETE TO authenticated USING (editor.can_write(workspace_id))', t.n, t.s, t.n);
  END LOOP;
END $$;

-- Favoritos e recentes: da pessoa, em empresa que ela pode ler (até quem só lê marca favoritos).
DROP POLICY "favorites: own" ON editor.favorites;
CREATE POLICY "favorites: own" ON editor.favorites FOR ALL TO authenticated
  USING (user_id = editor.uid() AND editor.can_read(workspace_id))
  WITH CHECK (user_id = editor.uid() AND editor.can_read(workspace_id));
DROP POLICY "recents: own" ON editor.recents;
CREATE POLICY "recents: own" ON editor.recents FOR ALL TO authenticated
  USING (user_id = editor.uid() AND editor.can_read(workspace_id))
  WITH CHECK (user_id = editor.uid() AND editor.can_read(workspace_id));

-- Mídia e contas de um post seguem o post; ligar mídia ou conta exige poder alterar o post.
DROP POLICY "post_files: members" ON social.post_files;
CREATE POLICY "post_files: read" ON social.post_files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM social.posts p WHERE p.id = post_id AND editor.can_read(p.workspace_id)));
CREATE POLICY "post_files: write" ON social.post_files FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM social.posts p WHERE p.id = post_id AND editor.can_write(p.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM social.posts p WHERE p.id = post_id AND editor.can_write(p.workspace_id))
    AND EXISTS (SELECT 1 FROM editor.files f WHERE f.id = file_id AND f.workspace_id = (SELECT p.workspace_id FROM social.posts p WHERE p.id = post_id)));
DROP POLICY "post_accounts: members" ON social.post_accounts;
CREATE POLICY "post_accounts: read" ON social.post_accounts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM social.posts p WHERE p.id = post_id AND editor.can_read(p.workspace_id)));
CREATE POLICY "post_accounts: write" ON social.post_accounts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM social.posts p WHERE p.id = post_id AND editor.can_write(p.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM social.posts p WHERE p.id = post_id AND editor.can_write(p.workspace_id))
    AND EXISTS (SELECT 1 FROM social.social_accounts a WHERE a.id = account_id AND a.workspace_id = (SELECT p.workspace_id FROM social.posts p WHERE p.id = post_id)));

-- Notificações: as da empresa e as da própria pessoa, para quem pode ler a empresa.
DROP POLICY "notifications: read" ON social.notifications;
DROP POLICY "notifications: insert" ON social.notifications;
DROP POLICY "notifications: update" ON social.notifications;
DROP POLICY "notifications: delete" ON social.notifications;
CREATE POLICY "notifications: read" ON social.notifications FOR SELECT TO authenticated
  USING (editor.can_read(workspace_id) AND (user_id IS NULL OR user_id = editor.uid()));
CREATE POLICY "notifications: insert" ON social.notifications FOR INSERT TO authenticated
  WITH CHECK (editor.can_read(workspace_id) AND (user_id IS NULL OR user_id = editor.uid()));
CREATE POLICY "notifications: update" ON social.notifications FOR UPDATE TO authenticated
  USING (editor.can_read(workspace_id) AND (user_id IS NULL OR user_id = editor.uid()))
  WITH CHECK (editor.can_read(workspace_id) AND (user_id IS NULL OR user_id = editor.uid()));
CREATE POLICY "notifications: delete" ON social.notifications FOR DELETE TO authenticated
  USING (editor.can_read(workspace_id) AND (user_id IS NULL OR user_id = editor.uid()));

-- Arquivos do bucket editor-media: a primeira pasta é a empresa.
DROP POLICY "editor-media: members read" ON storage.objects;
DROP POLICY "editor-media: members upload" ON storage.objects;
DROP POLICY "editor-media: members update" ON storage.objects;
DROP POLICY "editor-media: members delete" ON storage.objects;
CREATE POLICY "editor-media: read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'editor-media' AND editor.can_read((storage.foldername(name))[1]));
CREATE POLICY "editor-media: upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'editor-media' AND editor.can_write((storage.foldername(name))[1]));
CREATE POLICY "editor-media: update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'editor-media' AND editor.can_write((storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'editor-media' AND editor.can_write((storage.foldername(name))[1]));
CREATE POLICY "editor-media: delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'editor-media' AND editor.can_write((storage.foldername(name))[1]));

COMMIT;

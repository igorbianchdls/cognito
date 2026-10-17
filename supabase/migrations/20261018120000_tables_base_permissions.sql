BEGIN;
SET LOCAL lock_timeout='10s';
-- Permissions per base. Company owners and admins administer every base. Other people get the
-- role from base_membros; without a row, bases open to the company give members "editor" and
-- read-only company users "leitor", and restricted bases are invisible.
--   leitor: reads.   editor: records, comments, attachments and views.   administrador: structure and sharing.
ALTER TABLE tables.bases ADD COLUMN acesso text NOT NULL DEFAULT 'empresa' CHECK(acesso IN ('empresa','restrito'));
COMMENT ON TABLE tables.base_membros IS 'Papel de cada pessoa na base. Em bases restritas, só quem está aqui (e administradores da empresa) vê a base.';

-- Creators keep administering what they created before permissions existed (a backfill, not an edit: no history).
ALTER TABLE tables.base_membros DISABLE TRIGGER auditar;
INSERT INTO tables.base_membros(empresa_id,base_id,usuario_id,papel)
SELECT b.empresa_id,b.id,b.criado_por,'administrador' FROM tables.bases b
JOIN shared.usuarios_empresas m ON m.empresa_id=b.empresa_id AND m.usuario_id=b.criado_por AND m.role IN ('owner','admin','member')
ON CONFLICT(empresa_id,base_id,usuario_id) DO NOTHING;
ALTER TABLE tables.base_membros ENABLE TRIGGER auditar;

CREATE FUNCTION tables.nivel(papel text) RETURNS int LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT CASE papel WHEN 'leitor' THEN 1 WHEN 'editor' THEN 2 WHEN 'administrador' THEN 3 ELSE 0 END
$$;
-- Role of the current person in one base (NULL: no access).
CREATE FUNCTION tables.papel_base(p_base uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT CASE
   WHEN m.role IN ('owner','admin') THEN 'administrador'
   WHEN m.role='viewer' THEN CASE WHEN bm.papel IS NOT NULL OR b.acesso='empresa' THEN 'leitor' END
   WHEN bm.papel IS NOT NULL THEN bm.papel
   WHEN b.acesso='empresa' THEN 'editor'
 END
 FROM tables.bases b
 JOIN shared.usuarios_empresas m ON m.empresa_id=b.empresa_id AND m.usuario_id=tables.usuario_atual()
 JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=m.empresa_id
 LEFT JOIN tables.base_membros bm ON bm.empresa_id=b.empresa_id AND bm.base_id=b.id AND bm.usuario_id=m.usuario_id
 WHERE b.empresa_id=tables.empresa_atual() AND b.id=p_base AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'
$$;
-- All bases where the current person has at least this role. Policies call it once per query.
CREATE FUNCTION tables.bases_permitidas(p_nivel text) RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT coalesce(array_agg(b.id),'{}') FROM tables.bases b
 JOIN shared.usuarios_empresas m ON m.empresa_id=b.empresa_id AND m.usuario_id=tables.usuario_atual()
 JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=m.empresa_id
 LEFT JOIN tables.base_membros bm ON bm.empresa_id=b.empresa_id AND bm.base_id=b.id AND bm.usuario_id=m.usuario_id
 WHERE b.empresa_id=tables.empresa_atual() AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'
 AND tables.nivel(CASE
   WHEN m.role IN ('owner','admin') THEN 'administrador'
   WHEN m.role='viewer' THEN CASE WHEN bm.papel IS NOT NULL OR b.acesso='empresa' THEN 'leitor' END
   WHEN bm.papel IS NOT NULL THEN bm.papel
   WHEN b.acesso='empresa' THEN 'editor'
 END)>=tables.nivel(p_nivel)
$$;
CREATE FUNCTION tables.tabelas_permitidas(p_nivel text) RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT coalesce(array_agg(t.id),'{}') FROM tables.tabelas t WHERE t.empresa_id=tables.empresa_atual() AND t.base_id=ANY(tables.bases_permitidas(p_nivel))
$$;
CREATE FUNCTION tables.base_do_registro(p_registro uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT base_id FROM tables.registros WHERE empresa_id=tables.empresa_atual() AND id=p_registro
$$;
-- Company owners and admins: they administer every base and cannot be restricted.
CREATE FUNCTION tables.administradores_empresa() RETURNS TABLE(id text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT m.usuario_id::text FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id
 WHERE m.empresa_id=tables.empresa_atual() AND m.role IN ('owner','admin') AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND tables.membro_ativo()
$$;
-- Whoever creates a base administers it.
CREATE FUNCTION tables.criador_administra() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 INSERT INTO tables.base_membros(empresa_id,base_id,usuario_id,papel) VALUES(NEW.empresa_id,NEW.id,NEW.criado_por,'administrador') ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
CREATE TRIGGER criador_administra AFTER INSERT ON tables.bases FOR EACH ROW EXECUTE FUNCTION tables.criador_administra();

-- Policies: read needs leitor; each write needs the role of what it changes.
DO $$ DECLARE t text; escrita text; alvo text; BEGIN
 FOREACH t IN ARRAY ARRAY['bases','base_membros','tabelas','campos','campo_opcoes','registros','registro_opcoes','registro_usuarios','registro_vinculos','visualizacoes','visualizacao_campos','anexos','comentarios','historico'] LOOP
   FOREACH escrita IN ARRAY ARRAY['leitura','inserir','atualizar','remover'] LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON tables.%I',escrita,t); END LOOP;
   alvo := CASE
     -- A base created in this transaction is visible to its creator before the membership row exists (INSERT ... RETURNING).
     WHEN t='bases' THEN '(id=ANY(CAST((SELECT tables.bases_permitidas(%L)) AS uuid[])) OR criado_por=tables.usuario_atual() AND criado_em=now())'
     WHEN t IN ('base_membros','tabelas','campos','registros','registro_vinculos','visualizacoes','historico') THEN 'base_id=ANY(CAST((SELECT tables.bases_permitidas(%L)) AS uuid[]))'
     WHEN t='comentarios' THEN 'tables.base_do_registro(registro_id)=ANY(CAST((SELECT tables.bases_permitidas(%L)) AS uuid[]))'
     ELSE 'tabela_id=ANY(CAST((SELECT tables.tabelas_permitidas(%L)) AS uuid[]))' END;
   EXECUTE format('CREATE POLICY leitura ON tables.%I FOR SELECT TO tables_runtime USING (empresa_id=tables.empresa_atual() AND '||alvo||')',t,'leitor');
   IF t<>'historico' THEN
     escrita := CASE WHEN t IN ('bases','base_membros','tabelas','campos','campo_opcoes') THEN 'administrador' ELSE 'editor' END;
     IF t='bases' THEN
       -- Any company member who can write may create a base; changing one needs its administrator.
       EXECUTE 'CREATE POLICY inserir ON tables.bases FOR INSERT TO tables_runtime WITH CHECK (empresa_id=tables.empresa_atual() AND (SELECT tables.membro_ativo(true)))';
     ELSE
       EXECUTE format('CREATE POLICY inserir ON tables.%I FOR INSERT TO tables_runtime WITH CHECK (empresa_id=tables.empresa_atual() AND '||alvo||')',t,escrita);
     END IF;
     -- Row locks (FOR SHARE/UPDATE) use the UPDATE USING clause: editors may lock a table to write records,
     -- while WITH CHECK keeps the change itself to the required role.
     EXECUTE format('CREATE POLICY atualizar ON tables.%I FOR UPDATE TO tables_runtime USING (empresa_id=tables.empresa_atual() AND '||alvo||') WITH CHECK (empresa_id=tables.empresa_atual() AND '||alvo||')',t,CASE WHEN t IN ('bases','tabelas') THEN 'editor' ELSE escrita END,escrita);
     EXECUTE format('CREATE POLICY remover ON tables.%I FOR DELETE TO tables_runtime USING (empresa_id=tables.empresa_atual() AND '||alvo||')',t,escrita);
   END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION tables.nivel(text),tables.papel_base(uuid),tables.bases_permitidas(text),tables.tabelas_permitidas(text),tables.base_do_registro(uuid),tables.administradores_empresa(),tables.criador_administra() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION tables.nivel(text),tables.papel_base(uuid),tables.bases_permitidas(text),tables.tabelas_permitidas(text),tables.base_do_registro(uuid),tables.administradores_empresa() TO tables_runtime;
COMMIT;

-- Notas (etapa 5): permissão por página e link público.
--   * acesso = 'restrito': só quem criou a página e as pessoas convidadas (notas.permissoes: ver ou editar) veem a
--     página e as subpáginas. restricao_id = a página restrita mais próxima (ela mesma ou uma mãe), mantida pelo
--     servidor ao criar, mover e mudar o acesso; as políticas usam essa coluna.
--   * Página particular também pode ser compartilhada com convidados (acesso restrito).
--   * publica + token_publico: qualquer pessoa com o link lê a página (só leitura, sem as subpáginas). A leitura pública
--     é feita pelo servidor, por token; o banco não abre nada para anon.
--   * Para desfazer: recriar as políticas da etapa 1/3/4 com notas.pode_ver/pode_editar de 3 argumentos e
--     DROP TABLE notas.permissoes; ALTER TABLE notas.paginas DROP COLUMN acesso, restricao_id, publica, token_publico.
BEGIN;

ALTER TABLE notas.paginas
  ADD COLUMN acesso text NOT NULL DEFAULT 'empresa' CHECK (acesso IN ('empresa', 'restrito')),
  ADD COLUMN restricao_id uuid REFERENCES notas.paginas (id) ON DELETE SET NULL,
  ADD COLUMN publica boolean NOT NULL DEFAULT false,
  ADD COLUMN token_publico text UNIQUE CHECK (char_length(token_publico) BETWEEN 20 AND 100);
CREATE INDEX paginas_restricao_idx ON notas.paginas (restricao_id) WHERE restricao_id IS NOT NULL;

CREATE TABLE notas.permissoes (
  pagina_id uuid NOT NULL REFERENCES notas.paginas (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  user_id text NOT NULL,
  nivel text NOT NULL CHECK (nivel IN ('ver', 'editar')),
  created_by text NOT NULL DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pagina_id, user_id)
);
ALTER TABLE notas.permissoes ENABLE ROW LEVEL SECURITY;

-- A pessoa tem acesso à página restrita `raiz`? (quem criou a raiz tem tudo; convidado conforme o nível)
-- (O parâmetro não pode se chamar "nivel": numa função SQL a coluna x.nivel teria precedência sobre ele.)
CREATE FUNCTION notas.permitido(raiz uuid, nivel_pedido text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = raiz AND p.created_by = editor.uid())
    OR EXISTS (SELECT 1 FROM notas.permissoes x WHERE x.pagina_id = raiz AND x.user_id = editor.uid()
      AND (nivel_pedido = 'ver' OR x.nivel = 'editar'))
$$;

CREATE FUNCTION notas.pode_ver(ws text, esp notas.espaco, dono text, restricao uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT editor.can_read(ws) AND CASE
    WHEN restricao IS NOT NULL THEN notas.permitido(restricao, 'ver')
    WHEN esp = 'particular' THEN dono = editor.uid()
    ELSE true END
$$;
CREATE FUNCTION notas.pode_editar(ws text, esp notas.espaco, dono text, restricao uuid) RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT CASE
    WHEN restricao IS NOT NULL THEN editor.can_read(ws) AND notas.permitido(restricao, 'editar') AND (esp = 'particular' OR editor.can_write(ws))
    WHEN esp = 'particular' THEN editor.can_read(ws) AND dono = editor.uid()
    ELSE editor.can_write(ws) END
$$;
REVOKE ALL ON FUNCTION notas.permitido(uuid, text), notas.pode_ver(text, notas.espaco, text, uuid), notas.pode_editar(text, notas.espaco, text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION notas.permitido(uuid, text), notas.pode_ver(text, notas.espaco, text, uuid), notas.pode_editar(text, notas.espaco, text, uuid) TO authenticated, service_role;

-- Páginas: as políticas passam a considerar a restrição.
DROP POLICY "paginas: ler" ON notas.paginas;
DROP POLICY "paginas: criar" ON notas.paginas;
DROP POLICY "paginas: editar" ON notas.paginas;
DROP POLICY "paginas: apagar" ON notas.paginas;
CREATE POLICY "paginas: ler" ON notas.paginas FOR SELECT TO authenticated USING (notas.pode_ver(workspace_id, espaco, created_by, restricao_id));
CREATE POLICY "paginas: criar" ON notas.paginas FOR INSERT TO authenticated
  WITH CHECK (created_by = editor.uid() AND notas.pode_editar(workspace_id, espaco, created_by, restricao_id));
CREATE POLICY "paginas: editar" ON notas.paginas FOR UPDATE TO authenticated
  USING (notas.pode_editar(workspace_id, espaco, created_by, restricao_id)) WITH CHECK (notas.pode_editar(workspace_id, espaco, created_by, restricao_id));
CREATE POLICY "paginas: apagar" ON notas.paginas FOR DELETE TO authenticated USING (notas.pode_editar(workspace_id, espaco, created_by, restricao_id));

DROP POLICY "versoes: gravar" ON notas.versoes;
DROP POLICY "versoes: limpar" ON notas.versoes;
CREATE POLICY "versoes: gravar" ON notas.versoes FOR INSERT TO authenticated
  WITH CHECK (created_by = editor.uid() AND EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id
    AND p.workspace_id = workspace_id AND notas.pode_editar(p.workspace_id, p.espaco, p.created_by, p.restricao_id)));
CREATE POLICY "versoes: limpar" ON notas.versoes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id AND notas.pode_editar(p.workspace_id, p.espaco, p.created_by, p.restricao_id)));

DROP POLICY "comentarios: alterar" ON notas.comentarios;
CREATE POLICY "comentarios: alterar" ON notas.comentarios FOR UPDATE TO authenticated
  USING (autor = editor.uid() OR EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id AND notas.pode_editar(p.workspace_id, p.espaco, p.created_by, p.restricao_id)));

CREATE OR REPLACE FUNCTION notas.canal_permitido(topico text, enviar boolean) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE partes text[] := string_to_array(topico, ':'); alvo uuid; pagina record;
BEGIN
  IF partes[1] IS DISTINCT FROM 'notas' THEN RETURN false; END IF;
  IF partes[2] = 'ws' THEN RETURN partes[3] = editor.org() AND editor.can_read(partes[3]); END IF;
  IF partes[2] NOT IN ('pagina', 'base') OR partes[3] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN RETURN false; END IF;
  alvo := partes[3]::uuid;
  SELECT workspace_id, espaco, created_by, restricao_id INTO pagina FROM notas.paginas WHERE id = alvo;
  IF NOT FOUND THEN RETURN false; END IF;
  RETURN NOT enviar OR notas.pode_editar(pagina.workspace_id, pagina.espaco, pagina.created_by, pagina.restricao_id);
END $$;

-- Convidar só pessoas ativas da empresa: responde "é membro?" sem expor o cadastro (e só para quem é da empresa).
CREATE FUNCTION notas.membro_ativo(ws text, pessoa text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT editor.can_read(ws) AND EXISTS (
    SELECT 1 FROM shared.usuarios_empresas ue
    JOIN shared.empresas e ON e.id = ue.empresa_id JOIN shared.usuarios u ON u.id = ue.usuario_id
    WHERE e.clerk_organization_id = ws AND u.clerk_user_id = pessoa AND ue.status = 'active')
$$;
REVOKE ALL ON FUNCTION notas.membro_ativo(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION notas.membro_ativo(text, text) TO authenticated, service_role;

-- Convidados: quem vê a página vê a lista; só quem criou a página restrita muda (o servidor confere também).
CREATE POLICY "permissoes: ler" ON notas.permissoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id));
CREATE POLICY "permissoes: gerir" ON notas.permissoes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id AND p.created_by = editor.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id AND p.created_by = editor.uid() AND p.workspace_id = workspace_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON notas.permissoes TO authenticated;
GRANT ALL ON notas.permissoes TO service_role;

COMMIT;

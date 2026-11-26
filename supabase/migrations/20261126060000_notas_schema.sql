-- Produto Notas (etapa 1): páginas em árvore com conteúdo em blocos (BlockNote), favoritos, recentes, lixeira e busca.
--   * workspace_id é a organização do Clerk, como no Drive e no Marketing; o acesso usa editor.can_read/can_write.
--   * Espaço "equipe": todos da empresa leem e quem altera dados edita. Espaço "particular": só quem criou.
--   * O servidor do Otto roda as consultas como a pessoa (role authenticated com o usuário e a empresa ativa), então
--     estas políticas decidem tudo; a tela não fala com o banco direto.
--   * Edição simultânea fica para a etapa 4: até lá, versao impede que uma gravação sobrescreva a outra.
--   * Para desfazer: DROP SCHEMA notas CASCADE; e apagar o bucket notas.
BEGIN;

CREATE SCHEMA notas;
GRANT USAGE ON SCHEMA notas TO authenticated, service_role;

CREATE TYPE notas.espaco AS ENUM ('equipe', 'particular');

CREATE TABLE notas.paginas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  espaco notas.espaco NOT NULL DEFAULT 'equipe',
  parent_id uuid REFERENCES notas.paginas (id) ON DELETE CASCADE,
  posicao double precision NOT NULL DEFAULT 0,
  titulo text NOT NULL DEFAULT '' CHECK (char_length(titulo) <= 500),
  icone text CHECK (char_length(icone) <= 64),
  capa text CHECK (char_length(capa) <= 1000),
  capa_posicao int NOT NULL DEFAULT 50 CHECK (capa_posicao BETWEEN 0 AND 100),
  conteudo jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Texto puro do conteúdo (para busca), preenchido pelo servidor a cada gravação.
  conteudo_texto text NOT NULL DEFAULT '',
  largura_total boolean NOT NULL DEFAULT false,
  texto_pequeno boolean NOT NULL DEFAULT false,
  fonte text NOT NULL DEFAULT 'padrao' CHECK (fonte IN ('padrao', 'serifa', 'mono')),
  bloqueada boolean NOT NULL DEFAULT false,
  versao int NOT NULL DEFAULT 1,
  created_by text NOT NULL DEFAULT editor.uid(),
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Lixeira: a página (e as filhas, junto) ficam aqui até serem restauradas ou apagadas de vez.
  arquivada_em timestamptz,
  arquivada_por text,
  busca tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(titulo, '')), 'A') || setweight(to_tsvector('portuguese', coalesce(conteudo_texto, '')), 'B')
  ) STORED,
  CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE INDEX paginas_arvore_idx ON notas.paginas (workspace_id, parent_id, posicao);
CREATE INDEX paginas_busca_idx ON notas.paginas USING gin (busca);
CREATE TRIGGER touch BEFORE UPDATE ON notas.paginas FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();

-- A subpágina fica no mesmo espaço e na mesma empresa da página-mãe.
CREATE FUNCTION notas.validar_pai() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE pai record;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  SELECT workspace_id, espaco INTO pai FROM notas.paginas WHERE id = NEW.parent_id;
  IF pai.workspace_id IS DISTINCT FROM NEW.workspace_id OR pai.espaco IS DISTINCT FROM NEW.espaco THEN
    RAISE EXCEPTION 'A subpágina precisa ficar no mesmo espaço da página-mãe.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validar_pai BEFORE INSERT OR UPDATE OF parent_id, espaco, workspace_id ON notas.paginas FOR EACH ROW EXECUTE FUNCTION notas.validar_pai();

CREATE TABLE notas.favoritos (
  user_id text NOT NULL DEFAULT editor.uid(),
  pagina_id uuid NOT NULL REFERENCES notas.paginas (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  posicao double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pagina_id)
);

CREATE TABLE notas.recentes (
  user_id text NOT NULL DEFAULT editor.uid(),
  pagina_id uuid NOT NULL REFERENCES notas.paginas (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  visto_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pagina_id)
);
CREATE INDEX recentes_user_idx ON notas.recentes (workspace_id, user_id, visto_em DESC);

ALTER TABLE notas.paginas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas.favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas.recentes ENABLE ROW LEVEL SECURITY;

-- Quem vê a página: a empresa toda no espaço equipe; só quem criou no espaço particular.
CREATE FUNCTION notas.pode_ver(ws text, esp notas.espaco, dono text) RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT editor.can_read(ws) AND (esp = 'equipe' OR dono = editor.uid())
$$;
CREATE FUNCTION notas.pode_editar(ws text, esp notas.espaco, dono text) RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT CASE WHEN esp = 'particular' THEN editor.can_read(ws) AND dono = editor.uid() ELSE editor.can_write(ws) END
$$;
REVOKE ALL ON FUNCTION notas.pode_ver(text, notas.espaco, text), notas.pode_editar(text, notas.espaco, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION notas.pode_ver(text, notas.espaco, text), notas.pode_editar(text, notas.espaco, text) TO authenticated, service_role;

CREATE POLICY "paginas: ler" ON notas.paginas FOR SELECT TO authenticated USING (notas.pode_ver(workspace_id, espaco, created_by));
CREATE POLICY "paginas: criar" ON notas.paginas FOR INSERT TO authenticated
  WITH CHECK (created_by = editor.uid() AND notas.pode_editar(workspace_id, espaco, created_by));
CREATE POLICY "paginas: editar" ON notas.paginas FOR UPDATE TO authenticated
  USING (notas.pode_editar(workspace_id, espaco, created_by)) WITH CHECK (notas.pode_editar(workspace_id, espaco, created_by));
CREATE POLICY "paginas: apagar" ON notas.paginas FOR DELETE TO authenticated USING (notas.pode_editar(workspace_id, espaco, created_by));

CREATE POLICY "favoritos: da pessoa" ON notas.favoritos FOR ALL TO authenticated
  USING (user_id = editor.uid() AND editor.can_read(workspace_id)) WITH CHECK (user_id = editor.uid() AND editor.can_read(workspace_id));
CREATE POLICY "recentes: da pessoa" ON notas.recentes FOR ALL TO authenticated
  USING (user_id = editor.uid() AND editor.can_read(workspace_id)) WITH CHECK (user_id = editor.uid() AND editor.can_read(workspace_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA notas TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA notas TO service_role;

-- Imagens e arquivos das páginas (capas e blocos de imagem/arquivo): bucket privado, uma pasta por empresa.
-- A tela usa endereços /api/notas/arquivos/…, que conferem o acesso e redirecionam para uma URL assinada.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('notas', 'notas', false, 104857600)
ON CONFLICT (id) DO NOTHING;

COMMIT;

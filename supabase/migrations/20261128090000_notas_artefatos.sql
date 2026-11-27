-- Notas: artefatos. Uma página do tipo "artefato" é escrita em HTML por um agente (pelo MCP do Otto) e aparece nas
-- Notas como as outras páginas (barra lateral, permissões, compartilhamento, lixeira, busca). O HTML fica numa tabela
-- própria, com as versões ao lado; quem vê a página vê o artefato, quem edita a página grava o artefato.
--   * notas.paginas.tipo passa a aceitar 'artefato'.
--   * notas.artefatos: o HTML atual (uma linha por página do tipo artefato).
--   * notas.artefato_versoes: cada HTML gravado, com o resumo da mudança e quem fez.
--   * Para desfazer: DROP TABLE notas.artefato_versoes, notas.artefatos; e volte o CHECK de tipo para ('pagina', 'base')
--     (depois de apagar as páginas do tipo artefato).
BEGIN;

ALTER TABLE notas.paginas DROP CONSTRAINT IF EXISTS paginas_tipo_check;
ALTER TABLE notas.paginas ADD CONSTRAINT paginas_tipo_check CHECK (tipo IN ('pagina', 'base', 'artefato'));

CREATE TABLE notas.artefatos (
  pagina_id uuid PRIMARY KEY REFERENCES notas.paginas (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  html text NOT NULL CHECK (octet_length(html) <= 1048576),
  versao int NOT NULL DEFAULT 1,
  updated_by text NOT NULL DEFAULT editor.uid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notas.artefatos ENABLE ROW LEVEL SECURITY;

CREATE TABLE notas.artefato_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id uuid NOT NULL REFERENCES notas.paginas (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  versao int NOT NULL,
  html text NOT NULL CHECK (octet_length(html) <= 1048576),
  resumo text NOT NULL DEFAULT '' CHECK (char_length(resumo) <= 300),
  created_by text NOT NULL DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pagina_id, versao)
);
CREATE INDEX artefato_versoes_pagina_idx ON notas.artefato_versoes (pagina_id, versao DESC);
ALTER TABLE notas.artefato_versoes ENABLE ROW LEVEL SECURITY;

-- A página decide: a subconsulta roda sob a política da página (enxerga = pode ler; pode_editar = pode gravar).
CREATE POLICY "artefatos: ler" ON notas.artefatos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = notas.artefatos.pagina_id));
CREATE POLICY "artefatos: criar" ON notas.artefatos FOR INSERT TO authenticated
  WITH CHECK (updated_by = editor.uid() AND EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = notas.artefatos.pagina_id
    AND p.tipo = 'artefato' AND p.workspace_id = notas.artefatos.workspace_id AND notas.pode_editar(p.workspace_id, p.espaco, p.created_by, p.restricao_id)));
CREATE POLICY "artefatos: gravar" ON notas.artefatos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = notas.artefatos.pagina_id AND notas.pode_editar(p.workspace_id, p.espaco, p.created_by, p.restricao_id)))
  WITH CHECK (updated_by = editor.uid());
GRANT SELECT, INSERT, UPDATE ON notas.artefatos TO authenticated;
GRANT ALL ON notas.artefatos TO service_role;

CREATE POLICY "artefato_versoes: ler" ON notas.artefato_versoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = notas.artefato_versoes.pagina_id));
CREATE POLICY "artefato_versoes: gravar" ON notas.artefato_versoes FOR INSERT TO authenticated
  WITH CHECK (created_by = editor.uid() AND EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = notas.artefato_versoes.pagina_id
    AND p.workspace_id = notas.artefato_versoes.workspace_id AND notas.pode_editar(p.workspace_id, p.espaco, p.created_by, p.restricao_id)));
GRANT SELECT, INSERT ON notas.artefato_versoes TO authenticated;
GRANT ALL ON notas.artefato_versoes TO service_role;

COMMIT;

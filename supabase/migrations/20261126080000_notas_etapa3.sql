-- Notas (etapa 3): modelos de item nas bases e histórico de versões das páginas.
--   * e_modelo: item que serve de modelo no "Novo ▾" da base; não aparece nas visões.
--   * notas.versoes: fotos da página (título, ícone, conteúdo) tiradas pelo servidor antes de gravar, no máximo uma a
--     cada 10 minutos por pessoa; ficam 30 dias (até 100 por página). Quem vê a página vê o histórico; quem edita pode
--     gravar uma foto (o servidor faz isso) e restaurar.
--   * Para desfazer: DROP TABLE notas.versoes; ALTER TABLE notas.paginas DROP COLUMN e_modelo;
BEGIN;

ALTER TABLE notas.paginas ADD COLUMN e_modelo boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT paginas_modelo_e_item CHECK (NOT e_modelo OR base_id IS NOT NULL);

CREATE TABLE notas.versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id uuid NOT NULL REFERENCES notas.paginas (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  titulo text NOT NULL DEFAULT '',
  icone text,
  conteudo jsonb NOT NULL DEFAULT '[]'::jsonb,
  propriedades jsonb NOT NULL DEFAULT '{}'::jsonb,
  versao int NOT NULL,
  autor text,
  created_by text NOT NULL DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX versoes_pagina_idx ON notas.versoes (pagina_id, created_at DESC);
ALTER TABLE notas.versoes ENABLE ROW LEVEL SECURITY;

-- A política da página decide: se a pessoa enxerga a página (subconsulta sob RLS), enxerga as versões.
CREATE POLICY "versoes: ler" ON notas.versoes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id));
CREATE POLICY "versoes: gravar" ON notas.versoes FOR INSERT TO authenticated
  WITH CHECK (created_by = editor.uid() AND EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id
    AND p.workspace_id = workspace_id AND notas.pode_editar(p.workspace_id, p.espaco, p.created_by)));
CREATE POLICY "versoes: limpar" ON notas.versoes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id AND notas.pode_editar(p.workspace_id, p.espaco, p.created_by)));
GRANT SELECT, INSERT, DELETE ON notas.versoes TO authenticated;
GRANT ALL ON notas.versoes TO service_role;

COMMIT;

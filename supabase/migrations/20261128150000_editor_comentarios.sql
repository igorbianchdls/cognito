-- Comentários no vídeo (revisão): cada um preso a um momento do vídeo (segundo), com quem escreveu. O assistente
-- (Claude ou ChatGPT, pelo conector do Otto) lê os abertos, refaz o vídeo seguindo-os e marca como resolvidos na versão
-- nova que criou; a versão anterior fica no histórico.

CREATE TABLE editor.comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES editor.projects (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  versao_id uuid REFERENCES editor.project_versions (id) ON DELETE SET NULL,
  segundo numeric NOT NULL CHECK (segundo >= 0),
  texto text NOT NULL CHECK (char_length(btrim(texto)) BETWEEN 1 AND 2000),
  autor text DEFAULT editor.uid(),
  autor_nome text CHECK (char_length(autor_nome) <= 120),
  resolvido_em timestamptz,
  resolvido_na_versao_id uuid REFERENCES editor.project_versions (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comentarios_projeto ON editor.comentarios (project_id, segundo);
CREATE INDEX comentarios_abertos ON editor.comentarios (workspace_id, project_id) WHERE resolvido_em IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON editor.comentarios TO authenticated;
GRANT ALL ON editor.comentarios TO service_role;
ALTER TABLE editor.comentarios ENABLE ROW LEVEL SECURITY;
-- Quem vê o projeto lê os comentários; quem altera comenta, resolve e apaga (o mesmo das versões).
CREATE POLICY "comentarios: read" ON editor.comentarios FOR SELECT TO authenticated USING (editor.can_read(workspace_id));
CREATE POLICY "comentarios: insert" ON editor.comentarios FOR INSERT TO authenticated
  WITH CHECK (editor.can_write(workspace_id) AND EXISTS (SELECT 1 FROM editor.projects p WHERE p.id = project_id AND p.workspace_id = comentarios.workspace_id));
CREATE POLICY "comentarios: update" ON editor.comentarios FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "comentarios: delete" ON editor.comentarios FOR DELETE TO authenticated USING (editor.can_write(workspace_id));

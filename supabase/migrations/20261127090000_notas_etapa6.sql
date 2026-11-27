-- Notas (etapa 6): caixa de entrada (menções de pessoas, comentários, atribuições e lembretes de datas).
--   * notas.notificacoes: uma linha por pessoa avisada. Cada um vê e marca como lidas só as suas. Quem age (menciona,
--     comenta, atribui) grava o aviso para a outra pessoa da mesma empresa; lembretes são gravados pela tarefa diária
--     do servidor. `chave` evita avisos repetidos (o mesmo lembrete, a mesma menção).
--   * Para desfazer: DROP TABLE notas.notificacoes;
BEGIN;

CREATE TABLE notas.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  user_id text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('mencao', 'comentario', 'atribuicao', 'lembrete')),
  pagina_id uuid REFERENCES notas.paginas (id) ON DELETE CASCADE,
  autor text,
  texto text NOT NULL DEFAULT '' CHECK (char_length(texto) <= 500),
  chave text UNIQUE CHECK (char_length(chave) <= 300),
  lida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notificacoes_pessoa_idx ON notas.notificacoes (workspace_id, user_id, created_at DESC);
ALTER TABLE notas.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificacoes: ler as suas" ON notas.notificacoes FOR SELECT TO authenticated
  USING (user_id = editor.uid() AND editor.can_read(workspace_id));
CREATE POLICY "notificacoes: marcar as suas" ON notas.notificacoes FOR UPDATE TO authenticated
  USING (user_id = editor.uid() AND editor.can_read(workspace_id)) WITH CHECK (user_id = editor.uid());
-- Avisar outra pessoa da mesma empresa, em nome de quem age.
CREATE POLICY "notificacoes: avisar" ON notas.notificacoes FOR INSERT TO authenticated
  WITH CHECK (autor = editor.uid() AND user_id <> editor.uid() AND editor.can_read(workspace_id)
    AND notas.membro_ativo(workspace_id, user_id) AND tipo IN ('mencao', 'comentario', 'atribuicao'));
GRANT SELECT, INSERT, UPDATE ON notas.notificacoes TO authenticated;
GRANT ALL ON notas.notificacoes TO service_role;

COMMIT;

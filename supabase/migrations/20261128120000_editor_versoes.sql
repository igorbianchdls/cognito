-- Versões do Editor de vídeo: além das salvas à mão, versões automáticas (a cada 10 min de edição, antes de grandes
-- mudanças, ao exportar e ao sair), com o que mudou, a duração, uma capa pequena e quem fez. Cada exportação guarda o
-- arquivo gerado. As automáticas sem nome são podadas: todas das últimas 24 h, uma por hora até 7 dias e uma por dia
-- até 90 dias; as com nome, as de exportação e as de restauração ficam para sempre.

ALTER TABLE editor.project_versions
  ADD COLUMN tipo text NOT NULL DEFAULT 'manual' CHECK (tipo IN ('manual', 'auto', 'antes', 'exportacao', 'restauracao')),
  ADD COLUMN nomeada boolean NOT NULL DEFAULT true,
  ADD COLUMN resumo text CHECK (char_length(resumo) <= 300),
  ADD COLUMN duracao numeric CHECK (duracao >= 0),
  ADD COLUMN capa text CHECK (char_length(capa) <= 150000),
  ADD COLUMN autor text CHECK (char_length(autor) <= 120),
  ADD COLUMN arquivo_id text;
ALTER TABLE editor.project_versions ADD CONSTRAINT project_versions_label_check CHECK (char_length(label) <= 120);
CREATE INDEX project_versions_arquivo ON editor.project_versions (workspace_id, arquivo_id) WHERE arquivo_id IS NOT NULL;

-- Poda das automáticas de um projeto. Roda como quem chama (as regras de acesso valem para o DELETE).
CREATE FUNCTION editor.podar_versoes(p_projeto uuid) RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  WITH candidatas AS (
    SELECT v.id, v.created_at,
      row_number() OVER (PARTITION BY date_trunc('hour', v.created_at) ORDER BY v.created_at DESC) AS na_hora,
      row_number() OVER (PARTITION BY date_trunc('day', v.created_at) ORDER BY v.created_at DESC) AS no_dia
    FROM editor.project_versions v
    WHERE v.project_id = p_projeto AND v.tipo IN ('auto', 'antes') AND NOT v.nomeada
  ), apagadas AS (
    DELETE FROM editor.project_versions v USING candidatas c
    WHERE v.id = c.id AND (
      c.created_at < now() - interval '90 days'
      OR (c.created_at < now() - interval '7 days' AND c.no_dia > 1)
      OR (c.created_at < now() - interval '24 hours' AND c.na_hora > 1))
    RETURNING 1)
  SELECT count(*)::int FROM apagadas
$$;
REVOKE ALL ON FUNCTION editor.podar_versoes(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION editor.podar_versoes(uuid) TO authenticated, service_role;

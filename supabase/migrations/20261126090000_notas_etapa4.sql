-- Notas (etapa 4): edição simultânea e comentários.
--   * estado_yjs: o documento colaborativo (Yjs, em base64), fundido pelo servidor a cada gravação; geracao_yjs muda
--     quando o conteúdo é trocado por fora (restaurar versão, modelo, importar): quem está numa geração antiga recarrega.
--   * Canais do Realtime (privados): notas:pagina:<id>:<geracao> (texto e cursores), notas:base:<id> (mudanças na base) e
--     notas:ws:<empresa> (barra lateral). Ouvir: quem vê a página/empresa. Enviar: quem edita.
--   * notas.comentarios: discussões na página ou num bloco; quem vê a página pode comentar; cada um edita/apaga o seu;
--     quem edita a página resolve.
--   * Para desfazer: DROP TABLE notas.comentarios; ALTER TABLE notas.paginas DROP COLUMN estado_yjs, DROP COLUMN geracao_yjs;
--     DROP POLICY nas realtime.messages (nomes "notas: …").
BEGIN;

ALTER TABLE notas.paginas
  ADD COLUMN estado_yjs text CHECK (char_length(estado_yjs) <= 20000000),
  ADD COLUMN geracao_yjs int NOT NULL DEFAULT 1;

CREATE TABLE notas.comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_id uuid NOT NULL REFERENCES notas.paginas (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  discussao_id uuid REFERENCES notas.comentarios (id) ON DELETE CASCADE,
  bloco_id text CHECK (char_length(bloco_id) <= 100),
  trecho text CHECK (char_length(trecho) <= 300),
  texto text NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 5000),
  resolvido boolean NOT NULL DEFAULT false,
  resolvido_por text,
  autor text NOT NULL DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  editado_em timestamptz
);
CREATE INDEX comentarios_pagina_idx ON notas.comentarios (pagina_id, created_at);
ALTER TABLE notas.comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comentarios: ler" ON notas.comentarios FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id));
CREATE POLICY "comentarios: escrever" ON notas.comentarios FOR INSERT TO authenticated
  WITH CHECK (autor = editor.uid() AND EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id AND p.workspace_id = workspace_id));
-- Texto: só o autor. Resolver: o autor ou quem edita a página (o servidor confere qual campo muda).
CREATE POLICY "comentarios: alterar" ON notas.comentarios FOR UPDATE TO authenticated
  USING (autor = editor.uid() OR EXISTS (SELECT 1 FROM notas.paginas p WHERE p.id = pagina_id AND notas.pode_editar(p.workspace_id, p.espaco, p.created_by)));
CREATE POLICY "comentarios: apagar" ON notas.comentarios FOR DELETE TO authenticated USING (autor = editor.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON notas.comentarios TO authenticated;
GRANT ALL ON notas.comentarios TO service_role;

-- Realtime: quem pode ouvir e enviar em cada canal das Notas.
CREATE FUNCTION notas.canal_permitido(topico text, enviar boolean) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE partes text[] := string_to_array(topico, ':'); alvo uuid; pagina record;
BEGIN
  IF partes[1] IS DISTINCT FROM 'notas' THEN RETURN false; END IF;
  IF partes[2] = 'ws' THEN RETURN partes[3] = editor.org() AND editor.can_read(partes[3]); END IF;
  IF partes[2] NOT IN ('pagina', 'base') OR partes[3] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN RETURN false; END IF;
  alvo := partes[3]::uuid;
  -- A política de leitura das páginas vale aqui (SECURITY INVOKER): página invisível = canal fechado.
  SELECT workspace_id, espaco, created_by INTO pagina FROM notas.paginas WHERE id = alvo;
  IF NOT FOUND THEN RETURN false; END IF;
  RETURN NOT enviar OR notas.pode_editar(pagina.workspace_id, pagina.espaco, pagina.created_by);
END $$;
REVOKE ALL ON FUNCTION notas.canal_permitido(text, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION notas.canal_permitido(text, boolean) TO authenticated, service_role;

CREATE POLICY "notas: ouvir canais" ON realtime.messages FOR SELECT TO authenticated
  USING (realtime.topic() LIKE 'notas:%' AND notas.canal_permitido(realtime.topic(), false));
CREATE POLICY "notas: enviar nos canais" ON realtime.messages FOR INSERT TO authenticated
  WITH CHECK (realtime.topic() LIKE 'notas:%' AND notas.canal_permitido(realtime.topic(), true));

COMMIT;

-- Sound effects do Marketing: catálogo dos arquivos do bucket "sound-effects".
-- A biblioteca é a mesma para todas as empresas (os arquivos não ficam numa pasta por empresa).
--   * ler: membro ativo da empresa ativa (editor.can_read), na tabela e no bucket;
--   * alterar: só o service_role (o catálogo é abastecido por script, a partir do Epidemic Sound).
-- O bucket é privado: a tela toca e baixa os arquivos por URL assinada.
BEGIN;

CREATE TABLE marketing.sound_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL UNIQUE,         -- caminho no bucket "sound-effects", ex.: transicoes/Swooshes, Whoosh, Wind.mp3
  title text NOT NULL,
  category text NOT NULL,                    -- slug da pasta no bucket, ex.: transicoes
  duration_ms integer CHECK (duration_ms >= 0),
  size_bytes bigint CHECK (size_bytes >= 0),
  mime text NOT NULL DEFAULT 'audio/mpeg',
  tags text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'epidemic_sound',
  source_id text,                            -- id do efeito na origem (Epidemic Sound)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);
CREATE INDEX sound_effects_category ON marketing.sound_effects (category, title);

ALTER TABLE marketing.sound_effects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON marketing.sound_effects FROM public, anon, authenticated;
GRANT SELECT ON marketing.sound_effects TO authenticated;
GRANT ALL ON marketing.sound_effects TO service_role;
CREATE POLICY "sound_effects: read" ON marketing.sound_effects FOR SELECT TO authenticated
  USING (editor.can_read(editor.org()));

CREATE POLICY "sound-effects: read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'sound-effects' AND editor.can_read(editor.org()));

INSERT INTO marketing.sound_effects (storage_path, title, category, duration_ms, size_bytes, tags, source_id) VALUES
  ('transicoes/Swooshes, Whoosh, Wind.mp3', 'Swooshes, Whoosh, Wind', 'transicoes', 1640, 47914, '{whoosh}', 'a951b5b5-4deb-454c-952b-560193d79b99');

COMMIT;

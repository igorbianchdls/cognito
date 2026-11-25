-- Marketing → Vídeos: vídeos gerados por IA (Seedance, Runway, Kling, Veo…), por empresa.
--   * workspace_id é a organização do Clerk, como no resto do Marketing; a leitura segue editor.can_read.
--   * Só o servidor grava (cada vídeo gasta cota e dinheiro no provedor): authenticated só lê, sem insert/update.
--   * O vídeo pronto e a imagem de referência ficam no bucket privado marketing-videos, em <empresa>/…; a tela usa
--     URL assinada pelo servidor. Copiar para o Drive é uma ação da tela.
--   * Para desfazer: DROP TABLE marketing.video_saves, marketing.video_generations, marketing.video_quotas;
--     DROP TYPE marketing.video_status; e apagar o bucket marketing-videos.
BEGIN;

CREATE TYPE marketing.video_status AS ENUM ('na_fila', 'gerando', 'pronto', 'erro', 'cancelado');

CREATE TABLE marketing.video_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  created_by text NOT NULL,
  prompt text NOT NULL CHECK (char_length(btrim(prompt)) BETWEEN 3 AND 2000),
  modelo text NOT NULL,
  formato text NOT NULL CHECK (formato IN ('16:9', '9:16', '1:1')),
  duracao_s int NOT NULL CHECK (duracao_s BETWEEN 1 AND 60),
  estilo text NOT NULL DEFAULT 'nenhum',
  referencia_path text,
  status marketing.video_status NOT NULL DEFAULT 'na_fila',
  erro text,
  provedor text NOT NULL,
  provedor_job_id text,
  resultado_path text,
  custo_segundos int NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  iniciado_em timestamptz,
  concluido_em timestamptz,
  excluido_em timestamptz,
  CHECK (status <> 'pronto' OR resultado_path IS NOT NULL),
  CHECK (status <> 'erro' OR erro IS NOT NULL)
);
CREATE INDEX video_generations_workspace_idx ON marketing.video_generations (workspace_id, criado_em DESC) WHERE excluido_em IS NULL;
CREATE INDEX video_generations_pending_idx ON marketing.video_generations (status) WHERE status IN ('na_fila', 'gerando');

-- "Salvos": cada pessoa salva os vídeos que quer achar depois.
CREATE TABLE marketing.video_saves (
  generation_id uuid NOT NULL REFERENCES marketing.video_generations (id) ON DELETE CASCADE,
  user_id text NOT NULL,
  workspace_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (generation_id, user_id)
);
CREATE INDEX video_saves_user_idx ON marketing.video_saves (workspace_id, user_id);

-- Cota mensal de cada empresa, em minutos (sem linha, vale a cota padrão do código).
CREATE TABLE marketing.video_quotas (
  workspace_id text PRIMARY KEY,
  minutos_mes numeric NOT NULL CHECK (minutos_mes > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE marketing.video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.video_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.video_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_generations: read" ON marketing.video_generations FOR SELECT TO authenticated
  USING (editor.can_read(workspace_id) AND excluido_em IS NULL);
CREATE POLICY "video_saves: read own" ON marketing.video_saves FOR SELECT TO authenticated
  USING (user_id = editor.uid() AND editor.can_read(workspace_id));
CREATE POLICY "video_quotas: read" ON marketing.video_quotas FOR SELECT TO authenticated
  USING (editor.can_read(workspace_id));

REVOKE ALL ON marketing.video_generations, marketing.video_saves, marketing.video_quotas FROM anon, authenticated;
GRANT SELECT ON marketing.video_generations, marketing.video_saves, marketing.video_quotas TO authenticated;
GRANT ALL ON marketing.video_generations, marketing.video_saves, marketing.video_quotas TO service_role;

-- Bucket privado dos vídeos (500 MB por arquivo); acesso só por URL assinada do servidor.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('marketing-videos', 'marketing-videos', false, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Sound effects, biblioteca no padrão do Epidemic:
--   * categoria e subcategoria do Epidemic (as duas primeiras partes do título: "Vehicles, Siren, Police Siren" → Vehicles / Siren);
--   * forma de onda reduzida (100 barras, 0–100) para desenhar a onda sem carregar o áudio;
--   * favoritos de cada pessoa.
BEGIN;

ALTER TABLE marketing.sound_effects
  ADD COLUMN epidemic_category text,
  ADD COLUMN epidemic_subcategory text,
  ADD COLUMN waveform smallint[];

UPDATE marketing.sound_effects SET
  epidemic_category = nullif(trim(split_part(title, ',', 1)), ''),
  epidemic_subcategory = nullif(trim(split_part(title, ',', 2)), '');

CREATE INDEX sound_effects_epidemic ON marketing.sound_effects (epidemic_category, epidemic_subcategory);

-- Favoritos: cada pessoa (usuário do Clerk) vê e altera só os seus.
CREATE TABLE marketing.sound_effect_favorites (
  user_id text NOT NULL,
  sound_effect_id uuid NOT NULL REFERENCES marketing.sound_effects (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, sound_effect_id)
);
ALTER TABLE marketing.sound_effect_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON marketing.sound_effect_favorites FROM public, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON marketing.sound_effect_favorites TO authenticated;
GRANT ALL ON marketing.sound_effect_favorites TO service_role;
CREATE POLICY "sound_effect_favorites: own" ON marketing.sound_effect_favorites FOR ALL TO authenticated
  USING (user_id = editor.uid() AND marketing.can_use_sound_effects())
  WITH CHECK (user_id = editor.uid() AND marketing.can_use_sound_effects());

COMMIT;

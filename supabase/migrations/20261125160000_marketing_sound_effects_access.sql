-- Sound effects: a biblioteca é a mesma para todas as empresas, então não depende da empresa ativa no token.
-- Lê (tabela e bucket) quem é membro ativo de alguma empresa ativa.
BEGIN;

CREATE FUNCTION marketing.can_use_sound_effects() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM shared.usuarios_empresas ue
    JOIN shared.empresas e ON e.id = ue.empresa_id
    JOIN shared.usuarios u ON u.id = ue.usuario_id
    WHERE u.clerk_user_id = editor.uid() AND u.status = 'active'
      AND e.status = 'active'
      AND ue.status = 'active' AND NOT coalesce(ue.suspenso_localmente, false)
  )
$$;
REVOKE ALL ON FUNCTION marketing.can_use_sound_effects() FROM public, anon;
GRANT EXECUTE ON FUNCTION marketing.can_use_sound_effects() TO authenticated, service_role;

DROP POLICY "sound_effects: read" ON marketing.sound_effects;
CREATE POLICY "sound_effects: read" ON marketing.sound_effects FOR SELECT TO authenticated
  USING (marketing.can_use_sound_effects());

DROP POLICY "sound-effects: read" ON storage.objects;
CREATE POLICY "sound-effects: read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'sound-effects' AND marketing.can_use_sound_effects());

COMMIT;

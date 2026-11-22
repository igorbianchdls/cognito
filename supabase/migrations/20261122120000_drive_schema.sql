-- Drive como produto próprio: "Spaces" passa a se chamar Drive e ganha o schema drive e o bucket drive.
--   * As tabelas de arquivos saem do schema editor (que fica só com os projetos de vídeo) e vão para drive,
--     com dados, índices, ligações e regras de acesso: editor.spaces vira drive.drives e space_id vira drive_id.
--   * As funções de acesso (editor.uid, editor.member_role, editor.can_read, editor.can_write) continuam onde estão
--     e valem também para o drive e o social.
--   * O bucket editor-media estava vazio quando esta migração foi escrita; o bucket drive o substitui, com as mesmas
--     regras (a primeira pasta do caminho é a empresa). A migração para se o antigo tiver arquivos.
-- Depois de aplicar, o schema "drive" precisa estar na lista de schemas expostos da API (Settings → API).
BEGIN;

CREATE SCHEMA drive;
GRANT USAGE ON SCHEMA drive TO authenticated, service_role;

ALTER TABLE editor.spaces SET SCHEMA drive;
ALTER TABLE editor.folders SET SCHEMA drive;
ALTER TABLE editor.files SET SCHEMA drive;
ALTER TABLE editor.favorites SET SCHEMA drive;
ALTER TABLE editor.recents SET SCHEMA drive;

ALTER TABLE drive.spaces RENAME TO drives;
ALTER TABLE drive.folders RENAME COLUMN space_id TO drive_id;
ALTER TABLE drive.files RENAME COLUMN space_id TO drive_id;

ALTER INDEX drive.spaces_pkey RENAME TO drives_pkey;
ALTER INDEX drive.spaces_workspace_id_idx RENAME TO drives_workspace_id_idx;
ALTER INDEX drive.folders_space_id_parent_id_idx RENAME TO folders_drive_id_parent_id_idx;
ALTER INDEX drive.files_space_id_folder_id_idx RENAME TO files_drive_id_folder_id_idx;
ALTER TABLE drive.drives RENAME CONSTRAINT spaces_name_check TO drives_name_check;
ALTER TABLE drive.folders RENAME CONSTRAINT folders_space_id_fkey TO folders_drive_id_fkey;
ALTER TABLE drive.files RENAME CONSTRAINT files_space_id_fkey TO files_drive_id_fkey;

ALTER POLICY "spaces: read" ON drive.drives RENAME TO "drives: read";
ALTER POLICY "spaces: insert" ON drive.drives RENAME TO "drives: insert";
ALTER POLICY "spaces: update" ON drive.drives RENAME TO "drives: update";
ALTER POLICY "spaces: delete" ON drive.drives RENAME TO "drives: delete";

-- Mesmas permissões que as tabelas tinham no schema editor.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA drive TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA drive TO service_role;

-- ---------- bucket ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('drive', 'drive', false, 5368709120); -- 5 GB por arquivo

CREATE POLICY "drive: read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'drive' AND editor.can_read((storage.foldername(name))[1]));
CREATE POLICY "drive: upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'drive' AND editor.can_write((storage.foldername(name))[1]));
CREATE POLICY "drive: update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'drive' AND editor.can_write((storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'drive' AND editor.can_write((storage.foldername(name))[1]));
CREATE POLICY "drive: delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'drive' AND editor.can_write((storage.foldername(name))[1]));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'editor-media') THEN
    RAISE EXCEPTION 'O bucket editor-media tem arquivos: copie-os para drive antes de aplicar esta migração.';
  END IF;
END $$;
DROP POLICY "editor-media: read" ON storage.objects;
DROP POLICY "editor-media: upload" ON storage.objects;
DROP POLICY "editor-media: update" ON storage.objects;
DROP POLICY "editor-media: delete" ON storage.objects;
-- O bucket editor-media, vazio, é apagado pela API do Storage (o Supabase não deixa apagar pelas tabelas).

COMMIT;

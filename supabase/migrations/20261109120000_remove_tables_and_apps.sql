-- Remove os produtos Tables e Apps do banco: os schemas com todos os dados, os papéis de runtime,
-- as prévias desses domínios no plugin e os buckets (se já estiverem vazios).
-- IRREVERSÍVEL: faça um backup antes (Dashboard → Database → Backups, ou pg_dump -n tables -n apps).
BEGIN;
SET LOCAL lock_timeout='10s';

-- Prévias/resultados dos chats que eram do Tables ou do Apps.
DELETE FROM plugin.drafts WHERE domain IN ('tables','apps');
ALTER TABLE plugin.drafts DROP CONSTRAINT drafts_domain_check;
ALTER TABLE plugin.drafts ADD CONSTRAINT drafts_domain_check CHECK(domain IN ('erp','whatsapp'));
ALTER TABLE plugin.drafts DROP CONSTRAINT drafts_domain_result;
ALTER TABLE plugin.drafts ADD CONSTRAINT drafts_domain_result CHECK(
 (domain='erp' AND ((status='saved')=(record_id IS NOT NULL))) OR
 (domain='whatsapp' AND ((status='saved')=(result IS NOT NULL)))
);

-- Tabelas, funções, políticas e dados dos dois produtos.
DROP SCHEMA IF EXISTS tables CASCADE;
DROP SCHEMA IF EXISTS apps CASCADE;

-- Papéis de runtime (sem login), depois de tirar qualquer permissão que ainda tenham.
DO $$
DECLARE r text;
BEGIN
 FOREACH r IN ARRAY ARRAY['tables_runtime','apps_runtime'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('DROP OWNED BY %I', r);
   EXECUTE format('DROP ROLE %I', r);
  END IF;
 END LOOP;
END $$;

-- Os arquivos do Storage não podem ser apagados por SQL; os buckets só saem aqui se já estiverem
-- vazios (esvazie tables-anexos e apps-files no Dashboard → Storage e rode de novo este trecho).
DELETE FROM storage.buckets b WHERE b.id IN ('tables-anexos','apps-files')
 AND NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id=b.id);

COMMIT;

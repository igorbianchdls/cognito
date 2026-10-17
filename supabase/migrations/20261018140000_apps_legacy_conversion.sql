BEGIN;
SET LOCAL lock_timeout='10s';
-- Versions saved before files moved to the database (versao_formato=1) keep a package in Storage.
-- The daily maintenance converts them: it copies the files into versao_arquivos and switches the
-- format. Only that change is allowed on a sealed version, and never through the apps_runtime role.
CREATE OR REPLACE FUNCTION apps.proteger_versao() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='UPDATE' AND OLD.estado='pronta' AND NOT (current_user<>'apps_runtime' AND OLD.versao_formato=1 AND NEW.versao_formato=2 AND (to_jsonb(NEW)-'versao_formato')=(to_jsonb(OLD)-'versao_formato'))
 THEN RAISE EXCEPTION 'Versao selada e imutavel' USING ERRCODE='23514'; END IF;
 IF NEW.estado='pronta' AND (
  (NEW.versao_formato=2 AND NOT EXISTS(SELECT 1 FROM apps.versao_arquivos f WHERE f.empresa_id=NEW.empresa_id AND f.versao_id=NEW.id))
  OR (NEW.versao_formato=1 AND NOT EXISTS(SELECT 1 FROM apps.arquivos a WHERE a.empresa_id=NEW.empresa_id AND a.app_id=NEW.app_id AND a.versao_id=NEW.id AND a.finalidade='pacote' AND a.estado_upload='confirmado' AND a.hash_conteudo=NEW.hash_conteudo))
  OR EXISTS(SELECT 1 FROM apps.arquivos a WHERE a.empresa_id=NEW.empresa_id AND a.versao_id=NEW.id AND a.estado_upload='pendente')
  OR (NEW.manifesto->>'modelo'='react' AND NEW.build_estado IS DISTINCT FROM 'ok')
 ) THEN RAISE EXCEPTION 'Arquivos nao confirmados ou build com erro' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION apps.proteger_versao_arquivo() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE alvo uuid := CASE WHEN TG_OP='DELETE' THEN OLD.versao_id ELSE NEW.versao_id END;
 empresa bigint := CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END;
BEGIN
 IF EXISTS(SELECT 1 FROM apps.versoes v WHERE v.empresa_id=empresa AND v.id=alvo AND (v.estado='pronta' OR v.versao_formato<>2)
   AND NOT (current_user<>'apps_runtime' AND TG_OP='INSERT' AND v.versao_formato=1))
 THEN RAISE EXCEPTION 'Arquivos de versao selada sao imutaveis' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA apps FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA apps TO apps_runtime;
COMMIT;

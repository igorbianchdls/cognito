-- Apps v2, fase 1: o código dos apps passa a morar no banco, um registro por arquivo e sem
-- duplicar conteúdo igual. Salvar uma edição pequena grava só o arquivo alterado, e salvar não
-- depende mais de uma chamada HTTP ao Storage dentro da transação. Versões antigas (pacote no
-- Storage, versao_formato=1) continuam sendo lidas. Também corrige as políticas de acesso.
BEGIN;
SET LOCAL lock_timeout='10s';

CREATE TABLE apps.conteudos(
 empresa_id bigint NOT NULL REFERENCES shared.empresas(id),
 hash text NOT NULL CHECK(hash~'^[a-f0-9]{64}$'),
 codificacao text NOT NULL CHECK(codificacao IN ('utf8','base64')),
 conteudo text NOT NULL CHECK(octet_length(conteudo)<=600000),
 tamanho integer NOT NULL CHECK(tamanho BETWEEN 0 AND 600000),
 criado_em timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(empresa_id,hash)
);
CREATE TABLE apps.versao_arquivos(
 empresa_id bigint NOT NULL,app_id uuid NOT NULL,versao_id uuid NOT NULL,
 caminho text NOT NULL CHECK(caminho~'^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}\.(html|css|js|jsx|png|jpg|jpeg|webp)$'),
 posicao integer NOT NULL CHECK(posicao BETWEEN 0 AND 99),
 hash text NOT NULL,
 PRIMARY KEY(empresa_id,versao_id,caminho),
 FOREIGN KEY(empresa_id,app_id,versao_id) REFERENCES apps.versoes(empresa_id,app_id,id),
 FOREIGN KEY(empresa_id,hash) REFERENCES apps.conteudos(empresa_id,hash)
);
CREATE INDEX apps_versao_arquivos_conteudo ON apps.versao_arquivos(empresa_id,hash);

-- 1 = pacote único no Storage (legado); 2 = arquivos no banco.
ALTER TABLE apps.versoes DROP CONSTRAINT versoes_versao_formato_check;
ALTER TABLE apps.versoes ADD CONSTRAINT versoes_versao_formato_check CHECK(versao_formato IN (1,2));

-- Uma versão só é selada com seus arquivos completos, em qualquer um dos dois formatos.
CREATE OR REPLACE FUNCTION apps.proteger_versao() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='UPDATE' AND OLD.estado='pronta' THEN RAISE EXCEPTION 'Versao selada e imutavel' USING ERRCODE='23514'; END IF;
 IF NEW.estado='pronta' AND (
  (NEW.versao_formato=2 AND NOT EXISTS(SELECT 1 FROM apps.versao_arquivos f WHERE f.empresa_id=NEW.empresa_id AND f.versao_id=NEW.id))
  OR (NEW.versao_formato=1 AND NOT EXISTS(SELECT 1 FROM apps.arquivos a WHERE a.empresa_id=NEW.empresa_id AND a.app_id=NEW.app_id AND a.versao_id=NEW.id AND a.finalidade='pacote' AND a.estado_upload='confirmado' AND a.hash_conteudo=NEW.hash_conteudo))
  OR EXISTS(SELECT 1 FROM apps.arquivos a WHERE a.empresa_id=NEW.empresa_id AND a.versao_id=NEW.id AND a.estado_upload='pendente')
 ) THEN RAISE EXCEPTION 'Arquivos nao confirmados' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION apps.proteger_versao_arquivo() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE alvo uuid := CASE WHEN TG_OP='DELETE' THEN OLD.versao_id ELSE NEW.versao_id END;
 empresa bigint := CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END;
BEGIN
 IF EXISTS(SELECT 1 FROM apps.versoes v WHERE v.empresa_id=empresa AND v.id=alvo AND (v.estado='pronta' OR v.versao_formato<>2)) THEN RAISE EXCEPTION 'Arquivos de versao selada sao imutaveis' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER versao_arquivo_integridade BEFORE INSERT OR UPDATE OR DELETE ON apps.versao_arquivos FOR EACH ROW EXECUTE FUNCTION apps.proteger_versao_arquivo();

ALTER TABLE apps.conteudos ENABLE ROW LEVEL SECURITY;ALTER TABLE apps.conteudos FORCE ROW LEVEL SECURITY;
ALTER TABLE apps.versao_arquivos ENABLE ROW LEVEL SECURITY;ALTER TABLE apps.versao_arquivos FORCE ROW LEVEL SECURITY;
REVOKE ALL ON apps.conteudos,apps.versao_arquivos FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON apps.conteudos TO apps_runtime;
GRANT SELECT,INSERT,DELETE ON apps.versao_arquivos TO apps_runtime;

-- Políticas: o papel é lido uma vez por consulta (SELECT ...), não uma vez por linha.
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['apps','versoes','arquivos','execucoes','colecoes','registros','eventos'] LOOP
 EXECUTE format('DROP POLICY leitura ON apps.%I',t);EXECUTE format('DROP POLICY criacao ON apps.%I',t);
 EXECUTE format('DROP POLICY edicao ON apps.%I',t);
END LOOP;
FOREACH t IN ARRAY ARRAY['apps','versoes','arquivos','execucoes','colecoes','registros','eventos','conteudos','versao_arquivos'] LOOP
 EXECUTE format('CREATE POLICY leitura ON apps.%I FOR SELECT TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL)',t);
 EXECUTE format('CREATE POLICY criacao ON apps.%I FOR INSERT TO apps_runtime WITH CHECK(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IN (''owner'',''admin'',''member''))',t);
 IF t NOT IN ('eventos','conteudos','versao_arquivos') THEN EXECUTE format('CREATE POLICY edicao ON apps.%I FOR UPDATE TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IN (''owner'',''admin'',''member'')) WITH CHECK(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IN (''owner'',''admin'',''member''))',t); END IF;
END LOOP; END $$;
CREATE POLICY substituicao ON apps.versao_arquivos FOR DELETE TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IN ('owner','admin','member'));
DROP POLICY pessoal ON apps.favoritos;
CREATE POLICY pessoal ON apps.favoritos TO apps_runtime USING(empresa_id=apps.empresa_atual() AND usuario_id=apps.usuario_atual() AND (SELECT apps.papel_atual()) IS NOT NULL) WITH CHECK(empresa_id=apps.empresa_atual() AND usuario_id=apps.usuario_atual() AND (SELECT apps.papel_atual()) IS NOT NULL);
-- Publicar, restaurar e tirar do ar exigem administrador também no banco.
DROP POLICY leitura ON apps.publicacoes;DROP POLICY publicacao_admin ON apps.publicacoes;DROP POLICY encerrar_publicacao ON apps.publicacoes;
CREATE POLICY leitura ON apps.publicacoes FOR SELECT TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL);
CREATE POLICY publicacao_admin ON apps.publicacoes FOR INSERT TO apps_runtime WITH CHECK(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IN ('owner','admin'));
CREATE POLICY encerrar_publicacao ON apps.publicacoes FOR UPDATE TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IN ('owner','admin')) WITH CHECK(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IN ('owner','admin'));

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA apps FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA apps TO apps_runtime;
COMMIT;

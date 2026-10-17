-- Apps v2, fase 2: projetos React com vários arquivos. As versões guardam o resultado do build
-- (JS e CSS) como conteúdos, sem duplicar; uma versão React só é selada com build sem erros.
BEGIN;
SET LOCAL lock_timeout='10s';

-- Pastas (src/components/Header.jsx) e os tipos de arquivo de um projeto React.
ALTER TABLE apps.versao_arquivos DROP CONSTRAINT versao_arquivos_caminho_check;
ALTER TABLE apps.versao_arquivos ADD CONSTRAINT versao_arquivos_caminho_check CHECK(length(caminho)<=200 AND caminho~'^([a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}/){0,5}[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}\.(html|css|js|jsx|ts|tsx|json|svg|png|jpg|jpeg|webp)$' AND caminho!~'(^|/)\.\.?(/|$)');
ALTER TABLE apps.versao_arquivos DROP CONSTRAINT versao_arquivos_posicao_check;
ALTER TABLE apps.versao_arquivos ADD CONSTRAINT versao_arquivos_posicao_check CHECK(posicao BETWEEN 0 AND 199);
-- O JS compilado de um app pode ser maior que um arquivo de código-fonte.
ALTER TABLE apps.conteudos DROP CONSTRAINT conteudos_conteudo_check;
ALTER TABLE apps.conteudos ADD CONSTRAINT conteudos_conteudo_check CHECK(octet_length(conteudo)<=1500000);
ALTER TABLE apps.conteudos DROP CONSTRAINT conteudos_tamanho_check;
ALTER TABLE apps.conteudos ADD CONSTRAINT conteudos_tamanho_check CHECK(tamanho BETWEEN 0 AND 1500000);

ALTER TABLE apps.versoes
 ADD COLUMN build_estado text CHECK(build_estado IN ('ok','erro')),
 ADD COLUMN build_erro text CHECK(length(build_erro)<=4000),
 ADD COLUMN build_js text,
 ADD COLUMN build_css text,
 ADD CONSTRAINT versoes_build_js_fkey FOREIGN KEY(empresa_id,build_js) REFERENCES apps.conteudos(empresa_id,hash),
 ADD CONSTRAINT versoes_build_css_fkey FOREIGN KEY(empresa_id,build_css) REFERENCES apps.conteudos(empresa_id,hash),
 ADD CONSTRAINT versoes_build_consistente CHECK((build_estado='ok')=(build_js IS NOT NULL) AND (build_estado='erro')=(build_erro IS NOT NULL));

CREATE OR REPLACE FUNCTION apps.proteger_versao() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='UPDATE' AND OLD.estado='pronta' THEN RAISE EXCEPTION 'Versao selada e imutavel' USING ERRCODE='23514'; END IF;
 IF NEW.estado='pronta' AND (
  (NEW.versao_formato=2 AND NOT EXISTS(SELECT 1 FROM apps.versao_arquivos f WHERE f.empresa_id=NEW.empresa_id AND f.versao_id=NEW.id))
  OR (NEW.versao_formato=1 AND NOT EXISTS(SELECT 1 FROM apps.arquivos a WHERE a.empresa_id=NEW.empresa_id AND a.app_id=NEW.app_id AND a.versao_id=NEW.id AND a.finalidade='pacote' AND a.estado_upload='confirmado' AND a.hash_conteudo=NEW.hash_conteudo))
  OR EXISTS(SELECT 1 FROM apps.arquivos a WHERE a.empresa_id=NEW.empresa_id AND a.versao_id=NEW.id AND a.estado_upload='pendente')
  OR (NEW.manifesto->>'modelo'='react' AND NEW.build_estado IS DISTINCT FROM 'ok')
 ) THEN RAISE EXCEPTION 'Arquivos nao confirmados ou build com erro' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA apps FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA apps TO apps_runtime;
COMMIT;

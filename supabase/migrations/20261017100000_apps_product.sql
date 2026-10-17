BEGIN;
SET LOCAL lock_timeout='10s';
CREATE SCHEMA apps;
REVOKE ALL ON SCHEMA apps FROM PUBLIC,anon,authenticated;
CREATE ROLE apps_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT apps_runtime TO postgres;
GRANT USAGE ON SCHEMA apps TO apps_runtime;
CREATE FUNCTION apps.empresa_atual() RETURNS bigint LANGUAGE sql STABLE SET search_path=pg_catalog AS $$ SELECT nullif(current_setting('app.apps_empresa_id',true),'')::bigint $$;
CREATE FUNCTION apps.usuario_atual() RETURNS bigint LANGUAGE sql STABLE SET search_path=pg_catalog AS $$ SELECT nullif(current_setting('app.apps_usuario_id',true),'')::bigint $$;
CREATE FUNCTION apps.papel_atual() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT m.role FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=m.empresa_id
 WHERE m.usuario_id=apps.usuario_atual() AND m.empresa_id=apps.empresa_atual() AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active' LIMIT 1
$$;
CREATE TABLE apps.apps(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL REFERENCES shared.empresas(id),nome text NOT NULL CHECK(length(nome) BETWEEN 1 AND 100),slug text NOT NULL,
 descricao text NOT NULL DEFAULT '' CHECK(length(descricao)<=2000),icone text NOT NULL DEFAULT 'app',cor text NOT NULL DEFAULT '#7259d6' CHECK(cor~'^#[0-9a-fA-F]{6}$'),
 criado_por bigint NOT NULL REFERENCES shared.usuarios(id),atualizado_por bigint NOT NULL REFERENCES shared.usuarios(id),versao_concorrencia integer NOT NULL DEFAULT 1 CHECK(versao_concorrencia>0),
 criado_em timestamptz NOT NULL DEFAULT now(),atualizado_em timestamptz NOT NULL DEFAULT now(),arquivado_em timestamptz,excluido_em timestamptz,
 UNIQUE(empresa_id,id),UNIQUE(empresa_id,slug)
);
CREATE TABLE apps.versoes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,app_id uuid NOT NULL,numero integer NOT NULL CHECK(numero>0),estado text NOT NULL DEFAULT 'rascunho' CHECK(estado IN ('rascunho','pronta')),
 manifesto jsonb NOT NULL CHECK(jsonb_typeof(manifesto)='object'),versao_formato integer NOT NULL DEFAULT 1 CHECK(versao_formato=1),versao_origem_id uuid,
 hash_conteudo text,criado_por bigint NOT NULL REFERENCES shared.usuarios(id),criado_em timestamptz NOT NULL DEFAULT now(),selado_em timestamptz,
 FOREIGN KEY(empresa_id,app_id) REFERENCES apps.apps(empresa_id,id),UNIQUE(empresa_id,app_id,id),UNIQUE(empresa_id,app_id,numero),
 FOREIGN KEY(empresa_id,app_id,versao_origem_id) REFERENCES apps.versoes(empresa_id,app_id,id),
 CHECK((estado='pronta')=(selado_em IS NOT NULL AND hash_conteudo IS NOT NULL))
);
CREATE UNIQUE INDEX apps_um_rascunho ON apps.versoes(empresa_id,app_id) WHERE estado='rascunho';
CREATE TABLE apps.arquivos(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,app_id uuid NOT NULL,versao_id uuid NOT NULL,
 caminho_logico text NOT NULL,caminho_storage text NOT NULL UNIQUE,finalidade text NOT NULL CHECK(finalidade IN ('fonte','pacote','miniatura')),mime_type text NOT NULL,tamanho integer NOT NULL CHECK(tamanho BETWEEN 0 AND 2000000),hash_conteudo text NOT NULL,
 estado_upload text NOT NULL DEFAULT 'pendente' CHECK(estado_upload IN ('pendente','confirmado','descartado')),criado_por bigint NOT NULL REFERENCES shared.usuarios(id),criado_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,app_id,versao_id) REFERENCES apps.versoes(empresa_id,app_id,id),UNIQUE(empresa_id,app_id,versao_id,caminho_logico)
);
CREATE TABLE apps.execucoes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,app_id uuid NOT NULL,versao_id uuid NOT NULL,tipo text NOT NULL CHECK(tipo IN ('publicar','restaurar')),
 estado text NOT NULL CHECK(estado IN ('concluida','falhou')),chave_operacao uuid NOT NULL,solicitado_por bigint NOT NULL REFERENCES shared.usuarios(id),tentativas integer NOT NULL DEFAULT 1,
 erro_seguro text,criado_em timestamptz NOT NULL DEFAULT now(),iniciado_em timestamptz NOT NULL DEFAULT now(),finalizado_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,app_id,versao_id) REFERENCES apps.versoes(empresa_id,app_id,id),UNIQUE(empresa_id,app_id,chave_operacao)
);
CREATE TABLE apps.publicacoes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,app_id uuid NOT NULL,versao_id uuid NOT NULL,
 estado text NOT NULL DEFAULT 'ativa' CHECK(estado IN ('ativa','encerrada')),publicado_por bigint NOT NULL REFERENCES shared.usuarios(id),publicado_em timestamptz NOT NULL DEFAULT now(),encerrado_em timestamptz,
 FOREIGN KEY(empresa_id,app_id,versao_id) REFERENCES apps.versoes(empresa_id,app_id,id),UNIQUE(empresa_id,app_id,id),CHECK((estado='encerrada')=(encerrado_em IS NOT NULL))
);
CREATE UNIQUE INDEX apps_publicacao_ativa ON apps.publicacoes(empresa_id,app_id) WHERE estado='ativa';
CREATE TABLE apps.colecoes(
 id uuid PRIMARY KEY,empresa_id bigint NOT NULL,app_id uuid NOT NULL,chave text NOT NULL,nome text NOT NULL,criado_em timestamptz NOT NULL DEFAULT now(),excluido_em timestamptz,
 FOREIGN KEY(empresa_id,app_id) REFERENCES apps.apps(empresa_id,id),UNIQUE(empresa_id,app_id,id),UNIQUE(empresa_id,app_id,chave)
);
CREATE TABLE apps.registros(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,app_id uuid NOT NULL,colecao_id uuid NOT NULL,dados jsonb NOT NULL CHECK(jsonb_typeof(dados)='object' AND octet_length(dados::text)<=64000),
 versao_concorrencia integer NOT NULL DEFAULT 1,criado_por bigint NOT NULL REFERENCES shared.usuarios(id),atualizado_por bigint NOT NULL REFERENCES shared.usuarios(id),
 criado_em timestamptz NOT NULL DEFAULT now(),atualizado_em timestamptz NOT NULL DEFAULT now(),excluido_em timestamptz,
 FOREIGN KEY(empresa_id,app_id,colecao_id) REFERENCES apps.colecoes(empresa_id,app_id,id)
);
CREATE TABLE apps.favoritos(
 empresa_id bigint NOT NULL,app_id uuid NOT NULL,usuario_id bigint NOT NULL REFERENCES shared.usuarios(id),criado_em timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(empresa_id,app_id,usuario_id),FOREIGN KEY(empresa_id,app_id) REFERENCES apps.apps(empresa_id,id)
);
CREATE TABLE apps.eventos(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,app_id uuid NOT NULL,usuario_id bigint NOT NULL REFERENCES shared.usuarios(id),acao text NOT NULL,entidade text NOT NULL DEFAULT 'app',entidade_id uuid,operacao_id uuid,
 detalhes jsonb NOT NULL DEFAULT '{}' CHECK(octet_length(detalhes::text)<=4000),criado_em timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(empresa_id,app_id) REFERENCES apps.apps(empresa_id,id)
);
CREATE INDEX apps_catalogo ON apps.apps(empresa_id,atualizado_em DESC,id);
CREATE INDEX apps_registros_colecao ON apps.registros(empresa_id,app_id,colecao_id,criado_em,id) WHERE excluido_em IS NULL;
CREATE INDEX apps_arquivos_pendentes ON apps.arquivos(estado_upload,criado_em);
CREATE INDEX apps_eventos_app ON apps.eventos(empresa_id,app_id,criado_em DESC);
CREATE INDEX apps_favoritos_usuario ON apps.favoritos(empresa_id,usuario_id);

CREATE FUNCTION apps.proteger_versao() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='UPDATE' AND OLD.estado='pronta' THEN RAISE EXCEPTION 'Versao selada e imutavel' USING ERRCODE='23514'; END IF;
 IF NEW.estado='pronta' AND (NOT EXISTS(SELECT 1 FROM apps.arquivos a WHERE a.empresa_id=NEW.empresa_id AND a.app_id=NEW.app_id AND a.versao_id=NEW.id AND a.finalidade='pacote' AND a.estado_upload='confirmado' AND a.hash_conteudo=NEW.hash_conteudo) OR EXISTS(SELECT 1 FROM apps.arquivos a WHERE a.empresa_id=NEW.empresa_id AND a.versao_id=NEW.id AND a.estado_upload='pendente')) THEN RAISE EXCEPTION 'Arquivos nao confirmados' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER versao_integridade BEFORE INSERT OR UPDATE ON apps.versoes FOR EACH ROW EXECUTE FUNCTION apps.proteger_versao();
CREATE FUNCTION apps.proteger_arquivo() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM apps.versoes v WHERE v.empresa_id=NEW.empresa_id AND v.app_id=NEW.app_id AND v.id=NEW.versao_id AND v.estado='pronta') THEN RAISE EXCEPTION 'Arquivo selado e imutavel' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER arquivo_integridade BEFORE INSERT OR UPDATE ON apps.arquivos FOR EACH ROW EXECUTE FUNCTION apps.proteger_arquivo();
CREATE FUNCTION apps.proteger_publicacao() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.estado='ativa' AND NOT EXISTS(SELECT 1 FROM apps.versoes v JOIN apps.apps a ON (a.empresa_id,a.id)=(v.empresa_id,v.app_id) WHERE (v.empresa_id,v.app_id,v.id)=(NEW.empresa_id,NEW.app_id,NEW.versao_id) AND v.estado='pronta' AND a.arquivado_em IS NULL AND a.excluido_em IS NULL) THEN RAISE EXCEPTION 'Publicacao indisponivel' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER publicacao_integridade BEFORE INSERT OR UPDATE ON apps.publicacoes FOR EACH ROW EXECUTE FUNCTION apps.proteger_publicacao();
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['apps','versoes','arquivos','execucoes','publicacoes','colecoes','registros','favoritos','eventos'] LOOP
 EXECUTE format('ALTER TABLE apps.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE apps.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON apps.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT,INSERT,UPDATE ON apps.%I TO apps_runtime',t);
 EXECUTE format('CREATE POLICY leitura ON apps.%I FOR SELECT TO apps_runtime USING(empresa_id=apps.empresa_atual() AND apps.papel_atual() IS NOT NULL)',t);
 EXECUTE format('CREATE POLICY criacao ON apps.%I FOR INSERT TO apps_runtime WITH CHECK(empresa_id=apps.empresa_atual() AND apps.papel_atual() IN (''owner'',''admin'',''member''))',t);
 EXECUTE format('CREATE POLICY edicao ON apps.%I FOR UPDATE TO apps_runtime USING(empresa_id=apps.empresa_atual() AND apps.papel_atual() IN (''owner'',''admin'',''member'')) WITH CHECK(empresa_id=apps.empresa_atual() AND apps.papel_atual() IN (''owner'',''admin'',''member''))',t);
END LOOP; END $$;
-- Favorites are personal, including for read-only organization members.
DROP POLICY leitura ON apps.favoritos;DROP POLICY criacao ON apps.favoritos;DROP POLICY edicao ON apps.favoritos;
CREATE POLICY pessoal ON apps.favoritos TO apps_runtime USING(empresa_id=apps.empresa_atual() AND usuario_id=apps.usuario_atual() AND apps.papel_atual() IS NOT NULL) WITH CHECK(empresa_id=apps.empresa_atual() AND usuario_id=apps.usuario_atual() AND apps.papel_atual() IS NOT NULL);
GRANT DELETE ON apps.favoritos TO apps_runtime;
REVOKE UPDATE ON apps.eventos FROM apps_runtime;
-- Publishing and restoring require an administrator; authoring remains available to members.
DROP POLICY criacao ON apps.publicacoes;DROP POLICY edicao ON apps.publicacoes;
CREATE POLICY publicacao_admin ON apps.publicacoes FOR INSERT TO apps_runtime WITH CHECK(empresa_id=apps.empresa_atual() AND apps.papel_atual() IN ('owner','admin'));
CREATE POLICY encerrar_publicacao ON apps.publicacoes FOR UPDATE TO apps_runtime USING(empresa_id=apps.empresa_atual() AND apps.papel_atual() IN ('owner','admin','member')) WITH CHECK(empresa_id=apps.empresa_atual() AND (apps.papel_atual() IN ('owner','admin') OR estado='encerrada'));
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA apps FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA apps TO apps_runtime;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('apps-files','apps-files',false,2000000,ARRAY['application/json']);
COMMIT;

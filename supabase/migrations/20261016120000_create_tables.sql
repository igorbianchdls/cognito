BEGIN;
SET LOCAL lock_timeout = '10s';

CREATE SCHEMA tables;
REVOKE ALL ON SCHEMA tables FROM PUBLIC, anon, authenticated;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='tables_runtime') THEN
    CREATE ROLE tables_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;
GRANT tables_runtime TO postgres;
GRANT USAGE ON SCHEMA tables TO tables_runtime;

CREATE FUNCTION tables.empresa_atual() RETURNS bigint LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT nullif(current_setting('app.tables_empresa_id',true),'')::bigint
$$;
CREATE FUNCTION tables.usuario_atual() RETURNS bigint LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
 SELECT nullif(current_setting('app.tables_usuario_id',true),'')::bigint
$$;
CREATE FUNCTION tables.membro_ativo(escrita boolean DEFAULT false) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS (
   SELECT 1 FROM shared.usuarios_empresas m
   JOIN shared.usuarios u ON u.id=m.usuario_id
   JOIN shared.empresas e ON e.id=m.empresa_id
   WHERE m.empresa_id=tables.empresa_atual() AND m.usuario_id=tables.usuario_atual()
   AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'
   AND (NOT escrita OR m.role IN ('owner','admin','member'))
 )
$$;
CREATE FUNCTION tables.membros() RETURNS TABLE(id text,nome text,email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT u.id::text, coalesce(nullif(u.full_name,''),u.email),u.email
 FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id
 WHERE m.empresa_id=tables.empresa_atual() AND m.status='active' AND NOT m.suspenso_localmente
 AND u.status='active' AND tables.membro_ativo() ORDER BY 2,u.id
$$;

CREATE TABLE tables.bases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 empresa_id bigint NOT NULL REFERENCES shared.empresas(id),
 nome text NOT NULL CHECK(btrim(nome)<>'' AND length(nome)<=120),
 descricao text NOT NULL DEFAULT '', cor text NOT NULL DEFAULT '#8b5cf6' CHECK(cor ~ '^#[a-fA-F0-9]{6}$'), icone text NOT NULL DEFAULT 'database',
 posicao numeric NOT NULL DEFAULT 0, versao integer NOT NULL DEFAULT 1 CHECK(versao>0),
 criado_por bigint NOT NULL REFERENCES shared.usuarios(id), atualizado_por bigint NOT NULL REFERENCES shared.usuarios(id),
 criado_em timestamptz NOT NULL DEFAULT now(), atualizado_em timestamptz NOT NULL DEFAULT now(), excluido_em timestamptz,
 UNIQUE(empresa_id,id)
);
CREATE TABLE tables.base_membros (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id bigint NOT NULL, base_id uuid NOT NULL,
 usuario_id bigint NOT NULL REFERENCES shared.usuarios(id), papel text NOT NULL CHECK(papel IN ('administrador','editor','leitor')),
 criado_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,base_id) REFERENCES tables.bases(empresa_id,id), UNIQUE(empresa_id,base_id,usuario_id)
);
CREATE TABLE tables.tabelas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id bigint NOT NULL, base_id uuid NOT NULL,
 nome text NOT NULL CHECK(btrim(nome)<>'' AND length(nome)<=120), campo_principal_id uuid,
 posicao numeric NOT NULL DEFAULT 0, versao_estrutura integer NOT NULL DEFAULT 1 CHECK(versao_estrutura>0),
 criado_por bigint NOT NULL REFERENCES shared.usuarios(id), atualizado_por bigint NOT NULL REFERENCES shared.usuarios(id),
 criado_em timestamptz NOT NULL DEFAULT now(), atualizado_em timestamptz NOT NULL DEFAULT now(), excluido_em timestamptz,
 FOREIGN KEY(empresa_id,base_id) REFERENCES tables.bases(empresa_id,id),
 UNIQUE(empresa_id,id), UNIQUE(empresa_id,base_id,id)
);
CREATE TABLE tables.campos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id bigint NOT NULL, base_id uuid NOT NULL, tabela_id uuid NOT NULL,
 nome text NOT NULL CHECK(btrim(nome)<>'' AND length(nome)<=120),
 tipo text NOT NULL CHECK(tipo IN ('texto','texto_longo','numero','moeda','data','data_hora','checkbox','selecao','selecao_multipla','usuario','usuarios','email','url','vinculo','anexo')),
 obrigatorio boolean NOT NULL DEFAULT false, configuracao jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(configuracao)='object'),
 tabela_destino_id uuid, posicao numeric NOT NULL DEFAULT 0, excluido_em timestamptz,
 FOREIGN KEY(empresa_id,base_id,tabela_id) REFERENCES tables.tabelas(empresa_id,base_id,id),
 FOREIGN KEY(empresa_id,base_id,tabela_destino_id) REFERENCES tables.tabelas(empresa_id,base_id,id),
 CHECK((tipo='vinculo')=(tabela_destino_id IS NOT NULL)),
 UNIQUE(empresa_id,tabela_id,id), UNIQUE(empresa_id,id)
);
ALTER TABLE tables.tabelas ADD CONSTRAINT tabelas_campo_principal_fk
 FOREIGN KEY(empresa_id,id,campo_principal_id) REFERENCES tables.campos(empresa_id,tabela_id,id) DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE tables.campo_opcoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id bigint NOT NULL, tabela_id uuid NOT NULL, campo_id uuid NOT NULL,
 nome text NOT NULL CHECK(btrim(nome)<>'' AND length(nome)<=120), cor text NOT NULL DEFAULT '#94a3b8' CHECK(cor ~ '^#[a-fA-F0-9]{6}$'),
 posicao numeric NOT NULL DEFAULT 0, arquivado_em timestamptz,
 FOREIGN KEY(empresa_id,tabela_id,campo_id) REFERENCES tables.campos(empresa_id,tabela_id,id),
 UNIQUE(empresa_id,tabela_id,campo_id,id)
);
CREATE TABLE tables.registros (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id bigint NOT NULL, base_id uuid NOT NULL, tabela_id uuid NOT NULL,
 valores jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(valores)='object'), posicao numeric NOT NULL DEFAULT 0,
 versao integer NOT NULL DEFAULT 1 CHECK(versao>0),
 criado_por bigint NOT NULL REFERENCES shared.usuarios(id), atualizado_por bigint NOT NULL REFERENCES shared.usuarios(id),
 criado_em timestamptz NOT NULL DEFAULT now(), atualizado_em timestamptz NOT NULL DEFAULT now(), excluido_em timestamptz,
 FOREIGN KEY(empresa_id,base_id,tabela_id) REFERENCES tables.tabelas(empresa_id,base_id,id),
 UNIQUE(empresa_id,id), UNIQUE(empresa_id,tabela_id,id), UNIQUE(empresa_id,base_id,tabela_id,id)
);
CREATE TABLE tables.registro_opcoes (
 empresa_id bigint NOT NULL, tabela_id uuid NOT NULL, registro_id uuid NOT NULL, campo_id uuid NOT NULL, opcao_id uuid NOT NULL,
 PRIMARY KEY(empresa_id,registro_id,campo_id,opcao_id),
 FOREIGN KEY(empresa_id,tabela_id,registro_id) REFERENCES tables.registros(empresa_id,tabela_id,id),
 FOREIGN KEY(empresa_id,tabela_id,campo_id,opcao_id) REFERENCES tables.campo_opcoes(empresa_id,tabela_id,campo_id,id)
);
CREATE TABLE tables.registro_usuarios (
 empresa_id bigint NOT NULL, tabela_id uuid NOT NULL, registro_id uuid NOT NULL, campo_id uuid NOT NULL, usuario_id bigint NOT NULL REFERENCES shared.usuarios(id),
 PRIMARY KEY(empresa_id,registro_id,campo_id,usuario_id),
 FOREIGN KEY(empresa_id,tabela_id,registro_id) REFERENCES tables.registros(empresa_id,tabela_id,id),
 FOREIGN KEY(empresa_id,tabela_id,campo_id) REFERENCES tables.campos(empresa_id,tabela_id,id)
);
CREATE TABLE tables.registro_vinculos (
 empresa_id bigint NOT NULL, base_id uuid NOT NULL, tabela_id uuid NOT NULL, registro_id uuid NOT NULL,
 campo_id uuid NOT NULL, tabela_destino_id uuid NOT NULL, registro_destino_id uuid NOT NULL, posicao numeric NOT NULL DEFAULT 0,
 PRIMARY KEY(empresa_id,registro_id,campo_id,registro_destino_id),
 FOREIGN KEY(empresa_id,base_id,tabela_id,registro_id) REFERENCES tables.registros(empresa_id,base_id,tabela_id,id),
 FOREIGN KEY(empresa_id,tabela_id,campo_id) REFERENCES tables.campos(empresa_id,tabela_id,id),
 FOREIGN KEY(empresa_id,base_id,tabela_destino_id,registro_destino_id) REFERENCES tables.registros(empresa_id,base_id,tabela_id,id)
);
CREATE TABLE tables.visualizacoes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id bigint NOT NULL, base_id uuid NOT NULL, tabela_id uuid NOT NULL,
 nome text NOT NULL CHECK(btrim(nome)<>'' AND length(nome)<=120), tipo text NOT NULL CHECK(tipo IN ('grade','kanban','calendario')),
 configuracao jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(configuracao)='object'), posicao numeric NOT NULL DEFAULT 0,
 versao integer NOT NULL DEFAULT 1 CHECK(versao>0), criado_por bigint NOT NULL REFERENCES shared.usuarios(id),
 FOREIGN KEY(empresa_id,base_id,tabela_id) REFERENCES tables.tabelas(empresa_id,base_id,id),
 UNIQUE(empresa_id,tabela_id,id), UNIQUE(empresa_id,id)
);
CREATE TABLE tables.visualizacao_campos (
 empresa_id bigint NOT NULL, tabela_id uuid NOT NULL, visualizacao_id uuid NOT NULL, campo_id uuid NOT NULL,
 visivel boolean NOT NULL DEFAULT true, largura integer NOT NULL DEFAULT 180 CHECK(largura BETWEEN 80 AND 800), posicao integer NOT NULL DEFAULT 0,
 PRIMARY KEY(empresa_id,visualizacao_id,campo_id),
 FOREIGN KEY(empresa_id,tabela_id,visualizacao_id) REFERENCES tables.visualizacoes(empresa_id,tabela_id,id) ON DELETE CASCADE,
 FOREIGN KEY(empresa_id,tabela_id,campo_id) REFERENCES tables.campos(empresa_id,tabela_id,id)
);
CREATE TABLE tables.anexos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id bigint NOT NULL, tabela_id uuid NOT NULL, registro_id uuid NOT NULL, campo_id uuid NOT NULL,
 bucket text NOT NULL DEFAULT 'tables-anexos' CHECK(bucket='tables-anexos'), caminho text NOT NULL UNIQUE,
 nome text NOT NULL, mime_type text NOT NULL, tamanho bigint NOT NULL CHECK(tamanho>0),
 estado text NOT NULL DEFAULT 'pendente' CHECK(estado IN ('pendente','confirmado','excluido')),
 criado_por bigint NOT NULL REFERENCES shared.usuarios(id), criado_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,tabela_id,registro_id) REFERENCES tables.registros(empresa_id,tabela_id,id),
 FOREIGN KEY(empresa_id,tabela_id,campo_id) REFERENCES tables.campos(empresa_id,tabela_id,id)
);
CREATE TABLE tables.comentarios (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id bigint NOT NULL, registro_id uuid NOT NULL,
 autor_id bigint NOT NULL REFERENCES shared.usuarios(id), texto text NOT NULL CHECK(length(btrim(texto)) BETWEEN 1 AND 10000),
 criado_em timestamptz NOT NULL DEFAULT now(), excluido_em timestamptz,
 FOREIGN KEY(empresa_id,registro_id) REFERENCES tables.registros(empresa_id,id)
);
CREATE TABLE tables.historico (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id bigint NOT NULL REFERENCES shared.empresas(id),
 base_id uuid, tabela_id uuid, registro_id uuid, entidade text NOT NULL, entidade_id text NOT NULL, acao text NOT NULL,
 autor_id bigint NOT NULL REFERENCES shared.usuarios(id), operacao_id uuid NOT NULL,
 antes jsonb, depois jsonb, criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION tables.validar_registro() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE item record; campo record; texto text;
BEGIN
 FOR item IN SELECT * FROM jsonb_each(NEW.valores) LOOP
   SELECT * INTO campo FROM tables.campos WHERE empresa_id=NEW.empresa_id AND tabela_id=NEW.tabela_id AND id::text=item.key;
   IF NOT FOUND THEN RAISE EXCEPTION 'Campo desconhecido' USING ERRCODE='23514'; END IF;
   -- Deleted columns retain their previous values for restoration; writes to them are rejected by the service.
   IF campo.excluido_em IS NOT NULL THEN CONTINUE; END IF;
   IF campo.tipo IN ('selecao','selecao_multipla','usuario','usuarios','vinculo','anexo') THEN
     RAISE EXCEPTION 'Campo relacional fora da estrutura propria' USING ERRCODE='23514';
   END IF;
   IF item.value='null'::jsonb THEN CONTINUE; END IF;
   texto := item.value #>> '{}';
   IF campo.tipo IN ('texto','texto_longo','email','url','data','data_hora') AND jsonb_typeof(item.value)<>'string' THEN
     RAISE EXCEPTION 'Tipo de texto invalido' USING ERRCODE='23514';
   ELSIF campo.tipo='numero' AND jsonb_typeof(item.value)<>'number' THEN
     RAISE EXCEPTION 'Numero invalido' USING ERRCODE='23514';
   ELSIF campo.tipo='moeda' THEN
     IF jsonb_typeof(item.value) NOT IN ('number','string') OR texto !~ '^-?[0-9]+(\.[0-9]{1,6})?$' THEN
       RAISE EXCEPTION 'Moeda invalida' USING ERRCODE='23514';
     END IF;
     PERFORM texto::numeric;
   ELSIF campo.tipo='checkbox' AND jsonb_typeof(item.value)<>'boolean' THEN
     RAISE EXCEPTION 'Checkbox invalido' USING ERRCODE='23514';
   END IF;
   IF campo.tipo='data' THEN
     IF texto !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'Data invalida' USING ERRCODE='23514'; END IF;
     PERFORM texto::date;
   ELSIF campo.tipo='data_hora' THEN
     IF texto !~ '^\d{4}-\d{2}-\d{2}T' THEN RAISE EXCEPTION 'Data e hora invalidas' USING ERRCODE='23514'; END IF;
     PERFORM texto::timestamptz;
   END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER validar_registro BEFORE INSERT OR UPDATE OF valores ON tables.registros FOR EACH ROW EXECUTE FUNCTION tables.validar_registro();

CREATE FUNCTION tables.validar_relacao() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE campo record;
BEGIN
 PERFORM 1 FROM tables.registros WHERE empresa_id=NEW.empresa_id AND id=NEW.registro_id FOR UPDATE;
 SELECT * INTO STRICT campo FROM tables.campos WHERE empresa_id=NEW.empresa_id AND tabela_id=NEW.tabela_id AND id=NEW.campo_id AND excluido_em IS NULL;
 IF TG_TABLE_NAME='registro_opcoes' THEN
   IF campo.tipo NOT IN ('selecao','selecao_multipla') THEN RAISE EXCEPTION 'Campo nao e selecao' USING ERRCODE='23514'; END IF;
   IF campo.tipo='selecao' AND EXISTS(SELECT 1 FROM tables.registro_opcoes WHERE empresa_id=NEW.empresa_id AND registro_id=NEW.registro_id AND campo_id=NEW.campo_id AND opcao_id<>NEW.opcao_id) THEN RAISE EXCEPTION 'Selecao unica' USING ERRCODE='23514'; END IF;
   IF NOT EXISTS(SELECT 1 FROM tables.campo_opcoes WHERE empresa_id=NEW.empresa_id AND campo_id=NEW.campo_id AND id=NEW.opcao_id AND arquivado_em IS NULL) THEN RAISE EXCEPTION 'Opcao indisponivel' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='registro_usuarios' THEN
   IF campo.tipo NOT IN ('usuario','usuarios') THEN RAISE EXCEPTION 'Campo nao e usuario' USING ERRCODE='23514'; END IF;
   IF campo.tipo='usuario' AND EXISTS(SELECT 1 FROM tables.registro_usuarios WHERE empresa_id=NEW.empresa_id AND registro_id=NEW.registro_id AND campo_id=NEW.campo_id AND usuario_id<>NEW.usuario_id) THEN RAISE EXCEPTION 'Usuario unico' USING ERRCODE='23514'; END IF;
   IF NOT EXISTS(SELECT 1 FROM tables.membros() WHERE id=NEW.usuario_id::text) THEN RAISE EXCEPTION 'Usuario indisponivel' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='registro_vinculos' THEN
   IF campo.tipo<>'vinculo' OR campo.tabela_destino_id<>NEW.tabela_destino_id THEN RAISE EXCEPTION 'Destino incompativel' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='anexos' THEN
   IF campo.tipo<>'anexo' THEN RAISE EXCEPTION 'Campo nao e anexo' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validar_opcao BEFORE INSERT OR UPDATE ON tables.registro_opcoes FOR EACH ROW EXECUTE FUNCTION tables.validar_relacao();
CREATE TRIGGER validar_usuario BEFORE INSERT OR UPDATE ON tables.registro_usuarios FOR EACH ROW EXECUTE FUNCTION tables.validar_relacao();
CREATE TRIGGER validar_vinculo BEFORE INSERT OR UPDATE ON tables.registro_vinculos FOR EACH ROW EXECUTE FUNCTION tables.validar_relacao();
CREATE TRIGGER validar_anexo BEFORE INSERT OR UPDATE ON tables.anexos FOR EACH ROW EXECUTE FUNCTION tables.validar_relacao();

CREATE FUNCTION tables.atualizar_registro_pai() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE dados jsonb;
BEGIN
 dados:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 UPDATE tables.registros SET versao=versao+1,atualizado_em=clock_timestamp(),atualizado_por=tables.usuario_atual()
 WHERE empresa_id=(dados->>'empresa_id')::bigint AND id=(dados->>'registro_id')::uuid;
 RETURN NULL;
END $$;
DO $$ DECLARE nome text; BEGIN
 FOREACH nome IN ARRAY ARRAY['registro_opcoes','registro_usuarios','registro_vinculos','anexos'] LOOP
   EXECUTE format('CREATE TRIGGER atualizar_registro_pai AFTER INSERT OR UPDATE OR DELETE ON tables.%I FOR EACH ROW EXECUTE FUNCTION tables.atualizar_registro_pai()',nome);
 END LOOP;
END $$;

CREATE FUNCTION tables.auditar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE antes jsonb; depois jsonb; dados jsonb; empresa bigint; registro uuid; tabela uuid; base uuid;
BEGIN
 antes:=CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END;
 depois:=CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END;
 dados:=coalesce(depois,antes); empresa:=(dados->>'empresa_id')::bigint;
 IF TG_TABLE_NAME='registros' THEN registro:=(dados->>'id')::uuid; ELSE registro:=(dados->>'registro_id')::uuid; END IF;
 tabela:=(dados->>'tabela_id')::uuid; base:=(dados->>'base_id')::uuid;
 IF TG_TABLE_NAME='tabelas' THEN tabela:=(dados->>'id')::uuid; END IF;
 IF TG_TABLE_NAME='bases' THEN base:=(dados->>'id')::uuid; END IF;
 IF tabela IS NULL AND registro IS NOT NULL THEN SELECT tabela_id,base_id INTO tabela,base FROM tables.registros WHERE empresa_id=empresa AND id=registro; END IF;
 IF base IS NULL AND tabela IS NOT NULL THEN SELECT base_id INTO base FROM tables.tabelas WHERE empresa_id=empresa AND id=tabela; END IF;
 INSERT INTO tables.historico(empresa_id,base_id,tabela_id,registro_id,entidade,entidade_id,acao,autor_id,operacao_id,antes,depois)
 VALUES(empresa,base,tabela,registro,TG_TABLE_NAME,coalesce(dados->>'id',dados->>'registro_id',dados->>'campo_id'),TG_OP,tables.usuario_atual(),coalesce(nullif(current_setting('app.tables_operacao_id',true),'')::uuid,gen_random_uuid()),antes,depois);
 RETURN NULL;
END $$;

DO $$ DECLARE nome text; BEGIN
 FOREACH nome IN ARRAY ARRAY['bases','base_membros','tabelas','campos','campo_opcoes','registros','registro_opcoes','registro_usuarios','registro_vinculos','visualizacoes','visualizacao_campos','anexos','comentarios','historico'] LOOP
   EXECUTE format('ALTER TABLE tables.%I ENABLE ROW LEVEL SECURITY',nome);
   EXECUTE format('CREATE POLICY leitura ON tables.%I FOR SELECT TO tables_runtime USING (empresa_id=tables.empresa_atual() AND (SELECT tables.membro_ativo(false)))',nome);
   IF nome<>'historico' THEN
     EXECUTE format('CREATE POLICY inserir ON tables.%I FOR INSERT TO tables_runtime WITH CHECK (empresa_id=tables.empresa_atual() AND (SELECT tables.membro_ativo(true)))',nome);
     EXECUTE format('CREATE POLICY atualizar ON tables.%I FOR UPDATE TO tables_runtime USING (empresa_id=tables.empresa_atual() AND (SELECT tables.membro_ativo(true))) WITH CHECK (empresa_id=tables.empresa_atual() AND (SELECT tables.membro_ativo(true)))',nome);
     EXECUTE format('CREATE POLICY remover ON tables.%I FOR DELETE TO tables_runtime USING (empresa_id=tables.empresa_atual() AND (SELECT tables.membro_ativo(true)))',nome);
     EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON tables.%I TO tables_runtime',nome);
     EXECUTE format('CREATE TRIGGER auditar AFTER INSERT OR UPDATE OR DELETE ON tables.%I FOR EACH ROW EXECUTE FUNCTION tables.auditar()',nome);
   END IF;
 END LOOP;
END $$;
GRANT SELECT ON tables.historico TO tables_runtime;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA tables FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION tables.empresa_atual(),tables.usuario_atual(),tables.membro_ativo(boolean),tables.membros(),tables.validar_registro(),tables.validar_relacao(),tables.atualizar_registro_pai() TO tables_runtime;
REVOKE ALL ON ALL TABLES IN SCHEMA tables FROM PUBLIC,anon,authenticated;

CREATE INDEX bases_empresa_ordem ON tables.bases(empresa_id,posicao,id) WHERE excluido_em IS NULL;
CREATE INDEX tabelas_base_ordem ON tables.tabelas(empresa_id,base_id,posicao,id) WHERE excluido_em IS NULL;
CREATE INDEX campos_tabela_ordem ON tables.campos(empresa_id,tabela_id,posicao,id) WHERE excluido_em IS NULL;
CREATE INDEX opcoes_campo_ordem ON tables.campo_opcoes(empresa_id,campo_id,posicao,id);
CREATE INDEX registros_tabela_ordem ON tables.registros(empresa_id,tabela_id,posicao,id) WHERE excluido_em IS NULL;
CREATE INDEX registros_valores ON tables.registros USING gin(valores jsonb_path_ops) WHERE excluido_em IS NULL;
CREATE INDEX registro_opcoes_filtro ON tables.registro_opcoes(empresa_id,tabela_id,campo_id,opcao_id,registro_id);
CREATE INDEX registro_usuarios_filtro ON tables.registro_usuarios(empresa_id,tabela_id,campo_id,usuario_id,registro_id);
CREATE INDEX registro_vinculos_destino ON tables.registro_vinculos(empresa_id,registro_destino_id);
CREATE INDEX visualizacoes_tabela ON tables.visualizacoes(empresa_id,tabela_id,posicao,id);
CREATE INDEX anexos_registro ON tables.anexos(empresa_id,registro_id,criado_em);
CREATE INDEX comentarios_registro ON tables.comentarios(empresa_id,registro_id,criado_em);
CREATE INDEX historico_registro ON tables.historico(empresa_id,registro_id,criado_em DESC);
CREATE INDEX historico_operacao ON tables.historico(empresa_id,operacao_id);

COMMENT ON SCHEMA tables IS 'Produto Tables. Acesso inicial por empresa e papel organizacional existente; permissoes por base e planos serao definidos posteriormente.';
COMMENT ON TABLE tables.base_membros IS 'Estrutura reservada para futuras permissoes por base; nao concede nem restringe o acesso nesta entrega.';
DO $$ BEGIN
 IF to_regclass('storage.buckets') IS NOT NULL THEN
   IF EXISTS(SELECT 1 FROM storage.buckets WHERE id='tables-anexos' AND public) THEN
     RAISE EXCEPTION 'O bucket tables-anexos existente precisa ser privado';
   END IF;
   INSERT INTO storage.buckets(id,name,public) VALUES('tables-anexos','tables-anexos',false) ON CONFLICT(id) DO NOTHING;
 END IF;
END $$;
COMMIT;

BEGIN;
SET LOCAL lock_timeout='10s';
CREATE SCHEMA whatsapp;
REVOKE ALL ON SCHEMA whatsapp FROM PUBLIC,anon,authenticated;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='whatsapp_runtime') THEN
 CREATE ROLE whatsapp_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
END IF; END $$;
GRANT whatsapp_runtime TO postgres;
GRANT USAGE ON SCHEMA whatsapp TO whatsapp_runtime;
CREATE FUNCTION whatsapp.empresa_atual() RETURNS bigint LANGUAGE sql STABLE SET search_path=pg_catalog AS $$ SELECT nullif(current_setting('app.whatsapp_empresa_id',true),'')::bigint $$;
CREATE FUNCTION whatsapp.usuario_atual() RETURNS bigint LANGUAGE sql STABLE SET search_path=pg_catalog AS $$ SELECT nullif(current_setting('app.whatsapp_usuario_id',true),'')::bigint $$;
CREATE FUNCTION whatsapp.membro_ativo() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=m.empresa_id WHERE m.usuario_id=whatsapp.usuario_atual() AND m.empresa_id=whatsapp.empresa_atual() AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active')
$$;
CREATE TABLE whatsapp.conexoes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL REFERENCES shared.empresas(id),usuario_id bigint NOT NULL REFERENCES shared.usuarios(id),
 estado text NOT NULL DEFAULT 'pendente' CHECK(estado IN ('pendente','selecionar_recursos','ativa','reconectar','desconectada')),
 credenciais_cifradas text,escopos text[] NOT NULL DEFAULT '{}',contratos jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(contratos)='array'),
 recursos jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(recursos)='array'),versao integer NOT NULL DEFAULT 1 CHECK(versao>0),expira_em timestamptz,
 criado_em timestamptz NOT NULL DEFAULT now(),atualizado_em timestamptz NOT NULL DEFAULT now(),
 UNIQUE(empresa_id,usuario_id,id),CHECK(estado NOT IN ('ativa','selecionar_recursos') OR credenciais_cifradas IS NOT NULL)
);
CREATE UNIQUE INDEX conexoes_usuario_ativa ON whatsapp.conexoes(empresa_id,usuario_id) WHERE estado<>'desconectada';
CREATE TABLE whatsapp.contas(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,usuario_id bigint NOT NULL,conexao_id uuid NOT NULL,
 meta_business_id text NOT NULL CHECK(length(meta_business_id) BETWEEN 1 AND 100),meta_account_id text NOT NULL CHECK(length(meta_account_id) BETWEEN 1 AND 100),
 nome text NOT NULL DEFAULT '',estado text NOT NULL DEFAULT '',consultado_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,usuario_id,conexao_id) REFERENCES whatsapp.conexoes(empresa_id,usuario_id,id),UNIQUE(empresa_id,usuario_id,conexao_id,meta_account_id),UNIQUE(empresa_id,usuario_id,conexao_id,id)
);
CREATE TABLE whatsapp.numeros(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,usuario_id bigint NOT NULL,conexao_id uuid NOT NULL,conta_id uuid NOT NULL,
 meta_phone_id text NOT NULL CHECK(length(meta_phone_id) BETWEEN 1 AND 100),numero text NOT NULL DEFAULT '',nome text NOT NULL DEFAULT '',estado text NOT NULL DEFAULT '',consultado_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,usuario_id,conexao_id,conta_id) REFERENCES whatsapp.contas(empresa_id,usuario_id,conexao_id,id),UNIQUE(empresa_id,usuario_id,conexao_id,meta_phone_id)
);
CREATE TABLE whatsapp.sessoes_autorizacao(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,usuario_id bigint NOT NULL,conexao_id uuid NOT NULL,
 finalidade text NOT NULL CHECK(finalidade IN ('oauth','etapa_sensivel')),estado_hash text NOT NULL UNIQUE,sessao_hash text NOT NULL,dados_cifrados text NOT NULL,
 expira_em timestamptz NOT NULL,consumido_em timestamptz,criado_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,usuario_id,conexao_id) REFERENCES whatsapp.conexoes(empresa_id,usuario_id,id),CHECK(expira_em>criado_em)
);
CREATE UNIQUE INDEX drafts_whatsapp_context ON plugin.drafts(id,empresa_id,user_id,oauth_client_id,integration,domain);
CREATE TABLE whatsapp.execucoes_remotas(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,usuario_id bigint NOT NULL,conexao_id uuid NOT NULL,rascunho_id uuid NOT NULL UNIQUE,
 oauth_client_id text NOT NULL,integration text NOT NULL CHECK(integration IN ('chatgpt','claude')),draft_domain text NOT NULL DEFAULT 'whatsapp' CHECK(draft_domain='whatsapp'),tool_name text NOT NULL CHECK(tool_name LIKE 'whatsapp_%'),argumentos_hash text NOT NULL,
 estado text NOT NULL CHECK(estado IN ('reservada','em_execucao','concluida','falhou','indeterminada')),resultado jsonb,erro text,iniciado_em timestamptz,finalizado_em timestamptz,criado_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,usuario_id,conexao_id) REFERENCES whatsapp.conexoes(empresa_id,usuario_id,id),
 FOREIGN KEY(rascunho_id,empresa_id,usuario_id,oauth_client_id,integration,draft_domain) REFERENCES plugin.drafts(id,empresa_id,user_id,oauth_client_id,integration,domain) ON DELETE CASCADE,
 CHECK((estado IN ('concluida','falhou','indeterminada'))=(finalizado_em IS NOT NULL)),CHECK(estado<>'concluida' OR resultado IS NOT NULL)
);
CREATE INDEX sessoes_autorizacao_expiracao ON whatsapp.sessoes_autorizacao(expira_em);
CREATE INDEX execucoes_remotas_andamento ON whatsapp.execucoes_remotas(estado,iniciado_em) WHERE estado='em_execucao';
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['conexoes','contas','numeros','sessoes_autorizacao','execucoes_remotas'] LOOP
 EXECUTE format('ALTER TABLE whatsapp.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE whatsapp.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON whatsapp.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON whatsapp.%I TO whatsapp_runtime',t);
 EXECUTE format('CREATE POLICY contexto ON whatsapp.%I TO whatsapp_runtime USING(empresa_id=whatsapp.empresa_atual() AND usuario_id=whatsapp.usuario_atual() AND whatsapp.membro_ativo()) WITH CHECK(empresa_id=whatsapp.empresa_atual() AND usuario_id=whatsapp.usuario_atual() AND whatsapp.membro_ativo())',t);
END LOOP; END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA whatsapp FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA whatsapp TO whatsapp_runtime;
ALTER TABLE plugin.drafts DROP CONSTRAINT drafts_domain_check;
ALTER TABLE plugin.drafts ADD CONSTRAINT drafts_domain_check CHECK(domain IN ('erp','tables','whatsapp'));
ALTER TABLE plugin.drafts DROP CONSTRAINT drafts_domain_result;
ALTER TABLE plugin.drafts ADD CONSTRAINT drafts_domain_result CHECK(
 (domain='erp' AND ((status='saved')=(record_id IS NOT NULL))) OR
 (domain IN ('tables','whatsapp') AND ((status='saved')=(result IS NOT NULL)))
);
COMMIT;

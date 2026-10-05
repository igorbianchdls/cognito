BEGIN;
SET LOCAL lock_timeout = '10s';

-- Rename in place: PostgreSQL preserves identifiers, FKs, grants and RLS dependencies.
-- Function bodies are text and must be rewritten explicitly. Public function
-- signatures remain compatible (including legacy OUT parameter names).
DO $migration$
DECLARE item record; definition text; body text; mapping text[][] := ARRAY[
  ARRAY['users','usuarios'], ARRAY['tenants','empresas'],
  ARRAY['tenant_memberships','usuarios_empresas'],
  ARRAY['erp_permission_profiles','perfis_acesso'],
  ARRAY['erp_profile_permissions','permissoes_perfil']]; pair text[];
BEGIN
  IF to_regclass('shared.usuarios') IS NOT NULL THEN
    RAISE EXCEPTION 'Migration already applied; use the migration ledger';
  END IF;
  FOREACH pair SLICE 1 IN ARRAY mapping LOOP
    EXECUTE format('ALTER TABLE shared.%I RENAME TO %I',pair[1],pair[2]);
  END LOOP;
  FOR item IN SELECT c.table_schema,c.table_name FROM information_schema.columns c
    JOIN pg_namespace n ON n.nspname=c.table_schema
    JOIN pg_class t ON t.relnamespace=n.oid AND t.relname=c.table_name
    WHERE c.table_schema IN ('shared','erp','plugin') AND c.column_name='tenant_id'
    ORDER BY CASE WHEN t.relkind='v' THEN 1 ELSE 0 END,c.table_schema,c.table_name
  LOOP
    EXECUTE format('ALTER TABLE %I.%I RENAME COLUMN tenant_id TO empresa_id',item.table_schema,item.table_name);
  END LOOP;
  ALTER TABLE shared.usuarios_empresas RENAME COLUMN user_id TO usuario_id;
  ALTER TABLE shared.usuarios_empresas RENAME COLUMN erp_profile_id TO perfil_acesso_id;
  ALTER TABLE shared.permissoes_perfil RENAME COLUMN profile_id TO perfil_acesso_id;
  FOR item IN SELECT p.oid,pg_get_functiondef(p.oid) AS definition FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname IN ('shared','erp','plugin') AND p.prokind='f'
  LOOP
    definition := item.definition;
    -- pg_get_functiondef always uses this dollar delimiter; rewrite only the body.
    body := split_part(definition,'$function$',2);
    FOREACH pair SLICE 1 IN ARRAY mapping LOOP
      body := replace(body,'shared.'||pair[1],'shared.'||pair[2]);
    END LOOP;
    body := regexp_replace(body,'\mtenant_id\M','empresa_id','g');
    body := regexp_replace(body,'\merp_profile_id\M','perfil_acesso_id','g');
    IF definition LIKE '%shared.%' THEN
      body := regexp_replace(body,'\m(memberships|m)\.user_id\M','\1.usuario_id','g');
      body := regexp_replace(body,'\m(permissions|p)\.profile_id\M','\1.perfil_acesso_id','g');
      -- Legacy helpers also have unqualified shared membership columns.
      IF definition LIKE '%FUNCTION shared.%' THEN
        body := regexp_replace(body,'\muser_id\M','usuario_id','g');
        body := regexp_replace(body,'\mprofile_id\M','perfil_acesso_id','g');
      END IF;
    END IF;
    EXECUTE split_part(definition,'$function$',1)||'$function$'||body||'$function$'||split_part(definition,'$function$',3);
  END LOOP;
END
$migration$;

UPDATE shared.usuarios SET email=lower(btrim(email));
ALTER TABLE shared.usuarios ADD CONSTRAINT usuarios_email_normalizado CHECK(email=lower(btrim(email)) AND email<>'' AND position('@' IN email)>1);
CREATE UNIQUE INDEX usuarios_email_unico ON shared.usuarios(lower(email));
ALTER TABLE shared.usuarios ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','disabled'));
ALTER TABLE shared.empresas ADD COLUMN proprietario_definido boolean NOT NULL DEFAULT false;
UPDATE shared.empresas e SET proprietario_definido=true WHERE EXISTS(SELECT 1 FROM shared.usuarios_empresas m WHERE m.empresa_id=e.id AND m.role='owner' AND m.status='active');
ALTER TABLE shared.usuarios_empresas ADD COLUMN suspenso_localmente boolean NOT NULL DEFAULT false;
UPDATE shared.usuarios_empresas SET suspenso_localmente=true WHERE status='suspended';
CREATE UNIQUE INDEX usuarios_empresas_clerk_membership_unico ON shared.usuarios_empresas(clerk_membership_id) WHERE clerk_membership_id IS NOT NULL;
CREATE INDEX usuarios_empresas_organizacao_status ON shared.usuarios_empresas(clerk_organization_id,status) WHERE clerk_organization_id IS NOT NULL;
ALTER TABLE shared.empresas ADD CONSTRAINT empresas_id_organizacao_unico UNIQUE(id,clerk_organization_id);
ALTER TABLE shared.usuarios_empresas ADD CONSTRAINT usuarios_empresas_organizacao_fk FOREIGN KEY(empresa_id,clerk_organization_id) REFERENCES shared.empresas(id,clerk_organization_id);
ALTER TABLE shared.usuarios_empresas ADD CONSTRAINT usuarios_empresas_clerk_id_preenchido CHECK(clerk_membership_id IS NULL OR btrim(clerk_membership_id)<>'');

INSERT INTO shared.perfis_acesso(id,nome) VALUES('administrador','Administrador'),('consulta','Consulta') ON CONFLICT(id) DO NOTHING;
INSERT INTO shared.permissoes_perfil(perfil_acesso_id,capability)
 SELECT 'administrador',capability FROM unnest(ARRAY[
  'erp.vendas.visualizar','erp.vendas.gerenciar','erp.compras.visualizar','erp.compras.gerenciar',
  'erp.financeiro.visualizar','erp.financeiro.gerenciar','erp.financeiro.baixar','erp.financeiro.estornar',
  'erp.estoque.visualizar','erp.estoque.movimentar','erp.estoque.ajustar','erp.relatorios.visualizar',
  'erp.cadastros.visualizar','erp.cadastros.gerenciar','erp.configuracoes.gerenciar']) AS c(capability)
 ON CONFLICT DO NOTHING;
ALTER TABLE shared.permissoes_perfil ADD CONSTRAINT permissoes_perfil_capacidade_conhecida CHECK(capability IN (
 'erp.vendas.visualizar','erp.vendas.gerenciar','erp.compras.visualizar','erp.compras.gerenciar',
 'erp.financeiro.visualizar','erp.financeiro.gerenciar','erp.financeiro.baixar','erp.financeiro.estornar',
 'erp.estoque.visualizar','erp.estoque.movimentar','erp.estoque.ajustar','erp.relatorios.visualizar',
 'erp.cadastros.visualizar','erp.cadastros.gerenciar','erp.configuracoes.gerenciar'));
UPDATE shared.usuarios_empresas SET perfil_acesso_id='administrador' WHERE role IN ('owner','admin');
UPDATE shared.usuarios_empresas SET perfil_acesso_id='consulta' WHERE role NOT IN ('owner','admin') AND perfil_acesso_id='administrador';

CREATE TABLE shared.convites_empresa(
 id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 empresa_id bigint NOT NULL REFERENCES shared.empresas(id) ON DELETE RESTRICT,
 email text NOT NULL CHECK(email=lower(btrim(email)) AND position('@' IN email)>1),
 role text NOT NULL DEFAULT 'member' CHECK(role IN ('owner','admin','member','viewer')),
 perfil_acesso_id text NOT NULL DEFAULT 'consulta' REFERENCES shared.perfis_acesso(id),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','revoked','expired')),
 convidado_por bigint REFERENCES shared.usuarios(id),
 expira_em timestamptz,
 clerk_organization_id text NOT NULL,
 clerk_invitation_id text NOT NULL UNIQUE CHECK(btrim(clerk_invitation_id)<>''),
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(metadata)='object'),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,clerk_organization_id) REFERENCES shared.empresas(id,clerk_organization_id)
);
CREATE INDEX convites_empresa_status ON shared.convites_empresa(empresa_id,status);
CREATE INDEX convites_empresa_email ON shared.convites_empresa(email);

-- An inbox for signed events and an outbox for local Clerk updates: no ninth table.
CREATE TABLE shared.eventos_webhook(
 id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 provedor text NOT NULL CHECK(provedor IN ('clerk','clerk_outbox')),
 evento_id text NOT NULL CHECK(btrim(evento_id)<>''),
 tipo text NOT NULL,entidade_id text NOT NULL CHECK(btrim(entidade_id)<>''),
 ocorrido_em timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','processed','ignored','failed')),
 tentativas integer NOT NULL DEFAULT 0 CHECK(tentativas>=0),
 payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(payload)='object'),
 erro_codigo text,proxima_tentativa_em timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),processado_em timestamptz,
 UNIQUE(provedor,evento_id)
);
CREATE INDEX eventos_webhook_entidade ON shared.eventos_webhook(provedor,entidade_id,ocorrido_em DESC) WHERE status IN ('processed','ignored');
CREATE INDEX eventos_webhook_pendentes ON shared.eventos_webhook(proxima_tentativa_em,created_at) WHERE status IN ('pending','failed');

CREATE TABLE shared.historico_acessos(
 id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 empresa_id bigint REFERENCES shared.empresas(id) ON DELETE RESTRICT,
 autor_usuario_id bigint REFERENCES shared.usuarios(id) ON DELETE RESTRICT,
 usuario_id bigint REFERENCES shared.usuarios(id) ON DELETE RESTRICT,
 acao text NOT NULL,origem text NOT NULL,motivo text,
 antes jsonb,depois jsonb,criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX historico_acessos_empresa_data ON shared.historico_acessos(empresa_id,criado_em DESC);

CREATE OR REPLACE FUNCTION shared.proteger_vinculo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE empresa bigint; estado text;
BEGIN
 empresa := CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END;
 IF TG_OP='UPDATE' AND (NEW.empresa_id<>OLD.empresa_id OR NEW.usuario_id<>OLD.usuario_id) THEN
   RAISE EXCEPTION 'Nao e permitido mover um vinculo entre usuarios ou empresas' USING ERRCODE='23514';
 END IF;
 -- Serialize all access mutations for this company, including direct SQL.
 SELECT status INTO estado FROM shared.empresas WHERE id=empresa FOR UPDATE;
 IF TG_OP<>'DELETE' AND NEW.suspenso_localmente THEN NEW.status:='suspended'; END IF;
 IF TG_OP<>'INSERT' AND OLD.role='owner' AND OLD.status='active' AND estado='active'
   AND (TG_OP='DELETE' OR NEW.role<>'owner' OR NEW.status<>'active')
   AND NOT EXISTS(SELECT 1 FROM shared.usuarios_empresas WHERE empresa_id=empresa AND usuario_id<>OLD.usuario_id AND role='owner' AND status='active') THEN
   RAISE EXCEPTION 'A empresa precisa manter pelo menos um proprietario ativo' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NEW.role IN ('owner','admin') THEN NEW.perfil_acesso_id:='administrador';
 ELSIF NEW.perfil_acesso_id='administrador' THEN
   RAISE EXCEPTION 'Perfil administrador exige papel de proprietario ou administrador' USING ERRCODE='23514';
 END IF;
 IF NEW.role='owner' AND NEW.status='active' THEN
   UPDATE shared.empresas SET proprietario_definido=true WHERE id=empresa AND NOT proprietario_definido;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER proteger_vinculo BEFORE INSERT OR UPDATE OR DELETE ON shared.usuarios_empresas FOR EACH ROW EXECUTE FUNCTION shared.proteger_vinculo();

CREATE OR REPLACE FUNCTION shared.proteger_usuario()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE empresa record;
BEGIN
 IF OLD.status='active' AND NEW.status<>'active' THEN
  FOR empresa IN SELECT e.id FROM shared.empresas e JOIN shared.usuarios_empresas m ON m.empresa_id=e.id
    WHERE m.usuario_id=OLD.id AND m.role='owner' AND m.status='active' AND e.status='active' ORDER BY e.id FOR UPDATE OF e LOOP
    IF NOT EXISTS(SELECT 1 FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id
      WHERE m.empresa_id=empresa.id AND m.usuario_id<>OLD.id AND m.role='owner' AND m.status='active' AND u.status='active') THEN
      RAISE EXCEPTION 'Transfira a propriedade ou suspenda a empresa antes de desativar seu ultimo proprietario' USING ERRCODE='23514';
    END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER proteger_usuario BEFORE UPDATE OF status ON shared.usuarios FOR EACH ROW EXECUTE FUNCTION shared.proteger_usuario();

CREATE OR REPLACE FUNCTION shared.proteger_empresa()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.id<>OLD.id OR (OLD.clerk_organization_id IS NOT NULL AND NEW.clerk_organization_id IS DISTINCT FROM OLD.clerk_organization_id) THEN
  RAISE EXCEPTION 'Identidade da empresa e organizacao vinculada sao imutaveis' USING ERRCODE='23514';
 END IF;
 IF OLD.proprietario_definido AND NOT NEW.proprietario_definido THEN
  RAISE EXCEPTION 'A protecao de propriedade nao pode ser removida' USING ERRCODE='23514';
 END IF;
 IF NEW.status='active' AND OLD.status<>'active' AND NEW.proprietario_definido
  AND NOT EXISTS(SELECT 1 FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id
    WHERE m.empresa_id=OLD.id AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active') THEN
  RAISE EXCEPTION 'A empresa precisa de proprietario ativo antes de ser reativada' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER proteger_empresa BEFORE UPDATE ON shared.empresas FOR EACH ROW EXECUTE FUNCTION shared.proteger_empresa();

CREATE OR REPLACE FUNCTION shared.auditar_acesso()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE antes jsonb; depois jsonb; empresa bigint; usuario bigint;
BEGIN
 IF TG_TABLE_NAME='usuarios_empresas' THEN
   IF TG_OP<>'INSERT' THEN antes:=jsonb_build_object('role',OLD.role,'status',OLD.status,'perfil_acesso_id',OLD.perfil_acesso_id,'suspenso_localmente',OLD.suspenso_localmente); END IF;
   IF TG_OP<>'DELETE' THEN depois:=jsonb_build_object('role',NEW.role,'status',NEW.status,'perfil_acesso_id',NEW.perfil_acesso_id,'suspenso_localmente',NEW.suspenso_localmente); END IF;
   empresa:=CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END;
   usuario:=CASE WHEN TG_OP='DELETE' THEN OLD.usuario_id ELSE NEW.usuario_id END;
 ELSE
   IF TG_OP<>'INSERT' THEN antes:=jsonb_build_object('status',OLD.status); END IF;
   IF TG_OP<>'DELETE' THEN depois:=jsonb_build_object('status',NEW.status); END IF;
   IF TG_TABLE_NAME='usuarios' THEN usuario:=CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END;
   ELSE empresa:=CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END; END IF;
 END IF;
 IF antes IS DISTINCT FROM depois THEN
   INSERT INTO shared.historico_acessos(empresa_id,autor_usuario_id,usuario_id,acao,origem,motivo,antes,depois)
   VALUES(empresa,NULLIF(current_setting('app.shared_actor_id',true),'')::bigint,usuario,TG_TABLE_NAME||'.'||lower(TG_OP),
    COALESCE(NULLIF(current_setting('app.shared_source',true),''),'database'),NULLIF(current_setting('app.shared_reason',true),''),antes,depois);
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER auditar_vinculo AFTER INSERT OR UPDATE OR DELETE ON shared.usuarios_empresas FOR EACH ROW EXECUTE FUNCTION shared.auditar_acesso();
CREATE TRIGGER auditar_usuario AFTER INSERT OR UPDATE ON shared.usuarios FOR EACH ROW EXECUTE FUNCTION shared.auditar_acesso();
CREATE TRIGGER auditar_empresa AFTER INSERT OR UPDATE ON shared.empresas FOR EACH ROW EXECUTE FUNCTION shared.auditar_acesso();
CREATE OR REPLACE FUNCTION shared.proteger_historico()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Historico de acessos e somente de inclusao' USING ERRCODE='23514'; END $$;
CREATE TRIGGER proteger_historico BEFORE UPDATE OR DELETE OR TRUNCATE ON shared.historico_acessos FOR EACH STATEMENT EXECUTE FUNCTION shared.proteger_historico();

CREATE OR REPLACE FUNCTION shared.is_tenant_member(input_tenant_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT (COALESCE(NULLIF(current_setting('app.erp_empresa_id',true),''),NULLIF(current_setting('app.erp_tenant_id',true),'')) IS NULL
  OR COALESCE(NULLIF(current_setting('app.erp_empresa_id',true),''),NULLIF(current_setting('app.erp_tenant_id',true),''))::bigint=input_tenant_id)
 AND EXISTS(SELECT 1 FROM shared.usuarios_empresas m JOIN shared.empresas e ON e.id=m.empresa_id JOIN shared.usuarios u ON u.id=m.usuario_id
 WHERE m.empresa_id=input_tenant_id AND m.usuario_id=shared.current_user_id() AND m.status='active' AND NOT m.suspenso_localmente AND e.status='active' AND u.status='active')
$$;
CREATE OR REPLACE FUNCTION shared.has_erp_capability(input_tenant_id bigint,input_capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT shared.is_tenant_member(input_tenant_id) AND EXISTS(
  SELECT 1 FROM shared.usuarios_empresas m LEFT JOIN shared.permissoes_perfil p ON p.perfil_acesso_id=m.perfil_acesso_id AND p.capability=input_capability
  WHERE m.empresa_id=input_tenant_id AND m.usuario_id=shared.current_user_id() AND m.status='active'
   AND (m.role IN ('owner','admin') OR p.capability IS NOT NULL)
   AND (m.role<>'viewer' OR input_capability LIKE '%.visualizar'))
$$;
CREATE OR REPLACE FUNCTION shared.has_tenant_role(input_tenant_id bigint,allowed_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT shared.is_tenant_member(input_tenant_id) AND EXISTS(SELECT 1 FROM shared.usuarios_empresas
 WHERE empresa_id=input_tenant_id AND usuario_id=shared.current_user_id() AND role=ANY(allowed_roles) AND status='active')
$$;
ALTER FUNCTION shared.current_user_id() SET search_path=pg_catalog;
REVOKE ALL ON ALL TABLES IN SCHEMA shared FROM PUBLIC,anon,authenticated,erp_runtime;
REVOKE ALL ON SCHEMA shared FROM PUBLIC,anon,authenticated,erp_runtime;
REVOKE ALL ON FUNCTION shared.proteger_vinculo(),shared.proteger_usuario(),shared.proteger_empresa(),shared.auditar_acesso(),shared.proteger_historico() FROM PUBLIC,anon,authenticated,erp_runtime;
REVOKE ALL ON FUNCTION shared.has_tenant_role(bigint,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION shared.has_tenant_role(bigint,text[]) TO erp_runtime,authenticated,service_role;
COMMENT ON TABLE shared.usuarios_empresas IS 'Papel gerencia a empresa; perfil limita os modulos ERP. Bloqueio local nao e removido por webhook.';
COMMENT ON TABLE shared.eventos_webhook IS 'Inbox Clerk e outbox duravel. Processamento e efeitos locais na mesma transacao.';
COMMENT ON TABLE shared.historico_acessos IS 'Auditoria de acesso sem emails, tokens ou payloads Clerk; somente inclusao.';
COMMIT;

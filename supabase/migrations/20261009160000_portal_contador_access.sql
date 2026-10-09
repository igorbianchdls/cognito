BEGIN;
ALTER TABLE shared.usuarios_empresas ADD COLUMN acesso_portal_contador boolean NOT NULL DEFAULT false;
ALTER TABLE shared.convites_empresa ADD COLUMN acesso_portal_contador boolean NOT NULL DEFAULT false;
INSERT INTO shared.perfis_acesso(id,nome,descricao) VALUES('contador','Contador','Consultas financeiras, comerciais, documentos e relatórios.');
INSERT INTO shared.permissoes_perfil(perfil_acesso_id,capability)
 SELECT 'contador',c FROM unnest(ARRAY['erp.financeiro.visualizar','erp.relatorios.visualizar','erp.vendas.visualizar','erp.compras.visualizar','erp.cadastros.visualizar']) c;
CREATE INDEX usuarios_empresas_portal_contador ON shared.usuarios_empresas(usuario_id,empresa_id) WHERE acesso_portal_contador AND status='active';

-- The additional request scope is transaction-local; ordinary ERP requests explicitly set it false.
CREATE OR REPLACE FUNCTION shared.is_tenant_member(input_tenant_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT (COALESCE(NULLIF(current_setting('app.erp_empresa_id',true),''),NULLIF(current_setting('app.erp_tenant_id',true),'')) IS NULL
  OR COALESCE(NULLIF(current_setting('app.erp_empresa_id',true),''),NULLIF(current_setting('app.erp_tenant_id',true),''))::bigint=input_tenant_id)
 AND EXISTS(SELECT 1 FROM shared.usuarios_empresas m JOIN shared.empresas e ON e.id=m.empresa_id JOIN shared.usuarios u ON u.id=m.usuario_id
 WHERE m.empresa_id=input_tenant_id AND m.usuario_id=shared.current_user_id() AND m.status='active' AND NOT m.suspenso_localmente AND e.status='active' AND u.status='active'
 AND (current_setting('app.portal_contador',true) IS DISTINCT FROM 'true' OR m.acesso_portal_contador))
$$;

CREATE OR REPLACE FUNCTION shared.auditar_acesso()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE antes jsonb; depois jsonb; empresa bigint; usuario bigint;
BEGIN
 IF TG_TABLE_NAME='usuarios_empresas' THEN
   IF TG_OP<>'INSERT' THEN antes:=jsonb_build_object('role',OLD.role,'status',OLD.status,'perfil_acesso_id',OLD.perfil_acesso_id,'suspenso_localmente',OLD.suspenso_localmente,'acesso_portal_contador',OLD.acesso_portal_contador,'vendedor_id',OLD.vendedor_id,'escopo_vendas',OLD.escopo_vendas,'desconto_maximo_percentual',OLD.desconto_maximo_percentual); END IF;
   IF TG_OP<>'DELETE' THEN depois:=jsonb_build_object('role',NEW.role,'status',NEW.status,'perfil_acesso_id',NEW.perfil_acesso_id,'suspenso_localmente',NEW.suspenso_localmente,'acesso_portal_contador',NEW.acesso_portal_contador,'vendedor_id',NEW.vendedor_id,'escopo_vendas',NEW.escopo_vendas,'desconto_maximo_percentual',NEW.desconto_maximo_percentual); END IF;
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

CREATE FUNCTION shared.auditar_convite_contador()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE antes jsonb; depois jsonb;
BEGIN
 IF TG_OP<>'INSERT' THEN antes:=jsonb_build_object('convite_id',OLD.id,'status',OLD.status,'perfil_acesso_id',OLD.perfil_acesso_id,'acesso_portal_contador',OLD.acesso_portal_contador); END IF;
 depois:=jsonb_build_object('convite_id',NEW.id,'status',NEW.status,'perfil_acesso_id',NEW.perfil_acesso_id,'acesso_portal_contador',NEW.acesso_portal_contador);
 IF (NEW.acesso_portal_contador OR COALESCE(OLD.acesso_portal_contador,false)) AND antes IS DISTINCT FROM depois THEN
   INSERT INTO shared.historico_acessos(empresa_id,autor_usuario_id,acao,origem,antes,depois)
   VALUES(NEW.empresa_id,NULLIF(current_setting('app.shared_actor_id',true),'')::bigint,'convites_empresa.'||lower(TG_OP),COALESCE(NULLIF(current_setting('app.shared_source',true),''),'clerk_webhook'),antes,depois);
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER auditar_convite_contador AFTER INSERT OR UPDATE ON shared.convites_empresa FOR EACH ROW EXECUTE FUNCTION shared.auditar_convite_contador();
REVOKE ALL ON FUNCTION shared.auditar_convite_contador() FROM PUBLIC,anon,authenticated,erp_runtime;

-- Files are private. This function exposes only metadata of confirmed, authorized document attachments.
CREATE FUNCTION erp.portal_documentos(empresa_id bigint)
RETURNS TABLE(id bigint,nome text,mime_type text,tamanho_bytes bigint,criado_em timestamptz,documento text,registro_id bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT a.id,a.nome,a.mime_type,a.tamanho_bytes,f.criado_em,a.documento,a.registro_id
 FROM erp.arquivos f CROSS JOIN LATERAL erp.anexo_acessivel($1,f.id,false) a
 WHERE f.empresa_id=$1 AND $1=shared.erp_empresa_contexto() AND shared.is_tenant_member($1)
 AND current_setting('app.portal_contador',true)='true' AND NOT a.pendente AND f.excluido_em IS NULL
$$;
REVOKE ALL ON FUNCTION erp.portal_documentos(bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION erp.portal_documentos(bigint) TO erp_runtime;
COMMENT ON COLUMN shared.usuarios_empresas.acesso_portal_contador IS 'Concessão local de acesso ao Portal do Contador; independente do perfil ERP.';
COMMENT ON COLUMN shared.convites_empresa.acesso_portal_contador IS 'Concessão escolhida pelo administrador e aplicada uma vez após aceitação e vínculo Clerk ativo.';
COMMIT;

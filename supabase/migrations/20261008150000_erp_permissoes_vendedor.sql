BEGIN;

-- Fase 1, item 1.7: permissões comerciais por usuário.
--
-- Os perfis de acesso (shared.perfis_acesso) são globais; as regras comerciais são de cada vínculo
-- usuário x empresa (shared.usuarios_empresas):
--   vendedor_id                 cadastro (erp.entidades, eh_vendedor) que representa o usuário nas vendas;
--   escopo_vendas               'todas' (padrão) ou 'proprias': vê e altera só vendas/orçamentos dele;
--   desconto_maximo_percentual  desconto total máximo (itens + venda) que o usuário pode conceder; nulo = sem limite.
-- Proprietários e administradores nunca são restritos.

ALTER TABLE shared.usuarios_empresas
  ADD COLUMN vendedor_id bigint,
  ADD COLUMN escopo_vendas text NOT NULL DEFAULT 'todas',
  ADD COLUMN desconto_maximo_percentual numeric(5,2);
ALTER TABLE shared.usuarios_empresas
  ADD CONSTRAINT usuarios_empresas_escopo_vendas_chk CHECK (escopo_vendas IN ('todas', 'proprias')),
  ADD CONSTRAINT usuarios_empresas_desconto_maximo_chk CHECK (desconto_maximo_percentual IS NULL OR desconto_maximo_percentual BETWEEN 0 AND 100),
  ADD CONSTRAINT usuarios_empresas_vendedor_fk FOREIGN KEY (vendedor_id) REFERENCES erp.entidades(id) ON DELETE SET NULL;
CREATE INDEX usuarios_empresas_vendedor_idx ON shared.usuarios_empresas(vendedor_id) WHERE vendedor_id IS NOT NULL;

-- O vendedor precisa ser um cadastro de vendedor da mesma empresa.
CREATE OR REPLACE FUNCTION shared.validar_vendedor_vinculo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  IF NEW.vendedor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM erp.entidades e
    WHERE e.id = NEW.vendedor_id AND e.empresa_id = NEW.empresa_id AND e.eh_vendedor AND e.excluido_em IS NULL
  ) THEN
    RAISE EXCEPTION 'Vendedor inválido para esta empresa' USING ERRCODE = '23514';
  END IF;
  IF NEW.escopo_vendas = 'proprias' AND NEW.vendedor_id IS NULL THEN
    RAISE EXCEPTION 'Para ver somente as próprias vendas, vincule o usuário a um vendedor' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validar_vendedor_vinculo BEFORE INSERT OR UPDATE OF vendedor_id, escopo_vendas, empresa_id
  ON shared.usuarios_empresas FOR EACH ROW EXECUTE FUNCTION shared.validar_vendedor_vinculo();
REVOKE ALL ON FUNCTION shared.validar_vendedor_vinculo() FROM PUBLIC, anon, authenticated, erp_runtime;

-- Regras comerciais do usuário da sessão na empresa da sessão (app.erp_tenant_id / usuário atual).
CREATE OR REPLACE FUNCTION shared.erp_regras_vendedor()
RETURNS TABLE (vendedor_id bigint, escopo_vendas text, desconto_maximo_percentual numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT m.vendedor_id,
    CASE WHEN m.role IN ('owner', 'admin') THEN 'todas' ELSE m.escopo_vendas END,
    CASE WHEN m.role IN ('owner', 'admin') THEN NULL ELSE m.desconto_maximo_percentual END
  FROM shared.usuarios_empresas m
  WHERE m.empresa_id = shared.erp_empresa_contexto() AND m.usuario_id = shared.current_user_id() AND m.status = 'active'
$$;

-- Vendedor a que a sessão está restrita; nulo quando não há restrição (inclui sessões sem contexto).
CREATE OR REPLACE FUNCTION shared.erp_vendedor_restrito()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT r.vendedor_id FROM shared.erp_regras_vendedor() r WHERE r.escopo_vendas = 'proprias'
$$;
REVOKE ALL ON FUNCTION shared.erp_regras_vendedor(), shared.erp_vendedor_restrito() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION shared.erp_regras_vendedor(), shared.erp_vendedor_restrito() TO erp_runtime, authenticated, service_role;

-- Política restritiva (soma-se às permissões do módulo): avaliada uma vez por consulta (InitPlan).
CREATE POLICY vendas_escopo_vendedor ON erp.vendas AS RESTRICTIVE FOR ALL
  USING (empresa_id IS DISTINCT FROM shared.erp_empresa_contexto()
    OR (SELECT shared.erp_vendedor_restrito()) IS NULL
    OR vendedor_id = (SELECT shared.erp_vendedor_restrito()))
  WITH CHECK (empresa_id IS DISTINCT FROM shared.erp_empresa_contexto()
    OR (SELECT shared.erp_vendedor_restrito()) IS NULL
    OR vendedor_id = (SELECT shared.erp_vendedor_restrito()));
CREATE POLICY comissoes_lancamentos_escopo_vendedor ON erp.comissoes_lancamentos AS RESTRICTIVE FOR SELECT
  USING (empresa_id IS DISTINCT FROM shared.erp_empresa_contexto()
    OR (SELECT shared.erp_vendedor_restrito()) IS NULL
    OR vendedor_id = (SELECT shared.erp_vendedor_restrito()));

-- Auditoria de acessos passa a registrar as regras comerciais do vínculo.
CREATE OR REPLACE FUNCTION shared.auditar_acesso()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE antes jsonb; depois jsonb; empresa bigint; usuario bigint;
BEGIN
 IF TG_TABLE_NAME='usuarios_empresas' THEN
   IF TG_OP<>'INSERT' THEN antes:=jsonb_build_object('role',OLD.role,'status',OLD.status,'perfil_acesso_id',OLD.perfil_acesso_id,'suspenso_localmente',OLD.suspenso_localmente,
     'vendedor_id',OLD.vendedor_id,'escopo_vendas',OLD.escopo_vendas,'desconto_maximo_percentual',OLD.desconto_maximo_percentual); END IF;
   IF TG_OP<>'DELETE' THEN depois:=jsonb_build_object('role',NEW.role,'status',NEW.status,'perfil_acesso_id',NEW.perfil_acesso_id,'suspenso_localmente',NEW.suspenso_localmente,
     'vendedor_id',NEW.vendedor_id,'escopo_vendas',NEW.escopo_vendas,'desconto_maximo_percentual',NEW.desconto_maximo_percentual); END IF;
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

COMMENT ON COLUMN shared.usuarios_empresas.vendedor_id IS 'Cadastro de vendedor (erp.entidades) que representa o usuário nas vendas e comissões.';
COMMENT ON COLUMN shared.usuarios_empresas.escopo_vendas IS 'todas | proprias: com proprias, o usuário vê e altera somente vendas e orçamentos do seu vendedor.';
COMMENT ON COLUMN shared.usuarios_empresas.desconto_maximo_percentual IS 'Desconto total máximo (itens + venda) que o usuário pode conceder; nulo = sem limite. Não se aplica a administradores.';

COMMIT;

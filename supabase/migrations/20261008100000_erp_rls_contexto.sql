BEGIN;

-- Políticas de RLS sem custo por linha (Fase 0, item 0.1).
--
-- Antes: cada política chamava shared.has_erp_capability(empresa_id, '...') ou
-- shared.can_read_erp_module(empresa_id, '...'). Como o argumento é uma coluna, o Postgres executava a função
-- (com consultas a vínculos, perfis e permissões) para cada linha lida: no banco real, 559 ms com RLS contra
-- 20 ms sem RLS para a mesma página de contas a receber.
--
-- Depois: quando a linha é da empresa da sessão (app.erp_tenant_id, definido pelo servidor em toda transação),
-- a permissão é avaliada uma única vez por consulta (subconsulta sem coluna = InitPlan). Em qualquer outro caso
-- (outra empresa, sessão sem contexto, acesso direto do papel authenticated) a expressão original é usada.
-- O resultado é idêntico ao anterior em todos os casos; muda apenas quantas vezes a função é executada.

CREATE OR REPLACE FUNCTION shared.erp_empresa_contexto()
RETURNS bigint
LANGUAGE sql
STABLE
SET search_path TO 'pg_catalog'
AS $$ SELECT NULLIF(current_setting('app.erp_tenant_id', true), '')::bigint $$;

COMMENT ON FUNCTION shared.erp_empresa_contexto() IS 'Empresa da sessão do ERP (app.erp_tenant_id), usada pelas políticas de RLS para avaliar permissões uma vez por consulta.';
GRANT EXECUTE ON FUNCTION shared.erp_empresa_contexto() TO PUBLIC;

DO $migration$
DECLARE
  pol record;
  novo_using text;
  novo_check text;
  -- shared.<função>(empresa_id, '<texto>'::text) com argumento literal; argumentos calculados por coluna
  -- (CASE sobre tipo/recurso) e referências qualificadas (n.empresa_id) ficam como estão.
  padrao constant text := 'shared\.(has_erp_capability|can_read_erp_module)\(empresa_id, (''(?:[^'']|'''')*''::text)\)';
  troca constant text := 'CASE WHEN (empresa_id = shared.erp_empresa_contexto()) THEN (SELECT shared.\1(shared.erp_empresa_contexto(), \2)) ELSE shared.\1(empresa_id, \2) END';
  alteradas integer := 0;
BEGIN
  FOR pol IN
    SELECT p.polname, c.relname,
      pg_get_expr(p.polqual, p.polrelid) AS expr_using,
      pg_get_expr(p.polwithcheck, p.polrelid) AS expr_check
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    WHERE c.relnamespace = 'erp'::regnamespace
  LOOP
    -- Idempotente: políticas já reescritas não são tocadas de novo.
    IF coalesce(pol.expr_using, '') LIKE '%erp_empresa_contexto%' OR coalesce(pol.expr_check, '') LIKE '%erp_empresa_contexto%' THEN
      CONTINUE;
    END IF;
    novo_using := regexp_replace(pol.expr_using, padrao, troca, 'g');
    novo_check := regexp_replace(pol.expr_check, padrao, troca, 'g');
    IF novo_using IS DISTINCT FROM pol.expr_using THEN
      EXECUTE format('ALTER POLICY %I ON erp.%I USING (%s)', pol.polname, pol.relname, novo_using);
    END IF;
    IF novo_check IS DISTINCT FROM pol.expr_check THEN
      EXECUTE format('ALTER POLICY %I ON erp.%I WITH CHECK (%s)', pol.polname, pol.relname, novo_check);
    END IF;
    IF novo_using IS DISTINCT FROM pol.expr_using OR novo_check IS DISTINCT FROM pol.expr_check THEN
      alteradas := alteradas + 1;
    END IF;
  END LOOP;
  RAISE NOTICE 'Políticas de RLS reescritas: %', alteradas;
END
$migration$;

COMMIT;

-- Retirada da integracao antiga. As migracoes historicas permanecem intactas.
-- Dados existentes precisam ser arquivados antes de executar esta migracao.
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- Recuse contagens filtradas por RLS: a verificacao precisa enxergar todos os registros.
SET LOCAL row_security = off;

DO $$
DECLARE
  table_name text;
  row_count bigint;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'ai_action_approvals', 'ai_tool_executions', 'ai_connections'
  ] LOOP
    IF to_regclass(format('shared.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('LOCK TABLE shared.%I IN ACCESS EXCLUSIVE MODE', table_name);
      EXECUTE format('SELECT count(*) FROM shared.%I', table_name) INTO row_count;
      IF row_count > 0 THEN
        RAISE EXCEPTION USING
          ERRCODE = '55000',
          MESSAGE = format('Retirada bloqueada: shared.%I contem %s registros. Arquive os dados antes de remover a tabela.', table_name, row_count);
      END IF;
    END IF;
  END LOOP;
END
$$;

-- RESTRICT impede a exclusao de objetos externos que dependam destas tabelas.
-- A lista unica permite retirar as chaves estrangeiras internas entre elas.
DROP TABLE IF EXISTS
  shared.ai_action_approvals,
  shared.ai_tool_executions,
  shared.ai_connections
RESTRICT;

COMMIT;

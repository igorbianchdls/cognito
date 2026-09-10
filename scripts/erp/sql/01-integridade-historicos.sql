-- Preparado para revisao. Nao aplicar automaticamente no Supabase.
-- Escopo: tabelas existentes; sem fiscal, estoque, novas tabelas ou views.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- O papel de execucao ja tem INSERT, mas faltava uma politica RLS aplicavel.
DROP POLICY IF EXISTS cadastros_eventos_runtime_insert ON erp.cadastros_eventos;
CREATE POLICY cadastros_eventos_runtime_insert ON erp.cadastros_eventos
  FOR INSERT TO erp_runtime
  WITH CHECK (shared.has_erp_capability(tenant_id, 'erp.cadastros.gerenciar'));
DROP POLICY IF EXISTS vendas_eventos_runtime_insert ON erp.vendas_eventos;
CREATE POLICY vendas_eventos_runtime_insert ON erp.vendas_eventos
  FOR INSERT TO erp_runtime
  WITH CHECK (shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'));
GRANT SELECT, INSERT ON erp.cadastros_eventos, erp.vendas_eventos TO erp_runtime;

-- Defesa adicional para historico, inclusive em caminhos que ignoram RLS.
DROP TRIGGER IF EXISTS bloquear_mutacao_evento ON erp.ordens_servico_eventos;
CREATE TRIGGER bloquear_mutacao_evento
  BEFORE UPDATE OR DELETE ON erp.ordens_servico_eventos
  FOR EACH ROW EXECUTE FUNCTION erp.bloquear_mutacao_evento();
REVOKE UPDATE, DELETE ON erp.cadastros_eventos, erp.vendas_eventos,
  erp.ordens_servico_eventos FROM erp_runtime, authenticated;

-- A origem do extrato e evidencia: nao excluir importacoes referenciadas.
ALTER TABLE erp.transacoes_bancarias
  DROP CONSTRAINT IF EXISTS transacoes_bancarias_importacao_fk;
ALTER TABLE erp.transacoes_bancarias
  ADD CONSTRAINT transacoes_bancarias_importacao_fk
  FOREIGN KEY (tenant_id, importacao_bancaria_id)
  REFERENCES erp.importacoes_bancarias (tenant_id, id) ON DELETE RESTRICT;

-- So remover a duplicata se a definicao corresponder ao indice preservado.
DO $$
DECLARE
  preservado text;
  duplicado text;
BEGIN
  SELECT regexp_replace(indexdef, 'INDEX [^ ]+ ', 'INDEX canonical ')
    INTO preservado FROM pg_indexes
    WHERE schemaname = 'erp' AND indexname = 'fechamentos_periodos_ativo_idx';
  SELECT regexp_replace(indexdef, 'INDEX [^ ]+ ', 'INDEX canonical ')
    INTO duplicado FROM pg_indexes
    WHERE schemaname = 'erp' AND indexname = 'fechamentos_periodos_ativo_unico_idx';
  IF preservado IS NULL THEN
    RAISE EXCEPTION 'Indice de fechamento esperado nao encontrado; revisar catalogo';
  END IF;
  IF duplicado IS NOT NULL THEN
    IF duplicado IS DISTINCT FROM preservado THEN
      RAISE EXCEPTION 'Indices de fechamento divergentes; nenhuma exclusao autorizada';
    END IF;
    DROP INDEX erp.fechamentos_periodos_ativo_unico_idx;
  END IF;
END;
$$;

COMMIT;

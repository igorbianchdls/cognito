BEGIN;

CREATE OR REPLACE FUNCTION erp.validar_periodo_operacional_aberto()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  data_operacao date;
  modulo_operacao text;
  payload jsonb := to_jsonb(NEW);
BEGIN
  modulo_operacao := CASE
    WHEN TG_TABLE_NAME IN ('pagamentos', 'transferencias_financeiras', 'transacoes_bancarias') THEN 'financeiro'
    WHEN TG_TABLE_NAME IN ('movimentacoes_estoque', 'inventarios', 'transferencias_estoque') THEN 'estoque'
    WHEN TG_TABLE_NAME = 'vendas' THEN 'vendas'
    WHEN TG_TABLE_NAME = 'compras' THEN 'compras'
    ELSE 'todos'
  END;

  data_operacao := COALESCE(
    (payload ->> 'data_pagamento')::date,
    (payload ->> 'data_transferencia')::date,
    (payload ->> 'data_transacao')::date,
    (payload ->> 'data_inventario')::date,
    (payload ->> 'data_venda')::date,
    (payload ->> 'data_compra')::date,
    (payload ->> 'ocorrido_em')::timestamptz::date,
    CURRENT_DATE
  );

  IF EXISTS (
    SELECT 1
    FROM erp.fechamentos_periodos
    WHERE tenant_id = NEW.tenant_id
      AND reaberto_em IS NULL
      AND modulo IN (modulo_operacao, 'todos')
      AND data_operacao BETWEEN periodo_inicio AND periodo_fim
  ) THEN
    RAISE EXCEPTION 'Periodo fechado para o modulo % na data %', modulo_operacao, data_operacao;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'pagamentos', 'transferencias_financeiras', 'transacoes_bancarias',
    'movimentacoes_estoque', 'inventarios', 'transferencias_estoque', 'vendas', 'compras'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS validar_periodo_operacional_aberto ON erp.%I', tabela);
    EXECUTE format(
      'CREATE TRIGGER validar_periodo_operacional_aberto BEFORE INSERT OR UPDATE ON erp.%I FOR EACH ROW EXECUTE FUNCTION erp.validar_periodo_operacional_aberto()',
      tabela
    );
  END LOOP;
END $$;

REVOKE INSERT, UPDATE, DELETE ON erp.saldos_estoque, erp.movimentacoes_estoque,
  erp.reservas_estoque, erp.documentos_estoque, erp.documentos_estoque_itens,
  erp.inventarios_itens, erp.transferencias_estoque_itens,
  erp.conciliacoes_bancarias_itens, erp.contratos_vendas_geracoes,
  erp.importacoes_dados_linhas FROM authenticated;

GRANT SELECT ON erp.saldos_estoque, erp.movimentacoes_estoque,
  erp.reservas_estoque, erp.documentos_estoque, erp.documentos_estoque_itens,
  erp.inventarios_itens, erp.transferencias_estoque_itens,
  erp.conciliacoes_bancarias_itens, erp.contratos_vendas_geracoes,
  erp.importacoes_dados_linhas TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON erp.saldos_estoque, erp.movimentacoes_estoque,
  erp.reservas_estoque, erp.documentos_estoque, erp.documentos_estoque_itens,
  erp.inventarios_itens, erp.transferencias_estoque_itens,
  erp.conciliacoes_bancarias_itens, erp.contratos_vendas_geracoes,
  erp.importacoes_dados_linhas TO service_role;

COMMIT;

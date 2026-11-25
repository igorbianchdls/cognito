-- GE-01 (src/products/erp/regras/geral.md): "hoje" e datas de eventos no fuso da empresa, nunca em UTC.
-- O bloqueio de período fechado do estoque usava CURRENT_DATE (UTC) como fallback e convertia ocorrido_em
-- para data no fuso da sessão; entre 21h e meia-noite em São Paulo caía no dia seguinte.
CREATE OR REPLACE FUNCTION erp.validar_periodo_operacional_aberto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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

  data_operacao := COALESCE((payload ->> 'data_operacional')::date,
    (payload ->> 'data_pagamento')::date,
    (payload ->> 'data_transferencia')::date,
    (payload ->> 'data_transacao')::date,
    (payload ->> 'data_inventario')::date,
    (payload ->> 'data_venda')::date,
    (payload ->> 'data_compra')::date,
    ((payload ->> 'ocorrido_em')::timestamptz AT TIME ZONE coalesce(nullif(current_setting('app.erp_time_zone', true), ''), 'America/Sao_Paulo'))::date,
    erp.hoje()
  );

  IF EXISTS (
    SELECT 1
    FROM erp.fechamentos_periodos
    WHERE empresa_id = NEW.empresa_id
      AND reaberto_em IS NULL
      AND modulo IN (modulo_operacao, 'todos')
      AND data_operacao BETWEEN periodo_inicio AND periodo_fim
  ) THEN
    RAISE EXCEPTION 'Periodo fechado para o modulo % na data %', modulo_operacao, data_operacao;
  END IF;

  RETURN NEW;
END;
$function$;

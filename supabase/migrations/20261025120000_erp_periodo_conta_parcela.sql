-- Conta e forma de pagamento previstas na parcela são logística da baixa, como o vencimento.
-- Pagar hoje, por outra conta, uma parcela de competência fechada não altera a obrigação.
DO $$
DECLARE
  definition text;
  anchor constant text := $s$  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME IN ('contas_receber_parcelas','contas_pagar_parcelas')$s$;
  logistics constant text := $s$  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME IN ('contas_receber_parcelas','contas_pagar_parcelas')
    AND anterior->>'status' <> 'cancelado' AND posterior->>'status' <> 'cancelado'
    AND (anterior - ARRAY['atualizado_em','atualizado_por','conta_financeira_id','metodo_pagamento_id'])
      = (posterior - ARRAY['atualizado_em','atualizado_por','conta_financeira_id','metodo_pagamento_id']) THEN
    RETURN NEW;
  END IF;
$s$;
BEGIN
  SELECT pg_get_functiondef('erp.validar_periodo_comercial_financeiro()'::regprocedure) INTO definition;
  IF position(anchor IN definition) = 0 THEN
    RAISE EXCEPTION 'Trecho esperado não encontrado em erp.validar_periodo_comercial_financeiro';
  END IF;
  IF position('conta_financeira_id' IN definition) = 0 THEN
    EXECUTE replace(definition, anchor, logistics || anchor);
  END IF;
END;
$$;

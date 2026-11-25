-- Etapa 9 (regras do ERP, banco.md BD-41 e BD-42): decisões que o servidor já toma saem do banco.
-- BD-41: a permissão de financeiro para reduzir a provisão de comissão fica em regras/contas-pagar.ts (CPG-07);
--        o banco mantém o formato do ajuste e a conferência provisão × título.
-- BD-42: a ordem de conversão (VD-09), "só venda gera a receber" (VD-08) e "só compra efetiva gera a pagar" (CP-13)
--        ficam em regras/; o banco mantém identidade, cliente/fornecedor e origem preservados.
-- Mensagens reescritas.

CREATE OR REPLACE FUNCTION erp.proteger_conta_comercial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE empresa bigint; titulo bigint; vinculado boolean; antes jsonb; depois jsonb; esperado numeric; soma numeric; ajuste boolean;
BEGIN
 empresa := CASE WHEN TG_OP='INSERT' THEN NEW.empresa_id ELSE OLD.empresa_id END;
 IF TG_TABLE_NAME='contas_pagar' THEN titulo:=OLD.id;
 ELSE titulo:=CASE WHEN TG_OP='INSERT' THEN NEW.conta_pagar_id ELSE OLD.conta_pagar_id END; END IF;
 SELECT EXISTS(SELECT 1 FROM erp.comissoes_pagamentos c WHERE c.empresa_id=empresa AND c.conta_pagar_id=titulo)
     OR EXISTS(SELECT 1 FROM erp.devolucoes d WHERE d.empresa_id=empresa AND d.conta_pagar_id=titulo) INTO vinculado;
 IF vinculado THEN
   IF TG_OP IN ('DELETE','INSERT') THEN
     RAISE EXCEPTION 'Este título é de comissão ou reembolso: ele só muda pela venda ou devolução de origem.' USING ERRCODE='23514';
   END IF;
   antes:=to_jsonb(OLD); depois:=to_jsonb(NEW);
   SELECT coalesce(sum(c.valor-c.valor_ajustado),0),coalesce(bool_or(c.valor_ajustado>0),false)
   INTO esperado,ajuste FROM erp.comissoes_pagamentos c WHERE c.empresa_id=empresa AND c.conta_pagar_id=titulo;
   IF ajuste
      AND NOT EXISTS(SELECT 1 FROM erp.devolucoes d WHERE d.empresa_id=empresa AND d.conta_pagar_id=titulo)
      AND antes->>'status' IN ('aberto','vencido') THEN
     IF TG_TABLE_NAME='contas_pagar' THEN
       IF (antes-ARRAY['valor_total','status','cancelado_em','motivo_cancelamento','atualizado_em','atualizado_por']) = (depois-ARRAY['valor_total','status','cancelado_em','motivo_cancelamento','atualizado_em','atualizado_por'])
          AND ((esperado>0 AND NEW.valor_total=esperado AND NEW.status=OLD.status) OR (esperado=0 AND NEW.valor_total=OLD.valor_total AND NEW.status='cancelado')) THEN RETURN NEW; END IF;
     ELSE
       SELECT coalesce(sum(p.valor),0) INTO soma FROM erp.contas_pagar_parcelas p WHERE p.empresa_id=empresa AND p.conta_pagar_id=titulo AND p.id<>OLD.id AND p.excluido_em IS NULL AND p.status<>'cancelado';
       IF (antes-ARRAY['valor','valor_bruto','valor_liquido','status','atualizado_em','atualizado_por']) = (depois-ARRAY['valor','valor_bruto','valor_liquido','status','atualizado_em','atualizado_por'])
         AND NEW.valor<=OLD.valor AND NEW.valor_bruto<=OLD.valor_bruto AND NEW.valor_liquido<=OLD.valor_liquido
         AND (NEW.status=OLD.status OR (NEW.status='cancelado' AND NEW.valor=OLD.valor))
         AND soma+(CASE WHEN NEW.status='cancelado' THEN 0 ELSE NEW.valor END)>=esperado THEN RETURN NEW; END IF;
     END IF;
   END IF;
   IF (depois->>'status'='cancelado' AND antes->>'status' IS DISTINCT FROM 'cancelado')
      OR (depois->>'excluido_em' IS DISTINCT FROM antes->>'excluido_em')
      OR (antes - ARRAY['status','valor_pago','data_pagamento','conta_financeira_id','metodo_pagamento_id','atualizado_em','atualizado_por'] IS DISTINCT FROM depois - ARRAY['status','valor_pago','data_pagamento','conta_financeira_id','metodo_pagamento_id','atualizado_em','atualizado_por']) THEN
     RAISE EXCEPTION 'Este título é de comissão ou reembolso: nele só se registram baixas e estornos.' USING ERRCODE='23514';
   END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_provisao_comissao_ajustada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE empresa bigint; titulo bigint; esperado numeric; total numeric; parcelas numeric; estado text;
BEGIN
 empresa:=NEW.empresa_id;
 IF TG_TABLE_NAME='contas_pagar' THEN titulo:=NEW.id;
 ELSIF TG_TABLE_NAME='contas_pagar_parcelas' THEN titulo:=NEW.conta_pagar_id;
 ELSE titulo:=NEW.conta_pagar_id; END IF;
 IF EXISTS(SELECT 1 FROM erp.comissoes_pagamentos c WHERE c.empresa_id=empresa AND c.conta_pagar_id=titulo AND c.valor_ajustado>0) THEN
  SELECT sum(c.valor-c.valor_ajustado) INTO esperado FROM erp.comissoes_pagamentos c WHERE c.empresa_id=empresa AND c.conta_pagar_id=titulo;
  SELECT c.valor_total,c.status INTO total,estado FROM erp.contas_pagar c WHERE c.empresa_id=empresa AND c.id=titulo;
  SELECT coalesce(sum(p.valor),0) INTO parcelas FROM erp.contas_pagar_parcelas p WHERE p.empresa_id=empresa AND p.conta_pagar_id=titulo AND p.excluido_em IS NULL AND p.status<>'cancelado';
  IF parcelas<>esperado OR (esperado=0 AND estado<>'cancelado') OR (esperado>0 AND (total<>esperado OR estado='cancelado')) THEN
   RAISE EXCEPTION 'A provisão de comissão ajustada não confere com o título a pagar.' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_origem_comercial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v erp.vendas; compra erp.compras; j jsonb; ligado bigint; chave text;
BEGIN
 PERFORM erp.travar_evolucao(NEW.empresa_id);
 j:=to_jsonb(NEW);
 IF TG_OP='UPDATE' THEN
  IF OLD.id<>NEW.id OR OLD.empresa_id<>NEW.empresa_id THEN RAISE EXCEPTION 'A identificação do documento não pode mudar.' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME='compras' AND (to_jsonb(OLD)->'fornecedor_id') IS DISTINCT FROM (j->'fornecedor_id') THEN RAISE EXCEPTION 'O fornecedor da compra não pode mudar.' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME='vendas' AND (to_jsonb(OLD)->'tipo_documento') IS DISTINCT FROM (j->'tipo_documento') THEN RAISE EXCEPTION 'Para converter, gere um novo documento ligado a este.' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME IN ('contas_receber','contas_pagar') AND (
   (to_jsonb(OLD)->>'venda_id' IS NOT NULL AND to_jsonb(OLD)->'venda_id' IS DISTINCT FROM j->'venda_id') OR
   (to_jsonb(OLD)->>'compra_id' IS NOT NULL AND to_jsonb(OLD)->'compra_id' IS DISTINCT FROM j->'compra_id')) THEN RAISE EXCEPTION 'A venda ou compra de origem do título não pode mudar.' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME='ordens_servico' THEN
  FOREACH chave IN ARRAY ARRAY['venda_id','orcamento_id'] LOOP
   ligado:=(j->>chave)::bigint;
   IF ligado IS NOT NULL THEN
    SELECT * INTO v FROM erp.vendas WHERE empresa_id=NEW.empresa_id AND id=ligado;
    IF v.id IS NULL OR v.cliente_id<>NEW.cliente_id OR v.tipo_documento<>(CASE WHEN chave='venda_id' THEN 'venda' ELSE 'orcamento' END) THEN
     RAISE EXCEPTION 'A venda ou o orçamento da OS precisa ser do mesmo cliente.' USING ERRCODE='23514'; END IF;
   END IF;
  END LOOP;
 ELSIF TG_TABLE_NAME IN ('vendas','contas_receber') THEN
  ligado:=(j->>CASE WHEN TG_TABLE_NAME='vendas' THEN 'venda_origem_id' ELSE 'venda_id' END)::bigint;
  IF ligado IS NOT NULL THEN
   SELECT * INTO v FROM erp.vendas WHERE empresa_id=NEW.empresa_id AND id=ligado;
   IF v.id IS NULL OR v.cliente_id<>NEW.cliente_id THEN RAISE EXCEPTION 'O documento precisa ser do mesmo cliente do documento de origem.' USING ERRCODE='23514'; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='contas_pagar' AND j->>'compra_id' IS NOT NULL THEN
  SELECT * INTO compra FROM erp.compras WHERE empresa_id=NEW.empresa_id AND id=NEW.compra_id;
  IF compra.id IS NULL OR compra.fornecedor_id<>NEW.fornecedor_id THEN
   RAISE EXCEPTION 'O fornecedor do título precisa ser o da compra de origem.' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $function$;

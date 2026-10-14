BEGIN;
CREATE OR REPLACE FUNCTION erp.proteger_conta_comercial() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE empresa bigint; titulo bigint; vinculado boolean; antes jsonb; depois jsonb; esperado numeric; soma numeric; ajuste boolean;
BEGIN
 empresa := CASE WHEN TG_OP='INSERT' THEN NEW.empresa_id ELSE OLD.empresa_id END;
 IF TG_TABLE_NAME='contas_pagar' THEN titulo:=OLD.id;
 ELSE titulo:=CASE WHEN TG_OP='INSERT' THEN NEW.conta_pagar_id ELSE OLD.conta_pagar_id END; END IF;
 SELECT EXISTS(SELECT 1 FROM erp.comissoes_pagamentos c WHERE c.empresa_id=empresa AND c.conta_pagar_id=titulo)
     OR EXISTS(SELECT 1 FROM erp.devolucoes d WHERE d.empresa_id=empresa AND d.conta_pagar_id=titulo) INTO vinculado;
 IF vinculado THEN
   IF TG_OP IN ('DELETE','INSERT') THEN
     RAISE EXCEPTION 'Conta vinculada a comissão ou reembolso: preserve o documento de origem' USING ERRCODE='23514';
   END IF;
   antes:=to_jsonb(OLD); depois:=to_jsonb(NEW);
   SELECT coalesce(sum(c.valor-c.valor_ajustado),0),coalesce(bool_or(c.valor_ajustado>0),false)
   INTO esperado,ajuste FROM erp.comissoes_pagamentos c WHERE c.empresa_id=empresa AND c.conta_pagar_id=titulo;
   IF ajuste AND shared.has_erp_capability(empresa,'erp.financeiro.gerenciar')
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
     RAISE EXCEPTION 'Conta vinculada a comissão ou reembolso: apenas baixas e estornos financeiros são permitidos' USING ERRCODE='23514';
   END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;

CREATE FUNCTION erp.validar_provisao_comissao_ajustada() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
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
   RAISE EXCEPTION 'Provisão de comissão ajustada não corresponde ao financeiro' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION erp.validar_provisao_comissao_ajustada() FROM PUBLIC;
CREATE CONSTRAINT TRIGGER validar_provisao_comissao_ajustada AFTER UPDATE ON erp.contas_pagar DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_provisao_comissao_ajustada();
CREATE CONSTRAINT TRIGGER validar_provisao_comissao_ajustada AFTER UPDATE ON erp.contas_pagar_parcelas DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_provisao_comissao_ajustada();
CREATE CONSTRAINT TRIGGER validar_provisao_comissao_ajustada AFTER UPDATE ON erp.comissoes_pagamentos DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_provisao_comissao_ajustada();
COMMIT;

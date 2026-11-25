-- Etapa 6 (regras do ERP, banco.md grupo 1): decisões que já estão no servidor saem do banco.
-- BD-30 validar_conversao_proposta → regras/vendas.ts validarConversaoOrcamento (VD-01, VD-02), chamada na conversão e ao criar venda com origem.
-- BD-32 validar_vinculos_os → garantido pela conversão de OS (erpProfessionalRepository.convertServiceOrder: a venda de OS com orçamento sai do orçamento).
-- BD-31 efetivacao_receber/pagar → fica só o fato: título já utilizado (pagamento, adiantamento, renegociação) não volta a previsão.
--        "Efetivado não volta" e "venda não gera previsão" ficam em regras/contas-receber.ts validarPrevisao (CR-09).

DROP TRIGGER IF EXISTS validar_conversao_proposta ON erp.vendas;
DROP FUNCTION IF EXISTS erp.validar_conversao_proposta();

DROP TRIGGER IF EXISTS validar_vinculos_os ON erp.ordens_servico;
DROP FUNCTION IF EXISTS erp.validar_vinculos_os();

CREATE OR REPLACE FUNCTION erp.efetivacao_receber()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  PERFORM erp.travar_evolucao(NEW.empresa_id);
  IF TG_OP = 'UPDATE' AND OLD.tipo_lancamento = 'previsao' AND NEW.tipo_lancamento = 'efetivo' THEN NEW.efetivado_em := now(); END IF;
  IF NEW.tipo_lancamento = 'previsao' AND TG_OP = 'UPDATE' AND EXISTS (
    SELECT 1 FROM erp.contas_receber_parcelas p WHERE p.empresa_id = NEW.empresa_id AND p.conta_receber_id = NEW.id AND (
      EXISTS (SELECT 1 FROM erp.pagamentos m WHERE m.empresa_id = p.empresa_id AND m.conta_receber_parcela_id = p.id)
      OR EXISTS (SELECT 1 FROM erp.adiantamentos_aplicacoes a WHERE a.empresa_id = p.empresa_id AND a.conta_receber_parcela_id = p.id)
      OR EXISTS (SELECT 1 FROM erp.renegociacoes_parcelas r WHERE r.empresa_id = p.empresa_id AND r.conta_receber_parcela_id = p.id))) THEN
    RAISE EXCEPTION 'Título já utilizado (recebimento, adiantamento ou renegociação) não pode voltar a previsão.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.efetivacao_pagar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  PERFORM erp.travar_evolucao(NEW.empresa_id);
  IF TG_OP = 'UPDATE' AND OLD.tipo_lancamento = 'previsao' AND NEW.tipo_lancamento = 'efetivo' THEN NEW.efetivado_em := now(); END IF;
  IF NEW.tipo_lancamento = 'previsao' AND TG_OP = 'UPDATE' AND EXISTS (
    SELECT 1 FROM erp.contas_pagar_parcelas p WHERE p.empresa_id = NEW.empresa_id AND p.conta_pagar_id = NEW.id AND (
      EXISTS (SELECT 1 FROM erp.pagamentos m WHERE m.empresa_id = p.empresa_id AND m.conta_pagar_parcela_id = p.id)
      OR EXISTS (SELECT 1 FROM erp.adiantamentos_aplicacoes a WHERE a.empresa_id = p.empresa_id AND a.conta_pagar_parcela_id = p.id)
      OR EXISTS (SELECT 1 FROM erp.renegociacoes_parcelas r WHERE r.empresa_id = p.empresa_id AND r.conta_pagar_parcela_id = p.id))) THEN
    RAISE EXCEPTION 'Título já utilizado (pagamento, adiantamento ou renegociação) não pode voltar a previsão.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $function$;

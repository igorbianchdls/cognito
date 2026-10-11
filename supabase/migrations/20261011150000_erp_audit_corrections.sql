-- Corre��es confirmadas na revis�o do ERP de 11/10/2026.
BEGIN;
CREATE OR REPLACE FUNCTION erp.proximo_numero(empresa_id bigint, tipo text, data date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
#variable_conflict use_column
DECLARE
  v_empresa bigint := proximo_numero.empresa_id;
  v_tipo text := proximo_numero.tipo;
  v_ano integer := extract(year FROM coalesce(proximo_numero.data, erp.hoje()))::integer;
  v_prefixo text; v_tabela text; v_numero text; v_n bigint; v_existe boolean;
BEGIN
  IF shared.erp_empresa_contexto() IS NOT NULL AND (v_empresa IS DISTINCT FROM shared.erp_empresa_contexto() OR NOT shared.is_tenant_member(v_empresa)) THEN
    RAISE EXCEPTION 'Numeração fora da empresa da sessão' USING ERRCODE='42501';
  END IF;
  SELECT x.prefixo, x.tabela INTO v_prefixo, v_tabela FROM (VALUES
    ('venda','VEN','vendas'),('orcamento','ORC','vendas'),('pedido','PED','vendas'),('compra','COM','compras'),
    ('ordem_servico','OS','ordens_servico'),('contrato','CTR','contratos_vendas'),('inventario','INV','inventarios'),
    ('transferencia_estoque','TRF','transferencias_estoque'),('devolucao','DEV','devolucoes')) AS x(tipo, prefixo, tabela)
  WHERE x.tipo = v_tipo;
  IF v_prefixo IS NULL THEN RAISE EXCEPTION 'Tipo de numeração inválido' USING ERRCODE='22023'; END IF;
  LOOP
    INSERT INTO erp.numeracoes AS n (empresa_id, tipo, ano, proximo) VALUES (v_empresa, v_tipo, v_ano, 2)
    ON CONFLICT (empresa_id, tipo, ano) DO UPDATE SET proximo = n.proximo + 1, atualizado_em = now()
    RETURNING n.proximo - 1 INTO v_n;
    v_numero := format('%s-%s-%s', v_prefixo, v_ano, lpad(v_n::text, greatest(4, length(v_n::text)), '0'));
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM erp.%I WHERE empresa_id=$1 AND numero=$2)', v_tabela) INTO v_existe USING v_empresa, v_numero;
    EXIT WHEN NOT v_existe;
  END LOOP;
  RETURN v_numero;
END
$function$;

ALTER TABLE erp.devolucoes ADD COLUMN request_hash text CHECK (request_hash ~ '^[0-9a-f]{64}$');
ALTER TABLE erp.comissoes_pagamentos ADD COLUMN request_hash text CHECK (request_hash ~ '^[0-9a-f]{64}$');
ALTER TABLE erp.pagamentos ADD COLUMN request_hash text CHECK (request_hash ~ '^[0-9a-f]{64}$');

CREATE FUNCTION erp.preservar_assinatura_comercial() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.request_hash IS DISTINCT FROM OLD.request_hash THEN
   RAISE EXCEPTION 'A assinatura da solicitação original é imutável' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER preservar_assinatura_comercial BEFORE UPDATE ON erp.devolucoes FOR EACH ROW EXECUTE FUNCTION erp.preservar_assinatura_comercial();
CREATE TRIGGER preservar_assinatura_comercial BEFORE UPDATE ON erp.comissoes_pagamentos FOR EACH ROW EXECUTE FUNCTION erp.preservar_assinatura_comercial();
CREATE TRIGGER preservar_assinatura_comercial BEFORE UPDATE ON erp.pagamentos FOR EACH ROW EXECUTE FUNCTION erp.preservar_assinatura_comercial();

-- SECURITY DEFINER makes the origin check independent of the caller's sales visibility.
-- Settlement caches and status transitions still belong to the financial ledger.
CREATE FUNCTION erp.proteger_conta_comercial() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE empresa bigint; titulo bigint; vinculado boolean; antes jsonb; depois jsonb;
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
   IF (depois->>'status'='cancelado' AND antes->>'status' IS DISTINCT FROM 'cancelado')
      OR (depois->>'excluido_em' IS DISTINCT FROM antes->>'excluido_em')
      OR (antes - ARRAY['status','valor_pago','data_pagamento','conta_financeira_id','metodo_pagamento_id','atualizado_em','atualizado_por'] IS DISTINCT FROM depois - ARRAY['status','valor_pago','data_pagamento','conta_financeira_id','metodo_pagamento_id','atualizado_em','atualizado_por']) THEN
     RAISE EXCEPTION 'Conta vinculada a comissão ou reembolso: apenas baixas e estornos financeiros são permitidos' USING ERRCODE='23514';
   END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
REVOKE ALL ON FUNCTION erp.proteger_conta_comercial() FROM PUBLIC;
CREATE TRIGGER proteger_conta_comercial BEFORE UPDATE OR DELETE ON erp.contas_pagar FOR EACH ROW EXECUTE FUNCTION erp.proteger_conta_comercial();
CREATE TRIGGER proteger_conta_comercial BEFORE INSERT OR UPDATE OR DELETE ON erp.contas_pagar_parcelas FOR EACH ROW EXECUTE FUNCTION erp.proteger_conta_comercial();
COMMIT;

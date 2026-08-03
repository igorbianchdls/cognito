BEGIN;

CREATE OR REPLACE FUNCTION erp.validar_fechamento_compra(p_tenant_id bigint, p_compra_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  documento erp.compras%ROWTYPE;
  total_itens numeric(18,2);
  total_parcelas numeric(18,2);
BEGIN
  SELECT * INTO documento
  FROM erp.compras
  WHERE tenant_id = p_tenant_id AND id = p_compra_id AND excluido_em IS NULL;

  IF NOT FOUND OR documento.status = 'rascunho' OR documento.status = 'cancelada' THEN
    RETURN;
  END IF;

  SELECT COALESCE(sum(total), 0) INTO total_itens
  FROM erp.compras_itens
  WHERE tenant_id = p_tenant_id AND compra_id = p_compra_id AND excluido_em IS NULL;

  IF round(total_itens, 2) <> round(documento.subtotal, 2) THEN
    RAISE EXCEPTION 'Soma dos itens da compra (%) difere do subtotal (%)', total_itens, documento.subtotal;
  END IF;

  IF round(documento.subtotal - documento.desconto + documento.frete
      + documento.seguro + documento.outras_despesas - documento.impostos_retidos
      + documento.impostos_adicionais, 2) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'Composicao do total da compra invalida';
  END IF;

  SELECT COALESCE(sum(valor), 0) INTO total_parcelas
  FROM erp.compras_parcelas_previstas
  WHERE tenant_id = p_tenant_id AND compra_id = p_compra_id AND excluido_em IS NULL;

  IF round(total_parcelas, 2) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'Soma das parcelas da compra (%) difere do total (%)', total_parcelas, documento.total;
  END IF;
END;
$$;

COMMIT;

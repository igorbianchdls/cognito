BEGIN;

ALTER TABLE erp.vendas
  ADD COLUMN IF NOT EXISTS chave_idempotencia text,
  ADD COLUMN IF NOT EXISTS versao integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vendas_chave_idempotencia_chk'
      AND conrelid = 'erp.vendas'::regclass
  ) THEN
    ALTER TABLE erp.vendas
      ADD CONSTRAINT vendas_chave_idempotencia_chk
      CHECK (chave_idempotencia IS NULL OR btrim(chave_idempotencia) <> '');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vendas_versao_chk'
      AND conrelid = 'erp.vendas'::regclass
  ) THEN
    ALTER TABLE erp.vendas
      ADD CONSTRAINT vendas_versao_chk CHECK (versao > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notas_fiscais_saida_ref_focus_chk'
      AND conrelid = 'erp.notas_fiscais'::regclass
  ) THEN
    ALTER TABLE erp.notas_fiscais
      ADD CONSTRAINT notas_fiscais_saida_ref_focus_chk
      CHECK (direcao <> 'saida' OR (ref_focus IS NOT NULL AND btrim(ref_focus) <> ''));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS vendas_chave_idempotencia_unica_idx
  ON erp.vendas (tenant_id, chave_idempotencia)
  WHERE chave_idempotencia IS NOT NULL AND excluido_em IS NULL;

CREATE OR REPLACE FUNCTION erp.validar_fechamento_venda(p_tenant_id bigint, p_venda_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  documento erp.vendas%ROWTYPE;
  total_itens numeric(18,2);
  total_parcelas numeric(18,2);
BEGIN
  SELECT * INTO documento
  FROM erp.vendas
  WHERE tenant_id = p_tenant_id AND id = p_venda_id AND excluido_em IS NULL;

  IF NOT FOUND OR documento.status = 'rascunho' OR documento.status = 'cancelada' THEN
    RETURN;
  END IF;

  SELECT COALESCE(sum(total), 0) INTO total_itens
  FROM erp.vendas_itens
  WHERE tenant_id = p_tenant_id AND venda_id = p_venda_id AND excluido_em IS NULL;

  IF round(total_itens, 2) <> round(documento.subtotal, 2) THEN
    RAISE EXCEPTION 'Soma dos itens da venda (%) difere do subtotal (%)', total_itens, documento.subtotal;
  END IF;

  IF round(documento.subtotal - documento.desconto + documento.frete, 2) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'Composicao do total da venda invalida';
  END IF;

  SELECT COALESCE(sum(valor), 0) INTO total_parcelas
  FROM erp.vendas_recebimentos_previstos
  WHERE tenant_id = p_tenant_id AND venda_id = p_venda_id AND excluido_em IS NULL;

  IF round(total_parcelas, 2) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'Soma das parcelas da venda (%) difere do total (%)', total_parcelas, documento.total;
  END IF;
END;
$$;

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

  IF NOT FOUND OR documento.tipo_movimento IN ('cotacao', 'cancelada') THEN
    RETURN;
  END IF;

  SELECT COALESCE(sum(total), 0) INTO total_itens
  FROM erp.compras_itens
  WHERE tenant_id = p_tenant_id AND compra_id = p_compra_id AND excluido_em IS NULL;

  IF round(total_itens, 2) <> round(documento.subtotal, 2) THEN
    RAISE EXCEPTION 'Soma dos itens da compra (%) difere do subtotal (%)', total_itens, documento.subtotal;
  END IF;

  IF round(
    documento.subtotal - documento.desconto + documento.frete + documento.seguro
      + documento.outras_despesas - documento.impostos_retidos,
    2
  ) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'Composicao do total da compra invalida';
  END IF;

  IF documento.gera_financeiro AND documento.total > 0 THEN
    SELECT COALESCE(sum(valor), 0) INTO total_parcelas
    FROM erp.compras_parcelas_previstas
    WHERE tenant_id = p_tenant_id AND compra_id = p_compra_id AND excluido_em IS NULL;

    IF round(total_parcelas, 2) <> round(documento.total, 2) THEN
      RAISE EXCEPTION 'Soma das parcelas da compra (%) difere do total (%)', total_parcelas, documento.total;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION erp.validar_fechamento_financeiro(p_tenant_id bigint, p_conta_id bigint, p_tipo text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  total_cabecalho numeric(18,2);
  total_parcelas numeric(18,2);
BEGIN
  IF p_tipo = 'receber' THEN
    SELECT valor_total INTO total_cabecalho
    FROM erp.contas_receber
    WHERE tenant_id = p_tenant_id AND id = p_conta_id AND excluido_em IS NULL;

    SELECT COALESCE(sum(valor), 0) INTO total_parcelas
    FROM erp.contas_receber_parcelas
    WHERE tenant_id = p_tenant_id AND conta_receber_id = p_conta_id AND excluido_em IS NULL;
  ELSE
    SELECT valor_total INTO total_cabecalho
    FROM erp.contas_pagar
    WHERE tenant_id = p_tenant_id AND id = p_conta_id AND excluido_em IS NULL;

    SELECT COALESCE(sum(valor), 0) INTO total_parcelas
    FROM erp.contas_pagar_parcelas
    WHERE tenant_id = p_tenant_id AND conta_pagar_id = p_conta_id AND excluido_em IS NULL;
  END IF;

  IF total_cabecalho IS NOT NULL AND round(total_cabecalho, 2) <> round(total_parcelas, 2) THEN
    RAISE EXCEPTION 'Soma das parcelas (%) difere do total financeiro (%)', total_parcelas, total_cabecalho;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION erp.validar_documento_diferido()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  tenant bigint := COALESCE(NEW.tenant_id, OLD.tenant_id);
  documento_id bigint;
BEGIN
  IF TG_TABLE_NAME = 'vendas' THEN
    PERFORM erp.validar_fechamento_venda(tenant, COALESCE(NEW.id, OLD.id));
  ELSIF TG_TABLE_NAME = 'vendas_itens' THEN
    PERFORM erp.validar_fechamento_venda(tenant, COALESCE(NEW.venda_id, OLD.venda_id));
  ELSIF TG_TABLE_NAME = 'vendas_recebimentos_previstos' THEN
    PERFORM erp.validar_fechamento_venda(tenant, COALESCE(NEW.venda_id, OLD.venda_id));
  ELSIF TG_TABLE_NAME = 'compras' THEN
    PERFORM erp.validar_fechamento_compra(tenant, COALESCE(NEW.id, OLD.id));
  ELSIF TG_TABLE_NAME = 'compras_itens' THEN
    PERFORM erp.validar_fechamento_compra(tenant, COALESCE(NEW.compra_id, OLD.compra_id));
  ELSIF TG_TABLE_NAME = 'compras_parcelas_previstas' THEN
    PERFORM erp.validar_fechamento_compra(tenant, COALESCE(NEW.compra_id, OLD.compra_id));
  ELSIF TG_TABLE_NAME = 'contas_receber' THEN
    PERFORM erp.validar_fechamento_financeiro(tenant, COALESCE(NEW.id, OLD.id), 'receber');
  ELSIF TG_TABLE_NAME = 'contas_receber_parcelas' THEN
    documento_id := COALESCE(NEW.conta_receber_id, OLD.conta_receber_id);
    PERFORM erp.validar_fechamento_financeiro(tenant, documento_id, 'receber');
  ELSIF TG_TABLE_NAME = 'contas_pagar' THEN
    PERFORM erp.validar_fechamento_financeiro(tenant, COALESCE(NEW.id, OLD.id), 'pagar');
  ELSIF TG_TABLE_NAME = 'contas_pagar_parcelas' THEN
    documento_id := COALESCE(NEW.conta_pagar_id, OLD.conta_pagar_id);
    PERFORM erp.validar_fechamento_financeiro(tenant, documento_id, 'pagar');
  END IF;
  RETURN NULL;
END;
$$;

DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'vendas', 'vendas_itens', 'vendas_recebimentos_previstos',
    'compras', 'compras_itens', 'compras_parcelas_previstas',
    'contas_receber', 'contas_receber_parcelas',
    'contas_pagar', 'contas_pagar_parcelas'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS validar_documento_diferido ON erp.%I', tabela);
    EXECUTE format(
      'CREATE CONSTRAINT TRIGGER validar_documento_diferido AFTER INSERT OR UPDATE OR DELETE ON erp.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_documento_diferido()',
      tabela
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION erp.bloquear_mutacao_evento()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Historico de eventos e imutavel';
END;
$$;

DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'compras_eventos', 'contas_pagar_eventos', 'notas_fiscais_eventos', 'cobrancas_eventos'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS bloquear_mutacao_evento ON erp.%I', tabela);
    EXECUTE format(
      'CREATE TRIGGER bloquear_mutacao_evento BEFORE UPDATE OR DELETE ON erp.%I FOR EACH ROW EXECUTE FUNCTION erp.bloquear_mutacao_evento()',
      tabela
    );
    EXECUTE format('DROP POLICY IF EXISTS %I ON erp.%I', tabela || '_update_policy', tabela);
    EXECUTE format('DROP POLICY IF EXISTS %I ON erp.%I', tabela || '_delete_policy', tabela);
  END LOOP;
END $$;

ALTER TABLE erp.compras
  DROP CONSTRAINT IF EXISTS compras_responsavel_fk;

ALTER TABLE erp.compras
  ADD CONSTRAINT compras_responsavel_tenant_fk
  FOREIGN KEY (tenant_id, responsavel_id)
  REFERENCES shared.tenant_memberships (tenant_id, user_id)
  ON DELETE SET NULL (responsavel_id);

REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA erp FROM authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA erp TO authenticated;

COMMENT ON COLUMN erp.vendas.chave_idempotencia IS 'Chave de idempotencia para impedir vendas duplicadas em retries.';
COMMENT ON FUNCTION erp.validar_documento_diferido() IS 'Valida fechamento de itens e parcelas ao final da transacao.';
COMMENT ON FUNCTION erp.bloquear_mutacao_evento() IS 'Impede alteracao e exclusao de historicos operacionais.';

COMMIT;

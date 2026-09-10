-- Aplicado atomicamente; sem credenciais.
BEGIN;
-- Preparado para revisao. Nao aplicar automaticamente no Supabase.
-- Escopo: tabelas existentes; sem fiscal, estoque, novas tabelas ou views.

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


-- Preparado para revisao. Requer 01-integridade-historicos.sql.
-- Protege financeiro/comercial. A funcao antiga dos gatilhos de estoque e preservada.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

ALTER TABLE erp.fechamentos_periodos ADD COLUMN IF NOT EXISTS motivo_reabertura text;

-- Operacoes compartilham o bloqueio; fechar/reabrir exige exclusividade.
-- Nao esperar evita usar uma leitura anterior ao fechamento concorrente.
CREATE OR REPLACE FUNCTION erp.travar_periodo_empresa(p_tenant bigint, p_exclusivo boolean)
RETURNS void LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE obtido boolean;
BEGIN
  IF p_tenant IS NULL THEN
    RAISE EXCEPTION 'Empresa obrigatoria para validar periodo' USING ERRCODE = '23502';
  END IF;
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'Operacoes protegidas por periodo exigem READ COMMITTED'
      USING ERRCODE = '40001';
  END IF;
  IF p_exclusivo THEN
    obtido := pg_try_advisory_xact_lock(172942, hashint8(p_tenant));
  ELSE
    obtido := pg_try_advisory_xact_lock_shared(172942, hashint8(p_tenant));
  END IF;
  IF NOT obtido THEN
    RAISE EXCEPTION 'Fechamento ou operacao concorrente; repetir a transacao'
      USING ERRCODE = '40001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION erp.exigir_periodos_abertos(p_tenant bigint, p_modulo text, p_datas date[])
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE bloqueado date;
BEGIN
  SELECT d INTO bloqueado
  FROM unnest(p_datas) d
  WHERE d IS NOT NULL AND EXISTS (
    SELECT 1 FROM erp.fechamentos_periodos f
    WHERE f.tenant_id = p_tenant AND f.reaberto_em IS NULL
      AND f.modulo IN (p_modulo, 'todos')
      AND d BETWEEN f.periodo_inicio AND f.periodo_fim
  ) LIMIT 1;
  IF bloqueado IS NOT NULL THEN
    RAISE EXCEPTION 'Periodo fechado: modulo %, data %', p_modulo, bloqueado
      USING ERRCODE = '23514';
  END IF;
END;
$$;

-- Classificacao/valor de titulo afeta competencia e pagamentos ja registrados.
CREATE OR REPLACE FUNCTION erp.exigir_periodo_titulo_aberto(p_tenant bigint, p_id bigint, p_tipo text)
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE datas date[];
BEGIN
  IF p_tipo = 'receber' THEN
    SELECT ARRAY[COALESCE(data_competencia, data_emissao)] INTO datas
      FROM erp.contas_receber WHERE tenant_id = p_tenant AND id = p_id;
    PERFORM erp.exigir_periodos_abertos(p_tenant, 'financeiro', datas);
    SELECT array_agg(d) INTO datas
      FROM erp.pagamentos p
      JOIN erp.contas_receber_parcelas i ON i.tenant_id=p.tenant_id AND i.id=p.conta_receber_parcela_id
      CROSS JOIN LATERAL unnest(ARRAY[p.data_pagamento,p.data_credito]) d
      WHERE i.tenant_id=p_tenant AND i.conta_receber_id=p_id AND p.excluido_em IS NULL;
  ELSIF p_tipo = 'pagar' THEN
    SELECT ARRAY[COALESCE(data_competencia, data_emissao)] INTO datas
      FROM erp.contas_pagar WHERE tenant_id = p_tenant AND id = p_id;
    PERFORM erp.exigir_periodos_abertos(p_tenant, 'financeiro', datas);
    SELECT array_agg(d) INTO datas
      FROM erp.pagamentos p
      JOIN erp.contas_pagar_parcelas i ON i.tenant_id=p.tenant_id AND i.id=p.conta_pagar_parcela_id
      CROSS JOIN LATERAL unnest(ARRAY[p.data_pagamento,p.data_credito]) d
      WHERE i.tenant_id=p_tenant AND i.conta_pagar_id=p_id AND p.excluido_em IS NULL;
  ELSE
    RAISE EXCEPTION 'Tipo financeiro invalido' USING ERRCODE='23514';
  END IF;
  PERFORM erp.exigir_periodos_abertos(p_tenant, 'financeiro', datas);
END;
$$;

CREATE OR REPLACE FUNCTION erp.validar_periodo_comercial_financeiro()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE
  anterior jsonb;
  posterior jsonb;
  registro jsonb;
  registros jsonb[];
  pai jsonb;
  empresa bigint;
  tipo text;
  pai_id bigint;
  tabela_pai text;
  coluna_pai text;
  coluna_parcela text;
  pago numeric;
BEGIN
  IF TG_OP <> 'INSERT' THEN anterior := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN posterior := to_jsonb(NEW); END IF;
  empresa := COALESCE((posterior->>'tenant_id')::bigint,(anterior->>'tenant_id')::bigint);
  IF TG_OP = 'UPDATE' AND (anterior->>'tenant_id') IS DISTINCT FROM (posterior->>'tenant_id') THEN
    RAISE EXCEPTION 'Nao e permitido mudar a empresa do registro' USING ERRCODE='23514';
  END IF;
  PERFORM erp.travar_periodo_empresa(empresa, false);

  -- Status de recebimento e resumos podem evoluir ao pagar hoje uma divida antiga.
  -- Cancelamento, exclusao e alteracao da obrigacao continuam sujeitos ao fechamento.
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME IN ('contas_receber','contas_pagar')
    AND anterior->>'status' <> 'cancelado' AND posterior->>'status' <> 'cancelado'
    AND (anterior - ARRAY['atualizado_em','atualizado_por','status'])
      = (posterior - ARRAY['atualizado_em','atualizado_por','status']) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME IN ('contas_receber_parcelas','contas_pagar_parcelas')
    AND anterior->>'status' <> 'cancelado' AND posterior->>'status' <> 'cancelado'
    AND (anterior - ARRAY['atualizado_em','atualizado_por','status','valor_pago','data_pagamento'])
      = (posterior - ARRAY['atualizado_em','atualizado_por','status','valor_pago','data_pagamento']) THEN
    -- Nao permitir usar a excecao para inventar saldo pago sem pagamentos de origem.
    coluna_parcela := CASE WHEN TG_TABLE_NAME='contas_receber_parcelas'
      THEN 'conta_receber_parcela_id' ELSE 'conta_pagar_parcela_id' END;
    EXECUTE format('SELECT COALESCE(sum(valor),0) FROM erp.pagamentos
      WHERE tenant_id=$1 AND %I=$2 AND excluido_em IS NULL
        AND estornado_em IS NULL AND estorno_de_pagamento_id IS NULL', coluna_parcela)
      INTO pago USING empresa, (posterior->>'id')::bigint;
    IF (posterior->>'valor_pago')::numeric IS DISTINCT FROM pago THEN
      RAISE EXCEPTION 'Resumo de pagamento sem correspondencia nos pagamentos' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;

  registros := ARRAY[anterior,posterior];
  FOREACH registro IN ARRAY registros LOOP
    CONTINUE WHEN registro IS NULL;
    CASE TG_TABLE_NAME
      WHEN 'pagamentos' THEN
        PERFORM erp.exigir_periodos_abertos(empresa,'financeiro',
          ARRAY[(registro->>'data_pagamento')::date,(registro->>'data_credito')::date]);
      WHEN 'transferencias_financeiras' THEN
        PERFORM erp.exigir_periodos_abertos(empresa,'financeiro',ARRAY[(registro->>'data_transferencia')::date]);
      WHEN 'transacoes_bancarias' THEN
        PERFORM erp.exigir_periodos_abertos(empresa,'financeiro',
          ARRAY[(registro->>'data_transacao')::date,(registro->>'data_compensacao')::date]);
      WHEN 'contas_receber','contas_pagar' THEN
        tipo := CASE WHEN TG_TABLE_NAME='contas_receber' THEN 'receber' ELSE 'pagar' END;
        PERFORM erp.exigir_periodos_abertos(empresa,'financeiro',
          ARRAY[COALESCE((registro->>'data_competencia')::date,(registro->>'data_emissao')::date)]);
        PERFORM erp.exigir_periodo_titulo_aberto(empresa,(registro->>'id')::bigint,tipo);
      WHEN 'contas_receber_parcelas','contas_pagar_parcelas','rateios_financeiros' THEN
        tipo := CASE WHEN TG_TABLE_NAME='rateios_financeiros' THEN registro->>'tipo'
          WHEN TG_TABLE_NAME='contas_receber_parcelas' THEN 'receber' ELSE 'pagar' END;
        pai_id := CASE WHEN tipo='receber' THEN (registro->>'conta_receber_id')::bigint
          ELSE (registro->>'conta_pagar_id')::bigint END;
        PERFORM erp.exigir_periodo_titulo_aberto(empresa,pai_id,tipo);
      WHEN 'vendas','compras','vendas_itens','compras_itens','vendas_recebimentos_previstos','compras_parcelas_previstas' THEN
        tipo := CASE WHEN TG_TABLE_NAME IN ('vendas','vendas_itens','vendas_recebimentos_previstos')
          THEN 'vendas' ELSE 'compras' END;
        IF TG_TABLE_NAME IN ('vendas','compras') THEN
          pai := registro;
        ELSE
          tabela_pai := tipo;
          coluna_pai := CASE WHEN tipo='vendas' THEN 'venda_id' ELSE 'compra_id' END;
          EXECUTE format('SELECT to_jsonb(p) FROM erp.%I p WHERE tenant_id=$1 AND id=$2',tabela_pai)
            INTO pai USING empresa,(registro->>coluna_pai)::bigint;
        END IF;
        PERFORM erp.exigir_periodos_abertos(empresa,tipo,
          ARRAY[COALESCE((pai->>'data_venda')::date,(pai->>'data_compra')::date)]);
        -- A competencia do documento tambem e protegida pelo fechamento financeiro.
        PERFORM erp.exigir_periodos_abertos(empresa,'financeiro',
          ARRAY[COALESCE((pai->>'data_competencia')::date,(pai->>'data_venda')::date,(pai->>'data_compra')::date)]);
      ELSE
        RAISE EXCEPTION 'Tabela nao prevista na protecao de periodos: %', TG_TABLE_NAME;
    END CASE;
  END LOOP;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION erp.preservar_fechamento_comercial_financeiro()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE empresa bigint;
BEGIN
  -- Registros exclusivos de estoque permanecem com o comportamento anterior.
  IF TG_OP='INSERT' AND NEW.modulo='estoque' THEN RETURN NEW; END IF;
  IF TG_OP='DELETE' AND OLD.modulo='estoque' THEN RETURN OLD; END IF;
  IF TG_OP='UPDATE' AND OLD.modulo='estoque' AND NEW.modulo='estoque' THEN RETURN NEW; END IF;
  empresa := CASE WHEN TG_OP='DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END;
  PERFORM erp.travar_periodo_empresa(empresa,true);
  IF TG_OP='DELETE' THEN
    RAISE EXCEPTION 'Preserve o fechamento; registre uma reabertura' USING ERRCODE='23514';
  END IF;
  IF TG_OP='UPDATE' THEN
    IF (to_jsonb(OLD)-ARRAY['reaberto_em','reaberto_por','motivo_reabertura'])
      IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['reaberto_em','reaberto_por','motivo_reabertura']) THEN
      RAISE EXCEPTION 'Identidade e periodo do fechamento sao imutaveis' USING ERRCODE='23514';
    END IF;
    IF OLD.reaberto_em IS NOT NULL AND to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
      RAISE EXCEPTION 'Reabertura e imutavel; um novo fechamento exige outro registro' USING ERRCODE='23514';
    END IF;
  END IF;
  IF NEW.reaberto_em IS NOT NULL THEN
    IF NEW.reaberto_por IS NULL OR NULLIF(btrim(NEW.motivo_reabertura),'') IS NULL
      OR NEW.reaberto_em < NEW.fechado_em THEN
      RAISE EXCEPTION 'Reabertura exige autor, motivo e data posterior ao fechamento' USING ERRCODE='23514';
    END IF;
  ELSIF NEW.reaberto_por IS NOT NULL OR NEW.motivo_reabertura IS NOT NULL THEN
    RAISE EXCEPTION 'Dados de reabertura exigem a data da reabertura' USING ERRCODE='23514';
  END IF;
  IF NEW.reaberto_em IS NULL AND EXISTS (
    SELECT 1 FROM erp.fechamentos_periodos f
    WHERE f.tenant_id=NEW.tenant_id AND f.id<>NEW.id AND f.reaberto_em IS NULL
      AND f.modulo IN ('financeiro','vendas','compras','todos')
      AND (f.modulo=NEW.modulo OR f.modulo='todos' OR NEW.modulo='todos')
      AND f.periodo_inicio<=NEW.periodo_fim AND f.periodo_fim>=NEW.periodo_inicio
  ) THEN
    RAISE EXCEPTION 'Periodo ja coberto por fechamento ativo' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY['vendas','compras','vendas_itens','compras_itens',
    'vendas_recebimentos_previstos','compras_parcelas_previstas','contas_receber',
    'contas_pagar','contas_receber_parcelas','contas_pagar_parcelas','pagamentos',
    'transferencias_financeiras','transacoes_bancarias','rateios_financeiros'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS validar_periodo_operacional_aberto ON erp.%I',tabela);
    EXECUTE format('DROP TRIGGER IF EXISTS validar_periodo_comercial_financeiro ON erp.%I',tabela);
    EXECUTE format('CREATE TRIGGER validar_periodo_comercial_financeiro BEFORE INSERT OR UPDATE OR DELETE ON erp.%I
      FOR EACH ROW EXECUTE FUNCTION erp.validar_periodo_comercial_financeiro()',tabela);
  END LOOP;
END;
$$;
DROP TRIGGER IF EXISTS preservar_fechamento_comercial_financeiro ON erp.fechamentos_periodos;
CREATE TRIGGER preservar_fechamento_comercial_financeiro
  BEFORE INSERT OR UPDATE OR DELETE ON erp.fechamentos_periodos
  FOR EACH ROW EXECUTE FUNCTION erp.preservar_fechamento_comercial_financeiro();

REVOKE ALL ON FUNCTION erp.travar_periodo_empresa(bigint,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION erp.exigir_periodos_abertos(bigint,text,date[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION erp.exigir_periodo_titulo_aberto(bigint,bigint,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION erp.validar_periodo_comercial_financeiro() FROM PUBLIC;
REVOKE ALL ON FUNCTION erp.preservar_fechamento_comercial_financeiro() FROM PUBLIC;


COMMIT;

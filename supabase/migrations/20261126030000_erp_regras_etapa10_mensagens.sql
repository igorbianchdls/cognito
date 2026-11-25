-- Etapa 10 (regras do ERP, banco.md): mensagens das garantias que ficam no banco, em português claro e terminando
-- em ponto. A tela e o chat mostram ao usuário a mensagem do banco quando ela termina em ponto (erpErrors.ts →
-- mensagemDoBanco); mensagens internas (falha de programa) continuam técnicas e sem ponto, e viram a mensagem genérica.
-- Só os textos das mensagens mudam; a lógica das funções é a mesma.

CREATE OR REPLACE FUNCTION erp.proteger_identidade_nova()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 PERFORM erp.travar_evolucao(CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END);
 IF TG_OP='UPDATE' AND (OLD.id<>NEW.id OR OLD.empresa_id<>NEW.empresa_id) THEN
  RAISE EXCEPTION 'A identificação deste registro não pode mudar.' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.preservar_requisicao_original()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF TG_OP='INSERT' THEN
  NEW.requisicao_original:=to_jsonb(NEW)-ARRAY['id','criado_em','requisicao_original'];
 ELSIF OLD.requisicao_original IS DISTINCT FROM NEW.requisicao_original THEN
  RAISE EXCEPTION 'A solicitação original desta operação não pode mudar.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_execucao_evento()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF (NEW.tipo='cobrancas_eventos') IS DISTINCT FROM (NEW.evento_cobranca_id IS NOT NULL) THEN RAISE EXCEPTION 'A execução de cobrança precisa do evento de origem.' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND OLD.evento_cobranca_id IS DISTINCT FROM NEW.evento_cobranca_id THEN RAISE EXCEPTION 'A origem desta tentativa não pode mudar.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_evento_receber()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF NEW.conta_receber_parcela_id IS NOT NULL AND NOT EXISTS(
 SELECT 1 FROM erp.contas_receber_parcelas WHERE empresa_id=NEW.empresa_id AND id=NEW.conta_receber_parcela_id AND conta_receber_id=NEW.conta_receber_id) THEN
 RAISE EXCEPTION 'Esta parcela não pertence ao título informado.' USING ERRCODE='23514'; END IF;
 IF NEW.pagamento_id IS NOT NULL AND (NEW.conta_receber_parcela_id IS NULL OR NOT EXISTS(
 SELECT 1 FROM erp.pagamentos WHERE empresa_id=NEW.empresa_id AND id=NEW.pagamento_id AND conta_receber_parcela_id=NEW.conta_receber_parcela_id)) THEN
 RAISE EXCEPTION 'Este pagamento não pertence à parcela informada.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.preservar_contato_legado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF pg_trigger_depth()>1 THEN RETURN NEW; END IF;
 IF ROW(OLD.email,OLD.telefone,OLD.celular,OLD.contato_cobranca_emails,OLD.contato_cobranca_whatsapp,OLD.logradouro,OLD.numero,OLD.complemento,OLD.bairro,OLD.cidade,OLD.uf,OLD.cep,OLD.pais)
 IS DISTINCT FROM ROW(NEW.email,NEW.telefone,NEW.celular,NEW.contato_cobranca_emails,NEW.contato_cobranca_whatsapp,NEW.logradouro,NEW.numero,NEW.complemento,NEW.bairro,NEW.cidade,NEW.uf,NEW.cep,NEW.pais) THEN
 RAISE EXCEPTION 'Atualize contatos e endereços nas seções próprias do cadastro.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_fechamento_financeiro(p_tenant_id bigint, p_conta_id bigint, p_tipo text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  total_cabecalho numeric(18,2);
  total_parcelas numeric(18,2);
BEGIN
  IF p_tipo = 'receber' THEN
    SELECT valor_total INTO total_cabecalho
    FROM erp.contas_receber
    WHERE empresa_id = p_tenant_id AND id = p_conta_id AND excluido_em IS NULL;

    SELECT COALESCE(sum(valor), 0) INTO total_parcelas
    FROM erp.contas_receber_parcelas
    WHERE empresa_id = p_tenant_id AND conta_receber_id = p_conta_id AND excluido_em IS NULL;
  ELSE
    SELECT valor_total INTO total_cabecalho
    FROM erp.contas_pagar
    WHERE empresa_id = p_tenant_id AND id = p_conta_id AND excluido_em IS NULL;

    SELECT COALESCE(sum(valor), 0) INTO total_parcelas
    FROM erp.contas_pagar_parcelas
    WHERE empresa_id = p_tenant_id AND conta_pagar_id = p_conta_id AND excluido_em IS NULL;
  END IF;

  IF total_cabecalho IS NOT NULL AND round(total_cabecalho, 2) <> round(total_parcelas, 2) THEN
    RAISE EXCEPTION 'A soma das parcelas (%) é diferente do total do título (%).', total_parcelas, total_cabecalho;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION erp.bloquear_mutacao_evento()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  RAISE EXCEPTION 'O histórico de eventos não pode ser alterado.';
END;
$function$;

CREATE OR REPLACE FUNCTION erp.validar_fechamento_venda(p_tenant_id bigint, p_venda_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  documento erp.vendas%ROWTYPE;
  total_itens numeric(18,2);
  total_parcelas numeric(18,2);
BEGIN
  SELECT * INTO documento
  FROM erp.vendas
  WHERE empresa_id = p_tenant_id AND id = p_venda_id AND excluido_em IS NULL;

  IF NOT FOUND OR documento.status = 'rascunho' OR documento.status = 'cancelada' THEN
    RETURN;
  END IF;

  SELECT COALESCE(sum(total), 0) INTO total_itens
  FROM erp.vendas_itens
  WHERE empresa_id = p_tenant_id AND venda_id = p_venda_id AND excluido_em IS NULL;

  IF round(total_itens, 2) <> round(documento.subtotal, 2) THEN
    RAISE EXCEPTION 'A soma dos itens da venda (%) é diferente do subtotal (%).', total_itens, documento.subtotal;
  END IF;

  IF round(documento.subtotal - CASE WHEN documento.tipo_desconto='percentual' THEN round(documento.subtotal*documento.desconto/100,2) ELSE documento.desconto END + documento.frete, 2) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'O total da venda não confere com subtotal, desconto e frete.';
  END IF;

  SELECT COALESCE(sum(valor), 0) INTO total_parcelas
  FROM erp.vendas_recebimentos_previstos
  WHERE empresa_id = p_tenant_id AND venda_id = p_venda_id AND excluido_em IS NULL;

  IF round(total_parcelas, 2) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'A soma das parcelas da venda (%) é diferente do total (%).', total_parcelas, documento.total;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION erp.validar_fechamento_compra(p_tenant_id bigint, p_compra_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  documento erp.compras%ROWTYPE;
  total_itens numeric(18,2);
  total_parcelas numeric(18,2);
BEGIN
  SELECT * INTO documento
  FROM erp.compras
  WHERE empresa_id = p_tenant_id AND id = p_compra_id AND excluido_em IS NULL;

  IF NOT FOUND OR documento.status = 'rascunho' OR documento.status = 'cancelada' THEN
    RETURN;
  END IF;

  SELECT COALESCE(sum(total), 0) INTO total_itens
  FROM erp.compras_itens
  WHERE empresa_id = p_tenant_id AND compra_id = p_compra_id AND excluido_em IS NULL;

  IF round(total_itens, 2) <> round(documento.subtotal, 2) THEN
    RAISE EXCEPTION 'A soma dos itens da compra (%) é diferente do subtotal (%).', total_itens, documento.subtotal;
  END IF;

  IF round(documento.subtotal - CASE WHEN documento.tipo_desconto='percentual' THEN round(documento.subtotal*documento.desconto/100,2) ELSE documento.desconto END + documento.frete
      + documento.seguro + documento.outras_despesas - documento.impostos_retidos
      + documento.impostos_adicionais, 2) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'O total da compra não confere com subtotal, descontos e despesas.';
  END IF;

  SELECT COALESCE(sum(valor), 0) INTO total_parcelas
  FROM erp.compras_parcelas_previstas
  WHERE empresa_id = p_tenant_id AND compra_id = p_compra_id AND excluido_em IS NULL;

  IF round(total_parcelas, 2) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'A soma das parcelas da compra (%) é diferente do total (%).', total_parcelas, documento.total;
  END IF;
END;
$function$;

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
    RAISE EXCEPTION 'O período de % está fechado na data %. Reabra-o antes de alterar.', modulo_operacao, data_operacao;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION erp.travar_periodo_empresa(p_tenant bigint, p_exclusivo boolean)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
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
    RAISE EXCEPTION 'Outra operação ou um fechamento está em andamento. Tente novamente.'
      USING ERRCODE = '40001';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION erp.exigir_periodos_abertos(p_tenant bigint, p_modulo text, p_datas date[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE bloqueado date;
BEGIN
  SELECT d INTO bloqueado
  FROM unnest(p_datas) d
  WHERE d IS NOT NULL AND EXISTS (
    SELECT 1 FROM erp.fechamentos_periodos f
    WHERE f.empresa_id = p_tenant AND f.reaberto_em IS NULL
      AND f.modulo IN (p_modulo, 'todos')
      AND d BETWEEN f.periodo_inicio AND f.periodo_fim
  ) LIMIT 1;
  IF bloqueado IS NOT NULL THEN
    RAISE EXCEPTION 'O período de % está fechado na data %. Reabra-o antes de alterar.', p_modulo, bloqueado
      USING ERRCODE = '23514';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION erp.exigir_periodo_titulo_aberto(p_tenant bigint, p_id bigint, p_tipo text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE datas date[];
BEGIN
  IF p_tipo = 'receber' THEN
    SELECT ARRAY[COALESCE(data_competencia, data_emissao)] INTO datas
      FROM erp.contas_receber WHERE empresa_id = p_tenant AND id = p_id;
    PERFORM erp.exigir_periodos_abertos(p_tenant, 'financeiro', datas);
    SELECT array_agg(d) INTO datas
      FROM erp.pagamentos p
      JOIN erp.contas_receber_parcelas i ON i.empresa_id=p.empresa_id AND i.id=p.conta_receber_parcela_id
      CROSS JOIN LATERAL unnest(ARRAY[p.data_pagamento,p.data_credito]) d
      WHERE i.empresa_id=p_tenant AND i.conta_receber_id=p_id AND p.excluido_em IS NULL;
  ELSIF p_tipo = 'pagar' THEN
    SELECT ARRAY[COALESCE(data_competencia, data_emissao)] INTO datas
      FROM erp.contas_pagar WHERE empresa_id = p_tenant AND id = p_id;
    PERFORM erp.exigir_periodos_abertos(p_tenant, 'financeiro', datas);
    SELECT array_agg(d) INTO datas
      FROM erp.pagamentos p
      JOIN erp.contas_pagar_parcelas i ON i.empresa_id=p.empresa_id AND i.id=p.conta_pagar_parcela_id
      CROSS JOIN LATERAL unnest(ARRAY[p.data_pagamento,p.data_credito]) d
      WHERE i.empresa_id=p_tenant AND i.conta_pagar_id=p_id AND p.excluido_em IS NULL;
  ELSE
    RAISE EXCEPTION 'Tipo financeiro inválido.' USING ERRCODE='23514';
  END IF;
  PERFORM erp.exigir_periodos_abertos(p_tenant, 'financeiro', datas);
END;
$function$;

CREATE OR REPLACE FUNCTION erp.preservar_fechamento_comercial_financeiro()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE empresa bigint;
BEGIN
  -- Registros exclusivos de estoque permanecem com o comportamento anterior.
  IF TG_OP='INSERT' AND NEW.modulo='estoque' THEN RETURN NEW; END IF;
  IF TG_OP='DELETE' AND OLD.modulo='estoque' THEN RETURN OLD; END IF;
  IF TG_OP='UPDATE' AND OLD.modulo='estoque' AND NEW.modulo='estoque' THEN RETURN NEW; END IF;
  empresa := CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END;
  PERFORM erp.travar_periodo_empresa(empresa,true);
  IF TG_OP='DELETE' THEN
    RAISE EXCEPTION 'Fechamento não pode ser apagado; registre uma reabertura.' USING ERRCODE='23514';
  END IF;
  IF TG_OP='UPDATE' THEN
    IF (to_jsonb(OLD)-ARRAY['reaberto_em','reaberto_por','motivo_reabertura'])
      IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['reaberto_em','reaberto_por','motivo_reabertura']) THEN
      RAISE EXCEPTION 'O período de um fechamento não pode mudar.' USING ERRCODE='23514';
    END IF;
    IF OLD.reaberto_em IS NOT NULL AND to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
      RAISE EXCEPTION 'Uma reabertura não pode ser alterada; para fechar de novo, registre um novo fechamento.' USING ERRCODE='23514';
    END IF;
  END IF;
  IF NEW.reaberto_em IS NOT NULL THEN
    IF NEW.reaberto_por IS NULL OR NULLIF(btrim(NEW.motivo_reabertura),'') IS NULL
      OR NEW.reaberto_em < NEW.fechado_em THEN
      RAISE EXCEPTION 'A reabertura precisa de responsável, motivo e data posterior ao fechamento.' USING ERRCODE='23514';
    END IF;
  ELSIF NEW.reaberto_por IS NOT NULL OR NEW.motivo_reabertura IS NOT NULL THEN
    RAISE EXCEPTION 'Informe a data da reabertura.' USING ERRCODE='23514';
  END IF;
  IF NEW.reaberto_em IS NULL AND EXISTS (
    SELECT 1 FROM erp.fechamentos_periodos f
    WHERE f.empresa_id=NEW.empresa_id AND f.id<>NEW.id AND f.reaberto_em IS NULL
      AND f.modulo IN ('financeiro','vendas','compras','todos')
      AND (f.modulo=NEW.modulo OR f.modulo='todos' OR NEW.modulo='todos')
      AND f.periodo_inicio<=NEW.periodo_fim AND f.periodo_fim>=NEW.periodo_inicio
  ) THEN
    RAISE EXCEPTION 'Este período já está fechado.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION erp.validar_periodo_comercial_financeiro()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
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
  empresa := COALESCE((posterior->>'empresa_id')::bigint,(anterior->>'empresa_id')::bigint);
  IF TG_OP = 'UPDATE' AND (anterior->>'empresa_id') IS DISTINCT FROM (posterior->>'empresa_id') THEN
    RAISE EXCEPTION 'O registro não pode mudar de empresa.' USING ERRCODE='23514';
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
    AND (anterior - ARRAY['atualizado_em','atualizado_por','conta_financeira_id','metodo_pagamento_id'])
      = (posterior - ARRAY['atualizado_em','atualizado_por','conta_financeira_id','metodo_pagamento_id']) THEN
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
      WHERE empresa_id=$1 AND %I=$2 AND excluido_em IS NULL
        AND estornado_em IS NULL AND estorno_de_pagamento_id IS NULL', coluna_parcela)
      INTO pago USING empresa, (posterior->>'id')::bigint;
    IF (posterior->>'valor_pago')::numeric IS DISTINCT FROM pago THEN
      RAISE EXCEPTION 'O resumo de pagamento não confere com os pagamentos registrados.' USING ERRCODE='23514';
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
          EXECUTE format('SELECT to_jsonb(p) FROM erp.%I p WHERE empresa_id=$1 AND id=$2',tabela_pai)
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
$function$;

CREATE OR REPLACE FUNCTION erp.preservar_requisicao_canonica()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF OLD.requisicao_idempotente IS DISTINCT FROM NEW.requisicao_idempotente THEN RAISE EXCEPTION 'A solicitação original desta operação não pode mudar.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.snapshot_documento_cliente()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE e erp.entidades; capturar boolean; final_novo boolean; final_antigo boolean;
BEGIN
 final_novo:=CASE TG_TABLE_NAME WHEN 'vendas' THEN NEW.status='confirmada' WHEN 'ordens_servico' THEN NEW.status IN ('aprovada','em_execucao','concluida') ELSE NEW.status='ativo' END;
 capturar:=TG_OP='INSERT';
 IF TG_OP='UPDATE' THEN
  final_antigo:=CASE TG_TABLE_NAME WHEN 'vendas' THEN OLD.status='confirmada' WHEN 'ordens_servico' THEN OLD.status IN ('aprovada','em_execucao','concluida') ELSE OLD.status='ativo' END;
  IF OLD.cliente_id IS DISTINCT FROM NEW.cliente_id THEN RAISE EXCEPTION 'O cliente de um documento não pode ser trocado; crie um novo documento.' USING ERRCODE='23514'; END IF;
  IF OLD.snapshot_efetivado_em IS NOT NULL OR final_antigo THEN
   IF OLD.cliente_snapshot IS DISTINCT FROM NEW.cliente_snapshot OR OLD.snapshot_efetivado_em IS DISTINCT FROM NEW.snapshot_efetivado_em OR NEW.status IN ('rascunho','orcamento_pendente') THEN RAISE EXCEPTION 'Os dados do cliente gravados na efetivação não podem mudar.' USING ERRCODE='23514'; END IF;
  ELSE
   IF NEW.snapshot_efetivado_em IS DISTINCT FROM OLD.snapshot_efetivado_em THEN RAISE EXCEPTION 'A data de efetivação é registrada automaticamente.' USING ERRCODE='23514'; END IF;
   capturar:=final_novo OR OLD.cliente_snapshot IS DISTINCT FROM NEW.cliente_snapshot;
  END IF;
 END IF;
 IF capturar THEN
  SELECT * INTO e FROM erp.entidades WHERE empresa_id=NEW.empresa_id AND id=NEW.cliente_id;
  NEW.cliente_snapshot:=jsonb_build_object('nome',e.nome,'documento',e.documento,'email',e.email,'logradouro',e.logradouro,'numero',e.numero,'cidade',e.cidade,'uf',e.uf,'origem',CASE WHEN final_novo THEN 'cadastro_na_efetivacao' ELSE 'cadastro_no_rascunho' END);
  NEW.snapshot_efetivado_em:=CASE WHEN final_novo THEN now() END;
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.snapshot_item_contrato()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE j jsonb; c jsonb;
BEGIN
 IF TG_OP='UPDATE' AND EXISTS(SELECT 1 FROM erp.contratos_vendas_versoes WHERE empresa_id=OLD.empresa_id AND id=OLD.contrato_versao_id AND status='efetivada') THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' OR ROW(OLD.produto_id,OLD.servico_id) IS DISTINCT FROM ROW(NEW.produto_id,NEW.servico_id) THEN
  IF NEW.servico_id IS NOT NULL THEN SELECT to_jsonb(s) INTO j FROM erp.servicos s WHERE empresa_id=NEW.empresa_id AND id=NEW.servico_id;
  ELSE SELECT to_jsonb(p) INTO j FROM erp.produtos p WHERE empresa_id=NEW.empresa_id AND id=NEW.produto_id; END IF;
  SELECT jsonb_build_object('id',id,'nome',nome,'tipo',tipo) INTO c FROM erp.categorias WHERE empresa_id=NEW.empresa_id AND id=(j->>'categoria_id')::bigint;
  NEW.unidade:=coalesce(nullif(btrim(NEW.unidade),''),j->>'unidade_medida');
  NEW.classificacao_snapshot:=jsonb_build_object('item_id',j->'id','nome',j->'nome','tipo',coalesce(j->'tipo_servico',j->'tipo_produto'),'categoria',c,'origem','cadastro_no_item');
 ELSIF NEW.classificacao_snapshot IS DISTINCT FROM OLD.classificacao_snapshot THEN RAISE EXCEPTION 'A classificação do item é registrada automaticamente.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.registrar_transicao_estado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.historico_estados IS NOT NULL THEN RAISE EXCEPTION 'O histórico é registrado automaticamente.' USING ERRCODE='23514'; END IF;
  NEW.historico_estados:='[]'::jsonb;
 ELSE
  IF OLD.historico_estados IS DISTINCT FROM NEW.historico_estados THEN RAISE EXCEPTION 'O histórico de processamento não pode ser alterado.' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
  NEW.historico_estados:=coalesce(NEW.historico_estados,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
   'status',NEW.status,'em',clock_timestamp(),'tentativas',to_jsonb(NEW)->'tentativas',
   'erro',coalesce(to_jsonb(NEW)->'erro',to_jsonb(NEW)->'erro_mensagem'),'resultado',to_jsonb(NEW)->'resultado'));
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.preservar_importacao_identidade()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF TG_TABLE_NAME='importacoes_dados' THEN
  IF TG_OP='DELETE' THEN
   IF OLD.status IN ('concluida','parcial') THEN RAISE EXCEPTION 'Importação que já gerou registros não pode ser apagada.' USING ERRCODE='23514'; END IF;
   RETURN OLD;
  END IF;
  IF ROW(OLD.empresa_id,OLD.id,OLD.tipo,OLD.hash_arquivo) IS DISTINCT FROM ROW(NEW.empresa_id,NEW.id,NEW.tipo,NEW.hash_arquivo) OR OLD.status IN ('concluida','parcial','cancelada') THEN RAISE EXCEPTION 'Importação encerrada não pode ser alterada.' USING ERRCODE='23514'; END IF;
 ELSE
  IF TG_OP='UPDATE' AND (OLD.dados_originais IS DISTINCT FROM NEW.dados_originais OR OLD.id<>NEW.id OR OLD.empresa_id<>NEW.empresa_id) THEN RAISE EXCEPTION 'A linha original da importação não pode ser alterada.' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_arquivo_anexo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM erp.arquivos WHERE empresa_id=NEW.empresa_id AND id=NEW.arquivo_id AND excluido_em IS NULL) THEN
 RAISE EXCEPTION 'Arquivo indisponível.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_principais_entidade()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE conflito boolean;
BEGIN
 IF array_position(NEW.finalidades,NULL) IS NOT NULL OR array_position(NEW.principais,NULL) IS NOT NULL
  OR cardinality(NEW.finalidades)<>(SELECT count(DISTINCT x) FROM unnest(NEW.finalidades) x)
  OR cardinality(NEW.principais)<>(SELECT count(DISTINCT x) FROM unnest(NEW.principais) x) THEN
  RAISE EXCEPTION 'Finalidade do contato ou endereço inválida.' USING ERRCODE='23514';
 END IF;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM erp.%I WHERE empresa_id=$1 AND entidade_id=$2 AND id<>$3 AND ativo AND principais && $4)',TG_TABLE_NAME)
 INTO conflito USING NEW.empresa_id,NEW.entidade_id,NEW.id,NEW.principais;
 IF conflito THEN RAISE EXCEPTION 'Já existe um contato ou endereço principal para esta finalidade.' USING ERRCODE='23514'; END IF;
 NEW.atualizado_em:=now();
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.refletir_cadastro_normalizado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE t bigint; e bigint; afetadas text[]; a erp.entidades_enderecos;
BEGIN
 -- Insercoes atomicas da entidade ja preservam a projecao recebida.
 IF pg_trigger_depth()>1 THEN RETURN NULL; END IF;
 t:=CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END;
 e:=CASE WHEN TG_OP='DELETE' THEN OLD.entidade_id ELSE NEW.entidade_id END;
 afetadas:=CASE WHEN TG_OP='DELETE' THEN OLD.finalidades WHEN TG_OP='INSERT' THEN NEW.finalidades ELSE OLD.finalidades||NEW.finalidades END;
 PERFORM erp.travar_evolucao(t);
 IF TG_OP='UPDATE' AND OLD.entidade_id<>NEW.entidade_id THEN RAISE EXCEPTION 'Contato ou endereço não pode ser movido para outro cadastro.' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='entidades_contatos' THEN
  IF 'comercial'=ANY(afetadas) THEN
   UPDATE erp.entidades SET
    email=(SELECT email FROM erp.entidades_contatos WHERE empresa_id=t AND entidade_id=e AND ativo AND 'comercial'=ANY(finalidades) AND email IS NOT NULL ORDER BY ('comercial'=ANY(principais)) DESC,id LIMIT 1),
    telefone=(SELECT telefone FROM erp.entidades_contatos WHERE empresa_id=t AND entidade_id=e AND ativo AND 'comercial'=ANY(finalidades) AND NOT whatsapp AND telefone IS NOT NULL ORDER BY ('comercial'=ANY(principais)) DESC,id LIMIT 1),
    celular=(SELECT telefone FROM erp.entidades_contatos WHERE empresa_id=t AND entidade_id=e AND ativo AND 'comercial'=ANY(finalidades) AND whatsapp AND telefone IS NOT NULL ORDER BY ('comercial'=ANY(principais)) DESC,id LIMIT 1)
   WHERE empresa_id=t AND id=e;
  END IF;
  IF 'financeiro'=ANY(afetadas) THEN
   UPDATE erp.entidades SET
    contato_cobranca_emails=ARRAY(SELECT DISTINCT email FROM erp.entidades_contatos WHERE empresa_id=t AND entidade_id=e AND ativo AND 'financeiro'=ANY(finalidades) AND email IS NOT NULL),
    contato_cobranca_whatsapp=(SELECT telefone FROM erp.entidades_contatos WHERE empresa_id=t AND entidade_id=e AND ativo AND 'financeiro'=ANY(finalidades) AND whatsapp ORDER BY ('financeiro'=ANY(principais)) DESC,id LIMIT 1)
   WHERE empresa_id=t AND id=e;
  END IF;
 ELSIF 'comercial'=ANY(afetadas) THEN
  SELECT * INTO a FROM erp.entidades_enderecos WHERE empresa_id=t AND entidade_id=e AND ativo AND 'comercial'=ANY(finalidades) ORDER BY ('comercial'=ANY(principais)) DESC,id LIMIT 1;
  UPDATE erp.entidades SET logradouro=a.logradouro,numero=a.numero,complemento=a.complemento,bairro=a.bairro,cidade=a.cidade,uf=a.uf,cep=a.cep,pais=coalesce(a.pais,'Brasil') WHERE empresa_id=t AND id=e;
 END IF;
 RETURN NULL;
END $function$;

CREATE OR REPLACE FUNCTION erp.composicao_parcela(p_tenant bigint, p_lado text, p_id bigint)
 RETURNS TABLE(valor numeric, dinheiro numeric, credito numeric, transferido numeric, saldo numeric, entidade_id bigint, titulo_id bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF p_lado NOT IN ('receber','pagar') THEN RAISE EXCEPTION 'Tipo inválido: use a receber ou a pagar.' USING ERRCODE='23514'; END IF;
 EXECUTE format('SELECT p.valor,t.%I,p.conta_%s_id FROM erp.contas_%s_parcelas p JOIN erp.contas_%s t ON t.empresa_id=p.empresa_id AND t.id=p.conta_%s_id WHERE p.empresa_id=$1 AND p.id=$2',
  CASE WHEN p_lado='receber' THEN 'cliente_id' ELSE 'fornecedor_id' END,p_lado,p_lado,p_lado,p_lado)
 INTO valor,entidade_id,titulo_id USING p_tenant,p_id;
 IF valor IS NULL THEN RETURN; END IF;
 EXECUTE format('SELECT coalesce(sum(valor),0) FROM erp.pagamentos WHERE empresa_id=$1 AND conta_%s_parcela_id=$2 AND excluido_em IS NULL AND estornado_em IS NULL AND estorno_de_pagamento_id IS NULL',p_lado)
 INTO dinheiro USING p_tenant,p_id;
 EXECUTE format('SELECT coalesce(sum(CASE WHEN reversao_de_id IS NULL THEN valor ELSE -valor END),0) FROM erp.adiantamentos_aplicacoes WHERE empresa_id=$1 AND conta_%s_parcela_id=$2',p_lado)
 INTO credito USING p_tenant,p_id;
 EXECUTE format('SELECT coalesce(sum(p.valor),0) FROM erp.renegociacoes_parcelas p JOIN erp.renegociacoes r ON r.empresa_id=p.empresa_id AND r.id=p.renegociacao_id WHERE p.empresa_id=$1 AND p.conta_%s_parcela_id=$2 AND p.papel=''origem'' AND r.status=''efetivada''',p_lado)
 INTO transferido USING p_tenant,p_id;
 saldo:=valor-dinheiro-credito-transferido;
 RETURN NEXT;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_movimento_evolucao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE j jsonb; a erp.adiantamentos; original erp.adiantamentos; ap erp.adiantamentos_aplicacoes;
 r erp.renegociacoes; p record; t bigint; lado text; parcela bigint; pgto erp.pagamentos;
BEGIN
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 t:=(j->>'empresa_id')::bigint;
 PERFORM erp.travar_evolucao(t);
 IF TG_OP='UPDATE' AND (OLD.empresa_id<>NEW.empresa_id OR OLD.id<>NEW.id) THEN RAISE EXCEPTION 'A identificação deste registro não pode mudar.' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME IN ('adiantamentos','adiantamentos_aplicacoes') THEN
  IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Movimento de adiantamento não pode ser alterado; registre uma reversão.' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME='adiantamentos' THEN
   PERFORM erp.exigir_periodos_abertos(t,'financeiro',ARRAY[NEW.data_movimento,NEW.data_credito]);
   IF NOT EXISTS(SELECT 1 FROM erp.entidades WHERE empresa_id=t AND id=NEW.entidade_id AND
    CASE WHEN NEW.lado='receber' THEN eh_cliente ELSE eh_fornecedor END) THEN RAISE EXCEPTION 'Adiantamento a receber é de cliente, e a pagar é de fornecedor.' USING ERRCODE='23514'; END IF;
   IF NEW.tipo<>'constituicao' THEN
    SELECT * INTO a FROM erp.adiantamentos WHERE empresa_id=t AND id=NEW.adiantamento_id;
    IF a.tipo IS DISTINCT FROM 'constituicao' OR a.entidade_id<>NEW.entidade_id OR a.lado<>NEW.lado OR NEW.data_movimento<a.data_movimento THEN RAISE EXCEPTION 'Este movimento não corresponde ao adiantamento de origem.' USING ERRCODE='23514'; END IF;
   END IF;
   IF NEW.tipo='reversao' THEN
    SELECT * INTO original FROM erp.adiantamentos WHERE empresa_id=t AND id=NEW.reversao_de_id;
    IF original.tipo NOT IN ('constituicao','devolucao') OR original.id IS NULL
     OR coalesce(original.adiantamento_id,original.id)<>NEW.adiantamento_id OR original.valor<>NEW.valor
     OR original.conta_financeira_id<>NEW.conta_financeira_id OR NEW.data_movimento<original.data_movimento THEN
     RAISE EXCEPTION 'A reversão precisa ser do movimento inteiro, na mesma conta.' USING ERRCODE='23514'; END IF;
   END IF;
  ELSE
   PERFORM erp.exigir_periodos_abertos(t,'financeiro',ARRAY[NEW.data_aplicacao]);
   SELECT * INTO a FROM erp.adiantamentos WHERE empresa_id=t AND id=NEW.adiantamento_id;
   lado:=CASE WHEN NEW.conta_receber_parcela_id IS NOT NULL THEN 'receber' ELSE 'pagar' END;
   parcela:=coalesce(NEW.conta_receber_parcela_id,NEW.conta_pagar_parcela_id);
   SELECT * INTO p FROM erp.composicao_parcela(t,lado,parcela);
   IF a.tipo IS DISTINCT FROM 'constituicao' OR a.lado<>lado OR a.entidade_id IS DISTINCT FROM p.entidade_id OR NEW.data_aplicacao<coalesce(a.data_credito,a.data_movimento) THEN
    RAISE EXCEPTION 'O adiantamento é de outro cliente/fornecedor ou ainda não estava disponível nesta data.' USING ERRCODE='23514'; END IF;
   IF NEW.reversao_de_id IS NOT NULL THEN
    SELECT * INTO ap FROM erp.adiantamentos_aplicacoes WHERE empresa_id=t AND id=NEW.reversao_de_id;
    IF ap.id IS NULL OR ap.reversao_de_id IS NOT NULL OR ap.adiantamento_id<>NEW.adiantamento_id OR ap.valor<>NEW.valor
     OR ap.conta_receber_parcela_id IS DISTINCT FROM NEW.conta_receber_parcela_id OR ap.conta_pagar_parcela_id IS DISTINCT FROM NEW.conta_pagar_parcela_id OR NEW.data_aplicacao<ap.data_aplicacao THEN
     RAISE EXCEPTION 'A reversão não corresponde à aplicação original.' USING ERRCODE='23514'; END IF;
   END IF;
  END IF;
 ELSIF TG_TABLE_NAME='renegociacoes' THEN
  IF TG_OP='DELETE' THEN
   IF OLD.status<>'rascunho' THEN RAISE EXCEPTION 'Acordo efetivado não pode ser apagado; reverta o acordo.' USING ERRCODE='23514'; END IF;
   RETURN OLD;
  END IF;
  PERFORM erp.exigir_periodos_abertos(t,'financeiro',ARRAY[NEW.data_acordo]);
  IF TG_OP='INSERT' AND NEW.status<>'rascunho' THEN RAISE EXCEPTION 'Crie o acordo em rascunho com as parcelas antes de efetivar.' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND OLD.status<>'rascunho' THEN
   PERFORM erp.exigir_periodos_abertos(t,'financeiro',ARRAY[OLD.data_acordo]);
   IF OLD.status='revertida' OR NEW.status<>'revertida'
    OR (to_jsonb(OLD)-ARRAY['status','revertida_em','revertida_por','motivo_reversao']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['status','revertida_em','revertida_por','motivo_reversao']) THEN
    RAISE EXCEPTION 'Acordo efetivado não pode ser alterado; só revertido.' USING ERRCODE='23514'; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='renegociacoes_parcelas' THEN
  SELECT * INTO r FROM erp.renegociacoes WHERE empresa_id=t AND id=(j->>'renegociacao_id')::bigint;
  IF r.status IS DISTINCT FROM 'rascunho' THEN RAISE EXCEPTION 'As parcelas de um acordo efetivado não podem mudar.' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND OLD.renegociacao_id<>NEW.renegociacao_id THEN RAISE EXCEPTION 'Parcela não pode ser movida para outro acordo.' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='pagamentos' THEN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Pagamento não pode ser apagado; registre um estorno.' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND (to_jsonb(OLD)-ARRAY['estornado_em','conciliado','atualizado_em','atualizado_por'])
   IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['estornado_em','conciliado','atualizado_em','atualizado_por']) THEN
   RAISE EXCEPTION 'Pagamento registrado não pode ser alterado; estorne e registre de novo.' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND OLD.estornado_em IS NOT NULL AND OLD.estornado_em IS DISTINCT FROM NEW.estornado_em THEN
   RAISE EXCEPTION 'Estorno registrado não pode ser alterado.' USING ERRCODE='23514'; END IF;
  IF NEW.excluido_em IS NOT NULL THEN RAISE EXCEPTION 'Pagamento registrado não pode ser excluído; registre um estorno.' USING ERRCODE='23514'; END IF;
  IF NEW.estorno_de_pagamento_id IS NOT NULL THEN
   SELECT * INTO pgto FROM erp.pagamentos WHERE empresa_id=t AND id=NEW.estorno_de_pagamento_id;
   IF pgto.id IS NULL OR pgto.estorno_de_pagamento_id IS NOT NULL OR pgto.estornado_em IS NULL
    OR ROW(pgto.tipo,pgto.conta_receber_parcela_id,pgto.conta_pagar_parcela_id,pgto.conta_financeira_id,pgto.valor,pgto.juros,pgto.multa,pgto.desconto,pgto.taxa,pgto.valor_liquido)
     IS DISTINCT FROM ROW(NEW.tipo,NEW.conta_receber_parcela_id,NEW.conta_pagar_parcela_id,NEW.conta_financeira_id,NEW.valor,NEW.juros,NEW.multa,NEW.desconto,NEW.taxa,NEW.valor_liquido)
    OR NEW.data_pagamento<pgto.data_pagamento OR nullif(btrim(NEW.motivo_estorno),'') IS NULL THEN
    RAISE EXCEPTION 'O estorno precisa ser do pagamento inteiro, com motivo.' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_saldos_evolucao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE t bigint; j jsonb; a record; r record; l record; c record; p record; lado text;
 saldo_adiantamento numeric; soma_origem numeric; soma_destino numeric; novo_status text; valido boolean; titulo record; agregado record;
 pr bigint[]:='{}'; pp bigint[]:='{}'; tr bigint[]:='{}'; tp bigint[]:='{}'; rs bigint[]:='{}'; ad bigint[]:='{}'; pg bigint[]:='{}';
BEGIN
 t:=CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END;
 PERFORM erp.travar_evolucao(t);

 -- 1. Registros tocados pela linha (antes e depois).
 FOREACH j IN ARRAY ARRAY[CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END, CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END] LOOP
  CONTINUE WHEN j IS NULL;
  IF TG_TABLE_NAME='contas_receber_parcelas' THEN pr:=pr||(j->>'id')::bigint; tr:=tr||(j->>'conta_receber_id')::bigint;
  ELSIF TG_TABLE_NAME='contas_pagar_parcelas' THEN pp:=pp||(j->>'id')::bigint; tp:=tp||(j->>'conta_pagar_id')::bigint;
  ELSIF TG_TABLE_NAME='contas_receber' THEN tr:=tr||(j->>'id')::bigint; rs:=rs||(j->>'renegociacao_origem_id')::bigint;
  ELSIF TG_TABLE_NAME='contas_pagar' THEN tp:=tp||(j->>'id')::bigint; rs:=rs||(j->>'renegociacao_origem_id')::bigint;
  ELSIF TG_TABLE_NAME='pagamentos' THEN
   pr:=pr||(j->>'conta_receber_parcela_id')::bigint; pp:=pp||(j->>'conta_pagar_parcela_id')::bigint;
   pg:=pg||coalesce((j->>'estorno_de_pagamento_id')::bigint,(j->>'id')::bigint);
  ELSIF TG_TABLE_NAME='adiantamentos' THEN ad:=ad||coalesce((j->>'adiantamento_id')::bigint,(j->>'id')::bigint);
  ELSIF TG_TABLE_NAME='adiantamentos_aplicacoes' THEN
   ad:=ad||(j->>'adiantamento_id')::bigint; pr:=pr||(j->>'conta_receber_parcela_id')::bigint; pp:=pp||(j->>'conta_pagar_parcela_id')::bigint;
  ELSIF TG_TABLE_NAME='renegociacoes' THEN rs:=rs||(j->>'id')::bigint;
  ELSIF TG_TABLE_NAME='renegociacoes_parcelas' THEN
   rs:=rs||(j->>'renegociacao_id')::bigint; pr:=pr||(j->>'conta_receber_parcela_id')::bigint; pp:=pp||(j->>'conta_pagar_parcela_id')::bigint;
  END IF;
 END LOOP;
 pr:=array_remove(pr,NULL); pp:=array_remove(pp,NULL); tr:=array_remove(tr,NULL); tp:=array_remove(tp,NULL);
 rs:=array_remove(rs,NULL); ad:=array_remove(ad,NULL); pg:=array_remove(pg,NULL);

 -- 2. Vizinhos que dependem deles: parcelas dos títulos e acordos; acordos das parcelas; títulos das parcelas
 --    e títulos gerados pelos acordos; acordo de origem dos títulos.
 pr:=pr||ARRAY(SELECT id FROM erp.contas_receber_parcelas WHERE empresa_id=t AND conta_receber_id=ANY(tr))
       ||ARRAY(SELECT conta_receber_parcela_id FROM erp.renegociacoes_parcelas WHERE empresa_id=t AND renegociacao_id=ANY(rs) AND conta_receber_parcela_id IS NOT NULL);
 pp:=pp||ARRAY(SELECT id FROM erp.contas_pagar_parcelas WHERE empresa_id=t AND conta_pagar_id=ANY(tp))
       ||ARRAY(SELECT conta_pagar_parcela_id FROM erp.renegociacoes_parcelas WHERE empresa_id=t AND renegociacao_id=ANY(rs) AND conta_pagar_parcela_id IS NOT NULL);
 rs:=rs||ARRAY(SELECT renegociacao_id FROM erp.renegociacoes_parcelas WHERE empresa_id=t AND (conta_receber_parcela_id=ANY(pr) OR conta_pagar_parcela_id=ANY(pp)));
 tr:=tr||ARRAY(SELECT conta_receber_id FROM erp.contas_receber_parcelas WHERE empresa_id=t AND id=ANY(pr))
       ||ARRAY(SELECT id FROM erp.contas_receber WHERE empresa_id=t AND renegociacao_origem_id=ANY(rs));
 tp:=tp||ARRAY(SELECT conta_pagar_id FROM erp.contas_pagar_parcelas WHERE empresa_id=t AND id=ANY(pp))
       ||ARRAY(SELECT id FROM erp.contas_pagar WHERE empresa_id=t AND renegociacao_origem_id=ANY(rs));
 rs:=rs||ARRAY(SELECT renegociacao_origem_id FROM erp.contas_receber WHERE empresa_id=t AND id=ANY(tr) AND renegociacao_origem_id IS NOT NULL)
       ||ARRAY(SELECT renegociacao_origem_id FROM erp.contas_pagar WHERE empresa_id=t AND id=ANY(tp) AND renegociacao_origem_id IS NOT NULL);
 pr:=ARRAY(SELECT DISTINCT x FROM unnest(pr) x); pp:=ARRAY(SELECT DISTINCT x FROM unnest(pp) x);
 tr:=ARRAY(SELECT DISTINCT x FROM unnest(tr) x); tp:=ARRAY(SELECT DISTINCT x FROM unnest(tp) x);
 rs:=ARRAY(SELECT DISTINCT x FROM unnest(rs) x); ad:=ARRAY(SELECT DISTINCT x FROM unnest(ad) x);

 -- 3. Regras (as mesmas da versão anterior), restritas aos conjuntos acima.
 FOR a IN SELECT * FROM erp.adiantamentos WHERE empresa_id=t AND tipo='constituicao' AND id=ANY(ad) LOOP
  SELECT a.valor-coalesce(sum(CASE WHEN m.tipo='devolucao' THEN m.valor
     WHEN m.tipo='reversao' AND o.tipo='constituicao' THEN m.valor
     WHEN m.tipo='reversao' AND o.tipo='devolucao' THEN -m.valor ELSE 0 END),0)
  INTO saldo_adiantamento
  FROM erp.adiantamentos m LEFT JOIN erp.adiantamentos o ON o.empresa_id=m.empresa_id AND o.id=m.reversao_de_id
  WHERE m.empresa_id=t AND m.adiantamento_id=a.id;
  SELECT saldo_adiantamento-coalesce(sum(CASE WHEN reversao_de_id IS NULL THEN valor ELSE -valor END),0)
  INTO saldo_adiantamento FROM erp.adiantamentos_aplicacoes WHERE empresa_id=t AND adiantamento_id=a.id;
  IF saldo_adiantamento<0 OR saldo_adiantamento>a.valor THEN RAISE EXCEPTION 'O valor passa do saldo disponível do adiantamento.' USING ERRCODE='23514'; END IF;
  IF EXISTS(WITH movimentos AS (
   SELECT coalesce(a.data_credito,a.data_movimento) dia,a.valor delta
   UNION ALL SELECT coalesce(m.data_credito,m.data_movimento),CASE WHEN m.tipo='devolucao' OR o.tipo='constituicao' THEN -m.valor ELSE m.valor END
    FROM erp.adiantamentos m LEFT JOIN erp.adiantamentos o ON o.empresa_id=m.empresa_id AND o.id=m.reversao_de_id WHERE m.empresa_id=t AND m.adiantamento_id=a.id
   UNION ALL SELECT data_aplicacao,CASE WHEN reversao_de_id IS NULL THEN -valor ELSE valor END FROM erp.adiantamentos_aplicacoes WHERE empresa_id=t AND adiantamento_id=a.id
  ), por_dia AS (SELECT dia,sum(delta) delta FROM movimentos GROUP BY dia), saldos AS (SELECT sum(delta) OVER(ORDER BY dia) saldo FROM por_dia)
  SELECT 1 FROM saldos WHERE saldo<0) THEN RAISE EXCEPTION 'O adiantamento ficaria sem saldo em alguma data; confira as datas dos movimentos.' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM erp.pagamentos origem WHERE origem.empresa_id=t AND origem.id=ANY(pg) AND origem.estornado_em IS NOT NULL AND origem.estorno_de_pagamento_id IS NULL
  AND NOT EXISTS(SELECT 1 FROM erp.pagamentos x WHERE x.empresa_id=t AND x.estorno_de_pagamento_id=origem.id)) THEN
  RAISE EXCEPTION 'O estorno precisa registrar o movimento contrário na mesma operação.' USING ERRCODE='23514'; END IF;
 IF cardinality(rs)>0 AND EXISTS(WITH RECURSIVE arestas AS (
  SELECT head.renegociacao_origem_id origem,link.renegociacao_id destino FROM erp.renegociacoes_parcelas link
  JOIN erp.contas_receber_parcelas par ON par.empresa_id=link.empresa_id AND par.id=link.conta_receber_parcela_id
  JOIN erp.contas_receber head ON head.empresa_id=par.empresa_id AND head.id=par.conta_receber_id
  WHERE link.empresa_id=t AND link.papel='origem' AND head.renegociacao_origem_id IS NOT NULL
  UNION SELECT head.renegociacao_origem_id,link.renegociacao_id FROM erp.renegociacoes_parcelas link
  JOIN erp.contas_pagar_parcelas par ON par.empresa_id=link.empresa_id AND par.id=link.conta_pagar_parcela_id
  JOIN erp.contas_pagar head ON head.empresa_id=par.empresa_id AND head.id=par.conta_pagar_id
  WHERE link.empresa_id=t AND link.papel='origem' AND head.renegociacao_origem_id IS NOT NULL
 ), caminhos AS (
  SELECT destino,ARRAY[origem,destino] caminho,origem=destino ciclo FROM arestas
  UNION ALL SELECT edge.destino,path.caminho||edge.destino,edge.destino=ANY(path.caminho) FROM caminhos path JOIN arestas edge ON edge.origem=path.destino WHERE NOT path.ciclo
 ) SELECT 1 FROM caminhos WHERE ciclo) THEN RAISE EXCEPTION 'Uma renegociação não pode incluir títulos gerados por ela mesma.' USING ERRCODE='23514'; END IF;
 FOR r IN SELECT * FROM erp.renegociacoes WHERE empresa_id=t AND id=ANY(rs) LOOP
  soma_origem:=0; soma_destino:=0;
  FOR l IN SELECT * FROM erp.renegociacoes_parcelas WHERE empresa_id=t AND renegociacao_id=r.id LOOP
   lado:=CASE WHEN l.conta_receber_parcela_id IS NOT NULL THEN 'receber' ELSE 'pagar' END;
   SELECT * INTO c FROM erp.composicao_parcela(t,lado,coalesce(l.conta_receber_parcela_id,l.conta_pagar_parcela_id));
   IF c.entidade_id IS DISTINCT FROM r.entidade_id OR lado<>r.lado THEN RAISE EXCEPTION 'As parcelas do acordo precisam ser do mesmo cliente/fornecedor e do mesmo lado.' USING ERRCODE='23514'; END IF;
   IF l.papel='origem' THEN
    soma_origem:=soma_origem+l.valor;
    IF r.status='efetivada' AND (c.saldo<>0 OR c.transferido<>l.valor) THEN RAISE EXCEPTION 'O acordo precisa levar o saldo inteiro de cada parcela de origem, uma única vez.' USING ERRCODE='23514'; END IF;
   ELSE
    soma_destino:=soma_destino+l.valor;
    EXECUTE format('SELECT renegociacao_origem_id=$3 FROM erp.contas_%s WHERE empresa_id=$1 AND id=$2',lado) INTO valido USING t,c.titulo_id,r.id;
    IF valido IS DISTINCT FROM true OR l.valor<>c.valor THEN RAISE EXCEPTION 'As novas parcelas precisam ser do título gerado pelo acordo, com o mesmo valor.' USING ERRCODE='23514'; END IF;
    IF r.status='rascunho' THEN RAISE EXCEPTION 'As novas parcelas são criadas ao efetivar o acordo.' USING ERRCODE='23514'; END IF;
    IF r.status='revertida' THEN
     EXECUTE format('SELECT status=''cancelado'' FROM erp.contas_%s_parcelas WHERE empresa_id=$1 AND id=$2',lado) INTO valido USING t,coalesce(l.conta_receber_parcela_id,l.conta_pagar_parcela_id);
     IF c.dinheiro<>0 OR c.credito<>0 OR c.transferido<>0 OR valido IS DISTINCT FROM true THEN RAISE EXCEPTION 'Para reverter o acordo, as novas parcelas não podem ter baixa, crédito ou renegociação.' USING ERRCODE='23514'; END IF;
    END IF;
   END IF;
  END LOOP;
  IF r.status<>'rascunho' AND (soma_origem<=0 OR soma_destino<=0 OR soma_destino<>soma_origem-r.desconto+r.encargos) THEN
   RAISE EXCEPTION 'O total das novas parcelas precisa ser o das parcelas de origem menos desconto mais encargos.' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOREACH lado IN ARRAY ARRAY['receber','pagar'] LOOP
  FOR p IN EXECUTE format('SELECT p.*,t.status titulo_status,t.excluido_em titulo_excluido FROM erp.contas_%s_parcelas p JOIN erp.contas_%s t ON t.empresa_id=p.empresa_id AND t.id=p.conta_%s_id WHERE p.empresa_id=$1 AND p.id=ANY($2)',lado,lado,lado)
   USING t,CASE WHEN lado='receber' THEN pr ELSE pp END LOOP
   SELECT * INTO c FROM erp.composicao_parcela(t,lado,p.id);
   IF c.saldo<0 OR c.credito<0 OR
    ((p.status='cancelado' OR p.excluido_em IS NOT NULL OR p.titulo_status='cancelado' OR p.titulo_excluido IS NOT NULL) AND (c.dinheiro<>0 OR c.credito<>0 OR c.transferido<>0)) THEN
    RAISE EXCEPTION 'O valor passa do saldo da parcela, ou a parcela está cancelada.' USING ERRCODE='23514'; END IF;
   novo_status:=CASE WHEN p.status='cancelado' THEN 'cancelado'
    WHEN c.transferido>0 THEN 'renegociado' WHEN c.saldo=0 THEN 'pago'
    WHEN c.dinheiro+c.credito>0 THEN 'parcial' ELSE 'aberto' END;
   EXECUTE format('UPDATE erp.contas_%s_parcelas SET valor_pago=$3,status=$4 WHERE empresa_id=$1 AND id=$2 AND (valor_pago IS DISTINCT FROM $3 OR (status IS DISTINCT FROM $4 AND NOT(status=''vencido'' AND $4=''aberto'')))',lado)
    USING t,p.id,c.dinheiro,novo_status;
  END LOOP;
  FOR titulo IN EXECUTE format('SELECT * FROM erp.contas_%s WHERE empresa_id=$1 AND excluido_em IS NULL AND id=ANY($2)',lado) USING t,CASE WHEN lado='receber' THEN tr ELSE tp END LOOP
   IF titulo.renegociacao_origem_id IS NOT NULL THEN
    SELECT * INTO r FROM erp.renegociacoes WHERE empresa_id=t AND id=titulo.renegociacao_origem_id;
    IF r.lado<>lado OR r.status='rascunho' OR (r.status='revertida' AND titulo.status<>'cancelado') THEN
     RAISE EXCEPTION 'Este título depende de um acordo de renegociação efetivado.' USING ERRCODE='23514'; END IF;
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM erp.contas_%s_parcelas par WHERE par.empresa_id=$1 AND par.conta_%s_id=$2 AND par.excluido_em IS NULL AND NOT EXISTS(SELECT 1 FROM erp.renegociacoes_parcelas link WHERE link.empresa_id=par.empresa_id AND link.conta_%s_parcela_id=par.id AND link.renegociacao_id=$3 AND link.papel=''destino''))',lado,lado,lado)
     INTO valido USING t,titulo.id,titulo.renegociacao_origem_id;
    IF valido THEN RAISE EXCEPTION 'Toda parcela do título do acordo precisa estar ligada ao acordo.' USING ERRCODE='23514'; END IF;
   END IF;
   EXECUTE format('SELECT count(*) n,coalesce(sum(valor),0) total,bool_and(status IN (''pago'',''renegociado'')) quitado,bool_or(status=''renegociado'') renegociado,bool_or(status IN (''pago'',''parcial'',''renegociado'')) parcial FROM erp.contas_%s_parcelas WHERE empresa_id=$1 AND conta_%s_id=$2 AND excluido_em IS NULL',lado,lado)
    INTO agregado USING t,titulo.id;
   IF agregado.n>0 AND titulo.valor_total<>agregado.total THEN RAISE EXCEPTION 'O total do título não confere com a soma das parcelas.' USING ERRCODE='23514'; END IF;
   IF agregado.n>0 AND titulo.status<>'cancelado' THEN
    novo_status:=CASE WHEN agregado.quitado AND agregado.renegociado THEN 'renegociado' WHEN agregado.quitado THEN 'pago' WHEN agregado.parcial THEN 'parcial' ELSE 'aberto' END;
    EXECUTE format('UPDATE erp.contas_%s SET status=$3 WHERE empresa_id=$1 AND id=$2 AND status<>$3 AND NOT(status=''vencido'' AND $3=''aberto'')',lado) USING t,titulo.id,novo_status;
   END IF;
  END LOOP;
 END LOOP;
 RETURN NULL;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_conciliacao_evolucao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE t bigint; j jsonb; i record; b erp.transacoes_bancarias; h erp.conciliacoes_bancarias;
 p erp.pagamentos; a erp.adiantamentos; o erp.adiantamentos; tr erp.transferencias_financeiras;
 sentido text; conta bigint; limite numeric; total numeric;
 ps bigint[]:='{}'; ads bigint[]:='{}'; fs bigint[]:='{}'; bs bigint[]:='{}'; cs bigint[]:='{}';
BEGIN
 t:=CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END;
 PERFORM erp.travar_evolucao(t);
 FOREACH j IN ARRAY ARRAY[CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END, CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END] LOOP
  CONTINUE WHEN j IS NULL;
  IF TG_TABLE_NAME='pagamentos' THEN ps:=ps||(j->>'id')::bigint;
  ELSIF TG_TABLE_NAME='adiantamentos' THEN ads:=ads||(j->>'id')::bigint;
  ELSIF TG_TABLE_NAME='transferencias_financeiras' THEN fs:=fs||(j->>'id')::bigint;
  ELSIF TG_TABLE_NAME='transacoes_bancarias' THEN bs:=bs||(j->>'id')::bigint;
  ELSIF TG_TABLE_NAME='conciliacoes_bancarias' THEN cs:=cs||(j->>'id')::bigint;
  ELSIF TG_TABLE_NAME='conciliacoes_bancarias_itens' THEN
   cs:=cs||(j->>'conciliacao_id')::bigint; bs:=bs||(j->>'transacao_bancaria_id')::bigint; ps:=ps||(j->>'pagamento_id')::bigint;
   ads:=ads||(j->>'adiantamento_id')::bigint; fs:=fs||(j->>'transferencia_financeira_id')::bigint;
  END IF;
 END LOOP;
 ps:=array_remove(ps,NULL); ads:=array_remove(ads,NULL); fs:=array_remove(fs,NULL); bs:=array_remove(bs,NULL); cs:=array_remove(cs,NULL);
 -- Itens ativos ligados a qualquer registro tocado; seus extratos e pagamentos têm os marcadores recalculados.
 FOR i IN SELECT * FROM erp.conciliacoes_bancarias_itens WHERE empresa_id=t AND desfeito_em IS NULL
   AND (pagamento_id=ANY(ps) OR adiantamento_id=ANY(ads) OR transferencia_financeira_id=ANY(fs) OR transacao_bancaria_id=ANY(bs) OR conciliacao_id=ANY(cs)) LOOP
  bs:=bs||i.transacao_bancaria_id; IF i.pagamento_id IS NOT NULL THEN ps:=ps||i.pagamento_id; END IF;
  SELECT * INTO b FROM erp.transacoes_bancarias WHERE empresa_id=t AND id=i.transacao_bancaria_id;
  SELECT * INTO h FROM erp.conciliacoes_bancarias WHERE empresa_id=t AND id=i.conciliacao_id;
  IF b.excluido_em IS NOT NULL OR h.excluido_em IS NOT NULL OR h.status='cancelada' OR h.conta_financeira_id<>b.conta_financeira_id
   OR b.data_transacao<coalesce(h.periodo_inicio,'-infinity'::date) OR b.data_transacao>coalesce(h.periodo_fim,'infinity'::date) THEN
   RAISE EXCEPTION 'O lançamento do extrato não é da conta ou do período desta conciliação.' USING ERRCODE='23514'; END IF;
  IF i.pagamento_id IS NOT NULL THEN
   SELECT * INTO p FROM erp.pagamentos WHERE empresa_id=t AND id=i.pagamento_id;
   conta:=p.conta_financeira_id; limite:=p.valor_liquido;
   sentido:=CASE WHEN (p.tipo='receber')=(p.estorno_de_pagamento_id IS NULL) THEN 'credito' ELSE 'debito' END;
   SELECT coalesce(sum(valor_conciliado),0) INTO total FROM erp.conciliacoes_bancarias_itens WHERE empresa_id=t AND pagamento_id=p.id AND desfeito_em IS NULL;
   IF p.excluido_em IS NOT NULL THEN RAISE EXCEPTION 'Pagamento indisponível para conciliação.' USING ERRCODE='23514'; END IF;
  ELSIF i.adiantamento_id IS NOT NULL THEN
   SELECT * INTO a FROM erp.adiantamentos WHERE empresa_id=t AND id=i.adiantamento_id;
   conta:=a.conta_financeira_id; limite:=a.valor;
   IF a.tipo='reversao' THEN SELECT * INTO o FROM erp.adiantamentos WHERE empresa_id=t AND id=a.reversao_de_id; ELSE o:=a; END IF;
   sentido:=CASE WHEN ((a.lado='receber')=(o.tipo='constituicao'))=(a.tipo<>'reversao') THEN 'credito' ELSE 'debito' END;
   SELECT coalesce(sum(valor_conciliado),0) INTO total FROM erp.conciliacoes_bancarias_itens WHERE empresa_id=t AND adiantamento_id=a.id AND desfeito_em IS NULL;
  ELSE
   SELECT * INTO tr FROM erp.transferencias_financeiras WHERE empresa_id=t AND id=i.transferencia_financeira_id;
   IF tr.status='cancelada' OR tr.excluido_em IS NOT NULL OR b.conta_financeira_id NOT IN (tr.conta_origem_id,tr.conta_destino_id) THEN RAISE EXCEPTION 'A transferência está cancelada ou não envolve a conta do extrato.' USING ERRCODE='23514'; END IF;
   conta:=b.conta_financeira_id; limite:=tr.valor;
   sentido:=CASE WHEN conta=tr.conta_origem_id THEN 'debito' ELSE 'credito' END;
   SELECT coalesce(sum(x.valor_conciliado),0) INTO total FROM erp.conciliacoes_bancarias_itens x
    JOIN erp.transacoes_bancarias z ON z.empresa_id=x.empresa_id AND z.id=x.transacao_bancaria_id
    WHERE x.empresa_id=t AND x.transferencia_financeira_id=tr.id AND x.desfeito_em IS NULL AND z.conta_financeira_id=conta;
  END IF;
  IF conta IS DISTINCT FROM b.conta_financeira_id OR sentido IS DISTINCT FROM b.tipo OR total>limite THEN RAISE EXCEPTION 'O valor conciliado passa do movimento, ou a conta ou o sentido (entrada/saída) não confere com o extrato.' USING ERRCODE='23514'; END IF;
  SELECT sum(valor_conciliado) INTO total FROM erp.conciliacoes_bancarias_itens WHERE empresa_id=t AND transacao_bancaria_id=b.id AND desfeito_em IS NULL;
  IF total>b.valor THEN RAISE EXCEPTION 'O valor conciliado passa do valor do lançamento do extrato.' USING ERRCODE='23514'; END IF;
 END LOOP;
 -- Itens desfeitos também mudam marcadores: inclui extratos e pagamentos dos itens das conciliações tocadas.
 bs:=bs||ARRAY(SELECT transacao_bancaria_id FROM erp.conciliacoes_bancarias_itens WHERE empresa_id=t AND conciliacao_id=ANY(cs));
 ps:=ps||ARRAY(SELECT pagamento_id FROM erp.conciliacoes_bancarias_itens WHERE empresa_id=t AND conciliacao_id=ANY(cs) AND pagamento_id IS NOT NULL);
 FOR i IN SELECT pgto.id,pgto.conciliado,pgto.valor_liquido,coalesce(sum(link.valor_conciliado),0) conciliacao
  FROM erp.pagamentos pgto LEFT JOIN erp.conciliacoes_bancarias_itens link ON link.empresa_id=pgto.empresa_id AND link.pagamento_id=pgto.id AND link.desfeito_em IS NULL
  WHERE pgto.empresa_id=t AND pgto.id=ANY(ps) GROUP BY pgto.id LOOP
  IF i.conciliado IS DISTINCT FROM (i.valor_liquido>0 AND i.conciliacao=i.valor_liquido) THEN
   UPDATE erp.pagamentos SET conciliado=(i.valor_liquido>0 AND i.conciliacao=i.valor_liquido) WHERE empresa_id=t AND id=i.id;
  END IF;
 END LOOP;
 FOR i IN SELECT bank.id,bank.status,bank.valor,coalesce(sum(link.valor_conciliado),0) conciliacao
  FROM erp.transacoes_bancarias bank LEFT JOIN erp.conciliacoes_bancarias_itens link ON link.empresa_id=bank.empresa_id AND link.transacao_bancaria_id=bank.id AND link.desfeito_em IS NULL
  WHERE bank.empresa_id=t AND bank.id=ANY(bs) GROUP BY bank.id LOOP
  sentido:=CASE WHEN i.conciliacao=i.valor THEN 'conciliada' WHEN i.status='ignorada' AND i.conciliacao=0 THEN 'ignorada' ELSE 'pendente' END;
  IF i.status IS DISTINCT FROM sentido THEN UPDATE erp.transacoes_bancarias SET status=sentido WHERE empresa_id=t AND id=i.id; END IF;
 END LOOP;
 RETURN NULL;
END $function$;

CREATE OR REPLACE FUNCTION erp.registrar_operacao_idempotente(p_tabela text, p_dados jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE t bigint; existente bigint; original jsonb; cols text; dados jsonb; k text; canonico jsonb;
BEGIN
 IF p_tabela NOT IN ('adiantamentos','adiantamentos_aplicacoes','renegociacoes') OR jsonb_typeof(p_dados) IS DISTINCT FROM 'object' THEN
  RAISE EXCEPTION 'Operação inválida.' USING ERRCODE='23514'; END IF;
 t:=(p_dados->>'empresa_id')::bigint;
 IF NOT coalesce(shared.has_erp_capability(t,'erp.financeiro.gerenciar'),false) THEN RAISE EXCEPTION 'Você não tem permissão financeira para esta operação.' USING ERRCODE='42501'; END IF;
 IF nullif(btrim(p_dados->>'chave_idempotencia'),'') IS NULL OR p_dados ?| ARRAY['id','criado_em','criado_por','requisicao_original','requisicao_idempotente'] THEN
  RAISE EXCEPTION 'Chave obrigatoria; campos internos nao aceitos' USING ERRCODE='23514'; END IF;
 PERFORM erp.travar_evolucao(t);
 dados:=p_dados||jsonb_build_object('criado_por',nullif(current_setting('app.erp_user_id',true),'')::bigint);
 FOR k IN SELECT jsonb_object_keys(dados) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=('erp.'||p_tabela)::regclass AND attname=k AND attnum>0 AND NOT attisdropped) THEN
   RAISE EXCEPTION 'Campo desconhecido' USING ERRCODE='23514'; END IF;
 END LOOP;
 EXECUTE format('SELECT jsonb_object_agg(k,x.j->k) FROM (SELECT to_jsonb(jsonb_populate_record(NULL::erp.%I,$1)) j) x CROSS JOIN jsonb_object_keys($1) k',p_tabela) INTO canonico USING p_dados;
 EXECUTE format('SELECT id,requisicao_idempotente FROM erp.%I WHERE empresa_id=$1 AND chave_idempotencia=$2',p_tabela) INTO existente,original USING t,p_dados->>'chave_idempotencia';
 IF existente IS NOT NULL THEN
  IF original IS DISTINCT FROM canonico THEN RAISE EXCEPTION 'Esta identificação de operação já foi usada com outros dados.' USING ERRCODE='23514'; END IF;
  RETURN existente;
 END IF;
 dados:=dados||jsonb_build_object('requisicao_idempotente',canonico);
 SELECT string_agg(format('%I',key),',') INTO cols FROM jsonb_object_keys(dados) key;
 EXECUTE format('INSERT INTO erp.%I(%s) SELECT %s FROM jsonb_populate_record(NULL::erp.%I,$1) RETURNING id',p_tabela,cols,cols,p_tabela) INTO existente USING dados;
 RETURN existente;
END $function$;

CREATE OR REPLACE FUNCTION erp.preservar_arquivo_referenciado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 PERFORM erp.travar_evolucao(OLD.empresa_id);
 IF EXISTS(SELECT 1 FROM erp.contas_pagar_arquivos WHERE empresa_id=OLD.empresa_id AND arquivo_id=OLD.id)
 OR EXISTS(SELECT 1 FROM erp.compras_arquivos WHERE empresa_id=OLD.empresa_id AND arquivo_id=OLD.id)
 OR EXISTS(SELECT 1 FROM erp.contratos_vendas_arquivos WHERE empresa_id=OLD.empresa_id AND arquivo_id=OLD.id)
 OR EXISTS(SELECT 1 FROM erp.vendas_arquivos WHERE empresa_id=OLD.empresa_id AND arquivo_id=OLD.id)
 OR EXISTS(SELECT 1 FROM erp.ordens_servico_arquivos WHERE empresa_id=OLD.empresa_id AND arquivo_id=OLD.id)
 OR EXISTS(SELECT 1 FROM erp.contas_receber_arquivos WHERE empresa_id=OLD.empresa_id AND arquivo_id=OLD.id) THEN
  IF TG_OP='DELETE' OR (to_jsonb(OLD)-ARRAY['atualizado_em','atualizado_por']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['atualizado_em','atualizado_por']) THEN
  RAISE EXCEPTION 'Arquivo em uso não pode ser apagado.' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.preservar_evento_cobranca()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Evento registrado não pode ser apagado.' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND ((to_jsonb(OLD)-ARRAY['processado_em','erro_mensagem','atualizado_em','atualizado_por']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['processado_em','erro_mensagem','atualizado_em','atualizado_por'])
 OR OLD.processado_em IS NOT NULL OR NEW.processado_em IS NULL) THEN RAISE EXCEPTION 'Evento já processado não pode ser alterado.' USING ERRCODE='23514'; END IF;
 IF NEW.processado_em<NEW.recebido_em THEN RAISE EXCEPTION 'A data de processamento não pode ser anterior ao recebimento.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_importacao_diferida()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE j jsonb; doc bigint; head erp.importacoes_dados; n bigint; validas bigint; importadas bigint; erros bigint; ignoradas bigint; linha record; tabela text; existe boolean;
BEGIN
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 PERFORM erp.travar_evolucao((j->>'empresa_id')::bigint);
 IF TG_TABLE_NAME='importacoes_dados_linhas' THEN
  IF TG_OP='UPDATE' AND (OLD.importacao_id<>NEW.importacao_id OR OLD.numero_linha<>NEW.numero_linha OR OLD.empresa_id<>NEW.empresa_id OR
   (OLD.status='importada' AND to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW))) THEN RAISE EXCEPTION 'Linha já importada não pode ser alterada.' USING ERRCODE='23514'; END IF;
  IF TG_OP='DELETE' AND OLD.status='importada' THEN RAISE EXCEPTION 'Linha já importada não pode ser apagada.' USING ERRCODE='23514'; END IF;
 END IF;
 doc:=(j->>CASE WHEN TG_TABLE_NAME='importacoes_dados' THEN 'id' ELSE 'importacao_id' END)::bigint;
 SELECT * INTO head FROM erp.importacoes_dados WHERE empresa_id=(j->>'empresa_id')::bigint AND id=doc;
 IF head.id IS NULL THEN RETURN NULL; END IF;
 SELECT count(*),count(*) FILTER(WHERE status IN ('valida','importada')),count(*) FILTER(WHERE status='importada'),count(*) FILTER(WHERE status='erro'),count(*) FILTER(WHERE status='ignorada')
 INTO n,validas,importadas,erros,ignoradas FROM erp.importacoes_dados_linhas WHERE empresa_id=head.empresa_id AND importacao_id=doc;
 IF head.total_linhas<>n OR head.total_validas<>validas OR head.total_importadas<>importadas OR head.total_erros<>erros THEN RAISE EXCEPTION 'Os totais da importação não conferem com as linhas.' USING ERRCODE='23514'; END IF;
 IF (head.status IN ('concluida','parcial','falha','cancelada')) IS DISTINCT FROM (head.concluido_em IS NOT NULL) OR head.concluido_em<head.criado_em
 OR (head.status='concluida' AND (n<>importadas+ignoradas OR erros>0)) OR (head.status='parcial' AND (importadas=0 OR erros=0 OR n<>importadas+erros+ignoradas)) THEN RAISE EXCEPTION 'A situação da importação não confere com as linhas importadas.' USING ERRCODE='23514'; END IF;
 tabela:=CASE head.tipo WHEN 'clientes' THEN 'entidades' WHEN 'fornecedores' THEN 'entidades' ELSE head.tipo END;
 FOR linha IN SELECT * FROM erp.importacoes_dados_linhas WHERE empresa_id=head.empresa_id AND importacao_id=doc AND status='importada' LOOP
  IF linha.registro_id IS NULL OR linha.processado_em IS NULL THEN RAISE EXCEPTION 'Linha importada precisa do registro gerado e da data.' USING ERRCODE='23514'; END IF;
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM erp.%I WHERE empresa_id=$1 AND id=$2)',tabela) INTO existe USING head.empresa_id,linha.registro_id;
  IF NOT existe THEN RAISE EXCEPTION 'O registro gerado pela importação não existe nesta empresa.' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NULL;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_execucao_estado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Execução registrada não pode ser apagada.' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD.status='concluida' OR OLD.tipo<>NEW.tipo OR OLD.competencia<>NEW.competencia OR NEW.tentativas<OLD.tentativas) THEN RAISE EXCEPTION 'Execução concluída não pode ser alterada.' USING ERRCODE='23514'; END IF;
 IF (NEW.status='pendente' AND (NEW.iniciado_em IS NOT NULL OR NEW.finalizado_em IS NOT NULL OR NEW.tentativas<>0))
 OR (NEW.status='processando' AND (NEW.iniciado_em IS NULL OR NEW.finalizado_em IS NOT NULL OR NEW.tentativas<1))
 OR (NEW.status IN ('concluida','falha') AND (NEW.iniciado_em IS NULL OR NEW.finalizado_em IS NULL OR NEW.tentativas<1))
 OR NEW.finalizado_em<NEW.iniciado_em OR (NEW.status='falha' AND nullif(btrim(NEW.erro),'') IS NULL) THEN RAISE EXCEPTION 'A situação da execução não confere com as datas.' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND OLD.status='falha' AND NEW.status='processando' AND NEW.tentativas<>OLD.tentativas+1 THEN RAISE EXCEPTION 'Cada nova tentativa precisa ser contada.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.preservar_previsao_utilizada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE usada boolean;
BEGIN
 PERFORM erp.travar_evolucao(OLD.empresa_id);
 IF TG_TABLE_NAME='vendas_recebimentos_previstos' THEN
  SELECT EXISTS(SELECT 1 FROM erp.contas_receber_parcelas WHERE empresa_id=OLD.empresa_id AND recebimento_previsto_id=OLD.id) INTO usada;
 ELSE
  SELECT EXISTS(SELECT 1 FROM erp.contas_pagar_parcelas WHERE empresa_id=OLD.empresa_id AND parcela_prevista_id=OLD.id) INTO usada;
 END IF;
 IF usada AND (TG_OP='DELETE' OR to_jsonb(OLD)-ARRAY['atualizado_em','atualizado_por','observacoes'] IS DISTINCT FROM to_jsonb(NEW)-ARRAY['atualizado_em','atualizado_por','observacoes']) THEN RAISE EXCEPTION 'Previsão já convertida não pode ser alterada.' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_endereco_parcial()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF coalesce(nullif(btrim(NEW.logradouro),''),nullif(btrim(NEW.cidade),''),nullif(btrim(NEW.cep),''),nullif(btrim(NEW.numero),''),nullif(btrim(NEW.bairro),''),nullif(btrim(NEW.complemento),''),nullif(btrim(NEW.uf),'')) IS NULL THEN RAISE EXCEPTION 'Preencha pelo menos um campo do endereço.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.proteger_dependencias_financeiras()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE j jsonb; anterior jsonb; t bigint; b erp.transacoes_bancarias;
BEGIN
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 t:=(j->>'empresa_id')::bigint;
 PERFORM erp.travar_evolucao(t);
 IF TG_OP='UPDATE' THEN
  anterior:=to_jsonb(OLD);
  IF OLD.empresa_id<>NEW.empresa_id OR OLD.id<>NEW.id THEN RAISE EXCEPTION 'A identificação deste registro não pode mudar.' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME IN ('contas_receber','contas_pagar','contas_receber_parcelas','contas_pagar_parcelas') AND
   (anterior->'cliente_id' IS DISTINCT FROM j->'cliente_id' OR anterior->'fornecedor_id' IS DISTINCT FROM j->'fornecedor_id'
    OR anterior->'conta_receber_id' IS DISTINCT FROM j->'conta_receber_id' OR anterior->'conta_pagar_id' IS DISTINCT FROM j->'conta_pagar_id'
    OR anterior->'renegociacao_origem_id' IS DISTINCT FROM j->'renegociacao_origem_id') THEN
   RAISE EXCEPTION 'A origem deste título não pode mudar.' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME='conciliacoes_bancarias_itens' THEN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Conciliação não pode ser apagada; desfaça a conciliação.' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND ((to_jsonb(OLD)-ARRAY['desfeito_em','desfeito_por']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['desfeito_em','desfeito_por'])
   OR OLD.desfeito_em IS NOT NULL OR NEW.desfeito_em IS NULL OR NEW.desfeito_por IS NULL) THEN
   RAISE EXCEPTION 'Para desfazer a conciliação, informe quem desfez e quando.' USING ERRCODE='23514'; END IF;
  SELECT * INTO b FROM erp.transacoes_bancarias WHERE empresa_id=t AND id=NEW.transacao_bancaria_id;
  PERFORM erp.exigir_periodos_abertos(t,'financeiro',ARRAY[b.data_transacao,b.data_compensacao]);
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.preservar_chave_operacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE j jsonb; o jsonb; existe boolean;
BEGIN
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 PERFORM erp.travar_evolucao((j->>'empresa_id')::bigint);
 IF TG_OP<>'INSERT' THEN
  o:=to_jsonb(OLD);
  IF o->>'chave_idempotencia' IS NOT NULL AND (TG_OP='DELETE' OR
   (o->>'chave_idempotencia') IS DISTINCT FROM (j->>'chave_idempotencia') OR
   (o->>'id') IS DISTINCT FROM (j->>'id') OR (o->>'empresa_id') IS DISTINCT FROM (j->>'empresa_id')) THEN
   RAISE EXCEPTION 'A identificação desta operação não pode mudar, mesmo depois de cancelada.' USING ERRCODE='23514';
  END IF;
 END IF;
 IF TG_OP<>'DELETE' AND j->>'chave_idempotencia' IS NOT NULL THEN
  IF nullif(btrim(j->>'chave_idempotencia'),'') IS NULL THEN RAISE EXCEPTION 'Informe a identificação da operação.' USING ERRCODE='23514'; END IF;
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM erp.%I WHERE empresa_id=$1 AND chave_idempotencia=$2 AND id<>$3)',TG_TABLE_NAME)
  INTO existe USING NEW.empresa_id,NEW.chave_idempotencia,NEW.id;
  IF existe THEN RAISE EXCEPTION 'Esta identificação de operação já foi usada.' USING ERRCODE='23505'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_equacao_comercial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE bruto numeric; abatimento numeric; j jsonb;
BEGIN
 PERFORM erp.travar_evolucao(NEW.empresa_id);
 j:=to_jsonb(NEW);
 IF TG_TABLE_NAME IN ('vendas','compras') THEN
  IF NEW.tipo_desconto='percentual' AND NEW.desconto>100 THEN RAISE EXCEPTION 'O percentual não pode passar de 100.' USING ERRCODE='23514'; END IF;
  NEW.desconto_calculado:=CASE WHEN NEW.tipo_desconto='percentual' THEN round(NEW.subtotal*NEW.desconto/100,2) ELSE NEW.desconto END;
  IF NEW.desconto_calculado>NEW.subtotal THEN RAISE EXCEPTION 'O desconto não pode passar do subtotal.' USING ERRCODE='23514'; END IF;
 ELSE
  bruto:=round(NEW.quantidade*NEW.valor_unitario,2);
  IF TG_TABLE_NAME='compras_itens' THEN
   abatimento:=coalesce(round(bruto*NEW.percentual_desconto/100,2),NEW.valor_desconto);
   IF NEW.valor_desconto<>abatimento OR NEW.total<>bruto-abatimento THEN RAISE EXCEPTION 'O total do item da compra não confere com quantidade, preço e desconto.' USING ERRCODE='23514'; END IF;
   NEW.valor_bruto:=bruto; NEW.valor_liquido:=NEW.total;
  ELSE
   IF NEW.total<>bruto-NEW.desconto THEN RAISE EXCEPTION 'O total do item não confere com quantidade, preço e desconto.' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_os_diferida()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE j jsonb; o jsonb; doc bigint; v erp.ordens_servico; soma numeric;
BEGIN
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 IF TG_OP='UPDATE' THEN o:=to_jsonb(OLD); END IF;
 FOR doc IN SELECT DISTINCT x FROM unnest(ARRAY[
  (j->>CASE WHEN TG_TABLE_NAME='ordens_servico' THEN 'id' ELSE 'ordem_servico_id' END)::bigint,
  (o->>CASE WHEN TG_TABLE_NAME='ordens_servico' THEN 'id' ELSE 'ordem_servico_id' END)::bigint]) x WHERE x IS NOT NULL LOOP
  SELECT * INTO v FROM erp.ordens_servico WHERE empresa_id=(j->>'empresa_id')::bigint AND id=doc;
  IF v.status IN ('aprovada','em_execucao','concluida') AND v.excluido_em IS NULL THEN
   SELECT coalesce(sum(total),0) INTO soma FROM erp.ordens_servico_itens WHERE empresa_id=v.empresa_id AND ordem_servico_id=doc AND excluido_em IS NULL;
   IF v.subtotal<>soma OR v.total<>soma-v.desconto THEN RAISE EXCEPTION 'O total da OS não confere com os itens e o desconto.' USING ERRCODE='23514'; END IF;
  END IF;
 END LOOP;
 RETURN NULL;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_previsao_parcela()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE liquido numeric;
BEGIN
 liquido:=NEW.valor+NEW.juros+NEW.multa-NEW.desconto-NEW.taxa;
 IF liquido<0 THEN RAISE EXCEPTION 'O valor líquido da parcela não pode ficar negativo.' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NEW.valor_bruto=0 AND NEW.valor_liquido=0 THEN
  NEW.valor_bruto:=NEW.valor; NEW.valor_liquido:=liquido;
 ELSIF NEW.valor_bruto<>NEW.valor OR NEW.valor_liquido<>liquido THEN
  RAISE EXCEPTION 'Os valores da parcela não conferem: líquido = principal + juros + multa − desconto − taxa.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_rateio_diferido()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE j jsonb; lado text; doc bigint; total numeric; soma numeric; qtd bigint; invalido boolean; r record;
BEGIN
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 PERFORM erp.travar_evolucao((j->>'empresa_id')::bigint);
 IF TG_TABLE_NAME='rateios_financeiros' THEN
  IF TG_OP='UPDATE' AND ROW(OLD.empresa_id,OLD.tipo,OLD.conta_receber_id,OLD.conta_pagar_id) IS DISTINCT FROM ROW(NEW.empresa_id,NEW.tipo,NEW.conta_receber_id,NEW.conta_pagar_id) THEN RAISE EXCEPTION 'O rateio não pode ser movido para outro título.' USING ERRCODE='23514'; END IF;
  lado:=j->>'tipo'; doc:=(j->>('conta_'||lado||'_id'))::bigint;
 ELSE lado:=CASE WHEN TG_TABLE_NAME='contas_receber' THEN 'receber' ELSE 'pagar' END; doc:=(j->>'id')::bigint;
 END IF;
 EXECUTE format('SELECT valor_total FROM erp.contas_%s WHERE empresa_id=$1 AND id=$2',lado) INTO total USING (j->>'empresa_id')::bigint,doc;
 soma:=0; qtd:=0;
 FOR r IN EXECUTE format('SELECT * FROM erp.rateios_financeiros WHERE empresa_id=$1 AND conta_%s_id=$2 AND excluido_em IS NULL',lado) USING (j->>'empresa_id')::bigint,doc LOOP
  qtd:=qtd+1;
  IF r.valor IS NULL OR (r.percentual IS NOT NULL AND abs(r.valor-round(total*r.percentual/100,2))>0.01) THEN RAISE EXCEPTION 'Cada linha do rateio precisa de valor e percentual compatíveis.' USING ERRCODE='23514'; END IF;
  soma:=soma+r.valor;
 END LOOP;
 IF qtd>0 AND soma<>total THEN RAISE EXCEPTION 'O rateio precisa somar exatamente o total do título.' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_vinculo_previsao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE lado text; j jsonb; v_origem bigint; valido boolean; existe boolean;
BEGIN
 j:=to_jsonb(NEW); lado:=CASE WHEN TG_TABLE_NAME='contas_receber_parcelas' THEN 'receber' ELSE 'pagar' END;
 v_origem:=(j->>CASE WHEN lado='receber' THEN 'recebimento_previsto_id' ELSE 'parcela_prevista_id' END)::bigint;
 IF TG_OP='UPDATE' AND (to_jsonb(OLD)->>CASE WHEN lado='receber' THEN 'recebimento_previsto_id' ELSE 'parcela_prevista_id' END) IS NOT NULL AND
 (to_jsonb(OLD)->>CASE WHEN lado='receber' THEN 'recebimento_previsto_id' ELSE 'parcela_prevista_id' END)::bigint IS DISTINCT FROM v_origem THEN RAISE EXCEPTION 'Previsão já utilizada não pode ser alterada.' USING ERRCODE='23514'; END IF;
 IF v_origem IS NULL THEN RETURN NEW; END IF;
 PERFORM erp.travar_evolucao(NEW.empresa_id);
 IF lado='receber' THEN
  SELECT p.venda_id=t.venda_id AND p.valor=NEW.valor AND p.data_vencimento=NEW.data_vencimento INTO valido
  FROM erp.vendas_recebimentos_previstos p JOIN erp.contas_receber t ON t.empresa_id=p.empresa_id AND t.id=NEW.conta_receber_id WHERE p.empresa_id=NEW.empresa_id AND p.id=v_origem;
  SELECT EXISTS(SELECT 1 FROM erp.contas_receber_parcelas WHERE empresa_id=NEW.empresa_id AND recebimento_previsto_id=v_origem AND id<>NEW.id) INTO existe;
 ELSE
  SELECT p.compra_id=t.compra_id AND p.valor=NEW.valor AND p.data_vencimento=NEW.data_vencimento INTO valido
  FROM erp.compras_parcelas_previstas p JOIN erp.contas_pagar t ON t.empresa_id=p.empresa_id AND t.id=NEW.conta_pagar_id WHERE p.empresa_id=NEW.empresa_id AND p.id=v_origem;
  SELECT EXISTS(SELECT 1 FROM erp.contas_pagar_parcelas WHERE empresa_id=NEW.empresa_id AND parcela_prevista_id=v_origem AND id<>NEW.id) INTO existe;
 END IF;
 IF valido IS DISTINCT FROM true OR existe THEN RAISE EXCEPTION 'Esta previsão não corresponde ao documento ou já foi utilizada.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_notificacao_estado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Notificação registrada não pode ser apagada.' USING ERRCODE='23514'; END IF;
 PERFORM erp.travar_evolucao(NEW.empresa_id);
 IF NEW.agendada_em IS NULL OR nullif(btrim(NEW.destinatario),'') IS NULL THEN RAISE EXCEPTION 'Informe quando enviar e para quem.' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (ROW(OLD.empresa_id,OLD.id,OLD.cobranca_id,OLD.canal,OLD.destinatario,OLD.agendada_em) IS DISTINCT FROM ROW(NEW.empresa_id,NEW.id,NEW.cobranca_id,NEW.canal,NEW.destinatario,NEW.agendada_em)
 OR (OLD.enviada_em IS NOT NULL AND OLD.enviada_em IS DISTINCT FROM NEW.enviada_em)
 OR (OLD.entregue_em IS NOT NULL AND OLD.entregue_em IS DISTINCT FROM NEW.entregue_em)
 OR (OLD.visualizada_em IS NOT NULL AND OLD.visualizada_em IS DISTINCT FROM NEW.visualizada_em)) THEN RAISE EXCEPTION 'Os dados de envio e entrega da notificação não podem mudar.' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM erp.cobrancas_notificacoes WHERE empresa_id=NEW.empresa_id AND cobranca_id=NEW.cobranca_id AND canal=NEW.canal AND destinatario=NEW.destinatario AND agendada_em=NEW.agendada_em AND id<>NEW.id) THEN RAISE EXCEPTION 'Esta notificação já foi agendada.' USING ERRCODE='23505'; END IF;
 IF (NEW.status IN ('enviada','entregue','visualizada') AND NEW.enviada_em IS NULL)
 OR (NEW.status IN ('entregue','visualizada') AND NEW.entregue_em IS NULL)
 OR (NEW.status='visualizada' AND NEW.visualizada_em IS NULL)
 OR NEW.entregue_em<NEW.enviada_em OR NEW.visualizada_em<NEW.entregue_em
 OR (NEW.entregue_em IS NOT NULL AND NEW.status NOT IN ('entregue','visualizada'))
 OR (NEW.visualizada_em IS NOT NULL AND NEW.status<>'visualizada') THEN RAISE EXCEPTION 'A situação da notificação não confere com as datas de envio e entrega.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_saldo_estoque_final()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  saldo erp.saldos_estoque%ROWTYPE;
  movimentos numeric;
  reservas numeric;
  ultimo erp.movimentacoes_estoque%ROWTYPE;
  negativo boolean;
  linha jsonb := CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
BEGIN
  SELECT * INTO saldo FROM erp.saldos_estoque WHERE empresa_id=(linha->>'empresa_id')::bigint
    AND produto_id=(linha->>'produto_id')::bigint AND local_estoque_id=(linha->>'local_estoque_id')::bigint;
  IF NOT FOUND THEN RAISE EXCEPTION 'Este produto ainda não tem saldo de estoque neste local.' USING ERRCODE='23514'; END IF;
  SELECT permite_estoque_negativo INTO negativo FROM erp.produtos WHERE empresa_id=saldo.empresa_id AND id=saldo.produto_id;
  SELECT COALESCE(sum(quantidade),0) INTO movimentos FROM erp.movimentacoes_estoque WHERE empresa_id=saldo.empresa_id AND produto_id=saldo.produto_id AND local_estoque_id=saldo.local_estoque_id;
  SELECT COALESCE(sum(quantidade-quantidade_atendida),0) INTO reservas FROM erp.reservas_estoque WHERE empresa_id=saldo.empresa_id AND produto_id=saldo.produto_id AND local_estoque_id=saldo.local_estoque_id AND status='ativa';
  SELECT * INTO ultimo FROM erp.movimentacoes_estoque WHERE empresa_id=saldo.empresa_id AND produto_id=saldo.produto_id AND local_estoque_id=saldo.local_estoque_id ORDER BY id DESC LIMIT 1;
  IF saldo.quantidade_fisica <> movimentos OR saldo.quantidade_reservada <> reservas
    OR (NOT negativo AND saldo.quantidade_fisica < saldo.quantidade_reservada)
    OR saldo.quantidade_fisica::text IN ('NaN','Infinity','-Infinity')
    OR saldo.custo_medio::text IN ('NaN','Infinity','-Infinity')
    OR (ultimo.id IS NOT NULL AND (ultimo.saldo_apos <> saldo.quantidade_fisica OR ultimo.custo_medio_apos <> saldo.custo_medio)) THEN
    RAISE EXCEPTION 'O saldo de estoque não confere com os movimentos e as reservas.' USING ERRCODE='23514';
  END IF;
  RETURN NULL;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_kit_simples()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE raiz bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(NEW.empresa_id::int, hashtext('erp-stock-ledger'));
  SELECT produto_id INTO raiz FROM erp.kits_produtos WHERE empresa_id=NEW.empresa_id AND id=NEW.kit_id;
  IF raiz=NEW.produto_componente_id OR EXISTS(SELECT 1 FROM erp.kits_produtos WHERE empresa_id=NEW.empresa_id AND produto_id=NEW.produto_componente_id AND ativo AND excluido_em IS NULL)
    OR EXISTS(SELECT 1 FROM erp.kits_produtos_itens i JOIN erp.kits_produtos k ON k.empresa_id=i.empresa_id AND k.id=i.kit_id WHERE i.empresa_id=NEW.empresa_id AND i.produto_componente_id=raiz AND k.ativo AND k.excluido_em IS NULL) THEN
    RAISE EXCEPTION 'Um kit não pode conter outro kit.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_ativacao_kit_simples()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 PERFORM pg_advisory_xact_lock(NEW.empresa_id::int,hashtext('erp-stock-ledger'));
 IF NEW.ativo AND NEW.excluido_em IS NULL AND (
   EXISTS(SELECT 1 FROM erp.kits_produtos_itens i JOIN erp.kits_produtos k ON k.empresa_id=i.empresa_id AND k.id=i.kit_id WHERE i.empresa_id=NEW.empresa_id AND i.produto_componente_id=NEW.produto_id AND k.ativo AND k.excluido_em IS NULL)
   OR EXISTS(SELECT 1 FROM erp.kits_produtos_itens i JOIN erp.kits_produtos k ON k.empresa_id=i.empresa_id AND k.produto_id=i.produto_componente_id WHERE i.empresa_id=NEW.empresa_id AND i.kit_id=NEW.id AND k.ativo AND k.excluido_em IS NULL)) THEN
   RAISE EXCEPTION 'Um kit não pode conter outro kit.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.travar_ledger_estoque()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE linha jsonb := CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
BEGIN
 PERFORM pg_advisory_xact_lock((linha->>'empresa_id')::int,hashtext('erp-stock-ledger'));
 IF TG_OP='UPDATE' AND TG_TABLE_NAME IN ('saldos_estoque','reservas_estoque') THEN
   IF ROW(OLD.empresa_id,OLD.produto_id,OLD.local_estoque_id) IS DISTINCT FROM ROW(NEW.empresa_id,NEW.produto_id,NEW.local_estoque_id) THEN
     RAISE EXCEPTION 'O vínculo deste movimento de estoque não pode mudar.' USING ERRCODE='23514';
   END IF;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $function$;

CREATE OR REPLACE FUNCTION erp.proximo_ciclo_contrato(inicio date, periodicidade text, referencia date)
 RETURNS date
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE meses int; destino date; ultimo int;
BEGIN
 IF periodicidade='semanal' THEN RETURN inicio+7; END IF;
 IF periodicidade='quinzenal' THEN RETURN inicio+15; END IF;
 meses:=CASE periodicidade WHEN 'mensal' THEN 1 WHEN 'bimestral' THEN 2 WHEN 'trimestral' THEN 3 WHEN 'semestral' THEN 6 WHEN 'anual' THEN 12 END;
 IF meses IS NULL THEN RAISE EXCEPTION 'Periodicidade inválida.' USING ERRCODE='23514'; END IF;
 destino:=(date_trunc('month',inicio)+make_interval(months=>meses))::date;
 ultimo:=extract(day from destino+interval '1 month'-interval '1 day');
 RETURN destino+least(extract(day from referencia)::int,ultimo)-1;
END $function$;

CREATE OR REPLACE FUNCTION shared.proteger_usuario()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE empresa record;
BEGIN
 IF OLD.status='active' AND NEW.status<>'active' THEN
  FOR empresa IN SELECT e.id FROM shared.empresas e JOIN shared.usuarios_empresas m ON m.empresa_id=e.id
    WHERE m.usuario_id=OLD.id AND m.role='owner' AND m.status='active' AND e.status='active' ORDER BY e.id FOR UPDATE OF e LOOP
    IF NOT EXISTS(SELECT 1 FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id
      WHERE m.empresa_id=empresa.id AND m.usuario_id<>OLD.id AND m.role='owner' AND m.status='active' AND u.status='active') THEN
      RAISE EXCEPTION 'Transfira a propriedade ou suspenda a empresa antes de desativar o último proprietário.' USING ERRCODE='23514';
    END IF;
  END LOOP;
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION shared.proteger_historico()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN RAISE EXCEPTION 'O histórico de acessos não pode ser alterado.' USING ERRCODE='23514'; END $function$;

CREATE OR REPLACE FUNCTION shared.proteger_vinculo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE empresa bigint; estado text;
BEGIN
 empresa := CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END;
 IF TG_OP='UPDATE' AND (NEW.empresa_id<>OLD.empresa_id OR NEW.usuario_id<>OLD.usuario_id) THEN
   RAISE EXCEPTION 'O acesso não pode ser movido para outro usuário ou empresa.' USING ERRCODE='23514';
 END IF;
 -- Serialize all access mutations for this company, including direct SQL.
 SELECT status INTO estado FROM shared.empresas WHERE id=empresa FOR UPDATE;
 IF TG_OP<>'DELETE' AND NEW.suspenso_localmente THEN NEW.status:='suspended'; END IF;
 IF TG_OP<>'INSERT' AND OLD.role='owner' AND OLD.status='active' AND estado='active'
   AND (TG_OP='DELETE' OR NEW.role<>'owner' OR NEW.status<>'active')
   AND NOT EXISTS(SELECT 1 FROM shared.usuarios_empresas WHERE empresa_id=empresa AND usuario_id<>OLD.usuario_id AND role='owner' AND status='active') THEN
   RAISE EXCEPTION 'A empresa precisa manter pelo menos um proprietário ativo.' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NEW.role IN ('owner','admin') THEN NEW.perfil_acesso_id:='administrador';
 ELSIF NEW.perfil_acesso_id='administrador' THEN
   RAISE EXCEPTION 'O perfil administrador é só para proprietário ou administrador.' USING ERRCODE='23514';
 END IF;
 IF NEW.role='owner' AND NEW.status='active' THEN
   UPDATE shared.empresas SET proprietario_definido=true WHERE id=empresa AND NOT proprietario_definido;
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION shared.proteger_empresa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF NEW.id<>OLD.id OR (OLD.clerk_organization_id IS NOT NULL AND NEW.clerk_organization_id IS DISTINCT FROM OLD.clerk_organization_id) THEN
  RAISE EXCEPTION 'A identificação da empresa não pode mudar.' USING ERRCODE='23514';
 END IF;
 IF OLD.proprietario_definido AND NOT NEW.proprietario_definido THEN
  RAISE EXCEPTION 'A proteção de propriedade não pode ser removida.' USING ERRCODE='23514';
 END IF;
 IF NEW.status='active' AND OLD.status<>'active' AND NEW.proprietario_definido
  AND NOT EXISTS(SELECT 1 FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id
    WHERE m.empresa_id=OLD.id AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active') THEN
  RAISE EXCEPTION 'A empresa precisa de um proprietário ativo antes de ser reativada.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_filho_nota_fiscal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE nota record; origem record; empresa bigint; nota_id bigint;
BEGIN
  IF TG_OP='DELETE' THEN empresa:=OLD.empresa_id; nota_id:=OLD.nota_fiscal_id;
  ELSE empresa:=NEW.empresa_id; nota_id:=NEW.nota_fiscal_id; END IF;
  IF TG_OP='UPDATE' AND (NEW.empresa_id,NEW.nota_fiscal_id) IS DISTINCT FROM (OLD.empresa_id,OLD.nota_fiscal_id) THEN
    RAISE EXCEPTION 'Item/total fiscal não pode mudar de documento' USING ERRCODE='23514';
  END IF;
  SELECT * INTO nota FROM erp.notas_fiscais WHERE empresa_id=empresa AND id=nota_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nota fiscal não encontrada.' USING ERRCODE='23503'; END IF;
  IF nota.conteudo_bloqueado_em IS NOT NULL THEN RAISE EXCEPTION 'Itens e totais de nota autorizada não podem mudar.' USING ERRCODE='23514'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  IF TG_TABLE_NAME='notas_fiscais_itens' THEN
    IF NEW.venda_item_id IS NOT NULL THEN
      SELECT venda_id,produto_id,servico_id INTO origem FROM erp.vendas_itens WHERE empresa_id=empresa AND id=NEW.venda_item_id;
      IF NOT FOUND OR origem.venda_id IS DISTINCT FROM nota.venda_id OR NEW.produto_id IS DISTINCT FROM origem.produto_id
        OR NEW.servico_id IS DISTINCT FROM origem.servico_id THEN RAISE EXCEPTION 'Item fiscal incompatível com a venda' USING ERRCODE='23514'; END IF;
    END IF;
    IF NEW.compra_item_id IS NOT NULL THEN
      SELECT compra_id,produto_id,servico_id INTO origem FROM erp.compras_itens WHERE empresa_id=empresa AND id=NEW.compra_item_id;
      IF NOT FOUND OR origem.compra_id IS DISTINCT FROM nota.compra_id OR NEW.produto_id IS DISTINCT FROM origem.produto_id
        OR NEW.servico_id IS DISTINCT FROM origem.servico_id THEN RAISE EXCEPTION 'Item fiscal incompatível com a compra' USING ERRCODE='23514'; END IF;
    END IF;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_registro_integracao_fiscal()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE nota record;
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Registro de integração fiscal não pode ser excluído' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' THEN
    IF TG_TABLE_NAME='notas_fiscais_tentativas' AND
      (to_jsonb(NEW)-ARRAY['status','resposta_provedor','http_status','erro_codigo','erro_mensagem','enviada_em','concluida_em','proxima_tentativa_em','atualizado_em','atualizado_por'])
      IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','resposta_provedor','http_status','erro_codigo','erro_mensagem','enviada_em','concluida_em','proxima_tentativa_em','atualizado_em','atualizado_por']) THEN
      RAISE EXCEPTION 'Identidade e pedido da tentativa são imutáveis' USING ERRCODE='23514';
    END IF;
    IF TG_TABLE_NAME='notas_fiscais_retornos' AND
      (to_jsonb(NEW)-ARRAY['nota_fiscal_id','status','tentativas_processamento','processado_em','proxima_tentativa_em','erro_codigo','erro_mensagem','atualizado_em'])
      IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['nota_fiscal_id','status','tentativas_processamento','processado_em','proxima_tentativa_em','erro_codigo','erro_mensagem','atualizado_em']) THEN
      RAISE EXCEPTION 'Payload e identidade do retorno são imutáveis' USING ERRCODE='23514';
    END IF;
    IF TG_TABLE_NAME='notas_fiscais_retornos' AND OLD.nota_fiscal_id IS NOT NULL AND NEW.nota_fiscal_id IS DISTINCT FROM OLD.nota_fiscal_id THEN
      RAISE EXCEPTION 'Retorno já associado não pode mudar de nota' USING ERRCODE='23514';
    END IF;
  END IF;
  IF NEW.nota_fiscal_id IS NOT NULL THEN
    SELECT * INTO nota FROM erp.notas_fiscais WHERE empresa_id=NEW.empresa_id AND id=NEW.nota_fiscal_id FOR UPDATE;
    IF NOT FOUND OR NEW.provedor IS DISTINCT FROM nota.provedor OR NEW.ambiente IS DISTINCT FROM nota.ambiente
      OR NEW.referencia_externa IS DISTINCT FROM nota.referencia_externa THEN
      RAISE EXCEPTION 'Retorno/tentativa incompatível com a nota' USING ERRCODE='23514';
    END IF;
  END IF;
  IF TG_TABLE_NAME='notas_fiscais_tentativas' AND TG_OP='INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM erp.notas_fiscais_tentativas t WHERE t.empresa_id=NEW.empresa_id AND t.nota_fiscal_id=NEW.nota_fiscal_id
        AND t.acao=NEW.acao AND t.chave_idempotencia=NEW.chave_idempotencia AND t.request_hash<>NEW.request_hash
    ) THEN
      RAISE EXCEPTION 'Esta identificação de operação já foi usada com outros dados.' USING ERRCODE='23514';
    END IF;
    IF NEW.acao='emitir' AND nota.status NOT IN ('pronta_envio','aguardando_retorno','falha') THEN
      RAISE EXCEPTION 'Nota não preparada para tentativa de emissão' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.preservar_original_arquivo_fiscal()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  IF EXISTS(SELECT 1 FROM erp.notas_fiscais_arquivos a WHERE a.empresa_id=OLD.empresa_id AND a.arquivo_id=OLD.id) THEN
    IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Arquivo fiscal associado não pode ser excluído.' USING ERRCODE='23514'; END IF;
    IF (NEW.empresa_id,NEW.id,NEW.bucket,NEW.caminho,NEW.hash_sha256,NEW.excluido_em)
      IS DISTINCT FROM (OLD.empresa_id,OLD.id,OLD.bucket,OLD.caminho,OLD.hash_sha256,OLD.excluido_em) THEN
      RAISE EXCEPTION 'Localização e hash do arquivo fiscal são imutáveis' USING ERRCODE='23514';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_integridade_nota_fiscal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE documento record; config record;
BEGIN
  IF TG_OP='UPDATE' AND OLD.provedor='simulador_local' AND NEW.provedor IS DISTINCT FROM OLD.provedor THEN
    RAISE EXCEPTION 'Uma nota simulada não pode ser convertida em nota real.' USING ERRCODE='23514';
  END IF;
  IF TG_OP='DELETE' THEN
    IF OLD.conteudo_bloqueado_em IS NOT NULL THEN RAISE EXCEPTION 'Documento fiscal autorizado não pode ser excluído.' USING ERRCODE='23514'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP='UPDATE' AND OLD.conteudo_bloqueado_em IS NOT NULL THEN
    IF (to_jsonb(NEW)-ARRAY['modo_operacao','status','atualizado_em','atualizado_por','cancelada_em','erro_codigo','erro_mensagem','codigo_status_sefaz','motivo_status_sefaz','resposta_provedor','xml_url','pdf_url','danfe_url','versao'])
      IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['modo_operacao','status','atualizado_em','atualizado_por','cancelada_em','erro_codigo','erro_mensagem','codigo_status_sefaz','motivo_status_sefaz','resposta_provedor','xml_url','pdf_url','danfe_url','versao']) THEN
      RAISE EXCEPTION 'Nota fiscal autorizada não pode ser alterada.' USING ERRCODE='23514';
    END IF;
    IF NEW.status NOT IN ('emitida','cancelada','corrigida','denegada') OR
      (OLD.status IN ('cancelada','denegada') AND NEW.status<>OLD.status) THEN
      RAISE EXCEPTION 'Nota fiscal finalizada não pode mudar de situação.' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP='INSERT' THEN NEW.conteudo_bloqueado_em:=NULL; END IF;
  IF NEW.venda_id IS NOT NULL THEN
    SELECT cliente_id INTO documento FROM erp.vendas WHERE empresa_id=NEW.empresa_id AND id=NEW.venda_id;
    IF documento.cliente_id IS DISTINCT FROM NEW.entidade_id THEN RAISE EXCEPTION 'Destinatário diferente do cliente da venda.' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.compra_id IS NOT NULL THEN
    SELECT fornecedor_id INTO documento FROM erp.compras WHERE empresa_id=NEW.empresa_id AND id=NEW.compra_id;
    IF documento.fornecedor_id IS DISTINCT FROM NEW.entidade_id THEN RAISE EXCEPTION 'O emitente da nota precisa ser o fornecedor da compra.' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.provedor IS DISTINCT FROM 'simulador_local' AND NEW.direcao='saida' AND NEW.status IN ('pronta_envio','aguardando_retorno','emitida','corrigida','denegada') THEN
    SELECT * INTO config FROM erp.configuracoes_fiscais WHERE empresa_id=NEW.empresa_id AND id=NEW.configuracao_fiscal_id;
    IF NOT FOUND OR NEW.provedor IS DISTINCT FROM config.provedor OR NEW.ambiente IS DISTINCT FROM config.ambiente
      OR NEW.modelo_emissao IS NULL OR NEW.emitente_snapshot='{}'::jsonb OR NEW.destinatario_snapshot='{}'::jsonb THEN
      RAISE EXCEPTION 'A nota não está pronta para emissão: confira a configuração fiscal.' USING ERRCODE='23514';
    END IF;
    IF NEW.status='pronta_envio' AND (NOT config.ativo OR config.excluido_em IS NOT NULL) THEN
      RAISE EXCEPTION 'Configuração fiscal inativa.' USING ERRCODE='23514';
    END IF;
    IF NEW.modelo_emissao='nfse_nacional' AND (NEW.data_competencia IS NULL OR NEW.numero_dps IS NULL OR NEW.serie_dps IS NULL
      OR NEW.codigo_municipio_emissao IS NULL OR NEW.codigo_municipio_prestacao IS NULL) THEN
      RAISE EXCEPTION 'Identificação da DPS nacional incompleta.' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION shared.validar_vendedor_vinculo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  IF NEW.vendedor_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM erp.entidades e
    WHERE e.id = NEW.vendedor_id AND e.empresa_id = NEW.empresa_id AND e.eh_vendedor AND e.excluido_em IS NULL
  ) THEN
    RAISE EXCEPTION 'Vendedor inválido para esta empresa.' USING ERRCODE = '23514';
  END IF;
  IF NEW.escopo_vendas = 'proprias' AND NEW.vendedor_id IS NULL THEN
    RAISE EXCEPTION 'Para ver somente as próprias vendas, vincule o usuário a um vendedor.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_nivel_categoria()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE pai_do_pai bigint;
BEGIN
  IF NEW.categoria_pai_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.categoria_pai_id = NEW.id THEN RAISE EXCEPTION 'Categoria não pode ser pai dela mesma.' USING ERRCODE = '23514'; END IF;
  EXECUTE format('SELECT categoria_pai_id FROM %I.%I WHERE empresa_id = $1 AND id = $2', TG_TABLE_SCHEMA, TG_TABLE_NAME)
    INTO pai_do_pai USING NEW.empresa_id, NEW.categoria_pai_id;
  IF pai_do_pai IS NOT NULL THEN RAISE EXCEPTION 'Categorias têm no máximo 2 níveis.' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'UPDATE' THEN
    EXECUTE format('SELECT categoria_pai_id FROM %I.%I WHERE empresa_id = $1 AND categoria_pai_id = $2 AND excluido_em IS NULL LIMIT 1', TG_TABLE_SCHEMA, TG_TABLE_NAME)
      INTO pai_do_pai USING NEW.empresa_id, NEW.id;
    IF pai_do_pai IS NOT NULL THEN RAISE EXCEPTION 'Categoria com subcategorias não pode virar subcategoria.' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.proteger_grupo_dre()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  IF NEW.empresa_id <> OLD.empresa_id OR NEW.codigo <> OLD.codigo OR NEW.natureza <> OLD.natureza OR NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Os grupos da DRE são fixos: só nome e ordem podem mudar.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.herdar_classificacao_categoria()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE pai record;
BEGIN
  IF NEW.categoria_pai_id IS NOT NULL THEN
    SELECT tipo, dre_grupo_id, fora_dre INTO pai FROM erp.categorias WHERE empresa_id = NEW.empresa_id AND id = NEW.categoria_pai_id;
    IF pai.tipo IS DISTINCT FROM NEW.tipo THEN RAISE EXCEPTION 'Subcategoria precisa ser do mesmo tipo da categoria-pai.' USING ERRCODE = '23514'; END IF;
    NEW.dre_grupo_id := pai.dre_grupo_id; NEW.fora_dre := pai.fora_dre;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.preservar_classificacao_usada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE usado boolean:=false; r record; achou boolean; campo text;
BEGIN
 PERFORM erp.travar_evolucao(NEW.empresa_id);
 IF TG_OP='UPDATE' AND (OLD.empresa_id<>NEW.empresa_id OR OLD.id<>NEW.id) THEN RAISE EXCEPTION 'A identificação do cadastro não pode mudar.' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='categorias' THEN
  IF EXISTS(WITH RECURSIVE pais AS (
   SELECT id,categoria_pai_id,ARRAY[id] caminho FROM erp.categorias WHERE empresa_id=NEW.empresa_id AND id=NEW.categoria_pai_id
   UNION ALL SELECT c.id,c.categoria_pai_id,p.caminho||c.id FROM pais p JOIN erp.categorias c ON c.empresa_id=NEW.empresa_id AND c.id=p.categoria_pai_id WHERE NOT c.id=ANY(p.caminho)
  ) SELECT 1 FROM pais WHERE id=NEW.id) OR NEW.categoria_pai_id=NEW.id THEN RAISE EXCEPTION 'Uma categoria não pode ficar dentro dela mesma.' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' OR OLD.tipo IS NOT DISTINCT FROM NEW.tipo THEN RETURN NEW; END IF;
  campo:='categoria_id';
 ELSE
  IF TG_OP='INSERT' OR ROW(OLD.saldo_inicial,OLD.data_saldo_inicial,OLD.tipo) IS NOT DISTINCT FROM ROW(NEW.saldo_inicial,NEW.data_saldo_inicial,NEW.tipo) THEN RETURN NEW; END IF;
  campo:='conta_financeira_id';
 END IF;
 FOR r IN SELECT ns.nspname schema_name,cl.relname tabela,a.attname coluna FROM pg_constraint fk
 JOIN pg_class cl ON cl.oid=fk.conrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace
 JOIN unnest(fk.conkey) k ON true JOIN pg_attribute a ON a.attrelid=cl.oid AND a.attnum=k
 WHERE fk.contype='f' AND fk.confrelid=TG_RELID AND a.attname<>'empresa_id' AND ns.nspname='erp' AND cl.relname<>TG_TABLE_NAME LOOP
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.%I WHERE empresa_id=$1 AND %I=$2)',r.schema_name,r.tabela,r.coluna) INTO achou USING NEW.empresa_id,NEW.id;
  usado:=usado OR achou;
 END LOOP;
 IF usado THEN RAISE EXCEPTION 'Classificação ou saldo inicial já usados não podem mudar; crie um novo cadastro.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.exigir_obrigacao_efetiva()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE linha jsonb := to_jsonb(NEW); parcela bigint; tipo text;
BEGIN
  parcela := (linha ->> 'conta_pagar_parcela_id')::bigint;
  IF parcela IS NOT NULL THEN
    SELECT t.tipo_lancamento INTO tipo FROM erp.contas_pagar_parcelas p JOIN erp.contas_pagar t ON t.empresa_id = p.empresa_id AND t.id = p.conta_pagar_id
    WHERE p.empresa_id = NEW.empresa_id AND p.id = parcela;
    IF tipo = 'previsao' THEN RAISE EXCEPTION 'Efetive a previsão antes de registrar a baixa.' USING ERRCODE = '23514'; END IF;
  END IF;
  parcela := (linha ->> 'conta_receber_parcela_id')::bigint;
  IF parcela IS NOT NULL THEN
    SELECT t.tipo_lancamento INTO tipo FROM erp.contas_receber_parcelas p JOIN erp.contas_receber t ON t.empresa_id = p.empresa_id AND t.id = p.conta_receber_id
    WHERE p.empresa_id = NEW.empresa_id AND p.id = parcela;
    IF tipo = 'previsao' THEN RAISE EXCEPTION 'Efetive a receita prevista antes de receber.' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.anexar_arquivo(empresa_id bigint, p_tipo text, p_registro_id bigint, p_caminho text, p_nome text, p_mime_type text, p_tamanho bigint, p_finalidade text, p_limite_bytes bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
#variable_conflict use_column
DECLARE empresa bigint := shared.erp_empresa_contexto(); usuario bigint := shared.current_user_id(); d record; achou boolean; usado bigint; novo bigint;
BEGIN
  IF $1 IS DISTINCT FROM shared.erp_empresa_contexto() THEN RAISE EXCEPTION 'Empresa diferente da sessão' USING ERRCODE = '42501'; END IF;
  SELECT * INTO d FROM erp.anexo_destino(p_tipo);
  IF d.tabela IS NULL THEN RAISE EXCEPTION 'Tipo de documento sem anexos.' USING ERRCODE = '22023'; END IF;
  IF empresa IS NULL OR NOT shared.has_erp_capability(empresa, d.escrita) THEN RAISE EXCEPTION 'Sem permissão para anexar neste documento.' USING ERRCODE = '42501'; END IF;
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM erp.%I WHERE empresa_id = $1 AND id = $2%s)', d.tabela,
    CASE WHEN p_tipo = 'pagamento' THEN '' ELSE ' AND excluido_em IS NULL' END) INTO achou USING empresa, p_registro_id;
  IF NOT achou THEN RAISE EXCEPTION 'Documento não encontrado nesta empresa.' USING ERRCODE = '22023'; END IF;
  IF p_caminho NOT LIKE empresa::text || '/%' THEN RAISE EXCEPTION 'Caminho fora da empresa' USING ERRCODE = '22023'; END IF;
  SELECT coalesce(sum(tamanho_bytes), 0) INTO usado FROM erp.arquivos WHERE empresa_id = empresa AND excluido_em IS NULL;
  IF usado + p_tamanho > p_limite_bytes THEN RAISE EXCEPTION 'Limite de armazenamento de anexos da empresa atingido.' USING ERRCODE = '22023'; END IF;
  -- O vínculo com o documento só é criado na confirmação: arquivos vinculados a vendas, contratos, OS e contas a
  -- receber ficam imutáveis (preservação documental), e o pendente ainda precisa ser atualizado.
  INSERT INTO erp.arquivos (empresa_id, bucket, caminho, nome, mime_type, tamanho_bytes, criado_por, atualizado_por, metadata)
  VALUES (empresa, 'erp-anexos', p_caminho, p_nome, p_mime_type, p_tamanho, usuario, usuario,
    jsonb_build_object('pendente', true, 'documento', p_tipo, 'registro_id', p_registro_id,
      'finalidade', coalesce(nullif(btrim(p_finalidade), ''), CASE WHEN p_tipo = 'pagamento' THEN 'comprovante' ELSE 'anexo' END)))
  RETURNING id INTO novo;
  RETURN novo;
END $function$;

CREATE OR REPLACE FUNCTION erp.confirmar_anexo(empresa_id bigint, p_arquivo_id bigint, p_hash text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
#variable_conflict use_column
DECLARE empresa bigint := shared.erp_empresa_contexto(); usuario bigint := shared.current_user_id(); a record; d record; finalidade text;
BEGIN
  IF $1 IS DISTINCT FROM empresa THEN RAISE EXCEPTION 'Empresa diferente da sessão' USING ERRCODE = '42501'; END IF;
  SELECT * INTO a FROM erp.anexo_acessivel($1, p_arquivo_id, true);
  IF a.id IS NULL THEN RAISE EXCEPTION 'Anexo não encontrado.' USING ERRCODE = '22023'; END IF;
  IF NOT a.pendente THEN RETURN true; END IF;
  SELECT x.metadata ->> 'finalidade' INTO finalidade FROM erp.arquivos x WHERE x.empresa_id = empresa AND x.id = p_arquivo_id;
  UPDATE erp.arquivos SET metadata = metadata || '{"pendente": false}'::jsonb, hash_sha256 = coalesce(p_hash, hash_sha256), atualizado_por = usuario
  WHERE empresa_id = empresa AND id = p_arquivo_id;
  SELECT * INTO d FROM erp.anexo_destino(a.documento);
  IF d.tem_finalidade THEN
    EXECUTE format('INSERT INTO erp.%I (empresa_id, %I, arquivo_id, finalidade, criado_por) VALUES ($1, $2, $3, $4, $5)', d.vinculo, d.coluna)
      USING empresa, a.registro_id, p_arquivo_id, coalesce(finalidade, 'anexo'), usuario;
  ELSE
    EXECUTE format('INSERT INTO erp.%I (empresa_id, %I, arquivo_id, criado_por) VALUES ($1, $2, $3, $4)', d.vinculo, d.coluna)
      USING empresa, a.registro_id, p_arquivo_id, usuario;
  END IF;
  RETURN true;
END $function$;

CREATE OR REPLACE FUNCTION erp.remover_anexo(empresa_id bigint, p_arquivo_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
#variable_conflict use_column
DECLARE empresa bigint := shared.erp_empresa_contexto(); a record; d record;
BEGIN
  IF $1 IS DISTINCT FROM shared.erp_empresa_contexto() THEN RAISE EXCEPTION 'Empresa diferente da sessão' USING ERRCODE = '42501'; END IF;
  SELECT * INTO a FROM erp.anexo_acessivel($1, p_arquivo_id, true);
  IF a.id IS NULL THEN RAISE EXCEPTION 'Anexo não encontrado ou sem permissão.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO d FROM erp.anexo_destino(a.documento);
  IF NOT a.pendente AND d.vinculo NOT IN ('pagamentos_arquivos', 'contas_pagar_arquivos', 'compras_arquivos') THEN
    RAISE EXCEPTION 'O anexo deste documento não pode ser removido.' USING ERRCODE = '22023';
  END IF;
  UPDATE erp.arquivos SET excluido_em = now(), atualizado_por = shared.current_user_id() WHERE empresa_id = empresa AND id = p_arquivo_id;
  IF NOT a.pendente THEN
    EXECUTE format('UPDATE erp.%I SET excluido_em = now() WHERE empresa_id = $1 AND arquivo_id = $2', d.vinculo) USING empresa, p_arquivo_id;
  END IF;
  RETURN true;
END $function$;

CREATE OR REPLACE FUNCTION erp.registrar_pdf_armazenado(p_empresa bigint, p_nota bigint, p_versao integer, p_layout integer, p_caminho text, p_nome text, p_tamanho bigint, p_hash text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE n erp.notas_fiscais; a erp.arquivos; pdf_id bigint; actor bigint;
BEGIN
  actor:=shared.current_user_id();
  IF p_empresa IS DISTINCT FROM shared.erp_empresa_contexto() OR actor IS NULL THEN
    RAISE EXCEPTION 'Contexto fiscal inválido' USING ERRCODE='42501'; END IF;
  SELECT * INTO n FROM erp.notas_fiscais WHERE empresa_id=p_empresa AND id=p_nota AND excluido_em IS NULL FOR UPDATE;
  IF n.id IS NULL OR n.tipo<>'nfse' OR n.modo_operacao<>'simulacao' OR n.direcao<>'saida'
    OR NOT shared.has_erp_capability(p_empresa,'erp.vendas.gerenciar') THEN
    RAISE EXCEPTION 'Sem permissão para registrar este PDF fiscal.' USING ERRCODE='42501'; END IF;
  IF p_versao<>n.versao OR p_layout<=0 OR p_tamanho NOT BETWEEN 100 AND 2097152 OR p_hash !~ '^[0-9a-f]{64}$'
    OR p_caminho IS DISTINCT FROM p_empresa||'/notas/'||p_nota||'/v'||p_versao||'/layout-'||p_layout||'/'||p_hash||'.pdf' THEN
    RAISE EXCEPTION 'Referência do PDF fiscal inválida' USING ERRCODE='22023'; END IF;
  SELECT id INTO pdf_id FROM erp.notas_fiscais_pdfs WHERE empresa_id=p_empresa AND nota_fiscal_id=p_nota AND versao=p_versao AND layout_versao=p_layout;
  IF pdf_id IS NOT NULL THEN RETURN pdf_id; END IF;
  INSERT INTO erp.arquivos(empresa_id,bucket,caminho,nome,mime_type,tamanho_bytes,hash_sha256,criado_por,atualizado_por,metadata)
    VALUES(p_empresa,'erp-fiscal',p_caminho,p_nome,'application/pdf',p_tamanho,p_hash,actor,actor,jsonb_build_object('documento','nota_fiscal','nota_fiscal_id',p_nota,'versao',p_versao,'layout_versao',p_layout))
    ON CONFLICT(bucket,caminho) WHERE bucket='erp-fiscal' DO NOTHING;
  SELECT * INTO a FROM erp.arquivos WHERE bucket='erp-fiscal' AND caminho=p_caminho;
  IF a.empresa_id<>p_empresa OR a.nome<>p_nome OR a.hash_sha256<>p_hash OR a.tamanho_bytes<>p_tamanho OR a.excluido_em IS NOT NULL THEN
    RAISE EXCEPTION 'Arquivo fiscal já registrado com outros metadados' USING ERRCODE='23514'; END IF;
  INSERT INTO erp.notas_fiscais_arquivos(empresa_id,nota_fiscal_id,arquivo_id,finalidade,descricao,criado_por)
    VALUES(p_empresa,p_nota,a.id,'documento_auxiliar','PDF fiscal privado e versionado',actor) ON CONFLICT(empresa_id,nota_fiscal_id,arquivo_id) DO NOTHING;
  INSERT INTO erp.notas_fiscais_pdfs(empresa_id,nota_fiscal_id,versao,layout_versao,arquivo_id,hash_sha256,nome,criado_por)
    VALUES(p_empresa,p_nota,p_versao,p_layout,a.id,p_hash,p_nome,actor) RETURNING id INTO pdf_id;
  RETURN pdf_id;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_pdf_comercial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE tipo text; documento bigint; a erp.arquivos;
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'O PDF de uma revisão não pode ser alterado.' USING ERRCODE='23514'; END IF;
 tipo:=CASE WHEN NEW.orcamento_id IS NOT NULL THEN 'orcamento' ELSE 'ordem_servico' END;
 documento:=coalesce(NEW.orcamento_id,NEW.ordem_servico_id);
 IF tipo='orcamento' AND NOT EXISTS(SELECT 1 FROM erp.vendas WHERE empresa_id=NEW.empresa_id AND id=documento AND tipo_documento='orcamento') THEN
   RAISE EXCEPTION 'O PDF precisa pertencer a um orçamento.' USING ERRCODE='23514'; END IF;
 SELECT * INTO a FROM erp.arquivos WHERE empresa_id=NEW.empresa_id AND id=NEW.arquivo_id;
 IF a.id IS NULL OR a.bucket<>'erp-comercial' OR a.mime_type<>'application/pdf' OR a.excluido_em IS NOT NULL
    OR a.tamanho_bytes NOT BETWEEN 100 AND 2097152
    OR a.caminho IS DISTINCT FROM NEW.empresa_id||'/'||tipo||'/'||documento||'/r'||NEW.revisao||'/layout-'||NEW.layout_versao||'/'||a.hash_sha256||'.pdf' THEN
   RAISE EXCEPTION 'Metadados do PDF comercial inválidos' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.registrar_pdf_comercial(p_empresa bigint, p_tipo text, p_documento bigint, p_revisao integer, p_origem integer, p_layout integer, p_caminho text, p_nome text, p_tamanho bigint, p_hash text, p_snapshot_hash text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE actor bigint:=shared.current_user_id(); a bigint; pdf bigint; version integer; seller bigint;
BEGIN
 IF p_empresa IS DISTINCT FROM shared.erp_empresa_contexto() OR actor IS NULL OR NOT shared.has_erp_capability(p_empresa,'erp.vendas.gerenciar') THEN RAISE EXCEPTION 'Sem permissão para arquivar PDF comercial.' USING ERRCODE='42501'; END IF;
 IF p_tipo='orcamento' THEN
  SELECT versao,vendedor_id INTO version,seller FROM erp.vendas WHERE empresa_id=p_empresa AND id=p_documento AND tipo_documento='orcamento' AND excluido_em IS NULL FOR UPDATE;
  IF shared.erp_vendedor_restrito() IS NOT NULL AND seller IS DISTINCT FROM shared.erp_vendedor_restrito() THEN RAISE EXCEPTION 'Orçamento indisponível.' USING ERRCODE='42501'; END IF;
 ELSIF p_tipo='ordem_servico' THEN
  SELECT versao INTO version FROM erp.ordens_servico WHERE empresa_id=p_empresa AND id=p_documento AND excluido_em IS NULL FOR UPDATE;
 ELSE RAISE EXCEPTION 'Tipo de documento inválido.' USING ERRCODE='22023'; END IF;
 IF version IS NULL OR version<>p_origem OR p_revisao<1 OR p_layout<1 OR p_tamanho NOT BETWEEN 100 AND 2097152 OR p_hash !~ '^[a-f0-9]{64}$' OR p_snapshot_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Referência do PDF comercial inválida' USING ERRCODE='23514'; END IF;
 INSERT INTO erp.arquivos(empresa_id,bucket,caminho,nome,mime_type,tamanho_bytes,hash_sha256,criado_por,atualizado_por,metadata)
  VALUES(p_empresa,'erp-comercial',p_caminho,p_nome,'application/pdf',p_tamanho,p_hash,actor,actor,jsonb_build_object('documento',p_tipo,'registro_id',p_documento,'revisao',p_revisao,'layout_versao',p_layout)) RETURNING id INTO a;
 INSERT INTO erp.documentos_comerciais_pdfs(empresa_id,orcamento_id,ordem_servico_id,revisao,origem_versao,layout_versao,arquivo_id,snapshot_hash,criado_por)
  VALUES(p_empresa,CASE WHEN p_tipo='orcamento' THEN p_documento END,CASE WHEN p_tipo='ordem_servico' THEN p_documento END,p_revisao,p_origem,p_layout,a,p_snapshot_hash,actor) RETURNING id INTO pdf;
 IF p_tipo='orcamento' THEN
  INSERT INTO erp.vendas_arquivos(empresa_id,venda_id,arquivo_id,finalidade,descricao,criado_por) VALUES(p_empresa,p_documento,a,'proposta','PDF comercial - revisão '||p_revisao,actor);
  INSERT INTO erp.vendas_eventos(empresa_id,venda_id,evento,versao,dados,criado_por) VALUES(p_empresa,p_documento,'pdf_arquivado',version,jsonb_build_object('revisao',p_revisao,'pdf_id',pdf),actor);
 ELSE
  INSERT INTO erp.ordens_servico_arquivos(empresa_id,ordem_servico_id,arquivo_id,finalidade,descricao,criado_por) VALUES(p_empresa,p_documento,a,'ordem_servico','PDF comercial - revisão '||p_revisao,actor);
  INSERT INTO erp.ordens_servico_eventos(empresa_id,ordem_servico_id,evento,dados,criado_por) VALUES(p_empresa,p_documento,'pdf_arquivado',jsonb_build_object('revisao',p_revisao,'pdf_id',pdf),actor);
 END IF;
 RETURN pdf;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_vinculo_contabil()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 IF NEW.conta_contabil_id IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND NEW.empresa_id IS NOT DISTINCT FROM OLD.empresa_id AND NEW.conta_contabil_id IS NOT DISTINCT FROM OLD.conta_contabil_id AND NOT (NEW.ativo AND NOT OLD.ativo) THEN RETURN NEW; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('erp:contabilidade:'||NEW.empresa_id::text,0));
 IF NOT EXISTS(SELECT 1 FROM erp.contas_contabeis WHERE empresa_id=NEW.empresa_id AND id=NEW.conta_contabil_id AND tipo='analitica' AND ativo AND excluido_em IS NULL) THEN
  RAISE EXCEPTION 'Selecione uma conta contábil analítica ativa da mesma empresa.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_conta_contabil()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE pai record; vinculado boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('erp:contabilidade:'||(CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END)::text,0));
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Conta contábil não pode ser apagada; desative-a.' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.empresa_id IS DISTINCT FROM OLD.empresa_id THEN
   RAISE EXCEPTION 'A identificação da conta contábil não pode mudar.' USING ERRCODE='23514';
  END IF;
  IF NEW.versao <> OLD.versao+1 THEN RAISE EXCEPTION 'CONFLITO_VERSAO: incremente a versão da conta contábil' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.conta_pai_id IS NOT NULL THEN
  SELECT tipo,classificacao,ativo INTO pai FROM erp.contas_contabeis WHERE empresa_id=NEW.empresa_id AND id=NEW.conta_pai_id;
  IF NOT FOUND OR pai.tipo <> 'sintetica' OR pai.classificacao <> NEW.classificacao THEN
   RAISE EXCEPTION 'A conta superior precisa ser sintética e da mesma classificação.' USING ERRCODE='23514';
  END IF;
  IF EXISTS(WITH RECURSIVE ancestrais AS (
   SELECT id,conta_pai_id,ativo,ARRAY[id] caminho FROM erp.contas_contabeis WHERE empresa_id=NEW.empresa_id AND id=NEW.conta_pai_id
   UNION ALL SELECT c.id,c.conta_pai_id,c.ativo,a.caminho||c.id FROM erp.contas_contabeis c JOIN ancestrais a ON c.empresa_id=NEW.empresa_id AND c.id=a.conta_pai_id WHERE NOT c.id=ANY(a.caminho)
  ) SELECT 1 FROM ancestrais WHERE id=NEW.id OR (NEW.ativo AND NOT ativo)) THEN
   RAISE EXCEPTION 'A conta superior não pode ser ela mesma, uma filha dela ou estar inativa.' USING ERRCODE='23514';
  END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM erp.contas_contabeis c WHERE c.empresa_id=NEW.empresa_id AND c.conta_pai_id=NEW.id
    AND (NEW.tipo <> 'sintetica' OR c.classificacao <> NEW.classificacao OR (NOT NEW.ativo AND c.ativo))) THEN
  RAISE EXCEPTION 'A alteração não combina com as contas filhas; revise-as primeiro.' USING ERRCODE='23514';
 END IF;
 SELECT EXISTS(SELECT 1 FROM erp.categorias WHERE empresa_id=NEW.empresa_id AND conta_contabil_id=NEW.id)
     OR EXISTS(SELECT 1 FROM erp.contas_financeiras WHERE empresa_id=NEW.empresa_id AND conta_contabil_id=NEW.id) INTO vinculado;
 IF vinculado AND (NEW.tipo <> 'analitica' OR (TG_OP='UPDATE' AND (NEW.codigo IS DISTINCT FROM OLD.codigo OR NEW.classificacao IS DISTINCT FROM OLD.classificacao OR NEW.natureza IS DISTINCT FROM OLD.natureza))) THEN
  RAISE EXCEPTION 'Conta contábil em uso: código, classificação, natureza e tipo não podem mudar.' USING ERRCODE='23514';
 END IF;
 IF NOT NEW.ativo AND (EXISTS(SELECT 1 FROM erp.categorias WHERE empresa_id=NEW.empresa_id AND conta_contabil_id=NEW.id AND ativo AND excluido_em IS NULL)
   OR EXISTS(SELECT 1 FROM erp.contas_financeiras WHERE empresa_id=NEW.empresa_id AND conta_contabil_id=NEW.id AND ativo AND excluido_em IS NULL)) THEN
  RAISE EXCEPTION 'Desvincule os cadastros ativos antes de desativar esta conta contábil.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $function$;

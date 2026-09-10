BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
-- Apenas DDL: nenhuma leitura, reconstrucao ou saneamento de registros existentes.
-- Validacoes de linhas novas/alteradas ficam em triggers, sem backfill.
CREATE OR REPLACE FUNCTION erp.validar_fechamento_venda(p_tenant_id bigint, p_venda_id bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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

  IF round(documento.subtotal - CASE WHEN documento.tipo_desconto='percentual' THEN round(documento.subtotal*documento.desconto/100,2) ELSE documento.desconto END + documento.frete, 2) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'Composicao do total da venda invalida';
  END IF;

  SELECT COALESCE(sum(valor), 0) INTO total_parcelas
  FROM erp.vendas_recebimentos_previstos
  WHERE tenant_id = p_tenant_id AND venda_id = p_venda_id AND excluido_em IS NULL;

  IF round(total_parcelas, 2) <> round(documento.total, 2) THEN
    RAISE EXCEPTION 'Soma das parcelas da venda (%) difere do total (%)', total_parcelas, documento.total;
  END IF;
END;
$function$
;
CREATE OR REPLACE FUNCTION erp.validar_fechamento_compra(p_tenant_id bigint, p_compra_id bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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

  IF round(documento.subtotal - CASE WHEN documento.tipo_desconto='percentual' THEN round(documento.subtotal*documento.desconto/100,2) ELSE documento.desconto END + documento.frete
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
$function$
;
CREATE OR REPLACE FUNCTION erp.validar_documento_diferido()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
  IF TG_OP='UPDATE' THEN
    IF TG_TABLE_NAME IN ('vendas_itens','vendas_recebimentos_previstos') THEN
      IF OLD.venda_id IS DISTINCT FROM NEW.venda_id THEN PERFORM erp.validar_fechamento_venda(OLD.tenant_id,OLD.venda_id); END IF;
    ELSIF TG_TABLE_NAME IN ('compras_itens','compras_parcelas_previstas') THEN
      IF OLD.compra_id IS DISTINCT FROM NEW.compra_id THEN PERFORM erp.validar_fechamento_compra(OLD.tenant_id,OLD.compra_id); END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION erp.validar_contrato_versionado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v erp.contratos_vendas_versoes; g erp.contratos_vendas_geracoes; cid bigint; tid bigint;
BEGIN
 tid:=CASE WHEN TG_OP='DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END;
 PERFORM erp.travar_evolucao(tid);
 IF TG_TABLE_NAME='contratos_vendas_versoes' THEN
  IF TG_OP='DELETE' AND OLD.status='efetivada' THEN RAISE EXCEPTION 'Versao efetivada imutavel' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND OLD.status='efetivada' THEN
   IF (to_jsonb(OLD)-'vigencia_fim') IS DISTINCT FROM (to_jsonb(NEW)-'vigencia_fim')
    OR NEW.vigencia_fim IS NULL OR (OLD.vigencia_fim IS NOT NULL AND NEW.vigencia_fim>OLD.vigencia_fim)
    OR EXISTS(SELECT 1 FROM erp.contratos_vendas_geracoes WHERE tenant_id=tid AND contrato_versao_id=OLD.id AND periodo_fim>NEW.vigencia_fim) THEN
    RAISE EXCEPTION 'Condicoes utilizadas imutaveis' USING ERRCODE='23514';
   END IF;
  END IF;
  IF TG_OP<>'DELETE' AND NEW.status='efetivada' THEN
   IF NOT EXISTS(SELECT 1 FROM erp.contratos_vendas WHERE tenant_id=tid AND id=NEW.contrato_id AND data_inicio<=NEW.vigencia_inicio AND coalesce(data_fim,'infinity'::date)>=coalesce(NEW.vigencia_fim,'infinity'::date)) THEN
    RAISE EXCEPTION 'Vigencia fora do contrato' USING ERRCODE='23514'; END IF;
   IF NOT EXISTS(SELECT 1 FROM erp.contratos_vendas_itens WHERE tenant_id=tid AND contrato_versao_id=NEW.id) THEN
    RAISE EXCEPTION 'Versao exige itens antes de efetivar' USING ERRCODE='23514'; END IF;
   IF EXISTS(SELECT 1 FROM erp.contratos_vendas_versoes WHERE tenant_id=tid AND contrato_id=NEW.contrato_id AND id<>NEW.id AND status='efetivada'
     AND vigencia_inicio<=coalesce(NEW.vigencia_fim,'infinity'::date) AND coalesce(vigencia_fim,'infinity'::date)>=NEW.vigencia_inicio) THEN
    RAISE EXCEPTION 'Vigencias sobrepostas' USING ERRCODE='23514'; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='contratos_vendas_itens' THEN
  IF TG_OP<>'INSERT' THEN
   SELECT * INTO v FROM erp.contratos_vendas_versoes WHERE tenant_id=tid AND id=OLD.contrato_versao_id;
   IF v.status='efetivada' THEN RAISE EXCEPTION 'Itens efetivados imutaveis' USING ERRCODE='23514'; END IF;
  END IF;
  IF TG_OP<>'DELETE' THEN
   SELECT * INTO v FROM erp.contratos_vendas_versoes WHERE tenant_id=tid AND id=NEW.contrato_versao_id;
   IF v.status='efetivada' THEN RAISE EXCEPTION 'Itens efetivados imutaveis' USING ERRCODE='23514'; END IF;
   IF NEW.total<>round(NEW.quantidade*NEW.valor_unitario,2)-NEW.desconto THEN
    RAISE EXCEPTION 'Total do item inconsistente' USING ERRCODE='23514'; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='contratos_vendas_geracoes' THEN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Preserve geracoes' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' AND NEW.legado_sem_versao THEN RAISE EXCEPTION 'Marcador reservado ao historico migrado' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' AND NOT EXISTS(SELECT 1 FROM erp.contratos_vendas WHERE tenant_id=tid AND id=NEW.contrato_id AND status='ativo' AND excluido_em IS NULL) THEN
   RAISE EXCEPTION 'Geracao exige contrato ativo' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND (OLD.legado_sem_versao OR
   (to_jsonb(OLD)-ARRAY['status','erro','processado_em','venda_id']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['status','erro','processado_em','venda_id'])
   OR (OLD.venda_id IS NOT NULL AND OLD.venda_id IS DISTINCT FROM NEW.venda_id)
   OR OLD.status IN ('concluida','ignorada')) THEN
   RAISE EXCEPTION 'Identidade e resultado da geracao preservados' USING ERRCODE='23514'; END IF;
  IF NEW.periodo_inicio IS NULL OR NEW.periodo_fim IS NULL OR NEW.periodo_fim<NEW.periodo_inicio THEN
   RAISE EXCEPTION 'Ciclo exige inicio e fim' USING ERRCODE='23514'; END IF;
  IF NEW.venda_id IS NOT NULL AND EXISTS(SELECT 1 FROM erp.contratos_vendas_geracoes WHERE tenant_id=tid AND venda_id=NEW.venda_id AND id<>NEW.id) THEN
   RAISE EXCEPTION 'Venda ja utilizada em outro ciclo' USING ERRCODE='23514'; END IF;
  SELECT * INTO v FROM erp.contratos_vendas_versoes WHERE tenant_id=tid AND id=NEW.contrato_versao_id;
  IF v.status IS DISTINCT FROM 'efetivada' OR NEW.periodo_inicio<v.vigencia_inicio OR NEW.periodo_fim>coalesce(v.vigencia_fim,'infinity'::date)
   OR EXISTS(SELECT 1 FROM erp.contratos_vendas_geracoes x WHERE x.tenant_id=tid AND x.contrato_id=NEW.contrato_id AND x.id<>NEW.id
    AND ((NOT x.legado_sem_versao AND x.periodo_inicio<=NEW.periodo_fim AND x.periodo_fim>=NEW.periodo_inicio)
      OR (x.legado_sem_versao AND date_trunc('month',x.competencia)=date_trunc('month',NEW.competencia)))) THEN
   RAISE EXCEPTION 'Ciclo ou versao invalida; historico legado exige revisao explicita' USING ERRCODE='23514'; END IF;
  IF NEW.periodo_fim<>(NEW.periodo_inicio+CASE v.periodicidade WHEN 'semanal' THEN interval '7 days' WHEN 'quinzenal' THEN interval '15 days' WHEN 'mensal' THEN interval '1 month' WHEN 'bimestral' THEN interval '2 months' WHEN 'trimestral' THEN interval '3 months' WHEN 'semestral' THEN interval '6 months' ELSE interval '1 year' END-interval '1 day')::date THEN
   RAISE EXCEPTION 'Duracao do ciclo incompativel com periodicidade' USING ERRCODE='23514'; END IF;
  IF (NEW.status='concluida') IS DISTINCT FROM (NEW.venda_id IS NOT NULL) THEN RAISE EXCEPTION 'Resultado da geracao inconsistente' USING ERRCODE='23514'; END IF;
  IF NEW.venda_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM erp.vendas s JOIN erp.contratos_vendas c ON c.tenant_id=s.tenant_id AND c.cliente_id=s.cliente_id WHERE c.tenant_id=tid AND c.id=NEW.contrato_id AND s.id=NEW.venda_id) THEN
   RAISE EXCEPTION 'Venda pertence a outro cliente' USING ERRCODE='23514'; END IF;
 ELSE
  IF TG_OP='DELETE' OR (TG_OP='UPDATE' AND (OLD.status<>'executando'
    OR (to_jsonb(OLD)-ARRAY['fim','status','erro']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['fim','status','erro']))) THEN
   RAISE EXCEPTION 'Tentativa encerrada imutavel' USING ERRCODE='23514'; END IF;
  SELECT * INTO g FROM erp.contratos_vendas_geracoes WHERE tenant_id=tid AND id=NEW.geracao_id;
  IF (NEW.status='sucesso' AND g.status<>'concluida') OR (NEW.status='executando' AND g.status<>'processando') THEN
   RAISE EXCEPTION 'Tentativa incompativel com geracao' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $function$
;
CREATE OR REPLACE FUNCTION erp.preservar_arquivo_referenciado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 PERFORM erp.travar_evolucao(OLD.tenant_id);
 IF EXISTS(SELECT 1 FROM erp.contas_pagar_arquivos WHERE tenant_id=OLD.tenant_id AND arquivo_id=OLD.id)
 OR EXISTS(SELECT 1 FROM erp.compras_arquivos WHERE tenant_id=OLD.tenant_id AND arquivo_id=OLD.id)
 OR EXISTS(SELECT 1 FROM erp.contratos_vendas_arquivos WHERE tenant_id=OLD.tenant_id AND arquivo_id=OLD.id)
 OR EXISTS(SELECT 1 FROM erp.vendas_arquivos WHERE tenant_id=OLD.tenant_id AND arquivo_id=OLD.id)
 OR EXISTS(SELECT 1 FROM erp.ordens_servico_arquivos WHERE tenant_id=OLD.tenant_id AND arquivo_id=OLD.id)
 OR EXISTS(SELECT 1 FROM erp.contas_receber_arquivos WHERE tenant_id=OLD.tenant_id AND arquivo_id=OLD.id) THEN
  IF TG_OP='DELETE' OR (to_jsonb(OLD)-ARRAY['atualizado_em','atualizado_por']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['atualizado_em','atualizado_por']) THEN
  RAISE EXCEPTION 'Arquivo referenciado preservado' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $function$
;

ALTER TABLE erp.entidades_enderecos ALTER COLUMN logradouro DROP NOT NULL, ALTER COLUMN cidade DROP NOT NULL;
CREATE OR REPLACE FUNCTION erp.normalizar_entidade_nova() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE em text;
BEGIN
 IF nullif(btrim(NEW.email),'') IS NOT NULL OR nullif(btrim(NEW.telefone),'') IS NOT NULL THEN
  INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,email,telefone)
  VALUES(NEW.tenant_id,NEW.id,NEW.nome,nullif(btrim(NEW.email),''),nullif(btrim(NEW.telefone),''));
 END IF;
 IF nullif(btrim(NEW.celular),'') IS NOT NULL THEN
  INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,telefone,whatsapp)
  VALUES(NEW.tenant_id,NEW.id,NEW.nome,btrim(NEW.celular),true);
 END IF;
 FOR em IN SELECT DISTINCT btrim(x) FROM unnest(NEW.contato_cobranca_emails) x WHERE nullif(btrim(x),'') IS NOT NULL LOOP
  INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,email,finalidades)
  VALUES(NEW.tenant_id,NEW.id,NEW.nome,em,ARRAY['financeiro']);
 END LOOP;
 IF nullif(btrim(NEW.contato_cobranca_whatsapp),'') IS NOT NULL THEN
  INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,telefone,whatsapp,finalidades)
  VALUES(NEW.tenant_id,NEW.id,NEW.nome,NEW.contato_cobranca_whatsapp,true,ARRAY['financeiro']);
 END IF;
 IF coalesce(nullif(btrim(NEW.logradouro),''),nullif(btrim(NEW.cidade),''),nullif(btrim(NEW.cep),''),nullif(btrim(NEW.numero),''),nullif(btrim(NEW.bairro),''),nullif(btrim(NEW.complemento),''),nullif(btrim(NEW.uf),'')) IS NOT NULL THEN
  INSERT INTO erp.entidades_enderecos(tenant_id,entidade_id,identificacao,logradouro,numero,complemento,bairro,cidade,uf,cep,pais)
  VALUES(NEW.tenant_id,NEW.id,'Endereco informado',nullif(btrim(NEW.logradouro),''),NEW.numero,NEW.complemento,NEW.bairro,nullif(btrim(NEW.cidade),''),NEW.uf,NEW.cep,coalesce(NEW.pais,'Brasil'));
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER normalizar_entidade_nova AFTER INSERT ON erp.entidades FOR EACH ROW EXECUTE FUNCTION erp.normalizar_entidade_nova();

CREATE OR REPLACE FUNCTION erp.refletir_cadastro_normalizado() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE t bigint; e bigint; afetadas text[]; a erp.entidades_enderecos;
BEGIN
 -- Insercoes atomicas da entidade ja preservam a projecao recebida.
 IF pg_trigger_depth()>1 THEN RETURN NULL; END IF;
 t:=CASE WHEN TG_OP='DELETE' THEN OLD.tenant_id ELSE NEW.tenant_id END;
 e:=CASE WHEN TG_OP='DELETE' THEN OLD.entidade_id ELSE NEW.entidade_id END;
 afetadas:=CASE WHEN TG_OP='DELETE' THEN OLD.finalidades WHEN TG_OP='INSERT' THEN NEW.finalidades ELSE OLD.finalidades||NEW.finalidades END;
 PERFORM erp.travar_evolucao(t);
 IF TG_OP='UPDATE' AND OLD.entidade_id<>NEW.entidade_id THEN RAISE EXCEPTION 'Nao mover cadastro entre entidades' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='entidades_contatos' THEN
  IF 'comercial'=ANY(afetadas) THEN
   UPDATE erp.entidades SET
    email=(SELECT email FROM erp.entidades_contatos WHERE tenant_id=t AND entidade_id=e AND ativo AND 'comercial'=ANY(finalidades) AND email IS NOT NULL ORDER BY ('comercial'=ANY(principais)) DESC,id LIMIT 1),
    telefone=(SELECT telefone FROM erp.entidades_contatos WHERE tenant_id=t AND entidade_id=e AND ativo AND 'comercial'=ANY(finalidades) AND NOT whatsapp AND telefone IS NOT NULL ORDER BY ('comercial'=ANY(principais)) DESC,id LIMIT 1),
    celular=(SELECT telefone FROM erp.entidades_contatos WHERE tenant_id=t AND entidade_id=e AND ativo AND 'comercial'=ANY(finalidades) AND whatsapp AND telefone IS NOT NULL ORDER BY ('comercial'=ANY(principais)) DESC,id LIMIT 1)
   WHERE tenant_id=t AND id=e;
  END IF;
  IF 'financeiro'=ANY(afetadas) THEN
   UPDATE erp.entidades SET
    contato_cobranca_emails=ARRAY(SELECT DISTINCT email FROM erp.entidades_contatos WHERE tenant_id=t AND entidade_id=e AND ativo AND 'financeiro'=ANY(finalidades) AND email IS NOT NULL),
    contato_cobranca_whatsapp=(SELECT telefone FROM erp.entidades_contatos WHERE tenant_id=t AND entidade_id=e AND ativo AND 'financeiro'=ANY(finalidades) AND whatsapp ORDER BY ('financeiro'=ANY(principais)) DESC,id LIMIT 1)
   WHERE tenant_id=t AND id=e;
  END IF;
 ELSIF 'comercial'=ANY(afetadas) THEN
  SELECT * INTO a FROM erp.entidades_enderecos WHERE tenant_id=t AND entidade_id=e AND ativo AND 'comercial'=ANY(finalidades) ORDER BY ('comercial'=ANY(principais)) DESC,id LIMIT 1;
  UPDATE erp.entidades SET logradouro=a.logradouro,numero=a.numero,complemento=a.complemento,bairro=a.bairro,cidade=a.cidade,uf=a.uf,cep=a.cep,pais=coalesce(a.pais,'Brasil') WHERE tenant_id=t AND id=e;
 END IF;
 RETURN NULL;
END $$;

-- Identidade duravel inclusive em indices antigos que ignoram exclusao logica.
CREATE FUNCTION erp.preservar_chave_operacao() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j jsonb; o jsonb; existe boolean;
BEGIN
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 PERFORM erp.travar_evolucao((j->>'tenant_id')::bigint);
 IF TG_OP<>'INSERT' THEN
  o:=to_jsonb(OLD);
  IF o->>'chave_idempotencia' IS NOT NULL AND (TG_OP='DELETE' OR
   (o->>'chave_idempotencia') IS DISTINCT FROM (j->>'chave_idempotencia') OR
   (o->>'id') IS DISTINCT FROM (j->>'id') OR (o->>'tenant_id') IS DISTINCT FROM (j->>'tenant_id')) THEN
   RAISE EXCEPTION 'Identidade da operacao preservada inclusive apos cancelamento' USING ERRCODE='23514';
  END IF;
 END IF;
 IF TG_OP<>'DELETE' AND j->>'chave_idempotencia' IS NOT NULL THEN
  IF nullif(btrim(j->>'chave_idempotencia'),'') IS NULL THEN RAISE EXCEPTION 'Chave vazia' USING ERRCODE='23514'; END IF;
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM erp.%I WHERE tenant_id=$1 AND chave_idempotencia=$2 AND id<>$3)',TG_TABLE_NAME)
  INTO existe USING NEW.tenant_id,NEW.chave_idempotencia,NEW.id;
  IF existe THEN RAISE EXCEPTION 'Chave de operacao ja utilizada' USING ERRCODE='23505'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['vendas','compras','ordens_servico','contratos_vendas','contas_receber','contas_pagar','pagamentos','transferencias_financeiras','cobrancas','execucoes_automacao','renegociacoes','adiantamentos','adiantamentos_aplicacoes','contratos_vendas_geracoes'] LOOP
  EXECUTE format('CREATE TRIGGER a_preservar_chave BEFORE INSERT OR UPDATE OR DELETE ON erp.%I FOR EACH ROW EXECUTE FUNCTION erp.preservar_chave_operacao()',t);
 END LOOP;
END $$;

-- Desconto continua como entrada (valor ou percentual); coluna explicita guarda valor calculado.
ALTER TABLE erp.vendas ADD COLUMN desconto_calculado numeric(18,2);
ALTER TABLE erp.compras ADD COLUMN desconto_calculado numeric(18,2);
CREATE FUNCTION erp.validar_equacao_comercial() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE bruto numeric; abatimento numeric; j jsonb;
BEGIN
 PERFORM erp.travar_evolucao(NEW.tenant_id);
 j:=to_jsonb(NEW);
 IF TG_TABLE_NAME IN ('vendas','compras') THEN
  IF NEW.tipo_desconto='percentual' AND NEW.desconto>100 THEN RAISE EXCEPTION 'Percentual maior que 100' USING ERRCODE='23514'; END IF;
  NEW.desconto_calculado:=CASE WHEN NEW.tipo_desconto='percentual' THEN round(NEW.subtotal*NEW.desconto/100,2) ELSE NEW.desconto END;
  IF NEW.desconto_calculado>NEW.subtotal THEN RAISE EXCEPTION 'Desconto supera subtotal' USING ERRCODE='23514'; END IF;
 ELSE
  bruto:=round(NEW.quantidade*NEW.valor_unitario,2);
  IF TG_TABLE_NAME='compras_itens' THEN
   abatimento:=coalesce(round(bruto*NEW.percentual_desconto/100,2),NEW.valor_desconto);
   IF NEW.valor_desconto<>abatimento OR NEW.total<>bruto-abatimento THEN RAISE EXCEPTION 'Equacao do item de compra invalida' USING ERRCODE='23514'; END IF;
   NEW.valor_bruto:=bruto; NEW.valor_liquido:=NEW.total;
  ELSE
   IF NEW.total<>bruto-NEW.desconto THEN RAISE EXCEPTION 'Equacao do item invalida' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['vendas','compras','vendas_itens','compras_itens','ordens_servico_itens'] LOOP
 EXECUTE format('CREATE TRIGGER equacao_comercial BEFORE INSERT OR UPDATE ON erp.%I FOR EACH ROW EXECUTE FUNCTION erp.validar_equacao_comercial()',t);
 END LOOP;
END $$;

CREATE FUNCTION erp.validar_os_diferida() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j jsonb; o jsonb; doc bigint; v erp.ordens_servico; soma numeric;
BEGIN
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 IF TG_OP='UPDATE' THEN o:=to_jsonb(OLD); END IF;
 FOR doc IN SELECT DISTINCT x FROM unnest(ARRAY[
  (j->>CASE WHEN TG_TABLE_NAME='ordens_servico' THEN 'id' ELSE 'ordem_servico_id' END)::bigint,
  (o->>CASE WHEN TG_TABLE_NAME='ordens_servico' THEN 'id' ELSE 'ordem_servico_id' END)::bigint]) x WHERE x IS NOT NULL LOOP
  SELECT * INTO v FROM erp.ordens_servico WHERE tenant_id=(j->>'tenant_id')::bigint AND id=doc;
  IF v.status IN ('aprovada','em_execucao','concluida') AND v.excluido_em IS NULL THEN
   SELECT coalesce(sum(total),0) INTO soma FROM erp.ordens_servico_itens WHERE tenant_id=v.tenant_id AND ordem_servico_id=doc AND excluido_em IS NULL;
   IF v.subtotal<>soma OR v.total<>soma-v.desconto THEN RAISE EXCEPTION 'Totais da OS inconsistentes' USING ERRCODE='23514'; END IF;
  END IF;
 END LOOP;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER os_diferida AFTER INSERT OR UPDATE OR DELETE ON erp.ordens_servico DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_os_diferida();
CREATE CONSTRAINT TRIGGER os_diferida AFTER INSERT OR UPDATE OR DELETE ON erp.ordens_servico_itens DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_os_diferida();

CREATE FUNCTION erp.validar_origem_comercial() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v erp.vendas; compra erp.compras; j jsonb; ligado bigint; chave text;
BEGIN
 PERFORM erp.travar_evolucao(NEW.tenant_id);
 j:=to_jsonb(NEW);
 IF TG_OP='UPDATE' THEN
  IF OLD.id<>NEW.id OR OLD.tenant_id<>NEW.tenant_id THEN RAISE EXCEPTION 'Identidade documental imutavel' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME='compras' AND (to_jsonb(OLD)->'fornecedor_id') IS DISTINCT FROM (j->'fornecedor_id') THEN RAISE EXCEPTION 'Fornecedor documental preservado' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME='vendas' AND (to_jsonb(OLD)->'tipo_documento') IS DISTINCT FROM (j->'tipo_documento') THEN RAISE EXCEPTION 'Conversao exige novo documento vinculado' USING ERRCODE='23514'; END IF;
  IF TG_TABLE_NAME IN ('contas_receber','contas_pagar') AND (
   (to_jsonb(OLD)->>'venda_id' IS NOT NULL AND to_jsonb(OLD)->'venda_id' IS DISTINCT FROM j->'venda_id') OR
   (to_jsonb(OLD)->>'compra_id' IS NOT NULL AND to_jsonb(OLD)->'compra_id' IS DISTINCT FROM j->'compra_id')) THEN RAISE EXCEPTION 'Origem comercial do titulo preservada' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_TABLE_NAME='ordens_servico' THEN
  FOREACH chave IN ARRAY ARRAY['venda_id','orcamento_id'] LOOP
   ligado:=(j->>chave)::bigint;
   IF ligado IS NOT NULL THEN
    SELECT * INTO v FROM erp.vendas WHERE tenant_id=NEW.tenant_id AND id=ligado;
    IF v.id IS NULL OR v.cliente_id<>NEW.cliente_id OR v.tipo_documento<>(CASE WHEN chave='venda_id' THEN 'venda' ELSE 'orcamento' END) THEN
     RAISE EXCEPTION 'Cliente ou tipo da origem da OS incompativel' USING ERRCODE='23514'; END IF;
   END IF;
  END LOOP;
 ELSIF TG_TABLE_NAME IN ('vendas','contas_receber') THEN
  ligado:=(j->>CASE WHEN TG_TABLE_NAME='vendas' THEN 'venda_origem_id' ELSE 'venda_id' END)::bigint;
  IF ligado IS NOT NULL THEN
   SELECT * INTO v FROM erp.vendas WHERE tenant_id=NEW.tenant_id AND id=ligado;
   IF v.id IS NULL OR v.cliente_id<>NEW.cliente_id THEN RAISE EXCEPTION 'Cliente da origem incompativel' USING ERRCODE='23514'; END IF;
   IF TG_TABLE_NAME='vendas' THEN
    IF NOT ((v.tipo_documento='orcamento' AND NEW.tipo_documento IN ('pedido','venda')) OR (v.tipo_documento='pedido' AND NEW.tipo_documento='venda')) THEN
     RAISE EXCEPTION 'Ordem de conversao invalida' USING ERRCODE='23514'; END IF;
   ELSIF v.tipo_documento<>'venda' THEN RAISE EXCEPTION 'Recebivel exige origem venda' USING ERRCODE='23514'; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='contas_pagar' AND j->>'compra_id' IS NOT NULL THEN
  SELECT * INTO compra FROM erp.compras WHERE tenant_id=NEW.tenant_id AND id=NEW.compra_id;
  IF compra.id IS NULL OR compra.fornecedor_id<>NEW.fornecedor_id OR compra.tipo_movimento<>'compra' THEN
   RAISE EXCEPTION 'Fornecedor ou tipo da origem a pagar incompativel' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['vendas','compras','ordens_servico','contas_receber','contas_pagar'] LOOP
 EXECUTE format('CREATE TRIGGER origem_comercial BEFORE INSERT OR UPDATE ON erp.%I FOR EACH ROW EXECUTE FUNCTION erp.validar_origem_comercial()',t);
 END LOOP;
END $$;

-- Campos da parcela descrevem previsao; pagamentos descrevem realizacao.
CREATE FUNCTION erp.validar_previsao_parcela() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE liquido numeric;
BEGIN
 liquido:=NEW.valor+NEW.juros+NEW.multa-NEW.desconto-NEW.taxa;
 IF liquido<0 THEN RAISE EXCEPTION 'Previsao liquida negativa' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NEW.valor_bruto=0 AND NEW.valor_liquido=0 THEN
  NEW.valor_bruto:=NEW.valor; NEW.valor_liquido:=liquido;
 ELSIF NEW.valor_bruto<>NEW.valor OR NEW.valor_liquido<>liquido THEN
  RAISE EXCEPTION 'Previsao da parcela inconsistente: bruto=principal; liquido=principal+juros+multa-desconto-taxa' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER previsao_parcela BEFORE INSERT OR UPDATE OF valor,valor_bruto,valor_liquido,juros,multa,desconto,taxa ON erp.contas_receber_parcelas FOR EACH ROW EXECUTE FUNCTION erp.validar_previsao_parcela();
CREATE TRIGGER previsao_parcela BEFORE INSERT OR UPDATE OF valor,valor_bruto,valor_liquido,juros,multa,desconto,taxa ON erp.contas_pagar_parcelas FOR EACH ROW EXECUTE FUNCTION erp.validar_previsao_parcela();
COMMENT ON COLUMN erp.contas_receber_parcelas.valor_pago IS 'Principal baixado por pagamento; caixa realizado consta em pagamentos.valor_liquido. Nao inclui credito aplicado nem saldo renegociado.';
COMMENT ON COLUMN erp.contas_pagar_parcelas.valor_pago IS 'Principal baixado por pagamento; caixa realizado consta em pagamentos.valor_liquido. Nao inclui credito aplicado nem saldo renegociado.';
COMMENT ON COLUMN erp.contas_receber_parcelas.valor_liquido IS 'Previsao: valor + juros + multa - desconto - taxa. Realizacao pertence a pagamentos.';
COMMENT ON COLUMN erp.contas_pagar_parcelas.valor_liquido IS 'Previsao: valor + juros + multa - desconto - taxa. Realizacao pertence a pagamentos.';

CREATE FUNCTION erp.validar_rateio_diferido() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j jsonb; lado text; doc bigint; total numeric; soma numeric; qtd bigint; invalido boolean; r record;
BEGIN
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 PERFORM erp.travar_evolucao((j->>'tenant_id')::bigint);
 IF TG_TABLE_NAME='rateios_financeiros' THEN
  IF TG_OP='UPDATE' AND ROW(OLD.tenant_id,OLD.tipo,OLD.conta_receber_id,OLD.conta_pagar_id) IS DISTINCT FROM ROW(NEW.tenant_id,NEW.tipo,NEW.conta_receber_id,NEW.conta_pagar_id) THEN RAISE EXCEPTION 'Nao mover rateio entre titulos' USING ERRCODE='23514'; END IF;
  lado:=j->>'tipo'; doc:=(j->>('conta_'||lado||'_id'))::bigint;
 ELSE lado:=CASE WHEN TG_TABLE_NAME='contas_receber' THEN 'receber' ELSE 'pagar' END; doc:=(j->>'id')::bigint;
 END IF;
 EXECUTE format('SELECT valor_total FROM erp.contas_%s WHERE tenant_id=$1 AND id=$2',lado) INTO total USING (j->>'tenant_id')::bigint,doc;
 soma:=0; qtd:=0;
 FOR r IN EXECUTE format('SELECT * FROM erp.rateios_financeiros WHERE tenant_id=$1 AND conta_%s_id=$2 AND excluido_em IS NULL',lado) USING (j->>'tenant_id')::bigint,doc LOOP
  qtd:=qtd+1;
  IF r.valor IS NULL OR (r.percentual IS NOT NULL AND abs(r.valor-round(total*r.percentual/100,2))>0.01) THEN RAISE EXCEPTION 'Rateio exige valor monetario e percentual compativel' USING ERRCODE='23514'; END IF;
  soma:=soma+r.valor;
 END LOOP;
 IF qtd>0 AND soma<>total THEN RAISE EXCEPTION 'Rateio deve distribuir exatamente o total do titulo' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['rateios_financeiros','contas_receber','contas_pagar'] LOOP
 EXECUTE format('CREATE CONSTRAINT TRIGGER rateio_diferido AFTER INSERT OR UPDATE OR DELETE ON erp.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_rateio_diferido()',t);
 END LOOP;
END $$;

CREATE FUNCTION erp.preservar_classificacao_usada() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE usado boolean:=false; r record; achou boolean; campo text;
BEGIN
 PERFORM erp.travar_evolucao(NEW.tenant_id);
 IF TG_OP='UPDATE' AND (OLD.tenant_id<>NEW.tenant_id OR OLD.id<>NEW.id) THEN RAISE EXCEPTION 'Identidade do cadastro preservada' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='categorias' THEN
  IF EXISTS(WITH RECURSIVE pais AS (
   SELECT id,categoria_pai_id,ARRAY[id] caminho FROM erp.categorias WHERE tenant_id=NEW.tenant_id AND id=NEW.categoria_pai_id
   UNION ALL SELECT c.id,c.categoria_pai_id,p.caminho||c.id FROM pais p JOIN erp.categorias c ON c.tenant_id=NEW.tenant_id AND c.id=p.categoria_pai_id WHERE NOT c.id=ANY(p.caminho)
  ) SELECT 1 FROM pais WHERE id=NEW.id) OR NEW.categoria_pai_id=NEW.id THEN RAISE EXCEPTION 'Hierarquia de categorias ciclica' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' OR ROW(OLD.tipo,OLD.categoria_pai_id,OLD.entrada_dre,OLD.considera_custo_dre) IS NOT DISTINCT FROM ROW(NEW.tipo,NEW.categoria_pai_id,NEW.entrada_dre,NEW.considera_custo_dre) THEN RETURN NEW; END IF;
  campo:='categoria_id';
 ELSE
  IF TG_OP='INSERT' OR ROW(OLD.saldo_inicial,OLD.data_saldo_inicial,OLD.tipo) IS NOT DISTINCT FROM ROW(NEW.saldo_inicial,NEW.data_saldo_inicial,NEW.tipo) THEN RETURN NEW; END IF;
  campo:='conta_financeira_id';
 END IF;
 -- Descobre apenas FKs diretas do cadastro; nenhum registro e lido durante a migracao.
 FOR r IN SELECT ns.nspname schema_name,cl.relname tabela,a.attname coluna FROM pg_constraint fk
 JOIN pg_class cl ON cl.oid=fk.conrelid JOIN pg_namespace ns ON ns.oid=cl.relnamespace
 JOIN unnest(fk.conkey) k ON true JOIN pg_attribute a ON a.attrelid=cl.oid AND a.attnum=k
 WHERE fk.contype='f' AND fk.confrelid=TG_RELID AND a.attname<>'tenant_id' AND ns.nspname='erp' LOOP
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.%I WHERE tenant_id=$1 AND %I=$2)',r.schema_name,r.tabela,r.coluna) INTO achou USING NEW.tenant_id,NEW.id;
  usado:=usado OR achou;
 END LOOP;
 IF usado THEN RAISE EXCEPTION 'Classificacao ou saldo inicial ja utilizado; crie novo cadastro para outra semantica' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER classificacao_usada BEFORE INSERT OR UPDATE ON erp.categorias FOR EACH ROW EXECUTE FUNCTION erp.preservar_classificacao_usada();
CREATE TRIGGER classificacao_usada BEFORE INSERT OR UPDATE ON erp.contas_financeiras FOR EACH ROW EXECUTE FUNCTION erp.preservar_classificacao_usada();

ALTER TABLE erp.contas_receber ADD COLUMN recorrencia_financeira_id bigint,
 ADD CONSTRAINT receber_recorrencia_fk FOREIGN KEY(tenant_id,recorrencia_financeira_id) REFERENCES erp.recorrencias_financeiras(tenant_id,id) ON DELETE RESTRICT;
ALTER TABLE erp.contas_receber_parcelas ADD COLUMN recebimento_previsto_id bigint,
 ADD CONSTRAINT receber_previsao_fk FOREIGN KEY(tenant_id,recebimento_previsto_id) REFERENCES erp.vendas_recebimentos_previstos(tenant_id,id) ON DELETE RESTRICT;
ALTER TABLE erp.contas_pagar_parcelas ADD COLUMN parcela_prevista_id bigint,
 ADD CONSTRAINT pagar_previsao_fk FOREIGN KEY(tenant_id,parcela_prevista_id) REFERENCES erp.compras_parcelas_previstas(tenant_id,id) ON DELETE RESTRICT;

CREATE FUNCTION erp.validar_recorrencia_estrutura() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM erp.travar_evolucao(NEW.tenant_id);
 IF (NEW.termino_tipo='data' AND (NEW.termino_em IS NULL OR NEW.termino_em<NEW.inicio_em OR NEW.quantidade_ocorrencias IS NOT NULL))
 OR (NEW.termino_tipo='ocorrencias' AND (NEW.quantidade_ocorrencias IS NULL OR NEW.termino_em IS NOT NULL))
 OR (NEW.termino_tipo='indeterminado' AND (NEW.termino_em IS NOT NULL OR NEW.quantidade_ocorrencias IS NOT NULL))
 OR (NEW.proxima_competencia IS NOT NULL AND (NEW.proxima_competencia<NEW.inicio_em OR NEW.proxima_competencia>NEW.termino_em)) THEN
 RAISE EXCEPTION 'Limites da recorrencia inconsistentes' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='recorrencias_financeiras' THEN
  IF (NEW.pausada_em IS NOT NULL OR NEW.encerrada_em IS NOT NULL) AND NEW.ativa THEN RAISE EXCEPTION 'Recorrencia pausada ou encerrada nao pode estar ativa' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND OLD.encerrada_em IS NOT NULL AND to_jsonb(OLD)-ARRAY['atualizado_em','atualizado_por'] IS DISTINCT FROM to_jsonb(NEW)-ARRAY['atualizado_em','atualizado_por'] THEN RAISE EXCEPTION 'Recorrencia encerrada preservada' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER estrutura_recorrencia BEFORE INSERT OR UPDATE ON erp.recorrencias_financeiras FOR EACH ROW EXECUTE FUNCTION erp.validar_recorrencia_estrutura();
CREATE TRIGGER estrutura_recorrencia BEFORE INSERT OR UPDATE ON erp.compras_recorrencias FOR EACH ROW EXECUTE FUNCTION erp.validar_recorrencia_estrutura();

CREATE FUNCTION erp.validar_origem_recorrencia() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r erp.recorrencias_financeiras; lado text; existe boolean; numero bigint; intervalo text; esperado date;
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.recorrencia_financeira_id IS NOT NULL THEN RAISE EXCEPTION 'Ocorrencia preservada' USING ERRCODE='23514'; END IF;
  RETURN OLD;
 END IF;
 PERFORM erp.travar_evolucao(NEW.tenant_id);
 lado:=CASE WHEN TG_TABLE_NAME='contas_receber' THEN 'receber' ELSE 'pagar' END;
 IF TG_OP='UPDATE' AND OLD.recorrencia_financeira_id IS NOT NULL THEN
  IF ROW(OLD.recorrencia_financeira_id,OLD.data_competencia,OLD.tenant_id,OLD.id) IS DISTINCT FROM ROW(NEW.recorrencia_financeira_id,NEW.data_competencia,NEW.tenant_id,NEW.id) THEN RAISE EXCEPTION 'Identidade da ocorrencia preservada' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.recorrencia_financeira_id IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO r FROM erp.recorrencias_financeiras WHERE tenant_id=NEW.tenant_id AND id=NEW.recorrencia_financeira_id;
 IF r.id IS NULL OR r.tipo<>lado OR NOT r.ativa OR r.pausada_em IS NOT NULL OR r.encerrada_em IS NOT NULL OR r.excluido_em IS NOT NULL
 OR NEW.data_competencia IS NULL OR NEW.data_competencia<r.inicio_em OR NEW.data_competencia>r.termino_em THEN
 RAISE EXCEPTION 'Origem recorrente incompativel' USING ERRCODE='23514'; END IF;
 numero:=CASE r.frequencia WHEN 'dia' THEN NEW.data_competencia-r.inicio_em WHEN 'semana' THEN (NEW.data_competencia-r.inicio_em)/7
 WHEN 'mes' THEN (extract(year FROM NEW.data_competencia)-extract(year FROM r.inicio_em))*12+extract(month FROM NEW.data_competencia)-extract(month FROM r.inicio_em)
 ELSE extract(year FROM NEW.data_competencia)-extract(year FROM r.inicio_em) END;
 intervalo:=CASE r.frequencia WHEN 'dia' THEN 'day' WHEN 'semana' THEN 'week' WHEN 'mes' THEN 'month' ELSE 'year' END;
 esperado:=(r.inicio_em+(numero||' '||intervalo)::interval)::date;
 IF numero%r.intervalo<>0 OR esperado<>NEW.data_competencia OR (r.termino_tipo='ocorrencias' AND numero/r.intervalo>=r.quantidade_ocorrencias) THEN RAISE EXCEPTION 'Competencia fora do calendario da recorrencia' USING ERRCODE='23514'; END IF;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM erp.%I WHERE tenant_id=$1 AND recorrencia_financeira_id=$2 AND data_competencia=$3 AND id<>$4)',TG_TABLE_NAME)
 INTO existe USING NEW.tenant_id,r.id,NEW.data_competencia,NEW.id;
 IF existe THEN RAISE EXCEPTION 'Ocorrencia ja gerada' USING ERRCODE='23505'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER origem_recorrencia BEFORE INSERT OR UPDATE OR DELETE ON erp.contas_receber FOR EACH ROW EXECUTE FUNCTION erp.validar_origem_recorrencia();
CREATE TRIGGER origem_recorrencia BEFORE INSERT OR UPDATE OR DELETE ON erp.contas_pagar FOR EACH ROW EXECUTE FUNCTION erp.validar_origem_recorrencia();

CREATE FUNCTION erp.validar_vinculo_previsao() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE lado text; j jsonb; v_origem bigint; valido boolean; existe boolean;
BEGIN
 j:=to_jsonb(NEW); lado:=CASE WHEN TG_TABLE_NAME='contas_receber_parcelas' THEN 'receber' ELSE 'pagar' END;
 v_origem:=(j->>CASE WHEN lado='receber' THEN 'recebimento_previsto_id' ELSE 'parcela_prevista_id' END)::bigint;
 IF TG_OP='UPDATE' AND (to_jsonb(OLD)->>CASE WHEN lado='receber' THEN 'recebimento_previsto_id' ELSE 'parcela_prevista_id' END) IS NOT NULL AND
 (to_jsonb(OLD)->>CASE WHEN lado='receber' THEN 'recebimento_previsto_id' ELSE 'parcela_prevista_id' END)::bigint IS DISTINCT FROM v_origem THEN RAISE EXCEPTION 'Previsao de v_origem preservada' USING ERRCODE='23514'; END IF;
 IF v_origem IS NULL THEN RETURN NEW; END IF;
 PERFORM erp.travar_evolucao(NEW.tenant_id);
 IF lado='receber' THEN
  SELECT p.venda_id=t.venda_id AND p.valor=NEW.valor AND p.data_vencimento=NEW.data_vencimento INTO valido
  FROM erp.vendas_recebimentos_previstos p JOIN erp.contas_receber t ON t.tenant_id=p.tenant_id AND t.id=NEW.conta_receber_id WHERE p.tenant_id=NEW.tenant_id AND p.id=v_origem;
  SELECT EXISTS(SELECT 1 FROM erp.contas_receber_parcelas WHERE tenant_id=NEW.tenant_id AND recebimento_previsto_id=v_origem AND id<>NEW.id) INTO existe;
 ELSE
  SELECT p.compra_id=t.compra_id AND p.valor=NEW.valor AND p.data_vencimento=NEW.data_vencimento INTO valido
  FROM erp.compras_parcelas_previstas p JOIN erp.contas_pagar t ON t.tenant_id=p.tenant_id AND t.id=NEW.conta_pagar_id WHERE p.tenant_id=NEW.tenant_id AND p.id=v_origem;
  SELECT EXISTS(SELECT 1 FROM erp.contas_pagar_parcelas WHERE tenant_id=NEW.tenant_id AND parcela_prevista_id=v_origem AND id<>NEW.id) INTO existe;
 END IF;
 IF valido IS DISTINCT FROM true OR existe THEN RAISE EXCEPTION 'Previsao incompativel ou ja utilizada' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER vinculo_previsao BEFORE INSERT OR UPDATE ON erp.contas_receber_parcelas FOR EACH ROW EXECUTE FUNCTION erp.validar_vinculo_previsao();
CREATE TRIGGER vinculo_previsao BEFORE INSERT OR UPDATE ON erp.contas_pagar_parcelas FOR EACH ROW EXECUTE FUNCTION erp.validar_vinculo_previsao();

CREATE FUNCTION erp.exigir_obrigacao_efetiva() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE parcela bigint; tipo text;
BEGIN
 parcela:=NEW.conta_pagar_parcela_id;
 IF parcela IS NOT NULL THEN
  SELECT t.tipo_lancamento INTO tipo FROM erp.contas_pagar_parcelas p JOIN erp.contas_pagar t ON t.tenant_id=p.tenant_id AND t.id=p.conta_pagar_id WHERE p.tenant_id=NEW.tenant_id AND p.id=parcela;
  IF tipo='previsao' THEN RAISE EXCEPTION 'Efetive a previsao antes de liquidar na mesma transacao' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER exigir_efetivo BEFORE INSERT ON erp.pagamentos FOR EACH ROW EXECUTE FUNCTION erp.exigir_obrigacao_efetiva();
CREATE TRIGGER exigir_efetivo BEFORE INSERT ON erp.adiantamentos_aplicacoes FOR EACH ROW EXECUTE FUNCTION erp.exigir_obrigacao_efetiva();

-- Envelope recebido imutavel; unico resultado de processamento pode ser preenchido uma vez.
DROP TRIGGER bloquear_mutacao_evento ON erp.cobrancas_eventos;
CREATE FUNCTION erp.preservar_evento_cobranca() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Evento preservado' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND ((to_jsonb(OLD)-ARRAY['processado_em','erro_mensagem','atualizado_em','atualizado_por']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['processado_em','erro_mensagem','atualizado_em','atualizado_por'])
 OR OLD.processado_em IS NOT NULL OR NEW.processado_em IS NULL) THEN RAISE EXCEPTION 'Envelope e resultado terminal do evento imutaveis' USING ERRCODE='23514'; END IF;
 IF NEW.processado_em<NEW.recebido_em THEN RAISE EXCEPTION 'Processamento anterior ao recebimento' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER preservar_evento_cobranca BEFORE INSERT OR UPDATE OR DELETE ON erp.cobrancas_eventos FOR EACH ROW EXECUTE FUNCTION erp.preservar_evento_cobranca();
COMMENT ON COLUMN erp.cobrancas.status IS 'Estado externo da cobranca; paga nao equivale a liquidacao interna. Liquidacao deve ser registrada em pagamentos.';
COMMENT ON COLUMN erp.cobrancas_eventos.processado_em IS 'Conclusao unica do processamento deste evento. Repeticoes antes da conclusao usam execucoes_automacao; envelope recebido permanece imutavel.';

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['entidades_contatos','entidades_enderecos','contratos_vendas_arquivos','vendas_arquivos','ordens_servico_arquivos','contas_receber_arquivos','contas_receber_eventos','contratos_vendas_versoes','contratos_vendas_eventos','contratos_vendas_geracoes_tentativas','adiantamentos','adiantamentos_aplicacoes','renegociacoes','renegociacoes_parcelas'] LOOP
 EXECUTE format('CREATE POLICY leitura_documental ON erp.%I FOR SELECT TO erp_runtime USING(shared.is_tenant_member(tenant_id))',t);
 END LOOP;
END $$;

CREATE FUNCTION erp.validar_importacao_diferida() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j jsonb; doc bigint; head erp.importacoes_dados; n bigint; validas bigint; importadas bigint; erros bigint; ignoradas bigint; linha record; tabela text; existe boolean;
BEGIN
 j:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 PERFORM erp.travar_evolucao((j->>'tenant_id')::bigint);
 IF TG_TABLE_NAME='importacoes_dados_linhas' THEN
  IF TG_OP='UPDATE' AND (OLD.importacao_id<>NEW.importacao_id OR OLD.numero_linha<>NEW.numero_linha OR OLD.tenant_id<>NEW.tenant_id OR
   (OLD.status='importada' AND to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW))) THEN RAISE EXCEPTION 'Identidade e resultado importado preservados' USING ERRCODE='23514'; END IF;
  IF TG_OP='DELETE' AND OLD.status='importada' THEN RAISE EXCEPTION 'Resultado importado preservado' USING ERRCODE='23514'; END IF;
 END IF;
 doc:=(j->>CASE WHEN TG_TABLE_NAME='importacoes_dados' THEN 'id' ELSE 'importacao_id' END)::bigint;
 SELECT * INTO head FROM erp.importacoes_dados WHERE tenant_id=(j->>'tenant_id')::bigint AND id=doc;
 IF head.id IS NULL THEN RETURN NULL; END IF;
 SELECT count(*),count(*) FILTER(WHERE status IN ('valida','importada')),count(*) FILTER(WHERE status='importada'),count(*) FILTER(WHERE status='erro'),count(*) FILTER(WHERE status='ignorada')
 INTO n,validas,importadas,erros,ignoradas FROM erp.importacoes_dados_linhas WHERE tenant_id=head.tenant_id AND importacao_id=doc;
 IF head.total_linhas<>n OR head.total_validas<>validas OR head.total_importadas<>importadas OR head.total_erros<>erros THEN RAISE EXCEPTION 'Contadores devem corresponder as linhas da importacao' USING ERRCODE='23514'; END IF;
 IF (head.status IN ('concluida','parcial','falha','cancelada')) IS DISTINCT FROM (head.concluido_em IS NOT NULL) OR head.concluido_em<head.criado_em
 OR (head.status='concluida' AND (n<>importadas+ignoradas OR erros>0)) OR (head.status='parcial' AND (importadas=0 OR erros=0 OR n<>importadas+erros+ignoradas)) THEN RAISE EXCEPTION 'Conclusao da importacao inconsistente' USING ERRCODE='23514'; END IF;
 tabela:=CASE head.tipo WHEN 'clientes' THEN 'entidades' WHEN 'fornecedores' THEN 'entidades' ELSE head.tipo END;
 FOR linha IN SELECT * FROM erp.importacoes_dados_linhas WHERE tenant_id=head.tenant_id AND importacao_id=doc AND status='importada' LOOP
  IF linha.registro_id IS NULL OR linha.processado_em IS NULL THEN RAISE EXCEPTION 'Linha importada exige resultado e data' USING ERRCODE='23514'; END IF;
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM erp.%I WHERE tenant_id=$1 AND id=$2)',tabela) INTO existe USING head.tenant_id,linha.registro_id;
  IF NOT existe THEN RAISE EXCEPTION 'Resultado da importacao inexistente no tenant' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER importacao_diferida AFTER INSERT OR UPDATE OR DELETE ON erp.importacoes_dados DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_importacao_diferida();
CREATE CONSTRAINT TRIGGER importacao_diferida AFTER INSERT OR UPDATE OR DELETE ON erp.importacoes_dados_linhas DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION erp.validar_importacao_diferida();

CREATE FUNCTION erp.validar_execucao_estado() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Execucao preservada' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD.status='concluida' OR OLD.tipo<>NEW.tipo OR OLD.competencia<>NEW.competencia OR NEW.tentativas<OLD.tentativas) THEN RAISE EXCEPTION 'Identidade ou resultado da execucao preservado' USING ERRCODE='23514'; END IF;
 IF (NEW.status='pendente' AND (NEW.iniciado_em IS NOT NULL OR NEW.finalizado_em IS NOT NULL OR NEW.tentativas<>0))
 OR (NEW.status='processando' AND (NEW.iniciado_em IS NULL OR NEW.finalizado_em IS NOT NULL OR NEW.tentativas<1))
 OR (NEW.status IN ('concluida','falha') AND (NEW.iniciado_em IS NULL OR NEW.finalizado_em IS NULL OR NEW.tentativas<1))
 OR NEW.finalizado_em<NEW.iniciado_em OR (NEW.status='falha' AND nullif(btrim(NEW.erro),'') IS NULL) THEN RAISE EXCEPTION 'Estado e datas da execucao inconsistentes' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND OLD.status='falha' AND NEW.status='processando' AND NEW.tentativas<>OLD.tentativas+1 THEN RAISE EXCEPTION 'Repeticao exige incrementar tentativa' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER execucao_estado BEFORE INSERT OR UPDATE OR DELETE ON erp.execucoes_automacao FOR EACH ROW EXECUTE FUNCTION erp.validar_execucao_estado();

CREATE FUNCTION erp.validar_notificacao_estado() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Notificacao preservada' USING ERRCODE='23514'; END IF;
 PERFORM erp.travar_evolucao(NEW.tenant_id);
 IF NEW.agendada_em IS NULL OR nullif(btrim(NEW.destinatario),'') IS NULL THEN RAISE EXCEPTION 'Agendamento e destinatario obrigatorios' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (ROW(OLD.tenant_id,OLD.id,OLD.cobranca_id,OLD.canal,OLD.destinatario,OLD.agendada_em) IS DISTINCT FROM ROW(NEW.tenant_id,NEW.id,NEW.cobranca_id,NEW.canal,NEW.destinatario,NEW.agendada_em)
 OR (OLD.enviada_em IS NOT NULL AND OLD.enviada_em IS DISTINCT FROM NEW.enviada_em)
 OR (OLD.entregue_em IS NOT NULL AND OLD.entregue_em IS DISTINCT FROM NEW.entregue_em)
 OR (OLD.visualizada_em IS NOT NULL AND OLD.visualizada_em IS DISTINCT FROM NEW.visualizada_em)) THEN RAISE EXCEPTION 'Identidade e marcos de entrega preservados' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM erp.cobrancas_notificacoes WHERE tenant_id=NEW.tenant_id AND cobranca_id=NEW.cobranca_id AND canal=NEW.canal AND destinatario=NEW.destinatario AND agendada_em=NEW.agendada_em AND id<>NEW.id) THEN RAISE EXCEPTION 'Notificacao duplicada' USING ERRCODE='23505'; END IF;
 IF (NEW.status IN ('enviada','entregue','visualizada') AND NEW.enviada_em IS NULL)
 OR (NEW.status IN ('entregue','visualizada') AND NEW.entregue_em IS NULL)
 OR (NEW.status='visualizada' AND NEW.visualizada_em IS NULL)
 OR NEW.entregue_em<NEW.enviada_em OR NEW.visualizada_em<NEW.entregue_em
 OR (NEW.entregue_em IS NOT NULL AND NEW.status NOT IN ('entregue','visualizada'))
 OR (NEW.visualizada_em IS NOT NULL AND NEW.status<>'visualizada') THEN RAISE EXCEPTION 'Estado de entrega inconsistente' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER notificacao_estado BEFORE INSERT OR UPDATE OR DELETE ON erp.cobrancas_notificacoes FOR EACH ROW EXECUTE FUNCTION erp.validar_notificacao_estado();

-- Snapshot acordado na primeira efetivacao; rascunho pode atualizar a copia do mesmo cliente.
CREATE OR REPLACE FUNCTION erp.snapshot_documento_cliente() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE e erp.entidades; capturar boolean;
BEGIN
 capturar:=TG_OP='INSERT';
 IF TG_OP='UPDATE' THEN
  IF OLD.cliente_id IS DISTINCT FROM NEW.cliente_id THEN RAISE EXCEPTION 'Troca de cliente exige novo documento' USING ERRCODE='23514'; END IF;
  capturar:=OLD.status='rascunho' AND (NEW.status<>'rascunho' OR OLD.cliente_snapshot IS DISTINCT FROM NEW.cliente_snapshot);
  IF NOT capturar AND OLD.cliente_snapshot IS DISTINCT FROM NEW.cliente_snapshot THEN RAISE EXCEPTION 'Snapshot efetivado preservado' USING ERRCODE='23514'; END IF;
 END IF;
 IF capturar THEN
  SELECT * INTO e FROM erp.entidades WHERE tenant_id=NEW.tenant_id AND id=NEW.cliente_id;
  NEW.cliente_snapshot:=jsonb_build_object('nome',e.nome,'documento',e.documento,'email',e.email,'logradouro',e.logradouro,'numero',e.numero,'cidade',e.cidade,'uf',e.uf,'origem',CASE WHEN NEW.status='rascunho' THEN 'cadastro_no_rascunho' ELSE 'cadastro_na_efetivacao' END);
 END IF;
 RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION erp.normalizar_entidade_nova(),erp.refletir_cadastro_normalizado(),erp.preservar_chave_operacao(),erp.validar_equacao_comercial(),erp.validar_os_diferida(),erp.validar_origem_comercial(),erp.validar_previsao_parcela(),erp.validar_rateio_diferido(),erp.preservar_classificacao_usada(),erp.validar_recorrencia_estrutura(),erp.validar_origem_recorrencia(),erp.validar_vinculo_previsao(),erp.exigir_obrigacao_efetiva(),erp.preservar_evento_cobranca(),erp.validar_importacao_diferida(),erp.validar_execucao_estado(),erp.validar_notificacao_estado(),erp.snapshot_documento_cliente() FROM PUBLIC;

ALTER TABLE erp.adiantamentos ADD COLUMN requisicao_idempotente jsonb;
ALTER TABLE erp.adiantamentos_aplicacoes ADD COLUMN requisicao_idempotente jsonb;
ALTER TABLE erp.renegociacoes ADD COLUMN requisicao_idempotente jsonb;
CREATE OR REPLACE FUNCTION erp.registrar_operacao_idempotente(p_tabela text, p_dados jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE t bigint; existente bigint; original jsonb; cols text; dados jsonb; k text; canonico jsonb;
BEGIN
 IF p_tabela NOT IN ('adiantamentos','adiantamentos_aplicacoes','renegociacoes') OR jsonb_typeof(p_dados) IS DISTINCT FROM 'object' THEN
  RAISE EXCEPTION 'Operacao invalida' USING ERRCODE='23514'; END IF;
 t:=(p_dados->>'tenant_id')::bigint;
 IF NOT coalesce(shared.has_erp_capability(t,'erp.financeiro.gerenciar'),false) THEN RAISE EXCEPTION 'Sem permissao financeira' USING ERRCODE='42501'; END IF;
 IF nullif(btrim(p_dados->>'chave_idempotencia'),'') IS NULL OR p_dados ?| ARRAY['id','criado_em','criado_por','requisicao_original','requisicao_idempotente'] THEN
  RAISE EXCEPTION 'Chave obrigatoria; campos internos nao aceitos' USING ERRCODE='23514'; END IF;
 PERFORM erp.travar_evolucao(t);
 dados:=p_dados||jsonb_build_object('criado_por',nullif(current_setting('app.erp_user_id',true),'')::bigint);
 FOR k IN SELECT jsonb_object_keys(dados) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=('erp.'||p_tabela)::regclass AND attname=k AND attnum>0 AND NOT attisdropped) THEN
   RAISE EXCEPTION 'Campo desconhecido' USING ERRCODE='23514'; END IF;
 END LOOP;
 EXECUTE format('SELECT jsonb_object_agg(k,x.j->k) FROM (SELECT to_jsonb(jsonb_populate_record(NULL::erp.%I,$1)) j) x CROSS JOIN jsonb_object_keys($1) k',p_tabela) INTO canonico USING p_dados;
 EXECUTE format('SELECT id,requisicao_idempotente FROM erp.%I WHERE tenant_id=$1 AND chave_idempotencia=$2',p_tabela) INTO existente,original USING t,p_dados->>'chave_idempotencia';
 IF existente IS NOT NULL THEN
  IF original IS DISTINCT FROM canonico THEN RAISE EXCEPTION 'Chave reutilizada com conteudo diferente' USING ERRCODE='23514'; END IF;
  RETURN existente;
 END IF;
 dados:=dados||jsonb_build_object('requisicao_idempotente',canonico);
 SELECT string_agg(format('%I',key),',') INTO cols FROM jsonb_object_keys(dados) key;
 EXECUTE format('INSERT INTO erp.%I(%s) SELECT %s FROM jsonb_populate_record(NULL::erp.%I,$1) RETURNING id',p_tabela,cols,cols,p_tabela) INTO existente USING dados;
 RETURN existente;
END $function$
;
CREATE FUNCTION erp.preservar_requisicao_canonica() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF OLD.requisicao_idempotente IS DISTINCT FROM NEW.requisicao_idempotente THEN RAISE EXCEPTION 'Requisicao canonica preservada' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER requisicao_canonica BEFORE UPDATE ON erp.adiantamentos FOR EACH ROW EXECUTE FUNCTION erp.preservar_requisicao_canonica();
CREATE TRIGGER requisicao_canonica BEFORE UPDATE ON erp.adiantamentos_aplicacoes FOR EACH ROW EXECUTE FUNCTION erp.preservar_requisicao_canonica();
CREATE TRIGGER requisicao_canonica BEFORE UPDATE ON erp.renegociacoes FOR EACH ROW EXECUTE FUNCTION erp.preservar_requisicao_canonica();
REVOKE ALL ON FUNCTION erp.preservar_requisicao_canonica() FROM PUBLIC;

CREATE FUNCTION erp.efetivacao_pagar() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM erp.travar_evolucao(NEW.tenant_id);
 IF TG_OP='UPDATE' AND OLD.tipo_lancamento='previsao' AND NEW.tipo_lancamento='efetivo' THEN NEW.efetivado_em:=now(); END IF;
 IF NEW.tipo_lancamento='previsao' AND (NEW.efetivado_em IS NOT NULL OR EXISTS(
 SELECT 1 FROM erp.contas_pagar_parcelas p WHERE p.tenant_id=NEW.tenant_id AND p.conta_pagar_id=NEW.id AND (
 EXISTS(SELECT 1 FROM erp.pagamentos m WHERE m.tenant_id=p.tenant_id AND m.conta_pagar_parcela_id=p.id)
 OR EXISTS(SELECT 1 FROM erp.adiantamentos_aplicacoes a WHERE a.tenant_id=p.tenant_id AND a.conta_pagar_parcela_id=p.id)
 OR EXISTS(SELECT 1 FROM erp.renegociacoes_parcelas r WHERE r.tenant_id=p.tenant_id AND r.conta_pagar_parcela_id=p.id)))) THEN
 RAISE EXCEPTION 'Obrigacao efetivada ou utilizada nao pode retornar a previsao' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER efetivacao_pagar BEFORE INSERT OR UPDATE ON erp.contas_pagar FOR EACH ROW EXECUTE FUNCTION erp.efetivacao_pagar();
REVOKE ALL ON FUNCTION erp.efetivacao_pagar() FROM PUBLIC;


ALTER TABLE erp.vendas ADD COLUMN snapshot_efetivado_em timestamptz;
ALTER TABLE erp.ordens_servico ADD COLUMN snapshot_efetivado_em timestamptz;
ALTER TABLE erp.contratos_vendas ADD COLUMN snapshot_efetivado_em timestamptz;
CREATE OR REPLACE FUNCTION erp.snapshot_documento_cliente() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE e erp.entidades; capturar boolean; final_novo boolean; final_antigo boolean;
BEGIN
 final_novo:=CASE TG_TABLE_NAME WHEN 'vendas' THEN NEW.status='confirmada' WHEN 'ordens_servico' THEN NEW.status IN ('aprovada','em_execucao','concluida') ELSE NEW.status='ativo' END;
 capturar:=TG_OP='INSERT';
 IF TG_OP='UPDATE' THEN
  final_antigo:=CASE TG_TABLE_NAME WHEN 'vendas' THEN OLD.status='confirmada' WHEN 'ordens_servico' THEN OLD.status IN ('aprovada','em_execucao','concluida') ELSE OLD.status='ativo' END;
  IF OLD.cliente_id IS DISTINCT FROM NEW.cliente_id THEN RAISE EXCEPTION 'Troca de cliente exige novo documento' USING ERRCODE='23514'; END IF;
  IF OLD.snapshot_efetivado_em IS NOT NULL OR final_antigo THEN
   IF OLD.cliente_snapshot IS DISTINCT FROM NEW.cliente_snapshot OR OLD.snapshot_efetivado_em IS DISTINCT FROM NEW.snapshot_efetivado_em OR NEW.status IN ('rascunho','orcamento_pendente') THEN RAISE EXCEPTION 'Snapshot efetivado preservado' USING ERRCODE='23514'; END IF;
  ELSE
   IF NEW.snapshot_efetivado_em IS DISTINCT FROM OLD.snapshot_efetivado_em THEN RAISE EXCEPTION 'Marco de efetivacao controlado pelo banco' USING ERRCODE='23514'; END IF;
   capturar:=final_novo OR OLD.cliente_snapshot IS DISTINCT FROM NEW.cliente_snapshot;
  END IF;
 END IF;
 IF capturar THEN
  SELECT * INTO e FROM erp.entidades WHERE tenant_id=NEW.tenant_id AND id=NEW.cliente_id;
  NEW.cliente_snapshot:=jsonb_build_object('nome',e.nome,'documento',e.documento,'email',e.email,'logradouro',e.logradouro,'numero',e.numero,'cidade',e.cidade,'uf',e.uf,'origem',CASE WHEN final_novo THEN 'cadastro_na_efetivacao' ELSE 'cadastro_no_rascunho' END);
  NEW.snapshot_efetivado_em:=CASE WHEN final_novo THEN now() END;
 END IF;
 RETURN NEW;
END $$;

ALTER TABLE erp.contratos_vendas_itens ADD COLUMN unidade text, ADD COLUMN classificacao_snapshot jsonb;
CREATE FUNCTION erp.snapshot_item_contrato() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j jsonb; c jsonb;
BEGIN
 IF TG_OP='UPDATE' AND EXISTS(SELECT 1 FROM erp.contratos_vendas_versoes WHERE tenant_id=OLD.tenant_id AND id=OLD.contrato_versao_id AND status='efetivada') THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' OR ROW(OLD.produto_id,OLD.servico_id) IS DISTINCT FROM ROW(NEW.produto_id,NEW.servico_id) THEN
  IF NEW.servico_id IS NOT NULL THEN SELECT to_jsonb(s) INTO j FROM erp.servicos s WHERE tenant_id=NEW.tenant_id AND id=NEW.servico_id;
  ELSE SELECT to_jsonb(p) INTO j FROM erp.produtos p WHERE tenant_id=NEW.tenant_id AND id=NEW.produto_id; END IF;
  SELECT jsonb_build_object('id',id,'nome',nome,'tipo',tipo) INTO c FROM erp.categorias WHERE tenant_id=NEW.tenant_id AND id=(j->>'categoria_id')::bigint;
  NEW.unidade:=coalesce(nullif(btrim(NEW.unidade),''),j->>'unidade_medida');
  NEW.classificacao_snapshot:=jsonb_build_object('item_id',j->'id','nome',j->'nome','tipo',coalesce(j->'tipo_servico',j->'tipo_produto'),'categoria',c,'origem','cadastro_no_item');
 ELSIF NEW.classificacao_snapshot IS DISTINCT FROM OLD.classificacao_snapshot THEN RAISE EXCEPTION 'Snapshot de classificacao controlado pelo banco' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER snapshot_item BEFORE INSERT OR UPDATE ON erp.contratos_vendas_itens FOR EACH ROW EXECUTE FUNCTION erp.snapshot_item_contrato();
REVOKE ALL ON FUNCTION erp.snapshot_item_contrato() FROM PUBLIC;

CREATE FUNCTION erp.preservar_previsao_utilizada() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE usada boolean;
BEGIN
 PERFORM erp.travar_evolucao(OLD.tenant_id);
 IF TG_TABLE_NAME='vendas_recebimentos_previstos' THEN
  SELECT EXISTS(SELECT 1 FROM erp.contas_receber_parcelas WHERE tenant_id=OLD.tenant_id AND recebimento_previsto_id=OLD.id) INTO usada;
 ELSE
  SELECT EXISTS(SELECT 1 FROM erp.contas_pagar_parcelas WHERE tenant_id=OLD.tenant_id AND parcela_prevista_id=OLD.id) INTO usada;
 END IF;
 IF usada AND (TG_OP='DELETE' OR to_jsonb(OLD)-ARRAY['atualizado_em','atualizado_por','observacoes'] IS DISTINCT FROM to_jsonb(NEW)-ARRAY['atualizado_em','atualizado_por','observacoes']) THEN RAISE EXCEPTION 'Previsao ja convertida preservada' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER previsao_utilizada BEFORE UPDATE OR DELETE ON erp.vendas_recebimentos_previstos FOR EACH ROW EXECUTE FUNCTION erp.preservar_previsao_utilizada();
CREATE TRIGGER previsao_utilizada BEFORE UPDATE OR DELETE ON erp.compras_parcelas_previstas FOR EACH ROW EXECUTE FUNCTION erp.preservar_previsao_utilizada();
REVOKE ALL ON FUNCTION erp.preservar_previsao_utilizada() FROM PUBLIC;


ALTER TABLE erp.execucoes_automacao ADD COLUMN evento_cobranca_id bigint,
 ADD CONSTRAINT execucao_evento_fk FOREIGN KEY(tenant_id,evento_cobranca_id) REFERENCES erp.cobrancas_eventos(tenant_id,id) ON DELETE RESTRICT;
-- A nova coluna permite separar tentativas do envelope sem outra tabela.
ALTER TABLE erp.execucoes_automacao DROP CONSTRAINT execucoes_automacao_tipo_chk;
ALTER TABLE erp.execucoes_automacao ADD CONSTRAINT execucoes_automacao_tipo_chk CHECK(tipo IN ('contratos','recorrencias_financeiras','titulos_vencidos','indicadores','estoque_minimo','cobrancas_eventos'));
CREATE FUNCTION erp.validar_execucao_evento() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF (NEW.tipo='cobrancas_eventos') IS DISTINCT FROM (NEW.evento_cobranca_id IS NOT NULL) THEN RAISE EXCEPTION 'Execucao de cobranca exige evento de origem' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND OLD.evento_cobranca_id IS DISTINCT FROM NEW.evento_cobranca_id THEN RAISE EXCEPTION 'Origem da tentativa preservada' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER execucao_evento BEFORE INSERT OR UPDATE ON erp.execucoes_automacao FOR EACH ROW EXECUTE FUNCTION erp.validar_execucao_evento();
REVOKE ALL ON FUNCTION erp.validar_execucao_evento() FROM PUBLIC;


ALTER TABLE erp.execucoes_automacao ADD COLUMN historico_estados jsonb;
ALTER TABLE erp.cobrancas_notificacoes ADD COLUMN historico_estados jsonb;
CREATE FUNCTION erp.registrar_transicao_estado() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.historico_estados IS NOT NULL THEN RAISE EXCEPTION 'Historico controlado pelo banco' USING ERRCODE='23514'; END IF;
  NEW.historico_estados:='[]'::jsonb;
 ELSE
  IF OLD.historico_estados IS DISTINCT FROM NEW.historico_estados THEN RAISE EXCEPTION 'Historico de processamento preservado' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
  NEW.historico_estados:=coalesce(NEW.historico_estados,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
   'status',NEW.status,'em',clock_timestamp(),'tentativas',to_jsonb(NEW)->'tentativas',
   'erro',coalesce(to_jsonb(NEW)->'erro',to_jsonb(NEW)->'erro_mensagem'),'resultado',to_jsonb(NEW)->'resultado'));
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER z_historico_estado BEFORE INSERT OR UPDATE ON erp.execucoes_automacao FOR EACH ROW EXECUTE FUNCTION erp.registrar_transicao_estado();
CREATE TRIGGER z_historico_estado BEFORE INSERT OR UPDATE ON erp.cobrancas_notificacoes FOR EACH ROW EXECUTE FUNCTION erp.registrar_transicao_estado();
REVOKE ALL ON FUNCTION erp.registrar_transicao_estado() FROM PUBLIC;


CREATE FUNCTION erp.preservar_importacao_identidade() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF TG_TABLE_NAME='importacoes_dados' THEN
  IF TG_OP='DELETE' THEN
   IF OLD.status IN ('concluida','parcial') THEN RAISE EXCEPTION 'Importacao com resultado preservada' USING ERRCODE='23514'; END IF;
   RETURN OLD;
  END IF;
  IF ROW(OLD.tenant_id,OLD.id,OLD.tipo,OLD.hash_arquivo) IS DISTINCT FROM ROW(NEW.tenant_id,NEW.id,NEW.tipo,NEW.hash_arquivo) OR OLD.status IN ('concluida','parcial','cancelada') THEN RAISE EXCEPTION 'Identidade ou importacao terminal preservada' USING ERRCODE='23514'; END IF;
 ELSE
  IF TG_OP='UPDATE' AND (OLD.dados_originais IS DISTINCT FROM NEW.dados_originais OR OLD.id<>NEW.id OR OLD.tenant_id<>NEW.tenant_id) THEN RAISE EXCEPTION 'Linha original preservada' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER identidade_importacao BEFORE UPDATE OR DELETE ON erp.importacoes_dados FOR EACH ROW EXECUTE FUNCTION erp.preservar_importacao_identidade();
CREATE TRIGGER identidade_importacao BEFORE UPDATE OR DELETE ON erp.importacoes_dados_linhas FOR EACH ROW EXECUTE FUNCTION erp.preservar_importacao_identidade();
REVOKE ALL ON FUNCTION erp.preservar_importacao_identidade() FROM PUBLIC;

CREATE FUNCTION erp.validar_endereco_parcial() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF coalesce(nullif(btrim(NEW.logradouro),''),nullif(btrim(NEW.cidade),''),nullif(btrim(NEW.cep),''),nullif(btrim(NEW.numero),''),nullif(btrim(NEW.bairro),''),nullif(btrim(NEW.complemento),''),nullif(btrim(NEW.uf),'')) IS NULL THEN RAISE EXCEPTION 'Endereco exige ao menos um componente' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER endereco_parcial BEFORE INSERT OR UPDATE ON erp.entidades_enderecos FOR EACH ROW EXECUTE FUNCTION erp.validar_endereco_parcial();
REVOKE ALL ON FUNCTION erp.validar_endereco_parcial() FROM PUBLIC;

CREATE FUNCTION erp.validar_geracao_compra() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r erp.compras_recorrencias; modelo erp.compras; gerada erp.compras; numero bigint; unidade text; esperado date;
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Identidade da geracao de compra preservada' USING ERRCODE='23514'; END IF;
 PERFORM erp.travar_evolucao(NEW.tenant_id);
 SELECT * INTO r FROM erp.compras_recorrencias WHERE tenant_id=NEW.tenant_id AND id=NEW.recorrencia_id;
 SELECT * INTO modelo FROM erp.compras WHERE tenant_id=NEW.tenant_id AND id=r.compra_modelo_id;
 SELECT * INTO gerada FROM erp.compras WHERE tenant_id=NEW.tenant_id AND id=NEW.compra_id;
 IF r.id IS NULL OR NOT r.ativa OR r.excluido_em IS NOT NULL OR gerada.id IS NULL OR gerada.id=modelo.id OR gerada.fornecedor_id<>modelo.fornecedor_id
 OR NEW.competencia<r.inicio_em OR NEW.competencia>r.termino_em THEN RAISE EXCEPTION 'Origem da compra recorrente invalida' USING ERRCODE='23514'; END IF;
 numero:=CASE r.frequencia WHEN 'dia' THEN NEW.competencia-r.inicio_em WHEN 'semana' THEN (NEW.competencia-r.inicio_em)/7
 WHEN 'mes' THEN (extract(year FROM NEW.competencia)-extract(year FROM r.inicio_em))*12+extract(month FROM NEW.competencia)-extract(month FROM r.inicio_em)
 ELSE extract(year FROM NEW.competencia)-extract(year FROM r.inicio_em) END;
 unidade:=CASE r.frequencia WHEN 'dia' THEN 'day' WHEN 'semana' THEN 'week' WHEN 'mes' THEN 'month' ELSE 'year' END;
 esperado:=(r.inicio_em+(numero||' '||unidade)::interval)::date;
 IF numero%r.intervalo<>0 OR esperado<>NEW.competencia OR (r.termino_tipo='ocorrencias' AND numero/r.intervalo>=r.quantidade_ocorrencias) THEN RAISE EXCEPTION 'Competencia da compra fora do calendario' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM erp.compras_recorrencias_geracoes WHERE tenant_id=NEW.tenant_id AND (compra_id=NEW.compra_id OR (recorrencia_id=NEW.recorrencia_id AND competencia=NEW.competencia))) THEN RAISE EXCEPTION 'Geracao de compra duplicada' USING ERRCODE='23505'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER geracao_compra BEFORE INSERT OR UPDATE OR DELETE ON erp.compras_recorrencias_geracoes FOR EACH ROW EXECUTE FUNCTION erp.validar_geracao_compra();
REVOKE ALL ON FUNCTION erp.validar_geracao_compra() FROM PUBLIC;

COMMIT;

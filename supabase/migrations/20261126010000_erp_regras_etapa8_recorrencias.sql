-- Etapa 8 (regras do ERP, banco.md BD-44): o calendário das recorrências sai do banco para regras/recorrencias.ts
-- (RC-01 calendário; RC-02 recorrência ativa, competência no período e dentro da quantidade), usado na geração
-- financeira e na de compras. Ficam as garantias: ocorrência não se repete nem é apagada, identidade preservada,
-- lado/fornecedor coerentes com a origem e estrutura (limites) da recorrência coerente.

CREATE OR REPLACE FUNCTION erp.validar_origem_recorrencia()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE r erp.recorrencias_financeiras; lado text; existe boolean;
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.recorrencia_financeira_id IS NOT NULL THEN RAISE EXCEPTION 'Ocorrência de recorrência não pode ser apagada; cancele o título.' USING ERRCODE='23514'; END IF;
  RETURN OLD;
 END IF;
 PERFORM erp.travar_evolucao(NEW.empresa_id);
 lado:=CASE WHEN TG_TABLE_NAME='contas_receber' THEN 'receber' ELSE 'pagar' END;
 IF TG_OP='UPDATE' AND OLD.recorrencia_financeira_id IS NOT NULL THEN
  IF ROW(OLD.recorrencia_financeira_id,OLD.data_competencia,OLD.empresa_id,OLD.id) IS DISTINCT FROM ROW(NEW.recorrencia_financeira_id,NEW.data_competencia,NEW.empresa_id,NEW.id) THEN
   RAISE EXCEPTION 'A recorrência e a competência de uma ocorrência não podem mudar.' USING ERRCODE='23514'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.recorrencia_financeira_id IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO r FROM erp.recorrencias_financeiras WHERE empresa_id=NEW.empresa_id AND id=NEW.recorrencia_financeira_id;
 IF r.id IS NULL OR r.tipo<>lado OR NEW.data_competencia IS NULL THEN
  RAISE EXCEPTION 'Ocorrência não corresponde à recorrência de origem.' USING ERRCODE='23514'; END IF;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM erp.%I WHERE empresa_id=$1 AND recorrencia_financeira_id=$2 AND data_competencia=$3 AND id<>$4)',TG_TABLE_NAME)
 INTO existe USING NEW.empresa_id,r.id,NEW.data_competencia,NEW.id;
 IF existe THEN RAISE EXCEPTION 'Esta ocorrência da recorrência já foi gerada.' USING ERRCODE='23505'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_geracao_compra()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE r erp.compras_recorrencias; modelo erp.compras; gerada erp.compras;
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Compra gerada por recorrência não pode mudar de origem nem ser apagada.' USING ERRCODE='23514'; END IF;
 PERFORM erp.travar_evolucao(NEW.empresa_id);
 SELECT * INTO r FROM erp.compras_recorrencias WHERE empresa_id=NEW.empresa_id AND id=NEW.recorrencia_id;
 SELECT * INTO modelo FROM erp.compras WHERE empresa_id=NEW.empresa_id AND id=r.compra_modelo_id;
 SELECT * INTO gerada FROM erp.compras WHERE empresa_id=NEW.empresa_id AND id=NEW.compra_id;
 IF r.id IS NULL OR gerada.id IS NULL OR gerada.id=modelo.id OR gerada.fornecedor_id<>modelo.fornecedor_id THEN
  RAISE EXCEPTION 'Compra gerada não corresponde à compra modelo da recorrência.' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM erp.compras_recorrencias_geracoes WHERE empresa_id=NEW.empresa_id AND (compra_id=NEW.compra_id OR (recorrencia_id=NEW.recorrencia_id AND competencia=NEW.competencia))) THEN
  RAISE EXCEPTION 'Esta compra da recorrência já foi gerada.' USING ERRCODE='23505'; END IF;
 RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_recorrencia_estrutura()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 PERFORM erp.travar_evolucao(NEW.empresa_id);
 IF (NEW.termino_tipo='data' AND (NEW.termino_em IS NULL OR NEW.termino_em<NEW.inicio_em OR NEW.quantidade_ocorrencias IS NOT NULL))
 OR (NEW.termino_tipo='ocorrencias' AND (NEW.quantidade_ocorrencias IS NULL OR NEW.termino_em IS NOT NULL))
 OR (NEW.termino_tipo='indeterminado' AND (NEW.termino_em IS NOT NULL OR NEW.quantidade_ocorrencias IS NOT NULL))
 OR (NEW.proxima_competencia IS NOT NULL AND (NEW.proxima_competencia<NEW.inicio_em OR NEW.proxima_competencia>NEW.termino_em)) THEN
 RAISE EXCEPTION 'O término da recorrência não confere: informe data final, quantidade de ocorrências ou prazo indeterminado.' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='recorrencias_financeiras' THEN
  IF (NEW.pausada_em IS NOT NULL OR NEW.encerrada_em IS NOT NULL) AND NEW.ativa THEN RAISE EXCEPTION 'Recorrência pausada ou encerrada não pode estar ativa.' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND OLD.encerrada_em IS NOT NULL AND to_jsonb(OLD)-ARRAY['atualizado_em','atualizado_por'] IS DISTINCT FROM to_jsonb(NEW)-ARRAY['atualizado_em','atualizado_por'] THEN RAISE EXCEPTION 'Recorrência encerrada não pode mudar.' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $function$;

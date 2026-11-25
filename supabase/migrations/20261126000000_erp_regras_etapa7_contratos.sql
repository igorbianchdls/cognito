-- Etapa 7 (regras do ERP, banco.md BD-40): as decisões de contrato saem do banco para regras/contratos.ts
-- (CT-10 versão com item e dentro do contrato; CT-11 contrato ativo com versão valendo; CT-12 ciclo de contrato ativo,
-- dentro da versão, com a duração da periodicidade e venda do mesmo cliente).
-- Ficam as garantias: versão e itens que já valem não mudam; vigências e ciclos sem sobreposição; gerações e tentativas
-- preservadas; venda não usada em dois ciclos; total do item; condições do cabeçalho só mudam por nova versão.

CREATE OR REPLACE FUNCTION erp.validar_contrato_versionado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE v erp.contratos_vendas_versoes; g erp.contratos_vendas_geracoes; tid bigint;
BEGIN
 tid:=CASE WHEN TG_OP='DELETE' THEN OLD.empresa_id ELSE NEW.empresa_id END;
 PERFORM erp.travar_evolucao(tid);
 IF TG_TABLE_NAME='contratos_vendas_versoes' THEN
  IF TG_OP='DELETE' AND OLD.status='efetivada' THEN RAISE EXCEPTION 'Versão do contrato que já vale não pode ser apagada.' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND OLD.status='efetivada' THEN
   IF (to_jsonb(OLD)-'vigencia_fim') IS DISTINCT FROM (to_jsonb(NEW)-'vigencia_fim')
    OR NEW.vigencia_fim IS NULL OR (OLD.vigencia_fim IS NOT NULL AND NEW.vigencia_fim>OLD.vigencia_fim)
    OR EXISTS(SELECT 1 FROM erp.contratos_vendas_geracoes WHERE empresa_id=tid AND contrato_versao_id=OLD.id AND periodo_fim>NEW.vigencia_fim) THEN
    RAISE EXCEPTION 'Condições já usadas no contrato não podem mudar; crie uma nova versão.' USING ERRCODE='23514';
   END IF;
  END IF;
  IF TG_OP<>'DELETE' AND NEW.status='efetivada' AND EXISTS(SELECT 1 FROM erp.contratos_vendas_versoes WHERE empresa_id=tid AND contrato_id=NEW.contrato_id AND id<>NEW.id AND status='efetivada'
     AND vigencia_inicio<=coalesce(NEW.vigencia_fim,'infinity'::date) AND coalesce(vigencia_fim,'infinity'::date)>=NEW.vigencia_inicio) THEN
   RAISE EXCEPTION 'Já existe outra versão do contrato valendo nesse período.' USING ERRCODE='23514';
  END IF;
 ELSIF TG_TABLE_NAME='contratos_vendas_itens' THEN
  IF TG_OP<>'INSERT' THEN
   SELECT * INTO v FROM erp.contratos_vendas_versoes WHERE empresa_id=tid AND id=OLD.contrato_versao_id;
   IF v.status='efetivada' THEN RAISE EXCEPTION 'Itens de versão que já vale não podem mudar; crie uma nova versão.' USING ERRCODE='23514'; END IF;
  END IF;
  IF TG_OP<>'DELETE' THEN
   SELECT * INTO v FROM erp.contratos_vendas_versoes WHERE empresa_id=tid AND id=NEW.contrato_versao_id;
   IF v.status='efetivada' THEN RAISE EXCEPTION 'Itens de versão que já vale não podem mudar; crie uma nova versão.' USING ERRCODE='23514'; END IF;
   IF NEW.total<>round(NEW.quantidade*NEW.valor_unitario,2)-NEW.desconto THEN
    RAISE EXCEPTION 'Total do item do contrato não confere com quantidade, preço e desconto.' USING ERRCODE='23514'; END IF;
  END IF;
 ELSIF TG_TABLE_NAME='contratos_vendas_geracoes' THEN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Ciclo de contrato gerado não pode ser apagado.' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' AND NEW.legado_sem_versao THEN RAISE EXCEPTION 'Marcador reservado ao histórico migrado.' USING ERRCODE='23514'; END IF;
  IF TG_OP='UPDATE' AND (OLD.legado_sem_versao OR
   (to_jsonb(OLD)-ARRAY['status','erro','processado_em','venda_id']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['status','erro','processado_em','venda_id'])
   OR (OLD.venda_id IS NOT NULL AND OLD.venda_id IS DISTINCT FROM NEW.venda_id)
   OR OLD.status IN ('concluida','ignorada')) THEN
   RAISE EXCEPTION 'Ciclo de contrato já processado não pode mudar.' USING ERRCODE='23514'; END IF;
  IF NEW.periodo_inicio IS NULL OR NEW.periodo_fim IS NULL OR NEW.periodo_fim<NEW.periodo_inicio THEN
   RAISE EXCEPTION 'Ciclo de contrato precisa de início e fim.' USING ERRCODE='23514'; END IF;
  IF NEW.venda_id IS NOT NULL AND EXISTS(SELECT 1 FROM erp.contratos_vendas_geracoes WHERE empresa_id=tid AND venda_id=NEW.venda_id AND id<>NEW.id) THEN
   RAISE EXCEPTION 'Esta venda já pertence a outro ciclo de contrato.' USING ERRCODE='23514'; END IF;
  IF EXISTS(SELECT 1 FROM erp.contratos_vendas_geracoes x WHERE x.empresa_id=tid AND x.contrato_id=NEW.contrato_id AND x.id<>NEW.id
    AND ((NOT x.legado_sem_versao AND x.periodo_inicio<=NEW.periodo_fim AND x.periodo_fim>=NEW.periodo_inicio)
      OR (x.legado_sem_versao AND date_trunc('month',x.competencia)=date_trunc('month',NEW.competencia)))) THEN
   RAISE EXCEPTION 'Este período do contrato já foi gerado.' USING ERRCODE='23514'; END IF;
  IF (NEW.status='concluida') IS DISTINCT FROM (NEW.venda_id IS NOT NULL) THEN RAISE EXCEPTION 'Ciclo concluído precisa da venda gerada.' USING ERRCODE='23514'; END IF;
 ELSE
  IF TG_OP='DELETE' OR (TG_OP='UPDATE' AND (OLD.status<>'executando'
    OR (to_jsonb(OLD)-ARRAY['fim','status','erro']) IS DISTINCT FROM (to_jsonb(NEW)-ARRAY['fim','status','erro']))) THEN
   RAISE EXCEPTION 'Tentativa de geração encerrada não pode mudar.' USING ERRCODE='23514'; END IF;
  SELECT * INTO g FROM erp.contratos_vendas_geracoes WHERE empresa_id=tid AND id=NEW.geracao_id;
  IF (NEW.status='sucesso' AND g.status<>'concluida') OR (NEW.status='executando' AND g.status<>'processando') THEN
   RAISE EXCEPTION 'Tentativa incompatível com a situação do ciclo.' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION erp.validar_cabecalho_contrato()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 PERFORM erp.travar_evolucao(NEW.empresa_id);
 IF TG_OP='UPDATE' AND EXISTS(SELECT 1 FROM erp.contratos_vendas_versoes WHERE empresa_id=OLD.empresa_id AND contrato_id=OLD.id) AND
 ROW(OLD.data_inicio,OLD.data_fim,OLD.periodicidade,OLD.dia_vencimento,OLD.reajuste_indice,OLD.reajuste_percentual,OLD.categoria_id,OLD.centro_custo_id,OLD.conta_financeira_id,OLD.metodo_pagamento_id)
 IS DISTINCT FROM ROW(NEW.data_inicio,NEW.data_fim,NEW.periodicidade,NEW.dia_vencimento,NEW.reajuste_indice,NEW.reajuste_percentual,NEW.categoria_id,NEW.centro_custo_id,NEW.conta_financeira_id,NEW.metodo_pagamento_id) THEN
 RAISE EXCEPTION 'Condições comerciais do contrato mudam por uma nova versão.' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $function$;

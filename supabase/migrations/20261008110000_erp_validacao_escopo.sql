BEGIN;

-- Validações financeiras proporcionais à operação (Fase 0, escala de escrita).
--
-- Antes: a cada linha alterada em parcelas, títulos, pagamentos, adiantamentos ou renegociações, a validação
-- diferida percorria TODOS os adiantamentos, renegociações, parcelas (com a composição de cada uma) e títulos da
-- empresa; a de conciliação percorria todos os itens, pagamentos e transações bancárias. O custo de um pagamento
-- crescia com o tamanho da empresa.
--
-- Depois: as mesmas regras, verificadas apenas nos registros tocados pela linha e nos vizinhos que dependem deles
-- (parcela ↔ título ↔ acordo; adiantamento ↔ aplicações; item de conciliação ↔ pagamento/adiantamento/
-- transferência/extrato/conciliação). Todas as regras são locais a esses grupos, então o resultado é o mesmo.
--
-- A trava por empresa passa a esperar a vez (limitada por lock_timeout) em vez de falhar na hora com 40001.

CREATE OR REPLACE FUNCTION erp.travar_evolucao(p_tenant bigint)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog'
AS $function$
BEGIN
 PERFORM erp.travar_periodo_empresa(p_tenant,false);
 PERFORM pg_advisory_xact_lock(172943,hashint8(p_tenant));
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
  IF saldo_adiantamento<0 OR saldo_adiantamento>a.valor THEN RAISE EXCEPTION 'Saldo de adiantamento excedido' USING ERRCODE='23514'; END IF;
  IF EXISTS(WITH movimentos AS (
   SELECT coalesce(a.data_credito,a.data_movimento) dia,a.valor delta
   UNION ALL SELECT coalesce(m.data_credito,m.data_movimento),CASE WHEN m.tipo='devolucao' OR o.tipo='constituicao' THEN -m.valor ELSE m.valor END
    FROM erp.adiantamentos m LEFT JOIN erp.adiantamentos o ON o.empresa_id=m.empresa_id AND o.id=m.reversao_de_id WHERE m.empresa_id=t AND m.adiantamento_id=a.id
   UNION ALL SELECT data_aplicacao,CASE WHEN reversao_de_id IS NULL THEN -valor ELSE valor END FROM erp.adiantamentos_aplicacoes WHERE empresa_id=t AND adiantamento_id=a.id
  ), por_dia AS (SELECT dia,sum(delta) delta FROM movimentos GROUP BY dia), saldos AS (SELECT sum(delta) OVER(ORDER BY dia) saldo FROM por_dia)
  SELECT 1 FROM saldos WHERE saldo<0) THEN RAISE EXCEPTION 'Saldo historico do adiantamento negativo' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM erp.pagamentos origem WHERE origem.empresa_id=t AND origem.id=ANY(pg) AND origem.estornado_em IS NOT NULL AND origem.estorno_de_pagamento_id IS NULL
  AND NOT EXISTS(SELECT 1 FROM erp.pagamentos x WHERE x.empresa_id=t AND x.estorno_de_pagamento_id=origem.id)) THEN
  RAISE EXCEPTION 'Estorno exige contramovimento na mesma transacao' USING ERRCODE='23514'; END IF;
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
 ) SELECT 1 FROM caminhos WHERE ciclo) THEN RAISE EXCEPTION 'Ciclo entre renegociacoes' USING ERRCODE='23514'; END IF;
 FOR r IN SELECT * FROM erp.renegociacoes WHERE empresa_id=t AND id=ANY(rs) LOOP
  soma_origem:=0; soma_destino:=0;
  FOR l IN SELECT * FROM erp.renegociacoes_parcelas WHERE empresa_id=t AND renegociacao_id=r.id LOOP
   lado:=CASE WHEN l.conta_receber_parcela_id IS NOT NULL THEN 'receber' ELSE 'pagar' END;
   SELECT * INTO c FROM erp.composicao_parcela(t,lado,coalesce(l.conta_receber_parcela_id,l.conta_pagar_parcela_id));
   IF c.entidade_id IS DISTINCT FROM r.entidade_id OR lado<>r.lado THEN RAISE EXCEPTION 'Entidade/lado do acordo incompativel' USING ERRCODE='23514'; END IF;
   IF l.papel='origem' THEN
    soma_origem:=soma_origem+l.valor;
    IF r.status='efetivada' AND (c.saldo<>0 OR c.transferido<>l.valor) THEN RAISE EXCEPTION 'Acordo deve transferir saldo integral uma unica vez' USING ERRCODE='23514'; END IF;
   ELSE
    soma_destino:=soma_destino+l.valor;
    EXECUTE format('SELECT renegociacao_origem_id=$3 FROM erp.contas_%s WHERE empresa_id=$1 AND id=$2',lado) INTO valido USING t,c.titulo_id,r.id;
    IF valido IS DISTINCT FROM true OR l.valor<>c.valor THEN RAISE EXCEPTION 'Destino exige titulo proprio do acordo e valor correspondente' USING ERRCODE='23514'; END IF;
    IF r.status='rascunho' THEN RAISE EXCEPTION 'Parcelas destino devem ser criadas na transacao da efetivacao' USING ERRCODE='23514'; END IF;
    IF r.status='revertida' THEN
     EXECUTE format('SELECT status=''cancelado'' FROM erp.contas_%s_parcelas WHERE empresa_id=$1 AND id=$2',lado) INTO valido USING t,coalesce(l.conta_receber_parcela_id,l.conta_pagar_parcela_id);
     IF c.dinheiro<>0 OR c.credito<>0 OR c.transferido<>0 OR valido IS DISTINCT FROM true THEN RAISE EXCEPTION 'Reversao exige destino sem liquidacoes/dependencias e cancelado' USING ERRCODE='23514'; END IF;
    END IF;
   END IF;
  END LOOP;
  IF r.status<>'rascunho' AND (soma_origem<=0 OR soma_destino<=0 OR soma_destino<>soma_origem-r.desconto+r.encargos) THEN
   RAISE EXCEPTION 'Equacao da renegociacao inconsistente' USING ERRCODE='23514'; END IF;
 END LOOP;
 FOREACH lado IN ARRAY ARRAY['receber','pagar'] LOOP
  FOR p IN EXECUTE format('SELECT p.*,t.status titulo_status,t.excluido_em titulo_excluido FROM erp.contas_%s_parcelas p JOIN erp.contas_%s t ON t.empresa_id=p.empresa_id AND t.id=p.conta_%s_id WHERE p.empresa_id=$1 AND p.id=ANY($2)',lado,lado,lado)
   USING t,CASE WHEN lado='receber' THEN pr ELSE pp END LOOP
   SELECT * INTO c FROM erp.composicao_parcela(t,lado,p.id);
   IF c.saldo<0 OR c.credito<0 OR
    ((p.status='cancelado' OR p.excluido_em IS NOT NULL OR p.titulo_status='cancelado' OR p.titulo_excluido IS NOT NULL) AND (c.dinheiro<>0 OR c.credito<>0 OR c.transferido<>0)) THEN
    RAISE EXCEPTION 'Saldo excedido ou liquidacao em obrigacao cancelada' USING ERRCODE='23514'; END IF;
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
     RAISE EXCEPTION 'Titulo de renegociacao sem acordo efetivo correspondente' USING ERRCODE='23514'; END IF;
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM erp.contas_%s_parcelas par WHERE par.empresa_id=$1 AND par.conta_%s_id=$2 AND par.excluido_em IS NULL AND NOT EXISTS(SELECT 1 FROM erp.renegociacoes_parcelas link WHERE link.empresa_id=par.empresa_id AND link.conta_%s_parcela_id=par.id AND link.renegociacao_id=$3 AND link.papel=''destino''))',lado,lado,lado)
     INTO valido USING t,titulo.id,titulo.renegociacao_origem_id;
    IF valido THEN RAISE EXCEPTION 'Parcela destino sem vinculo no acordo' USING ERRCODE='23514'; END IF;
   END IF;
   EXECUTE format('SELECT count(*) n,coalesce(sum(valor),0) total,bool_and(status IN (''pago'',''renegociado'')) quitado,bool_or(status=''renegociado'') renegociado,bool_or(status IN (''pago'',''parcial'',''renegociado'')) parcial FROM erp.contas_%s_parcelas WHERE empresa_id=$1 AND conta_%s_id=$2 AND excluido_em IS NULL',lado,lado)
    INTO agregado USING t,titulo.id;
   IF agregado.n>0 AND titulo.valor_total<>agregado.total THEN RAISE EXCEPTION 'Total do titulo diverge das parcelas' USING ERRCODE='23514'; END IF;
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
   RAISE EXCEPTION 'Extrato incompativel com conciliacao' USING ERRCODE='23514'; END IF;
  IF i.pagamento_id IS NOT NULL THEN
   SELECT * INTO p FROM erp.pagamentos WHERE empresa_id=t AND id=i.pagamento_id;
   conta:=p.conta_financeira_id; limite:=p.valor_liquido;
   sentido:=CASE WHEN (p.tipo='receber')=(p.estorno_de_pagamento_id IS NULL) THEN 'credito' ELSE 'debito' END;
   SELECT coalesce(sum(valor_conciliado),0) INTO total FROM erp.conciliacoes_bancarias_itens WHERE empresa_id=t AND pagamento_id=p.id AND desfeito_em IS NULL;
   IF p.excluido_em IS NOT NULL THEN RAISE EXCEPTION 'Pagamento indisponivel' USING ERRCODE='23514'; END IF;
  ELSIF i.adiantamento_id IS NOT NULL THEN
   SELECT * INTO a FROM erp.adiantamentos WHERE empresa_id=t AND id=i.adiantamento_id;
   conta:=a.conta_financeira_id; limite:=a.valor;
   IF a.tipo='reversao' THEN SELECT * INTO o FROM erp.adiantamentos WHERE empresa_id=t AND id=a.reversao_de_id; ELSE o:=a; END IF;
   sentido:=CASE WHEN ((a.lado='receber')=(o.tipo='constituicao'))=(a.tipo<>'reversao') THEN 'credito' ELSE 'debito' END;
   SELECT coalesce(sum(valor_conciliado),0) INTO total FROM erp.conciliacoes_bancarias_itens WHERE empresa_id=t AND adiantamento_id=a.id AND desfeito_em IS NULL;
  ELSE
   SELECT * INTO tr FROM erp.transferencias_financeiras WHERE empresa_id=t AND id=i.transferencia_financeira_id;
   IF tr.status='cancelada' OR tr.excluido_em IS NOT NULL OR b.conta_financeira_id NOT IN (tr.conta_origem_id,tr.conta_destino_id) THEN RAISE EXCEPTION 'Transferencia indisponivel ou conta incorreta' USING ERRCODE='23514'; END IF;
   conta:=b.conta_financeira_id; limite:=tr.valor;
   sentido:=CASE WHEN conta=tr.conta_origem_id THEN 'debito' ELSE 'credito' END;
   SELECT coalesce(sum(x.valor_conciliado),0) INTO total FROM erp.conciliacoes_bancarias_itens x
    JOIN erp.transacoes_bancarias z ON z.empresa_id=x.empresa_id AND z.id=x.transacao_bancaria_id
    WHERE x.empresa_id=t AND x.transferencia_financeira_id=tr.id AND x.desfeito_em IS NULL AND z.conta_financeira_id=conta;
  END IF;
  IF conta IS DISTINCT FROM b.conta_financeira_id OR sentido IS DISTINCT FROM b.tipo OR total>limite THEN RAISE EXCEPTION 'Conciliacao excede origem ou diverge em conta/sentido' USING ERRCODE='23514'; END IF;
  SELECT sum(valor_conciliado) INTO total FROM erp.conciliacoes_bancarias_itens WHERE empresa_id=t AND transacao_bancaria_id=b.id AND desfeito_em IS NULL;
  IF total>b.valor THEN RAISE EXCEPTION 'Conciliacao excede extrato' USING ERRCODE='23514'; END IF;
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

-- Apoio às buscas acima (título de destino de um acordo; itens por pagamento, extrato e conciliação).
CREATE INDEX IF NOT EXISTS contas_receber_renegociacao_origem_idx ON erp.contas_receber(empresa_id, renegociacao_origem_id) WHERE renegociacao_origem_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_pagar_renegociacao_origem_idx ON erp.contas_pagar(empresa_id, renegociacao_origem_id) WHERE renegociacao_origem_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS conciliacao_itens_pagamento_idx ON erp.conciliacoes_bancarias_itens(empresa_id, pagamento_id) WHERE pagamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS conciliacao_itens_conciliacao_idx ON erp.conciliacoes_bancarias_itens(empresa_id, conciliacao_id);
CREATE INDEX IF NOT EXISTS conciliacao_itens_adiantamento_idx ON erp.conciliacoes_bancarias_itens(empresa_id, adiantamento_id) WHERE adiantamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS conciliacao_itens_transferencia_idx ON erp.conciliacoes_bancarias_itens(empresa_id, transferencia_financeira_id) WHERE transferencia_financeira_id IS NOT NULL;

COMMIT;

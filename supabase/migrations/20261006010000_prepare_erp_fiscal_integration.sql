BEGIN;

-- Provider-independent foundation. No emitter, token, worker or external call is enabled.
ALTER TABLE erp.configuracoes_fiscais RENAME COLUMN focus_empresa_ref TO empresa_provedor_ref;
ALTER TABLE erp.configuracoes_fiscais DROP CONSTRAINT configuracoes_fiscais_provedor_chk;
ALTER TABLE erp.configuracoes_fiscais ALTER COLUMN provedor DROP DEFAULT;
ALTER TABLE erp.configuracoes_fiscais ADD COLUMN padrao boolean NOT NULL DEFAULT true;
ALTER TABLE erp.configuracoes_fiscais ADD CONSTRAINT configuracoes_fiscais_provedor_chk
  CHECK (provedor ~ '^[a-z][a-z0-9_]{1,63}$');
DROP INDEX erp.configuracoes_fiscais_cnpj_ativo_idx;
CREATE UNIQUE INDEX configuracoes_fiscais_empresa_ambiente_provedor_idx
  ON erp.configuracoes_fiscais(empresa_id, cnpj, ambiente, provedor) WHERE excluido_em IS NULL;
CREATE UNIQUE INDEX configuracoes_fiscais_padrao_ambiente_idx
  ON erp.configuracoes_fiscais(empresa_id, ambiente) WHERE padrao AND ativo AND excluido_em IS NULL;

ALTER TABLE erp.notas_fiscais RENAME COLUMN ref_focus TO referencia_externa;
ALTER TABLE erp.notas_fiscais RENAME COLUMN resposta_focus TO resposta_provedor;
ALTER TABLE erp.notas_fiscais RENAME CONSTRAINT notas_fiscais_saida_ref_focus_chk TO notas_fiscais_saida_referencia_chk;
ALTER TABLE erp.notas_fiscais ADD COLUMN provedor text,
  ADD COLUMN ambiente text,
  ADD COLUMN modelo_emissao text,
  ADD COLUMN data_competencia date,
  ADD COLUMN numero_rps text, ADD COLUMN serie_rps text, ADD COLUMN tipo_rps integer,
  ADD COLUMN numero_dps text, ADD COLUMN serie_dps text,
  ADD COLUMN codigo_verificacao text,
  ADD COLUMN codigo_municipio_emissao text, ADD COLUMN codigo_municipio_prestacao text,
  ADD COLUMN emitente_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN destinatario_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN integracao_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN conteudo_bloqueado_em timestamptz;
ALTER TABLE erp.notas_fiscais ADD CONSTRAINT notas_fiscais_integracao_chk CHECK (
  (provedor IS NULL OR provedor ~ '^[a-z][a-z0-9_]{1,63}$')
  AND (ambiente IS NULL OR ambiente IN ('homologacao','producao'))
  AND (modelo_emissao IS NULL OR (tipo='nfe' AND modelo_emissao='nfe')
    OR (tipo='nfce' AND modelo_emissao='nfce')
    OR (tipo='nfse' AND modelo_emissao IN ('nfse_municipal','nfse_nacional')))
  AND (venda_id IS NULL OR compra_id IS NULL)
  AND jsonb_typeof(emitente_snapshot)='object'
  AND jsonb_typeof(destinatario_snapshot)='object'
  AND jsonb_typeof(integracao_snapshot)='object'
  AND (codigo_municipio_emissao IS NULL OR codigo_municipio_emissao ~ '^[0-9]{7}$')
  AND (codigo_municipio_prestacao IS NULL OR codigo_municipio_prestacao ~ '^[0-9]{7}$')
);
-- Documents may cover partial deliveries or complements. External identity prevents duplicates.
DROP INDEX erp.notas_fiscais_venda_tipo_unica_idx;
DROP INDEX erp.notas_fiscais_ref_focus_unica_idx;
CREATE UNIQUE INDEX notas_fiscais_referencia_unica_idx ON erp.notas_fiscais
  (empresa_id, COALESCE(provedor,''), COALESCE(ambiente,''), referencia_externa)
  WHERE referencia_externa IS NOT NULL;
CREATE UNIQUE INDEX notas_fiscais_saida_chave_unica_idx ON erp.notas_fiscais(empresa_id,chave_acesso)
  WHERE direcao='saida' AND chave_acesso IS NOT NULL;
CREATE INDEX notas_fiscais_venda_idx ON erp.notas_fiscais(empresa_id,venda_id) WHERE venda_id IS NOT NULL;

ALTER TABLE erp.notas_fiscais_itens ADD COLUMN numero_item integer,
  ADD COLUMN codigo_item text, ADD COLUMN unidade text, ADD COLUMN origem text, ADD COLUMN cest text,
  ADD COLUMN codigo_tributacao_nacional_iss text,
  ADD COLUMN codigo_tributacao_municipal text,
  ADD COLUMN base_iss numeric(18,2), ADD COLUMN valor_iss numeric(18,2),
  ADD COLUMN desconto numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN tributos jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE erp.notas_fiscais_itens ADD CONSTRAINT notas_fiscais_itens_integracao_chk CHECK (
  (numero_item IS NULL OR numero_item>0) AND desconto>=0
  AND (base_iss IS NULL OR base_iss>=0) AND (valor_iss IS NULL OR valor_iss>=0)
  AND (aliquota_iss IS NULL OR aliquota_iss<=100)
  AND (tipo_item<>'produto' OR servico_id IS NULL)
  AND (tipo_item<>'servico' OR produto_id IS NULL)
  AND jsonb_typeof(tributos)='object'
);
CREATE UNIQUE INDEX notas_fiscais_itens_numero_idx ON erp.notas_fiscais_itens(empresa_id,nota_fiscal_id,numero_item)
  WHERE numero_item IS NOT NULL AND excluido_em IS NULL;

-- Nullable values distinguish information not supplied from an explicit zero.
ALTER TABLE erp.notas_fiscais_totais ADD COLUMN base_iss numeric(18,2),
  ADD COLUMN valor_iss numeric(18,2), ADD COLUMN iss_retido boolean,
  ADD COLUMN retencao_iss numeric(18,2), ADD COLUMN retencao_irrf numeric(18,2),
  ADD COLUMN retencao_inss numeric(18,2), ADD COLUMN retencao_pis numeric(18,2),
  ADD COLUMN retencao_cofins numeric(18,2), ADD COLUMN retencao_csll numeric(18,2),
  ADD COLUMN base_ibs numeric(18,2), ADD COLUMN valor_ibs_uf numeric(18,2),
  ADD COLUMN valor_ibs_municipio numeric(18,2), ADD COLUMN base_cbs numeric(18,2),
  ADD COLUMN valor_cbs numeric(18,2), ADD COLUMN valor_liquido numeric(18,2);
ALTER TABLE erp.notas_fiscais_totais ADD CONSTRAINT notas_fiscais_totais_servicos_chk CHECK (
  COALESCE(base_iss,0)>=0 AND COALESCE(valor_iss,0)>=0
  AND COALESCE(retencao_iss,0)>=0 AND COALESCE(retencao_irrf,0)>=0
  AND COALESCE(retencao_inss,0)>=0 AND COALESCE(retencao_pis,0)>=0
  AND COALESCE(retencao_cofins,0)>=0 AND COALESCE(retencao_csll,0)>=0
  AND COALESCE(base_ibs,0)>=0 AND COALESCE(valor_ibs_uf,0)>=0
  AND COALESCE(valor_ibs_municipio,0)>=0 AND COALESCE(base_cbs,0)>=0
  AND COALESCE(valor_cbs,0)>=0 AND COALESCE(valor_liquido,0)>=0
);

CREATE TABLE erp.notas_fiscais_tentativas (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  empresa_id bigint NOT NULL REFERENCES shared.empresas(id) ON DELETE RESTRICT,
  nota_fiscal_id bigint NOT NULL,
  acao text NOT NULL CHECK(acao IN ('emitir','consultar','cancelar','corrigir','substituir','inutilizar')),
  chave_idempotencia text NOT NULL CHECK(length(btrim(chave_idempotencia)) BETWEEN 1 AND 200),
  numero_tentativa integer NOT NULL DEFAULT 1 CHECK(numero_tentativa>0),
  request_hash text NOT NULL CHECK(request_hash ~ '^[0-9a-f]{64}$'),
  provedor text NOT NULL CHECK(provedor ~ '^[a-z][a-z0-9_]{1,63}$'),
  ambiente text NOT NULL CHECK(ambiente IN ('homologacao','producao')),
  referencia_externa text NOT NULL CHECK(length(btrim(referencia_externa))>0),
  status text NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','processando','aceita','concluida','falha','resultado_desconhecido')),
  payload_enviado jsonb NOT NULL CHECK(jsonb_typeof(payload_enviado)='object'),
  resposta_provedor jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(resposta_provedor)='object'),
  http_status integer CHECK(http_status BETWEEN 100 AND 599),
  erro_codigo text, erro_mensagem text,
  enviada_em timestamptz, concluida_em timestamptz, proxima_tentativa_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(), atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por bigint REFERENCES shared.usuarios(id) ON DELETE SET NULL,
  atualizado_por bigint REFERENCES shared.usuarios(id) ON DELETE SET NULL,
  UNIQUE(empresa_id,id), UNIQUE(empresa_id,nota_fiscal_id,acao,chave_idempotencia,numero_tentativa),
  FOREIGN KEY(empresa_id,nota_fiscal_id) REFERENCES erp.notas_fiscais(empresa_id,id) ON DELETE RESTRICT
);
CREATE INDEX notas_fiscais_tentativas_pendentes_idx ON erp.notas_fiscais_tentativas(empresa_id,proxima_tentativa_em,criado_em)
  WHERE status IN ('pendente','resultado_desconhecido','falha');

CREATE TABLE erp.notas_fiscais_retornos (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  empresa_id bigint NOT NULL REFERENCES shared.empresas(id) ON DELETE RESTRICT,
  nota_fiscal_id bigint,
  provedor text NOT NULL CHECK(provedor ~ '^[a-z][a-z0-9_]{1,63}$'),
  ambiente text NOT NULL CHECK(ambiente IN ('homologacao','producao')),
  referencia_externa text NOT NULL CHECK(length(btrim(referencia_externa))>0),
  evento_externo_id text,
  chave_deduplicacao text NOT NULL CHECK(chave_deduplicacao ~ '^[0-9a-f]{64}$'),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
  status text NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','processando','processado','ignorado','falha')),
  tentativas_processamento integer NOT NULL DEFAULT 0 CHECK(tentativas_processamento>=0),
  recebido_em timestamptz NOT NULL DEFAULT now(), processado_em timestamptz,
  proxima_tentativa_em timestamptz, erro_codigo text, erro_mensagem text,
  criado_em timestamptz NOT NULL DEFAULT now(), atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id,id), UNIQUE(empresa_id,provedor,ambiente,chave_deduplicacao),
  FOREIGN KEY(empresa_id,nota_fiscal_id) REFERENCES erp.notas_fiscais(empresa_id,id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX notas_fiscais_retornos_evento_idx ON erp.notas_fiscais_retornos(empresa_id,provedor,ambiente,evento_externo_id)
  WHERE evento_externo_id IS NOT NULL;
CREATE INDEX notas_fiscais_retornos_pendentes_idx ON erp.notas_fiscais_retornos(empresa_id,proxima_tentativa_em,recebido_em)
  WHERE status IN ('pendente','falha');

ALTER TABLE erp.notas_fiscais_eventos DROP CONSTRAINT notas_fiscais_eventos_provedor_chk;
ALTER TABLE erp.notas_fiscais_eventos ALTER COLUMN provedor DROP DEFAULT;
ALTER TABLE erp.notas_fiscais_eventos ADD CONSTRAINT notas_fiscais_eventos_provedor_chk CHECK(provedor ~ '^[a-z][a-z0-9_]{1,63}$');
ALTER TABLE erp.notas_fiscais_eventos ADD COLUMN retorno_id bigint, ADD COLUMN tentativa_id bigint,
  ADD CONSTRAINT notas_fiscais_eventos_retorno_fk FOREIGN KEY(empresa_id,retorno_id)
    REFERENCES erp.notas_fiscais_retornos(empresa_id,id) ON DELETE RESTRICT,
  ADD CONSTRAINT notas_fiscais_eventos_tentativa_fk FOREIGN KEY(empresa_id,tentativa_id)
    REFERENCES erp.notas_fiscais_tentativas(empresa_id,id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX notas_fiscais_eventos_retorno_idx ON erp.notas_fiscais_eventos(empresa_id,retorno_id,evento) WHERE retorno_id IS NOT NULL;

CREATE TABLE erp.notas_fiscais_arquivos (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  empresa_id bigint NOT NULL REFERENCES shared.empresas(id) ON DELETE RESTRICT,
  nota_fiscal_id bigint NOT NULL, arquivo_id bigint NOT NULL,
  finalidade text NOT NULL CHECK(finalidade IN ('xml_autorizado','xml_recebido','documento_auxiliar','xml_evento','outro')),
  descricao text, criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por bigint REFERENCES shared.usuarios(id) ON DELETE SET NULL,
  UNIQUE(empresa_id,id), UNIQUE(empresa_id,nota_fiscal_id,arquivo_id),
  FOREIGN KEY(empresa_id,nota_fiscal_id) REFERENCES erp.notas_fiscais(empresa_id,id) ON DELETE RESTRICT,
  FOREIGN KEY(empresa_id,arquivo_id) REFERENCES erp.arquivos(empresa_id,id) ON DELETE RESTRICT
);
CREATE TRIGGER preservar_arquivo_fiscal BEFORE UPDATE OR DELETE ON erp.notas_fiscais_arquivos
  FOR EACH ROW EXECUTE FUNCTION erp.bloquear_mutacao_evento();

CREATE FUNCTION erp.validar_integridade_nota_fiscal() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE documento record; config record;
BEGIN
  IF TG_OP='DELETE' THEN
    IF OLD.conteudo_bloqueado_em IS NOT NULL THEN RAISE EXCEPTION 'Documento fiscal autorizado não pode ser excluído' USING ERRCODE='23514'; END IF;
    RETURN OLD;
  END IF;
  IF TG_OP='UPDATE' AND OLD.conteudo_bloqueado_em IS NOT NULL THEN
    IF (to_jsonb(NEW)-ARRAY['status','atualizado_em','atualizado_por','cancelada_em','erro_codigo','erro_mensagem','codigo_status_sefaz','motivo_status_sefaz','resposta_provedor','xml_url','pdf_url','danfe_url','versao'])
      IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','atualizado_em','atualizado_por','cancelada_em','erro_codigo','erro_mensagem','codigo_status_sefaz','motivo_status_sefaz','resposta_provedor','xml_url','pdf_url','danfe_url','versao']) THEN
      RAISE EXCEPTION 'Conteúdo fiscal autorizado é imutável' USING ERRCODE='23514';
    END IF;
    IF NEW.status NOT IN ('emitida','cancelada','corrigida','denegada') OR
      (OLD.status IN ('cancelada','denegada') AND NEW.status<>OLD.status) THEN
      RAISE EXCEPTION 'Transição de documento fiscal finalizado inválida' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP='INSERT' THEN NEW.conteudo_bloqueado_em:=NULL; END IF;
  IF NEW.venda_id IS NOT NULL THEN
    SELECT cliente_id INTO documento FROM erp.vendas WHERE empresa_id=NEW.empresa_id AND id=NEW.venda_id;
    IF documento.cliente_id IS DISTINCT FROM NEW.entidade_id THEN RAISE EXCEPTION 'Destinatário diferente do cliente da venda' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.compra_id IS NOT NULL THEN
    SELECT fornecedor_id INTO documento FROM erp.compras WHERE empresa_id=NEW.empresa_id AND id=NEW.compra_id;
    IF documento.fornecedor_id IS DISTINCT FROM NEW.entidade_id THEN RAISE EXCEPTION 'Entidade diferente do fornecedor da compra' USING ERRCODE='23514'; END IF;
  END IF;
  IF NEW.direcao='saida' AND NEW.status IN ('pronta_envio','aguardando_retorno','emitida','corrigida','denegada') THEN
    SELECT * INTO config FROM erp.configuracoes_fiscais WHERE empresa_id=NEW.empresa_id AND id=NEW.configuracao_fiscal_id;
    IF NOT FOUND OR NEW.provedor IS DISTINCT FROM config.provedor OR NEW.ambiente IS DISTINCT FROM config.ambiente
      OR NEW.modelo_emissao IS NULL OR NEW.emitente_snapshot='{}'::jsonb OR NEW.destinatario_snapshot='{}'::jsonb THEN
      RAISE EXCEPTION 'Preparação fiscal incompleta ou configuração incompatível' USING ERRCODE='23514';
    END IF;
    IF NEW.status='pronta_envio' AND (NOT config.ativo OR config.excluido_em IS NOT NULL) THEN
      RAISE EXCEPTION 'Configuração fiscal inativa' USING ERRCODE='23514';
    END IF;
    IF NEW.modelo_emissao='nfse_nacional' AND (NEW.data_competencia IS NULL OR NEW.numero_dps IS NULL OR NEW.serie_dps IS NULL
      OR NEW.codigo_municipio_emissao IS NULL OR NEW.codigo_municipio_prestacao IS NULL) THEN
      RAISE EXCEPTION 'Identificação da DPS nacional incompleta' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validar_integridade_nota BEFORE INSERT OR UPDATE OR DELETE ON erp.notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION erp.validar_integridade_nota_fiscal();

CREATE FUNCTION erp.congelar_nota_fiscal_finalizada() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  -- Deferred until children are inserted: preserves existing atomic XML imports.
  UPDATE erp.notas_fiscais SET conteudo_bloqueado_em=transaction_timestamp()
    WHERE empresa_id=NEW.empresa_id AND id=NEW.id AND conteudo_bloqueado_em IS NULL
      AND status IN ('emitida','cancelada','corrigida','denegada');
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER congelar_nota_finalizada AFTER INSERT OR UPDATE ON erp.notas_fiscais
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  WHEN (NEW.conteudo_bloqueado_em IS NULL AND NEW.status IN ('emitida','cancelada','corrigida','denegada'))
  EXECUTE FUNCTION erp.congelar_nota_fiscal_finalizada();

CREATE FUNCTION erp.validar_filho_nota_fiscal() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE nota record; origem record; empresa bigint; nota_id bigint;
BEGIN
  IF TG_OP='DELETE' THEN empresa:=OLD.empresa_id; nota_id:=OLD.nota_fiscal_id;
  ELSE empresa:=NEW.empresa_id; nota_id:=NEW.nota_fiscal_id; END IF;
  IF TG_OP='UPDATE' AND (NEW.empresa_id,NEW.nota_fiscal_id) IS DISTINCT FROM (OLD.empresa_id,OLD.nota_fiscal_id) THEN
    RAISE EXCEPTION 'Item/total fiscal não pode mudar de documento' USING ERRCODE='23514';
  END IF;
  SELECT * INTO nota FROM erp.notas_fiscais WHERE empresa_id=empresa AND id=nota_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nota fiscal não encontrada' USING ERRCODE='23503'; END IF;
  IF nota.conteudo_bloqueado_em IS NOT NULL THEN RAISE EXCEPTION 'Itens e totais fiscais autorizados são imutáveis' USING ERRCODE='23514'; END IF;
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
END $$;
CREATE TRIGGER validar_item_fiscal BEFORE INSERT OR UPDATE OR DELETE ON erp.notas_fiscais_itens
  FOR EACH ROW EXECUTE FUNCTION erp.validar_filho_nota_fiscal();
CREATE TRIGGER validar_total_fiscal BEFORE INSERT OR UPDATE OR DELETE ON erp.notas_fiscais_totais
  FOR EACH ROW EXECUTE FUNCTION erp.validar_filho_nota_fiscal();

CREATE FUNCTION erp.validar_registro_integracao_fiscal() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
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
      RAISE EXCEPTION 'Chave de idempotência reutilizada com outro pedido' USING ERRCODE='23514';
    END IF;
    IF NEW.acao='emitir' AND nota.status NOT IN ('pronta_envio','aguardando_retorno','falha') THEN
      RAISE EXCEPTION 'Nota não preparada para tentativa de emissão' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validar_tentativa_fiscal BEFORE INSERT OR UPDATE OR DELETE ON erp.notas_fiscais_tentativas
  FOR EACH ROW EXECUTE FUNCTION erp.validar_registro_integracao_fiscal();
CREATE TRIGGER validar_retorno_fiscal BEFORE INSERT OR UPDATE OR DELETE ON erp.notas_fiscais_retornos
  FOR EACH ROW EXECUTE FUNCTION erp.validar_registro_integracao_fiscal();

CREATE FUNCTION erp.validar_evento_integracao_fiscal() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE origem record;
BEGIN
  IF NEW.retorno_id IS NOT NULL THEN
    SELECT nota_fiscal_id,provedor INTO origem FROM erp.notas_fiscais_retornos WHERE empresa_id=NEW.empresa_id AND id=NEW.retorno_id;
    IF NOT FOUND OR origem.nota_fiscal_id IS DISTINCT FROM NEW.nota_fiscal_id OR origem.provedor IS DISTINCT FROM NEW.provedor THEN
      RAISE EXCEPTION 'Evento incompatível com o retorno' USING ERRCODE='23514';
    END IF;
  END IF;
  IF NEW.tentativa_id IS NOT NULL THEN
    SELECT nota_fiscal_id,provedor INTO origem FROM erp.notas_fiscais_tentativas WHERE empresa_id=NEW.empresa_id AND id=NEW.tentativa_id;
    IF NOT FOUND OR origem.nota_fiscal_id IS DISTINCT FROM NEW.nota_fiscal_id OR origem.provedor IS DISTINCT FROM NEW.provedor THEN
      RAISE EXCEPTION 'Evento incompatível com a tentativa' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validar_evento_fiscal BEFORE INSERT ON erp.notas_fiscais_eventos
  FOR EACH ROW EXECUTE FUNCTION erp.validar_evento_integracao_fiscal();

CREATE FUNCTION erp.preservar_original_arquivo_fiscal() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM erp.notas_fiscais_arquivos a WHERE a.empresa_id=OLD.empresa_id AND a.arquivo_id=OLD.id) THEN
    IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Arquivo fiscal associado não pode ser excluído' USING ERRCODE='23514'; END IF;
    IF (NEW.empresa_id,NEW.id,NEW.bucket,NEW.caminho,NEW.hash_sha256,NEW.excluido_em)
      IS DISTINCT FROM (OLD.empresa_id,OLD.id,OLD.bucket,OLD.caminho,OLD.hash_sha256,OLD.excluido_em) THEN
      RAISE EXCEPTION 'Localização e hash do arquivo fiscal são imutáveis' USING ERRCODE='23514';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preservar_original_fiscal BEFORE UPDATE OR DELETE ON erp.arquivos
  FOR EACH ROW EXECUTE FUNCTION erp.preservar_original_arquivo_fiscal();

CREATE OR REPLACE FUNCTION erp.fiscal_issuer_for_operations(input_empresa_id bigint, input_ambiente text)
RETURNS TABLE(empresa_id bigint,id bigint,cnpj text,inscricao_estadual text,endereco_codigo_municipio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT c.empresa_id,c.id,c.cnpj,c.inscricao_estadual,c.endereco_codigo_municipio
  FROM erp.configuracoes_fiscais c WHERE c.empresa_id=input_empresa_id AND c.ambiente=input_ambiente
    AND c.padrao AND c.ativo AND c.excluido_em IS NULL
    AND (shared.can_read_erp_module(input_empresa_id,'vendas') OR shared.can_read_erp_module(input_empresa_id,'compras')
      OR shared.can_read_erp_module(input_empresa_id,'configuracoes'));
$$;
REVOKE ALL ON FUNCTION erp.fiscal_issuer_for_operations(bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION erp.fiscal_issuer_for_operations(bigint,text) TO erp_runtime,service_role;
-- Existing callers perform a production preflight; new callers select the environment explicitly.
CREATE OR REPLACE FUNCTION erp.fiscal_issuer_for_operations(input_tenant_id bigint)
RETURNS TABLE(tenant_id bigint,id bigint,cnpj text,inscricao_estadual text,endereco_codigo_municipio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT * FROM erp.fiscal_issuer_for_operations(input_tenant_id,'producao');
$$;

DO $$ DECLARE tabela text; BEGIN
  FOREACH tabela IN ARRAY ARRAY['notas_fiscais_tentativas','notas_fiscais_retornos','notas_fiscais_arquivos'] LOOP
    EXECUTE format('ALTER TABLE erp.%I ENABLE ROW LEVEL SECURITY',tabela);
    EXECUTE format('REVOKE ALL ON erp.%I FROM PUBLIC,anon,authenticated',tabela);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE ON erp.%I TO erp_runtime,service_role',tabela);
    EXECUTE format('GRANT USAGE,SELECT ON SEQUENCE erp.%I TO erp_runtime,service_role',tabela||'_id_seq');
    EXECUTE format('CREATE POLICY ler_fiscal ON erp.%I FOR SELECT TO erp_runtime USING (EXISTS (SELECT 1 FROM erp.notas_fiscais n WHERE n.empresa_id=%I.empresa_id AND n.id=%I.nota_fiscal_id) OR shared.can_read_erp_module(empresa_id,''configuracoes''))',tabela,tabela,tabela);
    EXECUTE format('CREATE POLICY inserir_fiscal ON erp.%I FOR INSERT TO erp_runtime WITH CHECK (shared.has_erp_capability(empresa_id,''erp.configuracoes.gerenciar''))',tabela);
    EXECUTE format('CREATE POLICY atualizar_fiscal ON erp.%I FOR UPDATE TO erp_runtime USING (shared.has_erp_capability(empresa_id,''erp.configuracoes.gerenciar'')) WITH CHECK (shared.has_erp_capability(empresa_id,''erp.configuracoes.gerenciar''))',tabela);
  END LOOP;
  FOREACH tabela IN ARRAY ARRAY['notas_fiscais_tentativas','notas_fiscais_retornos'] LOOP
    EXECUTE format('CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.%I FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()',tabela);
  END LOOP;
END $$;

-- Writes follow the commercial module, including totals that previously lacked write policies.
DO $$ DECLARE tabela text; politica record; expressao text; BEGIN
  FOREACH tabela IN ARRAY ARRAY['notas_fiscais','notas_fiscais_itens','notas_fiscais_totais'] LOOP
    FOR politica IN SELECT policyname FROM pg_policies WHERE schemaname='erp' AND tablename=tabela AND cmd IN ('ALL','INSERT','UPDATE','DELETE') LOOP
      EXECUTE format('DROP POLICY %I ON erp.%I',politica.policyname,tabela);
    END LOOP;
    IF tabela='notas_fiscais' THEN
      expressao:='shared.has_erp_capability(empresa_id,''erp.configuracoes.gerenciar'') OR (direcao=''saida'' AND shared.has_erp_capability(empresa_id,''erp.vendas.gerenciar'')) OR (direcao=''entrada'' AND shared.has_erp_capability(empresa_id,''erp.compras.gerenciar''))';
    ELSE
      expressao:=format('EXISTS(SELECT 1 FROM erp.notas_fiscais n WHERE n.empresa_id=%I.empresa_id AND n.id=%I.nota_fiscal_id AND (shared.has_erp_capability(n.empresa_id,''erp.configuracoes.gerenciar'') OR (n.direcao=''saida'' AND shared.has_erp_capability(n.empresa_id,''erp.vendas.gerenciar'')) OR (n.direcao=''entrada'' AND shared.has_erp_capability(n.empresa_id,''erp.compras.gerenciar''))))',tabela,tabela);
    END IF;
    EXECUTE format('CREATE POLICY inserir_documento_fiscal ON erp.%I FOR INSERT TO erp_runtime WITH CHECK(%s)',tabela,expressao);
    EXECUTE format('CREATE POLICY atualizar_documento_fiscal ON erp.%I FOR UPDATE TO erp_runtime USING(%s) WITH CHECK(%s)',tabela,expressao,expressao);
    EXECUTE format('CREATE POLICY excluir_rascunho_fiscal ON erp.%I FOR DELETE TO erp_runtime USING(%s)',tabela,expressao);
  END LOOP;
  SELECT policyname,qual INTO politica FROM pg_policies WHERE schemaname='erp' AND tablename='arquivos' AND cmd='SELECT';
  EXECUTE format('ALTER POLICY %I ON erp.arquivos USING ((%s) OR EXISTS (SELECT 1 FROM erp.notas_fiscais_arquivos l WHERE l.empresa_id=arquivos.empresa_id AND l.arquivo_id=arquivos.id))',politica.policyname,politica.qual);
END $$;

DROP POLICY inserir_fiscal ON erp.notas_fiscais_tentativas;
CREATE POLICY solicitar_operacao_fiscal ON erp.notas_fiscais_tentativas FOR INSERT TO erp_runtime WITH CHECK (
  EXISTS (SELECT 1 FROM erp.notas_fiscais n WHERE n.empresa_id=notas_fiscais_tentativas.empresa_id AND n.id=notas_fiscais_tentativas.nota_fiscal_id
    AND (shared.has_erp_capability(n.empresa_id,'erp.configuracoes.gerenciar')
      OR (n.direcao='saida' AND shared.has_erp_capability(n.empresa_id,'erp.vendas.gerenciar'))
      OR (n.direcao='entrada' AND shared.has_erp_capability(n.empresa_id,'erp.compras.gerenciar'))))
);

COMMENT ON TABLE erp.notas_fiscais_tentativas IS 'Tentativas duráveis por operação fiscal; aceitação HTTP não significa autorização. Sem worker ou provedor ativo.';
COMMENT ON TABLE erp.notas_fiscais_retornos IS 'Inbox de retornos deduplicados. Payload imutável; processamento separado da auditoria.';
COMMENT ON TABLE erp.notas_fiscais_arquivos IS 'Associação preservada aos arquivos originais e auxiliares da nota fiscal.';
COMMENT ON COLUMN erp.notas_fiscais_eventos.processado_em IS 'Auditoria imutável: informar no INSERT; estado operacional fica em notas_fiscais_retornos.';
COMMENT ON COLUMN erp.notas_fiscais_itens.tributos IS 'Detalhamento original/versionado dos tributos por item conforme leiaute/provedor; não calcula impostos.';
COMMENT ON COLUMN erp.notas_fiscais.integracao_snapshot IS 'Contrato e versão do leiaute/provedor usados no envio. Nunca incluir credenciais.';
COMMIT;

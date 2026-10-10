BEGIN;
-- Expand first: the running application may still insert/read legacy bytea PDFs.
ALTER TABLE erp.notas_fiscais_pdfs ADD COLUMN arquivo_id bigint;
ALTER TABLE erp.notas_fiscais_pdfs ALTER COLUMN conteudo DROP NOT NULL;
ALTER TABLE erp.notas_fiscais_pdfs ADD CONSTRAINT pdf_fiscal_arquivo_fk
  FOREIGN KEY(empresa_id,arquivo_id) REFERENCES erp.arquivos(empresa_id,id) ON DELETE RESTRICT;
ALTER TABLE erp.notas_fiscais_pdfs ADD CONSTRAINT pdf_fiscal_arquivo_unico UNIQUE(empresa_id,arquivo_id);
ALTER TABLE erp.notas_fiscais_pdfs ADD CONSTRAINT pdf_fiscal_origem CHECK(conteudo IS NOT NULL OR arquivo_id IS NOT NULL);
CREATE UNIQUE INDEX arquivos_fiscais_caminho_unico ON erp.arquivos(bucket,caminho) WHERE bucket='erp-fiscal';

CREATE FUNCTION erp.validar_pdf_armazenado() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  IF NEW.arquivo_id IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM erp.arquivos a JOIN erp.notas_fiscais_arquivos l ON l.empresa_id=a.empresa_id AND l.arquivo_id=a.id
    WHERE a.empresa_id=NEW.empresa_id AND a.id=NEW.arquivo_id AND l.nota_fiscal_id=NEW.nota_fiscal_id
      AND l.finalidade='documento_auxiliar' AND a.bucket='erp-fiscal' AND a.mime_type='application/pdf'
      AND a.hash_sha256=NEW.hash_sha256 AND a.nome=NEW.nome AND a.excluido_em IS NULL
      AND a.tamanho_bytes BETWEEN 100 AND 2097152
      AND a.caminho=NEW.empresa_id||'/notas/'||NEW.nota_fiscal_id||'/v'||NEW.versao||'/layout-'||NEW.layout_versao||'/'||NEW.hash_sha256||'.pdf'
  ) THEN RAISE EXCEPTION 'Metadados do PDF fiscal incompatíveis com a nota' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validar_pdf_armazenado BEFORE INSERT OR UPDATE ON erp.notas_fiscais_pdfs FOR EACH ROW EXECUTE FUNCTION erp.validar_pdf_armazenado();
REVOKE ALL ON FUNCTION erp.validar_pdf_armazenado() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION erp.registrar_pdf_armazenado(p_empresa bigint,p_nota bigint,p_versao integer,p_layout integer,p_caminho text,p_nome text,p_tamanho bigint,p_hash text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE n erp.notas_fiscais; a erp.arquivos; pdf_id bigint; actor bigint;
BEGIN
  actor:=shared.current_user_id();
  IF p_empresa IS DISTINCT FROM shared.erp_empresa_contexto() OR actor IS NULL THEN
    RAISE EXCEPTION 'Contexto fiscal inválido' USING ERRCODE='42501'; END IF;
  SELECT * INTO n FROM erp.notas_fiscais WHERE empresa_id=p_empresa AND id=p_nota AND excluido_em IS NULL FOR UPDATE;
  IF n.id IS NULL OR n.tipo<>'nfse' OR n.modo_operacao<>'simulacao' OR n.direcao<>'saida'
    OR NOT shared.has_erp_capability(p_empresa,'erp.vendas.gerenciar') THEN
    RAISE EXCEPTION 'Sem permissão para registrar este PDF fiscal' USING ERRCODE='42501'; END IF;
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
END $$;
REVOKE ALL ON FUNCTION erp.registrar_pdf_armazenado(bigint,bigint,integer,integer,text,text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION erp.registrar_pdf_armazenado(bigint,bigint,integer,integer,text,text,bigint,text) TO erp_runtime;
COMMENT ON COLUMN erp.notas_fiscais_pdfs.arquivo_id IS 'Arquivo PDF privado, com tamanho e SHA-256 em erp.arquivos; versão fiscal e layout permanecem nesta tabela.';
COMMIT;

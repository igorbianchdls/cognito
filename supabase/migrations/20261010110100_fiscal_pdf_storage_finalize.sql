BEGIN;
-- Apply only after byte-for-byte verification and deployment of compatible readers/writers.
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM erp.notas_fiscais_pdfs WHERE arquivo_id IS NULL) THEN
    RAISE EXCEPTION 'Há PDFs ainda não migrados para o Storage'; END IF;
END $$;
ALTER TABLE erp.notas_fiscais_pdfs ALTER COLUMN arquivo_id SET NOT NULL;
ALTER TABLE erp.notas_fiscais_pdfs DROP CONSTRAINT pdf_fiscal_origem;
ALTER TABLE erp.notas_fiscais_pdfs DROP COLUMN conteudo;
COMMENT ON TABLE erp.notas_fiscais_pdfs IS 'Metadados e versões dos PDFs fiscais. Conteúdo binário armazenado no bucket privado erp-fiscal, sem sobrescrita de versões.';
COMMIT;

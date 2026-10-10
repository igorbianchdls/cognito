BEGIN;
-- Executar depois da publicação: libera novas apresentações sem alterar PDFs antigos.
DO $$
DECLARE unique_name text;
BEGIN
 SELECT c.conname INTO STRICT unique_name FROM pg_constraint c
 WHERE c.conrelid='erp.notas_fiscais_pdfs'::regclass AND c.contype='u'
 AND (SELECT array_agg(a.attname::text ORDER BY a.attname) FROM unnest(c.conkey) k
 JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k)=ARRAY['empresa_id','nota_fiscal_id','versao'];
 EXECUTE format('ALTER TABLE erp.notas_fiscais_pdfs DROP CONSTRAINT %I',unique_name);
END $$;
COMMIT;

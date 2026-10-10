BEGIN;
ALTER TABLE erp.notas_fiscais_pdfs ADD COLUMN layout_versao integer NOT NULL DEFAULT 1 CHECK(layout_versao>0);
-- A unicidade antiga permanece até a aplicação nova estar publicada.
ALTER TABLE erp.notas_fiscais_pdfs ADD CONSTRAINT notas_fiscais_pdfs_versao_layout_key UNIQUE(empresa_id,nota_fiscal_id,versao,layout_versao);
COMMENT ON COLUMN erp.notas_fiscais_pdfs.layout_versao IS 'Versão da apresentação do PDF, independente da versão fiscal. 1: legado; 2: DANFSe demonstrativo em quadros com QR autenticado.';
COMMIT;

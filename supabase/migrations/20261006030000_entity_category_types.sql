BEGIN;

ALTER TABLE erp.categorias DROP CONSTRAINT categorias_tipo_chk;
ALTER TABLE erp.categorias ADD CONSTRAINT categorias_tipo_chk
  CHECK (tipo IN ('receita','despesa','produto','servico','geral','cliente','fornecedor'));

COMMIT;

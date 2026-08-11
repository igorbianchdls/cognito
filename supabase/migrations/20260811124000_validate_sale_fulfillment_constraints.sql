BEGIN;

ALTER TABLE erp.vendas VALIDATE CONSTRAINT vendas_status_chk;
ALTER TABLE erp.vendas VALIDATE CONSTRAINT vendas_atendimento_status_chk;
ALTER TABLE erp.vendas VALIDATE CONSTRAINT vendas_fiscal_status_chk;
ALTER TABLE erp.vendas_itens VALIDATE CONSTRAINT vendas_itens_quantidade_atendida_chk;

COMMIT;

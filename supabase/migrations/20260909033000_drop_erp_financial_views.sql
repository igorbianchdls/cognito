BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DROP VIEW IF EXISTS erp.vw_aging_receber RESTRICT;
DROP VIEW IF EXISTS erp.vw_aging_pagar RESTRICT;
DROP VIEW IF EXISTS erp.vw_dre_gerencial RESTRICT;
DROP VIEW IF EXISTS erp.vw_fluxo_caixa_diario RESTRICT;
COMMIT;

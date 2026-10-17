BEGIN;
SET LOCAL lock_timeout='10s';
-- Open tables ask every few seconds whether anything changed: the latest change of a table must be cheap.
CREATE INDEX registros_alteracao ON tables.registros(empresa_id,tabela_id,atualizado_em DESC);
COMMIT;

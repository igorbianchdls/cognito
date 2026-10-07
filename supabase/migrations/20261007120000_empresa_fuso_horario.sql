BEGIN;

-- Fuso da empresa: define o "hoje" do ERP (datas padrão de vendas, compras, pagamentos,
-- estoque, recorrências e dashboards). Padrão America/Sao_Paulo, decidido em 07/10/2026.
-- A aplicação valida o nome contra a base IANA; o banco só garante o formato.
ALTER TABLE shared.empresas ADD COLUMN fuso_horario text NOT NULL DEFAULT 'America/Sao_Paulo';
ALTER TABLE shared.empresas ADD CONSTRAINT empresas_fuso_horario_chk
  CHECK (fuso_horario ~ '^[A-Za-z][A-Za-z0-9_+/-]{1,63}$');
COMMENT ON COLUMN shared.empresas.fuso_horario IS 'Fuso IANA da empresa para a data comercial do ERP.';

COMMIT;

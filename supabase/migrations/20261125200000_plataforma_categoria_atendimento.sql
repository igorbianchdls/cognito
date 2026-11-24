-- Nova categoria de empresa: atendimento (Atendimento e CRM).
BEGIN;

ALTER TABLE shared.empresas DROP CONSTRAINT empresas_categoria_valida;
ALTER TABLE shared.empresas ADD CONSTRAINT empresas_categoria_valida CHECK (categoria IN ('marketing', 'gestao', 'atendimento', 'completo'));
COMMENT ON COLUMN shared.empresas.categoria IS 'Foco da empresa no Otto (marketing, gestao, atendimento ou completo); organiza o menu. Alterada por owner/admin em Configurações.';

COMMIT;

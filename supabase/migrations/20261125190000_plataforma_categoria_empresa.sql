-- Categoria da empresa: diz o foco do Otto para ela e organiza o menu (marketing, gestão ou completo).
-- Por enquanto é só foco (não bloqueia nada); quando houver cobrança, a assinatura passa a definir o que é liberado.
-- Todas as empresas começam como "completo", para nada sumir do menu.
BEGIN;

ALTER TABLE shared.empresas
  ADD COLUMN categoria text NOT NULL DEFAULT 'completo'
  CONSTRAINT empresas_categoria_valida CHECK (categoria IN ('marketing', 'gestao', 'completo'));

COMMENT ON COLUMN shared.empresas.categoria IS 'Foco da empresa no Otto (marketing, gestao ou completo); organiza o menu. Alterada por owner/admin em Configurações.';

COMMIT;

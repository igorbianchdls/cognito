BEGIN;

-- Views legadas baseadas em financeiro.lancamentos_financeiros
DROP VIEW IF EXISTS financeiro.vw_orcado_vs_real;
DROP VIEW IF EXISTS financeiro.vw_transacoes_simples;

-- Remover FK de contabilidade para o financeiro legado (mantemos a coluna por compatibilidade temporaria)
ALTER TABLE IF EXISTS contabilidade.lancamentos_contabeis
  DROP CONSTRAINT IF EXISTS lc_fin_fk;

-- Trigger legado que gerava contabil automaticamente via tabela descontinuada
DROP TRIGGER IF EXISTS trg_gerar_lancamento_contabil
  ON financeiro.lancamentos_financeiros;

-- Auto-referencia legado
ALTER TABLE IF EXISTS financeiro.lancamentos_financeiros
  DROP CONSTRAINT IF EXISTS lanc_fin_origem_fk;

-- Tabelas legadas
DROP TABLE IF EXISTS financeiro.lancamentos_financeiros_itens;
DROP TABLE IF EXISTS financeiro.lancamentos_financeiros_linhas;
DROP TABLE IF EXISTS financeiro.lancamentos_financeiros;

COMMIT;

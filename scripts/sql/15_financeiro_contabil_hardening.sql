BEGIN;

-- 1) Backfill de categorias de despesa -> plano de contas (mapeamento por codigo da categoria)
WITH plano AS (
  SELECT codigo, id
  FROM contabilidade.plano_contas
),
map_desp AS (
  SELECT
    cd.id AS categoria_id,
    CASE cd.codigo
      WHEN 'DESP-MKT' THEN (SELECT id FROM plano WHERE codigo = '6.2.1' LIMIT 1) -- Publicidade e Marketing
      WHEN 'DESP-LOG' THEN (SELECT id FROM plano WHERE codigo = '6.2.3' LIMIT 1) -- Fretes sobre Vendas
      WHEN 'DESP-TI' THEN (SELECT id FROM plano WHERE codigo = '6.1.3' LIMIT 1) -- Servicos Terceirizados
      WHEN 'DESP-RH' THEN (SELECT id FROM plano WHERE codigo = '6.1.5' LIMIT 1) -- Salarios Administrativos
      WHEN 'DESP-ADM' THEN (SELECT id FROM plano WHERE codigo = '6.1.3' LIMIT 1)
      WHEN 'DESP-JUR' THEN (SELECT id FROM plano WHERE codigo = '6.1.3' LIMIT 1)
      WHEN 'DESP-CONT' THEN (SELECT id FROM plano WHERE codigo = '6.1.3' LIMIT 1)
      WHEN 'DESP-BANC' THEN (SELECT id FROM plano WHERE codigo = '6.3.2' LIMIT 1) -- Tarifas Bancarias
      WHEN 'DESP-JUROS' THEN (SELECT id FROM plano WHERE codigo = '6.3.3' LIMIT 1) -- Multas e Encargos
      WHEN 'DESP-MAN' THEN (SELECT id FROM plano WHERE codigo = '6.1.3' LIMIT 1)
      WHEN 'DESP-COMIS' THEN (SELECT id FROM plano WHERE codigo = '5.2.3' LIMIT 1) -- Comissoes sobre Vendas
      ELSE NULL
    END AS plano_conta_id
  FROM financeiro.categorias_despesa cd
)
UPDATE financeiro.categorias_despesa cd
SET plano_conta_id = COALESCE(
  md.plano_conta_id,
  (SELECT id FROM contabilidade.plano_contas WHERE codigo = '6.1.3' LIMIT 1)
)
FROM map_desp md
WHERE cd.id = md.categoria_id
  AND cd.plano_conta_id IS NULL;

-- 2) Backfill de categorias de receita -> plano de contas (servicos)
UPDATE financeiro.categorias_receita cr
SET plano_conta_id = COALESCE(
  cr.plano_conta_id,
  (SELECT id FROM contabilidade.plano_contas WHERE codigo = '4.1.3' LIMIT 1)
)
WHERE cr.plano_conta_id IS NULL;

-- 3) Backfill de contas financeiras -> conta contabil
WITH map_cf AS (
  SELECT
    cf.id,
    CASE cf.id
      WHEN 1 THEN (SELECT id FROM contabilidade.plano_contas WHERE codigo = '1.1.1.02' LIMIT 1) -- Banco Itau
      WHEN 2 THEN (SELECT id FROM contabilidade.plano_contas WHERE codigo = '1.1.1.03' LIMIT 1) -- Banco Bradesco
      WHEN 3 THEN (SELECT id FROM contabilidade.plano_contas WHERE codigo = '1.1.1.02' LIMIT 1) -- Banco Itau
      ELSE (SELECT id FROM contabilidade.plano_contas WHERE codigo = '1.1.1.02' LIMIT 1)
    END AS conta_contabil_id
  FROM financeiro.contas_financeiras cf
)
UPDATE financeiro.contas_financeiras cf
SET conta_contabil_id = mc.conta_contabil_id
FROM map_cf mc
WHERE cf.id = mc.id
  AND cf.conta_contabil_id IS NULL;

-- 4) Guard-rails: nao permite seguir com nulos nas colunas obrigatorias
DO $$
DECLARE
  v_desp_null int;
  v_rec_null int;
  v_contas_null int;
BEGIN
  SELECT COUNT(*) INTO v_desp_null FROM financeiro.categorias_despesa WHERE plano_conta_id IS NULL;
  SELECT COUNT(*) INTO v_rec_null FROM financeiro.categorias_receita WHERE plano_conta_id IS NULL;
  SELECT COUNT(*) INTO v_contas_null FROM financeiro.contas_financeiras WHERE conta_contabil_id IS NULL;

  IF v_desp_null > 0 OR v_rec_null > 0 OR v_contas_null > 0 THEN
    RAISE EXCEPTION 'Backfill incompleto: despesa_null=%, receita_null=%, conta_financeira_null=%',
      v_desp_null, v_rec_null, v_contas_null;
  END IF;
END $$;

-- 5) FKs (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categorias_despesa_plano_conta_fk'
      AND conrelid = 'financeiro.categorias_despesa'::regclass
  ) THEN
    ALTER TABLE financeiro.categorias_despesa
      ADD CONSTRAINT categorias_despesa_plano_conta_fk
      FOREIGN KEY (plano_conta_id)
      REFERENCES contabilidade.plano_contas(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'categorias_receita_plano_conta_fk'
      AND conrelid = 'financeiro.categorias_receita'::regclass
  ) THEN
    ALTER TABLE financeiro.categorias_receita
      ADD CONSTRAINT categorias_receita_plano_conta_fk
      FOREIGN KEY (plano_conta_id)
      REFERENCES contabilidade.plano_contas(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contas_financeiras_conta_contabil_fk'
      AND conrelid = 'financeiro.contas_financeiras'::regclass
  ) THEN
    ALTER TABLE financeiro.contas_financeiras
      ADD CONSTRAINT contas_financeiras_conta_contabil_fk
      FOREIGN KEY (conta_contabil_id)
      REFERENCES contabilidade.plano_contas(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END $$;

-- 6) NOT NULL nas colunas obrigatorias
ALTER TABLE financeiro.categorias_despesa
  ALTER COLUMN plano_conta_id SET NOT NULL;

ALTER TABLE financeiro.categorias_receita
  ALTER COLUMN plano_conta_id SET NOT NULL;

ALTER TABLE financeiro.contas_financeiras
  ALTER COLUMN conta_contabil_id SET NOT NULL;

-- 7) Backfill de vinculos contabeis nas tabelas financeiras (quando houver LC por origem)
UPDATE financeiro.contas_pagar cp
SET lancamento_contabil_id = lc.id
FROM contabilidade.lancamentos_contabeis lc
WHERE cp.lancamento_contabil_id IS NULL
  AND lc.tenant_id = cp.tenant_id
  AND lc.origem_tabela = 'financeiro.contas_pagar'
  AND lc.origem_id = cp.id;

UPDATE financeiro.contas_receber cr
SET lancamento_contabil_id = lc.id
FROM contabilidade.lancamentos_contabeis lc
WHERE cr.lancamento_contabil_id IS NULL
  AND lc.tenant_id = cr.tenant_id
  AND lc.origem_tabela = 'financeiro.contas_receber'
  AND lc.origem_id = cr.id;

UPDATE financeiro.pagamentos_efetuados pe
SET lancamento_contabil_id = lc.id
FROM contabilidade.lancamentos_contabeis lc
WHERE pe.lancamento_contabil_id IS NULL
  AND lc.tenant_id = pe.tenant_id
  AND lc.origem_tabela = 'financeiro.pagamentos_efetuados'
  AND lc.origem_id = pe.id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'financeiro'
      AND table_name = 'pagamentos_recebidos'
      AND column_name = 'lancamento_contabil_id'
  ) THEN
    EXECUTE $sql$
      UPDATE financeiro.pagamentos_recebidos pr
      SET lancamento_contabil_id = lc.id
      FROM contabilidade.lancamentos_contabeis lc
      WHERE pr.lancamento_contabil_id IS NULL
        AND lc.tenant_id = pr.tenant_id
        AND lc.origem_tabela = 'financeiro.pagamentos_recebidos'
        AND lc.origem_id = pr.id
    $sql$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'financeiro'
      AND table_name = 'liquidacoes'
      AND column_name = 'lancamento_contabil_id'
  ) THEN
    EXECUTE $sql$
      UPDATE financeiro.liquidacoes lq
      SET lancamento_contabil_id = lc.id
      FROM contabilidade.lancamentos_contabeis lc
      WHERE lq.lancamento_contabil_id IS NULL
        AND lc.tenant_id = lq.tenant_id
        AND lc.origem_tabela = 'financeiro.liquidacoes'
        AND lc.origem_id = lq.id
    $sql$;
  END IF;
END $$;

-- 8) Nao permitir duplicidade por origem no livro contabil
DO $$
DECLARE
  v_dups int;
BEGIN
  SELECT COUNT(*)
  INTO v_dups
  FROM (
    SELECT tenant_id, origem_tabela, origem_id
    FROM contabilidade.lancamentos_contabeis
    WHERE origem_tabela IS NOT NULL
      AND origem_id IS NOT NULL
    GROUP BY tenant_id, origem_tabela, origem_id
    HAVING COUNT(*) > 1
  ) d;

  IF v_dups > 0 THEN
    RAISE EXCEPTION 'Existem % origens duplicadas em contabilidade.lancamentos_contabeis. Corrija antes de criar indice unico.', v_dups;
  END IF;
END $$;

COMMIT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_lancamentos_contabeis_origem
  ON contabilidade.lancamentos_contabeis (tenant_id, origem_tabela, origem_id)
  WHERE origem_tabela IS NOT NULL
    AND origem_id IS NOT NULL;

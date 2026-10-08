BEGIN;

-- Simulação de NFS-e o mais próxima possível da emissão real (padrão NFS-e Nacional):
-- 1. serviço com o código de tributação nacional (item da LC 116, 6 dígitos) e o NBS;
-- 2. configuração fiscal com a série do DPS e a alíquota de ISS padrão;
-- 3. retenção de impostos (ISS e federais) baixada no contas a receber da venda, sem entrada de dinheiro.

ALTER TABLE erp.servicos
  ADD COLUMN codigo_tributacao_nacional text CHECK (codigo_tributacao_nacional IS NULL OR codigo_tributacao_nacional ~ '^\d{6}$'),
  ADD COLUMN codigo_nbs text CHECK (codigo_nbs IS NULL OR codigo_nbs ~ '^\d{9}$');
COMMENT ON COLUMN erp.servicos.codigo_tributacao_nacional IS 'cTribNac da NFS-e Nacional: item/subitem da LC 116 + desdobro (6 dígitos, ex.: 010701).';
COMMENT ON COLUMN erp.servicos.codigo_nbs IS 'Código NBS do serviço (9 dígitos), exigido em parte dos municípios.';

ALTER TABLE erp.configuracoes_fiscais
  ADD COLUMN serie_dps text NOT NULL DEFAULT '1' CHECK (serie_dps ~ '^\d{1,5}$'),
  ADD COLUMN aliquota_iss_padrao numeric(7,4) CHECK (aliquota_iss_padrao IS NULL OR aliquota_iss_padrao BETWEEN 0 AND 100);

-- Baixa de retenção: o tomador retém o imposto e paga o líquido; o título é abatido sem dinheiro.
ALTER TABLE erp.pagamentos ADD COLUMN nota_fiscal_id bigint;
ALTER TABLE erp.pagamentos ADD CONSTRAINT pagamentos_nota_fiscal_fk FOREIGN KEY (empresa_id, nota_fiscal_id) REFERENCES erp.notas_fiscais(empresa_id, id) ON DELETE RESTRICT;
CREATE INDEX pagamentos_nota_fiscal_idx ON erp.pagamentos (empresa_id, nota_fiscal_id) WHERE nota_fiscal_id IS NOT NULL;
ALTER TABLE erp.pagamentos DROP CONSTRAINT IF EXISTS pagamentos_origem_check;
ALTER TABLE erp.pagamentos ADD CONSTRAINT pagamentos_origem_check
  CHECK (origem IN ('manual','conciliacao','boleto','pix','cartao','api','estorno','devolucao','credito_cliente','retencao'));
ALTER TABLE erp.pagamentos ADD CONSTRAINT pagamentos_retencao_sem_dinheiro_chk
  CHECK (origem <> 'retencao' OR (nota_fiscal_id IS NOT NULL AND tipo = 'receber' AND desconto = valor AND juros = 0 AND multa = 0 AND taxa = 0)
    OR estorno_de_pagamento_id IS NOT NULL);

COMMIT;

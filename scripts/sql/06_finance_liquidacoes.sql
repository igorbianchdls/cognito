CREATE TABLE IF NOT EXISTS financeiro.liquidacoes (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL,
  tipo character varying NOT NULL,
  conta_pagar_id bigint,
  conta_receber_id bigint,
  data_liquidacao date NOT NULL,
  data_lancamento date NOT NULL DEFAULT CURRENT_DATE,
  conta_financeira_id bigint,
  metodo_pagamento_id bigint,
  moeda character(3) NOT NULL DEFAULT 'BRL',
  valor_movimento numeric(18,2) NOT NULL,
  desconto_financeiro numeric(18,2) NOT NULL DEFAULT 0,
  juros numeric(18,2) NOT NULL DEFAULT 0,
  multa numeric(18,2) NOT NULL DEFAULT 0,
  saldo_apos_liquidacao numeric(18,2),
  status character varying NOT NULL DEFAULT 'confirmado',
  observacao text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  criado_por bigint,
  lancamento_contabil_id bigint,
  estorno_de_liquidacao_id bigint,

  CONSTRAINT liquidacoes_tipo_chk
    CHECK (tipo::text = ANY (ARRAY['pagar', 'receber']::text[])),
  CONSTRAINT liquidacoes_status_chk
    CHECK (status::text = ANY (ARRAY['confirmado', 'estornado', 'cancelado']::text[])),
  CONSTRAINT liquidacoes_valores_chk
    CHECK (
      valor_movimento >= 0
      AND desconto_financeiro >= 0
      AND juros >= 0
      AND multa >= 0
      AND (saldo_apos_liquidacao IS NULL OR saldo_apos_liquidacao >= 0)
    ),
  CONSTRAINT liquidacoes_conta_chk
    CHECK (
      (tipo = 'pagar' AND conta_pagar_id IS NOT NULL AND conta_receber_id IS NULL)
      OR
      (tipo = 'receber' AND conta_receber_id IS NOT NULL AND conta_pagar_id IS NULL)
    ),
  CONSTRAINT liquidacoes_conta_pagar_fk
    FOREIGN KEY (conta_pagar_id)
    REFERENCES financeiro.contas_pagar(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT liquidacoes_conta_receber_fk
    FOREIGN KEY (conta_receber_id)
    REFERENCES financeiro.contas_receber(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT liquidacoes_conta_financeira_fk
    FOREIGN KEY (conta_financeira_id)
    REFERENCES financeiro.contas_financeiras(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT liquidacoes_metodo_pagamento_fk
    FOREIGN KEY (metodo_pagamento_id)
    REFERENCES financeiro.metodos_pagamento(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT liquidacoes_lancamento_contabil_fk
    FOREIGN KEY (lancamento_contabil_id)
    REFERENCES contabilidade.lancamentos_contabeis(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT liquidacoes_estorno_fk
    FOREIGN KEY (estorno_de_liquidacao_id)
    REFERENCES financeiro.liquidacoes(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS liquidacoes_tenant_idx
  ON financeiro.liquidacoes (tenant_id);

CREATE INDEX IF NOT EXISTS liquidacoes_tipo_idx
  ON financeiro.liquidacoes (tipo);

CREATE INDEX IF NOT EXISTS liquidacoes_status_idx
  ON financeiro.liquidacoes (status);

CREATE INDEX IF NOT EXISTS liquidacoes_data_idx
  ON financeiro.liquidacoes (data_liquidacao);

CREATE INDEX IF NOT EXISTS liquidacoes_conta_pagar_idx
  ON financeiro.liquidacoes (conta_pagar_id);

CREATE INDEX IF NOT EXISTS liquidacoes_conta_receber_idx
  ON financeiro.liquidacoes (conta_receber_id);

CREATE INDEX IF NOT EXISTS liquidacoes_conta_financeira_idx
  ON financeiro.liquidacoes (conta_financeira_id);

CREATE INDEX IF NOT EXISTS liquidacoes_metodo_pagamento_idx
  ON financeiro.liquidacoes (metodo_pagamento_id);

CREATE INDEX IF NOT EXISTS liquidacoes_estorno_idx
  ON financeiro.liquidacoes (estorno_de_liquidacao_id);

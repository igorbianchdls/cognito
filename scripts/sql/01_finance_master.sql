-- Finance master data for tenant 1

INSERT INTO financeiro.bancos (tenant_id, nome_banco, numero_banco, agencia, criado_em, atualizado_em)
SELECT 1, 'Itaú Unibanco', '341', '4321', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.bancos WHERE tenant_id = 1 AND lower(nome_banco) = lower('Itaú Unibanco')
);

INSERT INTO financeiro.bancos (tenant_id, nome_banco, numero_banco, agencia, criado_em, atualizado_em)
SELECT 1, 'Banco do Brasil', '001', '1204', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.bancos WHERE tenant_id = 1 AND lower(nome_banco) = lower('Banco do Brasil')
);

INSERT INTO financeiro.bancos (tenant_id, nome_banco, numero_banco, agencia, criado_em, atualizado_em)
SELECT 1, 'Sicoob', '756', '3019', now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.bancos WHERE tenant_id = 1 AND lower(nome_banco) = lower('Sicoob')
);

INSERT INTO financeiro.contas_financeiras
  (tenant_id, banco_id, nome_conta, tipo_conta, agencia, numero_conta, pix_chave, saldo_inicial, saldo_atual, data_abertura, ativo, criado_em, atualizado_em)
SELECT 1,
       (SELECT id FROM financeiro.bancos WHERE tenant_id = 1 AND lower(nome_banco) = lower('Itaú Unibanco') ORDER BY id LIMIT 1),
       'Conta Corrente Operacional',
       'corrente',
       '4321',
       '112233-4',
       'financeiro@aurorasemijoias.com.br',
       185000,
       212480,
       '2024-01-10',
       true,
       now(),
       now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.contas_financeiras WHERE tenant_id = 1 AND lower(nome_conta) = lower('Conta Corrente Operacional')
);

INSERT INTO financeiro.contas_financeiras
  (tenant_id, banco_id, nome_conta, tipo_conta, agencia, numero_conta, pix_chave, saldo_inicial, saldo_atual, data_abertura, ativo, criado_em, atualizado_em)
SELECT 1,
       (SELECT id FROM financeiro.bancos WHERE tenant_id = 1 AND lower(nome_banco) = lower('Banco do Brasil') ORDER BY id LIMIT 1),
       'Conta Recebimentos PIX',
       'corrente',
       '1204',
       '889977-1',
       'pix@aurorasemijoias.com.br',
       85000,
       96870,
       '2024-04-03',
       true,
       now(),
       now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.contas_financeiras WHERE tenant_id = 1 AND lower(nome_conta) = lower('Conta Recebimentos PIX')
);

INSERT INTO financeiro.contas_financeiras
  (tenant_id, banco_id, nome_conta, tipo_conta, agencia, numero_conta, pix_chave, saldo_inicial, saldo_atual, data_abertura, ativo, criado_em, atualizado_em)
SELECT 1,
       (SELECT id FROM financeiro.bancos WHERE tenant_id = 1 AND lower(nome_banco) = lower('Sicoob') ORDER BY id LIMIT 1),
       'Conta Pagamentos Fornecedores',
       'corrente',
       '3019',
       '556611-9',
       'pagamentos@aurorasemijoias.com.br',
       62000,
       54890,
       '2024-07-15',
       true,
       now(),
       now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.contas_financeiras WHERE tenant_id = 1 AND lower(nome_conta) = lower('Conta Pagamentos Fornecedores')
);

UPDATE financeiro.contas_financeiras
SET banco_id = (SELECT id FROM financeiro.bancos WHERE tenant_id = 1 AND lower(nome_banco) = lower('Itaú Unibanco') ORDER BY id LIMIT 1),
    tipo_conta = 'corrente',
    agencia = '4321',
    numero_conta = '112233-4',
    pix_chave = 'financeiro@aurorasemijoias.com.br',
    saldo_inicial = 185000,
    saldo_atual = 212480,
    data_abertura = '2024-01-10',
    ativo = true,
    atualizado_em = now()
WHERE tenant_id = 1 AND lower(nome_conta) = lower('Conta Corrente Operacional');

UPDATE financeiro.contas_financeiras
SET banco_id = (SELECT id FROM financeiro.bancos WHERE tenant_id = 1 AND lower(nome_banco) = lower('Banco do Brasil') ORDER BY id LIMIT 1),
    tipo_conta = 'corrente',
    agencia = '1204',
    numero_conta = '889977-1',
    pix_chave = 'pix@aurorasemijoias.com.br',
    saldo_inicial = 85000,
    saldo_atual = 96870,
    data_abertura = '2024-04-03',
    ativo = true,
    atualizado_em = now()
WHERE tenant_id = 1 AND lower(nome_conta) = lower('Conta Recebimentos PIX');

UPDATE financeiro.contas_financeiras
SET banco_id = (SELECT id FROM financeiro.bancos WHERE tenant_id = 1 AND lower(nome_banco) = lower('Sicoob') ORDER BY id LIMIT 1),
    tipo_conta = 'corrente',
    agencia = '3019',
    numero_conta = '556611-9',
    pix_chave = 'pagamentos@aurorasemijoias.com.br',
    saldo_inicial = 62000,
    saldo_atual = 54890,
    data_abertura = '2024-07-15',
    ativo = true,
    atualizado_em = now()
WHERE tenant_id = 1 AND lower(nome_conta) = lower('Conta Pagamentos Fornecedores');

INSERT INTO financeiro.metodos_pagamento (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
SELECT 1, 'PIX', 'Transferência instantânea', true, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.metodos_pagamento WHERE tenant_id = 1 AND lower(nome) = lower('PIX')
);

INSERT INTO financeiro.metodos_pagamento (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
SELECT 1, 'Boleto', 'Cobrança por boleto bancário', true, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.metodos_pagamento WHERE tenant_id = 1 AND lower(nome) = lower('Boleto')
);

INSERT INTO financeiro.metodos_pagamento (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
SELECT 1, 'TED', 'Transferência bancária TED', true, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.metodos_pagamento WHERE tenant_id = 1 AND lower(nome) = lower('TED')
);

INSERT INTO financeiro.metodos_pagamento (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
SELECT 1, 'Cartão Corporativo', 'Despesa em cartão empresarial', true, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.metodos_pagamento WHERE tenant_id = 1 AND lower(nome) = lower('Cartão Corporativo')
);

INSERT INTO financeiro.metodos_pagamento (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
SELECT 1, 'Transferência Interna', 'Movimentação interna entre contas', true, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM financeiro.metodos_pagamento WHERE tenant_id = 1 AND lower(nome) = lower('Transferência Interna')
);

UPDATE financeiro.metodos_pagamento
SET ativo = true,
    atualizado_em = now(),
    descricao = CASE
      WHEN lower(nome) = lower('PIX') THEN 'Transferência instantânea'
      WHEN lower(nome) = lower('Boleto') THEN 'Cobrança por boleto bancário'
      WHEN lower(nome) = lower('TED') THEN 'Transferência bancária TED'
      WHEN lower(nome) = lower('Cartão Corporativo') THEN 'Despesa em cartão empresarial'
      WHEN lower(nome) = lower('Transferência Interna') THEN 'Movimentação interna entre contas'
      ELSE descricao
    END
WHERE tenant_id = 1
  AND lower(nome) IN (
    lower('PIX'),
    lower('Boleto'),
    lower('TED'),
    lower('Cartão Corporativo'),
    lower('Transferência Interna')
  );

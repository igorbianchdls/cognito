# Avaliação do schema `erp` (Supabase real) — 07/10/2026

> Atualizada no mesmo dia por [plano-erp-nivel-mercado-20261007.md](plano-erp-nivel-mercado-20261007.md), com análise de desempenho, automações, DRE e comparativo completo.

Leitura feita **somente leitura** no banco de produção (Postgres 17.6): estrutura completa (87 tabelas, 1.582 colunas, 987 restrições, 258 índices, 245 triggers, 303 políticas, 70 funções) e checagens de integridade por contagem, sem ler dados pessoais. Referência de mercado: Conta Azul e Omie.

## Veredito

A base é de **ERP profissional**: modelagem multiempresa correta, integridade forte e trilha de auditoria. Os dados atuais passaram em todas as checagens de consistência. O que separa do Conta Azul/Omie hoje são **módulos ainda inexistentes** (comissões, tabela de preços, cartão de crédito, integração contábil, lote/série etc.) e alguns **ajustes de desenho** listados abaixo — nenhum deles é um defeito que corrompe dados.

## O que está no nível de um ERP profissional

| Área | Como está |
| --- | --- |
| Multiempresa | Todas as tabelas com `empresa_id`, chaves compostas `(empresa_id, id)` em todas as FKs (impossível ligar registro de outra empresa), RLS em 100% das tabelas, índice por empresa em todas |
| Auditoria e concorrência | `criado_por/atualizado_por`, exclusão lógica (`excluido_em`), `versao` para trava otimista, tabelas de eventos por domínio (vendas, compras, contas, contratos, OS, cadastros) |
| Idempotência | `chave_idempotencia` única por empresa em vendas, compras, títulos, pagamentos, transferências, estoque, adiantamentos e renegociações |
| Comercial | Orçamento → venda (`venda_origem_id`), recebimentos previstos, atendimento parcial, snapshot do cliente, contratos recorrentes com versões, reajuste e gerações, ordens de serviço |
| Compras | Cotação/pedido/compra, naturezas de operação, parcelas previstas, recorrência, origem XML, código do produto no fornecedor com fator de conversão, recebimento parcial |
| Financeiro | Títulos com parcelas, juros/multa/desconto/taxa, estorno vinculado, transferências, rateio por categoria e centro de custo, adiantamentos, renegociações, recorrências, competência × caixa, fechamento de período por módulo, plano de categorias hierárquico com marcação de DRE |
| Banco | Importação OFX/CSV, transações, conciliação com regras e tolerância (estrutura pronta, ainda sem uso) |
| Estoque | Livro-razão imutável (`movimentacoes_estoque` não aceita alteração), custo médio, saldo por local, reservas, inventário, transferências, devolução de cliente/fornecedor, kits, conversão de unidades, mínimo/máximo/ponto de reposição |
| Fiscal e cobrança | Notas com itens, totais, eventos, tentativas duráveis, retornos deduplicados e PDFs; cobranças (boleto/Pix) com eventos e lembretes — prontos para a fase futura |

## Checagens de integridade (dados reais)

| Checagem | Resultado |
| --- | --- |
| Soma das parcelas = valor do título (496 títulos) | ✅ 0 divergências |
| Valor pago da parcela = pagamentos não estornados (828 parcelas) | ✅ 0 |
| Status da parcela coerente com o valor pago | ✅ 0 |
| Total e subtotal da venda = itens − desconto + frete (314 vendas) | ✅ 0 |
| Venda confirmada sem conta a receber / compra confirmada sem conta a pagar | ✅ 0 / 0 |
| Saldo de estoque = soma do livro-razão; reservado = reservas ativas | ✅ 0 / 0 |
| Estoque negativo | ✅ 0 (2 produtos abaixo do mínimo) |
| Títulos sem categoria ou sem competência | ✅ 0 |
| Cadastro: contato/endereço antigo divergente das tabelas novas; CPF/CNPJ com tamanho inválido | ✅ 0 / 0 |

## Ajustes de desenho recomendados

| # | Problema | Impacto | Correção |
| --- | --- | --- | --- |
| 1 | **Status `vencido` gravado** pela automação `titulos_vencidos` (`erpProfessionalRepository.ts`), que troca `aberto`/`parcial` por `vencido`. Hoje: 28 parcelas gravadas como `vencido` e 89 atrasadas ainda como `aberto`/`parcial`. As telas calculam "vencido" pela data, mas o valor gravado **apaga a informação de pagamento parcial** e fica desatualizado entre execuções | Médio | Tratar vencido só como estado calculado (data < hoje e saldo > 0); remover o `UPDATE` da automação; migração que devolve `vencido` → `parcial` (se `valor_pago>0`) ou `aberto` |
| 2 | **Numeração**: quando o número não vem pronto, o servidor usa `VEN-<Date.now()>` / `COM-<Date.now()>` (2 vendas já têm esse formato; o resto segue `VEN-AAAA-NNNN`) | Médio (aparência profissional, conferência, exigência de clientes) | Tabela `erp.numeracoes(empresa_id, tipo, ano, proximo)` com incremento transacional por empresa (orçamento, venda, compra, OS, contrato, título) |
| 3 | **12 colunas com `DEFAULT CURRENT_DATE`** (UTC): `vendas.data_venda`, `compras.data_compra`, `contas_*.data_emissao`, `documentos_estoque.data_documento`, `transferencias_*`, `ordens_servico.data_inicio`, `inventarios`, eventos e automação. Após as 21h de Brasília o padrão vira "amanhã" | Baixo (a aplicação já envia a data) | Função `erp.hoje(empresa_id)` com o fuso da empresa (depende da migração `fuso_horario`) ou remover o default e exigir a data |
| 4 | `produtos.formato` aceita `variacao`, mas não há tabela de variações (grade cor/tamanho) | Baixo hoje (0 produtos), confuso | Remover o valor até existir o módulo de grade, ou criar `produtos_variacoes` |
| 5 | `compras.tipo_movimento` repete `status` (`cancelada` nos dois; todas as 120 compras estão como `compra`, embora o padrão seja `cotacao`) | Baixo | Definir um só campo de ciclo de vida (cotação → pedido → compra) e derivar o resto |
| 6 | `vendas.tipo_documento='pedido'` existe mas nunca é usado | Baixo | Usar como "pedido de venda" (antes do faturamento) ou remover |
| 7 | Contato e endereço guardados em dois lugares (`entidades.email/telefone/cidade…` e `entidades_contatos`/`entidades_enderecos`, sincronizados por trigger) | Baixo (0 divergências hoje) | Tornar as tabelas novas a única fonte e transformar as colunas antigas em leitura derivada |
| 8 | Papel `authenticated` com 122 permissões no schema `erp` (protegido por RLS; o servidor usa `erp_runtime`) | Segurança em profundidade | Revogar se o front não acessa o Supabase direto |
| 9 | `metodos_pagamento` e `centros_custo` sem `versao` (os demais cadastros têm) | Muito baixo | Acrescentar para padronizar a edição concorrente |
| 10 | 40 de 40 produtos sem NCM | Bloqueia NF-e na fase fiscal | Tornar NCM obrigatório para produto vendável quando a emissão for ligada; sugestão de NCM no cadastro |

## O que falta para competir com Conta Azul e Omie

| Prioridade | Módulo | Conta Azul | Omie | Situação aqui |
| --- | --- | --- | --- | --- |
| Alta | **Comissões de vendedores** (regra por vendedor/produto, apuração por venda faturada ou recebida, pagamento) | ✓ | ✓ | `vendas.vendedor_id` existe; sem regra nem apuração |
| Alta | **Tabelas de preço** (por cliente, canal ou volume; validade) | ✓ | ✓ | Só `produtos.preco_venda` |
| Alta | **Cartão de crédito empresarial** (faturas, fechamento, vencimento, conciliação da fatura) | ✓ | ✓ | `contas_financeiras.tipo='cartao'` sem fatura |
| Alta | **Integração contábil** (plano de contas contábil, de-para categoria → conta, exportação para o contador) | ✓ (portal do contador) | ✓ | Ausente |
| Alta | **Numeração sequencial** (item 2) | ✓ | ✓ | Parcial |
| Média | **Devolução comercial** de venda/compra (documento ligado à origem, crédito do cliente, estorno financeiro e de estoque juntos) | ✓ | ✓ | Só o documento de estoque; o crédito usaria `adiantamentos` |
| Média | **Lote, validade e número de série** no estoque | — | ✓ | Ausente |
| Média | **Transporte na venda** (transportadora, modalidade de frete, volumes, peso) — necessário para NF-e | ✓ | ✓ | Só `frete` em valor |
| Média | **Orçamento empresarial / metas** por categoria e mês (previsto × realizado) | — | ✓ | Ausente |
| Média | **Aprovação** de compras e pagamentos por alçada | — | ✓ | Ausente (só a confirmação do chat) |
| Baixa | Grade de produtos (variações), CRM/funil de vendas, PDV/NFC-e, produção | parcial | ✓ | Ausente |
| Fase futura | NF-e/NFS-e, boleto/Pix, Open Finance | ✓ | ✓ | Estrutura pronta, sem provedor (fora deste escopo) |

## Ordem sugerida

1. Itens de desenho 1, 2 e 3 (corrigem comportamento visível ao usuário) e 8 (segurança).
2. Comissões, tabelas de preço e cartão de crédito (os três mais pedidos por PMEs que comparam com Conta Azul/Omie).
3. Integração contábil e devolução comercial.
4. Transporte na venda e NCM obrigatório — junto com a fase fiscal.
5. Lote/série, metas e aprovações conforme o segmento dos clientes.

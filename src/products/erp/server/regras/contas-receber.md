# Contas a receber (CR)

Títulos e parcelas a receber (vindos de vendas, contratos ou lançados à mão), baixas, estornos, previsões, crédito de devolução e renegociação.
Caminhos relativos a `src/products/erp/server/`. Legenda e camadas no [README](README.md).

> Quase todas as regras de baixa e estorno valem igual para **contas a pagar**; o código é duplicado
> (`settleReceivableInstallment()` × `settlePayableInstallment()`). Ao migrar, viram uma regra só.

## Conceitos

- **Título** (`conta_id`): o documento — "Venda VEN-2026-0153", "Aluguel de dezembro". Tem 1 a 48 parcelas.
- **Parcela** (`parcela_id`): cada vencimento. Baixa, saldo e atraso são da parcela.
- **Saldo da parcela** = valor − dinheiro recebido − créditos aplicados − valor levado para renegociação. Fonte única: `erpFinancialComposition.ts` → `financialCompositionSql()`.
- **Previsão × efetivo**: previsão é expectativa (não entra no caixa realizado e não aceita baixa); efetivo é confirmado.

## Lançar título manual

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CR-01 | Título manual precisa de cliente ativo, descrição, valor > 0, competência, emissão e categoria de **receita** ativa e sem subcategorias. | `erpCrudRepository.ts` → `createManualFinancialTitle()`, `validateFinancialReferences()` | "Escolha uma categoria financeira compatível desta empresa (sem subcategorias)." / "Referência financeira não disponível nesta empresa." | 🧪 (lado a pagar) |
| CR-02 | Parcelas distribuem exatamente o valor total (GE-11), até 48 (GE-12). | `erpCrudRepository.ts` → `validateFinancialReferences()` | "Parcelas devem distribuir o valor total." | 🧪 |
| CR-03 | Títulos de venda, compra e contrato são gerados pelo documento de origem; não se lança título manual duplicando uma venda. | regra de uso (descrições das ferramentas do chat); não há trava no servidor | — | ❌ **sem trava** |

## Editar e excluir título manual

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CR-05 | Só título manual pode ser editado ou excluído por aqui; título de venda/compra/contrato se altera no documento de origem; título de comissão ou reembolso preserva o vínculo. | `erpCrudRepository.ts` → `changeManualFinancialTitle()` | "Altere ou cancele o documento de origem deste título." / "Este título foi gerado por comissão ou reembolso. …" | ❌ |
| CR-06 | Título com pagamento, crédito ou renegociação não pode ser reescrito nem excluído. | `erpCrudRepository.ts` → `changeManualFinancialTitle()`; banco: `contas_receber → a_proteger_dependencias` | "Título com histórico de pagamento, crédito ou renegociação não pode ser reescrito ou excluído." | 🧪 (lado a pagar) |
| CR-07 | Título com cobrança emitida ou com rateio só se altera no financeiro do ERP. | `erpCrudRepository.ts` → `changeManualFinancialTitle()` | "Título com histórico de cobrança deve ser alterado ou cancelado no financeiro do ERP." / "Título com rateio exige edição no financeiro do ERP." | ❌ |
| CR-08 | Na edição, se as parcelas usam contas financeiras diferentes, a conta das novas parcelas precisa ser escolhida. | `erpCrudRepository.ts` → `changeManualFinancialTitle()` | "O título usa contas financeiras diferentes. Escolha explicitamente a conta para as novas parcelas." | ❌ |

## Previsão

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CR-09 | Previsão não aceita baixa: primeiro efetiva. Efetivar não recebe dinheiro; efetivar algo já efetivo não faz nada. | `erpReceivablesPayablesRepository.ts` → `settleReceivableInstallment()`; `erpFinanceRepository.ts` → `makeReceivableEffective()`; banco: `pagamentos → exigir_efetivo` | "Efetive a previsão antes de registrar o pagamento." | 🧪 (lado a pagar) |

> Diferença encontrada: `makePayableEffective()` grava `efetivado_em`; `makeReceivableEffective()` não. Conferir se é intencional.

## Registrar recebimento (baixa)

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CR-10 | A baixa é da **parcela**, não do título. | `erpReceivablesPayablesRepository.ts` → `settleReceivableInstallment()` | "Parcela a receber não encontrada." | 🧪 |
| CR-11 | Parcela cancelada ou já paga não aceita baixa. | idem | "Parcela cancelada não pode ser baixada." / "Parcela já esta paga." | ❌ |
| CR-12 | Valor da baixa > 0 e no máximo o saldo em aberto da parcela (baixa parcial é permitida). | idem; banco: `validar_saldos` | "O valor da baixa deve ser maior que zero." / "O valor (R$ X) passa do saldo em aberto da parcela (R$ Y)." | 🧪 R$ 9.999 numa parcela de R$ 698 recusado na prévia |
| CR-13 | Toda baixa entra numa conta financeira ativa (a informada, a da parcela ou a padrão); sem nenhuma conta cadastrada, não há baixa. | `erpReceivablesPayablesRepository.ts` → `ensureFinancialAccountId()` | "Conta financeira inválida ou inativa." / "Cadastre uma conta financeira antes de registrar a baixa." | 🧪 |
| CR-14 | Recebimento por cartão na maquininha entra na conta da maquininha; a taxa é calculada pelo ERP e não pode ser informada à mão. | `erpReceivablesPayablesRepository.ts` → `settleReceivableInstallment()` | "Com esta forma de pagamento a taxa do cartão é calculada pelo ERP; não informe a taxa." | ❌ |
| CR-15 | Desconto e taxa não podem passar do valor recebido. | `erpReceivablesPayablesRepository.ts` → `paymentNetValue()` | "Desconto e taxa não podem superar o valor recebido." | ❌ |
| CR-16 | A mesma identificação de baixa não grava duas vezes (GE-31). | `settleReceivableInstallment()` | "Esta identificação já foi usada em outra baixa." | ❌ |
| CR-17 | Registrar a baixa não movimenta banco: só registra o que o usuário informa que aconteceu. | descrição das ferramentas | — | — |
| CR-18 | A data da baixa respeita período fechado (GE-40). | banco: `validar_periodo_comercial_financeiro` | "O período esta fechado …" | ❌ |

## Estornar

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CR-20 | Estorno é do **pagamento** (não da parcela) e exige motivo. Recompõe o saldo da parcela. | `erpReceivablesPayablesRepository.ts` → `reverseErpPayment()` | "Pagamento não encontrado." / "Informe o motivo do estorno." | 🧪 parcela voltou a "aberto" com saldo integral |
| CR-21 | Um estorno não pode ser estornado; estornar de novo um pagamento já estornado devolve o estorno existente. | idem | "Um estorno não pode ser estornado diretamente." | ❌ |
| CR-22 | Pagamento conciliado com o extrato segue a regra de conciliação ao ser estornado. | banco: `pagamentos → validar_conciliacao` | — | ❌ |

## Crédito de devolução

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CR-40 | Crédito de devolução só abate parcela em aberto **do mesmo cliente**, até o crédito disponível e até o saldo da parcela. | `erpReturnsRepository.ts` → `useCustomerCredit()` | "Escolha uma parcela em aberto do mesmo cliente." / "Crédito disponível: X." / "Saldo da parcela: X." | ❌ |
| CR-41 | Crédito de venda cancelada ou não confirmada não pode ser usado. | idem | "O crédito pertence a uma venda cancelada ou não confirmada. …" | ❌ |
| CR-42 | Usar crédito exige permissão de registrar baixas. | idem | "Seu perfil não permite registrar baixas." | ❌ |

## Renegociação e adiantamentos

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CR-50 | Renegociação junta parcelas com saldo da **mesma entidade** em novas parcelas; a soma das novas fecha com o acordo (saldo + encargos − desconto). Desconto ou encargo exige categoria de ajuste. | `erpFinanceRepository.ts` → `createRenegotiation()` | "As origens devem ter saldo e pertencer a mesma entidade." / "A composicao das novas parcelas não fecha com o acordo." / "Informe a categoria de ajuste …" | ❌ |
| CR-51 | Adiantamento de cliente é aplicado em parcelas até o saldo do adiantamento. | `erpFinanceRepository.ts` → `createAdvance()`, `applyAdvance()`; banco: `validar_saldos_evolucao` | "Saldo de adiantamento excedido" | ❌ |

## Rateio e recorrência

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CR-60 | Rateio por categoria/centro de custo distribui exatamente o valor do título. | `erpFinanceRepository.ts` → `replaceFinancialAllocations()` | "O rateio precisa distribuir integralmente o valor do título." | ❌ |
| CR-61 | Recebimento recorrente exige cliente válido, valor > 0 e parcelas que somam o valor; as ocorrências seguem o calendário da recorrência. | `erpReceivablesPayablesRepository.ts` → `createRecurringReceivable()`, `processErpFinancialRecurrences()` | "Modelo recorrente exige cliente válido e valor positivo." / "Parcelas devem distribuir integralmente o valor da recorrência." | ❌ |

# Contas a pagar (CPG)

Títulos e parcelas a pagar (de compras, comissões, reembolsos ou lançados à mão), pagamentos, estornos, previsões, recorrências, rateio e classificação de despesas.
Caminhos relativos a `src/products/erp/server/`. Legenda no [README](README.md).

> As regras de baixa, estorno, previsão, edição e exclusão são **as mesmas de contas a receber** e estão em
> [contas-receber.md](contas-receber.md) (CR-05 a CR-22, CR-50, CR-51, CR-60). O código é duplicado
> (`settlePayableInstallment()` × `settleReceivableInstallment()`); aqui ficam só as diferenças e as regras próprias.

## Mesmas regras de contas a receber, lado a pagar

| Regra a receber | Equivalente a pagar | Onde (lado a pagar) | Teste |
|---|---|---|---|
| CR-05 a CR-08 (editar/excluir título manual) | mesmas | `erpCrudRepository.ts` → `changeManualFinancialTitle()` | 🧪 editar e excluir título; editar título pago recusado |
| CR-09 (previsão não aceita baixa) | mesma | `erpReceivablesPayablesRepository.ts` → `settlePayableInstallment()`; `erpFinanceRepository.ts` → `makePayableEffective()` | 🧪 efetivar previsão |
| CR-10 a CR-16 (baixa) | mesmas | `settlePayableInstallment()`; `payablePaymentNetValue()` | 🧪 pagamento de parcela |
| CR-20 a CR-22 (estorno) | mesmas | `reverseErpPayment()` | ❌ |
| CR-50, CR-51 (renegociação, adiantamento a fornecedor) | mesmas | `erpFinanceRepository.ts` | ❌ |

## Regras próprias

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CPG-01 | Título manual a pagar precisa de fornecedor, descrição, valor > 0, competência, emissão e categoria de **despesa** ativa e sem subcategorias. | `erpCrudRepository.ts` → `createManualFinancialTitle()`; tela: `erpReceivablesPayablesRepository.ts` → `createManualPayableRecord()` | "Descrição é obrigatória." / "Valor precisa ser maior que zero." / "Fornecedor não encontrado." | 🧪 |
| CPG-02 | Desconto no pagamento não passa do valor pago. | `erpReceivablesPayablesRepository.ts` → `payablePaymentNetValue()` | "O desconto não pode superar o valor do pagamento." | ❌ |
| CPG-03 | Despesa recorrente: término válido (data final ≥ início) e parcelas que somam o valor; cada ocorrência é gerada conforme o calendário. | `createManualPayableRecord()`; `processErpFinancialRecurrences()` | "Término de recorrência inválido." / "Informe uma data final igual ou posterior ao início." / "Recorrência N: modelo ausente. …" | ❌ |
| CPG-04 | Rateio por categoria/centro de custo distribui exatamente o valor da despesa. | `createManualPayableRecord()`; `erpFinanceRepository.ts` → `replaceFinancialAllocations()` | "O rateio precisa distribuir o valor total da despesa." | ❌ |
| CPG-05 | Classificar despesa troca só a categoria do título (um ou até 50), sem mexer em valores, pagamentos ou parcelas; o grupo da DRE vem da categoria, não do título. Só título manual, sem rateio. | `erpCrudRepository.ts` → `classifyExpenseWithClient()`; chat: `classificar_despesas` | "Título manual não disponível para classificação." / "Categoria de despesa indisponível." / "Título com rateio exige revisão no ERP." | 🧪 |
| CPG-06 | Títulos de compra, comissão e reembolso nascem da operação de origem e se alteram por ela (CR-05). | `changeManualFinancialTitle()` | "Este título foi gerado por comissão ou reembolso. …" | ❌ |
| CPG-07 | Comissão provisionada de venda: alterar, cancelar ou devolver a venda exige tratar a comissão no financeiro antes (se já tiver baixa) e permissão de financeiro. | `erpCommissionAdjustments.ts` | "Esta venda possui comissão provisionada. Quem gerencia o financeiro precisa registrar esta alteração." / "A comissão já possui baixa ou conciliação. …" | ❌ |
| CPG-08 | Pagar comissões exige o vendedor marcado também como fornecedor e comissão liberada até a data. | `erpCommercialRepository.ts` | "Marque o vendedor também como fornecedor para gerar a conta a pagar das comissões." / "Não há comissão liberada a pagar até essa data." | ❌ |
| CPG-09 | Mudança de título com versão antiga é recusada; identificação repetida com outros dados também (GE-30, GE-31). | `erpFinancialTitles.ts` → `changeFinancialTitle()` | "Este título mudou. Consulte os dados novamente antes de salvar." / "Esta identificação pertence a um título excluído. …" | ❌ |

> Diferença encontrada: `makePayableEffective()` grava `efetivado_em`; `makeReceivableEffective()` não (ver CR-09).

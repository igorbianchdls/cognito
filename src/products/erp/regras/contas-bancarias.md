# Contas bancárias (CB)

Contas financeiras (banco, caixa, carteira, cartão, maquininha), transferências, formas de pagamento, cartões, importação de extrato e conciliação.
Caminhos relativos a `src/products/erp/server/`. Legenda no [README](README.md).

## Contas financeiras

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CB-01 | Conta tem nome, tipo (caixa, banco, carteira, cartão, outro, maquininha) e data do saldo inicial. | `erpReceivablesPayablesRepository.ts` → `createFinancialAccountRecord()`; chat: `schemas/actionContracts.ts` | — | 🧪 |
| CB-02 | Só uma conta é a padrão; marcar outra como padrão desmarca a anterior; a primeira conta da empresa já nasce padrão. | `createFinancialAccountRecord()` | — | ❌ |
| CB-03 | Saldo inicial e data inicial não se editam depois de criados. | chat: `editar_cadastro` (variante conta); tela | — | ❌ |
| CB-04 | Lançamentos e baixas só em conta ativa (CR-13). | `erpReceivablesPayablesRepository.ts` → `ensureFinancialAccountId()` | "Conta financeira inválida ou inativa." | 🧪 |

## Transferências entre contas

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CB-10 | Origem e destino diferentes, valor > 0, data válida. | `erpManagementRepository.ts` → `createManagementOperation()`; chat: `schemas/actionContracts.ts` | "Origem e destino devem ser diferentes." | ❌ (ferramenta `transferir_entre_contas` publicada, ainda não testada) |
| CB-11 | Mesma identificação não grava duas vezes (GE-31). | `createManagementOperation()` | "Esta identificação já foi usada em outra transferência." | ❌ |
| CB-12 | Transferência não entra no resultado (DRE nem "resultado pelo caixa"): só muda o dinheiro de lugar. | relatórios: `erpDreReport.ts`, `dashboards/` | — | ❌ |

> A conferir: não há trava de saldo na conta de origem (a transferência pode deixar a conta negativa). Decidir se é desejado.

## Formas de pagamento e cartões

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CB-20 | Forma de pagamento tem nome e tipo válidos; taxa de 0 a 100%, taxa fixa ≥ 0, repasse de 0 a 365 dias. | `erpPaymentMethods.ts` → `savePaymentMethod()` | "Informe o nome da forma de pagamento." / "Confira taxa (0 a 100%), taxa fixa e prazo do repasse (0 a 365 dias)." | ❌ |
| CB-21 | Cartão pela maquininha exige: conta do tipo "maquininha", conta bancária do repasse, categoria de despesa da taxa e adquirente cadastrada como fornecedor. Só cartão de crédito/débito usa maquininha. | `savePaymentMethod()` | "Escolha uma conta financeira do tipo "maquininha"." / "Escolha a adquirente (cadastrada como fornecedor) …" | ❌ |
| CB-22 | Recebimento no cartão entra na maquininha; a taxa é calculada pelo ERP e não pode passar do recebimento (CR-14). | `erpCardReceipts.ts` → `applyCardReceipt()` | "A taxa do cartão não pode ser maior que o recebimento." | ❌ |
| CB-23 | Recebimento no cartão cujo repasse já foi conciliado com o banco só é estornado depois de desfazer essa conciliação. | `erpCardReceipts.ts` → `cancelCardReceipt()` | "Este recebimento no cartão já teve repasse conciliado com o banco. …" | ❌ |

## Extrato e conciliação

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CB-30 | Extrato (OFX ou CSV) é importado por conta; o mesmo arquivo na mesma conta não é importado duas vezes. | `erpBankImportRepository.ts` → `importErpBankStatement()` (hash do arquivo) | — | ❌ |
| CB-31 | Sugestões de conciliação comparam valor e data entre extrato e pagamentos/transferências da mesma conta. Sugestão não prova nada: precisa de confirmação. | `erpProfessionalRepository.ts` → `suggestBankReconciliations()` | — | ❌ (sem extrato na empresa de teste) |
| CB-32 | Conciliar: o pagamento e o extrato são da mesma conta; crédito no extrato concilia com recebimento, débito com pagamento; precisa haver saldo conciliável. | `erpManagementRepository.ts` → `createManagementOperation()` (conciliação) | "Pagamento e extrato pertencem a contas diferentes." / "Crédito deve conciliar com recebimento e débito com pagamento." / "Não existe saldo conciliavel entre os movimentos." | ❌ |
| CB-33 | Repasse do cartão concilia com crédito no banco, na conta do repasse. | idem | "Repasse do cartão concilia com crédito no banco." / "O repasse é para outra conta." | ❌ |
| CB-34 | Conciliação não cria baixa: só liga o extrato a um pagamento já registrado. Pode ser desfeita. | idem; `undoBankReconciliation()` | "Conciliação ativa não encontrada." | ❌ |
| CB-35 | Regras automáticas de lançamento casam por texto da descrição do extrato (mínimo 3 letras). | `erpBankRules.ts` → `saveLaunchRule()`, `applyLaunchRules()` | "Informe ao menos 3 letras do texto que aparece na descrição do extrato." | ❌ |
| CB-36 | Transação do extrato pode ser marcada como ignorada (não some, só sai das pendências). | `erpProfessionalRepository.ts` → `setBankTransactionIgnored()` | — | ❌ |

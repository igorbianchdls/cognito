# Compras (CP)

Cotações, compras, recebimento de mercadoria, importação de NF-e de entrada, cancelamento e devolução.
Caminhos relativos a `src/products/erp/server/`. Legenda e camadas no [README](README.md).

## Ciclo de vida

```
rascunho (cotação) → confirmada → parcialmente_recebida → recebida → [devolvida]
                                ↘ cancelada
```

Confirmar gera a conta a pagar; **receber** é que aumenta o estoque. São etapas separadas.

## Criar e editar

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CP-01 | Compra tem pelo menos um item, cada um com produto ou serviço, quantidade > 0 e valor unitário ≥ 0. | `erpPurchasesRepository.ts` → `normalizePurchaseItems()` | "Adicione pelo menos um item a compra." / "Selecione um produto ou serviço no item N." / "Quantidade do item N invalida." | 🧪 |
| CP-02 | Desconto do item não passa do valor bruto; desconto percentual entre 0 e 100. | `normalizePurchaseItems()` | "Desconto do item N supera o valor bruto." / "Desconto percentual do item N invalido." | ❌ |
| CP-03 | Descontos e retenções do cabeçalho não passam do valor da compra. | `erpPurchasesRepository.ts` → `createPurchaseRecord()` | "Descontos e retencoes não podem superar o valor da compra." | ❌ |
| CP-04 | De 1 a 48 parcelas, sem número repetido, somando o total (GE-11, GE-12). | **`regras/geral.ts` → `validarParcelas()`**, em `validatePurchaseInstallments()` | "A condição de pagamento aceita no máximo 48 parcelas." / "A soma das parcelas precisa ser igual ao total da compra." | ✅ `regras/geral.test.ts` |
| CP-05 | Fornecedor precisa existir na empresa. | `createPurchaseRecord()` | "Fornecedor não encontrado." | 🧪 |
| CP-06 | Item sem descrição recebe o nome do cadastro do produto/serviço. | `createPurchaseRecord()` (insert dos itens) | — | 🧪 (até 2026-11-24 gravava "Produto 101") |
| CP-07 | Só cotação em rascunho é editável; versão antiga é recusada (GE-30). | `erpPurchasesRepository.ts` → `updateErpPurchaseDraft()` | "Somente cotacoes em rascunho podem ser editadas." / "CONFLITO_VERSAO: esta compra foi alterada por outra pessoa." | 🧪 |
| CP-08 | Excluir só rascunho sem financeiro, estoque ou nota (mesma regra de VD-19). | `erpCrudRepository.ts` → `archiveCommercialDraft()` | "Somente documentos em rascunho podem ser excluídos. …" | 🧪 |

## Confirmar

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CP-10 | Confirmar exige fornecedor, pelo menos um item, total > 0 e data válida; compra cancelada não é confirmada. | `regras/compras.ts` → `validarConfirmacaoCompra()` | "Compra precisa ter fornecedor …" / "… total maior que zero …" / "Compra cancelada não pode ser confirmada." | ✅ `etapas-4-5.test.ts` (CP-10) · 🧪 |
| CP-11 | Confirmar gera (ou efetiva) a conta a pagar quando "gera financeiro" está ligado. Não recebe mercadoria. | `confirmErpPurchase()`; `createOrUpdatePurchasePayable()` | — | 🧪 |
| CP-12 | A natureza da conta a pagar (previsão/efetivo) não muda depois que ela tem pagamento. | `erpPurchasesRepository.ts` → `createOrUpdatePurchasePayable()` | "Não e possível alterar a natureza de uma conta que já possui pagamento." | ❌ |

## Receber mercadoria

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CP-20 | Compra cancelada não é recebida. | `erpProfessionalRepository.ts` → `receivePurchaseItems()` | "Compra cancelada não pode ser recebida." | ❌ |
| CP-21 | Só se recebe item que controla estoque, até o saldo pendente do item (recebimento parcial permitido). | `receivePurchaseItems()` | "Item não controla estoque." / "Quantidade excede o saldo pendente de {item}." | ❌ (ferramenta `receber_compra` publicada, ainda não testada) |
| CP-22 | Receber dá entrada no estoque no local escolhido (ou no local da compra / padrão) e atualiza o custo médio. | `receivePurchaseItems()`; `erpStockRepository.ts` → `applyStockMovement()` | — | ❌ |

> A conferir: `receivePurchaseItems()` só recusa compra **cancelada**; não exige que esteja confirmada. Decidir se rascunho pode ser recebido.

## Cancelar

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CP-30 | Cancelar é para compra confirmada (rascunho se exclui, CP-08). | `erpPurchasesRepository.ts` → `cancelErpPurchase()` → `reversePurchase()` | — | 🧪 |
| CP-31 | Não cancela compra com nota fiscal vinculada ativa nem com pagamento (estorne antes). | `regras/compras.ts` → `validarCancelamentoCompra()` | "Desvincule ou cancele a nota fiscal antes de cancelar a compra." / "Compra com pagamento não pode ser cancelada sem estorno." | ✅ `etapas-4-5.test.ts` (CP-10/31) |

> A conferir: não há trava explícita para cancelar compra com mercadoria já recebida (a devolução, CP-40, é o caminho previsto).

## Devolver ao fornecedor

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CP-40 | Devolução é **integral** e só de compra de produtos **totalmente recebida**; não faz devolução parcial. | `regras/compras.ts` → `validarDevolucaoCompra()` | "A devolução integral exige uma compra de produtos totalmente recebida." | ✅ `etapas-4-5.test.ts` (CP-10/31/40) · 🧪 compra não recebida recusada |
| CP-41 | Uma compra só é devolvida uma vez; exige versão atual e motivo de 3 a 1000 caracteres. | `regras/compras.ts` → `validarDevolucaoCompra()` (já devolvida) | "Esta compra já foi devolvida integralmente." / "Informe a versão atual e um motivo …" | ✅ `etapas-4-5.test.ts` (CP-10/31/40/41) |
| CP-42 | Exige permissão de compras, financeiro e movimentação de estoque juntas. | `returnErpPurchase()` | "A devolução exige permissão de compras, financeiro e movimentação de estoque." | ❌ |
| CP-43 | Antes de devolver, reverter créditos e renegociações vinculados; pagamentos também precisam estar estornados. A devolução tira do estoque o que entrou e cancela as contas a pagar. | `regras/compras.ts` → `validarDevolucaoCompra()` | "Reverta créditos e renegociações vinculados antes de devolver a compra." | ✅ `etapas-4-5.test.ts` (CP-10/31/40/41/43) |

## Importar NF-e de entrada

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CP-50 | A NF-e precisa ter sido emitida para o CNPJ configurado na empresa (configurar o CNPJ antes). | `erpPurchasesRepository.ts` → `importErpPurchaseInvoice()` | "Configure o CNPJ da empresa antes de importar NF-e de entrada." / "A NF-e não foi emitida para o CNPJ configurado neste tenant." | ❌ |
| CP-51 | Fornecedor e itens da NF-e precisam ser válidos; ao vincular a uma compra existente, fornecedor, total e subtotal precisam conferir. | `importErpPurchaseInvoice()` | "A compra escolhida não pertence ao fornecedor ou possui total diferente da NF-e." / "O subtotal da compra escolhida não confere …" | ❌ |

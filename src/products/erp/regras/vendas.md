# Vendas (VD)

Orçamentos (propostas), vendas, crédito, descontos, entrega, cancelamento e devolução.
Caminhos relativos a `src/products/erp/server/`. Legenda e camadas no [README](README.md).

## Ciclo de vida

```
Orçamento:  em_andamento → enviada → aprovado → convertido (vira venda)
                         ↘ recusado / cancelado (encerrado)
Venda:      rascunho → confirmada → atendida (entregue) → [devolução parcial/total]
                     ↘ cancelada
```

## Orçamento

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| VD-01 | Orçamento recusado, convertido ou cancelado está encerrado: não aceita editar, enviar, aprovar, recusar nem converter. | `regras/vendas.ts` → `validarAcaoOrcamento()`, `orcamentoEncerrado()`; na conversão `validarConversaoOrcamento()` (conversão e toda venda criada com orçamento de origem; antes no banco, BD-30) | "Orçamento encerrado não pode ser alterado." / "… não pode ser convertido." / "… não pode ser editado." | ✅ `etapas-4-5.test.ts` (VD-01) · 🧪 |
| VD-02 | Orçamento vencido (validade antes de hoje, GE-01) precisa ter a validade renovada antes de enviar, aprovar ou converter. | `regras/vendas.ts` → `validarOrcamentoVigente()` | "Orçamento vencido. Renove a validade no orçamento antes de enviar, aprovar ou converter." | ✅ `etapas-4-5.test.ts` (VD-01/02/03), `etapa-6.test.ts` |
| VD-03 | Orçamento aprovado não volta para "enviado". | `regras/vendas.ts` → `validarAcaoOrcamento()` | "Orçamento aprovado não pode voltar para enviado." | ✅ `etapas-4-5.test.ts` (VD-01/02/03) |
| VD-04 | Recusar e cancelar exigem motivo. | chat: `schemas/actionContracts.ts`; tela | — | 🧪 |
| VD-05 | "Enviar" só registra que foi enviado; não manda e-mail nem mensagem. | `erpProfessionalRepository.ts` → `runQuoteAction()` | — | 🧪 |
| VD-06 | Editar um orçamento o reabre como "em andamento" e apaga aprovação e envio anteriores. | `erpSalesRepository.ts` → `updateErpSaleDraft()` | Aviso na prévia do chat | ❌ (editar dava erro até 2026-11-25) |
| VD-07 | Converter exige pelo menos um item ativo; se a OS de origem estiver cancelada, não converte. Converter de novo reaproveita a venda já gerada. | `erpProfessionalRepository.ts` → `convertQuoteWithClient()` | "O orçamento precisa de pelo menos um item ativo." / "A ordem de serviço de origem está cancelada." | 🧪 |
| VD-08 | Não se confirma um orçamento: primeiro converte em venda, depois confirma a venda. | `erpSalesRepository.ts` → `confirmErpSale()` | "Converta o orçamento em venda antes de confirmar o financeiro." | ❌ |

## Criar e editar (rascunho)

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| VD-10 | Venda tem de 1 a 100 itens; cada item com quantidade > 0 e produto/serviço existente na empresa. | `erpSalesRepository.ts` → `createSaleRecord()` | "A venda aceita no máximo 100 itens." / "Quantidade do item N invalida." / "Item N não encontrado." | 🧪 |
| VD-11 | Preço unitário > 0 e desconto do item não pode passar do valor bruto do item. Total da venda > 0. | `erpSalesRepository.ts` → `createSaleRecord()` | "Valor unitário do item N precisa ser maior que zero." / "Desconto do item N supera o valor bruto." / "Total da venda precisa ser maior que zero." | ❌ |
| VD-12 | Parcelas somam o total (GE-11), até 48 (GE-12), sem número de parcela repetido. | **`regras/geral.ts` → `validarParcelas()`**, em `validateSaleInstallments()` e `createSaleRecord()` | "A soma das parcelas precisa ser igual ao total da venda." / "Existem parcelas com o mesmo número." | ✅ `regras/geral.test.ts` |
| VD-13 | Sem preço informado, o ERP usa: tabela de preço informada → tabela do cliente → tabela padrão → preço do cadastro. | `erpCommercialRules.ts` → `resolvePriceTable()`, `tablePrice()`; chat: `actions/pricing.ts` → `fillSalePrices()` | — | 🧪 |
| VD-14 | Tabela de preço precisa estar ativa, na vigência e ser da empresa. | `erpCommercialRules.ts` → `resolvePriceTable()` | "Tabela de preço inativa, fora da vigência ou de outra empresa." | ❌ |
| VD-15 | Com tabela de preço: preço líquido não fica abaixo do mínimo e desconto não passa do máximo da tabela. | **`regras/vendas.ts` → `validarPrecoTabela()`**, via `erpCommercialRules.ts` → `assertTablePriceRules()` | "Item N: preço líquido abaixo do mínimo da tabela (X)." / "Item N: desconto de X% acima do máximo da tabela (Y%)." | ✅ `regras/vendas.test.ts` |
| VD-16 | O desconto total (itens + venda) sobre o bruto não passa do máximo permitido ao vendedor. | **`regras/vendas.ts` → `validarDescontoVendedor()`**, via `erpCommercialRules.ts` → `assertDiscountLimit()` | "Desconto de X% acima do máximo permitido para você (Y%)." (`DISCOUNT_LIMIT_EXCEEDED`, 403) | ✅ `regras/vendas.test.ts` |
| VD-17 | Transportadora precisa estar marcada como transportadora; modalidade de frete dentro da lista. | `erpCommercialRules.ts` → `saleTransport()` | "Transportadora não encontrada ou não marcada como transportadora." / "Modalidade de frete inválida." | ❌ |
| VD-18 | Só rascunho é editável; edição com versão antiga é recusada (GE-30). | `erpSalesRepository.ts` → `updateErpSaleDraft()` | "Somente vendas em rascunho podem ser editadas." | ❌ (editar pelo chat dava erro até 2026-11-25) |
| VD-19 | Excluir só rascunho sem financeiro, estoque ou nota; o resto exige cancelamento. | `erpCrudRepository.ts` → `archiveCommercialDraft()` | "Somente documentos em rascunho podem ser excluídos. Use cancelamento para documentos confirmados." / "Documento com financeiro exige cancelamento no ERP." | 🧪 |

## Confirmar

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| VD-20 | Confirmar exige cliente válido (marcado como cliente), pelo menos um item e total > 0. Venda cancelada não é confirmada. | `erpSalesRepository.ts` → `confirmErpSale()` | "Venda precisa ter cliente para ser confirmada." / "… pelo menos um item …" / "Venda cancelada não pode ser confirmada." | 🧪 |
| VD-21 | Cliente com bloqueio comercial não compra. | **`regras/vendas.ts` → `validarClienteLiberado()`**, via `erpCommercialRules.ts` → `assertCustomerCredit()` | "Cliente bloqueado para vendas: {motivo}." (`CUSTOMER_BLOCKED`) | ✅ `regras/vendas.test.ts` |
| VD-22 | Limite de crédito: em aberto do cliente + esta venda não pode passar do limite. Sem limite cadastrado, não há trava. | **`regras/vendas.ts` → `validarCredito()` / `excessoDeCredito()`**; o servidor (`assertCustomerCredit()`) busca o em aberto e chama a regra | "Limite de crédito excedido em X (limite Y, em aberto Z, venda W). …" (`CREDIT_LIMIT_EXCEEDED`) | ✅ `regras/vendas.test.ts` · 🧪 R$ 174.500 com limite de R$ 5.000 |
| VD-23 | Só quem gerencia o financeiro pode liberar venda acima do limite, e precisa informar o motivo (fica gravado na venda). | **`regras/vendas.ts` → `validarCredito()`** (a permissão é consultada pelo servidor só quando há liberação a decidir) | "Somente quem gerencia o financeiro pode liberar venda acima do limite de crédito." | ✅ `regras/vendas.test.ts` |
| VD-24 | Confirmar gera o título e as parcelas a receber e reserva o estoque dos produtos controlados. Não registra entrega, pagamento nem nota. | `erpSalesRepository.ts` → `confirmErpSale()`; `erpStockRepository.ts` → `reserveStockForSale()` | — | 🧪 |
| VD-25 | Só reserva o que há disponível (físico − já reservado). | `erpStockRepository.ts` → `reserveStockForSale()` | "Estoque disponível insuficiente para {produto}. Disponível: X." | ❌ |

## Entregar (atender)

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| VD-30 | Só se entrega venda confirmada com entrega pendente ou parcial. Mesma regra e mensagem para a entrega total (chat) e a parcial (tela). | **`regras/vendas.ts` → `validarEntrega()`**, chamada por `erpStockRepository.ts` → `attendStockForSale()` e `erpProfessionalRepository.ts` → `attendSaleItems()` | "Venda precisa estar confirmada e com entrega pendente para atender." (`INVALID_STATE`) | ✅ `regras/vendas.test.ts` · 🧪 |
| VD-31 | Entregar dá baixa física no estoque e consome a reserva; marca a quantidade entregue em cada item. | idem | — | 🧪 (até 2026-11-25 a versão do chat não marcava os itens) |
| VD-32 | Entrega parcial: não se entrega mais que o saldo pendente do item, e cada item aparece uma vez. | `erpProfessionalRepository.ts` → `attendSaleItems()` | "Quantidade excede o saldo pendente de {item}." / "Informe cada item apenas uma vez no atendimento." | ❌ (o chat só faz entrega total) |
| VD-33 | A entrega sai do mesmo local de estoque da reserva. | `erpProfessionalRepository.ts` → `attendSaleItems()` | "O local informado é diferente do local reservado nesta venda. …" | ❌ |

## Cancelar

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| VD-40 | Cancelar é para venda confirmada (rascunho se exclui, VD-19) e libera reservas e títulos. Exige motivo. | `erpSalesRepository.ts` → `cancelErpSale()` | — | 🧪 venda confirmada e não entregue cancelada |
| VD-41 | Não cancela venda com devolução registrada. | `regras/vendas.ts` → `validarCancelamentoVenda()` | "Esta venda possui devolução registrada e não pode ser cancelada diretamente. …" (`SALE_HAS_RETURNS`) | ✅ `etapas-4-5.test.ts` (VD-41/42/43) · 🧪 (até 2026-11-25 o chat mostrava "ERP indisponível") |
| VD-42 | Não cancela venda com mercadoria entregue: o caminho é a devolução. | `regras/vendas.ts` → `validarCancelamentoVenda()` | "Esta venda já possui mercadoria entregue. Registre a devolução …" (`SALE_HAS_DELIVERIES`) | ✅ `etapas-4-5.test.ts` (VD-41/42/43) |
| VD-43 | Não cancela venda com nota fiscal ativa, cobrança ativa ou pagamento recebido (estorne/cancele antes). | `regras/vendas.ts` → `validarCancelamentoVenda()` | "Cancele ou exclua a nota fiscal antes de cancelar a venda." / "Cancele a cobrança ativa …" / "Venda com pagamento não pode ser cancelada sem estorno." | ✅ `etapas-4-5.test.ts` (VD-41/42/43) |

## Devolver

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| VD-50 | Só se devolve item de venda confirmada, e o item precisa ser desta venda. | `erpReturnsRepository.ts` → `createSaleReturn()` | "Só é possível devolver itens de venda confirmada." / "Item N não pertence a esta venda." | 🧪 |
| VD-51 | Produto: só devolve o que foi entregue e ainda não devolvido; serviço: o que foi vendido e não devolvido. O não entregue se resolve cancelando. | `regras/vendas.ts` → `validarQuantidadeDevolucao()` | "Item N: só X unidade(s) entregue(s) ainda podem ser devolvidas. Itens não entregues: cancele a venda." | ✅ `etapas-4-5.test.ts` (VD-51/53) |
| VD-52 | O valor devolvido é proporcional ao preço líquido do item, sem frete, e precisa ser > 0. | `erpReturnsRepository.ts` → `createSaleReturn()` | "A devolução precisa ter valor maior que zero." | 🧪 1 de 2 unidades → R$ 349 |
| VD-53 | Tratamento **abater**: reduz as parcelas em aberto da venda; o em aberto precisa cobrir o valor. | `regras/vendas.ts` → `validarAbatimentoDevolucao()` | "A venda tem X em aberto, menos que a devolução (Y). Use crédito ou reembolso." | ✅ `etapas-4-5.test.ts` (VD-51/53) · 🧪 |
| VD-54 | Tratamento **crédito**: gera crédito para o cliente usar em parcelas dele. | `erpReturnsRepository.ts` → `createSaleReturn()`, `useCustomerCredit()` | ver CR-40 | ❌ |
| VD-55 | Tratamento **reembolso**: gera conta a pagar ao cliente (ele precisa estar marcado também como fornecedor) com categoria e vencimento. Não transfere dinheiro. | `erpReturnsRepository.ts` → `createSaleReturn()` | "Para reembolsar, marque o cliente também como fornecedor …" / "Informe a categoria e o vencimento do reembolso." | ❌ |
| VD-56 | Os produtos devolvidos voltam ao estoque, respeitando o histórico de saídas. | `erpReturnsRepository.ts` → `createSaleReturn()` | "O histórico de devoluções deste item não corresponde às saídas. …" | 🧪 |
| VD-57 | O tratamento financeiro escolhido exige a permissão correspondente. | `erpReturnsRepository.ts` → `createSaleReturn()` | "Seu perfil não permite o tratamento financeiro escolhido para a devolução." | ❌ |

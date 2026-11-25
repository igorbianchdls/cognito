# Estoque (ES)

Saldos por produto e local, reservas, entradas, saídas, ajustes, contagens, transferências entre locais, kits e conversão de unidades.
Caminhos relativos a `src/products/erp/server/`. Legenda no [README](README.md).

## Conceitos

- **Físico**: o que está no local. **Reservado**: separado para vendas confirmadas. **Disponível** = físico − reservado.
- Só produto com **controla estoque** tem saldo. Serviços nunca.
- Fonte única de movimento: `erpStockRepository.ts` → `applyStockMovement()`. Toda entrada/saída passa por ela.

## Movimentos

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| ES-01 | Só produto ativo que controla estoque movimenta saldo. | `erpStockRepository.ts` → `lockStockBalance()` | "Produto N não encontrado ou inativo." / "O produto X não controla estoque." | ❌ |
| ES-02 | Local de estoque precisa estar ativo e permitir o tipo de operação (entrada, saída, reserva…). Sem local informado, usa o padrão da empresa. | `resolveStockLocation()`; `ensureDefaultStockLocation()` | "Local de estoque não encontrado ou inativo." / "Este local não permite operações de X." | ❌ |
| ES-03 | Saída não pode deixar o **disponível** negativo. | `applyStockMovement()` | "Saldo insuficiente para X. Disponível para saída: N. …" | ❌ |
| ES-04 | Movimentos de estoque usam **sempre o dia atual** (GE-01); a data histórica fica só no documento de origem. Contagem e transferência também. | `applyStockMovement()`; `createStockOperationWithClient()` | "Movimentos de estoque devem usar o dia atual. …" / "A contagem deve ser registrada no dia atual." / "A transferência deve ser registrada no dia atual." | ❌ |
| ES-05 | Quantidade mínima 0,0001 (precisão de 4 casas); custo ≥ 0. | `quantity()`; `applyStockMovement()` | "… deve ser pelo menos 0,0001." / "Quantidade abaixo da precisão de estoque." | ❌ |
| ES-06 | Entradas atualizam o custo médio; estorno não pode deixar o valor do estoque negativo. | `applyStockMovement()` | "O estorno excede o valor remanescente do estoque; revise o custo antes de cancelar." | ❌ |
| ES-07 | Mesma identificação de operação com conteúdo diferente é recusada (GE-31). | `assertSameRequest()` | "Esta identificação já foi usada com outro conteúdo." | ❌ |

## Reservas e entrega de vendas

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| ES-10 | Confirmar venda reserva o disponível dos produtos controlados; sem disponível suficiente, não confirma. | `reserveStockForSale()` | "Estoque disponível insuficiente para X. Disponível: N." | ❌ |
| ES-11 | Entregar consome a reserva e baixa o físico. Detalhes em VD-30 a VD-33. | `attendStockForSale()` / `erpProfessionalRepository.ts` → `attendSaleItems()`; a regra de quando pode entregar é `regras/vendas.ts` → `validarEntrega()` (VD-30) | "Venda precisa estar confirmada e com entrega pendente para atender." | ✅ (VD-30) · 🧪 19 → 17 |
| ES-12 | Cancelar venda confirmada libera a reserva; devolução devolve ao estoque (VD-56). | `erpSalesRepository.ts` → `cancelErpSale()`; `erpReturnsRepository.ts` | — | 🧪 |

## Operações manuais

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| ES-20 | Movimento manual: entrada, saída, ajuste de entrada ou ajuste de saída. **Ajustes exigem motivo.** | `createStockOperationWithClient()`; chat: `schemas/actionContracts.ts` | "Tipo de movimento inválido." / "Informe o motivo do ajuste." | ❌ (ferramenta `movimentar_estoque` publicada, ainda não testada) |
| ES-21 | Contagem (inventário): de 1 a 200 produtos ativos que controlam estoque, sem repetir; se o saldo mudou desde a revisão, a contagem é recusada. | `readStockCountSnapshot()`; `createStockOperationWithClient()` | "Selecione entre 1 e 200 produtos diferentes." / "Produto repetido na contagem." / "O saldo mudou desde a revisão. Confira a contagem novamente." | ❌ |
| ES-22 | Transferência entre locais: origem e destino diferentes. | `createStockOperationWithClient()` | "Origem e destino devem ser diferentes." | ❌ |
| ES-23 | Kit: produto não é componente dele mesmo e não há kit dentro de kit. | `createStockOperationWithClient()` | "O produto não pode ser componente dele mesmo." / "Kits aninhados não são permitidos. …" | ❌ |
| ES-24 | Conversão de unidade: unidades diferentes, e o destino é a unidade de estoque do produto. Movimento em outra unidade exige conversão cadastrada. | `createStockOperationWithClient()` | "A unidade de destino deve ser a unidade de estoque do produto: X." / "Conversão para a unidade de estoque não cadastrada." | ❌ |

> Atenção para o chat: a ferramenta `movimentar_estoque` aceita `data`, mas ES-04 só aceita o dia atual. Ajustar a descrição da ferramenta ou deixar de enviar a data.

# Contratos de venda recorrente (CT)

Contratos que geram vendas periódicas (mensal, trimestral…). Caminhos relativos a `src/products/erp/server/`. Legenda no [README](README.md).

## Ciclo de vida

```
ativo ⇄ pausado (suspender / retomar)
ativo / pausado → encerrado (definitivo)
Cada período gera um ciclo, e cada ciclo gera uma venda.
```

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CT-01 | Contrato precisa de cliente ativo, um item ativo (produto **ou** serviço) e valor > 0. | `erpSalesContracts.ts` → `createSalesContract()`; chat: `schemas/actionContracts.ts` (exatamente um entre produto e serviço) | "Cliente ativo não encontrado." / "Item ativo não encontrado." / "O contrato precisa ter valor positivo." | ❌ (ferramenta `criar_contrato` publicada, ainda não testada) |
| CT-02 | Suspender só contrato ativo; retomar só pausado; encerrar ativo ou pausado. Encerrado não volta. | `erpSalesContracts.ts` → `changeSalesContractState()` | "Esta ação não está disponível na situação atual do contrato." | 🧪 suspender → retomar |
| CT-03 | Toda mudança de situação exige versão atual e motivo de 3 a 1000 caracteres, e fica no histórico do contrato. | `changeSalesContractState()` | "Informe a versão atual e um motivo de 3 a 1000 caracteres." | 🧪 |
| CT-04 | Alterar a situação exige permissão de gerenciar vendas. | `changeSalesContractState()` | "Seu perfil não permite alterar contratos." | ❌ |
| CT-05 | Ao retomar, os ciclos que venceram durante a suspensão **não são cobrados**; o calendário original é mantido. | `changeSalesContractState()` | — | 🧪 (sem ciclos vencidos no teste) |
| CT-06 | Não retoma contrato cuja vigência já terminou: encerre. | `changeSalesContractState()` | "A vigência terminou. Encerre este contrato." / "Confira a vigência do contrato antes de retomar." | ❌ |
| CT-07 | Novas condições (preço, itens, periodicidade) criam uma nova versão, só em contrato ativo, valendo a partir da próxima geração. | `erpSalesContracts.ts` → `reviseSalesContract()` | "Somente contratos ativos podem receber novas condições." / "Inicie a nova versão na próxima geração, depois do início da versão atual." | ❌ |
| CT-08 | Ciclos, vendas e títulos já gerados permanecem quando o contrato é suspenso ou encerrado. | `changeSalesContractState()` | — | 🧪 |
| CT-09 | A geração cria as vendas dos ciclos até a data limite, no fuso da empresa (GE-01). | `erpSalesContracts.ts` → `generateContractSales()` | "Data limite inválida." | ❌ |

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
| CT-02 | Suspender só contrato ativo; retomar só pausado; encerrar ativo ou pausado. Encerrado não volta. | `regras/contratos.ts` → `validarAcaoContrato()` | "Esta ação não está disponível na situação atual do contrato." | ✅ `etapas-4-5.test.ts` (CT-02/03/06) · 🧪 suspender → retomar |
| CT-03 | Toda mudança de situação exige versão atual e motivo de 3 a 1000 caracteres, e fica no histórico do contrato. | `changeSalesContractState()` | "Informe a versão atual e um motivo de 3 a 1000 caracteres." | 🧪 |
| CT-04 | Alterar a situação exige permissão de gerenciar vendas. | `changeSalesContractState()` | "Seu perfil não permite alterar contratos." | ❌ |
| CT-05 | Ao retomar, os ciclos que venceram durante a suspensão **não são cobrados**; o calendário original é mantido. | `changeSalesContractState()` | — | 🧪 (sem ciclos vencidos no teste) |
| CT-06 | Não retoma contrato cuja vigência já terminou: encerre. | `regras/contratos.ts` → `validarVigenciaRetomada()` | "A vigência terminou. Encerre este contrato." / "Confira a vigência do contrato antes de retomar." | ✅ `etapas-4-5.test.ts` (CT-02/03/06) |
| CT-07 | Novas condições (preço, itens, periodicidade) criam uma nova versão, só em contrato ativo, valendo a partir da próxima geração. | `erpSalesContracts.ts` → `reviseSalesContract()` | "Somente contratos ativos podem receber novas condições." / "Inicie a nova versão na próxima geração, depois do início da versão atual." | ❌ |
| CT-08 | Ciclos, vendas e títulos já gerados permanecem quando o contrato é suspenso ou encerrado. | `changeSalesContractState()` | — | 🧪 |
| CT-09 | A geração cria as vendas dos ciclos até a data limite, no fuso da empresa (GE-01). | `erpSalesContracts.ts` → `generateContractSales()` | "Data limite inválida." | ❌ |
| CT-10 | Uma versão só passa a valer com pelo menos um item e com vigência dentro da vigência do contrato. | **`regras/contratos.ts` → `validarEfetivacaoVersao()`**, via `createSalesContract()` e `reviseSalesContract()` (antes no banco, BD-40) | "A versão precisa de pelo menos um item antes de valer." / "A vigência da versão precisa ficar dentro da vigência do contrato." | ✅ `regras/contratos.test.ts` |
| CT-11 | O contrato só fica ativo com uma versão valendo. | **`regras/contratos.ts` → `validarAtivacaoContrato()`**, via `createSalesContract()` (antes no banco, BD-40) | "O contrato só pode ficar ativo com uma versão valendo." | ✅ `regras/contratos.test.ts` |
| CT-12 | Ciclo só de contrato ativo, dentro da vigência da versão, com a duração da periodicidade e venda do cliente do contrato. Ciclo recusado é pulado na geração, com o motivo. | **`regras/contratos.ts` → `validarCicloContrato()`**, via `generateContractSales()` (antes no banco, BD-40) | "Só contrato ativo gera ciclos." / "O ciclo completo precisa caber na vigência…" / "A duração do ciclo não corresponde à periodicidade do contrato." | ✅ `regras/contratos.test.ts` |
| CT-13 | Garantias no banco: versão e itens que já valem não mudam; vigências e ciclos sem sobreposição; ciclos e tentativas preservados; venda em um só ciclo; condições do cabeçalho só por nova versão. | banco: `validar_contrato_versionado`, `validar_cabecalho_contrato` (etapa 7, mensagens reescritas) | "Já existe outra versão do contrato valendo nesse período." / "Este período do contrato já foi gerado." / … | — |

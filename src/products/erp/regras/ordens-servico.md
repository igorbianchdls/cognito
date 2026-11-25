# Ordens de serviço (OS)

Caminhos relativos a `src/products/erp/server/`. Legenda e camadas no [README](README.md).

## Ciclo de vida

```
rascunho / orcamento_pendente → aprovada → em_execucao → concluida
            ↘ cancelada (de qualquer situação antes de concluída)
Documentos gerados: OS → orçamento → venda, ou OS → venda direto
```

Tabela de transições: `erpProfessionalRepository.ts` → `serviceOrderTransitions`.

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| OS-01 | OS precisa de cliente existente e itens existentes (produto ou serviço) com descrição, quantidade e valor; desconto não passa do subtotal. | `erpProfessionalRepository.ts` → `createServiceOrder()` | "Cliente não encontrado." / "Item N não encontrado." / "Desconto supera o subtotal." | 🧪 |
| OS-02 | Só OS em rascunho e sem documento gerado é editável; versão antiga é recusada. | `createServiceOrder()` (também faz a edição) | "Somente ordens em rascunho e sem documento gerado podem ser editadas." / "Ordem alterada; recarregue os dados." | 🧪 |
| OS-03 | Transições permitidas: aprovar (de rascunho/orçamento pendente), iniciar (de aprovada), concluir (de em execução), cancelar (de qualquer uma antes de concluída). Fora disso, recusa. | `regras/ordens-servico.ts` → `proximaSituacaoOS()` | "Ação indisponível para a situação atual." | ✅ `etapas-4-5.test.ts` (OS-03) · 🧪 aprovar → iniciar → concluir |
| OS-04 | Cancelar exige motivo. Concluída não se cancela. | `runServiceOrderAction()`; chat: `schemas/actionContracts.ts` | "Ação indisponível para a situação atual." | ❌ |
| OS-05 | Mudar a situação da OS não mexe em estoque nem emite nota. | — | — | — |
| OS-06 | Converter (em orçamento ou venda) exige OS não cancelada, com pelo menos um item ativo, e que ainda não tenha gerado venda. Converter de novo reaproveita o documento já gerado. | `erpProfessionalRepository.ts` → `convertServiceOrder()` | "Ordem cancelada não pode ser convertida." / "Esta ordem já originou uma venda." / "A ordem precisa de pelo menos um item ativo." | 🧪 OS concluída → venda |
| OS-07 | Se a OS já tem orçamento, gerar a venda passa pelo orçamento, que precisa estar disponível (VD-01, VD-02). | `convertServiceOrder()` | "Orçamento vinculado indisponível." | ❌ |
| OS-08 | Uma OS fica vinculada a uma única venda. | `erpProfessionalRepository.ts` → `linkOrdersToSale()` | "A ordem já está vinculada a outra venda." | ❌ |
| OS-09 | Observações internas não aparecem no PDF público da OS. | `documents/` (geração do PDF) | — | ❌ |
| OS-10 | A OS guarda uma fotografia do cliente no rascunho; editar o cadastro depois não muda a OS sozinha. | `createServiceOrder()` (`cliente_snapshot`) | — | 🧪 |

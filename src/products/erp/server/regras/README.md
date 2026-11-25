# Regras de negócio do ERP

Catálogo das regras do ERP: o que cada uma diz, onde é aplicada hoje, a mensagem que o usuário vê e se tem teste.
Uma regra aparece **uma vez** aqui, mesmo que o código a repita em vários lugares — e a repetição fica anotada.

Esta pasta também vai receber o código das regras, aos poucos: `vendas.md` explica, `vendas.ts` (quando existir) implementa.
Enquanto uma regra não migra, a coluna **Onde** aponta para o lugar atual (repositório, trigger do banco, camada do chat).

## Arquivos

| Arquivo | Área | Situação |
|---|---|---|
| [geral.md](geral.md) | Regras que valem para todo o ERP: data da empresa, numeração, versão, idempotência, período fechado, empresa | catalogado |
| [vendas.md](vendas.md) | Orçamentos, vendas, crédito, descontos, entrega, cancelamento, devolução | catalogado |
| [contas-receber.md](contas-receber.md) | Títulos e parcelas a receber, baixas, estornos, previsões, crédito de devolução | catalogado |
| contas-pagar.md | Títulos e parcelas a pagar, recorrências, rateio | a fazer |
| compras.md | Cotação, confirmação, recebimento, devolução, cancelamento | a fazer |
| ordens-servico.md | Aprovar → iniciar → concluir → gerar orçamento/venda | a fazer |
| contratos.md | Recorrência, suspender/retomar/encerrar | a fazer |
| contas-bancarias.md | Contas, transferências, conciliação | a fazer |
| estoque.md | Reservas, saídas, ajustes, custo médio, locais | a fazer |
| notas-servico.md | NFS-e simulada: emissão, cancelamento, retenções | a fazer |
| contabilidade.md | Plano de contas, DRE, fechamentos | a fazer |
| cadastros.md | Clientes, fornecedores, produtos, serviços, exclusão com vínculos | a fazer |
| permissoes.md | Perfis, capacidades, quem pode o quê | a fazer |

## Como ler uma regra

| Coluna | Significado |
|---|---|
| **#** | Código da regra (`VD-07`, `CR-03`, `GE-01`). Use-o em commits, bugs e conversas. Nunca reaproveite um código. |
| **Regra** | O que vale, em português, do ponto de vista do negócio. |
| **Onde** | Onde a regra é aplicada hoje. `arquivo.ts` → `função()` para o servidor (caminhos relativos a `src/products/erp/server/`); `banco: tabela → trigger` para o banco; `chat:` para a camada do plugin (`src/products/mcpcore/domains/erp/`). |
| **Mensagem** | O que o usuário lê quando a regra recusa. |
| **Teste** | ✅ coberto (diz onde) · ❌ sem teste · 🧪 testado à mão no chat em 2026-11-24/25. |

As camadas, da mais externa para a mais interna:

1. **Tela** (`frontend/`) — só avisa antes de enviar; não é proteção. Não catalogamos validações só de tela.
2. **Chat** (`mcpcore/domains/erp/`) — formato dos dados e referências. A prévia executa a operação real e desfaz (`actions/execution.ts`), então as regras do servidor valem já na prévia.
3. **Servidor** (`server/`) — as regras de negócio. É onde elas devem morar.
4. **Banco** (schema `erp`) — proteção final: checks, triggers, RLS. Fica no banco mesmo depois da centralização.

## Pontos de atenção

Regras repetidas ou inconsistentes encontradas ao montar o catálogo. São as primeiras candidatas a migrar para esta pasta.

| Onde | O que há | Regras |
|---|---|---|
| Entrega de venda | Duas implementações: `erpStockRepository.ts` → `attendStockForSale()` (chat, entrega total) e `erpProfessionalRepository.ts` → `attendSaleItems()` (tela, entrega parcial). A do chat não atualizava os itens até 2026-11-25. | VD-30 a VD-33 |
| Baixa a receber × a pagar | `settleReceivableInstallment()` e `settlePayableInstallment()` são quase cópias (mesmas regras de saldo, conta, idempotência). | CR-10 a CR-17 |
| Parcelas somam o total | Conferido em `erpSalesRepository.ts` → `validateSaleInstallments()` e de novo em `createSaleRecord()`, além do contrato do chat. | VD-12 |
| Conflito de versão | Mesma situação com dois códigos e mensagens: `VERSION_CONFLICT` "Venda alterada; atualize antes de continuar." e `VALIDATION_ERROR` "CONFLITO_VERSAO: esta venda foi alterada por outra pessoa." | GE-04 |
| "Hoje" | Até 2026-11-25 a emissão individual de NFS-e usava a data UTC e o lote usava a da empresa. Corrigido; toda regra de data deve usar GE-01. | GE-01 |
| Textos | Várias mensagens sem acento ("invalido", "esta paga"). | — |

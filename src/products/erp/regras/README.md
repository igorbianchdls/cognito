# Regras de negócio do ERP

Catálogo das regras do ERP: o que cada uma diz, onde é aplicada hoje, a mensagem que o usuário vê e se tem teste.
Uma regra aparece **uma vez** aqui, mesmo que o código a repita em vários lugares — e a repetição fica anotada.

Esta pasta também vai receber o código das regras, aos poucos: `vendas.md` explica, `vendas.ts` (quando existir) implementa.
Enquanto uma regra não migra, a coluna **Onde** aponta para o lugar atual (repositório, trigger do banco, camada do chat).

## Arquivos

| Arquivo | Prefixo | Área |
|---|---|---|
| [geral.md](geral.md) | GE | Data da empresa, valores, numeração, versão, idempotência, período fechado, empresa, chat |
| [vendas.md](vendas.md) | VD | Orçamentos, vendas, crédito, descontos, entrega, cancelamento, devolução |
| [contas-receber.md](contas-receber.md) | CR | Títulos e parcelas a receber, baixas, estornos, previsões, crédito de devolução |
| [contas-pagar.md](contas-pagar.md) | CPG | Diferenças em relação a contas a receber, recorrência, rateio, classificação, comissões |
| [compras.md](compras.md) | CP | Cotação, confirmação, recebimento, devolução, cancelamento, NF-e de entrada |
| [ordens-servico.md](ordens-servico.md) | OS | Aprovar → iniciar → concluir → gerar orçamento/venda |
| [contratos.md](contratos.md) | CT | Recorrência, suspender/retomar/encerrar, novas versões |
| [contas-bancarias.md](contas-bancarias.md) | CB | Contas, transferências, formas de pagamento, cartões, extrato, conciliação |
| [estoque.md](estoque.md) | ES | Movimentos, reservas, ajustes, contagem, transferência entre locais, kits, unidades |
| [notas-servico.md](notas-servico.md) | NS | NFS-e simulada: rascunho, emissão (DPS), cancelamento, lote |
| [contabilidade.md](contabilidade.md) | CO | Categorias financeiras, DRE, plano de contas, fechamento, orçamento anual, metas |
| [cadastros.md](cadastros.md) | CD | Pessoas e papéis, produtos, serviços, categorias de cadastro, tabelas de preço, exclusão |
| [permissoes.md](permissoes.md) | PE | Papéis, perfis, capacidades, tabela de perfis padrão |
| [banco.md](banco.md) | BD | O que o banco impõe sozinho (triggers, checks, RLS): o que fica e o que deve sair para o servidor |

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
| "Hoje" | Até 2026-11-25 a emissão individual de NFS-e usava a data UTC e o lote usava a da empresa. Corrigido; toda regra de data deve usar GE-01. | GE-01, NS-15 |
| Data no estoque | Movimentos de estoque só aceitam o dia atual, mas a ferramenta do chat `movimentar_estoque` aceita `data`. | ES-04 |
| Mensagens diferentes, mesma regra | Entrega: "Apenas venda confirmada pode ser atendida." (chat) × "Venda precisa estar confirmada e pendente para atender." (tela). | ES-11 |
| Efetivar previsão | A pagar grava `efetivado_em`; a receber não. | CR-09 |
| Sem trava | Título manual duplicando venda (CR-03); transferência deixando conta negativa (CB-10); receber compra ainda em rascunho (CP-20); cancelar compra já recebida (CP-31). Decidir se são desejados. | CR-03, CB-10, CP-20, CP-31 |
| Perfis | Vendas e Compras criam cadastros mas não excluem; Vendas não vê o financeiro do cliente; Compras não recebe mercadoria. | PE, CD-31 |
| Textos | Várias mensagens sem acento ("invalido", "esta paga", "esta fechado"). | — |

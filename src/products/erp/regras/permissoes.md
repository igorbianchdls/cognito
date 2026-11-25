# Permissões (PE)

Quem pode fazer o quê no ERP. Caminhos relativos a `src/products/erp/server/` salvo indicação. Legenda no [README](README.md).

## Como funciona

- Cada pessoa tem, em cada empresa, um **papel** (`owner`, `admin`, `member`, `viewer`) e um **perfil de acesso**.
- O perfil é uma lista de **capacidades** (`erp.vendas.gerenciar`, `erp.financeiro.baixar`…).
- A checagem acontece em três lugares: servidor (`erpAccess.ts` → `resolveErpAccess()`), banco (`shared.has_erp_capability()` + RLS) e chat (`mcpcore/domains/erp/schemas/actionContracts.ts` → `proposalCapabilities()`, conferido de novo na confirmação).

## Regras

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| PE-01 | Dono e administrador têm todas as capacidades, independente do perfil. | `src/products/auth/server/accessPolicy.ts` → `effectiveCapabilities()`; banco: `has_erp_capability()` | — | 🧪 |
| PE-02 | Papel "viewer" só fica com as capacidades de **visualizar** do perfil, mesmo que o perfil tenha mais. | `effectiveCapabilities()`; banco: `has_erp_capability()` | — | ❌ |
| PE-03 | Sem perfil definido: dono/administrador = Administrador; demais = Consulta. | `erpAccess.ts` → `resolveErpSession()` | — | ❌ |
| PE-04 | Vínculo suspenso, empresa ou usuário inativos não acessam nada. | banco: `shared.is_tenant_member()` | "Vínculo com a empresa revogado." | ❌ |
| PE-05 | Pelo chat, a permissão é conferida na prévia **e de novo na confirmação** (permissão revogada no meio é recusada). | `mcpcore/domains/erp/actions/approvalRepository.ts` → `assertCurrentAccess()` | "Permissão revogada." | ❌ |
| PE-06 | Ações com mais de uma área exigem todas as capacidades: devolução de compra (compras + financeiro + estoque), receber compra (compras + estoque), excluir cadastro (consulta de todas as áreas), liberar crédito (financeiro). | CP-42, CD-31, VD-23; chat: `proposalCapabilities()` | "… exige permissão de …" | 🧪 |

## Perfis padrão

Capacidades sem o prefixo `erp.`. Fonte: `shared.permissoes_perfil` (banco).

| Capacidade | Administrador | Financeiro | Vendas | Compras | Estoque | Contador | Consulta |
|---|---|---|---|---|---|---|---|
| vendas.visualizar | ✅ | ✅ | ✅ | | | ✅ | ✅ |
| vendas.gerenciar | ✅ | | ✅ | | | | |
| compras.visualizar | ✅ | ✅ | | ✅ | | ✅ | ✅ |
| compras.gerenciar | ✅ | | | ✅ | | | |
| financeiro.visualizar | ✅ | ✅ | | | | ✅ | ✅ |
| financeiro.gerenciar | ✅ | ✅ | | | | | |
| financeiro.baixar | ✅ | ✅ | | | | | |
| financeiro.estornar | ✅ | ✅ | | | | | |
| estoque.visualizar | ✅ | | | ✅ | ✅ | | ✅ |
| estoque.movimentar | ✅ | | | | ✅ | | |
| estoque.ajustar | ✅ | | | | ✅ | | |
| cadastros.visualizar | ✅ | | ✅ | ✅ | ✅ | ✅ | ✅ |
| cadastros.gerenciar | ✅ | | ✅ | ✅ | | | |
| relatorios.visualizar | ✅ | ✅ | | | | ✅ | ✅ |
| configuracoes.gerenciar | ✅ | | | | | | |

## Pontos de atenção

- **Vendas e Compras criam cadastros, mas não conseguem excluir nenhum**: CD-31 exige consulta de vendas, compras, financeiro e estoque, e esses perfis não têm todas.
- **Vendas não vê o financeiro**: o vendedor não consegue consultar se o cliente está devendo antes de vender; o limite de crédito (VD-22) barra na confirmação sem mostrar os títulos.
- **Compras não recebe mercadoria**: receber compra exige `estoque.movimentar`, que o perfil Compras não tem.

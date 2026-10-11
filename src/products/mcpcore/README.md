# mcpcore — núcleo compartilhado dos chats

Código comum aos produtos de chat do Cognito ERP (`chatgptplugin` e, a seguir, `claudeplugin`). Não é um produto: não tem rota, manifesto nem extensões de um chat específico. Cada produto monta a sua `PluginConfig` e registra as tools no seu servidor MCP.

| Pasta | Responsabilidade |
| --- | --- |
| `shared` | `PluginConfig` / `PluginIntegration`, contratos (`PluginPrincipal`, `PluginError`), pool do schema `plugin` |
| `auth` | Verificação do token OAuth do Clerk e carga do usuário e empresas (`resolvePrincipal`) |
| `tools` | Consultas (`catalog.ts`), contratos de saída (`outputs.ts`), descrições centralizadas (`descriptions.ts`) e contexto dos parâmetros (`inputDocumentation.ts`) |
| `actions` | 34 tools de escrita em duas etapas, contratos das propostas, rascunhos, referências, operações e rótulos |
| `approvals` | `decideDraft`: confirmação transacional (usada pelo chat e pela página de revisão do ERP) |
| `application` | `executeTool` (validação, empresa, permissões, prazo, auditoria), preferências e manutenção |
| `audit` | Execuções e limite de pedidos por minuto |
| `ui` | Cards MCP Apps: ponte, estilos, componentes e telas (`renderCardsHtml({name, version, host})`; `host: 'claude'` aplica as regras de UI do Claude) |

## Integração

`PluginConfig.integration` (`'chatgpt' | 'claude'`) separa no schema `plugin` os rascunhos, execuções, limites e preferências de cada chat. Um rascunho preparado em um chat não é encontrado nem executado pelo outro, e a chave de idempotência no ERP usa o prefixo do chat (`chatgptplugin:<rascunho>`, `claudeplugin:<rascunho>`).

## Descrições para agentes

`tools/descriptions.ts` contém o texto das 59 ferramentas do ChatGPT: 20 consultas, 34 ações e 5 ferramentas de acesso/painel/extensões. O catálogo de ações acrescenta a instrução comum de prévia e confirmação. Atualização de preferências é imediata e não segue essa aprovação de negócio.

`tools/inputDocumentation.ts` acrescenta explicações aos esquemas existentes, preservando validações, defaults e refinamentos. Novos parâmetros precisam de descrição específica ou entrada no mapa; os campos de preferências ficam em `application/preferences.ts`. `tools/outputs.ts` explica os campos retornados, paginação, truncamento, IDs e links temporários. Texto deve refletir a implementação: não anunciar recebimento de compra, transferência bancária ou emissão fiscal real quando não disponíveis.

Verificação local, sem acesso ao banco: `node --import tsx scripts/chatgptplugin-tool-documentation-smoke.ts`. Confere descrições/parâmetros nos dois protocolos, permissões publicadas e preservação das validações. As consultas e ações reais são verificadas por `scripts/chatgptplugin-all-tools-smoke.ts`, que exige empresa/usuário e reverte a transação de teste. Revisão e resultados: `docs/avaliacao-erp/descricoes-tools-20261011.md`.

## O que fica fora

Protocolo e registro do servidor MCP, extensões de um chat (formulário nativo, configurações e menções da OpenAI), metadados do recurso protegido, URI e `_meta` dos cards, manifesto e skills: tudo isso pertence ao produto.

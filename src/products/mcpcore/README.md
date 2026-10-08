# mcpcore — núcleo compartilhado dos chats

Código comum aos produtos de chat do Cognito ERP (`chatgptplugin` e, a seguir, `claudeplugin`). Não é um produto: não tem rota, manifesto nem extensões de um chat específico. Cada produto monta a sua `PluginConfig` e registra as tools no seu servidor MCP.

| Pasta | Responsabilidade |
| --- | --- |
| `shared` | `PluginConfig` / `PluginIntegration`, contratos (`PluginPrincipal`, `PluginError`), pool do schema `plugin` |
| `auth` | Verificação do token OAuth do Clerk e carga do usuário e empresas (`resolvePrincipal`) |
| `tools` | Consultas (`catalog.ts`) e contratos de saída (`outputs.ts`) |
| `actions` | 20 tools de escrita em duas etapas, contratos das propostas, rascunhos, referências, operações e rótulos |
| `approvals` | `decideDraft`: confirmação transacional (usada pelo chat e pela página de revisão do ERP) |
| `application` | `executeTool` (validação, empresa, permissões, prazo, auditoria), preferências e manutenção |
| `audit` | Execuções e limite de pedidos por minuto |
| `ui` | Cards MCP Apps: ponte, estilos, componentes e telas (`renderCardsHtml({name, version, host})`; `host: 'claude'` aplica as regras de UI do Claude) |

## Integração

`PluginConfig.integration` (`'chatgpt' | 'claude'`) separa no schema `plugin` os rascunhos, execuções, limites e preferências de cada chat. Um rascunho preparado em um chat não é encontrado nem executado pelo outro, e a chave de idempotência no ERP usa o prefixo do chat (`chatgptplugin:<rascunho>`, `claudeplugin:<rascunho>`).

## O que fica fora

Protocolo e registro do servidor MCP, extensões de um chat (formulário nativo, configurações e menções da OpenAI), metadados do recurso protegido, URI e `_meta` dos cards, manifesto e skills: tudo isso pertence ao produto.

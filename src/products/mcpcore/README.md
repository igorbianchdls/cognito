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

## Cards de exclusão

As operações `excluir_*` usam revisão com identificação do registro, situação, resumo e motivo obrigatório. O resumo é capturado pelo servidor no rascunho; data e participante fazem parte do estado conferido na confirmação. Alterar o motivo exige atualizar a prévia e confirmar novamente. As regras do ERP (permissões, vínculos, período e documento em rascunho) continuam sendo revalidadas na transação.

“Manter registro” encerra somente a revisão local, sem solicitar exclusão nem cancelar o rascunho no servidor. “Excluir” bloqueia cliques repetidos e mostra sucesso apenas com execução `saved`, ID do alvo e identificação da proposta correspondentes. O resultado usa o resumo da operação confirmada, sem tentar consultar o registro já excluído. A exclusão é lógica e preserva o histórico; NFS-e mantém o aviso de simulação e não representa cancelamento na prefeitura. Resposta incerta bloqueia nova tentativa automática; prévia expirada ou alterada exige nova revisão.

`pnpm chatgptplugin:deletion-smoke` verifica resumo, troca de motivo, confirmação, recusa, expiração, respostas incertas, navegação e temas em navegador local, sem excluir dados reais. Capturas em `.cache/chatgptplugin-deletion/`.

## Cards de edição

As 14 operações `editar_*` compartilham revisão antes/depois, campos adequados a cada tipo e navegação local de até 5 alterações por página. A comparação usa valores canônicos capturados pelo servidor, incluindo contatos, preços, parcelas e referências da mesma empresa. Campos sem valor anterior conhecido são identificados como indisponíveis, não como vazios. Alterar um campo exige atualizar a prévia e confirmar novamente; nenhum ajuste é aplicado com o rascunho anterior. Cancelar encerra somente a revisão local.

A confirmação mantém permissões, versão, período e regras do ERP. Na mesma transação, o servidor lê novamente os campos salvos e guarda o resultado junto à prévia original. O card de sucesso compara o antes com esse resultado, nunca apresenta a proposta como se já estivesse salva, nem repete a escrita para carregar o resumo. Divergência ou falta de conferência recebe aviso, sem sucesso verde indevido. Documentos completos mostram os efeitos de recálculo/reorganização; orçamentos explicam a reabertura da aprovação e NFS-e conserva o aviso de simulação.

`pnpm chatgptplugin:update-smoke` verifica tipos de registro, comparação, confirmação, ausência de mudanças, ajustes entre páginas, erros, resultados divergentes, temas e Claude, sem alterações em um ERP real. Capturas em `.cache/chatgptplugin-update/`; `CHATGPTPLUGIN_SKIP_SCREENSHOTS=1` permite validar sem gravar imagens.

## O que fica fora

Protocolo e registro do servidor MCP, extensões de um chat (formulário nativo, configurações e menções da OpenAI), metadados do recurso protegido, URI e `_meta` dos cards, manifesto e skills: tudo isso pertence ao produto.

# mcpcore — núcleo compartilhado dos chats

## Conciliação, classificação e NFS-e em lote

Antes de publicar esta versão, aplique `supabase/migrations/20261020150000_erp_chat_workflows.sql` pelo processo de migrações do projeto. A migração cria apenas o controle privado em `plugin.erp_workflows`; não altera documentos existentes nem executa emissões. Sem ela, as tools explicam que falta provisionamento. Atualize o catálogo da conexão após o deploy.

As seis tools `consultar_conciliacoes`, `conciliar_movimentacao`, `consultar_classificacao_despesas`, `classificar_despesas`, `consultar_operacao_fluxo` e `emitir_notas_lote` compartilham os cards do ChatGPT/Claude. Conciliação usa os pagamentos/repasses existentes e o serviço gerencial do ERP; rejeitar a sugestão é local. Classificação altera somente a categoria de títulos manuais sem rateios, preservando parcelas e pagamentos e verificando os períodos destes movimentos. O grupo DRE vem da categoria, nunca é alterado globalmente. A consulta inicialmente mostra a classificação cadastral; sugestões do modelo são opcionais e validadas contra as categorias autorizadas, sem atribuir dados cadastrais à IA.

Notas: vendas confirmadas/faturadas exclusivamente de serviços, sem nota enviada/finalizada, até 50 vendas selecionadas. Rascunho/falha existente é reutilizado quando único. Novos rascunhos usam itens e total exatos da venda, município e alíquota cadastrados, com revisão explícita; ajustes não representáveis e dados fiscais ausentes exigem revisão individual. Toda emissão permanece simulada, sem validade fiscal, reutilizando validações, estornos, retenções e auditoria do ERP. Não há conexão com prefeitura/provedor real nova.

Cada operação tem prévia de 30 minutos, escopo de usuário/empresa/cliente OAuth/host e chave idempotente. A confirmação grava a autorização do snapshot; cada item revalida estado e permissões atuais sob locks. A alteração ERP e o resultado desse item são confirmados na mesma transação, independentes dos outros itens. Até 5 itens são executados por chamada; o card continua somente itens já aprovados. Não depende de processo em memória ou tarefa em background: interromper fecha a UI, não perde resultados persistidos; a consulta recupera o estado e a continuação autorizada. Itens concluídos, falhos, aguardando retorno ou incertos não são reenviados automaticamente. Nova tentativa de falha exige revisão e nova prévia; incerteza exige investigação/consulta. Erros de infraestrutura não são apresentados como falha comercial definitiva.

Listas mostram 5 por página, localmente abaixo de 40 resultados e por novas consultas a partir de 40. Seleção/categorias são preservadas entre páginas e limitadas a 50 itens. Resultado parcial tem aviso, quantidade concluída, totais separados, motivo e revisão individual, sem sucesso verde global. Claude inline é compacto e os controles completos ficam em tela cheia. `pnpm chatgptplugin:workflows-smoke` usa banco em memória e navegador local; não altera dados reais.

## Dashboard interativo

`consultar_dashboard` é uma consulta somente leitura da Visão geral do ERP, compartilhada por ChatGPT e Claude. Sem `detalhes`, retorna um snapshot em transação `REPEATABLE READ READ ONLY`: os mesmos indicadores do ERP mais as seções financeiro/resultados já consultadas nessa composição, sem repetir consultas por aba. Não altera `resumo_erp`. Áreas sem permissão são omitidas; não são convertidas em zero.

O período padrão são os últimos 30 dias inclusivos, no fuso da empresa. Também há últimos 7 dias, mês atual até hoje, mês passado e personalizado (ambas as datas, até 366 dias). Comparação e inclusão de previsões são explícitas. Posição atual, compromissos por vencimento, caixa realizado com adiantamentos e resultado sem adiantamentos/transferências permanecem distintos, com notas do ERP. Despesas mostram os pagamentos líquidos de estornos e até 8 categorias; o total vem do agregado completo, nunca da soma do ranking.

O card oferece indicadores, alertas, gráficos semanais (mensais em intervalos longos), projeção e abas locais. Alterar período/opções ou atualizar consulta novamente o servidor; trocar abas e navegar rankings não. Alertas e linhas preservam o link exato de detalhamento do ERP em `detalhes: { painel, filtros }`, revalidado pelo servidor a cada chamada, com 5 registros por página. No Claude inline, há até 4 indicadores e acesso à versão completa em tela cheia. Interface com tema claro/escuro, teclado e layout móvel.

`pnpm chatgptplugin:dashboard-smoke` testa períodos, composição, permissões, isolamento, despesas com rateios/estornos em PostgreSQL local em memória e navegação visual em navegador local. Não usa dados nem executa escritas no ERP real.

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

## Listas e detalhes comerciais

Vendas, orçamentos e compras compartilham listas com identificação curta, cliente/fornecedor, data, valor, seta de detalhes e badges com texto e fundo coloridos conforme o tema. A seleção e a paginação existentes são preservadas: cinco registros por página, navegação local abaixo de 40 e novas consultas a partir de 40.

Os detalhes usam seções de informações gerais, participante, itens, financeiro e observações. Itens e parcelas previstas são paginados localmente de cinco em cinco, respeitando os indicadores de truncamento: a UI não apresenta o conjunto carregado como completo. Parcelas previstas e situação comercial não comprovam pagamento. O nome da empresa só é aproveitado quando já disponível no contexto; não há chamada extra de descoberta para preencher o card. Retornar à lista preserva página e filtros, e ações de negócio continuam gerando prévia antes de executar. `chatgptplugin:commercial-ui-smoke` verifica o layout e as interações em navegador com dados simulados.

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

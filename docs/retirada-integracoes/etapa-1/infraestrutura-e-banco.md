# Recursos declarados e plano de conferência externa

Este documento é inventário do repositório. Nenhum comando de consulta ou alteração de nuvem/banco foi executado na etapa 1.

## Infraestrutura declarada

Fontes principais: `src/products/integracoes/datawarehouse/config/gcpConfig.ts`, `cloud/deploy/*.yaml`, `cloud/GCP_RUNBOOK.md`, `cloud/src/control-api/routes/`, `datawarehouse/provisioning/`.

| Recurso declarado | Destino na etapa 6 | Dependência a conferir |
|---|---|---|
| Projeto padrão `creatto-463117`, região `southamerica-east1` | Preservar projeto; remover apenas recursos exclusivos | Outros produtos podem usar o mesmo projeto. |
| Cloud Run `integrations-control-api` | Desativar/remover | Scheduler, URLs OAuth, chamadas internas e versões antigas da aplicação. |
| Worker job `integrations-worker` e serviço `integrations-worker-service` | Desativar/remover | Mensagens pendentes, assinatura push e processamentos em andamento. |
| Artifact Registry `integrations` e builds da plataforma | Remover exclusivos | Identificar imagens, triggers e permissões efetivamente usados. |
| Tópicos `integrations-sync-requests`, `integrations-sync-dead-letter` | Remover | Parar produtores antes; verificar mensagens e assinaturas. |
| Assinatura `integrations-sync-worker-sub` | Remover | Desativar push antes de desligar worker. |
| Scheduler/OIDC para `/scheduled-sync` e dispatch outbox | Parar e remover exclusivos | Nomes reais dos jobs não foram enumerados; endpoints estão declarados. |
| Datasets padrão `integrations_custom_raw`, `integrations_fivetran_raw`, `integrations_normalized` | Remover | Há naming/provisionamento por tenant/organização: não limitar busca aos três nomes padrão. |
| Secret Manager `integrations-internal-api-key`, prefixo `integrations` e segredos OAuth | Remover exclusivos | Não copiar valores; conferir consumidores e credenciais do provedor. |
| Contas `integrations-control-api`, `integrations-worker` e contas auxiliares mencionadas no runbook | Retirar permissões/remover se exclusivas | Conferir bindings, invokers de Pub/Sub/Scheduler, deployer e referências fora da plataforma. |
| Segredo `supabase-db-url` | Preservar enquanto compartilhado | É referenciado pelo deploy antigo, mas o ERP também precisa de acesso ao Supabase. |
| Variáveis de Vercel/GCP e credenciais locais exclusivas | Retirar depois da publicação independente | Usar inventário de nomes; conferir ambiente real sem exibir valores. |
| Cron Vercel `/api/erp/internal/automacoes` | Preservar | Automação do ERP; não pertence à plataforma removida. |

Ordem operacional: publicar aplicação desacoplada; parar agendamentos/produtores; encerrar processamento e push; desligar serviços; retirar datasets/filas; retirar credenciais/permissões exclusivas; conferir ausência de chamadas e recursos esquecidos.

## Banco: três gerações de estruturas

1. `plugin.connectors` e `plugin.connector_sync_runs`: definidos em `scripts/sql/21_plugin_connectors.sql`; ainda consultados pela ferramenta `connectors` em `plugin/server/appTools.ts`.
2. `plugin.integration_*`: estruturas históricas de conexão, destino, pipeline, permissões, execuções, cursores, eventos e capacidades, originadas em scripts 27–36.
3. `integrations.*`: provedores, contas conectadas, conexões, destinos, pipelines, permissões/auditoria, execuções, cursores, eventos e outbox, definidos e alterados nos scripts 37–51 pertinentes.

A migração `42_rename_mcp_app_to_plugin.sql` também cria dinamicamente views `mcp_app.*` apontando para `plugin.*`, além de aliases de permissões/auditoria. Essa geração dinâmica não é totalmente enumerada pelo extrator de nomes em `objetos-banco.md`. Incluir na conferência:

- `mcp_app.connectors`, `mcp_app.connector_sync_runs`.
- `mcp_app.integration_connections`, `integration_destinations`, `integration_pipelines`, `integration_plugin_permissions`, `integration_sync_runs`, `integration_sync_cursors`, `integration_provider_capabilities`, `integration_events` e alias `integration_mcp_permissions`.
- `integrations.mcp_permissions`, `integrations.mcp_action_audit` e nomes antigos eventualmente renomeados.

Não retirar views `mcp_app.alerts`, `schedules`, `action_runs`, `alert_runs` ou `schedule_runs` apenas por compartilharem o schema. A existência real deve ser confirmada no catálogo.

## Procedimento para a etapa 6

- Consultar catálogos em modo leitura: tabelas, views, dependências, FKs, funções, triggers, grants e agendamentos.
- Confirmar quais estruturas históricas ainda existem e quais foram renomeadas.
- Confirmar ausência de consumidores nas versões implantadas e nos jobs antes da retirada.
- Definir tratamento de eventuais dados de desenvolvimento e artifacts salvos; não assumir banco vazio porque não há clientes.
- Criar migração explícita, removendo dependências exclusivas antes dos objetos base, sem `DROP ... CASCADE` indiscriminado.
- Preservar migrações 42/43/50 e demais arquivos históricos mistos; elas também tratam identidade, aliases e artifacts.
- Validar aplicação em banco existente e instalação desde a sequência histórica até a nova migração.

Critério final: nenhuma dependência operacional da plataforma antiga; schemas e dados mantidos acessíveis com o mesmo isolamento por empresa.

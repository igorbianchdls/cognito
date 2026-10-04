# Schema plugin no Supabase

Aplicação concluída em 03/10/2026 no projeto `mtadnxqoqxzbdksktwdr`.

## Estrutura criada

- `plugin.executions`: auditoria de ferramentas e decisões humanas.
- `plugin.rate_windows`: controle de frequência por usuário e integração.
- `plugin.drafts`: propostas vinculadas à empresa, usuário, integração e cliente OAuth.
- `plugin.settings`: preferências por usuário, integração e cliente OAuth.

Todas as tabelas têm RLS. O schema e as tabelas negam acesso a `PUBLIC`, `anon` e `authenticated`; `service_role` tem acesso concedido. O backend filtra explicitamente a integração `chatgpt` nas consultas e decisões do produto atual. A coluna `integration` admite `chatgpt` e `claude`; a integração com Claude ainda será implementada.

Os vínculos de identidade usam `shared.users` e `shared.tenants`. Os schemas `shared` e `erp` permanecem disponíveis.

## Arquivamento e retirada

Antes da exclusão, as três tabelas foram bloqueadas durante a transação. Os registros e metadados foram guardados no arquivo local privado:

`.cache/database-backups/retired-ai-2026-10-03T22-06-59-124Z.json`

O arquivo fica fora do Git e deve ser preservado. Ele contém os registros completos como textos JSON e os metadados de colunas, restrições, índices, políticas e triggers das tabelas retiradas.

SHA-256: `7ae07c5eefb973c7960fc5d492b085e126837d61dc346f50f2836ac1c747e209`.

| Tabela retirada | Registros arquivados |
| --- | ---: |
| `shared.ai_action_approvals` | 1 |
| `shared.ai_tool_executions` | 3 |
| `shared.ai_connections` | 0 |

O arquivo foi gravado, sincronizado e conferido antes da retirada. As cinco migrações, de `20261003120000` a `20261003160000`, foram aplicadas e registradas em `supabase_migrations.schema_migrations` em uma única transação. A exclusão usou `RESTRICT`, sem remover dependências externas por cascata. Nenhuma tabela `shared.chatgptplugin_*` permanece.

## Verificação

- 17 grupos locais de banco: consultas, auditoria, isolamento, propostas, aprovação, rollback e separação entre integrações.
- 32 grupos do protocolo e checagem de tipos aprovados.
- Estrutura e permissões conferidas antes do commit.
- Nova conexão ao Supabase após o commit: cinco grupos aprovados, verificando estrutura/RLS, exclusões, bloqueio de leitura pelos papéis do navegador, separação de propostas/preferências entre ChatGPT e Claude e rollback dos registros temporários.

A validação remota não alterou dados operacionais do ERP. OAuth, instalação no ChatGPT e concorrência funcional entre duas conexões PostgreSQL ainda precisam ser validados nas próximas etapas.

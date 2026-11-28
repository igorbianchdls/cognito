# Ferramentas do Drive e do Analytics

`drive_` (12) e `analytics_` (20) no ChatGPT e no Claude, registradas por `mcp/registerWorkspaceTools.ts` e executadas por `executeTool.ts`.

- **Como a pessoa:** cada chamada roda com o papel `authenticated` e as claims do Clerk da empresa escolhida (`editor/server/database.ts`). Valem as políticas dos schemas `drive` e `analytics`: quem só visualiza consulta e não altera; outra empresa não aparece.
- **Drive** (`domains/drive/tools/catalog.ts`): listar, buscar, ver com link temporário, recentes e favoritos, uso; criar drive e pasta, trazer de link (até 50 MB), organizar em lote, lixeira e esvaziar (apaga os arquivos do bucket `drive` depois das linhas, na mesma transação).
- **Analytics** (`domains/analytics/tools/catalog.ts`): consultas ao Postgres (`analytics.events_people`) montadas por `server/queries.ts`, mais funil e insights salvos pelo motor do produto (`products/analytics/server/motor.ts`), a partir de campos, medidas e operadores fixos, com valores sempre como parâmetros e nomes de propriedade validados; toda consulta filtra a propriedade lida antes no Supabase (da empresa da pessoa) e um período. Criação: sites, código de eventos, links com UTM, metas (`analytics.goals`) e definições de eventos (`analytics.event_definitions`).
- **Confirmação:** lixeira, esvaziar e excluir meta exigem `confirmado: true`; no Claude toda escrita pede permissão.

Testes: `pnpm workspace:db-smoke` com um Postgres local preparado (stubs do Supabase e migrações editor, drive e analytics); Storage e downloads são simulados; as consultas do Analytics rodam sobre eventos de verdade. A documentação das ferramentas é conferida no CI (`chatgptplugin:tool-documentation-smoke`).

# Cleanup Inventory

Este inventario orienta a limpeza do codigo para o novo foco do SaaS:
ChatGPT App, Claude MCP App, tools MCP, artifacts e integracoes.

## Nucleo ativo

- `src/products/mcp-apps`: tools, schemas, widgets, renderizacao interativa e handlers compartilhados.
- `src/products/chatgpt-app`: adaptador ChatGPT App, OAuth, metadata, MCP endpoint e embed token.
- `src/products/claude-app`: adaptador Claude MCP App, OAuth, metadata e MCP endpoint.
- `src/products/artifacts`: backend, contracts, templates, renderers e paginas publicas usadas por `open_artifact` e `artifact_authoring`.
- `src/products/integracoes`: UI propria principal para conectar e administrar fontes.
- `src/app/.well-known`: discovery dos hosts externos.
- `src/app/api/chatgpt-app`, `src/app/api/claude-app`, `src/app/api/integracoes`, `src/app/api/artifacts`: APIs que continuam ativas.
- `src/app/artifacts`: rotas publicas de dashboards, reports e slides.
- `src/app/internal/mcp-ui`: galeria interna para validar as UIs das tools.

## Fases executadas

- Fase 1: inventario inicial, home redirecionando para `/integracoes` e metadata global atualizada.
- Fase 2: galeria MCP UI migrada de `/bigquery-test/mcp-ui` para `/internal/mcp-ui`.
- Fase 3: playgrounds e testes antigos removidos de `bigquery-test`, APIs experimentais relacionadas e scripts de streaming/sandbox.
- Fase 4: chat proprio, agentes/sandbox, builders antigos, Nexus, apps demo e stores/tipos associados removidos.

## Rotas candidatas a remocao

- `src/app/dashboard`, `src/app/report`, `src/app/slide`: workspaces antigos, revisar apos confirmar que embeds publicos de artifacts nao dependem deles.
- `src/app/api/agent-tools`: REST tools antigas substituidas por MCP tools, revisar na fase 6.
- `src/app/api/bigquery`, `src/app/api/execute-sql`, `src/app/api/sql`: revisar na fase 6 conforme uso real por MCP/integracoes.

## Modulos candidatos a remocao

- `src/products/bi`: manter temporariamente apenas o que ainda for usado pelos renderers de artifacts; depois mover o minimo necessario para `src/products/artifacts`.

## Dependencias candidatas a remocao futura

- BigQuery direto: `@google-cloud/bigquery`, caso os dados passem apenas por conectores/MCP/Supabase.
- Playgrounds: `handsontable`, `@handsontable/react-wrapper`, `assemblyai`, `@openai/codex`, `@openai/codex-sdk`.
- Builders antigos: `ag-grid*`, `ag-charts*`, `@univerjs/*`, `@platejs/*`, `platejs`, `reactflow`, `@nivo/*`.
- Agentes/sandbox antigos: `@vercel/sandbox`, `@anthropic-ai/claude-code`, `agentmail`, `agentset`.

## Validacao minima por fase

- `pnpm exec tsc --noEmit`
- `pnpm mcp-apps:smoke`
- abrir `/integracoes`
- abrir `/internal/mcp-ui`
- confirmar que `/artifacts/dashboards`, `/api/artifacts/dashboards`, `open_artifact` e `artifact_authoring` seguem funcionando.

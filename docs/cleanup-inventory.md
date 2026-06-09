# Cleanup Inventory

Este inventario orienta a limpeza do codigo para o novo foco do SaaS:
ChatGPT App, Claude App, Plugin, tools MCP, artifacts e integracoes.

## Nucleo ativo

- `src/products/plugin`: tools, schemas, widgets, renderizacao interativa e handlers compartilhados.
- `src/products/chatgpt-app`: adaptador ChatGPT App, OAuth, metadata, MCP endpoint e embed token.
- `src/products/claude-app`: adaptador Claude App, OAuth, metadata e MCP endpoint.
- `src/products/artifacts`: backend, contracts, templates, renderers e paginas publicas usadas por `open_artifact` e `artifact_authoring`.
- `src/products/integracoes`: UI propria principal para conectar e administrar fontes.
- `src/app/.well-known`: discovery dos hosts externos.
- `src/app/api/chatgpt-app`, `src/app/api/claude-app`, `src/app/api/integracoes`, `src/app/api/artifacts`: APIs que continuam ativas.
- `src/app/artifacts`: rotas publicas de dashboards.
- `src/app/internal/mcp-ui`: galeria interna para validar as UIs das tools.

## Fases executadas

- Fase 1: inventario inicial, home redirecionando para `/integracoes` e metadata global atualizada.
- Fase 2: galeria MCP UI migrada de `/bigquery-test/mcp-ui` para `/internal/mcp-ui`.
- Fase 3: playgrounds e testes antigos removidos de `bigquery-test`, APIs experimentais relacionadas e scripts de streaming/sandbox.
- Fase 4: chat proprio, agentes/sandbox, builders antigos, Nexus, apps demo e stores/tipos associados removidos.
- Fase 5: artifacts consolidados como viewer/renderer; workspaces antigos diretos e módulos BI sem uso removidos.
- Fase 6: REST tools antigas e APIs diretas substituidas por MCP removidas.

## Rotas candidatas a remocao restante

- Nenhuma rota antiga das fases 3 a 6 deve permanecer ativa.
- Revisar apenas rotas auxiliares fora do foco Plugin se voltarem a aparecer no inventario.

## Modulos candidatos a remocao restante

- `src/products/bi/json-render`: ainda e usado pelos renderers de dashboard; mover para `src/products/artifacts` em uma refatoracao dedicada se quiser eliminar o namespace `bi`.

## Dependencias candidatas a remocao futura

- BigQuery direto: `@google-cloud/bigquery`, caso os dados passem apenas por conectores/MCP/Supabase.
- Playgrounds: `handsontable`, `@handsontable/react-wrapper`, `assemblyai`, `@openai/codex`, `@openai/codex-sdk`.
- Builders antigos: `ag-grid*`, `ag-charts*`, `@univerjs/*`, `@platejs/*`, `platejs`, `reactflow`, `@nivo/*`.
- Agentes/sandbox antigos: `@vercel/sandbox`, `@anthropic-ai/claude-code`, `agentmail`, `agentset`.

## Validacao minima por fase

- `pnpm exec tsc --noEmit`
- `pnpm plugin:smoke`
- abrir `/integracoes`
- abrir `/internal/mcp-ui`
- confirmar que `/artifacts/dashboards`, `/api/artifacts/dashboards`, `open_artifact` e `artifact_authoring` seguem funcionando.

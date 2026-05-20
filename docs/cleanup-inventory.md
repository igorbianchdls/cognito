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

## Rotas candidatas a remocao

- `src/app/bigquery-test`: playgrounds antigos; a galeria MCP UI foi migrada para `src/app/internal/mcp-ui`.
- `src/app/chat`, `src/app/automacoes/chat`: experiencia antiga de chat proprio.
- `src/app/apps`: UI antiga de apps/builders.
- `src/app/(navigation)/dashboards`: lista antiga em Nexus; manter `src/app/artifacts/dashboards`.
- `src/app/dashboard`, `src/app/report`, `src/app/slide`: workspaces antigos, revisar apos confirmar que embeds publicos de artifacts nao dependem deles.
- `src/app/api/agent-tools`: REST tools antigas substituidas por MCP tools.
- `src/app/api/bigquery-test`, `src/app/api/dashboard-bigquery`, `src/app/api/dashboard-supabase`, `src/app/api/dashboards`: APIs antigas de playground/dashboard.
- `src/app/api/sandbox`, `src/app/api/agentes`, `src/app/api/mastra`, `src/app/api/meta-analyst`, `src/app/api/julius-chat`: agentes/sandbox antigos.

## Modulos candidatos a remocao

- `src/products/chat`: runtime antigo de chat proprio.
- `src/components/apps`: construtor antigo de apps/dashboard.
- `src/components/visual-builder`: editor visual antigo.
- `src/components/navigation/nexus` e builders relacionados, apos simplificar a navegacao.
- `src/products/bi`: manter temporariamente apenas o que ainda for usado pelos renderers de artifacts; depois mover o minimo necessario para `src/products/artifacts`.
- `src/stores/apps` e stores ligados aos builders antigos.

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

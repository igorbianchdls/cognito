# MCP Apps Extraction Inventory

## Generic MCP Apps Pieces

These can live in `src/products/mcp-apps`:

- `server/appResources.ts`: declares `ui://widget/dashboard-v3.html`, widget HTML, MIME type, and MCP Apps `ui` metadata.
- `server/appTools.ts`: public dashboard/data tools that add `structuredContent` and `embed_url`.
- `server/embedToken.ts`: signed dashboard embed token helpers.
- `server/domainTools.ts`: ERP, SQL, ecommerce, and marketing tools that render structured UI.
- `web/src`: widget source for list, preview, analytics tables, metrics, charts, and dashboard iframe.
- `web/dist`: built widget HTML/JS served as the MCP Apps resource.
- `scripts/mcp-apps/build-widget.mjs`: generic widget build script.

## ChatGPT-Specific Pieces

These should stay in `src/products/chatgpt-app`:

- OAuth routes and token issuer for the ChatGPT connector.
- `/api/chatgpt-app/mcp` endpoint.
- `openai/outputTemplate`.
- `openai/widgetCSP`.
- `openai/widgetAccessible`.
- `openai/toolInvocation/*` status strings.
- ChatGPT setup and smoke tests.

## Claude-Specific Pieces

These should be added later in `src/products/claude-app`:

- `/api/claude-app/mcp` endpoint.
- Claude connector setup docs.
- Claude OAuth env names and metadata, if kept separate from ChatGPT.
- Claude smoke test.
- MCP Apps validation in Claude after deploy.

## Extraction Status

Completed in this phase:

- `mcp-apps` metadata is standardized around `_meta.ui`.
- OpenAI-only metadata is injected by the ChatGPT wrapper.
- `claude-app` has an initial MCP endpoint wrapper over `mcp-apps`.
- `open_dashboard` renders a dashboard iframe from `{ "id": "..." }` in one tool call.

Next extraction step:

- Manual Claude connector validation after deploy.

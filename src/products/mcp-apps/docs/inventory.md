# MCP Apps Extraction Inventory

## Generic MCP Apps Pieces

These can live in `src/products/mcp-apps`:

- `server/appResources.ts`: declares `ui://widget/dashboard.html`, widget HTML, MIME type, and MCP Apps `ui` metadata.
- `server/appTools.ts`: render/data tool wrappers that add `structuredContent` and `embed_url`.
- `server/embedToken.ts`: signed dashboard embed token helpers.
- `server/domainTools.ts`: CRUD, SQL, ecommerce, and marketing tools that render structured UI.
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

## Next Extraction Step

Standardize `mcp-apps` metadata around `_meta.ui` and move OpenAI-only metadata into the ChatGPT wrapper.

# Claude App Setup

Use this endpoint for the Claude MCP Apps wrapper:

```txt
https://cognito-seven.vercel.app/api/claude-app/mcp
```

This wrapper reuses `src/products/mcp-apps` for tools, resources, widget HTML, dashboard embed URLs, and structured UI responses.

## Current Status

Implemented:

- Claude product wrapper.
- MCP JSON-RPC endpoint.
- MCP Apps tools/resources from `mcp-apps`.
- Bearer token auth using `COGNITO_CLAUDE_APP_TOKEN` or `COGNITO_MCP_TOKEN`.

Next:

- Claude OAuth routes and discovery metadata.
- Claude smoke test.
- Manual Claude connector validation.

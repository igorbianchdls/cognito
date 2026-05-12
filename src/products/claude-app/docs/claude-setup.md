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
- OAuth routes and protected resource discovery.
- `dashboard_embed_preview` tool for one-call dashboard iframe rendering.

Next:

- Claude smoke test.
- Manual Claude connector validation.

## OAuth

The Claude wrapper exposes:

```txt
/api/claude-app/.well-known/oauth-protected-resource
/api/claude-app/.well-known/oauth-authorization-server
/api/claude-app/.well-known/openid-configuration
/api/claude-app/oauth/authorize
/api/claude-app/oauth/token
/api/claude-app/oauth/register
```

Recommended envs:

```txt
COGNITO_CLAUDE_APP_OAUTH_SECRET=...
COGNITO_CLAUDE_APP_EMBED_SECRET=...
```

Fallbacks:

```txt
COGNITO_MCP_APPS_OAUTH_SECRET
COGNITO_MCP_APPS_EMBED_SECRET
COGNITO_MCP_TOKEN
```

## Dashboard Embed

Use this tool when Claude should render a dashboard in the MCP Apps iframe with a single call:

```txt
dashboard_embed_preview
```

Input:

```json
{ "artifact_id": "<dashboard-id>" }
```

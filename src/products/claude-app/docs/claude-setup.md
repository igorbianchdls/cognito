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
- `open_dashboard` tool for one-call dashboard iframe rendering.

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
open_dashboard
```

Input:

```json
{ "id": "<dashboard-id>" }
```

## Smoke Test

After deploy:

```txt
COGNITO_MCP_TOKEN=... pnpm claude-app:smoke
```

Or with a dedicated Claude token:

```txt
COGNITO_CLAUDE_APP_TOKEN=... pnpm claude-app:smoke
```

The smoke test validates:

```txt
OAuth challenge
OAuth protected resource metadata
OAuth authorization server metadata
OAuth register / authorize / token
OAuth-authenticated initialize
Bearer-authenticated initialize
tools/list
resources/list
resources/read ui://widget/dashboard-v3.html
dashboards
open_dashboard when dashboards exist
absence of OpenAI-only metadata in Claude resources/tools
```

## Claude Connector Test

Print the manual validation checklist:

```txt
pnpm claude-app:claude-test
```

Use this URL:

```txt
https://cognito-seven.vercel.app/api/claude-app/mcp
```

Recommended prompt:

```txt
Abra o dashboard <id> como app interativo.
```

Expected behavior:

```txt
Claude calls open_dashboard with only { id }.
The MCP Apps widget opens.
The widget renders the Cognito dashboard iframe.
```

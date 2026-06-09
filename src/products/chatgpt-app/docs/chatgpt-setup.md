# ChatGPT App Setup

This document tracks the setup for the Cognito dashboards ChatGPT App.

## Endpoint

The ChatGPT App MCP endpoint is:

```txt
https://cognito-seven.vercel.app/api/chatgpt-app/mcp
```

The existing generic MCP endpoint remains:

```txt
https://cognito-seven.vercel.app/api/mcp
```

## Local Architecture

```txt
src/products/mcp
```

Generic MCP tools and dashboard execution logic.

```txt
src/products/chatgpt-app/server
```

ChatGPT App metadata, OAuth, endpoint wrapper, and OpenAI-specific Plugin metadata.

```txt
src/products/plugin
```

Shared Plugin tools, UI resources, widget source, and built widget HTML.

```txt
src/products/chatgpt-app/web
```

Legacy ChatGPT widget source retained for compatibility. The active shared widget lives in `src/products/plugin/web`.

```txt
src/app/api/chatgpt-app/mcp
```

Public MCP endpoint for the ChatGPT App.

## Developer Mode

In ChatGPT, enable Developer Mode:

```txt
Settings > Apps & Connectors > Advanced settings > Developer Mode
```

Then create a connector:

```txt
Settings > Connectors > Create
```

Use the MCP URL:

```txt
https://cognito-seven.vercel.app/api/chatgpt-app/mcp
```

## MVP Flow

```txt
User asks for dashboards
ChatGPT calls dashboards
The iframe renders dashboard cards
```

```txt
User asks for a dashboard preview
ChatGPT calls open_artifact with { kind: "dashboard", id }
The iframe renders the full dashboard
```

## Auth

The first private test version can reuse the bearer token pattern already used by `products/mcp`.

The ChatGPT connector uses OAuth discovery. The app exposes:

```txt
/.well-known/oauth-protected-resource
/.well-known/oauth-authorization-server
/api/chatgpt-app/oauth/authorize
/api/chatgpt-app/oauth/token
/api/chatgpt-app/oauth/register
```

For this MVP, `/authorize` auto-approves the connection and issues a signed authorization code. The MCP route accepts both the existing `COGNITO_MCP_TOKEN` bearer token and OAuth access tokens issued by the app.

For broader distribution, replace auto-approval with a real user login and consent screen.

Recommended Vercel envs:

```txt
COGNITO_MCP_TOKEN=...
COGNITO_CHATGPT_APP_OAUTH_SECRET=...
COGNITO_CHATGPT_APP_EMBED_SECRET=...
```

## Dashboard Embed

Dashboard embed URLs use a signed short-lived token:

```txt
/artifacts/dashboards/<id>?embed=1&token=<signed-token>
```

Dashboard tools include `embed_url` where a dashboard id is available:

```txt
dashboards -> dashboards[].embed_url
open_artifact -> reads and renders a dashboard from { kind: "dashboard", id } in one tool call
```

Generate a token for testing:

```txt
POST /api/chatgpt-app/embed-token
Authorization: Bearer <token>
{ "artifact_id": "<dashboard-id>" }
```

The embed route rejects unsigned or expired URLs. `COGNITO_CHATGPT_APP_EMBED_SECRET` signs these URLs; when it is not configured, the app falls back to `COGNITO_CHATGPT_APP_OAUTH_SECRET` and then `COGNITO_MCP_TOKEN`.

The widget CSP allows the configured app origin from `COGNITO_BASE_URL` or `NEXT_PUBLIC_APP_URL`. It also keeps `https://cognito-seven.vercel.app` as a fallback for the current deploy.

## Local Commands

Build the iframe widget:

```txt
pnpm chatgpt-app:build
```

Run the remote smoke test after deploy:

```txt
COGNITO_MCP_TOKEN=... pnpm chatgpt-app:smoke
```

Before host-specific smoke tests, validate the shared Plugin layer locally:

```txt
pnpm plugin:build
pnpm plugin:smoke
```

Print the manual ChatGPT validation checklist:

```txt
pnpm chatgpt-app:chatgpt-test
```

Override the endpoint when needed:

```txt
COGNITO_CHATGPT_APP_MCP_URL=https://example.com/api/chatgpt-app/mcp COGNITO_MCP_TOKEN=... pnpm chatgpt-app:smoke
```

## Smoke Coverage

The smoke test verifies:

```txt
initialize
tools/list
OpenAI tool metadata
resources/list
resources/read ui://widget/dashboard-v4.html
OpenAI widget metadata
Plugin widget metadata
widget CSP domains
POST /api/chatgpt-app/embed-token
tools/call dashboards
tools/call open_artifact
open_artifact dashboard.embed_url
dashboards dashboards[].embed_url when dashboards exist
```

It does not create or edit dashboards.

## ChatGPT Prompts

Use these prompts for first validation after the smoke test passes.

```txt
Liste meus dashboards e renderize como cards.
```

Expected:

```txt
dashboards
Widget renders dashboard cards.
```

```txt
Abra o preview do dashboard <id> e renderize o dashboard completo.
```

Expected:

```txt
open_artifact
Widget renders the Cognito dashboard in an iframe.
The iframe URL contains embed=1 and a signed token.
```

```txt
Mostre um resumo de ecommerce e renderize a resposta.
```

Expected:

```txt
ecommerce
Widget renders cards, chart, or table from structuredContent.
```

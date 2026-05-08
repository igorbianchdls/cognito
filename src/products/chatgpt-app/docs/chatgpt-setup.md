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

ChatGPT App metadata, UI resources, and render tools.

```txt
src/products/chatgpt-app/web
```

Iframe UI rendered by ChatGPT.

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
ChatGPT calls dashboard_list
ChatGPT calls dashboard_render_list
The iframe renders dashboard cards
```

```txt
User asks for a dashboard preview
ChatGPT calls dashboard_read
ChatGPT calls dashboard_render_preview
The iframe renders dashboard metadata and preview
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

## Local Commands

Build the iframe widget:

```txt
pnpm chatgpt-app:build
```

Run the remote smoke test after deploy:

```txt
COGNITO_MCP_TOKEN=... pnpm chatgpt-app:smoke
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
resources/list
resources/read ui://widget/dashboard.html
tools/call dashboard_render_list
tools/call dashboard_render_preview
```

It does not create or edit dashboards.

## ChatGPT Prompts

Use these prompts for first validation:

```txt
Liste meus dashboards e renderize como cards.
```

```txt
Abra o preview do dashboard <id> e renderize a tela de detalhes.
```

```txt
Crie um dashboard simples de vendas e retorne o link do Cognito.
```

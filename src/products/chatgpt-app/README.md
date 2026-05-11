# Cognito ChatGPT App

ChatGPT App layer for Cognito dashboards.

This product reuses the generic MCP dashboard tools from `src/products/mcp` and adds the ChatGPT-specific app surface:

- app metadata for discovery in ChatGPT
- MCP Apps UI resources
- render tools for dashboard UI
- a React widget that runs inside the ChatGPT iframe
- signed dashboard embed tokens

The generic MCP endpoint remains separate at `/api/mcp`. The ChatGPT App endpoint will live at `/api/chatgpt-app/mcp`.

## Current Scope

Implemented:

- product structure
- setup documentation
- app metadata
- base dashboard UI resource
- ChatGPT App MCP route
- health route
- render tools for list and preview
- initial React UI source and iframe bridge
- widget build script
- smoke test script
- dashboard embed token endpoint

Not implemented yet:

- public app submission

## Environment

```txt
COGNITO_MCP_TOKEN=...
COGNITO_CHATGPT_APP_OAUTH_SECRET=...
COGNITO_CHATGPT_APP_EMBED_SECRET=...
```

`COGNITO_CHATGPT_APP_EMBED_SECRET` is recommended for signed dashboard embed URLs. If it is not set, the app falls back to `COGNITO_CHATGPT_APP_OAUTH_SECRET` and then `COGNITO_MCP_TOKEN`.

## Commands

```txt
pnpm chatgpt-app:build
```

```txt
COGNITO_MCP_TOKEN=... pnpm chatgpt-app:smoke
```

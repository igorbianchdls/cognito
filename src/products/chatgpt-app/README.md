# Cognito ChatGPT App

ChatGPT App layer for Cognito dashboards.

This product reuses the generic MCP dashboard tools from `src/products/mcp` and adds the ChatGPT-specific app surface:

- app metadata for discovery in ChatGPT
- MCP Apps UI resources
- render tools for dashboard UI
- a React widget that runs inside the ChatGPT iframe

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

Not implemented yet:

- production OAuth flow
- public app submission

## Commands

```txt
pnpm chatgpt-app:build
```

```txt
COGNITO_MCP_TOKEN=... pnpm chatgpt-app:smoke
```

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

Not implemented yet:

- ChatGPT App MCP route
- render tools
- React widget build
- smoke test


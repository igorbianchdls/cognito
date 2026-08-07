# Cognito Plugin

Shared Plugin layer for interactive Cognito dashboard UI.

This product owns the host-agnostic artifact preview and authoring pieces used internally by the application:

- `ui://widget/dashboard-v4.html` resource
- `dashboards` list/search tool
- `open_artifact` one-call full artifact tool
- `artifact_authoring` artifact create/edit tool
- dashboard embed URL helpers
- dashboard/ecommerce/marketing/SQL result widget
- widget source and built HTML

External AI clients are served exclusively by `src/products/ai-platform` and `/api/ai/mcp`.

## Commands

```txt
pnpm plugin:build
```

```txt
pnpm plugin:smoke
```

The smoke test validates:

- built widget HTML
- Plugin resource metadata
- absence of OpenAI-only metadata in the shared layer
- `dashboards`, `open_artifact`, and `artifact_authoring` registration source
- widget runtime globals

## Current State

The plugin remains an internal artifact rendering layer and is not an MCP or OAuth server.

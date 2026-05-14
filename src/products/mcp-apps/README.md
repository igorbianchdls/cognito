# Cognito MCP Apps

Shared MCP Apps layer for interactive Cognito dashboard UI.

This product owns the host-agnostic pieces that can be reused by Claude, ChatGPT, and any MCP Apps-compatible client:

- `ui://widget/dashboard-v2.html` resource
- `dashboards` list/search tool
- `open_dashboard` one-call full dashboard tool
- dashboard embed URL helpers
- dashboard/ecommerce/marketing/SQL result widget
- widget source and built HTML

Host-specific wrappers stay outside this product:

- `src/products/chatgpt-app` keeps OpenAI-specific OAuth, metadata, and endpoint behavior.
- `src/products/claude-app` will add Claude-specific connector docs, OAuth, smoke tests, and endpoint behavior.

## Commands

```txt
pnpm mcp-apps:build
```

```txt
pnpm mcp-apps:smoke
```

The smoke test validates:

- built widget HTML
- MCP Apps resource metadata
- absence of OpenAI-only metadata in the shared layer
- `dashboards` and `open_dashboard` registration source
- widget runtime globals

See also:

```txt
src/products/mcp-apps/docs/overview.md
src/products/mcp-apps/docs/inventory.md
```

## Current State

This is the first extraction step. The code is copied from `chatgpt-app`, isolated under `mcp-apps`, and standardized around MCP Apps `_meta.ui`. OpenAI-only fields are added by the ChatGPT wrapper.

# Cognito MCP Apps

Shared MCP Apps layer for interactive Cognito dashboard UI.

This product owns the host-agnostic pieces that can be reused by Claude, ChatGPT, and any MCP Apps-compatible client:

- `ui://widget/dashboard.html` resource
- dashboard render tools
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

## Current State

This is the first extraction step. The code is copied from `chatgpt-app` and isolated under `mcp-apps`; the next step is to standardize metadata so OpenAI-only fields live in the ChatGPT wrapper.

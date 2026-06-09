# Cognito Plugin

Shared Plugin layer for interactive Cognito dashboard UI.

This product owns the host-agnostic pieces that can be reused by Claude, ChatGPT, and any Plugin-compatible client:

- `ui://widget/dashboard-v4.html` resource
- `dashboards` list/search tool
- `open_artifact` one-call full artifact tool
- `artifact_authoring` artifact create/edit tool
- dashboard embed URL helpers
- dashboard/ecommerce/marketing/SQL result widget
- widget source and built HTML

Host-specific wrappers stay outside this product:

- `src/products/chatgpt-app` keeps OpenAI-specific OAuth, metadata, and endpoint behavior.
- `src/products/claude-app` will add Claude-specific connector docs, OAuth, smoke tests, and endpoint behavior.

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

See also:

```txt
src/products/plugin/docs/overview.md
src/products/plugin/docs/inventory.md
```

## Current State

This is the first extraction step. The code is copied from `chatgpt-app`, isolated under `plugin`, and standardized around Plugin `_meta.ui`. OpenAI-only fields are added by the ChatGPT wrapper.

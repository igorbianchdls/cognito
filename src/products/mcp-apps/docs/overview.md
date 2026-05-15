# MCP Apps Overview

`src/products/mcp-apps` is the shared interactive UI layer for MCP Apps-compatible hosts.

It intentionally does not own host auth, OAuth discovery, or host-specific metadata.

## Responsibilities

- Serve the `ui://widget/dashboard-v4.html` resource.
- Build and store the dashboard widget HTML in `web/dist`.
- Define public tools that return `structuredContent` ready for the widget.
- Normalize dashboard tool responses into `structuredContent`.
- Add signed dashboard `embed_url` values where possible.
- Render ERP, SQL, ecommerce, marketing, dashboard lists, and dashboard previews in the same widget.

## Host Wrappers

```txt
src/products/chatgpt-app
```

Adds ChatGPT-specific OAuth, endpoint handling, and OpenAI metadata.

```txt
src/products/claude-app
```

Adds Claude-specific OAuth, endpoint handling, setup docs, and smoke tests.

## Commands

```txt
pnpm mcp-apps:build
pnpm mcp-apps:smoke
```

Run `mcp-apps:smoke` before host-specific smoke tests to catch shared UI/resource regressions.

## Key Tool

```txt
open_dashboard
```

This is the preferred one-call tool when a host should render the full dashboard iframe from `{ "id": "..." }`.

# ChatGPT App Setup

This document tracks the setup for the Cognito dashboards ChatGPT App.

## Endpoint

The planned ChatGPT App MCP endpoint is:

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

Use the planned MCP URL:

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

For broader distribution, replace the fixed bearer token with a proper OAuth flow.


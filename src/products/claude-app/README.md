# Cognito Claude App

Claude-facing wrapper for the shared `src/products/mcp-apps` dashboard UI and tools.

Current endpoint:

```txt
/api/claude-app/mcp
```

Current auth:

```txt
Authorization: Bearer <COGNITO_CLAUDE_APP_TOKEN or COGNITO_MCP_TOKEN>
```

OAuth discovery and connector-specific OAuth routes are intentionally left for the next implementation step.

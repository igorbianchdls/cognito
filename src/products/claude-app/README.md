# Cognito Claude App

Claude-facing wrapper for the shared `src/products/plugin` dashboard UI and tools.

Current endpoint:

```txt
/api/claude-app/mcp
```

Auth:

```txt
Authorization: Bearer <COGNITO_CLAUDE_APP_TOKEN or COGNITO_MCP_TOKEN>
```

OAuth discovery and connector-specific OAuth routes are available at:

```txt
/api/claude-app/.well-known/oauth-protected-resource
/api/claude-app/.well-known/oauth-authorization-server
/api/claude-app/oauth/authorize
/api/claude-app/oauth/token
/api/claude-app/oauth/register
```

The wrapper also accepts OAuth access tokens issued by `/api/claude-app/oauth/token`.

Smoke test after deploy:

```txt
COGNITO_MCP_TOKEN=... pnpm claude-app:smoke
```

Manual Claude validation checklist:

```txt
pnpm claude-app:claude-test
```

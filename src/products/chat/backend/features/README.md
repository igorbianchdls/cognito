# Chat Backend Features

- `features/chat/controllers/*`: controladores HTTP da feature de chat.
- `features/agents/controllers/*`: ação principal do chat.
- `features/agents/claudecode/*`: stack isolada do agente ClaudeCode.
- `features/agents/codex/*`: stack isolada do agente Codex/OpenAI.
- `features/agents/shared/*`: componentes comuns entre provedores.
- `features/agents/auth/*`: token store do bridge.
- `features/agents/runtime/*` e `features/agents/prompts/*`: wrappers de compatibilidade.

`backend/controllers/*` permanece como wrapper de compatibilidade.

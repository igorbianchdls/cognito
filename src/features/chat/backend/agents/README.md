# Chat Agents Backend

Estrutura interna dos agentes da feature `chat`.

- `controllers/`: entrada de ações do agente (orquestração principal).
- `tools/`: namespace para handlers e registro de tools da feature.
- `prompts/`: prompts de sistema e convenções de comportamento.
- `sandbox/`: runners e recursos executados dentro da sandbox.
- `auth/`: token efêmero usado no bridge `/api/agent-tools`.
- `transport/`: adapters HTTP/SSE (expansão incremental).

Compatibilidade:

- Os caminhos legados em `backend/controllers`, `backend/runtime`, `backend/prompts` e `backend/auth` continuam como wrappers finos para evitar quebra durante a migração.

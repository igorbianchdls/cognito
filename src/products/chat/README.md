# Chat Feature

Estrutura principal da feature de chat:

- `frontend/`: páginas e componentes de UI do chat.
- `backend/`: backend interno da feature.
  - `backend/features/agents/`: domínio principal dos agentes.
    - `controllers/`: orquestração principal do chat.
    - `shared/`: utilitários compartilhados entre provedores.
    - `auth/`: token store do bridge de agent tools.
    - `claudecode/`: implementação isolada do agente ClaudeCode.
      - `prompts/`: prompts de sistema do ClaudeCode.
      - `runtime/`: runners do ClaudeCode (chat e slash).
      - `tools/`: namespace de tools específicas do ClaudeCode.
      - `skills/`: namespace de skills específicas do ClaudeCode.
    - `codex/`: implementação isolada do agente Codex (OpenAI).
      - `prompts/`: prompts de sistema do Codex.
      - `runtime/`: runners do Codex/OpenAI Responses.
      - `tools/`: namespace de tools específicas do Codex.
      - `skills/`: namespace de skills específicas do Codex.
  - `backend/agents/`: wrappers de compatibilidade para caminhos antigos.
  - `backend/controllers`, `backend/runtime`, `backend/prompts`, `backend/auth`:
    wrappers de compatibilidade durante migração.
- `state/`: estado local da feature (nanostores).

Pontos de entrada:

- Páginas App Router:
  - `/chat` -> `src/app/chat/page.tsx`
  - `/chat/[id]` -> `src/app/chat/[id]/page.tsx`
  - `/chat/lista` -> `src/app/chat/lista/page.tsx`
- API:
  - `/api/chat` e subrotas em `src/app/api/chat/*`

Observação:

- `src/app/chat/*` e `src/app/api/chat/*` são wrappers finos para manter rotas estáveis.

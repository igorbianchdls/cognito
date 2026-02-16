# Chat Feature

Estrutura principal da feature de chat:

- `frontend/`: páginas e componentes de UI do chat.
- `backend/`: backend interno da feature.
  - `backend/agents/`: domínio de agentes (organização principal).
    - `controllers/`: orquestração das ações do agente.
    - `tools/`: espaço para registry/handlers de tools.
    - `prompts/`: prompts de sistema e regras de comportamento.
    - `sandbox/`: runners e recursos de execução na sandbox.
    - `auth/`: token store do bridge de agent tools.
    - `transport/`: adapters HTTP/SSE (evolução incremental).
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

# Chat Feature

Estrutura principal da feature de chat:

- `frontend/`: páginas e componentes de UI do chat.
- `backend/`: controllers e runtime do endpoint `/api/chat`.
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

# Drive

Drives, pastas e arquivos da empresa (vídeos, imagens, áudios e textos), com favoritos, recentes e lixeira. Antes se chamava Spaces e ficava dentro do Editor. O editor de vídeo e o Marketing usam os arquivos daqui.

## Onde fica

- Telas: `src/app/drive` (`/drive`, `/drive/[id]`, `/drive/pastas/[id]`, `/drive/recentes`, `/drive/favoritos`, `/drive/lixeira`). Os endereços antigos `/editor/spaces…` e `/editor/pastas…` redirecionam (`next.config.ts`).
- Código: `frontend` (store, telas em `views`, miniaturas), `frontend/lib/supabase.ts` (cliente no schema `drive`) e `frontend/shell/DriveAccountSync.tsx` (abre o Drive da empresa ativa). A fila de gravação é a mesma do editor e do Marketing (`editor/frontend/lib/sync.ts`).
- Menu: seção **Drive** (Início, Recentes, Favoritos e Lixeira) em `src/components/navigation/SidebarShadcn.tsx`.
- Banco: schema `drive` (`drives`, `folders`, `files`, `favorites`, `recents`) e bucket privado `drive` (`supabase/migrations/20261122120000_drive_schema.sql`). O caminho de cada arquivo no bucket é `<organização>/<arquivo>/<nome>`.

## Quem vê o quê

As regras são as mesmas do Editor e do Marketing, pelos papéis do ERP (`editor.can_read` e `editor.can_write`, em `supabase/migrations/20261121130000_editor_social_roles.sql`): membro ativo da empresa lê; owner, admin e member alteram; quem só visualiza não altera; outra empresa não aparece.

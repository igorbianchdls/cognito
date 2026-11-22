# Editor

Editor de vídeo, vindo do Otto Social. Os arquivos (vídeos, imagens e áudios) vêm do produto Drive (`src/products/drive`).

## Onde fica

- Telas: `src/app/editor` (`/editor`, `/editor/[id]`).
- Código: `frontend/editor` (editor e exportação), `frontend/shell` (moldura com o menu do Otto, visual base e fontes) e `frontend/lib` (cliente do Supabase e fila de gravação).
- Banco: schema `editor`, só com os projetos e as versões (`supabase/migrations/20261119120000_editor_schema.sql`; os arquivos foram para o schema `drive` em `20261122120000_drive_schema.sql`).

## Como os dados são protegidos

O navegador fala direto com o Supabase, levando o token de sessão do Clerk. Cada linha tem `workspace_id`, que é o id da organização no Clerk (a mesma empresa do ERP). As políticas do banco seguem os papéis do ERP (`shared.usuarios_empresas`), pela função `editor.member_role`:

- ler: membro ativo da empresa ativa no token (owner, admin, member ou viewer);
- alterar: owner, admin ou member (viewer só lê);
- membro suspenso ou removido, ou empresa desativada, não acessa nada. Os dados ficam guardados, como os do ERP.

Favoritos e recentes também são da pessoa. Nos arquivos, a primeira pasta do caminho no bucket é a empresa (`supabase/migrations/20261121130000_editor_social_roles.sql`).

## Estado atual

O Editor fica na seção Marketing do menu do Otto (`src/components/navigation/SidebarShadcn.tsx`), mas ainda roda como demonstração: tudo fica no navegador. Para passar a salvar no banco:

1. No Clerk do Cognito, ativar a integração com o Supabase. Ela coloca `role: authenticated` no token.
2. No Supabase do Cognito, adicionar o Clerk em Authentication → Third-party auth (Frontend API URL do Clerk).
3. Na Vercel, definir `NEXT_PUBLIC_EDITOR_REMOTE=1`.

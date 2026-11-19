# Editor

Editor de vídeo e Spaces (arquivos e pastas), vindos do Otto Social.

## Onde fica

- Telas: `src/app/editor` (`/editor`, `/editor/[id]`, `/editor/spaces`, `/editor/pastas/[id]`).
- Código: `frontend/editor` (editor e exportação), `frontend/spaces` (arquivos e pastas), `frontend/shell` (menu, visual base) e `frontend/lib` (cliente do Supabase e fila de gravação).
- Banco: schema `editor` e bucket `editor-media` (`supabase/migrations/20261119120000_editor_schema.sql`).

## Como os dados são protegidos

O navegador fala direto com o Supabase, levando o token de sessão do Clerk. Cada linha tem `workspace_id`, que é o id da organização no Clerk (a mesma empresa do ERP). As políticas do banco só deixam ler e gravar quando o `workspace_id` é a organização ativa no token. Favoritos e recentes também são da pessoa. Nos arquivos, a primeira pasta do caminho no bucket é a empresa.

## Estado atual

O Editor ainda não aparece no menu e roda como demonstração: tudo fica no navegador. Para passar a salvar no banco:

1. No Clerk do Cognito, ativar a integração com o Supabase. Ela coloca `role: authenticated` no token.
2. No Supabase do Cognito, adicionar o Clerk em Authentication → Third-party auth (Frontend API URL do Clerk).
3. Na Vercel, definir `NEXT_PUBLIC_EDITOR_REMOTE=1`.
4. Colocar o Editor no menu do Otto.

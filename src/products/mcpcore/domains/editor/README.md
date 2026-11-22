# Editor por código (base)

O Editor de vídeo e os posts são editados por código (Claude Code com o token do Otto), não por ferramentas no chat. As ferramentas `video_` e `social_` foram retiradas do plugin; ficaram as peças de servidor que a API por token vai usar:

- `server/database.ts`: executa como a pessoa (papel `authenticated` com usuário e organização do Clerk), então as políticas de `supabase/migrations/20261121130000_editor_social_roles.sql` decidem o acesso: quem só visualiza não altera, outra empresa não aparece.
- `server/projects.ts`: lê e grava projetos em `editor.projects`, guardando a versão anterior em `editor.project_versions` e uma revisão nova (`data.rev`), que o editor aberto percebe e carrega (Ctrl+Z desfaz).
- `server/convert.ts`: o projeto em segundos e campos em português, nos dois sentidos.
- `server/media.ts`: traz arquivos de links públicos para o Drive (só https público, até 50 MB), lendo formato, duração e tamanho do próprio arquivo.

As edições usam as mesmas funções do editor (`editor/frontend/editor/project/ops.ts`, `presets.ts`, `templates.ts`), sem nada do navegador.

Teste: `pnpm marketing:smoke` (no CI).

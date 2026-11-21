# Vídeo e Social no plugin

Ferramentas `video_` (Editor de vídeo e Spaces) e `social_` (posts) do ChatGPT e do Claude. São registradas por `mcp/registerMarketing.ts` nos dois hosts e executadas por `executeTool.ts`.

## Como funcionam

- **Como a pessoa:** cada chamada abre uma transação com o papel `authenticated` e as mesmas claims do token do navegador (usuário e organização do Clerk da empresa escolhida). Valem as políticas de `supabase/migrations/20261121130000_editor_social_roles.sql`: quem só visualiza lê e não altera, e outra empresa não aparece (`server/database.ts`).
- **Mesmas edições do editor:** as ferramentas usam `editor/frontend/editor/project/ops.ts`, `presets.ts`, `templates.ts` e `ai/commands.ts`, sem nada do navegador. Tempos em segundos; campos em português (`server/convert.ts`).
- **Desfazer:** toda alteração guarda o estado anterior em `editor.project_versions` (até 60 por projeto) e grava uma revisão nova (`data.rev`). O editor aberto confere a revisão a cada 4 s e carrega a versão do assistente; Ctrl+Z volta (`project/store.ts`, `useEditor.ts`).
- **Arquivos por link:** `video_enviar_arquivo` baixa só de https público (sem IPs internos, também em redirecionamentos), até 50 MB, lê formato, duração e tamanho do próprio arquivo e guarda em `editor-media/<organização>/<arquivo>/<nome>` (`server/media.ts`).
- **Confirmação:** exclusões e agendamento exigem `confirmado: true`, que a descrição manda pedir à pessoa. No Claude toda escrita é marcada como destrutiva (ele pede permissão).
- **Ainda não:** imagem de um quadro, prévia e exportação no servidor (precisam de renderização fora do navegador), legendas automáticas e remover silêncios (precisam de transcrição) e publicação nas redes (precisa dos conectores). A exportação continua pelo botão Exportar do editor.

## Testes

- `pnpm marketing:smoke` (no CI): cortes, conversão, leitura de arquivos e links recusados.
- `pnpm marketing:db-smoke`: todas as ferramentas num Postgres local com os stubs do Supabase e as migrações do editor e do social (`MARKETING_TEST_DB_URL=postgres://…`). Downloads e Storage são simulados.

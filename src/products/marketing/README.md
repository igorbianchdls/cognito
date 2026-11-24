# Marketing

Antes se chamava Social. Posts e agendamento, contas sociais e notificações, vindos do Otto Social. A mídia dos posts vem do produto Drive.

## Onde fica

- Telas: `src/app/marketing` (`/marketing/posts`, `/marketing/postar`, `/marketing/notificacoes`, `/marketing/sound-effects`).
- Sound effects: `frontend/sounds`, lidos pelo servidor em `/api/marketing/sound-effects` (`server/soundEffects.ts`: consulta como a pessoa, com as mesmas políticas, e devolve URLs assinadas de uma hora). A tela mostra as categorias em dois grupos (Edição e Temas), carrega 40 efeitos por vez conforme a pessoa rola e busca no servidor, no título e nas tags. Os arquivos ficam no bucket privado `sound-effects` (uma pasta por categoria) e o catálogo na tabela `marketing.sound_effects` (`supabase/migrations/20261125150000_marketing_sound_effects.sql`), a mesma para todas as empresas. Quem é membro ativo de alguma empresa lê e toca por URL assinada (`marketing.can_use_sound_effects`, em `20261125160000_marketing_sound_effects_access.sql`); só o `service_role` inclui efeitos (arquivo no bucket + linha na tabela), pelo script `scripts/marketing/import-sound-effects.mjs`: busca no Epidemic Sound por categoria, baixa o MP3 e cadastra com o título e as tags exatamente como no Epidemic (`--apply` importa; sem ele, só lista; rodar de novo só acrescenta o que falta).
- Código: `frontend/posts` (posts, composer e contas), `frontend/notifications`, `frontend/settings` (preferências de postagem e de notificações, por enquanto só no navegador) e `frontend/shell` (sincroniza a empresa ativa).
- Banco: schema `marketing` (criado como `social` em `supabase/migrations/20261119150000_social_schema.sql` e renomeado em `20261125140000_marketing_schema.sql`). `marketing.post_files` aponta para `editor.files`.

## Acesso

Mesmo modelo do Editor (veja `src/products/editor/README.md`): o token do Clerk traz a empresa ativa, e as políticas usam `editor.is_member` e `editor.uid`. Notificações com `user_id` são só da pessoa. Um post só recebe mídia e contas da mesma empresa.

## Estado atual

Na seção Marketing do menu do Otto, em modo demonstração junto com o Editor (mesma chave `NEXT_PUBLIC_EDITOR_REMOTE`). Ainda faltam:
- Conectar contas (Etapa 5): os links "Ver conectores" e "Conectar" levam a `/marketing/conectores`, que ainda não existe.
- A tela do plugin (ChatGPT e Claude), que vem com as ferramentas do Editor e do Marketing no plugin do Otto.

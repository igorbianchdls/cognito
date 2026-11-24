# Marketing

Antes se chamava Social. Posts e agendamento, contas sociais e notificações, vindos do Otto Social. A mídia dos posts vem do produto Drive.

## Onde fica

- Telas: `src/app/marketing` (`/marketing/posts`, `/marketing/postar`, `/marketing/notificacoes`, `/marketing/sound-effects`).
- Sound effects: `frontend/sounds`. Os arquivos ficam no bucket privado `sound-effects` (uma pasta por categoria) e o catálogo na tabela `marketing.sound_effects` (`supabase/migrations/20261125150000_marketing_sound_effects.sql`), a mesma para todas as empresas. Quem é membro ativo da empresa ativa lê e toca por URL assinada; só o `service_role` inclui efeitos (arquivo no bucket + linha na tabela).
- Código: `frontend/posts` (posts, composer e contas), `frontend/notifications`, `frontend/settings` (preferências de postagem e de notificações, por enquanto só no navegador) e `frontend/shell` (sincroniza a empresa ativa).
- Banco: schema `marketing` (criado como `social` em `supabase/migrations/20261119150000_social_schema.sql` e renomeado em `20261125140000_marketing_schema.sql`). `marketing.post_files` aponta para `editor.files`.

## Acesso

Mesmo modelo do Editor (veja `src/products/editor/README.md`): o token do Clerk traz a empresa ativa, e as políticas usam `editor.is_member` e `editor.uid`. Notificações com `user_id` são só da pessoa. Um post só recebe mídia e contas da mesma empresa.

## Estado atual

Na seção Marketing do menu do Otto, em modo demonstração junto com o Editor (mesma chave `NEXT_PUBLIC_EDITOR_REMOTE`). Ainda faltam:
- Conectar contas (Etapa 5): os links "Ver conectores" e "Conectar" levam a `/marketing/conectores`, que ainda não existe.
- A tela do plugin (ChatGPT e Claude), que vem com as ferramentas do Editor e do Marketing no plugin do Otto.

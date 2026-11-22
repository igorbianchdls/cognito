# Social

Posts e agendamento, contas sociais e notificações, vindos do Otto Social. A mídia dos posts vem do produto Drive.

## Onde fica

- Telas: `src/app/social` (`/social/posts`, `/social/postar`, `/social/notificacoes`).
- Código: `frontend/posts` (posts, composer e contas), `frontend/notifications`, `frontend/settings` (preferências de postagem e de notificações, por enquanto só no navegador) e `frontend/shell` (sincroniza a empresa ativa).
- Banco: schema `social` (`supabase/migrations/20261119150000_social_schema.sql`). `social.post_files` aponta para `editor.files`.

## Acesso

Mesmo modelo do Editor (veja `src/products/editor/README.md`): o token do Clerk traz a empresa ativa, e as políticas usam `editor.is_member` e `editor.uid`. Notificações com `user_id` são só da pessoa. Um post só recebe mídia e contas da mesma empresa.

## Estado atual

Na seção Marketing do menu do Otto, em modo demonstração junto com o Editor (mesma chave `NEXT_PUBLIC_EDITOR_REMOTE`). Ainda faltam:
- Conectar contas (Etapa 5): os links "Ver conectores" e "Conectar" levam a `/social/conectores`, que ainda não existe.
- A tela do plugin (ChatGPT e Claude), que vem com as ferramentas do Editor e do Social no plugin do Otto.

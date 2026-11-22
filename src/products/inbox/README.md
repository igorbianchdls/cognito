# Inbox

Atendimento de WhatsApp, Instagram e Messenger num lugar só, com a equipe. Próximas fases: automações (estilo ManyChat), disparos (WhatsApp com modelos aprovados e e-mail pelo Amazon SES), IA no atendimento e ferramentas no chat.

## Onde fica

- **Telas** (`src/app/inbox`, seção Inbox do menu):
  - Caixa de entrada (`/inbox`): lista com filtros (abertas, minhas, sem responsável, fechadas), chat ao vivo, notas internas, respostas rápidas com "/", responsável, situação e etiquetas.
  - Contatos (`/inbox/contatos`): ficha, etiquetas, importação e exportação em CSV.
  - Canais (`/inbox/canais`): conectar WhatsApp, canal de teste, endereço do webhook.
  - Configurações (`/inbox/configuracoes`): etiquetas e respostas rápidas.
- **Supabase:**
  - schema `inbox` (`supabase/migrations/20261123120000_inbox_schema.sql`): canais, contatos e identidades por canal, etiquetas, conversas, mensagens, notas e respostas rápidas. Acesso pelos papéis do ERP, como os outros products.
  - schema `inbox_private`: tokens dos canais, cifrados. Não é exposto na API.
  - Canais, identidades e mensagens só o servidor grava; o navegador lê e muda só responsável, situação, nome do canal, contatos, etiquetas, notas e respostas.
  - Conversas e mensagens entram no Supabase Realtime (a caixa de entrada atualiza sozinha; a cada 15 s ela confere de novo).
- **Servidor** (`server/`):
  - `meta.ts`: lê os webhooks da Meta (WhatsApp Cloud API, Instagram, Messenger), confere a assinatura, envia texto e baixa anexos pela Graph API.
  - `ingest.ts`: transforma o webhook em contato, conversa e mensagem (sem duplicar entregas repetidas); status só avança.
  - `actions.ts`: responder (com a janela de 24 h da Meta), conectar WhatsApp, canal de teste.
  - `crypto.ts`: AES-256-GCM para os tokens.
- **Rotas:** `GET/POST /api/inbox/webhook/meta` (pública, assinada pela Meta), `POST /api/inbox/canais`, `POST /api/inbox/canais/[id]/simular`, `POST /api/inbox/conversas/[id]/mensagens`, `GET /api/inbox/midia/[id]`.
- **Anexos recebidos:** copiados para o bucket `drive`, em `<empresa>/inbox/…` (os links da Meta expiram). Ao excluir um contato ou canal, os arquivos dele são apagados junto (LGPD).
- **Avisos da Meta não se perdem:** cada webhook é guardado em `inbox_private.webhook_events` antes de responder "recebido" (se não der para guardar, a Meta recebe erro e manda de novo). Falhas ficam pendentes e são reprocessadas no próximo aviso e pela tarefa diária `/api/inbox/internal/webhooks` (vercel.json, com `CRON_SECRET`); depois de 8 tentativas aparece `WEBHOOK_GAVE_UP` nos logs. Processados somem após 7 dias.
- **Desconectar x excluir:** desconectar para de enviar e receber, esquece o token e guarda o histórico; excluir apaga canal, conversas, mensagens e arquivos (pede para digitar EXCLUIR). Os dois passam pelo servidor (`/api/inbox/canais/[id]`, `/api/inbox/contatos/[id]`).

## Regras da Meta que o Inbox segue

- Resposta livre só até 24 h depois da última mensagem do cliente. Depois disso, só modelo aprovado (vem com os Disparos). A tela avisa e trava o envio.
- Um número ou conta atende uma empresa só no Otto.

## Configuração (Vercel)

- `INBOX_CREDENTIAL_KEY`: 32 bytes em base64 (`openssl rand -base64 32`). Sem ela, não dá para conectar canais da Meta.
- `INBOX_META_APP_SECRET`: chave secreta do app da Meta (confere a assinatura do webhook). Sem ela, o webhook recusa tudo.
- `INBOX_META_VERIFY_TOKEN`: texto qualquer, o mesmo cadastrado no app da Meta em Webhooks.
- Opcional: `INBOX_META_GRAPH_URL` (padrão `https://graph.facebook.com/v23.0`).

Enquanto não houver app da Meta, o **canal de teste** permite usar tudo: cria uma conversa de exemplo e simula mensagens de clientes.

## Testes

`pnpm inbox:smoke` (no CI): webhooks do WhatsApp, Instagram e Messenger, assinatura, tokens cifrados, janela de 24 h e chamadas à Graph API. Com `INBOX_TEST_DB_URL`, testa também o caminho inteiro no banco e as regras de acesso. O CI monta esse banco do zero com `scripts/test-db.sh` (stubs do Supabase em `supabase/tests/stubs.sql` + migrações).

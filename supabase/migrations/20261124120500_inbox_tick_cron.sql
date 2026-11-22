-- O "relógio" do Inbox: a cada minuto o próprio banco chama /api/inbox/internal/tick, que acorda as automações que
-- estavam esperando, envia disparos agendados, reprocessa avisos da Meta e confere prazos de atendimento.
-- Usa pg_cron + pg_net do Supabase. O segredo da chamada fica no Vault com o nome "inbox_tick_secret" (o mesmo valor
-- de INBOX_TICK_SECRET na Vercel) e nunca aparece aqui. Fora do Supabase (testes), esta migração não faz nada.
DO $outer$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron')
     OR NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_net')
     OR to_regnamespace('vault') IS NULL THEN
    RAISE NOTICE 'pg_cron/pg_net/vault indisponíveis: relógio do Inbox não agendado';
    RETURN;
  END IF;
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  CREATE EXTENSION IF NOT EXISTS pg_net;
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'inbox-tick';
  PERFORM cron.schedule('inbox-tick', '* * * * *', $job$
    SELECT net.http_post(
      url := 'https://ottogestao.com.br/api/inbox/internal/tick',
      headers := jsonb_build_object('content-type', 'application/json',
        'authorization', 'Bearer ' || coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'inbox_tick_secret'), '')),
      body := '{}'::jsonb,
      timeout_milliseconds := 55000
    )
  $job$);
END
$outer$;

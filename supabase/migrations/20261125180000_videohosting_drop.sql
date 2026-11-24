-- O produto Video Hosting saiu do Otto (novembro de 2026): o schema vai junto. As tabelas estavam vazias.
-- Junto com esta migração, tire "videohosting" dos schemas expostos da API do Supabase.
BEGIN;

DROP SCHEMA videohosting CASCADE;

COMMIT;

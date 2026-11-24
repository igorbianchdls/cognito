-- O produto Social virou Marketing (novembro de 2026), e o schema acompanha o nome.
-- Tabelas, políticas, permissões, índices e chaves estrangeiras seguem com o schema (nenhuma função cita "social.").
-- Junto com esta migração, troque "social" por "marketing" nos schemas expostos da API do Supabase.
BEGIN;

ALTER SCHEMA social RENAME TO marketing;

COMMIT;

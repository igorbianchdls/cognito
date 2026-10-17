BEGIN;
SET LOCAL lock_timeout='10s';
-- Gallery (cards), form (adds records with the chosen fields) and timeline (bars between two dates).
ALTER TABLE tables.visualizacoes DROP CONSTRAINT visualizacoes_tipo_check;
ALTER TABLE tables.visualizacoes ADD CONSTRAINT visualizacoes_tipo_check CHECK(tipo IN ('grade','kanban','calendario','galeria','formulario','linha_do_tempo'));
COMMIT;

ALTER TABLE trafegopago.desempenho_diario
  DROP CONSTRAINT IF EXISTS trafegopago_desempenho_nivel_chk;

ALTER TABLE trafegopago.desempenho_diario
  ADD CONSTRAINT trafegopago_desempenho_nivel_chk
  CHECK (nivel IN ('conta', 'campanha', 'grupo', 'anuncio', 'campaign', 'ad_group', 'ad'));

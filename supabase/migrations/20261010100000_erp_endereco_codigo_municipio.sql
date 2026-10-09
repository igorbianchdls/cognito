BEGIN;

-- Código IBGE do município no endereço do cadastro (7 dígitos). Opcional: quando o endereço principal
-- do cliente tem código, CEP e logradouro, o DPS da NFS-e leva o endereço do tomador (toma.end.endNac).
ALTER TABLE erp.entidades_enderecos
  ADD COLUMN codigo_municipio text CHECK (codigo_municipio IS NULL OR codigo_municipio ~ '^\d{7}$');
COMMENT ON COLUMN erp.entidades_enderecos.codigo_municipio IS 'Código IBGE do município (7 dígitos), usado no endereço do tomador da NFS-e.';

COMMIT;

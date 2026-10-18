-- Two-way links. A link field can have an inverse field in the linked table: it stores nothing of its
-- own and reads the same rows of tables.registro_vinculos from the other side (registro_destino_id).
-- Each link is still written once, under the origin field, so both sides always agree.
ALTER TABLE tables.campos ADD COLUMN inverso_de uuid;
ALTER TABLE tables.campos ADD CONSTRAINT campos_inverso_fk FOREIGN KEY(empresa_id,inverso_de) REFERENCES tables.campos(empresa_id,id);
ALTER TABLE tables.campos ADD CONSTRAINT campos_inverso_vinculo CHECK(inverso_de IS NULL OR tipo='vinculo');
-- One active inverse per origin field.
CREATE UNIQUE INDEX campos_inverso_unico ON tables.campos(empresa_id,inverso_de) WHERE inverso_de IS NOT NULL AND excluido_em IS NULL;

-- A link changes both records: the origin (as before) and, when the field has an active inverse,
-- the linked record too. Its version and time move, so open screens refresh, concurrent edits are
-- detected and automations see "registro_alterado" on both sides.
CREATE OR REPLACE FUNCTION tables.atualizar_registro_pai() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE dados jsonb;
BEGIN
 dados:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 UPDATE tables.registros SET versao=versao+1,atualizado_em=clock_timestamp(),atualizado_por=tables.usuario_atual()
 WHERE empresa_id=(dados->>'empresa_id')::bigint AND id=(dados->>'registro_id')::uuid;
 IF TG_TABLE_NAME='registro_vinculos' AND EXISTS(SELECT 1 FROM tables.campos WHERE empresa_id=(dados->>'empresa_id')::bigint AND inverso_de=(dados->>'campo_id')::uuid AND excluido_em IS NULL) THEN
   UPDATE tables.registros SET versao=versao+1,atualizado_em=clock_timestamp(),atualizado_por=tables.usuario_atual()
   WHERE empresa_id=(dados->>'empresa_id')::bigint AND id=(dados->>'registro_destino_id')::uuid AND excluido_em IS NULL;
 END IF;
 RETURN NULL;
END $$;

-- Reading the inverse side: links that point to a record, by origin field.
CREATE INDEX IF NOT EXISTS registro_vinculos_destino_campo ON tables.registro_vinculos(empresa_id,registro_destino_id,campo_id);

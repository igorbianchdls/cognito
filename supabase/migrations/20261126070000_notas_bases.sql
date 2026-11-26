-- Notas (etapa 2): bases de dados (tabela, quadro e lista), no estilo do Notion.
--   * Uma base é uma página com tipo = 'base': o esquema (propriedades) e as visões ficam nela, em jsonb.
--   * Cada item é uma página com base_id = a base (e parent_id = a base, para lixeira, duplicar e permissões
--     funcionarem como nas subpáginas). Os valores ficam em propriedades (chave = id da propriedade).
--   * As regras (tipos, valores, filtros, conversões) estão em src/products/notas/shared/bases.ts; o banco só garante
--     a forma: item pendurado na própria base, base não é item, jsonb do tipo certo.
--   * Para desfazer: ALTER TABLE notas.paginas DROP COLUMN tipo, DROP COLUMN base_id, DROP COLUMN esquema,
--     DROP COLUMN visoes, DROP COLUMN propriedades;
BEGIN;

ALTER TABLE notas.paginas
  ADD COLUMN tipo text NOT NULL DEFAULT 'pagina' CHECK (tipo IN ('pagina', 'base')),
  ADD COLUMN base_id uuid REFERENCES notas.paginas (id) ON DELETE CASCADE,
  ADD COLUMN esquema jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(esquema) = 'array'),
  ADD COLUMN visoes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(visoes) = 'array'),
  ADD COLUMN propriedades jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(propriedades) = 'object'),
  ADD CONSTRAINT paginas_item_na_base CHECK (base_id IS NULL OR base_id = parent_id),
  ADD CONSTRAINT paginas_base_nao_e_item CHECK (tipo = 'pagina' OR base_id IS NULL);

CREATE INDEX paginas_base_idx ON notas.paginas (base_id, posicao) WHERE base_id IS NOT NULL;

-- O item só pode estar numa página que é base.
CREATE FUNCTION notas.validar_item() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.base_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM notas.paginas WHERE id = NEW.base_id AND tipo = 'base') THEN
    RAISE EXCEPTION 'O item precisa estar numa base de dados.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validar_item BEFORE INSERT OR UPDATE OF base_id ON notas.paginas FOR EACH ROW EXECUTE FUNCTION notas.validar_item();

COMMIT;

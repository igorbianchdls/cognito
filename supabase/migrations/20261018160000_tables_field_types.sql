BEGIN;
SET LOCAL lock_timeout='10s';
-- New field types.
--  Stored in valores: telefone (text), porcentagem (number, 12.5 = 12,5%), avaliacao (integer 1..max).
--  From the record itself, never written: autonumero, criado_em, alterado_em, criado_por, alterado_por.
--  Derived on read, never written: formula, busca (values of a linked field), agregacao (sum/count/... of a linked field).
ALTER TABLE tables.campos DROP CONSTRAINT campos_tipo_check;
ALTER TABLE tables.campos ADD CONSTRAINT campos_tipo_check CHECK(tipo IN ('texto','texto_longo','numero','moeda','data','data_hora','checkbox','selecao','selecao_multipla','usuario','usuarios','email','url','vinculo','anexo',
 'telefone','porcentagem','avaliacao','autonumero','criado_em','alterado_em','criado_por','alterado_por','formula','busca','agregacao'));

-- Sequential number per table, assigned on insert. The counter lives apart from tabelas so record
-- inserts do not change the table row (no structure version, no history).
ALTER TABLE tables.registros ADD COLUMN numero bigint;
CREATE TABLE tables.contadores(empresa_id bigint NOT NULL,tabela_id uuid NOT NULL,proximo bigint NOT NULL DEFAULT 1,PRIMARY KEY(empresa_id,tabela_id),FOREIGN KEY(empresa_id,tabela_id) REFERENCES tables.tabelas(empresa_id,id));
ALTER TABLE tables.contadores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tables.contadores FROM PUBLIC,anon,authenticated,tables_runtime;
-- Backfill is not an edit by anyone: no history rows for it.
ALTER TABLE tables.registros DISABLE TRIGGER auditar;
UPDATE tables.registros r SET numero=o.n FROM (SELECT id,row_number() OVER (PARTITION BY empresa_id,tabela_id ORDER BY criado_em,posicao,id) n FROM tables.registros) o WHERE o.id=r.id;
ALTER TABLE tables.registros ENABLE TRIGGER auditar;
INSERT INTO tables.contadores(empresa_id,tabela_id,proximo) SELECT empresa_id,tabela_id,max(numero)+1 FROM tables.registros GROUP BY 1,2;
CREATE FUNCTION tables.numerar_registro() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 INSERT INTO tables.contadores(empresa_id,tabela_id,proximo) VALUES(NEW.empresa_id,NEW.tabela_id,2)
 ON CONFLICT(empresa_id,tabela_id) DO UPDATE SET proximo=tables.contadores.proximo+1 RETURNING proximo-1 INTO NEW.numero;
 RETURN NEW;
END $$;
CREATE TRIGGER numerar_registro BEFORE INSERT ON tables.registros FOR EACH ROW EXECUTE FUNCTION tables.numerar_registro();
ALTER TABLE tables.registros ALTER COLUMN numero SET NOT NULL;
CREATE UNIQUE INDEX registros_numero ON tables.registros(empresa_id,tabela_id,numero);
-- The number never changes once given.
CREATE FUNCTION tables.proteger_numero() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN IF NEW.numero IS DISTINCT FROM OLD.numero THEN RAISE EXCEPTION 'Numero do registro e imutavel' USING ERRCODE='23514'; END IF; RETURN NEW; END $$;
CREATE TRIGGER proteger_numero BEFORE UPDATE OF numero ON tables.registros FOR EACH ROW EXECUTE FUNCTION tables.proteger_numero();

CREATE OR REPLACE FUNCTION tables.validar_registro() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE item record; campo record; texto text;
BEGIN
 FOR item IN SELECT * FROM jsonb_each(NEW.valores) LOOP
   SELECT * INTO campo FROM tables.campos WHERE empresa_id=NEW.empresa_id AND tabela_id=NEW.tabela_id AND id::text=item.key;
   IF NOT FOUND THEN RAISE EXCEPTION 'Campo desconhecido' USING ERRCODE='23514'; END IF;
   -- Deleted columns retain their previous values for restoration; writes to them are rejected by the service.
   IF campo.excluido_em IS NOT NULL THEN CONTINUE; END IF;
   IF campo.tipo IN ('selecao','selecao_multipla','usuario','usuarios','vinculo','anexo') THEN
     RAISE EXCEPTION 'Campo relacional fora da estrutura propria' USING ERRCODE='23514';
   END IF;
   IF campo.tipo IN ('autonumero','criado_em','alterado_em','criado_por','alterado_por','formula','busca','agregacao') THEN
     RAISE EXCEPTION 'Campo calculado nao recebe valores' USING ERRCODE='23514';
   END IF;
   IF item.value='null'::jsonb THEN CONTINUE; END IF;
   texto := item.value #>> '{}';
   IF campo.tipo IN ('texto','texto_longo','email','url','data','data_hora','telefone') AND jsonb_typeof(item.value)<>'string' THEN
     RAISE EXCEPTION 'Tipo de texto invalido' USING ERRCODE='23514';
   ELSIF campo.tipo IN ('numero','porcentagem') AND jsonb_typeof(item.value)<>'number' THEN
     RAISE EXCEPTION 'Numero invalido' USING ERRCODE='23514';
   ELSIF campo.tipo='avaliacao' AND (jsonb_typeof(item.value)<>'number' OR texto !~ '^[0-9]+$' OR texto::int<1 OR texto::int>coalesce((campo.configuracao->>'maximo')::int,5)) THEN
     RAISE EXCEPTION 'Avaliacao invalida' USING ERRCODE='23514';
   ELSIF campo.tipo='telefone' AND texto !~ '^\+?[0-9 ().-]{8,25}$' THEN
     RAISE EXCEPTION 'Telefone invalido' USING ERRCODE='23514';
   ELSIF campo.tipo='moeda' THEN
     IF jsonb_typeof(item.value) NOT IN ('number','string') OR texto !~ '^-?[0-9]+(\.[0-9]{1,6})?$' THEN
       RAISE EXCEPTION 'Moeda invalida' USING ERRCODE='23514';
     END IF;
     PERFORM texto::numeric;
   ELSIF campo.tipo='checkbox' AND jsonb_typeof(item.value)<>'boolean' THEN
     RAISE EXCEPTION 'Checkbox invalido' USING ERRCODE='23514';
   END IF;
   IF campo.tipo='data' THEN
     IF texto !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'Data invalida' USING ERRCODE='23514'; END IF;
     PERFORM texto::date;
   ELSIF campo.tipo='data_hora' THEN
     IF texto !~ '^\d{4}-\d{2}-\d{2}T' THEN RAISE EXCEPTION 'Data e hora invalidas' USING ERRCODE='23514'; END IF;
     PERFORM texto::timestamptz;
   END IF;
 END LOOP;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION tables.numerar_registro(),tables.proteger_numero() FROM PUBLIC,anon,authenticated;
COMMIT;

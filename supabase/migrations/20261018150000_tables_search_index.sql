BEGIN;
SET LOCAL lock_timeout='10s';
-- Free search looks at the values of a record, never at its field IDs. With pg_trgm, a trigram
-- index answers "contains" searches without reading the whole table.
CREATE FUNCTION tables.texto_busca(valores jsonb) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path=pg_catalog AS $$
 SELECT coalesce(lower(string_agg(value,' ')),'') FROM jsonb_each_text(valores)
$$;
-- Under row level security, LIKE (not leakproof) cannot use an index. The search runs here, after
-- checking that the person can read the table, and returns only record IDs to the policed query.
CREATE FUNCTION tables.buscar_registros(p_tabela uuid, p_texto text) RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT r.id FROM tables.registros r
 WHERE p_tabela=ANY(tables.tabelas_permitidas('leitor')) AND r.empresa_id=tables.empresa_atual() AND r.tabela_id=p_tabela AND r.excluido_em IS NULL
 AND tables.texto_busca(r.valores) LIKE '%'||lower(replace(replace(replace(p_texto,'\','\\'),'%','\%'),'_','\_'))||'%'
 UNION
 SELECT ro.registro_id FROM tables.registro_opcoes ro JOIN tables.campo_opcoes o ON o.empresa_id=ro.empresa_id AND o.id=ro.opcao_id
 WHERE p_tabela=ANY(tables.tabelas_permitidas('leitor')) AND ro.empresa_id=tables.empresa_atual() AND ro.tabela_id=p_tabela AND position(lower(p_texto) in lower(o.nome))>0
$$;
REVOKE ALL ON FUNCTION tables.texto_busca(jsonb),tables.buscar_registros(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION tables.texto_busca(jsonb),tables.buscar_registros(uuid,text) TO tables_runtime;
DO $$ DECLARE esquema text; BEGIN
 BEGIN CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
 EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pg_trgm indisponivel: a busca continua sem indice'; END;
 SELECT n.nspname INTO esquema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_trgm';
 IF esquema IS NOT NULL THEN
   EXECUTE format('CREATE INDEX registros_busca ON tables.registros USING gin (tables.texto_busca(valores) %I.gin_trgm_ops) WHERE excluido_em IS NULL',esquema);
 END IF;
END $$;
COMMIT;

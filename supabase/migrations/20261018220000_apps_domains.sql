BEGIN;
SET LOCAL lock_timeout='10s';
-- Own domain of a public app (apps.exemplo.com.br). The domain is added to the Vercel project when
-- an administrator confirms it; requests to that host open the public link of the app.
ALTER TABLE apps.acessos ADD COLUMN dominio text CHECK(dominio ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$' AND length(dominio)<=253);
CREATE UNIQUE INDEX apps_acessos_dominio ON apps.acessos(dominio) WHERE dominio IS NOT NULL;
-- Host lookup for the router: only public apps answer, and nothing else about them.
CREATE FUNCTION apps.endereco_do_dominio(p_dominio text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT slug FROM apps.acessos WHERE dominio=lower(p_dominio) AND modo='publico'
$$;
REVOKE ALL ON FUNCTION apps.endereco_do_dominio(text) FROM PUBLIC,anon,authenticated;
COMMIT;

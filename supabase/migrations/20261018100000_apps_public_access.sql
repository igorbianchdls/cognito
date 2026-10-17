BEGIN;
SET LOCAL lock_timeout='10s';
-- Who can open an app: privado (company members) or publico (anyone with /p/<slug>).
-- A public app runs with the permissions of the administrator who made it public (definido_por).
CREATE TABLE apps.acessos(
 empresa_id bigint NOT NULL,app_id uuid NOT NULL,
 modo text NOT NULL CHECK(modo IN ('privado','publico')),
 slug text NOT NULL CHECK(slug ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'),
 definido_por bigint NOT NULL REFERENCES shared.usuarios(id),definido_em timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(empresa_id,app_id),FOREIGN KEY(empresa_id,app_id) REFERENCES apps.apps(empresa_id,id)
);
-- Public addresses are global: the link has no company in it.
CREATE UNIQUE INDEX apps_acessos_slug ON apps.acessos(slug);
-- Requests from visitors, for rate limits. Written only by the server, never by apps_runtime.
CREATE TABLE apps.envios_publicos(
 id bigserial PRIMARY KEY,empresa_id bigint NOT NULL,app_id uuid NOT NULL,origem text NOT NULL,tipo text NOT NULL CHECK(tipo IN ('leitura','criacao')),criado_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,app_id) REFERENCES apps.apps(empresa_id,id)
);
CREATE INDEX apps_envios_publicos_janela ON apps.envios_publicos(empresa_id,app_id,criado_em);

ALTER TABLE apps.acessos ENABLE ROW LEVEL SECURITY;ALTER TABLE apps.acessos FORCE ROW LEVEL SECURITY;
ALTER TABLE apps.envios_publicos ENABLE ROW LEVEL SECURITY;ALTER TABLE apps.envios_publicos FORCE ROW LEVEL SECURITY;
REVOKE ALL ON apps.acessos,apps.envios_publicos FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE apps.envios_publicos_id_seq FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON apps.acessos TO apps_runtime;
CREATE POLICY leitura ON apps.acessos FOR SELECT TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL);
-- Only administrators change who can open an app, and always in their own name.
CREATE POLICY definicao_admin ON apps.acessos FOR INSERT TO apps_runtime WITH CHECK(empresa_id=apps.empresa_atual() AND definido_por=apps.usuario_atual() AND (SELECT apps.papel_atual()) IN ('owner','admin'));
CREATE POLICY alteracao_admin ON apps.acessos FOR UPDATE TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IN ('owner','admin')) WITH CHECK(empresa_id=apps.empresa_atual() AND definido_por=apps.usuario_atual() AND (SELECT apps.papel_atual()) IN ('owner','admin'));

-- Addresses of other companies are invisible under RLS; this only answers whether one is taken.
CREATE FUNCTION apps.endereco_em_uso(p_slug text,p_app uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM apps.acessos WHERE slug=p_slug AND NOT (empresa_id=apps.empresa_atual() AND app_id=p_app))
$$;
REVOKE ALL ON FUNCTION apps.endereco_em_uso(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION apps.endereco_em_uso(text,uuid) TO apps_runtime;
COMMIT;

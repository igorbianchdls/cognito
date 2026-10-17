BEGIN;
SET LOCAL lock_timeout='10s';
-- API keys of Tables (/api/v1/tables). A key acts with the permissions of whoever created it, in the
-- bases that person can open, limited to reading or to reading and writing. Only a hash is stored.
CREATE TABLE tables.chaves_api(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL REFERENCES shared.empresas(id),
 nome text NOT NULL CHECK(btrim(nome)<>'' AND length(nome)<=120),prefixo text NOT NULL CHECK(prefixo ~ '^ctk_[A-Za-z0-9_-]{6}$'),
 hash text NOT NULL UNIQUE CHECK(hash ~ '^[a-f0-9]{64}$'),escopo text NOT NULL CHECK(escopo IN ('leitura','escrita')),
 criado_por bigint NOT NULL REFERENCES shared.usuarios(id),criado_em timestamptz NOT NULL DEFAULT now(),ultimo_uso_em timestamptz,revogada_em timestamptz
);
CREATE INDEX chaves_api_empresa ON tables.chaves_api(empresa_id,criado_em DESC);
-- Requests per key and minute, for the rate limit. Written only by the server.
CREATE TABLE tables.uso_api(chave_id uuid NOT NULL REFERENCES tables.chaves_api(id) ON DELETE CASCADE,minuto timestamptz NOT NULL,contagem integer NOT NULL DEFAULT 1,PRIMARY KEY(chave_id,minuto));
ALTER TABLE tables.chaves_api ENABLE ROW LEVEL SECURITY;ALTER TABLE tables.uso_api ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tables.chaves_api,tables.uso_api FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON tables.chaves_api TO tables_runtime;
-- Each person manages their own keys; company owners and admins see and revoke every key.
CREATE POLICY propria ON tables.chaves_api TO tables_runtime
 USING(empresa_id=tables.empresa_atual() AND (criado_por=tables.usuario_atual() OR tables.usuario_atual()::text IN (SELECT id FROM tables.administradores_empresa())))
 WITH CHECK(empresa_id=tables.empresa_atual() AND (SELECT tables.membro_ativo(true)) AND (criado_por=tables.usuario_atual() OR tables.usuario_atual()::text IN (SELECT id FROM tables.administradores_empresa())));
COMMIT;

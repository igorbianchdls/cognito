BEGIN;
SET LOCAL lock_timeout='10s';
-- Use of each app per day: openings of the published app and of the public link, and records
-- created by visitors. Counters only: no personal data of who opened it.
CREATE TABLE apps.uso_diario(
 empresa_id bigint NOT NULL,app_id uuid NOT NULL,dia date NOT NULL,modo text NOT NULL CHECK(modo IN ('publicado','publico')),
 aberturas integer NOT NULL DEFAULT 0,criacoes integer NOT NULL DEFAULT 0,
 PRIMARY KEY(empresa_id,app_id,dia,modo),FOREIGN KEY(empresa_id,app_id) REFERENCES apps.apps(empresa_id,id)
);
ALTER TABLE apps.uso_diario ENABLE ROW LEVEL SECURITY;ALTER TABLE apps.uso_diario FORCE ROW LEVEL SECURITY;
REVOKE ALL ON apps.uso_diario FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON apps.uso_diario TO apps_runtime;
CREATE POLICY leitura ON apps.uso_diario FOR SELECT TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL);
CREATE POLICY contagem ON apps.uso_diario FOR INSERT TO apps_runtime WITH CHECK(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL);
CREATE POLICY soma ON apps.uso_diario FOR UPDATE TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL) WITH CHECK(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL);
COMMIT;

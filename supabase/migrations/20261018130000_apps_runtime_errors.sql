BEGIN;
SET LOCAL lock_timeout='10s';
-- Errors raised while an app runs in a browser (preview, published or public link), so the
-- author and the AI can see and fix them. Repeated errors are counted once per version.
CREATE TABLE apps.erros_execucao(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,app_id uuid NOT NULL,versao_id uuid NOT NULL,
 modo text NOT NULL CHECK(modo IN ('previa','publicado','publico')),assinatura text NOT NULL CHECK(length(assinatura)<=64),
 mensagem text NOT NULL CHECK(length(mensagem) BETWEEN 1 AND 1000),origem text NOT NULL DEFAULT '' CHECK(length(origem)<=300),pilha text NOT NULL DEFAULT '' CHECK(length(pilha)<=4000),
 ocorrencias integer NOT NULL DEFAULT 1 CHECK(ocorrencias>0),primeira_em timestamptz NOT NULL DEFAULT now(),ultima_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,app_id,versao_id) REFERENCES apps.versoes(empresa_id,app_id,id) ON DELETE CASCADE,
 UNIQUE(empresa_id,versao_id,modo,assinatura)
);
CREATE INDEX apps_erros_recentes ON apps.erros_execucao(empresa_id,app_id,ultima_em DESC);
ALTER TABLE apps.erros_execucao ENABLE ROW LEVEL SECURITY;ALTER TABLE apps.erros_execucao FORCE ROW LEVEL SECURITY;
REVOKE ALL ON apps.erros_execucao FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON apps.erros_execucao TO apps_runtime;
-- Anyone who can open the app reports errors (read-only members included); authors clear them on save.
CREATE POLICY leitura ON apps.erros_execucao FOR SELECT TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL);
CREATE POLICY registro ON apps.erros_execucao FOR INSERT TO apps_runtime WITH CHECK(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL);
CREATE POLICY contagem ON apps.erros_execucao FOR UPDATE TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL) WITH CHECK(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IS NOT NULL);
CREATE POLICY limpeza ON apps.erros_execucao FOR DELETE TO apps_runtime USING(empresa_id=apps.empresa_atual() AND (SELECT apps.papel_atual()) IN ('owner','admin','member'));
COMMIT;

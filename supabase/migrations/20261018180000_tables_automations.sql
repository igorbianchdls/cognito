BEGIN;
SET LOCAL lock_timeout='10s';
-- Automations: when a record is created, changed or moved to the trash, a webhook receives it.
-- Events are queued in the same transaction as the edit (nothing is lost) and delivered right
-- after the request, with retries. Only base administrators see or change automations: the
-- secret that signs the deliveries is theirs.
CREATE TABLE tables.automacoes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,base_id uuid NOT NULL,tabela_id uuid NOT NULL,
 nome text NOT NULL CHECK(btrim(nome)<>'' AND length(nome)<=120),ativa boolean NOT NULL DEFAULT true,
 gatilho text NOT NULL CHECK(gatilho IN ('registro_criado','registro_alterado','registro_excluido')),
 filtros jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(filtros)='array'),combinacao text NOT NULL DEFAULT 'e' CHECK(combinacao IN ('e','ou')),
 url text NOT NULL CHECK(url ~ '^https://' AND length(url)<=2000),segredo text NOT NULL CHECK(length(segredo)>=32),
 versao integer NOT NULL DEFAULT 1,criado_por bigint NOT NULL REFERENCES shared.usuarios(id),criado_em timestamptz NOT NULL DEFAULT now(),atualizado_em timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(empresa_id,base_id,tabela_id) REFERENCES tables.tabelas(empresa_id,base_id,id),UNIQUE(empresa_id,id)
);
CREATE INDEX automacoes_tabela ON tables.automacoes(empresa_id,tabela_id) WHERE ativa;
CREATE TABLE tables.entregas(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),empresa_id bigint NOT NULL,automacao_id uuid NOT NULL,registro_id uuid NOT NULL,
 evento text NOT NULL CHECK(evento IN ('registro_criado','registro_alterado','registro_excluido','teste')),
 estado text NOT NULL DEFAULT 'pendente' CHECK(estado IN ('pendente','entregue','falhou','ignorada')),
 tentativas integer NOT NULL DEFAULT 0,proximo_em timestamptz NOT NULL DEFAULT now(),resposta integer,erro text CHECK(length(erro)<=500),
 criado_em timestamptz NOT NULL DEFAULT now(),concluido_em timestamptz,
 FOREIGN KEY(empresa_id,automacao_id) REFERENCES tables.automacoes(empresa_id,id) ON DELETE CASCADE
);
-- One pending delivery per automation, record and event: several writes of one edit send once.
CREATE UNIQUE INDEX entregas_pendente_unica ON tables.entregas(automacao_id,registro_id,evento) WHERE estado='pendente';
CREATE INDEX entregas_fila ON tables.entregas(proximo_em) WHERE estado='pendente';
CREATE INDEX entregas_automacao ON tables.entregas(empresa_id,automacao_id,criado_em DESC);

ALTER TABLE tables.automacoes ENABLE ROW LEVEL SECURITY;ALTER TABLE tables.entregas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON tables.automacoes,tables.entregas FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON tables.automacoes TO tables_runtime;
GRANT SELECT ON tables.entregas TO tables_runtime;
CREATE POLICY administracao ON tables.automacoes TO tables_runtime
 USING(empresa_id=tables.empresa_atual() AND base_id=ANY(CAST((SELECT tables.bases_permitidas('administrador')) AS uuid[])))
 WITH CHECK(empresa_id=tables.empresa_atual() AND base_id=ANY(CAST((SELECT tables.bases_permitidas('administrador')) AS uuid[])));
CREATE POLICY leitura ON tables.entregas FOR SELECT TO tables_runtime
 USING(empresa_id=tables.empresa_atual() AND EXISTS(SELECT 1 FROM tables.automacoes a WHERE a.empresa_id=entregas.empresa_id AND a.id=entregas.automacao_id));

-- Queues the events of a record write. Runs as owner: editors cannot read automations, yet their
-- edits must still notify them. A record just created does not also send "changed" for the same edit.
CREATE FUNCTION tables.enfileirar_entregas() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE evento text;
BEGIN
 IF TG_OP='INSERT' THEN evento:='registro_criado';
 ELSIF OLD.excluido_em IS NULL AND NEW.excluido_em IS NOT NULL THEN evento:='registro_excluido';
 ELSIF NEW.excluido_em IS NULL AND (NEW.valores IS DISTINCT FROM OLD.valores OR NEW.versao<>OLD.versao) THEN evento:='registro_alterado';
 ELSE RETURN NULL; END IF;
 INSERT INTO tables.entregas(empresa_id,automacao_id,registro_id,evento)
 SELECT a.empresa_id,a.id,NEW.id,evento FROM tables.automacoes a
 WHERE a.empresa_id=NEW.empresa_id AND a.tabela_id=NEW.tabela_id AND a.ativa AND a.gatilho=evento
 AND NOT (evento='registro_alterado' AND EXISTS(SELECT 1 FROM tables.entregas e WHERE e.automacao_id=a.id AND e.registro_id=NEW.id AND e.evento='registro_criado' AND e.estado='pendente'))
 ON CONFLICT DO NOTHING;
 RETURN NULL;
END $$;
CREATE TRIGGER enfileirar_entregas AFTER INSERT OR UPDATE ON tables.registros FOR EACH ROW EXECUTE FUNCTION tables.enfileirar_entregas();
REVOKE ALL ON FUNCTION tables.enfileirar_entregas() FROM PUBLIC,anon,authenticated;
COMMIT;

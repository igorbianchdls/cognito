-- MCP: o domínio apps passa a registrar prévias, confirmações e resultados em plugin.drafts,
-- como Tables e WhatsApp. ERP continua exigindo record_id ao salvar.
BEGIN;
SET LOCAL lock_timeout='10s';
ALTER TABLE plugin.drafts DROP CONSTRAINT drafts_domain_check;
ALTER TABLE plugin.drafts ADD CONSTRAINT drafts_domain_check CHECK(domain IN ('erp','tables','whatsapp','apps'));
ALTER TABLE plugin.drafts DROP CONSTRAINT drafts_domain_result;
ALTER TABLE plugin.drafts ADD CONSTRAINT drafts_domain_result CHECK(
 (domain='erp' AND ((status='saved')=(record_id IS NOT NULL))) OR
 (domain IN ('tables','whatsapp','apps') AND ((status='saved')=(result IS NOT NULL)))
);
COMMIT;

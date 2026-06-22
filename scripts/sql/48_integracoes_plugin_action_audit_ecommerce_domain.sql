ALTER TABLE integrations.plugin_action_audit
  DROP CONSTRAINT IF EXISTS plugin_action_audit_domain_check;

ALTER TABLE integrations.plugin_action_audit
  ADD CONSTRAINT plugin_action_audit_domain_check
  CHECK (domain IN ('erp', 'crm', 'ecommerce'));

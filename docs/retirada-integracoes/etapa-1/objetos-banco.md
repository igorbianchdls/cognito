# Objetos de banco identificados no código

São declarações/referências em SQL versionado, não confirmação de existência no banco conectado. Etapa 6: verificar FKs, views, funções, triggers, jobs e grants no catálogo real antes de uma migração explícita de remoção. Não remover o schema plugin inteiro.

| Objeto candidato à retirada | Evidência histórica |
|---|---|
| `integrations.connected_accounts` | `scripts/sql/37_integrations_schema.sql` |
| `integrations.connections` | `scripts/sql/37_integrations_schema.sql`, `scripts/sql/39_integracoes_plugin_action_audit.sql`, `scripts/sql/40_integracoes_plugin_action_audit_fk_fix.sql`, `scripts/sql/51_integrations_dispatch_outbox.sql` |
| `integrations.destinations` | `scripts/sql/37_integrations_schema.sql`, `scripts/sql/51_integrations_dispatch_outbox.sql` |
| `integrations.events` | `scripts/sql/37_integrations_schema.sql` |
| `integrations.mcp_action_audit` | `scripts/sql/42_rename_mcp_app_to_plugin.sql` |
| `integrations.mcp_permissions` | `scripts/sql/42_rename_mcp_app_to_plugin.sql` |
| `integrations.pipelines` | `scripts/sql/37_integrations_schema.sql`, `scripts/sql/51_integrations_dispatch_outbox.sql` |
| `integrations.plugin_action_audit` | `scripts/sql/37_integrations_schema.sql`, `scripts/sql/39_integracoes_plugin_action_audit.sql`, `scripts/sql/40_integracoes_plugin_action_audit_fk_fix.sql`, `scripts/sql/42_rename_mcp_app_to_plugin.sql`, `scripts/sql/48_integracoes_plugin_action_audit_ecommerce_domain.sql` |
| `integrations.plugin_permissions` | `scripts/sql/37_integrations_schema.sql`, `scripts/sql/38_integracoes_plugin_live_read_permissions.sql`, `scripts/sql/42_rename_mcp_app_to_plugin.sql` |
| `integrations.providers` | `scripts/sql/37_integrations_schema.sql` |
| `integrations.sync_cursors` | `scripts/sql/37_integrations_schema.sql` |
| `integrations.sync_dispatch_outbox` | `scripts/sql/51_integrations_dispatch_outbox.sql` |
| `integrations.sync_runs` | `scripts/sql/37_integrations_schema.sql`, `scripts/sql/51_integrations_dispatch_outbox.sql` |
| `plugin.connector_sync_runs` | `scripts/sql/21_plugin_connectors.sql` |
| `plugin.connectors` | `scripts/sql/21_plugin_connectors.sql` |
| `plugin.integration_connections` | `scripts/sql/27_integracoes_connections.sql`, `scripts/sql/28_integracoes_events.sql`, `scripts/sql/29_integracoes_scheduling.sql`, `scripts/sql/32_integracoes_destinations_pipelines.sql`, `scripts/sql/34_integracoes_marketing_advertising_connectors.sql`, `scripts/sql/36_integracoes_analytics_connectors.sql` |
| `plugin.integration_destinations` | `scripts/sql/27_integracoes_connections.sql`, `scripts/sql/32_integracoes_destinations_pipelines.sql` |
| `plugin.integration_events` | `scripts/sql/28_integracoes_events.sql` |
| `plugin.integration_mcp_permissions` | `scripts/sql/42_rename_mcp_app_to_plugin.sql` |
| `plugin.integration_pipelines` | `scripts/sql/27_integracoes_connections.sql`, `scripts/sql/32_integracoes_destinations_pipelines.sql` |
| `plugin.integration_plugin_permissions` | `scripts/sql/27_integracoes_connections.sql`, `scripts/sql/32_integracoes_destinations_pipelines.sql`, `scripts/sql/42_rename_mcp_app_to_plugin.sql` |
| `plugin.integration_provider_capabilities` | `scripts/sql/27_integracoes_connections.sql`, `scripts/sql/34_integracoes_marketing_advertising_connectors.sql`, `scripts/sql/36_integracoes_analytics_connectors.sql` |
| `plugin.integration_sync_cursors` | `scripts/sql/27_integracoes_connections.sql` |
| `plugin.integration_sync_runs` | `scripts/sql/27_integracoes_connections.sql`, `scripts/sql/32_integracoes_destinations_pipelines.sql` |

Preservar shared.tenants, shared.users, shared.tenant_memberships e todas as estruturas do ERP/IA/artifacts ainda utilizadas. scripts/sql/43_shared_tenant_identity.sql é misto. scripts/sql/50_artifacts_dashboard_security.sql contém identidade do artifact e auditoria: adaptar por nova migração apenas se necessário.

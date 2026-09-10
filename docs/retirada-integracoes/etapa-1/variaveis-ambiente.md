# Variáveis referenciadas no código

Somente nomes e consumidores; nenhum arquivo de credenciais ou .env.local foi copiado. Esta lista não confirma quais variáveis estão configuradas nos ambientes. Nomes genéricos GCP/GOOGLE/OAUTH exigem conferência de uso compartilhado antes da retirada.

| Nome | Consumidores no código |
|---|---|
| `BIGQUERY_CREDENTIALS_JSON` | `scripts/artifacts/dashboard-query-live-smoke.mjs`, `scripts/integracoes/diagnose-conta-azul-oauth.mjs`, `scripts/plugin/connected-erp-bigquery-smoke.mjs`, `scripts/plugin/tool-call.mjs`, `src/lib/bigqueryClient.ts`, `src/products/integracoes/cloud/src/lib/googleAuth.ts` |
| `BIGQUERY_CUSTOM_RAW_DATASET` | `src/products/integracoes/datawarehouse/config/gcpConfig.ts`, `src/products/plugin/server/domain-adapters/shared/connectedBigQueryReader.ts` |
| `BIGQUERY_FIVETRAN_RAW_DATASET` | `src/products/integracoes/datawarehouse/config/gcpConfig.ts` |
| `BIGQUERY_INSERT_MAX_BYTES` | `src/products/integracoes/datawarehouse/bigquery/bigquery.ts`, `src/products/integracoes/datawarehouse/normalization/bigquery/normalizedWriter.ts` |
| `BIGQUERY_INSERT_MAX_ROWS` | `src/products/integracoes/datawarehouse/bigquery/bigquery.ts`, `src/products/integracoes/datawarehouse/normalization/bigquery/normalizedWriter.ts` |
| `BIGQUERY_LOCATION` | `scripts/provision-tenant-bigquery.mjs`, `src/app/api/internal/observability/connectors/test/bigquery/route.ts`, `src/app/api/internal/observability/connectors/test/conta-azul-flow/route.ts`, `src/products/integracoes/datawarehouse/bigquery/bigquery.ts`, `src/products/integracoes/datawarehouse/normalization/bigquery/normalizedWriter.ts`, `src/products/integracoes/datawarehouse/provisioning/tenantBigQueryProvisioning.ts` |
| `BIGQUERY_NORMALIZED_DATASET` | `src/products/integracoes/datawarehouse/config/gcpConfig.ts` |
| `BIGQUERY_PROJECT_ID` | `src/lib/bigqueryClient.ts` |
| `CONTROL_API_SERVICE_ACCOUNT` | `src/products/integracoes/datawarehouse/config/gcpConfig.ts` |
| `DASHBOARD_QUERY_BYTES_PER_MINUTE` | `src/products/artifacts/dashboard/query/dashboardQueryService.ts` |
| `DASHBOARD_QUERY_LIMIT_PER_MINUTE` | `src/products/artifacts/dashboard/query/dashboardQueryService.ts` |
| `DASHBOARD_QUERY_MAX_BYTES` | `src/products/artifacts/dashboard/query/dashboardQueryService.ts` |
| `DASHBOARD_QUERY_TIMEOUT_MS` | `src/products/artifacts/dashboard/query/dashboardQueryService.ts` |
| `GCP_BIGQUERY_LOCATION` | `scripts/provision-tenant-bigquery.mjs`, `src/app/api/internal/observability/connectors/test/bigquery/route.ts`, `src/app/api/internal/observability/connectors/test/conta-azul-flow/route.ts`, `src/products/integracoes/datawarehouse/bigquery/bigquery.ts`, `src/products/integracoes/datawarehouse/normalization/bigquery/normalizedWriter.ts`, `src/products/integracoes/datawarehouse/provisioning/tenantBigQueryProvisioning.ts` |
| `GCP_HTTP_RETRY_ATTEMPTS` | `src/products/integracoes/cloud/src/lib/googleAuth.ts` |
| `GCP_HTTP_TIMEOUT_MS` | `scripts/provision-tenant-bigquery.mjs`, `src/products/integracoes/cloud/src/lib/googleAuth.ts` |
| `GCP_PROJECT_ID` | `scripts/integracoes/diagnose-conta-azul-oauth.mjs`, `scripts/provision-tenant-bigquery.mjs`, `src/lib/bigqueryClient.ts`, `src/products/integracoes/cloud/src/lib/internalAuth.ts`, `src/products/integracoes/cloud/src/worker/jobs/runSyncChunkJob.ts`, `src/products/integracoes/cloud/src/worker/jobs/runSyncJob.ts`, `src/products/integracoes/datawarehouse/config/gcpConfig.ts`, `src/products/integracoes/datawarehouse/provisioning/tenantBigQueryRepository.ts`, `src/products/integracoes/server/integrationConnectionRepository.ts` |
| `GCP_REGION` | `src/products/integracoes/datawarehouse/config/gcpConfig.ts` |
| `GCP_TOKEN_TIMEOUT_MS` | `src/products/integracoes/cloud/src/lib/googleAuth.ts` |
| `GOOGLE_ADS_CUSTOMER_ID` | `src/products/integracoes/connectors/advertising/googleAds/googleAdsResources.ts` |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | `src/products/integracoes/connectors/advertising/googleAds/googleAdsResources.ts`, `src/products/plugin/server/domain-adapters/paid-media/providers/paidMediaApiAdapters.ts` |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | `src/products/integracoes/connectors/advertising/googleAds/googleAdsResources.ts`, `src/products/plugin/server/domain-adapters/paid-media/providers/paidMediaApiAdapters.ts` |
| `GOOGLE_ADS_RATE_LIMIT_MS` | `src/products/integracoes/connectors/advertising/googleAds/googleAdsConnector.ts` |
| `GOOGLE_ANALYTICS_4_PROPERTY_ID` | `src/products/integracoes/connectors/marketing/googleAnalytics4/googleAnalytics4Resources.ts` |
| `GOOGLE_ANALYTICS_4_RATE_LIMIT_MS` | `src/products/integracoes/connectors/marketing/googleAnalytics4/googleAnalytics4Connector.ts` |
| `GOOGLE_APPLICATION_CREDENTIALS` | `scripts/artifacts/dashboard-query-live-smoke.mjs`, `scripts/integracoes/diagnose-conta-azul-oauth.mjs`, `scripts/plugin/connected-erp-bigquery-smoke.mjs`, `scripts/plugin/tool-call.mjs` |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | `scripts/artifacts/dashboard-query-live-smoke.mjs`, `scripts/integracoes/diagnose-conta-azul-oauth.mjs`, `scripts/plugin/connected-erp-bigquery-smoke.mjs`, `scripts/plugin/tool-call.mjs`, `src/lib/bigqueryClient.ts`, `src/products/integracoes/cloud/src/lib/googleAuth.ts` |
| `GOOGLE_CLOUD_PROJECT` | `src/lib/bigqueryClient.ts` |
| `GOOGLE_MY_BUSINESS_ACCOUNT_ID` | `src/products/integracoes/connectors/analytics/googleMyBusiness/googleMyBusinessResources.ts` |
| `GOOGLE_MY_BUSINESS_DAILY_METRIC` | `src/products/integracoes/connectors/analytics/googleMyBusiness/googleMyBusinessResources.ts` |
| `GOOGLE_MY_BUSINESS_LOCATION_ID` | `src/products/integracoes/connectors/analytics/googleMyBusiness/googleMyBusinessResources.ts` |
| `GOOGLE_MY_BUSINESS_RATE_LIMIT_MS` | `src/products/integracoes/connectors/analytics/googleMyBusiness/googleMyBusinessConnector.ts` |
| `GOOGLE_OAUTH_ACCESS_TOKEN` | `scripts/integracoes/diagnose-conta-azul-oauth.mjs`, `scripts/plugin/tool-call.mjs`, `scripts/provision-tenant-bigquery.mjs`, `src/products/integracoes/cloud/src/lib/googleAuth.ts`, `src/products/observability/frontend/features/connectors/lib/providerReadiness.ts` |
| `GOOGLE_SEARCH_CONSOLE_RATE_LIMIT_MS` | `src/products/integracoes/connectors/marketing/googleSearchConsole/googleSearchConsoleConnector.ts` |
| `GOOGLE_SEARCH_CONSOLE_SITE_URL` | `src/products/integracoes/connectors/marketing/googleSearchConsole/googleSearchConsoleResources.ts` |
| `INTEGRACOES_API_TENANT_ID` | `src/products/integracoes/server/integrationTenantAuth.ts` |
| `INTEGRACOES_API_TOKEN` | `src/products/integracoes/server/integrationApiAuth.ts` |
| `INTEGRACOES_DEV_TENANT_ID` | `src/products/integracoes/server/integrationTenantAuth.ts` |
| `INTEGRATIONS_CONTROL_API_URL` | `src/app/api/internal/observability/connectors/test/gcloud/route.ts`, `src/products/integracoes/cli/syncCli.mjs`, `src/products/integracoes/cloud/src/lib/internalAuth.ts`, `src/products/integracoes/server/integrationControlClient.ts` |
| `INTEGRATIONS_OAUTH_REDIRECT_URI` | `scripts/integracoes/diagnose-conta-azul-oauth.mjs`, `src/products/integracoes/connectors/oauth/providerConfig.ts`, `src/products/observability/frontend/features/connectors/lib/providerReadiness.ts` |
| `INTEGRATIONS_OAUTH_STATE_SECRET` | `src/products/integracoes/connectors/oauth/oauth.ts` |
| `INTEGRATIONS_OAUTH_TIMEOUT_MS` | `src/products/integracoes/connectors/oauth/tokenExchange.ts` |
| `MCP_APPS_BIGQUERY_DATASET` | `src/products/plugin/server/domain-adapters/shared/connectedBigQueryReader.ts` |
| `PLUGIN_BIGQUERY_DATASET` | `src/products/plugin/server/domain-adapters/shared/connectedBigQueryReader.ts` |
| `PUBSUB_DEAD_LETTER_TOPIC` | `src/products/integracoes/datawarehouse/config/gcpConfig.ts` |
| `PUBSUB_SYNC_TOPIC` | `src/products/integracoes/datawarehouse/config/gcpConfig.ts` |
| `PUBSUB_WORKER_SUBSCRIPTION` | `src/products/integracoes/datawarehouse/config/gcpConfig.ts` |
| `SECRET_INTERNAL_API_KEY` | `src/products/integracoes/datawarehouse/config/gcpConfig.ts` |
| `SECRET_PREFIX` | `scripts/integracoes/diagnose-conta-azul-oauth.mjs`, `src/products/integracoes/datawarehouse/config/gcpConfig.ts` |
| `WORKER_HTTP_SERVER` | `src/products/integracoes/cloud/src/worker/index.ts` |
| `WORKER_SERVICE_ACCOUNT` | `src/products/integracoes/datawarehouse/config/gcpConfig.ts` |

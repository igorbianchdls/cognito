# Inventário de arquivos — etapa 1

Gerado em 2026-09-07T21:17:46.568Z. Base: arquivos versionados presentes no workspace.

Método: busca textual + fechamento de imports estáticos relativos e @/. Não resolve imports dinâmicos calculados nem recursos remotos. Linhas indicam referências textuais, sem reproduzir conteúdo ou segredos. PRESERVAR / VALIDAR inclui consumidores indiretos: não significa que todos precisem de edição.

Cada arquivo abaixo tem uma destinação de planejamento. A execução deve verificar consumidores remanescentes antes de excluir qualquer arquivo.

Arquivos classificados: **571**. Produto Integrações versionado: **253**.

- ADAPTAR: 30
- REGENERAR: 3
- APAGAR: 379
- PRESERVAR HISTÓRICO: 23
- PRESERVAR: 56
- PRESERVAR / VALIDAR: 47
- PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS: 32
- ADAPTAR / RETIRAR EXECUTOR: 1

| Arquivo | Destino | Etapa | Evidência / motivo |
|---|---|---|---|
| `.env.example` | ADAPTAR | 2–4 | Linhas 6, 8, 9, 10, 14, 15, 31, 32, 33, 34, 35, 36…. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `.gitignore` | ADAPTAR | 4 | Linhas 33, 50. Retirar apenas caminho/comentário obsoleto; manter proteções de credenciais, .env e arquivos gerados. |
| `package.json` | ADAPTAR | 2–4 | Linhas 44. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `pnpm-lock.yaml` | REGENERAR | 4 | Atualizar com o gerenciador após retirar a dependência BigQuery; não editar manualmente. |
| `scripts/artifacts/architecture-smoke.mjs` | ADAPTAR | 3–4 | Linhas 53, 55, 59, 60, 64, 67. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `scripts/artifacts/dashboard-query-live-smoke.mjs` | APAGAR | 4 | Linhas 10, 246, 248, 403, 404. Teste live exclusivo do executor BigQuery retirado; substituir apenas por teste do recurso mantido, se necessário. |
| `scripts/artifacts/dashboard-query-smoke.mjs` | ADAPTAR | 3–4 | Linhas 72. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `scripts/integracoes/diagnose-conta-azul-oauth.mjs` | APAGAR | 4 | Linhas 32, 182, 258, 321, 367, 368, 439, 461, 523. Utilitário exclusivo de conectores ou BigQuery. |
| `scripts/integracoes/sync.mjs` | APAGAR | 4 | Linhas 3, 4. Utilitário exclusivo de conectores ou BigQuery. |
| `scripts/plugin/connected-erp-bigquery-smoke.mjs` | APAGAR | 4 | Linhas 10, 14, 86, 123, 125, 157, 165, 230, 231. Utilitário exclusivo de conectores ou BigQuery. |
| `scripts/plugin/connected-pre-oauth-smoke.mjs` | APAGAR | 4 | Linhas 17, 38, 39, 41, 42, 44, 45, 46, 47, 48, 50, 53…. Utilitário exclusivo de conectores ou BigQuery. |
| `scripts/plugin/smoke-test.mjs` | ADAPTAR | 2–4 | Linhas 224, 229. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `scripts/plugin/tool-call.mjs` | ADAPTAR | 4 | Linhas 11, 12, 33, 34, 35, 39, 56, 148, 151, 175, 189, 243…. Retirar preparação BigQuery e utilitários importados de Integrações; preservar chamadas locais úteis. |
| `scripts/provision-tenant-bigquery.mjs` | APAGAR | 4 | Linhas 28, 57, 101, 106, 113, 115, 129, 131, 147, 159, 162, 183. Utilitário exclusivo de conectores ou BigQuery. |
| `scripts/sql/21_plugin_connectors.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 3, 24, 27, 39, 40, 41, 42, 79, 127, 169, 223, 248…. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/23_crm_seed_b2b_2026h1.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 490, 516. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/27_integracoes_connections.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 83, 92, 94. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/28_integracoes_events.sql` | PRESERVAR HISTÓRICO | 6 | Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/29_integracoes_scheduling.sql` | PRESERVAR HISTÓRICO | 6 | Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/30_integracoes_omie_resources.sql` | PRESERVAR HISTÓRICO | 6 | Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/31_integracoes_conta_azul_bling_resources.sql` | PRESERVAR HISTÓRICO | 6 | Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/32_integracoes_destinations_pipelines.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 13, 22, 24, 117, 122, 123, 127, 128, 136, 138, 142, 150…. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/33_integracoes_crm_connectors.sql` | PRESERVAR HISTÓRICO | 6 | Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/34_integracoes_marketing_advertising_connectors.sql` | PRESERVAR HISTÓRICO | 6 | Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/35_integracoes_ecommerce_connectors.sql` | PRESERVAR HISTÓRICO | 6 | Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/36_integracoes_analytics_connectors.sql` | PRESERVAR HISTÓRICO | 6 | Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/37_integrations_schema.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 5, 38, 67, 110, 114, 126, 136, 168, 172, 176, 202, 206…. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/38_integracoes_plugin_live_read_permissions.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 3, 12, 14. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/39_integracoes_plugin_action_audit.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 3, 35, 40, 43, 46, 49. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/40_integracoes_plugin_action_audit_fk_fix.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 3, 6, 9. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/42_rename_mcp_app_to_plugin.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 26, 27, 28, 31, 32, 33, 86, 95, 100, 103, 123, 132…. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/43_shared_tenant_identity.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 209, 211, 213, 215, 217, 219, 221, 223, 225, 323, 324, 325…. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/44_integracoes_bigquery_tenant_datasets.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 3, 9, 10, 11, 19, 22, 23. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/47_integracoes_bigquery_org_datasets.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 3, 18, 25. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/48_integracoes_plugin_action_audit_ecommerce_domain.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 1, 4. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/49_integrations_initial_sync_idempotency.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 2. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `scripts/sql/51_integrations_dispatch_outbox.sql` | PRESERVAR HISTÓRICO | 6 | Linhas 1, 29, 33, 37, 41, 46, 49, 68, 78, 79, 82, 95…. Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico. |
| `src/app/(navigation)/integracoes/callback/page.tsx` | APAGAR | 4 | Linhas 1, 3. Rotas exclusivas da plataforma antiga. |
| `src/app/(navigation)/integracoes/page.tsx` | APAGAR | 4 | Linhas 1, 3. Rotas exclusivas da plataforma antiga. |
| `src/app/api/ai/approvals/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/ai/connections/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/ai/executions/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/artifacts/_artifactRouteHandlers.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/artifacts/dashboards/[id]/query/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/artifacts/dashboards/[id]/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/artifacts/dashboards/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/artifacts/reports/[id]/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/artifacts/reports/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/artifacts/slides/[id]/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/artifacts/slides/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/auth/bootstrap/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/auth/onboarding/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/clerk/webhooks/route.ts` | ADAPTAR | 2 | Linhas 16, 103. Preservar identidade e acesso; retirar provisionamento e destinos antigos. |
| `src/app/api/erp/[entityId]/[id]/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/[entityId]/resumo/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/[entityId]/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/acesso/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/automacoes/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/bancos/importar-ofx/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/catalogos/busca/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/catalogos/categorias/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/compras/[id]/cancelar/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/compras/[id]/confirmar/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/compras/[id]/receber/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/compras/[id]/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/compras/catalogos/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/compras/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/conciliacao/concluidas/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/conciliacao/regras/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/conciliacao/sugestoes/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/conciliacao/transacoes/[id]/desfazer/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/conciliacao/transacoes/[id]/ignorar/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/contas-pagar-parcelas/[id]/baixar/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/contas-receber-parcelas/[id]/baixar/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/contratos/processar/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/fechamentos/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/importacoes/[type]/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/notas-compra/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/operacoes/[resource]/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/operacoes/catalogos/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/orcamentos/[id]/acao/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/orcamentos/[id]/converter/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/ordens-servico/[id]/acao/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/ordens-servico/[id]/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/ordens-servico/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/pagamentos/[id]/estornar/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/pagamentos/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/recorrencias/processar/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/relatorios/[report]/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/resumo/profissional/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/resumo/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/vendas/[id]/atender-parcial/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/vendas/[id]/atender/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/vendas/[id]/cancelar/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/vendas/[id]/confirmar/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/vendas/[id]/pre-validacao-fiscal/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/vendas/[id]/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/vendas/catalogos/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/erp/vendas/route.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/api/integracoes/connections/[id]/configuration/route.ts` | APAGAR | 4 | Linhas 3, 4, 5, 7, 8, 9, 10, 20, 24, 25, 26, 30…. Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/connections/[id]/events/route.ts` | APAGAR | 4 | Linhas 6, 10, 14. Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/connections/[id]/mcp-permissions/route.ts` | APAGAR | 4 | Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/connections/[id]/plugin-permissions/route.ts` | APAGAR | 4 | Linhas 7, 11, 15, 95. Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/connections/[id]/reconnect/route.ts` | APAGAR | 4 | Linhas 3, 4, 5, 9. Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/connections/[id]/route.ts` | APAGAR | 4 | Linhas 8, 9, 15, 19, 20, 21. Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/connections/[id]/sync/route.ts` | APAGAR | 4 | Linhas 3, 7, 8. Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/connections/route.ts` | APAGAR | 4 | Linhas 7, 8, 9, 10, 14, 15. Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/destinations/route.ts` | APAGAR | 4 | Linhas 6, 10, 14, 25, 34. Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/pipelines/route.ts` | APAGAR | 4 | Linhas 6, 10, 11. Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/providers/route.ts` | APAGAR | 4 | Linhas 5, 6, 7, 8, 9. Rotas exclusivas da plataforma antiga. |
| `src/app/api/integracoes/users/route.ts` | APAGAR | 4 | Linhas 6. Rotas exclusivas da plataforma antiga. |
| `src/app/api/internal/observability/connectors/bigquery-tenants/route.ts` | APAGAR | 4 | Linhas 4, 34, 37. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/app/api/internal/observability/connectors/test/bigquery/route.ts` | APAGAR | 4 | Linhas 1, 5, 6, 7, 11, 12, 13, 30, 33, 46, 48, 58…. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/app/api/internal/observability/connectors/test/conta-azul-flow/route.ts` | APAGAR | 4 | Linhas 1, 5, 6, 7, 8, 9, 10, 12, 17, 21, 22, 23…. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/app/api/internal/observability/connectors/test/gcloud/route.ts` | APAGAR | 4 | Linhas 6, 7, 18, 48, 59. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/app/api/internal/observability/connectors/test/plugin/route.ts` | APAGAR | 4 | Linhas 7, 11. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/app/api/internal/observability/connectors/test/tenant/route.ts` | APAGAR | 4 | Linhas 7, 38, 39, 40, 41, 42. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/app/api/settings/members/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/settings/profile/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/settings/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/api/settings/workspace/route.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/artifacts/dashboards/[id]/page.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/artifacts/dashboards/page.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/artifacts/reports/[id]/page.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/artifacts/reports/page.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/artifacts/slides/[id]/page.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/artifacts/slides/page.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/configuracoes/integracoes-ia/page.tsx` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/configuracoes/page.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/emissor-nota-fiscal/page.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/erp/[section]/[module]/page.tsx` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/erp/page.tsx` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/app/globals.css` | ADAPTAR | 2–4 | Linhas 248, 252, 261, 270, 275, 284, 285, 288, 289, 292, 307, 312…. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/app/internal/observability/connectors/page.tsx` | APAGAR | 4 | Linhas 22. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/app/internal/observability/connectors/test/page.tsx` | APAGAR | 4 | Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/app/layout.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/lp-a/page.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/app/onboarding/page.tsx` | ADAPTAR | 2 | Linhas 19. Preservar identidade e acesso; retirar provisionamento e destinos antigos. |
| `src/app/page.tsx` | ADAPTAR | 2 | Linhas 4. Preservar identidade e acesso; retirar provisionamento e destinos antigos. |
| `src/app/remotion-preview/01/page.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/app/remotion-preview/02/page.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/app/remotion-preview/layout.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/app/remotion-preview/page.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 2217, 2301. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/landingpages/otto-fiscal/FiscalLandingPage.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/landingpages/otto-fiscal/components/FiscalBenefitsSection.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 72. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/landingpages/otto/OttoLandingPageVariants.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 148, 259, 262, 271, 273, 275, 277, 278, 282, 303, 324, 325…. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpAnalysisView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpAutomationView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpCashFlowView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpChartView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpConnectorsView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 1, 2, 5, 8. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpDashboardListView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpDashboardPreviewView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpDataCatalogView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpDreView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpLineChartView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpPieChartView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/components/AnimatedMcpTableView.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/compositions/ChatGptMobileMarketing.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 627, 639, 640, 649, 650. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/compositions/ChatGptOperationalFlowsVideo.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/compositions/ClaudeFinancialAgentsVideo.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/compositions/ClaudeOperationalFlowsVideo.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/compositions/McpChartIntro.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 23, 32, 128, 623. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/compositions/McpOperationsDemo.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 13, 21, 257, 2778. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/compositions/OttoAssistantConnections.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 16. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/compositions/OttoErpAccountsDrawerAction.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 49, 184. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/compositions/OttoErpHomeDashboard.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 21, 224. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/compositions/OttoIntegrationAccessMap.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 21, 219, 220, 573. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/download-root.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/saas/index.ts` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/remotion/saas/productComponents.tsx` | PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS | 4 | Linhas 19. Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes. |
| `src/assets/skills/connected-erp-conta-azul/SKILL.md` | APAGAR | 4 | Linhas 3, 18, 21, 22, 28, 30, 38, 42, 48, 56, 60, 84. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/connected-erp-conta-azul/agents/openai.yaml` | APAGAR | 4 | Linhas 4. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/connected-erp-conta-azul/references/tool-call-examples.md` | APAGAR | 4 | Linhas 12, 27, 42, 57, 72, 86, 102, 123, 125, 130, 139, 144…. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/integracoes-data-platform/SKILL.md` | APAGAR | 4 | Linhas 2, 3, 10, 23, 24, 25, 26, 27, 28, 29, 33, 37…. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/integracoes-data-platform/agents/openai.yaml` | APAGAR | 4 | Linhas 3, 4. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/integracoes-data-platform/references/bigquery.md` | APAGAR | 4 | Linhas 1, 17, 52. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/integracoes-data-platform/references/conta-azul.md` | APAGAR | 4 | Linhas 35. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/integracoes-data-platform/references/fivetran-grade-checklist.md` | APAGAR | 4 | Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/integracoes-data-platform/references/sync-engine.md` | APAGAR | 4 | Linhas 8, 15, 39, 40, 55. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/integracoes-data-platform/references/testing.md` | APAGAR | 4 | Linhas 19, 21, 31, 37, 39, 56, 65, 73, 77. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/integracoes-oauth/SKILL.md` | APAGAR | 4 | Linhas 2, 19, 23, 24, 25, 26, 27, 28, 39. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/integracoes-oauth/agents/openai.yaml` | APAGAR | 4 | Linhas 4. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/assets/skills/integracoes-oauth/references/oauth-flow.md` | APAGAR | 4 | Linhas 17, 21, 23, 25, 27, 44, 45, 123, 152, 194, 198, 203…. Instruções de funcionalidades aposentadas; ajustar catálogo de skills. |
| `src/components/app-sidebar.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/components/nav-user.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/components/navigation/SidebarShadcn.tsx` | ADAPTAR | 2–4 | Linhas 149, 154. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/components/navigation/integrations/IntegrationCard.tsx` | ADAPTAR | 2–4 | Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/lib/bigqueryClient.ts` | APAGAR | 4 | Linhas 1, 33, 37, 44, 50, 54, 60, 62, 63, 74. Utilitário exclusivo de conectores ou BigQuery. |
| `src/products/ai-platform/README.md` | PRESERVAR | 2–5 | Linhas 27. Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/products/artifacts/dashboard/DashboardListPage.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/artifacts/dashboard/pages/DashboardListPage.tsx` | ADAPTAR | 3–4 | Linhas 548, 551, 555, 559. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/products/artifacts/dashboard/query/dashboardQueryPreflight.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/artifacts/dashboard/query/dashboardQueryPreview.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/artifacts/dashboard/query/dashboardQueryService.ts` | ADAPTAR / RETIRAR EXECUTOR | 3 | Linhas 3, 6, 7, 374, 375, 377. Eliminar executor BigQuery; preservar apenas contratos realmente necessários ao ERP. |
| `src/products/artifacts/dashboard/templates/dashboardGoogleAdsTemplate.tsx` | ADAPTAR | 3–4 | Linhas 31, 54, 64, 74, 84, 108, 126, 145, 164, 209, 241, 279…. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/products/artifacts/dashboard/templates/dashboardMetaAdsTemplate.tsx` | ADAPTAR | 3–4 | Linhas 31, 52, 56, 63, 67, 83, 84, 85, 86, 115, 134, 159…. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/products/artifacts/dashboard/templates/dashboardTemplate.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/auth/frontend/components/AuthOnboardingForm.tsx` | ADAPTAR | 2 | Linhas 42. Preservar identidade e acesso; retirar provisionamento e destinos antigos. |
| `src/products/auth/frontend/components/AuthUserMenu.tsx` | ADAPTAR | 2 | Linhas 120. Preservar identidade e acesso; retirar provisionamento e destinos antigos. |
| `src/products/auth/frontend/pages/SettingsPage.tsx` | ADAPTAR | 2 | Preservar identidade e acesso; retirar provisionamento e destinos antigos. |
| `src/products/auth/server/authTenantResolver.ts` | ADAPTAR | 2 | Preservar identidade e acesso; retirar provisionamento e destinos antigos. |
| `src/products/auth/server/clerkTenantBootstrap.ts` | ADAPTAR | 2 | Linhas 9, 431. Preservar identidade e acesso; retirar provisionamento e destinos antigos. |
| `src/products/erp/frontend/pages/ErpPage.tsx` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/products/erp/server/erpAccess.ts` | PRESERVAR | 2–5 | Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada. |
| `src/products/integracoes/cli/shared/args.mjs` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cli/shared/env.mjs` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cli/shared/output.mjs` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cli/syncCli.mjs` | APAGAR | 4 | Linhas 35, 39, 41, 55, 56, 80, 92, 111, 118, 124, 147, 168…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/.env.example` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/Dockerfile.control-api` | APAGAR | 4 | Linhas 12, 20. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/Dockerfile.worker` | APAGAR | 4 | Linhas 12, 19. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/GCP_RUNBOOK.md` | APAGAR | 4 | Linhas 1, 3, 65, 66, 67, 74, 75, 81, 85, 86, 94, 95…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/PRE_OAUTH_PROVIDERS.md` | APAGAR | 4 | Linhas 11, 12, 13, 19, 20, 21, 41, 59, 60, 61, 62, 63…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/README.md` | APAGAR | 4 | Linhas 1, 9, 10, 12, 14, 35, 36, 37, 39, 40, 41, 42…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/deploy/README.md` | APAGAR | 4 | Linhas 3, 11, 12, 13, 22, 30, 37, 43, 49, 56. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/deploy/cloud-run-control-api.yaml` | APAGAR | 4 | Linhas 4, 14, 16, 24, 25, 26, 27, 28, 29, 31, 33, 35…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/deploy/cloud-run-worker-service.yaml` | APAGAR | 4 | Linhas 4, 14, 16, 26, 27, 28, 29, 30, 31, 33, 35. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/deploy/cloud-run-worker.yaml` | APAGAR | 4 | Linhas 4, 13, 16, 22, 23, 24, 25, 26, 27, 29, 31. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/deploy/cloudbuild-control-api.yaml` | APAGAR | 4 | Linhas 6, 8, 11. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/deploy/cloudbuild-integrations.yaml` | APAGAR | 4 | Linhas 7, 9, 17, 19, 26, 34, 44, 45, 56, 57. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/deploy/cloudbuild-worker.yaml` | APAGAR | 4 | Linhas 6, 8, 11. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/package.json` | APAGAR | 4 | Linhas 2, 7, 8. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/control-api/index.ts` | APAGAR | 4 | Linhas 3. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/control-api/routes/callbacks.ts` | APAGAR | 4 | Linhas 4, 5, 6, 11, 12, 13, 28, 29, 112. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/control-api/routes/connections.ts` | APAGAR | 4 | Linhas 4, 5, 6, 7, 8, 14, 15, 16, 17, 123. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/control-api/routes/dispatchOutbox.ts` | APAGAR | 4 | Linhas 6, 7, 12, 13. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/control-api/routes/health.ts` | APAGAR | 4 | Linhas 1, 8. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/control-api/routes/postAuthSyncDispatch.ts` | APAGAR | 4 | Linhas 4, 5, 6, 53, 72. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/control-api/routes/providerReadiness.ts` | APAGAR | 4 | Linhas 4, 5, 6. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/control-api/routes/scheduledSync.ts` | APAGAR | 4 | Linhas 6, 7, 17. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/control-api/routes/sync.ts` | APAGAR | 4 | Linhas 4, 5, 6. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/control-api/server.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 6, 7, 8, 64. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/lib/googleAuth.ts` | APAGAR | 4 | Linhas 1, 5, 59. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/lib/internalAuth.ts` | APAGAR | 4 | Linhas 40, 52, 57, 58, 62, 67, 71, 87. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/lib/logger.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/lib/postgresStatus.ts` | APAGAR | 4 | Linhas 134, 162, 188, 222, 255, 271, 297, 318, 331, 376, 377, 380…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/lib/pubsub.ts` | APAGAR | 4 | Linhas 1, 2, 3. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/lib/secretManager.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/sync-engine/checkpointStore.ts` | APAGAR | 4 | Linhas 4, 6. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/sync-engine/chunkQueue.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/sync-engine/chunkTypes.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/sync-engine/orchestrator.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 6, 11, 15. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/worker/index.ts` | APAGAR | 4 | Linhas 3, 4, 5, 6, 189. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/worker/jobs/refreshTokenJob.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/worker/jobs/runSyncChunkJob.ts` | APAGAR | 4 | Linhas 1, 2, 3, 12, 13, 14, 15, 16, 17, 36, 38, 40…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/src/worker/jobs/runSyncJob.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 16, 17, 18, 47, 49, 51, 52…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/cloud/tsconfig.json` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/advertising/googleAds/googleAdsConnector.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/advertising/googleAds/googleAdsResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/advertising/googleAdsConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/advertising/metaAds/metaAdsConnector.ts` | APAGAR | 4 | Linhas 1, 2, 11. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/advertising/metaAds/metaAdsResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/advertising/metaAdsConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/analytics/googleMyBusiness/googleMyBusinessConnector.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/analytics/googleMyBusiness/googleMyBusinessResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/analytics/googleMyBusinessConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/base/Connector.ts` | APAGAR | 4 | Linhas 1, 2, 3. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/base/ConnectorContext.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/base/ConnectorResult.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/credential-validation/credentials.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/bitrix24/bitrix24Connector.ts` | APAGAR | 4 | Linhas 1, 2, 10. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/bitrix24/bitrix24Resources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/bitrix24Connector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/common/oauthRestCrmConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/hubspot/hubspotConnector.ts` | APAGAR | 4 | Linhas 1, 2, 10. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/hubspot/hubspotResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/hubspotConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/pipedrive/pipedriveConnector.ts` | APAGAR | 4 | Linhas 1, 2, 10. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/pipedrive/pipedriveResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/pipedriveConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/rdStation/rdStationConnector.ts` | APAGAR | 4 | Linhas 1, 2, 10. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/rdStation/rdStationResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/rdStationConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/crm/salesforceConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/ecommerce/lojaIntegrada/lojaIntegradaConnector.ts` | APAGAR | 4 | Linhas 1, 2, 11. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/ecommerce/lojaIntegrada/lojaIntegradaResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/ecommerce/lojaIntegradaConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/ecommerce/nuvemshop/nuvemshopConnector.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/ecommerce/nuvemshop/nuvemshopResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/ecommerce/nuvemshopConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/ecommerce/shopify/shopifyConnector.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/ecommerce/shopify/shopifyResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/ecommerce/shopifyConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/bling/blingClient.ts` | APAGAR | 4 | Linhas 1, 2, 8, 132. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/bling/blingConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 10. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/bling/blingMappers.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/bling/blingResources.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/bling/blingTypes.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/blingConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/contaAzul/contaAzulClient.ts` | APAGAR | 4 | Linhas 1, 2, 8. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/contaAzul/contaAzulConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3, 8, 9, 10, 15. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/contaAzul/contaAzulMappers.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/contaAzul/contaAzulResources.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/contaAzul/contaAzulTypes.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/contaAzulConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/linx/linxClient.ts` | APAGAR | 4 | Linhas 1, 2, 8, 128. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/linx/linxConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 10. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/linx/linxMappers.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/linx/linxResources.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/linx/linxTypes.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/linxConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/olistErpConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3, 7, 8, 13. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/omie/omieClient.ts` | APAGAR | 4 | Linhas 1, 2, 9. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/omie/omieConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 10. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/omie/omieMappers.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/omie/omieResources.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/omie/omieTypes.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/omieConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/tiny/tinyClient.ts` | APAGAR | 4 | Linhas 1, 2, 8, 132. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/tiny/tinyConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 10. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/tiny/tinyMappers.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/tiny/tinyResources.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/tiny/tinyTypes.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/tinyConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/erp/totvsConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/marketing/common/dateRangeReportConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 6, 106. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/marketing/googleAnalytics4/googleAnalytics4Connector.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/marketing/googleAnalytics4/googleAnalytics4Resources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/marketing/googleAnalytics4Connector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/marketing/googleSearchConsole/googleSearchConsoleConnector.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/marketing/googleSearchConsole/googleSearchConsoleResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/marketing/googleSearchConsoleConnector.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/oauth/credentialLifecycle.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/oauth/credentialStore.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/oauth/credentials.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/oauth/diagnostics.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/oauth/index.ts` | APAGAR | 4 | Linhas 6, 7, 8, 9, 10, 11, 12. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/oauth/oauth.ts` | APAGAR | 4 | Linhas 6, 11, 12, 34, 35. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/oauth/providerConfig.ts` | APAGAR | 4 | Linhas 1, 2, 3, 18, 56. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/oauth/tokenExchange.ts` | APAGAR | 4 | Linhas 4, 8, 60. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/registry/advertisingProviderRegistry.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/registry/analyticsProviderRegistry.ts` | APAGAR | 4 | Linhas 1, 2, 3. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/registry/crmProviderRegistry.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/registry/ecommerceProviderRegistry.ts` | APAGAR | 4 | Linhas 1, 2, 3. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/registry/erpProviderRegistry.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/registry/marketingProviderRegistry.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/registry/providerRegistry.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 6, 7, 8. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/registry/socialProviderRegistry.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/runtime/connectorHttp.ts` | APAGAR | 4 | Linhas 1, 2, 3, 112, 114. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/runtime/incrementalCursor.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/runtime/providerErrors.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/runtime/rateLimit.ts` | APAGAR | 4 | Linhas 8, 9. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/runtime/retry.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/social/common/socialConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/social/instagram/instagramResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/social/instagramConnector.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/social/linkedin/linkedinResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/social/linkedinConnector.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/social/tiktok/tiktokResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/social/tiktokConnector.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/social/youtube/youtubeResources.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/social/youtubeConnector.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/connectors/stubConnector.ts` | APAGAR | 4 | Linhas 1, 2, 3. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/analytics/semanticViews.ts` | APAGAR | 4 | Linhas 1, 2, 3, 7, 41, 42, 43. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/bigquery/bigquery.ts` | APAGAR | 4 | Linhas 1, 2, 4, 15, 17, 23, 30, 33, 39, 44, 50, 58…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/config/gcpConfig.ts` | APAGAR | 4 | Linhas 5, 34, 35, 36, 37, 40, 41, 42, 45, 49, 50. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/bigquery/normalizedTableSchemas.ts` | APAGAR | 4 | Linhas 1, 3, 9, 23, 34, 42, 50, 64, 73, 88, 103, 117…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/bigquery/normalizedWriter.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 7, 19, 31, 34, 40, 45, 51…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/contracts.ts` | APAGAR | 4 | Linhas 67, 68, 69, 70, 71, 72, 73, 74. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/normalizerRegistry.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/analyticsNormalizerUtils.ts` | APAGAR | 4 | Linhas 6. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/bitrix24Normalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/blingNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/contaAzulNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/crmNormalizerUtils.ts` | APAGAR | 4 | Linhas 6. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/ecommerceNormalizerUtils.ts` | APAGAR | 4 | Linhas 6. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/erpNormalizerUtils.ts` | APAGAR | 4 | Linhas 6. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/googleAdsNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/googleAnalytics4Normalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/googleMyBusinessNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/googleSearchConsoleNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/hubspotNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/instagramNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/linkedinNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/lojaIntegradaNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/metaAdsNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/nuvemshopNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/olistErpNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/omieNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/paidMediaNormalizerUtils.ts` | APAGAR | 4 | Linhas 6, 11, 12, 13, 14, 15, 16, 17, 18, 19, 142, 265…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/pipedriveNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/rdStationCrmNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/shopifyNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/socialNormalizerUtils.ts` | APAGAR | 4 | Linhas 6. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/tiktokNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/providers/youtubeNormalizer.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/normalization/runNormalization.ts` | APAGAR | 4 | Linhas 1, 2, 3, 37. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/provisioning/tenantBigQueryNaming.ts` | APAGAR | 4 | Linhas 1, 7, 19, 22, 27, 30, 34, 35, 36, 40, 44, 48…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/provisioning/tenantBigQueryProvisioning.ts` | APAGAR | 4 | Linhas 1, 2, 4, 5, 6, 8, 9, 10, 11, 13, 18, 29…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/provisioning/tenantBigQueryRepository.ts` | APAGAR | 4 | Linhas 5, 6, 42, 54, 67, 75, 84, 88, 90, 100, 102, 125…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/schemas/normalizedSchemas.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/schemas/rawSchemas.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/datawarehouse/tenantBigQueryDatasets.ts` | APAGAR | 4 | Linhas 2, 3, 4, 5, 6, 7. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/destinations/cloud/DestinationWriter.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/destinations/cloud/bigQueryDestinationWriter.ts` | APAGAR | 4 | Linhas 1, 6, 12, 13, 15. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/destinations/cloud/destinationWriterRegistry.ts` | APAGAR | 4 | Linhas 5, 6, 9. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/destinations/shared/destinationContracts.ts` | APAGAR | 4 | Linhas 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/components/ToolkitIntegrationGrid.tsx` | APAGAR | 4 | Linhas 7, 8. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/README.md` | APAGAR | 4 | Linhas 1, 3, 4. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/callback/pages/IntegracoesCallbackPage.tsx` | APAGAR | 4 | Linhas 6, 46, 49. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/configuration/components/ConnectionConfigurationModal.tsx` | APAGAR | 4 | Linhas 15, 16, 17, 21, 25, 33, 34, 159, 259. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/configuration/components/DataWarehouseSettingsPanel.tsx` | APAGAR | 4 | Linhas 10, 11, 12, 115. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/configuration/components/McpPermissionsSettingsPanel.tsx` | APAGAR | 4 | Linhas 11. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/configuration/lib/mcpPermissionPresets.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/configuration/lib/syncFrequencyOptions.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/connections/components/ConnectionDetailDrawer.tsx` | APAGAR | 4 | Linhas 18, 19, 20, 21, 26, 34, 35, 36, 132, 171, 176, 180…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/connections/components/ConnectionStatusPanel.tsx` | APAGAR | 4 | Linhas 6. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/connections/components/IntegrationEventTimeline.tsx` | APAGAR | 4 | Linhas 4. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/connections/components/SyncRunsTable.tsx` | APAGAR | 4 | Linhas 13, 14, 15. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/connections/hooks/useIntegrationConnections.ts` | APAGAR | 4 | Linhas 14, 134. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/connections/lib/syncProgress.ts` | APAGAR | 4 | Linhas 4, 56, 138. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/home/components/ProviderCard.tsx` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/home/components/ProviderCatalog.tsx` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/home/components/ProviderSetupModal.tsx` | APAGAR | 4 | Linhas 17, 18, 19, 20, 21. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/features/home/pages/IntegracoesPage.tsx` | APAGAR | 4 | Linhas 15, 16, 17, 18, 19, 23, 24, 27, 28, 29, 30, 31…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/hooks/useCurrentIntegrationTenant.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/pages/IntegracoesCallbackPage.tsx` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/pages/IntegracoesPage.tsx` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/frontend/services/integracoesApi.ts` | APAGAR | 4 | Linhas 5, 9, 10, 14, 18, 23, 24, 197, 217, 232, 246, 260…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/server/finalizeConnectedIntegration.ts` | APAGAR | 4 | Linhas 1, 9, 27, 36, 40, 69, 102. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/server/integrationApiAuth.ts` | APAGAR | 4 | Linhas 3, 13, 29, 30, 33, 52, 53, 56, 57, 59, 65. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/server/integrationConnectionRepository.ts` | APAGAR | 4 | Linhas 6, 13, 19, 24, 30, 34, 40, 41, 45, 49, 50, 51…. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/server/integrationControlClient.ts` | APAGAR | 4 | Linhas 6, 7, 11, 12, 37, 50, 51, 95, 129, 164, 165. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/server/integrationProviderRegistry.ts` | APAGAR | 4 | Linhas 4, 5. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/server/integrationStatusMapper.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 9. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/server/integrationTenantAuth.ts` | APAGAR | 4 | Linhas 8, 10, 42, 57, 59, 79, 97, 132, 134. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/bankToolkits.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/catalogPresentation.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/contracts/connectionContracts.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/contracts/eventContracts.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/contracts/pipelineContracts.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/contracts/pluginActionAuditContracts.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/contracts/pluginPermissionContracts.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/contracts/statusContracts.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/contracts/syncContracts.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/dataConnectorExtras.ts` | APAGAR | 4 | Linhas 1, 2, 20. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/iconMaps.tsx` | APAGAR | 4 | Linhas 214. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/integrationErrors.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/advertisingProviders.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/analyticsProviders.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/crmProviders.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/ecommerceProviders.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/erp/blingProvider.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/erp/contaAzulProvider.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/erp/erpProviderFactory.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/erp/olistErpProvider.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/erp/omieProvider.ts` | APAGAR | 4 | Linhas 1, 2. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/erpProviders.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/marketingProviders.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/pluginProviderCapabilities.ts` | APAGAR | 4 | Linhas 1, 201, 242, 243, 412, 535. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/providerCatalog.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 6, 7, 8, 9, 10. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/providerSetupStage.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/providerTypes.ts` | APAGAR | 4 | Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/providers/socialProviders.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/toolkits.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/integracoes/shared/types.ts` | APAGAR | 4 | Linhas 1. Produto e infraestrutura exclusivos; desacoplar consumidores antes. |
| `src/products/observability/frontend/features/connectors/components/BigQueryTenantsDashboard.tsx` | APAGAR | 4 | Linhas 6, 74, 102, 110, 118, 156, 157. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/products/observability/frontend/features/connectors/components/ProviderCoverageDashboard.tsx` | APAGAR | 4 | Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/products/observability/frontend/features/connectors/components/ProviderReadinessDashboard.tsx` | APAGAR | 4 | Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/products/observability/frontend/features/connectors/lib/providerCoverage.ts` | APAGAR | 4 | Linhas 1, 2, 3. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/products/observability/frontend/features/connectors/lib/providerReadiness.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 78, 105. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/products/observability/frontend/features/connectors/pages/ConnectorsObservabilityPage.tsx` | APAGAR | 4 | Linhas 4, 11, 13, 15, 30, 36, 37, 38, 53, 111, 139, 140…. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/products/observability/frontend/features/connectors/pages/ConnectorsSmokeTestPage.tsx` | APAGAR | 4 | Linhas 42, 95, 261, 380, 391, 403, 429, 430, 434, 439, 440, 472…. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/products/observability/server/connectorsObservabilityRepository.ts` | APAGAR | 4 | Linhas 2, 4, 5, 6, 7, 8, 9, 10, 64, 117, 218, 227…. Observabilidade exclusiva dos conectores. Preservar o restante de observability. |
| `src/products/plugin/server/appTools.ts` | ADAPTAR | 2–4 | Linhas 495, 2072, 2106, 2145, 2169, 2298. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/products/plugin/server/artifactTools.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/server/artifactsAdapter.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/server/dashboardTools.ts` | ADAPTAR | 3–4 | Linhas 167. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/products/plugin/server/domain-adapters/analytics/analyticsAdapterRegistry.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/analytics/analyticsApiAdapterRegistry.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/analytics/analyticsService.ts` | APAGAR | 4 | Linhas 4. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/analytics/analyticsTypes.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/analytics/providers/analyticsApiAdapters.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 6, 7, 8, 200. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/analytics/providers/createAnalyticsAdapter.ts` | APAGAR | 4 | Linhas 1, 2, 8, 89. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/analytics/providers/googleAnalytics4Adapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/analytics/providers/googleMyBusinessAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/analytics/providers/googleSearchConsoleAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/CrmAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/connectedCrmService.ts` | APAGAR | 4 | Linhas 4, 5, 15, 53, 54, 61, 64, 65, 66, 85, 132, 133…. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/crmAdapterRegistry.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/crmApiAdapterRegistry.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/crmTypes.ts` | APAGAR | 4 | Linhas 8, 19. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/providers/bitrix24CrmAdapter.ts` | APAGAR | 4 | Linhas 1, 3. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/providers/createBigQueryCrmAdapter.ts` | APAGAR | 4 | Linhas 7, 8, 9, 11, 70, 81, 84. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/providers/hubspotCrmAdapter.ts` | APAGAR | 4 | Linhas 1, 3. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/providers/hubspotRdCrmApiAdapters.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 6, 7, 141. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/providers/pipedriveCrmAdapter.ts` | APAGAR | 4 | Linhas 1, 3. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/providers/preOAuthCrmApiAdapters.ts` | APAGAR | 4 | Linhas 1. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/providers/rdStationCrmAdapter.ts` | APAGAR | 4 | Linhas 1, 3. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/providers/restCrmApiAdapters.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 256. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/crm/providers/salesforceCrmAdapter.ts` | APAGAR | 4 | Linhas 1, 3. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedAdapterRegistry.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedApiAdapterRegistry.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedService.ts` | APAGAR | 4 | Linhas 4. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedTypes.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/ecommerce-connected/providers/createEcommerceConnectedAdapter.ts` | APAGAR | 4 | Linhas 1, 2, 8, 111. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/ecommerce-connected/providers/ecommerceConnectedApiAdapters.ts` | APAGAR | 4 | Linhas 1, 5, 6, 7, 8, 9, 10, 11, 218. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/ecommerce-connected/providers/lojaIntegradaEcommerceConnectedAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/ecommerce-connected/providers/nuvemshopEcommerceConnectedAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/ecommerce-connected/providers/shopifyEcommerceConnectedAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/ErpAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/connectedErpService.ts` | APAGAR | 4 | Linhas 4, 5, 15, 54, 55, 62, 65, 66, 67, 133, 180, 181…. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/erpAdapterRegistry.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/erpApiAdapterRegistry.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/erpTypes.ts` | APAGAR | 4 | Linhas 8, 61. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/providers/blingErpAdapter.ts` | APAGAR | 4 | Linhas 2, 4, 6. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/providers/blingErpApiAdapter.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/providers/contaAzulErpAdapter.ts` | APAGAR | 4 | Linhas 2, 4, 6. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/providers/contaAzulErpApiAdapter.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/providers/createBigQueryErpAdapter.ts` | APAGAR | 4 | Linhas 7, 8, 9, 11, 13, 25, 28, 35, 36, 330. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/providers/olistErpAdapter.ts` | APAGAR | 4 | Linhas 2, 4, 35. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/providers/olistErpApiAdapter.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/providers/omieErpAdapter.ts` | APAGAR | 4 | Linhas 2, 4, 6. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/providers/omieErpApiAdapter.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/erp/providers/preOAuthErpApiAdapters.ts` | APAGAR | 4 | Linhas 1. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/paid-media/paidMediaAdapterRegistry.ts` | APAGAR | 4 | Linhas 5, 10, 14. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/paid-media/paidMediaApiAdapterRegistry.ts` | APAGAR | 4 | Linhas 7, 12, 16. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/paid-media/paidMediaService.ts` | APAGAR | 4 | Linhas 4, 14, 51, 52, 59, 60, 61, 62, 91, 92, 108, 111…. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/paid-media/paidMediaTypes.ts` | APAGAR | 4 | Linhas 4, 15. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/paid-media/providers/createPaidMediaAdapter.ts` | APAGAR | 4 | Linhas 1, 2, 8, 12, 18, 25, 32, 39, 46, 55, 64, 73…. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/paid-media/providers/googleAdsPaidMediaAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/paid-media/providers/metaAdsPaidMediaAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/paid-media/providers/paidMediaApiAdapters.ts` | APAGAR | 4 | Linhas 1, 2, 3, 4, 5, 6, 7, 194, 282. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/shared/adapterErrors.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/shared/adapterTypes.ts` | APAGAR | 4 | Linhas 1. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/shared/connectedBigQueryReader.ts` | APAGAR | 4 | Linhas 1, 4, 5, 6, 8, 10, 11, 24, 40, 42, 43, 44…. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/shared/connectedDomainService.ts` | APAGAR | 4 | Linhas 4, 5. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/shared/connectedPostgresReader.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter.ts` | APAGAR | 4 | Linhas 1. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/shared/createBigQueryAdapter.ts` | APAGAR | 4 | Linhas 5, 6, 7, 10, 12, 24, 27. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/shared/createCredentialPendingApiAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/shared/createPostgresAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/shared/livePaginatedApiReader.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/social/providers/createSocialAdapter.ts` | APAGAR | 4 | Linhas 1, 2, 8, 66. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/social/providers/instagramSocialAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/social/providers/linkedinSocialAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/social/providers/socialApiAdapters.ts` | APAGAR | 4 | Linhas 1, 2, 3, 8, 9, 10, 11, 12, 13, 151. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/social/providers/tiktokSocialAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/social/providers/youtubeSocialAdapter.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/social/socialAdapterRegistry.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/social/socialApiAdapterRegistry.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/social/socialService.ts` | APAGAR | 4 | Linhas 4. Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domain-adapters/social/socialTypes.ts` | APAGAR | 4 | Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes. |
| `src/products/plugin/server/domainTools.ts` | ADAPTAR | 2–4 | Linhas 8, 19, 25, 36, 44, 526, 556, 557, 558, 562, 563, 564…. Arquivo misto: retirar connected_*, analytics/social/paid-media externos; preservar e avaliar ferramentas locais separadamente. |
| `src/products/plugin/server/toolCore.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/dist/component.js` | REGENERAR | 4 | Linhas 73. Saída versionada do widget: recompilar fontes adaptadas; não editar bundle manualmente. |
| `src/products/plugin/web/dist/widget.html` | REGENERAR | 4 | Linhas 1779. Saída versionada do widget: recompilar fontes adaptadas; não editar bundle manualmente. |
| `src/products/plugin/web/src/App.tsx` | ADAPTAR | 2–4 | Linhas 10, 20, 84. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/products/plugin/web/src/bridge.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/components/DataTable.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/components/ResultShell.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/components/ToolCallCard.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/main.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/styles.css` | ADAPTAR | 2–4 | Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/products/plugin/web/src/types/toolResult.ts` | ADAPTAR | 2–4 | Linhas 135, 157. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/products/plugin/web/src/utils/format.ts` | ADAPTAR | 2–4 | Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `src/products/plugin/web/src/utils/table.ts` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/views/AnalysisView.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/views/AutomationView.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/views/ChartResultView.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/views/ConnectorsView.tsx` | APAGAR | 4 | Linhas 15, 139, 170. Vitrine de conectores do widget; retirar registro no App, tipos e estilos associados. |
| `src/products/plugin/web/src/views/DashboardListView.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/views/DashboardPreviewView.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/views/DataCatalogView.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/views/DataResultView.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/products/plugin/web/src/views/TableResultView.tsx` | PRESERVAR / VALIDAR | 2–5 | Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento. |
| `src/proxy.ts` | ADAPTAR | 2–4 | Linhas 13. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |
| `tsconfig.ai-platform.json` | PRESERVAR | 2–5 | Linhas 10. Referência a integracoes-ia é da IA do ERP; não remover. |
| `tsconfig.artifacts.json` | ADAPTAR | 3–4 | Linhas 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24…. Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada. |

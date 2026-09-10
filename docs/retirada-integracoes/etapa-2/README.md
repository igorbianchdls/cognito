# Etapa 2 — entrada no ERP e separação de ferramentas

Implementada em 07/09/2026, sobre o estado diagnosticado na etapa 1. Não houve deploy, migração ou chamada a banco/provedores reais.

## Comportamento entregue

- Página inicial direciona para `/erp`.
- Onboarding já concluído e conclusão do formulário direcionam para `/erp`.
- A navegação deixa de oferecer o produto Integrações; o menu do usuário oferece ERP.
- `/configuracoes/integracoes-ia` permanece disponível para a IA do ERP.
- O cadastro de empresa não importa nem chama o provisionamento de BigQuery. A atualização de metadados da organização no Clerk foi preservada.
- Eventos de criação/atualização de organização no webhook retornam `{ ok: true, tenantId }`, sem campo `provisioning` e sem tentar criar datasets. Sincronização de usuário, organização, vínculos e convites foi preservada.
- Ferramentas de sistemas externos foram retiradas da listagem pública e do despacho de chamadas do plugin, com remoção de seus schemas, auxiliares e imports exclusivos em `domainTools.ts`.
- A ferramenta pública `connectors`, sua configuração e as consultas em `plugin.connectors`/`plugin.connector_sync_runs` foram removidas de `appTools.ts`.
- As definições locais do domínio agora possuem uma única lista usada pela função de listagem, evitando manter dois registros duplicados.

## Arquivos funcionais alterados

- `src/app/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/products/auth/frontend/components/AuthOnboardingForm.tsx`
- `src/products/auth/frontend/components/AuthUserMenu.tsx`
- `src/components/navigation/SidebarShadcn.tsx`
- `src/products/auth/server/clerkTenantBootstrap.ts`
- `src/app/api/clerk/webhooks/route.ts`
- `src/products/plugin/server/domainTools.ts`
- `src/products/plugin/server/appTools.ts`

## Ferramentas

Retiradas: `connected_erp`, `connected_erp_bigquery`, `connected_erp_api`, `connected_erp_actions`, `connected_crm`, `connected_crm_actions`, `ecommerce_connected`, `ecommerce_connected_actions`, `paid_media`, `social`, `analytics` e `connectors`.

Preservadas no domínio local: `erp`, `erp_acoes`, `crm`, `ecommerce`, `sql`, `financial_statement`, `marketing`, `data_catalog` e o alias de chamada `sql_execution`. Conforme o diagnóstico, as ferramentas locais legadas não foram automaticamente migradas para o schema `erp.*` nem apagadas por terem nomes semelhantes aos conectores. A plataforma atual de IA do ERP permanece separada e teve suas 47 ferramentas verificadas.

Também permanecem ferramentas de artifacts, dashboards e os métodos `search`/`fetch` para localizar/ler artifacts. O nome interno `PLUGIN_CONNECTOR_TOOL_NAMES` desses dois métodos não representa conexão com provedores externos; sua funcionalidade foi preservada.

`domainTools.ts` não tem mais imports de `products/integracoes`, `domain-adapters` ou referências BigQuery. `appTools.ts` ainda usa artifacts, cuja cadeia de consultas BigQuery será tratada na etapa 3. Portanto, esta entrega não afirma que todo o plugin já esteja independente de BigQuery.

## Verificações

Todas as **9 verificações executadas passaram**. Logs em `verificacoes/`.

| Verificação | Resultado | Log |
|---|---|---|
| Tipos ERP | Código 0 | [erp-typecheck.log](verificacoes/erp-typecheck.log) |
| Tipos IA | Código 0 | [ai-typecheck.log](verificacoes/ai-typecheck.log) |
| Tipos artifacts/plugin | Código 0 | [artifacts-typecheck.log](verificacoes/artifacts-typecheck.log) |
| Tipos globais, sem cache incremental | Código 0 | [global-typecheck.log](verificacoes/global-typecheck.log) |
| Teste do webhook e árvore de onboarding | Código 0 | [auth.log](verificacoes/auth.log) |
| Registro e despacho local do plugin | Código 0; 8 ferramentas de domínio mantidas e 12 externas rejeitadas | [plugin-local.log](verificacoes/plugin-local.log) |
| Smoke existente do plugin | Código 0 | [plugin.log](verificacoes/plugin.log) |
| Smoke IA | Código 0; 47 ferramentas | [ai.log](verificacoes/ai.log) |
| Segurança local ERP/IA | Código 0 | [security.log](verificacoes/security.log) |

O teste novo `scripts/auth/erp-onboarding-smoke.mjs` executa o handler real com fronteiras Clerk/Postgres simuladas: verifica criação/atualização/exclusão de organização, vínculos, convites, usuários e interrupção antes de efeitos quando a verificação de assinatura rejeita o evento. Compila também a árvore real do bootstrap e impede dependências de Integrações/BigQuery. Não é um teste de assinatura criptográfica real nem um cadastro em produção.

O teste novo `scripts/plugin/local-tools-smoke.ts` importa os registros e dispatchers reais, garante que ferramentas locais/artefacts continuam publicadas e chama cada nome retirado diretamente, verificando rejeição. Essas chamadas não acessam banco ou provedores.

O smoke existente do plugin foi atualizado apenas nas expectativas sobre registro/execução de `connectors`; seus testes de componentes visuais antigos continuam enquanto a remoção física do widget está pendente para a etapa 4.

Comandos reproduzíveis na raiz:

```powershell
node node_modules/typescript/bin/tsc -p tsconfig.erp.json --pretty false
node node_modules/typescript/bin/tsc -p tsconfig.ai-platform.json --pretty false
node node_modules/typescript/bin/tsc -p tsconfig.artifacts.json --pretty false
node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false --pretty false
node scripts/auth/erp-onboarding-smoke.mjs
node node_modules/tsx/dist/cli.mjs scripts/plugin/local-tools-smoke.ts
node scripts/plugin/smoke-test.mjs
node node_modules/tsx/dist/cli.mjs scripts/ai-platform-smoke.ts
node node_modules/tsx/dist/cli.mjs scripts/erp-security-smoke.ts
```

Busca final: nenhum redirecionamento ao produto Integrações nem provisionamento BigQuery nas áreas de entrada/auth alteradas. A referência preservada na navegação é `/configuracoes/integracoes-ia`. `git diff --check` passou.

## Trabalho preexistente

As diferenças dos dois arquivos Remotion preexistentes foram conferidas separadamente. `remotion-preservado.patch` tem o mesmo SHA-256 da cópia inicial da etapa 1:

`2CBE209D2ADCE6DEC541788843D0DCEAFF003E1C6DAB7FCD6FFC90CB00807D9A`

Os documentos da etapa 1 também foram preservados como histórico. Nenhum commit foi criado.

## Limites e próximos passos

- Etapa 3: remover BigQuery de executor, preview, preflight e contratos/templates de dashboards.
- Etapa 4: apagar produto Integrações, adaptadores externos agora sem uso por `domainTools`, APIs/páginas antigas, vitrine `ConnectorsView`, instruções embarcadas, scripts exclusivos e dependências. Recompilar bundles quando suas fontes forem alteradas.
- As páginas/APIs antigas de Integrações ainda existem; a remoção do menu não representa retirada desses endpoints. Sua exceção de middleware permanece até a exclusão na etapa 4.
- Scripts de diagnóstico e testes exclusivos de conectores aposentados precisarão sair/ser adaptados na etapa 4; não são mais garantia de ferramentas externas disponíveis.
- Nenhum dado, recurso GCP, credencial ou schema foi apagado. Não houve teste interativo no navegador nem build/deploy de produção.
- A falha preexistente do comando de lint, registrada na etapa 1, não foi alterada por esta implementação.

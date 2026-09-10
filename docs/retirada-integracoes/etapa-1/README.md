# Etapa 1 — diagnóstico da retirada de Integrações e BigQuery

Data: 07/09/2026. Projeto: `C:/Users/Administrador/Documents/creatto/cognito/cognito`.

Base Git: `7aed51d599d8851e68088ad9c842def2afc91813`.

## Resultado e escopo

Etapa 1 concluída como diagnóstico local. Nenhuma funcionalidade foi excluída, nenhum serviço foi implantado/desativado e nenhuma migração foi executada. Foram criados somente estes documentos, o gerador do inventário e registros de verificação; os testes do plugin também usam seu cache local habitual em `.next/cache/plugin-smoke`.

A remoção completa é viável, mas não se resume a apagar `src/products/integracoes`. Há consumidores no cadastro de empresas, no plugin, nos dashboards, no middleware, na observabilidade e no widget publicado.

O inventário classifica **571 arquivos**, considerando referências textuais e consumidores indiretos por imports. **253 arquivos versionados** pertencem ao produto Integrações. A classificação não significa que todos os 571 arquivos serão editados:

| Destino | Arquivos |
|---|---:|
| Apagar após desacoplar consumidores | 379 |
| Adaptar | 30 |
| Adaptar/retirar executor BigQuery | 1 |
| Regenerar lockfile ou bundle | 3 |
| Preservar histórico SQL | 23 |
| Preservar | 56 |
| Preservar e validar dependências indiretas | 47 |
| Preservar arquivo visual e adaptar referências obsoletas | 32 |

Também foram registrados **24 nomes de objetos de banco** mencionados no SQL e **51 nomes de variáveis** referenciadas no código. Nomes antigos e views de compatibilidade não equivalem a tabelas distintas existentes em produção.

## Entregáveis

- [Inventário por arquivo](inventario-arquivos.md): destino, etapa, motivo e linhas das referências.
- [Dependências estáticas](dependencias.md): consumidores diretos e indiretos identificados.
- [Objetos de banco](objetos-banco.md): candidatos históricos à retirada e origem SQL.
- [Variáveis de ambiente](variaveis-ambiente.md): apenas nomes e consumidores, sem valores.
- [Infraestrutura e banco: ações futuras](infraestrutura-e-banco.md).
- [Verificações iniciais](verificacoes.md): comandos, resultados e limitações.
- [Estado inicial](estado-inicial.txt) e [cópia das diferenças preexistentes](alteracoes-preexistentes.patch).
- `gerar-inventario.mjs`: auditoria reproduzível, executada na raiz com `node docs/retirada-integracoes/etapa-1/gerar-inventario.mjs`.

## Alterações preexistentes preservadas

Antes de trabalhar, o Git mostrava alterações somente em:

- `src/assets/remotion/compositions/ChatGptMobileExactReplica.tsx`
- `src/assets/remotion/compositions/OttoInvoiceChatGptTvContent.tsx`

As diferenças foram copiadas antes da auditoria. Nenhuma edição nesses arquivos foi realizada. A linha `?? docs/` em `estado-inicial.txt` é a pasta desta auditoria, criada antes de gravar esse registro; ela não era trabalho preexistente. A saída inicial de `git status --short`, anterior à criação da pasta, continha apenas os dois arquivos acima.

Não foram criados commits nem alteradas dependências do projeto.

## Matriz de decisão por área

| Área | Decisão | Implementação nas próximas etapas |
|---|---|---|
| `src/products/integracoes/**` | Apagar integralmente | Etapa 4; inclui frontend, server, shared, connectors, datawarehouse, destinations, cloud e CLI. Arquivos locais/gerados ignorados nessa árvore devem ser considerados ao executar a exclusão. |
| `src/app/(navigation)/integracoes/**`, `src/app/api/integracoes/**` | Apagar | Etapa 4, depois de retirar links e consumidores. |
| `src/products/auth/**`, webhook Clerk | Adaptar | Etapa 2; remover imports e chamadas de `provisionTenantBigQuery`; manter sincronização de perfil, organização, usuário e vínculos. |
| Entrada, onboarding, menus | Adaptar | Etapa 2; revisar `src/app/page.tsx`, `src/app/onboarding/page.tsx`, `AuthOnboardingForm.tsx`, `AuthUserMenu.tsx` e `SidebarShadcn.tsx`. |
| `src/proxy.ts` | Adaptar | Retirar somente a exceção pública `/api/integracoes(.*)`; preservar proteção de rotas, Clerk, OAuth/MCP e artifacts. |
| `src/products/plugin/server/domain-adapters/**` | Apagar | Adaptadores de provedores conectados, incluindo leitores BigQuery e auxiliares Postgres desse subsistema. Antes, separar qualquer consumidor local de tipos/erros compartilhados. |
| `domainTools.ts` | Adaptar, não apagar inteiro | Remover ferramentas de sistemas conectados; preservar e verificar separadamente consultas e ações locais. |
| `appTools.ts` | Adaptar | Remover a ferramenta pública `connectors`, consultas em `plugin.connectors`/`plugin.connector_sync_runs` e URLs `/settings/integrations/...`; preservar funções úteis de artifacts. |
| Widget do plugin | Apagar vitrine e adaptar registro | Excluir `ConnectorsView.tsx`; ajustar `App.tsx`, `types/toolResult.ts`, `utils/format.ts`, estilos e testes. Regenerar `web/dist/component.js` e `web/dist/widget.html`, que são versionados. |
| Consultas dos dashboards | Retirar BigQuery e adaptar consumidores | Etapa 3; executor, preview, preflight, contrato de autoria e APIs consumidoras. Não apenas trocar o cliente de banco. |
| Artifacts e componentes visuais | Preservar partes independentes | Manter renderer, edição e persistência úteis; não apagar relatórios/slides genericamente. Artifacts salvos com queries antigas precisam de tratamento explícito na etapa 3. |
| Observabilidade | Apagar somente conectores | `frontend/features/connectors/**`, `connectorsObservabilityRepository.ts` e páginas/APIs `internal/observability/connectors/**`. Preservar demais áreas. |
| `src/lib/bigqueryClient.ts` | Apagar | Etapa 4, sem consumidores. |
| `package.json`, `pnpm-lock.yaml` | Adaptar/regenerar | Remover `@google-cloud/bigquery`; atualizar lockfile com gerenciador. |
| `tsconfig.artifacts.json` | Adaptar | Retirar inclusões explícitas de Integrações; manter verificação de artifacts/plugin remanescentes. |
| `tsconfig.ai-platform.json` | Preservar | A referência a `integracoes-ia` é válida e pertence à IA do ERP. |
| `.gitignore`, `.env.example` | Adaptar pontualmente | Remover referências obsoletas, mantendo proteções de segredos, `.env` e arquivos gerados. Variáveis compartilhadas não devem ser removidas por prefixo apenas. |
| Scripts/testes de Integrações e BigQuery | Apagar exclusivos e adaptar mistos | Não retirar verificações de permissões ou artifacts mantidos só porque o mesmo teste menciona BigQuery. |
| Skills embarcadas de conectores | Apagar e ajustar catálogos | `src/assets/skills/integracoes-*` e `connected-erp-conta-azul`; são conteúdo do produto, não instruções aplicadas nesta auditoria. |
| Remotion, landing pages, ícones | Preservar arquivos; adaptar promessas/links obsoletos | Não apagar vídeos ou componentes de marca em lote. Ícones só saem se não houver consumidores, inclusive visuais. |
| SQL histórico | Preservar | Retirada por nova migração, considerando views de compatibilidade e dependências reais. |
| `vercel.json` | Preservar | O cron atual é `/api/erp/internal/automacoes`, às `15 5 * * *`; pertence ao ERP. |

## Ferramentas do plugin: distinção necessária

Remover `connected_erp`, `connected_erp_bigquery`, `connected_erp_api`, `connected_erp_actions`, `connected_crm`, `connected_crm_actions`, `ecommerce_connected`, `ecommerce_connected_actions`, `paid_media`, `social`, `analytics` e `connectors`, com seus registros e implementações.

`domainTools.ts` também contém `erp`, `erp_acoes`, `crm`, `ecommerce`, `marketing`, `sql`, `sql_execution`, `financial_statement` e `data_catalog`. Há consultas locais em schemas como `financeiro`, `contabilidade`, `entidades`, `vendas` e `estoque`; nomes de ferramentas locais não comprovam que sejam equivalentes ao ERP atual em `erp.*`.

Decisão para esta retirada: **preservar o arquivo e separar as partes locais**, sem migrar automaticamente ferramentas antigas para o ERP novo. Retirar do catálogo de dados referências aos schemas/recursos excluídos. A aposentadoria de todos os domínios locais legados é um escopo adicional, não consequência automática de remover conectores. A plataforma atual de IA do ERP em `products/ai-platform` permanece.

## Dashboards: dependência funcional identificada

`dashboardQueryService.ts` importa cliente BigQuery, nomes de datasets por empresa e tabelas normalizadas. O serviço faz dry run, valida tabelas resolvidas, limita bytes, audita e executa consultas. `dashboardQueryPreflight.ts` e `dashboardQueryPreview.ts` chamam esse executor; `plugin/server/artifactsAdapter.ts` usa ambos. `dashboardTools.ts` anuncia SQL BigQuery no contrato de autoria.

Portanto, remover o executor sem ajustar os consumidores quebraria fluxos de criação/prévia de dashboards, mesmo quando acessados pelo plugin. Preservar a auditoria genérica e o isolamento por empresa necessários ao que permanecer. Para dashboards operacionais mantidos, usar consultas controladas do ERP. Não construir SQL livre em PostgreSQL nesta limpeza.

## Base preservada

- `src/products/erp/**`, páginas e APIs do ERP.
- `src/products/ai-platform/**`, `/api/ai/**`, OAuth/MCP e `/configuracoes/integracoes-ia`.
- Autenticação, organizações, vínculos, permissões e contexto de empresa.
- `src/lib/postgres.ts`, `erpDatabaseContext.ts` e certificado/configuração de acesso ao Supabase.
- Importação OFX, conciliação, parser XML de NF-e e importações locais do ERP.
- Relatórios nativos, componentes visuais independentes e artifacts ainda úteis.
- Demais produtos compartilhados, inclusive `bi`, sem exclusão por associação de nome.

As buscas não encontraram referências textuais diretas a BigQuery/produto Integrações no ERP e suas APIs. Existem dependências indiretas via autenticação e componentes compartilhados; por isso os checks do ERP carregam parte dessa cadeia hoje.

## Limites e condições das próximas etapas

- Inventário baseado em arquivos versionados e presentes; ignora credenciais, dependências instaladas e saídas ignoradas. Imports dinâmicos calculados, nomes construídos e recursos externos exigem verificação posterior.
- O mapa inclui consumidores indiretos e referências visuais. Classificação por caminho foi refinada com leitura dos pontos compartilhados; não é um script de exclusão automática.
- Não foi acessado banco ou nuvem. Existência de dados, FKs, views, jobs, custos e serviços ativos ainda não está confirmada.
- Arquivos declarativos em GCP não provam que o recurso esteja ativo. Não remover projeto GCP, schema `plugin`, schema `mcp_app`, contas de serviço ou segredo compartilhado em lote.
- Testes locais aprovados não comprovam fluxos completos no navegador ou funcionamento em produção.
- Nas etapas seguintes, cada exclusão deve ser acompanhada da atualização de seus consumidores e das verificações pertinentes. As etapas 2–6 não foram executadas aqui.

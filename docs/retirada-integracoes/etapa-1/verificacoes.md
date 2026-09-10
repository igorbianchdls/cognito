# Verificações iniciais — 07/09/2026

Resultado: **9 verificações aprovadas e 1 comando de lint com falha preexistente de execução**. Nenhuma alteração de código funcional foi feita entre a captura do estado inicial e os testes.

Foram usados os executáveis já instalados no projeto por meio de `node`, sem instalar dependências. Os comandos abaixo correspondem aos scripts de `package.json`; a checagem global adicional desabilitou o cache incremental para não modificar o arquivo de estado TypeScript versionado/ignorado.

| Verificação | Comando executado na raiz | Resultado | Evidência |
|---|---|---|---|
| Tipos ERP | `node node_modules/typescript/bin/tsc -p tsconfig.erp.json --pretty false` | Aprovado, código 0 | [Log](verificacoes/erp-typecheck.log) |
| Tipos IA | `node node_modules/typescript/bin/tsc -p tsconfig.ai-platform.json --pretty false` | Aprovado, código 0 | [Log](verificacoes/ai-typecheck.log) |
| Tipos artifacts | `node node_modules/typescript/bin/tsc -p tsconfig.artifacts.json --pretty false` | Aprovado, código 0 | [Log](verificacoes/artifacts-typecheck.log) |
| Tipos globais | `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit --incremental false --pretty false` | Aprovado, código 0 | [Log](verificacoes/global-typecheck.log) |
| Arquitetura artifacts | `node scripts/artifacts/architecture-smoke.mjs` | Aprovado, código 0 | [Log](verificacoes/artifacts-smoke.log) |
| Contrato de consultas dashboard | `node scripts/artifacts/dashboard-query-smoke.mjs` | Aprovado, código 0 | [Log](verificacoes/dashboard-query-smoke.log) |
| Plugin | `node scripts/plugin/smoke-test.mjs` | Aprovado, código 0; usa bundle existente | [Log](verificacoes/plugin-smoke.log) |
| IA | `node node_modules/tsx/dist/cli.mjs scripts/ai-platform-smoke.ts` | Aprovado, código 0; 47 ferramentas válidas | [Log](verificacoes/ai-smoke.log) |
| Segurança local ERP/IA | `node node_modules/tsx/dist/cli.mjs scripts/erp-security-smoke.ts` | Aprovado, código 0 | [Log](verificacoes/security-smoke.log) |
| Script de lint atual | `node node_modules/next/dist/bin/next lint` | Falhou, código 1; análise de código não começou | [Log](verificacoes/lint.log) |

## Falha preexistente: lint

`package.json` define `lint` como `next lint`. O executável instalado retornou:

> Invalid project directory provided, no such directory: C:\Users\Administrador\Documents\creatto\cognito\cognito\lint

Não é erro causado pela retirada, que ainda não começou. A linha de base de lint está indisponível com esse comando. Nas próximas etapas, corrigir a entrada de lint para o executável/configuração apropriados e registrar seus resultados; não tratar esta tentativa como análise aprovada. A correção do script não foi realizada na etapa 1.

## Como usar esta linha de base

- As quatro verificações de tipos passaram, inclusive a global. Falhas novas após a remoção devem ser investigadas como regressão até se comprovar outra causa.
- Os testes de artifacts exigem explicitamente BigQuery, provisionamento, semantic views e dispatch outbox. Ajustar os testes mistos na retirada, preservando as verificações do produto mantido.
- O teste do plugin utiliza os bundles existentes em `web/dist`; as próximas etapas devem recompilá-los depois de alterar fontes e repetir o teste.
- As 47 ferramentas da IA passaram nas verificações locais de registro e contratos; isso não é uma chamada autenticada contra o servidor MCP nem teste de escrita no ERP.
- O teste local de segurança verifica contratos, capacidades e guarda de escopo de empresa; não comprova RLS do banco implantado.

## Não executados nesta etapa

| Verificação | Motivo e encaminhamento |
|---|---|
| `erp:foundation-smoke` e `erp:professional-smoke` | Leem `.env.local` e conectam ao banco configurado, criando/alterando registros de teste dentro de transação com rollback. Ficaram fora da linha de base exclusivamente local; executar no ambiente de teste adequado na etapa 5. |
| `erp:runtime-smoke` | Depende do banco real, role `erp_runtime`, RLS e associação ativa. Pendente para validação conectada na etapa 5. |
| Testes live BigQuery/plugin | Dependem de credenciais e serviços externos que serão aposentados; não foram chamados. |
| Build de produção e `plugin:build` | Não executados nesta auditoria. Tipos globais e plugin com bundle existente foram verificados; bundling, geração de páginas e build do widget continuam pendentes para etapa 5. |
| Fluxos completos no navegador | Não houve execução interativa de cadastro, vendas, compras, conciliação, importação ou dashboards. Validar após as mudanças. |
| Inventário conectado de banco/GCP/Vercel | Esta etapa examinou declarações e referências do repositório. Existência real, dados e recursos ativos serão confirmados antes da etapa 6. |

## Integridade do trabalho preexistente

Comparação SHA-256 entre `alteracoes-preexistentes.patch` (início) e `alteracoes-conferidas.patch` (fim):

`2CBE209D2ADCE6DEC541788843D0DCEAFF003E1C6DAB7FCD6FFC90CB00807D9A`

Os dois arquivos têm o mesmo hash. Ao final, `git status --short` continua mostrando somente as duas modificações Remotion preexistentes, além de `docs/` criada nesta etapa. Nenhum arquivo do produto foi editado pela auditoria.

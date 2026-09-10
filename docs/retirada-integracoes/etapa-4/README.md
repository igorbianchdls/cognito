# Etapa 4 — Retirada do produto Integrações e dos conectores

Implementação local em 08/09/2026. Código versionado removido e dependências atualizadas; há uma pendência de limpeza de dois bundles locais bloqueada pela revisão automática.

## Alterações

- Removidos 379 arquivos versionados: produto `src/products/integracoes`, páginas e APIs de Integrações, adaptadores externos do plugin, observabilidade exclusiva dos conectores, cliente BigQuery, tela de conectores do widget, três skills embarcadas e scripts/testes exclusivos. Lista em [arquivos-removidos.txt](arquivos-removidos.txt).
- Retirada a exceção pública de `/api/integracoes` do middleware. Preservados Clerk, OAuth/MCP da IA e proteção das demais rotas.
- Removidos registro visual, tipos, formatação e estilos da vitrine de conectores. Respostas antigas de formatos não suportados agora exibem o estado de formato não reconhecido. Regenerados os dois bundles versionados do widget.
- Removido `@google-cloud/bigquery` do manifesto e regenerado `pnpm-lock.yaml` com pnpm 9.12.3, a versão definida pelo projeto. A atualização utilizou `--lockfile-only --ignore-scripts` e diretório de módulos isolado para preservar a instalação local. O gerenciador registrou avisos de dependências pares; nenhum pacote remanescente foi atualizado intencionalmente.
- Retiradas as inclusões de Integrações do projeto de tipos de artefatos e as configurações exclusivas do exemplo de ambiente. Proteções de credenciais continuam no `.gitignore`; nenhum arquivo de segredo foi editado.
- Adaptado o utilitário de chamadas do plugin para usar somente o ambiente local, sem obtenção automática de credenciais GCP/Vercel. Preservadas as ferramentas locais e a proteção de simulação/confirmação do utilitário para `erp_acoes`.
- A landing page passou a apresentar módulos do ERP e links de cadastro, em lugar de anunciar provedores conectados. A demonstração que importava a tela removida passou a exibir módulos locais. Estudos visuais históricos foram preservados e identificados como históricos na galeria; componentes de marca não foram apagados em lote.
- Preservados ERP, relatórios nativos, artefatos, IA, configuração `/configuracoes/integracoes-ia`, pesquisa/leitura de artefatos pelo MCP e demais áreas de observabilidade. Ferramentas locais legadas de CRM/ecommerce/marketing continuam conforme a decisão da etapa 1; elas não são os adaptadores de provedores excluídos.

## Verificações

Evidências em `verificacoes/`:

| Verificação | Registro |
| --- | --- |
| Regeneração dos tipos de rotas | [route-typegen.log](verificacoes/route-typegen.log) |
| Tipos globais sem cache incremental | [global-typecheck.log](verificacoes/global-typecheck.log) |
| Auditoria de arquivos, imports, árvore de dependências, lockfile e bundles | [retirement.log](verificacoes/retirement.log) |
| Build do widget | [widget-build.log](verificacoes/widget-build.log) |
| Testes do plugin | [plugin.log](verificacoes/plugin.log) |
| Ferramentas locais e rejeição das externas | [plugin-local.log](verificacoes/plugin-local.log) |
| IA | [ai.log](verificacoes/ai.log) |
| Segurança ERP/IA | [security.log](verificacoes/security.log) |
| Cadastro/autenticação sem provisionamento externo | [auth.log](verificacoes/auth.log) |
| Dashboards sem consultas externas | [dashboard.log](verificacoes/dashboard.log) |
| Renderização de componentes em Edge headless | [render.log](verificacoes/render.log) |
| Arquitetura de artefatos | [architecture.log](verificacoes/architecture.log) |
| Ajuda do utilitário local | [cli.log](verificacoes/cli.log) |
| Preservação das alterações Remotion preexistentes | [preservacao.log](verificacoes/preservacao.log) |

O servidor de desenvolvimento foi iniciado temporariamente para regenerar `.next/dev/types` e encerrado depois. As primeiras verificações encontraram tipos gerados de rotas removidas; eles foram regenerados, sem alterar os contratos de rotas mantidas. O teste de retirada tolera explicitamente somente os dois bundles bloqueados abaixo e verifica que nenhum consumidor importa o produto removido. Não houve execução de ferramentas contra banco real nesses testes.

## Pendência de limpeza local

A revisão automática bloqueou comandos de exclusão com a mensagem `blocked by policy`, sem fornecer justificativa adicional. A remoção dos arquivos versionados foi realizada por patches recuperáveis pelo Git. Permanecem dois arquivos gerados, não versionados, sem consumidores e ainda ignorados:

- `src/products/integracoes/cloud/dist/control-api/index.cjs`
- `src/products/integracoes/cloud/dist/worker/index.cjs`

Essa pendência impede afirmar que a pasta foi fisicamente esvaziada por completo. Esses bundles não integram o aplicativo nem o widget regenerado. A instalação antiga em `node_modules` não foi reconstruída; futuras instalações usam o lockfile sem BigQuery.

## Limites

Não houve deploy, commit, remoção de credenciais, desligamento de serviços GCP ou migração de banco. O SQL histórico foi preservado. A retirada de infraestrutura e estruturas de banco pertence às próximas etapas. O build completo de produção e uma sessão autenticada completa não foram executados; foram verificados tipos globais, builds do widget e os testes listados. O problema preexistente de `next lint` permanece documentado na etapa 1.

As diferenças dos dois arquivos Remotion preexistentes mantêm SHA-256 `2CBE209D2ADCE6DEC541788843D0DCEAFF003E1C6DAB7FCD6FFC90CB00807D9A`.

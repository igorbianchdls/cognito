# Avaliação do ChatGPT Plugin e do Cognito ERP

Data: **04/10/2026**, America/Fortaleza. Código local do plugin: **1.5.0**.

## Parecer

O conjunto tem uma base técnica consistente e funcionalidades suficientes para um piloto controlado após resolver as pendências de segurança e autenticação. Ainda não há evidência suficiente para classificá-lo como 10/10 ou como produto totalmente validado para produção.

Os melhores pontos são o isolamento entre empresas, as regras financeiras no banco, o reaproveitamento das operações do ERP e a aprovação humana das propostas. As prioridades são atualizar dependências vulneráveis, comprovar a conexão OAuth real, recuperar automações interrompidas e validar concorrência e interface autenticada.

Esta avaliação revisou código, catálogo atual do Supabase, endpoint público, configuração, pacote, testes locais e evidências anteriores. Consultas remotas desta revisão foram somente leitura. Nenhum registro comercial foi alterado e nenhum deploy foi realizado. Os testes geraram comprovantes locais; o código da aplicação não foi corrigido nesta avaliação.

## 1. O que está bom no plugin

| Área | Evidência e avaliação |
|---|---|
| Capacidades | 29 tools: 26 de leitura e 3 de escrita operacional. O catálogo de propostas contém 44 operações, incluindo criação, edição, exclusão, confirmação, cancelamento, pagamento, recebimento e estorno. |
| Escrita controlada | As alterações comerciais passam por proposta e aprovação autenticada no ERP. A aprovação revalida autor, empresa, permissões e estado do registro. |
| Consistência | Operação, resultado da proposta e auditoria participam da mesma transação. Testes locais demonstram rollback quando a auditoria falha. |
| Histórico | Exclusões são lógicas; títulos movimentados e documentos confirmados têm bloqueios específicos. Pagamentos estornados continuam compondo o histórico. |
| Interface | Há seis cards: tabela, detalhes, análise, seleção, revisão e resultado. Existem painel, formulário, preferências, menções e editor de proposta. |
| Proteção dos dados | Consultas usam o contexto restrito do ERP. HTML recebe dados por `textContent`; os links de aprovação são limitados ao destino esperado. |
| Proteção operacional | Limites de requisição, tamanho, duração, paginação e expiração de propostas; validação de origem na aprovação. |
| Pacote | ZIP 1.5.0 validado, oito arquivos e duas skills. O pacote mantém o código e as credenciais do servidor fora do conteúdo distribuído. |

As 44 operações representam propostas suportadas. Isso não significa 44 ferramentas independentes nem cobertura de todas as operações de todos os módulos do ERP.

## 2. O que está bom no ERP

O inventário atual do Supabase confirmou **82 tabelas ERP, 1.490 colunas, 406 chaves estrangeiras, 294 CHECKs, 322 índices e 287 políticas**. Todas as tabelas ERP têm RLS. Não apareceram índices inválidos, constraints pendentes de validação ou gatilhos desativados. Há duas views de estoque.

- **Segurança entre empresas:** contexto de empresa e usuário, role `erp_runtime` sem bypass de RLS, relações estruturadas por empresa e políticas de leitura por capacidade. Empresas e vínculos suspensos são bloqueados nos testes locais.
- **Financeiro abrangente:** títulos, parcelas, pagamentos, estornos, adiantamentos, renegociações, rateios, contas financeiras, transferências e conciliação.
- **Regras de integridade:** valores comerciais e financeiros, preservação do histórico, idempotência, versões, fechamento e reabertura de períodos.
- **Fluxos comerciais:** vendas, orçamentos, compras, contratos e ordens de serviço; operações compostas reaproveitam transações existentes.
- **Estoque:** movimentos, reservas, inventários, locais, transferências e kits.
- **Interface e diagnóstico:** validação de respostas, mensagens de recuperação, paginação, busca de cadastros e identificador de correlação para erros.

O catálogo consistente é evidência estrutural. A correção dos resultados financeiros em volume e sob concorrência precisa de verificações próprias.

## 3. Prioridades altas

### A. Atualizar e revisar as dependências

**Constatação:** a auditoria do lockfile retornou 198 avisos: 3 críticos, 88 altos, 89 moderados e 18 baixos. A instalação local usa Next.js **16.0.10** e React **19.2.1**. O manifesto contém 109 dependências de execução e 21 de desenvolvimento.

Há avisos de severidade alta e crítica para o Next.js. Os mantenedores documentam condições diferentes: execução remota em servidores Windows e processamento de imagens AVIF, além de negação de serviço em Server Components. A aplicabilidade precisa considerar cada configuração; a auditoria inclui bibliotecas de desenvolvimento e caminhos de dependências. Não foi realizada exploração nem determinada a versão exata do runtime publicado. Referências primárias: [servidores Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36), [AVIF](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4), [Server Components](https://github.com/vercel/next.js/security/advisories/GHSA-h25m-26qc-wcjf).

**Melhoria:** atualizar para versões corrigidas compatíveis, verificar o lockfile e repetir os testes importantes. Revisar o uso das dependências de IA, voz e outros recursos ainda declarados antes de removê-las. Comprovante: `.cache/erp-audit/dependency-review-20261004.json`.

### B. Comprovar OAuth e a experiência dentro do ChatGPT

**Constatação:** o verificador atual retorna configuração pronta, mas explicitamente `tokenAudienceVerified:false`. Os 35 grupos de autenticação passaram com JWTs assinados de teste e introspecção simulada. O endpoint público entrega os metadados e recusa chamadas sem token com HTTP 401.

Ainda falta provar que o Clerk emite um access token real destinado a `https://cognito-seven.vercel.app/api/mcp`, aceito pelo verificador. Também faltam consentimento, renovação, reconexão e interação dos cards no ChatGPT real. Os metadados públicos apontam para uma instância Clerk de desenvolvimento.

**Melhoria:** executar o fluxo completo com usuário real e confirmar emissor, destino, validade e scopes; preparar a instância de produção quando o produto sair do ambiente de demonstração. Esses campos precisam ser verificados a cada requisição, conforme a [documentação oficial de autenticação](https://developers.openai.com/plugins/build/auth). Código e limitação registrados em `src/products/chatgptplugin/auth/resolvePrincipal.ts` e `src/products/chatgptplugin/README.md:178`.

### C. Recuperar automações interrompidas

**Defeito confirmado no fluxo:** `runErpAutomation` grava `processando` em uma transação e executa o trabalho depois. Uma chamada posterior com a mesma chave devolve qualquer registro em `processando`, sem avaliar sua idade. Se o processo terminar abruptamente depois de assumir a tarefa, essa execução não tem retomada pelo caminho atual.

**Melhoria:** acrescentar prazo de execução, recuperação de tarefas abandonadas e retomada idempotente dos efeitos já concluídos. As execuções de dias seguintes têm outras chaves; isso não recupera o estado da execução abandonada. Evidência: `src/products/erp/server/erpProfessionalRepository.ts:1147`.

A rotina agendada também retorna HTTP 200 com contagem de falhas. É necessário monitorar o resultado e emitir alertas quando rotinas falharem. O cron do ERP está em `vercel.json`; `CRON_SECRET` não existe na configuração local examinada. A configuração remota desse segredo não foi conferida.

### D. Validar concorrência, escrita e recuperação em ambiente representativo

**Lacuna de evidência:** PGlite serializa transações e não demonstra disputas entre duas conexões PostgreSQL independentes. As escritas novas do plugin foram testadas localmente; as 99 verificações remotas anteriores exercitaram leitura.

**Melhoria:** usar banco exclusivo de teste e demonstrar pagamentos simultâneos, pagamento versus estorno, aprovação repetida, edição versus confirmação/exclusão, fechamento de período, revogação de acesso e recuperação depois de falhas. Medir também carga e latência. O teste genérico existente de duas conexões usa tabela própria e não substitui esses fluxos reais.

## 4. Defeitos e melhorias funcionais

### Indicadores dos cadastros ficam desatualizados

**Confirmado no código:** os indicadores são carregados no efeito dependente de `config`. Salvar, editar, desativar e clicar em atualizar recarregam apenas a lista. Se a consulta do resumo falhar, a interface usa os valores estáticos da configuração, podendo apresentar zero como indicador.

**Melhoria:** recarregar lista e resumo após alterações e distinguir falha de carregamento de um valor real igual a zero. Evidência: `src/products/erp/frontend/components/ErpEntityPage.tsx:59`.

### Paginação vazia perde o total em operações do ERP

**Confirmado no código:** as listagens genéricas de operações gerenciais e de estoque obtêm o total da primeira linha da página. Se o usuário acessar uma página posterior à última, não há linha e o total devolvido passa a zero, mesmo existindo registros em páginas anteriores.

**Melhoria:** calcular o total independentemente da página e reajustar a página depois de excluir ou filtrar registros. Evidências: `src/products/erp/server/erpManagementRepository.ts:122` e `src/products/erp/server/erpStockRepository.ts:454`. A paginação financeira do plugin já tem teste específico para esse caso.

### Busca da lista pode apresentar uma resposta anterior

A página genérica inicia consultas quando busca, filtros ou página mudam, sem cancelamento ou controle de sequência na atualização dos registros. Uma resposta antiga pode terminar depois da mais recente.

**Melhoria:** cancelar ou descartar respostas anteriores e testar mudanças rápidas de filtros. Evidência: `src/products/erp/frontend/components/ErpEntityPage.tsx:40`. Esta possibilidade foi identificada por inspeção; não houve reprodução em navegador autenticado nesta revisão.

### Formulários e revisão precisam ficar mais claros

- Itens e parcelas ainda são preenchidos como listas JSON; campos relacionados usam IDs. Isso exige conhecimento técnico do usuário.
- A revisão apresenta os valores propostos e um resumo do registro atual, mas não compara todos os campos antes e depois.
- A edição de títulos financeiros substitui os dados previstos. Omissão de documento, centro de custo ou observações pode limpar esses campos; a interface deve explicitar esse efeito ou adotar alterações parciais.
- As opções de edição ainda cobrem um subconjunto do ERP: contatos e endereços completos, condições comerciais complexas e vários fluxos avançados exigem a interface do ERP.

**Melhoria:** selecionar registros por nome, adicionar linhas de itens/parcelas visualmente, preencher valores atuais e destacar mudanças e campos removidos. Evidências: `extensions/nativeForm.ts:28`, `approvals/ApprovalPage.tsx:43` no produto `chatgptplugin` e `erp/server/erpCrudRepository.ts:63`.

### Contratos precisam de política explícita de calendário e recuperação

O código atual trata datas do driver e calcula vencimentos, superando parte dos problemas antigos. Porém, o avanço mensal encadeado reproduziu **31/01 → 28/02 → 28/03 → 28/04**. É necessário definir se esse é o calendário desejado ou se o dia original/fim do mês deve ser preservado.

Além disso, cada execução gera um ciclo por contrato selecionado. Vários meses atrasados exigem várias execuções; a automação concluída no mesmo dia não reprocessa a mesma chave. Um erro durante a geração pode reverter o lote.

**Melhoria:** definir e testar a regra de calendário, recuperação de atrasos, períodos incompletos e isolamento de falhas por contrato. Evidências: `erp/shared/commercialContracts.ts:72` e `erp/server/erpSalesContracts.ts:291`. A sequência de datas é comportamento comprovado; sua inadequação depende da regra comercial escolhida.

## 5. Funcionalidades e operação ainda incompletas

| Área | Situação atual | Próximo passo |
|---|---|---|
| Fiscal | Pré-validação de venda e estruturas fiscais; não há emissão fiscal completa no fluxo revisado. | Integrar emissor, retornos, cancelamento e reprocessamento para o escopo fiscal escolhido. |
| Cobrança externa | Tabelas e consulta de histórico; não foi encontrado emissor operacional de Pix/boleto no fluxo ERP examinado. | Implementar emissão e retornos, deduplicação, pagamento parcial e reconciliação. |
| Bancos | Importação OFX e conciliação. | Validar a operação ponta a ponta; conexão bancária automática é uma capacidade adicional. |
| Anexos | Leitura autorizada e URL temporária implementadas. Configuração local de Storage ausente; teste externo pendente. | Configurar e testar acesso autorizado, recusa entre empresas e expiração dos links. |
| Relatórios | DRE de caixa, posição financeira e relatórios comerciais/estoque. Relatórios antigos de competência e aging foram descontinuados. | Definir as visões necessárias, explicitar critérios e reconciliar resultados com as movimentações. |
| Manutenção do plugin | Limpeza e expiração implementadas; agendamento remoto ainda pendente. | Agendar e acompanhar execução, crescimento das tabelas e retenção. |
| Recuperação | Há arquivos locais de backup de tarefas anteriores. Não foi comprovado um procedimento operacional de restauração do ERP. | Verificar backup e demonstrar restauração em ambiente separado. |
| Distribuição | ZIP válido para desenvolvimento; versão 1.5.0 local ainda exige publicação e teste real. | Publicar a versão testada e conferir a instalação privada. |

Para publicação no diretório, o pacote também precisa completar os links de site, privacidade, termos e suporte apontados pelo validador, além do registro e revisão do MCP. Os materiais de revisão inicial incluem cinco casos positivos, três negativos e vídeo; os textos base da listagem devem seguir o idioma exigido pela plataforma. Isso é uma etapa de distribuição pública. Referência: [submissão oficial do plugin](https://developers.openai.com/plugins/deploy/submission).

## 6. Testes e manutenção do código

### Resultado desta avaliação

| Verificação | Resultado | Limite |
|---|---|---|
| Catálogo Supabase atual | Consistente | Metadados; não audita todo o conteúdo dos registros. |
| Configuração OAuth/banco/formulário | Aprovada | Não valida token real. |
| Autenticação do plugin | 35 grupos aprovados | Introspecção simulada. |
| Banco local do plugin | 26 grupos aprovados, 44 propostas | Sem concorrência entre conexões independentes. |
| Permissões e leitura no banco local | 29 verificações aprovadas | Dados fictícios. |
| Checagem de tipos ERP e plugin | Aprovada | Não substitui teste de operação. |
| Pacote ZIP 1.5.0 | Aprovado para desenvolvimento | `publicationReady:false`. |
| Suites ERP | Interface 44, integridade de serviços 56, regressões 78 e views 14 aprovadas; evolução e inspeção estática aprovadas | Parte da cobertura usa catálogo histórico e inspeção de texto. |
| Integridade antiga | Falhou esperando `23001`; recebeu `23503` | Exclusão foi bloqueada. Diagnóstico sem editar a fonte, ajustando apenas essa expectativa em memória, passou nas 61 verificações. |
| Runtime ERP remoto | Interrompido por `REPORT_RETIRED` | O teste ainda pede relatórios removidos; as verificações iniciais de TLS e isolamento passaram. |
| Análise de código | 4 erros e 19 avisos em 205 arquivos examinados | Os quatro erros estão na interface ERP; o plugin não teve erros nesse recorte. |
| Endpoint público sem autenticação | Metadados HTTP 200; MCP HTTP 401 com desafio OAuth | Não demonstra sessão autenticada. |

**Evidência anterior preservada:** 99 verificações por MCP HTTP local usando Supabase real, cobrindo todas as 26 tools de leitura, oito relatórios e preservação de 18 tabelas comerciais. O comprovante registra que OAuth não foi validado e que as tools de escrita não foram chamadas. Orçamento e rascunho existentes foram cobertos por fixtures locais, não por esses registros remotos.

O build completo foi aprovado na entrega anterior. Nesta avaliação foram repetidas as checagens de tipos; o agregador ERP aceitou o comprovante recente do build, sem realizar nova compilação completa. Também continuam pendentes os testes de navegador autenticado, anexos e concorrência externa.

### Manutenção recomendada

- Atualizar os dois testes desatualizados e limpar os quatro erros de análise da interface.
- Automatizar gates com comprovantes de execução. A etapa antiga de validação usa idade do `BUILD_ID` e variáveis para algumas verificações externas; isso é evidência insuficiente de que o código atual e os fluxos externos foram testados.
- Dividir gradualmente `erpRepository.ts` (4.549 linhas), `erpProfessionalRepository.ts` (1.289) e `SalesWorkspacePage.tsx` (1.466) por responsabilidade, preservando as transações compostas.
- Medir consultas e índices com volume representativo. A quantidade de índices não demonstra desempenho.
- Validar acessibilidade e recuperação de erros no ERP autenticado e nos componentes dentro do ChatGPT real.

## 7. Ordem recomendada

1. Atualizar dependências vulneráveis e manter os testes essenciais aprovados.
2. Comprovar OAuth real e preparar configuração de produção.
3. Corrigir recuperação de automações, indicadores, paginação e testes desatualizados.
4. Validar escritas e concorrência em PostgreSQL separado; validar ERP autenticado, cards reais e anexos.
5. Melhorar formulários e comparação das alterações antes da aprovação.
6. Publicar a versão validada e ativar manutenção e monitoramento.
7. Concluir fiscal, cobrança e capacidades adicionais conforme o público do ERP.

Não identifiquei necessidade de reconstruir o ERP, trocar os schemas ou criar novas pastas para iniciar essas melhorias. A maior oportunidade agora é concluir e validar os fluxos existentes.

## Comprovantes locais

- Catálogo atual: `.cache/erp-audit/catalog-20261003.json` — atualizado nesta revisão; consultar a data interna.
- Dependências: `.cache/erp-audit/dependency-review-20261004.json`.
- Análise de código: `.cache/erp-audit/lint-review-20261004.json`.
- Permissões: `.cache/erp-audit/read-access/access-matrix.json`.
- Validação ERP: `docs/erp-interface/etapa-6-testes.json`.
- Leituras MCP anteriores: `.cache/erp-audit/mcp-all-read.json`.
- Entrega CRUD e limites: `docs/chatgptplugin/crud-20261004.md`.

**Verificação descartada:** o despacho da edição de compra usa `cotacao`, mas o repositório aplica esse tipo ao documento temporário e preserva `tipo_movimento` na compra original. A inspeção completa não confirmou o defeito inicialmente suspeitado; ele não integra os achados desta avaliação.

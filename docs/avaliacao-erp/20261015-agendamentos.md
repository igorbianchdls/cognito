# Testes de agendamentos — 15/10/2026

## Resultado

O executor passou nos cenários abaixo, mas o disparo automático em produção está reprovado: a Vercel devolveu `crons: []` no deployment publicado e `project.crons.definitions: []` no projeto. A empresa 2 não tem execuções registradas. O segredo CRON_SECRET existe no ambiente de produção e as rotas recusam chamadas sem autorização.

Deployment inspecionado: `dpl_C5CdofGLwmaxj54M9nZTC1KgEnPi`.

O `vercel.json` local prevê duas rotinas diárias:

- ERP: 05:15 UTC, equivalente a 02:15 em Fortaleza.
- Manutenção MCP: 05:45 UTC, equivalente a 02:45 em Fortaleza.

Não foi chamado o endpoint autenticado global: ele processaria todas as empresas e registros reais. A manutenção também pode tentar operações Clerk, adiadas pelo usuário.

## Validações aprovadas

- As duas rotas publicadas retornam 401 sem token e com token incorreto: quatro verificações HTTP.
- Orquestrador real com dependências de teste: seis empresas, cinco rotinas por empresa, 30 chamadas, contexto e fuso corretos, limite de quatro empresas simultâneas. Uma falha proposital não interrompeu as demais rotinas/empresas.
- Executor real com banco real e transações de teste: conclusão e reenvio executam o trabalho uma única vez.
- Falha do trabalho desfaz seus efeitos; nova tentativa reutiliza a execução e incrementa tentativas.
- Execução em andamento respeita a reserva de 15 minutos; reserva vencida permite retomada.
- Contratos pendentes deixam a execução recuperável e a retomada pode concluir.
- Rollback final: nenhum lançamento de teste persistido.

As transações do executor foram encapsuladas por savepoints dentro de uma transação externa de teste; isso testa estados/rollback/reenvio, mas não comprova morte real de processo ou concorrência entre conexões independentes. As 30 chamadas do orquestrador usam trabalho simulado e não significam execução integral dos cinco módulos de negócio nesta rodada.

Evidências: `.cache/erp-scheduler/production-audit.json` e `.cache/erp-scheduler/runtime.json`.

## Correção necessária e validação seguinte

1. Corrigir a publicação para registrar os dois crons no deployment de produção.
2. Exigir, após publicar, que os dois horários apareçam também na API da Vercel; a existência do arquivo local não basta.
3. Confirmar uma execução disparada pelo horário, correlacionando horário/logs da plataforma e histórico do ERP, sem acionar indiscriminadamente registros de outras empresas.

Nenhuma configuração de produção foi alterada nesta rodada de testes. O disparo físico pelo relógio permanece não verificado e atualmente sem definições publicadas.

## Correção da publicação

A regra global `*.json` do `.gitignore` excluía `vercel.json` do conjunto coletado por `git ls-files`. Adicionada exceção explícita para o arquivo e validação obrigatória de sua inclusão nos três publicadores ERP. Os publicadores também repassam versão, origem, regiões e crons no pedido, seguindo o formato do cliente oficial da Vercel. As duas primeiras candidatas desta correção, ainda sem o arquivo incluído, foram rejeitadas pela nova verificação e não promovidas.

O procedimento de promoção agora exige os dois agendamentos no deployment; a verificação após promoção também os exige. O comprovante dedicado compara ainda as definições ativas do projeto e seu deployment de origem.

Candidata validada: `dpl_DBay7xu7td6X4PgonpAdXjATBacm`, compilação READY, com os dois horários na API da Vercel. Evidência: `.cache/erp-scheduler/candidate.json`.

Referência de implementação: [cliente oficial da Vercel](https://github.com/vercel/vercel/blob/main/packages/cli/src/util/index.ts), que repassa a configuração local no pedido de publicação; [manutenção de Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

Publicação concluída em 15/10/2026 às 03:46 UTC: domínio de produção confirmado na versão corrigida. Ambos os crons constam no deployment e em `project.crons.definitions`, com agendamentos habilitados e vinculados ao mesmo deployment. Testes de leitura autenticada, cadastros/exportações e recusa de cron sem token passaram na candidata antes da promoção.

Evidência após promoção: `.cache/erp-scheduler/production-fixed.json`. O disparo pelo relógio ainda aguarda a próxima janela diária; não foi simulado como prova de execução automática.

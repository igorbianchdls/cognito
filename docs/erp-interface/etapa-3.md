# Etapa 3 — Vendas, ordens de serviço e contratos

Implementação local em 09/09/2026. Sem conexão com Supabase, migração, alteração de dados reais ou publicação.

## Vendas e orçamentos

- Formulário e servidor usam cálculos decimais compartilhados nos itens e totais. Desconto geral pode ser informado em reais ou percentual; o percentual é persistido e seu valor calculado é controlado pelo banco.
- Edição de rascunhos preserva a versão do registro e agora copia também o tipo do desconto. Confirmação e cancelamento pela interface enviam a versão observada e rejeitam documentos alterados por outra sessão.
- Criação mantém a identificação da operação enquanto seu resultado é incerto. A solicitação original é guardada nos metadados existentes; reutilizar a chave com conteúdo diferente gera conflito.
- Conversão de orçamento em venda cria o documento, previsões, itens e vínculo com a origem na mesma transação. Valores e datas são normalizados antes da cópia.
- Consulta apresenta os dados do cliente preservados no documento e o desconto calculado. O nome exibido nos detalhes respeita o snapshot existente.

## Ordens de serviço

- Cálculos de itens não truncam descontos inválidos silenciosamente. Subtotal, desconto e total seguem as equações do banco.
- Edição disponível para rascunhos sem venda/orçamento vinculado, com validação de versão, atualização de itens e registro de evento na mesma transação.
- Formulário conserva o desconto geral na edição e aplica as permissões de vendas.
- Criação compara a solicitação ao repetir uma chave. A interface conserva a operação após falha de comunicação.
- Conversão em orçamento ou venda é atômica: uma falha ao vincular a origem também desfaz o novo documento. Estados e versões são verificados com o registro bloqueado.

## Contratos

- Criação monta cabeçalho em rascunho, versão comercial e item vinculado à versão; efetiva a versão e só então ativa o contrato. Cliente e item devem estar ativos na empresa.
- Versão guarda vigência, periodicidade, vencimento e dados do cliente. A identidade de criação é comparada em repetições.
- Clicar no número do contrato abre versões e ciclos gerados. A interface permite uma nova versão com quantidades/preços e motivo, a partir da próxima geração. A versão anterior é encerrada sem modificar os períodos já gerados.
- Geração consulta somente os itens e condições da versão efetivada vigente. Registra período inicial/final, versão utilizada, venda, previsão de recebimento e tentativa concluída.
- Cálculo de período segue o comportamento de meses do PostgreSQL, incluindo fim de mês e ano bissexto. Vencimento usa a regra da versão.
- Não duplica ciclos. Contratos sem versão válida, com ciclo registrado ou cujo ciclo completo ultrapasse a vigência são informados como pendentes de revisão na interface.
- Processamento manual limitado a 100 contratos, um ciclo devido por contrato em cada chamada. Processamento contínuo, novas tentativas após falhas e acompanhamento das automações pertencem à etapa 5.

## Validação

24 cenários offline aprovados em `node scripts/erp/interface-foundation-smoke.mjs`, com banco PostgreSQL embarcado (PGlite), estrutura local e dados fictícios. Resultado em `etapa-3-testes.json`.

Além das regressões das etapas anteriores, os testes exercitam:

- Criação repetida e conflito de conteúdo em contratos, vendas e OS.
- Criação/efetivação de contrato, ciclo com fim de mês, nova versão, conflito de versão e geração seguinte.
- Edição de OS, rejeição de versão antiga, desconto inválido e conversão em venda.
- Edição de orçamento com desconto percentual, conversão e confirmação da venda com geração financeira.
- Rejeição de confirmação com versão incorreta e regras de calendário/vencimento.

Verificação de tipos em `tsconfig.erp.json` aprovada. Análise estática dos arquivos comerciais sem erros; aviso pré-existente de variável não utilizada no repositório gerencial. Testes visuais interativos, carga e concorrência em múltiplas sessões permanecem na etapa 6.

## Limites e continuidade

O formulário inicial de contratos mantém a seleção de um serviço/produto já oferecida pelo módulo. A revisão trabalha sobre os itens da versão existente, alterando quantidade e preço; não é um editor de aditivos jurídicos ou de inclusão/exclusão de itens. Os ciclos não recebem prorrateio automático.

Nenhuma nova tabela, view, integração, funcionalidade fiscal ou de estoque foi adicionada. A etapa 4 continua com posições financeiras, créditos, adiantamentos, renegociações e demais operações financeiras; a confirmação comercial exercitada aqui não substitui essa adaptação.

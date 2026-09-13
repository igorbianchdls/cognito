# Etapa 5 — Históricos, rotinas e navegação

Implementação local no projeto Creatto/Cognito. As regras foram confrontadas com as migrações e com a estrutura restaurada no banco isolado dos testes, incluindo `20260909040000_harden_erp_service_integrity.sql`. Nenhuma migração foi aplicada ao Supabase e nenhum dado real foi alterado. A tentativa adicional de consultar os metadados remotos não conseguiu estabelecer a conexão neste ambiente.

## Documentos e anexos

- Históricos paginados e anexos nos detalhes de vendas/orçamentos, compras, contratos, ordens de serviço e títulos financeiros.
- Notas fiscais vinculadas podem abrir seu histórico; documentos relacionados têm endereço próprio de histórico e anexos.
- As consultas selecionam campos de apresentação, preservam datas, responsáveis registrados e vínculos, sem permitir edição do histórico.
- A API valida tipo, identificação, empresa, permissão do módulo e vínculo do arquivo antes de solicitar acesso temporário ao armazenamento.
- Carregamento, vazio, erro e arquivo indisponível são estados separados. Ao mudar documento ou página, respostas antigas são descartadas.

**Configuração pendente no ambiente:** `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` não estão disponíveis. A listagem de metadados está implementada; visualizar/baixar o conteúdo retorna uma mensagem de armazenamento não configurado. Não foram criadas credenciais nem testados arquivos reais. O acesso configurado usa URL assinada de 60 segundos e resposta sem cache.

## Estados e resultados

| Recurso | Fonte e apresentação |
| --- | --- |
| Documento | Tabela de eventos própria; evento, transição, motivo, versão e data quando registrados |
| Execução | `execucoes_automacao`; estado, tentativas, início, fim, resultado, erro e `historico_estados` |
| Importação | `importacoes_dados` e linhas; estados persistidos e contadores derivados das linhas |
| Evento de cobrança | Envelope recebido preservado; recebimento distinto de conclusão do processamento |
| Processamento de cobrança | Execuções ligadas por `evento_cobranca_id`; sem inferir liquidação pelo estado externo |
| Notificação | Agendamento, marcos de envio/entrega, tentativas disponíveis e histórico de transições |

Datas de calendário são exibidas como dia/mês/ano. Instantes são apresentados no fuso `America/Fortaleza`. Estados desconhecidos são identificados explicitamente. Não há integração nova com provedores de cobrança ou de notificações, nem simulação de entrega bem-sucedida.

## Rotinas e recorrências

- Acesso operacional em `/erp/cadastros/automacoes`; o endereço anterior em Relatórios redireciona para o novo.
- Execuções concluídas ou em andamento são consultadas sob bloqueio, sem reinserir a chave. Uma retomada de falha incrementa a tentativa e limpa o encerramento anterior.
- A rotina de indicadores registra a consulta efetiva dos indicadores; a atualização de vencidos considera saldo composto e obrigação efetiva.
- Recorrências financeiras de pagar e receber seguem o calendário ancorado na data inicial, com fim por quantidade/data ou duração indeterminada, limites por lote e identidade de ocorrência.
- Formulário de despesa permite intervalo e as três condições de término. Pausa, retomada e encerramento possuem validação de estado e comparação da atualização recebida.
- Receitas recorrentes usam `origem='api'`, valor aceito pela restrição existente, e o vínculo estruturado `recorrencia_financeira_id` para identificar sua origem recorrente.
- Recorrências de compra geram pedidos com previsões comerciais e vínculo em `compras_recorrencias_geracoes`. O banco admite contas a pagar vinculadas apenas depois da efetivação da compra; pedidos não materializam obrigação financeira antecipadamente.
- Gerações de contratos e compras respeitam os períodos aplicáveis. Resultados dos contratos incluem ocorrências geradas e ignoradas com motivo.
- Uma execução que permaneça `processando` após encerramento abrupto do processo é apresentada nesse estado; não há retomada automática sem evidência de que o trabalhador anterior terminou.

## Importações

- O mesmo conteúdo e tipo resolvem para o lote existente.
- Cada destino, resultado da linha e contadores são confirmados juntos. Uma interrupção mantém concluídas as linhas já confirmadas e permite continuar as pendentes ao reenviar o mesmo arquivo.
- Erros de linha são preservados; falhas transitórias de conexão/concorrência e negação de acesso não são convertidas em erros cadastrais permanentes.
- Conclusão/parcial/falha são derivadas dos resultados. Repetir um lote terminal não o reabre nem duplica os destinos.
- Detalhes paginados mostram linhas, erros e identificações dos destinos; a exportação dos erros contém todas as linhas com erro do lote.
- Importação OFX foi verificada quanto à repetição do arquivo e à repetição de identificadores externos em arquivos distintos.

## Navegação e relatórios

`reportCatalog.ts` reconhece os sete identificadores retirados: `dre`, `dre-competencia`, `fluxo-de-caixa`, `fluxo-diario`, `fluxo-mensal`, `aging-receber`, `aging-pagar`. Foram retirados menus, definições de operações e componentes específicos. O menu lateral e a entrada de Relatórios apontam para Posição financeira.

Links antigos exibem a informação de descontinuação; APIs respondem `410 REPORT_RETIRED` antes de consultar o banco. Módulos desconhecidos não são convertidos no primeiro módulo da seção.

| Relatório mantido | Critério |
| --- | --- |
| Resultado dos pagamentos por caixa (`dre-caixa`) | Recebimentos/pagamentos líquidos, rateados por categoria com ajuste de centavos. Estornos pertencem à data de reversão. Exclui adiantamentos, transferências e aplicações de crédito; o nome não promete uma DRE contábil completa |
| Posição financeira | Saldo composto, excluindo cancelamentos e previsões a pagar |
| Vendas por cliente/vendedor | Vendas confirmadas/faturadas; agrupamento por identidade, sem rascunhos ou orçamentos |
| Vendas por produto | Itens de vendas válidas e participação proporcional no total do documento |
| Compras por fornecedor/categoria | Compras efetivas e não canceladas; categoria comercial do documento |
| Saídas e estoque atual (`giro-estoque`) | Movimentos negativos nos últimos 90 dias, incluindo transferências/ajustes/estornos de entrada, divididos pelo saldo atual. Sem saldo positivo, a razão fica indisponível |
| Valor do estoque | Posição atual por produto/local e custo médio; filtro de datas desabilitado |

Os relatórios não consultam as quatro views financeiras removidas.

## Visão geral

- Receber/pagar e vencidos usam a composição financeira da etapa 4; previsões a pagar não entram em obrigações.
- Caixa inclui saldos iniciais, pagamentos e reversões pelas respectivas datas e movimentos de adiantamento. Transferências entre contas não alteram o consolidado.
- Vendas/compras mensais excluem rascunhos e datas fora do mês. Compras exigem movimento efetivo.
- Conciliações parciais permanecem na fila pendente.
- O antigo “Saldo projetado” foi nomeado “Caixa após saldos em aberto”, explicitando ausência de prazo e exclusão de previsões.
- O cartão de margem bruta foi retirado: não havia base suficiente para garantir a interpretação do custo e da margem. A API retorna esse campo como indisponível.
- Carregamento e erro não são apresentados como saldo zero. Valores numéricos retornados pelo PostgreSQL são convertidos antes de somar na interface.

## Verificação e limites

Evidências funcionais: `etapa-5-testes.json`, gerado por `scripts/erp/interface-foundation-smoke.mjs`. A suíte usa somente dados fictícios no PostgreSQL embutido isolado; inclui consultas com o papel `erp_runtime`, relatórios, importações, recorrências, estados, anexos e preservação de valores por período.

A suíte funcional passou nos 44 cenários, sem acessar o banco real. A análise estática e a checagem de tipos do ERP fazem parte da entrega. A tentativa de compilação completa do Next.js com webpack falhou por falta de memória (`RangeError: Array buffer allocation failed`). Portanto, a compilação de produção permanece pendente em ambiente com memória suficiente; os testes isolados não substituem essa verificação.

Os testes completos em navegador, a bateria integrada de permissões e concorrência com duas conexões PostgreSQL independentes e a validação de armazenamento configurado pertencem à entrega de validação da etapa 6; não são substituídos pelos testes isolados desta etapa.

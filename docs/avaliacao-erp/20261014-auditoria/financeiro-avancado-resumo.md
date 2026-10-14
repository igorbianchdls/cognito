# Financeiro — casos avançados e concorrência — 14/10/2026

## Resultado

Dez novos grupos aprovados, sem nova falha confirmada: sete cenários de servidor com rollback e três grupos de concorrência na API publicada. Contexto interno empresa2/usuário3. Processadores limitados a IDs fictícios; regras/recorrências preexistentes não foram processadas. Nenhuma correção ou publicação de produto neste lote.

## Sete grupos internos

- CSV sobreposto e reordenado: três arquivos contendo A/B, C/B e B/A/C deixam somente três movimentos, líquido109,50.
- CSV com uma linha válida e outra em31/02/2026: operação recusada e nenhum movimento parcial mantido. Não é aprovação da qualidade da mensagem de erro da interface; o banco recusa a data inválida.
- Recorrência receber diária:14/10,15/10,16/10, sem duplicação no reenvio.
- Recorrência receber a cada duas semanas:14/10,28/10,11/11.
- Recorrência receber anual:29/02/2028,28/02/2029,28/02/2030, sem duplicação.
- Regras com descrições sobrepostas: descrição mais específica vence e usa categoria129, em vez da genérica128.
- Falha por período fechado: um extrato de13/10 não gera lançamento e aparece em falhas; o de14/10 é lançado normalmente. Os extratos foram preparados antes do fechamento para testar a recuperação do lançamento automático. A primeira tentativa de fixture criava extrato depois do fechamento, operação recusada corretamente pelo banco.

Recorrências a receber foram preparadas como fixtures via SQL e função de título manual, pois este teste avalia geração/calendário e não o cadastro na UI. Transações descartadas ao final.

## Três grupos simultâneos na API publicada

Venda1089, parcela comercial1641 e parcela financeira1413, conta873, cliente QA294, banco QA21. Prefixo QA-OTTO-FIN-CONC.

1. Duas baixas concorrentes de20 com a mesma chave responderam200 e devolveram o mesmo pagamento1107, com um único efeito.
2. Com saldo80, duas baixas concorrentes de60 com chaves diferentes: somente uma aceita (pagamento1108); outra422. Saldo final20, sem excesso de recebimento.
3. Duas solicitações concorrentes de estorno do pagamento1107 com a mesma chave responderam200 e devolveram a mesma reversão1110.

Encerramento: também estornado pagamento1108; saldo restaurado100; venda1089 cancelada, versão3. Conta a receber cancelada e resumo total ativo0. Recebimentos80 e estornos80 deixam efeito líquido de caixa0. Histórico QA preservado para auditoria; nenhuma transferência bancária externa foi executada.

O roteiro inicial chamou a baixa com o ID comercial1641; a API recusou as duas tentativas sem efeito. Corrigido para IDfinanceiro1413 antes dos testes efetivos; não foi tratado como defeito.

## Plano e próximos casos

A falhaP2 de reenvio na criação manual de pagar permanece pendente. Nenhuma nova correção neste lote.

Restam: concorrência no pagar, aplicação de crédito/adiantamento, importação/automação e processadores de recorrência; permissões e isolamento entre empresas; UI e tools individualmente; datas diferentes para pagamento/estorno nos relatórios; edição/encerramento de recorrências; falhas SQL dentro de lote automático (o cenário deste lote usa bloqueio de período validado no serviço); regras com empate, ajustes de cartão após mudar configuração e conferência integral do histórico. Não declarar financeiro integralmente auditado.

## Evidências

financeiro-avancado-final.json, financeiro-regra-parcial-reteste.json, financeiro-concorrencia-http.json. Roteiro reproduzível interno: testes-financeiro-avancado.mjs. Acumulado deste avanço financeiro:38grupos distintos,37aprovados e1falhaP2aberta.

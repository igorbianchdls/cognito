# Financeiro — continuação da auditoria em 14/10/2026

## Resultado do lote

10 grupos executados: 9 aprovados e 1 falha confirmada, com prioridade média. Testes das funções compartilhadas de servidor usando o papel/contexto do ERP (empresa 2, usuário 3). Todas as operações foram executadas em transações descartadas, inclusive pagamentos, estornos, adiantamentos, acordos, extratos e fechamento/reabertura. Não houve alteração de regra de produção nem publicação neste lote. Registros usam QA-OTTO.

## Cenários aprovados

- Receber: principal 1.000; baixa 400 + juros 10 + multa 5 - desconto 20 - taxa 3 = caixa 392, saldo 600. Baixa restante 600 e estorno da primeira deixam principal pago 600, saldo 400 e caixa 600. Encargos estornados deixam de compor a realização. Reenvio não duplica, conteúdo diferente e baixa acima do saldo são recusados.
- Pagar: mesmos valores, com taxa somada: caixa 398. Após baixa restante e estorno, saldo 400 e caixa 600. Mesmas proteções de reenvio e excesso.
- Adiantamento de cliente: constituição 200, aplicação 80 reduz dívida de 300 para 220 sem novo caixa; excesso e entidade diferente recusados; reversão restaura dívida 300; reenvios não duplicam.
- Adiantamento a fornecedor: mesmo ciclo e proteções.
- Renegociação receber: dívida 100 com recebimento 30 transfere saldo 70; desconto 5 + encargos 2 geram destino 67; reenvio não duplica; reversão restaura saldo de origem 70.
- Renegociação pagar: mesmo ciclo e valores.
- Fechamento financeiro: impede baixa e estorno no dia fechado; fechamento sobreposto recusado; reabertura permite baixa, resultando em saldo 70. Fechamento inteiro descartado ao final.
- Conciliação: recebimento 100 e extrato crédito 60 conciliados parcialmente; replay reutiliza o vínculo e excesso recusado. Caixa continua 100 antes/depois de desfazer, extrato volta a pendente.
- Centavos e paginação: conta de 1.000,01 em 333,33 + 333,34 + 333,34; resumo total correto. Após baixa parcial e ao consultar página além da última, total de registros e resumo permanecem coerentes.

## Falha confirmada — P2: reenvio de criação manual aceita conteúdo divergente

Código: MANUAL_PAYABLE_REPLAY_BODY_UNCHECKED.

Reprodução: criar manualmente uma conta a pagar de 100 com chave K; repetir o mesmo conteúdo reutiliza a parcela, corretamente. Reenviar K com valor_total=150 também reutiliza a conta anterior de 100, sem IDEMPOTENCY_CONFLICT. O solicitante recebe sucesso apesar de o pedido enviado ser diferente. Não houve duplicação nem débito externo; há risco de informar sucesso para uma intenção de gravação não atendida. A reprodução foi descartada no rollback.

Causa observada em createManualPayableRecord, erpRepository.ts: o retorno do documento encontrado pela chave ocorre antes de comparar o conteúdo da solicitação.

## Plano de melhoria

1. Guardar assinatura canônica da solicitação de criação manual, incluindo fornecedor, valores, parcelas/datas, categoria, centro de custo, conta/forma e recorrência, conforme os campos efetivamente aceitos.
2. Sob a trava de empresa/chave já existente, reutilizar apenas se a solicitação for equivalente; conteúdo diferente deve retornar 409 IDEMPOTENCY_CONFLICT com mensagem clara.
3. Preservar resposta/histórico e o escopo da empresa. Definir tratamento conservador para registros antigos sem assinatura: não afirmar equivalência sem prova e não criar nova conta silenciosamente.
4. Aplicar a proteção na função compartilhada para cobrir tela, API e tools que a chamam. Retestar mesma chave/mesmo corpo, mudança de cada campo relevante, duas requisições concorrentes, parcelas múltiplas, recorrência e registros antigos.

Estado: falha confirmada; correção ainda não implementada, conforme o escopo de testes e plano solicitado.

## Próximos testes

- Conferir fluxo de caixa, saldo bancário, DRE e rateios de ponta a ponta com documentos de origem e datas de competência/caixa.
- Renegociação entre entidades e origens sem saldo; reversão após liquidar destino; cenários com créditos combinados.
- Importação CSV/OFX, duplicidades de extrato, regras automáticas de conciliação e operações entre contas diferentes.
- Previsões versus títulos efetivados, recorrência financeira e cartão/repasse/taxas.
- Interface publicada, perfis distintos, isolamento entre empresas e concorrência entre sessões. Não foram aprovados por este lote.

## Evidências

financeiro-consolidado.json é o resultado consolidado. Entradas: financeiro-ampliado.json, financeiro-adiantamentos-reteste.json, financeiro-reenvio-manual.json e financeiro-complementos.json. Roteiro: testes-financeiro-ampliado.mjs.

O roteiro inicial de rejeição de adiantamento não disparava validações diferidas do banco antes de esperar a rejeição; foi corrigido para conferir as restrições imediatamente e os dois cenários foram retestados com sucesso. Essa primeira falha do roteiro não é um defeito do ERP.


## Atualização — relatórios, acordos e importações

Seis grupos adicionais aprovados em 14/10/2026: caixa/competência/banco e estorno; adiantamento sem reconhecimento de receita; rateio DRE/foraDRE com centavos; acordos entre entidades e reversão após baixa de destino nos dois lados; importação integral repetida CSV/OFX sem duplicação. Ver financeiro-relatorios-resumo.md e financeiro-relatorios-final.json para evidências e limites. A falha P2 de reenvio manual permanece aberta. Recorrências/previsões, cartões/repasses, automação de conciliação, casos avançados de importação/relatórios e interface continuam pendentes.


## Atualização — recorrências e previsões

Cinco grupos aprovados em14/10/2026: pagar mensal no fim do mês com limite/reenvio, pausa e término por data, bloqueio por período fechado, previsões receber/pagar com bloqueio de baixa antes de efetivar. Detalhes e limites em financeiro-recorrencias-resumo.md; evidências em financeiro-recorrencias-final.json. Cartões/repasses, conciliação automática e recorrências avançadas permanecem pendentes. A falhaP2 anterior continua aberta.


## Atualização — cartões e conciliação automática

Sete grupos aprovados em14/10/2026: taxa/repasses parcelados/estorno/replay, repasse conciliado bloqueando estorno, configurações inválidas, lançamento automático crédito e débito sem duplicação, conta/descrição e divergência no repasse com auditoria. Roteiro restrito a registros QA e transações descartadas. Evidências e pendências em financeiro-cartoes-resumo.md e financeiro-cartoes.json. Nenhuma nova falha; falhaP2de reenvio manual continua pendente.


## Atualização — casos avançados e concorrência

Dez novos grupos aprovados em14/10/2026: importação sobreposta/inválida, calendários receber diário/quinzenal/anualbissexto, prioridade de regra e continuação após bloqueio de período; três concorrências naAPI publicada (baixa mesma chave, disputa por saldo e estorno mesma chave). VendaQA1089 encerrada, caixa líquido0. Detalhes e pendências em financeiro-avancado-resumo.md. Acumulado38grupos:37aprovados e1falhaP2aberta.


## Atualização — datas e edição de recorrências

Cinco grupos aprovados em14/10/2026: estorno entre meses em pagar/receber, desempate e exclusão de regras, edição só de competências futuras e interrupção após encerramento. Ver financeiro-datas-edicao-resumo.md e financeiro-datas-edicao-final.json. Tentativa de transporteMCP não concluiu por encerramento do processo local e não foi contada; nenhuma sobra de títulos QA foi encontrada. Acumulado43grupos:42aprovados e1falhaP2aberta.


## Atualização — isolamento e concorrência de pagar

Onze novos grupos aprovados; compraQA337 encerrada com estornos, sem efeito líquido de caixa ou recebimento de estoque. Evidências em financeiro-seguranca-concorrencia-resumo.md. Acumulado54grupos:53aprovados e1falhaP2aberta. Roteiro de fechamento definido com14grupos pendentes em financeiro-roteiro-restante.json; novos achados podem exigir retestes.

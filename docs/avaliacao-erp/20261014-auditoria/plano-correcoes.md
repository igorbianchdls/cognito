# Plano de correções — estoque, vendas e serviços — 14/10/2026

Versão auditada: dpl_26djPNymmpTjLSyHvWvsCRYApper. Os cinco repositórios de regras testados coincidem, por SHA-1, com o manifesto publicado. Os defeitos abaixo foram registrados na auditoria e posteriormente corrigidos; consulte a atualização de implementação ao final e correcoes-resumo.md. Os cenários com cancelamento, devolução, crédito, OS e contrato executaram dentro de transações descartadas; o teste HTTP de concorrência usou somente o produto QA 126 e encerrou com quantidade/valor zero.

## 1. P1 — Reenvio de entrega parcial consome reserva novamente

Reprodução: venda de 4 unidades com estoque 10. Entregar 1: físico 9, reservado 3, atendido 1. Reenviar o mesmo pedido e chave: mesmo documento de estoque, físico permanece 9, mas reservado cai a 2 e atendido avança para 2. Pode liberar estoque indevidamente e encerrar atendimento sem a saída correspondente.

Correção proposta: registrar assinatura e resultado da operação antes de alterar reservas/atendimento, na mesma transação. Recuperar o resultado antes de validar o estado atual. Corpo ou venda diferentes com a mesma chave devem retornar conflito. Garantir que o reenvio não altere item, reserva, documento ou eventos.

Aceite: reenvio sequencial e simultâneo antes/depois de concluir; 4 unidades, entregas de 1+3, devolução parcial posterior; uma saída por entrega e reserva sempre igual ao pendente.

## 2. P1 — Cancelamento de venda entregue mantém baixa física

Reprodução: estoque 5, venda confirmada de 1, entrega reduz físico a 4. Sem recebimentos, cancelamento é aceito e cancela o recebível de 100, mas deixa físico 4. A venda cancelada impede registrar devolução pelo fluxo normal, que exige venda confirmada.

Correção proposta: bloquear cancelamento enquanto houver quantidade entregue não formalmente devolvida, com mensagem que oriente a devolução. Não repor automaticamente mercadoria que pode estar com o cliente. Tratar devoluções e valores financeiros de forma consistente antes de permitir o cancelamento final.

Aceite: entrega parcial/integral, devolução parcial/integral e kits; nenhuma venda cancelada com mercadoria entregue pendente de tratamento; estoque e CMV coerentes.

## 3. P1 — Cancelar venda mantém crédito utilizável sem contrapartida

Reprodução: venda não recebida de 100, entrega e devolução total geram crédito 100; cancelamento elimina o recebível original, mas deixa o crédito disponível. O crédito consegue liquidar outra venda de 100 sem caixa, concedendo crédito sem contrapartida.

Correção proposta: considerar devoluções/créditos no cancelamento. Bloquear até tratar os vínculos ou estornar formalmente crédito ainda não utilizado na mesma transação; crédito já utilizado exige reversão da utilização antes do cancelamento. Preservar trilha de auditoria e impedir dupla compensação. Revisar também vínculos com reembolso, embora a combinação reembolso+cancelamento não tenha sido exercitada neste lote.

Aceite: crédito disponível, parcial e totalmente utilizado; repetição; concorrência entre utilização e cancelamento. Somatório de dívida, crédito e caixa deve permanecer coerente.

## 4. P2 — Local informado no atendimento é ignorado

Reprodução: API aceita local_estoque_id de um segundo local ativo. Com 5 unidades em cada local, entrega solicitada no segundo local reduz o principal a 4 e mantém o segundo em 5, sem avisar que desconsiderou o local. A devolução retorna corretamente ao local efetivo da saída.

Correção proposta: definir a regra explicitamente. Validar o local solicitado contra a reserva e rejeitar divergência com mensagem clara, ou reatribuir reserva e consumir o local solicitado de forma atômica, validando saldo/permissão. Não aceitar silenciosamente um campo sem aplicá-lo.

Aceite: local reservado, outro local ativo, local inativo, local de outra empresa, falta de saldo, kit e repetição. Entrega e devolução devem usar o mesmo local/custo histórico.

## Cenários aprovados

Inventário multi-itens com ajuste +2/-1 e valor final 360; falha no segundo item não deixa ajuste parcial; repetição gera apenas dois movimentos; saldo desatualizado e local inativo bloqueados. Transferências entre custos 20 e 40 preservam 15 unidades e valor 400, com diferença residual de 0,000005 pela precisão de seis casas do custo. Reembolso de venda paga gera pagar 100 sem pagamento automático e mantém receber pago. Cancelamento com recebimento é bloqueado até o estorno; após estorno, caixa líquido zero. OS rascunho permite edição (340), bloqueia versão antiga/edição após aprovação e mantém cadeia OS→orçamento→venda sem duplicar. Revisão de contrato preserva ciclo antigo 180 e gera próximo a 220; reenvio não duplica. Abatimento de serviço reduz saldo em 180 sem caixa e impede devolver quantidade excedente.

Concorrência HTTP: entradas simultâneas com mesma chave retornaram o mesmo movimento 952 e físico 5; saídas simultâneas de 4 permitiram apenas uma (953), outra 422; corpo diferente com chave reutilizada 409; encerramento 954, físico/reservado/valor zero.

## Cobertura ainda pendente

Depois das correções: repetir os quatro casos falhos e ampliar concorrência de entregas, devoluções e cancelamento/crédito. Entrega com vários locais em uma única venda fica dependente da definição/correção do local solicitado; a reconstrução de devolução distribuída não foi validada de ponta a ponta. Também faltam combinações de reembolso+cancelamento, comissões após devoluções/estornos, revisões com múltiplos itens e vencimento/fim de mês, e documentos fiscais externos em homologação.

Evidências: consolidado.json, estoque-vendas-servicos-testes.json, reenvios-cancelamentos-testes.json, abatimento-reteste.json, concorrencia-estoque-http.json e correspondencia-versao.json. Scripts reproduzíveis: testes-avancados.mjs e testes-reenvios-cancelamentos.mjs.

Reteste do abatimento de produto aprovado: venda 370, devolução de duas unidades abate 180 e deixa 190; devolução das demais deixa somente frete 10. Estoque restaura 10 unidades e caixa permanece zero. A primeira asserção do roteiro consultava valor_pago em vez do saldo composto com crédito; ajustado somente o roteiro e repetido o cenário, sem mudança no ERP.

Consolidado: 13 cenários, 9 aprovados e 4 com falha confirmada. Nenhuma alteração de código ou publicação neste lote; melhorias pendentes conforme prioridades acima.


## Implementação e retestes concluídos — 14/10/2026

As quatro prioridades acima foram implementadas e aprovadas em 14 cenários com rollback, além de prova HTTP publicada com entrega simultânea e reenvio após conclusão. O cancelamento direto é bloqueado se houver entrega ou devolução; a compensação deve seguir o tratamento financeiro da devolução. Local divergente é recusado, mantendo a reserva original. Também são bloqueados item repetido, local reservado inativo e crédito de origem cancelada. Texto da confirmação alinhado à regra. Detalhes, IDs e evidências em correcoes-resumo.md e correcoes-publicacao.json.

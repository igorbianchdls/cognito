# Cobertura de estoque e vendas — 14/10/2026

Versão dpl_6RNS7nFq4yUjjpwuGDBsb6efdK6E. Oito arquivos de regras coincidem com o manifesto publicado. Nenhuma mudança de código ou publicação neste lote.

## Resultado

20 grupos adicionais de cenários: 15 aprovados e 5 com falhas confirmadas. Há 14 grupos de regressão aprovados no lote anterior da mesma versão, referenciados sem contá-los como novos testes. Também foram conferidas 14 consultas de módulos e duas exportações CSV. A contagem representa grupos, cada um com várias verificações, e não todos os dados/combinações possíveis do ERP.

## Novas falhas e plano de melhorias

### P1 — Custo de devoluções intercaladas

Estoque inicial 5 a 20 = 100. Venda de duas unidades: entrega uma, devolve uma; nova entrada 5 a 40 leva valor total a 300; entrega e devolve a segunda unidade. Quantidade final correta 10, mas valor final 295 e CMV residual de 5, embora toda a venda tenha sido devolvida. A média da saída histórica inclui também unidades já devolvidas.

Plano: alocar devoluções ao saldo ainda não devolvido das saídas por item, componente e local, preservando quantidade e custo consumidos por devoluções anteriores. Registrar alocação para reenvio e auditoria. Aceite: entradas entre entregas, devoluções parciais sucessivas e totais, kits e locais; no cenário acima estoque 300 e CMV zero.

### P1 — Comissão provisionada sobre venda cancelada

Venda 100, comissão por faturamento 10 provisionada em conta a pagar. Cancelamento sem entrega é aceito e cancela o lançamento de comissão, mas pagar 10 permanece aberto.

Plano: considerar vínculos de comissão no cancelamento. Ajustar/estornar provisões ainda não pagas de forma proporcional, ou bloquear o cancelamento até o tratamento. Preservar outras vendas da mesma provisão. Se houver dinheiro já pago, exigir fluxo explícito de compensação, sem estornar pagamento automaticamente.

### P1 — Comissão provisionada sobre devolução total

Venda 100, comissão provisionada 10; devolução integral reduz a base comercial a zero, mas comissão permanece em 10, marcada como paga, e o pagar segue aberto em 10. A provisão de um pagar está sendo tratada como piso de comissão já paga.

Plano: separar comissão provisionada da efetivamente liquidada e reconciliar o pagar após devolução, com ajuste parcial/integral e trilha de auditoria. Aceite: provisão individual/agrupada, pagar aberto/parcial/pago e devolução parcial/integral.

### P1 — Limite de crédito não funciona com o papel de execução do ERP

Consulta de exposição usa erp.composicao_parcela e falha com código 42501 (permission denied). Na API publicada, cliente QA302 com limite 100 e venda QA1006 de 70 receberam 403 ACCESS_DENIED. Correlação e10e8a7d-c113-4d6a-8f47-42a93c904cab. A venda foi cancelada e o cliente inativado/limite removido ao final.

Plano: usar a composição financeira autorizada e coerente com o restante do ERP, preservando escopo da empresa, em vez de abrir permissões amplas. Aceite: venda abaixo/acima do limite, recebimento/devolução liberando exposição, liberação administrativa com motivo e corrida entre confirmações. Os caminhos de excedente/liberação ficaram bloqueados por este defeito; cliente comercialmente bloqueado foi testado separadamente e foi recusado corretamente mesmo com motivo de liberação.

### P2 — Desconto geral contorna mínimo da tabela

Tabela com preço 100, mínimo 90 e máximo de desconto 10%. Preço de item 89 é recusado, mas item 100 com desconto geral 30 é confirmado por 70. A validação considera só o desconto do item. Faixa de dez unidades a 80 e bloqueio de tabela vencida passaram.

Plano: definir e aplicar o mínimo e desconto máximo sobre o valor líquido após rateio do desconto geral, excluindo frete. Aceite: item/geral/ambos, percentual/valor, faixas de quantidade e arredondamento. Caso a regra de negócio permita exceção de desconto geral, ela deve ser explícita, autorizada e auditada.

## Cenários aprovados neste lote

- Comissão por faturamento: itens 400 menos desconto 40, sem comissionar frete 10; comissão 36, devolução de uma unidade reduz para 27; estorno de recebimento não altera base de faturamento.
- Comissão por recebimento: comissão total 20, recebimento 50 libera 5, estorno reduz liberação a zero; abatimento por devolução não libera comissão como dinheiro recebido.
- Metas: inclusão/atualização sem duplicar, meta 1200, realizado 500 antes e 200 após cancelar venda 300, atingimento 16,7%.
- Frações: entrada 1,5, saída 0,25, saldo 1,25/valor 15; unidade sem conversão, fator zero e produto inativo recusados.
- Kits: autocontido/circular/aninhado recusados; meio kit de dois componentes consome e devolve uma unidade, sem criar estoque do pai.
- Reembolso de venda recebida e cancelamento: pagar 100 preservado e cancelamento direto bloqueado.
- Transportadora não habilitada, modalidade de frete inválida e parcelas divergentes recusadas.
- Limites de entrega/devolução, devolução de não entregue e item que não pertence à venda recusados sem efeitos parciais.
- Duas vendas em locais distintos com custos 20/40 devolvem ao local correto e restauram valor total 220.
- Orçamento vencido ou recusado não converte.
- Contrato de fim de mês: ciclos 31/10, 30/11, 31/12 e 31/01, vencimentos válidos, quatro rascunhos de 180 = 720, sem repetição; ciclo que ultrapassa a vigência é sinalizado e não gerado.
- Bloqueio comercial de cliente recusa venda, mesmo com motivo administrativo informado.

## Concorrência e fechamento na API publicada

Venda 1019 QA-OTTO-VEN-CONC-023, produto QA126. Depois de entregar duas de quatro unidades, execução simultânea de entrega das duas restantes e duas solicitações iguais de devolução de uma unidade: entregue 4, uma devolução 54, físico 7, reservado zero. Cancelamento concorrente com nova devolução e aplicação de crédito: cancelamento recusado, outros efeitos corretos. Duas aplicações iguais do crédito restante não duplicaram compensação. Dívida e créditos ficaram zero. Após devolução integral físico 10; saída de encerramento da entrada fictícia deixou físico/reservado/valor zero. Não houve pagamento externo.

Exportação: 18 movimentos do produto na consulta JSON e 18 linhas de dados no CSV; quantidades somam zero em ambos, igual ao saldo final. CSV da posição preserva filtro e números. Consultas de situação, movimentos, inventário, transferência, kit, conversão, vendas, orçamentos, OS, contratos, devoluções, preços, comissões e metas responderam 200 nos endpoints usados pelas telas. Orçamentos usam /api/erp/vendas com filtro de tipo_documento; a tentativa inicial em /api/erp/orcamentos retornou 404 e não foi classificada como defeito.

## Limites de cobertura

Uma venda exige o local reservado; o sistema recusa local divergente. Operação distribuída em uma única venda não é um fluxo suportado atualmente; foram testadas duas vendas em locais diferentes. Suspensão/encerramento manual de contrato não têm ação dedicada encontrada na API examinada; não declarar esses fluxos aprovados. Liberação de crédito foi corrigida e retestada, inclusive motivo administrativo. Perfis distintos e integrações fiscais externas não foram validados neste lote. As cinco falhas acima foram corrigidas e retestadas em 14/10/2026; os relatos anteriores são o registro histórico da descoberta. Ver correcoes-cinco-falhas.md, regressao-cinco-falhas-final.json e correcoes-cinco-falhas-http.json.

## Evidências

cobertura-consolidada.json; cobertura-complementar.json; precos-reteste.json; ciclos-locais-comissoes.json; cobertura-http.json. Scripts reproduzíveis: testes-cobertura-complementar.mjs e testes-ciclos-locais-comissoes.mjs. As primeiras tentativas do roteiro de preços usaram formato/identificador incorreto da tabela; o roteiro foi corrigido para tipo/item_id e record.id e somente o reteste válido foi considerado. Testes internos descartaram transações ao final, inclusive provisões de comissão. Nenhum movimento histórico foi reescrito.

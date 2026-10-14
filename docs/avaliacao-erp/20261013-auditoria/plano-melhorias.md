# Plano de melhorias — auditoria Otto

Auditoria em andamento. Em 13/10/2026, o usuário autorizou ajustes parciais antes da conclusão dos testes. Os relatos abaixo preservam os cenários que originaram as correções; o estado atualizado de cada correção consta ao final.

## Verificação prioritária pendente — Seleção de categoria fora da DRE

Na interface, criar uma categoria de despesa principal e selecionar “Não entra na DRE (empréstimo, aporte, lucros, equipamento)”. A categoria QA-OTTO Aquisição Estoque (id 129) foi criada com grupo 18/código 9 (“Impostos sobre o lucro”) e fora_dre=false. Esperado: fora_dre=true e exclusão dos subtotais da DRE. Evidência: output/audit-20261013/02-categorias.jpg e .cache/audit-20261013/category-fora-dre.json. Correlation ID: 0c3b776b-e88c-4a27-b94d-20636e684f75.

Conferência adicional: a seleção visual permaneceu no grupo 9 antes de salvar durante uma segunda tentativa automatizada. Pela API, a mesma categoria foi atualizada com dre_grupo_id="fora" e gravou fora_dre=true corretamente (versão 2). Portanto, o cálculo/contrato dessa opção funciona pela API; reproduzir manualmente ou por teclado antes de concluir que o seletor tem um defeito. A falta de resposta/falta de memória do ambiente de automação pode ter interferido no clique. Não tratar como falha confirmada do backend.

## Prioridade média — Explicar o bloqueio da desativação contábil

A conta sintética QA-OTTO Grupo Ativo (id 47) possui a conta filha ativa 48. DELETE com versão 1 foi recusado com HTTP 422/BUSINESS_RULE_VIOLATION, e o grupo permaneceu ativo na versão 1. A proteção funciona; a mensagem deve dizer que é necessário resolver as contas filhas ativas. Hoje a resposta é genérica. Correlation ID: 867def80-32d2-42e5-872a-b00f855ff1bc.

## Itens de apresentação observados

- Títulos “Novo categoria” e “Novo conta contábil”: corrigir concordância.
- Categoria principal exibe o placeholder “Subcategorias usam o grupo da categoria-pai” mesmo sem categoria superior: esclarecer a seleção do grupo.
- Configurações misturam inglês e português: padronizar a linguagem.

## Prioridade alta — Compra efetiva marcada recebida sem entrada de estoque

Criada pela interface a compra QA-OTTO-CMP-001 (id 320), fornecedor 295, produto 111 com controle de estoque ativo, 10 unidades × R$ 100, total R$ 1.000, movimento Compra. A compra ficou status recebida e atualiza_estoque=true; gerou corretamente o título a pagar 549/parcela 848 de R$ 1.000. Entretanto o item 545 permanece quantidade_recebida=0 e local_estoque_id=null; recebida_em=null. A situação do estoque e as movimentações pesquisadas por QA-OTTO retornam zero registros. A consulta completa ainda tem 40 saldos e 153 movimentos, iguais ao baseline. Esperado: entrada única de 10 unidades, custo médio R$ 100, valor de estoque R$ 1.000, recebimento e estado coerentes. Ajustar a criação de Compra efetiva para executar os efeitos de estoque de forma transacional e idempotente, ou manter pendente até o recebimento explícito. Evidências: compra 320, results.ndjson e output/audit-20261013/05-estoque-sem-compra.jpg. Correlation estoque: b149c41b-1ec5-4e7f-b06c-b2a24aba1a29; movimentos: a11bbf83-dfa5-4cd0-a047-338e02335978. Teste de aceite: comprar 10, confirmar saldo10/custo100, repetir envio sem duplicação e cancelar com reversão consistente.

## Prioridade média — Confirmações contextualizadas na interface

A ação Confirmar compra usa window.confirm("Deseja efetivar a compra…?"), um alerta nativo do navegador. Durante o teste, o usuário viu o alerta sem saber sua origem. Substituir por uma confirmação no padrão visual do ERP que mostre número do documento, fornecedor, valor e efeitos: geração de obrigação financeira e recebimento de estoque ainda pendente. A proteção de confirmação é esperada; melhorar a explicação e a identificação do registro, preservando o bloqueio de cliques duplicados.

Solicitação do usuário: padronizar as confirmações com modal/box do próprio site, eliminando alertas nativos do navegador. Abranger compras (efetivar/cancelar), vendas (confirmar/cancelar), estornos de pagamentos/recebimentos, desativação de cadastros e remoção de anexos/regras/tabelas. Usar o componente de diálogo existente, título específico, identificação do registro, consequência da ação, botões Cancelar e ação explícita, foco acessível e proteção enquanto a requisição está em andamento. Não implementar durante esta auditoria.

## Prioridade alta — Recebimento de pedido falha com erro interno

Pedido QA-OTTO-PED-002 (321) com 10 unidades de produto111 a R$100, confirmado pela interface, versão2. Na opção Registrar recebimento, local Estoque principal (10), quantidade7, Confirmar recebimento retorna mensagem de resultado incerto. Reproduzido pela API POST /api/erp/compras/321/receber com items:[{item_id:546,quantidade:7,local_estoque_id:10}], data2026-10-13 e chave única: HTTP500 ERP_OPERATION_ERROR, correlation edd211d8-6821-4015-9cbb-ccc241bf71f2. Após a primeira tentativa, item continua recebido0 e estoque vazio. Investigar logs do servidor pelo correlation ID e corrigir a causa; não classificar a falha como problema do navegador, pois o erro foi reproduzido com HTTP. Teste de aceite: receber7 (saldo7/pending3), repetir chave sem duplicação, recusar4 restantes, receber3 (saldo10), estados/datas e valores de estoque coerentes. Esta falha bloqueia o ciclo completo de estoque/CMV pelo fluxo comercial.

## Prioridade média — Baixa não sugere a conta e forma do título

Nos dois pagamentos testados (compra320 e despesa QA-OTTO Despesa80), o título tinha conta QA-OTTO Banco Cenário (21) e método Pix(21), mas o formulário Registrar pagamento abriu com Conta operacional—demonstração(13) e forma vazia. Foi necessário selecionar novamente os dados corretos; as baixas gravaram corretamente após seleção manual. Sugerir os dados da parcela/título, permitindo alteração explícita, para reduzir registros na conta errada. Teste de aceite: abrir uma baixa de parcela vinculada à conta21/Pix e confirmar os campos pré-selecionados.

## Ajustes parciais — validação e publicação

- Confirmado em teste transacional com rollback: compra direta fica confirmada, com recebimento pendente; 7+3 unidades entram no estoque a R$100; a repetição não duplica e excesso de quantidade é recusado; apenas uma conta a pagar permanece.
- Corrigida a consulta de recebimento: FOR UPDATE OF itens, sem bloquear a parte opcional do LEFT JOIN. Movimentos usam entrada/saida, aceitos pelo banco.
- O recebimento final preserva parcelas e pagamentos já gerados, evitando conflito de vínculo com a previsão.
- Entrega parcial de 1+3 unidades validada: físico6, reservado0, custo médio100, valor600 e CMV400.
- Listagens retornam conta e forma da parcela; pagar e receber sugerem os dados vinculados quando ativos, com fallback da conta padrão.
- Bloqueio de grupo contábil com filha ativa agora explica o motivo. Proteção validada sem desativar o grupo.
- Confirmações nativas e o prompt residual foram substituídos pelo modal do ERP. Modais de compra/venda e estorno identificam operação, registro e consequências; cancelar/Escape não executam a ação. Verificado na interface publicada: caixa do Otto, Cancelar sem executar, mensagem contábil específica e sugestões de conta21/Pix em pagar e receber.
- Títulos de criação usam o texto do cadastro (Nova categoria/Nova conta contábil). Placeholder do grupo DRE esclarecido.
- Typecheck ERP passou após incluir declarações existentes de src/types; lint terminou com zero erros e sete avisos preexistentes.
- Compilação Vercel iniciada para lote isolado de 17 arquivos sobre a versão ativa dpl_21D1uiGGCpBdR3oxUDaeBF2QPLS6. Deployment dpl_EhWnmrPSHVw7JnFRc4Eq25N7uDHr. Publicado e verificado em https://cognito-seven.vercel.app/.

Permanecem pendentes: seleção visual fora da DRE (ainda sem reprodução conclusiva), padronização completa de idioma, mensagens genéricas de outras regras e demais módulos da auditoria. A conclusão deste lote não significa que todo o ERP foi auditado.

Publicação concluída em 13/10/2026. O pedido fictício 321, que falhava, recebeu 7 + 3 unidades pela versão corrigida: estoque de 10 unidades, custo de R$ 100 e valor de R$ 1.000 e uma parcela a pagar de R$ 1.000. Envio repetido reutilizou o recebimento e quantidade excessiva foi recusada. Saldo do banco QA permanece em R$ 4.820. Evidência visual validada: output/audit-20261013/11-confirmacao-compra-otto.jpg. Os registros históricos de falha, como a compra QA 320 criada antes da correção, foram preservados para diagnóstico; o lote não faz uma migração geral de dados antigos.


## Novos achados — venda, recebimento e devolução (13/10/2026)

### Prioridade alta — Devolução retorna quantidade sem recuperar custo e CMV

Venda QA-OTTO-VEN-PROD-005 (935), item1127, produto111: entrega1+3 produziu físico6, reservado0, custo100, valor600 e CMV400. Devolução DEV-2026-0001 de1 unidade gerou crédito180 e físico7, porém custo85,714286 e valor600,000002. Esperado físico7, custo100 e valor700; CMV líquido300. DRE mostrou dedução180 mas manteve CMV400. Banco5533 preservado corretamente. Causa provável: retorno usa vendas_itens.custo_unitario (fallback0) em vez do custo efetivo das saídas/entregas; verificar persistência do custo nas entregas parciais e reversão proporcional do CMV. Critério: devolver1 após entrega1+3, restaurar custo100/valor700/CMV300 e repetir chave sem duplicação. Não corrigido neste lote; preservar registro para diagnóstico. Evidência venda-mercadoria-validacao.json.

### Prioridade alta — Crédito de devolução não encontra parcelas abertas

Usar crédito de DEV-2026-0001 exibe Nenhuma parcela em aberto deste cliente. Há quatro parcelas do cliente QA-OTTO com saldo total520,01 (1268=420;1269=33,33;1270 e1271=33,34). SaleReturnsPage filtra row.entidade_id, mas listagem contas-a-receber não retorna essa propriedade. Retornar identificador do cliente de forma consistente e preferir filtro no servidor; verificar paginação/tenant. Critério: mostrar parcelas do cliente294, aplicar180 à1268 (saldo240), crédito disponível0, banco inalterado; impedir cliente diferente e uso acima do saldo. Aplicação pela UI permanece bloqueada. Evidência output/audit-20261013/15-credito-sem-parcelas.jpg.

### Prioridade média — Histórico de recebimentos consulta identificação errada

Parcela1275/título736 está paga. UI informa Nenhum recebimento registrado. Consulta pagamentos?tipo=receber&conta_id=736 retorna recebimentos995(300) e996(420); mesma consulta com1275 retorna0. ReceivablesWorkspacePage.openHistory usa record.id (parcela), deveria usar conta_id. Validar também Contas a pagar e outros consumidores; não pressupor que estejam corretos. Critério: mostrar baixas, encargos e estornos do título736 e permitir estorno pelo diálogo do Otto. Estorno996 viaAPI passou: reabriu420 e banco5540→5120. Novo recebimento998 com principal420+juros10+multa5-desconto20-tarifa2 entrou413; banco5533 e principal quitado. Evidência output/audit-20261013/13-historico-vazio.jpg e venda-mercadoria-validacao.json.

### Cobertura nova e estado atual

Criação e confirmação da venda pela UI; reserva4; entregas1+3; excesso4 quando pendente3 recusado com mensagem específica; parcela única720; recebimentos300+420; estorno pelaAPI; encargos/desconto/tarifa pelaUI; devolução1 com crédito180. Todos fictícios na empresa autorizada. Banco final5533; produto físico7/valor600 incorreto; crédito180 ainda disponível; contas a receber QA abertas520,01. Custos/encargos na DRE caixa aparecem líquidos na receita da categoria: detalhamento por natureza ainda precisa revisão. Auditoria geral continua incompleta.


## Novos achados — compras e financeiro (13/10/2026, segundo lote)

Evidências completas: compras-financeiro-validacao.json. Cenários gravados somente na empresa autorizada com identificação QA-OTTO; nenhum dinheiro real ou serviço bancário externo foi acionado.

### Prioridade alta — Custo da compra ignora frete e desconto do cabeçalho

Compra328 QA-OTTO-CMP-CUSTO-006:2 unidades a100, desconto20, frete40,total220. Financeiro título557/parcela858 corretamente220. Recebimento de2 aumentou estoque de7/valor600 para9/valor800 (custo88,888889), acrescentando200, quando o custo de aquisição do cenário deveria acrescentar220 (2×110), valor820/custo91,111111 usando o baseline já afetado pela falha de devolução. Item553 guarda total200. Verificar rateio dos componentes do cabeçalho entre itens e recebimentos parciais; distinguir retenção tributária de custo. Cancelamento pelaUI funcionou: compra cancelada, parcela cancelada e estoque retornou7/valor600. Não consertado durante auditoria.

### Prioridade alta — Reenvio de renegociação falha após efetivação

Título558/parcela859100; acordo QA-OTTO-REN-007(id1) gera título559/parcelas86050 e86145:100-desconto10+encargos5=95; origem saldo0/renegociado100. Mesmo corpo e Idempotency-Key reenvia HTTP422 As origens devem ter saldo, correlation af90e871-d71f-488e-b4c5-17c932e073ae. A validação de saldo é executada antes da recuperação do acordo existente. Retornar resultado da operação existente e recusar mudança de corpo409; não criar acordo duplicado. Reversão passou: origem voltou100 e destinos cancelados. Título novo não carrega categoria/conta/centro de custo; definir propagação/classificação para evitar relatórios sem categoria e sugestões de pagamento incorretas.

### Prioridade alta — Reenvio de conciliação retorna erro interno

Importação fictíciaOFX id1/transação1 débito60 vinculada a pagamento1001. Primeira conciliação id1 HTTP201; repetir mesma chave/corpoHTTP500 ERP_OPERATION_ERROR, correlation5de3fb0a-5a85-404a-8c75-7f3e2ec7ed09, embora já conciliada e sem duplicação. Implementar retorno idempotente antes de exigir transação pendente; regras de rejeição devem ter mensagens específicas eHTTPadequado. Importação repetida passou(reused:true); saldoextrato5473=saldoERP5473,diferença0. Desfazer pelaUI e reconciliar pela sugestão exata passou. Caixa não duplicou.

### Prioridade média — Total do período inclui obrigações canceladas

Listagem contas-a-pagar comqueryQA-OTTO retorna total2555, mas componentes ativos1600vencemhoje+100avencer+540pagos=2240. Diferença315 é compra328 cancelada220 + parcelas do acordo revertido95. Ajustar ou explicitar que Total do período inclui cancelados; ideal apresentar total ativo separado para fechar com os demais cartões. Verificar filtros e demais listas.

### Resultado dos cenários executados

- Rateio60+40 no título100 aceito; soma99 recusada422 com mensagem específica.
- Pagamento999 principal100+juros10+multa5-desconto20+tarifa2=97; banco5533→5436; repetição retorna mesmo999. Histórico pagar mostra valores corretamente (falha de histórico receber não se reproduziu em pagar).
- Estorno pelaUI no modal próprio passou; pagamento original e estorno1000 preservados; saldo100reaberto e banco5533 restaurado.
- Transferência fictícia16 de50 entre QAcontas21e22 e volta17: saldo total conservado; repetição não duplica; corpo diferente commesmachave409.
- Previsão título560/parcela86260: pagamento recusado antes da efetivação; efetivar e repetir não duplica; pagamento1001 de60 concluído após efetivação.
- Extrato fictícioQA-OTTO-extrato-010.ofx importado uma vez; conciliação60 concluída, desfeita pelaUI e refeita via sugestão exata.
- Estado final: banco21=5473,banco22=0; QAAP ativo aberto1700 (compras1600+cenário007100), pagos540; crédito devolução180 continua disponível. Estoque7/valor600 preserva falha anterior e não deve ser considerado validado.

Ainda não concluídos neste escopo: devolução ao fornecedor (sem ação identificada na tela de compras), cancelamento com estoque insuficiente, cenários avançados de rateio refletidos naDRE, renegociação parcial/entreclientes/paga, conciliação parcial/aproximada e regras automáticas, previsão receber, adiantamento fornecedor e importaçãoCSV. Não afirmar cobertura total de compras/financeiro.


## Melhorias implementadas e publicadas — 13/10/2026

Deployment dpl_AxtikRBhWFpZUdvZyUeYTSEVDkKN ativo em cognito-seven.vercel.app. Lote isolado de6arquivos sobre a versão publicada anterior; sem migração de esquema.

- Histórico receber usa conta_id: mostra pagamentos e estornos existentes; validado naUI.
- Listagem receber entrega entidade_id: crédito identifica as4parcelas elegíveis e ação habilitada; validado naUI, aplicação180validada em transação comrollback.
- Recebimento de compra incorpora desconto do item/cabeçalho, frete, seguro, outras despesas e impostos adicionais proporcionalmente; retenções não incorporadas ao custo.
- Devolução recupera custo médio das saídas efetivas vinculadas ao item, com fallback por produto/venda para atendimento legado; retorno de estoque reverteCMV nos relatórios existentes.
- Renegociação recupera acordo antes de validar saldo consumido; corpo diferente409; novasparcelas preservam conta/forma e título categoria/centro comuns das origens.
- Conciliação guarda assinatura e resultado no metadata do extrato sob trava por empresa/chave; repetição devolve resultado e corpo diferente409.
- Totais de pagar/receber excluem cancelados e origens renegociadas; QAAPtotal2240confirmado naAPI deprodução.

Validação: regressao-melhorias.mjs passou com restrições do banco e rollback; custo aquisição110, entregas1+3CMV440, retorno1estoque770/CMVlíquido330, crédito180, IDscliente, reenvios e totais. ESLint0erros/3avisos preexistentes. CompilaçãoNext/Vercel e TypeScript passaram; execuções locais deTypeScript afetadas por falta de memória (não contam como aprovação). Evidências: melhorias-validacao.json, melhorias-publicacao.json, output/audit-20261013/17-historico-corrigido.jpg e18-credito-corrigido.jpg.

Limite: os movimentos históricos com custo errado não foram reescritos automaticamente. O registroQADEV-2026-0001 anterior mantém custo0 na entrada histórica; precisa de reconciliação específica se for reaproveitado como baseline. O código corrige novasoperações. Não confundir este lote concluído com auditoria geral concluída. Os módulos/cenários não testados continuam pendentes, conforme solicitado pelo usuário.


## Auditoria de estoque — 13/10/2026 (lote 011–015)

Evidências: estoque-validacao.json e output/audit-20261013/19-estoque-contagem-transferencia.jpg. Produto112 QA-OTTO-EST-011 e kit113 QA-OTTO-KIT-012 criados na empresa2 autorizada. Nenhuma correção de código neste lote.

### Prioridade alta — Devolução de kit devolve o produto pai e não os componentes

Kit113 contém2unidades do produto112. Venda943 QA-OTTO-VEN-KIT-012 de1kit a100: confirmação reservou2componentes, entrega(item1135/documento544) baixou2componentes a20, custo40. Devolução12 DEV-2026-0002 de1kit/documento545, tratamento crédito100, criou saldo de1produto pai113 com custo20/valor20; os2componentes não voltaram (principal112 permaneceu6 em vez de8 no momento do retorno). Esperado: recuperar2componentes no local original com custo total40, não inventar saldo físico do pai; CMV integralmente revertido. Causa: fluxo de devolução não expande os componentes/vínculos efetivos da entrega e calcula custo unitário de componente como custo de kit. Correlationb0925c9b-9290-4137-b704-925a98ad0356. Critério: kit com múltiplos componentes, quantidades distintas, entregas/devoluções parciais; restauração por produto/local/custo e repetição sem duplicação. Preservar composição/custo histórico mesmo se kit for alterado depois. A correção anterior de devolução simples passou; esta é falha específica do cenário avançado de kit.

### Prioridade alta — Conversão registrada não funciona em produto novo sem unidade-base

Produto112 criado pelo cadastro genérico fica unidade_medida=null; productsConfig não oferece campo de unidade-base. Conversão1 CX→UN fator12 aceita201. Movimento de1CX custo240 recusado422 Conversão para a unidade de estoque não cadastrada (correlationd0be0620-9c82-4675-81e5-31db95964ced), porque a busca compara destino com unidade_medida nula. A solicitação inicial enviou unidade_medida, que não é campo aceito pelo cadastro genérico; não foi tratada como contrato válido de gravação. Acrescentar unidade-base ao cadastro/contrato/retorno e estabelecer default explícito para produto novo; impedir conversões sem unidade de destino compatível. Critério: cadastrar UN, conversãoCX12, entrada1CXpor240=12UNacusto20; saída emCX preservando valor; fatores0/negativo e conversões ausentes recusados. Caminho de conversão positiva permanece bloqueado neste produto.

### Prioridade baixa — Mensagem de saldo reservado informa físico como disponível

Produto112 físico5/reservado2/disponível3: saída manual4 e inventário contado1 corretamente recusados422, mas texto informa Disponível físico:5. Exibir físico5,reservado2 e disponível3 para explicar bloqueio. Cancelamento da venda944 liberou reservas, sem alterar físico.

### Cenários aprovados neste lote

Entrada10×20=200; replay mesmo movimento852, conflito de conteúdo409. Saída11 recusada422, quantidade negativa e ajuste sem motivo recusados. Transferência13 de3unidades principal→apoio preservou total10/valor200; replay mesmoid; origem=destino recusada; saída8 com saldo7 recusada e sem efeito parcial. Inventário1 contou8 contra7, gerando1entradaacusto20; replay não duplica; saldo desatualizado409 e produto repetido422. Inventário pelaUI QA-OTTO-INV-013-UI revisou6→5,diferença-1, salvou e ajustou20. Contagem sem diferença inventário5 não gerou novo movimento. Seis movimentos do produto112 somam8unidades:10-3+3+1-2-1; posição final5principal/3apoio,reservado0, custo20/valor160. Kit autocontido recusado422; composição, reserva e entrega funcionaram, devolução falhou conforme acima. Reserva protege contra saídas/contagem e cancelamento libera.

Estado de teste final: produto112 principal5/valor100, apoio3/valor60; produto113 pai1/valor20 incorreto preservado como evidência; venda943 confirmada/entregue, crédito100 da devolução12 disponível; venda944 cancelada. Banco não movimentado neste lote. Auditoria de estoque ainda não cobre contagem multi-itens completa, kits aninhados extensos, concorrência entre sessões, local inativo e conversão positiva; não declarar estoque integralmente aprovado. Demais seções da auditoria continuam pendentes.


## Estoque, vendas e serviços — implementação concluída em 13/10/2026

Publicação dpl_26djPNymmpTjLSyHvWvsCRYApper. As três pendências de estoque acima foram corrigidas para novas operações: componentes/custo histórico na devolução de kits, unidade-base no cadastro e conversão, mensagem com físico/reservado/disponível. Melhorada também a consulta de venda/orçamento já gerados pela OS e a apresentação do desconto. Testes e critérios detalhados em estoque-vendas-servicos-resumo.md; regressão com rollback e prova HTTP na versão publicada passaram. Os registros históricos de teste incorretos continuam preservados; cenários não cobertos permanecem registrados no resumo.


## Continuação da auditoria — 14/10/2026

Treze cenários adicionais de estoque, vendas e serviços: nove aprovados e quatro falhas confirmadas. Prioridade alta: reenvio de atendimento parcial consome reserva novamente; cancelar venda entregue mantém baixa sem devolução; cancelar venda devolvida mantém crédito utilizável sem contrapartida. Prioridade média: local informado no atendimento é ignorado. Plano completo e evidências em ../20261014-auditoria/plano-correcoes.md e consolidado.json. Testes internos com rollback; concorrência HTTP encerrou produto QA126 em saldo/valor zero. Correções novas ainda não implementadas neste lote.


## Correções do lote de 14/10/2026

As quatro falhas da continuação foram corrigidas: reenvio de atendimento preserva reserva/quantidade/documentos, cancelamento direto bloqueia entregas e devoluções, crédito exige origem confirmada, local divergente é recusado. Quatorze cenários de regressão e validação HTTP publicada passaram; confirmação do site alinhada às regras. Consulte ../20261014-auditoria/correcoes-resumo.md e correcoes-publicacao.json.


## Cobertura complementar ampla de estoque e vendas — 14/10/2026

20 novos grupos: 15 aprovados e 5 novas falhas confirmadas (custo de retorno intercalado, comissão provisionada após cancelamento, comissão provisionada após devolução total, consulta de limite de crédito sem permissão e desconto geral contornando preço mínimo). 14 consultas e 2 exportações conferidas; três cenários de concorrência passaram no site e produto QA126 encerrou em zero. Planos de correção e critérios em ../20261014-auditoria/estoque-vendas-cobertura.md; evidências em cobertura-consolidada.json e cobertura-http.json. Novas correções ainda pendentes.


## Encerramento de cinco falhas — 14/10/2026

Concluídas e publicadas as correções de custo nas devoluções intercaladas, comissões provisionadas em cancelamento/devolução, permissão da consulta de limite de crédito e validação de desconto geral na tabela de preços. Quinze cenários aprovados, incluindo comissão agrupada e bloqueio após baixa parcial/total; reteste da API publicada de crédito e preço aprovado. Detalhes e limites em ../20261014-auditoria/correcoes-cinco-falhas.md. Versão dpl_3BY6EbtcjHYG2M86CTrAPnNgsjXR.


## Continuação financeira — 14/10/2026

10 grupos executados: 9 aprovados, 1 falha P2 confirmada. Criação manual de pagar reutiliza a conta anterior sem conflito quando a mesma chave chega com conteúdo diferente (100 versus 150). Plano: assinatura canônica e conflito 409 na função compartilhada, preservando documentos antigos e reenvios equivalentes. Detalhes, critérios e próximos testes em ../20261014-auditoria/financeiro-plano-melhorias.md; evidências em financeiro-consolidado.json. Testes com rollback e contexto ERP; nenhuma correção ou publicação neste lote.


## Financeiro — relatórios e importações, 14/10/2026

Seis novos grupos aprovados; total deste avanço financeiro: 16 grupos, 15 aprovados e uma falha P2 aberta (reenvio de criação manual com corpo diferente). Caixa/competência/banco, DRE rateada e foraDRE, renegociação avançada e repetição integral CSV/OFX conferidos com rollback. Detalhes e próximos casos: ../20261014-auditoria/financeiro-relatorios-resumo.md. Nenhuma correção ou publicação neste lote.


## Financeiro — recorrências e previsões,14/10/2026

Cinco novos grupos aprovados com rollback e processador restrito a IDs QA. Recorrência pagar de fim de mês, limite/reenvio, pausa/término, período fechado e efetivação de previsões nos dois lados. Ver ../20261014-auditoria/financeiro-recorrencias-resumo.md. Acumulado21grupos:20aprovados e1falhaP2pendente; sem publicação neste lote.


## Financeiro — cartões e conciliação automática,14/10/2026

Sete novos grupos aprovados, sem nova falha: cartões/taxas/repasses/estorno e regras de lançamento automático de extrato. Ver ../20261014-auditoria/financeiro-cartoes-resumo.md. Acumulado28grupos:27aprovados e1falhaP2aberta; testes descartados, sem publicação.


## Financeiro — casos avançados e concorrência,14/10/2026

Dez grupos adicionais aprovados, incluindo três concorrências reais naAPI publicada. VendaQA1089 cancelada após estornos, sem efeito líquido de caixa. Ver ../20261014-auditoria/financeiro-avancado-resumo.md. Acumulado38grupos:37aprovados e1falhaP2aberta. Não houve publicação neste lote.


## Financeiro — datas e edição de recorrências,14/10/2026

Cinco novos grupos aprovados com rollback; tentativaMCP inconclusiva e excluída da contagem. Ver ../20261014-auditoria/financeiro-datas-edicao-resumo.md. Acumulado43grupos:42aprovados e1falhaP2pendente. Sem publicação.


## Financeiro — isolamento e pagar simultâneo,14/10/2026

Onze grupos adicionais aprovados, sem novas falhas. Total54grupos:53aprovados e1falhaP2aberta. Roteiro restante fechado em14grupos; detalhes em ../20261014-auditoria/financeiro-seguranca-concorrencia-resumo.md. CompraQA337 cancelada após estornos, sem movimento de estoque.

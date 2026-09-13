# Etapa 4 — Financeiro operacional

Implementacao local concluida em 10/09/2026. O Supabase foi consultado somente para conferir a estrutura do schema `erp`; os testes operacionais usam dados ficticios em PostgreSQL local.

## Posicao financeira

- Contas a receber e a pagar sao apresentadas por parcela, mantendo a identificacao do titulo.
- Principal pago, credito aplicado, saldo renegociado e saldo restante sao calculados separadamente.
- Valores previstos na parcela permanecem distintos de juros, multa, desconto, taxa e dinheiro realizados nos pagamentos.
- Resumos e posicao financeira deixaram de usar apenas `valor - valor_pago`.
- Previsoes a pagar nao compoem obrigacoes efetivas e precisam ser efetivadas antes da liquidacao.

## Operacoes

- Baixas parciais e integrais consultam o saldo composto dentro da transacao e conservam a identidade da solicitacao.
- Estornos geram contramovimento integral, preservam o pagamento original e nao se repetem.
- Adiantamentos, devolucoes, aplicacoes e reversoes possuem APIs e acoes na composicao da parcela.
- Renegociacoes transferem integralmente o saldo da origem para um novo titulo, aplicando desconto e encargos pela equacao do acordo. A reversao cancela o destino sem apagar historico.
- Rateios sao substituidos atomicamente e somente aceitos quando distribuem o valor integral do titulo.
- Parcelas geradas de vendas e compras guardam o vinculo com a previsao comercial correspondente.
- Transferencias usam chave duravel e rejeitam reutilizacao com conteudo diferente.
- Conciliacao usa os vinculos proprios, permite composicao parcial e nao altera origem ou metadados do pagamento.
- Todas as operacoes novas consultam fechamentos financeiros e mantem o escopo da empresa autenticada.

## Interface

- Listagens separam principal, dinheiro, credito e saldo.
- O historico mostra principal, encargos, desconto, taxa e dinheiro movimentado.
- A composicao da parcela oferece adiantamento, aplicacao, devolucao, reversao de aplicacao, renegociacao, reversao de acordo e rateio.
- Contas a pagar identificam previsao e obrigacao efetiva, com acao explicita de efetivacao.
- Formularios financeiros preservam a mesma operacao depois de uma falha de comunicacao por meio de `ErpMutation`.

## Validacao

O teste `scripts/erp/interface-foundation-smoke.mjs` passou com 32 cenarios e sem acesso a dados reais. Os casos adicionados cobrem composicao com pagamento e credito, repeticao, devolucao, renegociacao e reversao, efetivacao de previsao, rateio integral, conciliacao e desfazimento, transferencia e estorno.

A verificacao de tipos do ERP e a analise estatica dos arquivos alterados foram executadas. Os avisos encontrados ja existiam em funcoes fora desta etapa.

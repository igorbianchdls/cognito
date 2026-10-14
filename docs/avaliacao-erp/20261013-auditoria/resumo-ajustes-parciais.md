# Ajustes parciais do Otto — concluídos em 13/10/2026

Publicados em https://cognito-seven.vercel.app/. Versão: dpl_EhWnmrPSHVw7JnFRc4Eq25N7uDHr.

## O que foi corrigido

- Confirmações do navegador substituídas por caixas do próprio Otto, incluindo compras, vendas, estornos, desativações, remoção de anexos e regras. O pedido genérico de valor também usa um formulário do site.
- Compras e vendas mostram documento, pessoa e valor; as mensagens descrevem o efeito da ação. Cancelar não executa a operação.
- Desativar um grupo contábil com filhas ativas agora explica como resolver o bloqueio.
- Pagar e receber sugerem a conta e a forma vinculadas à parcela; dados inativos têm fallback apropriado.
- Compra direta com produtos fica com recebimento pendente até registrar a entrada, com datas coerentes.
- Recebimento parcial corrigido: bloqueio da consulta e tipos de movimento compatíveis com o banco. O recebimento final preserva as parcelas já geradas.
- Saída parcial de venda usa o tipo de movimento válido.
- Títulos de criação e orientação do grupo DRE foram esclarecidos.

## Validação

| Conferência | Resultado |
| --- | --- |
| Compilação na Vercel e verificação TypeScript do ERP | Passaram |
| Lint dos arquivos alterados | Zero erros; sete avisos preexistentes |
| Teste transacional com rollback: compra de 10 unidades, recebimento de 7 + 3, repetição e limite | Passou; uma conta a pagar |
| Entrega parcial de 1 + 3 no teste com rollback | Saldo de 6 unidades, reservado zero, valor de R$ 600 e CMV de R$ 400 |
| Pedido QA-OTTO-PED-002 no site corrigido | Recebidas 10 unidades a R$ 100; estoque de R$ 1.000; uma parcela de R$ 1.000 |
| Conta e Pix sugeridos em pagar e receber pela interface | Conta QA 21 e método 21 (Pix) |
| Modal de confirmação, cancelamento e mensagem contábil no site | Passaram |
| Saldo bancário QA na publicação | R$ 4.820: 5.000 − 400 + 300 − 80 |

Os testes transacionais foram desfeitos ao final. O recebimento do pedido fictício 321 foi gravado como prova na empresa autorizada, com identificação QA-OTTO. Os registros de falha anteriores foram preservados; nenhuma migração geral de estados antigos foi aplicada.

Este lote está concluído. A auditoria geral do ERP permanece em andamento, incluindo os casos ainda pendentes no plano de melhorias.

Evidência visual: [modal de compra](C:/Users/Administrador/Documents/creatto/cognito/cognito/output/audit-20261013/11-confirmacao-compra-otto.jpg).

# Correções de estoque, vendas e serviços — 14/10/2026

## Resultado

As quatro falhas reproduzidas foram corrigidas. Versão final: dpl_6RNS7nFq4yUjjpwuGDBsb6efdK6E. A publicação intermediária dpl_b8FKn31LaTKM57LkYdeH4szAuryc validou as regras; a versão final acrescenta apenas o texto correto da confirmação de cancelamento.

- Reenvio de atendimento consulta assinatura e resultado salvos no evento antes de alterar reserva, itens ou documentos; corpo diferente com mesma chave retorna conflito. O resultado é recuperado mesmo depois do atendimento concluído. Entrega antiga sem assinatura é recusada para conferência, evitando repetir seus efeitos.
- Cancelamento direto bloqueado quando existe saída de mercadoria registrada. A mensagem orienta devolução e tratamento financeiro, em vez de repor automaticamente mercadoria que pode estar com o cliente.
- Venda com devolução também não pode ser cancelada diretamente, preservando a contrapartida de crédito/reembolso. O crédito pode ser aplicado às parcelas da própria venda. Créditos históricos ligados a venda cancelada ou não confirmada são recusados.
- Local informado diferente do reservado é recusado; a entrega valida se o local reservado permanece ativo e habilitado para venda. Não existe remanejamento automático de reserva neste ajuste.
- Atendimento com item repetido é recusado. Confirmação de cancelamento explica as restrições e a liberação de reservas ainda não entregues.

## Testes

14 cenários de regressão passaram com restrições do banco e rollback: inventário multi-itens e atomicidade; custo médio em transferências; local divergente; abatimento com desconto e frete; reembolso de venda paga; estorno antes do cancelamento; bloqueio de venda entregue; edição de OS e vínculos comerciais; revisão de contrato; reenvio parcial e após conclusão; crédito compensado na origem; abatimento de serviço; item repetido/local inativo; bloqueio de crédito histórico inválido.

A compilação Next/TypeScript das regras passou; ESLint sem erros (dois avisos preexistentes nas regras e um na interface). O ajuste final da interface recebeu nova compilação.

Na API publicada, somente registros QA-OTTO foram usados: venda 994 QA-OTTO-VEN-FIX-021, produto 126, item 1193, devolução 43 DEV-2026-0004, parcela 1318. Duas solicitações simultâneas de entrega de 1 retornaram o mesmo documento 601: físico 9, reservado 3, atendido 1. Conteúdo diferente com mesma chave retornou 409. Atendimento posterior de 3 gerou documento 602; reenvios dos dois pedidos depois da conclusão mantiveram total entregue 4. Local 11 diferente da reserva 10 foi recusado sem efeito.

Cancelamento da venda entregue retornou SALE_HAS_DELIVERIES. Devolução total retornou 4 unidades ao estoque (documento 603) e gerou crédito 400; cancelamento retornou SALE_HAS_RETURNS, preservando dívida 400. Aplicação do crédito à própria parcela encerrou dívida 0/crédito 0, sem caixa. Saída de encerramento da entrada fictícia deixou físico/reservado/valor do produto QA em zero.

Na tela, a tentativa de cancelar a venda QA preservou Confirmada e exibiu a mensagem específica de devolução registrada. A confirmação é um diálogo do próprio site.

## Arquivos e limites

Regras alteradas em erpProfessionalRepository.ts, erpRepository.ts e erpReturnsRepository.ts; texto da confirmação em SalesWorkspacePage.tsx. Outros arquivos locais não foram incluídos no deploy. Sem alteração de esquema ou reescrita de histórico.

Evidências: correcoes-regressao.json, correcoes-validacoes-adicionais.json, correcoes-http-publicado.json e correcoes-publicacao.json. Os cenários que não foram executados na auditoria geral continuam pendentes. A alteração de local por remanejamento de reserva exige fluxo específico; por enquanto, o sistema exige o local reservado.

Publicação final confirmada no domínio: dpl_6RNS7nFq4yUjjpwuGDBsb6efdK6E. Compilação final TypeScript aprovada em 29,8 s. Mensagem e confirmação conferidas pela interface; venda permaneceu Confirmada. Evidência visual: output/audit-20261014/cancelamento-protegido.png.

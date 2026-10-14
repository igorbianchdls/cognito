# Correções de estoque, vendas e comissões — 14/10/2026

Escopo: cinco falhas reproduzidas na auditoria. Registros fictícios usam QA-OTTO na empresa autorizada. Testes internos executam os serviços com o papel e as permissões do ERP e descartam as transações ao final.

## Alterações

- Devoluções calculam quantidade e custo ainda não devolvidos, descontando os retornos anteriores antes de ratear o saldo. Isso preserva o custo de entregas intercaladas com novas entradas.
- Cancelamentos e devoluções reduzem provisões de comissão ainda abertas, preservando outras vendas da mesma provisão. O valor original é mantido com ajustes auditados separados. Provisões liquidadas, parcialmente liquidadas, conciliadas ou renegociadas bloqueiam a alteração com mensagem específica; não há estorno automático de dinheiro.
- O banco confere a correspondência entre provisão ajustada, título e parcelas no fechamento da transação. A proteção anterior de contas de comissão e reembolso permanece para alterações incompatíveis.
- O limite de crédito utiliza a composição financeira autorizada já usada pelo ERP, sem ampliar permissões no banco.
- O desconto geral é rateado entre itens antes de validar preço mínimo e desconto máximo da tabela; frete não aumenta a margem de desconto.

## Validação

Concluída: 15 cenários aprovados em regressao-cinco-falhas-final.json. Inclui custo após devoluções e novas entregas; comissões por faturamento/recebimento; cancelamento/devolução com provisão; provisão agrupada de 30 reduzida a 20, 10 e cancelada; baixa parcial de 5 e total de 20 bloqueando cancelamento/devolução sem efeitos parciais; limite/exceção de crédito; tabela de preços; metas; frações; kits; reembolso e limites de itens. O último cenário foi retestado após corrigir a expectativa do roteiro de "confirmado" para o status real "confirmada".

Compilação de produção e verificação TypeScript aprovadas. ESLint sem erros nos arquivos alterados; aviso preexistente de importação não utilizada em erpRepository.ts.

Publicada dpl_3BY6EbtcjHYG2M86CTrAPnNgsjXR em https://cognito-seven.vercel.app. Manifesto isolado conferido contra os arquivos finais. A API publicada confirmou: limite 100 aceita venda 70, recusa outra de 40 com CREDIT_LIMIT_EXCEEDED (409), permite liberação com motivo; tabela 100/mínimo 90 recusa desconto geral 30 (422), aceita desconto 10 + frete 5 com total 95. Evidência: correcoes-cinco-falhas-http.json.

Encerramento: vendas QA 1068,1069,1070 canceladas; cliente QA327 inativado sem limite; tabela QA9 inativada. Testes internos descartados ao final. Nenhuma baixa externa ou emissão fiscal.

## Migrações

20261014120000_erp_ajustes_comissoes.sql e 20261014123000_erp_protecao_ajuste_comissoes.sql. Ambas ensaiadas em transação com rollback e depois aplicadas com conferência dos dados originais. Nenhum lançamento histórico foi reescrito.

## Limitações

Perfis distintos e integrações fiscais externas não fazem parte deste lote. Comissão efetivamente paga exige tratamento financeiro explícito antes de cancelar ou devolver a venda.

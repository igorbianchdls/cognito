export function financialCompositionSql(financialSide: 'receber' | 'pagar', installmentAlias = 'parcelas') {
  const installmentColumn = `conta_${financialSide}_parcela_id`
  return `CROSS JOIN LATERAL (
    SELECT somas.valor, somas.dinheiro, somas.credito, somas.transferido,
      somas.valor - somas.dinheiro - somas.credito - somas.transferido AS saldo
    FROM (
      SELECT ${installmentAlias}.valor,
        COALESCE((SELECT sum(valor) FROM erp.pagamentos pagamento
          WHERE pagamento.empresa_id=${installmentAlias}.empresa_id AND pagamento.${installmentColumn}=${installmentAlias}.id
            AND pagamento.estorno_de_pagamento_id IS NULL AND pagamento.estornado_em IS NULL AND pagamento.excluido_em IS NULL),0) AS dinheiro,
        COALESCE((SELECT sum(CASE WHEN aplicacao.reversao_de_id IS NULL THEN aplicacao.valor ELSE -aplicacao.valor END)
          FROM erp.adiantamentos_aplicacoes aplicacao WHERE aplicacao.empresa_id=${installmentAlias}.empresa_id
            AND aplicacao.${installmentColumn}=${installmentAlias}.id),0) AS credito,
        COALESCE((SELECT sum(link.valor) FROM erp.renegociacoes_parcelas link
          JOIN erp.renegociacoes acordo ON acordo.empresa_id=link.empresa_id AND acordo.id=link.renegociacao_id
          WHERE link.empresa_id=${installmentAlias}.empresa_id AND link.${installmentColumn}=${installmentAlias}.id
            AND link.papel='origem' AND acordo.status='efetivada'),0) AS transferido
      OFFSET 0
    ) somas
  ) composicao`
}


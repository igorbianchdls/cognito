import { runQuery } from '@/lib/postgres'
import type { ParsedContabilidadeRequest } from '../query/parseContabilidadeRequest'

type DreTabelaInput = {
  parsed: ParsedContabilidadeRequest
}

export async function maybeHandleContabilidadeDreTabelaView({
  parsed,
}: DreTabelaInput): Promise<Response | null> {
  const { view } = parsed
  if (view !== 'dre-tabela') return null

  const sql = `
    SELECT
      secao,
      codigo_conta,
      conta_contabil,
      valor
    FROM (
      -- RECEITAS (código 4) | origem: contas_receber | usa créditos
      SELECT
        1 AS ordem,
        'Receitas (Contas a Receber)' AS secao,
        pc.codigo AS codigo_conta,
        pc.nome   AS conta_contabil,
        COALESCE(SUM(lc.total_creditos), 0) AS valor
      FROM contabilidade.plano_contas pc
      LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl
        ON lcl.conta_id = pc.id
      LEFT JOIN contabilidade.lancamentos_contabeis lc
        ON lc.id = lcl.lancamento_id
       AND lc.origem_tabela = 'financeiro.contas_receber'
      WHERE pc.codigo LIKE '4%'
      GROUP BY pc.codigo, pc.nome

      UNION ALL

      -- CUSTOS (código 5) | origem: contas_pagar | usa débitos
      SELECT
        2 AS ordem,
        'Custos (Contas a Pagar)' AS secao,
        pc.codigo AS codigo_conta,
        pc.nome   AS conta_contabil,
        COALESCE(SUM(lc.total_debitos), 0) AS valor
      FROM contabilidade.plano_contas pc
      LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl
        ON lcl.conta_id = pc.id
      LEFT JOIN contabilidade.lancamentos_contabeis lc
        ON lc.id = lcl.lancamento_id
       AND lc.origem_tabela = 'financeiro.contas_pagar'
      WHERE pc.codigo LIKE '5%'
      GROUP BY pc.codigo, pc.nome

      UNION ALL

      -- DESPESAS (código 6) | origem: contas_pagar | usa débitos
      SELECT
        3 AS ordem,
        'Despesas (Contas a Pagar)' AS secao,
        pc.codigo AS codigo_conta,
        pc.nome   AS conta_contabil,
        COALESCE(SUM(lc.total_debitos), 0) AS valor
      FROM contabilidade.plano_contas pc
      LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl
        ON lcl.conta_id = pc.id
      LEFT JOIN contabilidade.lancamentos_contabeis lc
        ON lc.id = lcl.lancamento_id
       AND lc.origem_tabela = 'financeiro.contas_pagar'
      WHERE pc.codigo LIKE '6%'
      GROUP BY pc.codigo, pc.nome
    ) t
    ORDER BY
      ordem,
      codigo_conta`

  const rows = await runQuery<{ secao: string; codigo_conta: string; conta_contabil: string; valor: number }>(sql, [])
  return Response.json({ success: true, view, rows, sql }, { headers: { 'Cache-Control': 'no-store' } })
}

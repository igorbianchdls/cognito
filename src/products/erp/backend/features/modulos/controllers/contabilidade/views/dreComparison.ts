import { runQuery } from '@/lib/postgres'
import type { ParsedContabilidadeRequest } from '../query/parseContabilidadeRequest'

type Input = { parsed: ParsedContabilidadeRequest }

export async function maybeHandleContabilidadeDreComparisonView({ parsed }: Input): Promise<Response | null> {
  const { view } = parsed
  if (view !== 'dre-comparison') return null

  const sql = `
    SELECT
      pc.codigo AS codigo_conta,
      pc.nome   AS conta_contabil,

      -- Dezembro 2025
      SUM(
        CASE
          WHEN pc.codigo LIKE '4%' AND date_trunc('month', lc.data_lancamento) = DATE '2025-12-01' THEN lcl.credito
          WHEN pc.codigo LIKE '5%' AND date_trunc('month', lc.data_lancamento) = DATE '2025-12-01' THEN lcl.debito
          WHEN pc.codigo LIKE '6%' AND date_trunc('month', lc.data_lancamento) = DATE '2025-12-01' THEN lcl.debito
          ELSE 0
        END
      ) AS realizado_dez_2025,

      -- Novembro 2025
      SUM(
        CASE
          WHEN pc.codigo LIKE '4%' AND date_trunc('month', lc.data_lancamento) = DATE '2025-11-01' THEN lcl.credito
          WHEN pc.codigo LIKE '5%' AND date_trunc('month', lc.data_lancamento) = DATE '2025-11-01' THEN lcl.debito
          WHEN pc.codigo LIKE '6%' AND date_trunc('month', lc.data_lancamento) = DATE '2025-11-01' THEN lcl.debito
          ELSE 0
        END
      ) AS realizado_nov_2025,

      -- Dezembro 2024
      SUM(
        CASE
          WHEN pc.codigo LIKE '4%' AND date_trunc('month', lc.data_lancamento) = DATE '2024-12-01' THEN lcl.credito
          WHEN pc.codigo LIKE '5%' AND date_trunc('month', lc.data_lancamento) = DATE '2024-12-01' THEN lcl.debito
          WHEN pc.codigo LIKE '6%' AND date_trunc('month', lc.data_lancamento) = DATE '2024-12-01' THEN lcl.debito
          ELSE 0
        END
      ) AS realizado_dez_2024

    FROM contabilidade.plano_contas pc
    LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl
      ON lcl.conta_id = pc.id
    LEFT JOIN contabilidade.lancamentos_contabeis lc
      ON lc.id = lcl.lancamento_id
    WHERE pc.codigo LIKE '4%'
       OR pc.codigo LIKE '5%'
       OR pc.codigo LIKE '6%'
    GROUP BY pc.codigo, pc.nome
    ORDER BY pc.codigo`

  const rows = await runQuery<{
    codigo_conta: string
    conta_contabil: string
    realizado_dez_2025: number | null
    realizado_nov_2025: number | null
    realizado_dez_2024: number | null
  }>(sql, [])
  return Response.json({ success: true, view, rows, sql }, { headers: { 'Cache-Control': 'no-store' } })
}

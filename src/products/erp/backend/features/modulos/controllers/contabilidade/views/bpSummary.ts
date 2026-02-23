import { runQuery } from '@/lib/postgres'
import type { ParsedContabilidadeRequest } from '../query/parseContabilidadeRequest'

type Input = { parsed: ParsedContabilidadeRequest }

export async function maybeHandleContabilidadeBpSummaryView({ parsed }: Input): Promise<Response | null> {
  const { view } = parsed
  if (view !== 'bp-summary') return null

  const sql = `
    SELECT
      pc.codigo AS codigo_conta,
      pc.nome   AS conta_contabil,

      -- Saldo acumulado até 31/12/2025
      COALESCE(SUM(
        CASE
          WHEN lc.data_lancamento <= DATE '2025-12-31' THEN
            CASE
              WHEN pc.codigo LIKE '1%' THEN (COALESCE(lcl.debito,0) - COALESCE(lcl.credito,0))
              WHEN pc.codigo LIKE '2%' THEN (COALESCE(lcl.credito,0) - COALESCE(lcl.debito,0))
              WHEN pc.codigo LIKE '3%' THEN (COALESCE(lcl.credito,0) - COALESCE(lcl.debito,0))
              ELSE 0
            END
          ELSE 0
        END
      ), 0) AS realizado_dez_2025,

      -- Saldo acumulado até 30/11/2025
      COALESCE(SUM(
        CASE
          WHEN lc.data_lancamento <= DATE '2025-11-30' THEN
            CASE
              WHEN pc.codigo LIKE '1%' THEN (COALESCE(lcl.debito,0) - COALESCE(lcl.credito,0))
              WHEN pc.codigo LIKE '2%' THEN (COALESCE(lcl.credito,0) - COALESCE(lcl.debito,0))
              WHEN pc.codigo LIKE '3%' THEN (COALESCE(lcl.credito,0) - COALESCE(lcl.debito,0))
              ELSE 0
            END
          ELSE 0
        END
      ), 0) AS realizado_nov_2025,

      -- Saldo acumulado até 31/10/2025
      COALESCE(SUM(
        CASE
          WHEN lc.data_lancamento <= DATE '2025-10-31' THEN
            CASE
              WHEN pc.codigo LIKE '1%' THEN (COALESCE(lcl.debito,0) - COALESCE(lcl.credito,0))
              WHEN pc.codigo LIKE '2%' THEN (COALESCE(lcl.credito,0) - COALESCE(lcl.debito,0))
              WHEN pc.codigo LIKE '3%' THEN (COALESCE(lcl.credito,0) - COALESCE(lcl.debito,0))
              ELSE 0
            END
          ELSE 0
        END
      ), 0) AS realizado_out_2025,

      -- Saldo acumulado até 30/09/2025
      COALESCE(SUM(
        CASE
          WHEN lc.data_lancamento <= DATE '2025-09-30' THEN
            CASE
              WHEN pc.codigo LIKE '1%' THEN (COALESCE(lcl.debito,0) - COALESCE(lcl.credito,0))
              WHEN pc.codigo LIKE '2%' THEN (COALESCE(lcl.credito,0) - COALESCE(lcl.debito,0))
              WHEN pc.codigo LIKE '3%' THEN (COALESCE(lcl.credito,0) - COALESCE(lcl.debito,0))
              ELSE 0
            END
          ELSE 0
        END
      ), 0) AS realizado_set_2025

    FROM contabilidade.plano_contas pc
    LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl
      ON lcl.conta_id = pc.id
    LEFT JOIN contabilidade.lancamentos_contabeis lc
      ON lc.id = lcl.lancamento_id
    WHERE pc.codigo LIKE '1%'
       OR pc.codigo LIKE '2%'
       OR pc.codigo LIKE '3%'
    GROUP BY pc.codigo, pc.nome
    ORDER BY pc.codigo`

  const rows = await runQuery<{
    codigo_conta: string
    conta_contabil: string
    realizado_dez_2025: number | null
    realizado_nov_2025: number | null
    realizado_out_2025: number | null
    realizado_set_2025: number | null
  }>(sql, [])
  return Response.json({ success: true, view, rows, sql }, { headers: { 'Cache-Control': 'no-store' } })
}

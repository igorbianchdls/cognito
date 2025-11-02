import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function GET() {
  try {
    const sql = `
      WITH last_headers AS (
        SELECT id
        FROM contabilidade.lancamentos_contabeis
        ORDER BY id DESC
        LIMIT 10
      )
      SELECT
        lc.id AS lancamento_id,
        lc.data_lancamento,
        lc.historico,
        lc.origem_tabela,
        lc.origem_id,
        lc.fornecedor_id,
        lc.cliente_id,
        lc.conta_financeira_id,
        lc.total_debitos,
        lc.total_creditos,
        lcl.id AS linha_id,
        lcl.conta_id,
        lcl.debito,
        lcl.credito,
        lcl.historico AS historico_linha,
        lcl.criado_em
      FROM last_headers lh
      JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lh.id
      LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
      ORDER BY lc.id DESC, lcl.id ASC`
    const rows = await runQuery<Record<string, unknown>>(sql)
    return Response.json({ success: true, rows })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}

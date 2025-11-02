import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function GET() {
  try {
    const sql = `
      SELECT 
        lcl.id AS linha_id,
        lcl.lancamento_id,
        pc.id AS conta_id,
        pc.codigo AS conta_codigo,
        pc.nome AS conta_nome,
        lcl.debito,
        lcl.credito,
        CASE WHEN COALESCE(lcl.debito,0) > 0 THEN 'D' ELSE 'C' END AS tipo,
        COALESCE(NULLIF(lcl.debito,0), lcl.credito) AS valor,
        lcl.historico,
        lcl.criado_em
      FROM contabilidade.lancamentos_contabeis_linhas lcl
      LEFT JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
      ORDER BY lcl.id DESC
      LIMIT 10`
    const rows = await runQuery<Record<string, unknown>>(sql)
    return Response.json({ success: true, rows })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}


import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function GET() {
  try {
    const sql = `
      SELECT id, tenant_id, data_lancamento, historico, lancamento_financeiro_id, total_debitos, total_creditos, criado_em
        FROM contabilidade.lancamentos_contabeis
       ORDER BY criado_em DESC
       LIMIT 50`
    const rows = await runQuery<Record<string, unknown>>(sql)
    return Response.json({ success: true, rows })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}


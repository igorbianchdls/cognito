import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function GET() {
  try {
    const rows = await runQuery<Record<string, unknown>>(`
      SELECT id AS lancamento_id, data_lancamento, historico, total_debitos, total_creditos, criado_em
      FROM contabilidade.lancamentos_contabeis
      ORDER BY id DESC
      LIMIT 10`)
    return Response.json({ success: true, rows })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}


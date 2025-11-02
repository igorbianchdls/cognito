import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function GET() {
  try {
    const sql = `
      SELECT id, tenant_id, despesa_id, entidade_id, categoria_id, descricao, tipo, status, valor, data_lancamento, data_vencimento, criado_em
      FROM financeiro.lancamentos_financeiros
      ORDER BY criado_em DESC
      LIMIT 10
    `
    const rows = await runQuery<Record<string, unknown>>(sql)
    return Response.json({ success: true, rows })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}

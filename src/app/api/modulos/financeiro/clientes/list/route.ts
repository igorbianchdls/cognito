import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    let rows = await runQuery<{ id: number; nome: string }>(
      `SELECT id, nome_fantasia AS nome
         FROM entidades.clientes
        ORDER BY nome_fantasia ASC`
    )
    if (!rows?.length) {
      // Fallback: clientes presentes nos lançamentos
      rows = await runQuery<{ id: number; nome: string }>(
        `SELECT DISTINCT lf.cliente_id AS id,
                COALESCE(c.nome_fantasia, 'Cliente #' || lf.cliente_id::text) AS nome
           FROM financeiro.lancamentos_financeiros lf
           LEFT JOIN entidades.clientes c ON c.id = lf.cliente_id
          WHERE lf.cliente_id IS NOT NULL
          ORDER BY 2 ASC`
      )
    }
    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/clientes/list error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

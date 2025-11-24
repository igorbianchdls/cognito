import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const rows = await runQuery<{ id: number; nome: string }>(
      `SELECT id, COALESCE(nome_fantasia, razao_social, nome) AS nome
         FROM entidades.clientes
        ORDER BY 2 ASC`
    )
    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/clientes/list error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

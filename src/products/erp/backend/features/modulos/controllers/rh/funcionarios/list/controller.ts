import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const sql = `
      SELECT
        funcionarioid,
        nomecompleto
      FROM recursoshumanos.funcionarios
      WHERE status = 'ativo'
      ORDER BY nomecompleto ASC
    `

    const rows = await runQuery<{ funcionarioid: number; nomecompleto: string }>(sql, [])

    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📄 API /api/modulos/rh/funcionarios/list error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

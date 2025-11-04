import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const sql = `
      SELECT
        id,
        razao_social,
        nome_fantasia
      FROM empresa.empresas
      WHERE ativo = true
      ORDER BY razao_social ASC
    `

    const rows = await runQuery<{ id: number; razao_social: string; nome_fantasia: string | null }>(sql, [])

    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📄 API /api/empresa/empresas/list error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

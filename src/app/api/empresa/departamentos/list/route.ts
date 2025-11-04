import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get('empresa_id')

    const conditions: string[] = ['ativo = true']
    const params: unknown[] = []

    if (empresaId) {
      conditions.push('empresa_id = $1')
      params.push(Number(empresaId))
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const sql = `
      SELECT
        id,
        codigo,
        nome
      FROM empresa.departamentos
      ${whereClause}
      ORDER BY nome ASC
    `

    const rows = await runQuery<{ id: number; codigo: string | null; nome: string }>(sql, params)

    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📄 API /api/empresa/departamentos/list error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

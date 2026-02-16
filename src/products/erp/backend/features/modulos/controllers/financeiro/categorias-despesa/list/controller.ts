import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const sql = `
      SELECT id, nome
        FROM financeiro.categorias_despesa
       ORDER BY nome ASC
    `
    const rows = await runQuery<{ id: number; nome: string }>(sql)
    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/categorias-despesa/list error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}


import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    let rows = await runQuery<{ id: number; nome: string }>(
      `SELECT id, nome_fantasia AS nome
         FROM entidades.fornecedores
        ORDER BY nome_fantasia ASC`
    )
    if (!rows?.length) {
      // Fallback: fornecedores presentes nos lançamentos (evita dropdown vazio em bases parciais)
      rows = await runQuery<{ id: number; nome: string }>(
        `SELECT DISTINCT lf.fornecedor_id AS id,
                COALESCE(f.nome_fantasia, 'Fornecedor #' || lf.fornecedor_id::text) AS nome
           FROM financeiro.lancamentos_financeiros lf
           LEFT JOIN entidades.fornecedores f ON f.id = lf.fornecedor_id
          WHERE lf.fornecedor_id IS NOT NULL
          ORDER BY 2 ASC`
      )
    }
    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/fornecedores/list error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

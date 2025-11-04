import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const produtoIdParam = searchParams.get('produto_id')
    const hasFilter = !!produtoIdParam

    const baseSql = `
      FROM produtos.produto_variacoes v
      JOIN produtos.produto p ON p.id = v.produto_pai_id
      WHERE v.ativo = true
      ${hasFilter ? 'AND v.produto_pai_id = $1' : ''}
    `

    const rows = await runQuery<{ id: number; sku: string; produto_nome: string }>(
      `SELECT v.id, v.sku, p.nome AS produto_nome ${baseSql} ORDER BY p.nome ASC, v.sku ASC`,
      hasFilter ? [Number(produtoIdParam)] : []
    )
    return Response.json({ success: true, rows }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📦 API /api/produtos/variacoes/list error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}


import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const status = searchParams.get('status') || undefined
    const fornecedorIdParam = searchParams.get('fornecedor_id') || undefined
    const fornecedorId = fornecedorIdParam ? Number(fornecedorIdParam) : undefined

    // WHERE for compras (c)
    const cWhereParts: string[] = []
    const cParams: unknown[] = []
    let ci = 1
    if (de) { cWhereParts.push(`c.data_emissao >= $${ci++}`); cParams.push(de) }
    if (ate) { cWhereParts.push(`c.data_emissao <= $${ci++}`); cParams.push(ate) }
    if (status) { cWhereParts.push(`LOWER(c.status) = LOWER($${ci++})`); cParams.push(status) }
    if (typeof fornecedorId === 'number' && !Number.isNaN(fornecedorId)) { cWhereParts.push(`c.fornecedor_id = $${ci++}`); cParams.push(fornecedorId) }
    const cWhere = cWhereParts.length ? `WHERE ${cWhereParts.join(' AND ')}` : ''

    // WHERE for recebimentos (r)
    const rWhereParts: string[] = []
    const rParams: unknown[] = []
    let ri = 1
    if (de) { rWhereParts.push(`r.data_recebimento >= $${ri++}`); rParams.push(de) }
    if (ate) { rWhereParts.push(`r.data_recebimento <= $${ri++}`); rParams.push(ate) }
    if (status) { rWhereParts.push(`LOWER(r.status) = LOWER($${ri++})`); rParams.push(status) }
    const joinR = (typeof fornecedorId === 'number' && !Number.isNaN(fornecedorId)) ? ' JOIN compras.compras c ON c.id = r.compra_id' : ''
    if (joinR) { rWhereParts.push(`c.fornecedor_id = $${ri++}`); rParams.push(fornecedorId as number) }
    const rWhere = rWhereParts.length ? `WHERE ${rWhereParts.join(' AND ')}` : ''

    // Queries
    const gastoRows = await runQuery<{ gasto: string | number }>(
      `SELECT COALESCE(SUM(c.valor_total), 0) AS gasto FROM compras.compras c ${cWhere}`,
      cParams
    )
    const fornecedoresRows = await runQuery<{ fornecedores: number }>(
      `SELECT COUNT(DISTINCT c.fornecedor_id)::int AS fornecedores FROM compras.compras c ${cWhere}`,
      cParams
    )
    const pedidosRows = await runQuery<{ pedidos: number }>(
      `SELECT COUNT(DISTINCT c.id)::int AS pedidos FROM compras.compras c ${cWhere}`,
      cParams
    )
    const transacoesRows = await runQuery<{ transacoes: number }>(
      `SELECT COUNT(DISTINCT r.id)::int AS transacoes FROM compras.recebimentos r${joinR} ${rWhere}`,
      rParams
    )

    const gasto = Number(gastoRows[0]?.gasto ?? 0) || 0
    const fornecedores = Number(fornecedoresRows[0]?.fornecedores ?? 0) || 0
    const pedidos = Number(pedidosRows[0]?.pedidos ?? 0) || 0
    const transacoes = Number(transacoesRows[0]?.transacoes ?? 0) || 0

    return Response.json(
      {
        success: true,
        kpis: { gasto, fornecedores, transacoes, pedidos },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('📦 API /api/modulos/compras/dashboard error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/modulos/financeiro/contas-a-pagar/{id}/linhas
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    // Path: /api/modulos/financeiro/contas-a-pagar/{id}/linhas -> id is the penultimate segment
    const idStr = parts[parts.length - 2] || ''
    const contaPagarId = Number(idStr)
    if (!Number.isFinite(contaPagarId) || contaPagarId <= 0) {
      return Response.json({ success: false, message: 'conta_pagar_id inválido' }, { status: 400 })
    }

    const sql = `
      SELECT
        l.id                                AS conta_pagar_linha_id,
        l.conta_pagar_id,

        l.tipo_linha,
        l.descricao                         AS descricao,

        l.quantidade,
        l.valor_unitario,
        l.valor_bruto,
        l.desconto                          AS valor_desconto,
        l.impostos                          AS valor_impostos,
        l.valor_liquido,

        cat_l.nome                          AS categoria_despesa,

        dep_l.nome                          AS departamento,
        cc_l.nome                           AS centro_custo,
        un_l.nome                           AS unidade_negocio
      FROM financeiro.contas_pagar_linhas l

      LEFT JOIN financeiro.categorias_despesa cat_l
             ON cat_l.id = l.categoria_despesa_id

      LEFT JOIN empresa.departamentos dep_l
             ON dep_l.id = l.departamento_id

      LEFT JOIN empresa.centros_custo cc_l
             ON cc_l.id = l.centro_custo_id

      LEFT JOIN empresa.unidades_negocio un_l
             ON un_l.id = l.unidade_negocio_id

      WHERE l.conta_pagar_id = $1

      ORDER BY l.id ASC
    `.replace(/\n\s+/g, ' ').trim()

    type Row = {
      conta_pagar_linha_id: number
      conta_pagar_id: number
      tipo_linha: string | null
      descricao: string | null
      quantidade: number | string | null
      valor_unitario: number | string | null
      valor_bruto: number | string | null
      valor_desconto: number | string | null
      valor_impostos: number | string | null
      valor_liquido: number | string | null
      categoria_despesa: string | null
      departamento: string | null
      centro_custo: string | null
      unidade_negocio: string | null
    }

    const rows = await runQuery<Row>(sql, [contaPagarId])
    return Response.json({ success: true, rows, count: rows.length })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg, rows: [], count: 0 }, { status: 500 })
  }
}

import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    // Path: /api/modulos/financeiro/lancamentos/{id}/itens -> id é o penúltimo segmento
    const idStr = parts[parts.length - 2] || ''
    const lancamentoId = Number(idStr)
    if (!Number.isFinite(lancamentoId) || lancamentoId <= 0) {
      return Response.json({ success: false, message: 'lancamento_id inválido' }, { status: 400 })
    }

    const sql = `
      SELECT
        id,
        lancamento_id,
        numero_item,
        descricao,
        quantidade,
        unidade,
        valor_unitario,
        desconto,
        acrescimo,
        valor_total,
        categoria_id,
        centro_custo_id,
        natureza_financeira_id,
        observacao,
        criado_em
      FROM financeiro.lancamentos_financeiros_itens
      WHERE lancamento_id = $1
      ORDER BY COALESCE(numero_item, 0) ASC, id ASC
    `.replace(/\n\s+/g, ' ').trim()

    type Row = {
      id: number
      lancamento_id: number
      numero_item: number | null
      descricao: string
      quantidade: string | number
      unidade: string | null
      valor_unitario: string | number
      desconto: string | number
      acrescimo: string | number
      valor_total: string | number
      categoria_id: number | null
      centro_custo_id: number | null
      natureza_financeira_id: number | null
      observacao: string | null
      criado_em: string
    }

    const rows = await runQuery<Row>(sql, [lancamentoId])
    return Response.json({ success: true, rows, count: rows.length })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg, rows: [], count: 0 }, { status: 500 })
  }
}


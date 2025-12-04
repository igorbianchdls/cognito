import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    // Path: /api/modulos/financeiro/lancamentos/{id}/linhas -> id is the penultimate segment
    const idStr = parts[parts.length - 2] || ''
    const lancamentoId = Number(idStr)
    if (!Number.isFinite(lancamentoId) || lancamentoId <= 0) {
      return Response.json({ success: false, message: 'lancamento_id inválido' }, { status: 400 })
    }

    const sql = `
      SELECT
        id,
        lancamento_id,
        tipo_linha,
        numero_parcela,
        valor_bruto,
        juros,
        multa,
        desconto,
        valor_liquido,
        data_vencimento,
        data_pagamento,
        conta_financeira_id,
        extrato_transacao_id,
        status,
        observacao,
        criado_em
      FROM financeiro.lancamentos_financeiros_linhas
      WHERE lancamento_id = $1
      ORDER BY COALESCE(numero_parcela, 0) ASC, id ASC
    `.replace(/\n\s+/g, ' ').trim()

    type Row = {
      id: number
      lancamento_id: number
      tipo_linha: string | null
      numero_parcela: number | null
      valor_bruto: string | number | null
      juros: string | number | null
      multa: string | number | null
      desconto: string | number | null
      valor_liquido: string | number | null
      data_vencimento: string | null
      data_pagamento: string | null
      conta_financeira_id: number | null
      extrato_transacao_id: number | null
      status: string | null
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

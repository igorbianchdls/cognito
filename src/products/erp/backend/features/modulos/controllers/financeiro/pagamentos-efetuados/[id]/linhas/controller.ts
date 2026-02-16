import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/modulos/financeiro/pagamentos-efetuados/{id}/linhas
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    // Path: /api/modulos/financeiro/pagamentos-efetuados/{id}/linhas -> id is the penultimate segment
    const idStr = parts[parts.length - 2] || ''
    const pagamentoId = Number(idStr)
    if (!Number.isFinite(pagamentoId) || pagamentoId <= 0) {
      return Response.json({ success: false, message: 'pagamento_id inválido' }, { status: 400 })
    }

    const sql = `
      SELECT
        pel.id                              AS pagamento_linha_id,
        pel.pagamento_id,

        cp.numero_documento                 AS documento_origem,
        f.nome_fantasia                     AS fornecedor,

        pel.valor_original_documento,
        pel.valor_pago,
        pel.saldo_apos_pagamento,

        pel.desconto_financeiro,
        pel.juros,
        pel.multa

      FROM financeiro.pagamentos_efetuados_linhas pel

      LEFT JOIN financeiro.contas_pagar cp
             ON cp.id = pel.conta_pagar_id

      LEFT JOIN entidades.fornecedores f
             ON f.id = cp.fornecedor_id

      WHERE pel.pagamento_id = $1

      ORDER BY pel.id ASC
    `.replace(/\n\s+/g, ' ').trim()

    type Row = {
      pagamento_linha_id: number
      pagamento_id: number
      documento_origem: string | null
      fornecedor: string | null
      valor_original_documento: number | string | null
      valor_pago: number | string | null
      saldo_apos_pagamento: number | string | null
      desconto_financeiro: number | string | null
      juros: number | string | null
      multa: number | string | null
    }

    const rows = await runQuery<Row>(sql, [pagamentoId])
    return Response.json({ success: true, rows, count: rows.length })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg, rows: [], count: 0 }, { status: 500 })
  }
}


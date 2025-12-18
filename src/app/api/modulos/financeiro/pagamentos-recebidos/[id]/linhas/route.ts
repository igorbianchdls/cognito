import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/modulos/financeiro/pagamentos-recebidos/{id}/linhas
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    // Path: /api/modulos/financeiro/pagamentos-recebidos/{id}/linhas -> id is the penultimate segment
    const idStr = parts[parts.length - 2] || ''
    const pagamentoId = Number(idStr)
    if (!Number.isFinite(pagamentoId) || pagamentoId <= 0) {
      return Response.json({ success: false, message: 'pagamento_id inválido' }, { status: 400 })
    }

    const sql = `
      SELECT
        prl.id                              AS pagamento_recebido_linha_id,
        prl.pagamento_id,

        cr.numero_documento                 AS documento_origem,
        cli.nome_fantasia                   AS cliente,

        prl.valor_original_documento,
        prl.valor_recebido,
        prl.saldo_apos_recebimento,

        prl.desconto_financeiro,
        prl.juros,
        prl.multa

      FROM financeiro.pagamentos_recebidos_linhas prl

      LEFT JOIN financeiro.contas_receber cr
             ON cr.id = prl.conta_receber_id

      LEFT JOIN entidades.clientes cli
             ON cli.id = cr.cliente_id

      WHERE prl.pagamento_id = $1

      ORDER BY prl.id ASC
    `.replace(/\n\s+/g, ' ').trim()

    type Row = {
      pagamento_recebido_linha_id: number
      pagamento_id: number
      documento_origem: string | null
      cliente: string | null
      valor_original_documento: number | string | null
      valor_recebido: number | string | null
      saldo_apos_recebimento: number | string | null
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


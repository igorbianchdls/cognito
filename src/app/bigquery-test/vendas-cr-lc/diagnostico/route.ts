import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type AnyRow = Record<string, unknown>

async function hasColumn(schema: string, table: string, column: string): Promise<boolean> {
  const rows = await runQuery<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
         FROM information_schema.columns
        WHERE table_schema = $1
          AND table_name = $2
          AND column_name = $3
     ) AS exists`,
    [schema, table, column]
  )
  return Boolean(rows[0]?.exists)
}

function toNum(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const pedidoId = Number(searchParams.get('pedido_id') || '')
    if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
      return Response.json({ success: false, message: 'pedido_id inválido' }, { status: 400 })
    }

    const pedidoCols = await runQuery<{ column_name: string }>(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'vendas'
          AND table_name = 'pedidos'`
    )
    const hasPedido = (c: string) => pedidoCols.some((r) => r.column_name === c)

    const pedidoSelectParts = [
      'p.id',
      'p.tenant_id',
      'p.cliente_id',
      hasPedido('numero_pedido') ? 'p.numero_pedido' : 'NULL::text AS numero_pedido',
      hasPedido('categoria_receita_id') ? 'p.categoria_receita_id' : 'NULL::bigint AS categoria_receita_id',
      hasPedido('data_pedido') ? 'p.data_pedido' : 'NULL::date AS data_pedido',
      hasPedido('data_documento') ? 'p.data_documento' : 'NULL::date AS data_documento',
      hasPedido('data_lancamento') ? 'p.data_lancamento' : 'NULL::date AS data_lancamento',
      hasPedido('data_vencimento') ? 'p.data_vencimento' : 'NULL::date AS data_vencimento',
      hasPedido('valor_total') ? 'p.valor_total' : 'NULL::numeric AS valor_total',
      hasPedido('status') ? 'p.status' : 'NULL::text AS status',
      hasPedido('observacoes') ? 'p.observacoes' : 'NULL::text AS observacoes',
    ]

    const pedidoRows = await runQuery<AnyRow>(
      `SELECT ${pedidoSelectParts.join(', ')}
         FROM vendas.pedidos p
        WHERE p.id = $1
        LIMIT 1`,
      [pedidoId]
    )
    const pedido = pedidoRows[0] || null
    if (!pedido) {
      return Response.json({
        success: false,
        message: 'Pedido não encontrado',
        stages: { pedido: false, conta_receber: false, lancamento_contabil: false, balance_ok: false },
      }, { status: 404 })
    }

    const tenantId = Number(pedido['tenant_id'] ?? 1)
    const numeroPedido = String(pedido['numero_pedido'] || '').trim()
    const numeroDocumentoEsperado = numeroPedido || `PV-${pedidoId}`

    const hasCrLcColumn = await hasColumn('financeiro', 'contas_receber', 'lancamento_contabil_id')
    const crLancSelect = hasCrLcColumn
      ? 'cr.lancamento_contabil_id'
      : 'NULL::bigint AS lancamento_contabil_id'

    const crRows = await runQuery<AnyRow>(
      `SELECT
         cr.id,
         cr.tenant_id,
         cr.cliente_id,
         cr.categoria_receita_id,
         cr.numero_documento,
         cr.status,
         cr.data_documento,
         cr.data_lancamento,
         cr.data_vencimento,
         cr.valor_liquido,
         ${crLancSelect}
       FROM financeiro.contas_receber cr
       WHERE cr.tenant_id = $1
         AND cr.numero_documento = $2
       ORDER BY cr.id DESC
       LIMIT 1`,
      [tenantId, numeroDocumentoEsperado]
    )
    const contaReceber = crRows[0] || null

    let lancamento: AnyRow | null = null
    let linhas: AnyRow[] = []

    if (contaReceber) {
      const crId = Number(contaReceber['id'])
      const lcByOrigem = await runQuery<AnyRow>(
        `SELECT
           lc.id,
           lc.data_lancamento,
           lc.historico,
           lc.origem_tabela,
           lc.origem_id,
           lc.total_debitos,
           lc.total_creditos,
           lc.criado_em
         FROM contabilidade.lancamentos_contabeis lc
         WHERE lc.origem_tabela = 'financeiro.contas_receber'
           AND lc.origem_id = $1
         ORDER BY lc.id DESC
         LIMIT 1`,
        [crId]
      )
      lancamento = lcByOrigem[0] || null

      if (!lancamento && hasCrLcColumn) {
        const lcId = Number(contaReceber['lancamento_contabil_id'])
        if (Number.isFinite(lcId) && lcId > 0) {
          const lcById = await runQuery<AnyRow>(
            `SELECT
               lc.id,
               lc.data_lancamento,
               lc.historico,
               lc.origem_tabela,
               lc.origem_id,
               lc.total_debitos,
               lc.total_creditos,
               lc.criado_em
             FROM contabilidade.lancamentos_contabeis lc
             WHERE lc.id = $1
             LIMIT 1`,
            [lcId]
          )
          lancamento = lcById[0] || null
        }
      }

      if (lancamento) {
        linhas = await runQuery<AnyRow>(
          `SELECT
             lcl.id AS linha_id,
             lcl.conta_id,
             pc.codigo AS conta_codigo,
             pc.nome AS conta_nome,
             lcl.debito,
             lcl.credito,
             lcl.historico
           FROM contabilidade.lancamentos_contabeis_linhas lcl
           LEFT JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
           WHERE lcl.lancamento_id = $1
           ORDER BY lcl.id ASC`,
          [Number(lancamento['id'])]
        )
      }
    }

    const sumDebitos = linhas.reduce((acc, r) => acc + toNum(r['debito']), 0)
    const sumCreditos = linhas.reduce((acc, r) => acc + toNum(r['credito']), 0)
    const balanceOk = Math.abs(sumDebitos - sumCreditos) < 0.01
    const lcId = Number(lancamento?.['id'] ?? NaN)
    const crLcId = Number(contaReceber?.['lancamento_contabil_id'] ?? NaN)
    const linkedBack = hasCrLcColumn && Number.isFinite(lcId) && Number.isFinite(crLcId) ? lcId === crLcId : null

    return Response.json({
      success: true,
      pedido_id: pedidoId,
      numero_documento_esperado: numeroDocumentoEsperado,
      stages: {
        pedido: true,
        conta_receber: Boolean(contaReceber),
        lancamento_contabil: Boolean(lancamento),
        linhas: linhas.length > 0,
        balance_ok: balanceOk,
        linked_back: linkedBack,
      },
      pedido,
      conta_receber: contaReceber,
      lancamento_contabil: lancamento,
      lancamento_linhas: linhas,
      totals: {
        linhas_debitos: sumDebitos,
        linhas_creditos: sumCreditos,
      },
    })
  } catch (e) {
    return Response.json(
      { success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

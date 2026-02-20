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
    const compraId = Number(searchParams.get('compra_id') || '')
    if (!Number.isFinite(compraId) || compraId <= 0) {
      return Response.json({ success: false, message: 'compra_id inválido' }, { status: 400 })
    }

    const compraCols = await runQuery<{ column_name: string }>(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'compras'
          AND table_name = 'compras'`
    )
    const hasCompra = (c: string) => compraCols.some((r) => r.column_name === c)

    const compraSelectParts = [
      'c.id',
      'c.tenant_id',
      'c.fornecedor_id',
      hasCompra('numero_oc') ? 'c.numero_oc' : 'NULL::text AS numero_oc',
      hasCompra('categoria_despesa_id') ? 'c.categoria_despesa_id' : 'NULL::bigint AS categoria_despesa_id',
      hasCompra('data_pedido') ? 'c.data_pedido' : 'NULL::date AS data_pedido',
      hasCompra('data_documento') ? 'c.data_documento' : 'NULL::date AS data_documento',
      hasCompra('data_lancamento') ? 'c.data_lancamento' : 'NULL::date AS data_lancamento',
      hasCompra('data_vencimento') ? 'c.data_vencimento' : 'NULL::date AS data_vencimento',
      hasCompra('valor_total') ? 'c.valor_total' : 'NULL::numeric AS valor_total',
      hasCompra('status') ? 'c.status' : 'NULL::text AS status',
      hasCompra('observacoes') ? 'c.observacoes' : 'NULL::text AS observacoes',
    ]

    const compraRows = await runQuery<AnyRow>(
      `SELECT ${compraSelectParts.join(', ')}
         FROM compras.compras c
        WHERE c.id = $1
        LIMIT 1`,
      [compraId]
    )
    const compra = compraRows[0] || null
    if (!compra) {
      return Response.json(
        {
          success: false,
          message: 'Compra não encontrada',
          stages: { compra: false, conta_pagar: false, lancamento_contabil: false, balance_ok: false },
        },
        { status: 404 }
      )
    }

    const tenantId = Number(compra['tenant_id'] ?? 1)
    const numeroOc = String(compra['numero_oc'] || '').trim()
    const numeroDocumentoEsperado = numeroOc || `OC-${compraId}`

    const hasCpLcColumn = await hasColumn('financeiro', 'contas_pagar', 'lancamento_contabil_id')
    const cpLancSelect = hasCpLcColumn
      ? 'cp.lancamento_contabil_id'
      : 'NULL::bigint AS lancamento_contabil_id'

    const cpRows = await runQuery<AnyRow>(
      `SELECT
         cp.id,
         cp.tenant_id,
         cp.fornecedor_id,
         cp.categoria_despesa_id,
         cp.numero_documento,
         cp.status,
         cp.data_documento,
         cp.data_lancamento,
         cp.data_vencimento,
         cp.valor_liquido,
         ${cpLancSelect}
       FROM financeiro.contas_pagar cp
       WHERE cp.tenant_id = $1
         AND cp.numero_documento = $2
       ORDER BY cp.id DESC
       LIMIT 1`,
      [tenantId, numeroDocumentoEsperado]
    )
    const contaPagar = cpRows[0] || null

    let lancamento: AnyRow | null = null
    let linhas: AnyRow[] = []

    if (contaPagar) {
      const cpId = Number(contaPagar['id'])
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
         WHERE lc.origem_tabela = 'financeiro.contas_pagar'
           AND lc.origem_id = $1
         ORDER BY lc.id DESC
         LIMIT 1`,
        [cpId]
      )
      lancamento = lcByOrigem[0] || null

      if (!lancamento && hasCpLcColumn) {
        const lcId = Number(contaPagar['lancamento_contabil_id'])
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
    const cpLcId = Number(contaPagar?.['lancamento_contabil_id'] ?? NaN)
    const linkedBack = hasCpLcColumn && Number.isFinite(lcId) && Number.isFinite(cpLcId) ? lcId === cpLcId : null

    return Response.json({
      success: true,
      compra_id: compraId,
      numero_documento_esperado: numeroDocumentoEsperado,
      stages: {
        compra: true,
        conta_pagar: Boolean(contaPagar),
        lancamento_contabil: Boolean(lancamento),
        linhas: linhas.length > 0,
        balance_ok: balanceOk,
        linked_back: linkedBack,
      },
      compra,
      conta_pagar: contaPagar,
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

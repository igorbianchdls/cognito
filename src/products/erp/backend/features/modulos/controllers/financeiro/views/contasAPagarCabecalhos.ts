import { runQuery } from '@/lib/postgres'
import type { ParsedFinanceiroRequest } from '../query/parseFinanceiroRequest'

type Input = { parsed: ParsedFinanceiroRequest }

export async function maybeHandleFinanceiroContasAPagarCabecalhosView({ parsed }: Input): Promise<Response | null> {
  const { view, page, pageSize } = parsed
  if (view !== 'contas-a-pagar-cabecalhos') return null

  try {
    const sql = `
SELECT
  cp.id                                AS conta_pagar_id,

  cp.numero_documento,
  cp.tipo_documento,
  cp.status,
  cp.data_documento,
  cp.data_lancamento,
  cp.data_vencimento,

  f.id                                 AS fornecedor_id,
  f.nome_fantasia                      AS fornecedor,
  f.imagem_url                         AS fornecedor_imagem_url,

  cat_h.nome                           AS categoria_despesa,

  dep_h.nome                           AS departamento,
  cc_h.nome                            AS centro_custo,
  fil.nome                             AS filial,
  un.nome                              AS unidade_negocio,

  cp.valor_bruto,
  cp.valor_desconto,
  cp.valor_impostos,
  cp.valor_liquido,

  cp.observacao                        AS descricao

FROM financeiro.contas_pagar cp

LEFT JOIN entidades.fornecedores f
       ON f.id = cp.fornecedor_id

LEFT JOIN financeiro.categorias_despesa cat_h
       ON cat_h.id = cp.categoria_despesa_id

LEFT JOIN empresa.departamentos dep_h
       ON dep_h.id = cp.departamento_id

LEFT JOIN empresa.centros_custo cc_h
       ON cc_h.id = cp.centro_custo_id

LEFT JOIN empresa.filiais fil
       ON fil.id = cp.filial_id

LEFT JOIN empresa.unidades_negocio un
       ON un.id = cp.unidade_negocio_id

ORDER BY
  cp.data_vencimento DESC,
  cp.id DESC;`.replace(/\n\s+/g, ' ').trim()

    const rows = await runQuery<Record<string, unknown>>(sql, [])
    const total = rows.length
    return Response.json({ success: true, view, page, pageSize, total, rows, sql, params: '[]' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

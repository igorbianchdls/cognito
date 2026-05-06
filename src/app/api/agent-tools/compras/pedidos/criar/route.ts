import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { withTransaction } from '@/lib/postgres'

export const runtime = 'nodejs'

type JsonMap = Record<string, unknown>

function toObj(input: unknown): JsonMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as JsonMap
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function numberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toDateOnly(value: unknown, fallback: string): string {
  const txt = toText(value).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(txt) ? txt : fallback
}

function normalizeStatus(value: unknown): string {
  const raw = toText(value).toLowerCase()
  if (!raw || raw === 'pendente') return 'em_analise'
  if (raw === 'concluido') return 'recebido'
  if (raw === 'rascunho' || raw === 'em_analise' || raw === 'aprovado' || raw === 'recebimento_parcial' || raw === 'recebido' || raw === 'cancelado') {
    return raw
  }
  return 'em_analise'
}

export async function POST(req: NextRequest) {
  try {
    const payload = toObj(await req.json().catch(() => ({})))
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    const nowIso = new Date().toISOString().slice(0, 10)
    const fornecedorId = numberOrNull(payload.fornecedor_id)
    if (!fornecedorId || fornecedorId <= 0) {
      return Response.json({ ok: false, error: 'fornecedor_id é obrigatório' }, { status: 400 })
    }

    const numeroOc = toText(payload.numero_oc || payload.numero_pedido) || null
    const dataPedido = toDateOnly(payload.data_pedido || payload.data_emissao, nowIso)
    const dataDocumento = toDateOnly(payload.data_documento, dataPedido)
    const dataLancamento = toDateOnly(payload.data_lancamento, dataDocumento)
    const dataVencimento = toDateOnly(payload.data_vencimento, dataPedido)
    const dataEntregaPrevista = toText(payload.data_entrega_prevista) ? toDateOnly(payload.data_entrega_prevista, dataPedido) : null
    const status = normalizeStatus(payload.status)
    const observacoes = toText(payload.observacoes || payload.descricao) || null

    const linhasRaw = Array.isArray(payload.linhas)
      ? payload.linhas
      : (Array.isArray(payload.itens) ? payload.itens : [])
    const linhas = linhasRaw
      .map((row) => toObj(row))
      .filter((row) => Object.keys(row).length > 0)

    let valorTotal = numberOrNull(payload.valor_total) ?? 0
    if (valorTotal <= 0 && linhas.length > 0) {
      valorTotal = linhas.reduce((acc, row) => {
        const total = numberOrNull(row.total)
        if (total != null) return acc + total
        const qtd = Math.max(0, Number(row.quantidade ?? 1))
        const unit = Math.max(0, Number(row.preco_unitario ?? row.valor_unitario ?? 0))
        return acc + qtd * unit
      }, 0)
    }
    if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
      return Response.json({ ok: false, error: 'valor_total inválido' }, { status: 400 })
    }

    const result = await withTransaction(async (client) => {
      const compraColsRes = await client.query(
        `SELECT column_name
           FROM information_schema.columns
          WHERE table_schema = 'compras' AND table_name = 'compras'`
      )
      const compraCols = new Set((compraColsRes.rows as Array<{ column_name: string }>).map((r) => String(r.column_name)))
      const hasCompraCol = (col: string) => compraCols.has(col)

      const headerCols = [
        'tenant_id',
        'fornecedor_id',
        'numero_oc',
        'data_pedido',
        'data_documento',
        'data_lancamento',
        'data_vencimento',
        'status',
        'valor_total',
        'observacoes',
      ]
      const headerVals: unknown[] = [
        tenantId,
        fornecedorId,
        numeroOc,
        dataPedido,
        dataDocumento,
        dataLancamento,
        dataVencimento,
        status,
        valorTotal,
        observacoes,
      ]

      const optionalHeaderCols = [
        'filial_id',
        'centro_custo_id',
        'projeto_id',
        'categoria_financeira_id',
        'categoria_despesa_id',
        'departamento_id',
        'unidade_negocio_id',
      ] as const
      for (const col of optionalHeaderCols) {
        if (hasCompraCol(col) && payload[col] !== undefined) {
          headerCols.push(col)
          headerVals.push(numberOrNull(payload[col]))
        }
      }
      if (hasCompraCol('data_entrega_prevista') && dataEntregaPrevista) {
        headerCols.push('data_entrega_prevista')
        headerVals.push(dataEntregaPrevista)
      }
      if (hasCompraCol('criado_por') && payload.criado_por !== undefined) {
        headerCols.push('criado_por')
        headerVals.push(numberOrNull(payload.criado_por))
      }

      const headerPlaceholders = headerCols.map((_, idx) => `$${idx + 1}`)
      const insertCompra = await client.query(
        `INSERT INTO compras.compras (${headerCols.join(',')})
         VALUES (${headerPlaceholders.join(',')})
         RETURNING id`,
        headerVals,
      )
      const compraId = Number(insertCompra.rows[0]?.id)
      if (!compraId) throw new Error('Falha ao criar compra')

      if (linhas.length > 0) {
        const lineColsRes = await client.query(
          `SELECT column_name
             FROM information_schema.columns
            WHERE table_schema = 'compras' AND table_name = 'compras_linhas'`
        )
        const lineColsSet = new Set((lineColsRes.rows as Array<{ column_name: string }>).map((r) => String(r.column_name)))
        const hasLineCol = (col: string) => lineColsSet.has(col)

        for (const row of linhas) {
          const quantidade = Math.max(0, Number(row.quantidade ?? 1))
          const precoUnitario = Math.max(0, Number(row.preco_unitario ?? row.valor_unitario ?? 0))
          const total = numberOrNull(row.total) ?? quantidade * precoUnitario
          const lineCols = [
            'tenant_id',
            'compra_id',
            'produto_id',
            'quantidade',
            'preco_unitario',
            'total',
          ]
          const lineVals: unknown[] = [
            tenantId,
            compraId,
            numberOrNull(row.produto_id),
            quantidade,
            precoUnitario,
            total,
          ]

          if (hasLineCol('unidade_medida') && row.unidade_medida !== undefined) {
            lineCols.push('unidade_medida')
            lineVals.push(toText(row.unidade_medida) || null)
          }

          const optionalLineCols = [
            'centro_custo_id',
            'projeto_id',
            'categoria_financeira_id',
            'departamento_id',
            'unidade_negocio_id',
          ] as const
          for (const col of optionalLineCols) {
            if (hasLineCol(col)) {
              lineCols.push(col)
              lineVals.push(numberOrNull(row[col] ?? payload[col]))
            }
          }

          const linePlaceholders = lineCols.map((_, idx) => `$${idx + 1}`)
          await client.query(
            `INSERT INTO compras.compras_linhas (${lineCols.join(',')})
             VALUES (${linePlaceholders.join(',')})`,
            lineVals,
          )
        }
      }

      return { id: compraId, linhasCriadas: linhas.length }
    })

    return Response.json({
      ok: true,
      result: {
        success: true,
        id: result.id,
        linhas_criadas: result.linhasCriadas,
      },
    })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

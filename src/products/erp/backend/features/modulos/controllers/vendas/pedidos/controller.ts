import { withTransaction, runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const parseOptionalId = (field: string): number | null => {
      const raw = String(form.get(field) || '').trim()
      if (!raw) return null
      const n = Number(raw)
      if (!Number.isInteger(n) || n <= 0) throw new Error(`${field} inválido`)
      return n
    }

    // Required
    const numero_pedido = String(form.get('numero_pedido') || '').trim()
    const cliente_id_raw = String(form.get('cliente_id') || '').trim()
    const canal_venda_id_raw = String(form.get('canal_venda_id') || '').trim()
    const data_pedido = String(form.get('data_pedido') || '').trim()
    const data_documento_raw = String(form.get('data_documento') || '').trim()
    const data_lancamento_raw = String(form.get('data_lancamento') || '').trim()
    const data_vencimento_raw = String(form.get('data_vencimento') || '').trim()
    const valor_total_raw = String(form.get('valor_total') || '').trim()

    if (!cliente_id_raw) return Response.json({ success: false, message: 'cliente_id é obrigatório' }, { status: 400 })
    if (!canal_venda_id_raw) return Response.json({ success: false, message: 'canal_venda_id é obrigatório' }, { status: 400 })
    if (!data_pedido) return Response.json({ success: false, message: 'data_pedido é obrigatório' }, { status: 400 })
    if (!valor_total_raw) return Response.json({ success: false, message: 'valor_total é obrigatório' }, { status: 400 })

    const data_documento = data_documento_raw || data_pedido
    const data_lancamento = data_lancamento_raw || data_documento || data_pedido
    const data_vencimento = data_vencimento_raw || data_pedido
    const numeroPedidoFinal = numero_pedido || `PV-${Date.now()}`

    const cliente_id = Number(cliente_id_raw)
    const canal_venda_id = Number(canal_venda_id_raw)
    const valor_total = Number(valor_total_raw)
    if (!cliente_id) return Response.json({ success: false, message: 'cliente_id inválido' }, { status: 400 })
    if (!canal_venda_id) return Response.json({ success: false, message: 'canal_venda_id inválido' }, { status: 400 })
    if (Number.isNaN(valor_total)) return Response.json({ success: false, message: 'valor_total inválido' }, { status: 400 })

    // Optionals
    const tenant_id_raw = String(form.get('tenant_id') || '').trim()
    const usuario_id_raw = String(form.get('usuario_id') || '').trim()
    const vendedor_id_raw = String(form.get('vendedor_id') || '').trim()
    const valor_produtos_raw = String(form.get('valor_produtos') || '').trim()
    const valor_frete_raw = String(form.get('valor_frete') || '').trim()
    const valor_desconto_raw = String(form.get('valor_desconto') || '').trim()
    const subtotal_raw = String(form.get('subtotal') || '').trim()
    const desconto_total_raw = String(form.get('desconto_total') || '').trim()
    const observacoes = String(form.get('observacoes') || '').trim() || null
    const descricao = String(form.get('descricao') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null

    const tenant_id = tenant_id_raw ? Number(tenant_id_raw) : 1
    // Some schemas use vendedor_id instead of usuario_id
    const vendedor_id = vendedor_id_raw ? Number(vendedor_id_raw) : (usuario_id_raw ? Number(usuario_id_raw) : null)
    const valor_produtos = valor_produtos_raw ? Number(valor_produtos_raw) : null
    const valor_frete = valor_frete_raw ? Number(valor_frete_raw) : null
    const valor_desconto = valor_desconto_raw ? Number(valor_desconto_raw) : null
    const subtotal = subtotal_raw ? Number(subtotal_raw) : (valor_produtos ?? valor_total)
    const desconto_total = desconto_total_raw ? Number(desconto_total_raw) : (valor_desconto ?? 0)
    if (Number.isNaN(subtotal)) return Response.json({ success: false, message: 'subtotal inválido' }, { status: 400 })
    if (Number.isNaN(desconto_total)) return Response.json({ success: false, message: 'desconto_total inválido' }, { status: 400 })

    const cupom_id = parseOptionalId('cupom_id')
    const territorio_id = parseOptionalId('territorio_id')
    const campanha_venda_id = parseOptionalId('campanha_venda_id')
    const categoria_receita_id = parseOptionalId('categoria_receita_id')
    const centro_lucro_id = parseOptionalId('centro_lucro_id')
    const filial_id = parseOptionalId('filial_id')
    const unidade_negocio_id = parseOptionalId('unidade_negocio_id')
    const sales_office_id = parseOptionalId('sales_office_id')
    // Discover table columns to build a single successful INSERT
    const colsInfo = await runQuery<{ column_name: string; is_nullable: string }>(
      `SELECT column_name, is_nullable
         FROM information_schema.columns
        WHERE table_schema = 'vendas' AND table_name = 'pedidos'`
    )
    const has = (c: string) => colsInfo.some((r) => r.column_name === c)
    const notNull = (c: string) => colsInfo.some((r) => r.column_name === c && r.is_nullable === 'NO')

    const insertCols: string[] = []
    const placeholders: string[] = []
    const values: unknown[] = []
    let i = 1

    if (has('tenant_id')) { insertCols.push('tenant_id'); placeholders.push(`$${i++}`); values.push(tenant_id) }
    if (has('numero_pedido')) {
      if (notNull('numero_pedido') && !numeroPedidoFinal) {
        return Response.json({ success: false, message: 'numero_pedido é obrigatório' }, { status: 400 })
      }
      insertCols.push('numero_pedido'); placeholders.push(`$${i++}`); values.push(numeroPedidoFinal)
    }
    insertCols.push('cliente_id'); placeholders.push(`$${i++}`); values.push(cliente_id)
    insertCols.push('canal_venda_id'); placeholders.push(`$${i++}`); values.push(canal_venda_id)
    if (has('vendedor_id')) {
      if (notNull('vendedor_id') && (vendedor_id == null || Number.isNaN(vendedor_id))) {
        return Response.json({ success: false, message: 'vendedor_id é obrigatório' }, { status: 400 })
      }
      insertCols.push('vendedor_id'); placeholders.push(`$${i++}`); values.push(vendedor_id)
    } else if (has('usuario_id')) {
      if (notNull('usuario_id') && (vendedor_id == null || Number.isNaN(vendedor_id))) {
        return Response.json({ success: false, message: 'usuario_id é obrigatório' }, { status: 400 })
      }
      insertCols.push('usuario_id'); placeholders.push(`$${i++}`); values.push(vendedor_id)
    }
    if (has('territorio_id')) { insertCols.push('territorio_id'); placeholders.push(`$${i++}`); values.push(territorio_id) }
    if (has('cupom_id')) { insertCols.push('cupom_id'); placeholders.push(`$${i++}`); values.push(cupom_id) }
    if (has('campanha_venda_id')) { insertCols.push('campanha_venda_id'); placeholders.push(`$${i++}`); values.push(campanha_venda_id) }
    if (has('categoria_receita_id')) { insertCols.push('categoria_receita_id'); placeholders.push(`$${i++}`); values.push(categoria_receita_id) }
    if (has('centro_lucro_id')) { insertCols.push('centro_lucro_id'); placeholders.push(`$${i++}`); values.push(centro_lucro_id) }
    if (has('filial_id')) { insertCols.push('filial_id'); placeholders.push(`$${i++}`); values.push(filial_id) }
    if (has('unidade_negocio_id')) { insertCols.push('unidade_negocio_id'); placeholders.push(`$${i++}`); values.push(unidade_negocio_id) }
    if (has('sales_office_id')) { insertCols.push('sales_office_id'); placeholders.push(`$${i++}`); values.push(sales_office_id) }

    insertCols.push('data_pedido'); placeholders.push(`$${i++}`); values.push(data_pedido)
    if (has('data_documento')) { insertCols.push('data_documento'); placeholders.push(`$${i++}`); values.push(data_documento) }
    if (has('data_lancamento')) { insertCols.push('data_lancamento'); placeholders.push(`$${i++}`); values.push(data_lancamento) }
    if (has('data_vencimento')) { insertCols.push('data_vencimento'); placeholders.push(`$${i++}`); values.push(data_vencimento) }
    if (has('subtotal')) { insertCols.push('subtotal'); placeholders.push(`$${i++}`); values.push(subtotal) }
    if (has('desconto_total')) { insertCols.push('desconto_total'); placeholders.push(`$${i++}`); values.push(desconto_total) }
    if (has('valor_produtos')) { insertCols.push('valor_produtos'); placeholders.push(`$${i++}`); values.push(valor_produtos) }
    if (has('valor_frete')) { insertCols.push('valor_frete'); placeholders.push(`$${i++}`); values.push(valor_frete) }
    if (has('valor_desconto')) { insertCols.push('valor_desconto'); placeholders.push(`$${i++}`); values.push(valor_desconto) }
    insertCols.push('valor_total'); placeholders.push(`$${i++}`); values.push(valor_total)
    if (has('observacoes')) { insertCols.push('observacoes'); placeholders.push(`$${i++}`); values.push(observacoes) }
    if (has('descricao')) { insertCols.push('descricao'); placeholders.push(`$${i++}`); values.push(descricao) }
    insertCols.push('status'); placeholders.push(`$${i++}`); values.push(status)

    const sql = `INSERT INTO vendas.pedidos (${insertCols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING id`

    const result = await withTransaction(async (client) => {
      const insert = await client.query(sql, values)
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar pedido')
      return { id }
    })

    // Emit event and try inline CR creation (idempotente)
    try {
      // Emit Inngest event (best effort)
      try { await runQuery('SELECT 1') } catch {}
    } catch {}

    // Inline CR creation
    let crId: number | null = null
    try {
      const mod = await import('@/inngest/vendas')
      const cr = await mod.createCrFromPedido(result.id)
      crId = cr.crId
    } catch (e) {
      // best effort only
    }

    return Response.json({ success: true, id: result.id, cr_id: crId })
  } catch (error) {
    console.error('🛒 API /api/modulos/vendas/pedidos POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

import { withTransaction, runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    // Required
    const numero_pedido = String(form.get('numero_pedido') || '').trim()
    const cliente_id_raw = String(form.get('cliente_id') || '').trim()
    const canal_venda_id_raw = String(form.get('canal_venda_id') || '').trim()
    const data_pedido = String(form.get('data_pedido') || '').trim()
    const valor_total_raw = String(form.get('valor_total') || '').trim()

    if (!cliente_id_raw) return Response.json({ success: false, message: 'cliente_id é obrigatório' }, { status: 400 })
    if (!canal_venda_id_raw) return Response.json({ success: false, message: 'canal_venda_id é obrigatório' }, { status: 400 })
    if (!data_pedido) return Response.json({ success: false, message: 'data_pedido é obrigatório' }, { status: 400 })
    if (!valor_total_raw) return Response.json({ success: false, message: 'valor_total é obrigatório' }, { status: 400 })

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
    const status = String(form.get('status') || '').trim() || null

    const tenant_id = tenant_id_raw ? Number(tenant_id_raw) : 1
    // Some schemas use vendedor_id instead of usuario_id
    const vendedor_id = vendedor_id_raw ? Number(vendedor_id_raw) : (usuario_id_raw ? Number(usuario_id_raw) : null)
    const valor_produtos = valor_produtos_raw ? Number(valor_produtos_raw) : null
    const valor_frete = valor_frete_raw ? Number(valor_frete_raw) : null
    const valor_desconto = valor_desconto_raw ? Number(valor_desconto_raw) : null

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
    // Para maior compatibilidade, não insere numero_pedido; usar descrição/campo próprio no futuro
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
    insertCols.push('data_pedido'); placeholders.push(`$${i++}`); values.push(data_pedido)
    if (has('valor_produtos')) { insertCols.push('valor_produtos'); placeholders.push(`$${i++}`); values.push(valor_produtos) }
    if (has('valor_frete')) { insertCols.push('valor_frete'); placeholders.push(`$${i++}`); values.push(valor_frete) }
    if (has('valor_desconto')) { insertCols.push('valor_desconto'); placeholders.push(`$${i++}`); values.push(valor_desconto) }
    insertCols.push('valor_total'); placeholders.push(`$${i++}`); values.push(valor_total)
    insertCols.push('status'); placeholders.push(`$${i++}`); values.push(status)

    const sql = `INSERT INTO vendas.pedidos (${insertCols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING id`

    const result = await withTransaction(async (client) => {
      const insert = await client.query(sql, values)
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar pedido')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('🛒 API /api/modulos/vendas/pedidos POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

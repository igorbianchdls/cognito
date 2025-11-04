import { withTransaction } from '@/lib/postgres'

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

    if (!numero_pedido) return Response.json({ success: false, message: 'numero_pedido é obrigatório' }, { status: 400 })
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
    const usuario_id_raw = String(form.get('usuario_id') || '').trim()
    const valor_produtos_raw = String(form.get('valor_produtos') || '').trim()
    const valor_frete_raw = String(form.get('valor_frete') || '').trim()
    const valor_desconto_raw = String(form.get('valor_desconto') || '').trim()
    const status = String(form.get('status') || '').trim() || null

    const usuario_id = usuario_id_raw ? Number(usuario_id_raw) : null
    const valor_produtos = valor_produtos_raw ? Number(valor_produtos_raw) : null
    const valor_frete = valor_frete_raw ? Number(valor_frete_raw) : null
    const valor_desconto = valor_desconto_raw ? Number(valor_desconto_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO gestaovendas.pedidos (
           numero_pedido, cliente_id, canal_venda_id, usuario_id, data_pedido,
           valor_produtos, valor_frete, valor_desconto, valor_total, status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id`,
        [numero_pedido, cliente_id, canal_venda_id, usuario_id, data_pedido,
         valor_produtos, valor_frete, valor_desconto, valor_total, status]
      )
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


import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const numero_pedido = String(form.get('numero_pedido') || '').trim()
    const fornecedor_id_raw = String(form.get('fornecedor_id') || '').trim()
    const data_pedido = String(form.get('data_pedido') || '').trim()
    if (!numero_pedido) return Response.json({ success: false, message: 'numero_pedido é obrigatório' }, { status: 400 })
    if (!fornecedor_id_raw) return Response.json({ success: false, message: 'fornecedor_id é obrigatório' }, { status: 400 })
    if (!data_pedido) return Response.json({ success: false, message: 'data_pedido é obrigatório' }, { status: 400 })

    const fornecedor_id = Number(fornecedor_id_raw)
    if (!fornecedor_id) return Response.json({ success: false, message: 'fornecedor_id inválido' }, { status: 400 })

    const condicao_pagamento_id_raw = String(form.get('condicao_pagamento_id') || '').trim()
    const condicao_pagamento_id = condicao_pagamento_id_raw ? Number(condicao_pagamento_id_raw) : null
    const status = String(form.get('status') || '').trim() || null
    const valor_total_raw = String(form.get('valor_total') || '').trim()
    const valor_total = valor_total_raw ? Number(valor_total_raw) : null
    const observacoes = String(form.get('observacoes') || '').trim() || null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO compras.pedidos_compra (
           numero_pedido, fornecedor_id, condicao_pagamento_id, data_pedido, status, valor_total, observacoes
         ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [numero_pedido, fornecedor_id, condicao_pagamento_id, data_pedido, status, valor_total, observacoes]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar pedido de compra')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📦 API /api/modulos/compras/pedidos POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


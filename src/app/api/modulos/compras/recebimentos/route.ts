import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const pedido_id_raw = String(form.get('pedido_id') || '').trim()
    const data_recebimento = String(form.get('data_recebimento') || '').trim()
    if (!pedido_id_raw) return Response.json({ success: false, message: 'pedido_id é obrigatório' }, { status: 400 })
    if (!data_recebimento) return Response.json({ success: false, message: 'data_recebimento é obrigatório' }, { status: 400 })

    const pedido_id = Number(pedido_id_raw)
    if (!pedido_id) return Response.json({ success: false, message: 'pedido_id inválido' }, { status: 400 })

    const numero_nota_fiscal = String(form.get('numero_nota_fiscal') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null
    const observacoes = String(form.get('observacoes') || '').trim() || null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO compras.recebimentos_compra (pedido_id, data_recebimento, numero_nota_fiscal, status, observacoes)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [pedido_id, data_recebimento, numero_nota_fiscal, status, observacoes]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar recebimento de compra')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📦 API /api/modulos/compras/recebimentos POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const fornecedor_id_raw = String(form.get('fornecedor_id') || '').trim()
    const data_envio = String(form.get('data_envio') || '').trim()
    if (!fornecedor_id_raw) return Response.json({ success: false, message: 'fornecedor_id é obrigatório' }, { status: 400 })
    if (!data_envio) return Response.json({ success: false, message: 'data_envio é obrigatório' }, { status: 400 })

    const fornecedor_id = Number(fornecedor_id_raw)
    if (!fornecedor_id) return Response.json({ success: false, message: 'fornecedor_id inválido' }, { status: 400 })

    const data_retorno = String(form.get('data_retorno') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null
    const observacoes = String(form.get('observacoes') || '').trim() || null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO compras.cotacoes_compra (fornecedor_id, data_envio, data_retorno, status, observacoes)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [fornecedor_id, data_envio, data_retorno, status, observacoes]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar cotação de compra')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📦 API /api/modulos/compras/cotacoes-compra POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


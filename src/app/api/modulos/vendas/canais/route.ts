import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const nome = String(form.get('nome') || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO gestaovendas.canais_venda (nome) VALUES ($1) RETURNING id`,
        [nome]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar canal')
      return { id }
    })
    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('🛒 API /api/modulos/vendas/canais POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


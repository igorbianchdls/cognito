import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const data_solicitacao = String(form.get('data_solicitacao') || '').trim()
    if (!data_solicitacao) return Response.json({ success: false, message: 'data_solicitacao é obrigatório' }, { status: 400 })

    const status = String(form.get('status') || '').trim() || null
    const observacoes = String(form.get('observacoes') || '').trim() || null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO compras.solicitacoes_compra (data_solicitacao, status, observacoes)
         VALUES ($1,$2,$3) RETURNING id`,
        [data_solicitacao, status, observacoes]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar solicitação de compra')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📦 API /api/modulos/compras/solicitacoes-compra POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const nome_fantasia = String(form.get('nome_fantasia') || '').trim()
    if (!nome_fantasia) return Response.json({ success: false, message: 'nome_fantasia é obrigatório' }, { status: 400 })

    const segmento = String(form.get('segmento') || '').trim() || null
    const telefone = String(form.get('telefone') || '').trim() || null
    const email = String(form.get('email') || '').trim() || null
    const cidade = String(form.get('cidade') || '').trim() || null
    const estado = String(form.get('estado') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null
    const imagem_url = String(form.get('imagem_url') || '').trim() || null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO servicos.clientes (nome_fantasia, segmento, telefone, email, cidade, estado, status, imagem_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [nome_fantasia, segmento, telefone, email, cidade, estado, status, imagem_url]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar cliente')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('🛠️ API /api/modulos/servicos/clientes POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


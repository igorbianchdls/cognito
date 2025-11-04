import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const nome = String(form.get('nome') || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const descricao = String(form.get('descricao') || '').trim() || null
    const categoria = String(form.get('categoria') || '').trim() || null
    const unidade_medida = String(form.get('unidade_medida') || '').trim() || null
    const preco_base_raw = String(form.get('preco_base') || '').trim()
    const ativo = String(form.get('ativo') || '').trim().toLowerCase() !== 'false'
    const preco_base = preco_base_raw ? Number(preco_base_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO servicos.servicos (nome, descricao, categoria, unidade_medida, preco_base, ativo)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [nome, descricao, categoria, unidade_medida, preco_base, ativo]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar serviço')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('🛠️ API /api/modulos/servicos/servicos POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


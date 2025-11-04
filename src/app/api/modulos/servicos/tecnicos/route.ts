import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const nome = String(form.get('nome') || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const cargo = String(form.get('cargo') || '').trim() || null
    const especialidade = String(form.get('especialidade') || '').trim() || null
    const custo_hora_raw = String(form.get('custo_hora') || '').trim()
    const telefone = String(form.get('telefone') || '').trim() || null
    const email = String(form.get('email') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null
    const data_admissao = String(form.get('data_admissao') || '').trim() || null
    const imagem_url = String(form.get('imagem_url') || '').trim() || null
    const custo_hora = custo_hora_raw ? Number(custo_hora_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO servicos.tecnicos (nome, cargo, especialidade, custo_hora, telefone, email, status, data_admissao, imagem_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id`,
        [nome, cargo, especialidade, custo_hora, telefone, email, status, data_admissao, imagem_url]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar técnico')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('🛠️ API /api/modulos/servicos/tecnicos POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


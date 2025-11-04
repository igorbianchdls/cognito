import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const primeiro_nome = String(form.get('primeiro_nome') || '').trim()
    if (!primeiro_nome) return Response.json({ success: false, message: 'primeiro_nome é obrigatório' }, { status: 400 })

    const sobrenome = String(form.get('sobrenome') || '').trim() || null
    const cargo = String(form.get('cargo') || '').trim() || null
    const email = String(form.get('email') || '').trim() || null
    const telefone = String(form.get('telefone') || '').trim() || null
    const conta_id_raw = String(form.get('conta_id') || '').trim()
    const usuario_id_raw = String(form.get('usuario_id') || '').trim()
    const contaid = conta_id_raw ? Number(conta_id_raw) : null
    const usuarioid = usuario_id_raw ? Number(usuario_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO crm.contatos (primeironome, sobrenome, cargo, email, telefone, contaid, usuarioid)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING contatoid AS id`,
        [primeiro_nome, sobrenome, cargo, email, telefone, contaid, usuarioid]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar contato')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📇 API /api/modulos/crm/contatos POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


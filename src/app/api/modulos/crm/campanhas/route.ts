import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const nome = String(form.get('nome') || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const tipo = String(form.get('tipo') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null
    const inicio = String(form.get('inicio') || '').trim() || null
    const fim = String(form.get('fim') || '').trim() || null
    const usuario_id_raw = String(form.get('usuario_id') || '').trim()
    const usuarioid = usuario_id_raw ? Number(usuario_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO crm.campanhas (nome, tipo, status, datainicio, datafim, usuarioid)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING campanhaid AS id`,
        [nome, tipo, status, inicio, fim, usuarioid]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar campanha')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📇 API /api/modulos/crm/campanhas POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


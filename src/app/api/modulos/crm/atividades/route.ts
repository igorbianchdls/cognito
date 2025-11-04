import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const assunto = String(form.get('assunto') || '').trim()
    if (!assunto) return Response.json({ success: false, message: 'assunto é obrigatório' }, { status: 400 })

    const tipo = String(form.get('tipo') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null
    const data_vencimento = String(form.get('data_vencimento') || '').trim() || null
    const conta_id_raw = String(form.get('conta_id') || '').trim()
    const contato_id_raw = String(form.get('contato_id') || '').trim()
    const lead_id_raw = String(form.get('lead_id') || '').trim()
    const oportunidade_id_raw = String(form.get('oportunidade_id') || '').trim()
    const usuario_id_raw = String(form.get('usuario_id') || '').trim()
    const anotacoes = String(form.get('anotacoes') || '').trim() || null

    const contaid = conta_id_raw ? Number(conta_id_raw) : null
    const contatoid = contato_id_raw ? Number(contato_id_raw) : null
    const leadid = lead_id_raw ? Number(lead_id_raw) : null
    const oportunidadeid = oportunidade_id_raw ? Number(oportunidade_id_raw) : null
    const usuarioid = usuario_id_raw ? Number(usuario_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO crm.atividades (assunto, tipo, status, datadevencimento, contaid, contatoid, leadid, oportunidadeid, usuarioid, anotacoes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING atividadeid AS id`,
        [assunto, tipo, status, data_vencimento, contaid, contatoid, leadid, oportunidadeid, usuarioid, anotacoes]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar atividade')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📇 API /api/modulos/crm/atividades POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


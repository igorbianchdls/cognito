import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const nome = String(form.get('nome') || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const conta_id_raw = String(form.get('conta_id') || '').trim()
    const usuario_id_raw = String(form.get('usuario_id') || '').trim()
    const estagio = String(form.get('estagio') || '').trim() || null
    const valor_raw = String(form.get('valor') || '').trim()
    const prob_raw = String(form.get('probabilidade') || '').trim()
    const data_fechamento = String(form.get('data_fechamento') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null

    const contaid = conta_id_raw ? Number(conta_id_raw) : null
    const usuarioid = usuario_id_raw ? Number(usuario_id_raw) : null
    const valor = valor_raw ? Number(valor_raw) : null
    const probabilidade = prob_raw ? Number(prob_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO crm.oportunidades (nome, contaid, usuarioid, estagio, valor, probabilidade, datadefechamento, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING oportunidadeid AS id`,
        [nome, contaid, usuarioid, estagio, valor, probabilidade, data_fechamento, status]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar oportunidade')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📇 API /api/modulos/crm/oportunidades POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


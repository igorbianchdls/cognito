import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const ordem_servico_id_raw = String(form.get('ordem_servico_id') || '').trim()
    const tecnico_id_raw = String(form.get('tecnico_id') || '').trim()
    const data_agendada = String(form.get('data_agendada') || '').trim()
    if (!ordem_servico_id_raw) return Response.json({ success: false, message: 'ordem_servico_id é obrigatório' }, { status: 400 })
    if (!tecnico_id_raw) return Response.json({ success: false, message: 'tecnico_id é obrigatório' }, { status: 400 })
    if (!data_agendada) return Response.json({ success: false, message: 'data_agendada é obrigatório' }, { status: 400 })

    const ordem_servico_id = Number(ordem_servico_id_raw)
    const tecnico_id = Number(tecnico_id_raw)
    if (!ordem_servico_id) return Response.json({ success: false, message: 'ordem_servico_id inválido' }, { status: 400 })
    if (!tecnico_id) return Response.json({ success: false, message: 'tecnico_id inválido' }, { status: 400 })

    const data_inicio = String(form.get('data_inicio') || '').trim() || null
    const data_fim = String(form.get('data_fim') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null
    const observacoes = String(form.get('observacoes') || '').trim() || null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO servicos.agendamentos_servico (ordem_servico_id, tecnico_id, data_agendada, data_inicio, data_fim, status, observacoes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [ordem_servico_id, tecnico_id, data_agendada, data_inicio, data_fim, status, observacoes]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar agendamento')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('🛠️ API /api/modulos/servicos/agendamentos POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


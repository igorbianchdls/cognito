import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const numero_os = String(form.get('numero_os') || '').trim()
    const cliente_id_raw = String(form.get('cliente_id') || '').trim()
    const data_abertura = String(form.get('data_abertura') || '').trim()
    if (!numero_os) return Response.json({ success: false, message: 'numero_os é obrigatório' }, { status: 400 })
    if (!cliente_id_raw) return Response.json({ success: false, message: 'cliente_id é obrigatório' }, { status: 400 })
    if (!data_abertura) return Response.json({ success: false, message: 'data_abertura é obrigatório' }, { status: 400 })

    const cliente_id = Number(cliente_id_raw)
    if (!cliente_id) return Response.json({ success: false, message: 'cliente_id inválido' }, { status: 400 })

    const tecnico_id_raw = String(form.get('tecnico_responsavel_id') || '').trim()
    const prioridade = String(form.get('prioridade') || '').trim() || null
    const descricao_problema = String(form.get('descricao_problema') || '').trim() || null
    const data_prevista = String(form.get('data_prevista') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null
    const valor_estimado_raw = String(form.get('valor_estimado') || '').trim()
    const valor_final_raw = String(form.get('valor_final') || '').trim()
    const observacoes = String(form.get('observacoes') || '').trim() || null

    const tecnico_responsavel_id = tecnico_id_raw ? Number(tecnico_id_raw) : null
    const valor_estimado = valor_estimado_raw ? Number(valor_estimado_raw) : null
    const valor_final = valor_final_raw ? Number(valor_final_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO servicos.ordens_servico (
           numero_os, cliente_id, tecnico_responsavel_id, status, prioridade,
           descricao_problema, data_abertura, data_prevista, valor_estimado,
           valor_final, observacoes
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id`,
        [numero_os, cliente_id, tecnico_responsavel_id, status, prioridade,
         descricao_problema, data_abertura, data_prevista, valor_estimado,
         valor_final, observacoes]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar ordem de serviço')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('🛠️ API /api/modulos/servicos/ordens-servico POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}


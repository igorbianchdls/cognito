import { withTransaction } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const tenantId = resolveTenantId(req.headers)

    const assunto = String(form.get('assunto') || '').trim()
    if (!assunto) return Response.json({ success: false, message: 'assunto é obrigatório' }, { status: 400 })

    const tipo = String(form.get('tipo') || '').trim() || 'tarefa'
    const status = String(form.get('status') || '').trim() || null
    const data_vencimento = String(form.get('data_vencimento') || '').trim() || null
    const conta_id_raw = String(form.get('conta_id') || '').trim()
    const contato_id_raw = String(form.get('contato_id') || '').trim()
    const lead_id_raw = String(form.get('lead_id') || '').trim()
    const oportunidade_id_raw = String(form.get('oportunidade_id') || '').trim()
    const usuario_id_raw = String(form.get('usuario_id') || '').trim()
    const anotacoes = String(form.get('anotacoes') || '').trim() || null

    const conta_id = conta_id_raw ? Number(conta_id_raw) : null
    const contato_id = contato_id_raw ? Number(contato_id_raw) : null
    const lead_id = lead_id_raw ? Number(lead_id_raw) : null
    const oportunidade_id = oportunidade_id_raw ? Number(oportunidade_id_raw) : null
    const responsavel_id = usuario_id_raw ? Number(usuario_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO crm.atividades
          (tenant_id, conta_id, contato_id, lead_id, oportunidade_id, tipo, descricao, data_prevista, status, responsavel_id, assunto, anotacoes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id`,
        [
          tenantId,
          conta_id,
          contato_id,
          lead_id,
          oportunidade_id,
          tipo,
          assunto, // descricao
          data_vencimento, // data_prevista
          status,
          responsavel_id,
          assunto,
          anotacoes,
        ]
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

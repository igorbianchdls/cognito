import { withTransaction } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const tenantId = resolveTenantId(req.headers)

    const nome = String(form.get('nome') || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const conta_id_raw = String(form.get('conta_id') || '').trim()
    const usuario_id_raw = String(form.get('usuario_id') || '').trim()
    const estagio = String(form.get('estagio') || '').trim() || null
    const valor_raw = String(form.get('valor') || '').trim()
    const prob_raw = String(form.get('probabilidade') || '').trim()
    const data_fechamento = String(form.get('data_fechamento') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null

    const conta_id = conta_id_raw ? Number(conta_id_raw) : null
    const vendedor_id = usuario_id_raw ? Number(usuario_id_raw) : null
    const valor_estimado = valor_raw ? Number(valor_raw) : null
    const probabilidade = prob_raw ? Number(prob_raw) : null

    const result = await withTransaction(async (client) => {
      // Resolve fase_pipeline_id: match by stage name, else fallback to first stage by ordem.
      let fase_pipeline_id: number | null = null
      if (estagio) {
        const r = await client.query(
          `SELECT id FROM crm.fases_pipeline WHERE tenant_id = $1 AND LOWER(nome) = LOWER($2) AND COALESCE(ativo,true) = true ORDER BY ordem ASC LIMIT 1`,
          [tenantId, estagio]
        )
        fase_pipeline_id = r.rows[0]?.id ? Number(r.rows[0].id) : null
      }
      if (!fase_pipeline_id) {
        const r = await client.query(
          `SELECT id FROM crm.fases_pipeline WHERE tenant_id = $1 AND COALESCE(ativo,true) = true ORDER BY ordem ASC, id ASC LIMIT 1`,
          [tenantId]
        )
        fase_pipeline_id = r.rows[0]?.id ? Number(r.rows[0].id) : null
      }
      if (!fase_pipeline_id) throw new Error('Nenhuma fase de pipeline encontrada (crm.fases_pipeline)')

      const insert = await client.query(
        `INSERT INTO crm.oportunidades
          (tenant_id, nome, conta_id, vendedor_id, fase_pipeline_id, valor_estimado, probabilidade, data_prevista, data_fechamento, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id`,
        [
          tenantId,
          nome,
          conta_id,
          vendedor_id,
          fase_pipeline_id,
          valor_estimado,
          probabilidade,
          data_fechamento, // UI usa data_fechamento; aqui vira forecast inicial
          data_fechamento,
          status,
        ]
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

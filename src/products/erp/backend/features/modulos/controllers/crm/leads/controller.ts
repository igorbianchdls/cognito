import { withTransaction } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const tenantId = resolveTenantId(req.headers)

    const primeiro_nome = String(form.get('primeiro_nome') || '').trim()
    if (!primeiro_nome) return Response.json({ success: false, message: 'primeiro_nome é obrigatório' }, { status: 400 })

    const sobrenome = String(form.get('sobrenome') || '').trim() || null
    const empresa = String(form.get('empresa') || '').trim() || null
    const email = String(form.get('email') || '').trim() || null
    const telefone = String(form.get('telefone') || '').trim() || null
    const origem = String(form.get('origem') || '').trim() || null
    const status = String(form.get('status') || '').trim() || null
    const usuario_id_raw = String(form.get('usuario_id') || '').trim()
    const responsavel_id = usuario_id_raw ? Number(usuario_id_raw) : null
    const nome = [primeiro_nome, sobrenome].filter(Boolean).join(' ').trim()

    const result = await withTransaction(async (client) => {
      let origem_id: number | null = null
      if (origem) {
        const existing = await client.query(
          `SELECT id FROM crm.origens_lead WHERE tenant_id = $1 AND LOWER(nome) = LOWER($2) LIMIT 1`,
          [tenantId, origem]
        )
        origem_id = existing.rows[0]?.id ? Number(existing.rows[0].id) : null
        if (!origem_id) {
          const created = await client.query(
            `INSERT INTO crm.origens_lead (tenant_id, nome, ativo) VALUES ($1,$2,true) RETURNING id`,
            [tenantId, origem]
          )
          origem_id = created.rows[0]?.id ? Number(created.rows[0].id) : null
        }
      }

      const insert = await client.query(
        `INSERT INTO crm.leads (tenant_id, nome, empresa, email, telefone, origem_id, status, responsavel_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [tenantId, nome, empresa, email, telefone, origem_id, status, responsavel_id]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar lead')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📇 API /api/modulos/crm/leads POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

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

    const setor = String(form.get('setor') || '').trim() || null
    const site = String(form.get('site') || '').trim() || null
    const telefone = String(form.get('telefone') || '').trim() || null
    const endereco_cobranca = String(form.get('endereco_cobranca') || '').trim() || null
    const usuario_id_raw = String(form.get('usuario_id') || '').trim()
    const responsavel_id = usuario_id_raw ? Number(usuario_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO crm.contas (tenant_id, nome, setor, site, telefone, endereco_cobranca, responsavel_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id`,
        [tenantId, nome, setor, site, telefone, endereco_cobranca, responsavel_id]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar conta')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📇 API /api/modulos/crm/contas POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

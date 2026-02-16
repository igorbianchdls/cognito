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

    // Optional fields
    const nome_fantasia = String(form.get('nome_fantasia') || '').trim() || null
    const razao_social = String(form.get('razao_social') || '').trim() || null
    const cpf_cnpj = String(form.get('cpf_cnpj') || '').trim() || null
    const email = String(form.get('email') || '').trim() || null
    const telefone = String(form.get('telefone') || '').trim() || null
    const canal_origem = String(form.get('canal_origem') || '').trim() || null
    const ativo = String(form.get('ativo') || '').trim().toLowerCase() !== 'false'
    const nomeFantasiaFinal = (nome_fantasia || nome).trim()
    const nomeRazao = (razao_social || null)

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO entidades.clientes (
           tenant_id, nome_fantasia, nome_razao, cnpj_cpf, email, telefone, canal, ativo
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [tenantId, nomeFantasiaFinal, nomeRazao, cpf_cnpj, email, telefone, canal_origem, ativo]
      )
      const inserted = insert.rows[0] as { id: number | string }
      const id = Number(inserted?.id)
      if (!id) throw new Error('Falha ao criar cliente')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('🛒 API /api/modulos/vendas/clientes POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

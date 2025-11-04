import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const nome = String(form.get('nome') || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    // Optional fields
    const nome_fantasia = String(form.get('nome_fantasia') || '').trim() || null
    const razao_social = String(form.get('razao_social') || '').trim() || null
    const cpf_cnpj = String(form.get('cpf_cnpj') || '').trim() || null
    const email = String(form.get('email') || '').trim() || null
    const telefone = String(form.get('telefone') || '').trim() || null
    const vendedor_id_raw = String(form.get('vendedor_id') || '').trim()
    const territorio_id_raw = String(form.get('territorio_id') || '').trim()
    const canal_origem = String(form.get('canal_origem') || '').trim() || null
    const categoria_cliente = String(form.get('categoria_cliente') || '').trim() || null
    const status_cliente = String(form.get('status_cliente') || '').trim() || null
    const cliente_desde = String(form.get('cliente_desde') || '').trim() || null
    const ativo = String(form.get('ativo') || '').trim().toLowerCase() !== 'false'

    const vendedor_id = vendedor_id_raw ? Number(vendedor_id_raw) : null
    const territorio_id = territorio_id_raw ? Number(territorio_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO gestaovendas.clientes (
           nome, nome_fantasia, razao_social, cpf_cnpj, email, telefone,
           vendedor_id, territorio_id, canal_origem, categoria_cliente,
           status_cliente, cliente_desde, ativo
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING id`,
        [nome, nome_fantasia, razao_social, cpf_cnpj, email, telefone,
         vendedor_id, territorio_id, canal_origem, categoria_cliente,
         status_cliente, cliente_desde, ativo]
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


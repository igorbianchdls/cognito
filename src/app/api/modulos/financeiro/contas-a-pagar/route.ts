import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()

    const descricao = String(form.get('descricao') || '').trim()
    const valorRaw = String(form.get('valor') || '').trim()
    const data_lancamento = String(form.get('data_lancamento') || '').trim()
    const data_vencimento = String(form.get('data_vencimento') || '').trim()
    if (!descricao) return Response.json({ success: false, message: 'descricao é obrigatório' }, { status: 400 })
    if (!valorRaw) return Response.json({ success: false, message: 'valor é obrigatório' }, { status: 400 })
    if (!data_lancamento) return Response.json({ success: false, message: 'data_lancamento é obrigatório' }, { status: 400 })
    if (!data_vencimento) return Response.json({ success: false, message: 'data_vencimento é obrigatório' }, { status: 400 })

    const valor = Number(valorRaw)
    if (Number.isNaN(valor)) return Response.json({ success: false, message: 'valor inválido' }, { status: 400 })

    const tenant_id_raw = String(form.get('tenant_id') || '').trim()
    const entidade_id_raw = String(form.get('entidade_id') || '').trim() // fornecedor (compat)
    const fornecedor_id_raw = String(form.get('fornecedor_id') || '').trim() // novo schema
    const categoria_id_raw = String(form.get('categoria_id') || '').trim()
    const conta_financeira_id_raw = String(form.get('conta_financeira_id') || '').trim()
    const status = String(form.get('status') || '').trim() || 'pendente'

    const tenant_id = tenant_id_raw ? Number(tenant_id_raw) : 1
    const entidade_id = entidade_id_raw ? Number(entidade_id_raw) : null
    const fornecedor_id = fornecedor_id_raw ? Number(fornecedor_id_raw) : (entidade_id ?? null)
    const categoria_id = categoria_id_raw ? Number(categoria_id_raw) : null
    const conta_financeira_id = conta_financeira_id_raw ? Number(conta_financeira_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO financeiro.lancamentos_financeiros (
           tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status,
           entidade_id, fornecedor_id, categoria_id, conta_financeira_id
         ) VALUES ($1, 'conta_a_pagar', $2, $3, $4, $5, $6,
                   $7, $8, $9, $10)
         RETURNING id`,
        [tenant_id, descricao, Math.abs(valor), data_lancamento, data_vencimento, status, entidade_id, fornecedor_id, categoria_id, conta_financeira_id]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar conta a pagar')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/contas-a-pagar POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

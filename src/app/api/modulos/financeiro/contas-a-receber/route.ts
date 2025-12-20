import { withTransaction } from '@/lib/postgres'
import { inngest } from '@/lib/inngest'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const ct = (req.headers.get('content-type') || '').toLowerCase()
    const toStr = (v: unknown) => (v === null || v === undefined ? '' : String(v))
    const toNum = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : NaN }

    let payload: Record<string, unknown>
    if (ct.includes('application/json')) {
      payload = await req.json() as Record<string, unknown>
    } else {
      const form = await req.formData()
      payload = Object.fromEntries(Array.from(form.keys()).map(k => [k, form.get(k)]))
    }

    const tenant_id = toNum(payload['tenant_id'] ?? 1) || 1
    const cliente_id = toNum(payload['cliente_id'] ?? payload['entidade_id'])
    const numero_documento = toStr(payload['numero_documento'] || `CR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`)
    const tipo_documento = toStr(payload['tipo_documento'] || 'fatura')
    const status = toStr(payload['status'] || 'pendente')
    const descricao = toStr(payload['descricao'] || 'Conta a receber')
    const data_lancamento = toStr(payload['data_lancamento'] || new Date().toISOString().slice(0,10))
    const data_documento = toStr(payload['data_documento'] || payload['data_emissao'] || data_lancamento)
    const data_vencimento = toStr(payload['data_vencimento'] || '')
    const valor = toNum(payload['valor'] ?? NaN)
    const categoria_receita_id = payload['categoria_id'] !== undefined && payload['categoria_id'] !== null ? toNum(payload['categoria_id']) : null
    const centro_lucro_id = payload['centro_lucro_id'] !== undefined && payload['centro_lucro_id'] !== null ? toNum(payload['centro_lucro_id']) : null
    const departamento_id = payload['departamento_id'] !== undefined && payload['departamento_id'] !== null ? toNum(payload['departamento_id']) : null
    const filial_id = payload['filial_id'] !== undefined && payload['filial_id'] !== null ? toNum(payload['filial_id']) : null
    const unidade_negocio_id = payload['unidade_negocio_id'] !== undefined && payload['unidade_negocio_id'] !== null ? toNum(payload['unidade_negocio_id']) : null

    if (!cliente_id || cliente_id <= 0) return Response.json({ success: false, message: 'cliente_id é obrigatório' }, { status: 400 })
    if (!data_vencimento) return Response.json({ success: false, message: 'data_vencimento é obrigatório' }, { status: 400 })
    if (!Number.isFinite(valor)) return Response.json({ success: false, message: 'valor inválido' }, { status: 400 })

    const result = await withTransaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO financeiro.contas_receber (
           tenant_id, cliente_id, categoria_receita_id, centro_lucro_id, departamento_id, filial_id, unidade_negocio_id,
           numero_documento, tipo_documento, status,
           data_documento, data_lancamento, data_vencimento,
           valor_bruto, valor_desconto, valor_impostos, valor_liquido,
           observacao
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,
           $8,$9,$10,
           $11,$12,$13,
           $14,0,0,$15,
           $16
         ) RETURNING id`,
        [
          tenant_id, cliente_id, categoria_receita_id, centro_lucro_id, departamento_id, filial_id, unidade_negocio_id,
          numero_documento, tipo_documento, status,
          data_documento, data_lancamento, data_vencimento,
          Math.abs(valor), Math.abs(valor),
          descricao
        ]
      )
      const id = Number(ins.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar conta a receber')
      return { id }
    })

    try { await inngest.send({ name: 'financeiro/contas_a_receber/criada', data: { conta_receber_id: result.id } }) } catch {}
    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/contas-a-receber POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

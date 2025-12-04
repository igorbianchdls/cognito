import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    // JSON mode: create header + lines in a single transaction
    if (contentType.includes('application/json')) {
      const body = await req.json() as Record<string, unknown>
      const toStr = (v: unknown) => (v === null || v === undefined ? '' : String(v))
      const toNum = (v: unknown) => {
        const n = Number(v)
        return Number.isFinite(n) ? n : NaN
      }
      const fornecedor_id = toNum(body['fornecedor_id'])
      const categoria_id = body['categoria_id'] !== undefined && body['categoria_id'] !== null ? toNum(body['categoria_id']) : null
      const descricao = toStr(body['descricao'] || 'Conta a pagar').trim()
      const statusRaw = toStr(body['status'] || 'pendente').trim().toLowerCase()
      const status = ['pendente', 'pago', 'cancelado'].includes(statusRaw) ? statusRaw : 'pendente'
      const data_lancamento = toStr(body['data_lancamento'] || new Date().toISOString().slice(0,10))
      const data_vencimento = toStr(body['data_vencimento'] || '')
      const tenant_id = body['tenant_id'] !== undefined && body['tenant_id'] !== null ? toNum(body['tenant_id']) : 1
      const linhas = Array.isArray(body['linhas']) ? (body['linhas'] as Array<Record<string, unknown>>) : []
      let valor = body['valor'] !== undefined && body['valor'] !== null ? toNum(body['valor']) : NaN

      if (!fornecedor_id || fornecedor_id <= 0) return Response.json({ success: false, message: 'fornecedor_id é obrigatório' }, { status: 400 })
      if (!data_vencimento) return Response.json({ success: false, message: 'data_vencimento é obrigatório' }, { status: 400 })

      // If lines provided, compute sum of valor_liquido
      const somaLinhas = linhas.reduce((acc, ln) => acc + (Number(ln['valor_liquido'] ?? 0) || 0), 0)
      if (!Number.isFinite(valor)) valor = somaLinhas

      const result = await withTransaction(async (client) => {
        // Header
        const ins = await client.query(
          `INSERT INTO financeiro.lancamentos_financeiros (
             tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status,
             fornecedor_id, categoria_id
           ) VALUES ($1, 'conta_a_pagar', $2, $3, $4, $5, $6,
                     $7, $8)
           RETURNING id`,
          [tenant_id, descricao, Math.abs(valor), data_lancamento, data_vencimento, status, fornecedor_id, categoria_id]
        )
        const id = Number(ins.rows[0]?.id)
        if (!id) throw new Error('Falha ao criar conta a pagar')

        // Lines
        if (linhas.length > 0) {
          const cols = ['lancamento_id','tipo_linha','numero_parcela','valor_bruto','juros','multa','desconto','valor_liquido','data_vencimento','data_pagamento','conta_financeira_id','extrato_transacao_id','status','observacao']
          const valuesSql: string[] = []
          const params: unknown[] = []
          let i = 1
          for (const ln of linhas) {
            valuesSql.push(`($${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++})`)
            params.push(
              id,
              ln['tipo_linha'] ?? null,
              ln['numero_parcela'] ?? null,
              ln['valor_bruto'] ?? null,
              ln['juros'] ?? null,
              ln['multa'] ?? null,
              ln['desconto'] ?? null,
              ln['valor_liquido'] ?? null,
              ln['data_vencimento'] ?? null,
              ln['data_pagamento'] ?? null,
              ln['conta_financeira_id'] ?? null,
              ln['extrato_transacao_id'] ?? null,
              (typeof ln['status'] === 'string' ? String(ln['status']).toLowerCase() : 'pendente'),
              ln['observacao'] ?? null,
            )
          }
          await client.query(
            `INSERT INTO financeiro.lancamentos_financeiros_linhas (${cols.join(',')})
             VALUES ${valuesSql.join(',')}`,
            params
          )
        }

        return { id, linhas_count: linhas.length }
      })

      return Response.json({ success: true, id: result.id, linhas_count: result.linhas_count })
    }

    // Default legacy FormData mode (header only)
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

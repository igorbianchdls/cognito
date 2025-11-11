import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const ct = req.headers.get('content-type') || ''
    // JSON commit path (preview → criar)
    if (ct.includes('application/json')) {
      const body = await req.json() as {
        lancamento_origem_id: string
        conta_financeira_id: string
        metodo_pagamento_id: string
        descricao: string
      }
      const apId = Number(body.lancamento_origem_id)
      if (!apId || !body.conta_financeira_id || !body.metodo_pagamento_id || !body.descricao) {
        return Response.json({ success: false, message: 'lancamento_origem_id, conta_financeira_id, metodo_pagamento_id e descricao são obrigatórios' }, { status: 400 })
      }

      const result = await withTransaction(async (client) => {
        // 1) Buscar AP (valor total, tenant, entidade, categoria) e soma de pagamentos
        const apRow = await client.query(
          `SELECT lf.id, lf.tenant_id, lf.valor::numeric AS total, lf.entidade_id, lf.categoria_id
             FROM financeiro.lancamentos_financeiros lf
            WHERE lf.id = $1 AND LOWER(lf.tipo) = 'conta_a_pagar'
            LIMIT 1`,
          [apId]
        )
        if (apRow.rowCount === 0) throw new Error('Conta a pagar não encontrada')
        const ap = apRow.rows[0] as { id: number; tenant_id: number | null; total: number; entidade_id: number | null; categoria_id: number | null }

        const pagosRow = await client.query(
          `SELECT COALESCE(SUM(valor),0)::numeric AS pagos
             FROM financeiro.lancamentos_financeiros
            WHERE LOWER(tipo) = 'pagamento_efetuado' AND lancamento_origem_id = $1`,
          [apId]
        )
        const pagos: number = Number(pagosRow.rows[0]?.pagos || 0)
        const pendente = Math.max(0, Number(ap.total || 0) - pagos)
        if (pendente <= 0) throw new Error('Título já está totalmente pago')

        const today = new Date().toISOString().slice(0, 10)
        const tenant = ap.tenant_id ?? 1

        // 2) Atualizar AP com conta_financeira_id e metodo_pagamento_id
        await client.query(
          `UPDATE financeiro.lancamentos_financeiros
              SET conta_financeira_id = $1, metodo_pagamento_id = $2
            WHERE id = $3`,
          [Number(body.conta_financeira_id), Number(body.metodo_pagamento_id), apId]
        )

        // 3) Inserir pagamento
        const ins = await client.query(
          `INSERT INTO financeiro.lancamentos_financeiros (
             tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status,
             entidade_id, categoria_id, conta_financeira_id, lancamento_origem_id
           ) VALUES ($1, 'pagamento_efetuado', $2, $3, $4, NULL, 'pago', $5, $6, $7, $8)
           RETURNING id`,
          [tenant, `Pagamento AP #${apId} - ${body.descricao}`.slice(0, 255), Math.abs(pendente), today,
           ap.entidade_id ?? null, ap.categoria_id ?? null, Number(body.conta_financeira_id), apId]
        )
        const pagamentoId = Number(ins.rows[0]?.id)
        if (!pagamentoId) throw new Error('Falha ao criar pagamento efetuado')

        // 4) Baixar status da AP
        const pagos2Row = await client.query(
          `SELECT COALESCE(SUM(valor),0)::numeric AS pagos
             FROM financeiro.lancamentos_financeiros
            WHERE LOWER(tipo) = 'pagamento_efetuado' AND lancamento_origem_id = $1`,
          [apId]
        )
        const pagos2: number = Number(pagos2Row.rows[0]?.pagos || 0)
        const novoStatus = pagos2 >= Number(ap.total || 0) ? 'pago' : (pagos2 > 0 ? 'parcial' : 'pendente')
        await client.query(`UPDATE financeiro.lancamentos_financeiros SET status = $1 WHERE id = $2`, [novoStatus, apId])

        return { id: pagamentoId }
      })

      return Response.json({ success: true, id: result.id })
    }

    // Mantém compatibilidade com FormData (caminho antigo)
    const form = await req.formData()
    const descricao = String(form.get('descricao') || '').trim()
    const valorRaw = String(form.get('valor') || '').trim()
    const data_lancamento = String(form.get('data_lancamento') || '').trim()
    if (!descricao) return Response.json({ success: false, message: 'descricao é obrigatório' }, { status: 400 })
    if (!valorRaw) return Response.json({ success: false, message: 'valor é obrigatório' }, { status: 400 })
    if (!data_lancamento) return Response.json({ success: false, message: 'data_lancamento é obrigatório' }, { status: 400 })

    const valor = Number(valorRaw)
    if (Number.isNaN(valor)) return Response.json({ success: false, message: 'valor inválido' }, { status: 400 })

    const tenant_id_raw = String(form.get('tenant_id') || '').trim()
    const entidade_id_raw = String(form.get('entidade_id') || '').trim() // fornecedor
    const categoria_id_raw = String(form.get('categoria_id') || '').trim()
    const conta_financeira_id_raw = String(form.get('conta_financeira_id') || '').trim()
    const status = String(form.get('status') || '').trim() || null

    const tenant_id = tenant_id_raw ? Number(tenant_id_raw) : 1
    const entidade_id = entidade_id_raw ? Number(entidade_id_raw) : null
    const categoria_id = categoria_id_raw ? Number(categoria_id_raw) : null
    const conta_financeira_id = conta_financeira_id_raw ? Number(conta_financeira_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO financeiro.lancamentos_financeiros (
           tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status, entidade_id, categoria_id, conta_financeira_id
         ) VALUES ($1, 'pagamento_efetuado', $2, $3, $4, NULL, $5, $6, $7, $8)
         RETURNING id`,
        [tenant_id, descricao, Math.abs(valor), data_lancamento, status, entidade_id, categoria_id, conta_financeira_id]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar pagamento efetuado')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/pagamentos-efetuados POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

import { runQuery, withTransaction } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CONTAS_APAGAR_WHITELIST = new Set([
  'descricao',
  'data_vencimento',
  'data_emissao',
  'data_pagamento',
  'valor_total',
  'status',
  'tipo_titulo',
  'categoria_id',
  'conta_financeira_id',
  'centro_custo_id',
])

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[parts.length - 1]
    if (!id) return Response.json({ success: false, message: 'ID é obrigatório' }, { status: 400 })

    const body = await req.json() as Record<string, unknown>
    const entries = Object.entries(body).filter(([k, v]) => CONTAS_APAGAR_WHITELIST.has(k) && v !== undefined)

    if (entries.length === 0) {
      return Response.json({ success: false, message: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    // Normalizações simples
    const statusVal = body['status'] as string | undefined
    if (statusVal && typeof statusVal === 'string') {
      body['status'] = statusVal.toLowerCase()
    }

    let idx = 1
    const sets: string[] = []
    const paramsArr: unknown[] = []
    for (const [key, value] of Object.entries(body)) {
      if (!CONTAS_APAGAR_WHITELIST.has(key) || value === undefined) continue
      sets.push(`${key} = $${idx}`)
      paramsArr.push(value)
      idx += 1
    }
    paramsArr.push(id)

    const sql = `UPDATE financeiro.contas_pagar SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id`
    await runQuery(sql, paramsArr)

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/modulos/financeiro/contas-a-pagar/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idStr = parts[parts.length - 1]
    const id = Number(idStr)
    if (!Number.isFinite(id) || id <= 0) {
      return Response.json({ success: false, message: 'ID inválido' }, { status: 400 })
    }

    await withTransaction(async (client) => {
      // Remover linhas dependentes (pagamentos x conta)
      try { await client.query(`DELETE FROM financeiro.pagamentos_efetuados_linhas WHERE conta_pagar_id = $1`, [id]) } catch {}
      try { await client.query(`DELETE FROM financeiro.contas_pagar_linhas WHERE conta_pagar_id = $1`, [id]) } catch {}
      await client.query(`DELETE FROM financeiro.contas_pagar WHERE id = $1`, [id])
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/modulos/financeiro/contas-a-pagar/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

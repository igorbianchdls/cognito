import { NextRequest } from 'next/server'
import { runQuery, withTransaction } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function GET() {
  try {
    const sql = `
      SELECT id, tenant_id, fornecedor_id, categoria_id, valor_total, data_pedido, data_prevista_entrega, status, observacao, criado_em
      FROM administrativo.compras
      ORDER BY data_pedido DESC
      LIMIT 50
    `
    const rows = await runQuery<Record<string, unknown>>(sql)
    return Response.json({ success: true, rows })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}

type PostBody = {
  tenant_id: number | string
  fornecedor_id?: number | string
  categoria_id?: number | string
  valor_total: number
  data_pedido: string
  data_prevista_entrega?: string
  observacao?: string
  criado_por?: number | string
  conta_financeira_id?: number | string
  parcelas?: number
  primeiro_vencimento?: string
  data_vencimento?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<PostBody>

    const tenant_id = body.tenant_id
    const fornecedor_id = body.fornecedor_id
    const categoria_id = body.categoria_id
    const valor_total = Number(body.valor_total)
    const data_pedido = body.data_pedido
    const data_prevista_entrega = body.data_prevista_entrega
    const observacao = body.observacao || ''
    const criado_por = body.criado_por
    const conta_financeira_id = body.conta_financeira_id
    const parcelas = Math.max(1, Number(body.parcelas || 1))
    const data_vencimento_body = body.data_vencimento
    const primeiro_vencimento = body.primeiro_vencimento || data_vencimento_body || data_prevista_entrega || data_pedido

    if (!tenant_id || !valor_total || !data_pedido) {
      return Response.json({ success: false, message: 'tenant_id, valor_total e data_pedido são obrigatórios' }, { status: 400 })
    }

    const result = await withTransaction(async (client) => {
      // Insert compra
      const cols: string[] = ['tenant_id', 'valor_total', 'data_pedido']
      const vals: unknown[] = [tenant_id, valor_total, data_pedido]
      if (fornecedor_id !== undefined) { cols.push('fornecedor_id'); vals.push(fornecedor_id) }
      if (categoria_id !== undefined) { cols.push('categoria_id'); vals.push(categoria_id) }
      if (data_prevista_entrega !== undefined) { cols.push('data_prevista_entrega'); vals.push(data_prevista_entrega) }
      if (observacao) { cols.push('observacao'); vals.push(observacao) }
      if (criado_por !== undefined) { cols.push('criado_por'); vals.push(criado_por) }

      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ')
      const sqlCompra = `INSERT INTO administrativo.compras (${cols.join(', ')}) VALUES (${placeholders}) RETURNING id, criado_em`
      const compraRes = await client.query(sqlCompra, vals)
      const compra = compraRes.rows[0]
      const compra_id = compra.id as number

      // Create 1..N contas a pagar
      const createdLancamentos: Array<{ id: number; valor: number; data_vencimento: string }> = []
      const totalParcelas = parcelas
      const valorParcelaBase = Math.floor((valor_total / totalParcelas) * 100) / 100
      let acumulado = 0

      const primeiroVencimentoStr: string = String(primeiro_vencimento)
      const startDate = new Date(primeiroVencimentoStr)
      if (isNaN(startDate.getTime())) {
        throw new Error('primeiro_vencimento inválido')
      }

      for (let i = 0; i < totalParcelas; i++) {
        const isLast = i === totalParcelas - 1
        const valorParcela = isLast ? Number((valor_total - acumulado).toFixed(2)) : valorParcelaBase
        acumulado = Number((acumulado + valorParcela).toFixed(2))

        const venc = new Date(startDate)
        venc.setMonth(venc.getMonth() + i)
        const yyyy = venc.getFullYear()
        const mm = String(venc.getMonth() + 1).padStart(2, '0')
        const dd = String(venc.getDate()).padStart(2, '0')
        const vencStr = `${yyyy}-${mm}-${dd}`

        const lcols = ['tenant_id', 'compras_id', 'entidade_id', 'categoria_id', 'descricao', 'tipo', 'status', 'valor', 'data_lancamento', 'data_vencimento']
        const lvals: unknown[] = [tenant_id, compra_id, fornecedor_id ?? null, categoria_id ?? null, (observacao || `Compra #${compra_id}`) + (totalParcelas > 1 ? ` (parcela ${i + 1}/${totalParcelas})` : ''), 'conta_a_pagar', 'pendente', valorParcela, new Date().toISOString().slice(0, 10), vencStr]
        if (conta_financeira_id !== undefined) { lcols.push('conta_financeira_id'); lvals.push(conta_financeira_id) }
        if (criado_por !== undefined) { lcols.push('criado_por'); lvals.push(criado_por) }

        const lph = lvals.map((_, j) => `$${j + 1}`).join(', ')
        const sqlLanc = `INSERT INTO financeiro.lancamentos_financeiros (${lcols.join(', ')}) VALUES (${lph}) RETURNING id`
        const lancRes = await client.query(sqlLanc, lvals)
        createdLancamentos.push({ id: lancRes.rows[0].id as number, valor: valorParcela, data_vencimento: vencStr })
      }

      return { compra_id, compra, createdLancamentos }
    })

    return Response.json({ success: true, ...result })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}


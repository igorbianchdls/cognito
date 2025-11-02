import { NextRequest } from 'next/server'
import { runQuery, withTransaction } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function GET() {
  try {
    const sql = `
      SELECT id, tenant_id, fornecedor_id, categoria_id, descricao, valor_total, data_vencimento, status, criado_em
      FROM administrativo.despesas
      ORDER BY criado_em DESC
      LIMIT 10
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
  descricao: string
  valor_total: number
  data_vencimento: string
  criado_por?: number | string
  conta_financeira_id?: number | string
  parcelas?: number
  primeiro_vencimento?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<PostBody>

    const tenant_id = body.tenant_id
    const fornecedor_id = body.fornecedor_id
    const categoria_id = body.categoria_id
    const descricao = body.descricao
    const valor_total = Number(body.valor_total)
    const data_vencimento = body.data_vencimento
    const criado_por = body.criado_por
    const conta_financeira_id = body.conta_financeira_id
    const parcelas = Math.max(1, Number(body.parcelas || 1))
    const primeiro_vencimento = body.primeiro_vencimento || data_vencimento

    if (!tenant_id || !descricao || !valor_total || !data_vencimento) {
      return Response.json({ success: false, message: 'tenant_id, descricao, valor_total e data_vencimento são obrigatórios' }, { status: 400 })
    }

    const result = await withTransaction(async (client) => {
      const insertDespesaCols: string[] = ['tenant_id', 'descricao', 'valor_total', 'data_vencimento']
      const insertDespesaVals: unknown[] = [tenant_id, descricao, valor_total, data_vencimento]
      if (fornecedor_id !== undefined) { insertDespesaCols.push('fornecedor_id'); insertDespesaVals.push(fornecedor_id) }
      if (categoria_id !== undefined) { insertDespesaCols.push('categoria_id'); insertDespesaVals.push(categoria_id) }
      if (criado_por !== undefined) { insertDespesaCols.push('criado_por'); insertDespesaVals.push(criado_por) }

      const despPlaceholders = insertDespesaVals.map((_, i) => `$${i + 1}`).join(', ')
      const sqlDesp = `INSERT INTO administrativo.despesas (${insertDespesaCols.join(', ')}) VALUES (${despPlaceholders}) RETURNING id, criado_em`
      const despRes = await client.query(sqlDesp, insertDespesaVals)
      const despesa = despRes.rows[0]
      const despesa_id = despesa.id as number

      const createdLancamentos: Array<{ id: number; valor: number; data_vencimento: string }> = []

      // Parcelamento simples (mensal), se solicitado
      const totalParcelas = parcelas
      const valorParcelaBase = Math.floor((valor_total / totalParcelas) * 100) / 100
      let acumulado = 0

      const primeiroVencimentoStr: string = (primeiro_vencimento as string)
      const startDate = new Date(primeiroVencimentoStr)
      if (isNaN(startDate.getTime())) {
        throw new Error('primeiro_vencimento inválido')
      }

      const createdContabeis: Array<{ lcId: number; lfId: number }> = []

      for (let i = 0; i < totalParcelas; i++) {
        // Ajuste da última parcela para fechar o total
        const isLast = i === totalParcelas - 1
        const valorParcela = isLast ? Number((valor_total - acumulado).toFixed(2)) : valorParcelaBase
        acumulado = Number((acumulado + valorParcela).toFixed(2))

        const venc = new Date(startDate)
        venc.setMonth(venc.getMonth() + i)
        const yyyy = venc.getFullYear()
        const mm = String(venc.getMonth() + 1).padStart(2, '0')
        const dd = String(venc.getDate()).padStart(2, '0')
        const vencStr = `${yyyy}-${mm}-${dd}`

        const cols = ['tenant_id', 'despesa_id', 'entidade_id', 'categoria_id', 'descricao', 'tipo', 'status', 'valor', 'data_lancamento', 'data_vencimento']
        const vals: unknown[] = [tenant_id, despesa_id, fornecedor_id ?? null, categoria_id ?? null, descricao + (totalParcelas > 1 ? ` (parcela ${i + 1}/${totalParcelas})` : ''), 'conta_a_pagar', 'pendente', valorParcela, new Date().toISOString().slice(0, 10), vencStr]
        if (conta_financeira_id !== undefined) { cols.push('conta_financeira_id'); vals.push(conta_financeira_id) }
        if (criado_por !== undefined) { cols.push('criado_por'); vals.push(criado_por) }

        const placeholders = vals.map((_, j) => `$${j + 1}`).join(', ')
        const sqlLanc = `INSERT INTO financeiro.lancamentos_financeiros (${cols.join(', ')}) VALUES (${placeholders}) RETURNING id`
        const lancRes = await client.query(sqlLanc, vals)
        const lfId: number = Number(lancRes.rows[0].id)
        createdLancamentos.push({ id: lfId, valor: valorParcela, data_vencimento: vencStr })

        // Resolve regra contábil para conta_a_pagar pela categoria
        if (categoria_id !== undefined) {
          const regraSql = `
            SELECT r.conta_debito_id, r.conta_credito_id
              FROM contabilidade.regras_contabeis r
             WHERE r.tenant_id = $1
               AND r.origem = 'conta_a_pagar'
               AND r.categoria_financeira_id = $2
               AND r.automatico = TRUE
               AND r.ativo = TRUE
             ORDER BY r.id ASC
             LIMIT 1`;
          const regraRes = await client.query(regraSql, [tenant_id, categoria_id])
          if (regraRes.rows.length > 0) {
            const contaDebitoId = Number(regraRes.rows[0].conta_debito_id)
            const contaCreditoId = Number(regraRes.rows[0].conta_credito_id)

            // Cabeçalho contábil vinculado ao lançamento financeiro
            const insertLcSql = `
              INSERT INTO contabilidade.lancamentos_contabeis
                (tenant_id, data_lancamento, historico, fornecedor_id, conta_financeira_id, total_debitos, total_creditos, lancamento_financeiro_id)
              VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
              RETURNING id`;
            const lcVals = [tenant_id, new Date().toISOString().slice(0, 10), String(descricao), fornecedor_id ?? null, conta_financeira_id ?? null, valorParcela, lfId]
            const lcRes = await client.query(insertLcSql, lcVals)
            const lcId: number = Number(lcRes.rows[0].id)

            // Linhas D/C (preenche ambas colunas de vínculo)
            const insertLinhaSql = `
              INSERT INTO contabilidade.lancamentos_contabeis_linhas
                (lancamento_id, lancamento_contabil_id, conta_id, debito, credito, historico)
              VALUES ($1, $2, $3, $4, $5, $6)`
            await client.query(insertLinhaSql, [lcId, lcId, contaDebitoId, valorParcela, 0, String(descricao)])
            await client.query(insertLinhaSql, [lcId, lcId, contaCreditoId, 0, valorParcela, String(descricao)])
            createdContabeis.push({ lcId, lfId })
          }
        }
      }

      return { despesa_id, despesa, createdLancamentos, createdContabeis }
    })

    return Response.json({ success: true, ...result })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}

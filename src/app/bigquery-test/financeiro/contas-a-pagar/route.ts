import { NextRequest } from 'next/server'
import { withTransaction, runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type PostBody = {
  tenant_id: number | string
  categoria_id: number | string
  entidade_id?: number | string
  valor: number | string
  data_lancamento?: string
  data_vencimento?: string
  descricao?: string
  conta_financeira_id?: number | string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<PostBody>

    const tenant_id = Number(body.tenant_id)
    const categoria_id = Number(body.categoria_id)
    const entidade_id = body.entidade_id !== undefined ? Number(body.entidade_id) : null
    const valorAbs = Math.abs(Number(body.valor))
    const data_lancamento = body.data_lancamento || new Date().toISOString().slice(0, 10)
    const data_vencimento = body.data_vencimento || data_lancamento
    const descricao = body.descricao || ''
    const conta_financeira_id = body.conta_financeira_id !== undefined ? Number(body.conta_financeira_id) : null

    if (!Number.isFinite(tenant_id) || !Number.isFinite(categoria_id) || !Number.isFinite(valorAbs)) {
      return Response.json({ success: false, message: 'tenant_id, categoria_id e valor são obrigatórios e devem ser numéricos' }, { status: 400 })
    }

    const out = await withTransaction(async (client) => {
      // 1) Cria o lançamento financeiro (conta_a_pagar)
      const insertLfSql = `
        INSERT INTO financeiro.lancamentos_financeiros
          (tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status, entidade_id, categoria_id, conta_financeira_id)
        VALUES ($1, 'conta_a_pagar', $2, $3, $4, $5, 'pendente', $6, $7, $8)
        RETURNING id`;
      const lfVals = [tenant_id, descricao, valorAbs, data_lancamento, data_vencimento, entidade_id, categoria_id, conta_financeira_id]
      const lfRes = await client.query(insertLfSql, lfVals)
      const lfId = Number(lfRes.rows[0]?.id)

      // 2) Resolve regra contábil por origem + categoria
      const regraSql = `
        SELECT r.id, r.conta_debito_id, r.conta_credito_id
          FROM contabilidade.regras_contabeis r
         WHERE r.tenant_id = $1
           AND r.origem = 'conta_a_pagar'
           AND r.categoria_financeira_id = $2
           AND r.automatico = TRUE
           AND r.ativo = TRUE
         ORDER BY r.id ASC
         LIMIT 1`;
      const regraRows = await client.query(regraSql, [tenant_id, categoria_id])
      if (regraRows.rows.length === 0) {
        throw new Error('Nenhuma regra contábil ativa para conta_a_pagar + categoria')
      }
      const contaDebitoId = Number(regraRows.rows[0].conta_debito_id)
      const contaCreditoId = Number(regraRows.rows[0].conta_credito_id)

      // 3) Cria o lançamento contábil (cabeçalho + linhas) com FK lancamento_financeiro_id
      const insertLcSql = `
        INSERT INTO contabilidade.lancamentos_contabeis
          (tenant_id, data_lancamento, historico, fornecedor_id, conta_financeira_id, total_debitos, total_creditos, lancamento_financeiro_id)
        VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
        RETURNING id`;
      const lcVals = [tenant_id, data_lancamento, descricao, entidade_id, conta_financeira_id, valorAbs, lfId]
      const lcRes = await client.query(insertLcSql, lcVals)
      const lcId = Number(lcRes.rows[0]?.id)

      const insertLinhaSql = `INSERT INTO contabilidade.lancamentos_contabeis_linhas (lancamento_id, lancamento_contabil_id, conta_id, debito, credito, historico) VALUES ($1, $2, $3, $4, $5, $6)`
      await client.query(insertLinhaSql, [lcId, lcId, contaDebitoId, valorAbs, 0, descricao])
      await client.query(insertLinhaSql, [lcId, lcId, contaCreditoId, 0, valorAbs, descricao])

      return { lfId, lcId }
    })

    return Response.json({ success: true, ...out })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sql = `
      SELECT id, tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status, entidade_id, categoria_id, conta_financeira_id, criado_em
        FROM financeiro.lancamentos_financeiros
       WHERE tipo = 'conta_a_pagar'
       ORDER BY criado_em DESC
       LIMIT 50`
    const rows = await runQuery<Record<string, unknown>>(sql)
    return Response.json({ success: true, rows })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}

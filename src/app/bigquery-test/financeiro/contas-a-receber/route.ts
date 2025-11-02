import { NextRequest } from 'next/server'
import { withTransaction, runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type PostBody = {
  tenant_id: number | string
  cliente_id?: number | string
  entidade_id?: number | string
  categoria_id: number | string
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
    const entidade_id = body.cliente_id !== undefined ? Number(body.cliente_id) : (body.entidade_id !== undefined ? Number(body.entidade_id) : null)
    const valorAbs = Math.abs(Number(body.valor))
    const data_lancamento = body.data_lancamento || new Date().toISOString().slice(0, 10)
    const data_vencimento = body.data_vencimento || data_lancamento
    const descricao = body.descricao || ''
    const conta_financeira_id = body.conta_financeira_id !== undefined ? Number(body.conta_financeira_id) : null

    if (!Number.isFinite(tenant_id) || !Number.isFinite(categoria_id) || !Number.isFinite(valorAbs)) {
      return Response.json({ success: false, message: 'tenant_id, categoria_id e valor são obrigatórios e numéricos' }, { status: 400 })
    }

    const out = await withTransaction(async (client) => {
      // 1) Cria o lançamento financeiro (conta_a_receber)
      const insertLfSql = `
        INSERT INTO financeiro.lancamentos_financeiros
          (tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status, entidade_id, categoria_id, conta_financeira_id)
        VALUES ($1, 'conta_a_receber', $2, $3, $4, $5, 'pendente', $6, $7, $8)
        RETURNING id`;
      const lfVals = [tenant_id, descricao, valorAbs, data_lancamento, data_vencimento, entidade_id, categoria_id, conta_financeira_id]
      const lfRes = await client.query(insertLfSql, lfVals)
      const lfId = Number(lfRes.rows[0]?.id)

      // 2) Idempotência contábil por (tenant, lfId)
      const exists = await client.query(`SELECT 1 FROM contabilidade.lancamentos_contabeis WHERE tenant_id = $1 AND lancamento_financeiro_id = $2 LIMIT 1`, [tenant_id, lfId])
      if (!exists.rowCount) {
        // 3) Regra contábil para conta_a_receber + categoria
        const regra = await client.query(
          `SELECT r.conta_debito_id, r.conta_credito_id FROM contabilidade.regras_contabeis r
           WHERE r.tenant_id = $1 AND r.origem = 'conta_a_receber' AND r.categoria_financeira_id = $2 AND r.automatico = TRUE AND r.ativo = TRUE
           ORDER BY r.id ASC LIMIT 1`,
          [tenant_id, categoria_id]
        )
        if (regra.rows.length === 0) throw new Error('Nenhuma regra contábil ativa para conta_a_receber + categoria')
        const contaDebitoId = Number(regra.rows[0].conta_debito_id)
        const contaCreditoId = Number(regra.rows[0].conta_credito_id)

        // 4) Cabeçalho + linhas
        const lcRes = await client.query(
          `INSERT INTO contabilidade.lancamentos_contabeis (tenant_id, data_lancamento, historico, cliente_id, conta_financeira_id, total_debitos, total_creditos, lancamento_financeiro_id)
           VALUES ($1, $2, $3, $4, $5, $6, $6, $7) RETURNING id`,
          [tenant_id, data_lancamento, descricao, entidade_id, conta_financeira_id, valorAbs, lfId]
        )
        const lcId = Number(lcRes.rows[0].id)
        await client.query(
          `INSERT INTO contabilidade.lancamentos_contabeis_linhas (lancamento_id, lancamento_contabil_id, conta_id, debito, credito, historico)
           VALUES ($1, $1, $2, $3, 0, $4),
                  ($1, $1, $5, 0, $3, $4)`,
          [lcId, contaDebitoId, valorAbs, descricao, contaCreditoId]
        )
      }

      return { lfId }
    })

    return Response.json({ success: true, ...out })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const rows = await runQuery<Record<string, unknown>>(`
      SELECT id, tenant_id, entidade_id AS cliente_id, categoria_id, descricao, valor, data_lancamento, data_vencimento, status, criado_em
      FROM financeiro.lancamentos_financeiros
      WHERE tipo = 'conta_a_receber'
      ORDER BY criado_em DESC
      LIMIT 10`)
    return Response.json({ success: true, rows })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}


import { NextRequest } from 'next/server'
import { runQuery, withTransaction } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type Body = { lancamento_financeiro_id: number | string }

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Body>
    const lfIdRaw = body.lancamento_financeiro_id
    if (!lfIdRaw) {
      return Response.json({ success: false, message: 'lancamento_financeiro_id é obrigatório' }, { status: 400 })
    }
    const lfId = Number(lfIdRaw)
    if (!Number.isFinite(lfId)) {
      return Response.json({ success: false, message: 'lancamento_financeiro_id inválido' }, { status: 400 })
    }

    // Carrega o lançamento financeiro (apenas conta_a_pagar neste passo)
    const lfSql = `
      SELECT lf.id, lf.tenant_id, lf.tipo, lf.descricao, lf.valor, ABS(lf.valor) AS valor_abs,
             lf.data_lancamento, lf.categoria_id, lf.entidade_id, lf.conta_financeira_id
        FROM financeiro.lancamentos_financeiros lf
       WHERE lf.id = $1
       LIMIT 1`;
    const [lf] = await runQuery<Record<string, unknown>>(lfSql, [lfId])
    if (!lf) {
      return Response.json({ success: false, message: 'Lançamento financeiro não encontrado' }, { status: 404 })
    }
    const tipo = String(lf['tipo'] || '')
    if (tipo !== 'conta_a_pagar') {
      return Response.json({ success: false, message: 'Apenas conta_a_pagar suportado neste endpoint' }, { status: 422 })
    }

    const tenantId = Number(lf['tenant_id'])
    const categoriaId = Number(lf['categoria_id'])
    const fornecedorId = lf['entidade_id'] !== null && lf['entidade_id'] !== undefined ? Number(lf['entidade_id']) : null
    const contaFinanceiraId = lf['conta_financeira_id'] !== null && lf['conta_financeira_id'] !== undefined ? Number(lf['conta_financeira_id']) : null
    const valorAbs = Number(lf['valor_abs'] ?? 0)
    const dataLanc = lf['data_lancamento'] as string
    const historico = String(lf['descricao'] ?? '')

    // Idempotência por FK: já existe?
    const idempSql = `SELECT id FROM contabilidade.lancamentos_contabeis WHERE tenant_id = $1 AND lancamento_financeiro_id = $2 LIMIT 1`
    const idempRows = await runQuery<{ id: number }>(idempSql, [tenantId, lfId])
    if (idempRows.length) {
      const lcId = idempRows[0].id
      const linhas = await runQuery<Record<string, unknown>>(
        `SELECT id, conta_id, debito, credito, historico FROM contabilidade.lancamentos_contabeis_linhas WHERE lancamento_id = $1 ORDER BY id ASC`,
        [lcId]
      )
      return Response.json({ success: true, already_exists: true, lancamento_contabil_id: lcId, linhas })
    }

    // Regra contábil por origem + categoria
    const regraSql = `
      SELECT r.id, r.conta_debito_id, r.conta_credito_id,
             d.codigo AS debito_codigo, d.nome AS debito_nome,
             c.codigo AS credito_codigo, c.nome AS credito_nome
        FROM contabilidade.regras_contabeis r
        LEFT JOIN contabilidade.plano_contas d ON d.id = r.conta_debito_id
        LEFT JOIN contabilidade.plano_contas c ON c.id = r.conta_credito_id
       WHERE r.tenant_id = $1
         AND r.origem = 'conta_a_pagar'
         AND r.categoria_financeira_id = $2
         AND r.automatico = TRUE
         AND r.ativo = TRUE
       ORDER BY r.id ASC
       LIMIT 1`;
    const regraRows = await runQuery<Record<string, unknown>>(regraSql, [tenantId, categoriaId])
    const regra = regraRows[0]
    if (!regra) {
      return Response.json({ success: false, message: 'Nenhuma regra contábil ativa para conta_a_pagar + categoria' }, { status: 422 })
    }
    const contaDebitoId = Number(regra['conta_debito_id'])
    const contaCreditoId = Number(regra['conta_credito_id'])

    // Transação: cria cabeçalho + 2 linhas
    const result = await withTransaction(async (client) => {
      const insertLcSql = `
        INSERT INTO contabilidade.lancamentos_contabeis
          (tenant_id, data_lancamento, historico, fornecedor_id, conta_financeira_id, total_debitos, total_creditos, lancamento_financeiro_id)
        VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
        RETURNING id`;
      const lcVals = [tenantId, dataLanc, historico, fornecedorId, contaFinanceiraId, valorAbs, lfId]
      const lcRes = await client.query(insertLcSql, lcVals)
      const lcId: number = lcRes.rows[0].id

      const histLinha = historico
      const insertLinhaSql = `INSERT INTO contabilidade.lancamentos_contabeis_linhas (lancamento_id, conta_id, debito, credito, historico) VALUES ($1, $2, $3, $4, $5)`
      // Débito
      await client.query(insertLinhaSql, [lcId, contaDebitoId, valorAbs, 0, histLinha])
      // Crédito
      await client.query(insertLinhaSql, [lcId, contaCreditoId, 0, valorAbs, histLinha])

      const linhas = await client.query(
        `SELECT id, conta_id, debito, credito, historico FROM contabilidade.lancamentos_contabeis_linhas WHERE lancamento_id = $1 ORDER BY id ASC`,
        [lcId]
      )

      return { lcId, linhas: linhas.rows as Record<string, unknown>[] }
    })

    return Response.json({ success: true, lancamento_contabil_id: result.lcId, linhas: result.linhas, regra_usada: { conta_debito_id: contaDebitoId, conta_credito_id: contaCreditoId } })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}


import { runQuery, withTransaction } from '@/lib/postgres'

export type Origem = 'conta_a_pagar' | 'pagamento_efetuado' | 'conta_a_receber' | 'pagamento_recebido'

export type RegraContabil = Record<string, unknown>

/**
 * Monta a query de resolução de regra contábil por origem + categoria.
 * Mantém mesma estrutura utilizada nas rotas para facilitar debug.
 */
export function buildRegraQuery(tenantId: number | string, origem: Origem, categoriaId: number | string) {
  const sql = `
      SELECT r.id,
             r.tenant_id,
             r.origem,
             r.subtipo,
             r.categoria_financeira_id,
             r.conta_debito_id,
             d.codigo AS debito_codigo,
             d.nome   AS debito_nome,
             r.conta_credito_id,
             c.codigo AS credito_codigo,
             c.nome   AS credito_nome,
             r.descricao
      FROM contabilidade.regras_contabeis r
      LEFT JOIN contabilidade.plano_contas d ON d.id = r.conta_debito_id
      LEFT JOIN contabilidade.plano_contas c ON c.id = r.conta_credito_id
      WHERE r.tenant_id = $1
        AND r.origem = $2
        AND r.categoria_financeira_id = $3
        AND r.automatico = TRUE
        AND r.ativo = TRUE
      ORDER BY r.id ASC
      LIMIT 1` as const
  const params: Array<number | string> = [tenantId, origem, categoriaId]
  return { sql, params }
}

/**
 * Retorna a primeira regra ativa/automática para (tenant, origem, categoria).
 */
export async function getRegraContabil(
  tenantId: number | string,
  origem: Origem,
  categoriaId: number | string
): Promise<{ regra: RegraContabil | null; sql: string; params: Array<number | string> }> {
  const { sql, params } = buildRegraQuery(tenantId, origem, categoriaId)
  const rows = await runQuery<RegraContabil>(sql, params)
  return { regra: rows[0] ?? null, sql, params }
}

/**
 * Gera lançamento contábil a partir de um lançamento financeiro (conta_a_pagar).
 * Implementa idempotência: se já existir contábil vinculado ao lançamento financeiro, retorna linhas existentes.
 */
export async function generateContabilFromFinanceiroContaAPagar(lfId: number) {
  // 1) Carrega o lançamento financeiro e valida tipo
  const lfSql = `
      SELECT lf.id, lf.tenant_id, lf.tipo, lf.descricao, lf.valor, ABS(lf.valor) AS valor_abs,
             lf.data_lancamento, lf.categoria_id, lf.entidade_id, lf.conta_financeira_id
        FROM financeiro.lancamentos_financeiros lf
       WHERE lf.id = $1
       LIMIT 1`
  const [lf] = await runQuery<Record<string, unknown>>(lfSql, [lfId])
  if (!lf) throw new Error('Lançamento financeiro não encontrado')
  const tipo = String(lf['tipo'] || '')
  if (tipo !== 'conta_a_pagar') throw new Error('Apenas conta_a_pagar suportado neste endpoint')

  const tenantId = Number(lf['tenant_id'])
  const categoriaId = Number(lf['categoria_id'])
  const fornecedorId = lf['entidade_id'] !== null && lf['entidade_id'] !== undefined ? Number(lf['entidade_id']) : null
  const contaFinanceiraId = lf['conta_financeira_id'] !== null && lf['conta_financeira_id'] !== undefined ? Number(lf['conta_financeira_id']) : null
  const valorAbs = Number(lf['valor_abs'] ?? 0)
  const dataLanc = lf['data_lancamento'] as string
  const historico = String(lf['descricao'] ?? '')

  // 2) Idempotência por FK
  const idempSql = `SELECT id FROM contabilidade.lancamentos_contabeis WHERE tenant_id = $1 AND lancamento_financeiro_id = $2 LIMIT 1`
  const idempRows = await runQuery<{ id: number }>(idempSql, [tenantId, lfId])
  if (idempRows.length) {
    const lcId = idempRows[0].id
    const linhas = await runQuery<Record<string, unknown>>(
      `SELECT id, conta_id, debito, credito, historico FROM contabilidade.lancamentos_contabeis_linhas WHERE lancamento_id = $1 ORDER BY id ASC`,
      [lcId]
    )
    return { alreadyExists: true as const, lcId, linhas }
  }

  // 3) Resolve regra para origem 'conta_a_pagar'
  const { regra } = await getRegraContabil(tenantId, 'conta_a_pagar', categoriaId)
  if (!regra) throw new Error('Nenhuma regra contábil ativa para conta_a_pagar + categoria')
  const contaDebitoId = Number(regra['conta_debito_id'])
  const contaCreditoId = Number(regra['conta_credito_id'])

  // 4) Transação: cria cabeçalho + 2 linhas
  const result = await withTransaction(async (client) => {
    const insertLcSql = `
        INSERT INTO contabilidade.lancamentos_contabeis
          (tenant_id, data_lancamento, historico, fornecedor_id, conta_financeira_id, total_debitos, total_creditos, lancamento_financeiro_id)
        VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
        RETURNING id`
    const lcVals = [tenantId, dataLanc, historico, fornecedorId, contaFinanceiraId, valorAbs, lfId]
    const lcRes = await client.query(insertLcSql, lcVals)
    const lcId: number = Number(lcRes.rows[0]?.id)

    const insertLinhaSql = `INSERT INTO contabilidade.lancamentos_contabeis_linhas (lancamento_id, lancamento_contabil_id, conta_id, debito, credito, historico) VALUES ($1, $2, $3, $4, $5, $6)`
    await client.query(insertLinhaSql, [lcId, lcId, contaDebitoId, valorAbs, 0, historico])
    await client.query(insertLinhaSql, [lcId, lcId, contaCreditoId, 0, valorAbs, historico])

    const linhasRes = await client.query(
      `SELECT id, conta_id, debito, credito, historico FROM contabilidade.lancamentos_contabeis_linhas WHERE lancamento_id = $1 ORDER BY id ASC`,
      [lcId]
    )

    return { lcId, linhas: linhasRes.rows as Record<string, unknown>[] }
  })

  return { alreadyExists: false as const, lcId: result.lcId, linhas: result.linhas }
}

export type CreateContaAPagarInput = {
  tenant_id: number
  categoria_id: number
  entidade_id?: number | null
  valor: number
  data_lancamento: string
  data_vencimento: string
  descricao: string
  conta_financeira_id?: number | null
}

/**
 * Cria um lançamento financeiro do tipo conta_a_pagar e o respectivo lançamento contábil (cabeçalho+linhas) na mesma transação.
 * Retorna os IDs criados.
 */
export async function createContaAPagarEContabil(input: CreateContaAPagarInput): Promise<{ lfId: number; lcId: number }> {
  const {
    tenant_id,
    categoria_id,
    entidade_id = null,
    valor,
    data_lancamento,
    data_vencimento,
    descricao,
    conta_financeira_id = null,
  } = input

  const valorAbs = Math.abs(Number(valor))

  return withTransaction(async (client) => {
    // 1) Lançamento financeiro (conta_a_pagar)
    const insertLfSql = `
        INSERT INTO financeiro.lancamentos_financeiros
          (tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status, entidade_id, categoria_id, conta_financeira_id)
        VALUES ($1, 'conta_a_pagar', $2, $3, $4, $5, 'pendente', $6, $7, $8)
        RETURNING id`
    const lfVals = [tenant_id, descricao, valorAbs, data_lancamento, data_vencimento, entidade_id, categoria_id, conta_financeira_id]
    const lfRes = await client.query(insertLfSql, lfVals)
    const lfId = Number(lfRes.rows[0]?.id)

    // 2) Regra contábil (conta_a_pagar + categoria)
    const regraSql = `
        SELECT r.id, r.conta_debito_id, r.conta_credito_id
          FROM contabilidade.regras_contabeis r
         WHERE r.tenant_id = $1
           AND r.origem = 'conta_a_pagar'
           AND r.categoria_financeira_id = $2
           AND r.automatico = TRUE
           AND r.ativo = TRUE
         ORDER BY r.id ASC
         LIMIT 1`
    const regraRows = await client.query(regraSql, [tenant_id, categoria_id])
    if (regraRows.rows.length === 0) throw new Error('Nenhuma regra contábil ativa para conta_a_pagar + categoria')
    const contaDebitoId = Number(regraRows.rows[0].conta_debito_id)
    const contaCreditoId = Number(regraRows.rows[0].conta_credito_id)

    // 3) Cabeçalho + linhas contábeis vinculados ao financeiro
    const insertLcSql = `
        INSERT INTO contabilidade.lancamentos_contabeis
          (tenant_id, data_lancamento, historico, fornecedor_id, conta_financeira_id, total_debitos, total_creditos, lancamento_financeiro_id)
        VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
        RETURNING id`
    const lcVals = [tenant_id, data_lancamento, descricao, entidade_id, conta_financeira_id, valorAbs, lfId]
    const lcRes = await client.query(insertLcSql, lcVals)
    const lcId = Number(lcRes.rows[0]?.id)

    const insertLinhaSql = `INSERT INTO contabilidade.lancamentos_contabeis_linhas (lancamento_id, lancamento_contabil_id, conta_id, debito, credito, historico) VALUES ($1, $2, $3, $4, $5, $6)`
    await client.query(insertLinhaSql, [lcId, lcId, contaDebitoId, valorAbs, 0, descricao])
    await client.query(insertLinhaSql, [lcId, lcId, contaCreditoId, 0, valorAbs, descricao])

    return { lfId, lcId }
  })
}


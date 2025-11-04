import { runQuery, withTransaction } from '@/lib/postgres'

export type Origem = 'conta_a_pagar' | 'pagamento_efetuado' | 'conta_a_receber' | 'pagamento_recebido'

export type RegraContabil = Record<string, unknown>

export async function consultarRegra(
  tenantId: number | string,
  origem: Origem,
  categoriaId: number | string,
) {
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
      LIMIT 1`
  const params = [tenantId, origem, categoriaId]
  const rows = await runQuery<RegraContabil>(sql, params)
  return { regra: rows[0] ?? null, sql, params }
}

export type CriarContaAPagarInput = {
  tenant_id: number
  categoria_id: number
  valor: number
  descricao?: string
  data_lancamento?: string
  data_vencimento?: string
  entidade_id?: number | null
  conta_financeira_id?: number | null
}

export async function criarContaAPagar(input: CriarContaAPagarInput) {
  const {
    tenant_id,
    categoria_id,
    valor,
    descricao = '',
    data_lancamento = new Date().toISOString().slice(0, 10),
    data_vencimento = data_lancamento,
    entidade_id = null,
    conta_financeira_id = null,
  } = input

  const valorAbs = Math.abs(Number(valor))

  const insertLfSql = `
        INSERT INTO financeiro.lancamentos_financeiros
          (tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status, entidade_id, categoria_id, conta_financeira_id)
        VALUES ($1, 'conta_a_pagar', $2, $3, $4, $5, 'pendente', $6, $7, $8)
        RETURNING id`
  const lfVals = [tenant_id, descricao, valorAbs, data_lancamento, data_vencimento, entidade_id, categoria_id, conta_financeira_id]
  const lfRes = await runQuery<{ id: number }>(insertLfSql, lfVals)
  const lfId = Number(lfRes[0]?.id)
  return { lfId }
}

export async function contabilizarContaAPagar(lfId: number) {
  // Carrega LF e valida tipo
  const lfSql = `
      SELECT lf.id, lf.tenant_id, lf.tipo, lf.descricao, lf.valor, ABS(lf.valor) AS valor_abs,
             lf.data_lancamento, lf.categoria_id, lf.entidade_id, lf.conta_financeira_id
        FROM financeiro.lancamentos_financeiros lf
       WHERE lf.id = $1
       LIMIT 1`
  const [lf] = await runQuery<Record<string, unknown>>(lfSql, [lfId])
  if (!lf) throw new Error('Lançamento financeiro não encontrado')
  const tipo = String(lf['tipo'] || '')
  if (tipo !== 'conta_a_pagar') throw new Error('Tipo inválido: esperado conta_a_pagar')

  const tenantId = Number(lf['tenant_id'])
  const categoriaId = Number(lf['categoria_id'])
  const fornecedorId = lf['entidade_id'] !== null && lf['entidade_id'] !== undefined ? Number(lf['entidade_id']) : null
  const contaFinanceiraId = lf['conta_financeira_id'] !== null && lf['conta_financeira_id'] !== undefined ? Number(lf['conta_financeira_id']) : null
  const valorAbs = Number(lf['valor_abs'] ?? 0)
  const dataLanc = lf['data_lancamento'] as string
  const historico = String(lf['descricao'] ?? '')

  // Idempotência
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

  // Resolve regra
  const { regra } = await consultarRegra(tenantId, 'conta_a_pagar', categoriaId)
  if (!regra) throw new Error('Nenhuma regra contábil ativa para conta_a_pagar + categoria')
  const contaDebitoId = Number(regra['conta_debito_id'])
  const contaCreditoId = Number(regra['conta_credito_id'])

  // Transação: cria cabeçalho + 2 linhas
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

    const linhas = await client.query(
      `SELECT id, conta_id, debito, credito, historico FROM contabilidade.lancamentos_contabeis_linhas WHERE lancamento_id = $1 ORDER BY id ASC`,
      [lcId]
    )

    return { lcId, linhas: linhas.rows as Record<string, unknown>[] }
  })

  return { alreadyExists: false as const, lcId: result.lcId, linhas: result.linhas }
}

export async function criarEContabilizarContaAPagar(input: CriarContaAPagarInput) {
  const {
    tenant_id,
    categoria_id,
    valor,
    descricao = '',
    data_lancamento = new Date().toISOString().slice(0, 10),
    data_vencimento = data_lancamento,
    entidade_id = null,
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

    // 2) Resolve regra (após AP criado; mesma transação)
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

    // 3) Cabeçalho + linhas contábeis
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


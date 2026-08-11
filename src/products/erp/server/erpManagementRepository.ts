import { runQuery, withTransaction } from '@/lib/postgres'

type ActorInput = { tenantId: number; actorId: number }

export type ErpOperationListInput = {
  page?: number
  pageSize?: number
  query?: string
  exportLimit?: number
}

export type ErpOperationPage = {
  records: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
}

export type ErpOperationCatalogSource = 'products' | 'services' | 'customers' | 'accounts' | 'locations' | 'payments'

function requiredId(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${label} invalido.`)
  return parsed
}

function amount(value: unknown, label: string, allowZero = false) {
  const parsed = Number(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(parsed) || (allowZero ? parsed < 0 : parsed <= 0)) throw new Error(`${label} invalido.`)
  return Number(parsed.toFixed(4))
}

function optionalText(value: unknown) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function requiredText(value: unknown, label: string) {
  const normalized = optionalText(value)
  if (!normalized) throw new Error(`${label} e obrigatorio.`)
  return normalized
}

function dateText(value: unknown, fallback = true) {
  const normalized = optionalText(value)
  if (!normalized && fallback) return new Date().toISOString().slice(0, 10)
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) throw new Error('Data invalida.')
  return normalized
}

export async function searchErpOperationsCatalog(input: {
  tenantId: number
  source: ErpOperationCatalogSource
  query?: string
  limit?: number
}) {
  const limit = Math.min(50, Math.max(10, Math.floor(Number(input.limit) || 20)))
  const params: unknown[] = [input.tenantId, input.query?.trim() || '', limit]
  const commonSearch = `($2 = '' OR concat_ws(' ', nome, codigo) ILIKE '%' || $2 || '%')`
  if (input.source === 'products') {
    return runQuery(`SELECT id::text AS value, concat_ws(' - ', nome, NULLIF(sku, '')) AS label FROM erp.produtos WHERE tenant_id = $1 AND ativo AND excluido_em IS NULL AND ${commonSearch} ORDER BY nome LIMIT $3`, params)
  }
  if (input.source === 'services') {
    return runQuery(`SELECT id::text AS value, concat_ws(' - ', nome, NULLIF(codigo, '')) AS label FROM erp.servicos WHERE tenant_id = $1 AND ativo AND excluido_em IS NULL AND ${commonSearch} ORDER BY nome LIMIT $3`, params)
  }
  if (input.source === 'customers') {
    return runQuery(`SELECT id::text AS value, concat_ws(' - ', nome, NULLIF(documento, '')) AS label FROM erp.entidades WHERE tenant_id = $1 AND eh_cliente AND ativo AND excluido_em IS NULL AND ($2 = '' OR concat_ws(' ', nome, documento, email) ILIKE '%' || $2 || '%') ORDER BY nome LIMIT $3`, params)
  }
  if (input.source === 'accounts') {
    return runQuery(`SELECT id::text AS value, nome AS label FROM erp.contas_financeiras WHERE tenant_id = $1 AND ativo AND excluido_em IS NULL AND ($2 = '' OR concat_ws(' ', nome, banco, conta) ILIKE '%' || $2 || '%') ORDER BY padrao DESC, nome LIMIT $3`, params)
  }
  if (input.source === 'locations') {
    return runQuery(`SELECT id::text AS value, concat_ws(' - ', nome, NULLIF(codigo, '')) AS label FROM erp.locais_estoque WHERE tenant_id = $1 AND ativo AND excluido_em IS NULL AND ${commonSearch} ORDER BY padrao DESC, nome LIMIT $3`, params)
  }
  return runQuery(
    `SELECT pagamentos.id::text AS value,
       concat(CASE WHEN pagamentos.tipo = 'receber' THEN 'Recebimento' ELSE 'Pagamento' END,
         ' - ', to_char(pagamentos.data_pagamento, 'DD/MM/YYYY'), ' - R$ ', to_char(pagamentos.valor_liquido, 'FM999G999G990D00')) AS label
     FROM erp.pagamentos
     WHERE pagamentos.tenant_id = $1 AND pagamentos.excluido_em IS NULL
       AND pagamentos.estornado_em IS NULL AND pagamentos.estorno_de_pagamento_id IS NULL
       AND NOT pagamentos.conciliado
       AND ($2 = '' OR concat_ws(' ', pagamentos.tipo, pagamentos.origem, pagamentos.valor_liquido::text) ILIKE '%' || $2 || '%')
     ORDER BY pagamentos.data_pagamento DESC LIMIT $3`,
    params,
  )
}

function normalizedOperationPage(input: ErpOperationListInput) {
  const page = Math.max(1, Math.floor(Number(input.page) || 1))
  const pageSize = input.exportLimit
    ? Math.min(10_000, Math.max(1, Math.floor(input.exportLimit)))
    : Math.min(100, Math.max(10, Math.floor(Number(input.pageSize) || 50)))
  return { page, pageSize }
}

async function listOperationPage(
  tenantId: number,
  selectSql: string,
  orderBy: string,
  input: ErpOperationListInput,
): Promise<ErpOperationPage> {
  const { page, pageSize } = normalizedOperationPage(input)
  const offset = input.exportLimit ? 0 : (page - 1) * pageSize
  const rows = await runQuery<Record<string, unknown>>(
    `WITH operation_records AS (${selectSql})
     SELECT operation_records.*, count(*) OVER ()::int AS __total
     FROM operation_records
     WHERE ($2 = '' OR to_jsonb(operation_records)::text ILIKE '%' || $2 || '%')
     ORDER BY ${orderBy}
     LIMIT $3 OFFSET $4`,
    [tenantId, input.query?.trim() || '', pageSize, offset],
  )
  const total = rows.length ? Number(rows[0].__total || 0) : 0
  return {
    records: rows.map(({ __total: _total, ...record }) => record),
    total,
    page,
    pageSize,
  }
}

export async function listManagementOperation(tenantId: number, resource: string, input: ErpOperationListInput = {}) {
  if (resource === 'contratos') {
    return listOperationPage(tenantId,
      `SELECT contratos.id::text, contratos.numero, entidades.nome AS cliente, contratos.descricao,
         contratos.data_inicio, contratos.data_fim, contratos.periodicidade,
         contratos.proxima_geracao_em, contratos.status,
         COALESCE(sum(itens.total), 0) AS valor
       FROM erp.contratos_vendas AS contratos
       JOIN erp.entidades ON entidades.tenant_id = contratos.tenant_id AND entidades.id = contratos.cliente_id
       LEFT JOIN erp.contratos_vendas_itens AS itens ON itens.tenant_id = contratos.tenant_id AND itens.contrato_id = contratos.id
       WHERE contratos.tenant_id = $1 AND contratos.excluido_em IS NULL
       GROUP BY contratos.id, entidades.nome`,
      'data_inicio DESC, id DESC', input,
    )
  }
  if (resource === 'fluxo-de-caixa') {
    return listOperationPage(tenantId,
      `SELECT fluxo.data::text AS id, fluxo.data, contas.nome AS conta,
         sum(fluxo.entradas)::numeric(18,2) AS entradas,
         sum(fluxo.saidas)::numeric(18,2) AS saidas,
         sum(fluxo.saldo_dia)::numeric(18,2) AS saldo
       FROM erp.vw_fluxo_caixa_diario AS fluxo
       JOIN erp.contas_financeiras AS contas ON contas.tenant_id = fluxo.tenant_id AND contas.id = fluxo.conta_financeira_id
       WHERE fluxo.tenant_id = $1
       GROUP BY fluxo.data, contas.nome`,
      'data DESC, id DESC', input,
    )
  }
  if (resource === 'dre') {
    return listOperationPage(tenantId,
      `SELECT concat(competencia::text, '-', COALESCE(categoria_id::text, 'sem-categoria'), '-', tipo) AS id,
         competencia, COALESCE(categoria, 'Sem categoria') AS categoria, tipo, valor
       FROM erp.vw_dre_gerencial WHERE tenant_id = $1`,
      'competencia DESC, tipo, categoria', input,
    )
  }
  if (resource === 'conciliacao-bancaria') {
    return listOperationPage(tenantId,
      `SELECT transacoes.id::text, transacoes.data_transacao AS data, contas.nome AS conta,
         transacoes.descricao, transacoes.tipo, transacoes.valor, transacoes.contraparte,
         transacoes.status
       FROM erp.transacoes_bancarias AS transacoes
       JOIN erp.contas_financeiras AS contas ON contas.tenant_id = transacoes.tenant_id AND contas.id = transacoes.conta_financeira_id
       WHERE transacoes.tenant_id = $1 AND transacoes.excluido_em IS NULL`,
      'data DESC, id DESC', input,
    )
  }
  if (resource === 'transferencias-financeiras') {
    return listOperationPage(tenantId,
      `SELECT transferencias.id::text, transferencias.data_transferencia AS data,
         origem.nome AS origem, destino.nome AS destino, transferencias.valor,
         transferencias.descricao, transferencias.status
       FROM erp.transferencias_financeiras AS transferencias
       JOIN erp.contas_financeiras AS origem ON origem.tenant_id = transferencias.tenant_id AND origem.id = transferencias.conta_origem_id
       JOIN erp.contas_financeiras AS destino ON destino.tenant_id = transferencias.tenant_id AND destino.id = transferencias.conta_destino_id
       WHERE transferencias.tenant_id = $1 AND transferencias.excluido_em IS NULL`,
      'data DESC, id DESC', input,
    )
  }
  if (resource === 'importacoes') {
    return listOperationPage(tenantId,
      `SELECT id::text, nome_arquivo AS arquivo, tipo, criado_em AS data, total_linhas,
         total_importadas AS importadas, total_erros AS erros, status
       FROM erp.importacoes_dados WHERE tenant_id = $1`,
      'data DESC, id DESC', input,
    )
  }
  if (resource === 'aging-receber') {
    return listOperationPage(tenantId,
      `SELECT parcela_id::text AS id, cliente, data_vencimento AS vencimento, saldo,
         dias_atraso, faixa AS status FROM erp.vw_aging_receber
       WHERE tenant_id = $1`,
      'vencimento, id', input,
    )
  }
  if (resource === 'aging-pagar') {
    return listOperationPage(tenantId,
      `SELECT parcela_id::text AS id, fornecedor, data_vencimento AS vencimento, saldo,
         dias_atraso, faixa AS status FROM erp.vw_aging_pagar
       WHERE tenant_id = $1`,
      'vencimento, id', input,
    )
  }
  if (resource === 'giro-estoque') {
    return listOperationPage(tenantId,
      `SELECT concat(produto_id::text, '-', local_estoque_id::text) AS id, produto,
         local_estoque AS local, quantidade_fisica, saidas_90_dias, giro_90_dias
       FROM erp.vw_giro_estoque WHERE tenant_id = $1`,
      'giro_90_dias DESC, produto', input,
    )
  }
  throw new Error('Modulo gerencial desconhecido.')
}

export async function createManagementOperation(input: ActorInput & {
  resource: string
  values: Record<string, unknown>
  idempotencyKey: string
}) {
  return withTransaction(async (client) => {
    if (input.resource === 'contratos') {
      const customerId = requiredId(input.values.cliente_id, 'Cliente')
      const productId = input.values.produto_id ? requiredId(input.values.produto_id, 'Produto') : null
      const serviceId = input.values.servico_id ? requiredId(input.values.servico_id, 'Servico') : null
      if ((productId ? 1 : 0) + (serviceId ? 1 : 0) !== 1) throw new Error('Escolha um produto ou um servico.')
      const startDate = dateText(input.values.data_inicio)
      const number = optionalText(input.values.numero) || `CTR-${Date.now()}`
      const quantity = amount(input.values.quantidade || 1, 'Quantidade')
      const unitValue = amount(input.values.valor_unitario, 'Valor unitario', true)
      const total = Number((quantity * unitValue).toFixed(2))
      const contract = await client.query(
        `INSERT INTO erp.contratos_vendas
           (tenant_id, cliente_id, numero, descricao, data_inicio, data_fim, periodicidade,
            dia_vencimento, proxima_geracao_em, status, chave_idempotencia, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $5, 'ativo', $9, $10, $10)
         RETURNING id`,
        [input.tenantId, customerId, number, requiredText(input.values.descricao, 'Descricao'), startDate,
          optionalText(input.values.data_fim), optionalText(input.values.periodicidade) || 'mensal',
          Math.min(31, Math.max(1, Number(input.values.dia_vencimento || 1))), input.idempotencyKey, input.actorId],
      )
      const contractId = Number(contract.rows[0].id)
      await client.query(
        `INSERT INTO erp.contratos_vendas_itens
           (tenant_id, contrato_id, produto_id, servico_id, descricao, quantidade,
            valor_unitario, total, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
        [input.tenantId, contractId, productId, serviceId, requiredText(input.values.item_descricao || input.values.descricao, 'Descricao do item'),
          quantity, unitValue, total, input.actorId],
      )
      return { id: String(contractId), status: 'ativo' }
    }
    if (input.resource === 'conciliacao-bancaria') {
      const accountId = requiredId(input.values.conta_financeira_id, 'Conta financeira')
      const value = amount(input.values.valor, 'Valor')
      const type = String(input.values.tipo || 'credito')
      if (!['credito', 'debito'].includes(type)) throw new Error('Tipo de transacao invalido.')
      const transaction = await client.query(
        `INSERT INTO erp.transacoes_bancarias
           (tenant_id, conta_financeira_id, identificador_externo, data_transacao, tipo,
            valor, descricao, contraparte, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
         ON CONFLICT (tenant_id, conta_financeira_id, identificador_externo)
           WHERE identificador_externo IS NOT NULL AND excluido_em IS NULL
         DO UPDATE SET descricao = EXCLUDED.descricao
         RETURNING id::text, status`,
        [input.tenantId, accountId, input.idempotencyKey, dateText(input.values.data), type, value,
          requiredText(input.values.descricao, 'Descricao'), optionalText(input.values.contraparte), input.actorId],
      )
      return transaction.rows[0]
    }
    if (input.resource === 'conciliar-transacao') {
      const transactionId = requiredId(input.values.transacao_bancaria_id, 'Transacao bancaria')
      const paymentId = requiredId(input.values.pagamento_id, 'Pagamento')
      const transactionResult = await client.query(
        `SELECT * FROM erp.transacoes_bancarias
         WHERE tenant_id = $1 AND id = $2 AND status = 'pendente' AND excluido_em IS NULL FOR UPDATE`,
        [input.tenantId, transactionId],
      )
      const transaction = transactionResult.rows[0]
      if (!transaction) throw new Error('Transacao bancaria pendente nao encontrada.')
      const paymentResult = await client.query(
        `SELECT * FROM erp.pagamentos
         WHERE tenant_id = $1 AND id = $2 AND NOT conciliado AND excluido_em IS NULL
           AND estornado_em IS NULL AND estorno_de_pagamento_id IS NULL FOR UPDATE`,
        [input.tenantId, paymentId],
      )
      const payment = paymentResult.rows[0]
      if (!payment) throw new Error('Pagamento disponivel para conciliacao nao encontrado.')
      if (Number(payment.conta_financeira_id) !== Number(transaction.conta_financeira_id)) throw new Error('Pagamento e extrato pertencem a contas diferentes.')
      if ((transaction.tipo === 'credito') !== (payment.tipo === 'receber')) throw new Error('Credito deve conciliar com recebimento e debito com pagamento.')
      if (Math.abs(Number(payment.valor_liquido) - Number(transaction.valor)) > 0.01) throw new Error('Os valores da transacao e do pagamento sao diferentes.')
      const reconciliation = await client.query(
        `INSERT INTO erp.conciliacoes_bancarias
           (tenant_id, conta_financeira_id, periodo_inicio, periodo_fim, status,
            conciliado_em, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $3, 'concluida', now(), $4, $4) RETURNING id`,
        [input.tenantId, transaction.conta_financeira_id, transaction.data_transacao, input.actorId],
      )
      await client.query(
        `INSERT INTO erp.conciliacoes_bancarias_itens
           (tenant_id, conciliacao_id, transacao_bancaria_id, pagamento_id, valor_conciliado, origem_conciliacao, criado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [input.tenantId, reconciliation.rows[0].id, transactionId, paymentId, transaction.valor,
          input.values.origem_conciliacao === 'sugerida' ? 'sugerida' : 'manual', input.actorId],
      )
      await client.query(`UPDATE erp.transacoes_bancarias SET status = 'conciliada', atualizado_por = $3 WHERE tenant_id = $1 AND id = $2`, [input.tenantId, transactionId, input.actorId])
      await client.query(`UPDATE erp.pagamentos SET conciliado = true,
        metadata = metadata || jsonb_build_object('origem_antes_conciliacao', origem),
        origem = 'conciliacao', atualizado_por = $3 WHERE tenant_id = $1 AND id = $2`, [input.tenantId, paymentId, input.actorId])
      return { id: String(reconciliation.rows[0].id), status: 'concluida' }
    }
    if (input.resource === 'transferencias-financeiras') {
      const originId = requiredId(input.values.conta_origem_id, 'Conta de origem')
      const destinationId = requiredId(input.values.conta_destino_id, 'Conta de destino')
      if (originId === destinationId) throw new Error('Origem e destino devem ser diferentes.')
      const created = await client.query(
        `INSERT INTO erp.transferencias_financeiras
           (tenant_id, conta_origem_id, conta_destino_id, data_transferencia, valor,
            descricao, status, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, 'concluida', $7, $7) RETURNING id::text, status`,
        [input.tenantId, originId, destinationId, dateText(input.values.data),
          amount(input.values.valor, 'Valor'), optionalText(input.values.descricao), input.actorId],
      )
      return created.rows[0]
    }
    throw new Error('Operacao gerencial desconhecida.')
  })
}

function nextContractDate(current: string, periodicity: string) {
  const date = new Date(`${current}T12:00:00Z`)
  const days = periodicity === 'semanal' ? 7 : periodicity === 'quinzenal' ? 15 : 0
  if (days) date.setUTCDate(date.getUTCDate() + days)
  else {
    const months = periodicity === 'bimestral' ? 2 : periodicity === 'trimestral' ? 3 : periodicity === 'semestral' ? 6 : periodicity === 'anual' ? 12 : 1
    date.setUTCMonth(date.getUTCMonth() + months)
  }
  return date.toISOString().slice(0, 10)
}

export async function processDueSalesContracts(input: ActorInput & { until?: string }) {
  return withTransaction(async (client) => {
    const until = input.until ? dateText(input.until, false) : new Date().toISOString().slice(0, 10)
    const contracts = await client.query(
      `SELECT * FROM erp.contratos_vendas
       WHERE tenant_id = $1 AND status = 'ativo' AND excluido_em IS NULL
         AND proxima_geracao_em <= $2::date AND (data_fim IS NULL OR proxima_geracao_em <= data_fim)
       ORDER BY proxima_geracao_em, id FOR UPDATE SKIP LOCKED`,
      [input.tenantId, until],
    )
    const generated: Array<{ contractId: string; saleId: string }> = []
    for (const contract of contracts.rows) {
      const competence = String(contract.proxima_geracao_em).slice(0, 10)
      const generationKey = `contrato:${String(contract.id)}:${competence}`
      const existing = await client.query(
        `SELECT venda_id FROM erp.contratos_vendas_geracoes
         WHERE tenant_id = $1 AND chave_idempotencia = $2`,
        [input.tenantId, generationKey],
      )
      if (existing.rows[0]?.venda_id) continue
      const items = await client.query(
        `SELECT * FROM erp.contratos_vendas_itens WHERE tenant_id = $1 AND contrato_id = $2 ORDER BY id`,
        [input.tenantId, contract.id],
      )
      if (!items.rows.length) continue
      const total = items.rows.reduce((sum, item) => sum + Number(item.total || 0), 0)
      const sale = await client.query(
        `INSERT INTO erp.vendas
           (tenant_id, cliente_id, numero, data_venda, data_competencia, status, situacao,
            origem, categoria_id, centro_custo_id, conta_financeira_id, metodo_pagamento_id,
            subtotal, total, condicao_pagamento, chave_idempotencia, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $4, 'rascunho', 'em_aberto', 'contrato', $5, $6, $7, $8,
           $9, $9, $10::jsonb, $11, $12, $12) RETURNING id`,
        [input.tenantId, contract.cliente_id, `CTR-${String(contract.id)}-${competence.replaceAll('-', '')}`,
          competence, contract.categoria_id, contract.centro_custo_id, contract.conta_financeira_id,
          contract.metodo_pagamento_id, total,
          JSON.stringify({ parcelas: [{ numero: 1, vencimento: competence, valor: total }] }), generationKey, input.actorId],
      )
      const saleId = Number(sale.rows[0].id)
      for (const item of items.rows) {
        await client.query(
          `INSERT INTO erp.vendas_itens
             (tenant_id, venda_id, produto_id, servico_id, descricao, quantidade,
              valor_unitario, desconto, total, criado_por, atualizado_por)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
          [input.tenantId, saleId, item.produto_id, item.servico_id, item.descricao,
            item.quantidade, item.valor_unitario, item.desconto, item.total, input.actorId],
        )
      }
      await client.query(
        `INSERT INTO erp.contratos_vendas_geracoes
           (tenant_id, contrato_id, competencia, venda_id, status, chave_idempotencia, processado_em, criado_por)
         VALUES ($1, $2, $3, $4, 'concluida', $5, now(), $6)`,
        [input.tenantId, contract.id, competence, saleId, generationKey, input.actorId],
      )
      await client.query(
        `UPDATE erp.contratos_vendas SET proxima_geracao_em = $3, atualizado_por = $4
         WHERE tenant_id = $1 AND id = $2`,
        [input.tenantId, contract.id, nextContractDate(competence, String(contract.periodicidade)), input.actorId],
      )
      generated.push({ contractId: String(contract.id), saleId: String(saleId) })
    }
    return { generated, total: generated.length }
  })
}

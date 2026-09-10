import { createSalesContract, generateContractSales } from './erpSalesContracts'
import { runQuery, withTransaction } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/server/erpApi'

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
  if (['fluxo-de-caixa', 'dre', 'aging-receber', 'aging-pagar'].includes(resource)) {
    throw new ErpDomainError('REPORT_RETIRED', 'Este relatorio foi descontinuado.', 410)
  }
  if (resource === 'contratos') {
    return listOperationPage(tenantId,
      `SELECT contratos.id::text, contratos.numero, entidades.nome AS cliente, contratos.descricao,
         contratos.data_inicio, contratos.data_fim, contratos.periodicidade,
         contratos.proxima_geracao_em, contratos.status,
         COALESCE(sum(itens.total), 0) AS valor
       FROM erp.contratos_vendas AS contratos
       JOIN erp.entidades ON entidades.tenant_id = contratos.tenant_id AND entidades.id = contratos.cliente_id
       LEFT JOIN erp.contratos_vendas_itens AS itens ON itens.tenant_id = contratos.tenant_id AND itens.contrato_id = contratos.id AND itens.contrato_versao_id = (SELECT v.id FROM erp.contratos_vendas_versoes v WHERE v.tenant_id=contratos.tenant_id AND v.contrato_id=contratos.id AND v.status='efetivada' ORDER BY v.numero DESC LIMIT 1)
       WHERE contratos.tenant_id = $1 AND contratos.excluido_em IS NULL
       GROUP BY contratos.id, entidades.nome`,
      'data_inicio DESC, id DESC', input,
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
    if (input.resource === 'contratos') return createSalesContract(client,input)
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

export async function processDueSalesContracts(input: ActorInput & { until?: string }) {
  return generateContractSales(input)
}

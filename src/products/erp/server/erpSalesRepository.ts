// Part of the ERP repository, split by area from erpRepository.ts. erpRepository.ts re-exports the public names.
import { conferirVersao, versaoMudou } from '../regras/geral'
import { validarParcelas } from '../regras/geral'
import { exigirRegra } from './erpRegras'
import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import { erpToday } from '@/products/erp/server/erpBusinessDate'
import { assertCustomerCredit, assertDiscountLimit, assertTablePriceRules, cancelSaleCommissions, generateSaleCommissions, resolvePriceTable, saleSeller, saleTransport, sellerRules, tablePrice, type TablePrice } from '@/products/erp/server/erpCommercialRules'
import { nextDocumentNumber } from '@/products/erp/server/erpDocumentNumbers'
import { assertErpPeriodOpen } from '@/products/erp/server/erpPeriodRepository'
import {
    releaseStockForSale,
    reserveStockForSale
} from '@/products/erp/server/erpStockRepository'
import { assertCommercialReplay } from '@/products/erp/shared/commercialContracts'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { discountAmount, lineTotal, sumMoney } from '@/products/erp/shared/erpMoney'
import { quoteIsClosed } from '@/products/erp/shared/quoteLifecycle'
import type { ErpEntityRecord } from '@/products/erp/shared/types'
import { FINANCIAL_CATEGORY_LEAF_SQL, paymentMethodId } from './erpReceivablesPayablesRepository'
import { appendPagination, appendRecordStatusFilter, appendSearch, dateText, jsonObject, money, normalizedIdempotencyKey, numericId, optionalNumericId, optionalText, positiveMoney, stringArray, text, type ConfirmErpSaleResult, type ConfirmSaleInput, type CreateInput, type IdActionInput, type InstallmentRow, type ListInput, type NormalizedInstallment, type ReceivableRow, type SaleRow } from './erpRepositoryCore'

function validateSaleInstallments(sale: SaleRow, installments: NormalizedInstallment[]) {
  // GE-11, GE-12 (regras/geral.ts)
  exigirRegra(validarParcelas({ valores: installments.map(i => i.valor), numeros: installments.map(i => i.numeroParcela), total: money(sale.total), documento: 'da venda' }))
  return installments
}
function normalizePaymentConditionInstallments(sale: SaleRow): NormalizedInstallment[] {
  const paymentCondition = sale.condicao_pagamento as { parcelas?: unknown } | null
  const installments = Array.isArray(paymentCondition?.parcelas) ? paymentCondition.parcelas : []
  if (installments.length === 0) {
    return validateSaleInstallments(sale, [{
      numeroParcela: 1,
      descricao: 'Parcela 1',
      dataVencimento: dateText(sale.data_venda) || erpToday(),
      valor: money(sale.total),
    }])
  }

  const normalized = installments.map((installment, index): NormalizedInstallment => {
      const item = installment as Record<string, unknown>
      const value = positiveMoney(item.valor)
      const dueDate = dateText(item.data_vencimento)
      const installmentNumber = Number(item.numero_parcela || index + 1)
      if (!value) throw new ErpDomainError('VALIDATION_ERROR', `Valor da parcela ${index + 1} invalido.`)
      if (!dueDate) throw new ErpDomainError('VALIDATION_ERROR', `Vencimento da parcela ${index + 1} invalido.`)

      return {
        numeroParcela: installmentNumber,
        descricao: optionalText(item.descricao) || `Parcela ${index + 1}`,
        dataVencimento: dueDate,
        valor: value,
      }
    })
  return validateSaleInstallments(sale, normalized)
}
async function resolveSaleInstallments(client: Pick<SQLClient, 'query'>, sale: SaleRow) {
  const plannedResult = await client.query(
    `SELECT id, numero_parcela, descricao, data_vencimento, valor, conta_financeira_id, metodo_pagamento_id
     FROM erp.vendas_recebimentos_previstos
     WHERE empresa_id = $1
       AND venda_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [sale.empresa_id, sale.id],
  )
  if (plannedResult.rows.length === 0) return normalizePaymentConditionInstallments(sale)

  return validateSaleInstallments(sale, plannedResult.rows.map((row) => ({
    numeroParcela: Number(row.numero_parcela),
    descricao: optionalText(row.descricao),
    dataVencimento: dateText(row.data_vencimento) || '',
    valor: money(row.valor),
    contaFinanceiraId: paymentMethodId(row.conta_financeira_id),
    metodoPagamentoId: paymentMethodId(row.metodo_pagamento_id),
    commercialForecastId: row.id as string | number,
  })))
}
async function fetchReceivableForSale(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  saleId: string | number,
) {
  const receivableResult = await client.query(
    `SELECT id::text, status
     FROM erp.contas_receber
     WHERE empresa_id = $1
       AND venda_id = $2
       AND excluido_em IS NULL
     LIMIT 1`,
    [tenantId, saleId],
  )
  const receivable = receivableResult.rows[0] as ReceivableRow | undefined
  if (!receivable) return null

  const installmentsResult = await client.query(
    `SELECT id::text, numero_parcela, valor, status
     FROM erp.contas_receber_parcelas
     WHERE empresa_id = $1
       AND conta_receber_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [tenantId, receivable.id],
  )

  return {
    receivable,
    installments: installmentsResult.rows as InstallmentRow[],
  }
}
function mapConfirmSaleResult(sale: SaleRow, receivable: ReceivableRow, installments: InstallmentRow[]): ConfirmErpSaleResult {
  return {
    sale: {
      id: String(sale.id),
      status: String(sale.status),
    },
    receivable: {
      id: String(receivable.id),
      status: String(receivable.status),
    },
    installments: installments.map((installment) => ({
      id: String(installment.id),
      numero_parcela: Number(installment.numero_parcela),
      valor: Number(installment.valor),
      status: String(installment.status),
    })),
  }
}
export async function listErpSalesCatalogs(tenantId: number) {
  const [customers, responsibles, products, services, categories, costCenters, financialAccounts, paymentMethods] = await Promise.all([
    runQuery(`SELECT id::text, nome, documento, email, celular, telefone, contato_cobranca_emails, contato_cobranca_whatsapp
      FROM erp.entidades WHERE empresa_id = $1 AND eh_cliente = true AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT id::text, nome, documento FROM erp.entidades
      WHERE empresa_id = $1 AND eh_vendedor = true AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(sku, codigo, '') AS codigo, COALESCE(unidade_medida, 'UN') AS unidade, preco_venda AS valor_padrao
      FROM erp.produtos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(codigo, '') AS codigo, 'UN'::text AS unidade, preco AS valor_padrao
      FROM erp.servicos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT categorias.id::text, COALESCE(pai.nome || ' › ', '') || categorias.nome AS nome FROM erp.categorias categorias LEFT JOIN erp.categorias pai ON pai.empresa_id = categorias.empresa_id AND pai.id = categorias.categoria_pai_id WHERE categorias.empresa_id = $1 AND categorias.tipo = 'receita' AND categorias.ativo = true AND categorias.excluido_em IS NULL AND ${FINANCIAL_CATEGORY_LEAF_SQL} ORDER BY 2`, [tenantId]),
    runQuery(`SELECT id::text, nome FROM erp.centros_custo WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo, padrao FROM erp.contas_financeiras WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY padrao DESC, nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo FROM erp.metodos_pagamento WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
  ])
  return { customers, responsibles, products, services, categories, costCenters, financialAccounts, paymentMethods }
}
export async function getErpSaleDetails(tenantId: number, idValue: string | number) {
  const id = numericId(idValue, 'Venda')
  const [sales, items, installments, events] = await Promise.all([
    runQuery<Record<string, unknown>>(
      `SELECT vendas.*, COALESCE(vendas.cliente_snapshot->>'nome',entidades.nome) AS cliente_nome, COALESCE(vendas.cliente_snapshot->>'documento',entidades.documento) AS cliente_documento
       FROM erp.vendas JOIN erp.entidades
         ON entidades.empresa_id = vendas.empresa_id AND entidades.id = vendas.cliente_id
       WHERE vendas.empresa_id = $1 AND vendas.id = $2 AND vendas.excluido_em IS NULL`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT itens.id::text, CASE WHEN itens.produto_id IS NOT NULL THEN 'produto' ELSE 'servico' END AS tipo,
         COALESCE(itens.produto_id, itens.servico_id)::text AS item_id, itens.descricao, itens.quantidade,
         itens.valor_unitario, itens.desconto, itens.total, itens.quantidade_atendida
       FROM erp.vendas_itens itens WHERE itens.empresa_id = $1 AND itens.venda_id = $2
         AND itens.excluido_em IS NULL ORDER BY itens.id`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT id::text, numero_parcela, descricao, data_vencimento, valor,
         conta_financeira_id::text, metodo_pagamento_id::text
       FROM erp.vendas_recebimentos_previstos WHERE empresa_id = $1 AND venda_id = $2
         AND excluido_em IS NULL ORDER BY numero_parcela`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT evento, status_anterior, status_novo, versao, dados, criado_em
       FROM erp.vendas_eventos WHERE empresa_id = $1 AND venda_id = $2 ORDER BY criado_em DESC`, [tenantId, id],
    ),
  ])
  if (!sales[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Venda não encontrada.')
  return { sale: sales[0], items, installments, events }
}
export async function listSaleRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const documentType = optionalText(input.filters?.tipo_documento)
  const documentClause = documentType ? ` AND vendas.tipo_documento = $${params.push(documentType)}` : ''
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         vendas.id::text,
         vendas.numero,
         vendas.data_venda,
          vendas.status,
          vendas.atendimento_status,
          vendas.fiscal_status,
          vendas.situacao,
          vendas.tipo_documento,
          vendas.validade_em,
          vendas.versao,
          vendas.total,
         entidades.nome AS cliente,
         entidades.id::text AS entidade_id,
         COALESCE(resumo.primeiro_item, 'Sem itens') || CASE WHEN resumo.quantidade_itens > 1 THEN ' + ' || (resumo.quantidade_itens - 1)::text || CASE WHEN resumo.quantidade_itens = 2 THEN ' item' ELSE ' itens' END ELSE '' END AS descricao,
         COALESCE(categorias.nome, '') AS categoria,
         concat_ws(' ', vendas.numero, entidades.nome, vendas.status, resumo.primeiro_item, categorias.nome) AS searchable
       FROM erp.vendas AS vendas
       JOIN erp.entidades AS entidades
         ON entidades.empresa_id = vendas.empresa_id
        AND entidades.id = vendas.cliente_id
       LEFT JOIN erp.categorias AS categorias ON categorias.empresa_id = vendas.empresa_id AND categorias.id = vendas.categoria_id
       LEFT JOIN LATERAL (
         SELECT (array_agg(itens.descricao ORDER BY itens.id))[1] AS primeiro_item, count(*)::int AS quantidade_itens
         FROM erp.vendas_itens AS itens WHERE itens.empresa_id = vendas.empresa_id AND itens.venda_id = vendas.id AND itens.excluido_em IS NULL
       ) AS resumo ON true
        WHERE vendas.empresa_id = $1
          AND vendas.excluido_em IS NULL
          ${documentClause}
      )
      SELECT id, numero, data_venda, status, atendimento_status, fiscal_status, situacao, tipo_documento, validade_em, versao,
        total, cliente, entidade_id, descricao, categoria, count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY data_venda DESC, id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    numero: String(row.numero ?? ''),
    cliente: String(row.cliente ?? ''),
    descricao: String(row.descricao ?? ''),
    categoria: String(row.categoria ?? ''),
    entidade_id: String(row.entidade_id ?? ''),
    data: dateText(row.data_venda) || '',
    total: Number(row.total ?? 0),
    status: String(row.status ?? ''),
    atendimento_status: String(row.atendimento_status ?? 'pendente'),
    fiscal_status: String(row.fiscal_status ?? 'nao_emitida'),
    situacao: String(row.situacao ?? ''),
    tipo_documento: String(row.tipo_documento ?? 'venda'),
    validade: dateText(row.validade_em) || '',
    versao: Number(row.versao ?? 1),
    __total: Number(row.__total ?? 0),
  }))
}
export async function confirmErpSale(input: ConfirmSaleInput): Promise<ConfirmErpSaleResult> {
  return withTransaction(async (client) => {
    const saleResult = await client.query(
      `SELECT
         id,
         empresa_id,
         cliente_id,
         numero,
         data_venda,
         data_competencia,
         status,
         situacao,
         categoria_id,
         centro_custo_id,
         conta_financeira_id,
         metodo_pagamento_id,
         total,
         condicao_pagamento,
         cobranca_emails,
         cobranca_whatsapp,
          configuracao_lembretes,
          tipo_documento,
          versao
       FROM erp.vendas
       WHERE empresa_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.saleId],
    )
    const sale = saleResult.rows[0] as SaleRow | undefined
    if (!sale) throw new ErpDomainError('VALIDATION_ERROR', 'Venda não encontrada.')
    if(input.expectedVersion !== undefined)exigirRegra(conferirVersao({atual:Number(saleResult.rows[0].versao),esperada:input.expectedVersion,documento:'Esta venda'}))
    if (sale.tipo_documento === 'orcamento') {
      throw new ErpDomainError('VALIDATION_ERROR', 'Converta o orçamento em venda antes de confirmar o financeiro.')
    }

    if (sale.status === 'cancelada') {
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda cancelada não pode ser confirmada.')
    }

    const existingFinancial = await fetchReceivableForSale(client, input.tenantId, sale.id)
    if (existingFinancial) {
      if (sale.status === 'confirmada' && existingFinancial.receivable.status !== 'cancelado') {
        return mapConfirmSaleResult(sale, existingFinancial.receivable, existingFinancial.installments)
      }
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda e conta a receber estao em estados inconsistentes e precisam ser revisadas.')
    }

    if (sale.status !== 'rascunho') {
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda já saiu de rascunho e ainda não possui contas a receber.')
    }

    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'vendas', date: dateText(sale.data_venda)! })
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: dateText(sale.data_venda)! })

    if (!sale.cliente_id) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda precisa ter cliente para ser confirmada.')
    }

    if (money(sale.total) <= 0) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda precisa ter total maior que zero para ser confirmada.')
    }

    const customerResult = await client.query(
      `SELECT
         id,
         nome,
         documento,
         email,
         telefone,
         celular,
         contato_cobranca_emails,
         contato_cobranca_whatsapp
       FROM erp.entidades
       WHERE empresa_id = $1
         AND id = $2
         AND eh_cliente = true
         AND excluido_em IS NULL
       LIMIT 1`,
      [input.tenantId, sale.cliente_id],
    )
    const customer = customerResult.rows[0] as Record<string, unknown> | undefined
    if (!customer) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Cliente da venda não foi encontrado ou não esta marcado como cliente.')
    }

    const itemsResult = await client.query(
      `SELECT count(*)::int AS total,
         count(*) FILTER (WHERE produto_id IS NOT NULL)::int AS produtos
       FROM erp.vendas_itens
       WHERE empresa_id = $1
         AND venda_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, sale.id],
    )
    if (Number(itemsResult.rows[0]?.total || 0) <= 0) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Venda precisa ter pelo menos um item para ser confirmada.')
    }
    // Bloqueio comercial e limite de crédito do cliente (saldo em aberto + esta venda).
    await assertCustomerCredit(client, { tenantId: input.tenantId, actorId: input.actorId, saleId: Number(sale.id), customerId: Number(sale.cliente_id),
      saleTotal: money(sale.total), override: input.creditOverrideReason ? { motivo: input.creditOverrideReason } : null })

    const updatedSaleResult = await client.query(
      `UPDATE erp.vendas
       SET
         status = 'confirmada',
         situacao = 'aprovada',
         atendimento_status = CASE WHEN $4 > 0 THEN 'pendente' ELSE 'nao_aplicavel' END,
         confirmada_em = COALESCE(confirmada_em, now()),
         versao = versao + 1,
         atualizado_por = $3
       WHERE empresa_id = $1
         AND id = $2
       RETURNING
         id,
         empresa_id,
         cliente_id,
         numero,
         data_venda,
         data_competencia,
         status,
         situacao,
         categoria_id,
         centro_custo_id,
         conta_financeira_id,
         metodo_pagamento_id,
         total,
         condicao_pagamento,
         cobranca_emails,
         cobranca_whatsapp,
         configuracao_lembretes,
         versao`,
      [input.tenantId, sale.id, input.actorId, Number(itemsResult.rows[0]?.produtos || 0)],
    )
    const updatedSale = updatedSaleResult.rows[0] as SaleRow
    await reserveStockForSale(client, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      saleId: Number(sale.id),
    })
    await client.query(
      `INSERT INTO erp.vendas_eventos (empresa_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'confirmada', $3, $4, $5, '{}'::jsonb, $6)`,
      [input.tenantId, sale.id, sale.status, updatedSale.status, Number(updatedSale.versao || Number(sale.versao || 1) + 1), input.actorId],
    )
    const installments = await resolveSaleInstallments(client, updatedSale)
    const customerEmails = stringArray(customer.contato_cobranca_emails)
    const billingEmails = stringArray(updatedSale.cobranca_emails)
    if (billingEmails.length === 0) {
      billingEmails.push(...(customerEmails.length > 0 ? customerEmails : stringArray([customer.email])))
    }
    const billingWhatsapp = optionalText(updatedSale.cobranca_whatsapp)
      || optionalText(customer.contato_cobranca_whatsapp)
      || optionalText(customer.celular)
      || optionalText(customer.telefone)

    const receivableResult = await client.query(
      `INSERT INTO erp.contas_receber (
         empresa_id,
         cliente_id,
         venda_id,
         descricao,
         numero_documento,
         data_competencia,
         data_emissao,
         valor_total,
         status,
         origem,
         categoria_id,
         centro_custo_id,
         cliente_nome_snapshot,
         cliente_documento_snapshot,
         cobranca_emails,
         cobranca_whatsapp,
         configuracao_lembretes,
         criado_por,
         atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'aberto', 'venda', $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $16)
       RETURNING id::text, status`,
      [
        input.tenantId,
        updatedSale.cliente_id,
        updatedSale.id,
        `Venda ${updatedSale.numero || updatedSale.id}`,
        updatedSale.numero,
        dateText(updatedSale.data_competencia),
        dateText(updatedSale.data_venda) || erpToday(),
        money(updatedSale.total),
        updatedSale.categoria_id,
        updatedSale.centro_custo_id,
        optionalText(customer.nome),
        optionalText(customer.documento),
        billingEmails,
        billingWhatsapp,
        JSON.stringify(jsonObject(updatedSale.configuracao_lembretes)),
        input.actorId,
      ],
    )
    const receivable = receivableResult.rows[0] as ReceivableRow

    const createdInstallments: InstallmentRow[] = []
    for (const installment of installments) {
      const installmentResult = await client.query(
        `INSERT INTO erp.contas_receber_parcelas (
           empresa_id,
           conta_receber_id,
           numero_parcela,
           descricao,
           data_vencimento,
           data_pagamento_previsto,
           valor,
           valor_bruto,
           valor_liquido,
           valor_pago,
           status,
           conta_financeira_id,
           metodo_pagamento_id,
           recebimento_previsto_id,
           criado_por,
           atualizado_por
         )
         VALUES ($1, $2, $3, $4, $5, $5, $6, $6, $6, 0, 'aberto', $7, $8, $9, $10, $10)
         RETURNING id::text, numero_parcela, valor, status`,
        [
          input.tenantId,
          receivable.id,
          installment.numeroParcela,
          installment.descricao,
          installment.dataVencimento,
          installment.valor,
          installment.contaFinanceiraId ?? updatedSale.conta_financeira_id,
          installment.metodoPagamentoId ?? updatedSale.metodo_pagamento_id,
          installment.commercialForecastId,
          input.actorId,
        ],
      )
      createdInstallments.push(installmentResult.rows[0] as InstallmentRow)
    }

    // Comissões por item, pela regra mais específica do vendedor da venda.
    await generateSaleCommissions(client, input.tenantId, Number(sale.id), input.actorId)
    return mapConfirmSaleResult(updatedSale, receivable, createdInstallments)
  })
}
export async function cancelErpSale(input: IdActionInput & { reason?: string | null; expectedVersion?: number }) {
  return withTransaction(async (client) => {
    const saleResult = await client.query(
      `SELECT id, empresa_id, status, versao
       FROM erp.vendas
       WHERE empresa_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const sale = saleResult.rows[0] as { id: string | number; status: string } | undefined
    if (!sale) throw new ErpDomainError('VALIDATION_ERROR', 'Venda não encontrada.')
    if(input.expectedVersion !== undefined)exigirRegra(conferirVersao({atual:Number(saleResult.rows[0].versao),esperada:input.expectedVersion,documento:'Esta venda'}))
    if (sale.status === 'cancelada') return { id: String(sale.id), status: 'cancelada' }

    // Devolução já tem tratamento financeiro próprio; cancelar o título de origem
    // apagaria a contrapartida de créditos e reembolsos que permanecem válidos.
    const returns = await client.query('SELECT id FROM erp.devolucoes WHERE empresa_id=$1 AND venda_id=$2 LIMIT 1', [input.tenantId, sale.id])
    if (returns.rows.length) throw new ErpDomainError('SALE_HAS_RETURNS', 'Esta venda possui devolução registrada e não pode ser cancelada diretamente. Para encerrar o saldo, use o abatimento ou aplique o crédito nas parcelas da própria venda.', 409)
    const delivered = await client.query("SELECT id FROM erp.movimentacoes_estoque WHERE empresa_id=$1 AND origem_tipo='venda' AND origem_id=$2 AND quantidade<0 LIMIT 1", [input.tenantId, sale.id])
    if (delivered.rows.length) throw new ErpDomainError('SALE_HAS_DELIVERIES', 'Esta venda já possui mercadoria entregue. Registre a devolução e seu tratamento financeiro; o cancelamento direto não está disponível.', 409)


    const invoiceResult = await client.query(
      `SELECT id
       FROM erp.notas_fiscais
       WHERE empresa_id = $1
         AND venda_id = $2
         AND excluido_em IS NULL
         AND status NOT IN ('cancelada', 'falha')
       LIMIT 1`,
      [input.tenantId, sale.id],
    )
    if (invoiceResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Cancele ou exclua a nota fiscal antes de cancelar a venda.')

    const chargeResult = await client.query(
      `SELECT cobrancas.id
       FROM erp.cobrancas AS cobrancas
       JOIN erp.contas_receber_parcelas AS parcelas
         ON parcelas.empresa_id = cobrancas.empresa_id
        AND parcelas.id = cobrancas.conta_receber_parcela_id
       JOIN erp.contas_receber AS contas
         ON contas.empresa_id = parcelas.empresa_id
        AND contas.id = parcelas.conta_receber_id
       WHERE cobrancas.empresa_id = $1
         AND contas.venda_id = $2
         AND cobrancas.excluido_em IS NULL
         AND cobrancas.status NOT IN ('cancelada', 'falha')
       LIMIT 1`,
      [input.tenantId, sale.id],
    )
    if (chargeResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Cancele a cobrança ativa antes de cancelar a venda.')

    const paymentResult = await client.query(
      `SELECT pagamentos.id
       FROM erp.pagamentos AS pagamentos
       JOIN erp.contas_receber_parcelas AS parcelas
         ON parcelas.empresa_id = pagamentos.empresa_id
        AND parcelas.id = pagamentos.conta_receber_parcela_id
       JOIN erp.contas_receber AS contas
         ON contas.empresa_id = parcelas.empresa_id
        AND contas.id = parcelas.conta_receber_id
       WHERE pagamentos.empresa_id = $1
         AND contas.venda_id = $2
         AND pagamentos.excluido_em IS NULL
         AND pagamentos.estornado_em IS NULL
         AND pagamentos.estorno_de_pagamento_id IS NULL
       LIMIT 1`,
      [input.tenantId, sale.id],
    )
    if (paymentResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Venda com pagamento não pode ser cancelada sem estorno.')

    await releaseStockForSale(client, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      saleId: Number(sale.id),
    })

    await client.query(
      `UPDATE erp.contas_receber_parcelas AS parcelas
       SET status = 'cancelado', atualizado_por = $3
       FROM erp.contas_receber AS contas
       WHERE parcelas.empresa_id = contas.empresa_id
         AND parcelas.conta_receber_id = contas.id
         AND contas.empresa_id = $1
         AND contas.venda_id = $2
         AND parcelas.excluido_em IS NULL`,
      [input.tenantId, sale.id, input.actorId],
    )
    await client.query(
      `UPDATE erp.contas_receber
       SET
         status = 'cancelado',
         cancelado_em = COALESCE(cancelado_em, now()),
         motivo_cancelamento = COALESCE($4, motivo_cancelamento),
         atualizado_por = $3
       WHERE empresa_id = $1
         AND venda_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, sale.id, input.actorId, optionalText(input.reason)],
    )
    const updated = await client.query(
      `UPDATE erp.vendas
       SET status = 'cancelada', situacao = 'cancelada', atendimento_status = 'cancelado',
         fiscal_status = 'cancelada', cancelada_em = COALESCE(cancelada_em, now()),
         versao = versao + 1, atualizado_por = $3
       WHERE empresa_id = $1
         AND id = $2
       RETURNING id::text, status, versao`,
      [input.tenantId, sale.id, input.actorId],
    )
    await client.query(
      `INSERT INTO erp.vendas_eventos (empresa_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'cancelada', $3, 'cancelada', $4, $5::jsonb, $6)`,
      [input.tenantId, sale.id, sale.status, Number(updated.rows[0]?.versao || 1),
        JSON.stringify({ motivo: optionalText(input.reason) }), input.actorId],
    )
    await cancelSaleCommissions(client, input.tenantId, Number(sale.id), input.actorId)
    return updated.rows[0]
  })
}
export async function createSaleRecord(client: SQLClient, input: CreateInput) {
  const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey || input.values.chave_idempotencia)
  if (idempotencyKey) {
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`erp:venda:${input.tenantId}:${idempotencyKey}`])
    const existing = await client.query(
      `SELECT id, metadata FROM erp.vendas
       WHERE empresa_id = $1 AND chave_idempotencia = $2 AND excluido_em IS NULL LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    if (existing.rows[0]) { assertCommercialReplay((existing.rows[0].metadata as Record<string,unknown>)?.commercialRequest,input.values); return { id: String(existing.rows[0].id) } }
  }

  const customerId = numericId(input.values.cliente_id, 'Cliente')
  const documentType = ['orcamento', 'pedido', 'venda'].includes(text(input.values.tipo_documento))
    ? text(input.values.tipo_documento)
    : 'venda'
  const saleDate = dateText(input.values.data_venda) || erpToday()
  const number = optionalText(input.values.numero) || await nextDocumentNumber(client, input.tenantId, documentType as 'orcamento' | 'pedido' | 'venda', saleDate)

  const customerResult = await client.query(
    `SELECT id
     FROM erp.entidades
     WHERE empresa_id = $1
       AND id = $2
       AND eh_cliente = true
       AND excluido_em IS NULL
     LIMIT 1`,
    [input.tenantId, customerId],
  )
  if (!customerResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Cliente não encontrado.')
  // Tabela de preço (informada, do cliente ou padrão) e dados de transporte para a NF-e.
  const priceTableId = await resolvePriceTable(client, input.tenantId, customerId, input.values.tabela_preco_id, saleDate)
  const transport = await saleTransport(client, input.tenantId, input.values)

  const rawItems = Array.isArray(input.values.itens) && input.values.itens.length > 0
    ? input.values.itens as Record<string, unknown>[]
    : [{
        tipo: 'produto',
        item_id: input.values.produto_id,
        descricao: input.values.descricao,
        quantidade: input.values.quantidade,
        valor_unitario: input.values.valor_unitario,
      }]
  if (rawItems.length > 100) throw new ErpDomainError('VALIDATION_ERROR', 'A venda aceita no máximo 100 itens.')

  const items: Array<{
    tipo: 'produto' | 'servico'
    itemId: number
    descricao: string
    quantidade: number
    valorUnitario: number
    desconto: number
    total: number
    custo: number
    precoTabela: number | null
    priceRule: TablePrice | null
  }> = []
  for (const [index, raw] of rawItems.entries()) {
    const tipo = text(raw.tipo || raw.kind) === 'servico' ? 'servico' : 'produto'
    const itemId = numericId(raw.item_id || raw.produto_id || raw.servico_id, `Item ${index + 1}`)
    const quantity = Number(raw.quantidade || 1)
    const discount = money(raw.desconto)
    if (!Number.isFinite(quantity) || quantity <= 0) throw new ErpDomainError('VALIDATION_ERROR', `Quantidade do item ${index + 1} invalida.`)
    const catalog = await client.query(
      tipo === 'servico'
        ? `SELECT nome, custo, preco AS preco_catalogo FROM erp.servicos WHERE empresa_id = $1 AND id = $2 AND ativo = true AND excluido_em IS NULL`
        : `SELECT nome, custo, preco_venda AS preco_catalogo FROM erp.produtos WHERE empresa_id = $1 AND id = $2 AND ativo = true AND excluido_em IS NULL`,
      [input.tenantId, itemId],
    )
    if (!catalog.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', `Item ${index + 1} não encontrado.`)
    // Sem valor informado, vale o preço da tabela (faixa de quantidade) ou o do cadastro.
    const listed: TablePrice | null = await tablePrice(client, input.tenantId, priceTableId, tipo, itemId, quantity)
    const unitValue = positiveMoney(raw.valor_unitario) || (listed ? listed.preco : 0) || positiveMoney(catalog.rows[0].preco_catalogo)
    if (!unitValue) throw new ErpDomainError('VALIDATION_ERROR', `Valor unitário do item ${index + 1} precisa ser maior que zero.`)
    const gross = lineTotal(quantity, unitValue)
    if (discount > gross) throw new ErpDomainError('VALIDATION_ERROR', `Desconto do item ${index + 1} supera o valor bruto.`)
    assertTablePriceRules(index + 1, listed, quantity, gross, discount)
    items.push({
      tipo,
      itemId,
      descricao: optionalText(raw.descricao) || String(catalog.rows[0].nome),
      quantidade: quantity,
      valorUnitario: unitValue,
      desconto: discount,
      total: sumMoney([gross, -discount]),
      custo: money(catalog.rows[0].custo),
      precoTabela: listed ? listed.preco : null,
      priceRule: listed,
    })
  }

  const subtotal = sumMoney(items.map(item => item.total))
  const discount = money(input.values.desconto)
  const freight = money(input.values.frete)
  const discountType = input.values.tipo_desconto || 'valor'
  if (discountType !== 'valor' && discountType !== 'percentual') throw new ErpDomainError('INVALID_DISCOUNT','Tipo de desconto inválido.')
  const appliedDiscount = discountAmount(subtotal, discount, discountType)
  // O mínimo é comercial: considera desconto do item e o desconto geral, sem frete.
  for (const [index, item] of items.entries()) {
    const headerShare = subtotal > 0 ? appliedDiscount * item.total / subtotal : 0
    assertTablePriceRules(index + 1, item.priceRule, item.quantidade,
      lineTotal(item.quantidade, item.valorUnitario), item.desconto + headerShare)
  }
  const total = sumMoney([subtotal, -appliedDiscount, freight])
  if (total <= 0) throw new ErpDomainError('VALIDATION_ERROR', 'Total da venda precisa ser maior que zero.')
  // Permissões do usuário (1.7): vendedor da venda e desconto máximo (itens + venda sobre o bruto).
  const seller = await sellerRules(client)
  const sellerId = saleSeller(seller, input.values.vendedor_id)
  assertDiscountLimit(seller, sumMoney(items.map(item => item.total + item.desconto)),
    sumMoney([...items.map(item => item.desconto), appliedDiscount]))

  const rawInstallments = Array.isArray(input.values.parcelas) && input.values.parcelas.length > 0
    ? input.values.parcelas as Record<string, unknown>[]
    : [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: dateText(input.values.data_vencimento) || saleDate, valor: total }]
  const installments = rawInstallments.map((raw, index) => {
    const value = positiveMoney(raw.valor)
    const dueDate = dateText(raw.data_vencimento)
    if (!value || !dueDate) throw new ErpDomainError('VALIDATION_ERROR', `Parcela ${index + 1} invalida.`)
    return {
      numero: Number(raw.numero_parcela || index + 1),
      descricao: optionalText(raw.descricao) || `Parcela ${index + 1}`,
      vencimento: dueDate,
      valor: value,
      contaFinanceiraId: optionalNumericId(raw.conta_financeira_id) || optionalNumericId(input.values.conta_financeira_id),
      metodoPagamentoId: optionalNumericId(raw.metodo_pagamento_id) || optionalNumericId(input.values.metodo_pagamento_id),
    }
  })
  // GE-11, GE-12 (regras/geral.ts)
  exigirRegra(validarParcelas({ valores: installments.map(i => i.valor), numeros: installments.map(i => i.numero), total, documento: 'da venda' }))

  const saleResult = await client.query(
    `INSERT INTO erp.vendas (
       empresa_id,
       cliente_id,
       vendedor_id,
       numero,
       data_venda,
       data_competencia,
       status,
       situacao,
       tipo_documento,
       categoria_id,
       centro_custo_id,
       conta_financeira_id,
       metodo_pagamento_id,
       subtotal,
       desconto,
       frete,
       total,
       condicao_pagamento,
       observacoes,
       observacoes_pagamento,
       cobranca_emails,
       cobranca_whatsapp,
       validade_em,
       previsao_entrega,
       local_estoque_id,
       venda_origem_id,
       chave_idempotencia,
       criado_por,
       atualizado_por, tipo_desconto
     )
     VALUES ($1, $2, $3, $4, $5, $6, 'rascunho', 'em_andamento', $7, $8, $9, $10, $11,
       $12, $13, $14, $15, $16::jsonb, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $26, $27)
     RETURNING id`,
    [
      input.tenantId,
      customerId,
      sellerId,
      number,
      saleDate,
      dateText(input.values.data_competencia) || saleDate,
      documentType,
      optionalNumericId(input.values.categoria_id),
      optionalNumericId(input.values.centro_custo_id),
      optionalNumericId(input.values.conta_financeira_id),
      optionalNumericId(input.values.metodo_pagamento_id),
      subtotal,
      discount,
      freight,
      total,
      JSON.stringify({ parcelas: installments.map((installment) => ({
        numero_parcela: installment.numero,
        descricao: installment.descricao,
        data_vencimento: installment.vencimento,
        valor: installment.valor,
        conta_financeira_id: installment.contaFinanceiraId,
        metodo_pagamento_id: installment.metodoPagamentoId,
      })) }),
      optionalText(input.values.observacoes),
      optionalText(input.values.observacoes_pagamento),
      stringArray(input.values.cobranca_emails),
      optionalText(input.values.cobranca_whatsapp),
      dateText(input.values.validade_em),
      dateText(input.values.previsao_entrega),
      optionalNumericId(input.values.local_estoque_id),
      optionalNumericId(input.values.venda_origem_id),
      idempotencyKey,
      input.actorId,
      discountType,
    ],
  )
  const saleId = Number(saleResult.rows[0]?.id)
  await client.query(
    `UPDATE erp.vendas SET tabela_preco_id = $3, transportadora_id = $4, modalidade_frete = $5, volumes = $6, especie_volumes = $7,
       peso_bruto = $8, peso_liquido = $9 WHERE empresa_id = $1 AND id = $2`,
    [input.tenantId, saleId, priceTableId, transport.transportadoraId, transport.modalidadeFrete, transport.volumes,
      transport.especieVolumes, transport.pesoBruto, transport.pesoLiquido],
  )
  await client.query("UPDATE erp.vendas SET metadata=metadata || jsonb_build_object('commercialRequest',$3::jsonb) WHERE empresa_id=$1 AND id=$2",[input.tenantId,saleId,JSON.stringify(input.values)])

  for (const installment of installments) {
    await client.query(
      `INSERT INTO erp.vendas_recebimentos_previstos (
         empresa_id, venda_id, numero_parcela, descricao, data_vencimento, valor,
         conta_financeira_id, metodo_pagamento_id, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
      [input.tenantId, saleId, installment.numero, installment.descricao, installment.vencimento,
        installment.valor, installment.contaFinanceiraId, installment.metodoPagamentoId, input.actorId],
    )
  }

  for (const item of items) {
    await client.query(
      `INSERT INTO erp.vendas_itens (
         empresa_id, venda_id, produto_id, servico_id, descricao, quantidade,
         valor_unitario, custo_unitario, desconto, total, preco_tabela, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $12, $11, $11)`,
      [input.tenantId, saleId, item.tipo === 'produto' ? item.itemId : null,
        item.tipo === 'servico' ? item.itemId : null, item.descricao, item.quantidade,
        item.valorUnitario, item.custo, item.desconto, item.total, input.actorId, item.precoTabela],
    )
  }

  if (!input.temporary) {
    await client.query(
      `INSERT INTO erp.vendas_eventos (empresa_id, venda_id, evento, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'criada', 'rascunho', 1, '{}'::jsonb, $3)`,
      [input.tenantId, saleId, input.actorId],
    )
  }

  return { id: String(saleId) }
}
export async function updateErpSaleDraft(input: {
  tenantId: number
  actorId: number
  id: string | number
  expectedVersion: number
  values: Record<string, unknown>
}) {
  const id = numericId(input.id, 'Venda')
  await withTransaction(async (client) => {
    const currentResult = await client.query(
      `SELECT id, numero, status, situacao, tipo_documento, versao, aprovada_em, aprovada_por FROM erp.vendas
       WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`, [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new ErpDomainError('VALIDATION_ERROR', 'Venda não encontrada.')
    if (current.status !== 'rascunho') throw new ErpDomainError('VALIDATION_ERROR', 'Somente vendas em rascunho podem ser editadas.')
    if (current.tipo_documento === 'orcamento' && quoteIsClosed(current.situacao)) throw new ErpDomainError('INVALID_STATE', 'Orçamento encerrado não pode ser editado.', 409)
    exigirRegra(conferirVersao({ atual: Number(current.versao), esperada: input.expectedVersion, documento: 'Esta venda' }))

    const staged = await createSaleRecord(client, {
      tenantId: input.tenantId, actorId: input.actorId, entityId: 'pedidos', temporary: true,
      values: { ...input.values, numero: `TMP-VEN-${id}-${Date.now()}` },
    })
    const stagedId = numericId(staged.id, 'Venda temporaria')
    await client.query(`DELETE FROM erp.vendas_itens WHERE empresa_id = $1 AND venda_id = $2`, [input.tenantId, id])
    await client.query(`DELETE FROM erp.vendas_recebimentos_previstos WHERE empresa_id = $1 AND venda_id = $2`, [input.tenantId, id])
    await client.query(`UPDATE erp.vendas_itens SET venda_id = $3 WHERE empresa_id = $1 AND venda_id = $2`, [input.tenantId, stagedId, id])
    await client.query(`UPDATE erp.vendas_recebimentos_previstos SET venda_id = $3 WHERE empresa_id = $1 AND venda_id = $2`, [input.tenantId, stagedId, id])
    const updated = await client.query(
      `UPDATE erp.vendas AS target SET
         cliente_id = source.cliente_id, numero = $4, data_venda = source.data_venda,
         data_competencia = source.data_competencia, vendedor_id = source.vendedor_id,
         tipo_documento = source.tipo_documento, validade_em = source.validade_em,
         situacao = CASE WHEN target.tipo_documento='orcamento' THEN 'em_andamento' ELSE target.situacao END,
         aprovada_em = CASE WHEN target.tipo_documento='orcamento' THEN NULL ELSE target.aprovada_em END,
         aprovada_por = CASE WHEN target.tipo_documento='orcamento' THEN NULL ELSE target.aprovada_por END,
         enviada_em = CASE WHEN target.tipo_documento='orcamento' THEN NULL ELSE target.enviada_em END,
         previsao_entrega = source.previsao_entrega, local_estoque_id = source.local_estoque_id,
         categoria_id = source.categoria_id,
         centro_custo_id = source.centro_custo_id, conta_financeira_id = source.conta_financeira_id,
         metodo_pagamento_id = source.metodo_pagamento_id, subtotal = source.subtotal,
         tipo_desconto = source.tipo_desconto, desconto = source.desconto, frete = source.frete, total = source.total,
         condicao_pagamento = source.condicao_pagamento, observacoes = source.observacoes,
         observacoes_pagamento = source.observacoes_pagamento, cobranca_emails = source.cobranca_emails,
         cobranca_whatsapp = source.cobranca_whatsapp, tabela_preco_id = source.tabela_preco_id,
         transportadora_id = source.transportadora_id, modalidade_frete = source.modalidade_frete, volumes = source.volumes,
         especie_volumes = source.especie_volumes, peso_bruto = source.peso_bruto, peso_liquido = source.peso_liquido,
         versao = target.versao + 1, atualizado_por = $5
       FROM erp.vendas AS source
       WHERE target.empresa_id = $1 AND target.id = $2 AND source.empresa_id = target.empresa_id
         AND source.id = $3 AND target.versao = $6
       RETURNING target.versao, target.numero, target.total`,
      [input.tenantId, id, stagedId, optionalText(input.values.numero) || current.numero, input.actorId, input.expectedVersion],
    )
    if (!updated.rows[0]) exigirRegra(versaoMudou('Esta venda'))
    await client.query(`DELETE FROM erp.vendas WHERE empresa_id = $1 AND id = $2`, [input.tenantId, stagedId])
    await client.query(
      `INSERT INTO erp.vendas_eventos (empresa_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'atualizada', 'rascunho', 'rascunho', $3, $4::jsonb, $5)`,
      [input.tenantId, id, updated.rows[0].versao, JSON.stringify({ numero: updated.rows[0].numero, total: updated.rows[0].total, situacao_anterior:current.situacao, aprovacao_anterior:current.aprovada_em?{em:current.aprovada_em,por:current.aprovada_por}:null }), input.actorId],
    )
  })
  return getErpSaleDetails(input.tenantId, id)
}

// Part of the ERP repository, split by area from erpRepository.ts. erpRepository.ts re-exports the public names.
import { validarCancelamentoCompra, validarConfirmacaoCompra, validarContaPagarDaCompra, validarDevolucaoCompra } from '../regras/compras'
import { conferirVersao, versaoMudou } from '../regras/geral'
import { validarParcelas } from '../regras/geral'
import { exigirRegra } from './erpRegras'
import { validarPrevisao } from '../regras/contas-receber'
import { runQuery, runWithErpTransactionClient, withTransaction, type SQLClient } from '@/lib/postgres'
import { erpToday } from '@/products/erp/server/erpBusinessDate'
import { nextDocumentNumber } from '@/products/erp/server/erpDocumentNumbers'
import { assertErpPeriodOpen } from '@/products/erp/server/erpPeriodRepository'
import {
    receiveStockForPurchase,
    reverseStockForPurchase
} from '@/products/erp/server/erpStockRepository'
import { parseNfeXml } from '@/products/erp/server/fiscal/nfeParser'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import type { ErpEntityRecord } from '@/products/erp/shared/types'
import { assertCommercialReplay as assertOperationReplay, commercialRequest } from './erpCommercialIdempotency'
import { financialCompositionSql } from './erpFinancialComposition'
import { FINANCIAL_CATEGORY_LEAF_SQL, paymentMethodId } from './erpReceivablesPayablesRepository'
import { appendPagination, appendRecordStatusFilter, appendSearch, booleanValue, dateText, jsonObject, money, normalizedIdempotencyKey, numericId, optionalNumericId, optionalText, positiveMoney, text, type ConfirmErpPurchaseResult, type CreateInput, type IdActionInput, type InstallmentRow, type ListInput, type NormalizedInstallment, type PurchaseItemInput, type PurchaseRow, type ReceivableRow } from './erpRepositoryCore'
import { requireOperationKey } from './erpSettlementIdentity'

function purchaseType(value: unknown) {
  return text(value).toLowerCase() === 'servico' ? 'servico' : 'produto'
}
function purchaseMovement(value: unknown) {
  const normalized = text(value).toLowerCase()
  if (['cotacao', 'pedido_recorrente', 'pedido_compra', 'compra'].includes(normalized)) return normalized
  return 'cotacao'
}
function purchaseStatusForMovement(movement: string) {
  if (movement === 'compra') return 'recebida'
  if (movement === 'pedido_compra' || movement === 'pedido_recorrente') return 'confirmada'
  return 'rascunho'
}
function normalizePurchaseItems(values: Record<string, unknown>): PurchaseItemInput[] {
  const rawItems = Array.isArray(values.itens) ? values.itens : [{
    produto_id: values.produto_id,
    servico_id: values.servico_id,
    descricao: values.descricao,
    detalhes: values.detalhes,
    unidade: values.unidade,
    quantidade: values.quantidade,
    valor_unitario: values.valor_unitario,
    percentual_desconto: values.percentual_desconto,
    valor_desconto: values.valor_desconto,
  }]

  if (rawItems.length === 0) throw new ErpDomainError('VALIDATION_ERROR', 'Adicione pelo menos um item a compra.')
  return rawItems.map((rawItem, index) => {
    const item = rawItem as Record<string, unknown>
    const produtoId = optionalNumericId(item.produto_id)
    const servicoId = optionalNumericId(item.servico_id)
    if ((produtoId ? 1 : 0) + (servicoId ? 1 : 0) !== 1) {
      throw new ErpDomainError('VALIDATION_ERROR', `Selecione um produto ou serviço no item ${index + 1}.`)
    }

    const quantidade = Number(String(item.quantidade ?? 1).replace(',', '.'))
    const valorUnitario = Number(String(item.valor_unitario ?? 0).replace(',', '.'))
    const percentual = item.percentual_desconto == null || item.percentual_desconto === ''
      ? null
      : Number(String(item.percentual_desconto).replace(',', '.'))
    if (!Number.isFinite(quantidade) || quantidade <= 0) throw new ErpDomainError('VALIDATION_ERROR', `Quantidade do item ${index + 1} invalida.`)
    if (!Number.isFinite(valorUnitario) || valorUnitario < 0) throw new ErpDomainError('VALIDATION_ERROR', `Valor unitário do item ${index + 1} invalido.`)
    if (percentual != null && (!Number.isFinite(percentual) || percentual < 0 || percentual > 100)) {
      throw new ErpDomainError('VALIDATION_ERROR', `Desconto percentual do item ${index + 1} invalido.`)
    }

    const valorBruto = Number((quantidade * valorUnitario).toFixed(2))
    const informedDiscount = item.valor_desconto == null || item.valor_desconto === ''
      ? null
      : money(item.valor_desconto)
    const valorDesconto = informedDiscount ?? Number((valorBruto * ((percentual || 0) / 100)).toFixed(2))
    if (valorDesconto > valorBruto) throw new ErpDomainError('VALIDATION_ERROR', `Desconto do item ${index + 1} supera o valor bruto.`)

    return {
      produtoId,
      servicoId,
      descricao: optionalText(item.descricao) || '', // empty: the insert takes the catalog name
      detalhes: optionalText(item.detalhes),
      unidade: optionalText(item.unidade),
      quantidade,
      valorUnitario,
      percentualDesconto: percentual,
      valorDesconto,
      valorBruto,
      valorLiquido: Number((valorBruto - valorDesconto).toFixed(2)),
    }
  })
}
function validatePurchaseInstallments(purchase: PurchaseRow, installments: NormalizedInstallment[]) {
  for (const installment of installments) {
    if (!dateText(installment.dataVencimento)) throw new ErpDomainError('VALIDATION_ERROR', `Vencimento da parcela ${installment.numeroParcela} invalido.`)
    if (money(installment.valor) <= 0) throw new ErpDomainError('VALIDATION_ERROR', `Valor da parcela ${installment.numeroParcela} invalido.`)
  }
  // GE-11, GE-12 (regras/geral.ts)
  exigirRegra(validarParcelas({ valores: installments.map(i => i.valor), numeros: installments.map(i => i.numeroParcela), total: money(purchase.total), documento: 'da compra' }))
  return installments
}
function normalizePurchaseInstallments(purchase: PurchaseRow): NormalizedInstallment[] {
  const paymentCondition = purchase.condicao_pagamento as { parcelas?: unknown } | null
  const installments = Array.isArray(paymentCondition?.parcelas) ? paymentCondition.parcelas : []
  const normalized = installments.map((installment, index): NormalizedInstallment => {
      const item = installment as Record<string, unknown>
      const value = positiveMoney(item.valor)
      const dueDate = dateText(item.data_vencimento)
      if (!value) throw new ErpDomainError('VALIDATION_ERROR', `Valor da parcela ${index + 1} invalido.`)
      if (!dueDate) throw new ErpDomainError('VALIDATION_ERROR', `Vencimento da parcela ${index + 1} invalido.`)

      return {
        numeroParcela: Number(item.numero_parcela || index + 1),
        descricao: optionalText(item.descricao) || `Parcela ${index + 1}`,
        dataVencimento: dueDate,
        valor: value,
        percentual: item.percentual == null ? null : Number(item.percentual),
        contaFinanceiraId: paymentMethodId(item.conta_financeira_id),
        metodoPagamentoId: paymentMethodId(item.metodo_pagamento_id),
        observacoes: optionalText(item.observacoes),
      }
    })

  if (normalized.length > 0) return validatePurchaseInstallments(purchase, normalized)

  return validatePurchaseInstallments(purchase, [{
    numeroParcela: 1,
    descricao: 'Parcela 1',
    dataVencimento: dateText(purchase.data_compra) || erpToday(),
    valor: money(purchase.total),
  }])
}
async function resolvePurchaseInstallments(client: Pick<SQLClient, 'query'>, purchase: PurchaseRow) {
  const plannedResult = await client.query(
    `SELECT id, numero_parcela, descricao, data_vencimento, valor, percentual, conta_financeira_id, metodo_pagamento_id, observacoes
     FROM erp.compras_parcelas_previstas
     WHERE empresa_id = $1
       AND compra_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [purchase.empresa_id, purchase.id],
  )
  if (plannedResult.rows.length === 0) return normalizePurchaseInstallments(purchase)

  return validatePurchaseInstallments(purchase, plannedResult.rows.map((row) => ({
    numeroParcela: Number(row.numero_parcela),
    descricao: optionalText(row.descricao),
    dataVencimento: dateText(row.data_vencimento) || '',
    valor: money(row.valor),
    percentual: row.percentual == null ? null : Number(row.percentual),
    contaFinanceiraId: paymentMethodId(row.conta_financeira_id),
    metodoPagamentoId: paymentMethodId(row.metodo_pagamento_id),
    observacoes: optionalText(row.observacoes),
    commercialForecastId: row.id as string | number,
  })))
}
export async function createOrUpdatePurchasePayable(
  client: Pick<SQLClient, 'query'>,
  purchase: PurchaseRow,
  actorId: number,
  type: 'previsao' | 'efetivo',
) {
  if (!purchase.gera_financeiro || money(purchase.total) <= 0) return null
  exigirRegra(validarContaPagarDaCompra({ tipoMovimento: String(purchase.tipo_movimento) })) // CP-13 (antes no banco, BD-42)

  const installments = await resolvePurchaseInstallments(client, purchase)
  const existing = await fetchPayableForPurchase(client, Number(purchase.empresa_id), purchase.id)
  let payable: ReceivableRow

  if (existing) {
    // CR-09 (antes BD-31 no banco): título efetivado ou utilizado não volta a previsão.
    if (type === 'previsao') exigirRegra(validarPrevisao({ efetivado: existing.payable.tipo_lancamento === 'efetivo',
      utilizado: existing.payable.status === 'pago' || existing.payable.status === 'parcial' }))
    if (existing.payable.status === 'pago' || existing.payable.status === 'parcial') {
      if (type !== existing.payable.tipo_lancamento) {
        throw new ErpDomainError('VALIDATION_ERROR', 'Não e possível alterar a natureza de uma conta que já possui pagamento.')
      }
      return existing
    }

    const updated = await client.query(
      `UPDATE erp.contas_pagar
       SET tipo_lancamento = $3,
           efetivado_em = CASE WHEN $3 = 'efetivo' THEN COALESCE(efetivado_em, now()) ELSE NULL END,
           descricao = $4,
           numero_documento = $5,
           data_competencia = $6,
           data_emissao = $7,
           valor_total = $8,
           status = 'aberto',
           categoria_id = $9,
           centro_custo_id = $10,
           fornecedor_nome_snapshot = $11,
           fornecedor_documento_snapshot = $12,
           atualizado_por = $13
       WHERE empresa_id = $1 AND id = $2
       RETURNING id::text, status, tipo_lancamento`,
      [
        purchase.empresa_id,
        existing.payable.id,
        type,
        `${type === 'previsao' ? 'Previsao' : 'Compra'} ${purchase.numero || purchase.id}`,
        purchase.numero,
        dateText(purchase.data_competencia) || dateText(purchase.data_compra),
        dateText(purchase.data_compra),
        money(purchase.total),
        purchase.categoria_id,
        purchase.centro_custo_id,
        purchase.fornecedor_nome_snapshot,
        purchase.fornecedor_documento_snapshot,
        actorId,
      ],
    )
    payable = updated.rows[0] as ReceivableRow
    await client.query(
      `UPDATE erp.contas_pagar_parcelas
       SET excluido_em = now(), atualizado_por = $3
       WHERE empresa_id = $1 AND conta_pagar_id = $2 AND excluido_em IS NULL`,
      [purchase.empresa_id, payable.id, actorId],
    )
  } else {
    const created = await client.query(
      `INSERT INTO erp.contas_pagar (
         empresa_id, fornecedor_id, compra_id, descricao, numero_documento,
         data_competencia, data_emissao, valor_total, status, categoria_id,
         centro_custo_id, origem, tipo_lancamento, fornecedor_nome_snapshot,
         fornecedor_documento_snapshot, efetivado_em, criado_por, atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'aberto', $9, $10, 'compra', $11, $12, $13,
         CASE WHEN $11 = 'efetivo' THEN now() ELSE NULL END, $14, $14)
       RETURNING id::text, status, tipo_lancamento`,
      [
        purchase.empresa_id,
        purchase.fornecedor_id,
        purchase.id,
        `${type === 'previsao' ? 'Previsao' : 'Compra'} ${purchase.numero || purchase.id}`,
        purchase.numero,
        dateText(purchase.data_competencia) || dateText(purchase.data_compra),
        dateText(purchase.data_compra),
        money(purchase.total),
        purchase.categoria_id,
        purchase.centro_custo_id,
        type,
        purchase.fornecedor_nome_snapshot,
        purchase.fornecedor_documento_snapshot,
        actorId,
      ],
    )
    payable = created.rows[0] as ReceivableRow
  }

  const createdInstallments: InstallmentRow[] = []
  for (const installment of installments) {
    const result = await client.query(
      `INSERT INTO erp.contas_pagar_parcelas (
         empresa_id, conta_pagar_id, numero_parcela, descricao, data_vencimento,
         data_pagamento_previsto, valor, valor_bruto, valor_liquido, valor_pago,
         status, conta_financeira_id, metodo_pagamento_id, observacoes, parcela_prevista_id, criado_por, atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $5, $6, $6, $6, 0, 'aberto', $7, $8, $9, $10, $11, $11)
       RETURNING id::text, numero_parcela, valor, status`,
      [
        purchase.empresa_id,
        payable.id,
        installment.numeroParcela,
        installment.descricao,
        installment.dataVencimento,
        installment.valor,
        installment.contaFinanceiraId || purchase.conta_financeira_id,
        installment.metodoPagamentoId || purchase.metodo_pagamento_id,
        installment.observacoes,
        installment.commercialForecastId,
        actorId,
      ],
    )
    createdInstallments.push(result.rows[0] as InstallmentRow)
  }

  await client.query(
    `INSERT INTO erp.contas_pagar_eventos (empresa_id, conta_pagar_id, evento, dados, criado_por)
     VALUES ($1, $2, $3, $4::jsonb, $5)`,
    [purchase.empresa_id, payable.id, type === 'efetivo' ? 'efetivada' : 'previsao_criada', JSON.stringify({ compra_id: purchase.id }), actorId],
  )
  return { payable, installments: createdInstallments }
}
async function fetchPayableForPurchase(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  purchaseId: string | number,
) {
  const payableResult = await client.query(
    `SELECT id::text, status, tipo_lancamento
     FROM erp.contas_pagar
     WHERE empresa_id = $1
       AND compra_id = $2
       AND excluido_em IS NULL
     LIMIT 1`,
    [tenantId, purchaseId],
  )
  const payable = payableResult.rows[0] as ReceivableRow | undefined
  if (!payable) return null

  const installmentsResult = await client.query(
    `SELECT id::text, numero_parcela, valor, status
     FROM erp.contas_pagar_parcelas
     WHERE empresa_id = $1
       AND conta_pagar_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [tenantId, payable.id],
  )

  return {
    payable,
    installments: installmentsResult.rows as InstallmentRow[],
  }
}
function mapConfirmPurchaseResult(
  purchase: PurchaseRow,
  payable: ReceivableRow | null,
  installments: InstallmentRow[],
): ConfirmErpPurchaseResult {
  return {
    purchase: {
      id: String(purchase.id),
      status: String(purchase.status),
    },
    payable: payable
      ? {
          id: String(payable.id),
          status: String(payable.status),
        }
      : null,
    installments: installments.map((installment) => ({
      id: String(installment.id),
      numero_parcela: Number(installment.numero_parcela),
      valor: Number(installment.valor),
      status: String(installment.status),
    })),
  }
}
export async function listErpPurchaseCatalogs(tenantId: number) {
  const [suppliers, products, services, categories, costCenters, financialAccounts, paymentMethods, operationNatures, locations, purchaseCandidates] = await Promise.all([
    runQuery(`SELECT id::text, nome, documento FROM erp.entidades WHERE empresa_id = $1 AND eh_fornecedor = true AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(sku, codigo, '') AS codigo, COALESCE(unidade_medida, 'UN') AS unidade, custo AS valor_padrao FROM erp.produtos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT id::text, nome, COALESCE(codigo, '') AS codigo, 'UN'::text AS unidade, custo AS valor_padrao FROM erp.servicos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome LIMIT 50`, [tenantId]),
    runQuery(`SELECT categorias.id::text, COALESCE(pai.nome || ' › ', '') || categorias.nome AS nome FROM erp.categorias categorias LEFT JOIN erp.categorias pai ON pai.empresa_id = categorias.empresa_id AND pai.id = categorias.categoria_pai_id WHERE categorias.empresa_id = $1 AND categorias.tipo = 'despesa' AND categorias.ativo = true AND categorias.excluido_em IS NULL AND ${FINANCIAL_CATEGORY_LEAF_SQL} ORDER BY 2`, [tenantId]),
    runQuery(`SELECT id::text, nome FROM erp.centros_custo WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo, padrao FROM erp.contas_financeiras WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY padrao DESC, nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, tipo FROM erp.metodos_pagamento WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, codigo, atualiza_estoque, gera_financeiro_padrao FROM erp.naturezas_operacao_compra WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL ORDER BY nome`, [tenantId]),
    runQuery(`SELECT id::text, nome, codigo, padrao FROM erp.locais_estoque WHERE empresa_id = $1 AND ativo = true AND permite_compra = true AND excluido_em IS NULL ORDER BY padrao DESC, nome`, [tenantId]),
    runQuery(`SELECT compras.id::text, compras.numero, compras.total, entidades.nome AS fornecedor
      FROM erp.compras AS compras
      JOIN erp.entidades AS entidades ON entidades.empresa_id = compras.empresa_id AND entidades.id = compras.fornecedor_id
      WHERE compras.empresa_id = $1 AND compras.tipo_movimento <> 'cancelada' AND compras.excluido_em IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM erp.notas_fiscais AS notas
          WHERE notas.empresa_id = compras.empresa_id AND notas.compra_id = compras.id AND notas.excluido_em IS NULL
        )
      ORDER BY compras.data_compra DESC, compras.id DESC LIMIT 200`, [tenantId]),
  ])

  return { suppliers, products, services, categories, costCenters, financialAccounts, paymentMethods, operationNatures, locations, purchaseCandidates }
}
export async function listErpPurchaseInvoices(tenantId: number) {
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT
       notas.id::text,
       notas.chave_acesso,
       notas.numero,
       notas.serie,
       notas.status,
       notas.valor_total,
       notas.emitida_em,
       notas.compra_id::text,
       entidades.nome AS fornecedor,
       compras.numero AS compra_numero
     FROM erp.notas_fiscais AS notas
     JOIN erp.entidades AS entidades
       ON entidades.empresa_id = notas.empresa_id AND entidades.id = notas.entidade_id
     LEFT JOIN erp.compras AS compras
       ON compras.empresa_id = notas.empresa_id AND compras.id = notas.compra_id
     WHERE notas.empresa_id = $1
       AND notas.direcao = 'entrada'
       AND notas.excluido_em IS NULL
     ORDER BY notas.emitida_em DESC NULLS LAST, notas.id DESC
     LIMIT 300`,
    [tenantId],
  )
  return rows.map((row) => ({
    id: String(row.id),
    chave_acesso: String(row.chave_acesso || ''),
    numero: String(row.numero || ''),
    serie: String(row.serie || ''),
    fornecedor: String(row.fornecedor || ''),
    valor_total: Number(row.valor_total || 0),
    emitida_em: row.emitida_em ? new Date(String(row.emitida_em)).toISOString() : '',
    status: String(row.status || ''),
    compra_id: String(row.compra_id || ''),
    compra_numero: String(row.compra_numero || ''),
  }))
}
export async function getErpPurchaseDetails(tenantId: number, idValue: string | number) {
  const id = numericId(idValue, 'Compra')
  const [purchases, items, installments, events, invoices] = await Promise.all([
    runQuery<Record<string, unknown>>(
      `SELECT compras.*, entidades.nome AS fornecedor_nome, entidades.documento AS fornecedor_documento
       FROM erp.compras JOIN erp.entidades
         ON entidades.empresa_id = compras.empresa_id AND entidades.id = compras.fornecedor_id
       WHERE compras.empresa_id = $1 AND compras.id = $2 AND compras.excluido_em IS NULL`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT itens.id::text, CASE WHEN itens.produto_id IS NOT NULL THEN 'produto' ELSE 'servico' END AS tipo,
         COALESCE(itens.produto_id, itens.servico_id)::text AS item_id, itens.descricao, itens.detalhes,
         itens.unidade, itens.quantidade, itens.quantidade_recebida, itens.local_estoque_id::text,
         itens.valor_unitario, itens.valor_desconto, itens.total, COALESCE(produtos.controla_estoque, false) AS controla_estoque
       FROM erp.compras_itens itens
       LEFT JOIN erp.produtos produtos ON produtos.empresa_id = itens.empresa_id AND produtos.id = itens.produto_id
       WHERE itens.empresa_id = $1 AND itens.compra_id = $2
         AND itens.excluido_em IS NULL ORDER BY itens.id`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT id::text, numero_parcela, descricao, data_vencimento, valor,
         conta_financeira_id::text, metodo_pagamento_id::text
       FROM erp.compras_parcelas_previstas WHERE empresa_id = $1 AND compra_id = $2
         AND excluido_em IS NULL ORDER BY numero_parcela`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT evento, dados, criado_em FROM erp.compras_eventos
       WHERE empresa_id = $1 AND compra_id = $2 ORDER BY criado_em DESC`, [tenantId, id],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT id::text, numero, serie, chave_acesso, status, valor_total, emitida_em
       FROM erp.notas_fiscais WHERE empresa_id = $1 AND compra_id = $2 AND excluido_em IS NULL
       ORDER BY criado_em DESC`, [tenantId, id],
    ),
  ])
  if (!purchases[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Compra não encontrada.')
  return { purchase: purchases[0], items, installments, events, invoices }
}
export async function importErpPurchaseInvoice(input: {
  tenantId: number
  actorId: number
  values: Record<string, unknown>
}) {
  return withTransaction(async (client) => {
    const parsedNfe = parseNfeXml(input.values.xml)
    const values = { ...input.values, ...parsedNfe }
    const key = parsedNfe.chave_acesso
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`erp:nfe-entrada:${input.tenantId}:${key}`])
    const supplierData = jsonObject(values.fornecedor) as Record<string, unknown>
    const supplierName = optionalText(supplierData.nome)
    const supplierDocument = text(supplierData.documento).replace(/\D/g, '')
    if (!supplierName || !supplierDocument) throw new ErpDomainError('VALIDATION_ERROR', 'Fornecedor da NF-e inválido.')
    const total = money(values.valor_total)
    const issueDate = dateText(values.data_emissao) || erpToday()
    const recipientDocument = text(values.destinatario_documento).replace(/\D/g, '')
    if (!recipientDocument) throw new ErpDomainError('VALIDATION_ERROR', 'Destinatario da NF-e não identificado.')

    const fiscalConfig = await client.query(
      `SELECT regexp_replace(cnpj, '\\D', '', 'g') AS cnpj
       FROM erp.fiscal_issuer_for_operations($1,$2) AS config(empresa_id,id,cnpj,inscricao_estadual,endereco_codigo_municipio)
       WHERE empresa_id = $1
       ORDER BY id LIMIT 1`,
      [input.tenantId, parsedNfe.ambiente || 'producao'],
    )
    const configuredDocument = text(fiscalConfig.rows[0]?.cnpj)
    if (!configuredDocument) {
      throw new ErpDomainError('VALIDATION_ERROR', 'Configure o CNPJ da empresa antes de importar NF-e de entrada.')
    }
    if (configuredDocument !== recipientDocument) {
      throw new ErpDomainError('VALIDATION_ERROR', 'A NF-e não foi emitida para o CNPJ configurado neste tenant.')
    }

    const existingResult = await client.query(
      `SELECT id::text, compra_id::text, status
       FROM erp.notas_fiscais
       WHERE empresa_id = $1 AND chave_acesso = $2 AND direcao = 'entrada' AND excluido_em IS NULL
       LIMIT 1`,
      [input.tenantId, key],
    )
    if (existingResult.rows[0]) return { invoice: existingResult.rows[0], reused: true }

    let supplierResult = await client.query(
      `SELECT id, nome, documento, eh_fornecedor FROM erp.entidades
       WHERE empresa_id = $1 AND regexp_replace(COALESCE(documento, ''), '\\D', '', 'g') = $2
         AND excluido_em IS NULL LIMIT 1`,
      [input.tenantId, supplierDocument],
    )
    if (!supplierResult.rows[0]) {
      supplierResult = await client.query(
        `INSERT INTO erp.entidades (
           empresa_id, tipo_pessoa, nome, documento, eh_cliente, eh_fornecedor,
           ativo, criado_por, atualizado_por, metadata
         ) VALUES ($1, 'juridica', $2, $3, false, true, true, $4, $4, $5::jsonb)
         RETURNING id, nome, documento`,
        [input.tenantId, supplierName, supplierDocument, input.actorId, JSON.stringify({ origem: 'xml_nfe' })],
      )
    } else if (!Boolean((supplierResult.rows[0] as Record<string, unknown>).eh_fornecedor)) {
      await client.query(
        `UPDATE erp.entidades SET eh_fornecedor = true, atualizado_por = $3 WHERE empresa_id = $1 AND id = $2`,
        [input.tenantId, supplierResult.rows[0].id, input.actorId],
      )
    }
    const supplier = supplierResult.rows[0]

    const items = Array.isArray(values.itens) ? values.itens as Record<string, unknown>[] : []
    if (items.length === 0) throw new ErpDomainError('VALIDATION_ERROR', 'A NF-e não possui itens válidos.')
    const generatePurchase = booleanValue(input.values.gerar_compra ?? true)
    const generateFinancial = booleanValue(input.values.gera_financeiro ?? true)
    const additionalTaxes = Math.max(0, Number((
      total - money(values.valor_produtos) + money(values.desconto) - money(values.frete)
    ).toFixed(2)))
    let purchase: PurchaseRow | null = null

    if (generatePurchase) {
      const requestedPurchaseId = optionalNumericId(input.values.compra_id)
      if (requestedPurchaseId) {
        const existingPurchase = await client.query(
          `SELECT compras.*
           FROM erp.compras AS compras
           WHERE compras.empresa_id = $1 AND compras.id = $2
             AND compras.fornecedor_id = $3 AND compras.total = $4
             AND compras.tipo_movimento <> 'cancelada' AND compras.excluido_em IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM erp.notas_fiscais AS notas
               WHERE notas.empresa_id = compras.empresa_id AND notas.compra_id = compras.id AND notas.excluido_em IS NULL
             )
           FOR UPDATE`,
          [input.tenantId, requestedPurchaseId, supplier.id, total],
        )
        purchase = existingPurchase.rows[0] as PurchaseRow | undefined || null
        if (!purchase) throw new ErpDomainError('VALIDATION_ERROR', 'A compra escolhida não pertence ao fornecedor ou possui total diferente da NF-e.')
        if (Math.abs(money(purchase.subtotal) - money(values.valor_produtos)) > 0.02) {
          throw new ErpDomainError('VALIDATION_ERROR', 'O subtotal da compra escolhida não confere com os produtos da NF-e.')
        }
      }

      if (!purchase) {
        const purchaseResult = await client.query(
          `INSERT INTO erp.compras (
             empresa_id, fornecedor_id, numero, data_compra, data_competencia,
             status, tipo_compra, tipo_movimento, origem, fornecedor_nome_snapshot,
             fornecedor_documento_snapshot, categoria_id, natureza_operacao_id,
             subtotal, desconto, frete, impostos_adicionais, total, gera_financeiro, condicao_pagamento,
             confirmada_em, recebida_em, criado_por, atualizado_por
           ) VALUES ($1, $2, $3, $4, $4, 'recebida', 'produto', 'compra', 'xml', $5, $6,
             $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, now(), now(), $16, $16)
           RETURNING *`,
          [
            input.tenantId, supplier.id, optionalText(values.numero) || `NFE-${key.slice(-8)}`,
            issueDate, supplier.nome, supplier.documento, optionalNumericId(input.values.categoria_id),
            optionalNumericId(input.values.natureza_operacao_id), money(values.valor_produtos) || total,
            money(values.desconto), money(values.frete), additionalTaxes, total, generateFinancial,
            JSON.stringify({ parcelas: [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: dateText(values.data_vencimento) || issueDate, valor: total }] }),
            input.actorId,
          ],
        )
        purchase = purchaseResult.rows[0] as PurchaseRow

        for (const rawItem of items) {
          const code = optionalText(rawItem.codigo)
          const description = optionalText(rawItem.descricao) || 'Item importado da NF-e'
          let productResult = await client.query(
            `SELECT produtos.id, produtos.nome, produtos.unidade_medida
             FROM erp.fornecedores_produtos AS vinculos
             JOIN erp.produtos AS produtos
               ON produtos.empresa_id = vinculos.empresa_id AND produtos.id = vinculos.produto_id
             WHERE vinculos.empresa_id = $1 AND vinculos.fornecedor_id = $2
               AND lower(vinculos.codigo_fornecedor) = lower($3)
               AND vinculos.ativo = true AND vinculos.excluido_em IS NULL
               AND produtos.excluido_em IS NULL
             LIMIT 1`,
            [input.tenantId, supplier.id, code],
          )
          if (!productResult.rows[0]) {
            productResult = await client.query(
              `INSERT INTO erp.produtos (
                 empresa_id, nome, codigo, sku, unidade_medida, ncm, custo, preco_venda,
                 ativo, criado_por, atualizado_por, metadata
               ) VALUES ($1, $2, NULL, $3, $4, $5, $6, $6, true, $7, $7, $8::jsonb)
               RETURNING id, nome, unidade_medida`,
              [input.tenantId, description, `FORN-${supplier.id}-${code || key.slice(-8)}`, optionalText(rawItem.unidade) || 'UN', optionalText(rawItem.ncm), money(rawItem.valor_unitario), input.actorId, JSON.stringify({ origem: 'xml_nfe' })],
            )
          }
          const product = productResult.rows[0]
          const itemTotal = money(rawItem.valor_total)
          const quantity = Number(rawItem.quantidade || 1)
          const unitValue = money(rawItem.valor_unitario)
          if (code) {
            await client.query(
              `INSERT INTO erp.fornecedores_produtos (
                 empresa_id, fornecedor_id, produto_id, codigo_fornecedor,
                 descricao_fornecedor, unidade_fornecedor, ultimo_custo, ultima_compra_em,
                 criado_por, atualizado_por
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
               ON CONFLICT (empresa_id, fornecedor_id, lower(codigo_fornecedor))
                 WHERE excluido_em IS NULL
               DO UPDATE SET produto_id = EXCLUDED.produto_id,
                 descricao_fornecedor = EXCLUDED.descricao_fornecedor,
                 unidade_fornecedor = EXCLUDED.unidade_fornecedor,
                 ultimo_custo = EXCLUDED.ultimo_custo,
                 ultima_compra_em = EXCLUDED.ultima_compra_em,
                 ativo = true,
                 atualizado_por = EXCLUDED.atualizado_por`,
              [input.tenantId, supplier.id, product.id, code, description, optionalText(rawItem.unidade) || 'UN', unitValue, issueDate, input.actorId],
            )
          }
          await client.query(
            `INSERT INTO erp.compras_itens (
               empresa_id, compra_id, produto_id, descricao, unidade, quantidade,
               valor_unitario, valor_bruto, valor_liquido, total, item_codigo_snapshot,
               item_descricao_snapshot, item_unidade_snapshot, criado_por, atualizado_por,
               metadata
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $8, $9, $4, $5, $10, $10, $11::jsonb)`,
            [input.tenantId, purchase.id, product.id, description, optionalText(rawItem.unidade) || 'UN', quantity, unitValue, itemTotal, code, input.actorId, JSON.stringify({ ncm: rawItem.ncm, cfop: rawItem.cfop })],
          )
        }
        await client.query(
          `INSERT INTO erp.compras_parcelas_previstas (
             empresa_id, compra_id, numero_parcela, descricao, data_vencimento, valor, criado_por, atualizado_por
           ) VALUES ($1, $2, 1, 'Parcela 1', $3, $4, $5, $5)`,
          [input.tenantId, purchase.id, dateText(values.data_vencimento) || issueDate, total, input.actorId],
        )
      } else {
        const updatedPurchase = await client.query(
          `UPDATE erp.compras SET status = 'recebida', tipo_movimento = 'compra', origem = 'xml',
             gera_financeiro = $3, recebida_em = COALESCE(recebida_em, now()), atualizado_por = $4
           WHERE empresa_id = $1 AND id = $2 RETURNING *`,
          [input.tenantId, purchase.id, generateFinancial, input.actorId],
        )
        purchase = updatedPurchase.rows[0] as PurchaseRow
      }

      if (purchase) {
        await client.query(`UPDATE erp.compras SET local_estoque_id=COALESCE(local_estoque_id,$3),
          atualiza_estoque=COALESCE((SELECT n.atualiza_estoque FROM erp.naturezas_operacao_compra n
            WHERE n.empresa_id=$1 AND n.id=compras.natureza_operacao_id),atualiza_estoque)
          WHERE empresa_id=$1 AND id=$2`, [input.tenantId,purchase.id,optionalNumericId(input.values.local_estoque_id)])
        await receiveStockForPurchase(client, {tenantId:input.tenantId,actorId:input.actorId,purchaseId:Number(purchase.id)})
      }
      if (generateFinancial && purchase) await createOrUpdatePurchasePayable(client, purchase, input.actorId, 'efetivo')
    }

    const invoiceResult = await client.query(
      `INSERT INTO erp.notas_fiscais (
         empresa_id, compra_id, entidade_id, tipo, direcao, finalidade, status,
         numero, serie, chave_acesso, protocolo, valor_produtos, valor_total, emitida_em,
         xml_hash, destinatario_documento, codigo_status_sefaz, motivo_status_sefaz,
         payload_enviado, criado_por, atualizado_por, modelo_emissao, ambiente, emitente_snapshot, destinatario_snapshot
       ) VALUES ($1, $2, $3, 'nfe', 'entrada', 'normal', 'emitida', $4, $5, $6,
         $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $16, 'nfe', $17, $18::jsonb, $19::jsonb)
       RETURNING id::text, compra_id::text, status, chave_acesso`,
      [input.tenantId, purchase?.id || null, supplier.id, optionalText(values.numero), optionalText(values.serie), key,
        parsedNfe.protocolo, money(values.valor_produtos), total, issueDate, parsedNfe.xml_hash,
        recipientDocument, parsedNfe.codigo_status_sefaz, parsedNfe.motivo_status_sefaz,
        JSON.stringify({ xml: parsedNfe.xml }), input.actorId, parsedNfe.ambiente ?? null,
        JSON.stringify(parsedNfe.emitente_snapshot), JSON.stringify(parsedNfe.destinatario_snapshot)],
    )
    const invoice = invoiceResult.rows[0]

    await client.query(
      `INSERT INTO erp.notas_fiscais_totais (
         empresa_id, nota_fiscal_id, base_icms, valor_icms, base_icms_st, valor_icms_st,
         valor_fcp, valor_fcp_st, valor_ipi, valor_ii, valor_pis, valor_cofins,
         valor_seguro, outras_despesas, desconto, frete, criado_por, atualizado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)`,
      [input.tenantId, invoice.id, parsedNfe.totais.base_icms, parsedNfe.totais.valor_icms,
        parsedNfe.totais.base_icms_st, parsedNfe.totais.valor_icms_st, parsedNfe.totais.valor_fcp,
        parsedNfe.totais.valor_fcp_st, parsedNfe.totais.valor_ipi, parsedNfe.totais.valor_ii,
        parsedNfe.totais.valor_pis, parsedNfe.totais.valor_cofins, parsedNfe.totais.valor_seguro,
        parsedNfe.totais.outras_despesas, money(values.desconto), money(values.frete), input.actorId],
    )

    for (const [itemIndex, rawItem] of items.entries()) {
      const fiscalItem = parsedNfe.itens[itemIndex]
      await client.query(
        `INSERT INTO erp.notas_fiscais_itens (
           empresa_id, nota_fiscal_id, tipo_item, descricao, quantidade, valor_unitario,
           valor_total, ncm, cfop, payload_item, criado_por, atualizado_por, numero_item, codigo_item, unidade, desconto, tributos
         ) VALUES ($1, $2, 'produto', $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $10, $11, $12, $13, $14, $15::jsonb)`,
        [input.tenantId, invoice.id, optionalText(rawItem.descricao) || 'Item NF-e', Number(rawItem.quantidade || 1), money(rawItem.valor_unitario), money(rawItem.valor_total), optionalText(rawItem.ncm), optionalText(rawItem.cfop), JSON.stringify(rawItem), input.actorId,
          fiscalItem.numero_item, fiscalItem.codigo, fiscalItem.unidade, fiscalItem.desconto, JSON.stringify(fiscalItem.tributos)],
      )
    }
    return { invoice, purchase: purchase ? { id: String(purchase.id), numero: purchase.numero } : null, reused: false }
  })
}
export async function listPurchaseRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const movement = optionalText(input.filters?.tipo_movimento)
  const movementClause = movement === 'devolucao_fornecedor' ? " AND compras.metadata ? 'devolucao_fornecedor'" : movement ? ` AND compras.tipo_movimento = $${params.push(movement)}` : ''
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         compras.id::text,
         compras.numero,
         compras.data_compra,
         compras.data_prevista_entrega,
         compras.status,
         compras.versao,
         (compras.metadata ? 'devolucao_fornecedor') AS devolvida,
         compras.tipo_compra,
         compras.tipo_movimento,
         compras.total,
         compras.gera_financeiro,
         entidades.nome AS fornecedor,
         entidades.id::text AS entidade_id,
         contas.tipo_lancamento,
         COALESCE(resumo.primeiro_item, 'Sem itens') || CASE WHEN resumo.quantidade_itens > 1 THEN ' + ' || (resumo.quantidade_itens - 1)::text || CASE WHEN resumo.quantidade_itens = 2 THEN ' item' ELSE ' itens' END ELSE '' END AS descricao,
         COALESCE(categorias.nome, '') AS categoria,
         concat_ws(' ', compras.numero, entidades.nome, compras.status, compras.tipo_movimento, resumo.primeiro_item, categorias.nome, CASE WHEN compras.metadata ? 'devolucao_fornecedor' THEN 'Devolvida ao fornecedor' END) AS searchable
       FROM erp.compras AS compras
       JOIN erp.entidades AS entidades
         ON entidades.empresa_id = compras.empresa_id
        AND entidades.id = compras.fornecedor_id
       LEFT JOIN erp.categorias AS categorias ON categorias.empresa_id = compras.empresa_id AND categorias.id = compras.categoria_id
       LEFT JOIN LATERAL (
         SELECT (array_agg(itens.descricao ORDER BY itens.id))[1] AS primeiro_item, count(*)::int AS quantidade_itens
         FROM erp.compras_itens AS itens WHERE itens.empresa_id = compras.empresa_id AND itens.compra_id = compras.id AND itens.excluido_em IS NULL
       ) AS resumo ON true
       LEFT JOIN erp.contas_pagar AS contas
         ON contas.empresa_id = compras.empresa_id
        AND contas.compra_id = compras.id
        AND contas.excluido_em IS NULL
       WHERE compras.empresa_id = $1
         AND compras.excluido_em IS NULL
         ${movementClause}
     )
     SELECT id, numero, data_compra, data_prevista_entrega, status, tipo_compra, tipo_movimento,
       total, gera_financeiro, fornecedor, entidade_id, descricao, categoria, tipo_lancamento, versao, devolvida, count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY data_compra DESC, id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    numero: String(row.numero ?? ''),
    fornecedor: String(row.fornecedor ?? ''),
    descricao: String(row.descricao ?? ''),
    categoria: String(row.categoria ?? ''),
    data: dateText(row.data_compra) || '',
    entrega: dateText(row.data_prevista_entrega) || '',
    total: Number(row.total ?? 0),
    tipo_compra: String(row.tipo_compra ?? ''),
    versao: Number(row.versao),
    devolvida: Boolean(row.devolvida),
    tipo_movimento: String(row.tipo_movimento ?? ''),
    financeiro: row.gera_financeiro ? (row.tipo_lancamento === 'previsao' ? 'Previsao' : row.tipo_lancamento === 'efetivo' ? 'Efetivo' : 'Ao efetivar') : 'Não gera',
    status: String(row.status ?? ''),
    __total: Number(row.__total ?? 0),
  }))
}
export async function confirmErpPurchase(input: IdActionInput): Promise<ConfirmErpPurchaseResult> {
  return withTransaction(async (client) => {
    const purchaseResult = await client.query(
      `SELECT
         id,
         empresa_id,
         fornecedor_id,
         numero,
         data_compra,
         data_competencia,
         status,
         tipo_compra,
         tipo_movimento,
         origem,
         categoria_id,
         centro_custo_id,
         conta_financeira_id,
         metodo_pagamento_id,
         total,
         condicao_pagamento,
         gera_financeiro,
         fornecedor_nome_snapshot,
         fornecedor_documento_snapshot
       FROM erp.compras
       WHERE empresa_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const purchase = purchaseResult.rows[0] as PurchaseRow | undefined
    if (!purchase) throw new ErpDomainError('VALIDATION_ERROR', 'Compra não encontrada.')
    exigirRegra(validarConfirmacaoCompra({ cancelada: purchase.status === 'cancelada', temFornecedor: Boolean(purchase.fornecedor_id), total: money(purchase.total) }))

    const itemResult = await client.query(
      `SELECT count(*)::int AS total,
         count(*) FILTER (WHERE itens.produto_id IS NOT NULL AND produtos.controla_estoque)::int AS itens_estoque
       FROM erp.compras_itens itens
       LEFT JOIN erp.produtos produtos ON produtos.empresa_id = itens.empresa_id AND produtos.id = itens.produto_id
       WHERE itens.empresa_id = $1
         AND itens.compra_id = $2
         AND itens.excluido_em IS NULL`,
      [input.tenantId, purchase.id],
    )
    exigirRegra(validarConfirmacaoCompra({ quantidadeItens: Number(itemResult.rows[0]?.total || 0) }))

    const existingFinancial = await fetchPayableForPurchase(client, input.tenantId, purchase.id)
    if (purchase.tipo_movimento === 'compra' && ['confirmada', 'parcialmente_recebida', 'recebida'].includes(String(purchase.status))
      && (!purchase.gera_financeiro || existingFinancial?.payable.tipo_lancamento === 'efetivo')) {
      return mapConfirmPurchaseResult(purchase, existingFinancial?.payable || null, existingFinancial?.installments || [])
    }

    const purchaseDateText=dateText(purchase.data_compra)
    exigirRegra(validarConfirmacaoCompra({ dataValida: Boolean(purchaseDateText) }))
    const purchaseDate = purchaseDateText as string
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'compras', date: purchaseDate })
    if (purchase.gera_financeiro) {
      await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: purchaseDate })
    }

    const updatedPurchaseResult = await client.query(
      `UPDATE erp.compras
       SET status = CASE WHEN $4::int = 0 THEN 'recebida' ELSE 'confirmada' END,
           tipo_movimento = 'compra',
           confirmada_em = COALESCE(confirmada_em, now()),
           recebida_em = CASE WHEN $4::int = 0 THEN COALESCE(recebida_em, now()) ELSE recebida_em END,
           versao = versao + 1,
           atualizado_por = $3
       WHERE empresa_id = $1
         AND id = $2
       RETURNING
         id,
         empresa_id,
         fornecedor_id,
         numero,
         data_compra,
         data_competencia,
         status,
         tipo_compra,
         tipo_movimento,
         origem,
         categoria_id,
         centro_custo_id,
         conta_financeira_id,
         metodo_pagamento_id,
         total,
         condicao_pagamento,
         gera_financeiro,
         fornecedor_nome_snapshot,
         fornecedor_documento_snapshot`,
      [input.tenantId, purchase.id, input.actorId, Number(itemResult.rows[0]?.itens_estoque || 0)],
    )
    const updatedPurchase = updatedPurchaseResult.rows[0] as PurchaseRow
    if (!updatedPurchase.gera_financeiro) {
      await client.query(
        `INSERT INTO erp.compras_eventos (empresa_id, compra_id, evento, dados, criado_por)
         VALUES ($1, $2, 'confirmada_sem_financeiro', '{}'::jsonb, $3)`,
        [input.tenantId, updatedPurchase.id, input.actorId],
      )
      return mapConfirmPurchaseResult(updatedPurchase, null, [])
    }
    const financial = await createOrUpdatePurchasePayable(client, updatedPurchase, input.actorId, 'efetivo')
    if (!financial) return mapConfirmPurchaseResult(updatedPurchase, null, [])
    await client.query(
      `INSERT INTO erp.compras_eventos (empresa_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'confirmada', $3::jsonb, $4)`,
      [input.tenantId, updatedPurchase.id, JSON.stringify({ conta_pagar_id: financial.payable.id }), input.actorId],
    )
    return mapConfirmPurchaseResult(updatedPurchase, financial.payable, financial.installments)
  })
}
export async function cancelErpPurchase(input: IdActionInput) {
  return reversePurchase(input)
}
/** Integral operational return. Paid or credited purchases require financial reversal first. */
export async function returnErpPurchase(input: IdActionInput & { expectedVersion: number; motivo: string; idempotencyKey: string }) {
  const motivo = String(input.motivo ?? '').trim()
  if (motivo.length < 3 || motivo.length > 1000 || !Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 1)
    throw new ErpDomainError('VALIDATION_ERROR', 'Informe a versão atual e um motivo de 3 a 1000 caracteres.', 422)
  const key = requireOperationKey(input.idempotencyKey)
  return withTransaction(async client => {
    const hash = await commercialRequest(client, input.tenantId, 'devolucao_fornecedor', key, { id: String(input.id), expectedVersion: input.expectedVersion, motivo })
    const purchase = (await client.query('SELECT id,status,tipo_compra,versao,metadata,data_compra,data_competencia FROM erp.compras WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE', [input.tenantId, input.id])).rows[0]
    for (const capability of ['erp.compras.gerenciar', 'erp.financeiro.gerenciar', 'erp.estoque.movimentar']) {
      if (!(await client.query('SELECT shared.has_erp_capability($1::bigint,$2::text) AS ok', [input.tenantId, capability])).rows[0]?.ok)
        throw new ErpDomainError('ACCESS_DENIED', 'A devolução exige permissão de compras, financeiro e movimentação de estoque.', 403)
    }
    if (!purchase) throw new ErpDomainError('NOT_FOUND', 'Compra não encontrada.', 404)
    const previous = ((purchase.metadata || {}) as Record<string, unknown>).devolucao_fornecedor as { chave?: string; hash?: string } | undefined
    if (previous) {
      if (previous.chave !== key) exigirRegra(validarDevolucaoCompra({ jaDevolvida: true }))
      assertOperationReplay(previous.hash, hash)
      return { id: String(input.id), status: 'devolvida', repetido: true }
    }
    exigirRegra(conferirVersao({ atual: Number(purchase.versao), esperada: input.expectedVersion, documento: 'Esta compra' }))
    exigirRegra(validarDevolucaoCompra({ situacao: String(purchase.status), tipoCompra: String(purchase.tipo_compra) }))
    for (const businessModule of ['compras', 'financeiro'] as const) {
      await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: businessModule, date: erpToday() })
      await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: businessModule, date: dateText(purchase.data_competencia || purchase.data_compra)! })
    }
    const adjusted = await client.query(`SELECT parcelas.id FROM erp.contas_pagar_parcelas parcelas JOIN erp.contas_pagar contas ON contas.empresa_id=parcelas.empresa_id AND contas.id=parcelas.conta_pagar_id ${financialCompositionSql('pagar')} WHERE contas.empresa_id=$1 AND contas.compra_id=$2 AND parcelas.excluido_em IS NULL AND (composicao.credito<>0 OR composicao.transferido<>0) LIMIT 1`, [input.tenantId, input.id])
    exigirRegra(validarDevolucaoCompra({ temCreditosOuRenegociacoes: adjusted.rows.length > 0 }))
    await runWithErpTransactionClient(client, () => reversePurchase(input, true))
    const event = { motivo, chave: key, hash, data: erpToday(), usuario_id: input.actorId, integral: true }
    await client.query("UPDATE erp.compras SET metadata=metadata || jsonb_build_object('devolucao_fornecedor',$3::jsonb),atualizado_por=$4 WHERE empresa_id=$1 AND id=$2", [input.tenantId, input.id, JSON.stringify(event), input.actorId])
    await client.query("INSERT INTO erp.compras_eventos(empresa_id,compra_id,evento,dados,criado_por) VALUES($1,$2,'devolvida_fornecedor',$3::jsonb,$4)", [input.tenantId, input.id, JSON.stringify(event), input.actorId])
    return { id: String(input.id), status: 'devolvida', repetido: false }
  })
}
async function reversePurchase(input: IdActionInput, supplierReturn = false) {
  return withTransaction(async (client) => {
    const purchaseResult = await client.query(
      `SELECT id, empresa_id, status
       FROM erp.compras
       WHERE empresa_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const purchase = purchaseResult.rows[0] as { id: string | number; status: string } | undefined
    if (!purchase) throw new ErpDomainError('VALIDATION_ERROR', 'Compra não encontrada.')
    if (purchase.status === 'cancelada') return { id: String(purchase.id), status: 'cancelada' }

    // CP-31: compra com mercadoria recebida se devolve ao fornecedor (CP-40); a devolução usa este mesmo caminho.
    if (!supplierReturn) {
      const receipts = await client.query(
        "SELECT 1 FROM erp.movimentacoes_estoque WHERE empresa_id=$1 AND origem_tipo='compra' AND origem_id=$2 AND quantidade>0 LIMIT 1",
        [input.tenantId, purchase.id])
      exigirRegra(validarCancelamentoCompra({ temRecebimento: receipts.rows.length > 0 }))
    }

    const invoiceResult = await client.query(
      `SELECT id
       FROM erp.notas_fiscais
       WHERE empresa_id = $1
         AND compra_id = $2
         AND excluido_em IS NULL
         AND status NOT IN ('cancelada', 'falha')
       LIMIT 1`,
      [input.tenantId, purchase.id],
    )
    exigirRegra(validarCancelamentoCompra({ temNotaAtiva: Boolean(invoiceResult.rows[0]) && !supplierReturn }))

    const paymentResult = await client.query(
      `SELECT pagamentos.id
       FROM erp.pagamentos AS pagamentos
       JOIN erp.contas_pagar_parcelas AS parcelas
         ON parcelas.empresa_id = pagamentos.empresa_id
        AND parcelas.id = pagamentos.conta_pagar_parcela_id
       JOIN erp.contas_pagar AS contas
         ON contas.empresa_id = parcelas.empresa_id
        AND contas.id = parcelas.conta_pagar_id
       WHERE pagamentos.empresa_id = $1
         AND contas.compra_id = $2
         AND pagamentos.excluido_em IS NULL
         AND pagamentos.estornado_em IS NULL
         AND pagamentos.estorno_de_pagamento_id IS NULL
       LIMIT 1`,
      [input.tenantId, purchase.id],
    )
    exigirRegra(validarCancelamentoCompra({ temPagamento: Boolean(paymentResult.rows[0]) }))

    await reverseStockForPurchase(client, {
      tenantId: input.tenantId,
      actorId: input.actorId,
      purchaseId: Number(purchase.id),
      originType: supplierReturn ? 'devolucao_fornecedor' : undefined,
    })

    await client.query(
      `UPDATE erp.contas_pagar_parcelas AS parcelas
       SET status = 'cancelado', atualizado_por = $3
       FROM erp.contas_pagar AS contas
       WHERE parcelas.empresa_id = contas.empresa_id
         AND parcelas.conta_pagar_id = contas.id
         AND contas.empresa_id = $1
         AND contas.compra_id = $2
         AND parcelas.excluido_em IS NULL`,
      [input.tenantId, purchase.id, input.actorId],
    )
    await client.query(
      `UPDATE erp.contas_pagar
       SET status = 'cancelado', cancelado_em = COALESCE(cancelado_em, now()), atualizado_por = $3
       WHERE empresa_id = $1
         AND compra_id = $2
         AND excluido_em IS NULL`,
      [input.tenantId, purchase.id, input.actorId],
    )
    const updated = await client.query(
      `UPDATE erp.compras
       SET status = 'cancelada', tipo_movimento = 'cancelada', cancelada_em = COALESCE(cancelada_em, now()), versao = versao + 1, atualizado_por = $3
       WHERE empresa_id = $1
         AND id = $2
       RETURNING id::text, status`,
      [input.tenantId, purchase.id, input.actorId],
    )
    await client.query(
      `INSERT INTO erp.compras_eventos (empresa_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'cancelada', '{}'::jsonb, $3)`,
      [input.tenantId, purchase.id, input.actorId],
    )
    return updated.rows[0]
  })
}
export async function createPurchaseRecord(client: SQLClient, input: CreateInput) {
  const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey || input.values.chave_idempotencia)
  if (idempotencyKey) {
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`erp:compra:${input.tenantId}:${idempotencyKey}`])
    const existing = await client.query(
      `SELECT id FROM erp.compras
       WHERE empresa_id = $1 AND chave_idempotencia = $2 AND excluido_em IS NULL LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    if (existing.rows[0]) return { id: String(existing.rows[0].id) }
  }
  const supplierId = numericId(input.values.fornecedor_id, 'Fornecedor')
  const items = normalizePurchaseItems(input.values)
  const subtotal = Number(items.reduce((sum, item) => sum + item.valorLiquido, 0).toFixed(2))
  const discount = money(input.values.desconto)
  const freight = money(input.values.frete)
  const insurance = money(input.values.seguro)
  const otherExpenses = money(input.values.outras_despesas)
  const retainedTaxes = money(input.values.impostos_retidos)
  const total = Number((subtotal - discount + freight + insurance + otherExpenses - retainedTaxes).toFixed(2))
  if (total < 0) throw new ErpDomainError('VALIDATION_ERROR', 'Descontos e retencoes não podem superar o valor da compra.')
  const purchaseDate = dateText(input.values.data_compra) || erpToday()
  const dueDate = dateText(input.values.data_vencimento) || purchaseDate
  const number = optionalText(input.values.numero) || await nextDocumentNumber(client, input.tenantId, 'compra', purchaseDate)
  const generateFinancial = booleanValue(input.values.gera_financeiro ?? true)
  const movement = purchaseMovement(input.values.tipo_movimento)
  // Sem tipo informado (ex.: chat), compra só de serviços é de serviço; antes virava "produto" e liberava a devolução ao fornecedor (CP-40).
  const type = input.values.tipo_compra == null || input.values.tipo_compra === ''
    ? (items.length > 0 && items.every(item => !item.produtoId) ? 'servico' : 'produto')
    : purchaseType(input.values.tipo_compra)
  // Stock receipts are explicit: an effective purchase must remain pending until its items enter stock.
  const stockProducts = items.filter(item => item.produtoId).map(item => item.produtoId)
  const stockCheck = movement === 'compra' && stockProducts.length
    ? await client.query('SELECT EXISTS(SELECT 1 FROM erp.produtos WHERE empresa_id=$1 AND id=ANY($2::bigint[]) AND controla_estoque) AS requires_receipt', [input.tenantId, stockProducts])
    : null
  const status = stockCheck?.rows[0]?.requires_receipt ? 'confirmada' : purchaseStatusForMovement(movement)

  const supplierResult = await client.query(
    `SELECT id, nome, documento
     FROM erp.entidades
     WHERE empresa_id = $1
       AND id = $2
       AND eh_fornecedor = true
       AND excluido_em IS NULL
     LIMIT 1`,
    [input.tenantId, supplierId],
  )
  if (!supplierResult.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Fornecedor não encontrado.')
  const supplier = supplierResult.rows[0]

  const rawInstallments = Array.isArray(input.values.parcelas)
    ? input.values.parcelas
    : [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: dueDate, valor: total }]
  const condition = { parcelas: rawInstallments }

  const purchaseResult = await client.query(
    `INSERT INTO erp.compras (
       empresa_id,
       fornecedor_id,
       numero,
       data_compra,
       data_competencia,
       data_prevista_entrega,
       status,
       tipo_compra,
       tipo_movimento,
       natureza_operacao_id,
       atualiza_estoque,
       origem,
       fornecedor_nome_snapshot,
       fornecedor_documento_snapshot,
       categoria_id,
       centro_custo_id,
       conta_financeira_id,
       metodo_pagamento_id,
       subtotal,
       tipo_desconto,
       desconto,
       frete,
       seguro,
       outras_despesas,
       impostos_retidos,
       total,
       condicao_pagamento,
       gera_financeiro,
       observacoes,
       chave_idempotencia,
       confirmada_em,
       recebida_em,
       criado_por,
       atualizado_por
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       COALESCE((SELECT atualiza_estoque FROM erp.naturezas_operacao_compra WHERE empresa_id = $1 AND id = $10), false),
       'manual', $11, $12,
       $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
       $25::jsonb, $26, $27, $28,
       CASE WHEN $9 = 'compra' THEN now() ELSE NULL END,
       CASE WHEN $7 = 'recebida' THEN now() ELSE NULL END, $29, $29
     )
     RETURNING id, empresa_id, fornecedor_id, numero, data_compra, data_competencia,
       status, tipo_compra, tipo_movimento, origem, categoria_id, centro_custo_id,
       conta_financeira_id, metodo_pagamento_id, total, condicao_pagamento,
       gera_financeiro, fornecedor_nome_snapshot, fornecedor_documento_snapshot`,
    [
      input.tenantId,
      supplierId,
      number,
      purchaseDate,
      dateText(input.values.data_competencia) || purchaseDate,
      dateText(input.values.data_prevista_entrega),
      status,
      type,
      movement,
      optionalNumericId(input.values.natureza_operacao_id),
      supplier.nome,
      supplier.documento,
      optionalNumericId(input.values.categoria_id),
      optionalNumericId(input.values.centro_custo_id),
      optionalNumericId(input.values.conta_financeira_id),
      optionalNumericId(input.values.metodo_pagamento_id),
      subtotal,
      optionalText(input.values.tipo_desconto),
      discount,
      freight,
      insurance,
      otherExpenses,
      retainedTaxes,
      total,
      JSON.stringify(condition),
      generateFinancial,
      optionalText(input.values.observacoes),
      idempotencyKey,
      input.actorId,
    ],
  )
  const purchaseId = Number(purchaseResult.rows[0]?.id)
  // The chosen stock location is where the goods arrive on receipt.
  const purchaseLocation = optionalNumericId(input.values.local_estoque_id)
  if (purchaseLocation) await client.query('UPDATE erp.compras SET local_estoque_id = $3 WHERE empresa_id = $1 AND id = $2', [input.tenantId, purchaseId, purchaseLocation])

  for (const item of items) {
    await client.query(
      `INSERT INTO erp.compras_itens (
         empresa_id, compra_id, produto_id, servico_id, descricao, detalhes, unidade,
         quantidade, valor_unitario, percentual_desconto, valor_desconto, valor_bruto,
         valor_liquido, total, item_descricao_snapshot, item_unidade_snapshot,
         criado_por, atualizado_por
       )
       SELECT $1, $2, $3, $4, d.descricao, $6, $7, $8, $9, $10, $11, $12, $13, $13, d.descricao, $7, $14, $14
       FROM (SELECT coalesce(nullif($5::text, ''),
         (SELECT nome FROM erp.produtos WHERE empresa_id = $1 AND id = $3),
         (SELECT nome FROM erp.servicos WHERE empresa_id = $1 AND id = $4),
         CASE WHEN $3::bigint IS NOT NULL THEN 'Produto ' || $3::text ELSE 'Serviço ' || $4::text END) AS descricao) d`,
      [
        input.tenantId,
        purchaseId,
        item.produtoId,
        item.servicoId,
        item.descricao,
        item.detalhes,
        item.unidade,
        item.quantidade,
        item.valorUnitario,
        item.percentualDesconto,
        item.valorDesconto,
        item.valorBruto,
        item.valorLiquido,
        input.actorId,
      ],
    )
  }

  const purchase = purchaseResult.rows[0] as PurchaseRow
  const normalizedInstallments = total > 0 ? normalizePurchaseInstallments(purchase) : []
  for (const installment of normalizedInstallments) {
    await client.query(
      `INSERT INTO erp.compras_parcelas_previstas (
         empresa_id, compra_id, numero_parcela, descricao, data_vencimento, valor,
         percentual, conta_financeira_id, metodo_pagamento_id, observacoes,
         criado_por, atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
      [
        input.tenantId,
        purchaseId,
        installment.numeroParcela,
        installment.descricao,
        installment.dataVencimento,
        installment.valor,
        installment.percentual,
        installment.contaFinanceiraId || optionalNumericId(input.values.conta_financeira_id),
        installment.metodoPagamentoId || optionalNumericId(input.values.metodo_pagamento_id),
        installment.observacoes,
        input.actorId,
      ],
    )
  }

  if (!input.temporary) {
    await client.query(
      `INSERT INTO erp.compras_eventos (empresa_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'criada', $3::jsonb, $4)`,
      [input.tenantId, purchaseId, JSON.stringify({ tipo_movimento: movement }), input.actorId],
    )
  }

  // Orders retain commercial forecasts; the database accepts financial origins only after effectuation.
  if (generateFinancial && movement === 'compra' && total > 0) {
    await createOrUpdatePurchasePayable(client, purchase, input.actorId, 'efetivo')
  }

  return { id: String(purchaseId) }
}
export async function updateErpPurchaseDraft(input: {
  tenantId: number
  actorId: number
  id: string | number
  expectedVersion: number
  values: Record<string, unknown>
}) {
  const id = numericId(input.id, 'Compra')
  await withTransaction(async (client) => {
    const currentResult = await client.query(
      `SELECT id, numero, status, tipo_movimento, versao FROM erp.compras
       WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`, [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new ErpDomainError('VALIDATION_ERROR', 'Compra não encontrada.')
    if (current.status !== 'rascunho' || current.tipo_movimento !== 'cotacao') {
      throw new ErpDomainError('VALIDATION_ERROR', 'Somente cotacoes em rascunho podem ser editadas.')
    }
    exigirRegra(conferirVersao({ atual: Number(current.versao), esperada: input.expectedVersion, documento: 'Esta compra' }))

    const staged = await createPurchaseRecord(client, {
      tenantId: input.tenantId, actorId: input.actorId, entityId: 'pedidos-compra', temporary: true,
      values: { ...input.values, numero: `TMP-COM-${id}-${Date.now()}`, tipo_movimento: 'cotacao' },
    })
    const stagedId = numericId(staged.id, 'Compra temporaria')
    await client.query(`DELETE FROM erp.compras_itens WHERE empresa_id = $1 AND compra_id = $2`, [input.tenantId, id])
    await client.query(`DELETE FROM erp.compras_parcelas_previstas WHERE empresa_id = $1 AND compra_id = $2`, [input.tenantId, id])
    await client.query(`UPDATE erp.compras_itens SET compra_id = $3 WHERE empresa_id = $1 AND compra_id = $2`, [input.tenantId, stagedId, id])
    await client.query(`UPDATE erp.compras_parcelas_previstas SET compra_id = $3 WHERE empresa_id = $1 AND compra_id = $2`, [input.tenantId, stagedId, id])
    const updated = await client.query(
      `UPDATE erp.compras AS target SET
         fornecedor_id = source.fornecedor_id, numero = $4, data_compra = source.data_compra,
         data_competencia = source.data_competencia, data_prevista_entrega = source.data_prevista_entrega,
         tipo_compra = source.tipo_compra, natureza_operacao_id = source.natureza_operacao_id,
         atualiza_estoque = source.atualiza_estoque,
         fornecedor_nome_snapshot = source.fornecedor_nome_snapshot,
         fornecedor_documento_snapshot = source.fornecedor_documento_snapshot,
         categoria_id = source.categoria_id, centro_custo_id = source.centro_custo_id,
         conta_financeira_id = source.conta_financeira_id, metodo_pagamento_id = source.metodo_pagamento_id,
         subtotal = source.subtotal, tipo_desconto = source.tipo_desconto, desconto = source.desconto,
         frete = source.frete, seguro = source.seguro, outras_despesas = source.outras_despesas,
         impostos_retidos = source.impostos_retidos, total = source.total,
         condicao_pagamento = source.condicao_pagamento, gera_financeiro = source.gera_financeiro,
         observacoes = source.observacoes, local_estoque_id = COALESCE(source.local_estoque_id, target.local_estoque_id),
         versao = target.versao + 1, atualizado_por = $5
       FROM erp.compras AS source
       WHERE target.empresa_id = $1 AND target.id = $2 AND source.empresa_id = target.empresa_id
         AND source.id = $3 AND target.versao = $6
       RETURNING target.versao, target.numero, target.total`,
      [input.tenantId, id, stagedId, optionalText(input.values.numero) || current.numero, input.actorId, input.expectedVersion],
    )
    if (!updated.rows[0]) exigirRegra(versaoMudou('Esta compra'))
    await client.query(`DELETE FROM erp.compras WHERE empresa_id = $1 AND id = $2`, [input.tenantId, stagedId])
    await client.query(
      `INSERT INTO erp.compras_eventos (empresa_id, compra_id, evento, dados, criado_por)
       VALUES ($1, $2, 'atualizada', $3::jsonb, $4)`,
      [input.tenantId, id, JSON.stringify({ versao: updated.rows[0].versao, numero: updated.rows[0].numero, total: updated.rows[0].total }), input.actorId],
    )
  })
  return getErpPurchaseDetails(input.tenantId, id)
}

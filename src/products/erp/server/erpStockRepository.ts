import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import type { ErpOperationListInput, ErpOperationPage } from '@/products/erp/server/erpManagementRepository'
import { assertErpPeriodOpen } from '@/products/erp/server/erpPeriodRepository'
import { createHash } from 'node:crypto'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { readOperationPage } from './erpOperationPagination'

function businessDay() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Fortaleza' }).format(new Date())
}

function fingerprint(value: unknown): string {
  function canonical(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(canonical)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, canonical(x)]))
    return v
  }
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
}

async function stockLock(client: Pick<SQLClient, 'query'>, tenantId: number) {
  // One lock order across reservations, transfers, counts and commercial operations.
  await client.query('SELECT pg_advisory_xact_lock($1, hashtext(\'erp-stock-ledger\'))', [tenantId])
}

function assertSameRequest(stored: unknown, hash: string) {
  if (stored !== hash) throw new ErpDomainError('IDEMPOTENCY_CONFLICT', 'Esta identificação já foi usada com outro conteúdo.', 409)
}

type ActorInput = { tenantId: number; actorId: number }
type StockItemInput = {
  produtoId: number
  quantidade: number
  custoUnitario?: number
  vendaItemId?: number | null
  compraItemId?: number | null
}

function requiredId(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new ErpDomainError('STOCK_OPERATION_INVALID', `${label} invalido.`)
  return parsed
}

function decimal(value: unknown, label: string, allowZero = false) {
  if (value === null || value === undefined || String(value).trim() === '') throw new ErpDomainError('VALIDATION_ERROR', `${label} obrigatório.`, 422)
  const parsed = Number(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(parsed) || (allowZero ? parsed < 0 : parsed <= 0)) throw new ErpDomainError('STOCK_OPERATION_INVALID', `${label} invalido.`)
  if (parsed >= 1e12) throw new ErpDomainError('STOCK_OPERATION_INVALID', `${label} excede o limite.`)
  return Number(parsed.toFixed(6))
}

function quantity(value: unknown, label: string, allowZero = false) {
  const result = Number(decimal(value, label, allowZero).toFixed(4))
  if (!allowZero && result === 0) throw new ErpDomainError('VALIDATION_ERROR', `${label} deve ser pelo menos 0,0001.`, 422)
  return result
}

export async function readStockCountSnapshot(tenantId: number, localId: number, productIds: number[]) {
  requiredId(localId, 'Local')
  if (!productIds.length || productIds.length > 200 || productIds.some(id => !Number.isSafeInteger(id) || id <= 0) || new Set(productIds).size !== productIds.length) {
    throw new ErpDomainError('VALIDATION_ERROR', 'Selecione entre 1 e 200 produtos diferentes.', 422)
  }
  const result = await runQuery(
    `SELECT p.id::text AS produto_id, p.nome AS produto, p.unidade_medida AS unidade,
       coalesce(s.quantidade_fisica,0) AS quantidade_sistema,
       coalesce(s.quantidade_reservada,0) AS quantidade_reservada
     FROM erp.produtos p
     JOIN erp.locais_estoque l ON l.empresa_id=p.empresa_id AND l.id=$2 AND l.ativo AND l.excluido_em IS NULL
     LEFT JOIN erp.saldos_estoque s ON s.empresa_id=p.empresa_id AND s.produto_id=p.id AND s.local_estoque_id=l.id
     WHERE p.empresa_id=$1 AND p.id=ANY($3::bigint[]) AND p.ativo AND p.excluido_em IS NULL AND p.controla_estoque
     ORDER BY p.nome,p.id`, [tenantId, localId, productIds],
  )
  if (result.length !== productIds.length) throw new ErpDomainError('VALIDATION_ERROR', 'Confira os produtos e o local. A contagem aceita produtos ativos que controlam estoque.', 422)
  return result
}

function optionalText(value: unknown) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function dateText(value: unknown) {
  const normalized = optionalText(value)
  if (!normalized) return businessDay()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || new Date(`${normalized}T12:00:00Z`).toISOString().slice(0, 10) !== normalized) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Data invalida.')
  return normalized
}

async function ensureDefaultStockLocation(client: Pick<SQLClient, 'query'>, input: ActorInput) {
  await client.query(`SELECT pg_advisory_xact_lock($1, hashtext('erp-local-estoque-padrao'))`, [input.tenantId])
  const existing = await client.query(
    `SELECT id FROM erp.locais_estoque
     WHERE empresa_id = $1 AND padrao AND ativo AND excluido_em IS NULL LIMIT 1`,
    [input.tenantId],
  )
  if (existing.rows[0]) return Number(existing.rows[0].id)

  const created = await client.query(
    `INSERT INTO erp.locais_estoque
       (empresa_id, nome, codigo, descricao, padrao, criado_por, atualizado_por)
     VALUES ($1, 'Estoque principal', 'PRINCIPAL', 'Local padrao criado pelo ERP', true, $2, $2)
     RETURNING id`,
    [input.tenantId, input.actorId],
  )
  return Number(created.rows[0].id)
}

export async function resolveStockLocation(
  client: Pick<SQLClient, 'query'>,
  input: ActorInput & { localEstoqueId?: number | null; use?: 'venda' | 'compra' },
) {
  const localId = input.localEstoqueId || await ensureDefaultStockLocation(client, input)
  const result = await client.query(
    `SELECT id, permite_venda, permite_compra FROM erp.locais_estoque
     WHERE empresa_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL`,
    [input.tenantId, localId],
  )
  if (!result.rows[0]) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Local de estoque nao encontrado ou inativo.')
  if (input.use && !result.rows[0][`permite_${input.use}`]) throw new ErpDomainError('STOCK_OPERATION_INVALID', `Este local não permite operações de ${input.use}.`)
  return Number(result.rows[0].id)
}

async function lockStockBalance(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  produtoId: number,
  localEstoqueId: number,
  historical = false,
) {
  await stockLock(client, tenantId)
  const productResult = await client.query(
    `SELECT id, nome, controla_estoque, permite_estoque_negativo
     FROM erp.produtos
     WHERE empresa_id = $1 AND id = $2 AND ($3 OR (ativo AND excluido_em IS NULL))`,
    [tenantId, produtoId, historical],
  )
  const product = productResult.rows[0]
  if (!product) throw new ErpDomainError('STOCK_OPERATION_INVALID', `Produto ${produtoId} nao encontrado ou inativo.`)
  if (!historical && !product.controla_estoque) throw new ErpDomainError('STOCK_OPERATION_INVALID', `O produto ${String(product.nome)} nao controla estoque.`)

  await client.query(
    `INSERT INTO erp.saldos_estoque (empresa_id, produto_id, local_estoque_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (empresa_id, produto_id, local_estoque_id) DO NOTHING`,
    [tenantId, produtoId, localEstoqueId],
  )
  const balanceResult = await client.query(
    `SELECT * FROM erp.saldos_estoque
     WHERE empresa_id = $1 AND produto_id = $2 AND local_estoque_id = $3
     FOR UPDATE`,
    [tenantId, produtoId, localEstoqueId],
  )
  return { product, balance: balanceResult.rows[0] }
}

export async function applyStockMovement(
  client: Pick<SQLClient, 'query'>,
  input: ActorInput & {
    produtoId: number
    localEstoqueId: number
    quantidade: number
    custoUnitario?: number
    tipo: string
    origemTipo: string
    origemId?: number | null
    documentoEstoqueId?: number | null
    chaveIdempotencia: string
    dataOperacional?: string
    historical?: boolean
    reverseReceipt?: boolean
    motivo?: string | null
  },
) {
  if (!input.chaveIdempotencia?.trim()) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Identificação da operação obrigatória.')
  if (!Number.isFinite(input.quantidade) || input.quantidade === 0 || Math.abs(input.quantidade) >= 1e12) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Quantidade inválida.')
  if (input.custoUnitario !== undefined && (!Number.isFinite(input.custoUnitario) || input.custoUnitario < 0 || input.custoUnitario >= 1e12)) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Custo inválido.')
  await stockLock(client, input.tenantId)
  const requestHash = fingerprint({ produto: input.produtoId, local: input.localEstoqueId, quantidade: input.quantidade, custo: input.custoUnitario, tipo: input.tipo, origem: input.origemTipo, origemId: input.origemId || null, documento: input.documentoEstoqueId || null, data: input.dataOperacional, reverseReceipt: input.reverseReceipt || false })
  const duplicate = await client.query(
    `SELECT id, request_hash FROM erp.movimentacoes_estoque WHERE empresa_id = $1 AND chave_idempotencia = $2`,
    [input.tenantId, input.chaveIdempotencia],
  )
  if (duplicate.rows[0]) { assertSameRequest(duplicate.rows[0].request_hash, requestHash); return { id: duplicate.rows[0].id } }
  const operationDate = dateText(input.dataOperacional)
  if (operationDate !== businessDay()) throw new ErpDomainError('STOCK_DATE_INVALID', 'Movimentos de estoque devem usar o dia atual. A data histórica do documento permanece no documento de origem.', 422)
  await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'estoque', date: operationDate })

  const { product, balance } = await lockStockBalance(
    client,
    input.tenantId,
    input.produtoId,
    input.localEstoqueId,
    input.historical,
  )
  const currentQuantity = Number(balance.quantidade_fisica || 0)
  const currentAverage = Number(balance.custo_medio || 0)
  const movementQuantity = Number(input.quantidade.toFixed(4))
  if (!movementQuantity) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Quantidade abaixo da precisão de estoque.')
  const nextQuantity = Number((currentQuantity + movementQuantity).toFixed(4))
  if (nextQuantity < Number(balance.quantidade_reservada || 0) && !product.permite_estoque_negativo) {
    throw new ErpDomainError('STOCK_OPERATION_INVALID', `Saldo insuficiente para ${String(product.nome)}. Disponivel fisico: ${currentQuantity}.`)
  }

  const inputCost = movementQuantity < 0 && !input.reverseReceipt ? currentAverage : Number(input.custoUnitario ?? currentAverage)
  const remainingValue = currentQuantity * currentAverage + movementQuantity * inputCost
  if (input.reverseReceipt && nextQuantity > 0 && remainingValue < -0.00001) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'O estorno excede o valor remanescente do estoque; revise o custo antes de cancelar.')
  const nextAverage = nextQuantity === 0 ? 0 : (movementQuantity > 0 || input.reverseReceipt) && nextQuantity > 0
    ? Number((((currentQuantity * currentAverage) + (movementQuantity * inputCost)) / nextQuantity).toFixed(6))
    : currentAverage

  await client.query(
    `UPDATE erp.saldos_estoque
     SET quantidade_fisica = $4, custo_medio = $5, ultima_movimentacao_em = now(),
         atualizado_em = now(), versao = versao + 1
     WHERE empresa_id = $1 AND produto_id = $2 AND local_estoque_id = $3`,
    [input.tenantId, input.produtoId, input.localEstoqueId, nextQuantity, nextAverage],
  )
  const created = await client.query(
    `INSERT INTO erp.movimentacoes_estoque
       (empresa_id, produto_id, local_estoque_id, documento_estoque_id, tipo, quantidade,
        custo_unitario, custo_medio_apos, saldo_apos, origem_tipo, origem_id,
        chave_idempotencia, criado_por, request_hash, data_operacional, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, jsonb_build_object('motivo',$16::text))
     RETURNING id, saldo_apos, custo_medio_apos`,
    [input.tenantId, input.produtoId, input.localEstoqueId, input.documentoEstoqueId || null,
      input.tipo, movementQuantity, inputCost, nextAverage, nextQuantity, input.origemTipo,
      input.origemId || null, input.chaveIdempotencia, input.actorId, requestHash, operationDate, input.motivo || null],
  )
  return created.rows[0]
}

export async function createFinalStockDocument(
  client: Pick<SQLClient, 'query'>,
  input: ActorInput & {
    tipo: string
    localEstoqueId: number
    entidadeId?: number | null
    vendaId?: number | null
    compraId?: number | null
    motivo?: string | null
    chaveIdempotencia: string
    items: StockItemInput[]
    movementType?: string
    originType?: string
  },
) {
  await stockLock(client, input.tenantId)
  const requestHash = fingerprint({ tipo: input.tipo, local: input.localEstoqueId, entidade: input.entidadeId || null, venda: input.vendaId || null, compra: input.compraId || null, motivo: input.motivo || null, items: input.items, movementType: input.movementType, originType: input.originType })
  const existing = await client.query(
    `SELECT id, request_hash FROM erp.documentos_estoque WHERE empresa_id = $1 AND chave_idempotencia = $2`,
    [input.tenantId, input.chaveIdempotencia],
  )
  if (existing.rows[0]) { assertSameRequest(existing.rows[0].request_hash, requestHash); return { id: existing.rows[0].id } }

  await assertErpPeriodOpen(client, {
    tenantId: input.tenantId,
    module: 'estoque',
    date: businessDay(),
  })

  const documentResult = await client.query(
    `INSERT INTO erp.documentos_estoque
       (empresa_id, tipo, data_documento, status, local_estoque_id, entidade_id,
        venda_id, compra_id, motivo, chave_idempotencia, finalizado_em, criado_por, atualizado_por, request_hash)
     VALUES ($1, $2, $10::date, 'finalizado', $3, $4, $5, $6, $7, $8, now(), $9, $9, $11)
     RETURNING id`,
    [input.tenantId, input.tipo, input.localEstoqueId, input.entidadeId || null,
      input.vendaId || null, input.compraId || null, input.motivo || null,
      input.chaveIdempotencia, input.actorId, businessDay(), requestHash],
  )
  const documentId = Number(documentResult.rows[0].id)
  for (const [index, item] of [...input.items].sort((a, b) => a.produtoId - b.produtoId).entries()) {
    const itemResult = await client.query(
       `INSERT INTO erp.documentos_estoque_itens
          (empresa_id, documento_estoque_id, produto_id, quantidade, custo_unitario,
           venda_item_id, compra_item_id, criado_por)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
       [input.tenantId, documentId, item.produtoId, Math.abs(item.quantidade),
         Math.max(0, Number(item.custoUnitario || 0)), item.vendaItemId || null,
         item.compraItemId || null, input.actorId],
    )
    const direction = ['entrada', 'devolucao_cliente'].includes(input.tipo) ? 1 : -1
    const signedQuantity = input.tipo === 'ajuste' ? item.quantidade : Math.abs(item.quantidade) * direction
    await applyStockMovement(client, {
      ...input,
      produtoId: item.produtoId,
      quantidade: signedQuantity,
      custoUnitario: item.custoUnitario,
      documentoEstoqueId: documentId,
      tipo: input.movementType || (signedQuantity > 0 ? 'entrada' : 'saida'),
      origemTipo: input.originType || 'documento_estoque',
      origemId: input.compraId || input.vendaId || documentId,
      chaveIdempotencia: `${input.chaveIdempotencia}:item:${Number(itemResult.rows[0].id)}:${index}`,
    })
  }
  return { id: documentId }
}

export async function reserveStockForSale(client: Pick<SQLClient, 'query'>, input: ActorInput & { saleId: number }) {
  await stockLock(client, input.tenantId)
  const saleResult = await client.query(
    `SELECT id, local_estoque_id FROM erp.vendas
     WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL`,
    [input.tenantId, input.saleId],
  )
  if (!saleResult.rows[0]) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Venda nao encontrada para reservar estoque.')
  const localEstoqueId = await resolveStockLocation(client, {
    ...input,
    localEstoqueId: Number(saleResult.rows[0].local_estoque_id || 0) || null,
    use: 'venda',
  })
  await client.query(
    `UPDATE erp.vendas SET local_estoque_id = COALESCE(local_estoque_id, $3), atualizado_por = $4
     WHERE empresa_id = $1 AND id = $2`,
    [input.tenantId, input.saleId, localEstoqueId, input.actorId],
  )

  const itemsResult = await client.query(
    `SELECT itens.id AS venda_item_id,
       COALESCE(componentes.produto_componente_id, itens.produto_id) AS produto_id,
       itens.quantidade * COALESCE(componentes.quantidade, 1) AS quantidade
     FROM erp.vendas_itens AS itens
     JOIN erp.produtos AS produtos
       ON produtos.empresa_id = itens.empresa_id AND produtos.id = itens.produto_id
     LEFT JOIN erp.kits_produtos AS kits
       ON kits.empresa_id = itens.empresa_id AND kits.produto_id = itens.produto_id
      AND kits.ativo AND kits.excluido_em IS NULL
     LEFT JOIN erp.kits_produtos_itens AS componentes
       ON componentes.empresa_id = kits.empresa_id AND componentes.kit_id = kits.id
     WHERE itens.empresa_id = $1 AND itens.venda_id = $2 AND itens.excluido_em IS NULL
       AND produtos.controla_estoque ORDER BY produto_id, itens.id`,
    [input.tenantId, input.saleId],
  )

  for (const item of itemsResult.rows) {
    const produtoId = Number(item.produto_id)
    const quantidade = Number(item.quantidade)
    const existing = await client.query(
      `SELECT id FROM erp.reservas_estoque
       WHERE empresa_id = $1 AND venda_item_id = $2 AND produto_id = $3`,
      [input.tenantId, item.venda_item_id, produtoId],
    )
    if (existing.rows[0]) continue
    const { product, balance } = await lockStockBalance(client, input.tenantId, produtoId, localEstoqueId)
    const available = Number(balance.quantidade_fisica || 0) - Number(balance.quantidade_reservada || 0)
    if (available < quantidade && !product.permite_estoque_negativo) {
      throw new ErpDomainError('STOCK_OPERATION_INVALID', `Estoque disponivel insuficiente para ${String(product.nome)}. Disponivel: ${available}.`)
    }
    await client.query(
      `UPDATE erp.saldos_estoque
       SET quantidade_reservada = quantidade_reservada + $4, atualizado_em = now(), versao = versao + 1
       WHERE empresa_id = $1 AND produto_id = $2 AND local_estoque_id = $3`,
      [input.tenantId, produtoId, localEstoqueId, quantidade],
    )
    await client.query(
      `INSERT INTO erp.reservas_estoque
         (empresa_id, produto_id, local_estoque_id, venda_id, venda_item_id, quantidade, criado_por, atualizado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
      [input.tenantId, produtoId, localEstoqueId, input.saleId, item.venda_item_id, quantidade, input.actorId],
    )
  }
}

export async function releaseStockForSale(client: Pick<SQLClient, 'query'>, input: ActorInput & { saleId: number }) {
  await stockLock(client, input.tenantId)
  const reservations = await client.query(
    `SELECT * FROM erp.reservas_estoque
     WHERE empresa_id = $1 AND venda_id = $2 AND status = 'ativa' FOR UPDATE`,
    [input.tenantId, input.saleId],
  )
  for (const reservation of reservations.rows) {
    await lockStockBalance(client, input.tenantId, Number(reservation.produto_id), Number(reservation.local_estoque_id), true)
    await client.query(
      `UPDATE erp.saldos_estoque SET quantidade_reservada = greatest(quantidade_reservada - $4, 0),
         atualizado_em = now(), versao = versao + 1
       WHERE empresa_id = $1 AND produto_id = $2 AND local_estoque_id = $3`,
      [input.tenantId, reservation.produto_id, reservation.local_estoque_id, Number(reservation.quantidade) - Number(reservation.quantidade_atendida || 0)],
    )
    await client.query(
      `UPDATE erp.reservas_estoque SET status = 'liberada', encerrada_em = now(), atualizado_por = $3
       WHERE empresa_id = $1 AND id = $2`,
      [input.tenantId, reservation.id, input.actorId],
    )
  }
}

export async function attendStockForSale(input: ActorInput & { saleId: number }) {
  return withTransaction(async (client) => {
    const saleResult = await client.query(
      `SELECT id, cliente_id, status, atendimento_status FROM erp.vendas
       WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, input.saleId],
    )
    const sale = saleResult.rows[0]
    if (!sale) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Venda nao encontrada.')
    if (sale.atendimento_status === 'atendido') return { id: String(sale.id), status: 'confirmada', atendimento_status: 'atendido' }
    if (sale.status !== 'confirmada') throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Apenas venda confirmada pode ser atendida.')

    const reservations = await client.query(
      `SELECT * FROM erp.reservas_estoque
       WHERE empresa_id = $1 AND venda_id = $2 AND status = 'ativa' FOR UPDATE`,
      [input.tenantId, input.saleId],
    )
    for (const reservation of reservations.rows) {
      await lockStockBalance(client, input.tenantId, Number(reservation.produto_id), Number(reservation.local_estoque_id), true)
      await client.query(
        `UPDATE erp.saldos_estoque SET quantidade_reservada = quantidade_reservada - $4,
           atualizado_em = now(), versao = versao + 1
         WHERE empresa_id = $1 AND produto_id = $2 AND local_estoque_id = $3`,
        [input.tenantId, reservation.produto_id, reservation.local_estoque_id, Number(reservation.quantidade) - Number(reservation.quantidade_atendida || 0)],
      )
      await applyStockMovement(client, {
        ...input,
        produtoId: Number(reservation.produto_id),
        localEstoqueId: Number(reservation.local_estoque_id),
        quantidade: -(Number(reservation.quantidade) - Number(reservation.quantidade_atendida || 0)),
        tipo: 'saida',
        origemTipo: 'venda',
        origemId: input.saleId,
        historical: true,
        chaveIdempotencia: `venda:${input.saleId}:reserva:${String(reservation.id)}:saida`,
      })
      await client.query(
        `UPDATE erp.reservas_estoque SET status = 'atendida', quantidade_atendida = quantidade,
           encerrada_em = now(), atualizado_por = $3
         WHERE empresa_id = $1 AND id = $2`,
        [input.tenantId, reservation.id, input.actorId],
      )
    }
    const updated = await client.query(
      `UPDATE erp.vendas SET atendimento_status = 'atendido', atendida_em = COALESCE(atendida_em, now()),
         versao = versao + 1, atualizado_por = $3
       WHERE empresa_id = $1 AND id = $2 RETURNING id::text, status, atendimento_status, fiscal_status, versao`,
      [input.tenantId, input.saleId, input.actorId],
    )
    await client.query(
      `INSERT INTO erp.vendas_eventos
         (empresa_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'atendimento_concluido', 'confirmada', 'confirmada', $3, $4::jsonb, $5)`,
      [input.tenantId, input.saleId, Number(updated.rows[0].versao),
        JSON.stringify({ movimenta_estoque: reservations.rows.length > 0 }), input.actorId],
    )
    return updated.rows[0]
  })
}

export async function receiveStockForPurchase(client: Pick<SQLClient, 'query'>, input: ActorInput & { purchaseId: number }) {
  const purchaseResult = await client.query(
    `SELECT id, fornecedor_id, local_estoque_id, atualiza_estoque
     FROM erp.compras WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL`,
    [input.tenantId, input.purchaseId],
  )
  const purchase = purchaseResult.rows[0]
  if (!purchase || !purchase.atualiza_estoque) return null
  const localEstoqueId = await resolveStockLocation(client, {
    ...input,
    localEstoqueId: Number(purchase.local_estoque_id || 0) || null,
    use: 'compra',
  })
  await client.query(
    `UPDATE erp.compras SET local_estoque_id = COALESCE(local_estoque_id, $3), atualizado_por = $4
     WHERE empresa_id = $1 AND id = $2`,
    [input.tenantId, input.purchaseId, localEstoqueId, input.actorId],
  )
  const itemsResult = await client.query(
    `SELECT itens.produto_id, itens.quantidade, itens.valor_unitario AS custo_unitario
     FROM erp.compras_itens AS itens
     JOIN erp.produtos AS produtos ON produtos.empresa_id = itens.empresa_id AND produtos.id = itens.produto_id
     WHERE itens.empresa_id = $1 AND itens.compra_id = $2 AND itens.excluido_em IS NULL
       AND produtos.controla_estoque`,
    [input.tenantId, input.purchaseId],
  )
  if (itemsResult.rows.length === 0) return null
  return createFinalStockDocument(client, {
    ...input,
    tipo: 'entrada',
    localEstoqueId,
    entidadeId: Number(purchase.fornecedor_id),
    compraId: input.purchaseId,
    motivo: `Recebimento da compra ${input.purchaseId}`,
    chaveIdempotencia: `compra:${input.purchaseId}:recebimento`,
    originType: 'compra',
    items: itemsResult.rows.map((item) => ({
      produtoId: Number(item.produto_id),
      quantidade: Number(item.quantidade),
      custoUnitario: Number(item.custo_unitario || 0),
    })),
  })
}

export async function reverseStockForPurchase(client: Pick<SQLClient, 'query'>, input: ActorInput & { purchaseId: number }) {
  const movements = await client.query(
    `SELECT * FROM erp.movimentacoes_estoque
     WHERE empresa_id = $1 AND origem_tipo = 'compra' AND origem_id = $2 ORDER BY id FOR UPDATE`,
    [input.tenantId, input.purchaseId],
  )
  for (const movement of movements.rows) {
    await applyStockMovement(client, {
      ...input,
      produtoId: Number(movement.produto_id),
      localEstoqueId: Number(movement.local_estoque_id),
      quantidade: -Number(movement.quantidade),
      custoUnitario: Number(movement.custo_unitario || 0),
      tipo: 'estorno',
      origemTipo: 'cancelamento_compra',
      origemId: input.purchaseId,
      historical: true,
      reverseReceipt: true,
      chaveIdempotencia: `compra:${input.purchaseId}:movimento:${String(movement.id)}:estorno`,
    })
  }
}

async function listStockOperationPage(
  tenantId: number,
  selectSql: string,
  orderBy: string,
  input: ErpOperationListInput,
): Promise<ErpOperationPage> {
  return readOperationPage(tenantId, selectSql, orderBy, input)
}

export async function listStockOperation(tenantId: number, resource: string, input: ErpOperationListInput = {}) {
  if (resource === 'posicao-estoque') {
    return listStockOperationPage(tenantId,
      `SELECT produto_id::text AS id, codigo, sku, produto, unidade_medida, local_estoque,
         quantidade_fisica, quantidade_reservada, quantidade_disponivel, custo_medio,
         valor_estoque, estoque_minimo, situacao
       FROM erp.vw_posicao_estoque WHERE empresa_id = $1`,
      'produto, local_estoque', input,
    )
  }
  if (resource === 'movimentacoes') {
    return listStockOperationPage(tenantId,
      `SELECT movimentos.id::text, movimentos.ocorrido_em AS data, produtos.nome AS produto,
         locais.nome AS local, movimentos.tipo, movimentos.quantidade, movimentos.custo_unitario,
         movimentos.saldo_apos, movimentos.origem_tipo AS origem
       FROM erp.movimentacoes_estoque AS movimentos
       JOIN erp.produtos AS produtos ON produtos.empresa_id = movimentos.empresa_id AND produtos.id = movimentos.produto_id
       JOIN erp.locais_estoque AS locais ON locais.empresa_id = movimentos.empresa_id AND locais.id = movimentos.local_estoque_id
       WHERE movimentos.empresa_id = $1`,
      'data DESC, id DESC', input,
    )
  }
  if (resource === 'locais-estoque') {
    return listStockOperationPage(tenantId,
      `SELECT id::text, nome, codigo, CASE WHEN padrao THEN 'Padrao' ELSE 'Secundario' END AS tipo,
         CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, permite_venda, permite_compra
       FROM erp.locais_estoque WHERE empresa_id = $1 AND excluido_em IS NULL`,
      'tipo, nome', input,
    )
  }
  if (resource === 'inventarios') {
    return listStockOperationPage(tenantId,
      `SELECT inventarios.id::text, inventarios.numero, locais.nome AS local,
         inventarios.data_inventario AS data, inventarios.tipo, inventarios.status,
         count(itens.id)::int AS itens
       FROM erp.inventarios
       JOIN erp.locais_estoque AS locais ON locais.empresa_id = inventarios.empresa_id AND locais.id = inventarios.local_estoque_id
       LEFT JOIN erp.inventarios_itens AS itens ON itens.empresa_id = inventarios.empresa_id AND itens.inventario_id = inventarios.id
       WHERE inventarios.empresa_id = $1 AND inventarios.excluido_em IS NULL
       GROUP BY inventarios.id, locais.nome`,
      'data DESC, id DESC', input,
    )
  }
  if (resource === 'transferencias') {
    return listStockOperationPage(tenantId,
      `SELECT transferencias.id::text, transferencias.numero, origem.nome AS origem,
         destino.nome AS destino, transferencias.data_transferencia AS data, transferencias.status,
         count(itens.id)::int AS itens
       FROM erp.transferencias_estoque AS transferencias
       JOIN erp.locais_estoque AS origem ON origem.empresa_id = transferencias.empresa_id AND origem.id = transferencias.local_origem_id
       JOIN erp.locais_estoque AS destino ON destino.empresa_id = transferencias.empresa_id AND destino.id = transferencias.local_destino_id
       LEFT JOIN erp.transferencias_estoque_itens AS itens ON itens.empresa_id = transferencias.empresa_id AND itens.transferencia_id = transferencias.id
       WHERE transferencias.empresa_id = $1 AND transferencias.excluido_em IS NULL
       GROUP BY transferencias.id, origem.nome, destino.nome`,
      'data DESC, id DESC', input,
    )
  }
  if (resource === 'kits') {
    return listStockOperationPage(tenantId,
      `SELECT kits.id::text, produtos.nome AS produto, produtos.codigo,
         count(itens.id)::int AS componentes, CASE WHEN kits.ativo THEN 'ativo' ELSE 'inativo' END AS status
       FROM erp.kits_produtos AS kits
       JOIN erp.produtos ON produtos.empresa_id = kits.empresa_id AND produtos.id = kits.produto_id
       LEFT JOIN erp.kits_produtos_itens AS itens ON itens.empresa_id = kits.empresa_id AND itens.kit_id = kits.id
       WHERE kits.empresa_id = $1 AND kits.excluido_em IS NULL
       GROUP BY kits.id, produtos.nome, produtos.codigo`,
      'produto, id', input,
    )
  }
  if (resource === 'conversoes-unidades') {
    return listStockOperationPage(tenantId,
      `SELECT conversoes.id::text, produtos.nome AS produto, conversoes.unidade_origem,
         conversoes.unidade_destino, conversoes.fator,
         CASE WHEN conversoes.ativo THEN 'ativo' ELSE 'inativo' END AS status
       FROM erp.conversoes_unidades_produto AS conversoes
       JOIN erp.produtos ON produtos.empresa_id = conversoes.empresa_id AND produtos.id = conversoes.produto_id
       WHERE conversoes.empresa_id = $1 AND conversoes.excluido_em IS NULL`,
      'produto, unidade_origem', input,
    )
  }
  throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Modulo de estoque desconhecido.')
}

export async function createStockOperation(input: ActorInput & { resource: string; values: Record<string, unknown>; idempotencyKey: string }) {
  if (!input.idempotencyKey?.trim() || input.idempotencyKey.length > 200) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Identificação da operação inválida.')
  return withTransaction(async (client) => {
    await stockLock(client, input.tenantId)
    const requestHash = fingerprint({ resource: input.resource, values: input.values })
    const previous = await client.query('SELECT request_hash, resultado FROM erp.operacoes_estoque WHERE empresa_id=$1 AND chave_idempotencia=$2', [input.tenantId, input.idempotencyKey])
    if (previous.rows[0]) { assertSameRequest(previous.rows[0].request_hash, requestHash); return previous.rows[0].resultado }
    const result = await createStockOperationWithClient(client, input)
    await client.query(`INSERT INTO erp.operacoes_estoque(empresa_id, recurso, chave_idempotencia, request_hash, resultado, criado_por) VALUES($1,$2,$3,$4,$5::jsonb,$6)`, [input.tenantId, input.resource, input.idempotencyKey, requestHash, JSON.stringify(result), input.actorId])
    return result
  })
}

async function createStockOperationWithClient(client: Pick<SQLClient, 'query'>, input: ActorInput & { resource: string; values: Record<string, unknown>; idempotencyKey: string }) {
  // The journal and all business effects share the same transaction.
  return (async () => {
    if (input.resource === 'locais-estoque') {
      const nome = optionalText(input.values.nome)
      const codigo = optionalText(input.values.codigo)
      if (!nome || !codigo) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Nome e codigo sao obrigatorios.')
      const created = await client.query(
        `INSERT INTO erp.locais_estoque
           (empresa_id, nome, codigo, descricao, padrao, permite_venda, permite_compra, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id::text`,
        [input.tenantId, nome, codigo, optionalText(input.values.descricao), input.values.padrao === true || input.values.padrao === 'sim',
          input.values.permite_venda !== false && input.values.permite_venda !== 'nao',
          input.values.permite_compra !== false && input.values.permite_compra !== 'nao', input.actorId],
      )
      return created.rows[0]
    }
    if (input.resource === 'movimentacoes') {
      const produtoId = requiredId(input.values.produto_id, 'Produto')
      const localEstoqueId = await resolveStockLocation(client, {
        ...input,
        localEstoqueId: requiredId(input.values.local_estoque_id, 'Local de estoque'),
      })
      let quantidade = decimal(input.values.quantidade, 'Quantidade')
      let custoUnitario = input.values.custo_unitario === undefined || input.values.custo_unitario === '' ? undefined : decimal(input.values.custo_unitario, 'Custo unitario', true)
      if (input.values.unidade) {
        const conversion = await client.query(`SELECT p.unidade_medida, c.fator FROM erp.produtos p LEFT JOIN erp.conversoes_unidades_produto c ON c.empresa_id=p.empresa_id AND c.produto_id=p.id AND lower(c.unidade_origem)=lower($3) AND lower(c.unidade_destino)=lower(p.unidade_medida) AND c.ativo AND c.excluido_em IS NULL WHERE p.empresa_id=$1 AND p.id=$2`, [input.tenantId, produtoId, String(input.values.unidade)])
        const unit = conversion.rows[0]
        if (!unit) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Produto não encontrado.')
        if (String(input.values.unidade).toLowerCase() !== String(unit.unidade_medida).toLowerCase()) {
          if (!unit.fator) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Conversão para a unidade de estoque não cadastrada.')
          quantidade = decimal(quantidade * Number(unit.fator), 'Quantidade convertida')
          if (custoUnitario !== undefined) custoUnitario /= Number(unit.fator)
        }
      }
      const tipo = String(input.values.tipo || 'entrada')
      if (!['entrada', 'saida', 'ajuste_entrada', 'ajuste_saida'].includes(tipo)) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Tipo de movimento invalido.')
      if (tipo.startsWith('ajuste') && !optionalText(input.values.motivo)) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Informe o motivo do ajuste.')
      const signed = ['saida', 'ajuste_saida'].includes(tipo) ? -quantidade : quantidade
      return applyStockMovement(client, {
        ...input,
        produtoId,
        localEstoqueId,
        quantidade: signed,
        custoUnitario,
        tipo,
        origemTipo: 'manual',
        chaveIdempotencia: input.idempotencyKey,
        dataOperacional: dateText(input.values.data),
        motivo: optionalText(input.values.motivo),
      })
    }
    if (input.resource === 'inventarios') {
      const operationDate = dateText(input.values.data)
      if (operationDate !== businessDay()) throw new ErpDomainError('STOCK_DATE_INVALID', 'A contagem deve ser registrada no dia atual.', 422)
      const localEstoqueId = requiredId(input.values.local_estoque_id, 'Local de estoque')
      await resolveStockLocation(client, { ...input, localEstoqueId })
      const items = Array.isArray(input.values.itens) ? input.values.itens as Record<string, unknown>[] : [input.values]
      if (!items.length || items.length > 200) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Informe entre 1 e 200 itens de contagem.')
      const productIds = items.map(item => requiredId(item.produto_id, 'Produto'))
      if (new Set(productIds).size !== productIds.length) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Produto repetido na contagem.')
      const number = optionalText(input.values.numero) || `INV-${Date.now()}`
      const inventory = await client.query(
        `INSERT INTO erp.inventarios
           (empresa_id, numero, local_estoque_id, data_inventario, tipo, status, iniciado_em, finalizado_em, criado_por, atualizado_por, chave_idempotencia, metadata)
         VALUES ($1, $2, $3, $4, 'parcial', 'finalizado', now(), now(), $5, $5, $6, $7::jsonb) RETURNING id`,
        [input.tenantId, number, localEstoqueId, operationDate, input.actorId, input.idempotencyKey, JSON.stringify({ motivo: optionalText(input.values.motivo) })],
      )
      const inventoryId = Number(inventory.rows[0].id)
      for (const item of [...items].sort((a,b) => Number(a.produto_id) - Number(b.produto_id))) {
      const produtoId = requiredId(item.produto_id, 'Produto')
      const counted = quantity(item.quantidade_contada, 'Quantidade contada', true)
      const balance = await lockStockBalance(client, input.tenantId, produtoId, localEstoqueId)
      const systemQuantity = Number(balance.balance.quantidade_fisica || 0)
      if (item.quantidade_sistema !== undefined && Number(item.quantidade_sistema) !== systemQuantity) throw new ErpDomainError('STOCK_COUNT_CONFLICT', 'O saldo mudou desde a revisão. Confira a contagem novamente.', 409)
      await client.query(
        `INSERT INTO erp.inventarios_itens
           (empresa_id, inventario_id, produto_id, quantidade_sistema, quantidade_contada, custo_medio, contado_em, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, now(), $7, $7)`,
        [input.tenantId, inventoryId, produtoId, systemQuantity, counted, Number(balance.balance.custo_medio || 0), input.actorId],
      )
      const difference = Number((counted - systemQuantity).toFixed(4))
      if (difference !== 0) {
        await applyStockMovement(client, {
          ...input,
          produtoId,
          localEstoqueId,
          quantidade: difference,
          custoUnitario: Number(balance.balance.custo_medio || 0),
          tipo: difference > 0 ? 'ajuste_entrada' : 'ajuste_saida',
          origemTipo: 'inventario',
          origemId: inventoryId,
          chaveIdempotencia: `inventario:${inventoryId}:produto:${produtoId}`,
          dataOperacional: operationDate,
        })
      }
      }
      return { id: String(inventoryId), status: 'finalizado' }
    }
    if (input.resource === 'transferencias') {
      const operationDate = dateText(input.values.data)
      if (operationDate !== businessDay()) throw new ErpDomainError('STOCK_DATE_INVALID', 'A transferência deve ser registrada no dia atual.', 422)
      const originId = requiredId(input.values.local_origem_id, 'Local de origem')
      const destinationId = requiredId(input.values.local_destino_id, 'Local de destino')
      if (originId === destinationId) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Origem e destino devem ser diferentes.')
      await resolveStockLocation(client, { ...input, localEstoqueId: originId })
      await resolveStockLocation(client, { ...input, localEstoqueId: destinationId })
      const produtoId = requiredId(input.values.produto_id, 'Produto')
      const quantidade = quantity(input.values.quantidade, 'Quantidade')
      const origin = await lockStockBalance(client, input.tenantId, produtoId, originId)
      await lockStockBalance(client, input.tenantId, produtoId, destinationId)
      const cost = Number(origin.balance.custo_medio)
      const number = optionalText(input.values.numero) || `TRF-${Date.now()}`
      const transfer = await client.query(
        `INSERT INTO erp.transferencias_estoque
           (empresa_id, numero, local_origem_id, local_destino_id, data_transferencia, status,
            chave_idempotencia, finalizada_em, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, 'finalizada', $6, now(), $7, $7) RETURNING id`,
        [input.tenantId, number, originId, destinationId, dateText(input.values.data), input.idempotencyKey, input.actorId],
      )
      const transferId = Number(transfer.rows[0].id)
      await client.query(
        `INSERT INTO erp.transferencias_estoque_itens
           (empresa_id, transferencia_id, produto_id, quantidade, criado_por)
         VALUES ($1, $2, $3, $4, $5)`,
        [input.tenantId, transferId, produtoId, quantidade, input.actorId],
      )
      await applyStockMovement(client, {
        ...input, produtoId, localEstoqueId: originId, quantidade: -quantidade, custoUnitario: cost, dataOperacional: operationDate,
        tipo: 'transferencia_saida', origemTipo: 'transferencia', origemId: transferId,
        chaveIdempotencia: `${input.idempotencyKey}:saida`,
      })
      await applyStockMovement(client, {
        ...input, produtoId, localEstoqueId: destinationId, quantidade, custoUnitario: cost, dataOperacional: operationDate,
        tipo: 'transferencia_entrada', origemTipo: 'transferencia', origemId: transferId,
        chaveIdempotencia: `${input.idempotencyKey}:entrada`,
      })
      return { id: String(transferId), status: 'finalizada' }
    }
    if (input.resource === 'kits') {
      const produtoId = requiredId(input.values.produto_id, 'Produto do kit')
      const componentId = requiredId(input.values.produto_componente_id, 'Produto componente')
      if (produtoId === componentId) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'O produto nao pode ser componente dele mesmo.')
      const nested = await client.query(`SELECT 1 FROM erp.kits_produtos WHERE empresa_id=$1 AND produto_id=$2 AND ativo AND excluido_em IS NULL UNION ALL SELECT 1 FROM erp.kits_produtos_itens i JOIN erp.kits_produtos k ON k.empresa_id=i.empresa_id AND k.id=i.kit_id AND k.ativo AND k.excluido_em IS NULL WHERE i.empresa_id=$1 AND i.produto_componente_id=$3`, [input.tenantId, componentId, produtoId])
      if (nested.rows.length) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Kits aninhados não são permitidos. Selecione componentes individuais.')
      const created = await client.query(
        `INSERT INTO erp.kits_produtos (empresa_id, produto_id, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $3)
         ON CONFLICT (empresa_id, produto_id) DO UPDATE SET ativo = true, atualizado_por = EXCLUDED.atualizado_por
         RETURNING id`,
        [input.tenantId, produtoId, input.actorId],
      )
      const kitId = Number(created.rows[0].id)
      await client.query(
        `INSERT INTO erp.kits_produtos_itens
           (empresa_id, kit_id, produto_componente_id, quantidade, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (empresa_id, kit_id, produto_componente_id)
         DO UPDATE SET quantidade = EXCLUDED.quantidade, atualizado_por = EXCLUDED.atualizado_por`,
        [input.tenantId, kitId, componentId, decimal(input.values.quantidade, 'Quantidade'), input.actorId],
      )
      return { id: String(kitId) }
    }
    if (input.resource === 'conversoes-unidades') {
      const produtoId = requiredId(input.values.produto_id, 'Produto')
      const origin = optionalText(input.values.unidade_origem)?.toUpperCase()
      const destination = optionalText(input.values.unidade_destino)?.toUpperCase()
      if (!origin || !destination) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'As unidades de origem e destino sao obrigatorias.')
      if (origin === destination) throw new ErpDomainError('STOCK_OPERATION_INVALID', 'As unidades precisam ser diferentes.')
      const created = await client.query(
        `INSERT INTO erp.conversoes_unidades_produto
           (empresa_id, produto_id, unidade_origem, unidade_destino, fator, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $6)
         ON CONFLICT (empresa_id, produto_id, lower(unidade_origem), lower(unidade_destino))
           WHERE excluido_em IS NULL AND ativo
         DO UPDATE SET fator = EXCLUDED.fator, atualizado_por = EXCLUDED.atualizado_por
         RETURNING id::text`,
        [input.tenantId, produtoId, origin, destination, decimal(input.values.fator, 'Fator'), input.actorId],
      )
      return created.rows[0]
    }
    throw new ErpDomainError('STOCK_OPERATION_INVALID', 'Operacao de estoque desconhecida.')
  })()
}

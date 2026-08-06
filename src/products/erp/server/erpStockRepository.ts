import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'

type ActorInput = { tenantId: number; actorId: number }
type StockItemInput = { produtoId: number; quantidade: number; custoUnitario?: number }

function requiredId(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${label} invalido.`)
  return parsed
}

function decimal(value: unknown, label: string, allowZero = false) {
  const parsed = Number(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(parsed) || (allowZero ? parsed < 0 : parsed <= 0)) throw new Error(`${label} invalido.`)
  return parsed
}

function optionalText(value: unknown) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function dateText(value: unknown) {
  const normalized = optionalText(value)
  if (!normalized) return new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) throw new Error('Data invalida.')
  return normalized
}

async function ensureDefaultStockLocation(client: Pick<SQLClient, 'query'>, input: ActorInput) {
  await client.query(`SELECT pg_advisory_xact_lock($1, hashtext('erp-local-estoque-padrao'))`, [input.tenantId])
  const existing = await client.query(
    `SELECT id FROM erp.locais_estoque
     WHERE tenant_id = $1 AND padrao AND ativo AND excluido_em IS NULL LIMIT 1`,
    [input.tenantId],
  )
  if (existing.rows[0]) return Number(existing.rows[0].id)

  const created = await client.query(
    `INSERT INTO erp.locais_estoque
       (tenant_id, nome, codigo, descricao, padrao, criado_por, atualizado_por)
     VALUES ($1, 'Estoque principal', 'PRINCIPAL', 'Local padrao criado pelo ERP', true, $2, $2)
     RETURNING id`,
    [input.tenantId, input.actorId],
  )
  return Number(created.rows[0].id)
}

async function resolveStockLocation(
  client: Pick<SQLClient, 'query'>,
  input: ActorInput & { localEstoqueId?: number | null },
) {
  if (!input.localEstoqueId) return ensureDefaultStockLocation(client, input)
  const result = await client.query(
    `SELECT id FROM erp.locais_estoque
     WHERE tenant_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL`,
    [input.tenantId, input.localEstoqueId],
  )
  if (!result.rows[0]) throw new Error('Local de estoque nao encontrado ou inativo.')
  return Number(result.rows[0].id)
}

async function lockStockBalance(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  produtoId: number,
  localEstoqueId: number,
) {
  const productResult = await client.query(
    `SELECT id, nome, controla_estoque, permite_estoque_negativo
     FROM erp.produtos
     WHERE tenant_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL`,
    [tenantId, produtoId],
  )
  const product = productResult.rows[0]
  if (!product) throw new Error(`Produto ${produtoId} nao encontrado ou inativo.`)
  if (!product.controla_estoque) throw new Error(`O produto ${String(product.nome)} nao controla estoque.`)

  await client.query(
    `INSERT INTO erp.saldos_estoque (tenant_id, produto_id, local_estoque_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, produto_id, local_estoque_id) DO NOTHING`,
    [tenantId, produtoId, localEstoqueId],
  )
  const balanceResult = await client.query(
    `SELECT * FROM erp.saldos_estoque
     WHERE tenant_id = $1 AND produto_id = $2 AND local_estoque_id = $3
     FOR UPDATE`,
    [tenantId, produtoId, localEstoqueId],
  )
  return { product, balance: balanceResult.rows[0] }
}

async function applyStockMovement(
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
  },
) {
  const duplicate = await client.query(
    `SELECT id FROM erp.movimentacoes_estoque WHERE tenant_id = $1 AND chave_idempotencia = $2`,
    [input.tenantId, input.chaveIdempotencia],
  )
  if (duplicate.rows[0]) return duplicate.rows[0]

  const { product, balance } = await lockStockBalance(
    client,
    input.tenantId,
    input.produtoId,
    input.localEstoqueId,
  )
  const currentQuantity = Number(balance.quantidade_fisica || 0)
  const currentAverage = Number(balance.custo_medio || 0)
  const movementQuantity = Number(input.quantidade)
  const nextQuantity = Number((currentQuantity + movementQuantity).toFixed(4))
  if (nextQuantity < 0 && !product.permite_estoque_negativo) {
    throw new Error(`Saldo insuficiente para ${String(product.nome)}. Disponivel fisico: ${currentQuantity}.`)
  }

  const inputCost = Math.max(0, Number(input.custoUnitario || 0))
  const nextAverage = movementQuantity > 0 && nextQuantity > 0
    ? Number((((currentQuantity * currentAverage) + (movementQuantity * inputCost)) / nextQuantity).toFixed(6))
    : currentAverage

  await client.query(
    `UPDATE erp.saldos_estoque
     SET quantidade_fisica = $4, custo_medio = $5, ultima_movimentacao_em = now(),
         atualizado_em = now(), versao = versao + 1
     WHERE tenant_id = $1 AND produto_id = $2 AND local_estoque_id = $3`,
    [input.tenantId, input.produtoId, input.localEstoqueId, nextQuantity, nextAverage],
  )
  const created = await client.query(
    `INSERT INTO erp.movimentacoes_estoque
       (tenant_id, produto_id, local_estoque_id, documento_estoque_id, tipo, quantidade,
        custo_unitario, custo_medio_apos, saldo_apos, origem_tipo, origem_id,
        chave_idempotencia, criado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING id, saldo_apos, custo_medio_apos`,
    [input.tenantId, input.produtoId, input.localEstoqueId, input.documentoEstoqueId || null,
      input.tipo, movementQuantity, inputCost, nextAverage, nextQuantity, input.origemTipo,
      input.origemId || null, input.chaveIdempotencia, input.actorId],
  )
  return created.rows[0]
}

async function createFinalStockDocument(
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
  const existing = await client.query(
    `SELECT id FROM erp.documentos_estoque WHERE tenant_id = $1 AND chave_idempotencia = $2`,
    [input.tenantId, input.chaveIdempotencia],
  )
  if (existing.rows[0]) return existing.rows[0]

  const documentResult = await client.query(
    `INSERT INTO erp.documentos_estoque
       (tenant_id, tipo, data_documento, status, local_estoque_id, entidade_id,
        venda_id, compra_id, motivo, chave_idempotencia, finalizado_em, criado_por, atualizado_por)
     VALUES ($1, $2, CURRENT_DATE, 'finalizado', $3, $4, $5, $6, $7, $8, now(), $9, $9)
     RETURNING id`,
    [input.tenantId, input.tipo, input.localEstoqueId, input.entidadeId || null,
      input.vendaId || null, input.compraId || null, input.motivo || null,
      input.chaveIdempotencia, input.actorId],
  )
  const documentId = Number(documentResult.rows[0].id)
  for (const [index, item] of input.items.entries()) {
    const itemResult = await client.query(
      `INSERT INTO erp.documentos_estoque_itens
         (tenant_id, documento_estoque_id, produto_id, quantidade, custo_unitario, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [input.tenantId, documentId, item.produtoId, Math.abs(item.quantidade),
        Math.max(0, Number(item.custoUnitario || 0)), input.actorId],
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
      origemId: documentId,
      chaveIdempotencia: `${input.chaveIdempotencia}:item:${Number(itemResult.rows[0].id)}:${index}`,
    })
  }
  return { id: documentId }
}

export async function reserveStockForSale(client: Pick<SQLClient, 'query'>, input: ActorInput & { saleId: number }) {
  const saleResult = await client.query(
    `SELECT id, local_estoque_id FROM erp.vendas
     WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL`,
    [input.tenantId, input.saleId],
  )
  if (!saleResult.rows[0]) throw new Error('Venda nao encontrada para reservar estoque.')
  const localEstoqueId = await resolveStockLocation(client, {
    ...input,
    localEstoqueId: Number(saleResult.rows[0].local_estoque_id || 0) || null,
  })
  await client.query(
    `UPDATE erp.vendas SET local_estoque_id = COALESCE(local_estoque_id, $3), atualizado_por = $4
     WHERE tenant_id = $1 AND id = $2`,
    [input.tenantId, input.saleId, localEstoqueId, input.actorId],
  )

  const itemsResult = await client.query(
    `SELECT itens.id AS venda_item_id,
       COALESCE(componentes.produto_componente_id, itens.produto_id) AS produto_id,
       itens.quantidade * COALESCE(componentes.quantidade, 1) AS quantidade
     FROM erp.vendas_itens AS itens
     JOIN erp.produtos AS produtos
       ON produtos.tenant_id = itens.tenant_id AND produtos.id = itens.produto_id
     LEFT JOIN erp.kits_produtos AS kits
       ON kits.tenant_id = itens.tenant_id AND kits.produto_id = itens.produto_id
      AND kits.ativo AND kits.excluido_em IS NULL
     LEFT JOIN erp.kits_produtos_itens AS componentes
       ON componentes.tenant_id = kits.tenant_id AND componentes.kit_id = kits.id
     WHERE itens.tenant_id = $1 AND itens.venda_id = $2 AND itens.excluido_em IS NULL
       AND produtos.controla_estoque`,
    [input.tenantId, input.saleId],
  )

  for (const item of itemsResult.rows) {
    const produtoId = Number(item.produto_id)
    const quantidade = Number(item.quantidade)
    const existing = await client.query(
      `SELECT id FROM erp.reservas_estoque
       WHERE tenant_id = $1 AND venda_item_id = $2 AND produto_id = $3`,
      [input.tenantId, item.venda_item_id, produtoId],
    )
    if (existing.rows[0]) continue
    const { product, balance } = await lockStockBalance(client, input.tenantId, produtoId, localEstoqueId)
    const available = Number(balance.quantidade_fisica || 0) - Number(balance.quantidade_reservada || 0)
    if (available < quantidade && !product.permite_estoque_negativo) {
      throw new Error(`Estoque disponivel insuficiente para ${String(product.nome)}. Disponivel: ${available}.`)
    }
    await client.query(
      `UPDATE erp.saldos_estoque
       SET quantidade_reservada = quantidade_reservada + $4, atualizado_em = now(), versao = versao + 1
       WHERE tenant_id = $1 AND produto_id = $2 AND local_estoque_id = $3`,
      [input.tenantId, produtoId, localEstoqueId, quantidade],
    )
    await client.query(
      `INSERT INTO erp.reservas_estoque
         (tenant_id, produto_id, local_estoque_id, venda_id, venda_item_id, quantidade, criado_por, atualizado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
      [input.tenantId, produtoId, localEstoqueId, input.saleId, item.venda_item_id, quantidade, input.actorId],
    )
  }
}

export async function releaseStockForSale(client: Pick<SQLClient, 'query'>, input: ActorInput & { saleId: number }) {
  const reservations = await client.query(
    `SELECT * FROM erp.reservas_estoque
     WHERE tenant_id = $1 AND venda_id = $2 AND status = 'ativa' FOR UPDATE`,
    [input.tenantId, input.saleId],
  )
  for (const reservation of reservations.rows) {
    await lockStockBalance(client, input.tenantId, Number(reservation.produto_id), Number(reservation.local_estoque_id))
    await client.query(
      `UPDATE erp.saldos_estoque SET quantidade_reservada = greatest(quantidade_reservada - $4, 0),
         atualizado_em = now(), versao = versao + 1
       WHERE tenant_id = $1 AND produto_id = $2 AND local_estoque_id = $3`,
      [input.tenantId, reservation.produto_id, reservation.local_estoque_id, reservation.quantidade],
    )
    await client.query(
      `UPDATE erp.reservas_estoque SET status = 'liberada', encerrada_em = now(), atualizado_por = $3
       WHERE tenant_id = $1 AND id = $2`,
      [input.tenantId, reservation.id, input.actorId],
    )
  }
}

export async function fulfillStockForSale(input: ActorInput & { saleId: number }) {
  return withTransaction(async (client) => {
    const saleResult = await client.query(
      `SELECT id, cliente_id, status FROM erp.vendas
       WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, input.saleId],
    )
    const sale = saleResult.rows[0]
    if (!sale) throw new Error('Venda nao encontrada.')
    if (sale.status === 'faturada') return { id: String(sale.id), status: 'faturada' }
    if (sale.status !== 'confirmada') throw new Error('Apenas venda confirmada pode ser faturada.')

    const reservations = await client.query(
      `SELECT * FROM erp.reservas_estoque
       WHERE tenant_id = $1 AND venda_id = $2 AND status = 'ativa' FOR UPDATE`,
      [input.tenantId, input.saleId],
    )
    for (const reservation of reservations.rows) {
      await applyStockMovement(client, {
        ...input,
        produtoId: Number(reservation.produto_id),
        localEstoqueId: Number(reservation.local_estoque_id),
        quantidade: -Number(reservation.quantidade),
        tipo: 'saida',
        origemTipo: 'venda',
        origemId: input.saleId,
        chaveIdempotencia: `venda:${input.saleId}:reserva:${String(reservation.id)}:saida`,
      })
      await client.query(
        `UPDATE erp.saldos_estoque SET quantidade_reservada = greatest(quantidade_reservada - $4, 0),
           atualizado_em = now(), versao = versao + 1
         WHERE tenant_id = $1 AND produto_id = $2 AND local_estoque_id = $3`,
        [input.tenantId, reservation.produto_id, reservation.local_estoque_id, reservation.quantidade],
      )
      await client.query(
        `UPDATE erp.reservas_estoque SET status = 'atendida', quantidade_atendida = quantidade,
           encerrada_em = now(), atualizado_por = $3
         WHERE tenant_id = $1 AND id = $2`,
        [input.tenantId, reservation.id, input.actorId],
      )
    }
    const updated = await client.query(
      `UPDATE erp.vendas SET status = 'faturada', situacao = 'faturada', faturada_em = COALESCE(faturada_em, now()),
         versao = versao + 1, atualizado_por = $3
       WHERE tenant_id = $1 AND id = $2 RETURNING id::text, status, versao`,
      [input.tenantId, input.saleId, input.actorId],
    )
    await client.query(
      `INSERT INTO erp.vendas_eventos
         (tenant_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1, $2, 'faturada', 'confirmada', 'faturada', $3, $4::jsonb, $5)`,
      [input.tenantId, input.saleId, Number(updated.rows[0].versao),
        JSON.stringify({ movimenta_estoque: reservations.rows.length > 0 }), input.actorId],
    )
    return updated.rows[0]
  })
}

export async function receiveStockForPurchase(client: Pick<SQLClient, 'query'>, input: ActorInput & { purchaseId: number }) {
  const purchaseResult = await client.query(
    `SELECT id, fornecedor_id, local_estoque_id, atualiza_estoque
     FROM erp.compras WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL`,
    [input.tenantId, input.purchaseId],
  )
  const purchase = purchaseResult.rows[0]
  if (!purchase || !purchase.atualiza_estoque) return null
  const localEstoqueId = await resolveStockLocation(client, {
    ...input,
    localEstoqueId: Number(purchase.local_estoque_id || 0) || null,
  })
  await client.query(
    `UPDATE erp.compras SET local_estoque_id = COALESCE(local_estoque_id, $3), atualizado_por = $4
     WHERE tenant_id = $1 AND id = $2`,
    [input.tenantId, input.purchaseId, localEstoqueId, input.actorId],
  )
  const itemsResult = await client.query(
    `SELECT itens.produto_id, itens.quantidade, itens.valor_unitario AS custo_unitario
     FROM erp.compras_itens AS itens
     JOIN erp.produtos AS produtos ON produtos.tenant_id = itens.tenant_id AND produtos.id = itens.produto_id
     WHERE itens.tenant_id = $1 AND itens.compra_id = $2 AND itens.excluido_em IS NULL
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
     WHERE tenant_id = $1 AND origem_tipo = 'compra' AND origem_id = $2 ORDER BY id FOR UPDATE`,
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
      chaveIdempotencia: `compra:${input.purchaseId}:movimento:${String(movement.id)}:estorno`,
    })
  }
}

export async function listStockOperation(tenantId: number, resource: string) {
  if (resource === 'posicao-estoque') {
    return runQuery(
      `SELECT produto_id::text AS id, codigo, sku, produto, unidade_medida, local_estoque,
         quantidade_fisica, quantidade_reservada, quantidade_disponivel, custo_medio,
         valor_estoque, estoque_minimo, situacao
       FROM erp.vw_posicao_estoque WHERE tenant_id = $1 ORDER BY produto, local_estoque`,
      [tenantId],
    )
  }
  if (resource === 'movimentacoes') {
    return runQuery(
      `SELECT movimentos.id::text, movimentos.ocorrido_em AS data, produtos.nome AS produto,
         locais.nome AS local, movimentos.tipo, movimentos.quantidade, movimentos.custo_unitario,
         movimentos.saldo_apos, movimentos.origem_tipo AS origem
       FROM erp.movimentacoes_estoque AS movimentos
       JOIN erp.produtos AS produtos ON produtos.tenant_id = movimentos.tenant_id AND produtos.id = movimentos.produto_id
       JOIN erp.locais_estoque AS locais ON locais.tenant_id = movimentos.tenant_id AND locais.id = movimentos.local_estoque_id
       WHERE movimentos.tenant_id = $1 ORDER BY movimentos.ocorrido_em DESC LIMIT 500`,
      [tenantId],
    )
  }
  if (resource === 'locais-estoque') {
    return runQuery(
      `SELECT id::text, nome, codigo, CASE WHEN padrao THEN 'Padrao' ELSE 'Secundario' END AS tipo,
         CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, permite_venda, permite_compra
       FROM erp.locais_estoque WHERE tenant_id = $1 AND excluido_em IS NULL ORDER BY padrao DESC, nome`,
      [tenantId],
    )
  }
  if (resource === 'inventarios') {
    return runQuery(
      `SELECT inventarios.id::text, inventarios.numero, locais.nome AS local,
         inventarios.data_inventario AS data, inventarios.tipo, inventarios.status,
         count(itens.id)::int AS itens
       FROM erp.inventarios
       JOIN erp.locais_estoque AS locais ON locais.tenant_id = inventarios.tenant_id AND locais.id = inventarios.local_estoque_id
       LEFT JOIN erp.inventarios_itens AS itens ON itens.tenant_id = inventarios.tenant_id AND itens.inventario_id = inventarios.id
       WHERE inventarios.tenant_id = $1 AND inventarios.excluido_em IS NULL
       GROUP BY inventarios.id, locais.nome ORDER BY inventarios.data_inventario DESC, inventarios.id DESC`,
      [tenantId],
    )
  }
  if (resource === 'transferencias') {
    return runQuery(
      `SELECT transferencias.id::text, transferencias.numero, origem.nome AS origem,
         destino.nome AS destino, transferencias.data_transferencia AS data, transferencias.status,
         count(itens.id)::int AS itens
       FROM erp.transferencias_estoque AS transferencias
       JOIN erp.locais_estoque AS origem ON origem.tenant_id = transferencias.tenant_id AND origem.id = transferencias.local_origem_id
       JOIN erp.locais_estoque AS destino ON destino.tenant_id = transferencias.tenant_id AND destino.id = transferencias.local_destino_id
       LEFT JOIN erp.transferencias_estoque_itens AS itens ON itens.tenant_id = transferencias.tenant_id AND itens.transferencia_id = transferencias.id
       WHERE transferencias.tenant_id = $1 AND transferencias.excluido_em IS NULL
       GROUP BY transferencias.id, origem.nome, destino.nome ORDER BY transferencias.data_transferencia DESC, transferencias.id DESC`,
      [tenantId],
    )
  }
  if (resource === 'kits') {
    return runQuery(
      `SELECT kits.id::text, produtos.nome AS produto, produtos.codigo,
         count(itens.id)::int AS componentes, CASE WHEN kits.ativo THEN 'ativo' ELSE 'inativo' END AS status
       FROM erp.kits_produtos AS kits
       JOIN erp.produtos ON produtos.tenant_id = kits.tenant_id AND produtos.id = kits.produto_id
       LEFT JOIN erp.kits_produtos_itens AS itens ON itens.tenant_id = kits.tenant_id AND itens.kit_id = kits.id
       WHERE kits.tenant_id = $1 AND kits.excluido_em IS NULL
       GROUP BY kits.id, produtos.nome, produtos.codigo ORDER BY produtos.nome`,
      [tenantId],
    )
  }
  if (resource === 'conversoes-unidades') {
    return runQuery(
      `SELECT conversoes.id::text, produtos.nome AS produto, conversoes.unidade_origem,
         conversoes.unidade_destino, conversoes.fator,
         CASE WHEN conversoes.ativo THEN 'ativo' ELSE 'inativo' END AS status
       FROM erp.conversoes_unidades_produto AS conversoes
       JOIN erp.produtos ON produtos.tenant_id = conversoes.tenant_id AND produtos.id = conversoes.produto_id
       WHERE conversoes.tenant_id = $1 AND conversoes.excluido_em IS NULL
       ORDER BY produtos.nome, conversoes.unidade_origem`,
      [tenantId],
    )
  }
  throw new Error('Modulo de estoque desconhecido.')
}

export async function createStockOperation(input: ActorInput & { resource: string; values: Record<string, unknown>; idempotencyKey: string }) {
  return withTransaction(async (client) => {
    if (input.resource === 'locais-estoque') {
      const nome = optionalText(input.values.nome)
      const codigo = optionalText(input.values.codigo)
      if (!nome || !codigo) throw new Error('Nome e codigo sao obrigatorios.')
      const created = await client.query(
        `INSERT INTO erp.locais_estoque
           (tenant_id, nome, codigo, descricao, padrao, permite_venda, permite_compra, criado_por, atualizado_por)
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
      const quantidade = decimal(input.values.quantidade, 'Quantidade')
      const tipo = String(input.values.tipo || 'entrada')
      if (!['entrada', 'saida', 'ajuste_entrada', 'ajuste_saida'].includes(tipo)) throw new Error('Tipo de movimento invalido.')
      const signed = ['saida', 'ajuste_saida'].includes(tipo) ? -quantidade : quantidade
      return applyStockMovement(client, {
        ...input,
        produtoId,
        localEstoqueId,
        quantidade: signed,
        custoUnitario: decimal(input.values.custo_unitario || 0, 'Custo unitario', true),
        tipo,
        origemTipo: 'manual',
        chaveIdempotencia: input.idempotencyKey,
      })
    }
    if (input.resource === 'inventarios') {
      const localEstoqueId = requiredId(input.values.local_estoque_id, 'Local de estoque')
      const produtoId = requiredId(input.values.produto_id, 'Produto')
      const counted = decimal(input.values.quantidade_contada, 'Quantidade contada', true)
      const balance = await lockStockBalance(client, input.tenantId, produtoId, localEstoqueId)
      const systemQuantity = Number(balance.balance.quantidade_fisica || 0)
      const number = optionalText(input.values.numero) || `INV-${Date.now()}`
      const inventory = await client.query(
        `INSERT INTO erp.inventarios
           (tenant_id, numero, local_estoque_id, data_inventario, tipo, status, iniciado_em, finalizado_em, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, 'parcial', 'finalizado', now(), now(), $5, $5) RETURNING id`,
        [input.tenantId, number, localEstoqueId, dateText(input.values.data), input.actorId],
      )
      const inventoryId = Number(inventory.rows[0].id)
      await client.query(
        `INSERT INTO erp.inventarios_itens
           (tenant_id, inventario_id, produto_id, quantidade_sistema, quantidade_contada, custo_medio, contado_em, criado_por, atualizado_por)
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
        })
      }
      return { id: String(inventoryId), status: 'finalizado' }
    }
    if (input.resource === 'transferencias') {
      const originId = requiredId(input.values.local_origem_id, 'Local de origem')
      const destinationId = requiredId(input.values.local_destino_id, 'Local de destino')
      if (originId === destinationId) throw new Error('Origem e destino devem ser diferentes.')
      const produtoId = requiredId(input.values.produto_id, 'Produto')
      const quantidade = decimal(input.values.quantidade, 'Quantidade')
      const number = optionalText(input.values.numero) || `TRF-${Date.now()}`
      const transfer = await client.query(
        `INSERT INTO erp.transferencias_estoque
           (tenant_id, numero, local_origem_id, local_destino_id, data_transferencia, status,
            chave_idempotencia, finalizada_em, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, 'finalizada', $6, now(), $7, $7) RETURNING id`,
        [input.tenantId, number, originId, destinationId, dateText(input.values.data), input.idempotencyKey, input.actorId],
      )
      const transferId = Number(transfer.rows[0].id)
      await client.query(
        `INSERT INTO erp.transferencias_estoque_itens
           (tenant_id, transferencia_id, produto_id, quantidade, criado_por)
         VALUES ($1, $2, $3, $4, $5)`,
        [input.tenantId, transferId, produtoId, quantidade, input.actorId],
      )
      await applyStockMovement(client, {
        ...input, produtoId, localEstoqueId: originId, quantidade: -quantidade,
        tipo: 'transferencia_saida', origemTipo: 'transferencia', origemId: transferId,
        chaveIdempotencia: `${input.idempotencyKey}:saida`,
      })
      await applyStockMovement(client, {
        ...input, produtoId, localEstoqueId: destinationId, quantidade,
        tipo: 'transferencia_entrada', origemTipo: 'transferencia', origemId: transferId,
        chaveIdempotencia: `${input.idempotencyKey}:entrada`,
      })
      return { id: String(transferId), status: 'finalizada' }
    }
    if (input.resource === 'kits') {
      const produtoId = requiredId(input.values.produto_id, 'Produto do kit')
      const componentId = requiredId(input.values.produto_componente_id, 'Produto componente')
      if (produtoId === componentId) throw new Error('O produto nao pode ser componente dele mesmo.')
      const created = await client.query(
        `INSERT INTO erp.kits_produtos (tenant_id, produto_id, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $3)
         ON CONFLICT (tenant_id, produto_id) DO UPDATE SET ativo = true, atualizado_por = EXCLUDED.atualizado_por
         RETURNING id`,
        [input.tenantId, produtoId, input.actorId],
      )
      const kitId = Number(created.rows[0].id)
      await client.query(
        `INSERT INTO erp.kits_produtos_itens
           (tenant_id, kit_id, produto_componente_id, quantidade, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT (tenant_id, kit_id, produto_componente_id)
         DO UPDATE SET quantidade = EXCLUDED.quantidade, atualizado_por = EXCLUDED.atualizado_por`,
        [input.tenantId, kitId, componentId, decimal(input.values.quantidade, 'Quantidade'), input.actorId],
      )
      return { id: String(kitId) }
    }
    if (input.resource === 'conversoes-unidades') {
      const produtoId = requiredId(input.values.produto_id, 'Produto')
      const origin = optionalText(input.values.unidade_origem)?.toUpperCase()
      const destination = optionalText(input.values.unidade_destino)?.toUpperCase()
      if (!origin || !destination) throw new Error('As unidades de origem e destino sao obrigatorias.')
      if (origin === destination) throw new Error('As unidades precisam ser diferentes.')
      const created = await client.query(
        `INSERT INTO erp.conversoes_unidades_produto
           (tenant_id, produto_id, unidade_origem, unidade_destino, fator, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $6)
         ON CONFLICT (tenant_id, produto_id, lower(unidade_origem), lower(unidade_destino))
           WHERE excluido_em IS NULL AND ativo
         DO UPDATE SET fator = EXCLUDED.fator, atualizado_por = EXCLUDED.atualizado_por
         RETURNING id::text`,
        [input.tenantId, produtoId, origin, destination, decimal(input.values.fator, 'Fator'), input.actorId],
      )
      return created.rows[0]
    }
    throw new Error('Operacao de estoque desconhecida.')
  })
}

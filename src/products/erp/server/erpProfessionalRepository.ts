import { runQuery, withTransaction, type SQLClient } from "@/lib/postgres";
import { processDueSalesContracts } from "@/products/erp/server/erpManagementRepository";
import {
  createErpEntityRecord,
  createOrUpdatePurchasePayable,
  getErpSaleDetails,
  processErpFinancialRecurrences,
} from "@/products/erp/server/erpRepository";
import {
  createFinalStockDocument,
  resolveStockLocation,
} from "@/products/erp/server/erpStockRepository";
import { ErpDomainError } from "@/products/erp/server/erpApi";
import type {
  FiscalPreflightIssue,
  FiscalPreflightResult,
  PartialStockActionInput,
  ServiceOrderCreateInput,
} from "@/products/erp/shared/professionalContracts";

type ActorInput = { tenantId: number; actorId: number };

function id(value: unknown, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new ErpDomainError("INVALID_ID", `${label} invalido.`, 422);
  return parsed;
}

function date(value: unknown) {
  const normalized = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? normalized
    : new Date().toISOString().slice(0, 10);
}

function stringValue(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function json(value: unknown) {
  return JSON.stringify(value ?? {});
}

export async function listServiceOrders(input: {
  tenantId: number;
  query?: string;
  status?: string;
}) {
  const query = `%${String(input.query || "").trim()}%`;
  const status = stringValue(input.status);
  return runQuery<Record<string, unknown>>(
    `SELECT ordens.id::text, ordens.numero, ordens.status, ordens.data_inicio,
       ordens.previsao_entrega, ordens.equipamento, ordens.marca, ordens.modelo,
       ordens.total, ordens.versao, clientes.nome AS cliente,
       responsaveis.nome AS responsavel,
       count(itens.id) FILTER (WHERE itens.excluido_em IS NULL)::int AS itens
     FROM erp.ordens_servico AS ordens
     JOIN erp.entidades AS clientes
       ON clientes.tenant_id = ordens.tenant_id AND clientes.id = ordens.cliente_id
     LEFT JOIN erp.entidades AS responsaveis
       ON responsaveis.tenant_id = ordens.tenant_id AND responsaveis.id = ordens.responsavel_id
     LEFT JOIN erp.ordens_servico_itens AS itens
       ON itens.tenant_id = ordens.tenant_id AND itens.ordem_servico_id = ordens.id
     WHERE ordens.tenant_id = $1 AND ordens.excluido_em IS NULL
       AND ($2 = '%%' OR concat_ws(' ', ordens.numero, clientes.nome, ordens.equipamento, ordens.numero_serie) ILIKE $2)
       AND ($3::text IS NULL OR ordens.status = $3)
     GROUP BY ordens.id, clientes.nome, responsaveis.nome
     ORDER BY ordens.data_inicio DESC, ordens.id DESC
     LIMIT 300`,
    [input.tenantId, query, status],
  );
}

export async function getServiceOrder(tenantId: number, orderId: number) {
  const [orders, items, events] = await Promise.all([
    runQuery<Record<string, unknown>>(
      `SELECT ordens.*, clientes.nome AS cliente_nome, responsaveis.nome AS responsavel_nome
       FROM erp.ordens_servico ordens
       JOIN erp.entidades clientes ON clientes.tenant_id = ordens.tenant_id AND clientes.id = ordens.cliente_id
       LEFT JOIN erp.entidades responsaveis ON responsaveis.tenant_id = ordens.tenant_id AND responsaveis.id = ordens.responsavel_id
       WHERE ordens.tenant_id = $1 AND ordens.id = $2 AND ordens.excluido_em IS NULL`,
      [tenantId, orderId],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT id::text, produto_id::text, servico_id::text, descricao, quantidade, valor_unitario, desconto, total
       FROM erp.ordens_servico_itens WHERE tenant_id = $1 AND ordem_servico_id = $2 AND excluido_em IS NULL ORDER BY id`,
      [tenantId, orderId],
    ),
    runQuery<Record<string, unknown>>(
      `SELECT evento, status_anterior, status_novo, dados, criado_em FROM erp.ordens_servico_eventos
       WHERE tenant_id = $1 AND ordem_servico_id = $2 ORDER BY criado_em DESC`,
      [tenantId, orderId],
    ),
  ]);
  if (!orders[0])
    throw new ErpDomainError(
      "SERVICE_ORDER_NOT_FOUND",
      "Ordem de servico nao encontrada.",
      404,
    );
  return { order: orders[0], items, events };
}

export async function createServiceOrder(
  input: ActorInput & {
    values: ServiceOrderCreateInput;
    idempotencyKey?: string | null;
  },
) {
  return withTransaction(async (client) => {
    const key = stringValue(input.idempotencyKey);
    if (key) {
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
        [`erp:os:${input.tenantId}:${key}`],
      );
      const existing = await client.query(
        `SELECT id::text FROM erp.ordens_servico WHERE tenant_id = $1 AND chave_idempotencia = $2 AND excluido_em IS NULL`,
        [input.tenantId, key],
      );
      if (existing.rows[0]) return existing.rows[0];
    }

    const customer = await client.query(
      `SELECT id FROM erp.entidades WHERE tenant_id = $1 AND id = $2 AND eh_cliente AND ativo AND excluido_em IS NULL`,
      [input.tenantId, input.values.cliente_id],
    );
    if (!customer.rows[0])
      throw new ErpDomainError(
        "CUSTOMER_NOT_FOUND",
        "Cliente nao encontrado.",
        422,
      );

    const normalizedItems: Array<Record<string, unknown>> = [];
    for (const [index, item] of input.values.itens.entries()) {
      const table = item.tipo === "produto" ? "produtos" : "servicos";
      const catalog = await client.query(
        `SELECT id, nome FROM erp.${table} WHERE tenant_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL`,
        [input.tenantId, item.item_id],
      );
      if (!catalog.rows[0])
        throw new ErpDomainError(
          "ITEM_NOT_FOUND",
          `Item ${index + 1} nao encontrado.`,
          422,
        );
      const total = Number(
        Math.max(
          0,
          item.quantidade * item.valor_unitario - item.desconto,
        ).toFixed(2),
      );
      normalizedItems.push({ ...item, total });
    }
    const subtotal = Number(
      normalizedItems
        .reduce((sum, item) => sum + Number(item.total), 0)
        .toFixed(2),
    );
    if (input.values.desconto > subtotal)
      throw new ErpDomainError(
        "INVALID_DISCOUNT",
        "Desconto supera o subtotal.",
        422,
      );
    const total = Number((subtotal - input.values.desconto).toFixed(2));
    const number = stringValue(input.values.numero) || `OS-${Date.now()}`;
    const created = await client.query(
      `INSERT INTO erp.ordens_servico
         (tenant_id, cliente_id, responsavel_id, numero, status, data_inicio, previsao_entrega,
          equipamento, marca, modelo, numero_serie, problema_informado, diagnostico,
          observacoes_publicas, observacoes_internas, subtotal, desconto, total,
          chave_idempotencia, criado_por, atualizado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$20)
       RETURNING id::text, numero, status, versao`,
      [
        input.tenantId,
        input.values.cliente_id,
        input.values.responsavel_id,
        number,
        input.values.status,
        input.values.data_inicio,
        input.values.previsao_entrega,
        input.values.equipamento,
        input.values.marca,
        input.values.modelo,
        input.values.numero_serie,
        input.values.problema_informado,
        input.values.diagnostico,
        input.values.observacoes_publicas,
        input.values.observacoes_internas,
        subtotal,
        input.values.desconto,
        total,
        key,
        input.actorId,
      ],
    );
    const order = created.rows[0];
    for (const item of normalizedItems) {
      await client.query(
        `INSERT INTO erp.ordens_servico_itens
           (tenant_id, ordem_servico_id, produto_id, servico_id, descricao, quantidade,
            valor_unitario, desconto, total, criado_por, atualizado_por)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
        [
          input.tenantId,
          order.id,
          item.tipo === "produto" ? item.item_id : null,
          item.tipo === "servico" ? item.item_id : null,
          item.descricao,
          item.quantidade,
          item.valor_unitario,
          item.desconto,
          item.total,
          input.actorId,
        ],
      );
    }
    await client.query(
      `INSERT INTO erp.ordens_servico_eventos (tenant_id, ordem_servico_id, evento, status_novo, dados, criado_por)
       VALUES ($1,$2,'criada',$3,$4::jsonb,$5)`,
      [
        input.tenantId,
        order.id,
        input.values.status,
        json({ total }),
        input.actorId,
      ],
    );
    return order;
  });
}

const serviceOrderTransitions: Record<string, Record<string, string>> = {
  aprovar: { rascunho: "aprovada", orcamento_pendente: "aprovada" },
  iniciar: { aprovada: "em_execucao" },
  concluir: { em_execucao: "concluida" },
  cancelar: {
    rascunho: "cancelada",
    orcamento_pendente: "cancelada",
    aprovada: "cancelada",
    em_execucao: "cancelada",
  },
};

async function convertServiceOrder(
  input: ActorInput & {
    orderId: number;
    documentType: "orcamento" | "venda";
    expectedVersion: number;
  },
) {
  const details = await getServiceOrder(input.tenantId, input.orderId);
  const order = details.order;
  if (Number(order.versao) !== input.expectedVersion)
    throw new ErpDomainError(
      "VERSION_CONFLICT",
      "A ordem foi alterada por outra pessoa.",
      409,
    );
  if (order.status === "cancelada")
    throw new ErpDomainError(
      "INVALID_STATE",
      "Ordem cancelada nao pode ser convertida.",
      409,
    );
  const existingId =
    input.documentType === "orcamento" ? order.orcamento_id : order.venda_id;
  if (existingId) return { id: String(existingId), reused: true };
  const record = await createErpEntityRecord({
    tenantId: input.tenantId,
    actorId: input.actorId,
    entityId: "pedidos",
    idempotencyKey: `os:${input.orderId}:${input.documentType}`,
    values: {
      cliente_id: order.cliente_id,
      vendedor_id: order.responsavel_id,
      tipo_documento: input.documentType,
      data_venda: date(order.data_inicio),
      validade_em: order.previsao_entrega
        ? date(order.previsao_entrega)
        : undefined,
      previsao_entrega: order.previsao_entrega,
      observacoes: order.observacoes_publicas,
      desconto: order.desconto,
      itens: details.items.map((item) => ({
        tipo: item.produto_id ? "produto" : "servico",
        item_id: item.produto_id || item.servico_id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        desconto: item.desconto,
      })),
      parcelas: [
        {
          numero_parcela: 1,
          data_vencimento: date(order.previsao_entrega || order.data_inicio),
          valor: order.total,
        },
      ],
    },
  });
  const linked = await withTransaction(async (client) => {
    const column =
      input.documentType === "orcamento" ? "orcamento_id" : "venda_id";
    const updated = await client.query(
      `UPDATE erp.ordens_servico SET ${column} = $3, versao = versao + 1, atualizado_por = $4
       WHERE tenant_id = $1 AND id = $2 AND versao = $5
       RETURNING id`,
      [
        input.tenantId,
        input.orderId,
        id(record.id, "Documento"),
        input.actorId,
        input.expectedVersion,
      ],
    );
    if (!updated.rows[0]) return false;
    await client.query(
      `INSERT INTO erp.ordens_servico_eventos (tenant_id, ordem_servico_id, evento, dados, criado_por)
       VALUES ($1,$2,$3,$4::jsonb,$5)`,
      [
        input.tenantId,
        input.orderId,
        `gerou_${input.documentType}`,
        json({ documento_id: record.id }),
        input.actorId,
      ],
    );
    return true;
  });
  return { id: String(record.id), reused: !linked };
}

export async function runServiceOrderAction(
  input: ActorInput & {
    orderId: number;
    action: string;
    expectedVersion: number;
  },
) {
  if (input.action === "gerar_orcamento" || input.action === "gerar_venda") {
    return convertServiceOrder({
      ...input,
      documentType: input.action === "gerar_orcamento" ? "orcamento" : "venda",
    });
  }
  return withTransaction(async (client) => {
    const current = await client.query(
      `SELECT id, status, versao FROM erp.ordens_servico WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, input.orderId],
    );
    const order = current.rows[0];
    if (!order)
      throw new ErpDomainError(
        "SERVICE_ORDER_NOT_FOUND",
        "Ordem de servico nao encontrada.",
        404,
      );
    if (Number(order.versao) !== input.expectedVersion)
      throw new ErpDomainError(
        "VERSION_CONFLICT",
        "A ordem foi alterada por outra pessoa.",
        409,
      );
    const next = serviceOrderTransitions[input.action]?.[String(order.status)];
    if (!next)
      throw new ErpDomainError(
        "INVALID_STATE",
        "Acao indisponivel para a situacao atual.",
        409,
      );
    const updated = await client.query(
      `UPDATE erp.ordens_servico SET status = $3,
         concluida_em = CASE WHEN $3 = 'concluida' THEN now() ELSE concluida_em END,
         versao = versao + 1, atualizado_por = $4
       WHERE tenant_id = $1 AND id = $2 RETURNING id::text, status, versao`,
      [input.tenantId, input.orderId, next, input.actorId],
    );
    await client.query(
      `INSERT INTO erp.ordens_servico_eventos
         (tenant_id, ordem_servico_id, evento, status_anterior, status_novo, dados, criado_por)
       VALUES ($1,$2,$3,$4,$5,'{}'::jsonb,$6)`,
      [
        input.tenantId,
        input.orderId,
        input.action,
        order.status,
        next,
        input.actorId,
      ],
    );
    return updated.rows[0];
  });
}

export async function convertQuoteToSale(
  input: ActorInput & { quoteId: number; expectedVersion: number },
) {
  const details = await getErpSaleDetails(input.tenantId, input.quoteId);
  const quote = details.sale;
  if (quote.tipo_documento !== "orcamento")
    throw new ErpDomainError(
      "NOT_A_QUOTE",
      "Documento informado nao e um orcamento.",
      409,
    );
  if (Number(quote.versao) !== input.expectedVersion)
    throw new ErpDomainError(
      "VERSION_CONFLICT",
      "O orcamento foi alterado por outra pessoa.",
      409,
    );
  if (quote.situacao === "recusado" || quote.status === "cancelada")
    throw new ErpDomainError(
      "INVALID_STATE",
      "Orcamento recusado ou cancelado nao pode ser convertido.",
      409,
    );
  const existing = await runQuery<{ id: string }>(
    `SELECT id::text FROM erp.vendas WHERE tenant_id = $1 AND venda_origem_id = $2 AND excluido_em IS NULL LIMIT 1`,
    [input.tenantId, input.quoteId],
  );
  if (existing[0]) return { sale: existing[0], reused: true };
  const record = await createErpEntityRecord({
    tenantId: input.tenantId,
    actorId: input.actorId,
    entityId: "pedidos",
    idempotencyKey: `orcamento:${input.quoteId}:venda`,
    values: {
      ...quote,
      tipo_documento: "venda",
      venda_origem_id: input.quoteId,
      numero: undefined,
      itens: details.items,
      parcelas: details.installments.map((row) => ({
        numero_parcela: row.numero_parcela,
        descricao: row.descricao,
        data_vencimento: date(row.data_vencimento),
        valor: row.valor,
        conta_financeira_id: row.conta_financeira_id,
        metodo_pagamento_id: row.metodo_pagamento_id,
      })),
    },
  });
  const linked = await withTransaction(async (client) => {
    const updated = await client.query(
      `UPDATE erp.vendas SET situacao = 'aprovado', versao = versao + 1, atualizado_por = $3
       WHERE tenant_id = $1 AND id = $2 AND versao = $4
       RETURNING id`,
      [input.tenantId, input.quoteId, input.actorId, input.expectedVersion],
    );
    if (!updated.rows[0]) return false;
    await client.query(
      `INSERT INTO erp.vendas_eventos (tenant_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1,$2,'convertido_em_venda','rascunho','rascunho',$3,$4::jsonb,$5)`,
      [
        input.tenantId,
        input.quoteId,
        input.expectedVersion + 1,
        json({ venda_id: record.id }),
        input.actorId,
      ],
    );
    return true;
  });
  return { sale: { id: String(record.id) }, reused: !linked };
}

export async function runQuoteAction(
  input: ActorInput & {
    quoteId: number;
    action: "enviar" | "aprovar" | "recusar" | "cancelar";
    expectedVersion: number;
  },
) {
  return withTransaction(async (client) => {
    const current = await client.query(
      `SELECT id, status, situacao, versao FROM erp.vendas
       WHERE tenant_id = $1 AND id = $2 AND tipo_documento = 'orcamento' AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, input.quoteId],
    );
    const quote = current.rows[0];
    if (!quote)
      throw new ErpDomainError(
        "QUOTE_NOT_FOUND",
        "Orcamento nao encontrado.",
        404,
      );
    if (Number(quote.versao) !== input.expectedVersion)
      throw new ErpDomainError(
        "VERSION_CONFLICT",
        "O orcamento foi alterado por outra pessoa.",
        409,
      );
    if (quote.status === "cancelada" || quote.situacao === "recusado")
      throw new ErpDomainError(
        "INVALID_STATE",
        "Orcamento encerrado nao pode ser alterado.",
        409,
      );

    const nextSituation =
      input.action === "aprovar"
        ? "aprovado"
        : input.action === "recusar"
          ? "recusado"
          : quote.situacao || "em_andamento";
    const nextStatus = input.action === "cancelar" ? "cancelada" : quote.status;
    const updated = await client.query(
      `UPDATE erp.vendas SET status = $3, situacao = $4,
         enviada_em = CASE WHEN $5 = 'enviar' THEN now() ELSE enviada_em END,
         recusada_em = CASE WHEN $5 = 'recusar' THEN now() ELSE recusada_em END,
         cancelada_em = CASE WHEN $5 = 'cancelar' THEN now() ELSE cancelada_em END,
         versao = versao + 1, atualizado_por = $6
       WHERE tenant_id = $1 AND id = $2
       RETURNING id::text, status, situacao, versao, enviada_em, recusada_em`,
      [
        input.tenantId,
        input.quoteId,
        nextStatus,
        nextSituation,
        input.action,
        input.actorId,
      ],
    );
    await client.query(
      `INSERT INTO erp.vendas_eventos
         (tenant_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
      [
        input.tenantId,
        input.quoteId,
        `orcamento_${input.action}`,
        quote.situacao,
        nextSituation,
        input.expectedVersion + 1,
        json({ status: nextStatus }),
        input.actorId,
      ],
    );
    return updated.rows[0];
  });
}

export async function receivePurchaseItems(
  input: ActorInput & {
    purchaseId: number;
    values: PartialStockActionInput;
    idempotencyKey: string;
  },
) {
  return withTransaction(async (client) => {
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
      [`erp:recebimento:${input.tenantId}:${input.idempotencyKey}`],
    );
    const duplicate = await client.query(
      `SELECT id::text FROM erp.documentos_estoque WHERE tenant_id = $1 AND chave_idempotencia LIKE $2 LIMIT 1`,
      [input.tenantId, `${input.idempotencyKey}%`],
    );
    if (duplicate.rows[0])
      return { documents: [duplicate.rows[0]], reused: true };
    const purchaseResult = await client.query(
      `SELECT * FROM erp.compras WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, input.purchaseId],
    );
    const purchase = purchaseResult.rows[0];
    if (!purchase)
      throw new ErpDomainError(
        "PURCHASE_NOT_FOUND",
        "Compra nao encontrada.",
        404,
      );
    if (purchase.status === "cancelada")
      throw new ErpDomainError(
        "INVALID_STATE",
        "Compra cancelada nao pode ser recebida.",
        409,
      );

    const groups = new Map<
      number,
      Array<{
        produtoId: number;
        quantidade: number;
        custoUnitario: number;
        compraItemId: number;
      }>
    >();
    for (const requested of input.values.items) {
      const itemResult = await client.query(
        `SELECT itens.*, produtos.controla_estoque
         FROM erp.compras_itens itens
         LEFT JOIN erp.produtos produtos ON produtos.tenant_id = itens.tenant_id AND produtos.id = itens.produto_id
         WHERE itens.tenant_id = $1 AND itens.compra_id = $2 AND itens.id = $3 AND itens.excluido_em IS NULL FOR UPDATE`,
        [input.tenantId, input.purchaseId, requested.item_id],
      );
      const item = itemResult.rows[0];
      if (!item || !item.produto_id || !item.controla_estoque)
        throw new ErpDomainError(
          "INVALID_STOCK_ITEM",
          "Item nao controla estoque.",
          422,
        );
      const pending =
        Number(item.quantidade) - Number(item.quantidade_recebida || 0);
      if (requested.quantidade > pending + 0.0001)
        throw new ErpDomainError(
          "QUANTITY_EXCEEDS_PENDING",
          `Quantidade excede o saldo pendente de ${String(item.descricao)}.`,
          422,
        );
      const locationId = await resolveStockLocation(client, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        localEstoqueId:
          Number(requested.local_estoque_id || item.local_estoque_id || 0) ||
          null,
      });
      const group = groups.get(locationId) || [];
      group.push({
        produtoId: Number(item.produto_id),
        quantidade: requested.quantidade,
        custoUnitario: Number(item.valor_unitario || 0),
        compraItemId: Number(item.id),
      });
      groups.set(locationId, group);
      await client.query(
        `UPDATE erp.compras_itens SET quantidade_recebida = quantidade_recebida + $4,
           local_estoque_id = $5, atualizado_por = $6
         WHERE tenant_id = $1 AND compra_id = $2 AND id = $3`,
        [
          input.tenantId,
          input.purchaseId,
          item.id,
          requested.quantidade,
          locationId,
          input.actorId,
        ],
      );
    }

    const documents: Record<string, unknown>[] = [];
    let groupIndex = 0;
    for (const [locationId, items] of groups) {
      documents.push(
        await createFinalStockDocument(client, {
          tenantId: input.tenantId,
          actorId: input.actorId,
          tipo: "entrada",
          localEstoqueId: locationId,
          entidadeId: Number(purchase.fornecedor_id),
          compraId: input.purchaseId,
          motivo: input.values.observacoes || "Recebimento parcial de compra",
          chaveIdempotencia: `${input.idempotencyKey}:local:${locationId}:${groupIndex++}`,
          items,
          movementType: "entrada_compra",
          originType: "compra",
        }),
      );
    }
    const pendingResult = await client.query(
      `SELECT count(*) FILTER (WHERE itens.produto_id IS NOT NULL AND produtos.controla_estoque AND itens.quantidade_recebida < itens.quantidade)::int AS pendentes
       FROM erp.compras_itens itens
       LEFT JOIN erp.produtos produtos ON produtos.tenant_id = itens.tenant_id AND produtos.id = itens.produto_id
       WHERE itens.tenant_id = $1 AND itens.compra_id = $2 AND itens.excluido_em IS NULL`,
      [input.tenantId, input.purchaseId],
    );
    const complete = Number(pendingResult.rows[0]?.pendentes || 0) === 0;
    const nextStatus = complete ? "recebida" : "parcialmente_recebida";
    const nextMovement = complete ? "compra" : purchase.tipo_movimento;
    const updatedPurchase = await client.query(
      `UPDATE erp.compras SET status = $3, tipo_movimento = $4,
         recebida_em = CASE WHEN $3 = 'recebida' THEN now() ELSE recebida_em END,
         versao = versao + 1, atualizado_por = $5
       WHERE tenant_id = $1 AND id = $2 RETURNING *`,
      [
        input.tenantId,
        input.purchaseId,
        nextStatus,
        nextMovement,
        input.actorId,
      ],
    );
    if (complete && purchase.gera_financeiro) {
      await createOrUpdatePurchasePayable(
        client,
        updatedPurchase.rows[0] as never,
        input.actorId,
        "efetivo",
      );
    }
    await client.query(
      `INSERT INTO erp.compras_eventos (tenant_id, compra_id, evento, dados, criado_por)
       VALUES ($1,$2,$3,$4::jsonb,$5)`,
      [
        input.tenantId,
        input.purchaseId,
        complete ? "recebida" : "recebimento_parcial",
        json({ documents }),
        input.actorId,
      ],
    );
    return { documents, status: nextStatus, reused: false };
  });
}

export async function attendSaleItems(
  input: ActorInput & {
    saleId: number;
    values: PartialStockActionInput;
    idempotencyKey: string;
  },
) {
  return withTransaction(async (client) => {
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`,
      [`erp:atendimento:${input.tenantId}:${input.idempotencyKey}`],
    );
    const saleResult = await client.query(
      `SELECT * FROM erp.vendas WHERE tenant_id = $1 AND id = $2 AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, input.saleId],
    );
    const sale = saleResult.rows[0];
    if (!sale)
      throw new ErpDomainError("SALE_NOT_FOUND", "Venda nao encontrada.", 404);
    if (String(sale.status) !== "confirmada" || !["pendente", "parcial"].includes(String(sale.atendimento_status)))
      throw new ErpDomainError(
        "INVALID_STATE",
        "Venda precisa estar confirmada e pendente para atender.",
        409,
      );
    const groups = new Map<
      number,
      Array<{
        produtoId: number;
        quantidade: number;
        custoUnitario: number;
        vendaItemId: number;
      }>
    >();
    for (const requested of input.values.items) {
      const itemResult = await client.query(
        `SELECT * FROM erp.vendas_itens WHERE tenant_id = $1 AND venda_id = $2 AND id = $3 AND excluido_em IS NULL FOR UPDATE`,
        [input.tenantId, input.saleId, requested.item_id],
      );
      const item = itemResult.rows[0];
      if (!item)
        throw new ErpDomainError(
          "SALE_ITEM_NOT_FOUND",
          "Item da venda nao encontrado.",
          404,
        );
      const pending =
        Number(item.quantidade) - Number(item.quantidade_atendida || 0);
      if (requested.quantidade > pending + 0.0001)
        throw new ErpDomainError(
          "QUANTITY_EXCEEDS_PENDING",
          `Quantidade excede o saldo pendente de ${String(item.descricao)}.`,
          422,
        );
      const reservations = await client.query(
        `SELECT * FROM erp.reservas_estoque WHERE tenant_id = $1 AND venda_id = $2 AND venda_item_id = $3 AND status = 'ativa' FOR UPDATE`,
        [input.tenantId, input.saleId, item.id],
      );
      for (const reservation of reservations.rows) {
        const movementQuantity = Number(
          (
            (requested.quantidade / Number(item.quantidade)) *
            Number(reservation.quantidade)
          ).toFixed(4),
        );
        const locationId = Number(reservation.local_estoque_id);
        const group = groups.get(locationId) || [];
        group.push({
          produtoId: Number(reservation.produto_id),
          quantidade: movementQuantity,
          custoUnitario: Number(item.custo_unitario || 0),
          vendaItemId: Number(item.id),
        });
        groups.set(locationId, group);
        await client.query(
          `UPDATE erp.saldos_estoque SET quantidade_reservada = greatest(0, quantidade_reservada - $4), versao = versao + 1
           WHERE tenant_id = $1 AND produto_id = $2 AND local_estoque_id = $3`,
          [
            input.tenantId,
            reservation.produto_id,
            locationId,
            movementQuantity,
          ],
        );
        const attended =
          Number(reservation.quantidade_atendida || 0) + movementQuantity;
        await client.query(
          `UPDATE erp.reservas_estoque SET quantidade_atendida = $3,
             status = CASE WHEN $3 >= quantidade THEN 'atendida' ELSE status END,
             encerrada_em = CASE WHEN $3 >= quantidade THEN now() ELSE encerrada_em END,
             atualizado_por = $4 WHERE tenant_id = $1 AND id = $2`,
          [input.tenantId, reservation.id, attended, input.actorId],
        );
      }
      await client.query(
        `UPDATE erp.vendas_itens SET quantidade_atendida = quantidade_atendida + $4, atualizado_por = $5
         WHERE tenant_id = $1 AND venda_id = $2 AND id = $3`,
        [
          input.tenantId,
          input.saleId,
          item.id,
          requested.quantidade,
          input.actorId,
        ],
      );
    }
    const documents: Record<string, unknown>[] = [];
    let groupIndex = 0;
    for (const [locationId, items] of groups) {
      documents.push(
        await createFinalStockDocument(client, {
          tenantId: input.tenantId,
          actorId: input.actorId,
          tipo: "saida",
          localEstoqueId: locationId,
          entidadeId: Number(sale.cliente_id),
          vendaId: input.saleId,
          motivo: input.values.observacoes || "Atendimento parcial de venda",
          chaveIdempotencia: `${input.idempotencyKey}:local:${locationId}:${groupIndex++}`,
          items,
          movementType: "saida_venda",
          originType: "venda",
        }),
      );
    }
    const pendingResult = await client.query(
      `SELECT count(*) FILTER (WHERE produto_id IS NOT NULL AND quantidade_atendida < quantidade)::int AS pendentes
       FROM erp.vendas_itens WHERE tenant_id = $1 AND venda_id = $2 AND excluido_em IS NULL`,
      [input.tenantId, input.saleId],
    );
    const complete = Number(pendingResult.rows[0]?.pendentes || 0) === 0;
    const nextAttendanceStatus = complete ? "atendido" : "parcial";
    await client.query(
      `UPDATE erp.vendas SET atendimento_status = $3,
         atendida_em = CASE WHEN $3 = 'atendido' THEN now() ELSE atendida_em END,
         versao = versao + 1, atualizado_por = $4 WHERE tenant_id = $1 AND id = $2`,
      [input.tenantId, input.saleId, nextAttendanceStatus, input.actorId],
    );
    await client.query(
      `INSERT INTO erp.vendas_eventos (tenant_id, venda_id, evento, status_anterior, status_novo, versao, dados, criado_por)
       SELECT $1,$2,$3,$4,$5,versao,$6::jsonb,$7 FROM erp.vendas WHERE tenant_id = $1 AND id = $2`,
      [
        input.tenantId,
        input.saleId,
        complete ? "atendimento_concluido" : "atendimento_parcial",
        sale.status,
        sale.status,
        json({ documents, atendimento_status: nextAttendanceStatus }),
        input.actorId,
      ],
    );
    return { documents, status: "confirmada", atendimento_status: nextAttendanceStatus };
  });
}

export async function preflightSaleFiscal(
  tenantId: number,
  saleId: number,
): Promise<FiscalPreflightResult> {
  const details = await getErpSaleDetails(tenantId, saleId);
  const sale = details.sale;
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT entidades.*, configs.id AS configuracao_id, configs.cnpj AS emitente_cnpj,
       configs.inscricao_estadual AS emitente_ie, configs.endereco_codigo_municipio AS emitente_codigo_municipio
     FROM erp.entidades
     LEFT JOIN erp.configuracoes_fiscais configs
       ON configs.tenant_id = entidades.tenant_id AND configs.ativo AND configs.excluido_em IS NULL
     WHERE entidades.tenant_id = $1 AND entidades.id = $2`,
    [tenantId, sale.cliente_id],
  );
  const customer = rows[0] || {};
  const issues: FiscalPreflightIssue[] = [];
  const required = (
    condition: unknown,
    code: string,
    field: string,
    message: string,
  ) => {
    if (!condition) issues.push({ code, field, message, severity: "error" });
  };
  required(
    customer.configuracao_id,
    "FISCAL_CONFIG_MISSING",
    "configuracao_fiscal",
    "Configure os dados fiscais da empresa.",
  );
  required(
    customer.emitente_cnpj,
    "ISSUER_DOCUMENT_MISSING",
    "configuracao_fiscal.cnpj",
    "Informe o CNPJ do emitente.",
  );
  required(
    customer.emitente_codigo_municipio,
    "ISSUER_CITY_CODE_MISSING",
    "configuracao_fiscal.endereco_codigo_municipio",
    "Informe o codigo IBGE do municipio do emitente.",
  );
  required(
    customer.documento,
    "CUSTOMER_DOCUMENT_MISSING",
    "cliente.documento",
    "Informe o CPF ou CNPJ do cliente.",
  );
  required(
    customer.cep &&
      customer.logradouro &&
      customer.numero &&
      customer.cidade &&
      customer.uf,
    "CUSTOMER_ADDRESS_INCOMPLETE",
    "cliente.endereco",
    "Complete o endereco fiscal do cliente.",
  );
  required(
    Number(sale.total) > 0,
    "SALE_TOTAL_INVALID",
    "venda.total",
    "A venda precisa ter total maior que zero.",
  );
  for (const item of details.items) {
    if (item.tipo === "produto") {
      const products = await runQuery<Record<string, unknown>>(
        `SELECT ncm, origem, unidade_medida FROM erp.produtos WHERE tenant_id = $1 AND id = $2`,
        [tenantId, item.item_id],
      );
      required(
        products[0]?.ncm,
        "PRODUCT_NCM_MISSING",
        `itens.${item.id}.ncm`,
        `Informe o NCM de ${String(item.descricao)}.`,
      );
      required(
        products[0]?.origem,
        "PRODUCT_ORIGIN_MISSING",
        `itens.${item.id}.origem`,
        `Informe a origem de ${String(item.descricao)}.`,
      );
      required(
        products[0]?.unidade_medida,
        "PRODUCT_UNIT_MISSING",
        `itens.${item.id}.unidade`,
        `Informe a unidade de ${String(item.descricao)}.`,
      );
    } else {
      const services = await runQuery<Record<string, unknown>>(
        `SELECT codigo_servico_municipal FROM erp.servicos WHERE tenant_id = $1 AND id = $2`,
        [tenantId, item.item_id],
      );
      if (!services[0]?.codigo_servico_municipal) {
        issues.push({
          code: "SERVICE_CODE_MISSING",
          field: `itens.${item.id}.codigo_servico_municipal`,
          message: `Informe o codigo municipal de ${String(item.descricao)}.`,
          severity: "warning",
        });
      }
    }
  }
  return { ready: !issues.some((issue) => issue.severity === "error"), issues };
}

export async function listReconciliationRules(tenantId: number) {
  return runQuery(
    `SELECT regras.id::text, regras.nome, regras.conta_financeira_id::text, contas.nome AS conta,
       regras.correspondencia_exata, regras.correspondencia_aproximada,
       regras.tolerancia_dias, regras.tolerancia_valor, regras.ativo
     FROM erp.regras_conciliacao_bancaria regras
     LEFT JOIN erp.contas_financeiras contas ON contas.tenant_id = regras.tenant_id AND contas.id = regras.conta_financeira_id
     WHERE regras.tenant_id = $1 AND regras.excluido_em IS NULL ORDER BY regras.nome`,
    [tenantId],
  );
}

export async function saveReconciliationRule(
  input: ActorInput & { values: Record<string, unknown> },
) {
  const result = await runQuery(
    `INSERT INTO erp.regras_conciliacao_bancaria
       (tenant_id, conta_financeira_id, nome, correspondencia_exata, correspondencia_aproximada,
        tolerancia_dias, tolerancia_valor, criado_por, atualizado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
     ON CONFLICT (tenant_id, (COALESCE(conta_financeira_id, 0))) WHERE excluido_em IS NULL AND ativo = true
     DO UPDATE SET nome = EXCLUDED.nome, correspondencia_exata = EXCLUDED.correspondencia_exata,
       correspondencia_aproximada = EXCLUDED.correspondencia_aproximada,
       tolerancia_dias = EXCLUDED.tolerancia_dias, tolerancia_valor = EXCLUDED.tolerancia_valor,
       atualizado_por = EXCLUDED.atualizado_por
     RETURNING id::text`,
    [
      input.tenantId,
      input.values.conta_financeira_id || null,
      input.values.nome,
      input.values.correspondencia_exata,
      input.values.correspondencia_aproximada,
      input.values.tolerancia_dias,
      input.values.tolerancia_valor,
      input.actorId,
    ],
  );
  return result[0];
}

export async function suggestBankReconciliations(tenantId: number) {
  return runQuery<Record<string, unknown>>(
    `WITH candidates AS (
       SELECT transacoes.id AS transacao_id, pagamentos.id AS pagamento_id,
         abs(transacoes.valor - abs(pagamentos.valor_liquido)) AS diferenca_valor,
         abs(transacoes.data_transacao - pagamentos.data_pagamento) AS diferenca_dias,
         row_number() OVER (PARTITION BY transacoes.id ORDER BY
           abs(transacoes.valor - abs(pagamentos.valor_liquido)),
           abs(transacoes.data_transacao - pagamentos.data_pagamento), pagamentos.id) AS posicao,
         count(*) OVER (PARTITION BY transacoes.id, abs(transacoes.valor - abs(pagamentos.valor_liquido)), abs(transacoes.data_transacao - pagamentos.data_pagamento)) AS empates
       FROM erp.transacoes_bancarias transacoes
       JOIN erp.pagamentos pagamentos ON pagamentos.tenant_id = transacoes.tenant_id
         AND pagamentos.conta_financeira_id = transacoes.conta_financeira_id
         AND pagamentos.estornado_em IS NULL AND pagamentos.estorno_de_pagamento_id IS NULL
         AND ((transacoes.tipo = 'credito' AND pagamentos.tipo = 'receber') OR (transacoes.tipo = 'debito' AND pagamentos.tipo = 'pagar'))
       LEFT JOIN erp.regras_conciliacao_bancaria regras ON regras.tenant_id = transacoes.tenant_id
         AND (regras.conta_financeira_id = transacoes.conta_financeira_id OR regras.conta_financeira_id IS NULL)
         AND regras.ativo AND regras.excluido_em IS NULL
       LEFT JOIN erp.conciliacoes_bancarias_itens conciliados ON conciliados.tenant_id = pagamentos.tenant_id AND conciliados.pagamento_id = pagamentos.id
       WHERE transacoes.tenant_id = $1 AND transacoes.status = 'pendente' AND transacoes.excluido_em IS NULL
         AND conciliados.id IS NULL
         AND abs(transacoes.valor - abs(pagamentos.valor_liquido)) <= COALESCE(regras.tolerancia_valor, 0)
         AND abs(transacoes.data_transacao - pagamentos.data_pagamento) <= COALESCE(regras.tolerancia_dias, 5)
     )
     SELECT candidates.transacao_id::text, candidates.pagamento_id::text,
       transacoes.data_transacao AS data, transacoes.descricao, transacoes.valor,
       pagamentos.data_pagamento, pagamentos.valor_liquido,
       candidates.diferenca_valor, candidates.diferenca_dias,
       CASE WHEN diferenca_valor = 0 AND diferenca_dias = 0 THEN 'exata' ELSE 'aproximada' END AS tipo,
       (empates = 1) AS segura
     FROM candidates
     JOIN erp.transacoes_bancarias transacoes ON transacoes.tenant_id = $1 AND transacoes.id = candidates.transacao_id
     JOIN erp.pagamentos pagamentos ON pagamentos.tenant_id = $1 AND pagamentos.id = candidates.pagamento_id
     WHERE candidates.posicao = 1 ORDER BY candidates.transacao_id`,
    [tenantId],
  );
}

export async function setBankTransactionIgnored(
  input: ActorInput & { transactionId: number; ignored: boolean },
) {
  const rows = await runQuery(
    `UPDATE erp.transacoes_bancarias SET status = $3,
       metadata = metadata || jsonb_build_object('ignorada_por', $4::bigint, 'ignorada_em', now()), atualizado_por = $4
     WHERE tenant_id = $1 AND id = $2 AND status IN ('pendente', 'ignorada') AND excluido_em IS NULL
     RETURNING id::text, status`,
    [
      input.tenantId,
      input.transactionId,
      input.ignored ? "ignorada" : "pendente",
      input.actorId,
    ],
  );
  if (!rows[0])
    throw new ErpDomainError(
      "BANK_TRANSACTION_NOT_FOUND",
      "Transacao bancaria nao encontrada.",
      404,
    );
  return rows[0];
}

export async function listCompletedBankReconciliations(tenantId: number) {
  return runQuery<Record<string, unknown>>(
    `SELECT itens.transacao_bancaria_id::text, itens.pagamento_id::text, itens.origem_conciliacao,
       itens.valor_conciliado, itens.criado_em AS conciliado_em,
       transacoes.data_transacao AS data, transacoes.descricao
     FROM erp.conciliacoes_bancarias_itens itens
     JOIN erp.transacoes_bancarias transacoes ON transacoes.tenant_id = itens.tenant_id AND transacoes.id = itens.transacao_bancaria_id
     WHERE itens.tenant_id = $1 AND itens.desfeito_em IS NULL
     ORDER BY itens.criado_em DESC LIMIT 100`,
    [tenantId],
  );
}

export async function undoBankReconciliation(
  input: ActorInput & { transactionId: number },
) {
  return withTransaction(async (client) => {
    const current = await client.query(
      `SELECT itens.id, itens.conciliacao_id, itens.pagamento_id
       FROM erp.conciliacoes_bancarias_itens itens
       WHERE itens.tenant_id = $1 AND itens.transacao_bancaria_id = $2 AND itens.desfeito_em IS NULL FOR UPDATE`,
      [input.tenantId, input.transactionId],
    );
    const item = current.rows[0];
    if (!item)
      throw new ErpDomainError(
        "RECONCILIATION_NOT_FOUND",
        "Conciliacao ativa nao encontrada.",
        404,
      );
    await client.query(
      `UPDATE erp.conciliacoes_bancarias_itens SET desfeito_em = now(), desfeito_por = $3
       WHERE tenant_id = $1 AND id = $2`,
      [input.tenantId, item.id, input.actorId],
    );
    await client.query(
      `UPDATE erp.conciliacoes_bancarias SET status = 'cancelada', atualizado_por = $3
       WHERE tenant_id = $1 AND id = $2`,
      [input.tenantId, item.conciliacao_id, input.actorId],
    );
    await client.query(
      `UPDATE erp.transacoes_bancarias SET status = 'pendente', atualizado_por = $3
       WHERE tenant_id = $1 AND id = $2`,
      [input.tenantId, input.transactionId, input.actorId],
    );
    if (item.pagamento_id) {
      await client.query(
        `UPDATE erp.pagamentos SET conciliado = false,
           origem = COALESCE(metadata ->> 'origem_antes_conciliacao', 'manual'),
           metadata = metadata - 'origem_antes_conciliacao', atualizado_por = $3
         WHERE tenant_id = $1 AND id = $2`,
        [input.tenantId, item.pagamento_id, input.actorId],
      );
    }
    return { id: String(item.id), status: "desfeita" };
  });
}

export async function runErpAutomation(
  input: ActorInput & { tipo: string; competencia?: string },
) {
  const competence = date(input.competencia);
  const key = `${input.tipo}:${competence}`;
  const existing = await runQuery<Record<string, unknown>>(
    `SELECT id::text, status, resultado, erro FROM erp.execucoes_automacao WHERE tenant_id = $1 AND chave_idempotencia = $2`,
    [input.tenantId, key],
  );
  if (existing[0]?.status === "concluida") return existing[0];
  const execution = await runQuery<Record<string, unknown>>(
    `INSERT INTO erp.execucoes_automacao
       (tenant_id, tipo, competencia, status, tentativas, chave_idempotencia, iniciado_em, criado_por, atualizado_por)
     VALUES ($1,$2,$3,'processando',1,$4,now(),$5,$5)
     ON CONFLICT (tenant_id, chave_idempotencia) DO UPDATE SET
       status = 'processando', tentativas = erp.execucoes_automacao.tentativas + 1,
       iniciado_em = now(), erro = NULL, atualizado_por = EXCLUDED.atualizado_por
     RETURNING id`,
    [input.tenantId, input.tipo, competence, key, input.actorId],
  );
  try {
    let result: unknown = { total: 0 };
    if (input.tipo === "contratos")
      result = await processDueSalesContracts({ ...input, until: competence });
    else if (input.tipo === "recorrencias_financeiras")
      result = await processErpFinancialRecurrences({
        ...input,
        throughDate: competence,
      });
    else if (input.tipo === "titulos_vencidos") {
      const updates = await runQuery<{ total: number }>(
        `WITH receber AS (
           UPDATE erp.contas_receber_parcelas SET status = 'vencido'
           WHERE tenant_id = $1 AND status IN ('aberto','parcial') AND data_vencimento < $2 AND excluido_em IS NULL RETURNING 1
         ), pagar AS (
           UPDATE erp.contas_pagar_parcelas SET status = 'vencido'
           WHERE tenant_id = $1 AND status IN ('aberto','parcial') AND data_vencimento < $2 AND excluido_em IS NULL RETURNING 1
         ) SELECT ((SELECT count(*) FROM receber) + (SELECT count(*) FROM pagar))::int AS total`,
        [input.tenantId, competence],
      );
      result = updates[0];
    } else if (input.tipo === "estoque_minimo") {
      const rows = await runQuery(
        `SELECT count(*)::int AS total FROM erp.vw_posicao_estoque WHERE tenant_id = $1 AND situacao = 'repor'`,
        [input.tenantId],
      );
      result = rows[0];
    } else {
      const rows = await runQuery(
        `SELECT count(*)::int AS total FROM erp.vendas WHERE tenant_id = $1 AND excluido_em IS NULL`,
        [input.tenantId],
      );
      result = rows[0];
    }
    const completed = await runQuery(
      `UPDATE erp.execucoes_automacao SET status = 'concluida', resultado = $3::jsonb, finalizado_em = now(), atualizado_por = $4
       WHERE tenant_id = $1 AND id = $2 RETURNING id::text, status, resultado`,
      [input.tenantId, execution[0].id, json(result), input.actorId],
    );
    return completed[0];
  } catch (error) {
    await runQuery(
      `UPDATE erp.execucoes_automacao SET status = 'falha', erro = $3, finalizado_em = now(), atualizado_por = $4
       WHERE tenant_id = $1 AND id = $2`,
      [
        input.tenantId,
        execution[0].id,
        error instanceof Error ? error.message : "Falha desconhecida",
        input.actorId,
      ],
    );
    throw error;
  }
}

export async function getProfessionalOverview(tenantId: number) {
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT
       COALESCE((SELECT sum(valor - valor_pago) FROM erp.contas_receber_parcelas WHERE tenant_id = $1 AND status IN ('aberto','parcial','vencido') AND excluido_em IS NULL),0) AS saldo_receber,
       COALESCE((SELECT sum(valor - valor_pago) FROM erp.contas_pagar_parcelas WHERE tenant_id = $1 AND status IN ('aberto','parcial','vencido') AND excluido_em IS NULL),0) AS saldo_pagar,
       COALESCE((SELECT sum(valor - valor_pago) FROM erp.contas_receber_parcelas WHERE tenant_id = $1 AND status = 'vencido' AND excluido_em IS NULL),0) AS receber_vencido,
       COALESCE((SELECT sum(valor - valor_pago) FROM erp.contas_pagar_parcelas WHERE tenant_id = $1 AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 AND status IN ('aberto','parcial') AND excluido_em IS NULL),0) AS pagar_proximos_7_dias,
       COALESCE((SELECT sum(total) FROM erp.vendas WHERE tenant_id = $1 AND data_venda >= date_trunc('month', CURRENT_DATE) AND status <> 'cancelada' AND tipo_documento = 'venda' AND excluido_em IS NULL),0) AS vendas_mes,
       COALESCE((SELECT sum(total) FROM erp.compras WHERE tenant_id = $1 AND data_compra >= date_trunc('month', CURRENT_DATE) AND status <> 'cancelada' AND excluido_em IS NULL),0) AS compras_mes,
       COALESCE((SELECT sum(total) FROM erp.vendas WHERE tenant_id = $1 AND data_venda >= date_trunc('month', CURRENT_DATE) - interval '1 month' AND data_venda < date_trunc('month', CURRENT_DATE) AND status <> 'cancelada' AND tipo_documento = 'venda' AND excluido_em IS NULL),0) AS vendas_mes_anterior,
       COALESCE((SELECT sum(total) FROM erp.compras WHERE tenant_id = $1 AND data_compra >= date_trunc('month', CURRENT_DATE) - interval '1 month' AND data_compra < date_trunc('month', CURRENT_DATE) AND status <> 'cancelada' AND excluido_em IS NULL),0) AS compras_mes_anterior,
       (COALESCE((SELECT sum(saldo_inicial) FROM erp.contas_financeiras WHERE tenant_id = $1 AND ativo AND excluido_em IS NULL),0)
         + COALESCE((SELECT sum(valor_liquido) FROM erp.pagamentos WHERE tenant_id = $1 AND tipo = 'receber' AND estornado_em IS NULL AND estorno_de_pagamento_id IS NULL AND excluido_em IS NULL),0)
         - COALESCE((SELECT sum(valor_liquido) FROM erp.pagamentos WHERE tenant_id = $1 AND tipo = 'pagar' AND estornado_em IS NULL AND estorno_de_pagamento_id IS NULL AND excluido_em IS NULL),0)) AS saldo_atual,
       COALESCE((SELECT sum(itens.total - (itens.custo_unitario * itens.quantidade)) FROM erp.vendas_itens itens JOIN erp.vendas vendas ON vendas.tenant_id = itens.tenant_id AND vendas.id = itens.venda_id WHERE itens.tenant_id = $1 AND vendas.data_venda >= date_trunc('month', CURRENT_DATE) AND vendas.status <> 'cancelada' AND itens.excluido_em IS NULL),0) AS margem_bruta_mes,
       (SELECT count(*) FROM erp.vw_posicao_estoque WHERE tenant_id = $1 AND situacao = 'repor')::int AS produtos_repor,
       (SELECT count(*) FROM erp.transacoes_bancarias WHERE tenant_id = $1 AND status = 'pendente' AND excluido_em IS NULL)::int AS conciliacoes_pendentes,
       (SELECT count(*) FROM erp.ordens_servico WHERE tenant_id = $1 AND status IN ('aprovada','em_execucao') AND excluido_em IS NULL)::int AS ordens_abertas`,
    [tenantId],
  );
  return rows[0] || {};
}

export async function listProfessionalReport(input: {
  tenantId: number;
  report: string;
  from?: string;
  to?: string;
}) {
  const from =
    input.from ||
    new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const to = input.to || new Date().toISOString().slice(0, 10);
  const reports: Record<string, string> = {
    "dre-competencia": `SELECT competencia, categoria, tipo, valor FROM erp.vw_dre_gerencial WHERE tenant_id = $1 AND competencia BETWEEN $2 AND $3 ORDER BY competencia, tipo, categoria`,
    "dre-caixa": `SELECT date_trunc('month', pagamentos.data_pagamento)::date AS competencia,
      COALESCE(categorias.nome, 'Sem categoria') AS categoria,
      CASE WHEN pagamentos.tipo = 'receber' THEN 'receita' ELSE 'despesa' END AS tipo,
      sum(CASE WHEN pagamentos.tipo = 'receber' THEN pagamentos.valor_liquido ELSE -pagamentos.valor_liquido END)::numeric(18,2) AS valor
      FROM erp.pagamentos
      LEFT JOIN erp.contas_receber_parcelas receber_parcelas ON receber_parcelas.tenant_id = pagamentos.tenant_id AND receber_parcelas.id = pagamentos.conta_receber_parcela_id
      LEFT JOIN erp.contas_receber receber ON receber.tenant_id = receber_parcelas.tenant_id AND receber.id = receber_parcelas.conta_receber_id
      LEFT JOIN erp.contas_pagar_parcelas pagar_parcelas ON pagar_parcelas.tenant_id = pagamentos.tenant_id AND pagar_parcelas.id = pagamentos.conta_pagar_parcela_id
      LEFT JOIN erp.contas_pagar pagar ON pagar.tenant_id = pagar_parcelas.tenant_id AND pagar.id = pagar_parcelas.conta_pagar_id
      LEFT JOIN erp.categorias categorias ON categorias.tenant_id = pagamentos.tenant_id AND categorias.id = COALESCE(receber.categoria_id, pagar.categoria_id)
      WHERE pagamentos.tenant_id = $1 AND pagamentos.data_pagamento BETWEEN $2 AND $3
        AND pagamentos.estornado_em IS NULL AND pagamentos.estorno_de_pagamento_id IS NULL AND pagamentos.excluido_em IS NULL
      GROUP BY 1, 2, 3 ORDER BY 1, 3, 2`,
    "fluxo-diario": `SELECT data, conta, entradas, saidas, saldo_dia AS saldo FROM erp.vw_fluxo_caixa_diario WHERE tenant_id = $1 AND data BETWEEN $2 AND $3 ORDER BY data, conta`,
    "fluxo-mensal": `SELECT date_trunc('month', data)::date AS competencia, sum(entradas)::numeric(18,2) AS entradas, sum(saidas)::numeric(18,2) AS saidas, sum(saldo_dia)::numeric(18,2) AS saldo FROM erp.vw_fluxo_caixa_diario WHERE tenant_id = $1 AND data BETWEEN $2 AND $3 GROUP BY 1 ORDER BY 1`,
    "posicao-financeira": `SELECT tipo, status, count(*)::int AS parcelas, sum(saldo)::numeric(18,2) AS saldo FROM (
      SELECT 'receber'::text AS tipo, status, greatest(valor - valor_pago, 0) AS saldo FROM erp.contas_receber_parcelas WHERE tenant_id = $1 AND data_vencimento BETWEEN $2 AND $3 AND excluido_em IS NULL
      UNION ALL SELECT 'pagar'::text, status, greatest(valor - valor_pago, 0) FROM erp.contas_pagar_parcelas WHERE tenant_id = $1 AND data_vencimento BETWEEN $2 AND $3 AND excluido_em IS NULL
      ) posicao GROUP BY tipo, status ORDER BY tipo, status`,
    "vendas-clientes": `SELECT entidades.nome AS cliente, count(*)::int AS vendas, sum(vendas.total)::numeric(18,2) AS total FROM erp.vendas JOIN erp.entidades ON entidades.tenant_id = vendas.tenant_id AND entidades.id = vendas.cliente_id WHERE vendas.tenant_id = $1 AND vendas.data_venda BETWEEN $2 AND $3 AND vendas.status <> 'cancelada' AND vendas.tipo_documento = 'venda' AND vendas.excluido_em IS NULL GROUP BY entidades.nome ORDER BY total DESC`,
    "vendas-vendedores": `SELECT COALESCE(vendedores.nome, 'Sem vendedor') AS vendedor, count(*)::int AS vendas, sum(vendas.total)::numeric(18,2) AS total FROM erp.vendas LEFT JOIN erp.entidades vendedores ON vendedores.tenant_id = vendas.tenant_id AND vendedores.id = vendas.vendedor_id WHERE vendas.tenant_id = $1 AND vendas.data_venda BETWEEN $2 AND $3 AND vendas.status <> 'cancelada' AND vendas.tipo_documento = 'venda' AND vendas.excluido_em IS NULL GROUP BY 1 ORDER BY total DESC`,
    "vendas-produtos": `SELECT itens.descricao AS produto, sum(itens.quantidade)::numeric(18,4) AS quantidade, sum(itens.total)::numeric(18,2) AS total FROM erp.vendas_itens itens JOIN erp.vendas vendas ON vendas.tenant_id = itens.tenant_id AND vendas.id = itens.venda_id WHERE itens.tenant_id = $1 AND vendas.data_venda BETWEEN $2 AND $3 AND vendas.status <> 'cancelada' AND vendas.tipo_documento = 'venda' AND itens.excluido_em IS NULL GROUP BY itens.descricao ORDER BY total DESC`,
    "compras-fornecedores": `SELECT entidades.nome AS fornecedor, count(*)::int AS compras, sum(compras.total)::numeric(18,2) AS total FROM erp.compras JOIN erp.entidades ON entidades.tenant_id = compras.tenant_id AND entidades.id = compras.fornecedor_id WHERE compras.tenant_id = $1 AND compras.data_compra BETWEEN $2 AND $3 AND compras.status <> 'cancelada' AND compras.excluido_em IS NULL GROUP BY entidades.nome ORDER BY total DESC`,
    "compras-categorias": `SELECT COALESCE(categorias.nome, 'Sem categoria') AS categoria, count(*)::int AS compras, sum(compras.total)::numeric(18,2) AS total FROM erp.compras LEFT JOIN erp.categorias ON categorias.tenant_id = compras.tenant_id AND categorias.id = compras.categoria_id WHERE compras.tenant_id = $1 AND compras.data_compra BETWEEN $2 AND $3 AND compras.status <> 'cancelada' AND compras.excluido_em IS NULL GROUP BY 1 ORDER BY total DESC`,
    "valor-estoque": `SELECT produto, sku, local_estoque AS local, quantidade_fisica, custo_medio, valor_estoque FROM erp.vw_posicao_estoque WHERE tenant_id = $1 ORDER BY valor_estoque DESC`,
  };
  const sql = reports[input.report];
  if (!sql)
    throw new ErpDomainError("UNKNOWN_REPORT", "Relatorio desconhecido.", 404);
  const parameters =
    input.report === "valor-estoque"
      ? [input.tenantId]
      : [input.tenantId, from, to];
  return runQuery<Record<string, unknown>>(sql, parameters);
}

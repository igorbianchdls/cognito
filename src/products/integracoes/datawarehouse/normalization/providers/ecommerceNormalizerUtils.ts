import type {
  NormalizationInput,
  NormalizationResult,
  NormalizedRow,
  NormalizedTableName,
} from '@/products/integracoes/datawarehouse/normalization/contracts'

type JsonRecord = Record<string, unknown>

const RESOURCE_TABLES: Record<string, NormalizedTableName> = {
  stores: 'ecommerce_stores',
  customers: 'ecommerce_customers',
  products: 'ecommerce_products',
  variants: 'ecommerce_variants',
  orders: 'ecommerce_orders',
  order_items: 'ecommerce_order_items',
  payments: 'ecommerce_payments',
  refunds: 'ecommerce_refunds',
  shipping: 'ecommerce_shipping',
  inventory: 'ecommerce_inventory',
  categories: 'ecommerce_categories',
  coupons: 'ecommerce_coupons',
  abandoned_checkouts: 'ecommerce_abandoned_checkouts',
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function unwrapPayload(row: JsonRecord): JsonRecord {
  const payload = row.raw_payload ?? row.rawPayload ?? row.payload ?? row.source_payload ?? row.raw
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload) as unknown
      return isRecord(parsed) ? unwrapPayload(parsed) : {}
    } catch {
      return {}
    }
  }
  if (!isRecord(payload)) return row
  return isRecord(payload.raw) ? payload.raw : payload
}

function nestedValue(row: JsonRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!isRecord(current)) return undefined
    return current[part]
  }, row)
}

function text(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = nestedValue(row, key)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (isRecord(value)) {
      const translated = value.pt ?? value.en ?? value.es ?? value.name ?? value.nome ?? value.value ?? value.id
      if (translated != null) return String(translated)
    }
  }
  return null
}

function numberValue(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = nestedValue(row, key)
    const parsed = typeof value === 'string'
      ? Number(value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, ''))
      : Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function timestampValue(row: JsonRecord, keys: string[]) {
  const value = text(row, keys)
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function firstRecord(value: unknown) {
  if (Array.isArray(value)) return value.find(isRecord)
  return isRecord(value) ? value : undefined
}

function externalId(row: JsonRecord, payload: JsonRecord, index: number) {
  return text(row, ['external_id', 'id'])
    || text(payload, ['id', 'admin_graphql_api_id', 'legacyResourceId', 'uuid', 'code', 'number', 'order_number', 'token', 'resource_uri'])
    || `ecommerce_${index + 1}`
}

function base(input: NormalizationInput, row: JsonRecord, payload: JsonRecord, index: number) {
  return {
    tenant_id: input.tenantId,
    connection_id: input.connectionId,
    provider: input.provider,
    resource: input.resource,
    external_id: externalId(row, payload, index),
    source_run_id: input.runId || null,
    source_table: input.sourceTable,
    synced_at: new Date().toISOString(),
    normalized_at: new Date().toISOString(),
    source_payload: payload,
  }
}

function storeFields(payload: JsonRecord) {
  return {
    loja_id: text(payload, ['id', 'store_id', 'myshopify_domain', 'domain', 'resource_uri']),
    nome: text(payload, ['name', 'nome', 'shop.name']),
    dominio: text(payload, ['domain', 'myshopify_domain', 'url', 'store_url']),
    email: text(payload, ['email', 'customer_email']),
    currency: text(payload, ['currency', 'currency_code', 'money_format']),
    timezone: text(payload, ['timezone', 'iana_timezone', 'timezone_name']),
    status: text(payload, ['status', 'state']),
  }
}

function customerFields(payload: JsonRecord) {
  const billing = firstRecord(payload.billing_address) || firstRecord(payload.addresses) || {}
  return {
    cliente_id: text(payload, ['id', 'customer.id', 'cliente.id']),
    nome: text(payload, ['name', 'nome', 'first_name', 'customer.name']) || [text(payload, ['first_name']), text(payload, ['last_name'])].filter(Boolean).join(' ') || null,
    email: text(payload, ['email', 'customer.email']),
    telefone: text(payload, ['phone', 'telefone', 'customer.phone']),
    documento: text(payload, ['document', 'cpf', 'cnpj', 'customer.document']),
    cidade: text(billing, ['city', 'cidade']),
    uf: text(billing, ['province_code', 'province', 'state', 'uf']),
    total_pedidos: numberValue(payload, ['orders_count', 'total_orders']),
    valor_total_gasto: numberValue(payload, ['total_spent', 'total_gasto']),
    status: text(payload, ['status', 'state']),
    criado_em: timestampValue(payload, ['created_at', 'createdAt']),
    atualizado_em: timestampValue(payload, ['updated_at', 'updatedAt']),
  }
}

function productFields(payload: JsonRecord) {
  const category = firstRecord(payload.categories) || {}
  return {
    produto_id: text(payload, ['product_id', 'id', 'produto_id']),
    nome: text(payload, ['title', 'name', 'nome']),
    sku: text(payload, ['sku', 'variants.0.sku']),
    descricao: text(payload, ['body_html', 'description', 'descricao']),
    categoria_id: text(payload, ['category_id', 'categoria_id']) || text(category, ['id']),
    categoria_nome: text(payload, ['category_name', 'categoria_nome']) || text(category, ['name', 'nome']),
    preco: numberValue(payload, ['price', 'preco', 'variants.0.price']),
    preco_promocional: numberValue(payload, ['promotional_price', 'compare_at_price', 'preco_promocional']),
    custo: numberValue(payload, ['cost', 'custo']),
    estoque: numberValue(payload, ['stock', 'inventory_quantity', 'estoque', 'variants.0.inventory_quantity']),
    status: text(payload, ['status', 'published', 'ativo']),
    url: text(payload, ['url', 'handle', 'permalink']),
    criado_em: timestampValue(payload, ['created_at', 'createdAt']),
    atualizado_em: timestampValue(payload, ['updated_at', 'updatedAt']),
  }
}

function variantFields(payload: JsonRecord) {
  return {
    variante_id: text(payload, ['variant_id', 'id', 'variante_id']),
    produto_id: text(payload, ['product_id', 'produto_id']),
    nome: text(payload, ['title', 'name', 'nome']),
    sku: text(payload, ['sku']),
    preco: numberValue(payload, ['price', 'preco']),
    preco_promocional: numberValue(payload, ['promotional_price', 'compare_at_price', 'preco_promocional']),
    custo: numberValue(payload, ['cost', 'custo']),
    estoque: numberValue(payload, ['stock', 'inventory_quantity', 'estoque']),
    peso: numberValue(payload, ['weight', 'peso']),
    status: text(payload, ['status', 'published', 'ativo']),
    criado_em: timestampValue(payload, ['created_at', 'createdAt']),
    atualizado_em: timestampValue(payload, ['updated_at', 'updatedAt']),
  }
}

function orderFields(payload: JsonRecord) {
  const customer = firstRecord(payload.customer) || firstRecord(payload.cliente) || {}
  return {
    pedido_id: text(payload, ['order_id', 'id', 'pedido_id']),
    numero: text(payload, ['number', 'order_number', 'name', 'numero']),
    cliente_id: text(payload, ['customer_id', 'cliente_id']) || text(customer, ['id']),
    cliente_nome: text(payload, ['customer.name', 'cliente.nome']) || text(customer, ['name', 'nome']),
    cliente_email: text(payload, ['email', 'customer.email', 'cliente.email']) || text(customer, ['email']),
    status: text(payload, ['status', 'financial_status', 'estado']),
    status_pagamento: text(payload, ['financial_status', 'payment_status', 'status_pagamento']),
    status_fulfillment: text(payload, ['fulfillment_status', 'shipping_status', 'status_entrega']),
    currency: text(payload, ['currency', 'currency_code']),
    subtotal: numberValue(payload, ['subtotal_price', 'subtotal']),
    desconto: numberValue(payload, ['total_discounts', 'discount', 'desconto']),
    frete: numberValue(payload, ['total_shipping_price_set.shop_money.amount', 'shipping_cost', 'frete']),
    impostos: numberValue(payload, ['total_tax', 'taxes', 'impostos']),
    valor_total: numberValue(payload, ['total_price', 'total', 'valor_total']),
    data_pedido: timestampValue(payload, ['created_at', 'createdAt', 'data_pedido']),
    atualizado_em: timestampValue(payload, ['updated_at', 'updatedAt']),
  }
}

function orderItemFields(payload: JsonRecord) {
  return {
    pedido_id: text(payload, ['order_id', 'pedido_id']),
    item_id: text(payload, ['id', 'item_id']),
    produto_id: text(payload, ['product_id', 'produto_id']),
    variante_id: text(payload, ['variant_id', 'variante_id']),
    nome: text(payload, ['title', 'name', 'nome']),
    sku: text(payload, ['sku']),
    quantidade: numberValue(payload, ['quantity', 'quantidade']),
    valor_unitario: numberValue(payload, ['price', 'preco', 'valor_unitario']),
    desconto: numberValue(payload, ['total_discount', 'discount', 'desconto']),
    valor_total: numberValue(payload, ['total', 'valor_total']) ?? ((numberValue(payload, ['price', 'preco']) || 0) * (numberValue(payload, ['quantity', 'quantidade']) || 0)),
  }
}

function paymentFields(payload: JsonRecord) {
  return {
    pagamento_id: text(payload, ['id', 'transaction_id', 'pagamento_id']),
    pedido_id: text(payload, ['order_id', 'pedido_id', 'id']),
    metodo: text(payload, ['gateway', 'payment_method', 'metodo_pagamento']),
    gateway: text(payload, ['gateway', 'payment_gateway']),
    status: text(payload, ['status', 'financial_status', 'payment_status']),
    valor: numberValue(payload, ['amount', 'total_price', 'total', 'valor_total']),
    currency: text(payload, ['currency', 'currency_code']),
    data_pagamento: timestampValue(payload, ['processed_at', 'paid_at', 'created_at', 'data_pagamento']),
  }
}

function refundFields(payload: JsonRecord) {
  return {
    reembolso_id: text(payload, ['id', 'refund_id', 'reembolso_id']),
    pedido_id: text(payload, ['order_id', 'pedido_id']),
    status: text(payload, ['status']),
    valor: numberValue(payload, ['amount', 'total', 'valor']),
    motivo: text(payload, ['reason', 'motivo']),
    data_reembolso: timestampValue(payload, ['created_at', 'processed_at', 'data_reembolso']),
  }
}

function shippingFields(payload: JsonRecord) {
  return {
    frete_id: text(payload, ['id', 'shipment_id', 'fulfillment_id', 'frete_id']),
    pedido_id: text(payload, ['order_id', 'pedido_id']),
    transportadora: text(payload, ['tracking_company', 'carrier', 'transportadora']),
    servico: text(payload, ['service', 'shipping_method', 'servico']),
    codigo_rastreio: text(payload, ['tracking_number', 'tracking_code', 'codigo_rastreio']),
    status: text(payload, ['status', 'shipment_status', 'fulfillment_status']),
    valor: numberValue(payload, ['price', 'cost', 'valor']),
    enviado_em: timestampValue(payload, ['created_at', 'shipped_at', 'enviado_em']),
    entregue_em: timestampValue(payload, ['delivered_at', 'entregue_em']),
  }
}

function inventoryFields(payload: JsonRecord) {
  return {
    produto_id: text(payload, ['product_id', 'produto_id', 'id']),
    variante_id: text(payload, ['variant_id', 'variante_id']),
    sku: text(payload, ['sku']),
    local_id: text(payload, ['location_id', 'local_id']),
    local_nome: text(payload, ['location_name', 'local_nome']),
    quantidade: numberValue(payload, ['available', 'quantity', 'stock', 'inventory_quantity', 'estoque']),
    atualizado_em: timestampValue(payload, ['updated_at', 'updatedAt']),
  }
}

function categoryFields(payload: JsonRecord) {
  return {
    categoria_id: text(payload, ['id', 'category_id', 'categoria_id']),
    categoria_pai_id: text(payload, ['parent', 'parent_id', 'categoria_pai_id']),
    nome: text(payload, ['name', 'nome', 'title']),
    descricao: text(payload, ['description', 'descricao']),
    url: text(payload, ['handle', 'url']),
    status: text(payload, ['status', 'published', 'ativo']),
  }
}

function couponFields(payload: JsonRecord) {
  return {
    cupom_id: text(payload, ['id', 'coupon_id', 'price_rule_id']),
    codigo: text(payload, ['code', 'codigo']),
    tipo: text(payload, ['type', 'value_type', 'tipo']),
    valor: numberValue(payload, ['value', 'amount', 'valor']),
    status: text(payload, ['status', 'active', 'ativo']),
    inicio_em: timestampValue(payload, ['starts_at', 'inicio_em']),
    fim_em: timestampValue(payload, ['ends_at', 'fim_em']),
  }
}

function checkoutFields(payload: JsonRecord) {
  return {
    checkout_id: text(payload, ['id', 'token', 'checkout_id']),
    cliente_id: text(payload, ['customer_id', 'cliente_id']),
    cliente_email: text(payload, ['email', 'customer.email']),
    status: text(payload, ['status', 'state']),
    currency: text(payload, ['currency', 'currency_code']),
    valor_total: numberValue(payload, ['total_price', 'total', 'valor_total']),
    data_abandono: timestampValue(payload, ['created_at', 'updated_at']),
    url_recuperacao: text(payload, ['abandoned_checkout_url', 'recovery_url', 'url_recuperacao']),
  }
}

function fieldsFor(table: NormalizedTableName, payload: JsonRecord) {
  if (table === 'ecommerce_stores') return storeFields(payload)
  if (table === 'ecommerce_customers') return customerFields(payload)
  if (table === 'ecommerce_products') return productFields(payload)
  if (table === 'ecommerce_variants') return variantFields(payload)
  if (table === 'ecommerce_orders') return orderFields(payload)
  if (table === 'ecommerce_order_items') return orderItemFields(payload)
  if (table === 'ecommerce_payments') return paymentFields(payload)
  if (table === 'ecommerce_refunds') return refundFields(payload)
  if (table === 'ecommerce_shipping') return shippingFields(payload)
  if (table === 'ecommerce_inventory') return inventoryFields(payload)
  if (table === 'ecommerce_categories') return categoryFields(payload)
  if (table === 'ecommerce_coupons') return couponFields(payload)
  return checkoutFields(payload)
}

export function normalizeEcommerceRows(input: NormalizationInput): NormalizationResult {
  const table = RESOURCE_TABLES[input.resource]
  if (!table) {
    return {
      provider: input.provider,
      resource: input.resource,
      status: 'skipped',
      rows: [],
      skippedRows: input.rows.length,
      message: `Recurso ecommerce ${input.resource} nao possui tabela normalized v1.`,
    }
  }

  const rows: NormalizedRow[] = input.rows.map((row, index) => {
    const payload = unwrapPayload(row)
    const id = externalId(row, payload, index)
    return {
      table,
      insertId: `${input.connectionId}:${input.provider}:${input.resource}:${id}`,
      data: {
        ...base(input, row, payload, index),
        ...fieldsFor(table, payload),
      },
    }
  })

  return {
    provider: input.provider,
    resource: input.resource,
    status: 'normalized',
    tables: [table],
    rows,
    skippedRows: 0,
  }
}

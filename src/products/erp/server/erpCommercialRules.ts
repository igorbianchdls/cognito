import type { SQLClient } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'

// Regras comerciais da Fase 1: tabela de preço, limite de crédito/bloqueio, transporte e comissões.
// Sem dependência de erpRepository (que importa este módulo).

type Query = Pick<SQLClient, 'query'>
const optionalId = (value: unknown) => { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : null }

// ---------------------------------------------------------------- tabela de preço

// Tabela da venda: a informada, senão a do cliente, senão a padrão da empresa; só ativa e vigente na data.
export async function resolvePriceTable(client: Query, tenantId: number, customerId: number, explicit: unknown, saleDate: string) {
  const requested = optionalId(explicit)
  const result = await client.query(
    `SELECT t.id FROM erp.tabelas_preco t
     WHERE t.empresa_id = $1 AND t.ativo AND t.excluido_em IS NULL
       AND $4::date BETWEEN coalesce(t.vigencia_inicio, '-infinity'::date) AND coalesce(t.vigencia_fim, 'infinity'::date)
       AND (t.id = $3 OR ($3::bigint IS NULL AND (t.id = (SELECT e.tabela_preco_id FROM erp.entidades e WHERE e.empresa_id = $1 AND e.id = $2) OR t.padrao)))
     ORDER BY (t.id = $3) DESC, (t.id = (SELECT e.tabela_preco_id FROM erp.entidades e WHERE e.empresa_id = $1 AND e.id = $2)) DESC, t.padrao DESC
     LIMIT 1`,
    [tenantId, customerId, requested, saleDate],
  )
  if (requested && !result.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Tabela de preço inativa, fora da vigência ou de outra empresa.')
  return result.rows[0] ? Number(result.rows[0].id) : null
}

export type TablePrice = { preco: number; precoMinimo: number | null; descontoMaximo: number | null }
// Preço da faixa de quantidade aplicável (maior quantidade mínima até a quantidade vendida).
export async function tablePrice(client: Query, tenantId: number, tableId: number | null, kind: 'produto' | 'servico', itemId: number, quantity: number): Promise<TablePrice | null> {
  if (!tableId) return null
  const column = kind === 'servico' ? 'servico_id' : 'produto_id'
  const result = await client.query(
    `SELECT preco, preco_minimo, desconto_maximo_percentual FROM erp.tabelas_preco_itens
     WHERE empresa_id = $1 AND tabela_preco_id = $2 AND ${column} = $3 AND excluido_em IS NULL AND quantidade_minima <= $4
     ORDER BY quantidade_minima DESC LIMIT 1`,
    [tenantId, tableId, itemId, quantity],
  )
  const row = result.rows[0]
  if (!row) return null
  return {
    preco: Number(row.preco),
    precoMinimo: row.preco_minimo === null ? null : Number(row.preco_minimo),
    descontoMaximo: row.desconto_maximo_percentual === null ? null : Number(row.desconto_maximo_percentual),
  }
}

// Preço líquido por unidade (após o desconto do item) contra o mínimo e o desconto máximo da tabela.
export function assertTablePriceRules(position: number, price: TablePrice | null, quantity: number, gross: number, discount: number) {
  if (!price) return
  const netUnit = (gross - discount) / quantity
  if (price.precoMinimo !== null && netUnit + 1e-9 < price.precoMinimo) {
    throw new ErpDomainError('VALIDATION_ERROR', `Item ${position}: preço líquido abaixo do mínimo da tabela (${price.precoMinimo.toFixed(2)}).`)
  }
  if (price.descontoMaximo !== null && price.preco > 0) {
    const percent = (1 - netUnit / price.preco) * 100
    if (percent > price.descontoMaximo + 1e-6) {
      throw new ErpDomainError('VALIDATION_ERROR', `Item ${position}: desconto de ${percent.toFixed(2)}% acima do máximo da tabela (${price.descontoMaximo}%).`)
    }
  }
}

// ---------------------------------------------------------------- transporte

const freightModes = ['emitente', 'destinatario', 'terceiros', 'proprio_remetente', 'proprio_destinatario', 'sem_frete'] as const
export async function saleTransport(client: Query, tenantId: number, values: Record<string, unknown>) {
  const carrierId = optionalId(values.transportadora_id)
  if (carrierId) {
    const carrier = await client.query(
      `SELECT id FROM erp.entidades WHERE empresa_id = $1 AND id = $2 AND eh_transportadora AND ativo AND excluido_em IS NULL`,
      [tenantId, carrierId],
    )
    if (!carrier.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Transportadora não encontrada ou não marcada como transportadora.')
  }
  const mode = values.modalidade_frete === undefined || values.modalidade_frete === null || values.modalidade_frete === '' ? null : String(values.modalidade_frete)
  if (mode && !freightModes.includes(mode as typeof freightModes[number])) throw new ErpDomainError('VALIDATION_ERROR', 'Modalidade de frete inválida.')
  const nonNegative = (value: unknown, label: string, integer = false) => {
    if (value === undefined || value === null || value === '') return null
    const n = Number(value)
    if (!Number.isFinite(n) || n < 0 || (integer && !Number.isInteger(n))) throw new ErpDomainError('VALIDATION_ERROR', `${label} inválido.`)
    return n
  }
  return {
    transportadoraId: carrierId,
    modalidadeFrete: mode,
    volumes: nonNegative(values.volumes, 'Número de volumes', true),
    especieVolumes: typeof values.especie_volumes === 'string' && values.especie_volumes.trim() ? values.especie_volumes.trim().slice(0, 60) : null,
    pesoBruto: nonNegative(values.peso_bruto, 'Peso bruto'),
    pesoLiquido: nonNegative(values.peso_liquido, 'Peso líquido'),
  }
}

// ---------------------------------------------------------------- crédito

export type CreditOverride = { motivo: string }
// Bloqueio comercial impede a confirmação. Acima do limite, só confirma quem tem erp.financeiro.gerenciar e
// informa o motivo; a liberação fica registrada na venda.
export async function assertCustomerCredit(client: Query, input: {
  tenantId: number; actorId: number; saleId: number; customerId: number; saleTotal: number; override?: CreditOverride | null
}) {
  const customer = (await client.query(
    `SELECT nome, limite_credito, bloqueio_comercial, bloqueio_motivo FROM erp.entidades WHERE empresa_id = $1 AND id = $2`,
    [input.tenantId, input.customerId],
  )).rows[0]
  if (!customer) return
  if (customer.bloqueio_comercial) {
    throw new ErpDomainError('CUSTOMER_BLOCKED', `Cliente bloqueado para vendas: ${String(customer.bloqueio_motivo || 'sem motivo informado')}.`, 409)
  }
  if (customer.limite_credito === null || customer.limite_credito === undefined) return
  const open = (await client.query(
    `SELECT coalesce(sum(p.valor - p.valor_pago), 0) AS aberto
     FROM erp.contas_receber_parcelas p
     JOIN erp.contas_receber c ON c.empresa_id = p.empresa_id AND c.id = p.conta_receber_id
     WHERE p.empresa_id = $1 AND c.cliente_id = $2 AND p.excluido_em IS NULL AND c.excluido_em IS NULL
       AND p.status IN ('aberto', 'parcial', 'vencido') AND c.status <> 'cancelado'`,
    [input.tenantId, input.customerId],
  )).rows[0]
  const limit = Number(customer.limite_credito), outstanding = Number(open?.aberto || 0)
  const exposure = Number((outstanding + input.saleTotal).toFixed(2))
  if (exposure <= limit) return
  const motivo = input.override?.motivo?.trim()
  const details = { limite: limit, em_aberto: outstanding, venda: input.saleTotal, excedente: Number((exposure - limit).toFixed(2)) }
  if (!motivo) {
    throw new ErpDomainError('CREDIT_LIMIT_EXCEEDED',
      `Limite de crédito excedido em ${details.excedente.toFixed(2)} (limite ${limit.toFixed(2)}, em aberto ${outstanding.toFixed(2)}, venda ${input.saleTotal.toFixed(2)}). Quem gerencia o financeiro pode liberar informando o motivo.`,
      409, details)
  }
  // A capacidade vai como parâmetro: a consulta não toca tabelas do schema erp.
  const allowed = (await client.query('SELECT shared.has_erp_capability($1::bigint, $2::text) AS ok', [input.tenantId, 'erp.financeiro.gerenciar'])).rows[0]
  if (!allowed?.ok) throw new ErpDomainError('ACCESS_DENIED', 'Somente quem gerencia o financeiro pode liberar venda acima do limite de crédito.', 403, details)
  await client.query(
    `UPDATE erp.vendas SET credito_liberado_por = $3, credito_liberado_em = now(), credito_liberado_motivo = $4
     WHERE empresa_id = $1 AND id = $2`,
    [input.tenantId, input.saleId, input.actorId, motivo.slice(0, 500)],
  )
}

// ---------------------------------------------------------------- comissões

// Gera uma comissão por item da venda confirmada, pela regra mais específica (vendedor > item > categoria),
// sobre o valor do item proporcional ao desconto do cabeçalho (o frete não comissiona). Idempotente.
export async function generateSaleCommissions(client: Query, tenantId: number, saleId: number, actorId: number) {
  const result = await client.query(
    `INSERT INTO erp.comissoes_lancamentos (empresa_id, venda_id, venda_item_id, vendedor_id, regra_id, base, valor_base, percentual, valor, competencia, criado_por, atualizado_por)
     SELECT v.empresa_id, v.id, i.id, v.vendedor_id, r.id, r.base, base.valor, r.percentual, round(base.valor * r.percentual / 100, 2),
       coalesce(v.data_competencia, v.data_venda), $3, $3
     FROM erp.vendas v
     JOIN erp.vendas_itens i ON i.empresa_id = v.empresa_id AND i.venda_id = v.id AND i.excluido_em IS NULL
     LEFT JOIN erp.produtos pr ON pr.empresa_id = i.empresa_id AND pr.id = i.produto_id
     LEFT JOIN erp.servicos sv ON sv.empresa_id = i.empresa_id AND sv.id = i.servico_id
     CROSS JOIN LATERAL (SELECT round(i.total * CASE WHEN v.subtotal > 0 THEN greatest(v.total - v.frete, 0) / v.subtotal ELSE 0 END, 2) AS valor) base
     CROSS JOIN LATERAL (
       SELECT r.* FROM erp.comissoes_regras r
       WHERE r.empresa_id = v.empresa_id AND r.ativo AND r.excluido_em IS NULL
         AND (r.vendedor_id IS NULL OR r.vendedor_id = v.vendedor_id)
         AND (r.produto_id IS NULL OR r.produto_id = i.produto_id)
         AND (r.servico_id IS NULL OR r.servico_id = i.servico_id)
         AND (r.categoria_id IS NULL OR r.categoria_id = coalesce(pr.categoria_id, sv.categoria_id))
         AND v.data_venda BETWEEN coalesce(r.vigencia_inicio, '-infinity'::date) AND coalesce(r.vigencia_fim, 'infinity'::date)
       ORDER BY (r.vendedor_id IS NOT NULL)::int * 4 + (r.produto_id IS NOT NULL OR r.servico_id IS NOT NULL)::int * 2 + (r.categoria_id IS NOT NULL)::int DESC, r.id DESC
       LIMIT 1
     ) r
     WHERE v.empresa_id = $1 AND v.id = $2 AND v.vendedor_id IS NOT NULL AND base.valor > 0
     ON CONFLICT (empresa_id, venda_item_id) WHERE status = 'ativa' DO NOTHING`,
    [tenantId, saleId, actorId],
  )
  return result.rows.length
}

export async function cancelSaleCommissions(client: Query, tenantId: number, saleId: number, actorId: number) {
  await client.query(
    `UPDATE erp.comissoes_lancamentos SET status = 'cancelada', cancelado_em = now(), atualizado_por = $3
     WHERE empresa_id = $1 AND venda_id = $2 AND status = 'ativa'`,
    [tenantId, saleId, actorId],
  )
}

// ---------------------------------------------------------------- condições comerciais do cliente

const commercialKeys = ['limite_credito', 'bloqueio_comercial', 'bloqueio_motivo', 'tabela_preco_id'] as const
// Grava só as chaves informadas: limite de crédito (vazio = sem limite), bloqueio com motivo e tabela de preço.
export async function saveCustomerCommercialTerms(client: Query, tenantId: number, customerId: number, actorId: number, values: Record<string, unknown>) {
  if (!commercialKeys.some(key => key in values)) return
  const sets: string[] = [], params: unknown[] = [tenantId, customerId, actorId]
  const set = (column: string, value: unknown) => { params.push(value); sets.push(`${column} = $${params.length}`) }
  if ('limite_credito' in values) {
    const raw = values.limite_credito
    const limit = raw === null || raw === '' || raw === undefined ? null : Number(raw)
    if (limit !== null && (!Number.isFinite(limit) || limit < 0)) throw new ErpDomainError('VALIDATION_ERROR', 'Limite de crédito inválido.')
    set('limite_credito', limit === null ? null : Number(limit.toFixed(2)))
  }
  if ('bloqueio_comercial' in values) {
    const blocked = values.bloqueio_comercial === true || values.bloqueio_comercial === 'sim' || values.bloqueio_comercial === 'true'
    const reason = typeof values.bloqueio_motivo === 'string' ? values.bloqueio_motivo.trim() : ''
    if (blocked && !reason) throw new ErpDomainError('VALIDATION_ERROR', 'Informe o motivo do bloqueio comercial.')
    set('bloqueio_comercial', blocked); set('bloqueio_motivo', blocked ? reason.slice(0, 500) : null)
  } else if ('bloqueio_motivo' in values) set('bloqueio_motivo', typeof values.bloqueio_motivo === 'string' ? values.bloqueio_motivo.trim().slice(0, 500) || null : null)
  if ('tabela_preco_id' in values) {
    const tableId = optionalId(values.tabela_preco_id)
    if (tableId) {
      const table = await client.query('SELECT id FROM erp.tabelas_preco WHERE empresa_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL', [tenantId, tableId])
      if (!table.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Tabela de preço não encontrada nesta empresa.')
    }
    set('tabela_preco_id', tableId)
  }
  await client.query(`UPDATE erp.entidades SET ${sets.join(', ')}, atualizado_por = $3 WHERE empresa_id = $1 AND id = $2 AND eh_cliente`, params)
}

// ---------------------------------------------------------------- permissões do vendedor (1.7)

// Regras do vínculo do usuário da sessão (vendedor, escopo e desconto máximo). Sem contexto de empresa
// (rotinas internas) não há regras.
export type SellerRules = { vendedorId: number | null; restrito: boolean; descontoMaximo: number | null }
export async function sellerRules(client: Query): Promise<SellerRules | null> {
  const row = (await client.query('SELECT vendedor_id, escopo_vendas, desconto_maximo_percentual FROM shared.erp_regras_vendedor()')).rows[0]
  if (!row) return null
  return { vendedorId: optionalId(row.vendedor_id), restrito: row.escopo_vendas === 'proprias',
    descontoMaximo: row.desconto_maximo_percentual == null ? null : Number(row.desconto_maximo_percentual) }
}

// Vendedor da venda: usuário restrito vende sempre como ele mesmo; os demais podem escolher, e sem escolha
// a venda fica com o vendedor vinculado ao usuário (se houver).
export function saleSeller(rules: SellerRules | null, requested: unknown) {
  if (rules?.restrito) return rules.vendedorId
  return optionalId(requested) ?? rules?.vendedorId ?? null
}

// Desconto total (itens + venda) sobre o valor bruto não pode passar do máximo do usuário.
export function assertDiscountLimit(rules: SellerRules | null, gross: number, discount: number) {
  if (rules?.descontoMaximo == null || gross <= 0 || discount <= 0) return
  const percent = Math.round(discount / gross * 10000) / 100
  if (percent > rules.descontoMaximo)
    throw new ErpDomainError('DISCOUNT_LIMIT_EXCEEDED',
      `Desconto de ${percent.toFixed(2)}% acima do máximo permitido para você (${rules.descontoMaximo.toFixed(2)}%).`, 403,
      { desconto_percentual: percent, desconto_maximo_percentual: rules.descontoMaximo })
}

import { runWithErpTransactionClient, type SQLClient } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { createManualFinancialTitle } from './erpCrudRepository'

// Cartão pelo modelo da "conta da maquininha" (Fase 2C, como Omie e Conta Azul):
// 1. o recebimento no cartão quita o título pelo valor bruto, com entrada na conta da maquininha;
// 2. a taxa da adquirente vira uma conta a pagar já paga pela maquininha (despesa na categoria configurada);
// 3. o líquido chega ao banco por repasses: transferências pendentes maquininha → banco na data prevista, que a
//    conciliação confirma quando o crédito aparece no extrato.
export type CardConfig = {
  metodo_id: number; nome: string; taxa_percentual: number; taxa_fixa: number; prazo_repasse_dias: number
  repasse: 'unico' | 'parcelado'; conta_maquininha_id: number; conta_destino_id: number; categoria_taxa_id: number; adquirente_id: number
}

export async function cardMethodConfig(client: Pick<SQLClient, 'query'>, tenantId: number, methodId: number | null): Promise<CardConfig | null> {
  if (!methodId) return null
  const result = await client.query(
    `SELECT id, nome, taxa_percentual, taxa_fixa, prazo_repasse_dias, repasse, conta_maquininha_id, conta_destino_id, categoria_taxa_id, adquirente_id
     FROM erp.metodos_pagamento WHERE empresa_id = $1 AND id = $2 AND conta_maquininha_id IS NOT NULL AND excluido_em IS NULL`, [tenantId, methodId])
  const row = result.rows[0]
  if (!row) return null
  return {
    metodo_id: Number(row.id), nome: String(row.nome), taxa_percentual: Number(row.taxa_percentual), taxa_fixa: Number(row.taxa_fixa),
    prazo_repasse_dias: Number(row.prazo_repasse_dias), repasse: row.repasse === 'parcelado' ? 'parcelado' : 'unico',
    conta_maquininha_id: Number(row.conta_maquininha_id), conta_destino_id: Number(row.conta_destino_id),
    categoria_taxa_id: Number(row.categoria_taxa_id), adquirente_id: Number(row.adquirente_id),
  }
}

const addDays = (date: string, days: number) => {
  const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}
const cents = (value: number) => Math.round(value * 100)

export async function applyCardReceipt(client: SQLClient, input: {
  tenantId: number; actorId: number; paymentId: number; gross: number; date: string; installments?: unknown; config: CardConfig
  settlePayable: (args: { tenantId: number; actorId: number; id: string; idempotencyKey: string; values: Record<string, unknown> }) => Promise<unknown>
}) {
  const { config } = input
  const fee = Math.round((input.gross * config.taxa_percentual / 100 + config.taxa_fixa) * 100) / 100
  if (fee >= input.gross) throw new ErpDomainError('VALIDATION_ERROR', 'A taxa do cartão não pode ser maior que o recebimento.', 422)
  return runWithErpTransactionClient(client, async () => {
    // Taxa: conta a pagar à adquirente, paga pela própria maquininha na data do recebimento.
    if (fee > 0) {
      const key = `cartao:${input.paymentId}:taxa`
      const titleId = Number(await createManualFinancialTitle(client, input.tenantId, input.actorId, 'pagar', {
        fornecedor_id: config.adquirente_id, descricao: `Taxa de cartão (${config.nome})`, numero_documento: `CARTAO-${input.paymentId}`,
        valor_total: fee, data_competencia: input.date, data_emissao: input.date, categoria_id: config.categoria_taxa_id,
        conta_financeira_id: config.conta_maquininha_id, observacoes: `Taxa do recebimento ${input.paymentId}.`,
        parcelas: [{ data_vencimento: input.date, valor: fee }],
      }, key, 'api'))
      const parcel = await client.query('SELECT id FROM erp.contas_pagar_parcelas WHERE empresa_id = $1 AND conta_pagar_id = $2 ORDER BY numero_parcela LIMIT 1', [input.tenantId, titleId])
      await input.settlePayable({ tenantId: input.tenantId, actorId: input.actorId, id: String(parcel.rows[0].id), idempotencyKey: `${key}:baixa`,
        values: { valor: fee, data_pagamento: input.date, conta_financeira_id: config.conta_maquininha_id, origem: 'manual' } })
    }
    // Repasses: um só (antecipação) ou um por parcela do cartão, a cada 30 dias.
    const net = cents(input.gross - fee)
    const count = config.repasse === 'parcelado' ? Math.min(24, Math.max(1, Math.floor(Number(input.installments) || 1))) : 1
    const transfers = []
    for (let index = 0; index < count; index++) {
      const value = index === count - 1 ? net - Math.floor(net / count) * (count - 1) : Math.floor(net / count)
      const date = addDays(input.date, config.prazo_repasse_dias + 30 * index)
      const result = await client.query(
        `INSERT INTO erp.transferencias_financeiras (empresa_id, conta_origem_id, conta_destino_id, data_transferencia, valor, descricao, status,
           pagamento_origem_id, chave_idempotencia, criado_por, atualizado_por, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, 'pendente', $7, $8, $9, $9, $10::jsonb) RETURNING id::text, data_transferencia::text AS data, valor`,
        [input.tenantId, config.conta_maquininha_id, config.conta_destino_id, date, value / 100,
          `Repasse do cartão (${config.nome})${count > 1 ? ` ${index + 1}/${count}` : ''}`, input.paymentId,
          `cartao:${input.paymentId}:repasse:${index + 1}`, input.actorId, JSON.stringify({ repasse_cartao: true, parcela: index + 1, parcelas: count })])
      transfers.push(result.rows[0])
    }
    return { taxa: fee, liquido: net / 100, repasses: transfers }
  })
}

// Estorno de um recebimento no cartão: cancela os repasses ainda pendentes e estorna/cancela a taxa.
export async function cancelCardReceipt(client: SQLClient, input: {
  tenantId: number; actorId: number; paymentId: number
  reversePayment: (args: { tenantId: number; actorId: number; id: string; idempotencyKey: string; reason: string }) => Promise<unknown>
}) {
  const transfers = await client.query(
    `SELECT id, status FROM erp.transferencias_financeiras WHERE empresa_id = $1 AND pagamento_origem_id = $2 AND excluido_em IS NULL FOR UPDATE`,
    [input.tenantId, input.paymentId])
  if (!transfers.rows.length) return null
  if (transfers.rows.some(row => row.status === 'concluida'))
    throw new ErpDomainError('INVALID_STATE', 'Este recebimento no cartão já teve repasse conciliado com o banco. Desfaça a conciliação do repasse antes de estornar.', 409)
  await client.query(`UPDATE erp.transferencias_financeiras SET status = 'cancelada', atualizado_por = $3 WHERE empresa_id = $1 AND pagamento_origem_id = $2 AND status = 'pendente'`,
    [input.tenantId, input.paymentId, input.actorId])
  const fee = await client.query(
    `SELECT p.id::text AS pagamento_id, c.id AS conta_id FROM erp.contas_pagar c
     JOIN erp.contas_pagar_parcelas pp ON pp.empresa_id = c.empresa_id AND pp.conta_pagar_id = c.id
     LEFT JOIN erp.pagamentos p ON p.empresa_id = pp.empresa_id AND p.conta_pagar_parcela_id = pp.id AND p.estornado_em IS NULL AND p.estorno_de_pagamento_id IS NULL
     WHERE c.empresa_id = $1 AND c.numero_documento = $2 AND c.origem = 'manual' AND c.excluido_em IS NULL`, [input.tenantId, `CARTAO-${input.paymentId}`])
  await runWithErpTransactionClient(client, async () => {
    for (const row of fee.rows) if (row.pagamento_id) await input.reversePayment({ tenantId: input.tenantId, actorId: input.actorId, id: String(row.pagamento_id),
      idempotencyKey: `cartao:${input.paymentId}:taxa:estorno`, reason: 'Estorno do recebimento no cartão' })
  })
  for (const row of fee.rows) await client.query(`UPDATE erp.contas_pagar SET status = 'cancelado', atualizado_por = $3 WHERE empresa_id = $1 AND id = $2`, [input.tenantId, row.conta_id, input.actorId])
  return { repasses_cancelados: transfers.rows.length }
}

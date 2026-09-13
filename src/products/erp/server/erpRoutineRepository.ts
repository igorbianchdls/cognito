import { runQuery, withTransaction } from '@/lib/postgres'
import { ErpDomainError } from './erpApi'
import { createErpEntityWithClient, shiftDate, recurrenceOccurrenceIndex } from './erpRepository'
import { assertErpPeriodOpen } from './erpPeriodRepository'
import { erpDateSchema } from '@/products/erp/shared/erpTransport'

function day(value: unknown) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
}

export async function processPurchaseRecurrences(input: {
  tenantId: number
  actorId: number
  throughDate: string
}) {
  const through = erpDateSchema.parse(input.throughDate)
  return withTransaction(async (client) => {
    const recurrences = await client.query(
      `SELECT * FROM erp.compras_recorrencias WHERE tenant_id=$1 AND ativa AND excluido_em IS NULL AND proxima_competencia<=$2 ORDER BY proxima_competencia,id LIMIT 50 FOR UPDATE SKIP LOCKED`,
      [input.tenantId, through],
    )
    const generated: Array<{ recurrenceId: string; purchaseId: string; date: string }> = []
    for (const r of recurrences.rows) {
      if (generated.length >= 50) break
      const model = (
        await client.query(
          `SELECT * FROM erp.compras WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL AND status<>'cancelada'`,
          [input.tenantId, r.compra_modelo_id],
        )
      ).rows[0]
      if (!model)
        throw new ErpDomainError(
          'RECURRENCE_MODEL_MISSING',
          `Recorrência ${r.id}: compra modelo indisponível.`,
          422,
        )
      const items = (
        await client.query(
          `SELECT produto_id,servico_id,descricao,detalhes,unidade,quantidade,valor_unitario,percentual_desconto,valor_desconto FROM erp.compras_itens WHERE tenant_id=$1 AND compra_id=$2 AND excluido_em IS NULL ORDER BY id`,
          [input.tenantId, model.id],
        )
      ).rows
      const forecasts = (
        await client.query(
          `SELECT numero_parcela,descricao,data_vencimento,valor,conta_financeira_id,metodo_pagamento_id FROM erp.compras_parcelas_previstas WHERE tenant_id=$1 AND compra_id=$2 AND excluido_em IS NULL ORDER BY numero_parcela`,
          [input.tenantId, model.id],
        )
      ).rows
      const start = day(r.inicio_em),
        frequency = String(r.frequencia),
        interval = Number(r.intervalo),
        max = r.termino_tipo === 'ocorrencias' ? Number(r.quantidade_ocorrencias) : Infinity
      let next = day(r.proxima_competencia),
        index = recurrenceOccurrenceIndex(start, next, frequency, interval)
      while (
        next <= through &&
        index < max &&
        (!r.termino_em || next <= day(r.termino_em)) &&
        generated.length < 50
      ) {
        const existing = (
          await client.query(
            `SELECT compra_id FROM erp.compras_recorrencias_geracoes WHERE tenant_id=$1 AND recorrencia_id=$2 AND competencia=$3`,
            [input.tenantId, r.id, next],
          )
        ).rows[0]
        if (!existing) {
          await assertErpPeriodOpen(client, {
            tenantId: input.tenantId,
            module: 'compras',
            date: next,
          })
          if (model.gera_financeiro)
            await assertErpPeriodOpen(client, {
              tenantId: input.tenantId,
              module: 'financeiro',
              date: next,
            })
          const shift = (v: unknown) => {
            const offset = Math.round(
              (Date.parse(day(v)) - Date.parse(day(model.data_compra))) / 86400000,
            )
            return new Date(Date.parse(next) + offset * 86400000).toISOString().slice(0, 10)
          }
          const purchase = await createErpEntityWithClient(client, {
            tenantId: input.tenantId,
            actorId: input.actorId,
            entityId: 'pedidos-compra',
            idempotencyKey: `compra-recorrente:${r.id}:${next}`,
            values: {
              ...model,
              numero: `REC-${r.id}-${next}`,
              tipo_movimento: 'pedido_compra',
              data_compra: next,
              data_competencia: next,
              data_prevista_entrega: model.data_prevista_entrega
                ? shift(model.data_prevista_entrega)
                : null,
              itens: items,
              parcelas: forecasts.map((p) => ({ ...p, data_vencimento: shift(p.data_vencimento) })),
            },
          })
          await client.query(
            `INSERT INTO erp.compras_recorrencias_geracoes(tenant_id,recorrencia_id,compra_id,competencia,criado_por,atualizado_por) VALUES($1,$2,$3,$4,$5,$5)`,
            [input.tenantId, r.id, purchase.id, next, input.actorId],
          )
          generated.push({
            recurrenceId: String(r.id),
            purchaseId: String(purchase.id),
            date: next,
          })
        }
        index++
        next = shiftDate(start, frequency, interval, index)
      }
      const ended = index >= max || Boolean(r.termino_em && next > day(r.termino_em))
      await client.query(
        `UPDATE erp.compras_recorrencias SET proxima_competencia=$3,ativa=$4,atualizado_por=$5 WHERE tenant_id=$1 AND id=$2`,
        [input.tenantId, r.id, ended ? null : next, !ended, input.actorId],
      )
    }
    return { generated, total: generated.length }
  })
}

export async function listRecurrenceHistory(tenantId: number, page = 1) {
  const offset = (Math.max(1, Math.min(10000, Math.floor(page) || 1)) - 1) * 30
  const financial = await runQuery(
    `SELECT id::text,tipo,metadata->>'descricao' AS descricao,inicio_em,termino_tipo,termino_em,quantidade_ocorrencias,frequencia,intervalo,proxima_competencia,gerado_ate,ativa,pausada_em,encerrada_em,atualizado_em FROM erp.recorrencias_financeiras WHERE tenant_id=$1 AND excluido_em IS NULL ORDER BY id DESC LIMIT 31 OFFSET $2`,
    [tenantId, offset],
  )
  const purchases = await runQuery(
    `SELECT id::text,compra_modelo_id::text,inicio_em,termino_tipo,termino_em,quantidade_ocorrencias,frequencia,intervalo,proxima_competencia,ativa FROM erp.compras_recorrencias WHERE tenant_id=$1 AND excluido_em IS NULL ORDER BY id DESC LIMIT 31 OFFSET $2`,
    [tenantId, offset],
  )
  const occurrences = await runQuery(
    `SELECT id::text,recorrencia_financeira_id::text AS recorrencia_id,'receber' AS lado,data_competencia,status FROM erp.contas_receber WHERE tenant_id=$1 AND recorrencia_financeira_id IS NOT NULL
    UNION ALL SELECT id::text,recorrencia_financeira_id::text,'pagar',data_competencia,status FROM erp.contas_pagar WHERE tenant_id=$1 AND recorrencia_financeira_id IS NOT NULL ORDER BY data_competencia DESC,id DESC LIMIT 31 OFFSET $2`,
    [tenantId, offset],
  )
  const purchaseOccurrences = await runQuery(
    `SELECT id::text,recorrencia_id::text,compra_id::text,competencia,criado_em FROM erp.compras_recorrencias_geracoes WHERE tenant_id=$1 ORDER BY criado_em DESC,id DESC LIMIT 31 OFFSET $2`,
    [tenantId, offset],
  )
  const contracts = await runQuery(
    `SELECT id::text,contrato_id::text,venda_id::text,periodo_inicio,periodo_fim,status,processado_em FROM erp.contratos_vendas_geracoes WHERE tenant_id=$1 ORDER BY criado_em DESC,id DESC LIMIT 31 OFFSET $2`,
    [tenantId, offset],
  )
  return {
    financial: financial.slice(0, 30),
    purchases: purchases.slice(0, 30),
    occurrences: occurrences.slice(0, 30),
    purchaseOccurrences: purchaseOccurrences.slice(0, 30),
    contracts: contracts.slice(0, 30),
    hasMore: [financial, purchases, occurrences, purchaseOccurrences, contracts].some(
      (r) => r.length > 30,
    ),
  }
}

export async function changeFinancialRecurrence(input: {
  tenantId: number
  actorId: number
  id: string
  action: string
  expectedUpdatedAt: string
}) {
  if (!/^[1-9]\d*$/.test(input.id) || !['pausar', 'retomar', 'encerrar'].includes(input.action))
    throw new ErpDomainError('VALIDATION_ERROR', 'Ação de recorrência inválida.', 422)
  return withTransaction(async (client) => {
    const rows = await client.query(
      `SELECT * FROM erp.recorrencias_financeiras WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const row = rows.rows[0]
    if (!row) throw new ErpDomainError('NOT_FOUND', 'Recorrência não encontrada.', 404)
    const updatedAt =
      row.atualizado_em instanceof Date
        ? row.atualizado_em.getTime()
        : Date.parse(String(row.atualizado_em))
    if (updatedAt !== Date.parse(input.expectedUpdatedAt))
      throw new ErpDomainError(
        'VERSION_CONFLICT',
        'A recorrência mudou. Atualize antes de continuar.',
        409,
      )
    if (row.encerrada_em)
      throw new ErpDomainError(
        'VALIDATION_ERROR',
        'Recorrência encerrada não pode ser alterada.',
        422,
      )
    if (input.action === 'retomar' && (!row.pausada_em || !row.proxima_competencia))
      throw new ErpDomainError('VALIDATION_ERROR', 'Não há ocorrência pausada para retomar.', 422)
    if (input.action === 'pausar' && !row.ativa)
      throw new ErpDomainError(
        'VALIDATION_ERROR',
        'Somente recorrências ativas podem ser pausadas.',
        422,
      )
    const result = await client.query(
      `UPDATE erp.recorrencias_financeiras SET ativa=($3='retomar'),
      pausada_em=CASE WHEN $3='pausar' THEN now() WHEN $3='retomar' THEN NULL ELSE pausada_em END,
      encerrada_em=CASE WHEN $3='encerrar' THEN now() ELSE NULL END,
      proxima_competencia=CASE WHEN $3='encerrar' THEN NULL ELSE proxima_competencia END,atualizado_por=$4
      WHERE tenant_id=$1 AND id=$2 RETURNING id::text,ativa,pausada_em,encerrada_em,proxima_competencia,atualizado_em`,
      [input.tenantId, input.id, input.action, input.actorId],
    )
    return result.rows[0]
  })
}

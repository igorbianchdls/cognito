import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import { assertErpPeriodOpen } from '@/products/erp/server/erpPeriodRepository'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { decimalNumber, decimalText, scaledDecimal } from '@/products/erp/shared/erpMoney'
import { requireOperationKey } from '@/products/erp/server/erpSettlementIdentity'

type Side = 'receber' | 'pagar'
type ActorInput = { tenantId: number; actorId: number }

function side(value: unknown): Side {
  if (value !== 'receber' && value !== 'pagar') throw new ErpDomainError('VALIDATION_ERROR', 'Lado financeiro invalido.')
  return value
}
function id(value: unknown, label: string) {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new ErpDomainError('INVALID_REFERENCE', `${label} invalido.`)
  return parsed
}
function optionalId(value: unknown) {
  return value == null || value === '' ? null : id(value, 'Referencia')
}
function text(value: unknown, label: string) {
  const result = String(value ?? '').trim()
  if (!result) throw new ErpDomainError('VALIDATION_ERROR', `Informe ${label.toLowerCase()}.`)
  return result
}
function date(value: unknown, label: string) {
  const result = String(value ?? '')
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(result)
  if (!match || new Date(`${result}T12:00:00Z`).toISOString().slice(0, 10) !== result) {
    throw new ErpDomainError('INVALID_DATE', `${label} invalida.`)
  }
  return result
}
function databaseDate(value: unknown) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '').slice(0, 10)
}
function money(value: unknown, label = 'Valor', positive = true) {
  const cents = scaledDecimal(value, 2)
  if ((positive && cents <= BigInt(0)) || (!positive && cents < BigInt(0))) throw new ErpDomainError('INVALID_AMOUNT', `${label} invalido.`)
  return decimalNumber(decimalText(cents))
}
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)]))
  return value
}

function compositionSql(financialSide: Side, installmentAlias = 'parcelas') {
  const installmentColumn = `conta_${financialSide}_parcela_id`
  return `CROSS JOIN LATERAL (
    SELECT ${installmentAlias}.valor,
      COALESCE((SELECT sum(valor) FROM erp.pagamentos pagamento WHERE pagamento.tenant_id=${installmentAlias}.tenant_id
        AND pagamento.${installmentColumn}=${installmentAlias}.id AND pagamento.estorno_de_pagamento_id IS NULL
        AND pagamento.estornado_em IS NULL AND pagamento.excluido_em IS NULL),0) AS dinheiro,
      COALESCE((SELECT sum(CASE WHEN aplicacao.reversao_de_id IS NULL THEN aplicacao.valor ELSE -aplicacao.valor END)
        FROM erp.adiantamentos_aplicacoes aplicacao WHERE aplicacao.tenant_id=${installmentAlias}.tenant_id
          AND aplicacao.${installmentColumn}=${installmentAlias}.id),0) AS credito,
      COALESCE((SELECT sum(link.valor) FROM erp.renegociacoes_parcelas link JOIN erp.renegociacoes acordo
        ON acordo.tenant_id=link.tenant_id AND acordo.id=link.renegociacao_id WHERE link.tenant_id=${installmentAlias}.tenant_id
          AND link.${installmentColumn}=${installmentAlias}.id AND link.papel='origem' AND acordo.status='efetivada'),0) AS transferido,
      ${installmentAlias}.valor
        - COALESCE((SELECT sum(valor) FROM erp.pagamentos pagamento WHERE pagamento.tenant_id=${installmentAlias}.tenant_id
          AND pagamento.${installmentColumn}=${installmentAlias}.id AND pagamento.estorno_de_pagamento_id IS NULL
          AND pagamento.estornado_em IS NULL AND pagamento.excluido_em IS NULL),0)
        - COALESCE((SELECT sum(CASE WHEN aplicacao.reversao_de_id IS NULL THEN aplicacao.valor ELSE -aplicacao.valor END)
          FROM erp.adiantamentos_aplicacoes aplicacao WHERE aplicacao.tenant_id=${installmentAlias}.tenant_id
            AND aplicacao.${installmentColumn}=${installmentAlias}.id),0)
        - COALESCE((SELECT sum(link.valor) FROM erp.renegociacoes_parcelas link JOIN erp.renegociacoes acordo
          ON acordo.tenant_id=link.tenant_id AND acordo.id=link.renegociacao_id WHERE link.tenant_id=${installmentAlias}.tenant_id
            AND link.${installmentColumn}=${installmentAlias}.id AND link.papel='origem' AND acordo.status='efetivada'),0) AS saldo
  ) composicao`
}

async function registerIdempotent(client: Pick<SQLClient, 'query'>, tenantId: number, table: 'adiantamentos' | 'adiantamentos_aplicacoes' | 'renegociacoes', values: Record<string, unknown>) {
  const result = await client.query(
    `SELECT erp.registrar_operacao_idempotente($2, $3::jsonb)::text AS id
     FROM (VALUES ($1::bigint)) AS scope(tenant_id) WHERE scope.tenant_id = $1`,
    [tenantId, table, JSON.stringify({ ...values, tenant_id: tenantId })],
  )
  return String(result.rows[0]?.id || '')
}

export async function getInstallmentComposition(tenantId: number, financialSide: Side, installmentId: number) {
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT composicao.valor, composicao.dinheiro AS principal_pago, composicao.credito,
       composicao.transferido AS renegociado, composicao.saldo,
       COALESCE(realizado.juros,0) AS juros_realizados,
       COALESCE(realizado.multa,0) AS multa_realizada,
       COALESCE(realizado.desconto,0) AS desconto_realizado,
       COALESCE(realizado.taxa,0) AS taxa_realizada,
       COALESCE(realizado.caixa,0) AS dinheiro_movimentado
     FROM erp.contas_${financialSide}_parcelas parcelas
     ${compositionSql(financialSide)}
     LEFT JOIN LATERAL (
       SELECT sum(juros) juros, sum(multa) multa, sum(desconto) desconto, sum(taxa) taxa,
         sum(valor_liquido) caixa
       FROM erp.pagamentos
       WHERE tenant_id = $1 AND estorno_de_pagamento_id IS NULL AND estornado_em IS NULL
         AND excluido_em IS NULL AND
         (($2 = 'receber' AND conta_receber_parcela_id = $3) OR ($2 = 'pagar' AND conta_pagar_parcela_id = $3))
     ) realizado ON true
     WHERE parcelas.tenant_id=$1 AND parcelas.id=$3 AND $2='${financialSide}'`,
    [tenantId, financialSide, installmentId],
  )
  if (!rows[0]) throw new ErpDomainError('NOT_FOUND', 'Parcela financeira nao encontrada.', 404)
  return Object.fromEntries(Object.entries(rows[0]).map(([key, value]) => [key, typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value]))
}

export async function listAdvances(tenantId: number, filters: { lado?: string; entidadeId?: number } = {}) {
  const selectedSide = filters.lado ? side(filters.lado) : null
  return runQuery<Record<string, unknown>>(
    `SELECT a.id::text, a.lado, a.entidade_id::text, entidades.nome AS entidade,
       a.data_movimento, a.data_credito, a.valor, a.conta_financeira_id::text, a.metodo_pagamento_id::text,
       a.valor - COALESCE(movimentos.valor,0) - COALESCE(aplicacoes.valor,0) AS saldo,
       contas.nome AS conta_financeira, a.motivo
     FROM erp.adiantamentos a
     JOIN erp.entidades entidades ON entidades.tenant_id=a.tenant_id AND entidades.id=a.entidade_id
     JOIN erp.contas_financeiras contas ON contas.tenant_id=a.tenant_id AND contas.id=a.conta_financeira_id
     LEFT JOIN LATERAL (
       SELECT sum(CASE WHEN m.tipo='devolucao' THEN m.valor
         WHEN m.tipo='reversao' AND original.tipo='constituicao' THEN m.valor
         WHEN m.tipo='reversao' AND original.tipo='devolucao' THEN -m.valor ELSE 0 END) valor
       FROM erp.adiantamentos m LEFT JOIN erp.adiantamentos original
         ON original.tenant_id=m.tenant_id AND original.id=m.reversao_de_id
       WHERE m.tenant_id=a.tenant_id AND m.adiantamento_id=a.id
     ) movimentos ON true
     LEFT JOIN LATERAL (
       SELECT sum(CASE WHEN reversao_de_id IS NULL THEN valor ELSE -valor END) valor
       FROM erp.adiantamentos_aplicacoes x WHERE x.tenant_id=a.tenant_id AND x.adiantamento_id=a.id
     ) aplicacoes ON true
     WHERE a.tenant_id=$1 AND a.tipo='constituicao'
       AND ($2::text IS NULL OR a.lado=$2) AND ($3::bigint IS NULL OR a.entidade_id=$3)
     ORDER BY a.data_movimento DESC, a.id DESC`,
    [tenantId, selectedSide, filters.entidadeId || null],
  )
}

export async function listInstallmentApplications(tenantId: number, financialSide: Side, installmentId: number) {
  return runQuery<Record<string, unknown>>(
    `SELECT aplicacoes.id::text, aplicacoes.adiantamento_id::text, aplicacoes.valor,
       aplicacoes.data_aplicacao, aplicacoes.motivo, aplicacoes.reversao_de_id::text,
       EXISTS(SELECT 1 FROM erp.adiantamentos_aplicacoes reversao
         WHERE reversao.tenant_id=aplicacoes.tenant_id AND reversao.reversao_de_id=aplicacoes.id) AS revertida
     FROM erp.adiantamentos_aplicacoes aplicacoes
     WHERE aplicacoes.tenant_id=$1 AND
       (($2='receber' AND aplicacoes.conta_receber_parcela_id=$3) OR
        ($2='pagar' AND aplicacoes.conta_pagar_parcela_id=$3))
     ORDER BY aplicacoes.data_aplicacao DESC, aplicacoes.id DESC`,
    [tenantId, financialSide, installmentId],
  )
}

export async function listInstallmentRenegotiations(tenantId: number, financialSide: Side, installmentId: number) {
  return runQuery<Record<string, unknown>>(
    `SELECT acordos.id::text, acordos.numero, acordos.data_acordo, acordos.status,
       acordos.desconto, acordos.encargos, vinculos.papel, vinculos.valor
     FROM erp.renegociacoes_parcelas vinculos
     JOIN erp.renegociacoes acordos ON acordos.tenant_id=vinculos.tenant_id AND acordos.id=vinculos.renegociacao_id
     WHERE vinculos.tenant_id=$1 AND acordos.lado=$2 AND
       (($2='receber' AND vinculos.conta_receber_parcela_id=$3) OR
        ($2='pagar' AND vinculos.conta_pagar_parcela_id=$3))
     ORDER BY acordos.data_acordo DESC, acordos.id DESC`,
    [tenantId, financialSide, installmentId],
  )
}

export async function createAdvance(input: ActorInput & { idempotencyKey?: string; values: Record<string, unknown> }) {
  const key = requireOperationKey(input.idempotencyKey || input.values.chave_idempotencia)
  const movementType = String(input.values.tipo || 'constituicao')
  if (!['constituicao', 'devolucao', 'reversao'].includes(movementType)) throw new ErpDomainError('VALIDATION_ERROR', 'Tipo de adiantamento invalido.')
  const movementDate = date(input.values.data_movimento, 'Data do movimento')
  return withTransaction(async (client) => {
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: movementDate })
    const values = {
      entidade_id: id(input.values.entidade_id, 'Entidade'), lado: side(input.values.lado), tipo: movementType,
      adiantamento_id: optionalId(input.values.adiantamento_id), reversao_de_id: optionalId(input.values.reversao_de_id),
      conta_financeira_id: id(input.values.conta_financeira_id, 'Conta financeira'),
      metodo_pagamento_id: optionalId(input.values.metodo_pagamento_id), data_movimento: movementDate,
      data_credito: input.values.data_credito ? date(input.values.data_credito, 'Data do credito') : null,
      valor: money(input.values.valor), motivo: text(input.values.motivo, 'Motivo'), chave_idempotencia: key,
    }
    const resultId = await registerIdempotent(client, input.tenantId, 'adiantamentos', values)
    const result = await client.query(`SELECT id::text, tipo, lado, valor, data_movimento FROM erp.adiantamentos WHERE tenant_id=$1 AND id=$2`, [input.tenantId, resultId])
    return result.rows[0]
  })
}

export async function applyAdvance(input: ActorInput & { idempotencyKey?: string; values: Record<string, unknown> }) {
  const key = requireOperationKey(input.idempotencyKey || input.values.chave_idempotencia)
  const applicationDate = date(input.values.data_aplicacao, 'Data da aplicacao')
  return withTransaction(async (client) => {
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: applicationDate })
    const financialSide = side(input.values.lado)
    const values = {
      adiantamento_id: id(input.values.adiantamento_id, 'Adiantamento'),
      conta_receber_parcela_id: financialSide === 'receber' ? id(input.values.parcela_id, 'Parcela') : null,
      conta_pagar_parcela_id: financialSide === 'pagar' ? id(input.values.parcela_id, 'Parcela') : null,
      valor: money(input.values.valor), data_aplicacao: applicationDate,
      reversao_de_id: optionalId(input.values.reversao_de_id), motivo: text(input.values.motivo, 'Motivo'),
      chave_idempotencia: key,
    }
    const resultId = await registerIdempotent(client, input.tenantId, 'adiantamentos_aplicacoes', values)
    const result = await client.query(`SELECT id::text, adiantamento_id::text, valor, data_aplicacao, reversao_de_id::text FROM erp.adiantamentos_aplicacoes WHERE tenant_id=$1 AND id=$2`, [input.tenantId, resultId])
    return result.rows[0]
  })
}

export async function reverseAdvanceApplication(input: ActorInput & { applicationId: number; idempotencyKey?: string; values: Record<string, unknown> }) {
  const key = requireOperationKey(input.idempotencyKey)
  return withTransaction(async (client) => {
    const originalResult = await client.query(`SELECT * FROM erp.adiantamentos_aplicacoes WHERE tenant_id=$1 AND id=$2`, [input.tenantId, input.applicationId])
    const original = originalResult.rows[0]
    if (!original || original.reversao_de_id) throw new ErpDomainError('NOT_FOUND', 'Aplicacao original nao encontrada.', 404)
    const applicationDate = date(input.values.data_aplicacao, 'Data da reversao')
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: applicationDate })
    const resultId = await registerIdempotent(client, input.tenantId, 'adiantamentos_aplicacoes', {
      adiantamento_id: original.adiantamento_id, conta_receber_parcela_id: original.conta_receber_parcela_id,
      conta_pagar_parcela_id: original.conta_pagar_parcela_id, valor: Number(original.valor), data_aplicacao: applicationDate,
      reversao_de_id: original.id, motivo: text(input.values.motivo, 'Motivo'), chave_idempotencia: key,
    })
    return { id: resultId, reversao_de_id: String(original.id) }
  })
}

export async function makePayableEffective(input: ActorInput & { payableId: number }) {
  return withTransaction(async (client) => {
    const current = await client.query(`SELECT id, tipo_lancamento, data_competencia FROM erp.contas_pagar WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE`, [input.tenantId, input.payableId])
    const payable = current.rows[0]
    if (!payable) throw new ErpDomainError('NOT_FOUND', 'Conta a pagar nao encontrada.', 404)
    if (payable.tipo_lancamento === 'efetivo') return { id: String(payable.id), tipo_lancamento: 'efetivo' }
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: databaseDate(payable.data_competencia) })
    const result = await client.query(`UPDATE erp.contas_pagar SET tipo_lancamento='efetivo', efetivado_em=now(), atualizado_por=$3 WHERE tenant_id=$1 AND id=$2 AND tipo_lancamento='previsao' RETURNING id::text,tipo_lancamento,efetivado_em`, [input.tenantId, input.payableId, input.actorId])
    await client.query(`INSERT INTO erp.contas_pagar_eventos(tenant_id,conta_pagar_id,evento,dados,criado_por) VALUES($1,$2,'efetivada','{}'::jsonb,$3)`, [input.tenantId, input.payableId, input.actorId])
    return result.rows[0]
  })
}

export async function replaceFinancialAllocations(input: ActorInput & { financialSide: Side; titleId: number; values: Record<string, unknown> }) {
  const allocations = Array.isArray(input.values.rateios) ? input.values.rateios as Record<string, unknown>[] : []
  return withTransaction(async (client) => {
    const titleTable = input.financialSide === 'receber' ? 'erp.contas_receber' : 'erp.contas_pagar'
    const title = await client.query(`SELECT id,valor_total,data_competencia FROM ${titleTable} WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE`, [input.tenantId, input.titleId])
    if (!title.rows[0]) throw new ErpDomainError('NOT_FOUND', 'Titulo financeiro nao encontrado.', 404)
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: databaseDate(title.rows[0].data_competencia) })
    const total = allocations.reduce((sum, item) => sum + scaledDecimal(item.valor, 2), BigInt(0))
    if (allocations.length && total !== scaledDecimal(title.rows[0].valor_total, 2)) throw new ErpDomainError('VALIDATION_ERROR', 'O rateio precisa distribuir integralmente o valor do titulo.')
    await client.query(`UPDATE erp.rateios_financeiros SET excluido_em=now(),atualizado_por=$3 WHERE tenant_id=$1 AND conta_${input.financialSide}_id=$2 AND excluido_em IS NULL`, [input.tenantId, input.titleId, input.actorId])
    for (const allocation of allocations) {
      await client.query(`INSERT INTO erp.rateios_financeiros(tenant_id,tipo,conta_${input.financialSide}_id,categoria_id,centro_custo_id,valor,percentual,observacoes,criado_por,atualizado_por) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`, [input.tenantId, input.financialSide, input.titleId, optionalId(allocation.categoria_id), optionalId(allocation.centro_custo_id), money(allocation.valor), allocation.percentual == null ? null : money(allocation.percentual, 'Percentual', false), String(allocation.observacoes || '') || null, input.actorId])
    }
    return { total: decimalNumber(decimalText(total)), quantidade: allocations.length }
  })
}

export async function createRenegotiation(input: ActorInput & { idempotencyKey?: string; values: Record<string, unknown> }) {
  const key = requireOperationKey(input.idempotencyKey)
  const financialSide = side(input.values.lado)
  const originIds = [...new Set((Array.isArray(input.values.origens) ? input.values.origens : []).map((value) => id(value, 'Parcela de origem')))]
  const destinations = Array.isArray(input.values.destinos) ? input.values.destinos as Record<string, unknown>[] : []
  if (!originIds.length || !destinations.length) throw new ErpDomainError('VALIDATION_ERROR', 'Informe origens e parcelas de destino.')
  const agreementDate = date(input.values.data_acordo, 'Data do acordo')
  const discount = money(input.values.desconto || 0, 'Desconto', false)
  const charges = money(input.values.encargos || 0, 'Encargos', false)
  return withTransaction(async (client) => {
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: agreementDate })
    const table = financialSide === 'receber' ? 'receber' : 'pagar'
    const origin = await client.query(`SELECT p.id, c.${financialSide === 'receber' ? 'cliente_id' : 'fornecedor_id'} entidade_id, composicao.saldo FROM erp.contas_${table}_parcelas p JOIN erp.contas_${table} c ON c.tenant_id=p.tenant_id AND c.id=p.conta_${table}_id ${compositionSql(financialSide, 'p')} WHERE p.tenant_id=$1 AND $2='${financialSide}' AND p.id=ANY($3::bigint[]) AND p.excluido_em IS NULL AND c.excluido_em IS NULL FOR UPDATE OF p,c`, [input.tenantId, financialSide, originIds])
    if (origin.rows.length !== originIds.length) throw new ErpDomainError('NOT_FOUND', 'Uma parcela de origem nao foi encontrada.', 404)
    const entityId = id(input.values.entidade_id, 'Entidade')
    if (origin.rows.some((row) => Number(row.entidade_id) !== entityId || scaledDecimal(row.saldo, 2) <= BigInt(0))) throw new ErpDomainError('VALIDATION_ERROR', 'As origens devem ter saldo e pertencer a mesma entidade.')
    const originTotal = origin.rows.reduce((sum, row) => sum + scaledDecimal(row.saldo, 2), BigInt(0))
    const destinationTotal = destinations.reduce((sum, row) => sum + scaledDecimal(row.valor, 2), BigInt(0))
    if (destinationTotal !== originTotal - scaledDecimal(discount, 2) + scaledDecimal(charges, 2)) throw new ErpDomainError('VALIDATION_ERROR', 'A composicao das novas parcelas nao fecha com o acordo.')
    const request = stable({ origens: originIds, destinos: destinations, desconto: discount, encargos: charges })
    const agreementId = await registerIdempotent(client, input.tenantId, 'renegociacoes', {
      entidade_id: entityId, lado: financialSide, numero: text(input.values.numero, 'Numero do acordo'), data_acordo: agreementDate,
      status: 'rascunho', desconto: discount, encargos: charges, categoria_ajuste_id: optionalId(input.values.categoria_ajuste_id),
      motivo: text(input.values.motivo, 'Motivo'), condicoes: JSON.stringify(request), chave_idempotencia: key,
    })
    const existing = await client.query(`SELECT status FROM erp.renegociacoes WHERE tenant_id=$1 AND id=$2`, [input.tenantId, agreementId])
    if (existing.rows[0]?.status !== 'rascunho') return { id: agreementId, status: existing.rows[0]?.status }
    const links = await client.query(`SELECT count(*)::int total FROM erp.renegociacoes_parcelas WHERE tenant_id=$1 AND renegociacao_id=$2`, [input.tenantId, agreementId])
    if (Number(links.rows[0]?.total) > 0) throw new ErpDomainError('OPERATION_UNCERTAIN', 'O acordo esta incompleto e precisa de revisao.', 409)
    for (const [index, row] of origin.rows.entries()) await client.query(`INSERT INTO erp.renegociacoes_parcelas(tenant_id,renegociacao_id,papel,conta_${table}_parcela_id,valor,ordem) VALUES($1,$2,'origem',$3,$4,$5)`, [input.tenantId, agreementId, row.id, row.saldo, index + 1])
    const titleResult = await client.query(`INSERT INTO erp.contas_${table}(tenant_id,${financialSide === 'receber' ? 'cliente_id' : 'fornecedor_id'},descricao,numero_documento,data_competencia,data_emissao,valor_total,status,origem${financialSide === 'pagar' ? ',tipo_lancamento,efetivado_em' : ''},renegociacao_origem_id,criado_por,atualizado_por) VALUES($1,$2,$3,$4,$5,$5,$6,'aberto','api'${financialSide === 'pagar' ? ",'efetivo',now()" : ''},$7,$8,$8) RETURNING id`, [input.tenantId, entityId, `Renegociacao ${text(input.values.numero, 'Numero do acordo')}`, String(input.values.numero), agreementDate, decimalNumber(decimalText(destinationTotal)), agreementId, input.actorId])
    const titleId = titleResult.rows[0].id
    for (const [index, destination] of destinations.entries()) {
      const value = money(destination.valor)
      const dueDate = date(destination.data_vencimento, 'Vencimento')
      const installment = await client.query(`INSERT INTO erp.contas_${table}_parcelas(tenant_id,conta_${table}_id,numero_parcela,descricao,data_vencimento,data_pagamento_previsto,valor,valor_bruto,valor_liquido,valor_pago,status,criado_por,atualizado_por) VALUES($1,$2,$3,$4,$5,$5,$6,$6,$6,0,'aberto',$7,$7) RETURNING id`, [input.tenantId, titleId, index + 1, String(destination.descricao || `Parcela ${index + 1}`), dueDate, value, input.actorId])
      await client.query(`INSERT INTO erp.renegociacoes_parcelas(tenant_id,renegociacao_id,papel,conta_${table}_parcela_id,valor,ordem) VALUES($1,$2,'destino',$3,$4,$5)`, [input.tenantId, agreementId, installment.rows[0].id, value, index + 1])
    }
    await client.query(`UPDATE erp.renegociacoes SET status='efetivada',efetivada_em=now(),efetivada_por=$3 WHERE tenant_id=$1 AND id=$2 AND status='rascunho'`, [input.tenantId, agreementId, input.actorId])
    return { id: agreementId, status: 'efetivada', titulo_id: String(titleId) }
  })
}

export async function reverseRenegotiation(input: ActorInput & { agreementId: number; values: Record<string, unknown> }) {
  return withTransaction(async (client) => {
    const agreement = await client.query(`SELECT id,lado,data_acordo,status FROM erp.renegociacoes WHERE tenant_id=$1 AND id=$2 FOR UPDATE`, [input.tenantId, input.agreementId])
    const row = agreement.rows[0]
    if (!row) throw new ErpDomainError('NOT_FOUND', 'Renegociacao nao encontrada.', 404)
    if (row.status === 'revertida') return { id: String(row.id), status: 'revertida' }
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: databaseDate(row.data_acordo) })
    const table = side(row.lado)
    await client.query(`UPDATE erp.contas_${table}_parcelas p SET status='cancelado',atualizado_por=$3 FROM erp.renegociacoes_parcelas l WHERE p.tenant_id=$1 AND l.tenant_id=p.tenant_id AND l.renegociacao_id=$2 AND l.papel='destino' AND l.conta_${table}_parcela_id=p.id`, [input.tenantId, input.agreementId, input.actorId])
    await client.query(`UPDATE erp.contas_${table} t SET status='cancelado',cancelado_em=now(),motivo_cancelamento=$3,atualizado_por=$4 WHERE t.tenant_id=$1 AND t.renegociacao_origem_id=$2`, [input.tenantId, input.agreementId, text(input.values.motivo, 'Motivo'), input.actorId])
    await client.query(`UPDATE erp.renegociacoes SET status='revertida',revertida_em=now(),revertida_por=$3,motivo_reversao=$4 WHERE tenant_id=$1 AND id=$2 AND status='efetivada'`, [input.tenantId, input.agreementId, input.actorId, text(input.values.motivo, 'Motivo')])
    return { id: String(row.id), status: 'revertida' }
  })
}

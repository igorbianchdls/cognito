// Part of the ERP repository, split by area from erpRepository.ts. erpRepository.ts re-exports the public names.
import { validarBaixa } from '../regras/contas-receber'
import { validarParcelas } from '../regras/geral'
import { exigirRegra } from './erpRegras'
import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import { ERP_TODAY_SQL, erpToday } from '@/products/erp/server/erpBusinessDate'
import { applyCardReceipt, cancelCardReceipt, cardMethodConfig } from '@/products/erp/server/erpCardReceipts'
import { assertErpPeriodOpen } from '@/products/erp/server/erpPeriodRepository'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { nonNegativeDecimal, paymentTotal, sumMoney } from '@/products/erp/shared/erpMoney'
import { erpListOrder } from '@/products/erp/shared/readQueries'
import type { ErpEntityRecord } from '@/products/erp/shared/types'
import { accountingLink } from './erpAccountingRepository'
import { assertCommercialReplay as assertOperationReplay, commercialRequest } from './erpCommercialIdempotency'
import { financialCompositionSql } from './erpFinancialComposition'
import { activeFromStatus, appendPagination, appendRecordStatusFilter, appendSearch, appendStatusFilter, assertRequired, booleanValue, dateText, jsonObject, money, normalizedIdempotencyKey, numericId, optionalNumericId, optionalText, positiveMoney, shiftDate, text, type CreateInput, type ListInput, type ReversePaymentInput, type SettleInstallmentInput } from './erpRepositoryCore'
import { assertSettlementReplay, requireOperationKey, settlementIdentity } from './erpSettlementIdentity'

async function ensureFinancialAccountId(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  _actorId: number,
  value: unknown,
) {
  const requested = Number(value || 0)
  if (Number.isInteger(requested) && requested > 0) {
    const selected = await client.query(
      `SELECT id
       FROM erp.contas_financeiras
       WHERE empresa_id = $1
         AND id = $2
         AND ativo = true
         AND excluido_em IS NULL`,
      [tenantId, requested],
    )
    if (!selected.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Conta financeira inválida ou inativa.')
    return requested
  }

  const existing = await client.query(
    `SELECT id, padrao
     FROM erp.contas_financeiras
     WHERE empresa_id = $1
       AND ativo = true
       AND excluido_em IS NULL
     ORDER BY padrao DESC, id ASC
     LIMIT 2`,
    [tenantId],
  )
  if (existing.rows[0]?.padrao || existing.rows.length === 1) return Number(existing.rows[0]?.id)
  if (existing.rows.length === 0) throw new ErpDomainError('VALIDATION_ERROR', 'Cadastre uma conta financeira antes de registrar a baixa.')
  throw new ErpDomainError('VALIDATION_ERROR', 'Selecione uma conta financeira para registrar a baixa.')
}
// Composição do saldo de uma parcela: pagamentos válidos, créditos aplicados e valor levado para renegociação.
// As três somas são calculadas uma única vez por parcela: OFFSET 0 impede o planejador de desdobrar a subconsulta
// e repetir os agregados a cada referência a composicao.* (antes, ~13 vezes por linha nas listas financeiras).

async function updateReceivableStatus(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  receivableId: string | number,
  actorId: number,
) {
  await client.query(
    `WITH totals AS (
       SELECT
         COALESCE(sum(composicao.saldo), 0) AS saldo,
         COALESCE(sum(composicao.dinheiro + composicao.credito), 0) AS liquidado,
         bool_and(composicao.transferido > 0) AS renegociado
       FROM erp.contas_receber_parcelas parcelas
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id = $1 AND parcelas.conta_receber_id = $2
         AND parcelas.excluido_em IS NULL AND parcelas.status <> 'cancelado'
     )
     UPDATE erp.contas_receber
     SET status = CASE
       WHEN totals.renegociado THEN 'renegociado'
       WHEN totals.saldo = 0 THEN 'pago'
       WHEN EXISTS (
         SELECT 1
         FROM erp.contas_receber_parcelas AS vencidas
         WHERE vencidas.empresa_id = $1
           AND vencidas.conta_receber_id = $2
           AND vencidas.excluido_em IS NULL
           AND vencidas.status <> 'cancelado'
           AND vencidas.status NOT IN ('pago','renegociado')
           AND vencidas.data_vencimento < ${ERP_TODAY_SQL}
       ) THEN 'vencido'
       WHEN totals.liquidado > 0 THEN 'parcial'
       ELSE 'aberto'
     END,
     atualizado_por = $3
     FROM totals
     WHERE contas_receber.empresa_id = $1
       AND contas_receber.id = $2`,
    [tenantId, receivableId, actorId],
  )
}
async function updatePayableStatus(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  payableId: string | number,
  actorId: number,
) {
  await client.query(
    `WITH totals AS (
       SELECT
         COALESCE(sum(composicao.saldo), 0) AS saldo,
         COALESCE(sum(composicao.dinheiro + composicao.credito), 0) AS liquidado,
         bool_and(composicao.transferido > 0) AS renegociado
       FROM erp.contas_pagar_parcelas parcelas
       ${financialCompositionSql('pagar')}
       WHERE parcelas.empresa_id = $1 AND parcelas.conta_pagar_id = $2
         AND parcelas.excluido_em IS NULL AND parcelas.status <> 'cancelado'
     )
     UPDATE erp.contas_pagar
     SET status = CASE
       WHEN totals.renegociado THEN 'renegociado'
       WHEN totals.saldo = 0 THEN 'pago'
       WHEN EXISTS (
         SELECT 1
         FROM erp.contas_pagar_parcelas AS vencidas
         WHERE vencidas.empresa_id = $1
           AND vencidas.conta_pagar_id = $2
           AND vencidas.excluido_em IS NULL
           AND vencidas.status <> 'cancelado'
           AND vencidas.status NOT IN ('pago','renegociado')
           AND vencidas.data_vencimento < ${ERP_TODAY_SQL}
       ) THEN 'vencido'
       WHEN totals.liquidado > 0 THEN 'parcial'
       ELSE 'aberto'
     END,
     atualizado_por = $3
     FROM totals
     WHERE contas_pagar.empresa_id = $1
       AND contas_pagar.id = $2`,
    [tenantId, payableId, actorId],
  )
}
export function financialAccountType(value: unknown) {
  const normalized = text(value).toLowerCase()
  if (['caixa', 'banco', 'carteira', 'cartao', 'maquininha', 'outro'].includes(normalized)) return normalized
  return 'banco'
}
export async function listErpPayments(input: { tenantId: number; type: 'receber' | 'pagar'; accountId: number }) {
  const receiving = input.type === 'receber'
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT pagamentos.id::text, pagamentos.tipo, pagamentos.origem, pagamentos.data_pagamento,
       pagamentos.valor, pagamentos.juros, pagamentos.multa, pagamentos.desconto, pagamentos.taxa,
       pagamentos.valor_liquido, pagamentos.estornado_em, pagamentos.estorno_de_pagamento_id::text,
       parcelas.numero_parcela, financeiras.nome AS conta_financeira, metodos.nome AS metodo_pagamento
     FROM erp.pagamentos AS pagamentos
     JOIN ${receiving ? 'erp.contas_receber_parcelas' : 'erp.contas_pagar_parcelas'} AS parcelas
       ON parcelas.empresa_id = pagamentos.empresa_id
      AND parcelas.id = pagamentos.${receiving ? 'conta_receber_parcela_id' : 'conta_pagar_parcela_id'}
     LEFT JOIN erp.contas_financeiras AS financeiras
       ON financeiras.empresa_id = pagamentos.empresa_id AND financeiras.id = pagamentos.conta_financeira_id
     LEFT JOIN erp.metodos_pagamento AS metodos
       ON metodos.empresa_id = pagamentos.empresa_id AND metodos.id = pagamentos.metodo_pagamento_id
     WHERE pagamentos.empresa_id = $1
       AND parcelas.${receiving ? 'conta_receber_id' : 'conta_pagar_id'} = $2
       AND pagamentos.excluido_em IS NULL
     ORDER BY pagamentos.data_pagamento DESC, pagamentos.id DESC`,
    [input.tenantId, input.accountId],
  )
  return rows.map((row) => ({
    id: String(row.id), tipo: String(row.tipo), origem: String(row.origem),
    data_pagamento: dateText(row.data_pagamento) || '', valor: Number(row.valor || 0),
    juros: Number(row.juros || 0), multa: Number(row.multa || 0), desconto: Number(row.desconto || 0),
    taxa: Number(row.taxa || 0), valor_liquido: Number(row.valor_liquido || 0),
    estornado_em: row.estornado_em ? new Date(String(row.estornado_em)).toISOString() : '',
    estorno_de_pagamento_id: String(row.estorno_de_pagamento_id || ''),
    numero_parcela: Number(row.numero_parcela || 0), conta_financeira: String(row.conta_financeira || ''),
    metodo_pagamento: String(row.metodo_pagamento || ''),
  }))
}
export async function listReceivables(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const dueStart = dateText(input.filters?.vencimento_inicio)
  const dueEnd = dateText(input.filters?.vencimento_fim)
  const dueStartClause = dueStart ? ` AND parcelas.data_vencimento >= $${params.push(dueStart)}` : ''
  const dueEndClause = dueEnd ? ` AND parcelas.data_vencimento <= $${params.push(dueEnd)}` : ''
  const launchType = ['previsao', 'efetivo'].includes(text(input.filters?.tipo_lancamento)) ? text(input.filters?.tipo_lancamento) : ''
  const launchTypeClause = launchType ? ` AND contas.tipo_lancamento = $${params.push(launchType)}` : ''
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         contas.id::text AS conta_id,
         parcelas.id::text AS parcela_id,
         parcelas.conta_financeira_id::text,
         parcelas.metodo_pagamento_id::text,
         contas.descricao,
         contas.numero_documento,
         contas.origem,
         contas.tipo_lancamento,
         parcelas.numero_parcela,
         parcelas.data_vencimento,
         composicao.valor,
         composicao.dinheiro AS valor_pago,
         composicao.credito,
         composicao.transferido AS renegociado,
         composicao.saldo,
         parcelas.valor_bruto,
         parcelas.valor_liquido AS valor_liquido_previsto,
         parcelas.juros AS juros_previstos,
         parcelas.multa AS multa_prevista,
         parcelas.desconto AS desconto_previsto,
         parcelas.taxa AS taxa_prevista,
         parcelas.recebimento_previsto_id::text,
         CASE
           WHEN contas.status = 'cancelado' OR parcelas.status = 'cancelado' THEN 'cancelado'
           WHEN composicao.transferido > 0 THEN 'renegociado'
           WHEN composicao.saldo = 0 THEN 'pago'
           WHEN parcelas.data_vencimento < ${ERP_TODAY_SQL} THEN 'vencido'
           WHEN composicao.dinheiro + composicao.credito > 0 THEN 'parcial'
           ELSE parcelas.status
         END AS status,
         entidades.id::text AS entidade_id,
         entidades.nome AS cliente,
         COALESCE(categorias.nome, '') AS categoria,
         concat_ws(' ', contas.descricao, contas.numero_documento, entidades.nome, contas.status, categorias.nome) AS searchable
       FROM erp.contas_receber AS contas
       JOIN erp.entidades AS entidades
         ON entidades.empresa_id = contas.empresa_id
        AND entidades.id = contas.cliente_id
       LEFT JOIN erp.categorias AS categorias ON categorias.empresa_id = contas.empresa_id AND categorias.id = contas.categoria_id
       JOIN erp.contas_receber_parcelas AS parcelas
         ON parcelas.empresa_id = contas.empresa_id
        AND parcelas.conta_receber_id = contas.id
        AND parcelas.excluido_em IS NULL
       ${financialCompositionSql('receber')}
       WHERE contas.empresa_id = $1
         AND contas.excluido_em IS NULL
         ${dueStartClause}
         ${dueEndClause}
         ${launchTypeClause}
     )
     SELECT *,
       count(*) OVER ()::int AS __total,
       sum(CASE WHEN status = 'vencido' THEN saldo ELSE 0 END) OVER () AS __summary_overdue,
       sum(CASE WHEN data_vencimento = ${ERP_TODAY_SQL} AND status NOT IN ('pago', 'cancelado', 'renegociado') THEN saldo ELSE 0 END) OVER () AS __summary_due_today,
       sum(CASE WHEN data_vencimento > ${ERP_TODAY_SQL} AND status NOT IN ('pago', 'cancelado', 'renegociado') THEN saldo ELSE 0 END) OVER () AS __summary_upcoming,
       sum(valor_pago) OVER () AS __summary_paid,
       sum(CASE WHEN status NOT IN ('cancelado', 'renegociado') THEN valor ELSE 0 END) OVER () AS __summary_total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY ${erpListOrder('financeiro', input.sort, 'data_vencimento ASC NULLS LAST')}, parcela_id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.parcela_id),
    conta_id: String(row.conta_id),
    parcela_id: String(row.parcela_id ?? ''),
    conta_financeira_id: String(row.conta_financeira_id ?? ''),
    metodo_pagamento_id: String(row.metodo_pagamento_id ?? ''),
    descricao: String(row.descricao ?? ''),
    documento: String(row.numero_documento ?? ''),
    cliente: String(row.cliente ?? ''),
    entidade_id: String(row.entidade_id ?? ''),
    categoria: String(row.categoria ?? ''),
    parcela: Number(row.numero_parcela ?? 0),
    vencimento: dateText(row.data_vencimento) || '',
    valor: Number(row.valor ?? 0),
    valor_pago: Number(row.valor_pago ?? 0),
    credito: Number(row.credito ?? 0),
    renegociado: Number(row.renegociado ?? 0),
    saldo: Number(row.saldo ?? 0),
    origem: String(row.origem ?? ''),
    tipo_lancamento: String(row.tipo_lancamento ?? 'efetivo'),
    recebimento_previsto_id: String(row.recebimento_previsto_id ?? ''),
    valor_bruto: Number(row.valor_bruto ?? 0),
    valor_liquido_previsto: Number(row.valor_liquido_previsto ?? 0),
    juros_previstos: Number(row.juros_previstos ?? 0),
    multa_prevista: Number(row.multa_prevista ?? 0),
    desconto_previsto: Number(row.desconto_previsto ?? 0),
    taxa_prevista: Number(row.taxa_prevista ?? 0),
    status: String(row.status ?? ''),
    __total: Number(row.__total ?? 0),
    __summary_overdue: Number(row.__summary_overdue ?? 0),
    __summary_due_today: Number(row.__summary_due_today ?? 0),
    __summary_upcoming: Number(row.__summary_upcoming ?? 0),
    __summary_paid: Number(row.__summary_paid ?? 0),
    __summary_total: Number(row.__summary_total ?? 0),
  }))
}
export async function listPayables(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const origin = optionalText(input.filters?.origem)
  const launchType = optionalText(input.filters?.tipo_lancamento)
  const dueStart = dateText(input.filters?.vencimento_inicio)
  const dueEnd = dateText(input.filters?.vencimento_fim)
  const originClause = origin ? ` AND contas.origem = $${params.push(origin)}` : ''
  const launchTypeClause = launchType ? ` AND contas.tipo_lancamento = $${params.push(launchType)}` : ''
  const dueStartClause = dueStart ? ` AND parcelas.data_vencimento >= $${params.push(dueStart)}` : ''
  const dueEndClause = dueEnd ? ` AND parcelas.data_vencimento <= $${params.push(dueEnd)}` : ''
  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         contas.id::text AS conta_id,
         parcelas.id::text AS parcela_id,
         parcelas.conta_financeira_id::text,
         parcelas.metodo_pagamento_id::text,
         contas.descricao,
         contas.numero_documento,
         contas.origem,
         contas.tipo_lancamento,
         parcelas.numero_parcela,
         parcelas.data_vencimento,
         composicao.valor,
         composicao.dinheiro AS valor_pago,
         composicao.credito,
         composicao.transferido AS renegociado,
         composicao.saldo,
         parcelas.valor_bruto,
         parcelas.valor_liquido AS valor_liquido_previsto,
         parcelas.juros AS juros_previstos,
         parcelas.multa AS multa_prevista,
         parcelas.desconto AS desconto_previsto,
         parcelas.taxa AS taxa_prevista,
         parcelas.parcela_prevista_id::text,
         CASE
           WHEN contas.status = 'cancelado' OR parcelas.status = 'cancelado' THEN 'cancelado'
           WHEN composicao.transferido > 0 THEN 'renegociado'
           WHEN composicao.saldo = 0 THEN 'pago'
           WHEN parcelas.data_vencimento < ${ERP_TODAY_SQL} THEN 'vencido'
           WHEN composicao.dinheiro + composicao.credito > 0 THEN 'parcial'
           ELSE parcelas.status
         END AS status,
         entidades.nome AS fornecedor,
         entidades.id::text AS entidade_id,
         categorias.nome AS categoria,
         centros.nome AS centro_custo,
         financeiras.nome AS conta_financeira,
         concat_ws(' ', contas.descricao, contas.numero_documento, entidades.nome, contas.status, contas.origem) AS searchable
       FROM erp.contas_pagar AS contas
       JOIN erp.entidades AS entidades
         ON entidades.empresa_id = contas.empresa_id
        AND entidades.id = contas.fornecedor_id
       JOIN erp.contas_pagar_parcelas AS parcelas
         ON parcelas.empresa_id = contas.empresa_id
        AND parcelas.conta_pagar_id = contas.id
        AND parcelas.excluido_em IS NULL
       ${financialCompositionSql('pagar')}
       LEFT JOIN erp.categorias AS categorias
         ON categorias.empresa_id = contas.empresa_id AND categorias.id = contas.categoria_id
       LEFT JOIN erp.centros_custo AS centros
         ON centros.empresa_id = contas.empresa_id AND centros.id = contas.centro_custo_id
       LEFT JOIN erp.contas_financeiras AS financeiras
         ON financeiras.empresa_id = parcelas.empresa_id AND financeiras.id = parcelas.conta_financeira_id
       WHERE contas.empresa_id = $1
         AND contas.excluido_em IS NULL
         ${originClause}
         ${launchTypeClause}
         ${dueStartClause}
         ${dueEndClause}
     )
     SELECT conta_id, parcela_id, conta_financeira_id, metodo_pagamento_id, descricao, numero_documento, origem, tipo_lancamento,
       numero_parcela, data_vencimento, valor, valor_pago, credito, renegociado, saldo,
       valor_bruto, valor_liquido_previsto, juros_previstos, multa_prevista, desconto_previsto,
       taxa_prevista, parcela_prevista_id, status, fornecedor, entidade_id,
       categoria, centro_custo, conta_financeira, count(*) OVER ()::int AS __total,
       sum(CASE WHEN status = 'vencido' THEN saldo ELSE 0 END) OVER () AS __summary_overdue,
       sum(CASE WHEN data_vencimento = ${ERP_TODAY_SQL} AND status NOT IN ('pago', 'cancelado', 'renegociado') THEN saldo ELSE 0 END) OVER () AS __summary_due_today,
       sum(CASE WHEN data_vencimento > ${ERP_TODAY_SQL} AND status NOT IN ('pago', 'cancelado', 'renegociado') THEN saldo ELSE 0 END) OVER () AS __summary_upcoming,
       sum(valor_pago) OVER () AS __summary_paid,
       sum(CASE WHEN status NOT IN ('cancelado', 'renegociado') THEN valor ELSE 0 END) OVER () AS __summary_total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendRecordStatusFilter(params, input.filters)}
     ORDER BY ${erpListOrder('financeiro', input.sort, 'data_vencimento ASC NULLS LAST')}, parcela_id DESC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.parcela_id),
    conta_id: String(row.conta_id),
    parcela_id: String(row.parcela_id ?? ''),
    conta_financeira_id: String(row.conta_financeira_id ?? ''),
    metodo_pagamento_id: String(row.metodo_pagamento_id ?? ''),
    descricao: String(row.descricao ?? ''),
    documento: String(row.numero_documento ?? ''),
    fornecedor: String(row.fornecedor ?? ''),
    entidade_id: String(row.entidade_id ?? ''),
    parcela: Number(row.numero_parcela ?? 0),
    vencimento: dateText(row.data_vencimento) || '',
    valor: Number(row.valor ?? 0),
    valor_pago: Number(row.valor_pago ?? 0),
    credito: Number(row.credito ?? 0),
    renegociado: Number(row.renegociado ?? 0),
    saldo: Number(row.saldo ?? 0),
    origem: String(row.origem ?? ''),
    tipo_lancamento: String(row.tipo_lancamento ?? ''),
    parcela_prevista_id: String(row.parcela_prevista_id ?? ''),
    valor_bruto: Number(row.valor_bruto ?? 0),
    valor_liquido_previsto: Number(row.valor_liquido_previsto ?? 0),
    juros_previstos: Number(row.juros_previstos ?? 0),
    multa_prevista: Number(row.multa_prevista ?? 0),
    desconto_previsto: Number(row.desconto_previsto ?? 0),
    taxa_prevista: Number(row.taxa_prevista ?? 0),
    categoria: String(row.categoria ?? ''),
    centro_custo: String(row.centro_custo ?? ''),
    conta_financeira: String(row.conta_financeira ?? ''),
    status: String(row.status ?? ''),
    __total: Number(row.__total ?? 0),
    __summary_overdue: Number(row.__summary_overdue ?? 0),
    __summary_due_today: Number(row.__summary_due_today ?? 0),
    __summary_upcoming: Number(row.__summary_upcoming ?? 0),
    __summary_paid: Number(row.__summary_paid ?? 0),
    __summary_total: Number(row.__summary_total ?? 0),
  }))
}
export async function listFinancialAccountRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  const params: unknown[] = [input.tenantId]
  const tipo = text(input.filters?.tipo)
  let typeSql = ''
  if (tipo && tipo !== '__all__') {
    params.push(tipo)
    typeSql = ` AND tipo = $${params.length}`
  }

  const rows = await runQuery<Record<string, unknown>>(
    `WITH rows AS (
       SELECT
         id::text,
         nome,
         tipo,
         banco,
         agencia,
         conta,
         saldo_inicial,
         coalesce((SELECT a.codigo||' - '||a.nome FROM erp.contas_contabeis a WHERE a.empresa_id=contas_financeiras.empresa_id AND a.id=contas_financeiras.conta_contabil_id),'') conta_contabil,
         padrao,
         versao,
         ativo,
         concat_ws(' ', nome, tipo, banco, agencia, conta) AS searchable
       FROM erp.contas_financeiras
       WHERE empresa_id = $1
         AND excluido_em IS NULL
     )
     SELECT id, nome, tipo, banco, agencia, conta, saldo_inicial, conta_contabil, padrao, versao, ativo,
       count(*) OVER ()::int AS __total
     FROM rows
     WHERE true${appendSearch(params, input.query)}${appendStatusFilter(input.filters)}${typeSql}
     ORDER BY nome ASC, id ASC${appendPagination(params, input)}`,
    params,
  )

  return rows.map((row) => ({
    id: String(row.id),
    nome: String(row.nome ?? ''),
    tipo: String(row.tipo ?? ''),
    banco: String(row.banco ?? ''),
    conta_contabil: String(row.conta_contabil ?? ''),
    agencia: String(row.agencia ?? ''),
    conta: String(row.conta ?? ''),
    saldo_inicial: Number(row.saldo_inicial ?? 0),
    padrao: row.padrao ? 'Sim' : 'Nao',
    versao: Number(row.versao ?? 1),
    status: row.ativo ? 'ativo' : 'inativo',
    __total: Number(row.__total ?? 0),
  }))
}
// Categoria financeira que aceita lançamento: ativa e sem subcategorias (lançamento só no nível mais detalhado).
export const FINANCIAL_CATEGORY_LEAF_SQL = `NOT EXISTS (SELECT 1 FROM erp.categorias filhas WHERE filhas.empresa_id = categorias.empresa_id
  AND filhas.categoria_pai_id = categorias.id AND filhas.excluido_em IS NULL AND filhas.ativo)`
// Estrutura para a tela de categorias financeiras: grupos da DRE (na ordem da empresa) e categorias principais
// (possíveis categorias-pai).
export async function listFinancialCategoryStructure(tenantId: number) {
  const [groups, roots] = await Promise.all([
    runQuery<{ id: string; codigo: number; nome: string }>('SELECT id::text, codigo, nome FROM erp.dre_grupos WHERE empresa_id = $1 ORDER BY ordem, codigo', [tenantId]),
    runQuery<{ id: string; nome: string; tipo: string }>(
      `SELECT id::text, nome, tipo FROM erp.categorias WHERE empresa_id = $1 AND categoria_pai_id IS NULL AND ativo AND excluido_em IS NULL ORDER BY tipo DESC, nome`, [tenantId]),
  ])
  return {
    grupos: [...groups.map(group => ({ value: group.id, label: `${group.codigo}. ${group.nome}`, codigo: group.codigo })),
      { value: 'fora', label: 'Não entra na DRE (empréstimo, aporte, lucros, equipamento)' },
      { value: 'nao_classificado', label: 'Não classificado (definir depois)' }],
    raizes: [{ value: 'nenhuma', label: 'Nenhuma: é uma categoria principal' },
      ...roots.map(root => ({ value: root.id, label: `${root.tipo === 'receita' ? 'Receita' : 'Despesa'} · ${root.nome}`, tipo: root.tipo }))],
  }
}
// Classificação de uma categoria financeira recebida da tela ou do chat: tipo, categoria-pai, grupo da DRE
// (ou "fora" = não entra na DRE). A subcategoria herda o grupo da pai (o banco garante).
export async function financialCategoryClassification(client: Pick<SQLClient, 'query'>, tenantId: number, values: Record<string, unknown>, id?: number) {
  const tipo = text(values.tipo)
  if (tipo !== 'receita' && tipo !== 'despesa') throw new ErpDomainError('VALIDATION_ERROR', 'Categoria financeira é de receita ou de despesa.')
  const parentId = optionalNumericId(values.categoria_pai_id)
  if (parentId) {
    const parent = await client.query('SELECT tipo, categoria_pai_id FROM erp.categorias WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL', [tenantId, parentId])
    if (!parent.rows[0]) throw new ErpDomainError('INVALID_REFERENCE', 'Categoria-pai não encontrada.', 422)
    if (parent.rows[0].tipo !== tipo) throw new ErpDomainError('VALIDATION_ERROR', 'A subcategoria precisa ser do mesmo tipo da categoria-pai.')
    if (parent.rows[0].categoria_pai_id) throw new ErpDomainError('VALIDATION_ERROR', 'Categorias têm no máximo 2 níveis: escolha uma categoria principal como pai.')
    if (id && parentId === id) throw new ErpDomainError('VALIDATION_ERROR', 'Categoria não pode ser pai dela mesma.')
  }
  // Prioridade: fora da DRE explícito > código do grupo (chat) > grupo escolhido na tela ('fora' = não entra na DRE).
  const code = Number(values.dre_grupo_codigo)
  const hasCode = Number.isInteger(code) && code >= 1 && code <= 9
  const group = values.fora_dre === true ? 'fora' : hasCode || values.fora_dre === false && text(values.dre_grupo_id) === 'fora' ? '' : text(values.dre_grupo_id)
  const outsideDre = group === 'fora'
  let groupId: number | null = null
  if (!outsideDre && hasCode) {
    const found = await client.query('SELECT id FROM erp.dre_grupos WHERE empresa_id = $1 AND codigo = $2', [tenantId, code])
    groupId = Number(found.rows[0]?.id) || null
  } else if (!outsideDre && group && group !== 'nao_classificado') {
    groupId = numericId(group, 'Grupo da DRE')
    const found = await client.query('SELECT id FROM erp.dre_grupos WHERE empresa_id = $1 AND id = $2', [tenantId, groupId])
    if (!found.rows[0]) throw new ErpDomainError('INVALID_REFERENCE', 'Grupo da DRE não encontrado.', 422)
  }
  return { tipo, parentId, groupId: parentId ? null : groupId, outsideDre: parentId ? false : outsideDre }
}
function paymentAdjustment(value: unknown) {
  return nonNegativeDecimal(value === undefined || value === null || value === '' ? 0 : value)
}
export function paymentMethodId(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
function paymentOrigin(value: unknown) {
  const normalized = text(value).toLowerCase()
  if (['manual', 'conciliacao', 'boleto', 'pix', 'cartao', 'api'].includes(normalized)) return normalized
  return 'manual'
}
function paymentNetValue(amount: number, values: Record<string, unknown>) {
  const juros = paymentAdjustment(values.juros)
  const multa = paymentAdjustment(values.multa)
  const desconto = paymentAdjustment(values.desconto)
  const taxa = paymentAdjustment(values.taxa)
  const netValue = paymentTotal(amount, juros, multa, desconto, taxa, 'receber')
  if (netValue < 0) throw new ErpDomainError('VALIDATION_ERROR', 'Desconto e taxa não podem superar o valor recebido.')
  return netValue
}
function payablePaymentNetValue(amount: number, values: Record<string, unknown>) {
  const juros = paymentAdjustment(values.juros)
  const multa = paymentAdjustment(values.multa)
  const desconto = paymentAdjustment(values.desconto)
  const taxa = paymentAdjustment(values.taxa)
  const netValue = paymentTotal(amount, juros, multa, desconto, taxa, 'pagar')
  if (netValue < 0) throw new ErpDomainError('VALIDATION_ERROR', 'O desconto não pode superar o valor do pagamento.')
  return netValue
}
async function recalculateReceivableInstallment(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  installmentId: string | number,
  actorId: number,
  paymentDate?: string | null,
) {
  const result = await client.query(
    `WITH totals AS (
       SELECT composicao.* FROM erp.contas_receber_parcelas parcelas
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id=$1 AND parcelas.id=$2
     )
     UPDATE erp.contas_receber_parcelas AS parcelas
     SET
       valor_pago = totals.dinheiro,
       data_pagamento = CASE
         WHEN totals.saldo = 0 THEN COALESCE($4::date, parcelas.data_pagamento, ${ERP_TODAY_SQL})
         ELSE NULL
       END,
       status = CASE
         WHEN totals.transferido > 0 THEN 'renegociado'
         WHEN totals.saldo = 0 THEN 'pago'
         WHEN parcelas.data_vencimento < ${ERP_TODAY_SQL} THEN 'vencido'
         WHEN totals.dinheiro + totals.credito > 0 THEN 'parcial'
         ELSE 'aberto'
       END,
       atualizado_por = $3
     FROM totals
     WHERE parcelas.empresa_id = $1
       AND parcelas.id = $2
     RETURNING parcelas.id::text, parcelas.conta_receber_id::text, parcelas.valor, parcelas.valor_pago, parcelas.status`,
    [tenantId, installmentId, actorId, paymentDate || null],
  )
  return result.rows[0] as Record<string, unknown>
}
async function recalculatePayableInstallment(
  client: Pick<SQLClient, 'query'>,
  tenantId: number,
  installmentId: string | number,
  actorId: number,
  paymentDate?: string | null,
) {
  const result = await client.query(
    `WITH totals AS (
       SELECT composicao.* FROM erp.contas_pagar_parcelas parcelas
       ${financialCompositionSql('pagar')}
       WHERE parcelas.empresa_id=$1 AND parcelas.id=$2
     )
     UPDATE erp.contas_pagar_parcelas AS parcelas
     SET
       valor_pago = totals.dinheiro,
       data_pagamento = CASE
         WHEN totals.saldo = 0 THEN COALESCE($4::date, parcelas.data_pagamento, ${ERP_TODAY_SQL})
         ELSE NULL
       END,
       status = CASE
         WHEN totals.transferido > 0 THEN 'renegociado'
         WHEN totals.saldo = 0 THEN 'pago'
         WHEN parcelas.data_vencimento < ${ERP_TODAY_SQL} THEN 'vencido'
         WHEN totals.dinheiro + totals.credito > 0 THEN 'parcial'
         ELSE 'aberto'
       END,
       atualizado_por = $3
     FROM totals
     WHERE parcelas.empresa_id = $1
       AND parcelas.id = $2
     RETURNING parcelas.id::text, parcelas.conta_pagar_id::text, parcelas.valor, parcelas.valor_pago, parcelas.status`,
    [tenantId, installmentId, actorId, paymentDate || null],
  )
  return result.rows[0] as Record<string, unknown>
}
export async function settleReceivableInstallment(input: SettleInstallmentInput) {
  const idempotencyKey = requireOperationKey(input.idempotencyKey || input.values.chave_idempotencia)
  const requestIdentity = settlementIdentity('receber', input.id, input.values)
  return withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`erp:pagamento:${input.tenantId}:${idempotencyKey}`])
    const existingPaymentResult = await client.query(
      `SELECT id::text, tipo, conta_receber_parcela_id::text, valor, valor_liquido, metadata
       FROM erp.pagamentos WHERE empresa_id=$1 AND chave_idempotencia=$2 LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    const existingPayment = existingPaymentResult.rows[0] as Record<string, unknown> | undefined
    if (existingPayment) {
      if (existingPayment.tipo !== 'receber' || String(existingPayment.conta_receber_parcela_id) !== String(input.id)) throw new ErpDomainError('IDEMPOTENCY_CONFLICT', 'Esta identificação já foi usada em outra baixa.', 409)
      assertSettlementReplay(existingPayment.metadata, requestIdentity)
    }
    const installmentResult = await client.query(
      `SELECT
         parcelas.id,
         parcelas.conta_receber_id,
         parcelas.valor,
         parcelas.valor_pago,
         parcelas.status,
         parcelas.conta_financeira_id,
         parcelas.metodo_pagamento_id,
         contas.tipo_lancamento,
         composicao.credito,
         composicao.transferido,
         composicao.saldo,
         -- The status people see, by the same rule as recalculation and the lists (overdue before partial).
         CASE WHEN parcelas.status = 'cancelado' THEN 'cancelado' WHEN composicao.transferido > 0 THEN 'renegociado' WHEN composicao.saldo = 0 THEN 'pago'
           WHEN parcelas.data_vencimento < ${ERP_TODAY_SQL} THEN 'vencido' WHEN composicao.dinheiro + composicao.credito > 0 THEN 'parcial' ELSE 'aberto' END AS status_atual
       FROM erp.contas_receber_parcelas AS parcelas
       JOIN erp.contas_receber AS contas
         ON contas.empresa_id = parcelas.empresa_id
        AND contas.id = parcelas.conta_receber_id
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id = $1
         AND parcelas.id = $2
         AND parcelas.excluido_em IS NULL
         AND contas.excluido_em IS NULL
       FOR UPDATE OF parcelas, contas`,
      [input.tenantId, input.id],
    )
    const installment = installmentResult.rows[0] as Record<string, unknown> | undefined
    if (!installment) throw new ErpDomainError('VALIDATION_ERROR', 'Parcela a receber não encontrada.')
    if (existingPayment) return {
      payment: { id: String(existingPayment.id), valor: existingPayment.valor, valor_liquido: existingPayment.valor_liquido },
      installment: { id: String(installment.id), conta_receber_id: String(installment.conta_receber_id), valor: installment.valor, valor_pago: installment.valor_pago, status: installment.status_atual },
    }
    const remaining = money(installment.saldo)
    const amount = requestIdentity.amount === 'remaining' ? remaining : paymentAdjustment(input.values.valor)
    // CR-09, CR-11, CR-12 (regras/contas-receber.ts): a mesma regra para receber e pagar.
    exigirRegra(validarBaixa({ situacao: String(installment.status), tipoLancamento: installment.tipo_lancamento as string | null, saldo: remaining, valor: amount }))

    const methodId = paymentMethodId(input.values.metodo_pagamento_id || installment.metodo_pagamento_id)
    // Cartão pela maquininha: o recebimento entra na conta da maquininha (a taxa e os repasses vêm depois).
    const card = await cardMethodConfig(client, input.tenantId, methodId)
    if (card && (paymentAdjustment(input.values.taxa) || 0) > 0) throw new ErpDomainError('VALIDATION_ERROR', 'Com esta forma de pagamento a taxa do cartão é calculada pelo ERP; não informe a taxa.')
    const financialAccountId = card ? card.conta_maquininha_id : await ensureFinancialAccountId(
      client,
      input.tenantId,
      input.actorId,
      input.values.conta_financeira_id || installment.conta_financeira_id,
    )
    const paymentDate = dateText(input.values.data_pagamento) || erpToday()
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: paymentDate })
    const netValue = paymentNetValue(amount, input.values)

    const paymentResult = await client.query(
      `INSERT INTO erp.pagamentos (
         empresa_id,
         tipo,
         origem,
         chave_idempotencia,
         conta_receber_parcela_id,
         conta_financeira_id,
         metodo_pagamento_id,
         data_pagamento,
         valor,
         juros,
         multa,
         desconto,
         taxa,
         valor_liquido,
         criado_por,
         atualizado_por,
         metadata
       )
       VALUES ($1, 'receber', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14, $15::jsonb)
       RETURNING id::text, valor, valor_liquido`,
      [
        input.tenantId,
        paymentOrigin(input.values.origem),
        idempotencyKey,
        installment.id,
        financialAccountId,
        methodId,
        paymentDate,
        amount,
        paymentAdjustment(input.values.juros),
        paymentAdjustment(input.values.multa),
        paymentAdjustment(input.values.desconto),
        paymentAdjustment(input.values.taxa),
        netValue,
        input.actorId,
        JSON.stringify({ settlementRequest: requestIdentity }),
      ],
    )

// Uma conta/método já iguais não devem atualizar o resumo antes do recálculo.
    await client.query(
      `UPDATE erp.contas_receber_parcelas
       SET
         conta_financeira_id = $3,
         metodo_pagamento_id = $4,
         atualizado_por = $5
       WHERE empresa_id = $1
         AND id = $2
         AND (conta_financeira_id IS DISTINCT FROM $3::bigint OR metodo_pagamento_id IS DISTINCT FROM $4::bigint)`,
      [input.tenantId, installment.id, financialAccountId, methodId, input.actorId],
    )
    const updatedInstallment = await recalculateReceivableInstallment(
      client,
      input.tenantId,
      String(installment.id),
      input.actorId,
      paymentDate,
    )
    await updateReceivableStatus(client, input.tenantId, String(updatedInstallment.conta_receber_id), input.actorId)
    const cardResult = card ? await applyCardReceipt(client, {
      tenantId: input.tenantId, actorId: input.actorId, paymentId: Number(paymentResult.rows[0].id), gross: netValue, date: paymentDate,
      installments: input.values.parcelas_cartao, config: card, settlePayable: settlePayableInstallment,
    }) : null

    return {
      payment: paymentResult.rows[0],
      installment: updatedInstallment,
      ...(cardResult ? { cartao: cardResult } : {}),
    }
  })
}
export async function settlePayableInstallment(input: SettleInstallmentInput) {
  const idempotencyKey = requireOperationKey(input.idempotencyKey || input.values.chave_idempotencia)
  const requestIdentity = settlementIdentity('pagar', input.id, input.values)
  return withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`erp:pagamento:${input.tenantId}:${idempotencyKey}`])
    const existingPaymentResult = await client.query(
      `SELECT id::text, tipo, conta_pagar_parcela_id::text, valor, valor_liquido, metadata
       FROM erp.pagamentos WHERE empresa_id=$1 AND chave_idempotencia=$2 LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    const existingPayment = existingPaymentResult.rows[0] as Record<string, unknown> | undefined
    if (existingPayment) {
      if (existingPayment.tipo !== 'pagar' || String(existingPayment.conta_pagar_parcela_id) !== String(input.id)) throw new ErpDomainError('IDEMPOTENCY_CONFLICT', 'Esta identificação já foi usada em outra baixa.', 409)
      assertSettlementReplay(existingPayment.metadata, requestIdentity)
    }
    const installmentResult = await client.query(
      `SELECT
         parcelas.id,
         parcelas.conta_pagar_id,
         parcelas.valor,
         parcelas.valor_pago,
         parcelas.status,
         parcelas.conta_financeira_id,
         parcelas.metodo_pagamento_id,
         contas.tipo_lancamento,
         composicao.credito,
         composicao.transferido,
         composicao.saldo,
         -- The status people see, by the same rule as recalculation and the lists (overdue before partial).
         CASE WHEN parcelas.status = 'cancelado' THEN 'cancelado' WHEN composicao.transferido > 0 THEN 'renegociado' WHEN composicao.saldo = 0 THEN 'pago'
           WHEN parcelas.data_vencimento < ${ERP_TODAY_SQL} THEN 'vencido' WHEN composicao.dinheiro + composicao.credito > 0 THEN 'parcial' ELSE 'aberto' END AS status_atual
       FROM erp.contas_pagar_parcelas AS parcelas
       JOIN erp.contas_pagar AS contas
         ON contas.empresa_id = parcelas.empresa_id
        AND contas.id = parcelas.conta_pagar_id
       ${financialCompositionSql('pagar')}
       WHERE parcelas.empresa_id = $1
         AND parcelas.id = $2
         AND parcelas.excluido_em IS NULL
         AND contas.excluido_em IS NULL
       FOR UPDATE OF parcelas, contas`,
      [input.tenantId, input.id],
    )
    const installment = installmentResult.rows[0] as Record<string, unknown> | undefined
    if (!installment) throw new ErpDomainError('VALIDATION_ERROR', 'Parcela a pagar não encontrada.')
    if (existingPayment) return {
      payment: { id: String(existingPayment.id), valor: existingPayment.valor, valor_liquido: existingPayment.valor_liquido },
      installment: { id: String(installment.id), conta_pagar_id: String(installment.conta_pagar_id), valor: installment.valor, valor_pago: installment.valor_pago, status: installment.status_atual },
    }
    const remaining = money(installment.saldo)
    const amount = requestIdentity.amount === 'remaining' ? remaining : paymentAdjustment(input.values.valor)
    // CR-09, CR-11, CR-12 (regras/contas-receber.ts): a mesma regra para receber e pagar.
    exigirRegra(validarBaixa({ situacao: String(installment.status), tipoLancamento: installment.tipo_lancamento as string | null, saldo: remaining, valor: amount }))

    const financialAccountId = await ensureFinancialAccountId(
      client,
      input.tenantId,
      input.actorId,
      input.values.conta_financeira_id || installment.conta_financeira_id,
    )
    const methodId = paymentMethodId(input.values.metodo_pagamento_id || installment.metodo_pagamento_id)
    const paymentDate = dateText(input.values.data_pagamento) || erpToday()
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: paymentDate })
    const netValue = payablePaymentNetValue(amount, input.values)

    const paymentResult = await client.query(
      `INSERT INTO erp.pagamentos (
         empresa_id,
         tipo,
         origem,
         chave_idempotencia,
         conta_pagar_parcela_id,
         conta_financeira_id,
         metodo_pagamento_id,
         data_pagamento,
         valor,
         juros,
         multa,
         desconto,
         taxa,
         valor_liquido,
         criado_por,
         atualizado_por,
         metadata
       )
       VALUES ($1, 'pagar', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14, $15::jsonb)
       RETURNING id::text, valor, valor_liquido`,
      [
        input.tenantId,
        paymentOrigin(input.values.origem),
        idempotencyKey,
        installment.id,
        financialAccountId,
        methodId,
        paymentDate,
        amount,
        paymentAdjustment(input.values.juros),
        paymentAdjustment(input.values.multa),
        paymentAdjustment(input.values.desconto),
        paymentAdjustment(input.values.taxa),
        netValue,
        input.actorId,
        JSON.stringify({ settlementRequest: requestIdentity }),
      ],
    )

// Uma conta/método já iguais não devem atualizar o resumo antes do recálculo.
    await client.query(
      `UPDATE erp.contas_pagar_parcelas
       SET
         conta_financeira_id = $3,
         metodo_pagamento_id = $4,
         atualizado_por = $5
       WHERE empresa_id = $1
         AND id = $2
         AND (conta_financeira_id IS DISTINCT FROM $3::bigint OR metodo_pagamento_id IS DISTINCT FROM $4::bigint)`,
      [input.tenantId, installment.id, financialAccountId, methodId, input.actorId],
    )
    const updatedInstallment = await recalculatePayableInstallment(
      client,
      input.tenantId,
      String(installment.id),
      input.actorId,
      paymentDate,
    )
    await updatePayableStatus(client, input.tenantId, String(updatedInstallment.conta_pagar_id), input.actorId)

    return {
      payment: paymentResult.rows[0],
      installment: updatedInstallment,
    }
  })
}
export async function reverseErpPayment(input: ReversePaymentInput) {
  return withTransaction(async (client) => {
    const paymentResult = await client.query(
      `SELECT
         id,
         tipo,
         conta_receber_parcela_id,
         conta_pagar_parcela_id,
         conta_financeira_id,
         metodo_pagamento_id,
         valor,
         juros,
         multa,
         desconto,
         taxa,
         valor_liquido,
         data_pagamento,
         estornado_em,
         estorno_de_pagamento_id
       FROM erp.pagamentos
       WHERE empresa_id = $1
         AND id = $2
         AND excluido_em IS NULL
       FOR UPDATE`,
      [input.tenantId, input.id],
    )
    const payment = paymentResult.rows[0] as Record<string, unknown> | undefined
    if (!payment) throw new ErpDomainError('VALIDATION_ERROR', 'Pagamento não encontrado.')
    if (payment.estorno_de_pagamento_id) throw new ErpDomainError('VALIDATION_ERROR', 'Um estorno não pode ser estornado diretamente.')

    if (payment.estornado_em) {
      const existingReversal = await client.query(
        `SELECT id::text, tipo, valor, valor_liquido, estorno_de_pagamento_id::text
         FROM erp.pagamentos
         WHERE empresa_id = $1
           AND estorno_de_pagamento_id = $2
           AND excluido_em IS NULL
         ORDER BY id ASC
         LIMIT 1`,
        [input.tenantId, payment.id],
      )
      return { payment, reversal: existingReversal.rows[0] || null }
    }

    const reversalDate = erpToday()
    await assertErpPeriodOpen(client, { tenantId: input.tenantId, module: 'financeiro', date: reversalDate })

    const receivableInstallmentId = payment.conta_receber_parcela_id
    const payableInstallmentId = payment.conta_pagar_parcela_id
    const installmentTable = payment.tipo === 'receber' ? 'erp.contas_receber_parcelas' : 'erp.contas_pagar_parcelas'
    const installmentId = payment.tipo === 'receber' ? receivableInstallmentId : payableInstallmentId
    await client.query(
      `SELECT id FROM ${installmentTable} WHERE empresa_id = $1 AND id = $2 FOR UPDATE`,
      [input.tenantId, installmentId],
    )

    const idempotencyKey = requireOperationKey(input.idempotencyKey)
    const reason = optionalText(input.reason)
    if (!reason) throw new ErpDomainError('VALIDATION_ERROR', 'Informe o motivo do estorno.')
    await client.query(
      `UPDATE erp.pagamentos
       SET estornado_em = now(), atualizado_por = $3
       WHERE empresa_id = $1 AND id = $2 AND estornado_em IS NULL`,
      [input.tenantId, payment.id, input.actorId],
    )
    const reversalResult = await client.query(
      `INSERT INTO erp.pagamentos (
         empresa_id,
         tipo,
         origem,
         chave_idempotencia,
         conta_receber_parcela_id,
         conta_pagar_parcela_id,
         conta_financeira_id,
         metodo_pagamento_id,
         data_pagamento,
         valor,
         juros,
         multa,
         desconto,
         taxa,
         valor_liquido,
         estorno_de_pagamento_id,
         motivo_estorno,
         criado_por,
         atualizado_por
       )
       VALUES ($1, $2, 'estorno', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)
       RETURNING id::text, tipo, valor, valor_liquido, estorno_de_pagamento_id::text`,
      [
        input.tenantId,
        payment.tipo,
        idempotencyKey,
        receivableInstallmentId,
        payableInstallmentId,
        payment.conta_financeira_id,
        payment.metodo_pagamento_id,
        reversalDate,
        payment.valor,
        payment.juros,
        payment.multa,
        payment.desconto,
        payment.taxa,
        payment.valor_liquido,
        payment.id,
        reason,
        input.actorId,
      ],
    )

    if (payment.tipo === 'receber') {
      const installment = await recalculateReceivableInstallment(
        client,
        input.tenantId,
        String(receivableInstallmentId),
        input.actorId,
      )
      await updateReceivableStatus(client, input.tenantId, String(installment.conta_receber_id), input.actorId)
    } else {
      const installment = await recalculatePayableInstallment(
        client,
        input.tenantId,
        String(payableInstallmentId),
        input.actorId,
      )
      await updatePayableStatus(client, input.tenantId, String(installment.conta_pagar_id), input.actorId)
    }

    // Recebimento no cartão: cancela os repasses pendentes e estorna a taxa.
    if (payment.tipo === 'receber') await cancelCardReceipt(client, { tenantId: input.tenantId, actorId: input.actorId, paymentId: Number(payment.id), reversePayment: reverseErpPayment })

    return { payment: { ...payment, estornado_em: new Date().toISOString() }, reversal: reversalResult.rows[0] }
  })
}
export async function createFinancialAccountRecord(client: SQLClient, input: CreateInput) {
  assertRequired(input.values.nome, 'Nome da conta financeira')
  const existingResult = await client.query(
    `SELECT id FROM erp.contas_financeiras WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL LIMIT 1`,
    [input.tenantId],
  )
  const shouldBeDefault = booleanValue(input.values.padrao) || !existingResult.rows[0]
  if (shouldBeDefault) {
    await client.query(
      `UPDATE erp.contas_financeiras SET padrao = false, atualizado_por = $2 WHERE empresa_id = $1 AND padrao = true`,
      [input.tenantId, input.actorId],
    )
  }
  const result = await client.query(
    `INSERT INTO erp.contas_financeiras (
       empresa_id,
       nome,
       tipo,
       banco,
       agencia,
       conta,
       digito,
       saldo_inicial,
       data_saldo_inicial,
       padrao,
       ativo,
       conta_contabil_id,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $13, $12, $12)
     RETURNING id`,
    [
      input.tenantId,
      text(input.values.nome),
      financialAccountType(input.values.tipo),
      optionalText(input.values.banco),
      optionalText(input.values.agencia),
      optionalText(input.values.conta),
      optionalText(input.values.digito),
      money(input.values.saldo_inicial),
      dateText(input.values.data_saldo_inicial),
      shouldBeDefault,
      activeFromStatus(input.values.status),
      input.actorId,
      accountingLink(input.values.conta_contabil_id),
    ],
  )
  return { id: String(result.rows[0]?.id) }
}
export async function createManualPayableRecord(client: SQLClient, input: CreateInput): Promise<ErpEntityRecord> {
  const idempotencyKey = normalizedIdempotencyKey(input.idempotencyKey || input.values.chave_idempotencia)
  let requestHash: string | null = null
  if (idempotencyKey) {
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, [`erp:conta-pagar:${input.tenantId}:${idempotencyKey}`])
    requestHash = await commercialRequest(client, input.tenantId, 'criar-conta-pagar-manual', idempotencyKey, Object.fromEntries(Object.entries(input.values).filter(([key]) => key !== 'chave_idempotencia')))
    const existing = await client.query(
      `SELECT parcelas.id::text, contas.descricao, entidades.nome AS fornecedor,
         parcelas.data_vencimento, parcelas.valor, parcelas.valor_pago, contas.origem,
         contas.tipo_lancamento, parcelas.status, contas.metadata
       FROM erp.contas_pagar AS contas
       JOIN erp.contas_pagar_parcelas AS parcelas
         ON parcelas.empresa_id = contas.empresa_id AND parcelas.conta_pagar_id = contas.id AND parcelas.excluido_em IS NULL
       JOIN erp.entidades AS entidades
         ON entidades.empresa_id = contas.empresa_id AND entidades.id = contas.fornecedor_id
       WHERE contas.empresa_id = $1 AND contas.chave_idempotencia = $2 AND contas.excluido_em IS NULL
       ORDER BY parcelas.numero_parcela LIMIT 1`,
      [input.tenantId, idempotencyKey],
    )
    if (existing.rows[0]) {
      const row = existing.rows[0]
      const metadata = jsonObject(row.metadata) as Record<string, unknown>
      assertOperationReplay(metadata.manualCreateRequest, requestHash)
      const originalResult = jsonObject(metadata.manualCreateResult) as Record<string, unknown>
      if (typeof originalResult.id === 'string') return originalResult as ErpEntityRecord
      return { id: String(row.id), descricao: String(row.descricao), fornecedor: String(row.fornecedor), vencimento: dateText(row.data_vencimento) || '', valor: Number(row.valor), valor_pago: Number(row.valor_pago), saldo: Number(row.valor) - Number(row.valor_pago), origem: String(row.origem), tipo_lancamento: String(row.tipo_lancamento), status: String(row.status) }
    }
  }
  const supplierId = numericId(input.values.fornecedor_id, 'Fornecedor')
  const description = optionalText(input.values.descricao)
  if (!description) throw new ErpDomainError('VALIDATION_ERROR', 'Descrição é obrigatória.')
  const total = positiveMoney(input.values.valor_total ?? input.values.valor)
  if (!total) throw new ErpDomainError('VALIDATION_ERROR', 'Valor precisa ser maior que zero.')
  const categoryId = numericId(input.values.categoria_id, 'Categoria')
  const competence = dateText(input.values.data_competencia) || erpToday()
  const issueDate = dateText(input.values.data_emissao) || competence
  const firstDueDate = dateText(input.values.data_vencimento) || competence

  const supplierResult = await client.query(
    `SELECT id, nome, documento FROM erp.entidades
     WHERE empresa_id = $1 AND id = $2 AND eh_fornecedor = true AND excluido_em IS NULL`,
    [input.tenantId, supplierId],
  )
  const supplier = supplierResult.rows[0]
  if (!supplier) throw new ErpDomainError('VALIDATION_ERROR', 'Fornecedor não encontrado.')

  const rawInstallments = Array.isArray(input.values.parcelas) && input.values.parcelas.length > 0
    ? input.values.parcelas
    : [{ numero_parcela: 1, descricao: 'Parcela 1', data_vencimento: firstDueDate, valor: total }]
  const installments = rawInstallments.map((raw, index) => {
    const row = raw as Record<string, unknown>
    const value = positiveMoney(row.valor)
    const dueDate = dateText(row.data_vencimento)
    if (!value || !dueDate) throw new ErpDomainError('VALIDATION_ERROR', `Parcela ${index + 1} invalida.`)
    return {
      numero: Number(row.numero_parcela || index + 1),
      descricao: optionalText(row.descricao) || `Parcela ${index + 1}`,
      vencimento: dueDate,
      valor: value,
      observacoes: optionalText(row.observacoes),
    }
  })
  // GE-11, GE-12 (regras/geral.ts)
  exigirRegra(validarParcelas({ valores: installments.map(i => i.valor), numeros: installments.map(i => i.numero), total, documento: 'da despesa' }))

  const recurrence = jsonObject(input.values.recorrencia) as Record<string, unknown>
  const repeat = booleanValue(input.values.repetir) || Object.keys(recurrence).length > 0
  const frequency = ['dia', 'semana', 'mes', 'ano'].includes(text(recurrence.frequencia)) ? text(recurrence.frequencia) : 'mes'
  const interval = Math.max(1, Number(recurrence.intervalo || 1))
  const endType = text(recurrence.termino_tipo) || 'ocorrencias'
  if (!['data','ocorrencias','indeterminado'].includes(endType)) throw new ErpDomainError('VALIDATION_ERROR','Término de recorrência inválido.')
  const occurrenceCount = endType === 'ocorrencias' ? Math.min(366, Math.max(1, Number(recurrence.quantidade_ocorrencias || 1))) : null
  const endDate = endType === 'data' ? dateText(recurrence.termino_em) : null
  if (endType === 'data' && (!endDate || endDate < competence)) throw new ErpDomainError('VALIDATION_ERROR','Informe uma data final igual ou posterior ao início.')
  let recurrenceId: number | null = null
  if (repeat) {
    const recurrenceResult = await client.query(
      `INSERT INTO erp.recorrencias_financeiras (
         empresa_id, tipo, intervalo, frequencia, inicio_em, termino_tipo,
         termino_em, quantidade_ocorrencias, proxima_competencia, gerado_ate,
         criado_por, atualizado_por, metadata
       ) VALUES ($1, 'pagar', $2, $3, $4, $10, $5, $6, $7, $4, $8, $8, $9::jsonb)
       RETURNING id`,
      [input.tenantId, interval, frequency, competence, endDate, occurrenceCount,
        occurrenceCount === 1 || (endDate && shiftDate(competence,frequency,interval,1)>endDate) ? null : shiftDate(competence, frequency, interval, 1), input.actorId,
        JSON.stringify({ descricao: description, modelo: { ...input.values, repetir: false, recorrencia: null } }),endType],
    )
    recurrenceId = Number(recurrenceResult.rows[0]?.id)
  }

  let firstInstallmentId = ''
  // Recorrencias sao materializadas uma competencia por vez pelo processador.
  for (let occurrence = 0; occurrence < 1; occurrence += 1) {
    const occurrenceCompetence = shiftDate(competence, frequency, interval, occurrence)
    const payableResult = await client.query(
      `INSERT INTO erp.contas_pagar (
         empresa_id, fornecedor_id, descricao, numero_documento, data_competencia,
         data_emissao, valor_total, status, categoria_id, centro_custo_id, observacoes,
         origem, tipo_lancamento, recorrencia_financeira_id, fornecedor_nome_snapshot,
         fornecedor_documento_snapshot, efetivado_em, chave_idempotencia, criado_por, atualizado_por, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'aberto', $8, $9, $10,
         $11, 'efetivo', $12, $13, $14, now(), $15, $16, $16, $17::jsonb)
       RETURNING id`,
      [
        input.tenantId,
        supplierId,
        description,
        optionalText(input.values.numero_documento),
        occurrenceCompetence,
        shiftDate(issueDate, frequency, interval, occurrence),
        total,
        categoryId,
        optionalNumericId(input.values.centro_custo_id),
        optionalText(input.values.observacoes),
        repeat ? 'recorrencia' : 'manual',
        recurrenceId,
        supplier.nome,
        supplier.documento,
        idempotencyKey ? (occurrence === 0 ? idempotencyKey : `${idempotencyKey}:${occurrence + 1}`) : null,
        input.actorId,
        JSON.stringify(requestHash ? { manualCreateRequest: requestHash } : {}),
      ],
    )
    const payableId = Number(payableResult.rows[0]?.id)

    for (const installment of installments) {
      const installmentResult = await client.query(
        `INSERT INTO erp.contas_pagar_parcelas (
           empresa_id, conta_pagar_id, numero_parcela, descricao, data_vencimento,
           data_pagamento_previsto, valor, valor_bruto, valor_liquido, valor_pago,
           status, conta_financeira_id, metodo_pagamento_id, observacoes, criado_por, atualizado_por
         ) VALUES ($1, $2, $3, $4, $5, $5, $6, $6, $6, 0, 'aberto', $7, $8, $9, $10, $10)
         RETURNING id::text`,
        [
          input.tenantId,
          payableId,
          installment.numero,
          installment.descricao,
          shiftDate(installment.vencimento, frequency, interval, occurrence),
          installment.valor,
          optionalNumericId(input.values.conta_financeira_id),
          optionalNumericId(input.values.metodo_pagamento_id),
          installment.observacoes,
          input.actorId,
        ],
      )
      if (!firstInstallmentId) firstInstallmentId = String(installmentResult.rows[0]?.id || '')
    }

    const rateios = Array.isArray(input.values.rateios) ? input.values.rateios : []
    if (rateios.length > 0) {
      const rateioTotal = Number(rateios.reduce((sum, raw) => sum + money((raw as Record<string, unknown>).valor), 0).toFixed(2))
      if (rateioTotal !== Number(total.toFixed(2))) throw new ErpDomainError('VALIDATION_ERROR', 'O rateio precisa distribuir o valor total da despesa.')
      for (const raw of rateios) {
        const rateio = raw as Record<string, unknown>
        await client.query(
          `INSERT INTO erp.rateios_financeiros (
             empresa_id, tipo, conta_pagar_id, categoria_id, centro_custo_id, valor,
             percentual, observacoes, criado_por, atualizado_por
           ) VALUES ($1, 'pagar', $2, $3, $4, $5, $6, $7, $8, $8)`,
          [input.tenantId, payableId, optionalNumericId(rateio.categoria_id), optionalNumericId(rateio.centro_custo_id), money(rateio.valor), rateio.percentual == null ? null : Number(rateio.percentual), optionalText(rateio.observacoes), input.actorId],
        )
      }
    }
  }

  if(recurrenceId)await client.query(`UPDATE erp.recorrencias_financeiras SET ativa=false,encerrada_em=now(),atualizado_por=$3 WHERE empresa_id=$1 AND id=$2 AND proxima_competencia IS NULL`,[input.tenantId,recurrenceId,input.actorId])
  const result: ErpEntityRecord = {
    id: firstInstallmentId,
    descricao: description,
    fornecedor: String(supplier.nome || ''),
    vencimento: firstDueDate,
    valor: total,
    valor_pago: 0,
    saldo: total,
    origem: repeat ? 'recorrencia' : 'manual',
    tipo_lancamento: 'efetivo',
    status: 'aberto',
  }
  if (requestHash) await client.query(`UPDATE erp.contas_pagar contas SET metadata=contas.metadata || jsonb_build_object('manualCreateResult',$3::jsonb)
    FROM erp.contas_pagar_parcelas parcelas WHERE contas.empresa_id=$1 AND parcelas.empresa_id=contas.empresa_id
      AND parcelas.conta_pagar_id=contas.id AND parcelas.id=$2`,[input.tenantId,firstInstallmentId,JSON.stringify(result)])
  return result
}
export async function processErpFinancialRecurrences(input: {
  tenantId: number
  actorId: number
  throughDate?: string
  limit?: number
}) {
  const throughDate = dateText(input.throughDate) || erpToday()
  const limit = Math.min(100, Math.max(1, Math.floor(Number(input.limit || 50))))
  return withTransaction(async (client) => {
    const recurrenceResult = await client.query(
      `SELECT * FROM erp.recorrencias_financeiras
       WHERE empresa_id = $1 AND ativa = true
         AND pausada_em IS NULL AND encerrada_em IS NULL AND excluido_em IS NULL
         AND proxima_competencia IS NOT NULL AND proxima_competencia <= $2
       ORDER BY proxima_competencia, id
           FOR UPDATE SKIP LOCKED
       LIMIT $3`,
      [input.tenantId, throughDate, limit],
    )
    let generated = 0
    const processed: Array<{ id: string; generated: number; next: string | null }> = []

    for (const recurrence of recurrenceResult.rows) {
      if (generated >= limit) break
      const metadata = jsonObject(recurrence.metadata) as Record<string, unknown>
      const model = jsonObject(metadata.modelo) as Record<string, unknown>
      if (Object.keys(model).length === 0) throw new ErpDomainError('RECURRENCE_MODEL_MISSING',`Recorrência ${recurrence.id}: modelo ausente. Revise a configuração.`,422)

      const countResult = await client.query(
        `SELECT count(*)::int AS total FROM erp.${recurrence.tipo === 'receber' ? 'contas_receber' : 'contas_pagar'}
         WHERE empresa_id = $1 AND recorrencia_financeira_id = $2`,
        [input.tenantId, recurrence.id],
      )
      let occurrence = Number(countResult.rows[0]?.total || 0)
      let next = dateText(recurrence.proxima_competencia)
      let generatedForRecurrence = 0
      const maxOccurrences = recurrence.termino_tipo === 'ocorrencias' ? Number(recurrence.quantidade_ocorrencias) : Infinity
      const frequency = text(recurrence.frequencia)
      const interval = Number(recurrence.intervalo || 1)
      const start = dateText(recurrence.inicio_em) || throughDate

      // The calendar, not the count of surviving documents, identifies an occurrence.
      occurrence = recurrenceOccurrenceIndex(start,next || start,frequency,interval)
      while (next && next <= throughDate && (!recurrence.termino_em || next <= dateText(recurrence.termino_em)!) && occurrence < maxOccurrences && generated < limit) {
        await assertErpPeriodOpen(client,{tenantId:input.tenantId,module:'financeiro',date:next})
        const shiftModelDate = (value: unknown) => {
          const date = dateText(value)
          return date ? shiftDate(date, frequency, interval, occurrence) : undefined
        }
        const installments = Array.isArray(model.parcelas)
          ? model.parcelas.map((raw) => {
            const row = raw as Record<string, unknown>
            return { ...row, data_vencimento: shiftModelDate(row.data_vencimento) }
          })
          : undefined
        const values = {
          ...model,
          repetir: false,
          recorrencia: null,
          data_competencia: next,
          data_emissao: shiftModelDate(model.data_emissao) || next,
          data_vencimento: shiftModelDate(model.data_vencimento) || next,
          parcelas: installments,
        }
        const idempotencyKey = `recorrencia:${recurrence.id}:${next}`
        if (recurrence.tipo === 'receber') {
          await createRecurringReceivable(client, {...input,recurrenceId:Number(recurrence.id),key:idempotencyKey,values})
        } else {
        const record = await createManualPayableRecord(client, {
          tenantId: input.tenantId, actorId: input.actorId, entityId: 'contas-a-pagar', values, idempotencyKey,
        })
        await client.query(
          `UPDATE erp.contas_pagar AS contas SET recorrencia_financeira_id = $3,
             origem = 'recorrencia', atualizado_por = $4
           FROM erp.contas_pagar_parcelas AS parcelas
           WHERE contas.empresa_id = $1 AND parcelas.empresa_id = contas.empresa_id
             AND parcelas.conta_pagar_id = contas.id AND parcelas.id = $2`,
          [input.tenantId, numericId(record.id, 'Parcela'), recurrence.id, input.actorId],
        )
        }
        generated += 1
        generatedForRecurrence += 1
        occurrence += 1
        next = occurrence < maxOccurrences ? shiftDate(start, frequency, interval, occurrence) : null
      }

      const endedByDate = Boolean(recurrence.termino_em && next && next > dateText(recurrence.termino_em)!)
      const ended = occurrence >= maxOccurrences || endedByDate
      await client.query(
        `UPDATE erp.recorrencias_financeiras SET proxima_competencia = $3,
           gerado_ate = $4, ativa = $5, encerrada_em = CASE WHEN $5 THEN NULL ELSE COALESCE(encerrada_em, now()) END,
           atualizado_por = $6
         WHERE empresa_id = $1 AND id = $2`,
        [input.tenantId, recurrence.id, ended ? null : next, generatedForRecurrence > 0 ? shiftDate(start, frequency, interval, occurrence - 1) : recurrence.gerado_ate,
          !ended, input.actorId],
      )
      processed.push({ id: String(recurrence.id), generated: generatedForRecurrence, next: ended ? null : next })
    }
    return { generated, throughDate, processed }
  })
}
export function recurrenceOccurrenceIndex(start:string,current:string,frequency:string,interval:number) {
  const a=new Date(`${start}T12:00:00Z`),b=new Date(`${current}T12:00:00Z`)
  const units=frequency==='dia'?(b.getTime()-a.getTime())/86400000:frequency==='semana'?(b.getTime()-a.getTime())/(86400000*7):frequency==='mes'?(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth():b.getUTCFullYear()-a.getUTCFullYear()
  const index=units/interval
  if (!Number.isInteger(index)||index<0||shiftDate(start,frequency,interval,index)!==current) throw new ErpDomainError('VALIDATION_ERROR','Próxima ocorrência fora do calendário da recorrência.')
  return index
}
async function createRecurringReceivable(client:SQLClient,input:{tenantId:number;actorId:number;recurrenceId:number;key:string;values:Record<string,unknown>}) {
  const existing=await client.query(`SELECT id FROM erp.contas_receber WHERE empresa_id=$1 AND recorrencia_financeira_id=$2 AND data_competencia=$3`,[input.tenantId,input.recurrenceId,input.values.data_competencia])
  if(existing.rows.length)return
  const total=positiveMoney(input.values.valor_total ?? input.values.valor),customer=numericId(input.values.cliente_id,'Cliente')
  const valid=await client.query(`SELECT id FROM erp.entidades WHERE empresa_id=$1 AND id=$2 AND eh_cliente AND excluido_em IS NULL`,[input.tenantId,customer])
  if(!valid.rows.length||!total)throw new ErpDomainError('VALIDATION_ERROR','Modelo recorrente exige cliente válido e valor positivo.')
  const parts=Array.isArray(input.values.parcelas)&&input.values.parcelas.length?input.values.parcelas as Record<string,unknown>[]:[{valor:total,data_vencimento:input.values.data_vencimento}]
  if(sumMoney(parts.map(p=>String(p.valor)))!==total)throw new ErpDomainError('VALIDATION_ERROR','Parcelas devem distribuir integralmente o valor da recorrência.')
  const title=await client.query(`INSERT INTO erp.contas_receber(empresa_id,cliente_id,descricao,valor_total,data_competencia,data_emissao,status,origem,recorrencia_financeira_id,chave_idempotencia,categoria_id,centro_custo_id,criado_por,atualizado_por)
    VALUES($1,$2,$3,$4,$5,$6,'aberto','api',$7,$8,$9,$10,$11,$11) RETURNING id`,[input.tenantId,customer,optionalText(input.values.descricao)||'Receita recorrente',total,input.values.data_competencia,input.values.data_emissao,input.recurrenceId,input.key,optionalNumericId(input.values.categoria_id),optionalNumericId(input.values.centro_custo_id),input.actorId])
  for(const [index,p] of parts.entries())await client.query(`INSERT INTO erp.contas_receber_parcelas(empresa_id,conta_receber_id,numero_parcela,data_vencimento,valor,valor_bruto,valor_liquido,status,conta_financeira_id,metodo_pagamento_id,criado_por,atualizado_por)
    VALUES($1,$2,$3,$4,$5,$5,$5,'aberto',$6,$7,$8,$8)`,[input.tenantId,title.rows[0].id,index+1,dateText(p.data_vencimento),positiveMoney(p.valor),optionalNumericId(input.values.conta_financeira_id),optionalNumericId(input.values.metodo_pagamento_id),input.actorId])
}

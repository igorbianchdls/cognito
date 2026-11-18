import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import { ERP_TODAY_SQL } from '@/products/erp/server/erpBusinessDate'
import { saveCustomerCommercialTerms } from '@/products/erp/server/erpCommercialRules'
import type { ErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import type { ErpEntityRecord } from '@/products/erp/shared/types'
import { accountingLink, accountingSummary, createAccountingAccount, listAccountingAccounts, lockAccountingCompany, updateAccountingAccount } from './erpAccountingRepository'
import { financialCompositionSql } from './erpFinancialComposition'
import { createPurchaseRecord, listPurchaseRecords } from './erpPurchasesRepository'
import { FINANCIAL_CATEGORY_LEAF_SQL, createFinancialAccountRecord, createManualPayableRecord, financialAccountType, financialCategoryClassification, listFinancialAccountRecords, listPayables, listReceivables } from './erpReceivablesPayablesRepository'
import { saveRegistrationRelations } from './erpRegistrationRelations'
import { REGISTRATION_CATEGORY_TYPES, appendRegistrationEvent, createCategoryRecord, createEntityRoleRecord, createProductRecord, createRegistrationCategoryRecord, createServiceRecord, entityRoleColumn, isEntityRoleModule, listCategoryRecords, listEntityRoleRecords, listProductRecords, listRegistrationCategoryRecords, listServiceRecords, productStockUnit, registrationCategoryValues, resolveServiceCategory, serviceFiscalCodes } from './erpRegistrationsRepository'
import { activeFromStatus, assertRequired, booleanValue, dateText, editableModuleTables, money, normalizePersonType, normalizedPage, normalizedPageSize, numericId, optionalText, resolveCategoryId, saveEntityCategory, text, type CreateInput, type EditableModuleId, type IdActionInput, type ListInput, type UpdateInput } from './erpRepositoryCore'
import { createSaleRecord, listSaleRecords } from './erpSalesRepository'
export { financialCompositionSql } from './erpFinancialComposition'
export { cancelErpPurchase, confirmErpPurchase, createOrUpdatePurchasePayable, getErpPurchaseDetails, importErpPurchaseInvoice, listErpPurchaseCatalogs, listErpPurchaseInvoices, returnErpPurchase, updateErpPurchaseDraft } from './erpPurchasesRepository'
export { FINANCIAL_CATEGORY_LEAF_SQL, listErpPayments, listFinancialCategoryStructure, processErpFinancialRecurrences, recurrenceOccurrenceIndex, reverseErpPayment, settlePayableInstallment, settleReceivableInstallment } from './erpReceivablesPayablesRepository'
export { listErpCategoryOptions, listRegistrationCategoryRoots } from './erpRegistrationsRepository'
export { shiftDate, type ConfirmErpSaleResult, type RegistrationCategoryType } from './erpRepositoryCore'
export { cancelErpSale, confirmErpSale, createSaleRecord, getErpSaleDetails, listErpSalesCatalogs, updateErpSaleDraft } from './erpSalesRepository'

export async function getErpOverview(tenantId: number) {
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT
      (SELECT COALESCE(sum(composicao.saldo), 0)
       FROM erp.contas_receber_parcelas AS parcelas
       JOIN erp.contas_receber AS contas ON contas.empresa_id = parcelas.empresa_id AND contas.id = parcelas.conta_receber_id
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id = $1 AND parcelas.status NOT IN ('pago', 'cancelado', 'renegociado')
         AND parcelas.excluido_em IS NULL AND contas.excluido_em IS NULL) AS saldo_receber,
      (SELECT COALESCE(sum(composicao.saldo), 0)
       FROM erp.contas_pagar_parcelas AS parcelas
       JOIN erp.contas_pagar AS contas ON contas.empresa_id = parcelas.empresa_id AND contas.id = parcelas.conta_pagar_id
       ${financialCompositionSql('pagar')}
       WHERE parcelas.empresa_id = $1 AND contas.tipo_lancamento='efetivo' AND parcelas.status NOT IN ('pago', 'cancelado', 'renegociado')
         AND parcelas.excluido_em IS NULL AND contas.excluido_em IS NULL) AS saldo_pagar,
      (SELECT COALESCE(sum(composicao.saldo), 0) FROM erp.contas_receber_parcelas parcelas
       ${financialCompositionSql('receber')}
       WHERE parcelas.empresa_id = $1 AND parcelas.data_vencimento < ${ERP_TODAY_SQL} AND parcelas.status NOT IN ('pago', 'cancelado', 'renegociado') AND parcelas.excluido_em IS NULL) AS receber_vencido,
      (SELECT count(*)::int FROM erp.vendas WHERE empresa_id = $1 AND status = 'rascunho' AND excluido_em IS NULL) AS vendas_rascunho,
      (SELECT count(*)::int FROM erp.compras WHERE empresa_id = $1 AND tipo_movimento IN ('cotacao', 'pedido_compra', 'pedido_recorrente') AND excluido_em IS NULL) AS compras_abertas,
      (SELECT count(*)::int FROM erp.entidades WHERE empresa_id = $1 AND eh_cliente = true AND ativo = true AND excluido_em IS NULL) AS clientes_ativos`,
    [tenantId],
  )
  const row = rows[0] || {}
  return {
    saldoReceber: Number(row.saldo_receber || 0), saldoPagar: Number(row.saldo_pagar || 0),
    receberVencido: Number(row.receber_vencido || 0), vendasRascunho: Number(row.vendas_rascunho || 0),
    comprasAbertas: Number(row.compras_abertas || 0), clientesAtivos: Number(row.clientes_ativos || 0),
  }
}
export async function listErpEntityRecords(input: ListInput): Promise<ErpEntityRecord[]> {
  if (isEntityRoleModule(input.entityId)) {
    return listEntityRoleRecords(input)
  }

  if (input.entityId === 'produtos') {
    return listProductRecords(input)
  }

  if (input.entityId === 'servicos') {
    return listServiceRecords(input)
  }

  if (input.entityId === 'categorias') {
    return listCategoryRecords(input)
  }

  if (input.entityId === 'categorias-cadastro') {
    return listRegistrationCategoryRecords(input)
  }

  if (input.entityId === 'pedidos') {
    return listSaleRecords(input)
  }

  if (input.entityId === 'pedidos-compra') {
    return listPurchaseRecords(input)
  }

  if (input.entityId === 'contas-a-receber') {
    return listReceivables(input)
  }

  if (input.entityId === 'contas-a-pagar') {
    return listPayables(input)
  }

  if (input.entityId === 'contas-contabeis') return listAccountingAccounts(input)
  if (input.entityId === 'contas-financeiras') {
    return listFinancialAccountRecords(input)
  }

  return []
}
export async function listErpEntityPage(input: ListInput) {
  const rawRecords = await listErpEntityRecords(input)
  // As contagens e os totais financeiros acompanham as linhas da consulta.
  // Uma pagina fora do intervalo nao tem linha para carrega-los: recuperar
  // somente a primeira pagina com os mesmos filtros preserva esses metadados.
  const metadataRecords = rawRecords.length === 0 && normalizedPage(input) > 1
    ? await listErpEntityRecords({ ...input, page: 1, pageSize: 10 })
    : rawRecords
  const total = metadataRecords.length > 0 ? Number(metadataRecords[0].__total ?? metadataRecords.length) : 0
  const summaryRecord = metadataRecords[0] ?? {}
  const summary = {
    overdue: Number(summaryRecord.__summary_overdue ?? 0),
    dueToday: Number(summaryRecord.__summary_due_today ?? 0),
    upcoming: Number(summaryRecord.__summary_upcoming ?? 0),
    paid: Number(summaryRecord.__summary_paid ?? 0),
    total: Number(summaryRecord.__summary_total ?? 0),
  }
  const records = rawRecords.map((rawRecord) => {
    const record = { ...rawRecord }
    delete record.__total
    delete record.__summary_overdue
    delete record.__summary_due_today
    delete record.__summary_upcoming
    delete record.__summary_paid
    delete record.__summary_total
    return record as ErpEntityRecord
  })

  return {
    records,
    total,
    summary,
    page: normalizedPage(input),
    pageSize: normalizedPageSize(input),
  }
}
function assertEditableModule(entityId: ErpConnectedModuleId): asserts entityId is EditableModuleId {
  if (!(entityId in editableModuleTables)) throw new ErpDomainError('VALIDATION_ERROR', 'Este módulo não permite edição por esta rota.')
}
export async function getErpEntityRecord(input: {
  tenantId: number
  entityId: ErpConnectedModuleId
  id: string | number
}): Promise<ErpEntityRecord> {
  assertEditableModule(input.entityId)
  const id = numericId(input.id, 'Registro')
  let sql = ''
  if (input.entityId === 'contas-contabeis') {
    sql = `SELECT c.id::text,c.codigo,c.nome,coalesce(c.descricao,'') descricao,coalesce(c.conta_pai_id::text,'nenhuma') conta_pai_id,
      coalesce(p.codigo||' - '||p.nome,'') conta_pai_label,c.tipo,c.classificacao,c.natureza,c.versao,CASE WHEN c.ativo THEN 'ativo' ELSE 'inativo' END status
      FROM erp.contas_contabeis c LEFT JOIN erp.contas_contabeis p ON p.empresa_id=c.empresa_id AND p.id=c.conta_pai_id
      WHERE c.empresa_id=$1 AND c.id=$2 AND c.excluido_em IS NULL`
  } else if (isEntityRoleModule(input.entityId)) {
    const role = entityRoleColumn(input.entityId)
    sql = `SELECT id::text, nome, documento, email, telefone, cidade,
      CASE tipo_pessoa WHEN 'fisica' THEN 'PF' WHEN 'juridica' THEN 'PJ' ELSE 'Estrangeira' END AS tipo,
      COALESCE((SELECT c.nome FROM erp.categorias_cadastro c WHERE c.empresa_id = entidades.empresa_id AND c.id = entidades.categoria_id), '') AS categoria,
      limite_credito, CASE WHEN bloqueio_comercial THEN 'sim' ELSE 'nao' END AS bloqueio_comercial, bloqueio_motivo, tabela_preco_id::text,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao,
      (SELECT COALESCE(jsonb_agg((to_jsonb(c) - 'empresa_id' - 'entidade_id' - 'ativo' - 'criado_em' - 'criado_por' - 'atualizado_em') || jsonb_build_object('id',c.id::text) ORDER BY c.id), '[]'::jsonb)::text FROM erp.entidades_contatos c WHERE c.empresa_id=entidades.empresa_id AND c.entidade_id=entidades.id AND c.ativo) AS contatos_json,
      (SELECT COALESCE(jsonb_agg((to_jsonb(e) - 'empresa_id' - 'entidade_id' - 'ativo' - 'criado_em' - 'criado_por' - 'atualizado_em') || jsonb_build_object('id',e.id::text) ORDER BY e.id), '[]'::jsonb)::text FROM erp.entidades_enderecos e WHERE e.empresa_id=entidades.empresa_id AND e.entidade_id=entidades.id AND e.ativo) AS enderecos_json
      FROM erp.entidades WHERE empresa_id = $1 AND id = $2 AND ${role} = true AND excluido_em IS NULL`
  } else if (input.entityId === 'produtos') {
    sql = `SELECT produtos.id::text, produtos.nome, produtos.sku,
      COALESCE(categorias.nome, '') AS categoria, produtos.preco_venda AS preco, coalesce(nullif(trim(produtos.unidade_medida), ''), 'UN') AS unidade_medida,
      CASE WHEN produtos.controla_estoque THEN 'sim' ELSE 'nao' END AS controla_estoque,
      CASE WHEN produtos.permite_estoque_negativo THEN 'sim' ELSE 'nao' END AS permite_estoque_negativo,
      produtos.estoque_minimo, produtos.ponto_reposicao,
      CASE WHEN produtos.ativo THEN 'ativo' ELSE 'pausado' END AS status, produtos.versao
      FROM erp.produtos LEFT JOIN erp.categorias_cadastro AS categorias
        ON categorias.empresa_id = produtos.empresa_id AND categorias.id = produtos.categoria_id
      WHERE produtos.empresa_id = $1 AND produtos.id = $2 AND produtos.excluido_em IS NULL`
  } else if (input.entityId === 'servicos') {
    sql = `SELECT servicos.id::text, servicos.nome, servicos.codigo, servicos.descricao, servicos.categoria_id::text,
      COALESCE(categorias.nome, '') AS categoria, servicos.preco, servicos.custo,
      COALESCE(servicos.codigo_tributacao_nacional, '') AS codigo_tributacao_nacional,
      COALESCE(servicos.codigo_servico_municipal, '') AS codigo_servico_municipal, COALESCE(servicos.codigo_nbs, '') AS codigo_nbs,
      CASE WHEN servicos.ativo THEN 'ativo' ELSE 'pausado' END AS status, servicos.versao
      FROM erp.servicos LEFT JOIN erp.categorias_cadastro AS categorias
        ON categorias.empresa_id = servicos.empresa_id AND categorias.id = servicos.categoria_id
      WHERE servicos.empresa_id = $1 AND servicos.id = $2 AND servicos.excluido_em IS NULL`
  } else if (input.entityId === 'categorias-cadastro') {
    sql = `SELECT id::text, nome, tipo, COALESCE(descricao, '') AS descricao, COALESCE(categoria_pai_id::text, 'nenhuma') AS categoria_pai_id,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao
      FROM erp.categorias_cadastro WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL`
  } else if (input.entityId === 'categorias') {
    sql = `SELECT id::text, nome, tipo, COALESCE(metadata ->> 'descricao', '') AS descricao,
      COALESCE(categoria_pai_id::text, 'nenhuma') AS categoria_pai_id, CASE WHEN fora_dre THEN 'fora' ELSE COALESCE(dre_grupo_id::text, 'nao_classificado') END AS dre_grupo_id,
      COALESCE(conta_contabil_id::text,'nenhuma') conta_contabil_id,
      COALESCE((SELECT a.codigo||' - '||a.nome FROM erp.contas_contabeis a WHERE a.empresa_id=categorias.empresa_id AND a.id=categorias.conta_contabil_id),'') conta_contabil_label,
      fora_dre, (SELECT g.codigo FROM erp.dre_grupos g WHERE g.empresa_id=categorias.empresa_id AND g.id=categorias.dre_grupo_id) AS dre_grupo_codigo,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao
      FROM erp.categorias WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL`
  } else {
    sql = `SELECT id::text, nome, tipo, banco, agencia, conta, digito, saldo_inicial,
      COALESCE(conta_contabil_id::text,'nenhuma') conta_contabil_id,
      COALESCE((SELECT a.codigo||' - '||a.nome FROM erp.contas_contabeis a WHERE a.empresa_id=contas_financeiras.empresa_id AND a.id=contas_financeiras.conta_contabil_id),'') conta_contabil_label,
      data_saldo_inicial, CASE WHEN padrao THEN 'sim' ELSE 'nao' END AS padrao,
      CASE WHEN ativo THEN 'ativo' ELSE 'inativo' END AS status, versao
      FROM erp.contas_financeiras WHERE empresa_id = $1 AND id = $2 AND excluido_em IS NULL`
  }

  const rows = await runQuery<Record<string, unknown>>(sql, [input.tenantId, id])
  if (!rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Registro não encontrado.')
  return Object.fromEntries(Object.entries(rows[0]).map(([key, value]) => [
    key,
    value instanceof Date ? value.toISOString().slice(0, 10) : value,
  ])) as ErpEntityRecord
}
export async function updateErpEntityRecord(input: UpdateInput): Promise<ErpEntityRecord> {
  assertEditableModule(input.entityId)
  const entityId = input.entityId as EditableModuleId
  const id = numericId(input.id, 'Registro')
  await withTransaction(async (client) => {
    if (entityId === 'contas-contabeis' || input.values?.conta_contabil_id !== undefined) await lockAccountingCompany(client, input.tenantId)
    const table = editableModuleTables[entityId].table
    const roleClause = isEntityRoleModule(input.entityId) ? ` AND ${entityRoleColumn(input.entityId)} = true` : ''
    const currentResult = await client.query(
      `SELECT * FROM erp.${table} WHERE empresa_id = $1 AND id = $2${roleClause} AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new ErpDomainError('VALIDATION_ERROR', 'Registro não encontrado.')
    if (Number(current.versao) !== input.expectedVersion) {
      throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: este registro foi alterado por outra pessoa. Recarregue a página.')
    }

    let result: { rows: Record<string, unknown>[] }
    if (isEntityRoleModule(input.entityId)) {
      assertRequired(input.values.nome, 'Nome')
      const category = optionalText(input.values.categoria)
      result = await client.query(
        `UPDATE erp.entidades SET tipo_pessoa = $3, nome = $4, documento = $5, email = $6,
           telefone = $7, cidade = $8, ativo = $9,
           metadata = metadata - 'categoria', categoria_id = CASE WHEN $10::text = '' THEN NULL ELSE categoria_id END,
           categoria_tipo = CASE WHEN $10::text = '' THEN NULL ELSE categoria_tipo END,
           versao = versao + 1, atualizado_por = $11
         WHERE empresa_id = $1 AND id = $2 AND ${entityRoleColumn(input.entityId)} = true AND versao = $12 RETURNING *`,
        [input.tenantId, id, normalizePersonType(input.values.tipo), text(input.values.nome),
          input.values.documento === undefined ? current.documento : optionalText(input.values.documento),
          current.email, current.telefone,
          current.cidade, activeFromStatus(input.values.status), category || '', input.actorId, input.expectedVersion],
      )
    } else if (input.entityId === 'produtos') {
      assertRequired(input.values.nome, 'Nome do produto')
      const stockUnit = productStockUnit(input.values.unidade_medida ?? current.unidade_medida)
      if (stockUnit !== productStockUnit(current.unidade_medida)) {
        const movements = await client.query('SELECT 1 FROM erp.movimentacoes_estoque WHERE empresa_id=$1 AND produto_id=$2 LIMIT 1', [input.tenantId, id])
        const conversions = await client.query('SELECT 1 FROM erp.conversoes_unidades_produto WHERE empresa_id=$1 AND produto_id=$2 AND ativo AND excluido_em IS NULL LIMIT 1', [input.tenantId, id])
        if (movements.rows.length || conversions.rows.length) throw new ErpDomainError('PRODUCT_UNIT_IN_USE', 'Este produto já possui movimentações ou conversões. Mantenha a unidade de estoque para preservar as quantidades.', 409)
      }
      const categoryId = await resolveCategoryId(client, input.tenantId, input.actorId, input.values.categoria, 'produto')
      result = await client.query(
        `UPDATE erp.produtos SET nome = $3, sku = $4, codigo = $4, preco_venda = $5,
           categoria_id = $6, ativo = $7, controla_estoque = $8, permite_estoque_negativo = $9,
           estoque_minimo = $10, ponto_reposicao = $11, versao = versao + 1, atualizado_por = $12, unidade_medida = $14
         WHERE empresa_id = $1 AND id = $2 AND versao = $13 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), optionalText(input.values.sku), money(input.values.preco),
          categoryId, activeFromStatus(input.values.status), input.values.controla_estoque !== 'nao',
          input.values.permite_estoque_negativo === 'sim', money(input.values.estoque_minimo),
          money(input.values.ponto_reposicao), input.actorId, input.expectedVersion, stockUnit],
      )
    } else if (input.entityId === 'servicos') {
      assertRequired(input.values.nome, 'Nome do serviço')
      const categoryId = await resolveServiceCategory(client, input)
      const fiscal = serviceFiscalCodes({ codigo_tributacao_nacional: current.codigo_tributacao_nacional, codigo_servico_municipal: current.codigo_servico_municipal, codigo_nbs: current.codigo_nbs, ...input.values })
      result = await client.query(
        `UPDATE erp.servicos SET nome = $3, codigo = $4, descricao = $5, preco = $6, custo = $7,
           categoria_id = $8, ativo = $9, versao = versao + 1, atualizado_por = $10,
           codigo_tributacao_nacional = $12, codigo_servico_municipal = $13, codigo_nbs = $14
         WHERE empresa_id = $1 AND id = $2 AND versao = $11 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), optionalText(input.values.codigo), optionalText(input.values.descricao),
          money(input.values.preco), money(input.values.custo), categoryId, activeFromStatus(input.values.status),
          input.actorId, input.expectedVersion, fiscal.national, fiscal.municipal, fiscal.nbs],
      )
    } else if (input.entityId === 'categorias-cadastro') {
      assertRequired(input.values.nome, 'Nome da categoria')
      const values = await registrationCategoryValues(client, input.tenantId, input.values, id)
      if (values.tipo !== current.tipo) throw new ErpDomainError('VALIDATION_ERROR', 'O tipo da categoria de cadastro não muda; crie outra categoria.')
      result = await client.query(
        `UPDATE erp.categorias_cadastro SET nome = $3, descricao = $4, categoria_pai_id = $5, ativo = $6,
           versao = versao + 1, atualizado_por = $7
         WHERE empresa_id = $1 AND id = $2 AND versao = $8 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), optionalText(input.values.descricao), values.parentId,
          activeFromStatus(input.values.status), input.actorId, input.expectedVersion],
      )
    } else if (input.entityId === 'contas-contabeis') {
      result = await updateAccountingAccount(client, { ...input, id }, current)
    } else if (input.entityId === 'categorias') {
      assertRequired(input.values.nome, 'Nome da categoria')
      const classification = await financialCategoryClassification(client, input.tenantId, input.values, id)
      result = await client.query(
        `UPDATE erp.categorias SET nome = $3, tipo = $4, ativo = $5,
           metadata = metadata || jsonb_build_object('descricao', $6::text),
           categoria_pai_id = $9, dre_grupo_id = $10, fora_dre = $11, conta_contabil_id=$12,
           versao = versao + 1, atualizado_por = $7
         WHERE empresa_id = $1 AND id = $2 AND versao = $8 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), classification.tipo, activeFromStatus(input.values.status),
          optionalText(input.values.descricao) || '', input.actorId, input.expectedVersion,
          classification.parentId, classification.groupId, classification.outsideDre,
          input.values.conta_contabil_id === undefined ? current.conta_contabil_id : accountingLink(input.values.conta_contabil_id)],
      )
    } else {
      assertRequired(input.values.nome, 'Nome da conta financeira')
      const makeDefault = booleanValue(input.values.padrao)
      if (makeDefault) {
        await client.query(
          `UPDATE erp.contas_financeiras SET padrao = false, atualizado_por = $2
           WHERE empresa_id = $1 AND id <> $3 AND padrao = true`,
          [input.tenantId, input.actorId, id],
        )
      }
      result = await client.query(
        `UPDATE erp.contas_financeiras SET nome = $3, tipo = $4, banco = $5, agencia = $6,
           conta = $7, digito = $8, saldo_inicial = $9, data_saldo_inicial = $10,
           padrao = $11, ativo = $12, versao = versao + 1, atualizado_por = $13, conta_contabil_id=$15
         WHERE empresa_id = $1 AND id = $2 AND versao = $14 RETURNING *`,
        [input.tenantId, id, text(input.values.nome), financialAccountType(input.values.tipo),
          optionalText(input.values.banco), optionalText(input.values.agencia), optionalText(input.values.conta),
          optionalText(input.values.digito), money(input.values.saldo_inicial), dateText(input.values.data_saldo_inicial),
          makeDefault, activeFromStatus(input.values.status), input.actorId, input.expectedVersion,
          input.values.conta_contabil_id === undefined ? current.conta_contabil_id : accountingLink(input.values.conta_contabil_id)],
      )
    }

    const updated = result.rows[0]
    if (!updated) throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: este registro foi alterado por outra pessoa. Recarregue a página.')
    const relations = isEntityRoleModule(input.entityId)
      ? await saveRegistrationRelations(client, input.tenantId, id, input.actorId, input.values) : undefined
    if (isEntityRoleModule(input.entityId) && optionalText(input.values.categoria)) await saveEntityCategory(client, input.tenantId, input.actorId, input.entityId, id, input.values.categoria)
    if (input.entityId === 'clientes') await saveCustomerCommercialTerms(client, input.tenantId, id, input.actorId, input.values)
    await appendRegistrationEvent(client, { ...input, entityId, id }, 'atualizado', Number(updated.versao), current, { ...updated, relations })
  })
  return getErpEntityRecord({ tenantId: input.tenantId, entityId, id })
}
export async function deactivateErpEntityRecord(input: IdActionInput & { entityId: ErpConnectedModuleId; expectedVersion: number }) {
  assertEditableModule(input.entityId)
  const entityId = input.entityId as EditableModuleId
  const id = numericId(input.id, 'Registro')
  await withTransaction(async (client) => {
    if (entityId === 'contas-contabeis') await lockAccountingCompany(client, input.tenantId)
    const table = editableModuleTables[entityId].table
    const roleClause = isEntityRoleModule(input.entityId) ? ` AND ${entityRoleColumn(input.entityId)} = true` : ''
    const currentResult = await client.query(
      `SELECT * FROM erp.${table} WHERE empresa_id = $1 AND id = $2${roleClause} AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, id],
    )
    const current = currentResult.rows[0]
    if (!current) throw new ErpDomainError('VALIDATION_ERROR', 'Registro não encontrado.')
    if (Number(current.versao) !== input.expectedVersion) throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: este registro foi alterado por outra pessoa.')
    if (entityId === 'contas-contabeis') {
      const children = await client.query('SELECT id FROM erp.contas_contabeis WHERE empresa_id=$1 AND conta_pai_id=$2 AND ativo AND excluido_em IS NULL LIMIT 1', [input.tenantId, id])
      if (children.rows.length) throw new ErpDomainError('ACCOUNTING_ACTIVE_CHILDREN', 'Esta conta possui contas filhas ativas. Desative ou transfira as contas filhas antes de desativar o grupo.', 422)
    }
    const result = await client.query(
      `UPDATE erp.${table} SET ativo = false, versao = versao + 1, atualizado_por = $3
       WHERE empresa_id = $1 AND id = $2${roleClause} AND versao = $4 RETURNING *`,
      [input.tenantId, id, input.actorId, input.expectedVersion],
    )
    const updated = result.rows[0]
    if (!updated) throw new ErpDomainError('VALIDATION_ERROR', 'CONFLITO_VERSAO: este registro foi alterado por outra pessoa.')
    await appendRegistrationEvent(client, { ...input, entityId, id }, 'desativado', Number(updated.versao), current, updated)
  })
  return getErpEntityRecord({ tenantId: input.tenantId, entityId, id })
}
export async function getErpEntitySummary(tenantId: number, entityId: ErpConnectedModuleId) {
  if (entityId === 'contas-contabeis') return accountingSummary(tenantId)
  assertEditableModule(entityId)
  let sql = ''
  if (isEntityRoleModule(entityId)) {
    const role = entityRoleColumn(entityId)
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos,
      count(*) FILTER (WHERE NOT ativo)::int AS inativos,
      count(DISTINCT categoria_id)::int AS categorias
      FROM erp.entidades WHERE empresa_id = $1 AND ${role} = true AND excluido_em IS NULL`
  } else if (entityId === 'produtos') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos, count(DISTINCT categoria_id)::int AS categorias,
      COALESCE(avg(preco_venda) FILTER (WHERE ativo), 0)::numeric(18,2) AS media
      FROM erp.produtos WHERE empresa_id = $1 AND excluido_em IS NULL`
  } else if (entityId === 'servicos') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos, count(DISTINCT categoria_id)::int AS categorias,
      COALESCE(avg(preco) FILTER (WHERE ativo), 0)::numeric(18,2) AS media
      FROM erp.servicos WHERE empresa_id = $1 AND excluido_em IS NULL`
  } else if (entityId === 'categorias-cadastro') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos,
      count(*) FILTER (WHERE ativo AND tipo IN ('produto', 'servico'))::int AS itens,
      count(*) FILTER (WHERE ativo AND tipo IN ('cliente', 'fornecedor'))::int AS pessoas
      FROM erp.categorias_cadastro WHERE empresa_id = $1 AND excluido_em IS NULL`
  } else if (entityId === 'categorias') {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos,
      count(*) FILTER (WHERE ativo AND dre_grupo_id IS NULL AND NOT fora_dre)::int AS nao_classificadas,
      count(*) FILTER (WHERE ativo AND NOT EXISTS (SELECT 1 FROM erp.contas_receber t WHERE t.empresa_id = categorias.empresa_id AND t.categoria_id = categorias.id) AND NOT EXISTS (SELECT 1 FROM erp.contas_pagar t WHERE t.empresa_id = categorias.empresa_id AND t.categoria_id = categorias.id) AND NOT EXISTS (SELECT 1 FROM erp.rateios_financeiros t WHERE t.empresa_id = categorias.empresa_id AND t.categoria_id = categorias.id))::int AS sem_itens,
      count(DISTINCT tipo)::int AS tipos FROM erp.categorias WHERE empresa_id = $1 AND excluido_em IS NULL`
  } else {
    sql = `SELECT count(*) FILTER (WHERE ativo)::int AS ativos, count(*) FILTER (WHERE padrao AND ativo)::int AS padrao,
      COALESCE(sum(saldo_inicial) FILTER (WHERE ativo), 0)::numeric(18,2) AS saldo
      FROM erp.contas_financeiras WHERE empresa_id = $1 AND excluido_em IS NULL`
  }
  const row = (await runQuery<Record<string, unknown>>(sql, [tenantId]))[0] || {}
  const currency = (value: unknown) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
  if (entityId === 'produtos' || entityId === 'servicos') return { metrics: [
    { label: entityId === 'produtos' ? 'SKUs ativos' : 'Serviços ativos', value: String(row.ativos || 0), detail: 'catálogo conectado', tone: 'success' },
    { label: 'Categorias', value: String(row.categorias || 0), detail: 'classificação em uso' },
    { label: 'Preço médio', value: currency(row.media), detail: 'itens ativos' },
  ] }
  if (entityId === 'categorias-cadastro') return { metrics: [
    { label: 'Categorias ativas', value: String(row.ativos || 0), detail: 'todos os tipos' },
    { label: 'Produtos e serviços', value: String(row.itens || 0), detail: 'categorias de catálogo' },
    { label: 'Clientes e fornecedores', value: String(row.pessoas || 0), detail: 'categorias de pessoas' },
  ] }
  if (entityId === 'categorias') return { metrics: [
    { label: 'Categorias ativas', value: String(row.ativos || 0), detail: 'receitas e despesas' },
    { label: 'Não classificadas', value: String(row.nao_classificadas || 0), detail: 'sem grupo da DRE', tone: 'warning' },
    { label: 'Sem lançamentos', value: String(row.sem_itens || 0), detail: 'ainda não usadas' },
  ] }
  if (entityId === 'contas-financeiras') return { metrics: [
    { label: 'Contas ativas', value: String(row.ativos || 0), detail: 'disponíveis para baixas' },
    { label: 'Conta padrão', value: String(row.padrao || 0), detail: 'selecionada automaticamente' },
    { label: 'Saldo inicial', value: currency(row.saldo), detail: 'soma das contas ativas' },
  ] }
  const roleLabel = entityId === 'clientes' ? 'Clientes' : entityId === 'fornecedores' ? 'Fornecedores' : 'Vendedores'
  return { metrics: [
    { label: `${roleLabel} ativos`, value: String(row.ativos || 0), detail: 'base conectada', tone: 'success' },
    { label: 'Inativos', value: String(row.inativos || 0), detail: 'cadastros pausados' },
    { label: 'Categorias', value: String(row.categorias || 0), detail: 'classificacoes em uso' },
  ] }
}
export async function searchErpCatalog(input: {
  tenantId: number
  type: 'cliente' | 'fornecedor' | 'produto' | 'servico' | 'categoria'
  query?: string
  categoryType?: string
  limit?: number
}) {
  const query = `%${text(input.query)}%`
  const limit = Math.min(100, Math.max(10, Math.floor(Number(input.limit || 30))))
  if (input.type === 'cliente' || input.type === 'fornecedor') {
    const role = input.type === 'cliente' ? 'eh_cliente' : 'eh_fornecedor'
    return runQuery(
      `SELECT id::text, nome, documento, email, celular, telefone,
         contato_cobranca_emails, contato_cobranca_whatsapp
       FROM erp.entidades
       WHERE empresa_id = $1 AND ${role} = true AND ativo = true AND excluido_em IS NULL
         AND concat_ws(' ', nome, documento, email) ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit],
    )
  }
  if (input.type === 'produto') {
    return runQuery(
      `SELECT id::text, nome, COALESCE(sku, codigo, '') AS codigo, coalesce(nullif(trim(unidade_medida), ''), 'UN') AS unidade, preco_venda AS valor_padrao
       FROM erp.produtos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL
         AND concat_ws(' ', nome, sku, codigo, codigo_barras) ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit],
    )
  }
  if (input.type === 'servico') {
    return runQuery(
      `SELECT id::text, nome, COALESCE(codigo, '') AS codigo, preco AS valor_padrao
       FROM erp.servicos WHERE empresa_id = $1 AND ativo = true AND excluido_em IS NULL
         AND concat_ws(' ', nome, codigo, descricao) ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit],
    )
  }
  const categoryType = text(input.categoryType)
  if (REGISTRATION_CATEGORY_TYPES.includes(categoryType)) {
    return runQuery(
      `SELECT id::text, nome, tipo FROM erp.categorias_cadastro
       WHERE empresa_id = $1 AND tipo = $4 AND ativo = true AND excluido_em IS NULL AND nome ILIKE $2
       ORDER BY nome LIMIT $3`, [input.tenantId, query, limit, categoryType],
    )
  }
  const params: unknown[] = [input.tenantId, query, limit]
  const typeClause = ['receita', 'despesa'].includes(categoryType) ? ` AND categorias.tipo = $${params.push(categoryType)}` : ''
  return runQuery(
    `SELECT categorias.id::text, COALESCE(pai.nome || ' › ', '') || categorias.nome AS nome, categorias.tipo
     FROM erp.categorias categorias
     LEFT JOIN erp.categorias pai ON pai.empresa_id = categorias.empresa_id AND pai.id = categorias.categoria_pai_id
     WHERE categorias.empresa_id = $1 AND categorias.ativo = true AND categorias.excluido_em IS NULL
       AND concat_ws(' ', pai.nome, categorias.nome) ILIKE $2 AND ${FINANCIAL_CATEGORY_LEAF_SQL}${typeClause}
     ORDER BY 2 LIMIT $3`, params,
  )
}
export async function createErpEntityRecord(input: CreateInput): Promise<ErpEntityRecord> {
  const created = await withTransaction(client => createErpEntityWithClient(client,input))
  if (input.entityId === 'contas-a-pagar') return created
  return fetchCreatedRecord(input.tenantId, input.entityId, created.id)
}
export async function createErpEntityWithClient(client: SQLClient, input: CreateInput): Promise<ErpEntityRecord> {
    if (input.entityId === 'contas-contabeis') return createAccountingAccount(client, input)
    if (isEntityRoleModule(input.entityId)) {
      return createEntityRoleRecord(client, input)
    }

    if (input.entityId === 'produtos') {
      return createProductRecord(client, input)
    }

    if (input.entityId === 'servicos') {
      return createServiceRecord(client, input)
    }

    if (input.entityId === 'pedidos') {
      return createSaleRecord(client, input)
    }

    if (input.entityId === 'pedidos-compra') {
      return createPurchaseRecord(client, input)
    }

    if (input.entityId === 'contas-a-pagar') {
      return createManualPayableRecord(client, input)
    }

    if (input.entityId === 'contas-a-receber') {
      throw new ErpDomainError('VALIDATION_ERROR', 'Crie contas a receber a partir de vendas.')
    }

    if (input.entityId === 'contas-financeiras') {
      return createFinancialAccountRecord(client, input)
    }

    if (input.entityId === 'categorias-cadastro') {
      return createRegistrationCategoryRecord(client, input)
    }

    return createCategoryRecord(client, input)
}
async function fetchCreatedRecord(tenantId: number, entityId: ErpConnectedModuleId, id: unknown) {
  if (entityId in editableModuleTables) {
    return getErpEntityRecord({ tenantId, entityId, id: String(id) })
  }
  const records = await listErpEntityRecords({ tenantId, entityId, page: 1, pageSize: 100 })
  const created = records.find((record) => record.id === String(id))
  if (!created) throw new ErpDomainError('VALIDATION_ERROR', 'Registro criado, mas não foi possível recarrega-lo.')
  return created
}

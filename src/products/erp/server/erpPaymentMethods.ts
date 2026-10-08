import { runQuery, withTransaction } from '@/lib/postgres'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'

// Formas de pagamento (Fase 2C). No cartão, a forma pode ter a "conta da maquininha": taxa (%) + taxa fixa, prazo
// do repasse, repasse único ou parcelado, banco que recebe o repasse, categoria da taxa e adquirente (fornecedor).
const TYPES = ['pix', 'boleto', 'dinheiro', 'cartao_credito', 'cartao_debito', 'transferencia', 'deposito', 'cheque', 'outro']

export async function listPaymentMethods(tenantId: number) {
  const rows = await runQuery<Record<string, unknown>>(
    `SELECT m.id::text, m.nome, m.tipo, m.ativo, m.versao, m.taxa_percentual, m.taxa_fixa, m.prazo_repasse_dias, m.repasse,
       m.conta_maquininha_id::text, maquininha.nome AS conta_maquininha, m.conta_destino_id::text, destino.nome AS conta_destino,
       m.categoria_taxa_id::text, categoria.nome AS categoria_taxa, m.adquirente_id::text, adquirente.nome AS adquirente
     FROM erp.metodos_pagamento m
     LEFT JOIN erp.contas_financeiras maquininha ON maquininha.empresa_id = m.empresa_id AND maquininha.id = m.conta_maquininha_id
     LEFT JOIN erp.contas_financeiras destino ON destino.empresa_id = m.empresa_id AND destino.id = m.conta_destino_id
     LEFT JOIN erp.categorias categoria ON categoria.empresa_id = m.empresa_id AND categoria.id = m.categoria_taxa_id
     LEFT JOIN erp.entidades adquirente ON adquirente.empresa_id = m.empresa_id AND adquirente.id = m.adquirente_id
     WHERE m.empresa_id = $1 AND m.excluido_em IS NULL ORDER BY m.ativo DESC, m.nome`, [tenantId])
  return rows.map(row => ({ ...row, taxa_percentual: Number(row.taxa_percentual), taxa_fixa: Number(row.taxa_fixa), prazo_repasse_dias: Number(row.prazo_repasse_dias) }))
}

const optionalId = (value: unknown) => { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : null }

export async function savePaymentMethod(input: { tenantId: number; actorId: number; id?: number; expectedVersion?: number; values: Record<string, unknown> }) {
  const v = input.values
  const nome = String(v.nome || '').trim()
  if (!nome) throw new ErpDomainError('VALIDATION_ERROR', 'Informe o nome da forma de pagamento.', 422)
  const tipo = String(v.tipo || '')
  if (!TYPES.includes(tipo)) throw new ErpDomainError('VALIDATION_ERROR', 'Tipo de forma de pagamento inválido.', 422)
  const maquininha = optionalId(v.conta_maquininha_id)
  const card = {
    taxa_percentual: Number(v.taxa_percentual || 0), taxa_fixa: Number(v.taxa_fixa || 0), prazo: Math.floor(Number(v.prazo_repasse_dias || 0)),
    repasse: v.repasse === 'parcelado' ? 'parcelado' : 'unico', destino: optionalId(v.conta_destino_id),
    categoria: optionalId(v.categoria_taxa_id), adquirente: optionalId(v.adquirente_id),
  }
  if (!(card.taxa_percentual >= 0 && card.taxa_percentual <= 100) || !(card.taxa_fixa >= 0) || !(card.prazo >= 0 && card.prazo <= 365))
    throw new ErpDomainError('VALIDATION_ERROR', 'Confira taxa (0 a 100%), taxa fixa e prazo do repasse (0 a 365 dias).', 422)
  return withTransaction(async client => {
    if (maquininha) {
      if (!['cartao_credito', 'cartao_debito'].includes(tipo)) throw new ErpDomainError('VALIDATION_ERROR', 'Conta da maquininha só vale para cartão de crédito ou débito.', 422)
      const accounts = await client.query('SELECT id, tipo FROM erp.contas_financeiras WHERE empresa_id = $1 AND id = ANY($2::bigint[]) AND ativo AND excluido_em IS NULL', [input.tenantId, [maquininha, card.destino]])
      const typeOf = (id: number | null) => accounts.rows.find(row => Number(row.id) === id)?.tipo
      if (typeOf(maquininha) !== 'maquininha') throw new ErpDomainError('VALIDATION_ERROR', 'Escolha uma conta financeira do tipo "maquininha".', 422)
      if (!card.destino || !typeOf(card.destino) || typeOf(card.destino) === 'maquininha') throw new ErpDomainError('VALIDATION_ERROR', 'Escolha a conta bancária que recebe o repasse.', 422)
      const category = await client.query('SELECT tipo FROM erp.categorias WHERE empresa_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL', [input.tenantId, card.categoria])
      if (category.rows[0]?.tipo !== 'despesa') throw new ErpDomainError('VALIDATION_ERROR', 'Escolha a categoria de despesa da taxa do cartão.', 422)
      const acquirer = await client.query('SELECT id FROM erp.entidades WHERE empresa_id = $1 AND id = $2 AND eh_fornecedor AND excluido_em IS NULL', [input.tenantId, card.adquirente])
      if (!acquirer.rows[0]) throw new ErpDomainError('VALIDATION_ERROR', 'Escolha a adquirente (cadastrada como fornecedor), por exemplo Stone ou Cielo.', 422)
    }
    const params = [input.tenantId, nome, tipo, v.status !== 'inativo', card.taxa_percentual, card.taxa_fixa, card.prazo, card.repasse,
      maquininha, maquininha ? card.destino : null, maquininha ? card.categoria : null, maquininha ? card.adquirente : null, input.actorId]
    const result = input.id
      ? await client.query(`UPDATE erp.metodos_pagamento SET nome = $2, tipo = $3, ativo = $4, taxa_percentual = $5, taxa_fixa = $6, prazo_repasse_dias = $7,
          repasse = $8, conta_maquininha_id = $9, conta_destino_id = $10, categoria_taxa_id = $11, adquirente_id = $12, atualizado_por = $13, versao = versao + 1
          WHERE empresa_id = $1 AND id = $14 AND versao = $15 AND excluido_em IS NULL RETURNING id::text, versao`, [...params, input.id, input.expectedVersion])
      : await client.query(`INSERT INTO erp.metodos_pagamento (empresa_id, nome, tipo, ativo, taxa_percentual, taxa_fixa, prazo_repasse_dias, repasse,
          conta_maquininha_id, conta_destino_id, categoria_taxa_id, adquirente_id, criado_por, atualizado_por)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13) RETURNING id::text, versao`, params)
    if (!result.rows[0]) throw new ErpDomainError('VERSION_CONFLICT', 'Esta forma de pagamento foi alterada por outra pessoa. Atualize a tela.', 409)
    return result.rows[0]
  })
}

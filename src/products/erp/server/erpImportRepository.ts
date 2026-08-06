import { createHash } from 'node:crypto'

import { runQuery, withTransaction } from '@/lib/postgres'
import { createErpEntityRecord, listErpEntityRecords } from '@/products/erp/server/erpRepository'
import type { ErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

type ImportType = 'clientes' | 'fornecedores' | 'produtos' | 'servicos'

const importTypes = new Set<ImportType>(['clientes', 'fornecedores', 'produtos', 'servicos'])

export function isImportType(value: string): value is ImportType {
  return importTypes.has(value as ImportType)
}

function normalizeKey(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replaceAll(' ', '_')
}

function normalizeRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeKey(key), value]))
}

function first(row: Record<string, unknown>, keys: string[], fallback: unknown = '') {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return fallback
}

function decimal(value: unknown) {
  const raw = String(value ?? '0').trim().replace(/\s/g, '')
  if (!raw) return 0
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapImportValues(type: ImportType, original: Record<string, unknown>) {
  const row = normalizeRow(original)
  if (type === 'clientes') {
    const document = String(first(row, ['documento', 'cpf_cnpj', 'cpf', 'cnpj'])).replace(/\D/g, '')
    return {
      nome: first(row, ['nome', 'razao_social', 'cliente']),
      tipo: first(row, ['tipo'], document.length > 11 ? 'PJ' : 'PF'),
      documento: document,
      telefone: first(row, ['telefone', 'celular']),
      email: first(row, ['email', 'e_mail']),
      cidade: first(row, ['cidade', 'municipio']),
    }
  }
  if (type === 'fornecedores') {
    return {
      nome: first(row, ['nome', 'razao_social', 'fornecedor']),
      documento: String(first(row, ['documento', 'cpf_cnpj', 'cnpj', 'cpf'])).replace(/\D/g, ''),
      categoria: first(row, ['categoria']),
      email: first(row, ['email', 'e_mail']),
      cidade: first(row, ['cidade', 'municipio']),
    }
  }
  if (type === 'produtos') {
    return {
      nome: first(row, ['nome', 'produto', 'descricao']),
      sku: first(row, ['sku', 'codigo', 'codigo_produto']),
      preco: decimal(first(row, ['preco', 'preco_venda', 'valor'])),
      categoria: first(row, ['categoria']),
    }
  }
  return {
    nome: first(row, ['nome', 'servico', 'descricao']),
    codigo: first(row, ['codigo', 'codigo_servico']),
    descricao: first(row, ['descricao']),
    preco: decimal(first(row, ['preco', 'valor'])),
    custo: decimal(first(row, ['custo'])),
    categoria: first(row, ['categoria']),
  }
}

export async function importErpRows(input: {
  tenantId: number
  actorId: number
  type: ImportType
  fileName: string
  rows: Record<string, unknown>[]
}) {
  if (!input.rows.length) throw new Error('O arquivo nao possui linhas para importar.')
  if (input.rows.length > 5000) throw new Error('Importe no maximo 5.000 linhas por arquivo.')
  const hash = createHash('sha256').update(JSON.stringify({ type: input.type, rows: input.rows })).digest('hex')
  const importRecord = await withTransaction(async (client) => {
    const created = await client.query(
      `INSERT INTO erp.importacoes_dados
         (tenant_id, tipo, nome_arquivo, hash_arquivo, status, total_linhas, criado_por)
       VALUES ($1, $2, $3, $4, 'processando', $5, $6) RETURNING id`,
      [input.tenantId, input.type, input.fileName, hash, input.rows.length, input.actorId],
    )
    const importId = Number(created.rows[0].id)
    for (const [index, row] of input.rows.entries()) {
      await client.query(
        `INSERT INTO erp.importacoes_dados_linhas
           (tenant_id, importacao_id, numero_linha, dados_originais, status)
         VALUES ($1, $2, $3, $4::jsonb, 'pendente')`,
        [input.tenantId, importId, index + 2, JSON.stringify(row)],
      )
    }
    return importId
  })

  let imported = 0
  let errors = 0
  for (const [index, row] of input.rows.entries()) {
    const normalized = mapImportValues(input.type, row)
    try {
      const record = await createErpEntityRecord({
        tenantId: input.tenantId,
        actorId: input.actorId,
        entityId: input.type,
        values: normalized,
        idempotencyKey: `importacao:${importRecord}:linha:${index + 2}`,
      })
      await runQuery(
        `UPDATE erp.importacoes_dados_linhas
         SET dados_normalizados = $4::jsonb, status = 'importada', registro_id = $5, processado_em = now()
         WHERE tenant_id = $1 AND importacao_id = $2 AND numero_linha = $3`,
        [input.tenantId, importRecord, index + 2, JSON.stringify(normalized), Number(record.id)],
      )
      imported += 1
    } catch (error) {
      await runQuery(
        `UPDATE erp.importacoes_dados_linhas
         SET dados_normalizados = $4::jsonb, status = 'erro', erros = $5::jsonb, processado_em = now()
         WHERE tenant_id = $1 AND importacao_id = $2 AND numero_linha = $3`,
        [input.tenantId, importRecord, index + 2, JSON.stringify(normalized),
          JSON.stringify([error instanceof Error ? error.message : 'Erro desconhecido'])],
      )
      errors += 1
    }
  }
  const status = errors === 0 ? 'concluida' : imported > 0 ? 'parcial' : 'falha'
  await runQuery(
    `UPDATE erp.importacoes_dados
     SET status = $3, total_validas = $4, total_importadas = $4, total_erros = $5, concluido_em = now()
     WHERE tenant_id = $1 AND id = $2`,
    [input.tenantId, importRecord, status, imported, errors],
  )
  return { id: String(importRecord), status, total: input.rows.length, imported, errors }
}

export async function exportErpRecords(tenantId: number, type: ImportType) {
  return listErpEntityRecords({ tenantId, entityId: type as ErpConnectedModuleId, query: '', filters: {} })
}

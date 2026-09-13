import { createHash } from 'node:crypto'

import { runQuery, withTransaction } from '@/lib/postgres'
import { createErpEntityWithClient, listErpEntityRecords } from '@/products/erp/server/erpRepository'
import { ErpDomainError } from './erpApi'
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
  if (!Number.isFinite(parsed)) throw new ErpDomainError('VALIDATION_ERROR','Informe um valor numérico válido.',422)
  return parsed
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
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`erp:import:${input.tenantId}:${hash}`])
    const existing = await client.query(`SELECT id FROM erp.importacoes_dados WHERE tenant_id=$1 AND tipo=$2 AND hash_arquivo=$3 AND status<>'cancelada'`,[input.tenantId,input.type,hash])
    if (existing.rows[0]) return Number(existing.rows[0].id)
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

  // Each line, its destination and the aggregate counters commit together.
  // A lost response can resume the same durable batch without recreating destinations.
  for (const [index, row] of input.rows.entries()) {
    await withTransaction(async client => {
      await client.query(`SELECT id FROM erp.importacoes_dados WHERE tenant_id=$1 AND id=$2 FOR UPDATE`,[input.tenantId,importRecord])
      const line = await client.query(`SELECT status FROM erp.importacoes_dados_linhas WHERE tenant_id=$1 AND importacao_id=$2 AND numero_linha=$3 FOR UPDATE`,[input.tenantId,importRecord,index+2])
      if (!line.rows[0] || !['pendente','valida'].includes(String(line.rows[0].status))) return
      let normalized: Record<string,unknown> = {}
      await client.query('SAVEPOINT import_line')
      try {
        normalized = mapImportValues(input.type,row)
        const record = await createErpEntityWithClient(client,{tenantId:input.tenantId,actorId:input.actorId,entityId:input.type,values:normalized,idempotencyKey:`importacao:${importRecord}:linha:${index+2}`})
        await client.query(`UPDATE erp.importacoes_dados_linhas SET dados_normalizados=$4::jsonb,status='importada',registro_id=$5,erros='[]'::jsonb,processado_em=now() WHERE tenant_id=$1 AND importacao_id=$2 AND numero_linha=$3`,[input.tenantId,importRecord,index+2,JSON.stringify(normalized),Number(record.id)])
      } catch (error) {
        await client.query('ROLLBACK TO SAVEPOINT import_line')
        const code=String((error as {code?:string})?.code || '')
        if(code.startsWith('08')||['40001','40P01','57P01','42501'].includes(code))throw error
        const message = error instanceof ErpDomainError ? error.message : 'Não foi possível importar a linha. Revise os campos e vínculos.'
        await client.query(`UPDATE erp.importacoes_dados_linhas SET dados_normalizados=$4::jsonb,status='erro',erros=$5::jsonb,processado_em=now() WHERE tenant_id=$1 AND importacao_id=$2 AND numero_linha=$3`,[input.tenantId,importRecord,index+2,JSON.stringify(normalized),JSON.stringify([message])])
      }
      await client.query(`UPDATE erp.importacoes_dados h SET total_validas=s.validas,total_importadas=s.importadas,total_erros=s.erros FROM (
        SELECT count(*) FILTER(WHERE status IN ('valida','importada'))::int AS validas,count(*) FILTER(WHERE status='importada')::int AS importadas,count(*) FILTER(WHERE status='erro')::int AS erros
        FROM erp.importacoes_dados_linhas WHERE tenant_id=$1 AND importacao_id=$2) s WHERE h.tenant_id=$1 AND h.id=$2`,[input.tenantId,importRecord])
    })
  }
  await runQuery(`UPDATE erp.importacoes_dados SET status=CASE WHEN total_erros=0 THEN 'concluida' WHEN total_importadas>0 THEN 'parcial' ELSE 'falha' END,concluido_em=now()
    WHERE tenant_id=$1 AND id=$2 AND status='processando' AND NOT EXISTS(SELECT 1 FROM erp.importacoes_dados_linhas WHERE tenant_id=$1 AND importacao_id=$2 AND status IN ('pendente','valida')) RETURNING id`,[input.tenantId,importRecord])
  const summary = await runQuery(`SELECT id::text,status,total_linhas AS total,total_importadas AS imported,total_erros AS errors FROM erp.importacoes_dados WHERE tenant_id=$1 AND id=$2`,[input.tenantId,importRecord])
  return summary[0]
}

export async function getImportDetails(tenantId:number,id:string,page=1) {
  if (!/^[1-9]\d*$/.test(id)) throw new ErpDomainError('NOT_FOUND','Importação não encontrada.',404)
  const head = await runQuery(`SELECT id::text,nome_arquivo,tipo,status,criado_em,concluido_em,total_linhas,total_validas,total_importadas,total_erros FROM erp.importacoes_dados WHERE tenant_id=$1 AND id=$2`,[tenantId,id])
  if (!head[0]) throw new ErpDomainError('NOT_FOUND','Importação não encontrada.',404)
  const rows = await runQuery(`SELECT id::text,numero_linha,status,dados_normalizados,erros,registro_id::text,processado_em FROM erp.importacoes_dados_linhas WHERE tenant_id=$1 AND importacao_id=$2 ORDER BY numero_linha LIMIT 51 OFFSET $3`,[tenantId,id,(Math.max(1,Math.min(10000,Math.floor(page)||1))-1)*50])
  return {record:head[0],rows:rows.slice(0,50),hasMore:rows.length>50}
}

export async function exportErpRecords(tenantId: number, type: ImportType) {
  return listErpEntityRecords({ tenantId, entityId: type as ErpConnectedModuleId, query: '', filters: {} })
}

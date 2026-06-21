import type {
  NormalizationInput,
  NormalizationResult,
  NormalizedRow,
  NormalizedTableName,
} from '@/products/integracoes/datawarehouse/normalization/contracts'

type JsonRecord = Record<string, unknown>

const CRM_RESOURCE_TABLES: Record<string, NormalizedTableName> = {
  contas: 'contas',
  contatos: 'contatos',
  leads: 'leads',
  oportunidades: 'oportunidades',
  atividades: 'atividades',
  usuarios: 'usuarios',
  pipelines: 'pipelines',
  fases_pipeline: 'fases_pipeline',
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function unwrapPayload(row: JsonRecord): JsonRecord {
  const raw = row.raw ?? row.raw_payload ?? row.rawPayload ?? row.payload
  return isRecord(raw) ? raw : row
}

function getPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (Array.isArray(current)) {
      const index = Number(key)
      return Number.isInteger(index) ? current[index] : undefined
    }
    if (!isRecord(current)) return undefined
    return current[key]
  }, value)
}

function firstValue(row: JsonRecord, paths: string[]): unknown {
  for (const path of paths) {
    const value = getPath(row, path)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

function text(row: JsonRecord, paths: string[]) {
  const value = firstValue(row, paths)
  if (value == null) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (isRecord(value)) {
    const nested = value.name ?? value.label ?? value.value ?? value.id
    return nested == null ? null : text({ nested }, ['nested'])
  }
  return null
}

function numberValue(row: JsonRecord, paths: string[]) {
  const value = firstValue(row, paths)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function intValue(row: JsonRecord, paths: string[]) {
  const value = numberValue(row, paths)
  return value == null ? null : Math.trunc(value)
}

function timestampValue(row: JsonRecord, paths: string[]) {
  const value = firstValue(row, paths)
  if (value == null) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString()
  const raw = String(value).trim()
  if (!raw) return null
  const unix = Number(raw)
  if (Number.isFinite(unix) && unix > 1000000000) {
    const date = new Date(unix > 9999999999 ? unix : unix * 1000)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  const brDate = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brDate) return `${brDate[3]}-${brDate[2]}-${brDate[1]}T00:00:00.000Z`
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function dateValue(row: JsonRecord, paths: string[]) {
  const timestamp = timestampValue(row, paths)
  return timestamp ? timestamp.slice(0, 10) : null
}

function normalizeStatus(value: string | null) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return null
  if (['true', 'active', 'ativo', 'open', 'opened', 'aberto', 'new'].includes(normalized)) return 'aberto'
  if (['false', 'inactive', 'inativo'].includes(normalized)) return 'inativo'
  if (['won', 'ganho', 'success'].includes(normalized)) return 'ganho'
  if (['lost', 'perdido'].includes(normalized)) return 'perdido'
  if (['done', 'completed', 'concluido', 'concluida'].includes(normalized)) return 'concluido'
  if (['deleted', 'cancelled', 'canceled', 'arquivado', 'cancelado'].includes(normalized)) return 'arquivado'
  return normalized.replace(/\s+/g, '_')
}

function props(payload: JsonRecord) {
  return isRecord(payload.properties) ? payload.properties : payload
}

function externalId(row: JsonRecord, payload: JsonRecord) {
  const payloadProps = props(payload)
  return text(row, ['external_id', 'externalId', 'id', 'ID'])
    || text(payload, ['id', 'ID', 'uuid'])
    || text(payloadProps, ['id', 'ID', 'hs_object_id'])
}

function base(input: NormalizationInput, table: NormalizedTableName, row: JsonRecord, payload: JsonRecord, index: number) {
  const id = externalId(row, payload)
  return {
    tenant_id: input.tenantId,
    connection_id: input.connectionId,
    provider: input.provider,
    resource: input.resource,
    external_id: id,
    source_run_id: input.runId || null,
    source_table: input.sourceTable,
    synced_at: new Date().toISOString(),
    normalized_at: new Date().toISOString(),
    source_payload: payload,
    _insert_id: `${input.connectionId}:${table}:${input.runId || 'run'}:${id || `row_${index + 1}`}`,
  }
}

function accountFields(payload: JsonRecord) {
  const p = props(payload)
  return {
    nome: text(p, ['name', 'NAME', 'TITLE', 'COMPANY_TITLE', 'company', 'title']),
    dominio: text(p, ['domain', 'DOMAIN', 'web', 'WEB.0.VALUE', 'website']),
    documento: text(p, ['documento', 'cnpj', 'cpf_cnpj', 'tax_id']),
    setor: text(p, ['industry', 'INDUSTRY', 'INDUSTRY_ID', 'setor']),
    telefone: text(p, ['phone', 'PHONE', 'PHONE.0.VALUE', 'telefone']),
    cidade: text(p, ['city', 'CITY', 'ADDRESS_CITY']),
    uf: text(p, ['state', 'STATE', 'ADDRESS_REGION']),
    pais: text(p, ['country', 'COUNTRY', 'ADDRESS_COUNTRY']),
    responsavel_id: text(p, ['owner_id', 'hubspot_owner_id', 'ASSIGNED_BY_ID', 'owner.id', 'user_id']),
    responsavel_nome: text(p, ['owner_name', 'ASSIGNED_BY_NAME', 'owner.name']),
    status: normalizeStatus(text(p, ['status', 'STATUS', 'active', 'OPENED'])),
    criado_em: timestampValue(p, ['createdate', 'created_at', 'add_time', 'DATE_CREATE', 'DATE_CREATE.VALUE']),
    atualizado_em: timestampValue(p, ['hs_lastmodifieddate', 'updated_at', 'update_time', 'DATE_MODIFY']),
  }
}

function contactFields(payload: JsonRecord) {
  const p = props(payload)
  const firstName = text(p, ['firstname', 'first_name', 'NAME'])
  const lastName = text(p, ['lastname', 'last_name', 'LAST_NAME'])
  return {
    nome: text(p, ['name', 'nome', 'TITLE']) || [firstName, lastName].filter(Boolean).join(' ') || null,
    email: text(p, ['email', 'EMAIL', 'EMAIL.0.VALUE']),
    telefone: text(p, ['phone', 'PHONE', 'PHONE.0.VALUE']),
    cargo: text(p, ['jobtitle', 'job_title', 'POST', 'cargo']),
    conta_id: text(p, ['company_id', 'org_id', 'organization.id', 'COMPANY_ID', 'associations.companies.results.0.id']),
    conta_nome: text(p, ['company', 'org_name', 'organization.name', 'COMPANY_TITLE']),
    responsavel_id: text(p, ['owner_id', 'hubspot_owner_id', 'ASSIGNED_BY_ID', 'user_id']),
    responsavel_nome: text(p, ['owner_name', 'ASSIGNED_BY_NAME', 'owner.name']),
    status: normalizeStatus(text(p, ['status', 'STATUS', 'active', 'OPENED'])),
    criado_em: timestampValue(p, ['createdate', 'created_at', 'add_time', 'DATE_CREATE']),
    atualizado_em: timestampValue(p, ['lastmodifieddate', 'hs_lastmodifieddate', 'updated_at', 'update_time', 'DATE_MODIFY']),
  }
}

function leadFields(payload: JsonRecord) {
  const p = props(payload)
  return {
    nome: text(p, ['hs_lead_name', 'title', 'TITLE', 'name', 'nome']),
    email: text(p, ['hs_associated_contact_email', 'email', 'EMAIL.0.VALUE']),
    telefone: text(p, ['phone', 'PHONE.0.VALUE']),
    empresa: text(p, ['company', 'COMPANY_TITLE', 'organization.name']),
    origem: text(p, ['source', 'SOURCE_ID', 'origin', 'origem']),
    pipeline_id: text(p, ['hs_pipeline', 'pipeline_id', 'pipeline.id', 'CATEGORY_ID']),
    fase_id: text(p, ['hs_pipeline_stage', 'stage_id', 'stageId', 'STATUS_ID']),
    responsavel_id: text(p, ['owner_id', 'hubspot_owner_id', 'ASSIGNED_BY_ID', 'user_id']),
    responsavel_nome: text(p, ['owner_name', 'ASSIGNED_BY_NAME', 'owner.name']),
    status: normalizeStatus(text(p, ['status', 'STATUS_ID', 'status_id', 'STATUS'])),
    criado_em: timestampValue(p, ['hs_createdate', 'createdate', 'created_at', 'add_time', 'DATE_CREATE']),
    atualizado_em: timestampValue(p, ['hs_lastmodifieddate', 'updated_at', 'update_time', 'DATE_MODIFY']),
  }
}

function opportunityFields(payload: JsonRecord) {
  const p = props(payload)
  return {
    nome: text(p, ['dealname', 'title', 'TITLE', 'name']),
    conta_id: text(p, ['company_id', 'org_id', 'organization.id', 'COMPANY_ID']),
    conta_nome: text(p, ['company_name', 'org_name', 'organization.name', 'COMPANY_TITLE']),
    contato_id: text(p, ['contact_id', 'person_id', 'person.id', 'CONTACT_ID']),
    contato_nome: text(p, ['contact_name', 'person_name', 'person.name', 'CONTACT_NAME']),
    pipeline_id: text(p, ['pipeline', 'pipeline_id', 'pipeline.id', 'CATEGORY_ID']),
    fase_id: text(p, ['dealstage', 'stage_id', 'stageId', 'STAGE_ID']),
    valor: numberValue(p, ['amount', 'value', 'OPPORTUNITY', 'valor']),
    moeda: text(p, ['currency', 'CURRENCY_ID', 'moeda']),
    probabilidade: numberValue(p, ['probability', 'PROBABILITY']),
    data_fechamento: dateValue(p, ['closedate', 'close_time', 'expected_close_date', 'CLOSEDATE']),
    responsavel_id: text(p, ['owner_id', 'hubspot_owner_id', 'ASSIGNED_BY_ID', 'user_id']),
    responsavel_nome: text(p, ['owner_name', 'ASSIGNED_BY_NAME', 'owner.name']),
    status: normalizeStatus(text(p, ['status', 'STATUS', 'STAGE_SEMANTIC_ID', 'dealstage'])),
    criado_em: timestampValue(p, ['createdate', 'created_at', 'add_time', 'DATE_CREATE']),
    atualizado_em: timestampValue(p, ['hs_lastmodifieddate', 'updated_at', 'update_time', 'DATE_MODIFY']),
  }
}

function activityFields(payload: JsonRecord) {
  const p = props(payload)
  return {
    titulo: text(p, ['hs_task_subject', 'subject', 'SUBJECT', 'title']),
    descricao: text(p, ['body', 'description', 'DESCRIPTION', 'note']),
    tipo: text(p, ['type', 'TYPE_ID', 'activity_type', 'kind']),
    status: normalizeStatus(text(p, ['hs_task_status', 'status', 'STATUS', 'done'])),
    due_at: timestampValue(p, ['hs_timestamp', 'due_date', 'due_time', 'deadline', 'DEADLINE']),
    concluido_em: timestampValue(p, ['marked_as_done_time', 'done_at', 'COMPLETED']),
    conta_id: text(p, ['company_id', 'org_id', 'OWNER_ID']),
    contato_id: text(p, ['person_id', 'contact_id', 'CONTACT_ID']),
    oportunidade_id: text(p, ['deal_id', 'DEAL_ID', 'OWNER_ID']),
    responsavel_id: text(p, ['owner_id', 'hubspot_owner_id', 'ASSIGNED_BY_ID', 'user_id']),
    responsavel_nome: text(p, ['owner_name', 'ASSIGNED_BY_NAME', 'owner.name']),
    criado_em: timestampValue(p, ['hs_createdate', 'created_at', 'add_time', 'CREATED']),
    atualizado_em: timestampValue(p, ['hs_lastmodifieddate', 'updated_at', 'update_time', 'LAST_UPDATED']),
  }
}

function userFields(payload: JsonRecord) {
  const p = props(payload)
  const firstName = text(p, ['firstName', 'first_name', 'NAME'])
  const lastName = text(p, ['lastName', 'last_name', 'LAST_NAME'])
  return {
    nome: text(p, ['name', 'NAME', 'label']) || [firstName, lastName].filter(Boolean).join(' ') || null,
    email: text(p, ['email', 'EMAIL']),
    telefone: text(p, ['phone', 'PERSONAL_PHONE', 'WORK_PHONE']),
    cargo: text(p, ['job_title', 'jobtitle', 'WORK_POSITION']),
    status: normalizeStatus(text(p, ['status', 'active', 'ACTIVE'])),
    criado_em: timestampValue(p, ['created_at', 'DATE_REGISTER']),
    atualizado_em: timestampValue(p, ['updated_at', 'modified_at']),
  }
}

function pipelineFields(payload: JsonRecord) {
  const p = props(payload)
  return {
    nome: text(p, ['label', 'name', 'NAME', 'title']),
    codigo: text(p, ['id', 'ID', 'code']),
    ordem: intValue(p, ['order', 'SORT', 'sort']),
    status: normalizeStatus(text(p, ['status', 'active', 'is_deleted'])),
    criado_em: timestampValue(p, ['created_at', 'created']),
    atualizado_em: timestampValue(p, ['updated_at', 'modified_at']),
  }
}

function stageFields(payload: JsonRecord) {
  const p = props(payload)
  return {
    pipeline_id: text(p, ['pipelineId', 'pipeline_id', 'pipeline.id', 'CATEGORY_ID', 'ENTITY_ID']),
    pipeline_nome: text(p, ['pipelineLabel', 'pipeline_name', 'pipeline.name']),
    nome: text(p, ['label', 'name', 'NAME', 'title']),
    codigo: text(p, ['id', 'ID', 'STATUS_ID', 'code']),
    ordem: intValue(p, ['display_order', 'order', 'SORT', 'sort']),
    probabilidade: numberValue(p, ['probability', 'PROBABILITY']),
    status: normalizeStatus(text(p, ['status', 'active'])),
    criado_em: timestampValue(p, ['created_at', 'created']),
    atualizado_em: timestampValue(p, ['updated_at', 'modified_at']),
  }
}

function fieldsFor(table: NormalizedTableName, payload: JsonRecord) {
  if (table === 'contas') return accountFields(payload)
  if (table === 'contatos') return contactFields(payload)
  if (table === 'leads') return leadFields(payload)
  if (table === 'oportunidades') return opportunityFields(payload)
  if (table === 'atividades') return activityFields(payload)
  if (table === 'usuarios') return userFields(payload)
  if (table === 'pipelines') return pipelineFields(payload)
  if (table === 'fases_pipeline') return stageFields(payload)
  return {}
}

export function normalizeCrmRows(input: NormalizationInput): NormalizationResult {
  const table = CRM_RESOURCE_TABLES[input.resource]
  if (!table) {
    return {
      provider: input.provider,
      resource: input.resource,
      status: 'skipped',
      rows: [],
      skippedRows: input.rows.length,
      message: `Recurso CRM ${input.resource} nao possui tabela normalized v1.`,
    }
  }

  const rows: NormalizedRow[] = input.rows.map((row, index) => {
    const payload = unwrapPayload(row)
    const next = {
      ...base(input, table, row, payload, index),
      ...fieldsFor(table, payload),
    }
    const { _insert_id, ...data } = next
    return { table, insertId: String(_insert_id), data }
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

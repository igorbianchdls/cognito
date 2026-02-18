import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

type Params = { resource: string; action: string }
type JsonMap = Record<string, unknown>
type CrudAction = 'listar' | 'criar' | 'atualizar' | 'deletar'
type DocsResource = 'templates' | 'template-versions' | 'documentos'

const RESOURCE_ACTIONS: Record<DocsResource, CrudAction[]> = {
  templates: ['listar', 'criar', 'atualizar', 'deletar'],
  'template-versions': ['listar', 'criar', 'atualizar', 'deletar'],
  documentos: ['listar', 'criar', 'atualizar', 'deletar'],
}

const TEMPLATE_TYPES = new Set(['proposta', 'os', 'fatura', 'contrato', 'nfse', 'outro'])
const DOCUMENT_STATUS = new Set(['rascunho', 'gerando', 'gerado', 'enviado', 'assinado', 'cancelado', 'erro'])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function toObj(input: unknown): JsonMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as JsonMap
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function textOrNull(value: unknown): string | null {
  const out = toText(value)
  return out ? out : null
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const k = Math.trunc(n)
  return k > 0 ? k : fallback
}

function intOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.trunc(n)
}

function boolOrNull(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (value == null || value === '') return null
  const v = String(value).trim().toLowerCase()
  if (v === 'true' || v === '1' || v === 'sim') return true
  if (v === 'false' || v === '0' || v === 'nao' || v === 'não') return false
  return null
}

function toJsonString(value: unknown): string {
  if (value == null || value === '') return '{}'
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return '{}'
    try {
      const parsed = JSON.parse(trimmed)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return '{}'
      return JSON.stringify(parsed)
    } catch {
      return '{}'
    }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return '{}'
}

function normalizeResource(value: unknown): DocsResource | null {
  const v = toText(value).toLowerCase().replace(/_/g, '-')
  if (v === 'templates' || v === 'template-versions' || v === 'documentos') return v
  return null
}

function normalizeAction(value: unknown): CrudAction | null {
  const v = toText(value).toLowerCase()
  if (v === 'listar' || v === 'criar' || v === 'atualizar' || v === 'deletar') return v
  return null
}

function parseTenantId(req: NextRequest, payload: JsonMap): number {
  const fromHeader = Number(req.headers.get('x-tenant-id') || '')
  if (Number.isFinite(fromHeader) && fromHeader > 0) return Math.trunc(fromHeader)
  const fromPayload = Number(payload.tenant_id)
  if (Number.isFinite(fromPayload) && fromPayload > 0) return Math.trunc(fromPayload)
  return 1
}

function unauthorized(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const chatId = req.headers.get('x-chat-id') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return !verifyAgentToken(chatId, token)
}

async function listRows(resource: DocsResource, tenantId: number, payload: JsonMap) {
  const q = toText(payload.q)
  const page = parsePositiveInt(payload.page, 1)
  const pageSize = Math.min(parsePositiveInt(payload.pageSize ?? payload.limit, 20), 200)
  const offset = (page - 1) * pageSize

  if (resource === 'templates') {
    const params: unknown[] = [tenantId]
    const where: string[] = ['tenant_id = $1']

    const tipo = toText(payload.tipo).toLowerCase()
    if (tipo) {
      params.push(tipo)
      where.push(`LOWER(COALESCE(tipo,'')) = $${params.length}`)
    }

    const ativo = boolOrNull(payload.ativo)
    if (ativo != null) {
      params.push(ativo)
      where.push(`ativo = $${params.length}`)
    }

    if (q) {
      params.push(q)
      where.push(`(codigo ILIKE '%' || $${params.length} || '%' OR nome ILIKE '%' || $${params.length} || '%' OR COALESCE(descricao,'') ILIKE '%' || $${params.length} || '%')`)
    }

    const whereSql = `WHERE ${where.join(' AND ')}`
    const rows = await runQuery(
      `SELECT id, tenant_id, codigo, nome, tipo, descricao, ativo, criado_em, atualizado_em
       FROM documentos.templates
       ${whereSql}
       ORDER BY id DESC
       LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
      [...params, pageSize, offset],
    )
    const [{ total }] = await runQuery<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM documentos.templates ${whereSql}`,
      params,
    )
    return { rows, count: total ?? rows.length }
  }

  if (resource === 'template-versions') {
    const params: unknown[] = [tenantId]
    const where: string[] = ['v.tenant_id = $1']

    const templateId = intOrNull(payload.template_id)
    if (templateId != null) {
      params.push(templateId)
      where.push(`v.template_id = $${params.length}`)
    }

    const publicado = boolOrNull(payload.publicado)
    if (publicado != null) {
      params.push(publicado)
      where.push(`v.publicado = $${params.length}`)
    }

    if (q) {
      params.push(q)
      where.push(`(COALESCE(v.notas,'') ILIKE '%' || $${params.length} || '%' OR COALESCE(t.codigo,'') ILIKE '%' || $${params.length} || '%' OR COALESCE(t.nome,'') ILIKE '%' || $${params.length} || '%')`)
    }

    const whereSql = `WHERE ${where.join(' AND ')}`
    const rows = await runQuery(
      `SELECT v.id, v.tenant_id, v.template_id, t.codigo AS template_codigo, t.nome AS template_nome,
              v.versao, v.publicado, v.publicado_em, v.notas, v.criado_em, v.atualizado_em
       FROM documentos.template_versions v
       LEFT JOIN documentos.templates t ON t.id = v.template_id AND t.tenant_id = v.tenant_id
       ${whereSql}
       ORDER BY v.template_id DESC, v.versao DESC, v.id DESC
       LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
      [...params, pageSize, offset],
    )
    const [{ total }] = await runQuery<{ total: number }>(
      `SELECT COUNT(*)::int AS total
       FROM documentos.template_versions v
       LEFT JOIN documentos.templates t ON t.id = v.template_id AND t.tenant_id = v.tenant_id
       ${whereSql}`,
      params,
    )
    return { rows, count: total ?? rows.length }
  }

  const params: unknown[] = [tenantId]
  const where: string[] = ['d.tenant_id = $1']

  const status = toText(payload.status).toLowerCase()
  if (status) {
    params.push(status)
    where.push(`LOWER(COALESCE(d.status,'')) = $${params.length}`)
  }

  const origemTipo = toText(payload.origem_tipo)
  if (origemTipo) {
    params.push(origemTipo)
    where.push(`d.origem_tipo = $${params.length}`)
  }

  const origemId = intOrNull(payload.origem_id)
  if (origemId != null) {
    params.push(origemId)
    where.push(`d.origem_id = $${params.length}`)
  }

  const templateId = intOrNull(payload.template_id)
  if (templateId != null) {
    params.push(templateId)
    where.push(`d.template_id = $${params.length}`)
  }

  if (q) {
    params.push(q)
    where.push(`(d.titulo ILIKE '%' || $${params.length} || '%' OR d.origem_tipo ILIKE '%' || $${params.length} || '%' OR COALESCE(t.codigo,'') ILIKE '%' || $${params.length} || '%')`)
  }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const rows = await runQuery(
    `SELECT d.id, d.tenant_id, d.template_id, d.template_version_id, t.codigo AS template_codigo, t.tipo AS template_tipo,
            d.origem_tipo, d.origem_id, d.titulo, d.status, d.drive_file_id, d.drive_signed_url, d.mime, d.erro_texto,
            d.gerado_em, d.enviado_em, d.criado_em, d.atualizado_em
     FROM documentos.documentos d
     LEFT JOIN documentos.templates t ON t.id = d.template_id AND t.tenant_id = d.tenant_id
     ${whereSql}
     ORDER BY d.id DESC
     LIMIT $${params.length + 1}::int OFFSET $${params.length + 2}::int`,
    [...params, pageSize, offset],
  )
  const [{ total }] = await runQuery<{ total: number }>(
    `SELECT COUNT(*)::int AS total
     FROM documentos.documentos d
     LEFT JOIN documentos.templates t ON t.id = d.template_id AND t.tenant_id = d.tenant_id
     ${whereSql}`,
    params,
  )
  return { rows, count: total ?? rows.length }
}

async function createRow(resource: DocsResource, tenantId: number, payload: JsonMap) {
  if (resource === 'templates') {
    const codigo = toText(payload.codigo).toLowerCase()
    const nome = toText(payload.nome)
    const tipo = toText(payload.tipo).toLowerCase()
    if (!codigo || !nome || !tipo) return { status: 400, body: { ok: false, error: 'codigo, nome e tipo são obrigatórios' } }
    if (!TEMPLATE_TYPES.has(tipo)) return { status: 400, body: { ok: false, error: `tipo inválido: ${tipo}` } }

    const descricao = textOrNull(payload.descricao)
    const ativo = boolOrNull(payload.ativo) ?? true
    const schemaJson = toJsonString(payload.schema_json ?? payload.schema)
    const layoutJson = toJsonString(payload.layout_json ?? payload.layout)
    const criadoPor = intOrNull(payload.criado_por)

    const rows = await runQuery<{ id: number }>(
      `INSERT INTO documentos.templates
         (tenant_id, codigo, nome, tipo, descricao, schema_json, layout_json, ativo, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9)
       RETURNING id`,
      [tenantId, codigo, nome, tipo, descricao, schemaJson, layoutJson, ativo, criadoPor],
    )
    return { status: 200, body: { ok: true, result: { success: true, id: rows[0]?.id, message: 'Template criado' } } }
  }

  if (resource === 'template-versions') {
    const templateId = intOrNull(payload.template_id)
    if (templateId == null || templateId <= 0) {
      return { status: 400, body: { ok: false, error: 'template_id é obrigatório' } }
    }

    let versao = intOrNull(payload.versao)
    if (versao == null || versao <= 0) {
      const [row] = await runQuery<{ next: number }>(
        `SELECT COALESCE(MAX(versao), 0)::int + 1 AS next
         FROM documentos.template_versions
         WHERE tenant_id = $1 AND template_id = $2`,
        [tenantId, templateId],
      )
      versao = Number(row?.next || 1)
    }

    const publicado = boolOrNull(payload.publicado) ?? false
    const publicadoEm = publicado ? (textOrNull(payload.publicado_em) || new Date().toISOString()) : null
    const notas = textOrNull(payload.notas)
    const conteudoJson = toJsonString(payload.conteudo_json ?? payload.json ?? payload.layout_json ?? payload.layout)
    const criadoPor = intOrNull(payload.criado_por)

    const rows = await runQuery<{ id: number }>(
      `INSERT INTO documentos.template_versions
         (tenant_id, template_id, versao, conteudo_json, publicado, publicado_em, notas, criado_por)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8)
       RETURNING id`,
      [tenantId, templateId, versao, conteudoJson, publicado, publicadoEm, notas, criadoPor],
    )
    return { status: 200, body: { ok: true, result: { success: true, id: rows[0]?.id, versao, message: 'Versão criada' } } }
  }

  const origemTipo = toText(payload.origem_tipo)
  const origemId = intOrNull(payload.origem_id)
  const titulo = toText(payload.titulo)
  if (!origemTipo || origemId == null || origemId <= 0 || !titulo) {
    return { status: 400, body: { ok: false, error: 'origem_tipo, origem_id e titulo são obrigatórios' } }
  }

  const templateId = intOrNull(payload.template_id)
  const templateVersionId = intOrNull(payload.template_version_id)
  const status = toText(payload.status || 'rascunho').toLowerCase()
  if (!DOCUMENT_STATUS.has(status)) return { status: 400, body: { ok: false, error: `status inválido: ${status}` } }

  const payloadJson = toJsonString(payload.payload_json ?? payload.payload)
  const htmlSnapshot = textOrNull(payload.html_snapshot)
  const driveFileIdRaw = textOrNull(payload.drive_file_id)
  if (driveFileIdRaw && !UUID_RE.test(driveFileIdRaw)) {
    return { status: 400, body: { ok: false, error: 'drive_file_id inválido (UUID esperado)' } }
  }
  const driveFileId = driveFileIdRaw
  const driveSignedUrl = textOrNull(payload.drive_signed_url)
  const mime = textOrNull(payload.mime) || 'application/pdf'
  const erroTexto = textOrNull(payload.erro_texto)
  const geradoEm = textOrNull(payload.gerado_em) || (status === 'gerado' || status === 'enviado' ? new Date().toISOString() : null)
  const enviadoEm = textOrNull(payload.enviado_em) || (status === 'enviado' ? new Date().toISOString() : null)
  const criadoPor = intOrNull(payload.criado_por)

  const rows = await runQuery<{ id: number }>(
    `INSERT INTO documentos.documentos
      (tenant_id, template_id, template_version_id, origem_tipo, origem_id, titulo, status, payload_json, html_snapshot,
       drive_file_id, drive_signed_url, mime, erro_texto, gerado_em, enviado_em, criado_por)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10::uuid,$11,$12,$13,$14,$15,$16)
     RETURNING id`,
    [
      tenantId,
      templateId,
      templateVersionId,
      origemTipo,
      origemId,
      titulo,
      status,
      payloadJson,
      htmlSnapshot,
      driveFileId,
      driveSignedUrl,
      mime,
      erroTexto,
      geradoEm,
      enviadoEm,
      criadoPor,
    ],
  )
  return { status: 200, body: { ok: true, result: { success: true, id: rows[0]?.id, message: 'Documento criado' } } }
}

async function updateRow(resource: DocsResource, tenantId: number, payload: JsonMap) {
  const id = intOrNull(payload.id)
  if (id == null || id <= 0) return { status: 400, body: { ok: false, error: 'id é obrigatório para atualizar' } }

  const fields: string[] = []
  const values: unknown[] = [tenantId]
  const add = (column: string, value: unknown) => {
    values.push(value)
    fields.push(`${column} = $${values.length}`)
  }

  if (resource === 'templates') {
    if (Object.prototype.hasOwnProperty.call(payload, 'codigo')) add('codigo', toText(payload.codigo).toLowerCase())
    if (Object.prototype.hasOwnProperty.call(payload, 'nome')) add('nome', toText(payload.nome))
    if (Object.prototype.hasOwnProperty.call(payload, 'tipo')) {
      const tipo = toText(payload.tipo).toLowerCase()
      if (!TEMPLATE_TYPES.has(tipo)) return { status: 400, body: { ok: false, error: `tipo inválido: ${tipo}` } }
      add('tipo', tipo)
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'descricao')) add('descricao', textOrNull(payload.descricao))
    if (Object.prototype.hasOwnProperty.call(payload, 'ativo')) add('ativo', boolOrNull(payload.ativo))
    if (Object.prototype.hasOwnProperty.call(payload, 'schema_json') || Object.prototype.hasOwnProperty.call(payload, 'schema')) {
      add('schema_json', toJsonString(payload.schema_json ?? payload.schema))
      fields[fields.length - 1] = `${fields[fields.length - 1]}::jsonb`
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'layout_json') || Object.prototype.hasOwnProperty.call(payload, 'layout')) {
      add('layout_json', toJsonString(payload.layout_json ?? payload.layout))
      fields[fields.length - 1] = `${fields[fields.length - 1]}::jsonb`
    }
  } else if (resource === 'template-versions') {
    if (Object.prototype.hasOwnProperty.call(payload, 'template_id')) add('template_id', intOrNull(payload.template_id))
    if (Object.prototype.hasOwnProperty.call(payload, 'versao')) add('versao', intOrNull(payload.versao))
    if (
      Object.prototype.hasOwnProperty.call(payload, 'conteudo_json') ||
      Object.prototype.hasOwnProperty.call(payload, 'json') ||
      Object.prototype.hasOwnProperty.call(payload, 'layout_json') ||
      Object.prototype.hasOwnProperty.call(payload, 'layout')
    ) {
      add('conteudo_json', toJsonString(payload.conteudo_json ?? payload.json ?? payload.layout_json ?? payload.layout))
      fields[fields.length - 1] = `${fields[fields.length - 1]}::jsonb`
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'publicado')) {
      const publicado = boolOrNull(payload.publicado)
      add('publicado', publicado)
      if (publicado === true && !Object.prototype.hasOwnProperty.call(payload, 'publicado_em')) {
        add('publicado_em', new Date().toISOString())
      }
      if (publicado === false && !Object.prototype.hasOwnProperty.call(payload, 'publicado_em')) {
        add('publicado_em', null)
      }
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'publicado_em')) add('publicado_em', textOrNull(payload.publicado_em))
    if (Object.prototype.hasOwnProperty.call(payload, 'notas')) add('notas', textOrNull(payload.notas))
  } else {
    if (Object.prototype.hasOwnProperty.call(payload, 'template_id')) add('template_id', intOrNull(payload.template_id))
    if (Object.prototype.hasOwnProperty.call(payload, 'template_version_id')) add('template_version_id', intOrNull(payload.template_version_id))
    if (Object.prototype.hasOwnProperty.call(payload, 'origem_tipo')) add('origem_tipo', toText(payload.origem_tipo))
    if (Object.prototype.hasOwnProperty.call(payload, 'origem_id')) add('origem_id', intOrNull(payload.origem_id))
    if (Object.prototype.hasOwnProperty.call(payload, 'titulo')) add('titulo', toText(payload.titulo))
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
      const status = toText(payload.status).toLowerCase()
      if (!DOCUMENT_STATUS.has(status)) return { status: 400, body: { ok: false, error: `status inválido: ${status}` } }
      add('status', status)
      if ((status === 'gerado' || status === 'enviado') && !Object.prototype.hasOwnProperty.call(payload, 'gerado_em')) {
        add('gerado_em', new Date().toISOString())
      }
      if (status === 'enviado' && !Object.prototype.hasOwnProperty.call(payload, 'enviado_em')) {
        add('enviado_em', new Date().toISOString())
      }
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'payload_json') || Object.prototype.hasOwnProperty.call(payload, 'payload')) {
      add('payload_json', toJsonString(payload.payload_json ?? payload.payload))
      fields[fields.length - 1] = `${fields[fields.length - 1]}::jsonb`
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'html_snapshot')) add('html_snapshot', textOrNull(payload.html_snapshot))
    if (Object.prototype.hasOwnProperty.call(payload, 'drive_file_id')) {
      const idRaw = textOrNull(payload.drive_file_id)
      if (idRaw && !UUID_RE.test(idRaw)) {
        return { status: 400, body: { ok: false, error: 'drive_file_id inválido (UUID esperado)' } }
      }
      add('drive_file_id', idRaw)
      fields[fields.length - 1] = `${fields[fields.length - 1]}::uuid`
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'drive_signed_url')) add('drive_signed_url', textOrNull(payload.drive_signed_url))
    if (Object.prototype.hasOwnProperty.call(payload, 'mime')) add('mime', textOrNull(payload.mime))
    if (Object.prototype.hasOwnProperty.call(payload, 'erro_texto')) add('erro_texto', textOrNull(payload.erro_texto))
    if (Object.prototype.hasOwnProperty.call(payload, 'gerado_em')) add('gerado_em', textOrNull(payload.gerado_em))
    if (Object.prototype.hasOwnProperty.call(payload, 'enviado_em')) add('enviado_em', textOrNull(payload.enviado_em))
  }

  if (!fields.length) return { status: 400, body: { ok: false, error: 'Nenhum campo para atualizar' } }
  add('atualizado_em', new Date().toISOString())
  values.push(id)

  const table =
    resource === 'templates'
      ? 'documentos.templates'
      : resource === 'template-versions'
        ? 'documentos.template_versions'
        : 'documentos.documentos'

  const rows = await runQuery<{ id: number }>(
    `UPDATE ${table}
     SET ${fields.join(', ')}
     WHERE tenant_id = $1 AND id = $${values.length}
     RETURNING id`,
    values,
  )
  if (!rows[0]?.id) return { status: 404, body: { ok: false, error: 'Registro não encontrado para atualizar' } }
  return { status: 200, body: { ok: true, result: { success: true, id: rows[0].id, message: 'Registro atualizado' } } }
}

async function deleteRow(resource: DocsResource, tenantId: number, payload: JsonMap) {
  const id = intOrNull(payload.id)
  if (id == null || id <= 0) return { status: 400, body: { ok: false, error: 'id é obrigatório para deletar' } }

  const table =
    resource === 'templates'
      ? 'documentos.templates'
      : resource === 'template-versions'
        ? 'documentos.template_versions'
        : 'documentos.documentos'

  const rows = await runQuery<{ id: number }>(
    `DELETE FROM ${table}
     WHERE tenant_id = $1 AND id = $2
     RETURNING id`,
    [tenantId, id],
  )
  if (!rows[0]?.id) return { status: 404, body: { ok: false, error: 'Registro não encontrado para deletar' } }
  return { status: 200, body: { ok: true, result: { success: true, id: rows[0].id, message: 'Registro deletado' } } }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    if (unauthorized(req)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const payload = toObj(await req.json().catch(() => ({})))
    const p = await params
    const resource = normalizeResource(p.resource)
    const action = normalizeAction(p.action)

    if (!resource || !action) {
      return Response.json({ ok: false, error: 'resource/action inválido' }, { status: 400 })
    }

    const allowed = RESOURCE_ACTIONS[resource]
    if (!allowed.includes(action)) {
      return Response.json({ ok: false, error: `action ${action} não permitida para ${resource}` }, { status: 400 })
    }

    const tenantId = parseTenantId(req, payload)

    if (action === 'listar') {
      const out = await listRows(resource, tenantId, payload)
      return Response.json({
        ok: true,
        result: {
          success: true,
          ...out,
          message: `${out.count} registros em documentos/${resource}`,
        },
      })
    }

    if (action === 'criar') {
      const out = await createRow(resource, tenantId, payload)
      return Response.json(out.body, { status: out.status })
    }

    if (action === 'atualizar') {
      const out = await updateRow(resource, tenantId, payload)
      return Response.json(out.body, { status: out.status })
    }

    const out = await deleteRow(resource, tenantId, payload)
    return Response.json(out.body, { status: out.status })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

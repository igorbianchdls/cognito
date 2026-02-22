import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'
import {
  buildDocumentoToolAttachmentFromRow,
  buildDocumentoToolHtmlSnapshot,
} from '@/products/documentos/backend/features/tooling/documentoToolArtifact'

export const runtime = 'nodejs'

type JsonMap = Record<string, unknown>
type DocumentoAction = 'gerar' | 'status'

const DOC_TYPES = new Set(['proposta', 'os', 'fatura', 'contrato', 'nfse'])

function toObj(input: unknown): JsonMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as JsonMap
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function intOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.trunc(n)
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

function normalizeAction(value: unknown): DocumentoAction | null {
  const v = toText(value).toLowerCase()
  if (v === 'gerar' || v === 'status') return v
  return null
}

function toolErrorJson(status: number, code: string, error: string) {
  return Response.json({ ok: false, error, code }, { status })
}

type DocumentoRow = {
  id: number
  template_id: number | null
  template_version_id: number | null
  template_tipo: string | null
  origem_tipo: string
  origem_id: number
  titulo: string
  status: string
  mime: string | null
  erro_texto: string | null
  criado_em: string
  atualizado_em: string
  gerado_em: string | null
  enviado_em: string | null
  html_snapshot: string | null
}

async function getDocumentoById(tenantId: number, documentoId: number) {
  const rows = await runQuery<DocumentoRow>(
    `SELECT
       d.id,
       d.template_id,
       d.template_version_id,
       t.tipo AS template_tipo,
       d.origem_tipo,
       d.origem_id,
       d.titulo,
       d.status,
       d.mime,
       d.erro_texto,
       d.criado_em,
       d.atualizado_em,
       d.gerado_em,
       d.enviado_em,
       d.html_snapshot
     FROM documentos.documentos d
     LEFT JOIN documentos.templates t
       ON t.id = d.template_id
      AND t.tenant_id = d.tenant_id
     WHERE d.tenant_id = $1
       AND d.id = $2
     LIMIT 1`,
    [tenantId, documentoId],
  )
  return rows[0] || null
}

async function normalizeDocumentoOutput(row: DocumentoRow) {
  const artifact = await buildDocumentoToolAttachmentFromRow({
    id: row.id,
    titulo: row.titulo,
    mime: row.mime,
    html_snapshot: row.html_snapshot,
  })
  const mime = artifact.mime

  return {
    documento: {
      id: row.id,
      template_id: row.template_id,
      template_version_id: row.template_version_id,
      template_tipo: row.template_tipo,
      origem_tipo: row.origem_tipo,
      origem_id: row.origem_id,
      titulo: row.titulo,
      status: row.status,
      mime,
      erro_texto: row.erro_texto,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
      gerado_em: row.gerado_em,
      enviado_em: row.enviado_em,
    },
    attachment: artifact.attachment,
  }
}

async function resolveTemplateId(tenantId: number, tipo: string, templateIdRaw: unknown) {
  const explicitId = intOrNull(templateIdRaw)
  if (explicitId != null && explicitId > 0) {
    const rows = await runQuery<{ id: number; tipo: string }>(
      `SELECT id, tipo
       FROM documentos.templates
       WHERE tenant_id = $1
         AND id = $2
       LIMIT 1`,
      [tenantId, explicitId],
    )
    const row = rows[0]
    if (!row) return { ok: false as const, error: 'template_id não encontrado para o tenant' }
    if (toText(row.tipo).toLowerCase() !== tipo) {
      return { ok: false as const, error: `template_id não corresponde ao tipo ${tipo}` }
    }
    return { ok: true as const, id: row.id }
  }

  const rows = await runQuery<{ id: number }>(
    `SELECT id
     FROM documentos.templates
     WHERE tenant_id = $1
       AND LOWER(tipo) = $2
       AND ativo = true
     ORDER BY atualizado_em DESC, id DESC
     LIMIT 1`,
    [tenantId, tipo],
  )
  if (!rows[0]?.id) {
    return { ok: false as const, error: `nenhum template ativo encontrado para tipo ${tipo}` }
  }
  return { ok: true as const, id: rows[0].id }
}

async function resolveTemplateVersionId(
  tenantId: number,
  templateId: number,
  templateVersionIdRaw: unknown,
) {
  const explicitId = intOrNull(templateVersionIdRaw)
  if (explicitId != null && explicitId > 0) {
    const rows = await runQuery<{ id: number }>(
      `SELECT id
       FROM documentos.template_versions
       WHERE tenant_id = $1
         AND template_id = $2
         AND id = $3
       LIMIT 1`,
      [tenantId, templateId, explicitId],
    )
    if (!rows[0]?.id) return { ok: false as const, error: 'template_version_id inválido para o template informado' }
    return { ok: true as const, id: rows[0].id }
  }

  const published = await runQuery<{ id: number }>(
    `SELECT id
     FROM documentos.template_versions
     WHERE tenant_id = $1
       AND template_id = $2
       AND publicado = true
     ORDER BY versao DESC, id DESC
     LIMIT 1`,
    [tenantId, templateId],
  )
  if (published[0]?.id) return { ok: true as const, id: published[0].id }

  const latest = await runQuery<{ id: number }>(
    `SELECT id
     FROM documentos.template_versions
     WHERE tenant_id = $1
       AND template_id = $2
     ORDER BY versao DESC, id DESC
     LIMIT 1`,
    [tenantId, templateId],
  )
  if (!latest[0]?.id) return { ok: false as const, error: 'nenhuma versão encontrada para o template' }
  return { ok: true as const, id: latest[0].id }
}

async function findIdempotentDocumento(input: {
  tenantId: number
  origemTipo: string
  origemId: number
  templateId: number
  idempotencyKey: string
}) {
  const rows = await runQuery<{ id: number }>(
    `SELECT d.id
     FROM documentos.documentos d
     WHERE d.tenant_id = $1
       AND d.origem_tipo = $2
       AND d.origem_id = $3
       AND d.template_id = $4
       AND COALESCE(d.payload_json->>'idempotency_key', '') = $5
     ORDER BY d.id DESC
     LIMIT 1`,
    [input.tenantId, input.origemTipo, input.origemId, input.templateId, input.idempotencyKey],
  )
  return rows[0]?.id || null
}

export async function POST(req: NextRequest) {
  try {
    if (unauthorized(req)) return toolErrorJson(401, 'TOOL_UNAUTHORIZED', 'unauthorized')

    const payload = toObj(await req.json().catch(() => ({})))
    const tenantId = parseTenantId(req, payload)
    const action = normalizeAction(payload.action)

    if (!action) {
      return toolErrorJson(400, 'DOCUMENTO_ACTION_INVALID', 'action inválida. Use gerar ou status.')
    }

    if (action === 'status') {
      const documentoId = intOrNull(payload.documento_id)
      if (documentoId == null || documentoId <= 0) {
        return toolErrorJson(400, 'DOCUMENTO_ID_REQUIRED', 'documento_id é obrigatório em status')
      }
      const row = await getDocumentoById(tenantId, documentoId)
      if (!row) return toolErrorJson(404, 'DOCUMENTO_NOT_FOUND', 'Documento não encontrado')
      const out = await normalizeDocumentoOutput(row)
      return Response.json({
        ok: true,
        result: { success: true, ...out },
      })
    }

    const tipo = toText(payload.tipo).toLowerCase()
    if (!DOC_TYPES.has(tipo)) {
      return toolErrorJson(400, 'DOCUMENTO_TIPO_INVALIDO', `tipo inválido: ${tipo || '(vazio)'}`)
    }

    const origemTipo = toText(payload.origem_tipo)
    const origemId = intOrNull(payload.origem_id)
    const dados = toObj(payload.dados)

    if (!origemTipo || origemId == null || origemId <= 0) {
      return toolErrorJson(400, 'DOCUMENTO_ORIGEM_REQUIRED', 'origem_tipo e origem_id são obrigatórios em gerar')
    }
    if (!Object.keys(dados).length) {
      return toolErrorJson(400, 'DOCUMENTO_DADOS_REQUIRED', 'dados é obrigatório e deve ser objeto não vazio')
    }

    const templateResolved = await resolveTemplateId(tenantId, tipo, payload.template_id)
    if (!templateResolved.ok) return toolErrorJson(400, 'DOCUMENTO_TEMPLATE_INVALID', templateResolved.error)

    const versionResolved = await resolveTemplateVersionId(tenantId, templateResolved.id, payload.template_version_id)
    if (!versionResolved.ok) return toolErrorJson(400, 'DOCUMENTO_TEMPLATE_VERSION_INVALID', versionResolved.error)

    const idempotencyKey = toText(payload.idempotency_key)
    if (idempotencyKey) {
      const existingId = await findIdempotentDocumento({
        tenantId,
        origemTipo,
        origemId,
        templateId: templateResolved.id,
        idempotencyKey,
      })
      if (existingId) {
        const existing = await getDocumentoById(tenantId, existingId)
        if (existing) {
          const out = await normalizeDocumentoOutput(existing)
          return Response.json({
            ok: true,
            result: { success: true, reused: true, ...out },
          })
        }
      }
    }

    const titulo = toText(payload.titulo) || `${tipo.toUpperCase()} ${origemTipo} #${origemId}`
    const htmlDocumento = buildDocumentoToolHtmlSnapshot({ tipo, titulo, origemTipo, origemId, dados })
    const criadoPor = intOrNull(payload.criado_por)
    const payloadJson = JSON.stringify({
      tipo,
      origem_tipo: origemTipo,
      origem_id: origemId,
      dados,
      idempotency_key: idempotencyKey || undefined,
    })

    const inserted = await runQuery<{
      id: number
    }>(
      `INSERT INTO documentos.documentos
        (tenant_id, template_id, template_version_id, origem_tipo, origem_id, titulo, status, payload_json, html_snapshot, mime, gerado_em, criado_por)
       VALUES
        ($1,$2,$3,$4,$5,$6,'gerado',$7::jsonb,$8,$9,now(),$10)
       RETURNING id`,
      [
        tenantId,
        templateResolved.id,
        versionResolved.id,
        origemTipo,
        origemId,
        titulo,
        payloadJson,
        htmlDocumento,
        'application/pdf',
        criadoPor,
      ],
    )

    const documentoId = inserted[0]?.id
    if (!documentoId) {
      return toolErrorJson(500, 'DOCUMENTO_CREATE_FAILED', 'Falha ao gerar documento')
    }

    const row = await getDocumentoById(tenantId, documentoId)
    if (!row) {
      return toolErrorJson(500, 'DOCUMENTO_LOAD_AFTER_CREATE_FAILED', 'Documento criado, mas não foi possível carregar o resultado')
    }

    const out = await normalizeDocumentoOutput(row)
    return Response.json({
      ok: true,
      result: {
        success: true,
        reused: false,
        ...out,
      },
    })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error), code: 'DOCUMENTO_TOOL_ERROR' },
      { status: 500 },
    )
  }
}

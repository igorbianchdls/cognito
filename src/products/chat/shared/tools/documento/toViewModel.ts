import type { DocumentoToolViewModel } from '@/products/chat/shared/tools/documento/types'

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toText(value: unknown): string | null {
  const v = String(value ?? '').trim()
  return v || null
}

function toNum(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function lower(value: unknown): string | null {
  const v = toText(value)
  return v ? v.toLowerCase() : null
}

function estimateBase64SizeBytes(base64: string | null): number | null {
  if (!base64) return null
  const cleaned = base64.replace(/\s+/g, '')
  if (!cleaned) return null
  const padding = cleaned.endsWith('==') ? 2 : (cleaned.endsWith('=') ? 1 : 0)
  return Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding)
}

export function extractDocumentoToolViewModel(input: unknown, output: unknown): DocumentoToolViewModel | null {
  if (!isRecord(output)) return null
  const root = output
  const payload = isRecord(root.data) ? root.data : (isRecord(root.result) ? root.result : root)
  if (!isRecord(payload)) return null

  const documento = isRecord(payload.documento) ? payload.documento : null
  const attachment = isRecord(payload.attachment) ? payload.attachment : null
  const drive = isRecord(payload.drive) ? payload.drive : null
  const driveFile = isRecord(drive?.file) ? (drive.file as JsonRecord) : null
  const inputObj = isRecord(input) ? input : null

  if (!documento && !attachment && !drive) return null

  const attachmentContentBase64 = toText(attachment?.content)
  const sizeBytes =
    toNum(driveFile?.sizeBytes) ??
    toNum(driveFile?.size_bytes) ??
    estimateBase64SizeBytes(attachmentContentBase64)

  return {
    ok: Boolean(root.ok ?? payload.success ?? true),
    action: lower(inputObj?.action),
    reused: Boolean(payload.reused),
    tipo: lower(documento?.template_tipo) ?? lower(inputObj?.tipo),
    documentoId: toNum(documento?.id),
    titulo: toText(documento?.titulo),
    status: toText(documento?.status),
    mime: toText(attachment?.content_type) ?? toText(documento?.mime),
    createdAt: toText(documento?.gerado_em) ?? toText(documento?.criado_em),
    fileName: toText(driveFile?.name) ?? toText(attachment?.filename),
    sizeBytes,
    signedUrl: toText(drive?.signed_url) ?? toText(driveFile?.url),
    driveFileId: toText(driveFile?.id),
    attachmentContentBase64,
  }
}


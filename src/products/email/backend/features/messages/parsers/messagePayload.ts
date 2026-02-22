import { parseAddressList } from '@/products/email/backend/shared/parsers'
import type {
  JsonObject,
  MessageAttachmentInput,
  MessageComposePayload,
  MessageLabelsPatchPayload,
} from '@/products/email/backend/features/messages/types'

function readString(value: unknown, { trim = true }: { trim?: boolean } = {}): string | undefined {
  if (typeof value !== 'string') return undefined
  const out = trim ? value.trim() : value
  return out || undefined
}

function parseLabelList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const list = value.map((s) => String(s || '').trim()).filter(Boolean)
    return list.length ? list : undefined
  }
  return parseAddressList(value)
}

function parseAttachments(value: unknown): MessageAttachmentInput[] | undefined {
  if (!Array.isArray(value)) return undefined
  const list = value
    .map((att) => {
      const obj = att && typeof att === 'object' ? (att as JsonObject) : {}
      return {
        filename: readString(obj.filename),
        contentType: readString(obj.contentType),
        contentDisposition: readString(obj.contentDisposition),
        contentId: readString(obj.contentId),
        content: readString(obj.content, { trim: false }),
        url: readString(obj.url),
      } satisfies MessageAttachmentInput
    })
    .filter((att) => Boolean(att.content) || Boolean(att.url))
  return list.length ? list : undefined
}

export function parseComposePayload(body: JsonObject): MessageComposePayload {
  return {
    to: parseAddressList(body.to),
    cc: parseAddressList(body.cc),
    bcc: parseAddressList(body.bcc),
    labels: parseLabelList(body.labels),
    subject: readString(body.subject),
    text: readString(body.text, { trim: false }),
    html: readString(body.html, { trim: false }),
    attachments: parseAttachments(body.attachments),
  }
}

export function parseLabelsPatchPayload(body: JsonObject): MessageLabelsPatchPayload {
  const addLabels = Array.isArray(body.addLabels)
    ? body.addLabels.map((s) => String(s || '').trim()).filter(Boolean)
    : undefined
  const removeLabels = Array.isArray(body.removeLabels)
    ? body.removeLabels.map((s) => String(s || '').trim()).filter(Boolean)
    : undefined
  return {
    addLabels: addLabels && addLabels.length ? addLabels : undefined,
    removeLabels: removeLabels && removeLabels.length ? removeLabels : undefined,
  }
}

export function readRequiredTrimmedString(
  body: JsonObject,
  key: string,
): string {
  return String(body[key] || '').trim()
}

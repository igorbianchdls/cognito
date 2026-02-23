"use client"

import { useState } from 'react'
import type { UIMessage, ToolUIPart } from 'ai'
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type TextPart = { type: 'text'; text: string }
type ReasoningPart = { type: 'reasoning'; content?: string; text?: string; state?: string }

type AnyPart = {
  type?: string
  state?: string
  toolCallId?: string
  input?: unknown
  output?: unknown
  errorText?: string
}

type JsonRecord = Record<string, unknown>

type DocumentoToolViewModel = {
  ok: boolean
  action: string | null
  reused: boolean
  tipo: string | null
  documentoId: number | null
  titulo: string | null
  status: string | null
  mime: string | null
  createdAt: string | null
  fileName: string | null
  sizeBytes: number | null
  signedUrl: string | null
  driveFileId: string | null
  attachmentContentBase64: string | null
}

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

function formatBytes(bytes: number | null) {
  if (bytes == null || !Number.isFinite(bytes)) return null
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

function formatDateTime(value: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('pt-BR')
}

function documentIcon(tipo: string | null) {
  switch (tipo) {
    case 'proposta':
      return '📄'
    case 'fatura':
      return '🧾'
    case 'contrato':
      return '📑'
    case 'os':
      return '🛠️'
    case 'nfse':
      return '🏛️'
    default:
      return '📎'
  }
}

function extractDocumentoToolViewModel(input: unknown, output: unknown): DocumentoToolViewModel | null {
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

function getDataUrl(mime: string | null, base64: string | null) {
  if (!mime || !base64) return null
  return `data:${mime};base64,${base64}`
}

function DocumentoArtifactCard({
  model,
  rawOutput,
}: {
  model: DocumentoToolViewModel
  rawOutput: unknown
}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const link = model.signedUrl ?? getDataUrl(model.mime, model.attachmentContentBase64)
  const canPreview = Boolean(link)
  const canDownload = Boolean(link)
  const sizeLabel = formatBytes(model.sizeBytes)
  const createdAtLabel = formatDateTime(model.createdAt)

  const handleCopyLink = async () => {
    if (!model.signedUrl || typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(model.signedUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // noop
    }
  }

  return (
    <div className="space-y-3 p-3">
      <div className="rounded-lg border bg-background p-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-lg">
            <span aria-hidden>{documentIcon(model.tipo)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-sm">{model.fileName || model.titulo || 'Documento'}</div>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {model.tipo ? <span className="rounded bg-muted px-1.5 py-0.5 uppercase">{model.tipo}</span> : null}
              {model.status ? <span className="rounded bg-muted px-1.5 py-0.5">{model.status}</span> : null}
              {model.reused ? <span className="rounded bg-muted px-1.5 py-0.5">reused</span> : null}
              {sizeLabel ? <span>{sizeLabel}</span> : null}
              {model.documentoId != null ? <span>doc #{model.documentoId}</span> : null}
              {model.driveFileId ? <span>drive ✓</span> : null}
            </div>
            {createdAtLabel ? (
              <div className="mt-1 text-[11px] text-muted-foreground">
                Gerado em {createdAtLabel}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={!canPreview} onClick={() => canPreview && setPreviewOpen(true)}>
            Visualizar
          </Button>
          {canDownload ? (
            <Button size="sm" variant="outline" asChild>
              <a
                href={link || '#'}
                target="_blank"
                rel="noreferrer"
                download={model.fileName || undefined}
              >
                Baixar
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Baixar
            </Button>
          )}
          {model.signedUrl ? (
            <Button size="sm" variant="ghost" onClick={handleCopyLink}>
              {copied ? 'Link copiado' : 'Copiar link'}
            </Button>
          ) : null}
        </div>
      </div>

      <details className="rounded-md border bg-background">
        <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground">Detalhes técnicos (JSON)</summary>
        <pre className="max-h-72 overflow-auto p-3 text-xs whitespace-pre-wrap">
          {JSON.stringify(rawOutput, null, 2)}
        </pre>
      </details>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-sm">{model.fileName || model.titulo || 'Documento'}</DialogTitle>
          </DialogHeader>
          {canPreview && link ? (
            <div className="h-[75vh] w-full bg-muted">
              <iframe
                title={model.fileName || 'Documento'}
                src={link}
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Preview indisponível para este documento.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DocumentoToolPart({ part, idx }: { part: ToolUIPart & AnyPart; idx: number }) {
  const callId = part.toolCallId || String(idx)
  const shouldBeOpen = part.state === 'output-available' || part.state === 'output-error'
  const t = part.type as string
  const model = part.state === 'output-available' ? extractDocumentoToolViewModel(part.input, part.output) : null

  return (
    <div key={`t-${callId}`} className="space-y-2">
      <Tool defaultOpen={shouldBeOpen}>
        <ToolHeader type={t as ToolUIPart['type']} state={part.state as ToolUIPart['state']} />
        <ToolContent>
          {part.input !== undefined ? <ToolInput input={part.input as ToolUIPart['input']} /> : null}
          {part.state === 'output-error'
            ? <ToolOutput output={null} errorText={part.errorText} />
            : null}
        </ToolContent>
      </Tool>
      {part.state === 'output-available' && (
        model ? (
          <ToolOutput output={<DocumentoArtifactCard model={model} rawOutput={part.output} />} errorText={undefined} />
        ) : (
          <ToolOutput output={<pre className="text-xs whitespace-pre-wrap">{JSON.stringify(part.output, null, 2)}</pre>} errorText={undefined} />
        )
      )}
    </div>
  )
}

const isTextPart = (p: unknown): p is TextPart => {
  const t = (p as { type?: string; text?: unknown })?.type
  return t === 'text' && typeof (p as { text?: unknown }).text === 'string'
}

const isReasoningPart = (p: unknown): p is ReasoningPart => {
  const t = (p as { type?: string })?.type
  return t === 'reasoning'
}

const isToolPart = (p: unknown): p is ToolUIPart & AnyPart => {
  const t = (p as { type?: string })?.type
  return typeof t === 'string' && t.startsWith('tool-')
}

export default function AssistantMessage({ message }: { message: UIMessage }) {
  const parts = (message.parts || []) as unknown[]
  const texts = parts.filter(isTextPart)
  const reasonings = parts.filter(isReasoningPart)
  const tools = parts.filter(isToolPart)

  return (
    <div className="space-y-2">
      {texts.map((t, idx) => (
        <div key={idx} className="whitespace-pre-wrap leading-6 text-[13px]">{t.text}</div>
      ))}

      {reasonings.map((r, idx) => {
        const content = r.content || r.text || ''
        const isStreaming = r.state === 'streaming'
        return (
          <Reasoning key={idx} isStreaming={isStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{content}</ReasoningContent>
          </Reasoning>
        )
      })}

      {tools.map((p, idx) => {
        const part = p as ToolUIPart & AnyPart
        if (part.type === 'tool-documento') {
          return <DocumentoToolPart key={`doc-${part.toolCallId || idx}`} part={part} idx={idx} />
        }
        const callId = part.toolCallId || String(idx)
        const shouldBeOpen = part.state === 'output-available' || part.state === 'output-error'
        const t = part.type as string

        return (
          <div key={`t-${callId}`} className="space-y-2">
            <Tool defaultOpen={shouldBeOpen}>
              <ToolHeader type={t as ToolUIPart['type']} state={part.state as ToolUIPart['state']} />
              <ToolContent>
                {part.input !== undefined ? <ToolInput input={part.input as ToolUIPart['input']} /> : null}
                {part.state === 'output-error'
                  ? <ToolOutput output={null} errorText={part.errorText} />
                  : null}
              </ToolContent>
            </Tool>
            {part.state === 'output-available' && (
              <ToolOutput output={<pre className="text-xs whitespace-pre-wrap">{JSON.stringify(part.output, null, 2)}</pre>} errorText={undefined} />
            )}
          </div>
        )
      })}
    </div>
  )
}

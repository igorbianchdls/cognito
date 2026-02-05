"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { ArrowLeft, Reply, Forward, Trash2, X, Plus, Mail, Clock3, Tag } from 'lucide-react'

type OutgoingAttachment = {
  id: string
  filename: string
  contentType?: string
  content: string
  size: number
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error(`Falha ao ler arquivo: ${file.name}`))
    reader.readAsDataURL(file)
  })
}

function formatDateTime(value: any): string {
  if (!value) return 'Sem data'
  const raw = String(value)
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function EmailReadPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [qsInboxId, setQsInboxId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState<any>(null)

  const [actionMode, setActionMode] = useState<'reply' | 'replyAll' | 'forward' | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionTo, setActionTo] = useState('')
  const [actionCc, setActionCc] = useState('')
  const [actionBcc, setActionBcc] = useState('')
  const [actionSubject, setActionSubject] = useState('')
  const [actionText, setActionText] = useState('')
  const [actionHtml, setActionHtml] = useState('')
  const [actionLabels, setActionLabels] = useState('')
  const [actionAttachments, setActionAttachments] = useState<OutgoingAttachment[]>([])

  const [labelsToAdd, setLabelsToAdd] = useState('')
  const [labelsToRemove, setLabelsToRemove] = useState('')
  const [labelsBusy, setLabelsBusy] = useState(false)
  const [labelsError, setLabelsError] = useState('')

  const messageId = params?.id
  const resolvedInboxId = qsInboxId || data?.inboxId || ''

  const fromEmail = useMemo(() => {
    if (!data) return ''
    return String(data?.from?.email || data?.from_email || data?.from || '').trim()
  }, [data])

  const fromName = useMemo(() => {
    if (!data) return 'Remetente'
    return String(data?.from?.name || data?.from_name || data?.from || 'Remetente').trim()
  }, [data])

  const toText = useMemo(() => {
    const to = data?.to
    if (Array.isArray(to)) return to.join(', ')
    if (typeof to === 'string') return to
    return ''
  }, [data])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href)
        const fromQuery = url.searchParams.get('inboxId') || ''
        const fromStorage = localStorage.getItem('email.activeInboxId') || ''
        setQsInboxId(fromQuery || fromStorage)
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (!messageId) return
    let ignore = false
    ;(async () => {
      setLoading(true); setError(''); setData(null)
      try {
        const inboxId = qsInboxId || ''
        const url = `/api/email/messages/${encodeURIComponent(messageId)}${inboxId ? `?inboxId=${encodeURIComponent(inboxId)}` : ''}`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!ignore) {
          if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha: ${res.status}`)
          setData(json?.data)
          setActionSubject(json?.data?.subject ? `Fwd: ${json.data.subject}` : 'Fwd:')
        }
      } catch (e: any) {
        if (!ignore) setError(e?.message || String(e))
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [messageId, qsInboxId])

  function resetActionComposer() {
    setActionError('')
    setActionTo('')
    setActionCc('')
    setActionBcc('')
    setActionText('')
    setActionHtml('')
    setActionLabels('')
    setActionAttachments([])
  }

  function openAction(mode: 'reply' | 'replyAll' | 'forward') {
    setActionMode(mode)
    setActionError('')
    if (mode === 'forward') {
      setActionTo('')
      setActionCc('')
      setActionBcc('')
      setActionSubject(data?.subject ? `Fwd: ${data.subject}` : 'Fwd:')
      setActionText('')
      setActionHtml('')
      setActionLabels('')
      setActionAttachments([])
      return
    }
    if (mode === 'reply') {
      setActionTo(fromEmail || '')
    } else {
      setActionTo('')
    }
    setActionCc('')
    setActionBcc('')
    setActionText('')
    setActionHtml('')
    setActionLabels('')
    setActionAttachments([])
  }

  async function onActionFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return
    try {
      const mapped = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
          content: await fileToBase64(file),
        }))
      )
      setActionAttachments((prev) => [...prev, ...mapped])
      event.target.value = ''
    } catch (e: any) {
      setActionError(e?.message || String(e))
    }
  }

  async function submitAction() {
    if (!messageId) return
    if (!resolvedInboxId) {
      setActionError('InboxId não encontrado. Volte para a inbox e abra a mensagem novamente.')
      return
    }
    if (!actionMode) return
    if (actionMode === 'forward' && !actionTo.trim()) {
      setActionError('Preencha o campo To para forward.')
      return
    }

    setActionBusy(true)
    setActionError('')
    try {
      const payload: any = {
        action: actionMode,
        inboxId: resolvedInboxId,
        to: parseCsv(actionTo),
        cc: parseCsv(actionCc),
        bcc: parseCsv(actionBcc),
        labels: parseCsv(actionLabels),
        text: actionText || undefined,
        html: actionHtml || undefined,
        attachments: actionAttachments.map((a) => ({
          filename: a.filename,
          contentType: a.contentType,
          content: a.content,
        })),
      }
      if (actionMode === 'forward') payload.subject = actionSubject || undefined

      const res = await fetch(`/api/email/messages/${encodeURIComponent(messageId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha: ${res.status}`)
      setActionMode(null)
      resetActionComposer()
    } catch (e: any) {
      setActionError(e?.message || String(e))
    } finally {
      setActionBusy(false)
    }
  }

  async function updateLabels() {
    if (!messageId) return
    if (!resolvedInboxId) {
      setLabelsError('InboxId não encontrado.')
      return
    }
    const addLabels = parseCsv(labelsToAdd)
    const removeLabels = parseCsv(labelsToRemove)
    if (addLabels.length === 0 && removeLabels.length === 0) {
      setLabelsError('Informe labels para adicionar/remover.')
      return
    }
    setLabelsBusy(true)
    setLabelsError('')
    try {
      const res = await fetch(`/api/email/messages/${encodeURIComponent(messageId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'labels',
          inboxId: resolvedInboxId,
          addLabels,
          removeLabels,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha: ${res.status}`)
      setData(json?.data || data)
      setLabelsToAdd('')
      setLabelsToRemove('')
    } catch (e: any) {
      setLabelsError(e?.message || String(e))
    } finally {
      setLabelsBusy(false)
    }
  }

  return (
    <Suspense fallback={<div className="p-4 text-xs text-gray-500">Carregando…</div>}>
      <SidebarProvider>
        <SidebarShadcn showHeaderTrigger={false} />
        <SidebarInset className="h-screen overflow-hidden bg-white">
          <div className="grid h-full grid-rows-[auto_1fr]">
            <div className="border-b border-neutral-200 bg-white px-3 py-3 md:px-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  <button
                    onClick={() => router.push('/email' + (qsInboxId ? `?inboxId=${encodeURIComponent(qsInboxId)}` : ''))}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <ArrowLeft className="size-3.5" /> Inbox
                  </button>
                  <h1 className="truncate text-base font-semibold text-neutral-900 md:text-lg">{data?.subject || 'Email'}</h1>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openAction('reply')} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"><Reply className="size-3.5" /> Reply</button>
                  <button onClick={() => openAction('replyAll')} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"><Plus className="size-3.5" /> Reply all</button>
                  <button onClick={() => openAction('forward')} className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50"><Forward className="size-3.5" /> Forward</button>
                  <button className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"><Trash2 className="size-3.5" /> Delete</button>
                </div>
              </div>
              {error ? <div className="mt-2 text-xs text-red-700">{error}</div> : null}
            </div>

            <div className="min-h-0 overflow-auto">
              <div className="mx-auto w-full max-w-5xl px-3 py-4 md:px-5 md:py-5">
                {loading ? (
                  <div className="text-sm text-neutral-500">Carregando…</div>
                ) : error ? (
                  <div className="text-sm text-red-600">{error}</div>
                ) : data ? (
                  <div className="space-y-4">
                    <div className="border border-neutral-200 bg-white">
                      <div className="border-b border-neutral-200 px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                              {(fromName.charAt(0) || '?').toUpperCase()}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="truncate text-sm font-semibold text-neutral-900">{fromName}</div>
                              <div className="inline-flex items-center gap-1 text-xs text-neutral-500">
                                <Mail className="size-3.5" />
                                <span className="truncate">{fromEmail || 'sem email do remetente'}</span>
                              </div>
                              {toText ? <div className="truncate text-xs text-neutral-500">Para: {toText}</div> : null}
                            </div>
                          </div>
                          <div className="inline-flex items-center gap-1 text-xs text-neutral-500">
                            <Clock3 className="size-3.5" />
                            {formatDateTime(data?.createdAt || data?.created_at || data?.timestamp || data?.date)}
                          </div>
                        </div>

                        {Array.isArray(data?.labels) && data.labels.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {data.labels.map((label: string) => (
                              <span key={label} className="inline-flex items-center gap-1 rounded-sm border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-600">
                                <Tag className="size-3" />
                                {label}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <article className="px-4 py-4">
                        {data?.html ? (
                          <div className="prose prose-sm max-w-none text-neutral-800" dangerouslySetInnerHTML={{ __html: data.html as string }} />
                        ) : (
                          <pre className="whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-neutral-800">{data?.text || data?.snippet || 'Sem conteúdo'}</pre>
                        )}
                      </article>

                      {Array.isArray(data?.attachments) && data.attachments.length > 0 ? (
                        <div className="border-t border-neutral-200 px-4 py-3">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Anexos</div>
                          <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                            {data.attachments.map((att: any, index: number) => {
                              const attachmentId = att?.attachmentId || att?.id
                              if (!attachmentId) return null
                              const href = `/api/email/messages/${encodeURIComponent(messageId || '')}/attachments/${encodeURIComponent(attachmentId)}?inboxId=${encodeURIComponent(resolvedInboxId)}`
                              return (
                                <a key={attachmentId || index} href={href} target="_blank" rel="noreferrer" className="truncate rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-xs text-blue-700 hover:bg-blue-50">
                                  {att?.filename || `attachment-${index + 1}`} ({Math.ceil(Number(att?.size || 0) / 1024)} KB)
                                </a>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="border border-neutral-200 bg-white px-4 py-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Gerenciar Labels</div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                        <input value={labelsToAdd} onChange={(e) => setLabelsToAdd(e.target.value)} className="h-9 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-400" placeholder="Adicionar (ex.: follow-up, vip)" />
                        <input value={labelsToRemove} onChange={(e) => setLabelsToRemove(e.target.value)} className="h-9 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-400" placeholder="Remover (ex.: unresolved)" />
                        <button onClick={updateLabels} disabled={labelsBusy} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60">Atualizar</button>
                      </div>
                      {labelsError ? <div className="mt-2 text-xs text-red-600">{labelsError}</div> : null}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500">Mensagem não encontrada.</div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {actionMode ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4">
          <div className="mt-8 w-full max-w-3xl overflow-hidden rounded-md border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-neutral-900">
                {actionMode === 'reply' ? 'Reply' : actionMode === 'replyAll' ? 'Reply all' : 'Forward'}
              </h2>
              <button onClick={() => { setActionMode(null); resetActionComposer() }} className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"><X className="size-4" /></button>
            </div>

            <div className="grid grid-cols-1 gap-3 px-4 py-4">
              <input value={actionTo} onChange={(e) => setActionTo(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400" placeholder="To (opcional para reply/replyAll)" />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input value={actionCc} onChange={(e) => setActionCc(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400" placeholder="CC (opcional)" />
                <input value={actionBcc} onChange={(e) => setActionBcc(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400" placeholder="BCC (opcional)" />
              </div>
              {actionMode === 'forward' ? (
                <input value={actionSubject} onChange={(e) => setActionSubject(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400" placeholder="Subject" />
              ) : null}
              <input value={actionLabels} onChange={(e) => setActionLabels(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400" placeholder="Labels (opcional)" />
              <textarea value={actionText} onChange={(e) => setActionText(e.target.value)} className="h-28 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-400" placeholder="Texto da mensagem" />
              <textarea value={actionHtml} onChange={(e) => setActionHtml(e.target.value)} className="h-20 rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs outline-none focus:border-neutral-400" placeholder="HTML (opcional)" />

              <div className="rounded-md border border-neutral-300 p-2.5">
                <div className="mb-2 text-xs font-medium text-neutral-700">Anexos</div>
                <input type="file" multiple onChange={onActionFileChange} className="text-xs" />
                {actionAttachments.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {actionAttachments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded bg-neutral-50 px-2 py-1.5 text-xs">
                        <span className="truncate">{a.filename} ({Math.ceil(a.size / 1024)} KB)</span>
                        <button onClick={() => setActionAttachments((prev) => prev.filter((x) => x.id !== a.id))} className="text-red-600">Remover</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {actionError ? <div className="text-xs text-red-600">{actionError}</div> : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-4 py-3">
              <button onClick={() => { setActionMode(null); resetActionComposer() }} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700">Cancelar</button>
              <button onClick={submitAction} disabled={actionBusy} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-60">
                {actionBusy ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Suspense>
  )
}

"use client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { ArrowLeft, Reply, Forward, Trash2, X, Plus } from 'lucide-react'

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
        <SidebarInset className="h-screen overflow-hidden">
          <div className="h-full grid grid-rows-[auto_1fr]">
            <div className="border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
              <div className="px-2 md:px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push('/email' + (qsInboxId ? `?inboxId=${encodeURIComponent(qsInboxId)}` : ''))} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><ArrowLeft className="mr-1 inline size-3.5" /> Inbox</button>
                    <h1 className="truncate text-lg font-semibold text-gray-900">{data?.subject || 'Email'}</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openAction('reply')} className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Reply className="mr-1 inline size-3.5" /> Reply</button>
                    <button onClick={() => openAction('replyAll')} className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Plus className="mr-1 inline size-3.5" /> Reply all</button>
                    <button onClick={() => openAction('forward')} className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"><Forward className="mr-1 inline size-3.5" /> Forward</button>
                    <button className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-red-600 hover:bg-gray-50"><Trash2 className="mr-1 inline size-3.5" /> Delete</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 overflow-auto">
              <div className="px-3 md:px-4 py-4">
                {loading ? (
                  <div className="text-xs text-gray-500">Carregando…</div>
                ) : error ? (
                  <div className="text-sm text-red-600">{error}</div>
                ) : data ? (
                  <div className="space-y-4">
                    <article className="prose prose-sm max-w-none">
                      <div className="mb-3 text-xs text-gray-500">
                        From: <span className="font-medium text-gray-800">{data?.from?.name || data?.from_name || '—'}</span> &lt;{data?.from?.email || data?.from_email || data?.from || '—'}&gt;
                      </div>
                      {Array.isArray(data?.labels) && data.labels.length > 0 ? (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {data.labels.map((label: string) => (
                            <span key={label} className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{label}</span>
                          ))}
                        </div>
                      ) : null}
                      {data?.html ? (
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.html as string }} />
                      ) : (
                        <pre className="whitespace-pre-wrap break-words text-gray-800">{data?.text || data?.snippet || 'Sem conteúdo'}</pre>
                      )}
                    </article>

                    {Array.isArray(data?.attachments) && data.attachments.length > 0 ? (
                      <div className="rounded-lg border bg-white p-3">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Anexos</div>
                        <div className="space-y-1">
                          {data.attachments.map((att: any, index: number) => {
                            const attachmentId = att?.attachmentId || att?.id
                            if (!attachmentId) return null
                            const href = `/api/email/messages/${encodeURIComponent(messageId || '')}/attachments/${encodeURIComponent(attachmentId)}?inboxId=${encodeURIComponent(resolvedInboxId)}`
                            return (
                              <a key={attachmentId || index} href={href} target="_blank" rel="noreferrer" className="block rounded border px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">
                                {att?.filename || `attachment-${index + 1}`} ({Math.ceil(Number(att?.size || 0) / 1024)} KB)
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-lg border bg-white p-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Labels</div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input value={labelsToAdd} onChange={(e) => setLabelsToAdd(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="Adicionar (ex.: follow-up, vip)" />
                        <input value={labelsToRemove} onChange={(e) => setLabelsToRemove(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="Remover (ex.: unresolved)" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={updateLabels} disabled={labelsBusy} className="rounded border px-3 py-1.5 text-xs disabled:opacity-60">Atualizar labels</button>
                        {labelsError ? <span className="text-xs text-red-600">{labelsError}</span> : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Mensagem não encontrada.</div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {actionMode ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4">
          <div className="mt-10 w-full max-w-3xl rounded-lg border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                {actionMode === 'reply' ? 'Reply' : actionMode === 'replyAll' ? 'Reply all' : 'Forward'}
              </h2>
              <button onClick={() => { setActionMode(null); resetActionComposer() }} className="rounded p-1 text-gray-500 hover:bg-gray-100"><X className="size-4" /></button>
            </div>

            <div className="grid grid-cols-1 gap-3 px-4 py-3">
              <input value={actionTo} onChange={(e) => setActionTo(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="To (opcional para reply/replyAll)" />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input value={actionCc} onChange={(e) => setActionCc(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="CC (opcional)" />
                <input value={actionBcc} onChange={(e) => setActionBcc(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="BCC (opcional)" />
              </div>
              {actionMode === 'forward' ? (
                <input value={actionSubject} onChange={(e) => setActionSubject(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="Subject" />
              ) : null}
              <input value={actionLabels} onChange={(e) => setActionLabels(e.target.value)} className="rounded border px-2 py-1.5 text-sm" placeholder="Labels (opcional)" />
              <textarea value={actionText} onChange={(e) => setActionText(e.target.value)} className="h-28 rounded border px-2 py-1.5 text-sm" placeholder="Texto da mensagem" />
              <textarea value={actionHtml} onChange={(e) => setActionHtml(e.target.value)} className="h-20 rounded border px-2 py-1.5 font-mono text-xs" placeholder="HTML (opcional)" />

              <div className="rounded border p-2">
                <div className="mb-2 text-xs font-medium text-gray-700">Anexos</div>
                <input type="file" multiple onChange={onActionFileChange} className="text-xs" />
                {actionAttachments.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {actionAttachments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1 text-xs">
                        <span className="truncate">{a.filename} ({Math.ceil(a.size / 1024)} KB)</span>
                        <button onClick={() => setActionAttachments((prev) => prev.filter((x) => x.id !== a.id))} className="text-red-600">Remover</button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {actionError ? <div className="text-xs text-red-600">{actionError}</div> : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <button onClick={() => { setActionMode(null); resetActionComposer() }} className="rounded border px-3 py-1.5 text-sm">Cancelar</button>
              <button onClick={submitAction} disabled={actionBusy} className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60">
                {actionBusy ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Suspense>
  )
}

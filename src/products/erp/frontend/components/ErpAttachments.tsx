'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FileText, Loader2, Paperclip, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'

export type ErpAttachmentDocument = 'conta_pagar' | 'conta_receber' | 'pagamento' | 'venda' | 'compra' | 'contrato' | 'ordem_servico'
type Attachment = { id: string; nome: string; mime_type: string; tamanho_bytes: number; finalidade: string; criado_em: string; criado_por: string | null }

const ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp,application/xml,text/xml,.xml'
const MAX_BYTES = 10 * 1024 * 1024
const size = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

async function sha256(file: File) {
  try {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
  } catch { return undefined }
}

/** Envia um arquivo para um documento: prepara (link assinado), envia direto ao bucket e confirma. */
export async function uploadErpAttachment(documento: ErpAttachmentDocument, registroId: string | number, file: File, finalidade?: string) {
  if (file.size > MAX_BYTES) throw new Error('O anexo deve ter até 10 MB.')
  const mime = file.type || (file.name.toLowerCase().endsWith('.xml') ? 'application/xml' : '')
  const prepared = await parseErpResponse<{ arquivo_id: number; upload_url: string; content_type: string }>(await fetch('/api/erp/anexos', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: { documento, registro_id: Number(registroId), nome: file.name, mime_type: mime, tamanho: file.size, ...(finalidade ? { finalidade } : {}) } }),
  }))
  const sent = await fetch(prepared.upload_url, { method: 'PUT', headers: { 'Content-Type': prepared.content_type, 'x-upsert': 'false' }, body: file })
  if (!sent.ok) throw new Error('Não foi possível enviar o arquivo. Tente novamente.')
  const hash = await sha256(file)
  await parseErpResponse(await fetch(`/api/erp/anexos/${prepared.arquivo_id}/confirmar`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values: hash ? { hash_sha256: hash } : {} }),
  }))
  return prepared.arquivo_id
}

// Lista de anexos de um documento, com envio, download (link de 60 s) e remoção.
export function ErpAttachments({ documento, registroId, canManage, title = 'Anexos' }: {
  documento: ErpAttachmentDocument; registroId: string | number; canManage: boolean; title?: string
}) {
  const [items, setItems] = useState<Attachment[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  // Anexos de vendas, contratos, OS e contas a receber são documentos preservados: não se removem.
  const removable = canManage && ['conta_pagar', 'compra', 'pagamento'].includes(documento)

  const load = useCallback(async () => {
    try {
      const body = await parseErpResponse<{ records: Attachment[] }>(await fetch(`/api/erp/anexos?documento=${documento}&registro_id=${registroId}`, { cache: 'no-store' }))
      setItems(body.records)
    } catch (loadError) { setItems([]); setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os anexos.') }
  }, [documento, registroId])
  useEffect(() => { void load() }, [load])

  async function upload(file?: File) {
    if (!file) return
    setBusy(true); setError(null)
    try { await uploadErpAttachment(documento, registroId, file); await load() }
    catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Não foi possível anexar o arquivo.') }
    finally { setBusy(false); if (input.current) input.current.value = '' }
  }
  async function download(item: Attachment) {
    setError(null)
    try {
      const body = await parseErpResponse<{ url: string }>(await fetch(`/api/erp/anexos/${item.id}`, { cache: 'no-store' }))
      window.open(body.url, '_blank', 'noopener,noreferrer')
    } catch (downloadError) { setError(downloadError instanceof Error ? downloadError.message : 'Não foi possível abrir o anexo.') }
  }
  async function remove(item: Attachment) {
    if (!window.confirm(`Remover o anexo "${item.nome}"?`)) return
    setBusy(true); setError(null)
    try { await parseErpResponse(await fetch(`/api/erp/anexos/${item.id}`, { method: 'DELETE' })); await load() }
    catch (removeError) { setError(removeError instanceof Error ? removeError.message : 'Não foi possível remover o anexo.') }
    finally { setBusy(false) }
  }

  return <section className="rounded-md border">
    <div className="flex items-center justify-between border-b px-3 py-2">
      <p className="text-sm font-medium">{title}</p>
      {canManage ? <>
        <input ref={input} type="file" accept={ACCEPT} className="hidden" onChange={event => void upload(event.target.files?.[0])} />
        <Button size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}Anexar</Button>
      </> : null}
    </div>
    {error ? <p role="alert" className="px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    {items === null ? <div className="p-3"><Loader2 className="size-4 animate-spin" /></div>
      : items.length === 0 ? <p className="px-3 py-3 text-sm text-gray-500">Nenhum anexo. PDF, imagem ou XML até 10 MB.</p>
      : <ul className="divide-y">{items.map(item => <li key={item.id} className="flex items-center gap-3 px-3 py-2 text-sm">
        <FileText className="size-4 shrink-0 text-gray-500" />
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{item.nome}</p>
          <p className="text-xs text-gray-500">{item.finalidade === 'comprovante' ? 'Comprovante · ' : ''}{size(item.tamanho_bytes)} · {new Date(item.criado_em).toLocaleDateString('pt-BR')}{item.criado_por ? ` · ${item.criado_por}` : ''}</p></div>
        <Button size="icon" variant="ghost" title="Baixar" onClick={() => void download(item)}><Download className="size-4" /></Button>
        {removable ? <Button size="icon" variant="ghost" title="Remover" disabled={busy} onClick={() => void remove(item)}><Trash2 className="size-4" /></Button> : null}
      </li>)}</ul>}
  </section>
}

// Comprovantes das baixas de um título: escolhe a baixa e mostra/anexa os arquivos dela.
export function ErpPaymentReceipts({ payments, canManage }: {
  payments: Array<{ id: string | number; data_pagamento?: string; numero_parcela?: number | string; estornado_em?: string | null; estorno_de_pagamento_id?: string | number | null }>
  canManage: boolean
}) {
  const options = payments.filter(payment => !payment.estorno_de_pagamento_id)
  const [selected, setSelected] = useState(options[0] ? String(options[0].id) : '')
  if (!options.length) return null
  return <div className="grid gap-2">
    <label className="flex items-center gap-2 text-sm"><span className="text-gray-600">Comprovantes da baixa</span>
      <select aria-label="Baixa" className="h-9 rounded-md border border-[#dfdfdc] bg-white px-2 text-sm" value={selected} onChange={event => setSelected(event.target.value)}>
        {options.map(payment => <option key={payment.id} value={String(payment.id)}>{payment.data_pagamento || ''} · parcela {payment.numero_parcela ?? '-'}{payment.estornado_em ? ' (estornada)' : ''}</option>)}
      </select>
    </label>
    {selected ? <ErpAttachments key={selected} documento="pagamento" registroId={selected} canManage={canManage} title="Comprovantes" /> : null}
  </div>
}

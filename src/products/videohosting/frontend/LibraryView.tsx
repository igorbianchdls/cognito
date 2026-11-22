'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { supabase as driveDb } from '@/products/drive/frontend/lib/supabase'
import { Card, Notice, Page } from '@/products/analytics/frontend/ui'
import { deniedMessage, supabase } from './supabase'
import { embedCode } from './Player'

type Video = { id: string; title: string; status: string; duration: number | null; public_code: string; created_at: string; trashed_at: string | null }
type DriveVideo = { id: string; name: string; duration: number | null; width: number; height: number; thumb_path: string | null }
const time = (s: number | null) => s ? `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}` : '—'

/** Publishing from the Drive: pick a video file; it plays from the Drive until the Bunny integration. */
function PublishDialog({ onClose, onPublished }: { onClose: () => void; onPublished: (id: string) => void }) {
  const { orgId } = useAuth()
  const [files, setFiles] = useState<DriveVideo[] | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!orgId) return
    let live = true
    void driveDb().from('files').select('id, name, duration, width, height, thumb_path').eq('workspace_id', orgId).eq('kind', 'video').is('trashed_at', null).order('updated_at', { ascending: false }).limit(200)
      .then(({ data, error }) => { if (live) { if (error) setError('Não foi possível ler o Drive.'); else setFiles(data as DriveVideo[]) } })
    return () => { live = false }
  }, [orgId])
  async function publish(f: DriveVideo) {
    if (!orgId) return
    setBusy(true)
    const { data, error } = await supabase().from('videos').insert({ workspace_id: orgId, title: f.name.replace(/\.[a-z0-9]{2,5}$/i, ''), source_file_id: f.id,
      duration: f.duration, width: f.width, height: f.height, poster_path: f.thumb_path }).select('id').single()
    setBusy(false)
    if (error) { setError(deniedMessage(error, 'Não foi possível publicar.')); return }
    onPublished(data.id as string)
  }
  const shown = (files ?? []).filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
  return (
    <div role="dialog" aria-modal="true" aria-label="Publicar vídeo do Drive" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="border-b border-[#eee] p-4">
          <h2 className="text-[16px] font-semibold">Publicar vídeo do Drive</h2>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar vídeo…" className="mt-3 h-10 w-full rounded-lg border border-[#e2e2e2] px-3 text-[14px]" />
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {error ? <p className="p-3 text-[14px] text-[#a33]">{error}</p> : !files ? <p className="p-3 text-[14px] text-[#888]">Carregando…</p>
            : !shown.length ? <p className="p-3 text-[14px] text-[#888]">Nenhum vídeo no Drive{query ? ' com esse nome' : ''}. <Link href="/drive" className="underline">Envie pelo Drive</Link>.</p>
            : shown.map(f => (
              <button key={f.id} type="button" disabled={busy} onClick={() => void publish(f)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#f5f5f5] disabled:opacity-50">
                <span className="min-w-0 truncate text-[14px] text-[#111]">{f.name}</span><span className="shrink-0 text-[13px] tabular-nums text-[#888]">{time(f.duration)}</span>
              </button>
            ))}
        </div>
        <div className="border-t border-[#eee] p-3 text-right"><button type="button" onClick={onClose} className="h-9 rounded-lg border border-[#e2e2e2] px-4 text-[14px]">Fechar</button></div>
      </div>
    </div>
  )
}

/** Vídeos: the company's published sales videos, with their embed code. */
export function LibraryView() {
  const { orgId, isLoaded } = useAuth()
  const router = useRouter()
  const [videos, setVideos] = useState<Video[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const load = useCallback(async () => {
    if (!orgId) return null
    const { data, error } = await supabase().from('videos').select('id, title, status, duration, public_code, created_at, trashed_at').eq('workspace_id', orgId).is('trashed_at', null).order('created_at', { ascending: false })
    return error ? { error: 'Não foi possível carregar os vídeos.' } : { list: data as Video[] }
  }, [orgId])
  useEffect(() => {
    if (!isLoaded) return
    let live = true
    void load().then(r => { if (live && r) { setError(r.error ?? null); if (r.list) setVideos(r.list) } })
    return () => { live = false }
  }, [isLoaded, load])

  const copy = (v: Video) => { void navigator.clipboard?.writeText(embedCode(window.location.origin, v.public_code)); setCopied(v.id); setTimeout(() => setCopied(null), 1500) }
  return (
    <Page title="Vídeos" subtitle="Vídeos de venda com o player do Otto: autoplay sem som, barra acelerada e botões no momento certo."
      actions={<button type="button" onClick={() => setPublishing(true)} className="h-10 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Publicar do Drive</button>}>
      {publishing ? <PublishDialog onClose={() => setPublishing(false)} onPublished={id => router.push(`/videohosting/${id}`)} /> : null}
      {error ? <Notice tone="error">{error}</Notice> : !videos ? <Notice>Carregando…</Notice> : !videos.length ? (
        <Notice>Nenhum vídeo publicado ainda. Clique em <b>Publicar do Drive</b> e escolha o vídeo de vendas.</Notice>
      ) : (
        <Card>
          <ul className="divide-y divide-[#f1f1f1]">
            {videos.map(v => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link href={`/videohosting/${v.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-[#111]">{v.title}</p>
                  <p className="text-[13px] text-[#888]">{time(v.duration)} · {v.status === 'pronto' ? 'pronto' : v.status} · publicado em {new Date(v.created_at).toLocaleDateString('pt-BR')}</p>
                </Link>
                <div className="flex gap-2">
                  <button type="button" onClick={() => copy(v)} className="h-9 rounded-lg border border-[#e2e2e2] px-3 text-[13px]">{copied === v.id ? 'Copiado' : 'Copiar código'}</button>
                  <Link href={`/videohosting/${v.id}`} className="grid h-9 place-items-center rounded-lg bg-[#111] px-3 text-[13px] font-medium text-white">Configurar</Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  )
}

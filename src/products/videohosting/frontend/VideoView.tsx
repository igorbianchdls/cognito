'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Card, Notice, Page } from '@/products/analytics/frontend/ui'
import { cleanDomain, mergeSettings, type PlayerSettings } from '../shared/settings'
import { deniedMessage, supabase } from './supabase'
import { embedCode, PlayerPreview } from './Player'
import { SettingsForm } from './SettingsForm'

type Video = { id: string; title: string; public_code: string; duration: number | null; settings: Record<string, unknown>; domains: string[] | null }
type Cta = { id: string; start_s: number; end_s: number | null; text: string; url: string; position: 'abaixo' | 'sobre'; background: string; color: string; new_tab: boolean }

/** "1:30" or "90" → 90 seconds; invalid → null. */
export const parseTime = (t: string) => {
  const v = t.trim()
  if (!v) return null
  const m = /^(\d+):([0-5]?\d)$/.exec(v)
  if (m) return Number(m[1]) * 60 + Number(m[2])
  return /^\d+(\.\d+)?$/.test(v) ? Number(v) : null
}
export const showTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

function CtaForm({ initial, onSave, onCancel }: { initial?: Cta; onSave: (c: Omit<Cta, 'id'>) => void; onCancel: () => void }) {
  const [text, setText] = useState(initial?.text ?? 'Quero garantir minha vaga')
  const [url, setUrl] = useState(initial?.url ?? 'https://')
  const [start, setStart] = useState(initial ? showTime(initial.start_s) : '0:30')
  const [end, setEnd] = useState(initial?.end_s ? showTime(initial.end_s) : '')
  const [position, setPosition] = useState<Cta['position']>(initial?.position ?? 'abaixo')
  const [background, setBackground] = useState(initial?.background ?? '#16a34a')
  const [color, setColor] = useState(initial?.color ?? '#ffffff')
  const [newTab, setNewTab] = useState(initial?.new_tab ?? false)
  const [problem, setProblem] = useState<string | null>(null)
  const submit = () => {
    const s = parseTime(start), e = end ? parseTime(end) : null
    if (s === null) return setProblem('Informe quando aparece, ex.: 12:30.')
    if (end && (e === null || e <= s)) return setProblem('O fim precisa ser depois do início.')
    if (!/^https?:\/\/.+\..+/.test(url)) return setProblem('Informe um link completo, começando com https://.')
    if (!text.trim()) return setProblem('Escreva o texto do botão.')
    onSave({ text: text.trim(), url, start_s: s, end_s: e, position, background, color, new_tab: newTab })
  }
  return (
    <div className="grid gap-3 rounded-xl border border-[#ececec] bg-[#fafafa] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-[13px] text-[#555]">Texto<input maxLength={120} value={text} onChange={e => setText(e.target.value)} className="h-9 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" /></label>
        <label className="grid gap-1 text-[13px] text-[#555]">Link<input value={url} onChange={e => setUrl(e.target.value)} className="h-9 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" /></label>
        <label className="grid gap-1 text-[13px] text-[#555]">Aparece em (min:seg)<input value={start} onChange={e => setStart(e.target.value)} placeholder="12:30" className="h-9 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" /></label>
        <label className="grid gap-1 text-[13px] text-[#555]">Some em (opcional)<input value={end} onChange={e => setEnd(e.target.value)} placeholder="até o fim" className="h-9 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" /></label>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#555]">
        <label className="flex items-center gap-2">Posição
          <select value={position} onChange={e => setPosition(e.target.value as Cta['position'])} className="h-9 rounded-lg border border-[#e2e2e2] bg-white px-2 text-[14px]"><option value="abaixo">Abaixo do vídeo</option><option value="sobre">Sobre o vídeo</option></select>
        </label>
        <label className="flex items-center gap-2">Fundo<input type="color" value={background} onChange={e => setBackground(e.target.value)} className="h-8 w-10" /></label>
        <label className="flex items-center gap-2">Texto<input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-8 w-10" /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={newTab} onChange={e => setNewTab(e.target.checked)} />Abrir em nova aba</label>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-xl px-4 py-2.5 text-[14px] font-bold" style={{ background, color }}>{text || 'Botão'}</span>
        <span className="flex-1" />
        {problem ? <span className="text-[13px] text-[#a33]">{problem}</span> : null}
        <button type="button" onClick={onCancel} className="h-9 rounded-lg border border-[#e2e2e2] px-3 text-[13px]">Cancelar</button>
        <button type="button" onClick={submit} className="h-9 rounded-lg bg-[#111] px-3 text-[13px] font-medium text-white">Salvar botão</button>
      </div>
    </div>
  )
}

/** One video: live preview, look and behavior, timed buttons, where it may play, and the code for the page. */
export function VideoView({ id }: { id: string }) {
  const { orgId, isLoaded } = useAuth()
  const router = useRouter()
  const [video, setVideo] = useState<Video | null>(null)
  const [preset, setPreset] = useState<unknown>(null)
  const [ctas, setCtas] = useState<Cta[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [custom, setCustom] = useState(false)
  const [settings, setSettings] = useState<PlayerSettings>(mergeSettings())
  const [ownDomains, setOwnDomains] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | 'novo' | null>(null)
  const [title, setTitle] = useState('')
  const [copied, setCopied] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!orgId) return null
    const [v, p, c] = await Promise.all([
      supabase().from('videos').select('id, title, public_code, duration, settings, domains').eq('id', id).eq('workspace_id', orgId).is('trashed_at', null).maybeSingle(),
      supabase().from('presets').select('settings').eq('workspace_id', orgId).maybeSingle(),
      supabase().from('ctas').select('id, start_s, end_s, text, url, position, background, color, new_tab').eq('video_id', id).order('start_s'),
    ])
    return { v, p, c }
  }, [id, orgId])
  const apply = (r: Awaited<ReturnType<typeof fetchAll>>) => {
    if (!r) return
    if (r.v.error || !r.v.data) { setError(r.v.error ? 'Não foi possível carregar o vídeo.' : 'Vídeo não encontrado nesta empresa.'); return }
    const v = r.v.data as Video
    setVideo(v); setTitle(v.title); setPreset(r.p.data?.settings ?? null)
    setCustom(Object.keys(v.settings ?? {}).length > 0)
    setSettings(mergeSettings(r.p.data?.settings, v.settings))
    setOwnDomains(v.domains ? v.domains.join(', ') : null)
    setCtas(((r.c.data ?? []) as Cta[]).map(c => ({ ...c, start_s: Number(c.start_s), end_s: c.end_s === null ? null : Number(c.end_s) })))
  }
  useEffect(() => {
    if (!isLoaded) return
    let live = true
    void fetchAll().then(r => { if (live) apply(r) })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply only sets state
  }, [isLoaded, fetchAll])
  const reload = async () => { apply(await fetchAll()); setVersion(n => n + 1) }
  const done = async (error: { code?: string } | null, ok: string) => { setMessage(error ? deniedMessage(error, 'Não foi possível salvar.') : ok); if (!error) await reload() }

  if (error) return <Page title="Vídeo"><Notice tone="error">{error} <Link href="/videohosting" className="underline">Voltar aos vídeos</Link></Notice></Page>
  if (!video) return <Page title="Vídeo"><Notice>Carregando…</Notice></Page>
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const code = embedCode(origin, video.public_code)
  const parsedDomains = ownDomains === null ? null : ownDomains.split(/[\s,;]+/).map(cleanDomain).filter((d): d is string => !!d)

  return (
    <Page title={video.title} subtitle={video.duration ? `Duração ${showTime(video.duration)}` : undefined}
      actions={<div className="flex gap-2">
        <Link href="/videohosting" className="grid h-10 place-items-center rounded-lg border border-[#e2e2e2] px-4 text-[14px]">Voltar</Link>
        <button type="button" onClick={async () => {
          if (!confirm('Tirar este vídeo do ar? A página que usa o código para de mostrar o vídeo.')) return
          const { error } = await supabase().from('videos').update({ trashed_at: new Date().toISOString() }).eq('id', video.id)
          if (error) setMessage(deniedMessage(error, 'Não foi possível tirar do ar.')); else router.push('/videohosting')
        }} className="h-10 rounded-lg border border-[#f0d4d4] px-4 text-[14px] text-[#a33]">Tirar do ar</button>
      </div>}>
      {message ? <div className="mb-4 rounded-xl border border-[#ececec] bg-white px-4 py-3 text-[14px] text-[#333]" role="status">{message}</div> : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-4">
          <Card title="Prévia"><PlayerPreview code={video.public_code} version={version} /><p className="mt-3 text-[12px] text-[#888]">A prévia mostra o que está salvo.</p></Card>
          <Card title="Código para a página">
            <p className="mb-2 text-[13px] text-[#555]">Cole onde o vídeo deve aparecer na página de vendas:</p>
            <div className="flex items-stretch gap-2">
              <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-[#111] px-3 py-2.5 text-[12px] text-[#eaeaea]">{code}</pre>
              <button type="button" onClick={() => { void navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="shrink-0 rounded-lg border border-[#e2e2e2] px-3 text-[13px]">{copied ? 'Copiado' : 'Copiar'}</button>
            </div>
          </Card>
        </div>
        <div className="grid content-start gap-4">
          <Card title="Nome">
            <div className="flex gap-2">
              <input value={title} maxLength={160} onChange={e => setTitle(e.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" />
              <button type="button" disabled={!title.trim() || title === video.title} onClick={async () => { const { error } = await supabase().from('videos').update({ title: title.trim() }).eq('id', video.id); await done(error, 'Nome salvo.') }}
                className="h-10 rounded-lg bg-[#111] px-4 text-[14px] text-white disabled:opacity-40">Salvar</button>
            </div>
          </Card>
          <Card title="Aparência e comportamento">
            <label className="mb-4 flex items-center gap-2 text-[14px]"><input type="checkbox" checked={!custom} onChange={e => { setCustom(!e.target.checked); if (e.target.checked) setSettings(mergeSettings(preset)) }} />
              Usar o padrão da empresa <Link href="/videohosting/configuracoes" className="text-[13px] text-[#2563eb] underline">editar padrão</Link></label>
            <SettingsForm value={settings} onChange={setSettings} disabled={!custom} />
            <button type="button" onClick={async () => { const { error } = await supabase().from('videos').update({ settings: custom ? settings : {} }).eq('id', video.id); await done(error, 'Aparência salva.') }}
              className="mt-4 h-10 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Salvar aparência</button>
          </Card>
          <Card title="Botões no vídeo">
            <p className="mb-3 text-[13px] text-[#666]">Aparecem no momento escolhido, por exemplo a oferta quando o preço é revelado.</p>
            <div className="grid gap-2">
              {ctas.map(c => editing === c.id ? (
                <CtaForm key={c.id} initial={c} onCancel={() => setEditing(null)} onSave={async v => { const { error } = await supabase().from('ctas').update(v).eq('id', c.id); setEditing(null); await done(error, 'Botão salvo.') }} />
              ) : (
                <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#ececec] px-3 py-2.5">
                  <span className="rounded-lg px-3 py-1.5 text-[13px] font-bold" style={{ background: c.background, color: c.color }}>{c.text}</span>
                  <span className="flex-1 text-[13px] text-[#666]">de {showTime(c.start_s)} {c.end_s ? `até ${showTime(c.end_s)}` : 'até o fim'} · {c.position === 'sobre' ? 'sobre o vídeo' : 'abaixo'}</span>
                  <button type="button" onClick={() => setEditing(c.id)} className="text-[13px] underline">Editar</button>
                  <button type="button" onClick={async () => { const { error } = await supabase().from('ctas').delete().eq('id', c.id); await done(error, 'Botão removido.') }} className="text-[13px] text-[#a33] underline">Remover</button>
                </div>
              ))}
              {editing === 'novo' ? <CtaForm onCancel={() => setEditing(null)} onSave={async v => { const { error } = await supabase().from('ctas').insert({ ...v, video_id: video.id, workspace_id: orgId }); setEditing(null); await done(error, 'Botão criado.') }} />
                : <button type="button" onClick={() => setEditing('novo')} className="h-10 rounded-lg border border-dashed border-[#cfcfcf] text-[14px] text-[#333]">+ Adicionar botão</button>}
            </div>
          </Card>
          <Card title="Onde pode tocar">
            <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={ownDomains === null} onChange={e => setOwnDomains(e.target.checked ? null : '')} />Usar os domínios da empresa <Link href="/videohosting/configuracoes" className="text-[13px] text-[#2563eb] underline">ver</Link></label>
            {ownDomains !== null ? (
              <label className="mt-3 grid gap-1 text-[13px] text-[#555]">Domínios só deste vídeo
                <input value={ownDomains} onChange={e => setOwnDomains(e.target.value)} placeholder="minhapagina.com.br, outra.com" className="h-10 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" />
                <span className="text-[12px] text-[#888]">{parsedDomains?.length ? `Toca em: ${parsedDomains.join(', ')} e subdomínios.` : 'Sem domínio, toca em qualquer site.'}</span>
              </label>
            ) : null}
            <button type="button" onClick={async () => { const { error } = await supabase().from('videos').update({ domains: parsedDomains }).eq('id', video.id); await done(error, 'Domínios salvos.') }}
              className="mt-3 h-10 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Salvar domínios</button>
          </Card>
        </div>
      </div>
    </Page>
  )
}

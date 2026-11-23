'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, Notice, Page } from '@/products/analytics/frontend/ui'
import { deniedMessage, supabase, type QuickReply, type Tag } from './data'
import { BusinessHoursCard } from './BusinessHoursCard'
import { TeamsCard } from './TeamsCard'
import { AiCard } from './AiCard'

const COLORS = ['#ef4444', '#f59e0b', '#16a34a', '#0ea5e9', '#6366f1', '#d946ef', '#6b7280']
const input = 'h-9 rounded-lg border border-[#e2e2e2] px-3 text-[14px]'

/** Labels for contacts and the team's saved answers ("/pix" in the composer). */
export function SettingsView() {
  const { orgId, isLoaded } = useAuth()
  const [tags, setTags] = useState<Tag[] | null>(null)
  const [quick, setQuick] = useState<QuickReply[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [tag, setTag] = useState({ name: '', color: COLORS[0] })
  const [qr, setQr] = useState<{ id?: string; shortcut: string; body: string }>({ shortcut: '', body: '' })

  const fetchAll = useCallback(async () => {
    if (!orgId) return null
    const [t, q] = await Promise.all([
      supabase().from('tags').select('id, name, color').eq('workspace_id', orgId).order('name'),
      supabase().from('quick_replies').select('id, shortcut, body').eq('workspace_id', orgId).order('shortcut'),
    ])
    return { tags: (t.data ?? []) as Tag[], quick: (q.data ?? []) as QuickReply[] }
  }, [orgId])
  useEffect(() => {
    if (!isLoaded) return
    let live = true
    void fetchAll().then(r => { if (live && r) { setTags(r.tags); setQuick(r.quick) } })
    return () => { live = false }
  }, [isLoaded, fetchAll, version])
  const done = (error: { code?: string } | null, ok: string, fail: string) => { setMessage(error ? deniedMessage(error, fail) : ok); if (!error) setVersion(v => v + 1); return !error }

  if (!tags) return <Page title="Configurações"><Notice>Carregando…</Notice></Page>
  return (
    <Page title="Configurações" subtitle="Etiquetas, respostas rápidas e horário de atendimento.">
      {message ? <div role="status" className="mb-4 rounded-xl border border-[#ececec] bg-white px-4 py-3 text-[14px]">{message}</div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Etiquetas">
          <p className="mb-3 text-[13px] text-[#666]">Para separar contatos (lead quente, cliente, suporte…). Depois servem para filtrar e para os disparos.</p>
          <ul className="mb-3 flex flex-wrap gap-2">
            {tags.map(t => (
              <li key={t.id} className="flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-[13px] text-white" style={{ background: t.color }}>
                {t.name}
                <button type="button" aria-label={`Excluir ${t.name}`} onClick={async () => {
                  if (!window.confirm(`Excluir a etiqueta "${t.name}"? Ela sai de todos os contatos.`)) return
                  const { error } = await supabase().from('tags').delete().eq('id', t.id); done(error, 'Etiqueta excluída.', 'Não foi possível excluir.')
                }} className="grid size-5 place-items-center rounded-full bg-black/20 text-[11px]">✕</button>
              </li>
            ))}
            {!tags.length ? <li className="text-[13px] text-[#777]">Nenhuma etiqueta ainda.</li> : null}
          </ul>
          <form className="flex flex-wrap items-center gap-2" onSubmit={async e => {
            e.preventDefault()
            if (!tag.name.trim()) return
            const { error } = await supabase().from('tags').insert({ workspace_id: orgId, name: tag.name.trim().slice(0, 40), color: tag.color })
            if (done(error, 'Etiqueta criada.', 'Não foi possível criar.')) setTag({ ...tag, name: '' })
          }}>
            <input value={tag.name} onChange={e => setTag({ ...tag, name: e.target.value })} placeholder="Nova etiqueta" aria-label="Nome da etiqueta" className={`${input} min-w-0 flex-1`} />
            <div role="radiogroup" aria-label="Cor" className="flex gap-1">
              {COLORS.map(c => <button key={c} type="button" role="radio" aria-checked={tag.color === c} aria-label={c} onClick={() => setTag({ ...tag, color: c })}
                className={`size-6 rounded-full ${tag.color === c ? 'ring-2 ring-[#111] ring-offset-2' : ''}`} style={{ background: c }} />)}
            </div>
            <button type="submit" className="h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Criar</button>
          </form>
        </Card>
        <Card title="Respostas rápidas">
          <p className="mb-3 text-[13px] text-[#666]">Na caixa de entrada, digite <b>/</b> e o atalho para usar. Ex.: /pix, /horario, /endereco.</p>
          <ul className="mb-3 grid gap-2">
            {quick.map(q => (
              <li key={q.id} className="rounded-lg border border-[#ececec] px-3 py-2 text-[13px]">
                <div className="flex items-center justify-between gap-2"><b>/{q.shortcut}</b>
                  <span className="flex gap-3">
                    <button type="button" onClick={() => setQr(q)} className="text-[#2563eb] underline">Editar</button>
                    <button type="button" onClick={async () => { const { error } = await supabase().from('quick_replies').delete().eq('id', q.id); done(error, 'Resposta excluída.', 'Não foi possível excluir.') }} className="text-[#a33] underline">Excluir</button>
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[#555]">{q.body}</p>
              </li>
            ))}
            {!quick.length ? <li className="text-[13px] text-[#777]">Nenhuma resposta salva ainda.</li> : null}
          </ul>
          <form className="grid gap-2" onSubmit={async e => {
            e.preventDefault()
            const shortcut = qr.shortcut.trim().toLowerCase().replace(/^\//, '')
            if (!/^[a-z0-9_-]{1,30}$/.test(shortcut)) return setMessage('Atalho só com letras minúsculas, números, "-" ou "_" (sem espaço nem acento).')
            if (!qr.body.trim()) return setMessage('Escreva o texto da resposta.')
            const data = { shortcut, body: qr.body.trim() }
            const { error } = qr.id ? await supabase().from('quick_replies').update(data).eq('id', qr.id) : await supabase().from('quick_replies').insert({ ...data, workspace_id: orgId })
            if (done(error, 'Resposta salva.', 'Não foi possível salvar.')) setQr({ shortcut: '', body: '' })
          }}>
            <input value={qr.shortcut} onChange={e => setQr({ ...qr, shortcut: e.target.value })} placeholder="atalho (ex.: pix)" aria-label="Atalho" className={input} />
            <textarea value={qr.body} onChange={e => setQr({ ...qr, body: e.target.value })} rows={3} placeholder="Texto que entra na resposta" aria-label="Texto" className="rounded-lg border border-[#e2e2e2] px-3 py-2 text-[14px]" />
            <div className="flex gap-2">
              <button type="submit" className="h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">{qr.id ? 'Salvar alteração' : 'Adicionar'}</button>
              {qr.id ? <button type="button" onClick={() => setQr({ shortcut: '', body: '' })} className="h-9 rounded-lg border border-[#e2e2e2] px-4 text-[14px]">Cancelar</button> : null}
            </div>
          </form>
        </Card>
        <BusinessHoursCard />
        <TeamsCard />
        <AiCard />
      </div>
    </Page>
  )
}

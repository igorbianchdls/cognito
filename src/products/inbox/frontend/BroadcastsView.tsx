'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Card, Notice, Page } from '@/products/analytics/frontend/ui'
import { deniedMessage, supabase } from './data'
import { countSegment } from './SegmentEditor'

type Channel = { id: string; name: string; kind: string; status: string }
type Template = { id: string; channel_id: string; name: string; language: string; category: string; header: string | null; body: string; footer: string | null; buttons: string[]; variables: string[]; status: string; reason: string | null }
type Broadcast = { id: string; name: string; kind: 'whatsapp' | 'email'; channel_id: string | null; template_id: string | null; segment_id: string | null; subject: string | null; body: string | null
  status: string; scheduled_at: string | null; started_at: string | null; finished_at: string | null; error: string | null; total: number; sent: number; failed: number; skipped: number; created_at: string }
type Segment = { id: string; name: string }

const input = 'mt-1 h-9 w-full rounded-lg border border-[#e2e2e2] bg-white px-2.5 text-[13px] text-[#111]'
const STATUS: Record<string, [string, string]> = {
  rascunho: ['Rascunho', '#8a8a8a'], agendado: ['Agendado', '#7c3aed'], enviando: ['Enviando', '#2563eb'], concluido: ['Concluído', '#16a34a'], cancelado: ['Cancelado', '#8a8a8a'], erro: ['Erro', '#dc2626'],
  pendente: ['Em análise', '#d97706'], aprovado: ['Aprovado', '#16a34a'], rejeitado: ['Rejeitado', '#dc2626'], pausado: ['Pausado', '#8a8a8a'],
}
const Badge = ({ s }: { s: string }) => { const [l, c] = STATUS[s] ?? [s, '#888']; return <span className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ color: c, background: c + '18' }}>{l}</span> }
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')
const VARS = [['primeiro_nome', 'Primeiro nome'], ['nome', 'Nome completo'], ['email', 'E-mail'], ['telefone', 'Telefone'], ['origem', 'Origem']]
const fillExample = (body: string, vars: string[]) => body.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => { const v = vars[Number(n) - 1]; return v ? `[${VARS.find(x => x[0] === v)?.[1] ?? v}]` : `{{${n}}}` })

async function post(url: string, body?: object) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })
  const data = await r.json().catch(() => ({})) as Record<string, unknown>
  return r.ok ? { ok: true as const, data } : { ok: false as const, erro: String(data.erro ?? 'Não foi possível concluir.') }
}

/** Mass messages: WhatsApp templates (approved by Meta) and e-mail, to a segment. */
export function BroadcastsView() {
  const params = useSearchParams(), router = useRouter(), pathname = usePathname()
  const tab = (['modelos', 'email'] as const).find(t => t === params.get('aba')) ?? 'disparos'
  const tabs = [['disparos', 'Disparos'], ['modelos', 'Modelos do WhatsApp'], ['email', 'E-mail']] as const
  return (
    <Page title="Disparos" subtitle="Mensagens em massa para um segmento, pelo WhatsApp (modelos aprovados pela Meta) ou por e-mail."
      actions={<div role="tablist" className="flex rounded-lg bg-[#f2f2f4] p-0.5 text-[13px]">
        {tabs.map(([t, l]) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => router.replace(t === 'disparos' ? pathname : `${pathname}?aba=${t}`)}
          className={`rounded-md px-3 py-1 ${tab === t ? 'bg-white font-medium shadow-sm' : 'text-[#636366]'}`}>{l}</button>)}
      </div>}>
      {tab === 'disparos' ? <Broadcasts /> : tab === 'modelos' ? <Templates /> : <EmailSettings />}
    </Page>
  )
}

function useBasics(version: number) {
  const { orgId } = useAuth()
  const [data, setData] = useState<{ channels: Channel[]; templates: Template[]; segments: Segment[] } | null>(null)
  useEffect(() => {
    if (!orgId) return
    let live = true
    void Promise.all([
      supabase().from('channels').select('id, name, kind, status').eq('workspace_id', orgId).in('kind', ['whatsapp', 'teste']).order('name'),
      supabase().from('wa_templates').select('id, channel_id, name, language, category, header, body, footer, buttons, variables, status, reason').eq('workspace_id', orgId).order('created_at', { ascending: false }),
      supabase().from('segments').select('id, name').eq('workspace_id', orgId).order('name'),
    ]).then(([c, t, s]) => { if (live) setData({ channels: (c.data ?? []) as Channel[], templates: (t.data ?? []) as Template[], segments: (s.data ?? []) as Segment[] }) })
    return () => { live = false }
  }, [orgId, version])
  return data
}

function Broadcasts() {
  const { orgId } = useAuth()
  const [version, setVersion] = useState(0)
  const basics = useBasics(version)
  const [rows, setRows] = useState<Broadcast[] | null>(null)
  const [open, setOpen] = useState<Partial<Broadcast> | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const reload = () => setVersion(v => v + 1)

  useEffect(() => {
    if (!orgId) return
    let live = true
    const load = () => void supabase().from('broadcasts').select('*').eq('workspace_id', orgId).order('created_at', { ascending: false }).limit(200)
      .then(r => { if (live) { const list = (r.data ?? []) as Broadcast[]; setRows(list); setOpen(o => (o?.id ? list.find(x => x.id === o.id) ?? o : o)) } })
    load()
    const t = setInterval(load, 5000)
    return () => { live = false; clearInterval(t) }
  }, [orgId, version])

  if (!rows || !basics) return <Notice>Carregando…</Notice>
  return (
    <>
      {message ? <div role="status" className="mb-4 rounded-xl border border-[#ececec] bg-white px-4 py-3 text-[14px]">{message}</div> : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="overflow-x-auto p-0">
          <div className="flex items-center justify-between border-b border-[#ececec] px-4 py-2.5">
            <p className="text-[13px] text-[#777]">{rows.length} disparo(s)</p>
            <button type="button" onClick={() => setOpen({ kind: 'whatsapp', name: '' })} className="h-8 rounded-lg bg-[#111] px-3 text-[13px] font-medium text-white">Novo disparo</button>
          </div>
          {!rows.length ? <p className="p-6 text-[14px] text-[#777]">Nenhum disparo ainda. Crie um segmento em Contatos e um modelo aprovado (WhatsApp) ou configure o remetente (e-mail).</p> : (
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-[#ececec] text-[12px] uppercase tracking-wide text-[#888]"><tr><th className="px-4 py-2 font-medium">Nome</th><th className="px-4 py-2 font-medium">Situação</th><th className="hidden px-4 py-2 font-medium sm:table-cell">Enviados</th><th className="hidden px-4 py-2 font-medium md:table-cell">Quando</th></tr></thead>
              <tbody>{rows.map(b => (
                <tr key={b.id} onClick={() => setOpen(b)} className={`cursor-pointer border-b border-[#f3f3f3] last:border-0 hover:bg-[#fafafa] ${open?.id === b.id ? 'bg-[#f3f4f6]' : ''}`}>
                  <td className="px-4 py-2.5 font-medium">{b.name}<span className="ml-2 text-[11px] font-normal text-[#888]">{b.kind === 'email' ? 'E-mail' : 'WhatsApp'}</span></td>
                  <td className="px-4 py-2.5"><Badge s={b.status} /></td>
                  <td className="hidden px-4 py-2.5 text-[#444] sm:table-cell">{b.status === 'rascunho' ? '' : `${b.sent} de ${b.total - b.skipped}`}{b.failed ? <span className="ml-1 text-[#dc2626]">· {b.failed} falha(s)</span> : null}</td>
                  <td className="hidden px-4 py-2.5 text-[#666] md:table-cell">{when(b.started_at ?? b.scheduled_at ?? b.created_at)}</td>
                </tr>))}</tbody>
            </table>
          )}
        </Card>
        {open ? (open.status && open.status !== 'rascunho'
          ? <Progress key={open.id} b={open as Broadcast} onMessage={setMessage} onChanged={reload} onClose={() => setOpen(null)} />
          : <Draft key={open.id ?? 'novo'} b={open} basics={basics} onMessage={setMessage} onChanged={() => { reload(); setOpen(null) }} onClose={() => setOpen(null)} />) : null}
      </div>
    </>
  )
}

function Draft({ b, basics, onMessage, onChanged, onClose }: { b: Partial<Broadcast>; basics: NonNullable<ReturnType<typeof useBasics>>; onMessage: (m: string) => void; onChanged: () => void; onClose: () => void }) {
  const { orgId } = useAuth()
  const [f, setF] = useState({ name: b.name ?? '', kind: b.kind ?? 'whatsapp', channel_id: b.channel_id ?? basics.channels[0]?.id ?? '', template_id: b.template_id ?? '', segment_id: b.segment_id ?? '',
    subject: b.subject ?? '', body: b.body ?? '', scheduled_at: b.scheduled_at ? new Date(new Date(b.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '' })
  const [count, setCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const approved = basics.templates.filter(t => t.channel_id === f.channel_id && t.status === 'aprovado')
  const template = basics.templates.find(t => t.id === f.template_id)
  useEffect(() => {
    if (!f.segment_id) return
    let live = true
    void countSegment({ segmento_id: f.segment_id, limite: 0 }).then(r => { if (live) setCount('erro' in r ? null : r.total) })
    return () => { live = false }
  }, [f.segment_id])

  async function save(): Promise<string | null> {
    if (!f.name.trim()) { onMessage('Dê um nome ao disparo.'); return null }
    const data = { name: f.name.trim(), kind: f.kind, segment_id: f.segment_id || null, channel_id: f.kind === 'whatsapp' ? f.channel_id || null : null, template_id: f.kind === 'whatsapp' ? f.template_id || null : null,
      subject: f.kind === 'email' ? f.subject || null : null, body: f.kind === 'email' ? f.body || null : null, scheduled_at: f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null }
    const { data: row, error } = b.id ? await supabase().from('broadcasts').update(data).eq('id', b.id).select('id').single()
      : await supabase().from('broadcasts').insert({ ...data, workspace_id: orgId }).select('id').single()
    if (error) { onMessage(deniedMessage(error, 'Não foi possível salvar o disparo.')); return null }
    return (row as { id: string }).id
  }
  async function saveOnly() { setBusy(true); const id = await save(); setBusy(false); if (id) { onMessage('Rascunho salvo.'); onChanged() } }
  async function send() {
    const later = f.scheduled_at && new Date(f.scheduled_at).getTime() > Date.now() + 60000
    if (!window.confirm(later ? `Agendar para ${new Date(f.scheduled_at).toLocaleString('pt-BR')}?` : `Enviar agora para ${count ?? 'os'} contato(s) do segmento? Quem pediu para não receber fica de fora.`)) return
    setBusy(true)
    const id = await save()
    if (!id) return setBusy(false)
    const r = await post(`/api/inbox/disparos/${id}/iniciar`)
    setBusy(false)
    onMessage(r.ok ? (r.data.status === 'agendado' ? 'Disparo agendado.' : 'Disparo iniciado. As mensagens saem aos poucos, alguns minutos para listas grandes.') : r.erro)
    onChanged()
  }

  return (
    <Card title={b.id ? 'Rascunho' : 'Novo disparo'} className="h-fit">
      <div className="grid gap-3 text-[13px] text-[#555]">
        <label>Nome<input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Ex.: Black Friday – lista quente" className={input} /></label>
        <div role="radiogroup" className="flex rounded-lg bg-[#f2f2f4] p-0.5">
          {(['whatsapp', 'email'] as const).map(k => <button key={k} type="button" role="radio" aria-checked={f.kind === k} onClick={() => setF({ ...f, kind: k })}
            className={`flex-1 rounded-md py-1 ${f.kind === k ? 'bg-white font-medium text-[#111] shadow-sm' : ''}`}>{k === 'whatsapp' ? 'WhatsApp' : 'E-mail'}</button>)}
        </div>
        <label>Para quem (segmento)
          <select value={f.segment_id} onChange={e => setF({ ...f, segment_id: e.target.value })} className={input}>
            <option value="">Escolha…</option>{basics.segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {f.segment_id && count != null ? <span className="mt-1 block text-[12px] text-[#777]">{count} contato(s) hoje</span> : null}
          {!basics.segments.length ? <span className="mt-1 block text-[12px] text-[#777]">Crie um segmento em Contatos → Novo segmento.</span> : null}
        </label>
        {f.kind === 'whatsapp' ? (<>
          <label>Número
            <select value={f.channel_id} onChange={e => setF({ ...f, channel_id: e.target.value, template_id: '' })} className={input}>
              {!basics.channels.length ? <option value="">Nenhum WhatsApp conectado</option> : null}{basics.channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Modelo aprovado
            <select value={f.template_id} onChange={e => setF({ ...f, template_id: e.target.value })} className={input}>
              <option value="">{approved.length ? 'Escolha…' : 'Nenhum modelo aprovado neste número'}</option>{approved.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          {template ? <div className="whitespace-pre-wrap rounded-lg bg-[#e7f8df] p-3 text-[13px] text-[#111]">{template.header ? <b className="mb-1 block">{template.header}</b> : null}{fillExample(template.body, template.variables)}{template.footer ? <span className="mt-1 block text-[11px] text-[#666]">{template.footer}</span> : null}</div> : null}
          <p className="text-[12px] text-[#888]">Pela regra da Meta, fora da janela de 24 h só modelos aprovados podem ser enviados. Quem responder SAIR deixa de receber.</p>
        </>) : (<>
          <label>Assunto<input value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} placeholder="Ex.: {{primeiro_nome}}, sua vaga está garantida" className={input} /></label>
          <label>Texto
            <textarea value={f.body} onChange={e => setF({ ...f, body: e.target.value })} rows={9} placeholder={'Oi {{primeiro_nome}},\n\n…'} className={`${input} h-auto py-2`} />
            <span className="mt-1 block text-[12px] text-[#888]">Use {'{{primeiro_nome}}'}, {'{{nome}}'}, {'{{email}}'} ou campos do contato. O rodapé com o link de descadastro entra sozinho.</span>
          </label>
        </>)}
        <label>Agendar (opcional)<input type="datetime-local" value={f.scheduled_at} onChange={e => setF({ ...f, scheduled_at: e.target.value })} className={input} /></label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void send()} className="h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white disabled:opacity-50">{f.scheduled_at ? 'Agendar' : 'Enviar'}</button>
          <button type="button" disabled={busy} onClick={() => void saveOnly()} className="h-9 rounded-lg border border-[#e2e2e2] px-4 text-[14px]">Salvar rascunho</button>
          <button type="button" onClick={onClose} className="h-9 px-2 text-[14px] text-[#666]">Fechar</button>
          {b.id ? <button type="button" onClick={async () => { if (!window.confirm('Excluir este rascunho?')) return; const { error } = await supabase().from('broadcasts').delete().eq('id', b.id!); if (error) onMessage(deniedMessage(error, 'Não foi possível excluir.')); else { onClose(); onChanged() } }} className="ml-auto text-[13px] text-[#a33] underline">Excluir</button> : null}
        </div>
      </div>
    </Card>
  )
}

function Progress({ b, onMessage, onChanged, onClose }: { b: Broadcast; onMessage: (m: string) => void; onChanged: () => void; onClose: () => void }) {
  const [problems, setProblems] = useState<{ status: string; error: string | null; contact: { name: string } | null }[]>([])
  useEffect(() => {
    let live = true
    void supabase().from('broadcast_recipients').select('status, error, contact:contacts(name)').eq('broadcast_id', b.id).in('status', ['falhou', 'ignorado']).limit(100)
      .then(r => { if (live) setProblems((r.data ?? []) as unknown as typeof problems) })
    return () => { live = false }
  }, [b.id, b.sent, b.failed])
  const reach = b.total - b.skipped
  const pct = reach ? Math.round(((b.sent + b.failed) / reach) * 100) : 100
  return (
    <Card title={b.name} className="h-fit">
      <div className="grid gap-3 text-[13px]">
        <div className="flex items-center gap-2"><Badge s={b.status} /><span className="text-[#777]">{b.kind === 'email' ? 'E-mail' : 'WhatsApp'}</span></div>
        {b.status === 'agendado' ? <p>Sai em {when(b.scheduled_at)}.</p> : null}
        {b.error ? <p className="text-[#dc2626]">{b.error}</p> : null}
        {b.status !== 'agendado' ? (<>
          <div className="h-2 overflow-hidden rounded-full bg-[#eee]"><div className="h-full bg-[#16a34a]" style={{ width: `${pct}%` }} /></div>
          <dl className="grid grid-cols-2 gap-2">
            {[['Enviados', b.sent], ['Falhas', b.failed], ['Ignorados', b.skipped], ['No segmento', b.total]].map(([l, v]) => <div key={l} className="rounded-lg bg-[#fafafa] p-2"><dt className="text-[11px] text-[#888]">{l}</dt><dd className="text-[18px] font-semibold">{v}</dd></div>)}
          </dl>
        </>) : null}
        {problems.length ? <div><p className="mb-1 font-medium">Quem não recebeu</p><ul className="max-h-56 overflow-auto text-[12px]">{problems.map((p, i) => <li key={i} className="border-b border-[#f3f3f3] py-1"><b>{p.contact?.name ?? 'Contato excluído'}</b> · {p.error}</li>)}</ul></div> : null}
        <div className="flex gap-2">
          {['agendado', 'enviando'].includes(b.status) ? <button type="button" onClick={async () => { if (!window.confirm('Cancelar o que ainda não foi enviado?')) return; const r = await post(`/api/inbox/disparos/${b.id}/cancelar`); onMessage(r.ok ? 'Disparo cancelado.' : r.erro); onChanged() }}
            className="h-9 rounded-lg border border-[#e2e2e2] px-4 text-[14px]">Cancelar disparo</button> : null}
          <button type="button" onClick={onClose} className="h-9 px-2 text-[14px] text-[#666]">Fechar</button>
        </div>
      </div>
    </Card>
  )
}

function Templates() {
  const { orgId } = useAuth()
  const [version, setVersion] = useState(0)
  const basics = useBasics(version)
  const [editing, setEditing] = useState<Partial<Template> | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const reload = () => setVersion(v => v + 1)
  const channelName = useMemo(() => new Map((basics?.channels ?? []).map(c => [c.id, c.name])), [basics])

  const sync = useCallback(async (quiet = false) => {
    for (const c of (basics?.channels ?? []).filter(c => c.kind === 'whatsapp')) {
      const r = await post('/api/inbox/modelos/sincronizar', { canal_id: c.id })
      if (!r.ok && !quiet) return setMessage(r.erro)
    }
    if (!quiet) setMessage('Situação dos modelos atualizada.')
  }, [basics])

  async function save(t: Partial<Template>, submit: boolean) {
    const data = { channel_id: t.channel_id, name: (t.name ?? '').trim(), language: t.language ?? 'pt_BR', category: t.category ?? 'MARKETING', header: t.header?.trim() || null, body: (t.body ?? '').trim(),
      footer: t.footer?.trim() || null, buttons: (t.buttons ?? []).map(x => x.trim()).filter(Boolean), variables: t.variables ?? [] }
    if (!data.channel_id || !data.name || !data.body) return setMessage('Escolha o número, dê um nome e escreva o texto.')
    const { data: row, error } = t.id ? await supabase().from('wa_templates').update(data).eq('id', t.id).select('id').single()
      : await supabase().from('wa_templates').insert({ ...data, workspace_id: orgId }).select('id').single()
    if (error) return setMessage(error.code === '23505' ? 'Já existe um modelo com esse nome neste número.' : deniedMessage(error, 'Não foi possível salvar o modelo.'))
    if (submit) {
      const r = await post(`/api/inbox/modelos/${(row as { id: string }).id}/enviar`)
      setMessage(r.ok ? (r.data.status === 'aprovado' ? 'Modelo aprovado.' : 'Modelo enviado para a Meta. A análise costuma levar de minutos a algumas horas.') : r.erro)
    } else setMessage('Modelo salvo como rascunho.')
    setEditing(null); reload()
  }

  if (!basics) return <Notice>Carregando…</Notice>
  return (
    <>
      {message ? <div role="status" className="mb-4 rounded-xl border border-[#ececec] bg-white px-4 py-3 text-[14px]">{message}</div> : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <Card className="overflow-x-auto p-0">
          <div className="flex items-center justify-between gap-2 border-b border-[#ececec] px-4 py-2.5">
            <button type="button" onClick={() => void sync().then(reload)} className="h-8 rounded-lg border border-[#e2e2e2] px-3 text-[13px]">Atualizar situação</button>
            <button type="button" disabled={!basics.channels.length} onClick={() => setEditing({ channel_id: basics.channels[0]?.id, language: 'pt_BR', category: 'MARKETING', body: '', buttons: [], variables: [] })} className="h-8 rounded-lg bg-[#111] px-3 text-[13px] font-medium text-white disabled:opacity-40">Novo modelo</button>
          </div>
          {!basics.channels.length ? <p className="p-6 text-[14px] text-[#777]">Conecte um número de WhatsApp em Canais (ou crie o canal de teste) para criar modelos.</p>
            : !basics.templates.length ? <p className="p-6 text-[14px] text-[#777]">Nenhum modelo ainda. Modelos são mensagens pré-aprovadas pela Meta, necessárias para falar com quem não escreveu nas últimas 24 h.</p> : (
              <table className="w-full text-left text-[14px]">
                <tbody>{basics.templates.map(t => (
                  <tr key={t.id} onClick={() => setEditing(t)} className="cursor-pointer border-b border-[#f3f3f3] last:border-0 hover:bg-[#fafafa]">
                    <td className="px-4 py-2.5"><p className="font-medium">{t.name}</p><p className="line-clamp-1 text-[12px] text-[#777]">{t.body}</p></td>
                    <td className="hidden px-4 py-2.5 text-[12px] text-[#777] sm:table-cell">{channelName.get(t.channel_id)} · {t.category === 'UTILITY' ? 'Utilidade' : 'Marketing'}</td>
                    <td className="px-4 py-2.5"><Badge s={t.status} /></td>
                  </tr>))}</tbody>
              </table>
            )}
        </Card>
        {editing ? <TemplateForm key={editing.id ?? 'novo'} t={editing} channels={basics.channels} onSave={save} onClose={() => setEditing(null)}
          onDelete={editing.id ? async () => { if (!window.confirm('Excluir este modelo? Na Meta ele continua até ser excluído lá.')) return; const { error } = await supabase().from('wa_templates').delete().eq('id', editing.id!); setMessage(error ? deniedMessage(error, 'Não foi possível excluir.') : 'Modelo excluído.'); setEditing(null); reload() } : undefined} /> : null}
      </div>
    </>
  )
}

function TemplateForm({ t, channels, onSave, onClose, onDelete }: { t: Partial<Template>; channels: Channel[]; onSave: (t: Partial<Template>, submit: boolean) => Promise<void>; onClose: () => void; onDelete?: () => void }) {
  const [f, setF] = useState(t)
  const locked = !!t.status && !['rascunho', 'rejeitado'].includes(t.status)
  const slots = useMemo(() => { const used = [...(f.body ?? '').matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map(m => Number(m[1])); return used.length ? Math.max(...used) : 0 }, [f.body])
  const vars = Array.from({ length: slots }, (_, i) => f.variables?.[i] ?? 'primeiro_nome')
  const next = { ...f, variables: vars }
  return (
    <Card title={t.id ? `Modelo ${t.name}` : 'Novo modelo'} className="h-fit">
      <fieldset disabled={locked} className="grid gap-3 text-[13px] text-[#555]">
        {t.status ? <div className="flex items-center gap-2"><Badge s={t.status} />{t.reason ? <span className="text-[#dc2626]">{t.reason}</span> : null}</div> : null}
        {locked ? <p className="text-[12px] text-[#777]">Modelo já enviado para a Meta; para mudar, crie outro com um nome novo.</p> : null}
        <label>Número<select value={f.channel_id} onChange={e => setF({ ...f, channel_id: e.target.value })} className={input}>{channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Nome (só letras minúsculas, números e _)<input value={f.name ?? ''} onChange={e => setF({ ...f, name: e.target.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_]+/g, '_') })} placeholder="promo_black_friday" className={input} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label>Categoria<select value={f.category} onChange={e => setF({ ...f, category: e.target.value })} className={input}><option value="MARKETING">Marketing</option><option value="UTILITY">Utilidade</option></select></label>
          <label>Idioma<select value={f.language} onChange={e => setF({ ...f, language: e.target.value })} className={input}><option value="pt_BR">Português (BR)</option><option value="en_US">Inglês (EUA)</option><option value="es">Espanhol</option></select></label>
        </div>
        <label>Título (opcional)<input value={f.header ?? ''} maxLength={60} onChange={e => setF({ ...f, header: e.target.value })} className={input} /></label>
        <label>Texto
          <textarea value={f.body ?? ''} maxLength={1024} rows={6} onChange={e => setF({ ...f, body: e.target.value })} placeholder={'Oi {{1}}! A condição especial acaba hoje. Quer o link?'} className={`${input} h-auto py-2`} />
          <span className="mt-1 block text-[12px] text-[#888]">Use {'{{1}}'}, {'{{2}}'}… para dados do contato (não no começo nem no fim).</span>
        </label>
        {vars.map((v, i) => (
          <label key={i}>{`{{${i + 1}}}`} é
            <select value={v} onChange={e => setF({ ...next, variables: vars.map((x, j) => (j === i ? e.target.value : x)) })} className={input}>{VARS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </label>
        ))}
        <label>Rodapé (opcional)<input value={f.footer ?? ''} maxLength={60} onChange={e => setF({ ...f, footer: e.target.value })} placeholder="Responda SAIR para não receber mais" className={input} /></label>
        <label>Botões de resposta (até 3, um por linha)
          <textarea value={(f.buttons ?? []).join('\n')} rows={3} onChange={e => setF({ ...f, buttons: e.target.value.split('\n').slice(0, 3) })} placeholder={'Quero saber mais\nSAIR'} className={`${input} h-auto py-2`} />
        </label>
      </fieldset>
      <div className="mt-3 flex flex-wrap gap-2">
        {!locked ? <>
          <button type="button" onClick={() => void onSave(next, true)} className="h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Enviar para aprovação</button>
          <button type="button" onClick={() => void onSave(next, false)} className="h-9 rounded-lg border border-[#e2e2e2] px-4 text-[14px]">Salvar rascunho</button>
        </> : null}
        <button type="button" onClick={onClose} className="h-9 px-2 text-[14px] text-[#666]">Fechar</button>
        {onDelete ? <button type="button" onClick={onDelete} className="ml-auto text-[13px] text-[#a33] underline">Excluir</button> : null}
      </div>
    </Card>
  )
}

function EmailSettings() {
  const { orgId } = useAuth()
  const [f, setF] = useState<{ from_name: string; from_email: string; reply_to: string; address: string } | null>(null)
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [optouts, setOptouts] = useState<{ contact_id: string; kind: string; reason: string | null; created_at: string; contact: { name: string } | null }[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!orgId) return
    let live = true
    void Promise.all([
      supabase().from('email_settings').select('from_name, from_email, reply_to, address').eq('workspace_id', orgId).maybeSingle(),
      fetch('/api/inbox/disparos/config').then(r => r.json()).catch(() => ({ email: false })) as Promise<{ email: boolean }>,
      supabase().from('optouts').select('contact_id, kind, reason, created_at, contact:contacts(name)').eq('workspace_id', orgId).order('created_at', { ascending: false }).limit(200),
    ]).then(([s, c, o]) => {
      if (!live) return
      const d = (s.data ?? {}) as Record<string, string | null>
      setF({ from_name: d.from_name ?? '', from_email: d.from_email ?? '', reply_to: d.reply_to ?? '', address: d.address ?? '' })
      setEnabled(c.email); setOptouts((o.data ?? []) as unknown as typeof optouts)
    })
    return () => { live = false }
  }, [orgId, version])
  if (!f) return <Notice>Carregando…</Notice>
  async function save() {
    const data = { from_name: f!.from_name.trim() || null, from_email: f!.from_email.trim().toLowerCase() || null, reply_to: f!.reply_to.trim().toLowerCase() || null, address: f!.address.trim() || null }
    const { error } = await supabase().from('email_settings').upsert({ workspace_id: orgId, ...data })
    setMessage(error ? deniedMessage(error, 'Não foi possível salvar. Confira os e-mails.') : 'Remetente salvo.')
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Remetente dos e-mails" className="h-fit">
        {enabled === false ? <p className="mb-3 rounded-lg bg-[#fff7e6] p-3 text-[13px] text-[#8a5a00]">O envio de e-mail ainda não foi ligado no servidor. Falta configurar o Amazon SES (região e chaves) na Vercel e verificar o domínio do remetente no SES.</p> : null}
        {message ? <p role="status" className="mb-3 text-[13px]">{message}</p> : null}
        <div className="grid gap-3 text-[13px] text-[#555]">
          <label>Nome<input value={f.from_name} onChange={e => setF({ ...f, from_name: e.target.value })} placeholder="Ex.: Ana da Loja X" className={input} /></label>
          <label>E-mail do remetente<input type="email" value={f.from_email} onChange={e => setF({ ...f, from_email: e.target.value })} placeholder="contato@seudominio.com.br" className={input} />
            <span className="mt-1 block text-[12px] text-[#888]">O domínio precisa estar verificado no Amazon SES.</span></label>
          <label>Responder para (opcional)<input type="email" value={f.reply_to} onChange={e => setF({ ...f, reply_to: e.target.value })} className={input} /></label>
          <label>Endereço no rodapé<input value={f.address} onChange={e => setF({ ...f, address: e.target.value })} placeholder="Empresa X · Rua Y, 100 · São Paulo/SP" className={input} /></label>
          <button type="button" onClick={() => void save()} className="h-9 w-fit rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Salvar</button>
        </div>
      </Card>
      <Card title="Quem pediu para não receber" className="h-fit">
        {!optouts.length ? <p className="text-[13px] text-[#777]">Ninguém ainda. No WhatsApp, quem responde SAIR entra aqui; no e-mail, quem clica no link do rodapé.</p> : (
          <ul className="max-h-[420px] overflow-auto text-[13px]">{optouts.map(o => (
            <li key={o.contact_id + o.kind} className="flex items-center gap-2 border-b border-[#f3f3f3] py-1.5">
              <span className="min-w-0 flex-1"><b>{o.contact?.name ?? 'Contato'}</b> · {o.kind === 'email' ? 'E-mail' : 'WhatsApp'}<span className="block text-[11px] text-[#888]">{o.reason} · {when(o.created_at)}</span></span>
              <button type="button" onClick={async () => { if (!window.confirm('Voltar a enviar para este contato? Faça isso só se ele pediu.')) return; const { error } = await supabase().from('optouts').delete().eq('contact_id', o.contact_id).eq('kind', o.kind); setMessage(error ? deniedMessage(error, 'Não foi possível.') : 'Contato voltou a receber.'); setVersion(v => v + 1) }}
                className="text-[12px] text-[#555] underline">Remover</button>
            </li>))}</ul>
        )}
      </Card>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Card, Notice, Page } from '@/products/analytics/frontend/ui'
import { CHANNEL_LABEL, type ChannelKind } from '../shared/rules'
import { cleanPhone, deniedMessage, formatPhone, parseContactsCsv, supabase, type Contact, type Tag } from './data'

type Row = Contact & { tags: string[]; channels: ChannelKind[] }

/** CSV cell with quotes when needed (Excel in Portuguese opens ";" files). */
const cell = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

/** Everyone who talked to the company in any channel, plus the ones typed in or imported. */
export function ContactsView() {
  const { orgId, isLoaded } = useAuth()
  const params = useSearchParams()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [editing, setEditing] = useState<Partial<Row> | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const fetchAll = useCallback(async () => {
    if (!orgId) return null
    const [c, t, ct, ids] = await Promise.all([
      supabase().from('contacts').select('id, name, phone, email, created_at').eq('workspace_id', orgId).order('created_at', { ascending: false }).limit(2000),
      supabase().from('tags').select('id, name, color').eq('workspace_id', orgId).order('name'),
      supabase().from('contact_tags').select('contact_id, tag_id').eq('workspace_id', orgId),
      supabase().from('contact_identities').select('contact_id, channel:channels(kind)').eq('workspace_id', orgId),
    ])
    const tagsBy = new Map<string, string[]>(), channelsBy = new Map<string, ChannelKind[]>()
    for (const r of ct.data ?? []) tagsBy.set(r.contact_id, [...(tagsBy.get(r.contact_id) ?? []), r.tag_id])
    for (const r of (ids.data ?? []) as unknown as { contact_id: string; channel: { kind: ChannelKind } | null }[]) {
      if (r.channel) channelsBy.set(r.contact_id, [...new Set([...(channelsBy.get(r.contact_id) ?? []), r.channel.kind])])
    }
    return { rows: ((c.data ?? []) as Contact[]).map(x => ({ ...x, tags: tagsBy.get(x.id) ?? [], channels: channelsBy.get(x.id) ?? [] })), tags: (t.data ?? []) as Tag[] }
  }, [orgId])
  useEffect(() => {
    if (!isLoaded) return
    let live = true
    void fetchAll().then(r => {
      if (!live || !r) return
      setRows(r.rows); setTags(r.tags)
      const wanted = params.get('c')
      if (wanted && version === 0) setEditing(r.rows.find(x => x.id === wanted) ?? null)
    })
    return () => { live = false }
  }, [isLoaded, fetchAll, version, params])
  const reload = () => setVersion(v => v + 1)

  const visible = useMemo(() => (rows ?? []).filter(r => {
    if (tagFilter && !r.tags.includes(tagFilter)) return false
    const q = search.trim().toLowerCase()
    return !q || r.name.toLowerCase().includes(q) || (r.email ?? '').includes(q) || (q.replace(/\D/g, '') !== '' && (r.phone ?? '').includes(q.replace(/\D/g, '')))
  }), [rows, search, tagFilter])

  async function save() {
    if (!editing) return
    const name = (editing.name ?? '').trim()
    const phone = editing.phone ? cleanPhone(editing.phone) : null
    if (!name) return setMessage('Informe o nome.')
    if (editing.phone && !phone) return setMessage('Telefone inválido. Ex.: 11 98888-7777 ou +351 912 345 678')
    const email = editing.email?.trim().toLowerCase() || null
    const data = { name, phone, email }
    const { error } = editing.id ? await supabase().from('contacts').update(data).eq('id', editing.id) : await supabase().from('contacts').insert({ ...data, workspace_id: orgId })
    setMessage(error ? deniedMessage(error, 'Não foi possível salvar o contato.') : 'Contato salvo.')
    if (!error) { setEditing(null); reload() }
  }
  async function remove(r: Partial<Row>) {
    if (!r.id || !window.confirm(`Excluir ${r.name}? As conversas com esse contato também serão apagadas.`)) return
    const { error } = await supabase().from('contacts').delete().eq('id', r.id)
    setMessage(error ? deniedMessage(error, 'Não foi possível excluir.') : 'Contato excluído.')
    if (!error) { setEditing(null); reload() }
  }
  async function toggleTag(contactId: string, tagId: string, on: boolean) {
    const { error } = on ? await supabase().from('contact_tags').delete().eq('contact_id', contactId).eq('tag_id', tagId)
      : await supabase().from('contact_tags').insert({ workspace_id: orgId, contact_id: contactId, tag_id: tagId })
    if (error) setMessage(deniedMessage(error, 'Não foi possível mudar a etiqueta.'))
    setEditing(e => e && e.id === contactId ? { ...e, tags: on ? (e.tags ?? []).filter(t => t !== tagId) : [...(e.tags ?? []), tagId] } : e)
    reload()
  }
  function exportCsv() {
    const tagName = new Map(tags.map(t => [t.id, t.name]))
    const lines = [['nome', 'telefone', 'email', 'etiquetas', 'canais'].join(';'),
      ...visible.map(r => [r.name, r.phone ?? '', r.email ?? '', r.tags.map(t => tagName.get(t) ?? '').join(', '), r.channels.map(k => CHANNEL_LABEL[k]).join(', ')].map(cell).join(';'))]
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = 'contatos.csv'; a.click(); URL.revokeObjectURL(url)
  }
  async function importCsv(file: File) {
    const { ok, skipped } = parseContactsCsv(await file.text())
    const known = new Set((rows ?? []).flatMap(r => [r.phone, r.email]).filter(Boolean))
    const fresh = ok.filter(r => !(r.phone && known.has(r.phone)) && !(r.email && known.has(r.email)))
    for (let i = 0; i < fresh.length; i += 500) {
      const { error } = await supabase().from('contacts').insert(fresh.slice(i, i + 500).map(r => ({ ...r, workspace_id: orgId })))
      if (error) return setMessage(deniedMessage(error, 'A importação parou no meio. Confira o arquivo e tente de novo.'))
    }
    setMessage(`${fresh.length} contato(s) importado(s)` + (ok.length - fresh.length ? `, ${ok.length - fresh.length} já existiam` : '') + (skipped ? `, ${skipped} linha(s) sem nome ou contato ignorada(s)` : '') + '.')
    reload()
  }

  if (!rows) return <Page title="Contatos"><Notice>Carregando…</Notice></Page>
  return (
    <Page title="Contatos" subtitle="Quem já falou com a empresa em qualquer canal, e quem você cadastrou ou importou."
      actions={<div className="flex flex-wrap gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-[#e2e2e2] bg-white px-3 text-[13px]">Importar CSV
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importCsv(f) }} />
        </label>
        <button type="button" onClick={exportCsv} className="h-9 rounded-lg border border-[#e2e2e2] bg-white px-3 text-[13px]">Exportar CSV</button>
        <button type="button" onClick={() => setEditing({ name: '', phone: '', email: '' })} className="h-9 rounded-lg bg-[#111] px-3 text-[13px] font-medium text-white">Novo contato</button>
      </div>}>
      {message ? <div role="status" className="mb-4 rounded-xl border border-[#ececec] bg-white px-4 py-3 text-[14px]">{message}</div> : null}
      <div className="mb-3 flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail" aria-label="Buscar contatos" className="h-9 min-w-0 flex-1 rounded-lg border border-[#e2e2e2] bg-white px-3 text-[14px]" />
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} aria-label="Etiqueta" className="h-9 rounded-lg border border-[#e2e2e2] bg-white px-2 text-[14px]">
          <option value="">Todas as etiquetas</option>{tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-x-auto p-0">
          {!visible.length ? <p className="p-6 text-[14px] text-[#777]">{rows.length ? 'Nenhum contato com esse filtro.' : 'Nenhum contato ainda. Eles aparecem aqui quando alguém escreve num canal, ou importe uma lista.'}</p> : (
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-[#ececec] text-[12px] uppercase tracking-wide text-[#888]">
                <tr><th className="px-4 py-2.5 font-medium">Nome</th><th className="px-4 py-2.5 font-medium">Telefone</th><th className="hidden px-4 py-2.5 font-medium md:table-cell">E-mail</th><th className="hidden px-4 py-2.5 font-medium sm:table-cell">Etiquetas</th></tr>
              </thead>
              <tbody>
                {visible.slice(0, 500).map(r => (
                  <tr key={r.id} onClick={() => setEditing(r)} className={`cursor-pointer border-b border-[#f3f3f3] last:border-0 hover:bg-[#fafafa] ${editing?.id === r.id ? 'bg-[#f3f4f6]' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-[#111]">{r.name}<span className="ml-2 text-[11px] font-normal text-[#888]">{r.channels.map(k => CHANNEL_LABEL[k]).join(' · ')}</span></td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[#444]">{formatPhone(r.phone)}</td>
                    <td className="hidden px-4 py-2.5 text-[#444] md:table-cell">{r.email}</td>
                    <td className="hidden px-4 py-2.5 sm:table-cell">{r.tags.map(id => { const t = tags.find(x => x.id === id); return t ? <span key={id} className="mr-1 inline-block rounded-full px-2 py-0.5 text-[11px] text-white" style={{ background: t.color }}>{t.name}</span> : null })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {visible.length > 500 ? <p className="px-4 py-2 text-[12px] text-[#888]">Mostrando 500 de {visible.length}. Use a busca para achar os demais.</p> : null}
        </Card>
        {editing ? (
          <Card title={editing.id ? 'Contato' : 'Novo contato'} className="h-fit">
            <form className="grid gap-3" onSubmit={e => { e.preventDefault(); void save() }}>
              <label className="text-[13px] text-[#555]">Nome<input value={editing.name ?? ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-[#e2e2e2] px-3 text-[14px] text-[#111]" /></label>
              <label className="text-[13px] text-[#555]">Telefone<input value={editing.phone ?? ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} placeholder="11 98888-7777" inputMode="tel" className="mt-1 h-9 w-full rounded-lg border border-[#e2e2e2] px-3 text-[14px] text-[#111]" /></label>
              <label className="text-[13px] text-[#555]">E-mail<input value={editing.email ?? ''} onChange={e => setEditing({ ...editing, email: e.target.value })} type="email" className="mt-1 h-9 w-full rounded-lg border border-[#e2e2e2] px-3 text-[14px] text-[#111]" /></label>
              {editing.id && tags.length ? (
                <div><p className="text-[13px] text-[#555]">Etiquetas</p><div className="mt-1 flex flex-wrap gap-1.5">
                  {tags.map(t => { const on = (editing.tags ?? []).includes(t.id); return (
                    <button key={t.id} type="button" aria-pressed={on} onClick={() => void toggleTag(editing.id!, t.id, on)} className="rounded-full border px-2.5 py-0.5 text-[12px]"
                      style={on ? { background: t.color, borderColor: t.color, color: '#fff' } : { borderColor: '#e2e2e2', color: '#555' }}>{t.name}</button>) })}
                </div></div>
              ) : null}
              {editing.channels?.length ? <p className="text-[12px] text-[#777]">Fala pelo {editing.channels.map(k => CHANNEL_LABEL[k]).join(' e ')}.</p> : null}
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Salvar</button>
                <button type="button" onClick={() => setEditing(null)} className="h-9 rounded-lg border border-[#e2e2e2] px-4 text-[14px]">Fechar</button>
                {editing.id ? <button type="button" onClick={() => void remove(editing)} className="ml-auto text-[13px] text-[#a33] underline">Excluir</button> : null}
              </div>
            </form>
          </Card>
        ) : null}
      </div>
    </Page>
  )
}

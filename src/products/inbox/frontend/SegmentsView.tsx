'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, Notice, Page } from '@/products/analytics/frontend/ui'
import { deniedMessage, supabase, type Tag } from './data'
import { countSegment, SegmentEditor, type Segment, type StageOption } from './SegmentEditor'
import { describeCondition, parseRules, type SegmentRules } from '../shared/segments'

const safeRules = (x: unknown): SegmentRules => { try { return parseRules(x) } catch { return { modo: 'todas', condicoes: [] } } }

/** Contact lists by rules, kept up to date by themselves; used to filter contacts and as the audience of broadcasts. */
export function SegmentsView() {
  const { orgId, isLoaded } = useAuth()
  const [segments, setSegments] = useState<Segment[] | null>(null)
  const [counts, setCounts] = useState<Record<string, number | string>>({})
  const [tags, setTags] = useState<Tag[]>([])
  const [stages, setStages] = useState<StageOption[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [editing, setEditing] = useState<Partial<Segment> | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!isLoaded || !orgId) return
    let live = true
    void Promise.all([
      supabase().from('segments').select('id, name, rules').eq('workspace_id', orgId).order('name'),
      supabase().from('tags').select('id, name, color').eq('workspace_id', orgId).order('name'),
      supabase().from('pipeline_stages').select('id, name, position, pipeline:pipelines(name)').eq('workspace_id', orgId).order('position'),
      fetch('/api/inbox/segmentos/origens').then(r => (r.ok ? r.json() : { origens: [] })).catch(() => ({ origens: [] })) as Promise<{ origens: { origem: string }[] }>,
    ]).then(([s, t, st, src]) => {
      if (!live) return
      const list = ((s.data ?? []) as { id: string; name: string; rules: unknown }[]).map(x => ({ ...x, rules: safeRules(x.rules) }))
      setSegments(list); setTags((t.data ?? []) as Tag[])
      setStages(((st.data ?? []) as unknown as { id: string; name: string; pipeline: { name: string } | null }[]).map(x => ({ id: x.id, label: `${x.pipeline?.name ?? 'Funil'} · ${x.name}` })))
      setSources(src.origens.map(x => x.origem))
      for (const seg of list) void countSegment({ segmento_id: seg.id, limite: 0 }).then(r => { if (live) setCounts(c => ({ ...c, [seg.id]: 'erro' in r ? '—' : r.total })) })
    })
    return () => { live = false }
  }, [isLoaded, orgId, version])

  async function save(s: { id?: string; name: string; rules: SegmentRules }) {
    const { error } = s.id ? await supabase().from('segments').update({ name: s.name, rules: s.rules }).eq('id', s.id)
      : await supabase().from('segments').insert({ workspace_id: orgId, name: s.name, rules: s.rules })
    if (error) return deniedMessage(error, 'Não foi possível salvar o segmento.')
    setEditing(null); setMessage('Segmento salvo.'); setVersion(v => v + 1)
    return null
  }
  async function remove(id: string) {
    if (!window.confirm('Excluir este segmento? Os contatos continuam cadastrados; disparos que usavam ele ficam sem segmento.')) return
    const { error } = await supabase().from('segments').delete().eq('id', id)
    setMessage(error ? deniedMessage(error, 'Não foi possível excluir.') : 'Segmento excluído.')
    if (!error) { setEditing(null); setVersion(v => v + 1) }
  }

  const tagNames = new Map(tags.map(t => [t.id, t.name]))
  const stageNames = new Map(stages.map(s => [s.id, s.label]))
  if (!segments) return <Page title="Segmentos"><Notice>Carregando…</Notice></Page>
  return (
    <Page title="Segmentos" subtitle="Listas de contatos por regras, que se atualizam sozinhas. Use para filtrar contatos e como público dos disparos."
      actions={<button type="button" onClick={() => setEditing({ name: '' })} className="h-9 rounded-lg bg-[#111] px-3 text-[13px] font-medium text-white">Novo segmento</button>}>
      {message ? <div role="status" className="mb-4 rounded-xl border border-[#ececec] bg-white px-4 py-3 text-[14px]">{message}</div> : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Card className="overflow-x-auto p-0">
          {!segments.length ? <p className="p-6 text-[14px] text-[#777]">Nenhum segmento ainda. Exemplos: “Compraram o curso e não a mentoria”, “Leads do anúncio de Black Friday sem compra”, “Clientes que gastaram mais de R$ 1.000”.</p> : (
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-[#ececec] text-[12px] uppercase tracking-wide text-[#888]"><tr><th className="px-4 py-2.5 font-medium">Nome</th><th className="hidden px-4 py-2.5 font-medium md:table-cell">Regras</th><th className="px-4 py-2.5 text-right font-medium">Contatos</th><th className="px-4 py-2.5" /></tr></thead>
              <tbody>{segments.map(s => (
                <tr key={s.id} className={`border-b border-[#f3f3f3] last:border-0 ${editing?.id === s.id ? 'bg-[#f3f4f6]' : ''}`}>
                  <td className="px-4 py-2.5"><button type="button" onClick={() => setEditing(s)} className="font-medium text-[#111] hover:underline">{s.name}</button></td>
                  <td className="hidden px-4 py-2.5 text-[12.5px] text-[#666] md:table-cell">{s.rules.condicoes.length ? s.rules.condicoes.map(c => describeCondition(c, { tags: tagNames, stages: stageNames })).join(s.rules.modo === 'qualquer' ? ' ou ' : ' e ') : 'Todos os contatos'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{counts[s.id] ?? '…'}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-[12.5px]">
                    <Link href={`/inbox/contatos?segmento=${s.id}`} className="text-[#555] underline">Ver contatos</Link>
                    <Link href="/disparos" className="ml-3 text-[#555] underline">Disparar</Link>
                  </td>
                </tr>))}</tbody>
            </table>
          )}
        </Card>
        {editing ? <SegmentEditor key={editing.id ?? 'novo'} segment={editing} tags={tags} stages={stages} sources={sources} onSave={save}
          onDelete={editing.id ? () => void remove(editing.id!) : undefined} onClose={() => setEditing(null)} /> : null}
      </div>
    </Page>
  )
}

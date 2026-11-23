'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/products/analytics/frontend/ui'
import { CHANNEL_LABEL, type ChannelKind } from '../shared/rules'
import { EMPTY_RULES, OP_LABEL, SEGMENT_FIELDS, needsValue, type SegmentCondition, type SegmentField, type SegmentRules } from '../shared/segments'
import type { Tag } from './data'

export type Segment = { id: string; name: string; rules: SegmentRules }
export type StageOption = { id: string; label: string }

const input = 'h-9 rounded-lg border border-[#e2e2e2] bg-white px-2 text-[13px] text-[#111]'

/** Count of contacts for rules, from the server (same rules the broadcasts will use). */
export async function countSegment(body: object): Promise<{ total: number; contatos: { id: string }[] } | { erro: string }> {
  const r = await fetch('/api/inbox/segmentos/previa', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await r.json().catch(() => ({ erro: 'Não foi possível contar.' }))
  return r.ok ? data : { erro: data.erro ?? 'Não foi possível contar.' }
}

/** Rule builder: name, "all/any", one line per condition and the live count. */
export function SegmentEditor({ segment, tags, stages, sources, onSave, onDelete, onClose }: {
  segment: Partial<Segment>; tags: Tag[]; stages: StageOption[]; sources: string[]
  onSave: (s: { id?: string; name: string; rules: SegmentRules }) => Promise<string | null>
  onDelete?: () => void; onClose: () => void
}) {
  const [name, setName] = useState(segment.name ?? '')
  const [rules, setRules] = useState<SegmentRules>(segment.rules ?? EMPTY_RULES)
  const [count, setCount] = useState<string>('…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    const t = setTimeout(() => {
      void countSegment({ regras: rules, limite: 0 }).then(r => { if (live) setCount('erro' in r ? r.erro : `${r.total} contato(s)`) })
    }, 350)
    return () => { live = false; clearTimeout(t) }
  }, [rules])

  const set = (i: number, c: Partial<SegmentCondition>) => setRules(r => ({ ...r, condicoes: r.condicoes.map((x, j) => (j === i ? { ...x, ...c } : x)) }))
  const add = () => setRules(r => ({ ...r, condicoes: [...r.condicoes, { campo: 'etiqueta', op: 'tem', valor: tags[0]?.id ?? null }] }))
  const changeField = (i: number, campo: SegmentField) => {
    const spec = SEGMENT_FIELDS[campo]
    const valor = spec.valor === 'etiqueta' ? tags[0]?.id ?? null : spec.valor === 'canal' ? 'whatsapp' : spec.valor === 'etapa' ? stages[0]?.id ?? null : spec.valor === 'dias' ? 30 : null
    set(i, { campo, op: spec.ops[0], valor, chave: campo === 'campo' ? '' : null })
  }

  async function save() {
    setError(null)
    if (!name.trim()) return setError('Dê um nome ao segmento.')
    const e = await onSave({ id: segment.id, name: name.trim(), rules })
    if (e) setError(e)
  }

  return (
    <Card title={segment.id ? 'Segmento' : 'Novo segmento'} className="h-fit">
      <div className="grid gap-3">
        <label className="text-[13px] text-[#555]">Nome
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Compradores do curso sem mentoria" className={`mt-1 w-full ${input} px-3 text-[14px]`} />
        </label>
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#555]">
          Contatos que atendem
          <select aria-label="Modo" value={rules.modo} onChange={e => setRules(r => ({ ...r, modo: e.target.value as SegmentRules['modo'] }))} className={input}>
            <option value="todas">todas as condições</option><option value="qualquer">qualquer condição</option>
          </select>
        </div>
        {rules.condicoes.map((c, i) => {
          const spec = SEGMENT_FIELDS[c.campo]
          return (
            <div key={i} className="grid gap-1.5 rounded-lg border border-[#ececec] bg-[#fafafa] p-2">
              <div className="flex gap-1.5">
                <select aria-label="Campo" value={c.campo} onChange={e => changeField(i, e.target.value as SegmentField)} className={`${input} min-w-0 flex-1`}>
                  {Object.entries(SEGMENT_FIELDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button type="button" aria-label="Remover condição" onClick={() => setRules(r => ({ ...r, condicoes: r.condicoes.filter((_, j) => j !== i) }))} className="px-2 text-[#999] hover:text-[#a33]">×</button>
              </div>
              {c.campo === 'campo' ? <input aria-label="Nome do campo" value={c.chave ?? ''} onChange={e => set(i, { chave: e.target.value })} placeholder="nome do campo (ex.: cidade)" className={input} /> : null}
              <div className="flex gap-1.5">
                <select aria-label="Condição" value={c.op} onChange={e => set(i, { op: e.target.value as SegmentCondition['op'] })} className={`${input} ${needsValue(c) || c.campo === 'comprou' || c.campo === 'reembolsou' ? '' : 'flex-1'}`}>
                  {spec.ops.map(o => <option key={o} value={o}>{OP_LABEL[o]}</option>)}
                </select>
                {spec.valor === 'etiqueta' && needsValue(c) ? (
                  <select aria-label="Etiqueta" value={String(c.valor ?? '')} onChange={e => set(i, { valor: e.target.value })} className={`${input} min-w-0 flex-1`}>
                    {!tags.length ? <option value="">Nenhuma etiqueta criada</option> : null}{tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                ) : spec.valor === 'canal' ? (
                  <select aria-label="Canal" value={String(c.valor ?? 'whatsapp')} onChange={e => set(i, { valor: e.target.value })} className={`${input} min-w-0 flex-1`}>
                    {(Object.keys(CHANNEL_LABEL) as ChannelKind[]).map(k => <option key={k} value={k}>{CHANNEL_LABEL[k]}</option>)}
                  </select>
                ) : spec.valor === 'etapa' ? (
                  <select aria-label="Etapa" value={String(c.valor ?? '')} onChange={e => set(i, { valor: e.target.value })} className={`${input} min-w-0 flex-1`}>
                    {!stages.length ? <option value="">Nenhum funil criado</option> : null}{stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                ) : c.campo === 'comprou' || c.campo === 'reembolsou' ? (
                  <input aria-label="Produto" value={String(c.valor ?? '')} onChange={e => set(i, { valor: e.target.value })} placeholder="produto (opcional)" className={`${input} min-w-0 flex-1`} />
                ) : needsValue(c) ? (
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <input aria-label="Valor" value={String(c.valor ?? '')} onChange={e => set(i, { valor: e.target.value })} list={c.campo === 'origem' ? 'segment-sources' : undefined}
                      inputMode={spec.valor === 'texto' || spec.valor === 'campo' ? undefined : 'decimal'} className={`${input} min-w-0 flex-1`} />
                    {spec.valor === 'dias' ? <span className="text-[12px] text-[#777]">dias</span> : null}
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
        <datalist id="segment-sources">{sources.map(s => <option key={s} value={s} />)}</datalist>
        <button type="button" onClick={add} className="h-9 rounded-lg border border-dashed border-[#cfcfcf] text-[13px] text-[#555] hover:bg-[#fafafa]">+ Condição</button>
        <p className="text-[13px] text-[#111]"><span className="text-[#777]">Hoje: </span>{count}</p>
        {!rules.condicoes.length ? <p className="text-[12px] text-[#888]">Sem condições, o segmento inclui todos os contatos.</p> : null}
        {error ? <p role="alert" className="text-[13px] text-[#a33]">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void save()} className="h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Salvar</button>
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-[#e2e2e2] px-4 text-[14px]">Fechar</button>
          {onDelete ? <button type="button" onClick={onDelete} className="ml-auto text-[13px] text-[#a33] underline">Excluir</button> : null}
        </div>
      </div>
    </Card>
  )
}

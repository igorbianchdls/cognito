'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, Notice, Page } from '@/products/analytics/frontend/ui'
import { TRIGGER_LABEL, type Graph, type TriggerKind } from '../shared/flows'
import { deniedMessage, supabase } from './data'

type Flow = { id: string; name: string; status: 'rascunho' | 'ativo' | 'pausado'; version: number; updated_at: string; triggers: { kind: TriggerKind; active: boolean }[] }
const STATUS = { rascunho: { label: 'Rascunho', cls: 'bg-[#f3f3f3] text-[#555]' }, ativo: { label: 'Ativa', cls: 'bg-[#e8f7ee] text-[#166534]' }, pausado: { label: 'Pausada', cls: 'bg-[#fff4e0] text-[#9a5b00]' } }

/** The company's automations: what starts each one, whether it is on, and how many people went through it. */
export function AutomationsView() {
  const { orgId, isLoaded } = useAuth()
  const router = useRouter()
  const [flows, setFlows] = useState<Flow[] | null>(null)
  const [runs, setRuns] = useState<Record<string, number>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const fetchAll = useCallback(async () => {
    if (!orgId) return null
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const [f, r] = await Promise.all([
      supabase().from('flows').select('id, name, status, version, updated_at, triggers(kind, active)').eq('workspace_id', orgId).order('updated_at', { ascending: false }),
      supabase().from('flow_runs').select('flow_id').eq('workspace_id', orgId).gte('started_at', since).limit(10000),
    ])
    const counts: Record<string, number> = {}
    for (const row of (r.data ?? []) as { flow_id: string }[]) counts[row.flow_id] = (counts[row.flow_id] ?? 0) + 1
    return { flows: (f.data ?? []) as Flow[], counts }
  }, [orgId])
  useEffect(() => {
    if (!isLoaded) return
    let live = true
    void fetchAll().then(r => { if (live && r) { setFlows(r.flows); setRuns(r.counts) } })
    return () => { live = false }
  }, [isLoaded, fetchAll, version])

  async function create(template: 'vazia' | 'boas_vindas') {
    const start = 'n1'
    const draft: Graph = template === 'vazia' ? { start, nodes: [{ id: start, type: 'mensagem', texto: 'Olá, {{primeiro_nome}}! Como posso ajudar?' }], positions: { [start]: { x: 80, y: 80 } } } : {
      start, nodes: [
        { id: 'n1', type: 'mensagem', texto: 'Olá, {{primeiro_nome}}! 👋 Sobre o que você quer falar?', botoes: [{ id: 'a', label: 'Produtos', next: 'n2' }, { id: 'b', label: 'Meu pedido', next: 'n3' }, { id: 'c', label: 'Falar com alguém', next: 'n4' }] },
        { id: 'n2', type: 'mensagem', texto: 'Veja nosso catálogo: https://…', next: null },
        { id: 'n3', type: 'pergunta', texto: 'Qual o número do pedido?', campo: 'pedido', validar: 'texto', next: 'n4' },
        { id: 'n4', type: 'humano', texto: 'Já vou chamar alguém da equipe para te ajudar!' },
      ], positions: { n1: { x: 60, y: 60 }, n2: { x: 480, y: 0 }, n3: { x: 480, y: 160 }, n4: { x: 900, y: 200 } },
    }
    const { data, error } = await supabase().from('flows').insert({ workspace_id: orgId, name: template === 'vazia' ? 'Nova automação' : 'Boas-vindas', draft }).select('id').single()
    if (error) return setMessage(deniedMessage(error, 'Não foi possível criar.'))
    router.push(`/inbox/automacoes/${data.id}`)
  }
  async function setStatus(f: Flow, status: Flow['status']) {
    if (status === 'ativo' && !f.version) return setMessage('Abra a automação e publique antes de ativar.')
    const { error } = await supabase().from('flows').update({ status }).eq('id', f.id)
    setMessage(error ? deniedMessage(error, 'Não foi possível mudar.') : status === 'ativo' ? `"${f.name}" está ativa.` : `"${f.name}" foi pausada.`)
    setVersion(v => v + 1)
  }
  async function remove(f: Flow) {
    if (!window.confirm(`Excluir a automação "${f.name}"? Quem estiver nela para no ponto em que está.`)) return
    const { error } = await supabase().from('flows').delete().eq('id', f.id)
    setMessage(error ? deniedMessage(error, 'Não foi possível excluir.') : 'Automação excluída.')
    setVersion(v => v + 1)
  }

  if (!flows) return <Page title="Automações"><Notice>Carregando…</Notice></Page>
  return (
    <Page title="Automações" subtitle="Respostas automáticas no WhatsApp, Instagram e Messenger: por palavra-chave, comentário, story, link, horário e compras."
      actions={<div className="flex gap-2">
        <button type="button" onClick={() => void create('boas_vindas')} className="h-9 rounded-lg border border-[#e2e2e2] bg-white px-3 text-[13px]">Usar modelo de boas-vindas</button>
        <button type="button" onClick={() => void create('vazia')} className="h-9 rounded-lg bg-[#111] px-3 text-[13px] font-medium text-white">Nova automação</button>
      </div>}>
      {message ? <div role="status" className="mb-4 rounded-xl border border-[#ececec] bg-white px-4 py-3 text-[14px]">{message}</div> : null}
      {!flows.length ? <Notice>Nenhuma automação ainda. Comece pelo modelo de boas-vindas: um menu com botões que leva para o catálogo, pergunta o pedido ou chama a equipe.</Notice> : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-[#ececec] text-[12px] uppercase tracking-wide text-[#888]">
              <tr><th className="px-4 py-2.5 font-medium">Automação</th><th className="px-4 py-2.5 font-medium">Gatilhos</th><th className="px-4 py-2.5 font-medium">Situação</th><th className="px-4 py-2.5 font-medium">Pessoas (30 dias)</th><th /></tr>
            </thead>
            <tbody>
              {flows.map(f => (
                <tr key={f.id} className="border-b border-[#f3f3f3] last:border-0">
                  <td className="px-4 py-3"><Link href={`/inbox/automacoes/${f.id}`} className="font-medium text-[#111] hover:underline">{f.name}</Link>
                    <span className="ml-2 text-[12px] text-[#888]">{f.version ? `v${f.version}` : 'não publicada'}</span></td>
                  <td className="px-4 py-3 text-[13px] text-[#555]">{f.triggers.filter(t => t.active).map(t => TRIGGER_LABEL[t.kind]).join(', ') || <span className="text-[#a33]">sem gatilho</span>}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${STATUS[f.status].cls}`}>{STATUS[f.status].label}</span></td>
                  <td className="px-4 py-3 text-[#444]">{runs[f.id] ?? 0}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[13px]">
                    {f.status === 'ativo' ? <button type="button" onClick={() => void setStatus(f, 'pausado')} className="underline">Pausar</button>
                      : <button type="button" onClick={() => void setStatus(f, 'ativo')} className="underline">Ativar</button>}
                    <button type="button" onClick={() => void remove(f)} className="ml-3 text-[#a33] underline">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </Page>
  )
}

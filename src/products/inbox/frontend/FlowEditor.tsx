'use client'

import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  Background, Controls, Handle, Position, ReactFlow, ReactFlowProvider, applyNodeChanges, useReactFlow,
  type Connection, type Edge, type EdgeChange, type Node, type NodeChange, type NodeProps,
} from '@xyflow/react'
import { NODE_LABEL, TRIGGER_LABEL, outputs, validate, type FlowNode, type Graph, type NodeType, type Rule, type TriggerKind } from '../shared/flows'
import { CHANNEL_LABEL } from '../shared/rules'
import { deniedMessage, supabase, type Channel, type Tag } from './data'

type FlowRow = { id: string; name: string; status: 'rascunho' | 'ativo' | 'pausado'; draft: Graph; graph: Graph | null; version: number }
type Trigger = { id: string; kind: TriggerKind; channel_id: string | null; config: Record<string, unknown>; active: boolean }
type Stats = Record<string, { entrou: number; erro: number; clicou: Record<string, number> }>
type Ctx = { tags: Tag[]; flows: { id: string; name: string }[]; pipelines: { id: string; name: string; stages: { id: string; name: string }[] }[] }
type BlockData = { node: FlowNode; isStart: boolean; stats?: Stats[string]; tagName: (id: string) => string }

const COLOR: Record<NodeType, string> = {
  mensagem: '#2563eb', pergunta: '#7c3aed', condicao: '#d97706', etiqueta: '#db2777', campo: '#0891b2', esperar: '#64748b',
  humano: '#16a34a', webhook: '#475569', ir_para: '#0f766e', ia: '#9333ea', negocio: '#b45309',
}
const newId = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
const input = 'mt-1 w-full rounded-lg border border-[#e2e2e2] px-2.5 py-1.5 text-[13px] text-[#111]'

function defaults(type: NodeType, ctx: Ctx): FlowNode {
  const id = newId()
  switch (type) {
    case 'mensagem': return { id, type, texto: 'Escreva a mensagem…' }
    case 'pergunta': return { id, type, texto: 'Qual é o seu e-mail?', campo: 'email', validar: 'email' }
    case 'condicao': return { id, type, regra: { tipo: 'etiqueta', etiqueta: ctx.tags[0]?.id ?? '', tem: true } }
    case 'etiqueta': return { id, type, acao: 'colocar', etiqueta: ctx.tags[0]?.id ?? '' }
    case 'campo': return { id, type, campo: 'origem', valor: '' }
    case 'esperar': return { id, type, minutos: 60 }
    case 'humano': return { id, type, texto: 'Já vou chamar alguém da equipe!' }
    case 'webhook': return { id, type, url: 'https://' }
    case 'ir_para': return { id, type, fluxo: ctx.flows[0]?.id ?? '' }
    case 'ia': return { id, type }
    case 'negocio': return { id, type, funil: ctx.pipelines[0]?.id ?? '', etapa: ctx.pipelines[0]?.stages[0]?.id ?? '', titulo: 'Negócio de {{nome}}' }
  }
}

function summary(n: FlowNode, tagName: (id: string) => string) {
  switch (n.type) {
    case 'mensagem': case 'pergunta': return n.texto
    case 'condicao': return n.regra.tipo === 'etiqueta' ? `${n.regra.tem ? 'Tem' : 'Não tem'} a etiqueta ${tagName(n.regra.etiqueta)}` : n.regra.tipo === 'campo' ? `Campo ${n.regra.campo} ${n.regra.operador.replace('_', ' ')} ${n.regra.valor ?? ''}` : n.regra.tipo === 'horario' ? (n.regra.dentro ? 'Dentro do horário' : 'Fora do horário') : `Canal ${CHANNEL_LABEL[n.regra.canal]}`
    case 'etiqueta': return `${n.acao === 'colocar' ? 'Colocar' : 'Tirar'} ${tagName(n.etiqueta)}`
    case 'campo': return `${n.campo} = ${n.valor || '(vazio)'}`
    case 'esperar': return n.minutos >= 1440 && n.minutos % 1440 === 0 ? `${n.minutos / 1440} dia(s)` : n.minutos >= 60 && n.minutos % 60 === 0 ? `${n.minutos / 60} hora(s)` : `${n.minutos} min`
    case 'humano': return n.texto || 'Abre a conversa para a equipe'
    case 'webhook': return n.url
    case 'ir_para': return 'Continua em outra automação'
    case 'ia': return 'A IA responde com a base de conhecimento'
    case 'negocio': return n.titulo || 'Cria um negócio no funil'
  }
}

const Block = memo(function Block({ data, selected }: NodeProps<Node<BlockData>>) {
  const { node, isStart, stats, tagName } = data
  const outs = outputs(node)
  const single = outs.length === 1 && outs[0].handle === 'next'
  return (
    <div className={`w-[250px] rounded-xl border bg-white text-left shadow-sm ${selected ? 'border-[#111] ring-2 ring-[#111]/10' : 'border-[#e5e5ea]'}`}>
      <Handle type="target" position={Position.Left} id="in" className="!size-3 !border-2 !border-white !bg-[#8e8e93]" />
      <div className="flex items-center gap-1.5 rounded-t-xl px-3 py-1.5 text-[11.5px] font-semibold text-white" style={{ background: COLOR[node.type] }}>
        {NODE_LABEL[node.type]}{isStart ? <span className="ml-auto rounded bg-white/25 px-1.5 text-[10px]">INÍCIO</span> : null}
        {stats?.entrou ? <span className="ml-auto rounded bg-white/25 px-1.5 text-[10px]" title="Pessoas que passaram (30 dias)">▶ {stats.entrou}</span> : null}
      </div>
      <p className="line-clamp-3 whitespace-pre-wrap px-3 py-2 text-[12.5px] text-[#333]">{summary(node, tagName)}</p>
      {!single ? (
        <div className="border-t border-[#f2f2f4] py-1">
          {outs.map(o => (
            <div key={o.handle} className="relative px-3 py-1 text-right text-[12px] text-[#444]">
              {o.label}{o.handle.startsWith('b:') && stats?.clicou[o.label ?? ''] ? <span className="ml-1 text-[#8e8e93]">({stats.clicou[o.label ?? '']})</span> : null}
              <Handle type="source" position={Position.Right} id={o.handle} className="!size-3 !border-2 !border-white !bg-[#111]" />
            </div>
          ))}
        </div>
      ) : <Handle type="source" position={Position.Right} id="next" className="!size-3 !border-2 !border-white !bg-[#111]" />}
      {stats?.erro ? <p className="rounded-b-xl bg-[#fdf2f2] px-3 py-1 text-[11px] text-[#a12b2b]">{stats.erro} erro(s)</p> : null}
    </div>
  )
})
const nodeTypes = { bloco: Block }

/** Sets where an output of a node goes (null removes the arrow). */
function connect(g: Graph, source: string, handle: string, target: string | null): Graph {
  return { ...g, nodes: g.nodes.map(n => {
    if (n.id !== source) return n
    if (handle.startsWith('b:') && n.type === 'mensagem') return { ...n, botoes: n.botoes?.map(b => (b.id === handle.slice(2) ? { ...b, next: target } : b)) }
    if (handle === 'sim' && n.type === 'condicao') return { ...n, sim: target }
    if (handle === 'nao' && n.type === 'condicao') return { ...n, nao: target }
    return 'next' in n || ['mensagem', 'pergunta', 'etiqueta', 'campo', 'esperar', 'webhook', 'ia', 'negocio'].includes(n.type) ? { ...n, next: target } as FlowNode : n
  }) }
}
function removeNode(g: Graph, id: string): Graph {
  let out: Graph = { ...g, nodes: g.nodes.filter(n => n.id !== id), start: g.start === id ? null : g.start }
  for (const n of out.nodes) for (const o of outputs(n)) if (o.target === id) out = connect(out, n.id, o.handle, null)
  const positions = { ...(g.positions ?? {}) }; delete positions[id]
  return { ...out, positions }
}

export function FlowEditor({ flowId }: { flowId: string }) {
  return <ReactFlowProvider><Editor flowId={flowId} /></ReactFlowProvider>
}

function Editor({ flowId }: { flowId: string }) {
  const { orgId, isLoaded } = useAuth()
  const flowApi = useReactFlow()
  const [flow, setFlow] = useState<FlowRow | null>(null)
  const [graph, setGraph] = useState<Graph | null>(null)
  const [name, setName] = useState('')
  const [ctx, setCtx] = useState<Ctx>({ tags: [], flows: [], pipelines: [] })
  const [channels, setChannels] = useState<Channel[]>([])
  const [stats, setStats] = useState<Stats>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState<'bloco' | 'gatilhos' | 'publicar'>('gatilhos')
  const [saving, setSaving] = useState<'salvo' | 'salvando' | 'erro'>('salvo')
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const dirty = useRef(false)

  useEffect(() => {
    if (!isLoaded || !orgId) return
    let live = true
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    void Promise.all([
      supabase().from('flows').select('id, name, status, draft, graph, version').eq('id', flowId).maybeSingle(),
      supabase().from('tags').select('id, name, color').eq('workspace_id', orgId).order('name'),
      supabase().from('flows').select('id, name').eq('workspace_id', orgId).neq('id', flowId).order('name'),
      supabase().from('channels').select('id, kind, name, external_id, display, status, last_error, created_at').eq('workspace_id', orgId).order('created_at'),
      supabase().from('flow_events').select('node_id, kind, detail').eq('flow_id', flowId).gte('created_at', since).limit(20000),
      supabase().from('pipelines').select('id, name, pipeline_stages(id, name, position)').eq('workspace_id', orgId).order('position'),
    ]).then(([f, t, fl, ch, ev, pl]) => {
      if (!live) return
      const row = f.data as FlowRow | null
      if (!row) { setMessage({ text: 'Automação não encontrada.', error: true }); return }
      setFlow(row); setGraph(row.draft); setName(row.name)
      setCtx({ tags: (t.data ?? []) as Tag[], flows: (fl.data ?? []) as Ctx['flows'],
        pipelines: ((pl.data ?? []) as { id: string; name: string; pipeline_stages: { id: string; name: string; position: number }[] }[]).map(p => ({ id: p.id, name: p.name, stages: [...p.pipeline_stages].sort((a, b) => a.position - b.position) })) })
      setChannels((ch.data ?? []) as Channel[])
      const s: Stats = {}
      for (const e of (ev.data ?? []) as { node_id: string | null; kind: string; detail: string | null }[]) {
        if (!e.node_id) continue
        const x = s[e.node_id] ??= { entrou: 0, erro: 0, clicou: {} }
        if (e.kind === 'entrou') x.entrou++
        else if (e.kind === 'erro') x.erro++
        else if (e.kind === 'clicou' && e.detail) x.clicou[e.detail] = (x.clicou[e.detail] ?? 0) + 1
      }
      setStats(s)
    })
    return () => { live = false }
  }, [isLoaded, orgId, flowId])

  // Draft autosave.
  useEffect(() => {
    if (!graph || !dirty.current) return
    setSaving('salvando')
    const timer = setTimeout(async () => {
      const { error } = await supabase().from('flows').update({ draft: graph, name: name.trim() || 'Automação' }).eq('id', flowId)
      setSaving(error ? 'erro' : 'salvo')
      if (error) setMessage({ text: deniedMessage(error, 'Não foi possível salvar o rascunho.'), error: true })
    }, 700)
    return () => clearTimeout(timer)
  }, [graph, name, flowId])
  const change = useCallback((fn: (g: Graph) => Graph) => { dirty.current = true; setGraph(g => (g ? fn(g) : g)) }, [])

  const tagName = useCallback((id: string) => ctx.tags.find(t => t.id === id)?.name ?? '(etiqueta)', [ctx.tags])
  // React Flow keeps its own node state (sizes, selection, drag); the graph is rebuilt into it when it changes.
  const [nodes, setNodes] = useState<Node<BlockData>[]>([])
  useEffect(() => {
    setNodes(prev => {
      const old = new Map(prev.map(n => [n.id, n]))
      return (graph?.nodes ?? []).map((n, i) => ({
        ...(old.get(n.id) ?? {}), id: n.id, type: 'bloco', position: graph?.positions?.[n.id] ?? old.get(n.id)?.position ?? { x: 60 + (i % 4) * 320, y: 60 + Math.floor(i / 4) * 240 },
        data: { node: n, isStart: graph?.start === n.id, stats: stats[n.id], tagName },
      }))
    })
  }, [graph, stats, tagName])
  const edges = useMemo<Edge[]>(() => (graph?.nodes ?? []).flatMap(n => outputs(n).filter(o => o.target).map(o => ({
    id: `${n.id}|${o.handle}`, source: n.id, sourceHandle: o.handle, target: o.target!, targetHandle: 'in', type: 'smoothstep',
    style: { strokeWidth: 2, stroke: '#b4b4bb' },
  }))), [graph])

  const onNodesChange = useCallback((changes: NodeChange<Node<BlockData>>[]) => {
    setNodes(ns => applyNodeChanges(changes, ns))
    for (const c of changes) {
      // Positions go to the graph when a drag ends (not on every pixel).
      if (c.type === 'position' && c.position && c.dragging === false) { const p = c.position; change(g => ({ ...g, positions: { ...(g.positions ?? {}), [c.id]: { x: Math.round(p.x), y: Math.round(p.y) } } })) }
      if (c.type === 'select' && c.selected) { setSelected(c.id); setTab('bloco') }
      if (c.type === 'remove') { change(g => removeNode(g, c.id)); setSelected(s => (s === c.id ? null : s)) }
    }
  }, [change])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    for (const c of changes) if (c.type === 'remove') { const [source, handle] = c.id.split('|'); change(g => connect(g, source, handle, null)) }
  }, [change])
  const onConnect = useCallback((c: Connection) => { if (c.source && c.target && c.source !== c.target) change(g => connect(g, c.source, c.sourceHandle ?? 'next', c.target)) }, [change])

  function add(type: NodeType) {
    const node = defaults(type, ctx)
    const center = flowApi.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    change(g => ({ ...g, start: g.start ?? node.id, nodes: [...g.nodes, node], positions: { ...(g.positions ?? {}), [node.id]: { x: Math.round(center.x - 125), y: Math.round(center.y - 60) } } }))
    setSelected(node.id); setTab('bloco')
  }
  async function publish() {
    if (!graph || !flow) return
    const problems = validate(graph)
    if (problems.length) return setMessage({ text: 'Antes de publicar: ' + problems.join(' '), error: true })
    const { error } = await supabase().from('flows').update({ draft: graph, graph, name: name.trim() || 'Automação', status: 'ativo', version: flow.version + 1, published_at: new Date().toISOString() }).eq('id', flowId)
    if (error) return setMessage({ text: deniedMessage(error, 'Não foi possível publicar.'), error: true })
    setFlow({ ...flow, graph, status: 'ativo', version: flow.version + 1 }); dirty.current = false; setSaving('salvo')
    setMessage({ text: `Publicada (versão ${flow.version + 1}). Quem já está na automação continua na versão nova a partir do próximo passo.` })
  }
  async function pause() {
    if (!flow) return
    const status = flow.status === 'ativo' ? 'pausado' : 'ativo'
    if (status === 'ativo' && !flow.version) return publish()
    const { error } = await supabase().from('flows').update({ status }).eq('id', flowId)
    if (!error) setFlow({ ...flow, status })
    setMessage(error ? { text: deniedMessage(error, 'Não foi possível mudar.'), error: true } : { text: status === 'ativo' ? 'Automação ativa.' : 'Automação pausada: ninguém novo entra e quem está nela para.' })
  }

  if (!graph || !flow) return <div className="p-8 text-[14px] text-[#666]">{message?.text ?? 'Carregando…'}</div>
  const node = graph.nodes.find(n => n.id === selected) ?? null
  const changed = JSON.stringify({ ...graph, positions: undefined }) !== JSON.stringify({ ...(flow.graph ?? {}), positions: undefined })
  return (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 flex-col bg-white md:h-[100dvh]">
      <header className="flex flex-wrap items-center gap-2 border-b border-[#ececef] px-3 py-2">
        <Link href="/inbox/automacoes" className="rounded-md px-2 py-1 text-[13px] text-[#555] hover:bg-[#f2f2f4]">← Automações</Link>
        <input value={name} onChange={e => { dirty.current = true; setName(e.target.value) }} aria-label="Nome da automação" className="min-w-0 flex-1 rounded-md px-2 py-1 text-[15px] font-semibold outline-none hover:bg-[#f7f7f8] focus:bg-[#f7f7f8]" />
        <span className="text-[12px] text-[#8e8e93]">{saving === 'salvando' ? 'Salvando…' : saving === 'erro' ? 'Não salvo' : 'Rascunho salvo'}</span>
        <details className="relative">
          <summary className="flex h-8 cursor-pointer list-none items-center rounded-lg border border-[#e2e2e2] px-3 text-[13px]">+ Bloco</summary>
          <div className="absolute right-0 z-20 mt-1 grid w-56 gap-0.5 rounded-xl border border-[#e5e5ea] bg-white p-1 shadow-lg">
            {(Object.keys(NODE_LABEL) as NodeType[]).map(t => (
              <button key={t} type="button" onClick={e => { (e.currentTarget.closest('details') as HTMLDetailsElement).open = false; add(t) }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-[#f2f2f4]"><span className="size-2.5 rounded-full" style={{ background: COLOR[t] }} />{NODE_LABEL[t]}</button>
            ))}
          </div>
        </details>
        <button type="button" onClick={() => void pause()} className="h-8 rounded-lg border border-[#e2e2e2] px-3 text-[13px]">{flow.status === 'ativo' ? 'Pausar' : 'Ativar'}</button>
        <button type="button" onClick={() => void publish()} className="h-8 rounded-lg bg-[#111] px-3 text-[13px] font-medium text-white">{flow.version ? (changed ? 'Publicar alterações' : 'Publicada') : 'Publicar'}</button>
      </header>
      {message ? <p role={message.error ? 'alert' : 'status'} className={`border-b px-4 py-2 text-[13px] ${message.error ? 'border-[#f3d2d2] bg-[#fdf6f6] text-[#8a2b2b]' : 'border-[#ececef] bg-[#f7f7f8]'}`}>{message.text}</p> : null}
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 bg-[#fafafb]">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
            onPaneClick={() => setSelected(null)} fitView fitViewOptions={{ padding: 0.2, maxZoom: 1 }} deleteKeyCode={['Backspace', 'Delete']} proOptions={{ hideAttribution: true }}>
            <Background gap={20} color="#e5e5ea" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="hidden w-[340px] shrink-0 flex-col border-l border-[#ececef] md:flex">
          <div role="tablist" className="flex border-b border-[#ececef] text-[13px]">
            {([['bloco', 'Bloco'], ['gatilhos', 'Gatilhos'], ['publicar', 'Como funciona']] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex-1 py-2.5 ${tab === id ? 'border-b-2 border-[#111] font-medium' : 'text-[#8e8e93]'}`}>{label}</button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === 'bloco' ? (node ? <NodeForm key={node.id} node={node} ctx={ctx} isStart={graph.start === node.id}
              onChange={n => change(g => ({ ...g, nodes: g.nodes.map(x => (x.id === n.id ? n : x)) }))}
              onStart={() => change(g => ({ ...g, start: node.id }))} onRemove={() => { change(g => removeNode(g, node.id)); setSelected(null) }} />
              : <p className="text-[13px] text-[#8e8e93]">Clique num bloco para editar. Arraste da bolinha preta à direita de um bloco até outro para ligar.</p>) : null}
            {tab === 'gatilhos' ? <TriggersPanel flowId={flowId} channels={channels} onMessage={setMessage} /> : null}
            {tab === 'publicar' ? <Help /> : null}
          </div>
        </aside>
      </div>
    </div>
  )
}

function Help() {
  return (
    <div className="grid gap-2 text-[13px] text-[#444]">
      <p><b>Rascunho e publicação.</b> As mudanças ficam no rascunho (salvo sozinho). Só a versão publicada roda.</p>
      <p><b>Textos com dados do contato:</b> use {'{{nome}}'}, {'{{primeiro_nome}}'}, {'{{email}}'}, {'{{telefone}}'} ou qualquer campo, como {'{{tamanho}}'}.</p>
      <p><b>Botões:</b> até 3 viram botões no WhatsApp; de 4 a 10 viram uma lista. No Instagram e Messenger, respostas rápidas.</p>
      <p><b>Janela de 24 h:</b> a automação só envia enquanto a janela da Meta está aberta. Esperas longas podem terminar fora dela.</p>
      <p><b>Um fluxo por vez:</b> quando outro gatilho inicia uma automação, a anterior daquele contato para.</p>
    </div>
  )
}

function NodeForm({ node, ctx, isStart, onChange, onStart, onRemove }: { node: FlowNode; ctx: Ctx; isStart: boolean; onChange: (n: FlowNode) => void; onStart: () => void; onRemove: () => void }) {
  const set = (patch: Record<string, unknown>) => onChange({ ...node, ...patch } as FlowNode)
  return (
    <div className="grid gap-3 text-[13px]">
      <p className="flex items-center gap-2 font-semibold"><span className="size-2.5 rounded-full" style={{ background: COLOR[node.type] }} />{NODE_LABEL[node.type]}</p>
      {node.type === 'mensagem' || node.type === 'pergunta' || node.type === 'humano' ? (
        <label className="text-[#555]">Texto<textarea value={node.texto ?? ''} onChange={e => set({ texto: e.target.value })} rows={5} className={input} /></label>
      ) : null}
      {node.type === 'mensagem' ? (
        <div>
          <p className="text-[#555]">Botões ({node.botoes?.length ?? 0}/10)</p>
          {(node.botoes ?? []).map((b, i) => (
            <div key={b.id} className="mt-1 flex gap-1">
              <input value={b.label} maxLength={20} onChange={e => set({ botoes: node.botoes!.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className={input + ' mt-0'} aria-label={`Botão ${i + 1}`} />
              <button type="button" onClick={() => set({ botoes: node.botoes!.filter((_, j) => j !== i) })} className="px-2 text-[#a33]" aria-label="Remover botão">✕</button>
            </div>
          ))}
          {(node.botoes?.length ?? 0) < 10 ? <button type="button" onClick={() => set({ botoes: [...(node.botoes ?? []), { id: newId(), label: 'Opção', next: null }], next: undefined })} className="mt-1.5 text-[#2563eb] underline">+ botão</button> : null}
        </div>
      ) : null}
      {node.type === 'pergunta' ? (<>
        <label className="text-[#555]">Guardar a resposta no campo<input value={node.campo} onChange={e => set({ campo: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className={input} /></label>
        <label className="text-[#555]">Conferir resposta<select value={node.validar ?? 'texto'} onChange={e => set({ validar: e.target.value })} className={input}>
          <option value="texto">Qualquer texto</option><option value="email">E-mail</option><option value="telefone">Telefone</option><option value="numero">Número</option></select></label>
      </>) : null}
      {node.type === 'condicao' ? <RuleForm rule={node.regra} tags={ctx.tags} onChange={regra => set({ regra })} /> : null}
      {node.type === 'etiqueta' ? (<>
        <label className="text-[#555]">Ação<select value={node.acao} onChange={e => set({ acao: e.target.value })} className={input}><option value="colocar">Colocar etiqueta</option><option value="tirar">Tirar etiqueta</option></select></label>
        <label className="text-[#555]">Etiqueta<select value={node.etiqueta} onChange={e => set({ etiqueta: e.target.value })} className={input}><option value="">Escolha…</option>{ctx.tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        {!ctx.tags.length ? <p className="text-[12px] text-[#8e8e93]">Crie etiquetas em <Link href="/inbox/configuracoes" className="underline">Configurações</Link>.</p> : null}
      </>) : null}
      {node.type === 'campo' ? (<>
        <label className="text-[#555]">Campo<input value={node.campo} onChange={e => set({ campo: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })} className={input} /></label>
        <label className="text-[#555]">Valor<input value={node.valor} onChange={e => set({ valor: e.target.value })} className={input} placeholder="ex.: anúncio verão" /></label>
      </>) : null}
      {node.type === 'esperar' ? (
        <div className="flex gap-2">
          <label className="flex-1 text-[#555]">Quanto<input type="number" min={1} value={node.minutos >= 1440 && node.minutos % 1440 === 0 ? node.minutos / 1440 : node.minutos >= 60 && node.minutos % 60 === 0 ? node.minutos / 60 : node.minutos}
            onChange={e => { const unit = node.minutos >= 1440 && node.minutos % 1440 === 0 ? 1440 : node.minutos >= 60 && node.minutos % 60 === 0 ? 60 : 1; set({ minutos: Math.max(1, Number(e.target.value) || 1) * unit }) }} className={input} /></label>
          <label className="flex-1 text-[#555]">Unidade<select value={node.minutos >= 1440 && node.minutos % 1440 === 0 ? 1440 : node.minutos >= 60 && node.minutos % 60 === 0 ? 60 : 1}
            onChange={e => { const cur = node.minutos >= 1440 && node.minutos % 1440 === 0 ? node.minutos / 1440 : node.minutos >= 60 && node.minutos % 60 === 0 ? node.minutos / 60 : node.minutos; set({ minutos: cur * Number(e.target.value) }) }} className={input}>
            <option value={1}>minutos</option><option value={60}>horas</option><option value={1440}>dias</option></select></label>
        </div>
      ) : null}
      {node.type === 'webhook' ? <label className="text-[#555]">Link (recebe os dados do contato em JSON)<input value={node.url} onChange={e => set({ url: e.target.value })} className={input} /></label> : null}
      {node.type === 'ir_para' ? <label className="text-[#555]">Automação<select value={node.fluxo} onChange={e => set({ fluxo: e.target.value })} className={input}><option value="">Escolha…</option>{ctx.flows.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label> : null}
      {node.type === 'ia' ? <p className="text-[#555]">A IA conversa com o cliente usando a base de conhecimento (Configurações → IA), respondendo cada nova mensagem. Quando não souber, o cliente pedir uma pessoa ou passar de 15 respostas, ela passa a conversa para a equipe e a automação segue para o próximo bloco (se houver).</p> : null}
      {node.type === 'negocio' ? (<>
        <label className="text-[#555]">Funil<select value={node.funil} onChange={e => set({ funil: e.target.value, etapa: ctx.pipelines.find(p => p.id === e.target.value)?.stages[0]?.id ?? '' })} className={input}><option value="">Escolha…</option>{ctx.pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="text-[#555]">Etapa<select value={node.etapa} onChange={e => set({ etapa: e.target.value })} className={input}>{(ctx.pipelines.find(p => p.id === node.funil)?.stages ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="text-[#555]">Título<input value={node.titulo ?? ''} onChange={e => set({ titulo: e.target.value })} className={input} /></label>
        {!ctx.pipelines.length ? <p className="text-[12px] text-[#8e8e93]">Crie um funil em <Link href="/inbox/negocios" className="underline">Negócios</Link>.</p> : null}
      </>) : null}
      <div className="flex flex-wrap gap-2 border-t border-[#f2f2f4] pt-3">
        {!isStart ? <button type="button" onClick={onStart} className="h-8 rounded-lg border border-[#e2e2e2] px-3">Definir como início</button> : <span className="text-[12px] text-[#16a34a]">Este é o bloco inicial</span>}
        <button type="button" onClick={onRemove} className="ml-auto text-[#a33] underline">Excluir bloco</button>
      </div>
    </div>
  )
}

function RuleForm({ rule, tags, onChange }: { rule: Rule; tags: Tag[]; onChange: (r: Rule) => void }) {
  return (
    <div className="grid gap-2">
      <label className="text-[#555]">Verificar<select value={rule.tipo} onChange={e => {
        const t = e.target.value as Rule['tipo']
        onChange(t === 'etiqueta' ? { tipo: t, etiqueta: tags[0]?.id ?? '', tem: true } : t === 'campo' ? { tipo: t, campo: 'email', operador: 'existe' } : t === 'horario' ? { tipo: t, dentro: true } : { tipo: t, canal: 'whatsapp' })
      }} className={input}><option value="etiqueta">Etiqueta</option><option value="campo">Campo do contato</option><option value="horario">Horário de atendimento</option><option value="canal">Canal</option></select></label>
      {rule.tipo === 'etiqueta' ? (<>
        <select value={String(rule.tem)} onChange={e => onChange({ ...rule, tem: e.target.value === 'true' })} className={input} aria-label="Tem ou não"><option value="true">Tem a etiqueta</option><option value="false">Não tem a etiqueta</option></select>
        <select value={rule.etiqueta} onChange={e => onChange({ ...rule, etiqueta: e.target.value })} className={input} aria-label="Etiqueta"><option value="">Escolha…</option>{tags.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      </>) : null}
      {rule.tipo === 'campo' ? (<>
        <input value={rule.campo} onChange={e => onChange({ ...rule, campo: e.target.value })} className={input} aria-label="Campo" placeholder="campo" />
        <select value={rule.operador} onChange={e => onChange({ ...rule, operador: e.target.value as 'igual' })} className={input} aria-label="Operador"><option value="existe">está preenchido</option><option value="nao_existe">está vazio</option><option value="igual">é igual a</option><option value="contem">contém</option></select>
        {rule.operador === 'igual' || rule.operador === 'contem' ? <input value={rule.valor ?? ''} onChange={e => onChange({ ...rule, valor: e.target.value })} className={input} aria-label="Valor" /> : null}
      </>) : null}
      {rule.tipo === 'horario' ? <select value={String(rule.dentro)} onChange={e => onChange({ tipo: 'horario', dentro: e.target.value === 'true' })} className={input} aria-label="Horário"><option value="true">Dentro do horário</option><option value="false">Fora do horário</option></select> : null}
      {rule.tipo === 'canal' ? <select value={rule.canal} onChange={e => onChange({ tipo: 'canal', canal: e.target.value as 'whatsapp' })} className={input} aria-label="Canal">{Object.entries(CHANNEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select> : null}
      <p className="text-[12px] text-[#8e8e93]">Ligue a saída “Sim” e a “Não” a blocos diferentes.</p>
    </div>
  )
}

function TriggersPanel({ flowId, channels, onMessage }: { flowId: string; channels: Channel[]; onMessage: (m: { text: string; error?: boolean }) => void }) {
  const { orgId } = useAuth()
  const [list, setList] = useState<Trigger[]>([])
  const [version, setVersion] = useState(0)
  const [kind, setKind] = useState<TriggerKind>('palavra_chave')
  const [form, setForm] = useState({ palavras: '', modo: 'contem', codigo: '', post: '', resposta_publica: '', produto: '', canal: '' })
  useEffect(() => {
    let live = true
    void supabase().from('triggers').select('id, kind, channel_id, config, active').eq('flow_id', flowId).order('created_at').then(r => { if (live) setList((r.data ?? []) as Trigger[]) })
    return () => { live = false }
  }, [flowId, version])
  async function add() {
    const palavras = form.palavras.split(',').map(s => s.trim()).filter(Boolean)
    const config: Record<string, unknown> = kind === 'palavra_chave' ? { palavras, modo: form.modo } : kind === 'link_ref' ? { codigo: form.codigo.trim() }
      : kind === 'comentario' ? { palavras, post: form.post.trim() || undefined, resposta_publica: form.resposta_publica.trim() || undefined }
        : kind === 'story' ? { palavras } : ['compra', 'reembolso', 'carrinho_abandonado'].includes(kind) ? { produto: form.produto.trim() || undefined } : {}
    if (kind === 'palavra_chave' && !palavras.length) return onMessage({ text: 'Escreva ao menos uma palavra.', error: true })
    if (kind === 'link_ref' && !/^[A-Za-z0-9_-]{3,40}$/.test(form.codigo.trim())) return onMessage({ text: 'Código com 3 a 40 letras, números, - ou _ (ex.: anuncio_verao).', error: true })
    const { error } = await supabase().from('triggers').insert({ workspace_id: orgId, flow_id: flowId, kind, config, channel_id: form.canal || null })
    onMessage(error ? { text: deniedMessage(error, 'Não foi possível adicionar.'), error: true } : { text: 'Gatilho adicionado. Publique a automação para ele valer.' })
    if (!error) { setForm({ ...form, palavras: '', codigo: '', post: '', resposta_publica: '', produto: '' }); setVersion(v => v + 1) }
  }
  const wa = channels.find(c => c.kind === 'whatsapp' && c.display)
  const describe = (t: Trigger) => {
    const c = t.config, w = Array.isArray(c.palavras) ? (c.palavras as string[]).join(', ') : ''
    return [w && `"${w}"`, c.modo === 'igual' && 'mensagem exata', c.codigo && `código ${c.codigo}`, c.post && `post ${c.post}`, c.resposta_publica && 'com resposta pública', c.produto && `produto ${c.produto}`,
      t.channel_id ? channels.find(ch => ch.id === t.channel_id)?.name : 'todos os canais'].filter(Boolean).join(' · ')
  }
  return (
    <div className="grid gap-3 text-[13px]">
      <p className="text-[#555]">O que faz esta automação começar. O primeiro que combinar vale.</p>
      <ul className="grid gap-1.5">
        {list.map(t => (
          <li key={t.id} className="rounded-lg border border-[#ececef] px-3 py-2">
            <div className="flex items-center gap-2"><b>{TRIGGER_LABEL[t.kind]}</b>
              <label className="ml-auto flex items-center gap-1 text-[12px]"><input type="checkbox" checked={t.active} onChange={async e => { await supabase().from('triggers').update({ active: e.target.checked }).eq('id', t.id); setVersion(v => v + 1) }} />ligado</label>
              <button type="button" onClick={async () => { await supabase().from('triggers').delete().eq('id', t.id); setVersion(v => v + 1) }} className="text-[#a33]" aria-label="Remover gatilho">✕</button>
            </div>
            <p className="text-[12px] text-[#666]">{describe(t)}</p>
            {t.kind === 'link_ref' && wa?.display ? <p className="mt-1 break-all text-[12px] text-[#2563eb]">wa.me/{wa.display.replace(/\D/g, '')}?text={encodeURIComponent(String(t.config.codigo))}</p> : null}
          </li>
        ))}
        {!list.length ? <li className="text-[12px] text-[#a33]">Sem gatilho: a automação só roda se outra a chamar.</li> : null}
      </ul>
      <div className="grid gap-2 rounded-xl bg-[#f7f7f8] p-3">
        <label className="text-[#555]">Novo gatilho<select value={kind} onChange={e => setKind(e.target.value as TriggerKind)} className={input}>{Object.entries(TRIGGER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        {kind === 'palavra_chave' || kind === 'comentario' || kind === 'story' ? (
          <label className="text-[#555]">Palavras (separadas por vírgula){kind !== 'palavra_chave' ? ' — vazio = qualquer' : ''}<input value={form.palavras} onChange={e => setForm({ ...form, palavras: e.target.value })} className={input} placeholder="preço, quero, link" /></label>
        ) : null}
        {kind === 'palavra_chave' ? <select value={form.modo} onChange={e => setForm({ ...form, modo: e.target.value })} className={input} aria-label="Modo"><option value="contem">A mensagem contém</option><option value="igual">A mensagem é exatamente</option></select> : null}
        {kind === 'link_ref' ? <label className="text-[#555]">Código<input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} className={input} placeholder="anuncio_verao" /></label> : null}
        {kind === 'comentario' ? (<>
          <label className="text-[#555]">Só no post (id, opcional)<input value={form.post} onChange={e => setForm({ ...form, post: e.target.value })} className={input} /></label>
          <label className="text-[#555]">Resposta pública no comentário (opcional)<input value={form.resposta_publica} onChange={e => setForm({ ...form, resposta_publica: e.target.value })} className={input} placeholder="Te mandei no Direct! 📩" /></label>
        </>) : null}
        {['compra', 'reembolso', 'carrinho_abandonado'].includes(kind) ? <label className="text-[#555]">Só para o produto (opcional)<input value={form.produto} onChange={e => setForm({ ...form, produto: e.target.value })} className={input} /></label> : null}
        {kind !== 'compra' && kind !== 'reembolso' && kind !== 'carrinho_abandonado' ? (
          <label className="text-[#555]">Canal<select value={form.canal} onChange={e => setForm({ ...form, canal: e.target.value })} className={input}><option value="">Todos</option>{channels.map(c => <option key={c.id} value={c.id}>{c.name} ({CHANNEL_LABEL[c.kind]})</option>)}</select></label>
        ) : null}
        {kind === 'comentario' || kind === 'story' ? <p className="text-[12px] text-[#8e8e93]">Precisa do Instagram conectado com as permissões de comentários e mensagens da Meta.</p> : null}
        {kind === 'fora_do_horario' ? <p className="text-[12px] text-[#8e8e93]">Use o horário de Configurações. Roda no máximo uma vez a cada 12 h por contato.</p> : null}
        {['compra', 'reembolso', 'carrinho_abandonado'].includes(kind) ? <p className="text-[12px] text-[#8e8e93]">Precisa de uma integração de vendas em Canais → Integrações.</p> : null}
        <button type="button" onClick={() => void add()} className="h-8 rounded-lg bg-[#111] text-white">Adicionar gatilho</button>
      </div>
    </div>
  )
}

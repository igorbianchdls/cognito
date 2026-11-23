'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card } from '@/products/analytics/frontend/ui'
import { deniedMessage, supabase } from './data'

type Article = { id: string; title: string; body: string; updated_at: string }
const input = 'w-full rounded-lg border border-[#e2e2e2] bg-white px-2.5 text-[13px] text-[#111]'

/** What the AI knows (knowledge base) and how it should talk (company rules). */
export function AiCard() {
  const { orgId, isLoaded } = useAuth()
  const [on, setOn] = useState<boolean | null>(null)
  const [rules, setRules] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [editing, setEditing] = useState<Partial<Article> | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!isLoaded || !orgId) return
    let live = true
    void Promise.all([
      fetch('/api/inbox/ia').then(r => r.json()).catch(() => ({ ligada: false })) as Promise<{ ligada: boolean }>,
      supabase().from('settings').select('ai_instructions').eq('workspace_id', orgId).maybeSingle(),
      supabase().from('kb_articles').select('id, title, body, updated_at').eq('workspace_id', orgId).order('title'),
    ]).then(([c, s, a]) => { if (!live) return; setOn(c.ligada); setRules((s.data?.ai_instructions as string | null) ?? ''); setArticles((a.data ?? []) as Article[]) })
    return () => { live = false }
  }, [isLoaded, orgId, version])

  async function saveRules() {
    const { error } = await supabase().from('settings').upsert({ workspace_id: orgId, ai_instructions: rules.trim() || null })
    setMessage(error ? deniedMessage(error, 'Não foi possível salvar.') : 'Regras salvas.')
  }
  async function saveArticle() {
    const title = editing?.title?.trim(), body = editing?.body?.trim()
    if (!title || !body) return setMessage('Preencha o título e o texto.')
    const { error } = editing?.id ? await supabase().from('kb_articles').update({ title, body }).eq('id', editing.id)
      : await supabase().from('kb_articles').insert({ workspace_id: orgId, title, body })
    setMessage(error ? deniedMessage(error, 'Não foi possível salvar o artigo.') : 'Artigo salvo.')
    if (!error) { setEditing(null); setVersion(v => v + 1) }
  }

  return (
    <Card title="IA no atendimento">
      {on === false ? <p className="mb-3 rounded-lg bg-[#fff7e6] p-3 text-[13px] text-[#8a5a00]">A IA ainda não foi ligada no servidor: falta a chave da Anthropic (ANTHROPIC_API_KEY) na Vercel. Você já pode montar a base de conhecimento.</p> : null}
      {message ? <p role="status" className="mb-3 text-[13px]">{message}</p> : null}
      <div className="grid gap-4 text-[13px] text-[#555]">
        <p>A IA sugere respostas e resume conversas (botões na caixa de entrada) e pode atender sozinha pelo bloco “IA” das automações. Ela usa só o que está aqui.</p>
        <label>Regras da empresa
          <textarea value={rules} onChange={e => setRules(e.target.value)} rows={4} maxLength={4000} placeholder={'Ex.: Trate o cliente por você. Não ofereça desconto. Para troca, peça o número do pedido.'} className={`${input} mt-1 py-2`} />
        </label>
        <button type="button" onClick={() => void saveRules()} className="h-8 w-fit rounded-lg border border-[#e2e2e2] px-3">Salvar regras</button>
        <div>
          <div className="mb-1.5 flex items-center justify-between"><p className="font-medium text-[#111]">Base de conhecimento ({articles.length})</p>
            <button type="button" onClick={() => setEditing({ title: '', body: '' })} className="h-8 rounded-lg bg-[#111] px-3 font-medium text-white">+ Artigo</button></div>
          {!articles.length ? <p className="text-[12px] text-[#888]">Comece pelas perguntas que mais chegam: preços, prazos de entrega, formas de pagamento, como acessar o curso, política de troca.</p> : null}
          <ul className="grid gap-1">{articles.map(a => (
            <li key={a.id}><button type="button" onClick={() => setEditing(a)} className="w-full rounded-lg border border-[#f0f0f0] px-3 py-2 text-left hover:bg-[#fafafa]">
              <b className="text-[#111]">{a.title}</b><span className="line-clamp-1 text-[12px] text-[#777]">{a.body}</span></button></li>))}</ul>
        </div>
        {editing ? (
          <div className="grid gap-2 rounded-lg border border-[#ececec] p-3">
            <input value={editing.title ?? ''} onChange={e => setEditing({ ...editing, title: e.target.value })} maxLength={200} placeholder="Título (ex.: Prazo de entrega)" className={`${input} h-9`} />
            <textarea value={editing.body ?? ''} onChange={e => setEditing({ ...editing, body: e.target.value })} rows={8} maxLength={20000} placeholder="Escreva como explicaria a um atendente novo." className={`${input} py-2`} />
            <div className="flex gap-2">
              <button type="button" onClick={() => void saveArticle()} className="h-8 rounded-lg bg-[#111] px-3 font-medium text-white">Salvar</button>
              <button type="button" onClick={() => setEditing(null)} className="h-8 px-2">Cancelar</button>
              {editing.id ? <button type="button" onClick={async () => { if (!window.confirm('Excluir este artigo?')) return; const { error } = await supabase().from('kb_articles').delete().eq('id', editing.id!); setMessage(error ? deniedMessage(error, 'Não foi possível excluir.') : 'Artigo excluído.'); if (!error) { setEditing(null); setVersion(v => v + 1) } }} className="ml-auto text-[#a33] underline">Excluir</button> : null}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

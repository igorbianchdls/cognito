'use client'

import { useState } from 'react'
import { useLeitura } from './api'
import { cleanDomains, useProperties, type Property } from './properties'
import { haQuanto } from './ui'

/** Se o código já está no site: o último evento recebido. */
function Instalacao({ id }: { id: string }) {
  const r = useLeitura<{ ultimo_evento: string | null; eventos_ultimo_dia: number }>(`catalogo?propriedade=${id}&tipo=instalacao`)
  if (!r.dados) return null
  return r.dados.ultimo_evento
    ? <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-[#2f7a3a]" data-instalado><span className="size-2 rounded-full bg-[#2f9e44]" />Recebendo eventos · último {haQuanto(r.dados.ultimo_evento)} · {r.dados.eventos_ultimo_dia.toLocaleString('pt-BR')} nas últimas 24 h</p>
    : <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-[#9a6200]" data-instalado><span className="size-2 rounded-full bg-[#f08c00]" />Nenhum evento ainda: cole o código abaixo e abra o site</p>
}
import { Card, Notice, Page } from './ui'

const ORIGIN = typeof window === 'undefined' ? 'https://ottogestao.com.br' : window.location.origin

function snippet(p: Property) {
  return `<script async src="${ORIGIN}/otto.js" data-key="${p.public_key}"${p.require_consent ? ' data-consent="required"' : ''}></script>`
}

type Valores = { name: string; kind: 'site' | 'app'; domains: string[]; require_consent: boolean; autocapture: boolean; replay_sample: number; replay_mask_text: boolean }
function Editor({ initial, onSave, onCancel, saving }: { initial?: Property; onSave: (v: Valores) => void; onCancel?: () => void; saving: boolean }) {
  const [auto, setAuto] = useState(initial?.autocapture ?? true)
  const [amostra, setAmostra] = useState(initial?.replay_sample ?? 0)
  const [mascarar, setMascarar] = useState(initial?.replay_mask_text ?? true)
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<'site' | 'app'>(initial?.kind ?? 'site')
  const [domains, setDomains] = useState(initial?.domains.join(', ') ?? '')
  const [consent, setConsent] = useState(initial?.require_consent ?? false)
  const parsed = cleanDomains(domains)
  return (
    <form className="grid gap-3" onSubmit={e => { e.preventDefault(); if (name.trim()) onSave({ name: name.trim(), kind, domains: parsed, require_consent: consent, autocapture: auto, replay_sample: amostra, replay_mask_text: mascarar }) }}>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-1 text-[13px] text-[#555]">Nome
          <input required maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Site da loja" className="h-10 rounded-lg border border-[#e2e2e2] px-3 text-[14px] text-[#111]" />
        </label>
        <label className="grid gap-1 text-[13px] text-[#555]">Tipo
          <select value={kind} onChange={e => setKind(e.target.value as 'site' | 'app')} className="h-10 rounded-lg border border-[#e2e2e2] bg-white px-3 text-[14px] text-[#111]">
            <option value="site">Site</option><option value="app">App</option>
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-[13px] text-[#555]">Domínios que podem enviar eventos
        <input value={domains} onChange={e => setDomains(e.target.value)} placeholder="minhaloja.com.br, app.minhaloja.com.br" className="h-10 rounded-lg border border-[#e2e2e2] px-3 text-[14px] text-[#111]" />
        <span className="text-[12px] text-[#888]">{parsed.length ? `Aceita: ${parsed.join(', ')} e subdomínios.` : 'Sem domínio, aceita eventos de qualquer site com a chave. Recomendado informar.'}</span>
      </label>
      <label className="flex items-start gap-2 text-[13px] text-[#333]">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
        <span>Pedir consentimento: o visitante só é lembrado entre visitas depois de aceitar os cookies (chame <code>otto.consent(true)</code> no banner).</span>
      </label>
      <label className="flex items-start gap-2 text-[13px] text-[#333]">
        <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} className="mt-0.5" />
        <span>Capturar cliques e rolagem sozinho (alimenta o mapa de calor). Campos de senha, e-mail e o que é digitado nunca são guardados.</span>
      </label>
      <div className="grid gap-1 text-[13px] text-[#333]">
        <label htmlFor="amostra">Gravar sessões: <b>{amostra ? `${amostra}% das sessões` : 'desligado'}</b></label>
        <input id="amostra" type="range" min={0} max={100} step={5} value={amostra} onChange={e => setAmostra(Number(e.target.value))} aria-label="Porcentagem de sessões gravadas" className="max-w-xs" />
        {amostra ? <label className="flex items-start gap-2"><input type="checkbox" checked={mascarar} onChange={e => setMascarar(e.target.checked)} className="mt-0.5" /><span>Esconder todo o texto da página na gravação (recomendado se o site mostra dados pessoais). Sem isso, use <code>data-otto-mask</code> nos trechos sensíveis.</span></label> : null}
        <span className="text-[12px] text-[#888]">As gravações ficam guardadas por 30 dias. Com consentimento pedido, só gravam depois de <code>otto.consent(true)</code>.</span>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="h-10 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white disabled:opacity-60">{initial ? 'Salvar' : 'Cadastrar'}</button>
        {onCancel ? <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-[#e2e2e2] px-4 text-[14px] text-[#333]">Cancelar</button> : null}
      </div>
    </form>
  )
}

/** Sites e apps: register what is measured, its domains, and the code to paste in the site. */
export function SitesView() {
  const props = useProperties()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const run = async (fn: () => Promise<string | null>, done?: () => void) => { setSaving(true); const err = await fn(); setSaving(false); setMessage(err); if (!err) done?.() }

  return (
    <Page title="Sites e apps" subtitle="O que é medido. Cada um tem sua chave e o código para colar no site."
      actions={!adding ? <button type="button" onClick={() => setAdding(true)} className="h-10 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Novo site ou app</button> : null}>
      {message ? <div className="mb-4"><Notice tone="error">{message}</Notice></div> : null}
      {adding ? <Card title="Novo site ou app" className="mb-4"><Editor saving={saving} onCancel={() => setAdding(false)} onSave={v => run(() => props.create(v), () => setAdding(false))} /></Card> : null}
      {props.error ? <Notice tone="error">{props.error}</Notice> : !props.list ? <Notice>Carregando…</Notice> : !props.list.length && !adding ? (
        <Notice>Nenhum site ou app ainda. Cadastre o primeiro para receber a chave e o código.</Notice>
      ) : (
        <div className="grid gap-4">
          {props.list.map(p => (
            <Card key={p.id}>
              {editing === p.id ? <Editor initial={p} saving={saving} onCancel={() => setEditing(null)} onSave={v => run(() => props.update(p.id, v), () => setEditing(null))} /> : (
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#111]">{p.name} <span className="ml-1 rounded-full bg-[#f3f3f3] px-2 py-0.5 text-[12px] font-medium text-[#555]">{p.kind === 'app' ? 'App' : 'Site'}</span></h2>
                      <p className="mt-1 text-[13px] text-[#6b6b6b]">{p.domains.length ? p.domains.join(', ') : 'Qualquer domínio'}{p.require_consent ? ' · pede consentimento' : ''}{p.autocapture ? ' · cliques automáticos' : ''}{p.replay_sample ? ` · grava ${p.replay_sample}% das sessões` : ''}</p>
                      <Instalacao id={p.id} />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditing(p.id)} className="h-9 rounded-lg border border-[#e2e2e2] px-3 text-[13px] text-[#333]">Editar</button>
                      <button type="button" onClick={() => { if (confirm(`Excluir "${p.name}"? Os eventos, gravações, insights e flags dele serão apagados.`)) void run(() => props.remove(p.id)) }}
                        className="h-9 rounded-lg border border-[#f0d4d4] px-3 text-[13px] text-[#a33]">Excluir</button>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[13px] text-[#555]">Cole antes de <code>&lt;/head&gt;</code> em todas as páginas:</p>
                    <div className="flex items-stretch gap-2">
                      <pre className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-[#111] px-3 py-2.5 text-[12px] text-[#eaeaea]">{snippet(p)}</pre>
                      <button type="button" onClick={() => { void navigator.clipboard?.writeText(snippet(p)); setCopied(p.id); setTimeout(() => setCopied(null), 1500) }}
                        className="shrink-0 rounded-lg border border-[#e2e2e2] px-3 text-[13px] text-[#333]">{copied === p.id ? 'Copiado' : 'Copiar'}</button>
                    </div>
                    <p className="mt-2 text-[12px] text-[#888]">Flags: <code>otto.flag(&apos;nova-home&apos;)</code> · Eventos próprios: <code>otto.track(&apos;criou_conta&apos;, {'{ plano: \'pro\' }'})</code> · ligar ao usuário logado: <code>otto.identify(&apos;id-do-usuario&apos;)</code></p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Page>
  )
}

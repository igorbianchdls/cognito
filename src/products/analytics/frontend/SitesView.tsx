'use client'

import { useState } from 'react'
import { cleanDomains, useProperties, type Property } from './properties'
import { Card, Notice, Page } from './ui'

const ORIGIN = typeof window === 'undefined' ? 'https://ottogestao.com.br' : window.location.origin

function snippet(p: Property) {
  return `<script async src="${ORIGIN}/otto.js" data-key="${p.public_key}"${p.require_consent ? ' data-consent="required"' : ''}></script>`
}

function Editor({ initial, onSave, onCancel, saving }: { initial?: Property; onSave: (v: { name: string; kind: 'site' | 'app'; domains: string[]; require_consent: boolean }) => void; onCancel?: () => void; saving: boolean }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [kind, setKind] = useState<'site' | 'app'>(initial?.kind ?? 'site')
  const [domains, setDomains] = useState(initial?.domains.join(', ') ?? '')
  const [consent, setConsent] = useState(initial?.require_consent ?? false)
  const parsed = cleanDomains(domains)
  return (
    <form className="grid gap-3" onSubmit={e => { e.preventDefault(); if (name.trim()) onSave({ name: name.trim(), kind, domains: parsed, require_consent: consent }) }}>
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
                      <p className="mt-1 text-[13px] text-[#6b6b6b]">{p.domains.length ? p.domains.join(', ') : 'Qualquer domínio'}{p.require_consent ? ' · pede consentimento' : ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditing(p.id)} className="h-9 rounded-lg border border-[#e2e2e2] px-3 text-[13px] text-[#333]">Editar</button>
                      <button type="button" onClick={() => { if (confirm(`Excluir "${p.name}"? Os eventos já guardados continuam no BigQuery, mas deixam de aparecer aqui.`)) void run(() => props.remove(p.id)) }}
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
                    <p className="mt-2 text-[12px] text-[#888]">Eventos próprios: <code>otto.track(&apos;criou_conta&apos;, {'{ plano: \'pro\' }'})</code> · ligar ao usuário logado: <code>otto.identify(&apos;id-do-usuario&apos;)</code></p>
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

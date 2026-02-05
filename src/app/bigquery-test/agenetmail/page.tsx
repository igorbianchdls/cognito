"use client"

import { useMemo, useState } from 'react'

type Json = any

export default function AgentMailUITest() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>('')
  const [result, setResult] = useState<Json>(null)

  // Create Inbox
  const [domain, setDomain] = useState<string>('')
  const [inboxId, setInboxId] = useState<string>('')
  const [inboxAddress, setInboxAddress] = useState<string>('')

  // Send
  const [to, setTo] = useState<string>('')
  const [subject, setSubject] = useState<string>('Hello from AgentMail!')
  const [text, setText] = useState<string>('This is my first email sent with the AgentMail API.')

  const disabled = useMemo(() => busy, [busy])

  const callApi = async (payload: Record<string, any>) => {
    setBusy(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/bigquery-test/agenetmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) throw new Error(json?.error || `Falha: ${res.status}`)
      setResult(json)
      return json
    } catch (e: any) {
      setError(e?.message || String(e))
      return null
    } finally {
      setBusy(false)
    }
  }

  const createInbox = async () => {
    const json = await callApi({ action: 'createInbox', domain: domain.trim() || undefined })
    if (json?.inbox) {
      setInboxId(json.inbox.inboxId || '')
      setInboxAddress(json.inbox.email || json.inbox.address || '')
    }
  }

  const sendEmail = async () => {
    if (!inboxId.trim()) { setError('Preencha Inbox ID (crie uma inbox antes).'); return }
    await callApi({ action: 'send', inboxId: inboxId.trim(), to: to.trim(), subject: subject.trim(), text })
  }

  const createAndSend = async () => {
    const json = await callApi({ action: 'createAndSend', domain: domain.trim() || undefined, to: to.trim(), subject: subject.trim(), text })
    if (json?.inbox) {
      setInboxId(json.inbox.inboxId || '')
      setInboxAddress(json.inbox.email || json.inbox.address || '')
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Teste — AgentMail (Inbox + Send)</h1>
        <p className="text-sm text-slate-600">Esta UI chama a rota <code className="bg-slate-100 px-1 rounded">/api/bigquery-test/agenetmail</code>. Defina a variável <code>AGENTMAIL_API_KEY</code> no servidor.</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Inbox */}
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">1) Criar Inbox</h2>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-slate-600">Domain (opcional)</label>
              <input value={domain} onChange={(e)=> setDomain(e.target.value)} disabled={disabled} className="w-full rounded border px-2 py-1.5 text-sm" placeholder="ex.: minhaempresa.com" />
              <div className="mt-1 text-[11px] text-slate-500">Se vazio, usa o domínio padrão @agentmail.to</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={createInbox} disabled={disabled} className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60">Criar inbox</button>
              {inboxAddress && <span className="text-xs text-slate-700">Endereço: <b>{inboxAddress}</b></span>}
            </div>
          </div>
        </section>

        {/* Send */}
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">2) Enviar Email</h2>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-slate-600">Inbox ID</label>
              <input value={inboxId} onChange={(e)=> setInboxId(e.target.value)} disabled={disabled} className="w-full rounded border px-2 py-1.5 text-sm" placeholder="preencha com o ID da inbox" />
            </div>
            <div>
              <label className="block text-xs text-slate-600">Para (To)</label>
              <input value={to} onChange={(e)=> setTo(e.target.value)} disabled={disabled} className="w-full rounded border px-2 py-1.5 text-sm" placeholder="seu-email@exemplo.com" />
            </div>
            <div>
              <label className="block text-xs text-slate-600">Assunto</label>
              <input value={subject} onChange={(e)=> setSubject(e.target.value)} disabled={disabled} className="w-full rounded border px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-600">Texto</label>
              <textarea value={text} onChange={(e)=> setText(e.target.value)} disabled={disabled} className="h-24 w-full rounded border px-2 py-1.5 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={sendEmail} disabled={disabled} className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60">Enviar</button>
              <button onClick={createAndSend} disabled={disabled} className="rounded border px-3 py-1.5 text-sm disabled:opacity-60">Criar e enviar (atalho)</button>
            </div>
          </div>
        </section>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <div className="text-xs text-slate-600 mb-1">Resultado</div>
        {result ? (
          <pre className="max-h-[360px] overflow-auto rounded border bg-slate-50 p-3 text-xs"><code>{JSON.stringify(result, null, 2)}</code></pre>
        ) : (
          <div className="rounded border bg-white p-3 text-xs text-slate-500">Sem resultado ainda.</div>
        )}
      </div>
    </div>
  )
}


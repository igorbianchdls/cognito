"use client";

import { useState } from "react";

export default function ComposioStartPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectGmail = async () => {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/composio/authorize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toolkit: 'gmail' }) })
      const data = await res.json().catch(()=> ({}))
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Falha ao iniciar conexão')
      const url = (data.redirectUrl || '').toString()
      if (!url) throw new Error('Redirect URL vazio')
      window.location.href = url
    } catch (e:any) {
      setError(e?.message || String(e))
    } finally { setBusy(false) }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Conectar Composio</h1>
      <p className="text-sm text-gray-600 mb-4">Autentique suas contas (ex: Gmail) antes do chat.</p>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="space-y-2">
        <button onClick={connectGmail} disabled={busy} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
          {busy ? 'Redirecionando…' : 'Conectar Gmail'}
        </button>
      </div>
      <div className="mt-6 text-sm text-gray-500">
        Após conectar, você será redirecionado de volta e poderá ir ao chat.
      </div>
    </div>
  )
}


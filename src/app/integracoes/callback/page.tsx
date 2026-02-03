"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function IntegracoesCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toolkit, setToolkit] = useState<string>("")
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const u = new URL(window.location.href)
    const tk = (u.searchParams.get('toolkit') || '').toLowerCase()
    setToolkit(tk)
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/integracoes/status?toolkit=${encodeURIComponent(tk)}`, { cache: 'no-store' })
        const data = await res.json().catch(()=> ({}))
        if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Falha ao consultar status')
        if (!cancelled) setConnected(Boolean(data?.connected))
      } catch (e:any) {
        if (!cancelled) setError(e?.message || String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Integração</h1>
      {loading && <div className="text-sm text-gray-600">Verificando conexão…</div>}
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {!loading && !error && (
        <div className="space-y-2">
          <div className="text-sm">Toolkit: <b>{toolkit || '-'}</b></div>
          <div className={`text-sm ${connected ? 'text-green-700' : 'text-gray-700'}`}>
            {connected ? 'Integrado com sucesso.' : 'Ainda não conectado.'}
          </div>
          <div className="pt-4 flex gap-2">
            <Link href="/integracoes" className="px-3 py-1.5 rounded border">Voltar</Link>
            <Link href="/chat" className="px-3 py-1.5 rounded bg-black text-white">Ir para o Chat</Link>
          </div>
        </div>
      )}
    </div>
  )
}


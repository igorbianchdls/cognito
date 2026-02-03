"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Conn = { id: string; status: string; auth_config_id?: string; created_at?: string }

export default function ComposioCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Conn[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const res = await fetch('/api/composio/status', { cache: 'no-store' })
        const data = await res.json().catch(()=> ({}))
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'Falha ao consultar status')
        if (!cancelled) setItems((data.items || []) as Conn[])
      } catch (e:any) {
        if (!cancelled) setError(e?.message || String(e))
      } finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Conexão Composio</h1>
      <p className="text-sm text-gray-600 mb-4">Processamos seu retorno de autenticação.</p>
      {loading && <div className="text-sm text-gray-600">Verificando conexões…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="space-y-2">
          <div className="text-sm">Conexões encontradas:</div>
          <ul className="text-sm list-disc pl-5">
            {items.length ? items.map(it => (
              <li key={it.id} className="text-gray-800">
                {it.id} — {it.status}
              </li>
            )) : (
              <li className="text-gray-500">Nenhuma conexão.</li>
            )}
          </ul>
          <div className="pt-4">
            <Link href="/chat" className="px-4 py-2 rounded bg-black text-white inline-block">Ir para o Chat</Link>
          </div>
        </div>
      )}
    </div>
  )
}


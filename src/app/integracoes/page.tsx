"use client";

import { useEffect, useState } from "react";

type ToolkitStatus = {
  slug: string;
  name?: string;
  connected?: boolean;
}

const TOOLKITS: { slug: string; name: string; description: string }[] = [
  { slug: 'gmail', name: 'Gmail', description: 'Enviar e ler emails' },
  { slug: 'google_drive', name: 'Google Drive', description: 'Arquivos e pastas' },
  // Adicione outros conforme necessário: slack, github, etc.
]

export default function IntegracoesPage() {
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Record<string, ToolkitStatus>>({})

  const fetchStatus = async (slug?: string) => {
    try {
      const qs = slug ? `?toolkit=${encodeURIComponent(slug)}` : ''
      const res = await fetch(`/api/integracoes/status${qs}`, { cache: 'no-store' })
      const data = await res.json().catch(()=> ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Falha ao consultar status')
      if (slug && data?.detail) {
        setStatuses(s => ({ ...s, [slug]: { slug, name: data.detail?.name || slug, connected: Boolean(data.connected) } }))
      } else if (!slug && Array.isArray(data?.items)) {
        const map: Record<string, ToolkitStatus> = {}
        for (const it of data.items) {
          const key = (it.slug || '').toLowerCase()
          if (!key) continue
          map[key] = { slug: key, name: it.name, connected: Boolean(it?.connection?.connectedAccount?.id || it?.connection?.isActive) }
        }
        setStatuses(s => ({ ...s, ...map }))
      }
    } catch (e:any) {
      setError(e?.message || String(e))
    }
  }

  useEffect(() => { fetchStatus(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  const handleIntegrate = async (slug: string) => {
    setBusySlug(slug); setError(null)
    try {
      const res = await fetch('/api/integracoes/authorize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toolkit: slug }) })
      const data = await res.json().catch(()=> ({}))
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Falha ao iniciar autorização')
      const url = (data.redirectUrl || '').toString()
      if (!url) throw new Error('Redirect URL vazio')
      window.location.href = url
    } catch (e:any) {
      setError(e?.message || String(e))
    } finally { setBusySlug(null) }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Integrações</h1>
      <p className="text-sm text-gray-600 mb-4">Conecte suas contas para usar no chat e automações.</p>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLKITS.map(t => {
          const st = statuses[t.slug]
          const connected = Boolean(st?.connected)
          return (
            <div key={t.slug} className="border rounded p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.description}</div>
                </div>
                <div className={`text-xs px-2 py-0.5 rounded ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {connected ? 'Integrado' : 'Não conectado'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleIntegrate(t.slug)} disabled={busySlug === t.slug} className="px-3 py-1.5 rounded bg-black text-white text-sm disabled:opacity-50">
                  {busySlug === t.slug ? 'Abrindo…' : connected ? 'Reintegrar' : 'Integrar'}
                </button>
                <button onClick={() => fetchStatus(t.slug)} className="px-3 py-1.5 rounded border text-sm">Checar status</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


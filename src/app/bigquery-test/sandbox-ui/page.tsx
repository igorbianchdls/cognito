'use client'

import { useState } from 'react'

export default function SandboxUIPage() {
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingNode, setLoadingNode] = useState(false)

  const runEcho = async () => {
    setLoading(true)
    setOutput(null)
    setError(null)
    try {
      const res = await fetch('/api/sandbox/echo', { cache: 'no-store' })
      const text = await res.text()
      if (!res.ok) throw new Error(text || `Erro ${res.status}`)
      setOutput(text.trim())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const runNodeVersion = async () => {
    setLoadingNode(true)
    setOutput(null)
    setError(null)
    try {
      const res = await fetch('/api/sandbox/node-version', { cache: 'no-store' })
      const text = await res.text()
      if (!res.ok) throw new Error(text || `Erro ${res.status}`)
      setOutput(text.trim())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingNode(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Vercel Sandbox — Teste</h1>
        <p className="text-gray-600">Página: <code>/bigquery-test/sandbox-ui</code>. Chama <code>/api/sandbox/echo</code>.</p>

        <button
          onClick={runEcho}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Executando…' : 'Executar echo no Sandbox'}
        </button>

        <button
          onClick={runNodeVersion}
          disabled={loadingNode}
          className={`px-4 py-2 rounded-md text-white ${loadingNode ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {loadingNode ? 'Executando…' : 'Executar node -v no Sandbox'}
        </button>

        {output !== null && (
          <pre className="p-3 bg-white rounded border border-gray-200 text-gray-900 whitespace-pre-wrap">{output}</pre>
        )}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">Erro: {error}</div>
        )}
      </div>
    </div>
  )
}

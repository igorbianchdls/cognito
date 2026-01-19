'use client'

import { useState } from 'react'

export default function SdkSmokePage() {
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('What is 2 + 2?')

  const runSmoke = async () => {
    setLoading(true)
    setError(null)
    setOutput(null)
    try {
      const url = `/api/agent-sdk-simple?prompt=${encodeURIComponent(prompt)}`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json().catch(() => ({})) as { text?: string; error?: string }
      console.log('[agent-sdk-simple] response:', data)
      if (!res.ok || data.error) {
        throw new Error(data.error || `Erro ${res.status}`)
      }
      setOutput(data.text ?? '')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Claude Agent SDK — Smoke Test</h1>
        <p className="text-gray-600 mb-6">Subrota: <code>/bigquery-test/sdk-smoke</code>. Chama a rota <code>/api/agent-sdk-simple</code> com query().</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Digite o prompt"
        />

        <button
          onClick={runSmoke}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Executando…' : 'Executar smoke test'}
        </button>

        {output !== null && (
          <div className="mt-6 p-4 bg-white rounded-md shadow border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Resposta:</div>
            <pre className="text-gray-900 whitespace-pre-wrap">{output}</pre>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            Erro: {error}
          </div>
        )}
      </div>
    </div>
  )
}

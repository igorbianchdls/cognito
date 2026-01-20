'use client'

import { useState } from 'react'

export default function SandboxUIPage() {
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingNode, setLoadingNode] = useState(false)
  const [code, setCode] = useState("console.log('2+2 =', 2+2)")
  const [runningCode, setRunningCode] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [agentPrompt, setAgentPrompt] = useState('What is 2 + 2?')
  const [runningPrompt, setRunningPrompt] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ role: 'user'|'assistant'; content: string }[]>([])
  const [chatInput, setChatInput] = useState('Olá!')

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

  const runCode = async () => {
    setRunningCode(true)
    setOutput(null)
    setError(null)
    try {
      const res = await fetch('/api/sandbox/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; stdout?: string; stderr?: string; error?: string }
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `Erro ${res.status}`)
      }
      const out = [data.stdout || '', data.stderr ? `\n[stderr]\n${data.stderr}` : ''].join('').trim()
      setOutput(out || '(sem saída)')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunningCode(false)
    }
  }

  const runAgentVerify = async () => {
    setVerifying(true)
    setOutput(null)
    setError(null)
    try {
      const res = await fetch('/api/sandbox/agent-verify', { cache: 'no-store' })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; verifyOutput?: string; agentVerifyOutput?: string; cliVersion?: string; error?: string }
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `Erro ${res.status}`)
      }
      const parts = [] as string[]
      if (data.cliVersion) parts.push(`Claude Code CLI: ${data.cliVersion}`)
      if (data.verifyOutput) parts.push(data.verifyOutput)
      if (data.agentVerifyOutput) parts.push(data.agentVerifyOutput)
      setOutput(parts.join('\n') || 'Verificação concluída (sem saída)')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setVerifying(false)
    }
  }

  const runAgentPrompt = async () => {
    setRunningPrompt(true)
    setOutput(null)
    setError(null)
    try {
      const url = `/api/sandbox/agent-prompt?prompt=${encodeURIComponent(agentPrompt)}`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; text?: string; error?: string; step?: string; exitCode?: number; stdout?: string; stderr?: string }
      if (!res.ok || data.ok === false) {
        const details = [
          data.error ? `Erro: ${data.error}` : null,
          data.step ? `Etapa: ${data.step}` : null,
          typeof data.exitCode === 'number' ? `ExitCode: ${data.exitCode}` : null,
          data.stderr ? `stderr:\n${data.stderr}` : (data.stdout ? `stdout:\n${data.stdout}` : null),
        ].filter(Boolean).join('\n')
        throw new Error(details || `Erro ${res.status}`)
      }
      setOutput(data.text || '(sem saída)')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunningPrompt(false)
    }
  }

  const sendChat = async () => {
    setRunningPrompt(true)
    setError(null)
    setOutput(null)
    try {
      const nextHistory = [...chatHistory, { role: 'user' as const, content: chatInput }]
      setChatHistory(nextHistory)
      setChatInput('')
      const res = await fetch('/api/sandbox/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: nextHistory })
      })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; reply?: string; error?: string; step?: string; exitCode?: number; stderr?: string; stdout?: string }
      if (!res.ok || data.ok === false) {
        const details = [
          data.error ? `Erro: ${data.error}` : null,
          data.step ? `Etapa: ${data.step}` : null,
          typeof data.exitCode === 'number' ? `ExitCode: ${data.exitCode}` : null,
          data.stderr ? `stderr:\n${data.stderr}` : (data.stdout ? `stdout:\n${data.stdout}` : null),
        ].filter(Boolean).join('\n')
        throw new Error(details || `Erro ${res.status}`)
      }
      const reply = data.reply || ''
      setChatHistory(h => [...h, { role: 'assistant', content: reply }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunningPrompt(false)
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

        <div className="pt-4 border-t border-gray-200" />
        <h2 className="text-lg font-medium text-gray-900">Executar código (node -e)</h2>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-40 p-3 rounded border border-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setCode("console.log('Hello from Sandbox')")}
            className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
          >Hello preset</button>
          <button
            onClick={() => setCode("for (let i=0;i<3;i++) console.log('i=', i)")}
            className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
          >Loop preset</button>
          <button
            onClick={() => setCode("console.log('now=', new Date().toISOString())")}
            className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
          >Time preset</button>
        </div>
        <button
          onClick={runCode}
          disabled={runningCode}
          className={`px-4 py-2 rounded-md text-white ${runningCode ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          {runningCode ? 'Executando…' : 'Executar código no Sandbox'}
        </button>

        <div className="pt-4 border-t border-gray-200" />
        <h2 className="text-lg font-medium text-gray-900">Verificar Anthropic SDK no Sandbox</h2>
        <p className="text-sm text-gray-600">Instala @anthropic-ai/claude-code e @anthropic-ai/sdk dentro do Sandbox e roda um script de verificação.</p>
        <button
          onClick={runAgentVerify}
          disabled={verifying}
          className={`px-4 py-2 rounded-md text-white ${verifying ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {verifying ? 'Verificando…' : 'Verificar SDK no Sandbox'}
        </button>

        <div className="pt-4 border-t border-gray-200" />
        <h2 className="text-lg font-medium text-gray-900">Executar Prompt com Agent SDK</h2>
        <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
        <input
          value={agentPrompt}
          onChange={(e) => setAgentPrompt(e.target.value)}
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={runAgentPrompt}
          disabled={runningPrompt}
          className={`px-4 py-2 rounded-md text-white ${runningPrompt ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}
        >
          {runningPrompt ? 'Executando…' : 'Executar Agent SDK Prompt'}
        </button>

        <div className="pt-4 border-t border-gray-200" />
        <h2 className="text-lg font-medium text-gray-900">Chat com Agent SDK (Sandbox)</h2>
        <div className="space-y-2 p-3 bg-white border border-gray-200 rounded">
          <div className="space-y-1 max-h-64 overflow-auto">
            {chatHistory.length === 0 && (
              <div className="text-sm text-gray-500">Sem mensagens. Envie a primeira abaixo.</div>
            )}
            {chatHistory.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-gray-900' : 'text-blue-700'}>
                <span className="font-medium">{m.role === 'user' ? 'Você' : 'Assistente'}: </span>
                <span>{m.content}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua mensagem"
            />
            <button
              onClick={sendChat}
              disabled={runningPrompt || !chatInput.trim()}
              className={`px-4 py-2 rounded-md text-white ${runningPrompt ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}
            >
              {runningPrompt ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>

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

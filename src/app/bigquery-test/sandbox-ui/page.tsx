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
  const [chatId, setChatId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
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
      const data = await res.json().catch(() => ({})) as { ok?: boolean; verifyOutput?: string; agentVerifyOutput?: string; cliVersion?: string; sdkVersion?: string; agentVersion?: string; promptOk?: boolean; promptText?: string; promptExitCode?: number; promptStderr?: string; timeline?: Array<{name:string;ms:number;ok:boolean;exitCode?:number;note?:string}>; error?: string }
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `Erro ${res.status}`)
      }
      const parts = [] as string[]
      if (data.cliVersion) parts.push(`Claude Code CLI: ${data.cliVersion}`)
      if (data.sdkVersion) parts.push(`@anthropic-ai/sdk: ${data.sdkVersion}`)
      if (data.agentVersion) parts.push(`@anthropic-ai/claude-agent-sdk: ${data.agentVersion}`)
      if (data.verifyOutput) parts.push(data.verifyOutput)
      if (data.agentVerifyOutput) parts.push(data.agentVerifyOutput)
      if (typeof data.promptOk !== 'undefined') {
        parts.push(`Agent prompt: ${data.promptOk ? 'ok' : 'failed'}`)
        if (data.promptText) parts.push(`Result: ${data.promptText}`)
        if (!data.promptOk && (data.promptStderr || typeof data.promptExitCode === 'number')) {
          parts.push(`ExitCode: ${data.promptExitCode ?? ''}`)
          if (data.promptStderr) parts.push(`stderr: ${data.promptStderr}`)
        }
      }
      if (Array.isArray(data.timeline) && data.timeline.length) {
        parts.push('Timeline:')
        for (const s of data.timeline) {
          parts.push(`- ${s.name}: ${s.ok ? 'ok' : 'fail'} in ${s.ms}ms${typeof s.exitCode==='number' ? ` (exit ${s.exitCode})` : ''}${s.note ? ` | ${s.note}` : ''}`)
        }
      }
      setOutput(parts.join('\n') || 'Verificação concluída (sem saída)')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setVerifying(false)
    }
  }

  const runPromptLocal = async () => {
    setVerifying(true)
    setOutput(null)
    setError(null)
    try {
      const res = await fetch('/api/sandbox/agent-prompt-local', { cache: 'no-store' })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; text?: string; error?: string; step?: string; exitCode?: number; stdout?: string; stderr?: string }
      if (!res.ok || data.ok === false) {
        const details = [data.error, data.step && `Etapa: ${data.step}`, typeof data.exitCode==='number' && `ExitCode: ${data.exitCode}`, data.stderr && `stderr:\n${data.stderr}`, data.stdout && `stdout:\n${data.stdout}`].filter(Boolean).join('\n')
        throw new Error(details || `Erro ${res.status}`)
      }
      setOutput(`Local CLI result: ${data.text || '(sem saída)'}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setVerifying(false)
    }
  }

  const runPromptGlobal = async () => {
    setVerifying(true)
    setOutput(null)
    setError(null)
    try {
      const res = await fetch('/api/sandbox/agent-prompt-global', { cache: 'no-store' })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; text?: string; error?: string; step?: string; exitCode?: number; stdout?: string; stderr?: string }
      if (!res.ok || data.ok === false) {
        const details = [data.error, data.step && `Etapa: ${data.step}`, typeof data.exitCode==='number' && `ExitCode: ${data.exitCode}`, data.stderr && `stderr:\n${data.stderr}`, data.stdout && `stdout:\n${data.stdout}`].filter(Boolean).join('\n')
        throw new Error(details || `Erro ${res.status}`)
      }
      setOutput(`Global CLI result: ${data.text || '(sem saída)'}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setVerifying(false)
    }
  }

  const startChat = async () => {
    setVerifying(true)
    setError(null)
    setOutput(null)
    try {
      const res = await fetch('/api/sandbox/chat/start', { method: 'POST' })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; chatId?: string; error?: string }
      if (!res.ok || data.ok === false || !data.chatId) {
        throw new Error(data.error || `Erro ${res.status}`)
      }
      setChatId(data.chatId)
      setChatHistory([])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setVerifying(false)
    }
  }

  const sendChat = async () => {
    if (!chatId || !chatInput.trim()) return
    setSending(true)
    setError(null)
    try {
      const next = [...chatHistory, { role: 'user' as const, content: chatInput }]
      setChatHistory(next)
      setChatInput('')
      const res = await fetch('/api/sandbox/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, history: next })
      })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; reply?: string; error?: string }
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `Erro ${res.status}`)
      }
      setChatHistory(h => [...h, { role: 'assistant', content: data.reply || '' }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  const stopChat = async () => {
    if (!chatId) return
    setVerifying(true)
    setError(null)
    try {
      await fetch('/api/sandbox/chat/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      })
      setChatId(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setVerifying(false)
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
        <div className="flex gap-2">
          <button onClick={runPromptLocal} disabled={verifying} className={`px-3 py-2 rounded-md text-white ${verifying ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}>Testar Agent SDK (CLI local)</button>
          <button onClick={runPromptGlobal} disabled={verifying} className={`px-3 py-2 rounded-md text-white ${verifying ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700'}`}>Testar Agent SDK (CLI global)</button>
        </div>

        <div className="pt-4 border-t border-gray-200" />
        <h2 className="text-lg font-medium text-gray-900">Chat (Sandbox persistente)</h2>
        <div className="flex gap-2 mb-2">
          <button onClick={startChat} disabled={verifying || !!chatId} className={`px-3 py-2 rounded-md text-white ${verifying || chatId ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>Iniciar chat</button>
          <button onClick={stopChat} disabled={verifying || !chatId} className={`px-3 py-2 rounded-md text-white ${verifying || !chatId ? 'bg-gray-400' : 'bg-rose-600 hover:bg-rose-700'}`}>Encerrar chat</button>
          {chatId && <span className="text-sm text-gray-500">chatId: {chatId.slice(0,8)}…</span>}
        </div>
        <div className="space-y-2 p-3 bg-white border border-gray-200 rounded">
          <div className="space-y-1 max-h-64 overflow-auto">
            {chatHistory.length === 0 && (
              <div className="text-sm text-gray-500">Sem mensagens. Inicie o chat e envie a primeira.</div>
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
              disabled={!chatId}
            />
            <button onClick={sendChat} disabled={!chatId || sending || !chatInput.trim()} className={`px-4 py-2 rounded-md text-white ${(!chatId || sending) ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}>{sending ? 'Enviando…' : 'Enviar'}</button>
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

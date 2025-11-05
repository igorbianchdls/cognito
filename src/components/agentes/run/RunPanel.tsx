"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Graph } from '@/types/agentes/builder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type HistoryItem = { id: string; prompt: string; reply: string; ts: string }

export default function RunPanel({ graph, triggerRun, className }: { graph: Graph; triggerRun?: number; className?: string }) {
  const [prompt, setPrompt] = useState<string>('olá agente')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const agentCfg = useMemo(() => {
    const ag = graph.blocks.find(b => b.kind === 'agente')
    const cfg = (ag?.config || {}) as Record<string, unknown>
    return { model: String(cfg.model || ''), temperature: typeof cfg.temperature === 'number' ? (cfg.temperature as number) : 0.2 }
  }, [graph])

  const run = async () => {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch('/api/agentes/run-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph, message: prompt, temperature: agentCfg.temperature }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha na execução')
      const item: HistoryItem = { id: String(Date.now()), prompt, reply: String(data.reply ?? ''), ts: new Date().toISOString() }
      setHistory(prev => [item, ...prev])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setRunning(false)
    }
  }

  // Triggered run from parent
  const lastTrigger = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (triggerRun && triggerRun !== lastTrigger.current) {
      lastTrigger.current = triggerRun
      void run()
    }
  }, [triggerRun])

  const last = history[0]

  const copy = async () => {
    try { await navigator.clipboard.writeText(last?.reply || '') } catch {}
  }

  const clear = () => setHistory([])

  return (
    <div className={className}>
      <div className="p-3 border-b flex items-center gap-3 text-xs text-gray-600">
        <div>Modelo: <span className="font-medium text-gray-800">{agentCfg.model || '—'}</span></div>
        <div>Temperatura: <span className="font-medium text-gray-800">{agentCfg.temperature}</span></div>
      </div>
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <label className="text-xs text-gray-600">Mensagem</label>
          <Textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={run} disabled={running}>{running ? 'Executando…' : 'Executar'}</Button>
          <Button variant="outline" onClick={copy} disabled={!last}>Copiar resposta</Button>
          <Button variant="outline" onClick={clear} disabled={history.length === 0}>Limpar</Button>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
      <div className="px-4 pb-4">
        <div className="text-xs text-gray-500 mb-2">Histórico</div>
        <div className="space-y-3 max-h-[50vh] overflow-auto custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-sm text-gray-500">Sem execuções ainda.</div>
          ) : history.map(item => (
            <div key={item.id} className="border rounded-md">
              <div className="px-3 py-2 bg-gray-50 text-[11px] text-gray-600">{new Date(item.ts).toLocaleString()}</div>
              <div className="p-3 text-sm">
                <div className="text-gray-700 whitespace-pre-wrap"><span className="font-medium">Prompt:</span> {item.prompt}</div>
                <div className="mt-2 whitespace-pre-wrap"><span className="font-medium">Resposta:</span> {item.reply}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


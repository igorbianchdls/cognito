"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function BigQueryTestWorkflowPage() {
  const [result, setResult] = useState<null | { ok: boolean; eventIds?: string[]; error?: string }>(null)
  const [loading, setLoading] = useState(false)

  const trigger = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bigquery-test/workflow/trigger', { cache: 'no-store' })
      const json = await res.json()
      setResult(json)
    } catch (e) {
      setResult({ ok: false, error: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">bigquery-test / workflow</h1>
      <p className="text-sm text-gray-600">Dispare um evento artificial para validar o workflow Inngest.</p>
      <div>
        <Button onClick={trigger} disabled={loading}>{loading ? 'Enviando…' : 'Disparar workflow demo'}</Button>
      </div>
      {result && (
        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-w-full">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}


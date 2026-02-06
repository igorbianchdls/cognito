"use client"

import { useMemo, useState } from "react"

type JsonValue = any

export default function InboxesSeedPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<JsonValue>(null)

  const disabled = useMemo(() => loading, [loading])

  const call = async (path: string, init?: RequestInit) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(path, init)
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || `Falha: ${res.status}`)
      }
      setResult(json)
    } catch (e: any) {
      setError(e?.message || String(e))
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const createThreeInboxes = async () => {
    await call("/api/email/inboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
  }

  const listInboxes = async () => {
    await call("/api/email/inboxes", { cache: "no-store" })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Seed de Inboxes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Esta página cria 3 inboxes padrão para simulação SMB brasileira.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={createThreeInboxes}
              className="rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60"
            >
              Criar 3 inboxes
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={listInboxes}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 disabled:opacity-60"
            >
              Listar inboxes
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Padrão: Fiscal ACME, Compras ACME e Vendas ACME.
          </p>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 text-xs font-medium text-gray-600">Resultado</div>
          {result ? (
            <pre className="max-h-[460px] overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
              <code>{JSON.stringify(result, null, 2)}</code>
            </pre>
          ) : (
            <div className="text-xs text-gray-500">Sem resultado ainda.</div>
          )}
        </div>
      </div>
    </div>
  )
}

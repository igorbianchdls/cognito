"use client"

import { useEffect, useMemo, useState } from "react"

type Workspace = {
  id: string
  name: string
}

type DriveResponse = {
  success?: boolean
  message?: string
  workspaces?: Workspace[]
  activeWorkspaceId?: string | null
}

type SeedResponse = {
  success?: boolean
  message?: string
  folderId?: string
  requested?: number
  createdCount?: number
  errorsCount?: number
  created?: Array<{
    id: string
    name: string
    mime: string
    sizeBytes: number
    storagePath: string
    bucketId: string
  }>
  errors?: Array<{
    name: string
    error: string
  }>
}

export default function DriveFinanceSeedPage() {
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [workspaceId, setWorkspaceId] = useState("")
  const [result, setResult] = useState<SeedResponse | null>(null)

  const canRun = useMemo(() => !!workspaceId && !running, [workspaceId, running])

  const loadWorkspaces = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/drive", { cache: "no-store" })
      const json = (await res.json().catch(() => ({}))) as DriveResponse
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Falha ao carregar workspaces (${res.status})`)
      }
      const ws = Array.isArray(json?.workspaces) ? json.workspaces : []
      setWorkspaces(ws)
      setWorkspaceId(String(json?.activeWorkspaceId || ws[0]?.id || ""))
    } catch (e: any) {
      setError(e?.message || String(e))
      setWorkspaces([])
      setWorkspaceId("")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadWorkspaces()
  }, [])

  const runSeed = async () => {
    if (!workspaceId || running) return
    setRunning(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/drive/seed-finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId }),
      })
      const json = (await res.json().catch(() => ({}))) as SeedResponse
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || `Falha ao gerar PDFs (${res.status})`)
      }
      setResult(json)
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Drive Seed Financeiro (PDF)</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gera arquivos PDF de faturas, recibos e documentos financeiros no Supabase Storage + tabela `drive.files`.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Workspace</label>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                disabled={loading || running || workspaces.length === 0}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
              >
                {workspaces.length === 0 ? (
                  <option value="">Sem workspaces</option>
                ) : (
                  workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={() => void loadWorkspaces()}
              disabled={loading || running}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 px-3 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Carregando..." : "Atualizar"}
            </button>

            <button
              type="button"
              onClick={() => void runSeed()}
              disabled={!canRun}
              className="inline-flex h-9 items-center justify-center rounded-md bg-black px-3 text-sm text-white disabled:opacity-60"
            >
              {running ? "Gerando PDFs..." : "Gerar PDFs financeiros"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 text-xs font-medium text-gray-600">Resultado</div>
          {result ? (
            <div className="space-y-3 text-sm text-gray-800">
              <div className="grid gap-1 text-xs text-gray-600">
                <div>Solicitados: {result.requested ?? 0}</div>
                <div>Criados: {result.createdCount ?? 0}</div>
                <div>Erros: {result.errorsCount ?? 0}</div>
                <div>Folder ID: {result.folderId || "—"}</div>
              </div>

              {Array.isArray(result.created) && result.created.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Arquivo</th>
                        <th className="px-3 py-2 font-medium">MIME</th>
                        <th className="px-3 py-2 font-medium text-right">Bytes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.created.map((row) => (
                        <tr key={row.id} className="border-t border-gray-100">
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.mime}</td>
                          <td className="px-3 py-2 text-right">{Number(row.sizeBytes || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {Array.isArray(result.errors) && result.errors.length > 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {result.errors.map((item, idx) => (
                    <div key={`${item.name}-${idx}`}>{item.name}: {item.error}</div>
                  ))}
                </div>
              ) : null}

              <pre className="max-h-72 overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
                <code>{JSON.stringify(result, null, 2)}</code>
              </pre>
            </div>
          ) : (
            <div className="text-xs text-gray-500">Sem execução ainda.</div>
          )}
        </div>
      </div>
    </div>
  )
}


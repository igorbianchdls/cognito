'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import { parseDashboardJsxToTree, type DashboardTreeNode } from '@/products/artifacts/dashboard/language/parseDashboardJsx'
import { DashboardRenderer } from '@/products/artifacts/dashboard/runtime/renderer/DashboardRenderer'

type DashboardArtifactPageProps = {
  artifactId: string
  source: string
  title?: string | null
  tenantAssigned?: boolean
  embedMode?: boolean
}

export function DashboardArtifactPage({
  artifactId,
  source,
  title,
  tenantAssigned = true,
  embedMode,
}: DashboardArtifactPageProps) {
  const router = useRouter()
  const [tree, setTree] = useState<DashboardTreeNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAssigningTenant, setIsAssigningTenant] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  async function assignTenant() {
    setIsAssigningTenant(true)
    setAssignError(null)
    try {
      const response = await fetch(`/api/artifacts/dashboards/${artifactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign-tenant' }),
      })
      const payload = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Falha ao vincular dashboard')
      router.refresh()
    } catch (assignTenantError) {
      setAssignError(assignTenantError instanceof Error ? assignTenantError.message : 'Falha ao vincular dashboard')
    } finally {
      setIsAssigningTenant(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function parseSource() {
      try {
        setError(null)
        const parsedTree = await parseDashboardJsxToTree('dashboard-template.tsx', [
          { path: 'dashboard-template.tsx', content: source },
        ])
        if (!cancelled) setTree(parsedTree)
      } catch (parseError) {
        if (!cancelled) {
          setTree(null)
          setError(parseError instanceof Error ? parseError.message : 'Falha ao renderizar dashboard')
        }
      }
    }

    void parseSource()
    return () => {
      cancelled = true
    }
  }, [source])

  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <main className={embedMode ? 'min-h-screen bg-white' : 'min-h-screen bg-[#f7f7f6]'}>
        {!embedMode ? (
          <header className="flex items-center justify-between gap-4 border-b border-black/10 bg-white px-5 py-3">
            <div>
              <h1 className="text-sm font-medium text-neutral-900">{title || 'Dashboard'}</h1>
              {!tenantAssigned ? (
                <p className="mt-1 text-xs text-amber-700">
                  Dashboard legado: vincule ao tenant para habilitar consultas e edição.
                </p>
              ) : null}
              {assignError ? <p className="mt-1 text-xs text-red-700">{assignError}</p> : null}
            </div>
            {!tenantAssigned ? (
              <button
                type="button"
                onClick={() => void assignTenant()}
                disabled={isAssigningTenant}
                className="rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
              >
                {isAssigningTenant ? 'Vinculando...' : 'Vincular ao tenant'}
              </button>
            ) : null}
          </header>
        ) : null}
        {error ? (
          <div className="p-4 text-sm text-red-700">{error}</div>
        ) : tree ? (
          <DashboardRenderer tree={tree} artifactId={artifactId} />
        ) : (
          <div className="p-4 text-sm text-neutral-500">Carregando dashboard...</div>
        )}
      </main>
    </ArtifactWorkspacePage>
  )
}

'use client'

import { useEffect, useState } from 'react'

import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import { parseDashboardJsxToTree, type DashboardTreeNode } from '@/products/artifacts/dashboard/language/parseDashboardJsx'
import { DashboardRenderer } from '@/products/artifacts/dashboard/runtime/renderer/DashboardRenderer'

type DashboardArtifactPageProps = {
  artifactId: string
  source: string
  title?: string | null
  embedMode?: boolean
}

export function DashboardArtifactPage({
  artifactId,
  source,
  title,
  embedMode,
}: DashboardArtifactPageProps) {
  const [tree, setTree] = useState<DashboardTreeNode | null>(null)
  const [error, setError] = useState<string | null>(null)

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
          <header className="border-b border-black/10 bg-white px-5 py-3">
            <h1 className="text-sm font-medium text-neutral-900">{title || 'Dashboard'}</h1>
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

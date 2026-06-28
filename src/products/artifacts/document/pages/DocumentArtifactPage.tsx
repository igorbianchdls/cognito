'use client'

import { useEffect, useState } from 'react'

import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import type { ArtifactKind, ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'
import { parseDocumentJsxToTree } from '@/products/artifacts/document/language/parseDocumentJsx'
import { DocumentRenderer } from '@/products/artifacts/document/runtime/DocumentRenderer'

type DocumentKind = Extract<ArtifactKind, 'report' | 'slide'>

type DocumentArtifactPageProps = {
  kind: DocumentKind
  source: string
  title?: string | null
  embedMode?: boolean
}

export function DocumentArtifactPage({
  kind,
  source,
  title,
  embedMode,
}: DocumentArtifactPageProps) {
  const [tree, setTree] = useState<ArtifactTreeNode | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function parseSource() {
      try {
        setError(null)
        const parsedTree = await parseDocumentJsxToTree(kind, kind === 'report' ? 'report.tsx' : 'deck.tsx', [
          { path: kind === 'report' ? 'report.tsx' : 'deck.tsx', content: source },
        ])
        if (!cancelled) setTree(parsedTree)
      } catch (parseError) {
        if (!cancelled) {
          setTree(null)
          setError(parseError instanceof Error ? parseError.message : `Falha ao renderizar ${kind}`)
        }
      }
    }

    void parseSource()
    return () => {
      cancelled = true
    }
  }, [kind, source])

  const fallbackTitle = kind === 'report' ? 'Report' : 'Slides'

  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, document: {} }}>
      <main className={embedMode ? 'min-h-screen bg-white' : 'min-h-screen bg-[#f7f7f6]'}>
        {!embedMode ? (
          <header className="border-b border-black/10 bg-white px-5 py-3">
            <h1 className="text-sm font-medium text-neutral-900">{title || fallbackTitle}</h1>
          </header>
        ) : null}
        {error ? (
          <div className="p-4 text-sm text-red-700">{error}</div>
        ) : tree ? (
          <DocumentRenderer tree={tree} kind={kind} />
        ) : (
          <div className="p-4 text-sm text-neutral-500">Carregando {fallbackTitle.toLowerCase()}...</div>
        )}
      </main>
    </ArtifactWorkspacePage>
  )
}

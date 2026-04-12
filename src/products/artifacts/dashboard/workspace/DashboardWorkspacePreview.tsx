'use client'

import { useEffect, useState } from 'react'

import { ArtifactPreviewStage } from '@/products/artifacts/core/workspace/components/ArtifactPreviewStage'
import type { ArtifactCodeFile } from '@/products/artifacts/core/workspace/types'
import { parseDashboardJsxToTree } from '@/products/artifacts/dashboard/parser/dashboardJsxParser'
import { DashboardRenderer } from '@/products/artifacts/dashboard/renderer/dashboardRenderer'
import { applyPanelLayoutChanges } from '@/products/artifacts/dashboard/renderer/components/dashboardLayoutTree'
import type { DashboardAppearanceOverrides } from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'
import type { Layout } from 'react-grid-layout'

export function DashboardWorkspacePreview({
  sourcePath,
  files,
  zoom,
  appearanceOverrides,
  onTreeChange,
}: {
  sourcePath: string
  files: ArtifactCodeFile[]
  zoom: number
  appearanceOverrides?: DashboardAppearanceOverrides
  onTreeChange?: (tree: any) => void
}) {
  const [tree, setTree] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setError(null)
        setTree(null)
        const nextTree = await parseDashboardJsxToTree(sourcePath, files)
        if (!cancelled) {
          setTree(nextTree)
          onTreeChange?.(nextTree)
        }
      } catch (err) {
        if (!cancelled) {
          setTree(null)
          setError((err as Error).message || 'Falha ao compilar preview do dashboard')
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [sourcePath, files, onTreeChange])

  function handlePanelLayoutChange(nextLayout: Layout[]) {
    setTree((currentTree: any) => {
      if (!currentTree || typeof currentTree !== 'object') return currentTree
      const nextTree = applyPanelLayoutChanges(currentTree, nextLayout)
      onTreeChange?.(nextTree)
      return nextTree
    })
  }

  return (
    <ArtifactPreviewStage zoom={zoom} contentClassName="min-w-[1120px] overflow-hidden rounded-none bg-white p-0 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
      {error ? (
        <div className="p-6 text-sm text-red-700">
          {error}
        </div>
      ) : tree ? (
        <DashboardRenderer
          tree={tree}
          editableLayout
          onPanelLayoutChange={handlePanelLayoutChange}
          appearanceOverrides={appearanceOverrides}
        />
      ) : (
        <div className="p-6 text-sm text-gray-500">Compilando preview...</div>
      )}
    </ArtifactPreviewStage>
  )
}

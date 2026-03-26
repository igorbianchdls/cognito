'use client'

import { useEffect, useState } from 'react'

import { DashboardRenderer } from '@/products/dashboard/render/dashboardRegistry'
import { compileDashboardSourceToTree } from '@/products/dashboard/workspace/compileDashboardSource'

export function DashboardWorkspacePreview({ source, zoom }: { source: string; zoom: number }) {
  const [tree, setTree] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setError(null)
        setTree(null)
        const nextTree = await compileDashboardSourceToTree(source)
        if (!cancelled) setTree(nextTree)
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
  }, [source])

  return (
    <div className="mx-auto flex min-h-full items-start justify-center p-0">
      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
        <div className="min-w-[1120px] overflow-hidden rounded-none bg-white p-0 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
          {error ? (
            <div className="p-6 text-sm text-red-700">
              {error}
            </div>
          ) : tree ? (
            <DashboardRenderer tree={tree} />
          ) : (
            <div className="p-6 text-sm text-gray-500">Compilando preview...</div>
          )}
        </div>
      </div>
    </div>
  )
}

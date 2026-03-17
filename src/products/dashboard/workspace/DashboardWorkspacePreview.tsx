'use client'

import { Renderer } from '@/products/bi/json-render/renderer'
import { registry } from '@/products/bi/json-render/registry'

export function DashboardWorkspacePreview({ tree, zoom }: { tree: any; zoom: number }) {
  return (
    <div className="mx-auto flex min-h-full items-start justify-center p-0">
      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
        <div className="min-w-[1120px] overflow-hidden rounded-none bg-white p-0 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
          <Renderer tree={tree} registry={registry} />
        </div>
      </div>
    </div>
  )
}

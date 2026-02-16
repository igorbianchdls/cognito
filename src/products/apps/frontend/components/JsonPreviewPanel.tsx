'use client'

import { Renderer } from '@/products/apps/bi/json-render/renderer'
import { registry } from '@/products/apps/bi/json-render/registry'
import type { JsonTree } from '@/products/apps/shared/types'

type JsonPreviewPanelProps = {
  tree: JsonTree
  onAction?: (action: any) => void
  actionHint?: string
}

export default function JsonPreviewPanel({ tree, onAction, actionHint }: JsonPreviewPanelProps) {
  return (
    <div className="md:col-span-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Preview</h2>
        {actionHint && <div className="text-xs text-gray-500">{actionHint}</div>}
      </div>
      <div className="rounded-md border border-gray-200 bg-white p-0 min-h-[420px]">
        {tree ? (
          <Renderer tree={tree} registry={registry} onAction={onAction} />
        ) : (
          <div className="text-sm text-gray-500">JSON inválido</div>
        )}
      </div>
    </div>
  )
}

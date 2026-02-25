'use client'

import type { ReactNode } from 'react'
import { Renderer } from '@/products/bi/json-render/renderer'
import { registry } from '@/products/bi/json-render/registry'
import type { JsonTree } from '@/products/apps/shared/types'
import EditableNodeWrapper from '@/products/bi/features/dashboard-editor/components/EditableNodeWrapper'
import type { JsonNodePath, NodeMenuAction } from '@/products/bi/features/dashboard-editor/types/editor-types'

type JsonPreviewPanelProps = {
  tree: JsonTree
  onAction?: (action: any) => void
  actionHint?: string
  toolbar?: ReactNode
  propertiesPanel?: ReactNode
  visualEditor?: {
    enabled?: boolean
    selectedPath?: JsonNodePath | null
    onNodeAction: (path: JsonNodePath, action: NodeMenuAction) => void
  }
}

function samePath(a?: JsonNodePath | null, b?: JsonNodePath | null) {
  if (!a || !b) return false
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

export default function JsonPreviewPanel({ tree, onAction, actionHint, toolbar, propertiesPanel, visualEditor }: JsonPreviewPanelProps) {
  const previewContent = (
    <div className="rounded-md border border-gray-200 bg-white p-0 min-h-[420px]">
      {tree ? (
        <Renderer
          tree={tree}
          registry={registry}
          onAction={onAction}
          nodeDecorator={visualEditor?.enabled ? ({ rendered, path, type }) => (
            <EditableNodeWrapper
              path={path}
              type={type}
              selected={samePath(visualEditor.selectedPath, path)}
              onAction={visualEditor.onNodeAction}
            >
              {rendered}
            </EditableNodeWrapper>
          ) : undefined}
        />
      ) : (
        <div className="text-sm text-gray-500">JSON inválido</div>
      )}
    </div>
  )

  return (
    <div className="md:col-span-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900">Preview</h2>
        <div className="flex items-center gap-3">
          {actionHint && <div className="text-xs text-gray-500">{actionHint}</div>}
          {toolbar}
        </div>
      </div>
      {propertiesPanel ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          {previewContent}
          <div>{propertiesPanel}</div>
        </div>
      ) : previewContent}
    </div>
  )
}

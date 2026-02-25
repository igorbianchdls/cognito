'use client'

import type { ReactNode } from 'react'
import { Renderer } from '@/products/bi/json-render/renderer'
import { registry } from '@/products/bi/json-render/registry'
import type { JsonTree } from '@/products/bi/shared/types'
import EditableNodeWrapper from '@/products/bi/features/dashboard-editor/components/EditableNodeWrapper'
import { getNodeAtPath } from '@/products/bi/features/dashboard-editor/lib/jsonTreeOps'
import type {
  NodeDropPlacement,
  JsonNodePath,
  NodeMenuAction,
  NodeMoveDirection,
} from '@/products/bi/features/dashboard-editor/types/editor-types'

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
    onNodeMove: (path: JsonNodePath, direction: NodeMoveDirection) => void
    onNodeDropReorder: (
      sourcePath: JsonNodePath,
      targetPath: JsonNodePath,
      placement: NodeDropPlacement,
    ) => void
  }
}

function samePath(a?: JsonNodePath | null, b?: JsonNodePath | null) {
  if (!a || !b) return false
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

function getSiblingAxis(tree: JsonTree, path: JsonNodePath): 'horizontal' | 'vertical' {
  if (!path.length) return 'vertical'
  if (Array.isArray(tree)) return 'vertical'

  const parentPath = path.slice(0, -1)
  const parentNode = parentPath.length ? getNodeAtPath(tree, parentPath) : (tree as Record<string, any>)
  const direction = parentNode?.type === 'Div' ? String(parentNode?.props?.direction ?? 'column') : 'column'
  return direction === 'row' ? 'horizontal' : 'vertical'
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
              siblingAxis={getSiblingAxis(tree, path)}
              onAction={visualEditor.onNodeAction}
              onMove={visualEditor.onNodeMove}
              onDropReorder={visualEditor.onNodeDropReorder}
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
      {previewContent}
      {propertiesPanel && (
        <div className="fixed inset-0 z-[120]">
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="w-full max-w-[680px] max-h-[85vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {propertiesPanel}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

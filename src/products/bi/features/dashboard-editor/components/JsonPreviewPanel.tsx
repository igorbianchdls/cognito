'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
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

type DragNodeData = {
  kind: 'dashboard-node'
  path: JsonNodePath
}

type DropNodeData = {
  kind: 'dashboard-node-target'
  path: JsonNodePath
  siblingAxis: 'horizontal' | 'vertical'
}

type DragIndicatorState = {
  activePath: JsonNodePath
  targetPath: JsonNodePath
  placement: NodeDropPlacement
} | null

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

function isJsonNodePath(value: unknown): value is JsonNodePath {
  return Array.isArray(value) && value.every((v) => Number.isInteger(v))
}

function readDragNodeData(value: unknown): DragNodeData | null {
  const data = value as Partial<DragNodeData> | null | undefined
  if (!data || data.kind !== 'dashboard-node' || !isJsonNodePath(data.path)) return null
  return { kind: 'dashboard-node', path: data.path }
}

function readDropNodeData(value: unknown): DropNodeData | null {
  const data = value as Partial<DropNodeData> | null | undefined
  if (!data || data.kind !== 'dashboard-node-target' || !isJsonNodePath(data.path)) return null
  const siblingAxis = data.siblingAxis === 'horizontal' ? 'horizontal' : 'vertical'
  return { kind: 'dashboard-node-target', path: data.path, siblingAxis }
}

function sameParentPath(a: JsonNodePath, b: JsonNodePath) {
  if (a.length !== b.length) return false
  return a.slice(0, -1).every((v, i) => v === b[i])
}

function resolveDropPlacementFromRects(
  translated: { left: number; top: number; width: number; height: number } | null | undefined,
  overRect: { left: number; top: number; width: number; height: number } | null | undefined,
  axis: DropNodeData['siblingAxis'],
): NodeDropPlacement | null {
  if (!translated || !overRect) return null

  if (axis === 'horizontal') {
    const activeCenterX = translated.left + translated.width / 2
    const overCenterX = overRect.left + overRect.width / 2
    return activeCenterX < overCenterX ? 'before' : 'after'
  }

  const activeCenterY = translated.top + translated.height / 2
  const overCenterY = overRect.top + overRect.height / 2
  return activeCenterY < overCenterY ? 'before' : 'after'
}

function resolveDropPlacement(event: DragOverEvent, overData: DropNodeData): NodeDropPlacement | null {
  return resolveDropPlacementFromRects(
    event.active.rect.current.translated,
    event.over?.rect,
    overData.siblingAxis,
  )
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
  const [dragIndicator, setDragIndicator] = useState<DragIndicatorState>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const resetDragIndicator = useCallback(() => {
    setDragIndicator(null)
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragData = readDragNodeData(event.active.data.current)
    if (!dragData) return
    setDragIndicator((prev) => (prev && samePath(prev.activePath, dragData.path) ? prev : null))
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const dragData = readDragNodeData(event.active.data.current)
    const dropData = readDropNodeData(event.over?.data.current)
    if (!dragData || !dropData) {
      setDragIndicator(null)
      return
    }
    if (!sameParentPath(dragData.path, dropData.path)) {
      setDragIndicator(null)
      return
    }
    if (samePath(dragData.path, dropData.path)) {
      setDragIndicator(null)
      return
    }

    const placement = resolveDropPlacement(event, dropData)
    if (!placement) return

    setDragIndicator((prev) => {
      if (
        prev &&
        samePath(prev.activePath, dragData.path) &&
        samePath(prev.targetPath, dropData.path) &&
        prev.placement === placement
      ) {
        return prev
      }
      return {
        activePath: dragData.path,
        targetPath: dropData.path,
        placement,
      }
    })
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const dragData = readDragNodeData(event.active.data.current)
    const overData = readDropNodeData(event.over?.data.current)
    const fallbackPlacement =
      dragData && overData && sameParentPath(dragData.path, overData.path)
        ? resolveDropPlacementFromRects(
            event.active.rect.current.translated,
            event.over?.rect,
            overData.siblingAxis,
          )
        : null
    const nextIndicator = dragIndicator ?? (
      dragData && overData && fallbackPlacement && !samePath(dragData.path, overData.path)
        ? {
            activePath: dragData.path,
            targetPath: overData.path,
            placement: fallbackPlacement,
          }
        : null
    )
    setDragIndicator(null)

    if (!visualEditor?.enabled || !visualEditor.onNodeDropReorder) return
    if (!dragData || !nextIndicator) return
    if (!samePath(dragData.path, nextIndicator.activePath)) return

    visualEditor.onNodeDropReorder(
      nextIndicator.activePath,
      nextIndicator.targetPath,
      nextIndicator.placement,
    )
  }, [dragIndicator, visualEditor])

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    resetDragIndicator()
  }, [resetDragIndicator])

  const decoratedRenderer = useMemo(() => (
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
          dnd={{
            enabled: true,
            showDropIndicator: Boolean(dragIndicator && samePath(dragIndicator.targetPath, path)),
            dropPlacement: dragIndicator && samePath(dragIndicator.targetPath, path)
              ? dragIndicator.placement
              : null,
          }}
        >
          {rendered}
        </EditableNodeWrapper>
      ) : undefined}
    />
  ), [dragIndicator, onAction, tree, visualEditor])

  const previewContent = (
    <div className="rounded-md border border-gray-200 bg-white p-0 min-h-[420px]">
      {tree ? (
        visualEditor?.enabled ? (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {decoratedRenderer}
          </DndContext>
        ) : (
          decoratedRenderer
        )
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

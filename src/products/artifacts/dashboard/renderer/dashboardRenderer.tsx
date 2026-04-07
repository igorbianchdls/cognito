'use client'

import React from 'react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

import { DashboardLayoutEditContext } from '@/products/artifacts/dashboard/renderer/components/DashboardLayoutContext'
import {
  resolveDashboardQueryTemplate,
  useDashboardQueryResult,
} from '@/products/artifacts/dashboard/renderer/components/DashboardQuery'
import { resolveDashboardComponent } from '@/products/artifacts/dashboard/renderer/dashboardRegistry'

type AnyRecord = Record<string, any>

function getNodeKey(node: any, fallbackIndex: number, path: number[]): string {
  const type = String(node?.type || 'node')
  const props = node?.props && typeof node.props === 'object' ? node.props : {}
  const explicitId =
    typeof props.id === 'string' && props.id.trim()
      ? props.id.trim()
      : typeof props.key === 'string' && props.key.trim()
        ? props.key.trim()
        : ''
  if (explicitId) return `${type}:${explicitId}`
  return `${type}:${path.join('.')}:${fallbackIndex}`
}

function RenderDashboardNode({
  node,
  data,
  onAction,
  path,
  parentType,
}: {
  node: any
  data?: AnyRecord
  onAction?: (action: any) => void
  path: number[]
  parentType?: string
}) {
  const queryResult = useDashboardQueryResult()
  if (node == null) return null
  if (typeof node === 'string' || typeof node === 'number') return <>{resolveDashboardQueryTemplate(String(node), queryResult)}</>
  if (typeof node !== 'object') return null

  const type = String(node.type || '').trim()
  const Component = resolveDashboardComponent(type)
  if (!Component) {
    return (
      <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
        Unknown component: {type || 'node'}
      </div>
    )
  }

  const layoutParent = parentType === 'Grid' || parentType === 'Vertical' || parentType === 'Horizontal'
  const shouldAttachLayoutPath =
    type === 'Grid' || type === 'Vertical' || type === 'Horizontal' || type === 'Panel' || type === 'Card'
  const element = shouldAttachLayoutPath
    ? {
        ...node,
        props: {
          ...((node?.props && typeof node.props === 'object') ? node.props : {}),
          __path: path,
          __layoutItem: layoutParent && (type === 'Panel' || type === 'Card'),
        },
      }
    : node

  const children = Array.isArray(node.children)
    ? node.children.map((child: any, index: number) => (
        <RenderDashboardNode
          key={getNodeKey(child, index, [...path, index])}
          node={child}
          data={data}
          onAction={onAction}
          path={[...path, index]}
          parentType={type}
        />
      ))
    : null

  return (
    <Component element={element} data={data} onAction={onAction}>
      {children}
    </Component>
  )
}

export function DashboardRenderer({
  tree,
  data,
  onAction,
  editableLayout = false,
  onStructuralMove,
}: {
  tree: any
  data?: AnyRecord
  onAction?: (action: any) => void
  editableLayout?: boolean
  onStructuralMove?: (sourcePath: number[], targetPath: number[], targetType: 'vertical' | 'horizontal') => void
}) {
  const [structuralDrag, setStructuralDrag] = React.useState<{ panelId: string; panelPath: number[]; span: number } | null>(null)
  const [hoverTargetKey, setHoverTargetKey] = React.useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )
  const layoutEditValue = React.useMemo(
    () => ({
      enabled: editableLayout,
      structuralDrag,
      hoverTargetKey,
      startStructuralDrag: (drag: { panelId: string; panelPath: number[]; span: number }) => setStructuralDrag(drag),
      endStructuralDrag: () => {
        setStructuralDrag(null)
        setHoverTargetKey(null)
      },
      setHoverTargetKey,
      movePanelToContainer: (targetPath: number[], targetType: 'vertical' | 'horizontal') => {
        if (!structuralDrag || !onStructuralMove) return
        onStructuralMove(structuralDrag.panelPath, targetPath, targetType)
        setStructuralDrag(null)
        setHoverTargetKey(null)
      },
    }),
    [editableLayout, hoverTargetKey, onStructuralMove, structuralDrag],
  )

  function handleStructuralDragStart(event: DragStartEvent) {
    const data = event.active.data.current as
      | { kind?: string; panelId?: string; panelPath?: number[]; span?: number }
      | undefined
    if (!data || data.kind !== 'panel' || !Array.isArray(data.panelPath)) return
    setStructuralDrag({
      panelId: typeof data.panelId === 'string' ? data.panelId : String(event.active.id),
      panelPath: data.panelPath,
      span: typeof data.span === 'number' && Number.isFinite(data.span) ? data.span : 1,
    })
  }

  function handleStructuralDragOver(event: DragOverEvent) {
    const targetId = typeof event.over?.id === 'string' ? event.over.id : null
    setHoverTargetKey(targetId)
  }

  function resetStructuralDrag() {
    setStructuralDrag(null)
    setHoverTargetKey(null)
  }

  function handleStructuralDragEnd(event: DragEndEvent) {
    const overData = event.over?.data.current as
      | { path?: number[]; targetType?: 'vertical' | 'horizontal' }
      | undefined
    if (
      structuralDrag &&
      overData &&
      Array.isArray(overData.path) &&
      (overData.targetType === 'vertical' || overData.targetType === 'horizontal') &&
      onStructuralMove
    ) {
      onStructuralMove(structuralDrag.panelPath, overData.path, overData.targetType)
    }
    resetStructuralDrag()
  }

  if (Array.isArray(tree)) {
    return (
      <DashboardLayoutEditContext.Provider value={layoutEditValue}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleStructuralDragStart}
          onDragOver={handleStructuralDragOver}
          onDragEnd={handleStructuralDragEnd}
          onDragCancel={resetStructuralDrag}
        >
          {tree.map((node, index) => (
            <RenderDashboardNode key={getNodeKey(node, index, [index])} node={node} data={data} onAction={onAction} path={[index]} />
          ))}
          <DragOverlay>
            {structuralDrag ? (
              <div
                style={{
                  border: '1px solid rgba(148,163,184,0.45)',
                  backgroundColor: 'rgba(255,255,255,0.96)',
                  color: '#0f172a',
                  borderRadius: 12,
                  padding: '10px 12px',
                  boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                mover bloco
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </DashboardLayoutEditContext.Provider>
    )
  }

  return (
    <DashboardLayoutEditContext.Provider value={layoutEditValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleStructuralDragStart}
        onDragOver={handleStructuralDragOver}
        onDragEnd={handleStructuralDragEnd}
        onDragCancel={resetStructuralDrag}
      >
        <RenderDashboardNode node={tree} data={data} onAction={onAction} path={[]} />
        <DragOverlay>
          {structuralDrag ? (
            <div
              style={{
                border: '1px solid rgba(148,163,184,0.45)',
                backgroundColor: 'rgba(255,255,255,0.96)',
                color: '#0f172a',
                borderRadius: 12,
                padding: '10px 12px',
                boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              mover bloco
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DashboardLayoutEditContext.Provider>
  )
}

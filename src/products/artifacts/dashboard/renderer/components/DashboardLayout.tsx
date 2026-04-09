'use client'

import React from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout'

import { DashboardLayoutEditContext } from '@/products/artifacts/dashboard/renderer/components/DashboardLayoutContext'
import {
  buildPanelLayout,
  styleDimension,
  toNumericLayoutValue,
} from '@/products/artifacts/dashboard/renderer/components/dashboardLayoutAdapter'

type AnyRecord = Record<string, any>

const AutoWidthGridLayout = WidthProvider(GridLayout)

function getPathKey(path: number[] | undefined) {
  return Array.isArray(path) && path.length > 0 ? path.join('.') : 'root'
}

function getElementPath(element: any) {
  const raw = element?.props?.__path
  return Array.isArray(raw) ? raw.filter((value) => typeof value === 'number') : []
}

function useStructuralDropTarget(
  layoutEdit: React.ContextType<typeof DashboardLayoutEditContext>,
  path: number[],
  targetType: 'vertical' | 'horizontal',
  enabled = true,
) {
  const targetKey = `${targetType}:${getPathKey(path)}`
  const { setNodeRef, isOver } = useDroppable({
    id: targetKey,
    disabled: !layoutEdit.enabled || !enabled,
    data: { path, targetType },
  })

  return {
    dropRef: setNodeRef,
    targetKey,
    structuralActive: layoutEdit.enabled && enabled && isOver && Boolean(layoutEdit.structuralDrag),
  }
}

function isRenderableLayoutChild(child: React.ReactNode) {
  if (child === null || child === undefined || child === false) return false
  if (typeof child === 'string') return child.trim().length > 0
  return true
}

function hasStructuralLayoutProps(child: any) {
  const props = child?.props
  if (!props || typeof props !== 'object') return false
  return (
    props.span !== undefined ||
    props.rows !== undefined ||
    props.x !== undefined ||
    props.y !== undefined ||
    props.minSpan !== undefined
  )
}

function isStructuralLayoutNode(child: any) {
  return child && typeof child === 'object' && (
    child.type === 'Panel' ||
    child.type === 'Card' ||
    hasStructuralLayoutProps(child)
  )
}

export function DashboardVertical({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const layoutEdit = React.useContext(DashboardLayoutEditContext)
  const props = (element?.props || {}) as AnyRecord
  const path = getElementPath(element)
  const dropTargetEnabled = props.dropTarget !== false && props.dropTarget !== 'false'
  const { dropRef, structuralActive } = useStructuralDropTarget(layoutEdit, path, 'vertical', dropTargetEnabled)
  return (
    <div
      ref={dropRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        gap: styleDimension(props.gap) ?? 16,
        alignItems: typeof props.align === 'string' ? props.align : undefined,
        justifyContent: typeof props.justify === 'string' ? props.justify : undefined,
        padding: styleDimension(props.padding),
        width: styleDimension(props.width),
        maxWidth: styleDimension(props.maxWidth),
        outline: structuralActive ? '2px solid rgba(37,99,235,0.45)' : undefined,
        backgroundColor: structuralActive ? 'rgba(37,99,235,0.05)' : undefined,
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
      }}
    >
      {children}
    </div>
  )
}

export function DashboardHorizontal({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const layoutEdit = React.useContext(DashboardLayoutEditContext)
  const editableLayout = layoutEdit.enabled
  const props = (element?.props || {}) as AnyRecord
  const path = getElementPath(element)
  const { dropRef, structuralActive } = useStructuralDropTarget(layoutEdit, path, 'horizontal')
  const childNodes = Array.isArray(element?.children) ? element.children : []
  const childArray = React.Children.toArray(children).filter(isRenderableLayoutChild)
  const panelNodes = childNodes.filter((child: any) => isStructuralLayoutNode(child))
  const columns = Math.max(1, toNumericLayoutValue(props.columns, 12))
  const gap = toNumericLayoutValue(props.gap, 16)
  const rowHeight = Math.max(8, toNumericLayoutValue(props.rowHeight, 220))
  const autoSizedOnceRef = React.useRef<Set<string>>(new Set())
  const bodyRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const autoHeightPanelIds = React.useMemo(
    () =>
      new Set(
        panelNodes
          .filter((panelNode: any) => {
            const rows = panelNode?.props?.rows
            return rows === undefined || rows === null || String(rows).trim() === ''
          })
          .map((panelNode: any, index: number) => String(panelNode?.props?.id || `panel-${index}`)),
      ),
    [panelNodes],
  )
  const panelLayoutSeed = panelNodes
    .map((panelNode: any, index: number) =>
      [
        String(panelNode?.props?.id || `panel-${index}`),
        String(panelNode?.props?.span ?? ''),
        String(panelNode?.props?.rows ?? ''),
        String(panelNode?.props?.minSpan ?? ''),
        String(panelNode?.props?.x ?? ''),
        String(panelNode?.props?.y ?? ''),
      ].join(':'),
    )
    .join('|')
  const defaultLayouts = React.useMemo(() => buildPanelLayout(panelNodes, columns), [panelLayoutSeed, columns])
  const [layout, setLayout] = React.useState<Layout[]>(defaultLayouts)

  React.useEffect(() => {
    setLayout(defaultLayouts)
  }, [defaultLayouts])

  React.useEffect(() => {
    autoSizedOnceRef.current = new Set()
  }, [panelLayoutSeed])

  React.useLayoutEffect(() => {
    if (!editableLayout || autoHeightPanelIds.size === 0) return

    const rowUnit = rowHeight + gap
    setLayout((prev) => {
      let changed = false
      const next = prev.map((item) => {
        if (!autoHeightPanelIds.has(item.i) || autoSizedOnceRef.current.has(item.i)) return item
        const bodyEl = bodyRefs.current[item.i]
        const measured = Math.ceil(bodyEl?.scrollHeight || 0)
        autoSizedOnceRef.current.add(item.i)
        if (!measured) return item
        const nextRows = Math.max(item.minH ?? 1, Math.ceil((measured + gap) / rowUnit))
        if (nextRows !== item.h) {
          changed = true
          return { ...item, h: nextRows }
        }
        return item
      })
      return changed ? next : prev
    })
  }, [editableLayout, autoHeightPanelIds, rowHeight, gap, panelLayoutSeed])

  if (editableLayout && panelNodes.length > 0 && panelNodes.length === childArray.length) {
    const childById = new Map(
      childArray.map((child, index) => [String(panelNodes[index]?.props?.id || `panel-${index}`), child]),
    )

    return (
      <div
        ref={dropRef}
        style={{
          minWidth: 0,
          width: styleDimension(props.width),
          maxWidth: styleDimension(props.maxWidth),
          padding: styleDimension(props.padding),
          outline: structuralActive ? '2px solid rgba(37,99,235,0.45)' : undefined,
          backgroundColor: structuralActive ? 'rgba(37,99,235,0.05)' : undefined,
          ...(props.style && typeof props.style === 'object' ? props.style : {}),
        }}
      >
        <AutoWidthGridLayout
          className="dashboard-rgl"
          layout={layout}
          cols={columns}
          rowHeight={rowHeight}
          margin={[gap, gap]}
          containerPadding={[0, 0]}
          compactType={null}
          preventCollision={false}
          isDraggable
          isResizable
          draggableHandle=".dashboard-panel-drag-handle"
          resizeHandles={['e', 's', 'se']}
          onLayoutChange={(nextLayout) => setLayout(nextLayout)}
        >
          {layout.map((item) => (
            <div key={item.i} className="dashboard-panel-edit-shell">
              <div className="dashboard-panel-drag-handle">move</div>
              <div
                className="dashboard-panel-edit-body"
                ref={(node) => {
                  bodyRefs.current[item.i] = node
                }}
              >
                {childById.get(item.i) ?? null}
              </div>
            </div>
          ))}
        </AutoWidthGridLayout>
      </div>
    )
  }

  return (
      <div
        ref={dropRef}
        style={{
          display: 'flex',
          flexDirection: 'row',
          minWidth: 0,
        gap,
        alignItems: typeof props.align === 'string' ? props.align : undefined,
        justifyContent: typeof props.justify === 'string' ? props.justify : undefined,
          flexWrap: props.wrap === true || props.wrap === 'true' ? 'wrap' : 'nowrap',
          padding: styleDimension(props.padding),
          width: styleDimension(props.width),
          maxWidth: styleDimension(props.maxWidth),
          outline: structuralActive ? '2px solid rgba(37,99,235,0.45)' : undefined,
          backgroundColor: structuralActive ? 'rgba(37,99,235,0.05)' : undefined,
          ...(props.style && typeof props.style === 'object' ? props.style : {}),
        }}
      >
      {children}
    </div>
  )
}

export function DashboardGrid({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const layoutEdit = React.useContext(DashboardLayoutEditContext)
  const editableLayout = layoutEdit.enabled
  const props = (element?.props || {}) as AnyRecord
  const childNodes = Array.isArray(element?.children) ? element.children : []
  const childArray = React.Children.toArray(children).filter(isRenderableLayoutChild)
  const panelNodes = childNodes.filter((child: any) => isStructuralLayoutNode(child))
  const columns = Math.max(1, toNumericLayoutValue(props.columns, 12))
  const gap = toNumericLayoutValue(props.gap, 16)
  const rowHeight = Math.max(8, toNumericLayoutValue(props.rowHeight, 220))
  const autoSizedOnceRef = React.useRef<Set<string>>(new Set())
  const bodyRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const autoHeightPanelIds = React.useMemo(
    () =>
      new Set(
        panelNodes
          .filter((panelNode: any) => {
            const rows = panelNode?.props?.rows
            return rows === undefined || rows === null || String(rows).trim() === ''
          })
          .map((panelNode: any, index: number) => String(panelNode?.props?.id || `panel-${index}`)),
      ),
    [panelNodes],
  )
  const panelLayoutSeed = panelNodes
    .map((panelNode: any, index: number) =>
      [
        String(panelNode?.props?.id || `panel-${index}`),
        String(panelNode?.props?.span ?? ''),
        String(panelNode?.props?.rows ?? ''),
        String(panelNode?.props?.minSpan ?? ''),
        String(panelNode?.props?.x ?? ''),
        String(panelNode?.props?.y ?? ''),
      ].join(':'),
    )
    .join('|')
  const defaultLayouts = React.useMemo(() => buildPanelLayout(panelNodes, columns), [panelLayoutSeed, columns])
  const [layout, setLayout] = React.useState<Layout[]>(defaultLayouts)

  React.useEffect(() => {
    setLayout(defaultLayouts)
  }, [defaultLayouts])

  React.useEffect(() => {
    autoSizedOnceRef.current = new Set()
  }, [panelLayoutSeed])

  React.useLayoutEffect(() => {
    if (!editableLayout || autoHeightPanelIds.size === 0) return

    const rowUnit = rowHeight + gap
    setLayout((prev) => {
      let changed = false
      const next = prev.map((item) => {
        if (!autoHeightPanelIds.has(item.i) || autoSizedOnceRef.current.has(item.i)) return item
        const bodyEl = bodyRefs.current[item.i]
        const measured = Math.ceil(bodyEl?.scrollHeight || 0)
        autoSizedOnceRef.current.add(item.i)
        if (!measured) return item
        const nextRows = Math.max(item.minH ?? 1, Math.ceil((measured + gap) / rowUnit))
        if (nextRows !== item.h) {
          changed = true
          return { ...item, h: nextRows }
        }
        return item
      })
      return changed ? next : prev
    })
  }, [editableLayout, autoHeightPanelIds, rowHeight, gap, panelLayoutSeed])

  const sharedStyle = {
    minWidth: 0,
    width: styleDimension(props.width),
    maxWidth: styleDimension(props.maxWidth),
    padding: styleDimension(props.padding),
    ...(props.style && typeof props.style === 'object' ? props.style : {}),
  }

  const childById = new Map(
    childArray.map((child, index) => [String(panelNodes[index]?.props?.id || `panel-${index}`), child]),
  )

  if (editableLayout && panelNodes.length > 0 && panelNodes.length === childArray.length) {
    return (
      <div style={sharedStyle}>
        <AutoWidthGridLayout
          className="dashboard-rgl"
          layout={layout}
          cols={columns}
          rowHeight={rowHeight}
          margin={[gap, gap]}
          containerPadding={[0, 0]}
          compactType="vertical"
          preventCollision={false}
          isDraggable
          isResizable
          draggableHandle=".dashboard-panel-drag-handle"
          resizeHandles={['e', 's', 'se']}
          onLayoutChange={(nextLayout) => setLayout(nextLayout)}
        >
          {layout.map((item) => (
            <div key={item.i} className="dashboard-panel-edit-shell">
              <div className="dashboard-panel-drag-handle">move</div>
              <div
                className="dashboard-panel-edit-body"
                ref={(node) => {
                  bodyRefs.current[item.i] = node
                }}
              >
                {childById.get(item.i) ?? null}
              </div>
            </div>
          ))}
        </AutoWidthGridLayout>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
        ...sharedStyle,
      }}
    >
      {panelNodes.length > 0 && panelNodes.length === childArray.length
        ? panelNodes.map((panelNode: any, index: number) => {
            const span = Math.max(1, Math.min(columns, toNumericLayoutValue(panelNode?.props?.span, 1)))
            const rawRows = panelNode?.props?.rows
            const hasRows = !(rawRows === undefined || rawRows === null || String(rawRows).trim() === '')
            const rows = hasRows ? Math.max(1, toNumericLayoutValue(rawRows, 1)) : null
            return (
              <div
                key={String(panelNode?.props?.id || `panel-${index}`)}
                style={{
                  minWidth: 0,
                  gridColumn: `${
                    (() => {
                      const rawX = panelNode?.props?.x
                      const hasX = !(rawX === undefined || rawX === null || String(rawX).trim() === '')
                      if (!hasX) return `span ${span}`
                      const x = Math.max(0, Math.min(columns - 1, toNumericLayoutValue(rawX, 0)))
                      return `${x + 1} / span ${Math.min(span, columns - x || columns)}`
                    })()
                  }`,
                  ...(() => {
                    const rawY = panelNode?.props?.y
                    const hasY = !(rawY === undefined || rawY === null || String(rawY).trim() === '')
                    if (!rows && !hasY) return {}
                    const base: Record<string, string | number> = {}
                    if (hasY) {
                      const y = Math.max(0, toNumericLayoutValue(rawY, 0))
                      base.gridRowStart = y + 1
                    }
                    if (rows) {
                      base.gridRowEnd = `span ${rows}`
                      base.minHeight = rows * rowHeight + Math.max(rows - 1, 0) * gap
                    }
                    return base
                  })(),
                }}
              >
                {childArray[index] ?? null}
              </div>
            )
          })
        : children}
    </div>
  )
}

export function DashboardPanel({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const layoutEdit = React.useContext(DashboardLayoutEditContext)
  const editableLayout = layoutEdit.enabled
  const props = (element?.props || {}) as AnyRecord
  const path = getElementPath(element)
  const panelId =
    typeof props.id === 'string' && props.id.trim()
      ? props.id.trim()
      : `panel-${getPathKey(path)}`
  const span = Math.max(1, toNumericLayoutValue(props.span, 1))
  const draggableId = `panel:${panelId}:${getPathKey(path)}`
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    disabled: !editableLayout,
    data: {
      kind: 'panel',
      panelId,
      panelPath: path,
      span,
    },
  })
  const grow =
    typeof props.grow === 'number'
      ? props.grow
      : typeof props.grow === 'string' && props.grow.trim()
        ? Number(props.grow)
        : undefined

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: Number.isFinite(grow as number) ? (grow as number) : undefined,
        flexShrink: props.shrink === false || props.shrink === 'false' ? 0 : 1,
        flexBasis: styleDimension(props.basis),
        width: styleDimension(props.width),
        height: editableLayout ? '100%' : undefined,
        minHeight: styleDimension(props.minHeight),
        minWidth: styleDimension(props.minWidth) ?? 0,
        maxWidth: styleDimension(props.maxWidth),
        padding: styleDimension(props.padding),
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.5 : undefined,
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
      }}
    >
      {editableLayout ? (
        <button
          className="dashboard-panel-structural-handle"
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 3,
            border: '1px solid rgba(148,163,184,0.5)',
            backgroundColor: 'rgba(255,255,255,0.92)',
            color: '#334155',
            borderRadius: 999,
            fontSize: 11,
            lineHeight: 1,
            padding: '6px 8px',
            cursor: 'grab',
            touchAction: 'none',
          }}
          title="Mover painel para outro container"
          aria-label="Mover painel para outro container"
        >
          mover bloco
        </button>
      ) : null}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          height: editableLayout ? '100%' : undefined,
          flex: editableLayout ? 1 : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}

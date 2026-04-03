'use client'

import React from 'react'
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout'

import { DashboardLayoutEditContext } from '@/products/artifacts/dashboard/renderer/components/DashboardLayoutContext'
import {
  buildPanelLayout,
  styleDimension,
  toNumericLayoutValue,
} from '@/products/artifacts/dashboard/renderer/components/dashboardLayoutAdapter'

type AnyRecord = Record<string, any>

const AutoWidthGridLayout = WidthProvider(GridLayout)

export function DashboardVertical({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const props = (element?.props || {}) as AnyRecord
  return (
    <div
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
  const editableLayout = React.useContext(DashboardLayoutEditContext)
  const props = (element?.props || {}) as AnyRecord
  const childNodes = Array.isArray(element?.children) ? element.children : []
  const childArray = React.Children.toArray(children)
  const panelNodes = childNodes.filter((child: any) => child && typeof child === 'object' && child.type === 'Panel')
  const columns = Math.max(1, toNumericLayoutValue(props.columns, 12))
  const gap = toNumericLayoutValue(props.gap, 16)
  const rowHeight = Math.max(72, toNumericLayoutValue(props.rowHeight, 220))
  const panelLayoutSeed = panelNodes
    .map((panelNode: any, index: number) =>
      [
        String(panelNode?.props?.id || `panel-${index}`),
        String(panelNode?.props?.span ?? ''),
        String(panelNode?.props?.rows ?? ''),
        String(panelNode?.props?.minSpan ?? ''),
      ].join(':'),
    )
    .join('|')
  const defaultLayouts = React.useMemo(() => buildPanelLayout(panelNodes, columns), [panelLayoutSeed, columns])
  const [layout, setLayout] = React.useState<Layout[]>(defaultLayouts)

  React.useEffect(() => {
    setLayout(defaultLayouts)
  }, [defaultLayouts])

  if (editableLayout && panelNodes.length > 0 && panelNodes.length === childArray.length) {
    const childById = new Map(
      childArray.map((child, index) => [String(panelNodes[index]?.props?.id || `panel-${index}`), child]),
    )

    return (
      <div
        style={{
          minWidth: 0,
          width: styleDimension(props.width),
          maxWidth: styleDimension(props.maxWidth),
          padding: styleDimension(props.padding),
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
              <div className="dashboard-panel-edit-body">{childById.get(item.i) ?? null}</div>
            </div>
          ))}
        </AutoWidthGridLayout>
      </div>
    )
  }

  return (
    <div
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
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
      }}
    >
      {children}
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
  const editableLayout = React.useContext(DashboardLayoutEditContext)
  const props = (element?.props || {}) as AnyRecord
  const grow =
    typeof props.grow === 'number'
      ? props.grow
      : typeof props.grow === 'string' && props.grow.trim()
        ? Number(props.grow)
        : undefined

  return (
    <div
      style={{
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
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
      }}
    >
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

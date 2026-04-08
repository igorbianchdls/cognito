'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import type { HudFrameConfig } from '@/products/bi/json-render/components/FrameSurface'
import JsxCardSurface from '@/products/bi/json-render/components/JsxCardSurface'
import { DashboardLayoutEditContext } from '@/products/artifacts/dashboard/renderer/components/DashboardLayoutContext'
import {
  styleDimension,
  toNumericLayoutValue,
} from '@/products/artifacts/dashboard/renderer/components/dashboardLayoutAdapter'
import {
  resolveDashboardCardTheme,
  resolveDashboardCardVariantKey,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'

type AnyRecord = Record<string, any>

function mergeCardStyle(
  baseStyle: React.CSSProperties,
  overrideStyle: React.CSSProperties | undefined,
): React.CSSProperties {
  return {
    ...baseStyle,
    ...(overrideStyle || {}),
  }
}

function getPathKey(path: number[] | undefined) {
  return Array.isArray(path) && path.length > 0 ? path.join('.') : 'root'
}

function getElementPath(element: any) {
  const raw = element?.props?.__path
  return Array.isArray(raw) ? raw.filter((value) => typeof value === 'number') : []
}

function stripLayoutOnlyProps(props: AnyRecord) {
  const next = { ...props }
  delete next.__path
  delete next.__layoutItem
  delete next.span
  delete next.rows
  delete next.minSpan
  delete next.x
  delete next.y
  delete next.grow
  delete next.shrink
  delete next.basis
  delete next.width
  delete next.minWidth
  delete next.maxWidth
  delete next.minHeight
  delete next.padding
  return next
}

export default function DashboardCardSurface({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const props = (element?.props || {}) as AnyRecord
  const layoutEdit = React.useContext(DashboardLayoutEditContext)
  const editableLayout = layoutEdit.enabled
  const layoutItem = props.__layoutItem === true
  const { appearanceOverrides, themeName, borderPreset } = useDashboardThemeSelection()
  const theme = resolveDashboardCardTheme(themeName, borderPreset, appearanceOverrides)
  const variantKey = resolveDashboardCardVariantKey(props)
  const variantTheme = theme[variantKey]
  const inlineStyle = props.style && typeof props.style === 'object' ? (props.style as React.CSSProperties) : undefined
  const mergedStyle = mergeCardStyle(variantTheme, inlineStyle)
  const frame = Object.prototype.hasOwnProperty.call(props, 'frame')
    ? (props.frame as HudFrameConfig | null | undefined)
    : variantTheme.frame
  const path = getElementPath(element)
  const panelId =
    typeof props.id === 'string' && props.id.trim()
      ? props.id.trim()
      : `card-${getPathKey(path)}`
  const span = Math.max(1, toNumericLayoutValue(props.span, 1))
  const draggableId = `panel:${panelId}:${getPathKey(path)}`
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    disabled: !editableLayout || !layoutItem,
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
  const needsLayoutWrapper =
    layoutItem ||
    Number.isFinite(grow as number) ||
    Object.prototype.hasOwnProperty.call(props, 'shrink') ||
    Object.prototype.hasOwnProperty.call(props, 'basis') ||
    Object.prototype.hasOwnProperty.call(props, 'width') ||
    Object.prototype.hasOwnProperty.call(props, 'minHeight') ||
    Object.prototype.hasOwnProperty.call(props, 'minWidth') ||
    Object.prototype.hasOwnProperty.call(props, 'maxWidth') ||
    Object.prototype.hasOwnProperty.call(props, 'padding')

  const { frame: _frameStyle, ...styleWithoutFrame } = mergedStyle as React.CSSProperties & { frame?: HudFrameConfig | null }
  const cardProps = stripLayoutOnlyProps(props)
  const cardStyle = {
    ...(layoutItem
      ? {
          minHeight: editableLayout ? '100%' : 0,
          height: editableLayout ? '100%' : styleWithoutFrame.height,
        }
      : {}),
    ...styleWithoutFrame,
  } as React.CSSProperties

  const cardElement = (
    <JsxCardSurface
      element={{
        ...element,
        props: {
          ...cardProps,
          style: cardStyle,
          frame,
        },
      }}
    >
      {children}
    </JsxCardSurface>
  )

  if (!needsLayoutWrapper) {
    return cardElement
  }

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
        height: editableLayout && layoutItem ? '100%' : undefined,
        minHeight: styleDimension(props.minHeight),
        minWidth: styleDimension(props.minWidth) ?? 0,
        maxWidth: styleDimension(props.maxWidth),
        padding: styleDimension(props.padding),
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.5 : undefined,
      }}
    >
      {editableLayout && layoutItem ? (
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
      {cardElement}
    </div>
  )
}

'use client'

import React from 'react'

import { styleDimension, toNumericLayoutValue } from '@/products/artifacts/dashboard/runtime/components/layout/dashboardLayoutAdapter'

type AnyRecord = Record<string, any>

function isRenderableLayoutChild(child: React.ReactNode) {
  if (child === null || child === undefined || child === false) return false
  if (typeof child === 'string') return child.trim().length > 0
  return true
}

export function DashboardHorizontal({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const props = (element?.props || {}) as AnyRecord
  const childArray = React.Children.toArray(children).filter(isRenderableLayoutChild)
  const gap = toNumericLayoutValue(props.gap, 16)

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
      {childArray}
    </div>
  )
}

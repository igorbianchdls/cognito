'use client'

import React from 'react'

import type { HudFrameConfig } from '@/products/bi/json-render/components/FrameSurface'
import JsxCardSurface from '@/products/bi/json-render/components/JsxCardSurface'
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

export default function DashboardCardSurface({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const props = (element?.props || {}) as AnyRecord
  const { themeName, borderPreset } = useDashboardThemeSelection()
  const theme = resolveDashboardCardTheme(themeName, borderPreset)
  const variantKey = resolveDashboardCardVariantKey(props)
  const variantTheme = theme[variantKey]
  const inlineStyle = props.style && typeof props.style === 'object' ? (props.style as React.CSSProperties) : undefined
  const mergedStyle = mergeCardStyle(variantTheme, inlineStyle)
  const frame = Object.prototype.hasOwnProperty.call(props, 'frame')
    ? (props.frame as HudFrameConfig | null | undefined)
    : variantTheme.frame

  const { frame: _frameStyle, ...styleWithoutFrame } = mergedStyle as React.CSSProperties & { frame?: HudFrameConfig | null }

  return (
    <JsxCardSurface
      element={{
        ...element,
        props: {
          ...props,
          style: styleWithoutFrame,
          frame,
        },
      }}
    >
      {children}
    </JsxCardSurface>
  )
}

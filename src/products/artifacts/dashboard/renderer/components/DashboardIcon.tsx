'use client'

import React from 'react'
import * as LucideIcons from 'lucide-react'

type AnyRecord = Record<string, any>

function toPascalCase(input: string) {
  return input
    .trim()
    .replace(/(^\w|[-_\s]\w)/g, (match) => match.replace(/[-_\s]/g, '').toUpperCase())
}

function resolveLucideIcon(name: unknown) {
  const raw = typeof name === 'string' ? name.trim() : ''
  if (!raw) return null

  const registry = LucideIcons as unknown as Record<string, React.ComponentType<any>>
  const direct = registry[raw]
  if (typeof direct === 'function') return direct

  const normalized = registry[toPascalCase(raw)]
  if (typeof normalized === 'function') return normalized

  return null
}

function resolveSize(input: unknown, fallback: number) {
  const numeric = Number(input)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback
}

function resolvePadding(input: unknown, fallback: number) {
  const numeric = Number(input)
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback
}

export default function DashboardIcon({
  element,
}: {
  element: any
}) {
  const props = (element?.props || {}) as AnyRecord
  const iconName = props.name ?? props.icon
  const IconComponent = resolveLucideIcon(iconName) || LucideIcons.CircleAlert
  const size = resolveSize(props.size, 18)
  const padding = resolvePadding(props.padding, 10)
  const strokeWidth = resolveSize(props.strokeWidth, 2)
  const color = typeof props.color === 'string' && props.color.trim() ? props.color : '#0F172A'
  const backgroundColor =
    typeof props.backgroundColor === 'string' && props.backgroundColor.trim()
      ? props.backgroundColor
      : 'rgba(15, 23, 42, 0.06)'
  const borderColor =
    typeof props.borderColor === 'string' && props.borderColor.trim()
      ? props.borderColor
      : 'transparent'
  const radius = resolveSize(props.radius, 14)
  const boxSize = resolveSize(props.boxSize, size + padding * 2)
  const style = props.style && typeof props.style === 'object' ? (props.style as React.CSSProperties) : undefined
  const badgeStyle =
    props.badgeStyle && typeof props.badgeStyle === 'object' ? (props.badgeStyle as React.CSSProperties) : undefined
  const iconStyle =
    props.iconStyle && typeof props.iconStyle === 'object' ? (props.iconStyle as React.CSSProperties) : undefined
  const title = typeof props.title === 'string' && props.title.trim() ? props.title : undefined

  return (
    <div
      title={title}
      aria-label={title || (typeof iconName === 'string' ? iconName : 'Icon')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
        ...(style || {}),
      }}
    >
      <div
        style={{
          width: boxSize,
          height: boxSize,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxSizing: 'border-box',
          borderRadius: radius,
          border: `1px solid ${borderColor}`,
          backgroundColor,
          ...(badgeStyle || {}),
        }}
      >
        <IconComponent
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          aria-hidden="true"
          style={iconStyle}
        />
      </div>
    </div>
  )
}

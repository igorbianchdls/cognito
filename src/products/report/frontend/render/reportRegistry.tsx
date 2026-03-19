'use client'

import React from 'react'

import { mapManagersToCssVars } from '@/products/bi/json-render/theme/thememanagers'
import { buildThemeVars } from '@/products/bi/json-render/theme/themeAdapter'

type AnyRecord = Record<string, any>
type ReportRenderComponent = React.FC<{
  element: any
  children?: React.ReactNode
  data?: AnyRecord
  onAction?: (action: any) => void
}>

const HTML_TAGS = new Set([
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'p',
  'span',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
])

function cssVarsToStyle(cssVars: Record<string, string> | undefined): React.CSSProperties {
  const out: Record<string, string> = {}
  if (!cssVars) return out as React.CSSProperties
  for (const [key, value] of Object.entries(cssVars)) {
    out[`--${key}`] = value
  }
  return out as React.CSSProperties
}

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

function normalizeProps(input: Record<string, any> | undefined): Record<string, any> {
  const props = { ...(input || {}) }
  delete props.style
  delete props.text
  delete props.title
  delete props.children
  return props
}

function ReportTheme({ element, children }: { element: any; children?: React.ReactNode }) {
  const name = element?.props?.name as string | undefined
  const headerTheme = element?.props?.headerTheme as string | undefined
  const managers = (element?.props?.managers || {}) as AnyRecord
  const preset = buildThemeVars(name, managers as any, { headerTheme })
  const cssVars = preset.cssVars || mapManagersToCssVars(managers)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        ...cssVarsToStyle(cssVars),
      }}
    >
      {children}
    </div>
  )
}

function ReportSurface({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

function HtmlNode({
  tag,
  element,
  children,
}: {
  tag: keyof React.JSX.IntrinsicElements
  element: any
  children?: React.ReactNode
}) {
  const props = (element?.props || {}) as Record<string, any>
  const content = children ?? props.text ?? props.title ?? null
  return React.createElement(
    tag,
    {
      ...normalizeProps(props),
      style: {
        boxSizing: 'border-box',
        minWidth: 0,
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
      },
    },
    content,
  )
}

function resolveComponent(type: string): ReportRenderComponent | undefined {
  if (type === 'Theme') return ({ element, children }) => <ReportTheme element={element}>{children}</ReportTheme>
  if (type === 'Report') return ({ children }) => <ReportSurface>{children}</ReportSurface>
  if (type === 'TextNode') return ({ element }) => <>{String((element?.props?.text as string | undefined) || '')}</>
  if (type === 'Br') return () => <br />
  if (HTML_TAGS.has(type.toLowerCase())) {
    return ({ element, children }) => <HtmlNode tag={type.toLowerCase() as keyof React.JSX.IntrinsicElements} element={element}>{children}</HtmlNode>
  }
  return undefined
}

function RenderReportNode({
  node,
  data,
  onAction,
  path,
}: {
  node: any
  data?: AnyRecord
  onAction?: (action: any) => void
  path: number[]
}) {
  if (node == null) return null
  if (typeof node === 'string' || typeof node === 'number') return <>{String(node)}</>
  if (typeof node !== 'object') return null

  const type = String(node.type || '').trim()
  const Component = resolveComponent(type)
  if (!Component) {
    return (
      <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
        Unknown component: {type || 'node'}
      </div>
    )
  }

  const children = Array.isArray(node.children)
    ? node.children.map((child: any, index: number) => (
        <RenderReportNode
          key={getNodeKey(child, index, [...path, index])}
          node={child}
          data={data}
          onAction={onAction}
          path={[...path, index]}
        />
      ))
    : null

  return (
    <Component element={node} data={data} onAction={onAction}>
      {children}
    </Component>
  )
}

export function ReportRenderer({
  tree,
  data,
  onAction,
}: {
  tree: any
  data?: AnyRecord
  onAction?: (action: any) => void
}) {
  if (Array.isArray(tree)) {
    return (
      <>
        {tree.map((node, index) => (
          <RenderReportNode key={getNodeKey(node, index, [index])} node={node} data={data} onAction={onAction} path={[index]} />
        ))}
      </>
    )
  }

  return <RenderReportNode node={tree} data={data} onAction={onAction} path={[]} />
}

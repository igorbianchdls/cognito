'use client'

import React from 'react'

import JsonRenderQuery, {
  resolveQueryTemplate,
  useQueryResult,
} from '@/products/bi/json-render/components/QueryRuntime'
import { renderChartByType } from '@/products/bi/json-render/components/chartFacade'
import { registry as biRegistry } from '@/products/bi/json-render/registry'
import { ThemeProvider, useSemanticUiStyle } from '@/products/bi/json-render/theme/ThemeContext'
import { mapManagersToCssVars } from '@/products/bi/json-render/theme/thememanagers'
import { buildThemeVars } from '@/products/bi/json-render/theme/themeAdapter'

type AnyRecord = Record<string, any>
type SlideRenderComponent = React.FC<{
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

function SlideTheme({ element, children }: { element: any; children?: React.ReactNode }) {
  const name = element?.props?.name as string | undefined
  const headerTheme = element?.props?.headerTheme as string | undefined
  const managers = (element?.props?.managers || {}) as AnyRecord
  const preset = buildThemeVars(name, managers as any, { headerTheme })
  const cssVars = preset.cssVars || mapManagersToCssVars(managers)

  return (
    <ThemeProvider name={name} cssVars={cssVars}>
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
    </ThemeProvider>
  )
}

function SlideSurface({ children }: { children?: React.ReactNode }) {
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
  const queryResult = useQueryResult()
  const semanticStyle = useSemanticUiStyle(props['data-ui'], tag)
  const fallbackContent =
    typeof props.text === 'string'
      ? resolveQueryTemplate(props.text, queryResult)
      : typeof props.title === 'string'
        ? resolveQueryTemplate(props.title, queryResult)
        : null
  const content = children ?? fallbackContent
  return React.createElement(
    tag,
    {
      ...normalizeProps(props),
      style: {
        boxSizing: 'border-box',
        minWidth: 0,
        ...semanticStyle,
        ...(props.style && typeof props.style === 'object' ? props.style : {}),
      },
    },
    content,
  )
}

function resolveComponent(type: string): SlideRenderComponent | undefined {
  if (type === 'Theme') return ({ element, children }) => <SlideTheme element={element}>{children}</SlideTheme>
  if (type === 'Slide') return ({ children }) => <SlideSurface>{children}</SlideSurface>
  if (type === 'Chart') return ({ element, onAction }) => <>{renderChartByType((element?.props || {}).type, element, onAction)}</>
  if (type === 'Query') return ({ element, children }) => <JsonRenderQuery element={element}>{children}</JsonRenderQuery>
  if (type === 'Table') return ({ element, onAction }) => <biRegistry.Table element={element} onAction={onAction} />
  if (type === 'PivotTable') return ({ element, onAction }) => <biRegistry.PivotTable element={element} onAction={onAction} />
  if (type === 'TextNode') {
    return ({ element }) => {
      const queryResult = useQueryResult()
      return <>{resolveQueryTemplate(String((element?.props?.text as string | undefined) || ''), queryResult)}</>
    }
  }
  if (type === 'Br') return () => <br />
  if (HTML_TAGS.has(type.toLowerCase())) {
    return ({ element, children }) => <HtmlNode tag={type.toLowerCase() as keyof React.JSX.IntrinsicElements} element={element}>{children}</HtmlNode>
  }
  return undefined
}

function RenderSlideNode({
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
  const queryResult = useQueryResult()
  if (node == null) return null
  if (typeof node === 'string' || typeof node === 'number') return <>{resolveQueryTemplate(String(node), queryResult)}</>
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
        <RenderSlideNode
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

export function SlideRenderer({
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
          <RenderSlideNode key={getNodeKey(node, index, [index])} node={node} data={data} onAction={onAction} path={[index]} />
        ))}
      </>
    )
  }

  return <RenderSlideNode node={tree} data={data} onAction={onAction} path={[]} />
}

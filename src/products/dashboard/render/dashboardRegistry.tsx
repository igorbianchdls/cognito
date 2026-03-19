'use client'

import React from 'react'

import JsonRenderBarChart from '@/products/bi/json-render/components/BarChart'
import JsonRenderLineChart from '@/products/bi/json-render/components/LineChart'
import JsonRenderPieChart from '@/products/bi/json-render/components/PieChart'
import { registry as biRegistry } from '@/products/bi/json-render/registry'
import { mapManagersToCssVars } from '@/products/bi/json-render/theme/thememanagers'
import { buildThemeVars } from '@/products/bi/json-render/theme/themeAdapter'
import { ThemeProvider } from '@/products/bi/json-render/theme/ThemeContext'
import DashboardDatePicker from '@/products/dashboard/render/components/DashboardDatePicker'
import DashboardQuery, {
  resolveDashboardQueryTemplate,
  useDashboardQueryResult,
} from '@/products/dashboard/render/components/DashboardQuery'

type AnyRecord = Record<string, any>
type DashboardRenderComponent = React.FC<{
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

function DashboardRoot({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

function DashboardTheme({ element, children }: { element: any; children?: React.ReactNode }) {
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
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </ThemeProvider>
  )
}

function DashboardSurface({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
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
  const queryResult = useDashboardQueryResult()
  const fallbackContent =
    typeof props.text === 'string'
      ? resolveDashboardQueryTemplate(props.text, queryResult)
      : typeof props.title === 'string'
        ? resolveDashboardQueryTemplate(props.title, queryResult)
        : null
  const content = children ?? fallbackContent

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

function resolveComponent(type: string): DashboardRenderComponent | undefined {
  if (type === 'DashboardTemplate') return ({ children }) => <DashboardRoot>{children}</DashboardRoot>
  if (type === 'Theme') return ({ element, children }) => <DashboardTheme element={element}>{children}</DashboardTheme>
  if (type === 'Dashboard') return ({ children }) => <DashboardSurface>{children}</DashboardSurface>
  if (type === 'BarChart') return ({ element }) => <JsonRenderBarChart element={element} />
  if (type === 'LineChart') return ({ element }) => <JsonRenderLineChart element={element} />
  if (type === 'PieChart') return ({ element }) => <JsonRenderPieChart element={element} />
  if (type === 'KPI') return ({ element, onAction }) => <biRegistry.KPI element={element} onAction={onAction} />
  if (type === 'Query') return ({ element, children }) => <DashboardQuery element={element}>{children}</DashboardQuery>
  if (type === 'Table') return ({ element, onAction }) => <biRegistry.Table element={element} onAction={onAction} />
  if (type === 'PivotTable') return ({ element, onAction }) => <biRegistry.PivotTable element={element} onAction={onAction} />
  if (type === 'Slicer') return ({ element, onAction }) => <biRegistry.Slicer element={element} onAction={onAction} />
  if (type === 'DatePicker') return ({ element, onAction }) => <DashboardDatePicker element={element} onAction={onAction} />
  if (type === 'TextNode') {
    return ({ element }) => {
      const queryResult = useDashboardQueryResult()
      return <>{resolveDashboardQueryTemplate(String((element?.props?.text as string | undefined) || ''), queryResult)}</>
    }
  }
  if (type === 'Br') return () => <br />
  if (HTML_TAGS.has(type.toLowerCase())) {
    return ({ element, children }) => <HtmlNode tag={type.toLowerCase() as keyof React.JSX.IntrinsicElements} element={element}>{children}</HtmlNode>
  }
  return undefined
}

function RenderDashboardNode({
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
  const queryResult = useDashboardQueryResult()
  if (node == null) return null
  if (typeof node === 'string' || typeof node === 'number') return <>{resolveDashboardQueryTemplate(String(node), queryResult)}</>
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
        <RenderDashboardNode
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

export function DashboardRenderer({
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
          <RenderDashboardNode key={getNodeKey(node, index, [index])} node={node} data={data} onAction={onAction} path={[index]} />
        ))}
      </>
    )
  }

  return <RenderDashboardNode node={tree} data={data} onAction={onAction} path={[]} />
}

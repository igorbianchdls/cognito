'use client'

import React, { isValidElement, ReactNode } from 'react'

type DashboardTreeNode = {
  type: string
  props: Record<string, unknown>
  children: Array<DashboardTreeNode | string>
}

type RuntimeComponent = React.FC<Record<string, unknown> & { children?: React.ReactNode }>

function passthroughComponent(name: string): RuntimeComponent {
  const Comp: RuntimeComponent = ({ children }) => <>{children}</>
  Comp.displayName = name
  return Comp
}

function leafComponent(name: string): RuntimeComponent {
  const Comp: RuntimeComponent = () => null
  Comp.displayName = name
  return Comp
}

const runtimeScope = {
  DashboardTemplate: passthroughComponent('DashboardTemplate'),
  Theme: leafComponent('Theme'),
  Dashboard: passthroughComponent('Dashboard'),
  Card: passthroughComponent('Card'),
  Tabs: passthroughComponent('Tabs'),
  Tab: passthroughComponent('Tab'),
  TabPanel: passthroughComponent('TabPanel'),
  Query: passthroughComponent('Query'),
  Chart: leafComponent('Chart'),
  BarChart: leafComponent('BarChart'),
  LineChart: leafComponent('LineChart'),
  PieChart: leafComponent('PieChart'),
  KPI: leafComponent('KPI'),
  Table: leafComponent('Table'),
  PivotTable: leafComponent('PivotTable'),
  Slicer: leafComponent('Slicer'),
  DatePicker: leafComponent('DatePicker'),
  Insights: leafComponent('Insights'),
  Text: passthroughComponent('Text'),
}

function getElementTypeName(type: unknown): string {
  if (typeof type === 'string') return type
  if (typeof type === 'function') {
    const componentType = type as Function & { displayName?: string }
    return componentType.displayName || componentType.name || 'Anonymous'
  }
  return 'Unknown'
}

function jsxToTree(node: ReactNode): DashboardTreeNode | string | null {
  if (node == null || typeof node === 'boolean') return null
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (!isValidElement(node)) return null

  const props = (node.props || {}) as { children?: ReactNode } & Record<string, unknown>
  const { children, ...restProps } = props
  const childNodes = Array.isArray(children) ? children : children == null ? [] : [children]
  const parsedChildren = childNodes
    .map((child) => jsxToTree(child))
    .filter((child): child is DashboardTreeNode | string => child !== null)

  return {
    type: getElementTypeName(node.type),
    props: restProps,
    children: parsedChildren,
  }
}

function sanitizeSource(source: string) {
  return String(source || '').replace(/^[\uFEFF]/, '').trim()
}

function resolveDashboardExport(moduleExports: Record<string, unknown>) {
  const directDefault = moduleExports.default
  if (typeof directDefault === 'function') return directDefault as (...args: any[]) => ReactNode

  const namedDashboard = Object.entries(moduleExports).find(([key, value]) => /^Dashboard[A-Z_]/.test(key) && typeof value === 'function')
  if (namedDashboard) return namedDashboard[1] as (...args: any[]) => ReactNode

  const firstFunction = Object.values(moduleExports).find((value) => typeof value === 'function')
  if (typeof firstFunction === 'function') return firstFunction as (...args: any[]) => ReactNode

  return null
}

export async function compileDashboardSourceToTree(source: string): Promise<DashboardTreeNode> {
  const cleanSource = sanitizeSource(source)
  if (!cleanSource) throw new Error('Arquivo vazio')

  const ts = await import('typescript')
  const transpiled = ts.transpileModule(cleanSource, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
    reportDiagnostics: false,
  }).outputText

  const runtimeKeys = Object.keys(runtimeScope)
  const runtimeValues = Object.values(runtimeScope)

  const evaluator = new Function(
    'React',
    ...runtimeKeys,
    `
      const module = { exports: {} };
      const exports = module.exports;
      const require = (id) => {
        if (id === 'react') return React;
        throw new Error('Imports externos nao sao suportados no preview do workspace: ' + id);
      };
      ${transpiled}
      return module.exports;
    `,
  ) as (...args: any[]) => Record<string, unknown>

  const moduleExports = evaluator(React, ...runtimeValues)
  const dashboardExport = resolveDashboardExport(moduleExports)
  if (!dashboardExport) throw new Error('Nenhum componente de dashboard exportado foi encontrado')

  const rendered = dashboardExport({})
  const tree = jsxToTree(rendered)
  if (!tree || typeof tree === 'string') {
    throw new Error('Nao foi possivel derivar a arvore do dashboard a partir do JSX')
  }
  return tree
}

export function getDashboardTitleFromSource(source: string, fallback = 'Dashboard') {
  const templateTitleMatch = String(source || '').match(/<DashboardTemplate\b[^>]*\btitle="([^"]+)"/)
  if (templateTitleMatch?.[1]?.trim()) return templateTitleMatch[1].trim()

  const dashboardTitleMatch = String(source || '').match(/<Dashboard\b[^>]*\btitle="([^"]+)"/)
  if (dashboardTitleMatch?.[1]?.trim()) return dashboardTitleMatch[1].trim()

  return fallback
}

export function getDashboardThemeNameFromSource(source: string, fallback = 'light') {
  const themeMatch = String(source || '').match(/<Theme\b[^>]*\bname="([^"]+)"/)
  if (themeMatch?.[1]?.trim()) return themeMatch[1].trim()
  return fallback
}

'use client'

import React, { isValidElement, ReactNode } from 'react'

type WorkspaceSourceFile = {
  path: string
  content: string
}

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
  Filter: passthroughComponent('Filter'),
  Select: leafComponent('Select'),
  OptionList: leafComponent('OptionList'),
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

function normalizeWorkspacePath(path: string) {
  return String(path || '').replace(/\\/g, '/').replace(/^\.?\//, '')
}

function dirname(path: string) {
  const normalized = normalizeWorkspacePath(path)
  const index = normalized.lastIndexOf('/')
  return index === -1 ? '' : normalized.slice(0, index)
}

function joinPath(base: string, next: string) {
  const parts = `${base}/${next}`.split('/')
  const stack: string[] = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') {
      stack.pop()
      continue
    }
    stack.push(part)
  }
  return stack.join('/')
}

function resolveLocalImport(fromPath: string, request: string, filesMap: Map<string, string>) {
  const baseDir = dirname(fromPath)
  const targetBase = joinPath(baseDir, request)
  const candidates = [
    targetBase,
    `${targetBase}.ts`,
    `${targetBase}.tsx`,
    `${targetBase}.js`,
    `${targetBase}.jsx`,
    `${targetBase}/index.ts`,
    `${targetBase}/index.tsx`,
  ]

  return candidates.find((candidate) => filesMap.has(candidate)) || null
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

export async function compileDashboardSourceToTree(entryPath: string, files: WorkspaceSourceFile[]): Promise<DashboardTreeNode> {
  const ts = await import('typescript')
  const runtimeKeys = Object.keys(runtimeScope)
  const runtimeValues = Object.values(runtimeScope)
  const filesMap = new Map(files.map((file) => [normalizeWorkspacePath(file.path), file.content]))
  const cache = new Map<string, Record<string, unknown>>()

  const loadModule = (modulePath: string): Record<string, unknown> => {
    const normalizedModulePath = normalizeWorkspacePath(modulePath)
    if (cache.has(normalizedModulePath)) return cache.get(normalizedModulePath)!

    const moduleSource = sanitizeSource(filesMap.get(normalizedModulePath) || '')
    if (!moduleSource) throw new Error(`Arquivo nao encontrado no preview do workspace: ${normalizedModulePath}`)

    const transpiled = ts.transpileModule(moduleSource, {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2019,
        esModuleInterop: true,
      },
      reportDiagnostics: false,
    }).outputText

    const evaluator = new Function(
      'React',
      '__require',
      ...runtimeKeys,
      `
        const module = { exports: {} };
        const exports = module.exports;
        const require = (id) => __require(id);
        ${transpiled}
        return module.exports;
      `,
    ) as (...args: any[]) => Record<string, unknown>

    const moduleExports = evaluator(
      React,
      (request: string) => {
        if (request === 'react') return React
        if (request.startsWith('.')) {
          const resolvedImport = resolveLocalImport(normalizedModulePath, request, filesMap)
          if (!resolvedImport) {
            throw new Error(`Import local nao encontrado no preview do workspace: ${request}`)
          }
          return loadModule(resolvedImport)
        }
        throw new Error('Imports externos nao sao suportados no preview do workspace: ' + request)
      },
      ...runtimeValues,
    )

    cache.set(normalizedModulePath, moduleExports)
    return moduleExports
  }

  const moduleExports = loadModule(entryPath)
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
  const themeConstMatch = String(source || '').match(/const\s+THEME_NAME\s*=\s*['"]([^'"]+)['"]/)
  if (themeConstMatch?.[1]?.trim()) return themeConstMatch[1].trim()

  const themeMatch = String(source || '').match(/<Theme\b[^>]*\bname="([^"]+)"/)
  if (themeMatch?.[1]?.trim()) return themeMatch[1].trim()
  return fallback
}

export function replaceDashboardThemeNameInSource(source: string, nextThemeName: string) {
  const cleanSource = String(source || '')
  const normalizedThemeName = String(nextThemeName || '').trim()
  if (!normalizedThemeName) return cleanSource

  if (/const\s+THEME_NAME\s*=/.test(cleanSource)) {
    return cleanSource.replace(
      /const\s+THEME_NAME\s*=\s*['"][^'"]+['"]/,
      `const THEME_NAME = '${normalizedThemeName}'`,
    )
  }

  if (/<Theme\b[^>]*\bname=/.test(cleanSource)) {
    return cleanSource.replace(
      /<Theme\b([^>]*)\bname=(?:"[^"]*"|\{'[^']*'\}|\{"[^"]*"\})/,
      `<Theme$1name="${normalizedThemeName}"`,
    )
  }

  return cleanSource
}

export function getDashboardChartColorsFromSource(source: string, fallback: string[] = []) {
  const paletteNameMatch = String(source || '').match(/const\s+CHART_PALETTE\s*=\s*['"]([^'"]+)['"]/)
  if (paletteNameMatch?.[1]?.trim()) return [...fallback]

  const colorsMatch = String(source || '').match(/const\s+CHART_COLORS\s*=\s*(\[[\s\S]*?\])/)
  if (!colorsMatch?.[1]) return [...fallback]

  try {
    const parsed = JSON.parse(colorsMatch[1])
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')) {
      return [...parsed]
    }
  } catch {
    return [...fallback]
  }

  return [...fallback]
}

export function getDashboardChartPaletteNameFromSource(source: string, fallback: string) {
  const paletteMatch = String(source || '').match(/const\s+CHART_PALETTE\s*=\s*['"]([^'"]+)['"]/)
  if (paletteMatch?.[1]?.trim()) return paletteMatch[1].trim()
  return fallback
}

export function replaceDashboardChartPaletteNameInSource(source: string, nextPaletteName: string) {
  const cleanSource = String(source || '')
  const normalizedPaletteName = String(nextPaletteName || '').trim()
  if (!normalizedPaletteName) return cleanSource

  if (/const\s+CHART_PALETTE\s*=/.test(cleanSource)) {
    return cleanSource.replace(
      /const\s+CHART_PALETTE\s*=\s*['"][^'"]+['"]/,
      `const CHART_PALETTE = '${normalizedPaletteName}'`,
    )
  }

  return cleanSource
}

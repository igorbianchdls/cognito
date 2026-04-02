'use client'

import React, { isValidElement, ReactNode } from 'react'

import { resolveDashboardTemplateThemeTokens as resolveDashboardThemeTokens } from '@/products/dashboard/shared/templates/dashboardTemplateThemes'
import { resolveDashboardChartPaletteColors } from '@/products/dashboard/workspace/dashboardContract'
import { validateDashboardTree } from '@/products/dashboard/workspace/validateDashboardTree'

// Pipeline oficial do workspace:
// TSX/JSX source -> transpile -> module evaluation -> React element -> dashboard tree

export type WorkspaceSourceFile = {
  path: string
  content: string
}

export type DashboardTreeNode = {
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
  Theme: passthroughComponent('Theme'),
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

function wrapRootDashboardSource(source: string) {
  const cleanSource = sanitizeSource(source)
  if (!/^<Dashboard\b/.test(cleanSource)) return cleanSource

  const themeTagMatch = cleanSource.match(/<Theme\b[^>]*\/>/)
  const themeTagSource = themeTagMatch?.[0] || ''
  const dashboardThemeMatch = cleanSource.match(/<Dashboard\b[^>]*\btheme="([^"]+)"/)
  const dashboardPaletteMatch = cleanSource.match(/<Dashboard\b[^>]*\bchartPalette="([^"]+)"/)
  const themeNameMatch = themeTagSource.match(/\bname="([^"]+)"/)
  const themePaletteMatch = themeTagSource.match(/\bchartPalette="([^"]+)"/)
  const resolvedThemeName = dashboardThemeMatch?.[1]?.trim() || themeNameMatch?.[1]?.trim() || 'light'
  let dashboardSource = themeTagMatch ? cleanSource.replace(themeTagSource, '').trim() : cleanSource

  if (!dashboardThemeMatch?.[1]?.trim()) {
    dashboardSource = dashboardSource.replace(/<Dashboard\b/, `<Dashboard theme="${resolvedThemeName}"`)
  }

  const resolvedChartPalette = dashboardPaletteMatch?.[1]?.trim() || themePaletteMatch?.[1]?.trim()
  if (resolvedChartPalette && !dashboardPaletteMatch?.[1]?.trim()) {
    dashboardSource = dashboardSource.replace(/<Dashboard\b/, `<Dashboard chartPalette="${resolvedChartPalette}"`)
  }

  return `export default function __DashboardEntry() {
  const theme = __resolveDashboardThemeTokens(${JSON.stringify(resolvedThemeName)})

  return (
    ${dashboardSource}
  )
}
`
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

function isThemeTokensImport(fromPath: string, request: string) {
  if (!request.startsWith('.')) return false
  const baseDir = dirname(fromPath)
  const targetBase = joinPath(baseDir, request)
  return /(^|\/)theme-tokens$/i.test(targetBase)
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

export async function parseDashboardJsxToTree(entryPath: string, files: WorkspaceSourceFile[]): Promise<DashboardTreeNode> {
  const ts = await import('typescript')
  const runtimeKeys = Object.keys(runtimeScope)
  const runtimeValues = Object.values(runtimeScope)
  const filesMap = new Map(files.map((file) => [normalizeWorkspacePath(file.path), file.content]))
  const cache = new Map<string, Record<string, unknown>>()

  const loadModule = (modulePath: string): Record<string, unknown> => {
    const normalizedModulePath = normalizeWorkspacePath(modulePath)
    if (cache.has(normalizedModulePath)) return cache.get(normalizedModulePath)!

    const rawModuleSource = filesMap.get(normalizedModulePath) || ''
    const moduleSource = wrapRootDashboardSource(rawModuleSource)
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
      '__resolveDashboardThemeTokens',
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
        if (isThemeTokensImport(normalizedModulePath, request)) {
          return { resolveDashboardThemeTokens }
        }
        if (request.startsWith('.')) {
          const resolvedImport = resolveLocalImport(normalizedModulePath, request, filesMap)
          if (!resolvedImport) {
            throw new Error(`Import local nao encontrado no preview do workspace: ${request}`)
          }
          return loadModule(resolvedImport)
        }
        throw new Error('Imports externos nao sao suportados no preview do workspace: ' + request)
      },
      resolveDashboardThemeTokens,
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
  validateDashboardTree(tree)
  return tree
}

// Temporary alias while callers migrate to the parser-oriented name.
export const compileDashboardSourceToTree = parseDashboardJsxToTree

export function getDashboardTitleFromSource(source: string, fallback = 'Dashboard') {
  const templateTitleMatch = String(source || '').match(/<DashboardTemplate\b[^>]*\btitle="([^"]+)"/)
  if (templateTitleMatch?.[1]?.trim()) return templateTitleMatch[1].trim()

  const dashboardTitleMatch = String(source || '').match(/<Dashboard\b[^>]*\btitle="([^"]+)"/)
  if (dashboardTitleMatch?.[1]?.trim()) return dashboardTitleMatch[1].trim()

  return fallback
}

export function getDashboardThemeNameFromSource(source: string, fallback = 'light') {
  const dashboardThemeMatch = String(source || '').match(/<Dashboard\b[^>]*\btheme="([^"]+)"/)
  if (dashboardThemeMatch?.[1]?.trim()) return dashboardThemeMatch[1].trim()

  const themeMatch = String(source || '').match(/<Theme\b[^>]*\bname="([^"]+)"/)
  if (themeMatch?.[1]?.trim()) return themeMatch[1].trim()

  const themeTokenMatch = String(source || '').match(/resolveDashboardThemeTokens\((['"])([^'"]+)\1\)/)
  if (themeTokenMatch?.[2]?.trim()) return themeTokenMatch[2].trim()

  const themeConstMatch = String(source || '').match(/const\s+THEME_NAME\s*=\s*['"]([^'"]+)['"]/)
  if (themeConstMatch?.[1]?.trim()) return themeConstMatch[1].trim()
  return fallback
}

export function replaceDashboardThemeNameInSource(source: string, nextThemeName: string) {
  const cleanSource = String(source || '')
  const normalizedThemeName = String(nextThemeName || '').trim()
  if (!normalizedThemeName) return cleanSource

  let nextSource = cleanSource

  if (/<Dashboard\b[^>]*\btheme=/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Dashboard\b([^>]*)\btheme=(?:"[^"]*"|\{'[^']*'\}|\{"[^"]*"\})/,
      `<Dashboard$1theme="${normalizedThemeName}"`,
    )
  } else if (/<Dashboard\b/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Dashboard\b/,
      `<Dashboard theme="${normalizedThemeName}"`,
    )
  } else if (/<Theme\b[^>]*\bname=/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Theme\b([^>]*)\bname=(?:"[^"]*"|\{'[^']*'\}|\{"[^"]*"\})/,
      `<Theme$1name="${normalizedThemeName}"`,
    )
  }

  nextSource = nextSource.replace(
    /resolveDashboardThemeTokens\((['"])[^'"]+\1\)/,
    `resolveDashboardThemeTokens('${normalizedThemeName}')`,
  )
  nextSource = nextSource.replace(
    /const key = (['"])[^'"]+\1\.toLowerCase\(\)/,
    `const key = '${normalizedThemeName}'.toLowerCase()`,
  )
  nextSource = nextSource.replace(
    /Theme ativo:\s*[^<{]+/g,
    `Theme ativo: ${normalizedThemeName}`,
  )

  if (/const\s+THEME_NAME\s*=/.test(cleanSource)) {
    nextSource = nextSource.replace(
      /const\s+THEME_NAME\s*=\s*['"][^'"]+['"]/,
      `const THEME_NAME = '${normalizedThemeName}'`,
    )
  }

  return nextSource
}

export function getDashboardChartColorsFromSource(source: string, fallback: string[] = []) {
  const dashboardPaletteMatch = String(source || '').match(/<Dashboard\b[^>]*\bchartPalette="([^"]+)"/)
  if (dashboardPaletteMatch?.[1]?.trim()) {
    return resolveDashboardChartPaletteColors(dashboardPaletteMatch[1].trim())
  }

  const themePaletteMatch = String(source || '').match(/<Theme\b[^>]*\bchartPalette="([^"]+)"/)
  if (themePaletteMatch?.[1]?.trim()) {
    return resolveDashboardChartPaletteColors(themePaletteMatch[1].trim())
  }

  const paletteNameMatch = String(source || '').match(/const\s+CHART_PALETTE\s*=\s*['"]([^'"]+)['"]/)
  if (paletteNameMatch?.[1]?.trim()) {
    return resolveDashboardChartPaletteColors(paletteNameMatch[1].trim())
  }

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
  const dashboardMatch = String(source || '').match(/<Dashboard\b[^>]*\bchartPalette="([^"]+)"/)
  if (dashboardMatch?.[1]?.trim()) return dashboardMatch[1].trim()

  const themeMatch = String(source || '').match(/<Theme\b[^>]*\bchartPalette="([^"]+)"/)
  if (themeMatch?.[1]?.trim()) return themeMatch[1].trim()

  const paletteMatch = String(source || '').match(/const\s+CHART_PALETTE\s*=\s*['"]([^'"]+)['"]/)
  if (paletteMatch?.[1]?.trim()) return paletteMatch[1].trim()
  return fallback
}

export function replaceDashboardChartPaletteNameInSource(source: string, nextPaletteName: string) {
  const cleanSource = String(source || '')
  const normalizedPaletteName = String(nextPaletteName || '').trim()
  if (!normalizedPaletteName) return cleanSource

  let nextSource = cleanSource

  if (/<Dashboard\b[^>]*\bchartPalette=/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Dashboard\b([^>]*)\bchartPalette=(?:"[^"]*"|\{'[^']*'\}|\{"[^"]*"\})/,
      `<Dashboard$1chartPalette="${normalizedPaletteName}"`,
    )
  } else if (/<Dashboard\b/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Dashboard\b/,
      `<Dashboard chartPalette="${normalizedPaletteName}"`,
    )
  } else if (/<Theme\b[^>]*\bchartPalette=/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Theme\b([^>]*)\bchartPalette=(?:"[^"]*"|\{'[^']*'\}|\{"[^"]*"\})/,
      `<Theme$1chartPalette="${normalizedPaletteName}"`,
    )
  } else if (/<Theme\b[^>]*\/>/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Theme\b([^>]*)\/>/,
      `<Theme$1 chartPalette="${normalizedPaletteName}" />`,
    )
  }

  if (/const\s+CHART_PALETTE\s*=/.test(cleanSource)) {
    nextSource = nextSource.replace(
      /const\s+CHART_PALETTE\s*=\s*['"][^'"]+['"]/,
      `const CHART_PALETTE = '${normalizedPaletteName}'`,
    )
  }

  return nextSource
}

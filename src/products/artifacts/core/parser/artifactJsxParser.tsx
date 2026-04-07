'use client'

import React, { isValidElement, ReactNode } from 'react'

import { resolveDashboardTemplateThemeTokens as resolveDashboardThemeTokens } from '@/products/artifacts/dashboard/templates/dashboardTemplateThemes'
import type {
  ArtifactKind,
  ArtifactTreeNode,
  ParsedArtifactJsx,
  WorkspaceSourceFile,
} from '@/products/artifacts/core/types/artifactTypes'

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
  ReportTemplate: passthroughComponent('ReportTemplate'),
  SlideTemplate: passthroughComponent('SlideTemplate'),
  Theme: passthroughComponent('Theme'),
  Dashboard: passthroughComponent('Dashboard'),
  Report: passthroughComponent('Report'),
  Slide: passthroughComponent('Slide'),
  Grid: passthroughComponent('Grid'),
  Vertical: passthroughComponent('Vertical'),
  Horizontal: passthroughComponent('Horizontal'),
  Panel: passthroughComponent('Panel'),
  Card: passthroughComponent('Card'),
  Icon: leafComponent('Icon'),
  Tabs: passthroughComponent('Tabs'),
  Tab: passthroughComponent('Tab'),
  TabPanel: passthroughComponent('TabPanel'),
  Query: passthroughComponent('Query'),
  Chart: leafComponent('Chart'),
  BarChart: leafComponent('BarChart'),
  LineChart: leafComponent('LineChart'),
  PieChart: leafComponent('PieChart'),
  KPI: leafComponent('KPI'),
  KPICompare: leafComponent('KPICompare'),
  Table: leafComponent('Table'),
  PivotTable: leafComponent('PivotTable'),
  Filter: passthroughComponent('Filter'),
  Select: leafComponent('Select'),
  OptionList: leafComponent('OptionList'),
  DatePicker: leafComponent('DatePicker'),
  Insights: leafComponent('Insights'),
  Text: passthroughComponent('Text'),
} satisfies Record<string, RuntimeComponent>

function getElementTypeName(type: unknown): string {
  if (typeof type === 'string') return type
  if (typeof type === 'function') {
    const componentType = type as Function & { displayName?: string }
    return componentType.displayName || componentType.name || 'Anonymous'
  }
  return 'Unknown'
}

function jsxToTree(node: ReactNode): ArtifactTreeNode | string | null {
  if (node == null || typeof node === 'boolean') return null
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (!isValidElement(node)) return null

  const props = (node.props || {}) as { children?: ReactNode } & Record<string, unknown>
  const { children, ...restProps } = props
  const childNodes = Array.isArray(children) ? children : children == null ? [] : [children]
  const parsedChildren = childNodes
    .map((child) => jsxToTree(child))
    .filter((child): child is ArtifactTreeNode | string => child !== null)

  return {
    type: getElementTypeName(node.type),
    props: restProps,
    children: parsedChildren,
  }
}

function sanitizeSource(source: string) {
  return String(source || '').replace(/^[\uFEFF]/, '').trim()
}

function getRootTagName(source: string): string | null {
  const match = sanitizeSource(source).match(/^<([A-Z][A-Za-z0-9]*)\b/)
  return match?.[1] || null
}

function wrapArtifactRootSource(source: string) {
  const cleanSource = sanitizeSource(source)
  const rootTag = getRootTagName(cleanSource)
  if (!rootTag) return cleanSource

  if (rootTag === 'Dashboard') {
    const themeTagMatch = cleanSource.match(/<Theme\b[^>]*\/>/)
    const themeTagSource = themeTagMatch?.[0] || ''
    const dashboardThemeMatch = cleanSource.match(/<Dashboard\b[^>]*\btheme="([^"]+)"/)
    const dashboardPaletteMatch = cleanSource.match(/<Dashboard\b[^>]*\bchartPalette="([^"]+)"/)
    const dashboardBorderPresetMatch = cleanSource.match(/<Dashboard\b[^>]*\bborderPreset="([^"]+)"/)
    const themeNameMatch = themeTagSource.match(/\bname="([^"]+)"/)
    const themePaletteMatch = themeTagSource.match(/\bchartPalette="([^"]+)"/)
    const resolvedThemeName = dashboardThemeMatch?.[1]?.trim() || themeNameMatch?.[1]?.trim() || 'light'
    const resolvedBorderPreset = dashboardBorderPresetMatch?.[1]?.trim() || 'theme_default'
    let dashboardSource = themeTagMatch ? cleanSource.replace(themeTagSource, '').trim() : cleanSource

    if (!dashboardThemeMatch?.[1]?.trim()) {
      dashboardSource = dashboardSource.replace(/<Dashboard\b/, `<Dashboard theme="${resolvedThemeName}"`)
    }

    const resolvedChartPalette = dashboardPaletteMatch?.[1]?.trim() || themePaletteMatch?.[1]?.trim()
    if (resolvedChartPalette && !dashboardPaletteMatch?.[1]?.trim()) {
      dashboardSource = dashboardSource.replace(/<Dashboard\b/, `<Dashboard chartPalette="${resolvedChartPalette}"`)
    }

    return `export default function __ArtifactEntry() {
  const theme = __resolveDashboardThemeTokens(${JSON.stringify(resolvedThemeName)}, ${JSON.stringify(resolvedBorderPreset)})

  return (
    ${dashboardSource}
  )
}
`
  }

  if (rootTag === 'Report' || rootTag === 'ReportTemplate' || rootTag === 'Slide' || rootTag === 'SlideTemplate') {
    return `export default function __ArtifactEntry() {
  return (
    ${cleanSource}
  )
}
`
  }

  return cleanSource
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

function resolveArtifactExport(moduleExports: Record<string, unknown>) {
  const directDefault = moduleExports.default
  if (typeof directDefault === 'function') return directDefault as (...args: any[]) => ReactNode

  const firstNamedArtifact = Object.entries(moduleExports).find(
    ([key, value]) => /^(Dashboard|Report|Slide)[A-Z_]/.test(key) && typeof value === 'function',
  )
  if (firstNamedArtifact) return firstNamedArtifact[1] as (...args: any[]) => ReactNode

  const firstFunction = Object.values(moduleExports).find((value) => typeof value === 'function')
  if (typeof firstFunction === 'function') return firstFunction as (...args: any[]) => ReactNode

  return null
}

function resolveArtifactKindFromTree(tree: ArtifactTreeNode): ArtifactKind {
  if (tree.type === 'Dashboard' || tree.type === 'DashboardTemplate') return 'dashboard'
  if (tree.type === 'Report' || tree.type === 'ReportTemplate') return 'report'
  if (tree.type === 'Slide' || tree.type === 'SlideTemplate') return 'slide'
  throw new Error(`Tipo de artefato nao suportado no preview: ${tree.type}`)
}

export async function parseArtifactJsxToTree(entryPath: string, files: WorkspaceSourceFile[]): Promise<ParsedArtifactJsx> {
  const ts = await import('typescript')
  const runtimeKeys = Object.keys(runtimeScope)
  const runtimeValues = Object.values(runtimeScope)
  const filesMap = new Map(files.map((file) => [normalizeWorkspacePath(file.path), file.content]))
  const cache = new Map<string, Record<string, unknown>>()

  const loadModule = (modulePath: string): Record<string, unknown> => {
    const normalizedModulePath = normalizeWorkspacePath(modulePath)
    if (cache.has(normalizedModulePath)) return cache.get(normalizedModulePath)!

    const rawModuleSource = filesMap.get(normalizedModulePath) || ''
    const moduleSource = wrapArtifactRootSource(rawModuleSource)
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
  const artifactExport = resolveArtifactExport(moduleExports)
  if (!artifactExport) throw new Error('Nenhum componente de artefato exportado foi encontrado')

  const rendered = artifactExport({})
  const tree = jsxToTree(rendered)
  if (!tree || typeof tree === 'string') {
    throw new Error('Nao foi possivel derivar a arvore do artefato a partir do JSX')
  }

  return {
    kind: resolveArtifactKindFromTree(tree),
    tree,
  }
}

export type {
  ArtifactKind,
  ArtifactTreeNode,
  ParsedArtifactJsx,
  WorkspaceSourceFile,
}

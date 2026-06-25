'use client'

import React, { isValidElement, ReactNode } from 'react'

import type {
  ArtifactKind,
  ArtifactTreeNode,
  ParsedArtifactJsx,
  WorkspaceSourceFile,
} from '@/products/artifacts/core/types/artifactTypes'

type RuntimeComponent = React.FC<Record<string, unknown> & { children?: React.ReactNode }>

export type ArtifactLanguageDefinition = {
  kind: ArtifactKind
  runtimeScope: Record<string, RuntimeComponent>
  evaluatorGlobals?: Record<string, unknown>
  wrapSource?: (source: string) => string
  resolveImport?: (input: {
    fromPath: string
    request: string
  }) => { handled: true; value: unknown } | { handled: false }
  namedExportPattern?: RegExp
  rootTypes: readonly string[]
}

export function createArtifactPassthroughComponent(name: string): RuntimeComponent {
  const Comp: RuntimeComponent = ({ children }) => <>{children}</>
  Comp.displayName = name
  return Comp
}

export function createArtifactLeafComponent(name: string): RuntimeComponent {
  const Comp: RuntimeComponent = () => null
  Comp.displayName = name
  return Comp
}

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

export function sanitizeArtifactSource(source: string) {
  return String(source || '').replace(/^[\uFEFF]/, '').trim()
}

export function getArtifactRootTagName(source: string): string | null {
  const match = sanitizeArtifactSource(source).match(/^<([A-Z][A-Za-z0-9]*)\b/)
  return match?.[1] || null
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

function resolveArtifactExport(moduleExports: Record<string, unknown>, namedExportPattern: RegExp) {
  const directDefault = moduleExports.default
  if (typeof directDefault === 'function') return directDefault as (...args: any[]) => ReactNode

  const firstNamedArtifact = Object.entries(moduleExports).find(
    ([key, value]) => namedExportPattern.test(key) && typeof value === 'function',
  )
  if (firstNamedArtifact) return firstNamedArtifact[1] as (...args: any[]) => ReactNode

  const firstFunction = Object.values(moduleExports).find((value) => typeof value === 'function')
  if (typeof firstFunction === 'function') return firstFunction as (...args: any[]) => ReactNode

  return null
}

export async function compileArtifactJsxToTree(
  definition: ArtifactLanguageDefinition,
  entryPath: string,
  files: WorkspaceSourceFile[],
): Promise<ParsedArtifactJsx> {
  const ts = await import('typescript')
  const runtimeKeys = Object.keys(definition.runtimeScope)
  const runtimeValues = Object.values(definition.runtimeScope)
  const evaluatorGlobals = definition.evaluatorGlobals || {}
  const evaluatorGlobalKeys = Object.keys(evaluatorGlobals)
  const evaluatorGlobalValues = Object.values(evaluatorGlobals)
  const filesMap = new Map(files.map((file) => [normalizeWorkspacePath(file.path), file.content]))
  const cache = new Map<string, Record<string, unknown>>()

  const loadModule = (modulePath: string): Record<string, unknown> => {
    const normalizedModulePath = normalizeWorkspacePath(modulePath)
    if (cache.has(normalizedModulePath)) return cache.get(normalizedModulePath)!

    const rawModuleSource = filesMap.get(normalizedModulePath) || ''
    const moduleSource = definition.wrapSource
      ? definition.wrapSource(rawModuleSource)
      : sanitizeArtifactSource(rawModuleSource)
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
      ...evaluatorGlobalKeys,
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
        const resolvedByLanguage = definition.resolveImport?.({
          fromPath: normalizedModulePath,
          request,
        })
        if (resolvedByLanguage?.handled) {
          return resolvedByLanguage.value
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
      ...evaluatorGlobalValues,
      ...runtimeValues,
    )

    cache.set(normalizedModulePath, moduleExports)
    return moduleExports
  }

  const moduleExports = loadModule(entryPath)
  const artifactExport = resolveArtifactExport(
    moduleExports,
    definition.namedExportPattern || /^[A-Z][A-Za-z0-9_]+/,
  )
  if (!artifactExport) throw new Error('Nenhum componente de artefato exportado foi encontrado')

  const rendered = artifactExport({})
  const tree = jsxToTree(rendered)
  if (!tree || typeof tree === 'string') {
    throw new Error('Nao foi possivel derivar a arvore do artefato a partir do JSX')
  }
  if (!definition.rootTypes.includes(tree.type)) {
    throw new Error(`Tipo de artefato nao suportado no preview: ${tree.type}`)
  }

  return {
    kind: definition.kind,
    tree,
  }
}

export type {
  ArtifactKind,
  ArtifactTreeNode,
  ParsedArtifactJsx,
  WorkspaceSourceFile,
}

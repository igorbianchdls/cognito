'use client'

import React from 'react'

import { registry as biRegistry } from '@/products/bi/json-render/registry'
import { ThemeProvider } from '@/products/bi/json-render/theme/ThemeContext'
import { mapManagersToCssVars } from '@/products/bi/json-render/theme/thememanagers'
import { buildThemeVars } from '@/products/bi/json-render/theme/themeAdapter'

type AnyRecord = Record<string, any>

type SlideRenderComponent = React.FC<{
  element: any
  children?: React.ReactNode
  data?: AnyRecord
  onAction?: (action: any) => void
}>

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

function SlideTheme({ element, children }: { element: any; children?: React.ReactNode }) {
  const name = element?.props?.name as string | undefined
  const headerTheme = element?.props?.headerTheme as string | undefined
  const mgr = (element?.props?.managers || {}) as AnyRecord
  const preset = buildThemeVars(name, mgr as any, { headerTheme })
  const cssVars = preset.cssVars || mapManagersToCssVars(mgr)

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
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

export const slideRegistry: Record<string, SlideRenderComponent> = {
  ...biRegistry,
  Theme: ({ element, children }) => <SlideTheme element={element}>{children}</SlideTheme>,
  Slide: ({ children }) => <SlideSurface>{children}</SlideSurface>,
}

function RenderSlideNode({
  node,
  registry,
  data,
  onAction,
  path,
}: {
  node: any
  registry: Record<string, SlideRenderComponent>
  data?: AnyRecord
  onAction?: (action: any) => void
  path: number[]
}) {
  if (!node || typeof node !== 'object') return null

  const type = String(node.type || '').trim()
  const Component = registry[type]
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
          registry={registry}
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
          <RenderSlideNode
            key={getNodeKey(node, index, [index])}
            node={node}
            registry={slideRegistry}
            data={data}
            onAction={onAction}
            path={[index]}
          />
        ))}
      </>
    )
  }

  return <RenderSlideNode node={tree} registry={slideRegistry} data={data} onAction={onAction} path={[]} />
}

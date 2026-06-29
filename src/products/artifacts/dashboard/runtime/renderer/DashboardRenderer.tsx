'use client'

import React from 'react'

import {
  resolveDashboardQueryTemplate,
  useDashboardQueryResult,
} from '@/products/artifacts/dashboard/runtime/components/content/DashboardQuery'
import {
  DashboardThemeSelectionProvider,
  type DashboardAppearanceOverrides,
} from '@/products/artifacts/dashboard/runtime/theme'
import { resolveDashboardComponent } from '@/products/artifacts/dashboard/runtime/registry/dashboardRegistry'
import { DashboardQueryRuntimeProvider } from '@/products/artifacts/dashboard/query/DashboardQueryContext'

type AnyRecord = Record<string, any>

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
  const Component = resolveDashboardComponent(type)
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
  appearanceOverrides,
  artifactId,
}: {
  tree: any
  data?: AnyRecord
  onAction?: (action: any) => void
  appearanceOverrides?: DashboardAppearanceOverrides
  artifactId?: string | null
}) {
  if (Array.isArray(tree)) {
    return (
      <DashboardQueryRuntimeProvider artifactId={artifactId}>
        <DashboardThemeSelectionProvider appearanceOverrides={appearanceOverrides}>
          {tree.map((node, index) => (
            <RenderDashboardNode key={getNodeKey(node, index, [index])} node={node} data={data} onAction={onAction} path={[index]} />
          ))}
        </DashboardThemeSelectionProvider>
      </DashboardQueryRuntimeProvider>
    )
  }

  return (
    <DashboardQueryRuntimeProvider artifactId={artifactId}>
      <DashboardThemeSelectionProvider appearanceOverrides={appearanceOverrides}>
        <RenderDashboardNode node={tree} data={data} onAction={onAction} path={[]} />
      </DashboardThemeSelectionProvider>
    </DashboardQueryRuntimeProvider>
  )
}

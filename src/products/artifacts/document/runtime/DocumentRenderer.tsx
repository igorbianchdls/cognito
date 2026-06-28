'use client'

import React from 'react'

import type { ArtifactKind, ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'
import { DOCUMENT_SUPPORTED_HTML_TAGS } from '@/products/artifacts/document/language/documentLanguageManifest'

type DocumentKind = Extract<ArtifactKind, 'report' | 'slide'>
type AnyRecord = Record<string, any>

const HTML_TAG_SET = new Set<string>(DOCUMENT_SUPPORTED_HTML_TAGS)

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function pickDomProps(props: AnyRecord) {
  const output: AnyRecord = {}
  if (typeof props.id === 'string') output.id = props.id
  if (typeof props.className === 'string') output.className = props.className
  if (typeof props.title === 'string') output.title = props.title
  if (isRecord(props.style)) output.style = props.style
  if (typeof props.src === 'string') output.src = props.src
  if (typeof props.alt === 'string') output.alt = props.alt
  if (typeof props.colSpan === 'number') output.colSpan = props.colSpan
  if (typeof props.rowSpan === 'number') output.rowSpan = props.rowSpan
  return output
}

function getNodeKey(node: ArtifactTreeNode | string, index: number, path: number[]) {
  if (typeof node === 'string') return `text:${path.join('.')}:${index}`
  const id = typeof node.props?.id === 'string' && node.props.id.trim() ? node.props.id.trim() : ''
  return `${node.type}:${id || path.join('.')}:${index}`
}

function ChartPlaceholder({ element }: { element: ArtifactTreeNode }) {
  const props = element.props || {}
  const type = typeof props.type === 'string' ? props.type : 'chart'
  const title = typeof props.title === 'string' ? props.title : 'Chart'
  return (
    <div className="flex min-h-[220px] flex-col justify-between rounded-lg border border-[#d9e0ec] bg-[#f8fafc] p-4 text-[#1f2937]">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[#64748b]">{type}</div>
      </div>
      <div className="flex h-28 items-end gap-2">
        {[42, 76, 58, 92, 65, 84].map((height, index) => (
          <div key={index} className="flex-1 rounded-t bg-[#2563eb]/70" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  )
}

function DataTablePlaceholder({ element }: { element: ArtifactTreeNode }) {
  const title = typeof element.props?.title === 'string' ? element.props.title : 'Data table'
  return (
    <div className="overflow-hidden rounded-lg border border-[#d9e0ec] bg-white">
      <div className="border-b border-[#e5e7eb] px-4 py-3 text-sm font-semibold text-[#111827]">{title}</div>
      <div className="grid grid-cols-3 border-b border-[#edf0f5] bg-[#f8fafc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">
        <span>Nome</span>
        <span>Valor</span>
        <span>Status</span>
      </div>
      {[1, 2, 3].map((row) => (
        <div key={row} className="grid grid-cols-3 border-b border-[#edf0f5] px-4 py-3 text-sm text-[#334155] last:border-b-0">
          <span>Item {row}</span>
          <span>--</span>
          <span>Draft</span>
        </div>
      ))}
    </div>
  )
}

function RenderDocumentNode({
  node,
  kind,
  path,
}: {
  node: ArtifactTreeNode | string
  kind: DocumentKind
  path: number[]
}) {
  if (typeof node === 'string') return <>{node}</>
  if (!node || typeof node !== 'object') return null

  const children = Array.isArray(node.children)
    ? node.children.map((child, index) => (
        <RenderDocumentNode key={getNodeKey(child, index, [...path, index])} node={child} kind={kind} path={[...path, index]} />
      ))
    : null

  if (node.type === 'Report' || node.type === 'Deck') return <>{children}</>

  if (node.type === 'page') {
    return (
      <section className="mx-auto mb-8 min-h-[1122px] w-[794px] overflow-hidden bg-white shadow-sm ring-1 ring-black/10">
        {children}
      </section>
    )
  }

  if (node.type === 'slide') {
    return (
      <section className="mx-auto mb-8 aspect-video w-full max-w-[1120px] overflow-hidden bg-white shadow-sm ring-1 ring-black/10">
        {children}
      </section>
    )
  }

  if (node.type === 'Chart') return <ChartPlaceholder element={node} />
  if (node.type === 'DataTable') return <DataTablePlaceholder element={node} />

  if (HTML_TAG_SET.has(node.type)) {
    return React.createElement(node.type, pickDomProps(node.props || {}), children)
  }

  return (
    <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
      Unknown component: {node.type || 'node'}
    </div>
  )
}

export function DocumentRenderer({
  tree,
  kind,
}: {
  tree: ArtifactTreeNode
  kind: DocumentKind
}) {
  const rootClassName = kind === 'report'
    ? 'min-h-screen bg-[#f3f4f6] px-4 py-8'
    : 'min-h-screen bg-[#eceff4] px-4 py-8'

  return (
    <div className={rootClassName}>
      <RenderDocumentNode node={tree} kind={kind} path={[]} />
    </div>
  )
}

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
  if (kind === 'slide') {
    return <SlideDeckPlayer tree={tree} />
  }

  const rootClassName = kind === 'report'
    ? 'min-h-screen bg-[#f3f4f6] px-4 py-8'
    : 'min-h-screen bg-[#eceff4] px-4 py-8'

  return (
    <div className={rootClassName}>
      <RenderDocumentNode node={tree} kind={kind} path={[]} />
    </div>
  )
}

function collectDeckSlides(tree: ArtifactTreeNode) {
  const rootChildren = Array.isArray(tree.children) ? tree.children : []
  return rootChildren.filter(
    (child): child is ArtifactTreeNode => typeof child === 'object' && child !== null && child.type === 'slide',
  )
}

function getTextContent(node: ArtifactTreeNode | string): string {
  if (typeof node === 'string') return node
  if (!node || typeof node !== 'object') return ''
  return (node.children || []).map((child) => getTextContent(child)).join(' ').replace(/\s+/g, ' ').trim()
}

function findHeadingText(node: ArtifactTreeNode): string | null {
  if (node.type === 'h1' || node.type === 'h2') {
    const text = getTextContent(node)
    return text || null
  }

  for (const child of node.children || []) {
    if (typeof child !== 'object' || child === null) continue
    const text = findHeadingText(child)
    if (text) return text
  }

  return null
}

function getSlideLabel(slide: ArtifactTreeNode, index: number) {
  const explicitTitle = typeof slide.props?.title === 'string' ? slide.props.title.trim() : ''
  return explicitTitle || findHeadingText(slide) || `Slide ${index + 1}`
}

function SlideDeckPlayer({ tree }: { tree: ArtifactTreeNode }) {
  const slides = React.useMemo(() => collectDeckSlides(tree), [tree])
  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0)

  React.useEffect(() => {
    setActiveSlideIndex((current) => {
      if (slides.length === 0) return 0
      return Math.min(current, slides.length - 1)
    })
  }, [slides.length])

  if (slides.length === 0) {
    return (
      <div className="min-h-screen bg-[#eceff4] px-4 py-8">
        <div className="mx-auto max-w-2xl rounded-lg border border-[#d9e0ec] bg-white p-6 text-sm text-[#475569]">
          Nenhum slide encontrado neste deck.
        </div>
      </div>
    )
  }

  const activeSlide = slides[activeSlideIndex] || slides[0]

  if (slides.length === 1) {
    return (
      <div className="min-h-screen bg-[#eceff4] px-4 py-8">
        <RenderDocumentNode node={activeSlide} kind="slide" path={[0]} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#eceff4] lg:flex">
      <aside className="border-b border-black/10 bg-white/95 px-4 py-3 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-3 lg:py-4">
        <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-x-visible">
          {slides.map((slide, index) => {
            const active = index === activeSlideIndex
            return (
              <button
                key={getNodeKey(slide, index, [index])}
                type="button"
                onClick={() => setActiveSlideIndex(index)}
                className={[
                  'flex min-w-[128px] shrink-0 items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition lg:min-w-0',
                  active
                    ? 'border-[#111827] bg-[#111827] text-white'
                    : 'border-[#e2e8f0] bg-white text-[#334155] hover:border-[#cbd5e1] hover:bg-[#f8fafc]',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className={[
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded border text-xs font-semibold',
                    active ? 'border-white/20 bg-white/10 text-white' : 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]',
                  ].join(' ')}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 truncate">{getSlideLabel(slide, index)}</span>
              </button>
            )
          })}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8">
        <RenderDocumentNode node={activeSlide} kind="slide" path={[activeSlideIndex]} />
      </main>
    </div>
  )
}

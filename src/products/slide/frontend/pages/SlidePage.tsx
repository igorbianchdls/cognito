'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, MessageCircleMore, Minus, MoreHorizontal, Play, Plus, Search, X } from 'lucide-react'

import { parseDashboardTemplateDslToTree } from '@/products/bi/features/dashboard-playground/parsers/dashboardTemplateDslParser'
import { DataProvider } from '@/products/bi/json-render/context'
import { registry } from '@/products/bi/json-render/registry'
import { Renderer } from '@/products/bi/json-render/renderer'
import { SLIDE_TEMPLATE_DSL } from '@/products/slide/shared/templates/slideTemplate'

type AnyRecord = Record<string, any>

const SLIDE_WIDTH = 1280
const SLIDE_HEIGHT = 720
const THUMB_WIDTH = 170
const THUMB_SCALE = THUMB_WIDTH / SLIDE_WIDTH

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getSlideStructure(tree: unknown): {
  rootName: string
  themeNode: AnyRecord | null
  pages: AnyRecord[]
} {
  if (!isRecord(tree) || String(tree.type || '').trim() !== 'SlideTemplate') {
    return { rootName: 'Apresentação', themeNode: null, pages: [] }
  }
  const props = isRecord(tree.props) ? (tree.props as AnyRecord) : {}
  const children = Array.isArray(tree.children) ? tree.children.filter(isRecord) : []
  const themeNode = children.find((child) => String(child.type || '').trim() === 'Theme') as AnyRecord | undefined
  const pages = children.filter((child) => String(child.type || '').trim() === 'Slide') as AnyRecord[]
  return {
    rootName:
      typeof props.title === 'string' && props.title.trim()
        ? props.title
        : (typeof props.name === 'string' && props.name.trim() ? props.name : 'Apresentação'),
    themeNode: themeNode || null,
    pages,
  }
}

function getPageId(page: AnyRecord, index: number): string {
  const props = isRecord(page.props) ? (page.props as AnyRecord) : {}
  const raw = typeof props.id === 'string' && props.id.trim() ? props.id.trim() : ''
  return raw || `slide_${index + 1}`
}

function getPageTitle(page: AnyRecord, index: number): string {
  const props = isRecord(page.props) ? (page.props as AnyRecord) : {}
  const raw = typeof props.title === 'string' && props.title.trim() ? props.title.trim() : ''
  return raw || `Slide ${index + 1}`
}

function buildPageRenderTree(page: AnyRecord, themeNode: AnyRecord | null): any {
  const pageChildren = Array.isArray(page.children) ? page.children : []
  if (!themeNode) return pageChildren
  const themeChildren = Array.isArray(themeNode.children) ? themeNode.children : []
  return {
    ...themeNode,
    children: [...themeChildren, ...pageChildren],
  }
}

function SlideThumbnail({
  selected,
  index,
  title,
  onClick,
}: {
  selected: boolean
  index: number
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-2 py-2 text-left transition ${
        selected
          ? 'border-blue-300 bg-white shadow-sm'
          : 'border-transparent bg-transparent hover:border-slate-300 hover:bg-white/70'
      }`}
    >
      <div className="mb-2 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        <div
          style={{ width: THUMB_WIDTH, height: Math.round(SLIDE_HEIGHT * THUMB_SCALE) }}
          className="bg-white"
        />
      </div>
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
          {index + 1}
        </div>
        <div className="min-w-0 truncate text-xs font-medium text-slate-700">{title}</div>
      </div>
    </button>
  )
}

function SlideCanvas({ tree, zoom }: { tree: any; zoom: number }) {
  return (
    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
      <div
        className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        style={{ width: SLIDE_WIDTH, minWidth: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
      >
        <Renderer tree={tree} registry={registry} />
      </div>
    </div>
  )
}

function SlideWorkspace() {
  const parsed = useMemo(() => parseDashboardTemplateDslToTree(SLIDE_TEMPLATE_DSL), [])
  const { rootName, themeNode, pages } = useMemo(() => getSlideStructure(parsed), [parsed])
  const [activePageId, setActivePageId] = useState('')
  const [zoom, setZoom] = useState(0.82)

  useEffect(() => {
    if (!pages.length) return
    const firstId = getPageId(pages[0], 0)
    setActivePageId((current) => current || firstId)
  }, [pages])

  const activePage = useMemo(
    () => pages.find((page, index) => getPageId(page, index) === activePageId) || pages[0] || null,
    [pages, activePageId],
  )

  const activeTree = useMemo(
    () => (activePage ? buildPageRenderTree(activePage, themeNode) : []),
    [activePage, themeNode],
  )

  return (
    <div className="flex h-screen flex-col bg-[#f3f5f7] text-slate-800">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-slate-800">{rootName}</div>
          <div className="text-sm text-slate-500">Salvo</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1">
            <button
              type="button"
              onClick={() => setZoom((current) => Math.max(0.4, Number((current - 0.1).toFixed(2))))}
              className="flex items-center gap-1 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <Search className="h-4 w-4" />
              <Minus className="h-3 w-3" />
              <span className="sr-only">Zoom menos</span>
            </button>
            <span className="min-w-[56px] text-center text-xs font-medium text-slate-600">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(2))))}
              className="flex items-center gap-1 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <Search className="h-4 w-4" />
              <Plus className="h-3 w-3" />
              <span className="sr-only">Zoom mais</span>
            </button>
          </div>
          <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
            <MessageCircleMore className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
            <Download className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
            <Play className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[230px] shrink-0 overflow-auto border-r border-slate-200 bg-[#e9edf1] px-3 py-4">
          <div className="space-y-4">
            {pages.map((page, index) => {
              const pageId = getPageId(page, index)
              const pageTitle = getPageTitle(page, index)
              return (
                <SlideThumbnail
                  key={pageId}
                  selected={pageId === activePageId}
                  index={index}
                  title={pageTitle}
                  onClick={() => setActivePageId(pageId)}
                />
              )
            })}
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-auto bg-[#f5f6f8]">
          <div className="mx-auto flex min-h-full items-start justify-center p-8">
            {activePage ? <SlideCanvas tree={activeTree} zoom={zoom} /> : null}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function SlidePage() {
  return (
    <DataProvider initialData={{ ui: {}, filters: {}, slide: {} }}>
      <SlideWorkspace />
    </DataProvider>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, MessageCircleMore, MoreHorizontal, Play, X } from 'lucide-react'

import { parseDashboardTemplateDslToTree } from '@/products/bi/features/dashboard-playground/parsers/dashboardTemplateDslParser'
import { DataProvider } from '@/products/bi/json-render/context'
import { registry } from '@/products/bi/json-render/registry'
import { Renderer } from '@/products/bi/json-render/renderer'
import { REPORT_TEMPLATE_DSL } from '@/products/report/shared/templates/reportTemplate'

type AnyRecord = Record<string, any>

const A4_WIDTH = 794
const A4_HEIGHT = 1123
const THUMB_WIDTH = 150
const THUMB_SCALE = THUMB_WIDTH / A4_WIDTH

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getReportStructure(tree: unknown): {
  rootName: string
  themeNode: AnyRecord | null
  pages: AnyRecord[]
} {
  if (!isRecord(tree) || String(tree.type || '').trim() !== 'ReportTemplate') {
    return { rootName: 'Relatório', themeNode: null, pages: [] }
  }
  const props = isRecord(tree.props) ? (tree.props as AnyRecord) : {}
  const children = Array.isArray(tree.children) ? tree.children.filter(isRecord) : []
  const themeNode = children.find((child) => String(child.type || '').trim() === 'Theme') as AnyRecord | undefined
  const pages = children.filter((child) => String(child.type || '').trim() === 'Report') as AnyRecord[]
  return {
    rootName:
      typeof props.title === 'string' && props.title.trim()
        ? props.title
        : (typeof props.name === 'string' && props.name.trim() ? props.name : 'Relatório'),
    themeNode: themeNode || null,
    pages,
  }
}

function getPageId(page: AnyRecord, index: number): string {
  const props = isRecord(page.props) ? (page.props as AnyRecord) : {}
  const raw = typeof props.id === 'string' && props.id.trim() ? props.id.trim() : ''
  return raw || `page_${index + 1}`
}

function getPageTitle(page: AnyRecord, index: number): string {
  const props = isRecord(page.props) ? (page.props as AnyRecord) : {}
  const raw = typeof props.title === 'string' && props.title.trim() ? props.title.trim() : ''
  return raw || `Página ${index + 1}`
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

function ReportThumbnail({
  tree,
  selected,
  index,
  title,
  onClick,
}: {
  tree: any
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
        <div style={{ width: THUMB_WIDTH, height: Math.round(A4_HEIGHT * THUMB_SCALE), overflow: 'hidden' }}>
          <div
            style={{
              width: A4_WIDTH,
              height: A4_HEIGHT,
              transform: `scale(${THUMB_SCALE})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
              background: '#fff',
            }}
          >
            <Renderer tree={tree} registry={registry} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
          {index + 1}
        </div>
        <div className="min-w-0 text-xs font-medium text-slate-700 truncate">{title}</div>
      </div>
    </button>
  )
}

function ReportCanvas({ tree }: { tree: any }) {
  return (
    <div
      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
      style={{ width: A4_WIDTH, minWidth: A4_WIDTH, height: A4_HEIGHT }}
    >
      <Renderer tree={tree} registry={registry} />
    </div>
  )
}

function ReportWorkspace() {
  const parsed = useMemo(() => parseDashboardTemplateDslToTree(REPORT_TEMPLATE_DSL), [])
  const { rootName, themeNode, pages } = useMemo(() => getReportStructure(parsed), [parsed])
  const [activePageId, setActivePageId] = useState('')

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
        <aside className="w-[210px] shrink-0 overflow-auto border-r border-slate-200 bg-[#e9edf1] px-3 py-4">
          <div className="space-y-4">
            {pages.map((page, index) => {
              const pageId = getPageId(page, index)
              const pageTitle = getPageTitle(page, index)
              const pageTree = buildPageRenderTree(page, themeNode)
              return (
                <ReportThumbnail
                  key={pageId}
                  tree={pageTree}
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
            {activePage ? <ReportCanvas tree={activeTree} /> : null}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <DataProvider initialData={{ ui: {}, filters: {}, report: {} }}>
      <ReportWorkspace />
    </DataProvider>
  )
}

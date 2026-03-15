'use client'

import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

import { parseDashboardTemplateDslToTree } from '@/products/bi/json-render/parsers/dashboardTemplateDslParser'
import { DataProvider } from '@/products/bi/json-render/context'
import { registry } from '@/products/bi/json-render/registry'
import { Renderer } from '@/products/bi/json-render/renderer'
import { ReportPdfExportStage } from '@/products/report/export/ReportPdfExportStage'
import { useReportPdfExport } from '@/products/report/export/useReportPdfExport'
import { ReportPreviewThumbnail } from '@/products/report/preview/ReportPreviewThumbnail'
import { useReportPreviewSnapshots } from '@/products/report/preview/useReportPreviewSnapshots'
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
  previewSrc,
  selected,
  index,
  onClick,
}: {
  previewSrc?: string
  selected: boolean
  index: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl px-2 py-2 text-left transition hover:bg-black/5"
    >
      <ReportPreviewThumbnail
        alt={`Preview da página ${index + 1}`}
        height={Math.round(A4_HEIGHT * THUMB_SCALE)}
        selected={selected}
        src={previewSrc}
        width={THUMB_WIDTH}
      />
      <div className="flex justify-center px-1">
        <div
          className={`flex h-6 min-w-6 items-center justify-center rounded-sm px-2 text-[14px] font-semibold ${
            selected ? 'bg-[#0075E2] text-white' : 'text-[#6A6A68]'
          }`}
        >
          {index + 1}
        </div>
      </div>
    </button>
  )
}

function ReportCanvas({
  tree,
  zoom,
  reportElementRef,
}: {
  tree: any
  zoom: number
  reportElementRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
      <div
        ref={reportElementRef}
        className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
        style={{ width: A4_WIDTH, minWidth: A4_WIDTH, height: A4_HEIGHT }}
      >
        <Renderer tree={tree} registry={registry} />
      </div>
    </div>
  )
}

function ReportWorkspace() {
  const parsed = useMemo(() => parseDashboardTemplateDslToTree(REPORT_TEMPLATE_DSL), [])
  const { rootName, themeNode, pages } = useMemo(() => getReportStructure(parsed), [parsed])
  const [activePageId, setActivePageId] = useState('')
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [zoom, setZoom] = useState(0.9)
  const reportElementRef = useRef<HTMLDivElement | null>(null)
  const exportElementRef = useRef<HTMLDivElement | null>(null)

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
  const exportPages = useMemo(
    () =>
      pages.map((page, index) => ({
        pageId: getPageId(page, index),
        tree: buildPageRenderTree(page, themeNode),
      })),
    [pages, themeNode],
  )
  const captureKey = useMemo(
    () => `${activePageId}:${pages.length}:${Boolean(activePage)}:${Boolean(themeNode)}`,
    [activePageId, pages.length, activePage, themeNode],
  )
  const { previewsByPageId } = useReportPreviewSnapshots({
    activePageId,
    captureKey,
    reportElementRef,
  })
  const {
    activeExportPage,
    error: exportError,
    isExporting,
    startExport,
  } = useReportPdfExport({
    fileName: rootName,
    pages: exportPages,
    reportElementRef: exportElementRef,
  })

  return (
    <div className="flex h-screen flex-col bg-[#F7F7F6] tracking-[-0.03em] text-[#3F3F3D]">
      <header className="flex items-center justify-between border-b-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] px-5 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2">
            <Icon icon="solar:document-bold" className="h-4 w-4 text-[#5F5F5A]" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold text-[#1F1F1D]">{rootName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-1 flex items-center gap-1 rounded-xl border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-0">
            <button
              type="button"
              onClick={() => setActiveView('preview')}
              className={`m-[1px] flex items-center justify-center rounded-md p-2 transition ${
                activeView === 'preview'
                  ? 'bg-white text-[#1F1F1D]'
                  : 'bg-[#ECECEB] text-[#5F5F5A] hover:bg-[#E2E2E0] hover:text-[#4F4F4B]'
              }`}
            >
              <Icon icon="solar:eye-bold" className="h-4 w-4" />
              <span className="sr-only">Visualizar relatório</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('code')}
              className={`m-[1px] flex items-center justify-center rounded-md p-2 transition ${
                activeView === 'code'
                  ? 'bg-white text-[#1F1F1D]'
                  : 'bg-[#ECECEB] text-[#5F5F5A] hover:bg-[#E2E2E0] hover:text-[#4F4F4B]'
              }`}
            >
              <Icon icon="solar:code-bold" className="h-4 w-4" />
              <span className="sr-only">Visualizar DSL</span>
            </button>
          </div>
          <div className="mr-2 flex items-center gap-1 rounded-xl border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-0">
            <button
              type="button"
              onClick={() => setZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))))}
              className="m-[1px] flex items-center rounded-md bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
            >
              <Icon icon="solar:minus-square-bold" className="h-3.5 w-3.5" />
              <span className="sr-only">Zoom menos</span>
            </button>
            <span className="min-w-[56px] text-center text-xs font-medium leading-normal text-[#5F5F5A]">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.min(1.6, Number((current + 0.1).toFixed(2))))}
              className="m-[1px] flex items-center rounded-md bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
            >
              <Icon icon="solar:add-square-bold" className="h-3.5 w-3.5" />
              <span className="sr-only">Zoom mais</span>
            </button>
          </div>
          <button type="button" className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]">
            <Icon icon="solar:download-square-bold" className="h-4 w-4" />
          </button>
          <button type="button" className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]">
            <Icon icon="solar:playback-speed-bold" className="h-4 w-4" />
          </button>
          <button type="button" className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[14px] font-medium text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]">
            Invite
          </button>
          <button
            type="button"
            onClick={startExport}
            disabled={isExporting}
            className="flex items-center justify-center rounded-md bg-[#039AFE] px-2 py-[0.35rem] text-[14px] font-medium text-[#FFFFFF] transition hover:bg-[#028ae0] hover:text-[#FFFFFF] disabled:cursor-default disabled:opacity-70"
          >
            {isExporting ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[210px] shrink-0 overflow-auto border-r-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] px-3 py-4">
          <div className="space-y-4">
            {pages.map((page, index) => {
              const pageId = getPageId(page, index)
              return (
                <ReportThumbnail
                  key={pageId}
                  previewSrc={previewsByPageId[pageId]}
                  selected={pageId === activePageId}
                  index={index}
                  onClick={() => setActivePageId(pageId)}
                />
              )
            })}
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-auto border-r-[0.5px] border-[#DDDDD8] bg-[#EEEEEB]">
          {activeView === 'preview' ? (
            <div className="mx-auto flex min-h-full items-start justify-center p-8">
              {activePage ? <ReportCanvas tree={activeTree} zoom={zoom} reportElementRef={reportElementRef} /> : null}
            </div>
          ) : (
            <div className="mx-auto flex min-h-full max-w-[1280px] p-8">
              <pre className="w-full overflow-auto rounded-[16px] border-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] p-6 text-[13px] leading-6 text-[#2C2C29] shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
                <code>{REPORT_TEMPLATE_DSL}</code>
              </pre>
            </div>
          )}
        </main>
      </div>
      {exportError ? <div className="sr-only">{exportError}</div> : null}
      <ReportPdfExportStage
        height={A4_HEIGHT}
        reportElementRef={exportElementRef}
        tree={activeExportPage?.tree || null}
        width={A4_WIDTH}
      />
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

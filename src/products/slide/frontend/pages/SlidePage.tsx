'use client'

import { memo, RefObject, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

import { parseDashboardTemplateDslToTree } from '@/products/bi/json-render/parsers/dashboardTemplateDslParser'
import { DataProvider } from '@/products/bi/json-render/context'
import { registry } from '@/products/bi/json-render/registry'
import { Renderer } from '@/products/bi/json-render/renderer'
import { SlidePreviewThumbnail } from '@/products/slide/preview/SlidePreviewThumbnail'
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
      <SlidePreviewThumbnail
        alt={`Preview do slide ${index + 1}`}
        height={Math.round(SLIDE_HEIGHT * THUMB_SCALE)}
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

const SlideCanvas = memo(function SlideCanvas({
  tree,
  zoom,
  slideElementRef,
  renderKey,
}: {
  tree: any
  zoom: number
  slideElementRef: RefObject<HTMLDivElement | null>
  renderKey: string
}) {
  return (
    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
      <div
        key={renderKey}
        ref={slideElementRef}
        className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
        style={{ width: SLIDE_WIDTH, minWidth: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
      >
        <Renderer tree={tree} registry={registry} />
      </div>
    </div>
  )
})

function SlideWorkspace() {
  const parsed = useMemo(() => parseDashboardTemplateDslToTree(SLIDE_TEMPLATE_DSL), [])
  const { rootName, themeNode, pages } = useMemo(() => getSlideStructure(parsed), [parsed])
  const initialPageId = useMemo(() => (pages.length ? getPageId(pages[0], 0) : ''), [pages])
  const [activePageId, setActivePageId] = useState(initialPageId)
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [zoom, setZoom] = useState(0.82)
  const slideElementRef = useRef<HTMLDivElement | null>(null)

  const activePage = useMemo(
    () => pages.find((page, index) => getPageId(page, index) === (activePageId || initialPageId)) || pages[0] || null,
    [pages, activePageId, initialPageId],
  )

  const activeTree = useMemo(
    () => (activePage ? buildPageRenderTree(activePage, themeNode) : []),
    [activePage, themeNode],
  )
  const previewsByPageId = useMemo(() => ({} as Record<string, string>), [])

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
              <span className="sr-only">Visualizar apresentação</span>
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
              onClick={() => setZoom((current) => Math.max(0.4, Number((current - 0.1).toFixed(2))))}
              className="m-[1px] flex items-center rounded-md bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
            >
              <Icon icon="solar:minus-square-bold" className="h-3.5 w-3.5" />
              <span className="sr-only">Zoom menos</span>
            </button>
            <span className="min-w-[56px] text-center text-xs font-medium leading-normal text-[#5F5F5A]">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(2))))}
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
          <button type="button" className="flex items-center justify-center rounded-md bg-[#039AFE] px-2 py-[0.35rem] text-[14px] font-medium text-[#FFFFFF] transition hover:bg-[#028ae0] hover:text-[#FFFFFF]">
            Publish
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[210px] shrink-0 overflow-auto border-r-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] px-3 py-4">
          <div className="space-y-4">
            {pages.map((page, index) => {
              const pageId = getPageId(page, index)
              return (
                <SlideThumbnail
                  key={pageId}
                  previewSrc={previewsByPageId[pageId]}
                  selected={pageId === (activePageId || initialPageId)}
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
              {activePage ? (
                <SlideCanvas
                  key={activePageId || initialPageId}
                  tree={activeTree}
                  zoom={zoom}
                  slideElementRef={slideElementRef}
                  renderKey={activePageId || initialPageId}
                />
              ) : null}
              
            </div>
          ) : (
            <div className="mx-auto flex min-h-full max-w-[1280px] p-8">
              <pre className="w-full overflow-auto rounded-[16px] border-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] p-6 text-[13px] leading-6 text-[#2C2C29] shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
                <code>{SLIDE_TEMPLATE_DSL}</code>
              </pre>
            </div>
          )}
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

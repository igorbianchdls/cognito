'use client'

import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

import { parseDashboardTemplateDslToTree } from '@/products/bi/json-render/parsers/dashboardTemplateDslParser'
import { DataProvider } from '@/products/bi/json-render/context'
import { registry } from '@/products/bi/json-render/registry'
import { Renderer } from '@/products/bi/json-render/renderer'
import { SlidePreviewThumbnail } from '@/products/slide/preview/SlidePreviewThumbnail'
import { useSlidePreviewSnapshots } from '@/products/slide/preview/useSlidePreviewSnapshots'
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
      className="w-full rounded-2xl px-2 py-2 text-left transition hover:bg-white/10"
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
            selected ? 'bg-[#0075E2] text-white' : 'text-[#D5D8DB]'
          }`}
        >
          {index + 1}
        </div>
      </div>
    </button>
  )
}

function SlideCanvas({
  tree,
  zoom,
  slideElementRef,
}: {
  tree: any
  zoom: number
  slideElementRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
      <div
        ref={slideElementRef}
        className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
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
  const slideElementRef = useRef<HTMLDivElement | null>(null)

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
  const captureKey = useMemo(
    () => `${activePageId}:${pages.length}:${Boolean(activePage)}:${Boolean(themeNode)}`,
    [activePageId, pages.length, activePage, themeNode],
  )
  const { previewsByPageId } = useSlidePreviewSnapshots({
    activePageId,
    captureKey,
    slideElementRef,
  })

  return (
    <div className="flex h-screen flex-col bg-[#080808] tracking-[-0.03em] text-[#F2F3F4]">
      <header className="flex items-center justify-between border-b-[0.5px] border-[#1E1E1E] bg-[#080808] px-5 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center justify-center rounded-md bg-[#1B1B1B] p-2">
            <Icon icon="solar:document-bold" className="h-4 w-4 text-[#FFFFFF]" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold text-[#D8D8D8]">{rootName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2 flex items-center gap-1 rounded-xl border-[0.5px] border-[#1E1E1E] bg-[#1B1B1B] px-1 py-1">
            <button
              type="button"
              onClick={() => setZoom((current) => Math.max(0.4, Number((current - 0.1).toFixed(2))))}
              className="flex items-center rounded-md bg-[#1B1B1B] p-2 text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]"
            >
              <Icon icon="solar:minus-square-bold" className="h-3.5 w-3.5" />
              <span className="sr-only">Zoom menos</span>
            </button>
            <span className="min-w-[56px] text-center text-xs font-medium text-[#FFFFFF]">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(2))))}
              className="flex items-center rounded-md bg-[#1B1B1B] p-2 text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]"
            >
              <Icon icon="solar:add-square-bold" className="h-3.5 w-3.5" />
              <span className="sr-only">Zoom mais</span>
            </button>
          </div>
          <button type="button" className="flex items-center justify-center rounded-md bg-[#1B1B1B] p-2 text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]">
            <Icon icon="solar:chat-round-dots-bold" className="h-4 w-4" />
          </button>
          <button type="button" className="flex items-center justify-center rounded-md bg-[#1B1B1B] p-2 text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]">
            <Icon icon="solar:download-square-bold" className="h-4 w-4" />
          </button>
          <button type="button" className="flex items-center justify-center rounded-md bg-[#1B1B1B] p-2 text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]">
            <Icon icon="solar:playback-speed-bold" className="h-4 w-4" />
          </button>
          <button type="button" className="flex items-center justify-center rounded-md bg-[#1B1B1B] px-2 py-[0.35rem] text-[14px] leading-[0] font-medium text-[#FFFFFF] transition hover:bg-[#262626] hover:text-[#FFFFFF]">
            Invite
          </button>
          <button type="button" className="flex items-center justify-center rounded-md bg-[#039AFE] px-2 py-[0.35rem] text-[14px] leading-[0] font-medium text-[#FFFFFF] transition hover:bg-[#028ae0] hover:text-[#FFFFFF]">
            Publish
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[210px] shrink-0 overflow-auto border-r-[0.5px] border-[#1E1E1E] bg-[#080808] px-3 py-4">
          <div className="space-y-4">
            {pages.map((page, index) => {
              const pageId = getPageId(page, index)
              return (
                <SlideThumbnail
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

        <main className="min-h-0 flex-1 overflow-auto border-r-[0.5px] border-[#1E1E1E] bg-[#121212]">
          <div className="mx-auto flex min-h-full items-start justify-center p-8">
            {activePage ? <SlideCanvas tree={activeTree} zoom={zoom} slideElementRef={slideElementRef} /> : null}
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

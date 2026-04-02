'use client'

import { memo, RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

import { parseArtifactJsxToTree, type ArtifactTreeNode } from '@/products/artifacts/shared/artifactJsxParser'
import { DataProvider } from '@/products/bi/json-render/context'
import { SlideRenderer } from '@/products/slide/frontend/render/slideRegistry'
import { SlidePreviewThumbnail } from '@/products/slide/preview/SlidePreviewThumbnail'
import { useSlidePreviewSnapshots } from '@/products/slide/preview/useSlidePreviewSnapshots'
import { SLIDE_TEMPLATE_SOURCE } from '@/products/slide/shared/templates/slideTemplate'

type AnyRecord = Record<string, any>
type SlideTreeNode = ArtifactTreeNode

const DEFAULT_SLIDE_WIDTH = 1280
const DEFAULT_SLIDE_HEIGHT = 720
const THUMB_WIDTH = 170
const MIN_SLIDE_WIDTH = 640
const MIN_SLIDE_HEIGHT = 360

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

function getSlideDimension(page: AnyRecord | null, key: 'width' | 'height', fallback: number): number {
  if (!page || !isRecord(page.props)) return fallback
  const raw = (page.props as AnyRecord)[key]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback
}

function updateSlideSizeInTree(tree: SlideTreeNode, pageId: string, nextSize: { width?: number; height?: number }): SlideTreeNode {
  if (tree.type !== 'SlideTemplate') return tree

  const nextChildren = tree.children.map((child) => {
    if (!child || typeof child === 'string') return child
    if (child.type !== 'Slide') return child

    const props = isRecord(child.props) ? (child.props as AnyRecord) : {}
    const childPageId = typeof props.id === 'string' ? props.id.trim() : ''
    if (childPageId !== pageId) return child

    return {
      ...child,
      props: {
        ...props,
        ...(typeof nextSize.width === 'number' ? { width: nextSize.width } : {}),
        ...(typeof nextSize.height === 'number' ? { height: nextSize.height } : {}),
      },
    }
  })

  return {
    ...tree,
    children: nextChildren,
  }
}

function parseDimensionDraft(value: string, minimum: number): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return null
  return Math.max(minimum, Math.round(parsed))
}

function buildPageRenderTree(page: AnyRecord, themeNode: AnyRecord | null): any {
  const slideNode = {
    ...page,
    props: {
      ...((isRecord(page.props) ? page.props : {}) as AnyRecord),
      width: '100%',
      height: '100%',
      minHeight: '100%',
    },
  }
  if (!themeNode) return slideNode
  const themeChildren = Array.isArray(themeNode.children) ? themeNode.children : []
  return {
    ...themeNode,
    children: [...themeChildren, slideNode],
  }
}

function cloneRenderTree<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function SlideThumbnail({
  previewSrc,
  selected,
  index,
  slideHeight,
  slideWidth,
  onClick,
}: {
  previewSrc?: string
  selected: boolean
  index: number
  slideHeight: number
  slideWidth: number
  onClick: () => void
}) {
  const thumbHeight = Math.round(slideHeight * (THUMB_WIDTH / slideWidth))

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl px-2 py-2 text-left transition hover:bg-black/5"
    >
      <SlidePreviewThumbnail
        alt={`Preview do slide ${index + 1}`}
        height={thumbHeight}
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
  slideHeight,
  slideWidth,
}: {
  tree: any
  zoom: number
  slideElementRef: RefObject<HTMLDivElement | null>
  renderKey: string
  slideHeight: number
  slideWidth: number
}) {
  const [canvasHeight, setCanvasHeight] = useState(slideHeight)

  useEffect(() => {
    setCanvasHeight(slideHeight)
  }, [renderKey, slideHeight])

  useEffect(() => {
    const slideElement = slideElementRef.current
    if (!slideElement) return

    const updateHeight = () => {
      const nextHeight = Math.max(slideHeight, slideElement.scrollHeight)
      setCanvasHeight((current) => (current === nextHeight ? current : nextHeight))
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(() => {
      updateHeight()
    })

    resizeObserver.observe(slideElement)

    const frameId = window.requestAnimationFrame(() => {
      updateHeight()
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
    }
  }, [renderKey, slideElementRef, slideHeight])

  return (
    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
      <div
        key={renderKey}
        ref={slideElementRef}
        className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
        style={{
          width: slideWidth,
          minWidth: slideWidth,
          minHeight: slideHeight,
          height: canvasHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ width: '100%', height: '100%', display: 'flex', flex: 1, minWidth: 0, minHeight: 0 }}>
          <SlideRenderer tree={tree} />
        </div>
      </div>
    </div>
  )
})

function SlideWorkspace() {
  const [templateTree, setTemplateTree] = useState<SlideTreeNode | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setTemplateError(null)
        const parsed = await parseArtifactJsxToTree('slide-template.tsx', [
          { path: 'slide-template.tsx', content: SLIDE_TEMPLATE_SOURCE },
        ])
        if (parsed.kind !== 'slide') {
          throw new Error(`Template de slide retornou root inesperado: ${parsed.kind}`)
        }
        if (!cancelled) setTemplateTree(parsed.tree as SlideTreeNode)
      } catch (error) {
        if (!cancelled) {
          setTemplateTree(null)
          setTemplateError((error as Error).message || 'Falha ao carregar template de slide')
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const { rootName, themeNode, pages } = useMemo(() => getSlideStructure(templateTree), [templateTree])
  const initialPageId = useMemo(() => (pages.length ? getPageId(pages[0], 0) : ''), [pages])
  const [activePageId, setActivePageId] = useState(initialPageId)
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [zoom, setZoom] = useState(0.82)
  const [widthDraft, setWidthDraft] = useState(String(DEFAULT_SLIDE_WIDTH))
  const [heightDraft, setHeightDraft] = useState(String(DEFAULT_SLIDE_HEIGHT))
  const slideElementRef = useRef<HTMLDivElement | null>(null)

  const activePage = useMemo(
    () => pages.find((page, index) => getPageId(page, index) === (activePageId || initialPageId)) || pages[0] || null,
    [pages, activePageId, initialPageId],
  )
  const currentPageId = activePageId || initialPageId
  const activeSlideWidth = getSlideDimension(activePage, 'width', DEFAULT_SLIDE_WIDTH)
  const activeSlideHeight = getSlideDimension(activePage, 'height', DEFAULT_SLIDE_HEIGHT)
  const parsedWidthDraft = parseDimensionDraft(widthDraft, MIN_SLIDE_WIDTH)
  const parsedHeightDraft = parseDimensionDraft(heightDraft, MIN_SLIDE_HEIGHT)
  const hasPendingSizeChange =
    parsedWidthDraft !== null &&
    parsedHeightDraft !== null &&
    (parsedWidthDraft !== activeSlideWidth || parsedHeightDraft !== activeSlideHeight)

  useEffect(() => {
    setWidthDraft(String(activeSlideWidth))
    setHeightDraft(String(activeSlideHeight))
  }, [currentPageId, activeSlideWidth, activeSlideHeight])

  const activeTree = useMemo(
    () => (activePage ? cloneRenderTree(buildPageRenderTree(activePage, themeNode)) : []),
    [activePage, themeNode],
  )
  const captureKey = useMemo(
    () => `${currentPageId}:${pages.length}:${Boolean(activePage)}:${Boolean(themeNode)}:${activeSlideWidth}:${activeSlideHeight}`,
    [currentPageId, pages.length, activePage, themeNode, activeSlideWidth, activeSlideHeight],
  )
  const { previewsByPageId } = useSlidePreviewSnapshots({
    activePageId: currentPageId,
    captureKey,
    slideElementRef,
  })

  const applyActiveSlideSize = () => {
    if (parsedWidthDraft === null || parsedHeightDraft === null) return
    setTemplateTree((current) => current
      ? updateSlideSizeInTree(current, currentPageId, {
        width: parsedWidthDraft,
        height: parsedHeightDraft,
      })
      : current)
  }

  if (templateError) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F7F6] p-8 text-sm text-red-700">
        {templateError}
      </div>
    )
  }

  if (!templateTree) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F7F6] p-8 text-sm text-[#5F5F5A]">
        Carregando slide...
      </div>
    )
  }

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
          <div className="mr-2 flex items-center gap-2 rounded-xl border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-3 py-2">
            <label className="flex items-center gap-2 text-[12px] font-medium text-[#5F5F5A]">
              <span>W</span>
              <input
                type="number"
                min={MIN_SLIDE_WIDTH}
                step={10}
                value={widthDraft}
                onChange={(event) => setWidthDraft(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyActiveSlideSize()
                }}
                className="w-[72px] rounded-md border-[0.5px] border-[#D4D4CF] bg-white px-2 py-1 text-[12px] text-[#1F1F1D] outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-[12px] font-medium text-[#5F5F5A]">
              <span>H</span>
              <input
                type="number"
                min={MIN_SLIDE_HEIGHT}
                step={10}
                value={heightDraft}
                onChange={(event) => setHeightDraft(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyActiveSlideSize()
                }}
                className="w-[72px] rounded-md border-[0.5px] border-[#D4D4CF] bg-white px-2 py-1 text-[12px] text-[#1F1F1D] outline-none"
              />
            </label>
            {hasPendingSizeChange ? (
              <button
                type="button"
                onClick={applyActiveSlideSize}
                className="flex h-7 w-7 items-center justify-center rounded-md border-[0.5px] border-[#D4D4CF] bg-white text-[#245BDB] transition hover:bg-[#F4F8FF]"
                aria-label="Confirmar tamanho do slide"
              >
                <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
              </button>
            ) : null}
          </div>
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
              <span className="sr-only">Visualizar JSX</span>
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
                  slideHeight={getSlideDimension(page, 'height', DEFAULT_SLIDE_HEIGHT)}
                  slideWidth={getSlideDimension(page, 'width', DEFAULT_SLIDE_WIDTH)}
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
                  renderKey={`${currentPageId}:${activeSlideWidth}:${activeSlideHeight}`}
                  slideHeight={activeSlideHeight}
                  slideWidth={activeSlideWidth}
                />
              ) : null}
              
            </div>
          ) : (
            <div className="mx-auto flex min-h-full max-w-[1280px] p-8">
              <pre className="w-full overflow-auto rounded-[16px] border-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] p-6 text-[13px] leading-6 text-[#2C2C29] shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
                <code>{SLIDE_TEMPLATE_SOURCE}</code>
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

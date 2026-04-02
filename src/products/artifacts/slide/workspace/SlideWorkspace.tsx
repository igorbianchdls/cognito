'use client'

import { memo, RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

import { parseArtifactJsxToTree, type ArtifactTreeNode } from '@/products/artifacts/core/parser/artifactJsxParser'
import { ArtifactPreviewThumbnail } from '@/products/artifacts/core/preview/ArtifactPreviewThumbnail'
import { usePagedArtifactPreviewSnapshots } from '@/products/artifacts/core/preview/usePagedArtifactPreviewSnapshots'
import { ArtifactDocumentTitle } from '@/products/artifacts/core/workspace/components/ArtifactDocumentTitle'
import { ArtifactSizeControls } from '@/products/artifacts/core/workspace/components/ArtifactSizeControls'
import { ArtifactSourceCodePanel } from '@/products/artifacts/core/workspace/components/ArtifactSourceCodePanel'
import { ArtifactViewModeToggle } from '@/products/artifacts/core/workspace/components/ArtifactViewModeToggle'
import { ArtifactWorkspaceStatusScreen } from '@/products/artifacts/core/workspace/components/ArtifactWorkspaceStatusScreen'
import { ArtifactZoomControls } from '@/products/artifacts/core/workspace/components/ArtifactZoomControls'
import { PagedArtifactThumbnailButton } from '@/products/artifacts/core/workspace/components/PagedArtifactThumbnailButton'
import {
  buildPagedArtifactRenderTree,
  cloneArtifactTree,
  getArtifactPageId,
  getPagedArtifactDimension,
  getPagedArtifactStructure,
  parseArtifactDimensionDraft,
  updatePagedArtifactSizeInTree,
} from '@/products/artifacts/core/workspace/pagedArtifactTree'
import { SlideRenderer } from '@/products/artifacts/slide/renderer/slideRenderer'
import { SLIDE_TEMPLATE_SOURCE } from '@/products/artifacts/slide/templates/slideTemplate'
import { validateSlideTree } from '@/products/artifacts/slide/validator/validateSlideTree'

type SlideTreeNode = ArtifactTreeNode

const DEFAULT_SLIDE_WIDTH = 1280
const DEFAULT_SLIDE_HEIGHT = 720
const THUMB_WIDTH = 170
const MIN_SLIDE_WIDTH = 640
const MIN_SLIDE_HEIGHT = 360

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
    <PagedArtifactThumbnailButton selected={selected} index={index} onClick={onClick}>
      <ArtifactPreviewThumbnail
        alt={`Preview do slide ${index + 1}`}
        height={thumbHeight}
        selected={selected}
        src={previewSrc}
        width={THUMB_WIDTH}
      />
    </PagedArtifactThumbnailButton>
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

export function SlideWorkspace() {
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
        validateSlideTree(parsed.tree as SlideTreeNode)
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

  const { rootName, themeNode, pages } = useMemo(
    () => getPagedArtifactStructure(templateTree, { rootType: 'SlideTemplate', pageType: 'Slide', fallbackRootName: 'Apresentação' }),
    [templateTree],
  )
  const initialPageId = useMemo(() => (pages.length ? getArtifactPageId(pages[0], 0, 'slide') : ''), [pages])
  const [activePageId, setActivePageId] = useState(initialPageId)
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [zoom, setZoom] = useState(0.82)
  const [widthDraft, setWidthDraft] = useState(String(DEFAULT_SLIDE_WIDTH))
  const [heightDraft, setHeightDraft] = useState(String(DEFAULT_SLIDE_HEIGHT))
  const slideElementRef = useRef<HTMLDivElement | null>(null)

  const activePage = useMemo(
    () => pages.find((page, index) => getArtifactPageId(page, index, 'slide') === (activePageId || initialPageId)) || pages[0] || null,
    [pages, activePageId, initialPageId],
  )
  const currentPageId = activePageId || initialPageId
  const activeSlideWidth = getPagedArtifactDimension(activePage, 'width', DEFAULT_SLIDE_WIDTH)
  const activeSlideHeight = getPagedArtifactDimension(activePage, 'height', DEFAULT_SLIDE_HEIGHT)
  const parsedWidthDraft = parseArtifactDimensionDraft(widthDraft, MIN_SLIDE_WIDTH)
  const parsedHeightDraft = parseArtifactDimensionDraft(heightDraft, MIN_SLIDE_HEIGHT)
  const hasPendingSizeChange =
    parsedWidthDraft !== null &&
    parsedHeightDraft !== null &&
    (parsedWidthDraft !== activeSlideWidth || parsedHeightDraft !== activeSlideHeight)

  useEffect(() => {
    setWidthDraft(String(activeSlideWidth))
    setHeightDraft(String(activeSlideHeight))
  }, [currentPageId, activeSlideWidth, activeSlideHeight])

  const activeTree = useMemo(
    () => (activePage ? cloneArtifactTree(buildPagedArtifactRenderTree(activePage, themeNode)) : []),
    [activePage, themeNode],
  )
  const captureKey = useMemo(
    () => `${currentPageId}:${pages.length}:${Boolean(activePage)}:${Boolean(themeNode)}:${activeSlideWidth}:${activeSlideHeight}`,
    [currentPageId, pages.length, activePage, themeNode, activeSlideWidth, activeSlideHeight],
  )
  const { previewsByPageId } = usePagedArtifactPreviewSnapshots({
    activePageId: currentPageId,
    captureKey,
    elementRef: slideElementRef,
  })

  const applyActiveSlideSize = () => {
    if (parsedWidthDraft === null || parsedHeightDraft === null) return
    setTemplateTree((current) => current
      ? updatePagedArtifactSizeInTree(current, currentPageId, {
        width: parsedWidthDraft,
        height: parsedHeightDraft,
      }, { rootType: 'SlideTemplate', pageType: 'Slide' })
      : current)
  }

  if (templateError) {
    return <ArtifactWorkspaceStatusScreen message={templateError} tone="error" />
  }

  if (!templateTree) {
    return <ArtifactWorkspaceStatusScreen message="Carregando slide..." />
  }

  return (
    <div className="flex h-screen flex-col bg-[#F7F7F6] tracking-[-0.03em] text-[#3F3F3D]">
      <header className="flex items-center justify-between border-b-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] px-5 py-3 backdrop-blur">
        <ArtifactDocumentTitle title={rootName} />
        <div className="flex items-center gap-2">
          <ArtifactSizeControls
            minWidth={MIN_SLIDE_WIDTH}
            minHeight={MIN_SLIDE_HEIGHT}
            widthValue={widthDraft}
            heightValue={heightDraft}
            onWidthChange={setWidthDraft}
            onHeightChange={setHeightDraft}
            onApply={applyActiveSlideSize}
            hasPendingChange={hasPendingSizeChange}
            confirmAriaLabel="Confirmar tamanho do slide"
          />
          <ArtifactViewModeToggle
            activeView={activeView}
            previewLabel="Visualizar apresentação"
            onChange={setActiveView}
          />
          <ArtifactZoomControls
            zoom={zoom}
            onDecrease={() => setZoom((current) => Math.max(0.4, Number((current - 0.1).toFixed(2))))}
            onIncrease={() => setZoom((current) => Math.min(1.4, Number((current + 0.1).toFixed(2))))}
          />
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
              const pageId = getArtifactPageId(page, index, 'slide')
              return (
                <SlideThumbnail
                  key={pageId}
                  previewSrc={previewsByPageId[pageId]}
                  selected={pageId === (activePageId || initialPageId)}
                  index={index}
                  slideHeight={getPagedArtifactDimension(page, 'height', DEFAULT_SLIDE_HEIGHT)}
                  slideWidth={getPagedArtifactDimension(page, 'width', DEFAULT_SLIDE_WIDTH)}
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
            <ArtifactSourceCodePanel source={SLIDE_TEMPLATE_SOURCE} />
          )}
        </main>
      </div>
    </div>
  )
}

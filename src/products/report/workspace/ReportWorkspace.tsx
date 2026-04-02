'use client'

import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

import { parseArtifactJsxToTree, type ArtifactTreeNode } from '@/products/artifacts/core/parser/artifactJsxParser'
import { ArtifactDocumentTitle } from '@/products/artifacts/core/workspace/components/ArtifactDocumentTitle'
import { ArtifactSizeControls } from '@/products/artifacts/core/workspace/components/ArtifactSizeControls'
import { ArtifactSourceCodePanel } from '@/products/artifacts/core/workspace/components/ArtifactSourceCodePanel'
import { ArtifactViewModeToggle } from '@/products/artifacts/core/workspace/components/ArtifactViewModeToggle'
import { ArtifactWorkspaceStatusScreen } from '@/products/artifacts/core/workspace/components/ArtifactWorkspaceStatusScreen'
import { ArtifactZoomControls } from '@/products/artifacts/core/workspace/components/ArtifactZoomControls'
import { PagedArtifactThumbnailButton } from '@/products/artifacts/core/workspace/components/PagedArtifactThumbnailButton'
import {
  buildPagedArtifactRenderTree,
  getArtifactPageId,
  getPagedArtifactDimension,
  getPagedArtifactStructure,
  parseArtifactDimensionDraft,
  updatePagedArtifactSizeInTree,
} from '@/products/artifacts/core/workspace/pagedArtifactTree'
import { ReportPdfExportStage } from '@/products/report/export/ReportPdfExportStage'
import { ReportRenderer } from '@/products/report/renderer/reportRenderer'
import { validateReportTree } from '@/products/report/validator/validateReportTree'
import { useReportPdfExport } from '@/products/report/export/useReportPdfExport'
import { ReportPreviewThumbnail } from '@/products/report/preview/ReportPreviewThumbnail'
import { useReportPreviewSnapshots } from '@/products/report/preview/useReportPreviewSnapshots'
import { REPORT_TEMPLATE_SOURCE } from '@/products/report/templates/reportTemplate'

type ReportTreeNode = ArtifactTreeNode

const DEFAULT_REPORT_WIDTH = 794
const DEFAULT_REPORT_HEIGHT = 1123
const THUMB_WIDTH = 150
const MIN_REPORT_WIDTH = 480
const MIN_REPORT_HEIGHT = 640

function ReportThumbnail({
  previewSrc,
  selected,
  index,
  reportHeight,
  reportWidth,
  onClick,
}: {
  previewSrc?: string
  selected: boolean
  index: number
  reportHeight: number
  reportWidth: number
  onClick: () => void
}) {
  const thumbHeight = Math.round(reportHeight * (THUMB_WIDTH / reportWidth))

  return (
    <PagedArtifactThumbnailButton selected={selected} index={index} onClick={onClick}>
      <ReportPreviewThumbnail
        alt={`Preview da página ${index + 1}`}
        height={thumbHeight}
        selected={selected}
        src={previewSrc}
        width={THUMB_WIDTH}
      />
    </PagedArtifactThumbnailButton>
  )
}

function ReportCanvas({
  tree,
  zoom,
  reportElementRef,
  reportHeight,
  reportWidth,
}: {
  tree: any
  zoom: number
  reportElementRef: RefObject<HTMLDivElement | null>
  reportHeight: number
  reportWidth: number
}) {
  return (
    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
      <div
        ref={reportElementRef}
        className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]"
        style={{ width: reportWidth, minWidth: reportWidth, minHeight: reportHeight, height: reportHeight }}
      >
        <ReportRenderer tree={tree} />
      </div>
    </div>
  )
}

export function ReportWorkspace() {
  const [templateTree, setTemplateTree] = useState<ReportTreeNode | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setTemplateError(null)
        const parsed = await parseArtifactJsxToTree('report-template.tsx', [
          { path: 'report-template.tsx', content: REPORT_TEMPLATE_SOURCE },
        ])
        if (parsed.kind !== 'report') {
          throw new Error(`Template de report retornou root inesperado: ${parsed.kind}`)
        }
        validateReportTree(parsed.tree as ReportTreeNode)
        if (!cancelled) setTemplateTree(parsed.tree as ReportTreeNode)
      } catch (error) {
        if (!cancelled) {
          setTemplateTree(null)
          setTemplateError((error as Error).message || 'Falha ao carregar template de report')
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const { rootName, themeNode, pages } = useMemo(
    () => getPagedArtifactStructure(templateTree, { rootType: 'ReportTemplate', pageType: 'Report', fallbackRootName: 'Relatório' }),
    [templateTree],
  )
  const [activePageId, setActivePageId] = useState('')
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview')
  const [zoom, setZoom] = useState(0.9)
  const [widthDraft, setWidthDraft] = useState(String(DEFAULT_REPORT_WIDTH))
  const [heightDraft, setHeightDraft] = useState(String(DEFAULT_REPORT_HEIGHT))
  const reportElementRef = useRef<HTMLDivElement | null>(null)
  const exportElementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!pages.length) return
    const firstId = getArtifactPageId(pages[0], 0, 'page')
    setActivePageId((current) => current || firstId)
  }, [pages])

  const activePage = useMemo(
    () => pages.find((page, index) => getArtifactPageId(page, index, 'page') === activePageId) || pages[0] || null,
    [pages, activePageId],
  )
  const currentPageId = activePageId || (pages.length ? getArtifactPageId(pages[0], 0, 'page') : '')
  const activeReportWidth = getPagedArtifactDimension(activePage, 'width', DEFAULT_REPORT_WIDTH)
  const activeReportHeight = getPagedArtifactDimension(activePage, 'height', DEFAULT_REPORT_HEIGHT)
  const parsedWidthDraft = parseArtifactDimensionDraft(widthDraft, MIN_REPORT_WIDTH)
  const parsedHeightDraft = parseArtifactDimensionDraft(heightDraft, MIN_REPORT_HEIGHT)
  const hasPendingSizeChange =
    parsedWidthDraft !== null &&
    parsedHeightDraft !== null &&
    (parsedWidthDraft !== activeReportWidth || parsedHeightDraft !== activeReportHeight)

  useEffect(() => {
    setWidthDraft(String(activeReportWidth))
    setHeightDraft(String(activeReportHeight))
  }, [currentPageId, activeReportWidth, activeReportHeight])

  const activeTree = useMemo(
    () => (activePage ? buildPagedArtifactRenderTree(activePage, themeNode) : []),
    [activePage, themeNode],
  )
  const exportPages = useMemo(
    () =>
      pages.map((page, index) => ({
        pageId: getArtifactPageId(page, index, 'page'),
        tree: buildPagedArtifactRenderTree(page, themeNode),
      })),
    [pages, themeNode],
  )
  const captureKey = useMemo(
    () => `${currentPageId}:${pages.length}:${Boolean(activePage)}:${Boolean(themeNode)}:${activeReportWidth}:${activeReportHeight}`,
    [currentPageId, pages.length, activePage, themeNode, activeReportWidth, activeReportHeight],
  )
  const { previewsByPageId } = useReportPreviewSnapshots({
    activePageId: currentPageId,
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

  const applyActiveReportSize = () => {
    if (parsedWidthDraft === null || parsedHeightDraft === null) return
    setTemplateTree((current) => current
      ? updatePagedArtifactSizeInTree(current, currentPageId, {
        width: parsedWidthDraft,
        height: parsedHeightDraft,
      }, { rootType: 'ReportTemplate', pageType: 'Report' })
      : current)
  }

  if (templateError) {
    return <ArtifactWorkspaceStatusScreen message={templateError} tone="error" />
  }

  if (!templateTree) {
    return <ArtifactWorkspaceStatusScreen message="Carregando report..." />
  }

  return (
    <div className="flex h-screen flex-col bg-[#F7F7F6] tracking-[-0.03em] text-[#3F3F3D]">
      <header className="flex items-center justify-between border-b-[0.5px] border-[#DDDDD8] bg-[#F7F7F6] px-5 py-3 backdrop-blur">
        <ArtifactDocumentTitle title={rootName} />
        <div className="flex items-center gap-2">
          <ArtifactSizeControls
            minWidth={MIN_REPORT_WIDTH}
            minHeight={MIN_REPORT_HEIGHT}
            widthValue={widthDraft}
            heightValue={heightDraft}
            onWidthChange={setWidthDraft}
            onHeightChange={setHeightDraft}
            onApply={applyActiveReportSize}
            hasPendingChange={hasPendingSizeChange}
            confirmAriaLabel="Confirmar tamanho da página"
          />
          <ArtifactViewModeToggle
            activeView={activeView}
            previewLabel="Visualizar relatório"
            onChange={setActiveView}
          />
          <ArtifactZoomControls
            zoom={zoom}
            onDecrease={() => setZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))))}
            onIncrease={() => setZoom((current) => Math.min(1.6, Number((current + 0.1).toFixed(2))))}
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
              const pageId = getArtifactPageId(page, index, 'page')
              return (
                <ReportThumbnail
                  key={pageId}
                  previewSrc={previewsByPageId[pageId]}
                  selected={pageId === activePageId}
                  index={index}
                  reportHeight={getPagedArtifactDimension(page, 'height', DEFAULT_REPORT_HEIGHT)}
                  reportWidth={getPagedArtifactDimension(page, 'width', DEFAULT_REPORT_WIDTH)}
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
                <ReportCanvas
                  tree={activeTree}
                  zoom={zoom}
                  reportElementRef={reportElementRef}
                  reportHeight={activeReportHeight}
                  reportWidth={activeReportWidth}
                />
              ) : null}
            </div>
          ) : (
            <ArtifactSourceCodePanel source={REPORT_TEMPLATE_SOURCE} />
          )}
        </main>
      </div>
      {exportError ? <div className="sr-only">{exportError}</div> : null}
      <ReportPdfExportStage
        height={activeExportPage ? getPagedArtifactDimension(pages.find((page, index) => getArtifactPageId(page, index, 'page') === activeExportPage.pageId) || null, 'height', DEFAULT_REPORT_HEIGHT) : DEFAULT_REPORT_HEIGHT}
        reportElementRef={exportElementRef}
        tree={activeExportPage?.tree || null}
        width={activeExportPage ? getPagedArtifactDimension(pages.find((page, index) => getArtifactPageId(page, index, 'page') === activeExportPage.pageId) || null, 'width', DEFAULT_REPORT_WIDTH) : DEFAULT_REPORT_WIDTH}
      />
    </div>
  )
}

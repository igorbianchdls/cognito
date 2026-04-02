'use client'

import { RefObject, useEffect, useMemo, useRef, useState } from 'react'

import { captureReportPageForPdf } from '@/products/artifacts/report/export/captureReportPageForPdf'
import { exportReportToPdf } from '@/products/artifacts/report/export/exportReportToPdf'
import type { CapturedReportPageImage, ReportExportPage } from '@/products/artifacts/report/export/types'

interface UseReportPdfExportParams {
  fileName: string
  pages: ReportExportPage[]
  reportElementRef: RefObject<HTMLDivElement | null>
}

export function useReportPdfExport({
  fileName,
  pages,
  reportElementRef,
}: UseReportPdfExportParams) {
  const [activeExportIndex, setActiveExportIndex] = useState<number | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const capturedPagesRef = useRef<CapturedReportPageImage[]>([])

  const activeExportPage = useMemo(
    () => (activeExportIndex === null ? null : pages[activeExportIndex] || null),
    [activeExportIndex, pages],
  )

  useEffect(() => {
    if (!isExporting || activeExportIndex === null || !activeExportPage) return

    const reportElement = reportElementRef.current
    if (!reportElement) return

    let cancelled = false

    const timeoutId = window.setTimeout(async () => {
      try {
        const dataUrl = await captureReportPageForPdf(reportElement)
        if (cancelled) return

        capturedPagesRef.current.push({
          pageId: activeExportPage.pageId,
          dataUrl,
        })

        if (activeExportIndex >= pages.length - 1) {
          await exportReportToPdf(fileName, capturedPagesRef.current)
          if (cancelled) return
          setIsExporting(false)
          setActiveExportIndex(null)
          return
        }

        setActiveExportIndex((current) => (current === null ? null : current + 1))
      } catch {
        if (cancelled) return
        setError('Nao foi possivel exportar o PDF.')
        setIsExporting(false)
        setActiveExportIndex(null)
      }
    }, 1400)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [activeExportIndex, activeExportPage, fileName, isExporting, pages.length, reportElementRef])

  const startExport = () => {
    if (!pages.length || isExporting) return
    capturedPagesRef.current = []
    setError(null)
    setIsExporting(true)
    setActiveExportIndex(0)
  }

  return {
    activeExportPage,
    error,
    isExporting,
    startExport,
  }
}

'use client'

import PptxGenJS from 'pptxgenjs'

import type { ReportDeckModel } from '@/products/artifacts/report/model/reportModel'
import { createReportUnitConverter } from '@/products/artifacts/report/model/reportUnits'
import { renderReportPptxPage } from '@/products/artifacts/report/export/pptx/renderReportPptxPage'
import { sanitizeReportFileName } from '@/products/artifacts/report/export/pptx/reportPptxUtils'

export async function exportReportDeckToCanvaPptx(deck: ReportDeckModel, fileName?: string) {
  const firstPage = deck.pages[0]
  if (!firstPage) throw new Error('Relatorio sem paginas para exportar.')

  const unit = createReportUnitConverter(firstPage)
  const pptx = new PptxGenJS()

  pptx.author = 'Cognito'
  pptx.company = 'Cognito'
  pptx.subject = `${deck.title} - Canva import`
  pptx.title = deck.title
  pptx.defineLayout({ name: 'COGNITO_REPORT_A4', width: unit.widthIn, height: unit.heightIn })
  pptx.layout = 'COGNITO_REPORT_A4'
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
  }

  deck.pages.forEach((page) => {
    const pptxSlide = pptx.addSlide()
    renderReportPptxPage(pptxSlide, page)
  })

  await pptx.writeFile({
    fileName: fileName || `${sanitizeReportFileName(deck.title || 'report')}-canva.pptx`,
    compression: true,
  })
}

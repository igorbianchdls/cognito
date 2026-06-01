'use client'

import PptxGenJS from 'pptxgenjs'

import type { SlideDeckModel } from '@/products/artifacts/slide/model/slideModel'
import { createSlideUnitConverter, getSlideHeightIn, getSlideWidthIn } from '@/products/artifacts/slide/model/slideUnits'
import { renderPptxSlide } from '@/products/artifacts/slide/export/pptx/renderPptxSlide'
import { sanitizeFileName } from '@/products/artifacts/slide/export/pptx/pptxUtils'
import {
  hasBlockingPptxDiagnostics,
  validatePptxExportReadiness,
} from '@/products/artifacts/slide/export/pptx/validatePptxExportReadiness'

export async function exportSlideDeckToPptx(deck: SlideDeckModel, fileName?: string) {
  const diagnostics = validatePptxExportReadiness(deck)
  if (diagnostics.length) {
    console.warn('[slide-pptx-export]', diagnostics)
  }
  if (hasBlockingPptxDiagnostics(diagnostics)) {
    throw new Error('A apresentação possui erros que impedem a exportação PPTX.')
  }

  const pptx = new PptxGenJS()
  const firstSlideSize = deck.slides[0]?.size
  const width = firstSlideSize ? getSlideWidthIn(firstSlideSize) : 13.333333
  const height = firstSlideSize ? getSlideHeightIn(firstSlideSize) : 7.5

  pptx.author = 'Cognito'
  pptx.company = 'Cognito'
  pptx.subject = deck.title
  pptx.title = deck.title
  pptx.defineLayout({ name: 'COGNITO_SLIDE', width, height })
  pptx.layout = 'COGNITO_SLIDE'
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
  }

  deck.slides.forEach((slideModel) => {
    const pptxSlide = pptx.addSlide()
    renderPptxSlide(pptxSlide, {
      deck,
      pptx,
      slide: slideModel,
      unit: createSlideUnitConverter(slideModel.size),
    })
  })

  await pptx.writeFile({
    fileName: fileName || `${sanitizeFileName(deck.title || 'apresentacao')}.pptx`,
    compression: true,
  })
}

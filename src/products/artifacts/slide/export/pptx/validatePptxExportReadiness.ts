'use client'

import { getSlideComponentDefinition } from '@/products/artifacts/slide/components/slideComponentRegistry'
import type { SlideDeckModel, SlideElementModel } from '@/products/artifacts/slide/model/slideModel'
import { getStringProp, isRecord } from '@/products/artifacts/slide/export/pptx/pptxUtils'

export type PptxExportDiagnosticLevel = 'info' | 'warning' | 'error'

export type PptxExportDiagnostic = {
  code: string
  level: PptxExportDiagnosticLevel
  message: string
  slideId?: string
  elementId?: string
  component?: string
}

function hasDataQuery(element: SlideElementModel) {
  const dataQuery = element.props.dataQuery
  return isRecord(dataQuery) && typeof dataQuery.query === 'string' && dataQuery.query.trim()
}

function hasLiteralData(element: SlideElementModel) {
  return Array.isArray(element.props.data) && element.props.data.length > 0
}

function collectElementDiagnostics(
  element: SlideElementModel,
  slideId: string,
  diagnostics: PptxExportDiagnostic[],
) {
  const definition = getSlideComponentDefinition(element.sourceType)

  if (definition?.support.pptx === 'unsupported') {
    diagnostics.push({
      code: 'pptx_component_unsupported',
      component: element.sourceType,
      elementId: element.id,
      level: 'warning',
      message: `${element.sourceType} não tem exportação PPTX nativa e será tratado por fallback.`,
      slideId,
    })
  }

  if (definition?.support.pptx === 'image-fallback') {
    diagnostics.push({
      code: 'pptx_component_image_fallback',
      component: element.sourceType,
      elementId: element.id,
      level: 'info',
      message: `${element.sourceType} tem suporte parcial no PPTX.`,
      slideId,
    })
  }

  if ((element.kind === 'chart' || element.kind === 'table') && hasDataQuery(element) && !hasLiteralData(element)) {
    diagnostics.push({
      code: 'pptx_query_data_placeholder',
      component: element.sourceType,
      elementId: element.id,
      level: 'warning',
      message: `${element.sourceType} usa dataQuery sem props.data; o PPTX terá um placeholder editável.`,
      slideId,
    })
  }

  if ((element.kind === 'image' || element.kind === 'logo') && !getStringProp(element.props, 'src')) {
    diagnostics.push({
      code: 'pptx_image_missing_src',
      component: element.sourceType,
      elementId: element.id,
      level: 'error',
      message: `${element.sourceType} precisa de src para exportar imagem no PPTX.`,
      slideId,
    })
  }

  if (element.kind === 'html' && element.children.length > 0 && !element.frame) {
    diagnostics.push({
      code: 'pptx_html_layout_fallback',
      component: element.sourceType,
      elementId: element.id,
      level: 'info',
      message: `${element.sourceType} é HTML estrutural; os filhos serão exportados por fallback sem CSS completo.`,
      slideId,
    })
  }

  element.children.forEach((child) => collectElementDiagnostics(child, slideId, diagnostics))
}

export function validatePptxExportReadiness(deck: SlideDeckModel): PptxExportDiagnostic[] {
  const diagnostics: PptxExportDiagnostic[] = []

  if (!deck.slides.length) {
    diagnostics.push({
      code: 'pptx_empty_deck',
      level: 'error',
      message: 'A apresentação não possui slides para exportar.',
    })
    return diagnostics
  }

  const firstSize = deck.slides[0].size
  deck.slides.forEach((slide) => {
    if (slide.size.widthPx !== firstSize.widthPx || slide.size.heightPx !== firstSize.heightPx) {
      diagnostics.push({
        code: 'pptx_mixed_slide_sizes',
        level: 'warning',
        message: 'O PPTX usa um layout único; slides com tamanhos diferentes serão exportados no tamanho do primeiro slide.',
        slideId: slide.id,
      })
    }

    slide.elements.forEach((element) => collectElementDiagnostics(element, slide.id, diagnostics))
  })

  return diagnostics
}

export function hasBlockingPptxDiagnostics(diagnostics: PptxExportDiagnostic[]) {
  return diagnostics.some((diagnostic) => diagnostic.level === 'error')
}

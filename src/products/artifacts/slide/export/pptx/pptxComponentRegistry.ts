'use client'

import { renderPptxChart } from '@/products/artifacts/slide/export/pptx/pptxCharts'
import { renderPptxImage } from '@/products/artifacts/slide/export/pptx/pptxImages'
import { renderPptxCard, renderPptxShape, renderPptxStat } from '@/products/artifacts/slide/export/pptx/pptxShapes'
import { renderPptxTable } from '@/products/artifacts/slide/export/pptx/pptxTables'
import { renderPptxHtmlText, renderPptxText } from '@/products/artifacts/slide/export/pptx/pptxText'
import type { PptxElementRenderer } from '@/products/artifacts/slide/export/pptx/pptxTypes'

export const PPTX_COMPONENT_RENDERERS: Partial<Record<string, PptxElementRenderer>> = {
  bullets: renderPptxText,
  card: renderPptxCard,
  chart: renderPptxChart,
  footer: renderPptxText,
  html: renderPptxHtmlText,
  image: renderPptxImage,
  logo: renderPptxImage,
  shape: renderPptxShape,
  stat: renderPptxStat,
  subtitle: renderPptxText,
  table: renderPptxTable,
  textBox: renderPptxText,
  title: renderPptxText,
}

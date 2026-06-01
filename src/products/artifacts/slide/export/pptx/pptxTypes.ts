'use client'

import type PptxGenJS from 'pptxgenjs'

import type { SlideDeckModel, SlideElementModel, SlideModel } from '@/products/artifacts/slide/model/slideModel'

export type PptxPresentation = InstanceType<typeof PptxGenJS>
export type PptxSlide = PptxGenJS.Slide

export type PptxFrame = {
  x: number
  y: number
  w: number
  h: number
}

export type PptxRenderContext = {
  deck: SlideDeckModel
  pptx: PptxPresentation
  slide: SlideModel
  unit: {
    xToIn: (valuePx: number) => number
    yToIn: (valuePx: number) => number
    wToIn: (valuePx: number) => number
    hToIn: (valuePx: number) => number
    widthIn: number
    heightIn: number
  }
}

export type PptxElementRenderer = (
  pptxSlide: PptxSlide,
  element: SlideElementModel,
  context: PptxRenderContext,
  fallbackIndex: number,
) => void

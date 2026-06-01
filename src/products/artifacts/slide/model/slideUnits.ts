import type { SlideSizeModel, SlideSizePreset } from '@/products/artifacts/slide/model/slideModel'

export const DEFAULT_SLIDE_WIDTH_PX = 1280
export const DEFAULT_SLIDE_HEIGHT_PX = 720
export const PPTX_WIDE_WIDTH_IN = 13.333333
export const PPTX_WIDE_HEIGHT_IN = 7.5
export const PPTX_STANDARD_WIDTH_IN = 10
export const PPTX_STANDARD_HEIGHT_IN = 7.5

const WIDE_ASPECT_RATIO = 16 / 9
const STANDARD_ASPECT_RATIO = 4 / 3
const ASPECT_RATIO_EPSILON = 0.01

function round(value: number, decimals = 4) {
  const multiplier = 10 ** decimals
  return Math.round(value * multiplier) / multiplier
}

export function resolveSlideSizePreset(widthPx: number, heightPx: number): SlideSizePreset {
  if (!Number.isFinite(widthPx) || !Number.isFinite(heightPx) || heightPx <= 0) return 'custom'
  const aspectRatio = widthPx / heightPx
  if (Math.abs(aspectRatio - WIDE_ASPECT_RATIO) <= ASPECT_RATIO_EPSILON) return 'wide'
  if (Math.abs(aspectRatio - STANDARD_ASPECT_RATIO) <= ASPECT_RATIO_EPSILON) return 'standard'
  return 'custom'
}

export function createSlideSizeModel(
  widthPx = DEFAULT_SLIDE_WIDTH_PX,
  heightPx = DEFAULT_SLIDE_HEIGHT_PX,
): SlideSizeModel {
  const safeWidth = Number.isFinite(widthPx) && widthPx > 0 ? Math.round(widthPx) : DEFAULT_SLIDE_WIDTH_PX
  const safeHeight = Number.isFinite(heightPx) && heightPx > 0 ? Math.round(heightPx) : DEFAULT_SLIDE_HEIGHT_PX

  return {
    widthPx: safeWidth,
    heightPx: safeHeight,
    aspectRatio: round(safeWidth / safeHeight, 6),
    preset: resolveSlideSizePreset(safeWidth, safeHeight),
  }
}

export function getSlideWidthIn(size: SlideSizeModel): number {
  if (size.preset === 'standard') return PPTX_STANDARD_WIDTH_IN
  if (size.preset === 'wide') return PPTX_WIDE_WIDTH_IN
  return round(size.widthPx / 96, 4)
}

export function getSlideHeightIn(size: SlideSizeModel): number {
  if (size.preset === 'standard') return PPTX_STANDARD_HEIGHT_IN
  if (size.preset === 'wide') return PPTX_WIDE_HEIGHT_IN
  return round(size.heightPx / 96, 4)
}

export function pxToIn(valuePx: number, size: SlideSizeModel, axis: 'x' | 'y' = 'x'): number {
  const slidePx = axis === 'x' ? size.widthPx : size.heightPx
  const slideIn = axis === 'x' ? getSlideWidthIn(size) : getSlideHeightIn(size)
  if (!Number.isFinite(valuePx) || !Number.isFinite(slidePx) || slidePx <= 0) return 0
  return round((valuePx / slidePx) * slideIn, 4)
}

export function inToPx(valueIn: number, size: SlideSizeModel, axis: 'x' | 'y' = 'x'): number {
  const slidePx = axis === 'x' ? size.widthPx : size.heightPx
  const slideIn = axis === 'x' ? getSlideWidthIn(size) : getSlideHeightIn(size)
  if (!Number.isFinite(valueIn) || !Number.isFinite(slideIn) || slideIn <= 0) return 0
  return round((valueIn / slideIn) * slidePx, 2)
}

export function createSlideUnitConverter(size: SlideSizeModel) {
  return {
    widthIn: getSlideWidthIn(size),
    heightIn: getSlideHeightIn(size),
    xToIn: (valuePx: number) => pxToIn(valuePx, size, 'x'),
    yToIn: (valuePx: number) => pxToIn(valuePx, size, 'y'),
    wToIn: (valuePx: number) => pxToIn(valuePx, size, 'x'),
    hToIn: (valuePx: number) => pxToIn(valuePx, size, 'y'),
    xToPx: (valueIn: number) => inToPx(valueIn, size, 'x'),
    yToPx: (valueIn: number) => inToPx(valueIn, size, 'y'),
    wToPx: (valueIn: number) => inToPx(valueIn, size, 'x'),
    hToPx: (valueIn: number) => inToPx(valueIn, size, 'y'),
  }
}

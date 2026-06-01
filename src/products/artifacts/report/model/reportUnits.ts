export const DEFAULT_REPORT_WIDTH_PX = 794
export const DEFAULT_REPORT_HEIGHT_PX = 1123
export const REPORT_PX_PER_IN = 96

function round(value: number, decimals = 4) {
  const multiplier = 10 ** decimals
  return Math.round(value * multiplier) / multiplier
}

export function reportPxToIn(valuePx: number): number {
  if (!Number.isFinite(valuePx)) return 0
  return round(valuePx / REPORT_PX_PER_IN)
}

export function createReportUnitConverter(size: { widthPx: number; heightPx: number }) {
  return {
    widthIn: reportPxToIn(size.widthPx),
    heightIn: reportPxToIn(size.heightPx),
    xToIn: reportPxToIn,
    yToIn: reportPxToIn,
    wToIn: reportPxToIn,
    hToIn: reportPxToIn,
  }
}

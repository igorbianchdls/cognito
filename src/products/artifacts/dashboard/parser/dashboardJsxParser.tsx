'use client'

import {
  parseArtifactJsxToTree,
  type ArtifactTreeNode as DashboardTreeNode,
  type WorkspaceSourceFile,
} from '@/products/artifacts/core/parser/artifactJsxParser'
import { resolveDashboardChartPaletteColors } from '@/products/artifacts/dashboard/contract/dashboardContract'
import { validateDashboardTree } from '@/products/artifacts/dashboard/validator/validateDashboardTree'

export type { WorkspaceSourceFile }
export type { DashboardTreeNode }

export async function parseDashboardJsxToTree(entryPath: string, files: WorkspaceSourceFile[]): Promise<DashboardTreeNode> {
  const parsed = await parseArtifactJsxToTree(entryPath, files)
  if (parsed.kind !== 'dashboard') {
    throw new Error(`O parser de dashboard recebeu um artefato do tipo "${parsed.kind}"`)
  }
  const tree = parsed.tree as DashboardTreeNode
  validateDashboardTree(tree)
  return tree
}

export const compileDashboardSourceToTree = parseDashboardJsxToTree

export function getDashboardTitleFromSource(source: string, fallback = 'Dashboard') {
  const templateTitleMatch = String(source || '').match(/<DashboardTemplate\b[^>]*\btitle="([^"]+)"/)
  if (templateTitleMatch?.[1]?.trim()) return templateTitleMatch[1].trim()

  const dashboardTitleMatch = String(source || '').match(/<Dashboard\b[^>]*\btitle="([^"]+)"/)
  if (dashboardTitleMatch?.[1]?.trim()) return dashboardTitleMatch[1].trim()

  return fallback
}

export function getDashboardThemeNameFromSource(source: string, fallback = 'light') {
  const dashboardThemeMatch = String(source || '').match(/<Dashboard\b[^>]*\btheme="([^"]+)"/)
  if (dashboardThemeMatch?.[1]?.trim()) return dashboardThemeMatch[1].trim()

  const themeMatch = String(source || '').match(/<Theme\b[^>]*\bname="([^"]+)"/)
  if (themeMatch?.[1]?.trim()) return themeMatch[1].trim()

  const themeTokenMatch = String(source || '').match(/resolveDashboardThemeTokens\((['"])([^'"]+)\1\)/)
  if (themeTokenMatch?.[2]?.trim()) return themeTokenMatch[2].trim()

  const themeConstMatch = String(source || '').match(/const\s+THEME_NAME\s*=\s*['"]([^'"]+)['"]/)
  if (themeConstMatch?.[1]?.trim()) return themeConstMatch[1].trim()
  return fallback
}

export function replaceDashboardThemeNameInSource(source: string, nextThemeName: string) {
  const cleanSource = String(source || '')
  const normalizedThemeName = String(nextThemeName || '').trim()
  if (!normalizedThemeName) return cleanSource

  let nextSource = cleanSource

  if (/<Dashboard\b[^>]*\btheme=/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Dashboard\b([^>]*)\btheme=(?:"[^"]*"|\{'[^']*'\}|\{"[^"]*"\})/,
      `<Dashboard$1theme="${normalizedThemeName}"`,
    )
  } else if (/<Dashboard\b/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Dashboard\b/,
      `<Dashboard theme="${normalizedThemeName}"`,
    )
  } else if (/<Theme\b[^>]*\bname=/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Theme\b([^>]*)\bname=(?:"[^"]*"|\{'[^']*'\}|\{"[^"]*"\})/,
      `<Theme$1name="${normalizedThemeName}"`,
    )
  }

  nextSource = nextSource.replace(
    /resolveDashboardThemeTokens\((['"])[^'"]+\1\)/,
    `resolveDashboardThemeTokens('${normalizedThemeName}')`,
  )
  nextSource = nextSource.replace(
    /const key = (['"])[^'"]+\1\.toLowerCase\(\)/,
    `const key = '${normalizedThemeName}'.toLowerCase()`,
  )
  nextSource = nextSource.replace(
    /Theme ativo:\s*[^<{]+/g,
    `Theme ativo: ${normalizedThemeName}`,
  )

  if (/const\s+THEME_NAME\s*=/.test(cleanSource)) {
    nextSource = nextSource.replace(
      /const\s+THEME_NAME\s*=\s*['"][^'"]+['"]/,
      `const THEME_NAME = '${normalizedThemeName}'`,
    )
  }

  return nextSource
}

export function getDashboardChartColorsFromSource(source: string, fallback: string[] = []) {
  const dashboardPaletteMatch = String(source || '').match(/<Dashboard\b[^>]*\bchartPalette="([^"]+)"/)
  if (dashboardPaletteMatch?.[1]?.trim()) {
    return resolveDashboardChartPaletteColors(dashboardPaletteMatch[1].trim())
  }

  const themePaletteMatch = String(source || '').match(/<Theme\b[^>]*\bchartPalette="([^"]+)"/)
  if (themePaletteMatch?.[1]?.trim()) {
    return resolveDashboardChartPaletteColors(themePaletteMatch[1].trim())
  }

  const paletteNameMatch = String(source || '').match(/const\s+CHART_PALETTE\s*=\s*['"]([^'"]+)['"]/)
  if (paletteNameMatch?.[1]?.trim()) {
    return resolveDashboardChartPaletteColors(paletteNameMatch[1].trim())
  }

  const colorsMatch = String(source || '').match(/const\s+CHART_COLORS\s*=\s*(\[[\s\S]*?\])/)
  if (!colorsMatch?.[1]) return [...fallback]

  try {
    const parsed = JSON.parse(colorsMatch[1])
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')) {
      return [...parsed]
    }
  } catch {
    return [...fallback]
  }

  return [...fallback]
}

export function getDashboardChartPaletteNameFromSource(source: string, fallback: string) {
  const dashboardMatch = String(source || '').match(/<Dashboard\b[^>]*\bchartPalette="([^"]+)"/)
  if (dashboardMatch?.[1]?.trim()) return dashboardMatch[1].trim()

  const themeMatch = String(source || '').match(/<Theme\b[^>]*\bchartPalette="([^"]+)"/)
  if (themeMatch?.[1]?.trim()) return themeMatch[1].trim()

  const paletteMatch = String(source || '').match(/const\s+CHART_PALETTE\s*=\s*['"]([^'"]+)['"]/)
  if (paletteMatch?.[1]?.trim()) return paletteMatch[1].trim()
  return fallback
}

export function replaceDashboardChartPaletteNameInSource(source: string, nextPaletteName: string) {
  const cleanSource = String(source || '')
  const normalizedPaletteName = String(nextPaletteName || '').trim()
  if (!normalizedPaletteName) return cleanSource

  let nextSource = cleanSource

  if (/<Dashboard\b[^>]*\bchartPalette=/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Dashboard\b([^>]*)\bchartPalette=(?:"[^"]*"|\{'[^']*'\}|\{"[^"]*"\})/,
      `<Dashboard$1chartPalette="${normalizedPaletteName}"`,
    )
  } else if (/<Dashboard\b/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Dashboard\b/,
      `<Dashboard chartPalette="${normalizedPaletteName}"`,
    )
  } else if (/<Theme\b[^>]*\bchartPalette=/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Theme\b([^>]*)\bchartPalette=(?:"[^"]*"|\{'[^']*'\}|\{"[^"]*"\})/,
      `<Theme$1chartPalette="${normalizedPaletteName}"`,
    )
  } else if (/<Theme\b[^>]*\/>/.test(nextSource)) {
    nextSource = nextSource.replace(
      /<Theme\b([^>]*)\/>/,
      `<Theme$1 chartPalette="${normalizedPaletteName}" />`,
    )
  }

  if (/const\s+CHART_PALETTE\s*=/.test(cleanSource)) {
    nextSource = nextSource.replace(
      /const\s+CHART_PALETTE\s*=\s*['"][^'"]+['"]/,
      `const CHART_PALETTE = '${normalizedPaletteName}'`,
    )
  }

  return nextSource
}

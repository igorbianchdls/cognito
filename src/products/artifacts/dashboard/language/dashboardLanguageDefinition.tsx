'use client'

import {
  createArtifactLeafComponent,
  createArtifactPassthroughComponent,
  getArtifactRootTagName,
  sanitizeArtifactSource,
  type ArtifactLanguageDefinition,
} from '@/products/artifacts/core/language/compileArtifactJsx'
import { dashboardLanguageManifest } from '@/products/artifacts/dashboard/language/dashboardLanguageManifest'
import { resolveDashboardTemplateThemeTokens } from '@/products/artifacts/dashboard/templates/dashboardTemplateThemes'

function createDashboardRuntimeScope() {
  return Object.fromEntries([
    ...dashboardLanguageManifest.containerComponents.map((name) => [
      name,
      createArtifactPassthroughComponent(name),
    ]),
    ...dashboardLanguageManifest.leafComponents.map((name) => [
      name,
      createArtifactLeafComponent(name),
    ]),
  ])
}

function wrapDashboardSource(source: string) {
  const cleanSource = sanitizeArtifactSource(source)
  if (getArtifactRootTagName(cleanSource) !== 'Dashboard') return cleanSource

  const dashboardThemeMatch = cleanSource.match(/<Dashboard\b[^>]*\btheme="([^"]+)"/)
  const dashboardBorderPresetMatch = cleanSource.match(/<Dashboard\b[^>]*\bborderPreset="([^"]+)"/)
  const resolvedThemeName = dashboardThemeMatch?.[1]?.trim() || 'light'
  const resolvedBorderPreset = dashboardBorderPresetMatch?.[1]?.trim() || 'theme_default'
  let dashboardSource = cleanSource

  if (!dashboardThemeMatch?.[1]?.trim()) {
    dashboardSource = dashboardSource.replace(/<Dashboard\b/, `<Dashboard theme="${resolvedThemeName}"`)
  }

  return `export default function __ArtifactEntry() {
  const theme = __resolveDashboardThemeTokens(${JSON.stringify(resolvedThemeName)}, ${JSON.stringify(resolvedBorderPreset)})

  return (
    ${dashboardSource}
  )
}
`
}

export const dashboardLanguageDefinition: ArtifactLanguageDefinition = {
  kind: 'dashboard',
  rootTypes: dashboardLanguageManifest.rootTypes,
  runtimeScope: createDashboardRuntimeScope(),
  evaluatorGlobals: {
    __resolveDashboardThemeTokens: resolveDashboardTemplateThemeTokens,
  },
  wrapSource: wrapDashboardSource,
  namedExportPattern: /^Dashboard[A-Z_]/,
  resolveImport: ({ request }) => {
    if (request.startsWith('.') && /(^|\/)theme-tokens$/.test(request)) {
      return {
        handled: true,
        value: { resolveDashboardThemeTokens: resolveDashboardTemplateThemeTokens },
      }
    }
    return { handled: false }
  },
}

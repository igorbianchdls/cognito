import type { ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'
import type { SlideThemeModel } from '@/products/artifacts/slide/model/slideModel'

export const DEFAULT_SLIDE_THEME: SlideThemeModel = {
  name: 'light',
  managers: {},
  rawProps: {},
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function normalizeSlideTheme(node: ArtifactTreeNode | null | undefined): SlideThemeModel {
  if (!node || node.type !== 'Theme' || !isRecord(node.props)) {
    return {
      ...DEFAULT_SLIDE_THEME,
      managers: {},
      rawProps: {},
    }
  }

  const props = node.props
  const managers = isRecord(props.managers) ? props.managers : {}

  return {
    name: optionalString(props.name) || DEFAULT_SLIDE_THEME.name,
    headerTheme: optionalString(props.headerTheme),
    chartPalette: optionalString(props.chartPalette),
    managers,
    rawProps: props,
    rawNode: node,
  }
}

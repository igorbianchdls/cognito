'use client'

import {
  createArtifactLeafComponent,
  createArtifactPassthroughComponent,
  getArtifactRootTagName,
  sanitizeArtifactSource,
  type ArtifactLanguageDefinition,
} from '@/products/artifacts/core/language/compileArtifactJsx'
import type { ArtifactKind } from '@/products/artifacts/core/types/artifactTypes'
import { getDocumentManifest } from '@/products/artifacts/document/language/documentLanguageManifest'

function createDocumentRuntimeScope(rootName: 'Report' | 'Deck') {
  return {
    [rootName]: createArtifactPassthroughComponent(rootName),
    Chart: createArtifactLeafComponent('Chart'),
    DataTable: createArtifactLeafComponent('DataTable'),
  }
}

function wrapDocumentSource(source: string, rootName: 'Report' | 'Deck') {
  const cleanSource = sanitizeArtifactSource(source)
  if (getArtifactRootTagName(cleanSource) !== rootName) return cleanSource

  return `export default function __ArtifactEntry() {
  return (
    ${cleanSource}
  )
}
`
}

function createDocumentLanguageDefinition(kind: Extract<ArtifactKind, 'report' | 'slide'>): ArtifactLanguageDefinition {
  const manifest = getDocumentManifest(kind)
  const rootName = kind === 'report' ? 'Report' : 'Deck'

  return {
    kind,
    rootTypes: manifest.rootTypes,
    runtimeScope: createDocumentRuntimeScope(rootName),
    wrapSource: (source) => wrapDocumentSource(source, rootName),
    namedExportPattern: kind === 'report' ? /^Report[A-Z_]/ : /^Deck[A-Z_]|^Slide[A-Z_]/,
  }
}

export const reportLanguageDefinition = createDocumentLanguageDefinition('report')
export const slideLanguageDefinition = createDocumentLanguageDefinition('slide')

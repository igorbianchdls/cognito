'use client'

import {
  compileArtifactJsxToTree,
  type ArtifactTreeNode,
  type WorkspaceSourceFile,
} from '@/products/artifacts/core/language/compileArtifactJsx'
import type { ArtifactKind } from '@/products/artifacts/core/types/artifactTypes'
import {
  reportLanguageDefinition,
  slideLanguageDefinition,
} from '@/products/artifacts/document/language/documentLanguageDefinition'
import { validateDocumentTree } from '@/products/artifacts/document/language/validateDocumentTree'

type DocumentKind = Extract<ArtifactKind, 'report' | 'slide'>

export type { ArtifactTreeNode as DocumentTreeNode, WorkspaceSourceFile }

export async function parseDocumentJsxToTree(
  kind: DocumentKind,
  entryPath: string,
  files: WorkspaceSourceFile[],
): Promise<ArtifactTreeNode> {
  const definition = kind === 'report' ? reportLanguageDefinition : slideLanguageDefinition
  const parsed = await compileArtifactJsxToTree(definition, entryPath, files)
  if (parsed.kind !== kind) {
    throw new Error(`O parser de ${kind} recebeu um artefato do tipo "${parsed.kind}"`)
  }
  validateDocumentTree(parsed.tree, kind)
  return parsed.tree
}

export function getDocumentTitleFromSource(source: string, fallback: string) {
  const rootTitleMatch = String(source || '').match(/<(Report|Deck)\b[^>]*\btitle="([^"]+)"/)
  if (rootTitleMatch?.[2]?.trim()) return rootTitleMatch[2].trim()
  return fallback
}

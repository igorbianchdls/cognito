'use client'

import { compileArtifactJsxToTree } from '@/products/artifacts/core/language/compileArtifactJsx'
import { dashboardLanguageDefinition } from '@/products/artifacts/dashboard/language/dashboardLanguageDefinition'

export async function parseArtifactJsxToTree(
  entryPath: string,
  files: import('@/products/artifacts/core/types/artifactTypes').WorkspaceSourceFile[],
) {
  return compileArtifactJsxToTree(dashboardLanguageDefinition, entryPath, files)
}

export * from '@/products/artifacts/core/language/compileArtifactJsx'

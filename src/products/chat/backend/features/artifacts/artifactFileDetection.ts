import type { ArtifactType } from '@/products/chat/backend/features/artifacts/artifactStore'

export type DetectedArtifact = {
  type: ArtifactType
  title: string
  filePath: string
  metadata: Record<string, unknown>
}

function cleanTitle(value: string | null | undefined): string {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function fileNameToTitle(filePath: string): string {
  const name = filePath.split('/').pop() || filePath
  const stem = name.replace(/\.(dsl|tsx)$/i, '')
  return stem
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Artifact'
}

function extractRootAttrs(content: string): { tag: string | null; title: string | null; name: string | null } {
  const root = content.match(/<\s*(Dashboard|DashboardTemplate|Report|ReportTemplate|Slide|SlideTemplate)\b([^>]*)>/i)
  if (!root) return { tag: null, title: null, name: null }
  const attrs = root[2] || ''
  const title = attrs.match(/\btitle="([^"]+)"/i)?.[1] || null
  const name = attrs.match(/\bname="([^"]+)"/i)?.[1] || null
  return { tag: root[1] || null, title, name }
}

export function detectArtifactFromFile(filePath: string, content: string): DetectedArtifact | null {
  const normalizedPath = String(filePath || '').trim()
  if (!/\.(dsl|tsx)$/i.test(normalizedPath)) return null

  const lowerPath = normalizedPath.toLowerCase()
  const root = extractRootAttrs(content)
  let type: ArtifactType | null = null

  if (lowerPath.includes('/dashboard/')) type = 'dashboard'
  else if (lowerPath.includes('/report/')) type = 'report'
  else if (lowerPath.includes('/slide/')) type = 'slide'
  else if (root.tag === 'Dashboard' || root.tag === 'DashboardTemplate') type = 'dashboard'
  else if (root.tag === 'Report' || root.tag === 'ReportTemplate') type = 'report'
  else if (root.tag === 'Slide' || root.tag === 'SlideTemplate') type = 'slide'

  if (!type) return null

  const title = cleanTitle(root.title) || cleanTitle(root.name) || fileNameToTitle(normalizedPath)
  return {
    type,
    title,
    filePath: normalizedPath,
    metadata: {
      rootTag: root.tag,
      source: normalizedPath.toLowerCase().endsWith('.tsx') ? 'jsx' : 'dsl',
    },
  }
}

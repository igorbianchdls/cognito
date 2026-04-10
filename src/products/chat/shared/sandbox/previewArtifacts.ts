const PREVIEW_ARTIFACT_DIRS = ['/vercel/sandbox/dashboard', '/vercel/sandbox/report', '/vercel/sandbox/slide'] as const

type FsListEntry = {
  name?: string
  path: string
  type: 'file' | 'dir'
}

async function listSandboxDir(chatId: string, path: string) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'fs-list', chatId, path }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    entries?: FsListEntry[]
    error?: string
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Falha ao listar ${path}`)
  }
  return data.entries || []
}

export function getPreviewArtifactKind(path: string | null | undefined): 'tsx' | null {
  if (!path) return null
  const value = String(path).trim()
  if (!value.startsWith('/vercel/sandbox/')) return null
  if (value.endsWith('.tsx')) return 'tsx'
  return null
}

export function isSupportedPreviewPath(path: string | null | undefined): path is string {
  return getPreviewArtifactKind(path) !== null
}

export function comparePreviewPaths(a: string, b: string) {
  const aKind = getPreviewArtifactKind(a)
  const bKind = getPreviewArtifactKind(b)
  if (aKind !== bKind) {
    if (aKind === 'tsx') return -1
    if (bKind === 'tsx') return 1
  }
  return a.localeCompare(b)
}

export async function fetchPreviewArtifactPaths(chatId: string): Promise<{ paths: string[]; error: string | null }> {
  const collected: string[] = []
  let directOk = false
  let firstDirectError: string | null = null

  for (const dir of PREVIEW_ARTIFACT_DIRS) {
    try {
      const entries = await listSandboxDir(chatId, dir)
      directOk = true
      for (const entry of entries) {
        if (entry.type === 'file' && isSupportedPreviewPath(entry.path)) collected.push(entry.path)
      }
    } catch (error: any) {
      if (!firstDirectError) firstDirectError = error?.message ? String(error.message) : `Falha ao listar ${dir}`
    }
  }

  if (collected.length === 0 && directOk) {
    const visited = new Set<string>()
    const queue: string[] = ['/vercel/sandbox']
    const MAX_FILES = 500
    const MAX_DIRS = 1000
    let dirs = 0

    while (queue.length && collected.length < MAX_FILES && dirs < MAX_DIRS) {
      const dir = queue.shift()
      if (!dir) break
      dirs += 1
      try {
        const entries = await listSandboxDir(chatId, dir)
        for (const entry of entries) {
          if (entry.type === 'dir') {
            if (!visited.has(entry.path)) {
              visited.add(entry.path)
              queue.push(entry.path)
            }
            continue
          }
          if (entry.type === 'file' && isSupportedPreviewPath(entry.path)) collected.push(entry.path)
        }
      } catch (error: any) {
        const message = error?.message ? String(error.message) : `Falha ao listar ${dir}`
        return { paths: Array.from(new Set(collected)).sort(comparePreviewPaths), error: message }
      }
    }
  }

  const unique = Array.from(new Set(collected)).sort(comparePreviewPaths)
  return {
    paths: unique,
    error: unique.length === 0 ? firstDirectError : null,
  }
}

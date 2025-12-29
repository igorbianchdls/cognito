import fs from 'fs'
import path from 'path'

export type PatchOperation =
  | { kind: 'add'; file: string; content: string }
  | { kind: 'delete'; file: string }
  | { kind: 'update'; file: string; hunks: PatchHunk[]; moveTo?: string }

export type PatchHunk = {
  header?: string
  original: string[]
  replacement: string[]
  contextBefore: string[]
  contextAfter: string[]
}

export type ApplyPatchOptions = {
  dryRun?: boolean
  allowApplyInProduction?: boolean
  workspaceRoot?: string
}

export type ApplyPatchResult = {
  success: boolean
  dryRun: boolean
  applied: boolean
  files: Array<{
    path: string
    op: 'add' | 'delete' | 'update' | 'move'
    hunksApplied?: number
    changes?: number
    movedTo?: string
    error?: string
  }>
  summary: {
    added: number
    deleted: number
    updated: number
    moved: number
    totalChanges: number
  }
  errors?: string[]
}

const BEGIN = '*** Begin Patch'
const END = '*** End Patch'

// Basic parser for the stripped-down patch format used by this project.
export function parsePatch(patchText: string): PatchOperation[] {
  const lines = patchText.replace(/\r\n/g, '\n').split('\n')
  let i = 0
  // Find Begin
  while (i < lines.length && lines[i].trim() === '') i++
  if (lines[i]?.trim() !== BEGIN) {
    throw new Error('Patch must start with "*** Begin Patch"')
  }
  i++
  const ops: PatchOperation[] = []

  function expect(prefix: string): string {
    const line = lines[i]
    if (!line?.startsWith(prefix)) {
      throw new Error(`Expected line starting with ${prefix}, got: ${line ?? 'EOF'}`)
    }
    i++
    return line
  }

  function readUntilNextHeaderOrEnd(): string[] {
    const buf: string[] = []
    while (i < lines.length) {
      const l = lines[i]
      if (
        l.startsWith('*** Add File: ') ||
        l.startsWith('*** Update File: ') ||
        l.startsWith('*** Delete File: ') ||
        l.trim() === END
      ) {
        break
      }
      buf.push(l)
      i++
    }
    return buf
  }

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === END) break
    if (line.startsWith('*** Add File: ')) {
      const file = line.slice('*** Add File: '.length).trim()
      i++
      const contentLines = readUntilNextHeaderOrEnd()
      const content = contentLines
        .map((l) => {
          if (!l.startsWith('+')) return l
          return l.slice(1)
        })
        .join('\n')
      ops.push({ kind: 'add', file, content })
      continue
    }
    if (line.startsWith('*** Delete File: ')) {
      const file = line.slice('*** Delete File: '.length).trim()
      i++
      ops.push({ kind: 'delete', file })
      continue
    }
    if (line.startsWith('*** Update File: ')) {
      const file = line.slice('*** Update File: '.length).trim()
      i++
      let moveTo: string | undefined
      if (lines[i]?.startsWith('*** Move to: ')) {
        moveTo = lines[i].slice('*** Move to: '.length).trim()
        i++
      }
      const hunks: PatchHunk[] = []
      while (i < lines.length) {
        if (lines[i].trim() === END) break
        if (
          lines[i].startsWith('*** Add File: ') ||
          lines[i].startsWith('*** Update File: ') ||
          lines[i].startsWith('*** Delete File: ')
        ) {
          break
        }
        if (!lines[i].startsWith('@@')) {
          // Skip any non-hunk lines (blank or comments)
          i++
          continue
        }
        // Hunk header
        const headerLine = lines[i]
        i++
        const original: string[] = []
        const replacement: string[] = []
        const contextBefore: string[] = []
        const contextAfter: string[] = []
        let seenContent = false
        while (i < lines.length) {
          const l = lines[i]
          if (l.startsWith('@@')) break
          if (
            l.startsWith('*** Add File: ') ||
            l.startsWith('*** Update File: ') ||
            l.startsWith('*** Delete File: ') ||
            l.trim() === END
          ) {
            break
          }
          if (l === '*** End of File') { i++; break }
          if (l.length === 0 && !seenContent) { i++; continue }
          seenContent = true
          if (l.startsWith(' ')) {
            original.push(l.slice(1))
            replacement.push(l.slice(1))
            if (replacement.length === original.length) {
              // treat as context (could be before/after; we don't strictly separate)
            }
          } else if (l.startsWith('-')) {
            original.push(l.slice(1))
          } else if (l.startsWith('+')) {
            replacement.push(l.slice(1))
          } else {
            // treat as neutral context
            original.push(l)
            replacement.push(l)
          }
          i++
        }
        hunks.push({ header: headerLine, original, replacement, contextBefore, contextAfter })
      }
      ops.push({ kind: 'update', file, hunks, moveTo })
      continue
    }
    throw new Error(`Unexpected line in patch: ${line}`)
  }
  return ops
}

function isSafeRelative(p: string): boolean {
  if (!p || path.isAbsolute(p)) return false
  if (p.includes('..')) return false
  if (p.startsWith('./')) return false
  if (p.startsWith('.\\')) return false
  if (p.includes('\0')) return false
  if (p.startsWith('node_modules') || p.includes('/node_modules/')) return false
  if (p.startsWith('.git') || p.includes('/.git/')) return false
  return true
}

function resolveInWorkspace(root: string, rel: string): string {
  const abs = path.resolve(root, rel)
  if (!abs.startsWith(path.resolve(root))) {
    throw new Error(`Path escapes workspace: ${rel}`)
  }
  return abs
}

export async function applyPatch(
  patchText: string,
  opts: ApplyPatchOptions = {}
): Promise<ApplyPatchResult> {
  const dryRun = opts.dryRun !== false ? true : false
  const allowApplyInProduction = opts.allowApplyInProduction === true
  const workspaceRoot = opts.workspaceRoot || process.cwd()

  if (!dryRun && process.env.NODE_ENV === 'production' && !allowApplyInProduction) {
    return {
      success: false,
      dryRun,
      applied: false,
      files: [],
      summary: { added: 0, deleted: 0, updated: 0, moved: 0, totalChanges: 0 },
      errors: ['Apply is disabled in production']
    }
  }

  let ops: PatchOperation[]
  try {
    ops = parsePatch(patchText)
  } catch (e) {
    return {
      success: false,
      dryRun,
      applied: false,
      files: [],
      summary: { added: 0, deleted: 0, updated: 0, moved: 0, totalChanges: 0 },
      errors: [String((e as Error).message || e)]
    }
  }

  const results: ApplyPatchResult['files'] = []
  let added = 0, deleted = 0, updated = 0, moved = 0, totalChanges = 0

  for (const op of ops) {
    try {
      if (!isSafeRelative(op.file)) throw new Error(`Unsafe path: ${op.file}`)
      const abs = resolveInWorkspace(workspaceRoot, op.file)

      if (op.kind === 'add') {
        results.push({ path: op.file, op: 'add', changes: op.content.split('\n').length })
        added++
        totalChanges += op.content.split('\n').length
        if (!dryRun) {
          const dir = path.dirname(abs)
          fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(abs, op.content, 'utf8')
        }
      } else if (op.kind === 'delete') {
        results.push({ path: op.file, op: 'delete' })
        deleted++
        if (!dryRun) {
          if (fs.existsSync(abs)) fs.unlinkSync(abs)
        }
      } else if (op.kind === 'update') {
        // Handle move (rename) target safety
        let movedToAbs: string | undefined
        if (op.moveTo) {
          if (!isSafeRelative(op.moveTo)) throw new Error(`Unsafe move target: ${op.moveTo}`)
          movedToAbs = resolveInWorkspace(workspaceRoot, op.moveTo)
        }

        const originalContent = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : ''
        let newContent = originalContent
        let hunksApplied = 0
        for (const h of op.hunks) {
          const originalBlock = h.original.join('\n')
          // First try exact block replace with originalBlock
          const idx = newContent.indexOf(originalBlock)
          if (idx >= 0) {
            newContent = newContent.slice(0, idx) + h.replacement.join('\n') + newContent.slice(idx + originalBlock.length)
            hunksApplied++
            totalChanges += Math.abs(h.replacement.length - h.original.length)
            continue
          }
          // Fallback: try a loose match using only '-' and ' ' lines
          const looseOrig = h.original.join('\n')
          const lidx = newContent.indexOf(looseOrig)
          if (lidx >= 0) {
            newContent = newContent.slice(0, lidx) + h.replacement.join('\n') + newContent.slice(lidx + looseOrig.length)
            hunksApplied++
            totalChanges += Math.abs(h.replacement.length - h.original.length)
            continue
          }
          throw new Error(`Failed to apply hunk${h.header ? ` ${h.header}` : ''} in ${op.file}`)
        }

        results.push({ path: op.file, op: 'update', hunksApplied })
        updated++
        if (!dryRun) {
          fs.writeFileSync(abs, newContent, 'utf8')
          if (movedToAbs) {
            const targetDir = path.dirname(movedToAbs)
            fs.mkdirSync(targetDir, { recursive: true })
            fs.renameSync(abs, movedToAbs)
            results[results.length - 1].op = 'move'
            results[results.length - 1].movedTo = op.moveTo
            moved++
          }
        }
      }
    } catch (e) {
      results.push({ path: (op as any).file ?? 'unknown', op: 'update', error: String((e as Error).message || e) })
    }
  }

  const success = results.every((r) => !r.error)
  return {
    success,
    dryRun,
    applied: !dryRun && success,
    files: results,
    summary: { added, deleted, updated, moved, totalChanges },
    errors: success ? undefined : results.filter((r) => r.error).map((r) => `${r.path}: ${r.error}`),
  }
}


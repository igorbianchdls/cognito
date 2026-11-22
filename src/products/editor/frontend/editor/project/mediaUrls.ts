'use client'

// Real content for the editor's clips: a signed link (signed in) or the uploaded copy in this browser (demo).
// Kept outside React state so every frame of the player can read it synchronously.
import { useSyncExternalStore } from 'react'
import { getBlob } from '@/products/drive/frontend/blobs'
import { signedUrl } from '@/products/drive/frontend/remote'
import { getDriveState, remoteDrive } from '@/products/drive/frontend/store'

const urls = new Map<string, string | null>()
// Files whose link finished loading, with or without success.
const settled = new Set<string>()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

function load(fileId: string) {
  if (urls.has(fileId) || typeof window === 'undefined') return
  const f = getDriveState().files.find(x => x.id === fileId)
  if (!f?.uploaded) return // sample files and the audio library have no content: the block draws a stand-in
  urls.set(fileId, null)
  const done = (u: string | null | undefined) => { urls.set(fileId, u ?? null); settled.add(fileId); listeners.forEach(l => l()) }
  if (remoteDrive) { if (f.storagePath) void signedUrl(f.storagePath).then(done); else done(null) }
  else void getBlob(fileId).then(b => done(b ? URL.createObjectURL(b) : null))
}

/**
 * Loads the links of these files and waits for them (the export needs every file ready before the first
 * frame, or it would draw the stand-in). Files without content resolve at once.
 */
export function preloadMediaUrls(fileIds: string[]) {
  const pending = [...new Set(fileIds)].map(id => new Promise<void>(resolve => {
    load(id)
    const ready = () => settled.has(id) || !urls.has(id)
    if (ready()) { resolve(); return }
    const check = () => { if (ready()) { listeners.delete(check); resolve() } }
    listeners.add(check)
    // A link that never comes back must not hold the export forever.
    setTimeout(() => { listeners.delete(check); resolve() }, 20000)
  }))
  return Promise.all(pending).then(() => undefined)
}

/** URL of a Drive file's content, or null while it loads / when there is none. */
export function useMediaUrl(fileId: string | undefined) {
  const get = () => (fileId ? urls.get(fileId) ?? null : null)
  const url = useSyncExternalStore(subscribe, get, () => null)
  if (fileId && !urls.has(fileId)) load(fileId)
  return url
}

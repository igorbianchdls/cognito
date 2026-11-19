'use client'

// React hooks over the Spaces store and the files' contents.
import { useEffect, useState, useSyncExternalStore } from 'react'
import { getBlob } from './blobs'
import { signedUrl } from './remote'
import { getDrive, getDriveStatus, remoteDrive, seedDrive, subscribeDrive, subscribeDriveStatus, type DFile } from './store'

/** The server and the first client render see the seed; the saved copy takes over right after. */
export const useDrive = () => useSyncExternalStore(subscribeDrive, getDrive, seedDrive)
/** 'loading' while the workspace's files come from the database. */
export const useDriveStatus = () => useSyncExternalStore(subscribeDriveStatus, getDriveStatus, () => remoteDrive ? 'idle' as const : 'ready' as const)

type FileRef = Pick<DFile, 'id' | 'uploaded' | 'storagePath' | 'thumbPath'>

/**
 * URL for a file's content: a short-lived signed link when signed in, an object URL in the demo.
 * `thumb` asks for the small picture when there is one (falls back to the file itself).
 */
export function useFileUrl(file: FileRef | undefined, enabled = true, thumb = false) {
  const [url, setUrl] = useState<{ key: string; url: string; thumb: boolean } | null>(null)
  const path = remoteDrive ? (thumb && file?.thumbPath) || file?.storagePath : undefined
  const key = remoteDrive ? path ?? '' : file?.uploaded ? file.id : ''
  useEffect(() => {
    if (!key || !enabled) return
    let live = true, made: string | null = null
    if (remoteDrive) signedUrl(key).then(u => { if (live && u) setUrl({ key, url: u, thumb: !!thumb && key === file?.thumbPath }) })
    else getBlob(key).then(b => { if (live && b) { made = URL.createObjectURL(b); setUrl({ key, url: made, thumb: false }) } })
    // Revoked a bit later, so a <video> still loading never hits a dead URL.
    return () => { live = false; const u = made; if (u) setTimeout(() => URL.revokeObjectURL(u), 4000) }
  }, [key, enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  return enabled && url?.key === key ? url : null
}

/** Text content of a .txt file (first 20 000 characters). */
export async function readText(file: FileRef) {
  if (remoteDrive) {
    const u = file.storagePath && await signedUrl(file.storagePath)
    if (!u) return undefined
    const r = await fetch(u)
    return r.ok ? (await r.text()).slice(0, 20000) : undefined
  }
  const b = await getBlob(file.id)
  return b ? (await b.text()).slice(0, 20000) : undefined
}

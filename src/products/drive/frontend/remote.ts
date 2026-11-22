// The Drive in Supabase: rows in drive.drives/folders/files/favorites/recents, bytes in the private "drive" bucket.
// Pure module (no React). The store calls these; nothing here touches the in-memory state.
import { supabase } from './lib/supabase'
import type { FileKind } from './data'
import type { WorkspaceContext } from '@/products/editor/frontend/lib/sync'

export type DriveContext = WorkspaceContext
export type Row = Record<string, unknown>
const BUCKET = 'drive'

// ---------- dates: the store keeps local "YYYY-MM-DDTHH:mm" strings ----------

export const localStamp = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
export const localDay = (iso: string) => localStamp(iso).slice(0, 10)
/** Stable color for files that have no picture yet. */
const tones = ['sand', 'blue', 'rose', 'green', 'violet', 'amber']
export const toneOf = (id: string) => tones[[...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % tones.length]

// ---------- loading ----------

export async function fetchDrive(ctx: DriveContext) {
  const sb = supabase()
  const [drives, folders, files, favorites, recents] = await Promise.all([
    sb.from('drives').select('id, name, created_at').eq('workspace_id', ctx.ws).order('created_at'),
    sb.from('folders').select('id, drive_id, parent_id, name, description, tags, trashed_at, created_at, updated_at').eq('workspace_id', ctx.ws).order('created_at'),
    sb.from('files').select('id, drive_id, folder_id, name, kind, mime, size, duration, width, height, storage_path, thumb_path, tags, trashed_at, created_at, updated_at').eq('workspace_id', ctx.ws).order('created_at'),
    sb.from('favorites').select('item_type, item_id').eq('workspace_id', ctx.ws).eq('user_id', ctx.user),
    sb.from('recents').select('item_type, item_id, opened_at').eq('workspace_id', ctx.ws).eq('user_id', ctx.user),
  ])
  const err = drives.error ?? folders.error ?? files.error ?? favorites.error ?? recents.error
  if (err) throw err
  const fav = new Set((favorites.data ?? []).map(f => `${f.item_type}:${f.item_id}`))
  const opened = new Map((recents.data ?? []).map(r => [`${r.item_type}:${r.item_id}`, localStamp(r.opened_at)]))
  return {
    drives: (drives.data ?? []).map(s => ({ id: s.id as string, name: s.name as string })),
    folders: (folders.data ?? []).map(f => ({
      id: f.id, driveId: f.drive_id, parentId: f.parent_id, name: f.name, description: f.description, tags: f.tags ?? [],
      createdAt: localDay(f.created_at), updatedAt: localDay(f.updated_at),
      trashedAt: f.trashed_at ? localStamp(f.trashed_at) : undefined, favorite: fav.has(`folder:${f.id}`), openedAt: opened.get(`folder:${f.id}`),
    })),
    files: (files.data ?? []).map(f => ({
      id: f.id, driveId: f.drive_id, folderId: f.folder_id, name: f.name, kind: f.kind as FileKind, mime: f.mime, size: Number(f.size),
      duration: f.duration === null ? undefined : Number(f.duration), width: f.width, height: f.height,
      createdAt: localDay(f.created_at), updatedAt: localStamp(f.updated_at), tone: toneOf(f.id), uploaded: true,
      storagePath: f.storage_path, thumbPath: f.thumb_path ?? undefined, tags: f.tags ?? [],
      trashedAt: f.trashed_at ? localStamp(f.trashed_at) : undefined, favorite: fav.has(`file:${f.id}`), openedAt: opened.get(`file:${f.id}`),
    })),
  }
}

// ---------- writes (shared queue) ----------

// Same save queue as the editor and Social; rows go to the drive schema.
export { idle, onRemoteError, persist } from '@/products/editor/frontend/lib/sync'
export const db = () => supabase()

// ---------- storage ----------

/** "<workspace>/<file id>/<safe name>": the first segment is what the storage policies check. */
export function objectPath(ctx: DriveContext, fileId: string, name: string) {
  const safe = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').slice(-120) || 'arquivo'
  return `${ctx.ws}/${fileId}/${safe}`
}

export async function uploadObject(path: string, body: Blob, contentType?: string) {
  const { error } = await supabase().storage.from(BUCKET).upload(path, body, { contentType: contentType || body.type || 'application/octet-stream', upsert: false })
  if (error) throw error
}
export async function copyObject(from: string, to: string) {
  const { error } = await supabase().storage.from(BUCKET).copy(from, to)
  if (error) throw error
}
export async function removeObjects(paths: string[]) {
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await supabase().storage.from(BUCKET).remove(paths.slice(i, i + 100))
    if (error) throw error
  }
}

const urls = new Map<string, { url: string; until: number }>()
/** Short-lived link to a private file; reused while it is still valid. */
export async function signedUrl(path: string) {
  const hit = urls.get(path)
  if (hit && hit.until > Date.now()) return hit.url
  const { data, error } = await supabase().storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error || !data) return null
  urls.set(path, { url: data.signedUrl, until: Date.now() + 50 * 60 * 1000 })
  return data.signedUrl
}
export async function downloadObject(path: string, name: string) {
  const { data, error } = await supabase().storage.from(BUCKET).createSignedUrl(path, 60, { download: name })
  if (error || !data) return false
  const a = document.createElement('a')
  a.href = data.signedUrl; a.download = name; a.click()
  return true
}

// ---------- thumbnails, made in the browser at upload time ----------

/** JPEG up to 480 px for images and videos (a frame near the start); null when the browser can't read it. */
export function makeThumb(file: Blob, kind: FileKind): Promise<Blob | null> {
  if (kind !== 'image' && kind !== 'video') return Promise.resolve(null)
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    let settled = false
    const finish = (b: Blob | null) => { if (settled) return; settled = true; URL.revokeObjectURL(url); resolve(b) }
    const draw = (src: CanvasImageSource, w: number, h: number) => {
      if (!w || !h) return finish(null)
      const scale = Math.min(1, 480 / Math.max(w, h))
      const c = document.createElement('canvas')
      c.width = Math.round(w * scale); c.height = Math.round(h * scale)
      const g = c.getContext('2d')
      if (!g) return finish(null)
      try { g.drawImage(src, 0, 0, c.width, c.height); c.toBlob(b => finish(b), 'image/jpeg', 0.8) } catch { finish(null) }
    }
    setTimeout(() => finish(null), 15000)
    if (kind === 'image') {
      const img = new Image()
      img.onload = () => draw(img, img.naturalWidth, img.naturalHeight)
      img.onerror = () => finish(null)
      img.src = url
    } else {
      const v = document.createElement('video')
      v.muted = true; v.playsInline = true; v.preload = 'auto'
      v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 0) / 4) }
      v.onseeked = () => draw(v, v.videoWidth, v.videoHeight)
      v.onerror = () => finish(null)
      v.src = url
    }
  })
}

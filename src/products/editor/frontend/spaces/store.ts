// Spaces, folders and files with trash, favorites and recents.
// Signed in (Supabase configured), the state mirrors the workspace's rows: every action updates the screen at once
// and saves in the background; a failed save reloads from the database. Without Supabase it is the offline demo
// kept in this browser (localStorage + IndexedDB).
import { supabaseConfigured } from '@/products/editor/frontend/lib/supabase'
import { files as seedFiles, folders as seedFolders, spaces as seedSpaces, type FileKind, type Folder, type MediaFile, type Space } from './data'
import { deleteBlob, putBlob, copyBlob } from './blobs'
import { copyObject, db, fetchDrive, idle, makeThumb, objectPath, onRemoteError, persist, removeObjects, toneOf, uploadObject, type DriveContext } from './remote'

export type DFile = MediaFile & { trashedAt?: string; favorite?: boolean; uploaded?: boolean; mime?: string; openedAt?: string; updatedAt?: string; storagePath?: string; thumbPath?: string; tags?: string[] }
export type DFolder = Folder & { trashedAt?: string; favorite?: boolean; openedAt?: string }
export type Drive = { spaces: Space[]; folders: DFolder[]; files: DFile[] }
export type Item = { type: 'folder'; folder: DFolder } | { type: 'file'; file: DFile }

/** True when Spaces live in Supabase; false for the offline demo. */
export const remoteDrive = supabaseConfigured
const KEY = 'otto-editor-drive-v1'
const empty: Drive = { spaces: [], folders: [], files: [] }
const seed: Drive = remoteDrive ? empty : { spaces: seedSpaces, folders: seedFolders, files: seedFiles }
let state: Drive = seed
let loaded = false
const listeners = new Set<() => void>()

function ensure() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  if (remoteDrive) return
  try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw) } catch { /* keeps the seed */ }
}
function commit(next: Drive) {
  state = next
  if (!remoteDrive) try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage full or blocked */ }
  listeners.forEach(l => l())
}
export const subscribeDrive = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export const getDrive = () => { ensure(); return state }
export const seedDrive = () => seed

// ---------- connection to the workspace (remote mode) ----------

let ctx: DriveContext | null = null
let status: 'idle' | 'loading' | 'ready' | 'error' = remoteDrive ? 'idle' : 'ready'
let loadedAt = 0
const statusListeners = new Set<() => void>()
const setStatus = (s: typeof status) => { status = s; statusListeners.forEach(l => l()) }
export const subscribeDriveStatus = (l: () => void) => { statusListeners.add(l); return () => { statusListeners.delete(l) } }
/** 'ready' once the workspace's files are on screen (always ready in the demo). */
export const getDriveStatus = () => status

/** Loads the workspace (called after sign-in) and keeps it fresh when the tab comes back. */
export async function connectDrive(next: DriveContext) {
  const first = ctx?.ws !== next.ws
  ctx = next
  if (first) { commit(empty); setStatus('loading') }
  await reloadDrive()
}
export async function reloadDrive() {
  if (!ctx) return
  const c = ctx
  try {
    const d = await fetchDrive(c)
    if (ctx !== c) return
    commit(d); loadedAt = Date.now(); setStatus('ready')
  } catch { if (status !== 'ready') setStatus('error') }
}
if (remoteDrive && typeof window !== 'undefined') {
  // Someone else may have changed the workspace meanwhile; never overwrite saves still on their way.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && idle() && Date.now() - loadedAt > 30000) void reloadDrive() })
  onRemoteError(() => { void reloadDrive() })
}
const remote = (run: (c: DriveContext) => PromiseLike<{ error: unknown }> | Promise<void>) => {
  if (!remoteDrive || !ctx) return Promise.resolve()
  const c = ctx
  return persist(() => run(c))
}
const iso = () => new Date().toISOString()

const now = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
const today = () => now().slice(0, 10)
const uid = (p: string) => remoteDrive ? crypto.randomUUID() : p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// ---------- selectors ----------

export const itemKey = (i: Item) => i.type === 'folder' ? `d:${i.folder.id}` : `f:${i.file.id}`

/** Ancestors from the root down to (and including) the folder. */
export function folderPath(d: Drive, folderId: string | null): DFolder[] {
  const out: DFolder[] = []
  let f = d.folders.find(x => x.id === folderId)
  while (f) { out.unshift(f); f = d.folders.find(x => x.id === f!.parentId) }
  return out
}

/** Trashed itself or inside a trashed folder. */
export const folderGone = (d: Drive, folderId: string | null) => folderPath(d, folderId).some(f => f.trashedAt)
export const fileGone = (d: Drive, f: DFile) => !!f.trashedAt || folderGone(d, f.folderId)

export const childFolders = (d: Drive, spaceId: string, parentId: string | null) =>
  d.folders.filter(f => f.spaceId === spaceId && f.parentId === parentId && !f.trashedAt)
export const childFiles = (d: Drive, spaceId: string, folderId: string | null) =>
  d.files.filter(f => f.spaceId === spaceId && f.folderId === folderId && !f.trashedAt)

/** Every folder id under `folderId`, including itself. */
export function descendants(d: Drive, folderId: string): string[] {
  const out = [folderId]
  for (let i = 0; i < out.length; i++) out.push(...d.folders.filter(f => f.parentId === out[i]).map(f => f.id))
  return out
}

export const liveFiles = (d: Drive) => d.files.filter(f => !fileGone(d, f))
export const liveFolders = (d: Drive) => d.folders.filter(f => !folderGone(d, f.id))
export function folderStats(d: Drive, folderId: string) {
  const ids = new Set(descendants(d, folderId))
  const list = d.files.filter(f => f.folderId && ids.has(f.folderId) && !f.trashedAt)
  return { files: list.length, folders: ids.size - 1, size: list.reduce((v, f) => v + f.size, 0) }
}
export function spaceStats(d: Drive, spaceId: string) {
  const list = liveFiles(d).filter(f => f.spaceId === spaceId)
  return { files: list.length, folders: liveFolders(d).filter(f => f.spaceId === spaceId).length, size: list.reduce((v, f) => v + f.size, 0) }
}
/** Folder name with its path, for pickers: "Reels publicados / Série ChatGPT". */
export const folderLabel = (d: Drive, folderId: string | null) => folderPath(d, folderId).map(f => f.name).join(' / ')

export function kindOf(mime: string, name: string): FileKind {
  if (mime.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(name)) return 'video'
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return 'image'
  if (mime.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg)$/i.test(name)) return 'audio'
  return 'text'
}

// ---------- actions ----------

const touchFolders = (d: Drive, ids: (string | null)[]) => d.folders.map(f => ids.includes(f.id) ? { ...f, updatedAt: today() } : f)

export function createSpace(name: string) {
  const d = getDrive(), id = uid('s')
  commit({ ...d, spaces: [...d.spaces, { id, name }] })
  void remote(c => db().from('spaces').insert({ id, workspace_id: c.ws, name }))
  return id
}
export const renameSpace = (id: string, name: string) => {
  const d = getDrive(); commit({ ...d, spaces: d.spaces.map(s => s.id === id ? { ...s, name } : s) })
  void remote(() => db().from('spaces').update({ name }).eq('id', id))
}
/** Only empty spaces can be deleted; everything else goes through the trash. */
export function deleteSpace(id: string) {
  const d = getDrive()
  if (d.folders.some(f => f.spaceId === id) || d.files.some(f => f.spaceId === id)) return false
  commit({ ...d, spaces: d.spaces.filter(s => s.id !== id) })
  void remote(() => db().from('spaces').delete().eq('id', id))
  return true
}

export function createFolder(spaceId: string, parentId: string | null, name: string) {
  const d = getDrive(), id = uid('d')
  const folder: DFolder = { id, spaceId, parentId, name, description: '', tags: [], createdAt: today(), updatedAt: today() }
  commit({ ...d, folders: [...touchFolders(d, [parentId]), folder] })
  void remote(c => db().from('folders').insert({ id, workspace_id: c.ws, space_id: spaceId, parent_id: parentId, name }))
  return id
}

export function rename(item: Item, name: string) {
  const d = getDrive()
  if (item.type === 'folder') commit({ ...d, folders: d.folders.map(f => f.id === item.folder.id ? { ...f, name, updatedAt: today() } : f) })
  else commit({ ...d, files: d.files.map(f => f.id === item.file.id ? { ...f, name, updatedAt: now() } : f) })
  void remote(() => db().from(item.type === 'folder' ? 'folders' : 'files').update({ name }).eq('id', item.type === 'folder' ? item.folder.id : item.file.id))
}

/** Moves items into a space root or folder. A folder can't go inside itself or its children. */
export function moveItems(items: Item[], spaceId: string, folderId: string | null) {
  const d = getDrive()
  const blocked = new Set(items.flatMap(i => i.type === 'folder' ? descendants(d, i.folder.id) : []))
  if (folderId && blocked.has(folderId)) return false
  const folderIds = new Set(items.filter(i => i.type === 'folder').map(i => (i as { folder: DFolder }).folder.id))
  const fileIds = new Set(items.filter(i => i.type === 'file').map(i => (i as { file: DFile }).file.id))
  // Moving a folder to another space carries its whole subtree and files along.
  const subtree = new Set([...folderIds].flatMap(id => descendants(d, id)))
  commit({
    ...d,
    folders: touchFolders(d, [folderId]).map(f => folderIds.has(f.id) ? { ...f, spaceId, parentId: folderId, updatedAt: today() } : subtree.has(f.id) ? { ...f, spaceId } : f),
    files: d.files.map(f => fileIds.has(f.id) ? { ...f, spaceId, folderId, updatedAt: now() } : f.folderId && subtree.has(f.folderId) ? { ...f, spaceId } : f),
  })
  void remote(async () => {
    const sb = db()
    const steps = [
      folderIds.size && sb.from('folders').update({ space_id: spaceId, parent_id: folderId }).in('id', [...folderIds]),
      subtree.size && sb.from('folders').update({ space_id: spaceId }).in('id', [...subtree]),
      fileIds.size && sb.from('files').update({ space_id: spaceId, folder_id: folderId }).in('id', [...fileIds]),
      subtree.size && sb.from('files').update({ space_id: spaceId }).in('folder_id', [...subtree]),
    ]
    for (const step of steps) if (step) { const { error } = await step; if (error) throw error }
  })
  return true
}

export function duplicateFiles(ids: string[]) {
  const d = getDrive()
  const copies = d.files.filter(f => ids.includes(f.id)).map(f => {
    const id = uid('f'), dot = f.name.lastIndexOf('.')
    const name = dot > 0 ? `${f.name.slice(0, dot)} (cópia)${f.name.slice(dot)}` : `${f.name} (cópia)`
    if (f.uploaded && !remoteDrive) void copyBlob(f.id, id)
    const storagePath = remoteDrive && ctx && f.storagePath ? objectPath(ctx, id, name) : undefined
    const thumbPath = storagePath && f.thumbPath ? `${storagePath.slice(0, storagePath.lastIndexOf('/'))}/thumb.jpg` : undefined
    return { ...f, id, name, favorite: false, createdAt: today(), updatedAt: now(), openedAt: undefined, storagePath, thumbPath, _from: f }
  }).map(({ _from, ...copy }) => {
    void remote(async c => {
      if (_from.storagePath && copy.storagePath) await copyObject(_from.storagePath, copy.storagePath)
      if (_from.thumbPath && copy.thumbPath) await copyObject(_from.thumbPath, copy.thumbPath)
      const { error } = await db().from('files').insert(fileRow(c, copy))
      if (error) throw error
    })
    return copy
  })
  commit({ ...d, files: [...d.files, ...copies] })
  return copies.map(c => c.id)
}

export function trashItems(items: Item[]) {
  const d = getDrive(), at = now()
  const fo = new Set(items.flatMap(i => i.type === 'folder' ? [i.folder.id] : [])), fi = new Set(items.flatMap(i => i.type === 'file' ? [i.file.id] : []))
  commit({ ...d, folders: d.folders.map(f => fo.has(f.id) ? { ...f, trashedAt: at } : f), files: d.files.map(f => fi.has(f.id) ? { ...f, trashedAt: at } : f) })
  setTrashed(fo, fi, iso())
}
function setTrashed(fo: Set<string>, fi: Set<string>, value: string | null) {
  void remote(async () => {
    if (fo.size) { const { error } = await db().from('folders').update({ trashed_at: value }).in('id', [...fo]); if (error) throw error }
    if (fi.size) { const { error } = await db().from('files').update({ trashed_at: value }).in('id', [...fi]); if (error) throw error }
  })
}

export function restoreItems(items: Item[]) {
  const d = getDrive()
  const fo = new Set(items.flatMap(i => i.type === 'folder' ? [i.folder.id] : [])), fi = new Set(items.flatMap(i => i.type === 'file' ? [i.file.id] : []))
  commit({ ...d, folders: d.folders.map(f => fo.has(f.id) ? { ...f, trashedAt: undefined } : f), files: d.files.map(f => fi.has(f.id) ? { ...f, trashedAt: undefined } : f) })
  setTrashed(fo, fi, null)
}

/** Removes for good, including subfolders, their files and stored uploads. */
export function deleteForever(items: Item[]) {
  const d = getDrive()
  const folderIds = new Set(items.flatMap(i => i.type === 'folder' ? descendants(d, i.folder.id) : []))
  const fileIds = new Set(items.flatMap(i => i.type === 'file' ? [i.file.id] : []))
  const gone = d.files.filter(f => fileIds.has(f.id) || (f.folderId && folderIds.has(f.folderId)))
  if (!remoteDrive) gone.filter(f => f.uploaded).forEach(f => void deleteBlob(f.id))
  const goneIds = new Set(gone.map(f => f.id))
  commit({ ...d, folders: d.folders.filter(f => !folderIds.has(f.id)), files: d.files.filter(f => !goneIds.has(f.id)) })
  void remote(async () => {
    // Rows first (subfolders and their files go with the folder), then the bytes.
    if (goneIds.size) { const { error } = await db().from('files').delete().in('id', [...goneIds]); if (error) throw error }
    if (folderIds.size) { const { error } = await db().from('folders').delete().in('id', [...folderIds]); if (error) throw error }
    const fav = [...goneIds, ...folderIds]
    if (fav.length) { await db().from('favorites').delete().in('item_id', fav); await db().from('recents').delete().in('item_id', fav) }
    const paths = gone.flatMap(f => [f.storagePath, f.thumbPath, f.storagePath && `${f.storagePath.slice(0, f.storagePath.lastIndexOf('/'))}/proxy.mp4`]).filter((p): p is string => !!p)
    if (paths.length) await removeObjects(paths)
  })
}

/** Top-level trashed items: a trashed folder shows once, not each file inside it. */
export function trashed(d: Drive): Item[] {
  const folders = d.folders.filter(f => f.trashedAt && !folderPath(d, f.parentId).some(p => p.trashedAt))
  const files = d.files.filter(f => f.trashedAt && !folderGone(d, f.folderId))
  return [...folders.map(folder => ({ type: 'folder' as const, folder })), ...files.map(file => ({ type: 'file' as const, file }))]
}
export const emptyTrash = () => deleteForever(trashed(getDrive()))

export function setFavorite(items: Item[], favorite: boolean) {
  const d = getDrive()
  const fo = new Set(items.flatMap(i => i.type === 'folder' ? [i.folder.id] : [])), fi = new Set(items.flatMap(i => i.type === 'file' ? [i.file.id] : []))
  commit({ ...d, folders: d.folders.map(f => fo.has(f.id) ? { ...f, favorite } : f), files: d.files.map(f => fi.has(f.id) ? { ...f, favorite } : f) })
  const rows = [...[...fo].map(id => ['folder', id]), ...[...fi].map(id => ['file', id])]
  void remote(c => favorite
    ? db().from('favorites').upsert(rows.map(([item_type, item_id]) => ({ user_id: c.user, workspace_id: c.ws, item_type, item_id })), { onConflict: 'user_id,item_type,item_id', ignoreDuplicates: true })
    : db().from('favorites').delete().eq('user_id', c.user).in('item_id', rows.map(r => r[1])))
}

export function markOpened(item: Item) {
  const d = getDrive(), at = now()
  if (item.type === 'folder') commit({ ...d, folders: d.folders.map(f => f.id === item.folder.id ? { ...f, openedAt: at } : f) })
  else commit({ ...d, files: d.files.map(f => f.id === item.file.id ? { ...f, openedAt: at } : f) })
  void remote(c => db().from('recents').upsert({ user_id: c.user, workspace_id: c.ws, item_type: item.type, item_id: item.type === 'folder' ? item.folder.id : item.file.id, opened_at: iso() }, { onConflict: 'user_id,item_type,item_id' }))
}

const fileRow = (c: DriveContext, f: DFile) => ({
  id: f.id, workspace_id: c.ws, space_id: f.spaceId, folder_id: f.folderId, name: f.name, kind: f.kind, mime: f.mime ?? '', size: f.size,
  duration: f.duration ?? null, width: f.width, height: f.height, storage_path: f.storagePath ?? '', thumb_path: f.thumbPath ?? null, tags: f.tags ?? [],
})

export const isFavorite = (i: Item) => i.type === 'folder' ? !!i.folder.favorite : !!i.file.favorite

// ---------- uploads ----------

const tones = ['sand', 'blue', 'rose', 'green', 'violet', 'amber']

/** Reads duration and size of a video, audio or image in the browser. */
function readMeta(file: File, kind: FileKind): Promise<{ duration?: number; width: number; height: number }> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    let settled = false
    const done = (m: { duration?: number; width: number; height: number }) => { if (settled) return; settled = true; URL.revokeObjectURL(url); resolve(m) }
    // Some formats (HEVC .mov in some browsers) never load here; the upload goes on without the details.
    setTimeout(() => done({ width: 0, height: 0 }), 10000)
    if (kind === 'image') {
      const img = new Image()
      img.onload = () => done({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => done({ width: 0, height: 0 })
      img.src = url
    } else if (kind === 'video' || kind === 'audio') {
      const el = document.createElement(kind)
      el.preload = 'metadata'
      el.onloadedmetadata = () => done({ duration: Number.isFinite(el.duration) ? Math.round(el.duration) : undefined, width: (el as HTMLVideoElement).videoWidth ?? 0, height: (el as HTMLVideoElement).videoHeight ?? 0 })
      el.onerror = () => done({ width: 0, height: 0 })
      el.src = url
    } else done({ width: 0, height: 0 })
  })
}

/**
 * Adds files from the computer. With folder uploads (webkitRelativePath), recreates the subfolders.
 * Signed in, the bytes (and a thumbnail made here) go to the private bucket before the row is saved;
 * in the demo they go to IndexedDB so previews survive a reload.
 */
export async function uploadFiles(list: File[], spaceId: string, folderId: string | null): Promise<string[]> {
  if (remoteDrive && !ctx) throw new Error('workspace not loaded')
  const ids: string[] = []
  const folderFor = new Map<string, string | null>([['', folderId]])
  const ensureFolder = (path: string): string | null => {
    if (folderFor.has(path)) return folderFor.get(path)!
    const cut = path.lastIndexOf('/')
    const parent = ensureFolder(cut < 0 ? '' : path.slice(0, cut))
    const name = cut < 0 ? path : path.slice(cut + 1)
    const existing = childFolders(getDrive(), spaceId, parent).find(f => f.name === name)
    const id = existing?.id ?? createFolder(spaceId, parent, name)
    folderFor.set(path, id)
    return id
  }
  for (const file of list) {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? ''
    const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : ''
    const target = ensureFolder(dir)
    const kind = kindOf(file.type, file.name)
    const meta = await readMeta(file, kind)
    const id = uid('f')
    let storagePath: string | undefined, thumbPath: string | undefined
    if (remoteDrive && ctx) {
      const c = ctx
      storagePath = objectPath(c, id, file.name)
      await uploadObject(storagePath, file, file.type)
      const thumb = await makeThumb(file, kind)
      if (thumb) {
        const path = `${storagePath.slice(0, storagePath.lastIndexOf('/'))}/thumb.jpg`
        try { await uploadObject(path, thumb, 'image/jpeg'); thumbPath = path } catch { /* the file is what matters */ }
      }
    } else await putBlob(id, file)
    const d = getDrive()
    const entry: DFile = { id, spaceId, folderId: target, name: file.name, kind, size: file.size, duration: meta.duration, width: meta.width, height: meta.height, createdAt: today(), updatedAt: now(), tone: remoteDrive ? toneOf(id) : tones[d.files.length % tones.length], uploaded: true, mime: file.type, storagePath, thumbPath }
    commit({ ...d, folders: touchFolders(d, [target]), files: [...d.files, entry] })
    if (remoteDrive) await remote(c => db().from('files').insert(fileRow(c, entry)))
    ids.push(id)
  }
  return ids
}

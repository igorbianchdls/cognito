'use client'

// Posts with create, edit, duplicate and reschedule.
// Signed in, they are the workspace's rows (posts + post_files + post_accounts): the screen updates at once and
// saves in the background; a failed save reloads from the database. Without Supabase, the offline demo in this browser.
import { useSyncExternalStore } from 'react'
import { db, localStamp, must, onRemoteError, persist, remoteMode, toIso, workspaceReady, type WorkspaceContext } from '@/products/social/frontend/lib/sync'
import { initialPosts, type Post, type PostStatus } from './data'

const KEY = 'otto-social-posts-v1'
const seed: Post[] = remoteMode ? [] : initialPosts
let posts: Post[] = seed
let loaded = false
const listeners = new Set<() => void>()

function ensure() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  if (remoteMode) return
  try { const raw = localStorage.getItem(KEY); if (raw) posts = JSON.parse(raw) } catch { /* keeps the sample data */ }
}
function commit(next: Post[]) {
  posts = next
  if (!remoteMode) try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage full or blocked */ }
  listeners.forEach(l => l())
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const getPosts = () => { ensure(); return posts }
const serverPosts = () => seed

export const newPostId = () => remoteMode ? crypto.randomUUID() : `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
/** Local date and time as YYYY-MM-DDTHH:mm. */
export const nowStamp = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }

// ---------- database ----------

let ctx: WorkspaceContext | null = null
type PostRow = { id: string; caption: string; format: Post['format']; status: PostStatus; scheduled_at: string | null; published_at: string | null; created_at: string
  post_files: { file_id: string; position: number }[]; post_accounts: { account_id: string; url: string | null; metrics: Post['metrics'] | Record<string, never> }[] }

const fromRow = (r: PostRow): Post => {
  const withUrl = r.post_accounts.find(a => a.url)
  const withMetrics = r.post_accounts.find(a => a.metrics && 'views' in a.metrics)
  return {
    id: r.id, caption: r.caption, format: r.format, status: r.status,
    date: localStamp(r.status === 'publicado' && r.published_at ? r.published_at : r.scheduled_at ?? r.created_at),
    fileIds: [...r.post_files].sort((a, b) => a.position - b.position).map(f => f.file_id),
    accountIds: r.post_accounts.map(a => a.account_id),
    url: withUrl?.url ?? undefined, metrics: withMetrics?.metrics as Post['metrics'],
  }
}

/** Loads the workspace's posts (called after sign-in and when the workspace changes). */
export async function connectPosts(next: WorkspaceContext) {
  if (ctx?.ws !== next.ws) commit([])
  ctx = next
  await reloadPosts()
}
export async function reloadPosts() {
  if (!ctx) return
  const c = ctx
  const { data, error } = await db().from('posts')
    .select('id, caption, format, status, scheduled_at, published_at, created_at, post_files (file_id, position), post_accounts (account_id, url, metrics)')
    .eq('workspace_id', c.ws).order('created_at')
  if (error || ctx !== c) return
  commit((data as unknown as PostRow[]).map(fromRow))
}
if (remoteMode && typeof window !== 'undefined') onRemoteError(() => { void reloadPosts() })

const remote = (run: (c: WorkspaceContext) => Promise<void>) => { if (remoteMode) void persist(async () => run(ctx ?? await workspaceReady())) }

/** The post row, its files in order and its networks: replaced together. */
function writePost(p: Post) {
  remote(async c => {
    const sb = db()
    await must(sb.from('posts').upsert({
      id: p.id, workspace_id: c.ws, caption: p.caption, format: p.format, status: p.status,
      scheduled_at: p.date ? toIso(p.date) : null, published_at: p.status === 'publicado' && p.date ? toIso(p.date) : null,
    }))
    await must(sb.from('post_files').delete().eq('post_id', p.id))
    if (p.fileIds.length) await must(sb.from('post_files').insert(p.fileIds.map((file_id, position) => ({ post_id: p.id, file_id, position }))))
    await must(sb.from('post_accounts').delete().eq('post_id', p.id))
    if (p.accountIds.length) await must(sb.from('post_accounts').insert(p.accountIds.map(account_id => ({
      post_id: p.id, account_id, status: p.status, url: p.url ?? null, metrics: p.metrics ?? {},
      published_at: p.status === 'publicado' && p.date ? toIso(p.date) : null,
    }))))
  })
}

// ---------- actions ----------

export const savePost = (p: Post) => {
  const list = getPosts()
  commit(list.some(x => x.id === p.id) ? list.map(x => x.id === p.id ? p : x) : [...list, p])
  writePost(p)
}
export const deletePost = (id: string) => {
  commit(getPosts().filter(p => p.id !== id))
  remote(() => must(db().from('posts').delete().eq('id', id)))
}
export const restorePost = (p: Post) => { commit([...getPosts().filter(x => x.id !== p.id), p]); writePost(p) }

/** Copy as a draft (no link, no metrics), so it can be edited and scheduled again. */
export function duplicatePost(id: string) {
  const src = getPosts().find(p => p.id === id)
  if (!src) return null
  const copy: Post = { ...src, id: newPostId(), status: 'rascunho', url: undefined, metrics: undefined, date: src.status === 'publicado' ? nowStamp() : src.date }
  commit([...getPosts(), copy])
  writePost(copy)
  return copy.id
}

/** Moves a scheduled post or draft to another date/time. Published posts can't move. */
export function reschedule(id: string, date: string) {
  const p = getPosts().find(x => x.id === id)
  if (!p || p.status === 'publicado') return false
  commit(getPosts().map(x => x.id === id ? { ...x, date } : x))
  remote(() => must(db().from('posts').update({ scheduled_at: toIso(date) }).eq('id', id)))
  return true
}

/** All posts, shared by every screen that uses them. */
export function usePosts() {
  const list = useSyncExternalStore(subscribe, getPosts, serverPosts)
  return { posts: list }
}

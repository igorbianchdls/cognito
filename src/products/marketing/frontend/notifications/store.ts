'use client'

// Notifications with read state.
// Signed in, they are the person's rows in the workspace (notifications made by the app go to whoever did the action;
// rows with no user are for everyone). Without Supabase, the offline demo in this browser with sample notifications.
import { useSyncExternalStore } from 'react'
import { db, localStamp, must, persist, remoteMode, toIso, workspaceReady, type WorkspaceContext } from '@/products/marketing/frontend/lib/sync'
import { seedNotifications, type AppNotification } from './data'

const KEY = 'otto-social-notifications-v1'
const seed: AppNotification[] = remoteMode ? [] : seedNotifications
let list: AppNotification[] = seed
let loaded = false
const listeners = new Set<() => void>()

function ensure() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  if (remoteMode) return
  try { const raw = localStorage.getItem(KEY); if (raw) list = JSON.parse(raw) } catch { /* keeps the samples */ }
}
function commit(next: AppNotification[]) {
  list = next
  if (!remoteMode) try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage blocked */ }
  listeners.forEach(l => l())
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const get = () => { ensure(); return list }
export const getNotifications = get
export const useNotifications = () => useSyncExternalStore(subscribe, get, () => seed)

const stamp = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }

// ---------- workspace (remote) ----------

let ctx: WorkspaceContext | null = null
type Row = { id: string; kind: AppNotification['kind']; title: string; text: string; href: string | null; action: string | null; read_at: string | null; created_at: string }
const fromRow = (r: Row): AppNotification => ({ id: r.id, kind: r.kind, title: r.title, text: r.text, href: r.href ?? undefined, action: r.action ?? undefined, read: !!r.read_at, date: localStamp(r.created_at) })
const toRow = (n: AppNotification, c: WorkspaceContext) => ({ id: n.id, workspace_id: c.ws, user_id: c.user, kind: n.kind, title: n.title, text: n.text, href: n.href ?? null, action: n.action ?? null, read_at: n.read ? new Date().toISOString() : null, created_at: toIso(n.date) })

export async function connectNotifications(next: WorkspaceContext) {
  if (ctx?.ws !== next.ws) commit([])
  ctx = next
  const { data, error } = await db().from('notifications').select('id, kind, title, text, href, action, read_at, created_at')
    .eq('workspace_id', next.ws).order('created_at', { ascending: false }).limit(200)
  if (!error && ctx === next) commit((data as Row[]).map(fromRow))
}
const remote = (run: (c: WorkspaceContext) => Promise<void>) => { if (remoteMode) void persist(async () => run(ctx ?? await workspaceReady())) }

// ---------- actions ----------

/** Adds a notification from something that just happened in the app. */
export function notify(n: Omit<AppNotification, 'id' | 'date' | 'read'>) {
  const item: AppNotification = { ...n, id: remoteMode ? crypto.randomUUID() : `n${Date.now().toString(36)}`, date: stamp(), read: false }
  commit([item, ...get()])
  remote(c => must(db().from('notifications').insert(toRow(item, c))))
}
export const setRead = (ids: string[], read: boolean) => {
  commit(get().map(n => ids.includes(n.id) ? { ...n, read } : n))
  if (ids.length) remote(() => must(db().from('notifications').update({ read_at: read ? new Date().toISOString() : null }).in('id', ids)))
}
export const removeNotifications = (ids: string[]) => {
  commit(get().filter(n => !ids.includes(n.id)))
  if (ids.length) remote(() => must(db().from('notifications').delete().in('id', ids)))
}
export const restoreNotifications = (items: AppNotification[]) => {
  commit([...items, ...get()].sort((a, b) => b.date.localeCompare(a.date)))
  if (items.length) remote(c => must(db().from('notifications').upsert(items.map(n => toRow(n, c)))))
}
